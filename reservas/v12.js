'use strict';

// Simplificación quirúrgica del registro mientras las Jornadas ya están en curso.
// Sólo modifica la interfaz y la selección visible. No toca backend, planilla, pagos, QR ni correos.
function mpTodayYmdV12(){
  const parts=new Intl.DateTimeFormat('en-CA',{
    timeZone:'America/Argentina/Buenos_Aires',
    year:'numeric',month:'2-digit',day:'2-digit'
  }).formatToParts(new Date());
  const get=t=>parts.find(p=>p.type===t)?.value||'';
  return `${get('year')}-${get('month')}-${get('day')}`;
}
function mpPastDateV12(date){
  return /^\d{4}-\d{2}-\d{2}$/.test(String(date||'')) && String(date)<mpTodayYmdV12();
}
function mpRemainingDatesV12(){
  return DAYS.filter(d=>!mpPastDateV12(d.date)).map(d=>d.date);
}
function mpAllRemainingSelectedV12(){
  const open=mpRemainingDatesV12();
  const selected=selectedDates();
  return open.length>0 && selected.length===open.length && open.every(d=>selected.includes(d));
}
const MP_REMAINING_COMBO_PRICES_V12={6:20000,5:17000,4:14000,3:11000,2:8000};
function mpRemainingComboPriceV12(){
  return MP_REMAINING_COMBO_PRICES_V12[mpRemainingDatesV12().length]||null;
}
function mpMoneyV12(n){
  return new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS',maximumFractionDigits:0}).format(Number(n||0));
}

// La modalidad única visible pasa a ser elegir días. Se conserva internamente la lógica histórica,
// pero el usuario ya no tiene que decidir entre "días" y "pase completo".
state.mode='days';
[...state.selected].forEach(d=>{if(mpPastDateV12(d))state.selected.delete(d);});

const modeGridV12=document.querySelector('.mode-grid');
if(modeGridV12)modeGridV12.classList.add('hidden');

const heroTitleV12=document.querySelector('.hero-copy h1');
if(heroTitleV12)heroTitleV12.textContent='Reservá tus entradas.';
const heroLeadV12=document.querySelector('.hero-copy .hero-lead');
if(heroLeadV12)heroLeadV12.textContent='Elegí cuántas personas vienen, los días y, si querés, los talleres o capacitaciones. El sistema calcula automáticamente el mejor precio.';

const firstTitleV12=document.querySelector('#entradas .booking-main > .section-title.left');
if(firstTitleV12)firstTitleV12.textContent='¿Cuántas personas vienen?';
const firstSubtitleV12=document.querySelector('#entradas .booking-main > .section-subtitle');
if(firstSubtitleV12)firstSubtitleV12.textContent='Indicá la cantidad de entradas. Después elegís uno o varios días; sólo mostramos las jornadas que todavía pueden reservarse.';

const daysHeadingV12=document.querySelector('#daysSection h3');
if(daysHeadingV12)daysHeadingV12.textContent='Elegí los días';

// Ya no mostrar "Pase completo" como producto: el ahorro se aplica automáticamente cuando corresponde.
const priceRefV12=document.querySelector('.price-reference details');
if(priceRefV12){
  [...priceRefV12.querySelectorAll(':scope > div')].forEach(row=>{
    if(row.querySelector('span')?.textContent.trim()==='Pase completo')row.remove();
  });
  const comboPrice=mpRemainingComboPriceV12();
  const openCount=mpRemainingDatesV12().length;
  let comboRow=document.getElementById('remainingComboPriceV12');
  if(comboPrice&&openCount>=2){
    if(!comboRow){
      comboRow=document.createElement('div');
      comboRow.id='remainingComboPriceV12';
      priceRefV12.insertBefore(comboRow,priceRefV12.querySelector(':scope > div')||null);
    }
    comboRow.innerHTML=`<span>Todos los días restantes</span><b>${mpMoneyV12(comboPrice)}</b><small>por persona · ${openCount} jornadas disponibles</small>`;
  }else if(comboRow){
    comboRow.remove();
  }
}

const renderModeBeforeV12=renderMode;
renderMode=function(){
  state.mode='days';
  renderModeBeforeV12();
  const days=document.getElementById('daysSection');
  if(days)days.classList.remove('hidden');
  if(modeGridV12)modeGridV12.classList.add('hidden');
};

function ensureRemainingDaysButtonV12(){
  const daysGrid=document.getElementById('daysGrid');
  if(!daysGrid)return;
  let bar=document.getElementById('remainingDaysBarV12');
  if(!bar){
    bar=document.createElement('div');
    bar.id='remainingDaysBarV12';
    bar.className='remaining-days-bar-v12';
    bar.innerHTML='<button id="selectRemainingDaysV12" type="button" class="remaining-days-button-v12"></button><small id="remainingDaysHelpV12">O elegí uno o varios días.</small>';
    daysGrid.insertAdjacentElement('beforebegin',bar);
    document.getElementById('selectRemainingDaysV12')?.addEventListener('click',()=>{
      const open=mpRemainingDatesV12();
      const all=open.length>0&&open.every(d=>state.selected.has(d));
      if(all)open.forEach(d=>state.selected.delete(d));
      else open.forEach(d=>state.selected.add(d));
      pruneActivities();
      renderAll();
    });
  }
  const btn=document.getElementById('selectRemainingDaysV12');
  const help=document.getElementById('remainingDaysHelpV12');
  const comboPrice=mpRemainingComboPriceV12();
  const openCount=mpRemainingDatesV12().length;
  if(!comboPrice||openCount<2){
    bar.classList.add('hidden');
    return;
  }
  bar.classList.remove('hidden');
  const allSelected=mpAllRemainingSelectedV12();
  if(btn){
    btn.classList.toggle('active',allSelected);
    btn.textContent=`${allSelected?'✓ ':''}Todos los días restantes · ${mpMoneyV12(comboPrice)} por persona`;
    btn.title=allSelected?'Tocá para quitar la selección de todos los días restantes':'Seleccionar todas las jornadas que todavía quedan';
  }
  if(help)help.textContent=allSelected?'El descuento ya está aplicado. Tocá el botón para quitar esta selección.':'O elegí uno o varios días.';
}

const renderDaysBeforeV12=renderDays;
renderDays=function(){
  state.mode='days';
  [...state.selected].forEach(d=>{if(mpPastDateV12(d))state.selected.delete(d);});
  renderDaysBeforeV12();

  // Los días terminados directamente desaparecen del formulario.
  document.querySelectorAll('.day-card[data-date]').forEach(card=>{
    if(mpPastDateV12(card.dataset.date))card.remove();
  });

  const badge=document.getElementById('selectedDaysBadge');
  if(badge){
    const n=selectedDates().length;
    badge.textContent=`${n} seleccionado${n===1?'':'s'}`;
  }
  ensureRemainingDaysButtonV12();
};

const renderSummaryBeforeV12=renderSummary;
renderSummary=function(){
  renderSummaryBeforeV12();
  const title=document.getElementById('summaryMode');
  if(title)title.textContent=mpAllRemainingSelectedV12()?'Todos los días restantes':'Entradas seleccionadas';
};

if(!document.getElementById('mpSimplifyV12Styles')){
  const style=document.createElement('style');
  style.id='mpSimplifyV12Styles';
  style.textContent=`
    .mode-grid.hidden{display:none!important}
    .remaining-days-bar-v12{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:4px 0 13px}
    .remaining-days-button-v12{border:1px solid rgba(49,90,80,.36);background:#eef6f1;color:#234c43;border-radius:999px;padding:9px 13px;font-weight:850;cursor:pointer}
    .remaining-days-button-v12:hover{background:#e5f1ea;border-color:#315a50}
    .remaining-days-button-v12.active{background:#315a50;color:#fff;border-color:#315a50}
    .remaining-days-bar-v12 small{color:var(--muted);font-size:.78rem}
    @media(max-width:640px){
      .remaining-days-bar-v12{display:grid;grid-template-columns:1fr;margin-top:2px}
      .remaining-days-button-v12{width:100%}
      .remaining-days-bar-v12 small{text-align:center}
    }
  `;
  document.head.appendChild(style);
}

renderAll();
try{updateFinalReviewV6();}catch(_){}
try{updateMobileSelectionV7();}catch(_){}
