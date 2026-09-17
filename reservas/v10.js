'use strict';

// Ajuste visual y operativo del 17/09/2026.
// Los menores de 3 años no se registran. Se elimina la caja visual grande de personas.
try{state.free=0;}catch(_){ }

const peoplePanelV10=document.querySelector('.people-panel');
if(peoplePanelV10){
  peoplePanelV10.classList.add('people-panel-minimal-v10');

  // Eliminar por completo el antiguo bloque de menores y su contador.
  peoplePanelV10.querySelector('.minor-inline')?.remove();

  // Dejar sólo una nota pequeña, fuera del control principal.
  let minorNote=document.getElementById('minorGeneralNoteV10');
  if(!minorNote){
    minorNote=document.createElement('p');
    minorNote.id='minorGeneralNoteV10';
    minorNote.className='minor-general-note-v10';
    minorNote.textContent='Menores de 3 años no pagan entrada general.';
    peoplePanelV10.insertAdjacentElement('afterend',minorNote);
  }
}

// Ya no tiene sentido mostrar menores en el resumen.
document.querySelector('.summary-row-minor')?.classList.add('hidden');

if(!document.getElementById('peopleMinimalStyleV10')){
  const style=document.createElement('style');
  style.id='peopleMinimalStyleV10';
  style.textContent=`
    /* Sin caja: sólo el control necesario para indicar cantidad de entradas. */
    .people-panel.people-panel-minimal-v10{
      min-height:0!important;
      margin:10px 0 0!important;
      padding:0!important;
      border:0!important;
      background:transparent!important;
      box-shadow:none!important;
      display:block!important;
    }
    .people-panel-minimal-v10 .people-primary{
      display:flex!important;
      align-items:center!important;
      justify-content:flex-end!important;
      gap:10px!important;
      min-width:0!important;
    }
    .people-panel-minimal-v10 .people-primary label{
      margin:0!important;
      font-size:.78rem!important;
      line-height:1!important;
      font-weight:650!important;
      color:var(--muted)!important;
    }
    .people-panel-minimal-v10 .counter{
      grid-template-columns:26px 32px 26px!important;
      gap:0!important;
    }
    .people-panel-minimal-v10 .counter button,
    .people-panel-minimal-v10 .counter output{
      height:28px!important;
      min-height:28px!important;
      padding:0!important;
      font-size:.84rem!important;
    }
    .minor-general-note-v10{
      margin:3px 0 8px!important;
      text-align:right!important;
      color:var(--muted)!important;
      font-size:.67rem!important;
      line-height:1.2!important;
      font-weight:500!important;
    }
    @media(max-width:640px){
      .people-panel-minimal-v10 .people-primary{gap:7px!important}
      .people-panel-minimal-v10 .people-primary label{font-size:.74rem!important}
      .minor-general-note-v10{font-size:.64rem!important;margin-bottom:7px!important}
    }
  `;
  document.head.appendChild(style);
}

try{renderPeople();renderSummary();}catch(_){ }
try{updateMobileSelectionV7();}catch(_){ }
