'use strict';

// Ajustes quirúrgicos del 17/09/2026: costos de actividades y aclaraciones para talleres infantiles.
// No modifica backend, planilla, pagos ni QR.
const DRAWING_FEE_V9=20000;

// Sólo las actividades docentes articuladas oficialmente con un CIIE son sin cargo.
// Las demás capacitaciones mantienen el adicional definido en la capa anterior.
function isCIIEActivityV9(a){
  return Boolean(a&&(a.ciie===true||/\bCIIE\b/i.test(String(a.type||''))));
}
const CIIE_TEACHER_FEE_V9=(typeof STANDARD_ACTIVITY_FEE_V6==='number'?STANDARD_ACTIVITY_FEE_V6:5000);
ACTIVITIES.forEach(a=>{
  const isTeacher=a.group==='teacher'||a.id.startsWith('docencia-');
  if(isTeacher&&isCIIEActivityV9(a)){
    a.fee=0;
    a.feeKind='gratis';
  }
});

// Los talleres para infancias se realizan dentro del Museo y sus colecciones.
// La cantidad seleccionada debe corresponder sólo a niñas/niños que participarán.
ACTIVITIES.forEach(a=>{
  if(a.group==='children')a.audience='infancias';
});
ACTIVITIES.filter(a=>a.title==='Peces en su tinta').forEach(a=>{
  a.audience='infancias';
  a.presenter='Prof. Lucila Andino';
  a.type='Taller de arte para infancias · Prof. Lucila Andino';
});

// Dibujo al natural en el Museo: adicional definitivo $20.000 por participante.
const drawingV9=ACTIVITIES.find(a=>a.id==='dibujo-natural-03');
if(drawingV9){
  drawingV9.fee=DRAWING_FEE_V9;
  drawingV9.feeKind='taller';
  drawingV9.presenter='Prof. Lucila Andino';
  drawingV9.type='Taller para adultos · Prof. Lucila Andino';
}

// Corregir la capa de cálculo anterior: elimina el adicional sólo para actividades CIIE
// y conserva el adicional de las demás capacitaciones docentes.
const calculatePriceBeforeV9=calculatePrice;
calculatePrice=function(){
  const p=calculatePriceBeforeV9();
  const ciieTeacherFees=ACTIVITIES.reduce((sum,a)=>{
    const isTeacher=a.group==='teacher'||a.id.startsWith('docencia-');
    if(!isTeacher||!isCIIEActivityV9(a))return sum;
    return sum+(Number(state.activityQty[a.id]||0)*CIIE_TEACHER_FEE_V9);
  },0);
  const drawingFees=Number(state.activityQty['dibujo-natural-03']||0)*DRAWING_FEE_V9;
  return {
    ...p,
    teacherFees:Math.max(0,Number(p.teacherFees||0)-ciieTeacherFees),
    drawingFees,
    activityFees:Math.max(0,Number(p.activityFees||0)-ciieTeacherFees),
    total:Math.max(0,Number(p.total||0)-ciieTeacherFees+drawingFees)
  };
};

// Texto operativo visible junto a talleres y capacitaciones.
const helpV9=document.querySelector('#activitiesSection .help-text');
if(helpV9){
  helpV9.innerHTML='La entrada cubre las actividades generales del día. Los <strong>talleres para infancias</strong> tienen un adicional de <strong>$5.000 por participante</strong>, salvo que se indique otro importe. Las <strong>actividades docentes articuladas oficialmente con un CIIE son sin cargo</strong>; las demás capacitaciones mantienen el valor indicado en cada actividad. Los talleres infantiles se realizan dentro del Museo y sus colecciones y son exclusivamente para niñas y niños inscriptos: al reservar, indicá sólo la cantidad de niñas/niños que participarán. Los adultos acompañantes realizan la acreditación y esperan fuera del espacio del taller durante la actividad.';
}

// Aviso CIIE: debe verse antes de elegir/comprar la entrada, no perdido al final.
let ciieNoteV9=document.getElementById('ciieAccessNoteV9');
if(!ciieNoteV9){
  ciieNoteV9=document.createElement('div');
  ciieNoteV9.id='ciieAccessNoteV9';
  ciieNoteV9.className='ciie-access-note-v9';
}
ciieNoteV9.innerHTML='<div class="ciie-access-icon-v9" aria-hidden="true">🎓</div><div><strong>Actividades CIIE · sin cargo</strong><p>Si estás inscripto/a oficialmente por un CIIE en una actividad de las Jornadas, <b>no necesitás comprar entrada general para esa fecha</b>: la inscripción incluye el acceso a las Jornadas durante ese día.</p><small>Las demás capacitaciones se reservan y abonan según lo indicado en cada actividad.</small></div>';
const modeGridV9=document.querySelector('.mode-grid');
if(modeGridV9&&ciieNoteV9.parentElement!==modeGridV9.parentElement){
  modeGridV9.insertAdjacentElement('beforebegin',ciieNoteV9);
}else if(modeGridV9&&ciieNoteV9.nextElementSibling!==modeGridV9){
  modeGridV9.insertAdjacentElement('beforebegin',ciieNoteV9);
}

if(!document.getElementById('ciieAccessStyleV9')){
  const style=document.createElement('style');
  style.id='ciieAccessStyleV9';
  style.textContent=`
    .ciie-access-note-v9{margin:14px 0 18px;padding:13px 14px;display:grid;grid-template-columns:auto minmax(0,1fr);gap:11px;align-items:start;border:1px solid rgba(49,90,80,.28);border-left:4px solid #315a50;background:linear-gradient(135deg,#f5f9f4,#eef5f0);border-radius:10px;color:#465349;font-size:.85rem;line-height:1.38;box-shadow:0 5px 15px rgba(49,90,80,.06)}
    .ciie-access-icon-v9{font-size:1.25rem;line-height:1;margin-top:2px}
    .ciie-access-note-v9 strong{display:block;color:#18342e;font-size:.94rem;margin-bottom:3px}
    .ciie-access-note-v9 p{margin:0 0 3px}.ciie-access-note-v9 b{color:#18342e}.ciie-access-note-v9 small{display:block;color:#667067;font-size:.76rem;line-height:1.35}
    @media(max-width:640px){.ciie-access-note-v9{margin:12px 0 16px;padding:11px 12px;gap:9px;font-size:.8rem}.ciie-access-note-v9 strong{font-size:.89rem}.ciie-access-note-v9 small{font-size:.72rem}}
  `;
  document.head.appendChild(style);
}

// Actualizar la referencia de valores sin tocar la estructura de la página.
const priceRowsV9=[...document.querySelectorAll('.price-reference details > div')];
const teacherRowV9=priceRowsV9.find(row=>row.querySelector('span')?.textContent.trim()==='Capacitación docente'||row.querySelector('span')?.textContent.trim()==='Actividad docente CIIE');
if(teacherRowV9){
  const label=teacherRowV9.querySelector('span');
  const b=teacherRowV9.querySelector('b');
  const small=teacherRowV9.querySelector('small');
  if(label)label.textContent='Actividad docente CIIE';
  if(b)b.textContent='Sin cargo';
  if(small)small.textContent='inscripción oficial · acceso del día incluido';
}
const refV9=document.querySelector('.price-reference details');
if(refV9&&!priceRowsV9.some(row=>row.querySelector('span')?.textContent.trim()==='Otras capacitaciones docentes')){
  const row=document.createElement('div');
  row.innerHTML='<span>Otras capacitaciones docentes</span><b>+$5.000</b><small>por participante, salvo indicación</small>';
  if(teacherRowV9)teacherRowV9.insertAdjacentElement('afterend',row);else refV9.appendChild(row);
}
if(refV9&&!priceRowsV9.some(row=>row.querySelector('span')?.textContent.trim()==='Dibujo al natural en el Museo')){
  const row=document.createElement('div');
  row.innerHTML='<span>Dibujo al natural en el Museo · Prof. Lucila Andino</span><b>+$20.000</b><small>por participante</small>';
  if(teacherRowV9)teacherRowV9.insertAdjacentElement('afterend',row);else refV9.appendChild(row);
}

// Reemplazar la condición genérica de menores por la regla específica de talleres infantiles.
const conditionsV9=[...document.querySelectorAll('.mp-conditions-body p')];
const minorsV9=conditionsV9.find(p=>p.querySelector('strong')?.textContent.trim()==='Menores.');
if(minorsV9){
  minorsV9.innerHTML='<strong>Talleres para infancias.</strong> Se realizan dentro del Museo y sus colecciones y están destinados exclusivamente a niñas y niños inscriptos. Los adultos responsables realizan la acreditación y permanecen fuera del espacio de taller durante la actividad. Al reservar, se debe indicar sólo la cantidad de niñas/niños que participarán.';
}

// Recalcular todos los resúmenes con los importes corregidos.
renderAll();
try{updateFinalReviewV6();}catch(_){ }
try{updateMobileSelectionV7();}catch(_){ }
