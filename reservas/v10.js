'use strict';

// Ajuste visual y operativo del 17/09/2026.
// El bloque de personas se compacta y los menores de 3 años dejan de registrarse.
try{state.free=0;}catch(_){ }

const peoplePanelV10=document.querySelector('.people-panel');
if(peoplePanelV10){
  peoplePanelV10.classList.add('people-panel-compact-v10');
  const minorInlineV10=peoplePanelV10.querySelector('.minor-inline');
  if(minorInlineV10){
    minorInlineV10.innerHTML='<span class="minor-free-only-v10"><strong>Menores de 3 años gratis</strong><output id="freePeople" hidden>0</output></span>';
  }
}

// Ya no tiene sentido mostrar un contador en el resumen si los menores no se registran.
document.querySelector('.summary-row-minor')?.classList.add('hidden');

if(!document.getElementById('peopleCompactStyleV10')){
  const style=document.createElement('style');
  style.id='peopleCompactStyleV10';
  style.textContent=`
    .people-panel.people-panel-compact-v10{
      min-height:0!important;
      margin-top:12px!important;
      padding:8px 12px!important;
      display:flex!important;
      align-items:center!important;
      justify-content:space-between!important;
      gap:10px!important;
    }
    .people-panel-compact-v10 .people-primary{
      display:flex!important;
      align-items:center!important;
      justify-content:space-between!important;
      gap:12px!important;
      flex:1 1 auto!important;
      min-width:0!important;
    }
    .people-panel-compact-v10 .people-primary label{
      margin:0!important;
      font-size:.88rem!important;
      line-height:1.1!important;
    }
    .people-panel-compact-v10 .counter{
      grid-template-columns:28px 34px 28px!important;
      gap:0!important;
    }
    .people-panel-compact-v10 .counter button{
      height:30px!important;
      min-height:30px!important;
      padding:0!important;
      font-size:.92rem!important;
    }
    .people-panel-compact-v10 .counter output{
      min-height:30px!important;
      display:grid!important;
      place-items:center!important;
      font-size:.9rem!important;
    }
    .people-panel-compact-v10 .minor-inline{
      max-width:none!important;
      margin:0!important;
      padding:0!important;
      border:0!important;
      opacity:1!important;
      display:block!important;
      white-space:nowrap!important;
      font-size:.72rem!important;
      line-height:1.1!important;
    }
    .people-panel-compact-v10 .minor-inline strong{
      font-size:.72rem!important;
      font-weight:650!important;
      color:var(--muted)!important;
    }
    @media(max-width:640px){
      .people-panel.people-panel-compact-v10{padding:7px 9px!important;gap:7px!important}
      .people-panel-compact-v10 .people-primary{gap:7px!important}
      .people-panel-compact-v10 .people-primary label{font-size:.8rem!important}
      .people-panel-compact-v10 .minor-inline strong{font-size:.66rem!important}
      .people-panel-compact-v10 .counter{grid-template-columns:26px 30px 26px!important}
      .people-panel-compact-v10 .counter button,.people-panel-compact-v10 .counter output{height:28px!important;min-height:28px!important}
    }
  `;
  document.head.appendChild(style);
}

try{renderPeople();renderSummary();}catch(_){ }
try{updateMobileSelectionV7();}catch(_){ }
