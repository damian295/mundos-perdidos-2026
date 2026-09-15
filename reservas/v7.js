'use strict';

// Ajustes finos finales de interfaz para Mundos Perdidos 2026.
// No modifica el sistema general de reservas del Museo ni la planilla de Administración.

function teacherRegistrationCountV7(a){
  const candidates=[a.registeredCount,a.inscriptos,a.used,a.reserved];
  for(const value of candidates){
    const n=Number(value);
    if(Number.isFinite(n))return n;
  }
  return null;
}

const quotaTextBeforeV7=quotaText;
quotaText=function(a){
  const isTeacher=a.group==='teacher'||a.id.startsWith('docencia-');
  if(isTeacher){
    const used=teacherRegistrationCountV7(a);
    if(Number.isFinite(used)&&used>=50)return 'Quedan pocos lugares';
    return 'Inscripción abierta';
  }
  return quotaTextBeforeV7(a);
};

// Mantener abiertas las capacitaciones: 50 es umbral de advertencia, no bloqueo.
ACTIVITIES.forEach(a=>{
  if(a.group==='teacher'||a.id.startsWith('docencia-')){
    a.unlimited=true;
    a.expandableCapacity=false;
  }
});

activityRowV3=function(a){
  const q=Number(state.activityQty[a.id]||0),d=dayByDate(a.date),quota=quotaText(a);
  const isTeacher=a.group==='teacher'||a.id.startsWith('docencia-');
  const used=isTeacher?teacherRegistrationCountV7(a):null;
  const quotaClass=(isTeacher&&Number.isFinite(used)&&used>=50)?'capacity-warning':(isTeacher?'teacher-open':(a.unlimited?'pending':''));
  const reservationTag=a.requiredReservation?'<span class="quota">Reserva previa obligatoria</span>':'';
  const fee=Number(a.fee||0);
  const feeNote=(q>0&&fee)?`<div class="activity-fee-note"><strong>${activityFeeLabelV6(a)}:</strong> ${money(fee)} por participante · ${q} participante${q===1?'':'s'} = <strong>${money(q*fee)}</strong>.</div>`:'';
  return `<article class="activity-row"><div><h4>${a.title}</h4><div class="activity-meta"><span>${d.label}</span><span>· ${a.time}</span><span>· ${a.type}</span><span class="quota ${quotaClass}">${quota}</span>${reservationTag}</div>${feeNote}</div><div class="activity-counter"><button type="button" data-activity="${a.id}" data-delta="-1" aria-label="Quitar lugar">−</button><output>${q}</output><button type="button" data-activity="${a.id}" data-delta="1" aria-label="Agregar lugar">+</button></div></article>`;
};

const renderActivitiesBeforeV7=renderActivities;
renderActivities=function(){
  renderActivitiesBeforeV7();
  document.querySelectorAll('.teacher-group .quota').forEach(q=>{
    q.classList.remove('capacity-expandable');
    if(q.textContent.includes('Quedan pocos lugares'))q.classList.add('capacity-warning');
    else q.classList.add('teacher-open');
  });
};

const renderSummaryBeforeV7=renderSummary;
renderSummary=function(){
  renderSummaryBeforeV7();
  const dates=selectedDates();
  const chosen=ACTIVITIES.filter(a=>Number(state.activityQty[a.id]||0)>0&&dates.includes(a.date));
  const host=document.getElementById('summaryActivities');
  if(host){
    host.innerHTML=chosen.map(a=>{
      const q=Number(state.activityQty[a.id]||0);
      const fee=q*Number(a.fee||0);
      const feeText=fee?` · ${activityFeeLabelV6(a).toLowerCase()} `:'';
      return `<span class="summary-activity-line"><strong>${a.title}</strong> · ${q} lugar${q===1?'':'es'}${feeText}${fee?`<strong>${money(fee)}</strong>`:''}</span>`;
    }).join('');
  }
};

// Condiciones: dejar sólo información operativa que evita malos entendidos.
const conditionsBodyV7=document.querySelector('.mp-conditions-body');
if(conditionsBodyV7){
  conditionsBodyV7.innerHTML=`
    <p><strong>Entrada.</strong> La pre-reserva no habilita el ingreso. La entrada queda válida cuando Administración confirma el pago y se emite el ticket ABONADO con QR.</p>
    <p><strong>Talleres y capacitaciones.</strong> La entrada o el pase no reservan automáticamente actividades con cupo. Sólo quedan reservadas las seleccionadas expresamente y reflejadas en el ticket.</p>
    <p><strong>Asientos.</strong> La entrada no implica reserva de asiento en charlas o presentaciones. En espacios con capacidad limitada, el ingreso se organiza según disponibilidad y condiciones de seguridad.</p>
    <p><strong>Programación.</strong> Horarios, orden o contenidos pueden sufrir ajustes por razones técnicas u organizativas, sin modificar la validez de la entrada para el día adquirido.</p>
    <p><strong>Imágenes y menores.</strong> Las Jornadas podrán ser fotografiadas o filmadas con fines institucionales, educativos y de difusión del Museo. Si la reserva incluye menores, quien la realiza declara actuar como adulto responsable y contar con la autorización necesaria. Los menores permanecen bajo responsabilidad de su adulto acompañante fuera de las actividades específicamente coordinadas.</p>`;
}

// Si por cualquier motivo la integración real todavía no cargó, evitamos que el formulario
// caiga en el antiguo comprobante local de prueba.
const submitV7=document.getElementById('submitBtn');
if(submitV7){
  submitV7.disabled=true;
  submitV7.textContent='Preparando reserva…';
  submitV7.dataset.awaitingProduction='1';
}

renderAll();
updateFinalReviewV6();
