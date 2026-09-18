'use strict';

const PAINTING_MATERIAL_FEE_V3=30000;
const paintingActivity=ACTIVITIES.find(a=>a.id==='pintura-01');
if(paintingActivity)paintingActivity.fee=PAINTING_MATERIAL_FEE_V3;
ACTIVITIES.forEach(a=>{
 if(['foto-28','biogeo-29','micro-30','prehistoria-02'].includes(a.id))a.group='children';
 else if(a.id==='pintura-01')a.group='special';
 else if(a.id.startsWith('docencia-'))a.group='teacher';
});

const originalCalculatePriceV3=calculatePrice;
function paintingFeeV3(){return Number(state.activityQty['pintura-01']||0)*PAINTING_MATERIAL_FEE_V3;}
calculatePrice=function(){
 const base=originalCalculatePriceV3();
 const materials=paintingFeeV3();
 return {...base,materials,total:base.total+materials};
};

function activityRowV3(a){
 const q=Number(state.activityQty[a.id]||0),d=dayByDate(a.date),quota=quotaText(a),quotaClass=a.unlimited?'pending':'';
 const reservationTag=a.requiredReservation?'<span class="quota">Reserva previa obligatoria</span>':'';
 const feeNote=(a.id==='pintura-01'&&q>0)?`<div class="activity-fee-note"><strong>Adicional por materiales:</strong> ${money(PAINTING_MATERIAL_FEE_V3)} por participante · ${q} participante${q===1?'':'s'} = <strong>${money(q*PAINTING_MATERIAL_FEE_V3)}</strong>.</div>`:'';
 return `<article class="activity-row"><div><h4>${a.title}</h4><div class="activity-meta"><span>${d.label}</span><span>· ${a.time}</span><span>· ${a.type}</span><span class="quota ${quotaClass}">${quota}</span>${reservationTag}</div>${feeNote}</div><div class="activity-counter"><button type="button" data-activity="${a.id}" data-delta="-1" aria-label="Quitar lugar">−</button><output>${q}</output><button type="button" data-activity="${a.id}" data-delta="1" aria-label="Agregar lugar">+</button></div></article>`;
}
function activityGroupV3(title,items,extraClass=''){
 if(!items.length)return'';
 return `<div class="activity-group ${extraClass}"><div class="activity-group-title">${title}</div>${items.map(activityRowV3).join('')}</div>`;
}
renderActivities=function(){
 const dates=new Set(selectedDates()),list=ACTIVITIES.filter(a=>dates.has(a.date)),section=$('activitiesSection');
 if(!dates.size){section.classList.add('hidden');$('buyerSection').classList.add('hidden');return;}
 section.classList.remove('hidden');$('buyerSection').classList.remove('hidden');
 if(!list.length){$('activitiesList').innerHTML='<p>Para las fechas elegidas no hay talleres o capacitaciones que requieran selección previa.</p>';return;}
 const children=list.filter(a=>a.group==='children');
 const special=list.filter(a=>a.group==='special');
 const teacher=list.filter(a=>a.group==='teacher');
 $('activitiesList').innerHTML=[
  activityGroupV3('Talleres para infancias',children),
  activityGroupV3('Taller de arte con reserva',special,'special-group'),
  activityGroupV3('Capacitaciones docentes',teacher,'teacher-group')
 ].join('');
 $('activitiesList').querySelectorAll('[data-activity]').forEach(btn=>btn.addEventListener('click',()=>{
  const a=ACTIVITIES.find(x=>x.id===btn.dataset.activity),delta=Number(btn.dataset.delta),current=Number(state.activityQty[a.id]||0),max=maxPlacesForActivity(a);
  state.activityQty[a.id]=Math.max(0,Math.min(max,current+delta));renderActivities();renderSummary();
 }));
};

renderSummary=function(){
 const dates=selectedDates(),price=calculatePrice();
 $('summaryMode').textContent=state.mode==='full'?'Pase completo · 9 días':'Elegir mis días';
 if($('summaryPaid'))$('summaryPaid').textContent=state.paid;if($('summaryFree'))$('summaryFree').textContent=state.free;if($('summaryTotal'))$('summaryTotal').textContent=money(price.total);
 $('summaryDates').classList.toggle('muted',!dates.length);
 $('summaryDates').innerHTML=dates.length?dates.map(date=>`<span>${dayByDate(date).label}</span>`).join(''):'Todavía no elegiste días.';
 const chosen=ACTIVITIES.filter(a=>Number(state.activityQty[a.id]||0)>0&&dates.includes(a.date)),block=$('summaryActivitiesBlock');
 block.classList.toggle('hidden',!chosen.length);
 $('summaryActivities').innerHTML=chosen.map(a=>{
  const q=Number(state.activityQty[a.id]||0),fee=a.id==='pintura-01'?` · materiales ${money(q*PAINTING_MATERIAL_FEE_V3)}`:'';
  return `<span>${a.title} · ${q} lugar${q===1?'':'es'}${fee}</span>`;
 }).join('');
 const note=$('discountNote');
 if(price.saving>0){note.classList.remove('hidden');note.textContent=`Ahorro aplicado automáticamente en entradas: ${money(price.saving)}.`;}else note.classList.add('hidden');
 const materials=$('materialsNote');
 if(materials){
  if(price.materials>0){materials.classList.remove('hidden');materials.textContent=`Incluye ${money(price.materials)} de materiales para Pintura del río.`;}
  else materials.classList.add('hidden');
 }
};

selectedActivitiesPayload=function(){return ACTIVITIES.filter(a=>Number(state.activityQty[a.id]||0)>0).map(a=>({id:a.id,fecha:a.date,horario:a.time,titulo:a.title,participantes:Number(state.activityQty[a.id]),cupo:a.capacity,adicional:a.id==='pintura-01'?Number(state.activityQty[a.id])*PAINTING_MATERIAL_FEE_V3:0}));};
collectData=function(){
 const price=calculatePrice(),dates=selectedDates();
 return{programa:'Mundos Perdidos 2026',programa_id:'mundos',modalidad:state.mode==='full'?'Pase completo':'Días particulares',fechas:dates,participantes:state.paid+state.free,adultos:state.paid,menores:state.free,precio_entradas:price.total-price.materials,adicional_materiales:price.materials,precio_estimado:price.total,actividades:selectedActivitiesPayload(),responsable:$('responsible').value.trim(),dni:$('dni').value.trim(),email:$('email').value.trim(),telefono:$('phone').value.trim(),ciudad:$('city').value.trim(),accesibilidad:$('notes').value.trim(),codigo_reserva:reservationCode(),estado:'PRUEBA · PENDIENTE',timestamp:new Date().toISOString()};
};
renderTicket=function(data){
 const dates=data.fechas.map(date=>dayByDate(date).label).join(' · '),acts=data.actividades.map(a=>`${a.titulo} (${a.participantes})${a.adicional?` · materiales ${money(a.adicional)}`:''}`).join('<br>')||'Sin talleres o capacitaciones seleccionados';
 const materials=data.adicional_materiales?`<div><strong>Materiales Pintura del río:</strong> ${money(data.adicional_materiales)}</div>`:'';
 $('ticketCard').innerHTML=`<div class="ticket-head"><div><p class="mini-label" style="color:#9b4f1b">Museo de Ciencias Naturales A. Scasso</p><h2 style="margin:0;color:#18342e">Pre-reserva · versión de prueba</h2><span class="ticket-code">${data.codigo_reserva}</span></div><img src="../assets/logo_museo.jpg" alt="Museo Scasso"></div><div class="ticket-grid"><div class="ticket-details"><div><strong>Responsable:</strong> ${escapeHtml(data.responsable)}</div><div><strong>Modalidad:</strong> ${data.modalidad}</div><div><strong>Participantes:</strong> ${data.adultos} con entrada + ${data.menores} menores de 3</div><div><strong>Fechas:</strong> ${dates}</div><div><strong>Talleres/capacitaciones:</strong><br>${acts}</div>${materials}<div><strong>Total estimado:</strong> ${money(data.precio_estimado)}</div></div><div class="ticket-qr"><div style="text-align:center;color:#6f6257;font-weight:800"><div style="font-size:2.4rem">▦</div>QR definitivo<br><small>se habilitará al confirmar ABONADO</small></div></div></div><div class="ticket-note"><strong>Prueba segura:</strong> este comprobante no fue enviado ni registrado. En la versión final, la pre-reserva llegará por correo y el QR permitirá verificar el estado del pago para el ingreso.</div>`;
 $('ticketSection').classList.remove('hidden');$('ticketSection').scrollIntoView({behavior:'smooth',block:'start'});
};

renderAll();
