'use strict';

// Ajuste quirúrgico de valores desde el 29/09/2026.
// Sólo afecta nuevas pre-reservas y la información visible. No modifica reservas ya registradas,
// backend, planilla, pagos, QR, correos ni cupos.
const MP_CURRENT_ACTIVITY_FEES_V13={
  'micro-30':0,
  'pintura-01':0,
  'prehistoria-02':0
};

ACTIVITIES.forEach(a=>{
  if(Object.prototype.hasOwnProperty.call(MP_CURRENT_ACTIVITY_FEES_V13,a.id)){
    a.fee=MP_CURRENT_ACTIVITY_FEES_V13[a.id];
    if(a.fee===0){
      a.feeKind='gratis';
      a.freeWithEntry=true;
    }
  }
  if(a.title==='Peces en su tinta'){
    a.fee=10000;
    a.feeKind='taller';
    a.type='Taller de arte para infancias · Prof. Lucila Andino · $10.000';
  }
});

const pinturaV13=ACTIVITIES.find(a=>a.id==='pintura-01');
if(pinturaV13){
  pinturaV13.freeWithEntry=true;
  pinturaV13.type='Taller de arte · reserva previa · sin costo adicional';
}
const microV13=ACTIVITIES.find(a=>a.id==='micro-30');
if(microV13){
  microV13.freeWithEntry=true;
  microV13.type='Taller para infancias · sin costo adicional';
}
const prehistoriaV13=ACTIVITIES.find(a=>a.id==='prehistoria-02');
if(prehistoriaV13){
  prehistoriaV13.freeWithEntry=true;
  prehistoriaV13.type='Taller para infancias · sin costo adicional';
}

const helpV13=document.querySelector('#activitiesSection .help-text');
if(helpV13){
  helpV13.innerHTML='La entrada cubre las actividades generales del día. Algunas actividades requieren <strong>reserva previa</strong>. Cuando tienen un adicional, el valor se indica expresamente en cada actividad. Las que figuran como <strong>sin costo adicional</strong> están incluidas con la entrada del día. Las <strong>capacitaciones docentes no tienen costo adicional</strong> y requieren inscripción previa. Los talleres infantiles se realizan dentro del Museo y sus colecciones y son exclusivamente para niñas y niños inscriptos: al reservar, indicá sólo la cantidad de niñas/niños que participarán. Si sumás más participantes que entradas, el sistema ajusta automáticamente la cantidad de entradas necesarias.';
}

const activityRowBeforeV13=activityRowV3;
activityRowV3=function(a){
  const html=activityRowBeforeV13(a);
  if(!a||!a.freeWithEntry)return html;
  const marker='</div><div class="activity-counter">';
  const note='<div class="activity-free-note-v13"><strong>Sin costo adicional</strong> con la entrada del día.</div>';
  return html.includes(marker)?html.replace(marker,note+marker):html;
};

const priceRefV13=document.querySelector('.price-reference details');
if(priceRefV13){
  [...priceRefV13.querySelectorAll(':scope > div')].forEach(row=>{
    const label=row.querySelector('span')?.textContent.trim()||'';
    if(['Taller para infancias','Talleres para infancias','Micromundos II'].includes(label)){
      row.innerHTML='<span>Talleres para infancias</span><b>Sin costo adicional</b><small>con la entrada del día · reserva previa</small>';
    }else if(label==='Peces en su tinta'){
      row.innerHTML='<span>Peces en su tinta</span><b>+$10.000</b><small>por participante</small>';
    }else if(label==='Pintura del río'){
      row.innerHTML='<span>Pintura del río</span><b>Sin costo adicional</b><small>con la entrada del día · reserva previa</small>';
    }
  });
  if(![...priceRefV13.querySelectorAll(':scope > div')].some(row=>row.querySelector('span')?.textContent.trim()==='Pintura del río')){
    const row=document.createElement('div');
    row.innerHTML='<span>Pintura del río</span><b>Sin costo adicional</b><small>con la entrada del día · reserva previa</small>';
    priceRefV13.appendChild(row);
  }
  if(![...priceRefV13.querySelectorAll(':scope > div')].some(row=>row.querySelector('span')?.textContent.trim()==='Piedra, papel o tijera')){
    const row=document.createElement('div');
    row.innerHTML='<span>Piedra, papel o tijera</span><b>Sin costo adicional</b><small>con la entrada del día · reserva previa</small>';
    priceRefV13.appendChild(row);
  }
}

const renderSummaryBeforeV13=renderSummary;
renderSummary=function(){
  renderSummaryBeforeV13();
  const dates=selectedDates();
  const chosen=ACTIVITIES.filter(a=>Number(state.activityQty[a.id]||0)>0&&dates.includes(a.date));
  const host=document.getElementById('summaryActivities');
  if(host){
    host.innerHTML=chosen.map(a=>{
      const q=Number(state.activityQty[a.id]||0);
      const fee=q*Number(a.fee||0);
      const suffix=a.freeWithEntry
        ?' · <strong>sin costo adicional</strong>'
        :(fee?` · adicional <strong>${money(fee)}</strong>`:'');
      return `<span class="summary-activity-line"><strong>${a.title}</strong> · ${q} lugar${q===1?'':'es'}${suffix}</span>`;
    }).join('');
  }
  const materials=document.getElementById('materialsNote');
  if(materials)materials.classList.add('hidden');
};

// Si se suma un lugar en un taller, se ajusta el mínimo de entradas necesarias.
document.addEventListener('click',event=>{
  const plus=event.target.closest('#activitiesList [data-activity][data-delta="1"]');
  if(!plus)return;
  const current=Math.max(0,Number(state.activityQty[plus.dataset.activity]||0));
  const needed=current+1;
  const attendees=Math.max(0,Number(state.paid||0))+Math.max(0,Number(state.free||0));
  if(needed<=attendees)return;
  state.paid=Math.min(20,Math.max(1,Number(state.paid||1)+(needed-attendees)));
  setTimeout(()=>{
    try{renderPeople();renderDays();renderSummary();}catch(_){}
    try{updateFinalReviewV6();}catch(_){}
    try{updateMobileSelectionV7();}catch(_){}
  },0);
},true);

if(!document.getElementById('mpV13Styles')){
  const style=document.createElement('style');
  style.id='mpV13Styles';
  style.textContent='.activity-free-note-v13{margin-top:7px;font-size:.79rem;line-height:1.35;color:#315a50}.activity-free-note-v13 strong{font-weight:850}';
  document.head.appendChild(style);
}

renderAll();
try{updateFinalReviewV6();}catch(_){}
try{updateMobileSelectionV7();}catch(_){}
