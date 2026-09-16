'use strict';

// Ajustes de programa y cupos acordados el 16/09/2026.
// Se limita esta capa a actividades y textos públicos: no modifica backend, pagos ni QR.
const LUCILA_DEADLINE_V8='2026-10-01T03:00:00Z'; // 30/09/2026 23:59 en Argentina
const LUCILA_DEADLINE_LABEL_V8='Inscripción hasta el miércoles 30/09';

function registrationClosedV8(a){
  return Boolean(a&&a.registrationDeadline&&Date.now()>=new Date(a.registrationDeadline).getTime());
}

// Peces en su tinta: 10 niños por cada taller, a cargo de Lucila Andino.
ACTIVITIES.filter(a=>a.title==='Peces en su tinta').forEach(a=>{
  a.capacity=10;
  a.remaining=10;
  a.limited=true;
  a.requiredReservation=true;
  a.presenter='Lucila Andino';
  a.audience='infancias';
  a.registrationDeadline=LUCILA_DEADLINE_V8;
  a.registrationDeadlineLabel=LUCILA_DEADLINE_LABEL_V8;
  a.type='Taller de arte · Lucila Andino';
});

// Pintura del río: cupo definitivo 10 participantes.
const pinturaV8=ACTIVITIES.find(a=>a.id==='pintura-01');
if(pinturaV8){
  pinturaV8.capacity=10;
  pinturaV8.remaining=10;
  pinturaV8.limited=true;
}

// Dibujo al natural en el Museo: sábado 3, turno mañana, adultos, cupo 12.
if(!ACTIVITIES.some(a=>a.id==='dibujo-natural-03')){
  ACTIVITIES.push({
    id:'dibujo-natural-03',
    date:'2026-10-03',
    time:'Mañana',
    type:'Taller para adultos · Lucila Andino',
    title:'Dibujo al natural en el Museo',
    capacity:12,
    remaining:12,
    limited:true,
    requiredReservation:true,
    group:'special',
    fee:0,
    presenter:'Lucila Andino',
    audience:'adultos',
    registrationDeadline:LUCILA_DEADLINE_V8,
    registrationDeadlineLabel:LUCILA_DEADLINE_LABEL_V8
  });
}

// Nombre definitivo del taller de Evangelina Romano.
const evangelinaV8=ACTIVITIES.find(a=>a.id==='docencia-03');
if(evangelinaV8){
  evangelinaV8.title='El territorio como aula';
  evangelinaV8.type='Capacitación docente · Evangelina Romano (CIIE)';
}

// Cambios generales del programa que no requieren reserva propia.
const juevesV8=DAYS.find(d=>d.date==='2026-10-01');
if(juevesV8){
  juevesV8.highlights='Peces en su tinta · Pintura del río · Arqueólogos por un día · Conversatorio Marcos Sola y Cristian Giovanelli (18:00) · Epistemología de la Ciencia · Marcos Sola (19:00)';
}
const sabadoV8=DAYS.find(d=>d.date==='2026-10-03');
if(sabadoV8){
  sabadoV8.highlights='El territorio como aula · Dibujo al natural en el Museo · Serpientes del Paraná · Aguará Guazú · El origen del mundo';
}

// Respetar el cierre del 30/09 sin tocar el circuito de registro.
const maxPlacesBeforeV8=maxPlacesForActivity;
maxPlacesForActivity=function(a){
  if(registrationClosedV8(a))return 0;
  const max=maxPlacesBeforeV8(a);
  // Dibujo al natural es para adultos: nunca permite reservar más lugares que personas con entrada.
  if(a&&a.id==='dibujo-natural-03')return Math.min(max,Math.max(0,Number(state.paid)||0));
  return max;
};

const quotaTextBeforeV8=quotaText;
quotaText=function(a){
  if(a&&a.registrationDeadline){
    if(registrationClosedV8(a))return 'Inscripción cerrada';
    if(a.title==='Peces en su tinta')return `Cupo 10 niños · ${a.registrationDeadlineLabel}`;
    if(a.id==='dibujo-natural-03')return `Cupo 12 adultos · ${a.registrationDeadlineLabel}`;
  }
  return quotaTextBeforeV8(a);
};

// Segunda barrera: si una actividad de Lucila quedó seleccionada al vencer el plazo,
// no se permite enviar una reserva nueva con esa selección.
const validateFormBeforeV8=validateForm;
validateForm=function(){
  const base=validateFormBeforeV8();
  if(base)return base;
  const closedChosen=ACTIVITIES.find(a=>a.registrationDeadline&&registrationClosedV8(a)&&Number(state.activityQty[a.id]||0)>0);
  if(closedChosen)return `La inscripción para ${closedChosen.title} cerró el miércoles 30/09.`;
  return '';
};

// Nota breve de programación, sin competir visualmente con los pasos de reserva.
if(!document.getElementById('programChangeNoteV8')){
  const daysGrid=document.getElementById('daysGrid');
  if(daysGrid){
    const note=document.createElement('p');
    note.id='programChangeNoteV8';
    note.className='program-change-note-v8';
    note.textContent='Algunas actividades pueden cambiar de fecha. El cronograma definitivo se presentará con la Segunda Circular.';
    daysGrid.insertAdjacentElement('afterend',note);
  }
}

if(!document.getElementById('mpV8Styles')){
  const style=document.createElement('style');
  style.id='mpV8Styles';
  style.textContent=`
    .program-change-note-v8{margin:10px 0 0;color:var(--muted);font-size:.78rem;line-height:1.35;font-weight:500}
    .activity-meta .quota{line-height:1.25}
    @media(max-width:640px){.program-change-note-v8{font-size:.74rem;margin-top:8px}}
  `;
  document.head.appendChild(style);
}

renderAll();
try{updateFinalReviewV6();}catch(_){ }
try{updateMobileSelectionV7();}catch(_){ }
