'use strict';

// Ajustes finales acordados para la nueva reserva de Mundos Perdidos 2026.
// Este archivo no modifica el sistema general de reservas del Museo.
const STANDARD_ACTIVITY_FEE_V6=5000;

// Valores acordados.
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

// Taller del programa que debe quedar visible entre las actividades seleccionables.
if(!ACTIVITIES.some(a=>a.id==='arqueologos-01')){
  ACTIVITIES.push({
    id:'arqueologos-01',date:'2026-10-01',time:'19:00',type:'Taller con reserva',title:'Arqueólogos por un día',
    capacity:null,remaining:null,group:'special',fee:0,requiredReservation:true
  });
}

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

// Actualizar el texto del adicional para que no todo aparezca como materiales.
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
  updateFinalReviewV6();
};

// En la versión de prueba mantener también el desglose correcto.
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
    condiciones_aceptadas:Boolean(document.getElementById('terms')?.checked),
    codigo_reserva:reservationCode(),estado:'PRUEBA · PENDIENTE',timestamp:new Date().toISOString()
  };
};

// --- Revisión final y condiciones ---
const formV6=document.getElementById('reservationForm');
const termsV6=document.getElementById('terms');
if(formV6&&termsV6){
  const termsLine=termsV6.closest('.check-line');
  const termsText=termsLine&&termsLine.querySelector('span');
  if(termsText){
    termsText.innerHTML='Revisé mi selección y <strong>acepto las condiciones de participación</strong>, incluida la política de registro fotográfico/audiovisual cuando corresponda.';
  }

  const review=document.createElement('div');
  review.id='mpFinalReview';
  review.className='mp-final-review';
  review.innerHTML='<strong>Antes de enviar</strong><div id="mpReviewDates"></div><div id="mpReviewActivities"></div><div id="mpReviewTotal"></div>';
  termsLine.parentNode.insertBefore(review,termsLine);

  const details=document.createElement('details');
  details.className='mp-conditions';
  details.innerHTML=`
    <summary>Ver condiciones de participación</summary>
    <div class="mp-conditions-body">
      <p><strong>Entrada y pago.</strong> La pre-reserva no habilita el ingreso. La entrada queda válida cuando Administración confirma el pago y se emite el ticket ABONADO con QR.</p>
      <p><strong>Talleres y capacitaciones.</strong> Comprar una entrada o pase no reserva automáticamente actividades con cupo. Sólo quedan reservadas las actividades seleccionadas expresamente en este formulario y reflejadas luego en el ticket.</p>
      <p><strong>Asientos y capacidad.</strong> La entrada no implica reserva de asiento en charlas, presentaciones o espacios generales. El acceso a sectores con capacidad limitada se organiza según disponibilidad, orden de ingreso y condiciones de seguridad.</p>
      <p><strong>Adicionales.</strong> Los adicionales de talleres, capacitaciones o materiales se informan antes de enviar la pre-reserva y forman parte del total indicado.</p>
      <p><strong>Programación.</strong> Los horarios, orden y contenidos pueden sufrir ajustes razonables por necesidades técnicas, organizativas o de los expositores, sin modificar la validez de la entrada para el día adquirido.</p>
      <p><strong>Registro de imágenes.</strong> Las Jornadas podrán ser fotografiadas, filmadas o transmitidas con fines institucionales, educativos, científicos y de difusión del Museo. Al aceptar estas condiciones se autoriza ese uso no comercial directo. Si la reserva incluye menores de edad, quien la realiza declara actuar como adulto responsable y autoriza su registro y difusión en esos términos.</p>
      <p><strong>Menores.</strong> Fuera de las actividades específicamente coordinadas, los menores permanecen bajo responsabilidad del adulto acompañante.</p>
    </div>`;
  termsLine.insertAdjacentElement('afterend',details);

  const modal=document.createElement('div');
  modal.id='mpNoActivitiesModal';
  modal.className='mp-modal hidden';
  modal.setAttribute('role','dialog');
  modal.setAttribute('aria-modal','true');
  modal.setAttribute('aria-labelledby','mpNoActivitiesTitle');
  modal.innerHTML=`<div class="mp-modal-card">
    <h3 id="mpNoActivitiesTitle">No reservaste ninguna actividad</h3>
    <p>Tu entrada es válida para la jornada elegida, pero <strong>no te garantiza lugar en talleres o capacitaciones con reserva</strong>.</p>
    <p>Podés volver para elegir alguna actividad o continuar expresamente sin reservarlas.</p>
    <div class="mp-modal-actions">
      <button type="button" class="button light" id="mpBackActivities">Volver y elegir</button>
      <button type="button" class="button primary" id="mpContinueNoActivities">Continuar sin talleres</button>
    </div>
  </div>`;
  document.body.appendChild(modal);

  const closeModal=()=>modal.classList.add('hidden');
  document.getElementById('mpBackActivities').addEventListener('click',()=>{
    closeModal();
    document.getElementById('activitiesSection')?.scrollIntoView({behavior:'smooth',block:'start'});
  });
  document.getElementById('mpContinueNoActivities').addEventListener('click',()=>{
    state.noActivitiesAcknowledged=selectedDates().join('|');
    closeModal();
    formV6.requestSubmit();
  });

  // Antes de enviar, si no seleccionó ninguna actividad disponible, exige una decisión expresa.
  formV6.addEventListener('submit',e=>{
    if(validateForm())return;
    const dates=selectedDates();
    const reservables=ACTIVITIES.filter(a=>dates.includes(a.date));
    const chosen=reservables.filter(a=>Number(state.activityQty[a.id]||0)>0);
    const signature=dates.join('|');
    if(reservables.length&&chosen.length===0&&state.noActivitiesAcknowledged!==signature){
      e.preventDefault();
      e.stopImmediatePropagation();
      modal.classList.remove('hidden');
    }
  },true);
}

function updateFinalReviewV6(){
  const host=document.getElementById('mpFinalReview');
  if(!host)return;
  const dates=selectedDates();
  const chosen=ACTIVITIES.filter(a=>dates.includes(a.date)&&Number(state.activityQty[a.id]||0)>0);
  const reservables=ACTIVITIES.filter(a=>dates.includes(a.date));
  const p=calculatePrice();
  const d=document.getElementById('mpReviewDates');
  const a=document.getElementById('mpReviewActivities');
  const t=document.getElementById('mpReviewTotal');
  if(d)d.innerHTML=`<span>Días:</span> <strong>${dates.length?dates.map(x=>dayByDate(x)?.label||x).join(' · '):'sin seleccionar'}</strong>`;
  if(a){
    if(chosen.length){
      a.className='';
      a.innerHTML=`<span>Actividades reservadas:</span> <strong>${chosen.map(x=>`${x.title} (${Number(state.activityQty[x.id]||0)})`).join(' · ')}</strong>`;
    }else if(reservables.length){
      a.className='mp-review-warning';
      a.innerHTML='<strong>Atención:</strong> no reservaste ningún taller o capacitación. La entrada no garantiza lugar en esas actividades.';
    }else{
      a.className='';
      a.innerHTML='<span>Actividades con reserva:</span> no hay para los días elegidos.';
    }
  }
  if(t)t.innerHTML=`<span>Total estimado:</span> <strong>${money(p.total)}</strong>`;
}

if(!document.getElementById('mpV6Styles')){
  const style=document.createElement('style');
  style.id='mpV6Styles';
  style.textContent=`
    .mp-final-review{margin:14px 0 10px;padding:12px 13px;border:1px solid rgba(49,90,80,.22);border-left:4px solid var(--river);background:#f4f8f3;border-radius:8px;font-size:.88rem;line-height:1.42}
    .mp-final-review>strong{display:block;color:var(--deep);margin-bottom:5px;font-size:.95rem}.mp-final-review>div{margin:3px 0}
    .mp-review-warning{margin-top:7px!important;padding:8px 9px;background:#fff1d5;color:#684b1b;border-radius:6px}
    .mp-conditions{margin:8px 0 15px;padding:0 11px;border:1px solid var(--line);border-radius:8px;background:rgba(255,255,255,.62)}
    .mp-conditions summary{cursor:pointer;padding:10px 0;font-weight:850;color:var(--deep)}
    .mp-conditions-body{padding:0 2px 10px;color:#594f45;font-size:.82rem;line-height:1.42}.mp-conditions-body p{margin:7px 0}
    .mp-modal{position:fixed;inset:0;z-index:9999;display:grid;place-items:center;padding:18px;background:rgba(23,35,31,.58);backdrop-filter:blur(3px)}
    .mp-modal.hidden{display:none}.mp-modal-card{max-width:520px;width:100%;background:#fffaf1;border-radius:15px;padding:22px;border:1px solid #dac4a3;box-shadow:0 22px 70px rgba(0,0,0,.25)}
    .mp-modal-card h3{margin:0 0 9px;color:var(--deep);font-size:1.35rem}.mp-modal-card p{margin:7px 0;color:#584c40;line-height:1.45}
    .mp-modal-actions{display:flex;gap:10px;justify-content:flex-end;margin-top:17px;flex-wrap:wrap}.mp-modal-actions .button{border:none;cursor:pointer}
    @media(max-width:640px){.mp-final-review{font-size:.82rem;padding:10px}.mp-conditions-body{font-size:.79rem}.mp-modal-card{padding:18px}.mp-modal-actions{display:grid;grid-template-columns:1fr}.mp-modal-actions .button{width:100%}}
  `;
  document.head.appendChild(style);
}

renderAll();
updateFinalReviewV6();
