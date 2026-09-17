'use strict';

// Ajustes quirúrgicos del 17/09/2026: costos de actividades y aclaraciones para talleres infantiles.
// No modifica backend, planilla, pagos ni QR.
const DRAWING_FEE_V9=20000;

function isTeacherActivityV9(a){
  return Boolean(a&&(a.group==='teacher'||String(a.id||'').startsWith('docencia-')));
}
function isCIIEActivityV9(a){
  return Boolean(a&&(a.ciie===true||/\bCIIE\b/i.test(String(a.type||''))));
}

// Regla definitiva:
// - ninguna capacitación docente tiene adicional;
// - las capacitaciones comunes requieren reserva y entrada del día;
// - las actividades articuladas oficialmente con CIIE son sin cargo y su inscripción oficial incluye el acceso del día.
ACTIVITIES.forEach(a=>{
  if(isTeacherActivityV9(a)){
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

// La capa v6 agregaba $5.000 por capacitación docente. Se elimina por completo ese adicional.
const calculatePriceBeforeV9=calculatePrice;
calculatePrice=function(){
  const p=calculatePriceBeforeV9();
  const teacherFees=Math.max(0,Number(p.teacherFees||0));
  const drawingFees=Number(state.activityQty['dibujo-natural-03']||0)*DRAWING_FEE_V9;
  return {
    ...p,
    teacherFees:0,
    drawingFees,
    activityFees:Math.max(0,Number(p.activityFees||0)-teacherFees),
    total:Math.max(0,Number(p.total||0)-teacherFees+drawingFees)
  };
};

// Texto operativo visible junto a talleres y capacitaciones.
const helpV9=document.querySelector('#activitiesSection .help-text');
if(helpV9){
  helpV9.innerHTML='La entrada cubre las actividades generales del día. Los <strong>talleres para infancias</strong> tienen un adicional de <strong>$5.000 por participante</strong>, salvo que se indique otro importe. Las <strong>capacitaciones docentes no tienen costo adicional</strong>: requieren inscripción previa y se accede con la entrada del día. Las <strong>actividades articuladas oficialmente con un CIIE son sin cargo</strong> y su inscripción oficial incluye el acceso a las Jornadas durante esa fecha. Los talleres infantiles se realizan dentro del Museo y sus colecciones y son exclusivamente para niñas y niños inscriptos: al reservar, indicá sólo la cantidad de niñas/niños que participarán. Los adultos acompañantes realizan la acreditación y esperan fuera del espacio del taller durante la actividad.';
}

// Aviso CIIE: visible, pero después del bloque "Personas con entrada".
let ciieNoteV9=document.getElementById('ciieAccessNoteV9');
if(!ciieNoteV9){
  ciieNoteV9=document.createElement('div');
  ciieNoteV9.id='ciieAccessNoteV9';
  ciieNoteV9.className='ciie-access-note-v9';
}
ciieNoteV9.innerHTML='<div class="ciie-access-icon-v9" aria-hidden="true">🎓</div><div><strong>Actividades CIIE · sin cargo</strong><p>Si estás inscripto/a oficialmente por un CIIE en una actividad de las Jornadas, <b>no necesitás comprar entrada general para esa fecha</b>: la inscripción incluye el acceso a las Jornadas durante ese día.</p><small>Las demás capacitaciones docentes requieren reserva previa y se realizan con la entrada del día, sin costo adicional.</small></div>';
const peoplePanelV9=document.querySelector('.people-panel');
if(peoplePanelV9)peoplePanelV9.insertAdjacentElement('afterend',ciieNoteV9);

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

// Referencia de valores: distinguir capacitación común de actividad CIIE.
const refV9=document.querySelector('.price-reference details');
if(refV9){
  [...refV9.querySelectorAll(':scope > div')].forEach(row=>{
    const label=row.querySelector('span')?.textContent.trim();
    if(label==='Otras capacitaciones docentes')row.remove();
  });

  const rows=[...refV9.querySelectorAll(':scope > div')];
  const teacherRow=rows.find(row=>{
    const label=row.querySelector('span')?.textContent.trim();
    return label==='Capacitación docente'||label==='Actividad docente CIIE';
  });
  if(teacherRow){
    const label=teacherRow.querySelector('span');
    const b=teacherRow.querySelector('b');
    const small=teacherRow.querySelector('small');
    if(label)label.textContent='Capacitación docente';
    if(b)b.textContent='Sin costo adicional';
    if(small)small.textContent='reserva previa · requiere entrada del día';

    if(![...refV9.querySelectorAll(':scope > div')].some(row=>row.querySelector('span')?.textContent.trim()==='Actividad docente CIIE')){
      const ciieRow=document.createElement('div');
      ciieRow.innerHTML='<span>Actividad docente CIIE</span><b>Sin cargo</b><small>inscripción oficial · acceso del día incluido</small>';
      teacherRow.insertAdjacentElement('afterend',ciieRow);
    }
  }

  if(![...refV9.querySelectorAll(':scope > div')].some(row=>row.querySelector('span')?.textContent.trim()==='Dibujo al natural en el Museo')){
    const row=document.createElement('div');
    row.innerHTML='<span>Dibujo al natural en el Museo · Prof. Lucila Andino</span><b>+$20.000</b><small>por participante</small>';
    const ciieRow=[...refV9.querySelectorAll(':scope > div')].find(r=>r.querySelector('span')?.textContent.trim()==='Actividad docente CIIE');
    if(ciieRow)ciieRow.insertAdjacentElement('afterend',row);else refV9.appendChild(row);
  }
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
