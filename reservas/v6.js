'use strict';

// Ajustes acordados posteriores a la validación del circuito de registro y QR.
// Sólo afectan el formulario de Mundos Perdidos.
const STANDARD_ACTIVITY_FEE_V6=5000;

// Entradas: semana $5.000; grupo de 3/4 $15.000.
// Fin de semana y pase completo se mantienen según lo acordado.
PRICES.weekday={single:5000,group:15000};
PRICES.weekend={single:7000,group:20000};
PRICES.full={single:30000,group:80000};

// Talleres para infancias y capacitaciones docentes: adicional de $5.000 por participante.
ACTIVITIES.forEach(a=>{
  if(a.group==='children'){
    a.fee=STANDARD_ACTIVITY_FEE_V6;
    a.feeKind='taller';
  }else if(a.group==='teacher'||a.id.startsWith('docencia-')){
    a.fee=STANDARD_ACTIVITY_FEE_V6;
    a.feeKind='capacitacion';
  }else if(a.title==='Peces en su tinta'){
    a.feeKind='materiales';
  }else if(a.id==='pintura-01'){
    a.feeKind='materiales';
  }
});

function activityFeeLabelV6(a){
  if(a.feeKind==='capacitacion')return 'Adicional por capacitación';
  if(a.feeKind==='taller')return 'Adicional por taller';
  return 'Adicional para compra de materiales';
}

const oldCalcV6=calculatePrice;
calculatePrice=function(){
  const p=oldCalcV6();
  let childFees=0,teacherFees=0;
  ACTIVITIES.forEach(a=>{
    const q=Number(state.activityQty[a.id]||0);
    if(!q)return;
    if(a.group==='children')childFees+=q*STANDARD_ACTIVITY_FEE_V6;
    else if(a.group==='teacher'||a.id.startsWith('docencia-'))teacherFees+=q*STANDARD_ACTIVITY_FEE_V6;
  });
  const activityFees=childFees+teacherFees;
  return {...p,childFees,teacherFees,activityFees,total:Number(p.total||0)+activityFees};
};

// El renderer previo ya agrupa correctamente las actividades; aquí sólo actualizamos
// el texto del adicional para que no todo aparezca erróneamente como "materiales".
activityRowV3=function(a){
  const q=Number(state.activityQty[a.id]||0),d=dayByDate(a.date),quota=quotaText(a),quotaClass=a.unlimited?'pending':'';
  const reservationTag=a.requiredReservation?'<span class="quota">Reserva previa obligatoria</span>':'';
  const fee=Number(a.fee||0);
  const feeNote=(q>0&&fee)?`<div class="activity-fee-note"><strong>${activityFeeLabelV6(a)}:</strong> ${money(fee)} por participante · ${q} participante${q===1?'':'s'} = <strong>${money(q*fee)}</strong>.</div>`:'';
  return `<article class="activity-row"><div><h4>${a.title}</h4><div class="activity-meta"><span>${d.label}</span><span>· ${a.time}</span><span>· ${a.type}</span><span class="quota ${quotaClass}">${quota}</span>${reservationTag}</div>${feeNote}</div><div class="activity-counter"><button type="button" data-activity="${a.id}" data-delta="-1" aria-label="Quitar lugar">−</button><output>${q}</output><button type="button" data-activity="${a.id}" data-delta="1" aria-label="Agregar lugar">+</button></div></article>`;
};

const oldSummaryV6=renderSummary;
renderSummary=function(){
  oldSummaryV6();
  const p=calculatePrice(),dates=selectedDates();
  $('summaryTotal').textContent=money(p.total);

  const chosen=ACTIVITIES.filter(a=>Number(state.activityQty[a.id]||0)>0&&dates.includes(a.date));
  $('summaryActivities').innerHTML=chosen.map(a=>{
    const q=Number(state.activityQty[a.id]||0),fee=q*Number(a.fee||0);
    const suffix=fee?` · ${activityFeeLabelV6(a).toLowerCase()} ${money(fee)}`:'';
    return `<span>${a.title} · ${q} lugar${q===1?'':'es'}${suffix}</span>`;
  }).join('');

  const m=$('materialsNote'),notes=[];
  if(Number(p.childFees||0)>0)notes.push(`Talleres para infancias: ${money(p.childFees)} de adicional.`);
  if(Number(p.teacherFees||0)>0)notes.push(`Capacitaciones docentes: ${money(p.teacherFees)} de adicional.`);
  if(Number(p.materials||0)>0)notes.push(`Pintura del río: ${money(p.materials)} para materiales.`);
  if(Number(p.pecesMaterials||0)>0)notes.push(`Peces en su tinta: ${money(p.pecesMaterials)} para materiales.`);
  if(m){
    if(notes.length){m.classList.remove('hidden');m.innerHTML=notes.join('<br>');}
    else m.classList.add('hidden');
  }
};

collectData=function(){
  const p=calculatePrice(),dates=selectedDates();
  const extras=Number(p.activityFees||0)+Number(p.materials||0)+Number(p.pecesMaterials||0);
  return{
    programa:'Mundos Perdidos 2026',programa_id:'mundos',modalidad:state.mode==='full'?'Pase completo':'Días particulares',fechas:dates,
    participantes:state.paid+state.free,adultos:state.paid,menores:state.free,
    precio_entradas:Number(p.total||0)-extras,
    adicional_talleres:Number(p.childFees||0),adicional_capacitaciones:Number(p.teacherFees||0),
    adicional_materiales:Number(p.materials||0),adicional_materiales_peces:Number(p.pecesMaterials||0),
    precio_estimado:Number(p.total||0),actividades:selectedActivitiesPayload(),
    responsable:$('responsible').value.trim(),dni:$('dni').value.trim(),email:$('email').value.trim(),telefono:$('phone').value.trim(),ciudad:$('city').value.trim(),accesibilidad:$('notes').value.trim(),
    codigo_reserva:reservationCode(),estado:'PRUEBA · PENDIENTE',timestamp:new Date().toISOString()
  };
};

renderAll();
