'use strict';

// Ajustes quirúrgicos del 16/09/2026: costos de actividades y aclaraciones para talleres infantiles.
// No modifica backend, planilla, pagos ni QR.
const DRAWING_FEE_V9=20000;

// Las capacitaciones docentes son gratuitas.
ACTIVITIES.forEach(a=>{
  if(a.group==='teacher'||a.id.startsWith('docencia-')){
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

// Corregir la capa de cálculo anterior: elimina el adicional docente y suma Dibujo al natural.
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
  helpV9.innerHTML='La entrada cubre las actividades generales del día. Los <strong>talleres para infancias</strong> tienen un adicional de <strong>$5.000 por participante</strong>, salvo que se indique otro importe. Las capacitaciones docentes son gratuitas. Los talleres infantiles se realizan dentro del Museo y sus colecciones y son exclusivamente para niñas y niños inscriptos: al reservar, indicá sólo la cantidad de niñas/niños que participarán. Los adultos acompañantes realizan la acreditación y esperan fuera del espacio del taller durante la actividad.';
}

// Actualizar la referencia de valores sin tocar la estructura de la página.
const priceRowsV9=[...document.querySelectorAll('.price-reference details > div')];
const teacherRowV9=priceRowsV9.find(row=>row.querySelector('span')?.textContent.trim()==='Capacitación docente');
if(teacherRowV9){
  const b=teacherRowV9.querySelector('b');
  const small=teacherRowV9.querySelector('small');
  if(b)b.textContent='Gratis';
  if(small)small.textContent='con inscripción previa';
}
const refV9=document.querySelector('.price-reference details');
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
