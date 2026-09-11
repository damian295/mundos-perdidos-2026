'use strict';

const PECES_FEE=5000;
['2026-09-28','2026-09-29','2026-09-30','2026-10-01'].forEach(date=>{
  ACTIVITIES.push({id:`peces-${date}`,date,time:'17:30',type:'Taller de arte',title:'Peces en su tinta',capacity:null,remaining:null,group:'special',fee:PECES_FEE});
});

const oldCalcV5=calculatePrice;
calculatePrice=function(){
  const p=oldCalcV5();
  const peces=ACTIVITIES.filter(a=>a.title==='Peces en su tinta').reduce((s,a)=>s+Number(state.activityQty[a.id]||0)*PECES_FEE,0);
  return {...p,pecesMaterials:peces,total:p.total+peces};
};

activityRowV3=function(a){
  const q=Number(state.activityQty[a.id]||0),d=dayByDate(a.date),quota=quotaText(a),quotaClass=a.unlimited?'pending':'';
  const reservationTag=a.requiredReservation?'<span class="quota">Reserva previa obligatoria</span>':'';
  const fee=Number(a.fee||0),feeNote=(q>0&&fee)?`<div class="activity-fee-note"><strong>Adicional para compra de materiales:</strong> ${money(fee)} por participante · ${q} participante${q===1?'':'s'} = <strong>${money(q*fee)}</strong>.</div>`:'';
  return `<article class="activity-row"><div><h4>${a.title}</h4><div class="activity-meta"><span>${d.label}</span><span>· ${a.time}</span><span>· ${a.type}</span><span class="quota ${quotaClass}">${quota}</span>${reservationTag}</div>${feeNote}</div><div class="activity-counter"><button type="button" data-activity="${a.id}" data-delta="-1" aria-label="Quitar lugar">−</button><output>${q}</output><button type="button" data-activity="${a.id}" data-delta="1" aria-label="Agregar lugar">+</button></div></article>`;
};

const oldSummaryV5=renderSummary;
renderSummary=function(){
  oldSummaryV5();
  const p=calculatePrice(),dates=selectedDates();
  $('summaryTotal').textContent=money(p.total);
  const chosen=ACTIVITIES.filter(a=>Number(state.activityQty[a.id]||0)>0&&dates.includes(a.date));
  $('summaryActivities').innerHTML=chosen.map(a=>{
    const q=Number(state.activityQty[a.id]||0),fee=q*Number(a.fee||0);
    return `<span>${a.title} · ${q} lugar${q===1?'':'es'}${fee?` · materiales ${money(fee)}`:''}</span>`;
  }).join('');
  const m=$('materialsNote'),notes=[];
  if(Number(p.materials||0)>0)notes.push(`Pintura del río: ${money(p.materials)} para materiales.`);
  if(Number(p.pecesMaterials||0)>0)notes.push(`Peces en su tinta: ${money(p.pecesMaterials)} para materiales.`);
  if(m){if(notes.length){m.classList.remove('hidden');m.innerHTML=notes.join('<br>');}else m.classList.add('hidden');}
};

selectedActivitiesPayload=function(){return ACTIVITIES.filter(a=>Number(state.activityQty[a.id]||0)>0).map(a=>({id:a.id,fecha:a.date,horario:a.time,titulo:a.title,participantes:Number(state.activityQty[a.id]),cupo:a.capacity,adicional:Number(state.activityQty[a.id]||0)*Number(a.fee||0)}));};

collectData=function(){
  const p=calculatePrice(),dates=selectedDates(),pintura=Number(p.materials||0),peces=Number(p.pecesMaterials||0);
  return{programa:'Mundos Perdidos 2026',programa_id:'mundos',modalidad:state.mode==='full'?'Pase completo':'Días particulares',fechas:dates,participantes:state.paid+state.free,adultos:state.paid,menores:state.free,precio_entradas:p.total-pintura-peces,adicional_materiales:pintura,adicional_materiales_peces:peces,precio_estimado:p.total,actividades:selectedActivitiesPayload(),responsable:$('responsible').value.trim(),dni:$('dni').value.trim(),email:$('email').value.trim(),telefono:$('phone').value.trim(),ciudad:$('city').value.trim(),accesibilidad:$('notes').value.trim(),codigo_reserva:reservationCode(),estado:'PRUEBA · PENDIENTE',timestamp:new Date().toISOString()};
};

renderAll();
