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

// En celular el resumen completo deja de aparecer al principio: se ubica justo antes
// de los datos de la pre-reserva. Mientras se elige, una barra compacta muestra el avance.
const mobileMediaV7=window.matchMedia('(max-width:760px)');
const bookingLayoutV7=document.querySelector('.booking-layout');
const bookingMainV7=document.querySelector('.booking-main');
const summaryCardV7=document.querySelector('.summary-card');
const buyerSectionV7=document.getElementById('buyerSection');

const mobileSelectionBarV7=document.createElement('div');
mobileSelectionBarV7.id='mobileSelectionBar';
mobileSelectionBarV7.className='mobile-selection-bar';
mobileSelectionBarV7.innerHTML=`
  <button type="button" class="mobile-selection-toggle" id="mobileSelectionToggle" aria-expanded="false" aria-controls="mobileSelectionDetails">
    <span class="mobile-selection-copy"><small>Tu selección</small><strong id="mobileSelectionCompact">0 días</strong></span>
    <strong class="mobile-selection-total" id="mobileSelectionTotal">$ 0</strong>
    <span class="mobile-selection-action" id="mobileSelectionAction">Ver</span>
  </button>
  <div class="mobile-selection-details hidden" id="mobileSelectionDetails">
    <div><span>Personas</span><strong id="mobileSelectionPeople"></strong></div>
    <div><span>Días</span><p id="mobileSelectionDates"></p></div>
    <div><span>Actividades</span><p id="mobileSelectionActivities"></p></div>
  </div>`;
document.body.appendChild(mobileSelectionBarV7);

function arrangeSummaryForViewportV7(){
  if(!bookingLayoutV7||!bookingMainV7||!summaryCardV7||!buyerSectionV7)return;
  if(mobileMediaV7.matches){
    if(summaryCardV7.parentElement!==bookingMainV7)bookingMainV7.insertBefore(summaryCardV7,buyerSectionV7);
  }else if(summaryCardV7.parentElement!==bookingLayoutV7){
    bookingLayoutV7.appendChild(summaryCardV7);
  }
}

function closeMobileSelectionV7(){
  const details=document.getElementById('mobileSelectionDetails');
  const toggle=document.getElementById('mobileSelectionToggle');
  const action=document.getElementById('mobileSelectionAction');
  if(details)details.classList.add('hidden');
  if(toggle)toggle.setAttribute('aria-expanded','false');
  if(action)action.textContent='Ver';
}

function updateMobileSelectionV7(){
  const dates=selectedDates();
  const chosen=ACTIVITIES.filter(a=>Number(state.activityQty[a.id]||0)>0&&dates.includes(a.date));
  const total=calculatePrice().total;
  const active=mobileMediaV7.matches&&dates.length>0;
  mobileSelectionBarV7.classList.toggle('active',active);
  if(!active){closeMobileSelectionV7();return;}

  const compact=document.getElementById('mobileSelectionCompact');
  const totalNode=document.getElementById('mobileSelectionTotal');
  const people=document.getElementById('mobileSelectionPeople');
  const dateNode=document.getElementById('mobileSelectionDates');
  const actNode=document.getElementById('mobileSelectionActivities');

  if(compact)compact.textContent=`${dates.length} día${dates.length===1?'':'s'} · ${chosen.length} actividad${chosen.length===1?'':'es'}`;
  if(totalNode)totalNode.textContent=money(total);
  if(people){
    const free=Number(state.free||0);
    people.textContent=`${state.paid} con entrada${free?` + ${free} menor${free===1?'':'es'} de 3`:''}`;
  }
  if(dateNode)dateNode.textContent=dates.map(d=>dayByDate(d)?.label||d).join(' · ');
  if(actNode){
    actNode.innerHTML=chosen.length
      ? chosen.map(a=>`<strong>${a.title}</strong> · ${Number(state.activityQty[a.id]||0)}`).join('<br>')
      : 'Sin talleres o capacitaciones seleccionados.';
  }
}

const mobileToggleV7=document.getElementById('mobileSelectionToggle');
mobileToggleV7?.addEventListener('click',()=>{
  const details=document.getElementById('mobileSelectionDetails');
  const action=document.getElementById('mobileSelectionAction');
  const expanded=mobileToggleV7.getAttribute('aria-expanded')==='true';
  mobileToggleV7.setAttribute('aria-expanded',String(!expanded));
  details?.classList.toggle('hidden',expanded);
  if(action)action.textContent=expanded?'Ver':'Cerrar';
});

const renderSummaryBeforeMobileV7=renderSummary;
renderSummary=function(){
  renderSummaryBeforeMobileV7();
  updateMobileSelectionV7();
};

arrangeSummaryForViewportV7();
if(mobileMediaV7.addEventListener){
  mobileMediaV7.addEventListener('change',()=>{
    arrangeSummaryForViewportV7();
    updateMobileSelectionV7();
  });
}else{
  mobileMediaV7.addListener(()=>{
    arrangeSummaryForViewportV7();
    updateMobileSelectionV7();
  });
}

// Cuando el resumen completo entra en pantalla, la barra se aparta para no duplicarlo.
if(summaryCardV7&&'IntersectionObserver' in window){
  const summaryObserverV7=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(!mobileMediaV7.matches)return;
      mobileSelectionBarV7.classList.toggle('summary-visible',entry.isIntersecting);
      if(entry.isIntersecting)closeMobileSelectionV7();
    });
  },{threshold:.18});
  summaryObserverV7.observe(summaryCardV7);
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
updateMobileSelectionV7();
