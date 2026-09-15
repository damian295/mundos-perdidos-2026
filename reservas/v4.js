'use strict';

// Ajustes de la cuarta prueba. Las capacitaciones tienen una capacidad operativa
// inicial prevista de 50 personas y puede ampliarse si la organización lo decide.
ACTIVITIES.forEach(a=>{
  if(a.group==='teacher'||a.id.startsWith('docencia-')){
    a.capacityPlan=50;
    a.expandableCapacity=true;
  }
});

const quotaTextBeforeV4=quotaText;
quotaText=function(a){
  if(a.expandableCapacity){
    return `${a.capacityPlan} lugares previstos inicialmente · capacidad ampliable`;
  }
  return quotaTextBeforeV4(a);
};

const renderDaysBeforeV4=renderDays;
renderDays=function(){
  renderDaysBeforeV4();
  document.querySelectorAll('.day-card[data-date]').forEach(card=>{
    const d=dayByDate(card.dataset.date);
    if(d&&d.kind==='weekend'){
      card.classList.add('weekend-card');
      const label=card.querySelector('time');
      if(label)label.classList.add('weekend-label');
    }
  });
};

const renderActivitiesBeforeV4=renderActivities;
renderActivities=function(){
  renderActivitiesBeforeV4();
  document.querySelectorAll('.teacher-group .activity-row').forEach(row=>{
    row.classList.add('teacher-activity');
  });
};

const renderSummaryBeforeV4=renderSummary;
renderSummary=function(){
  renderSummaryBeforeV4();
  const dates=selectedDates();
  const items=[...document.querySelectorAll('#summaryDates > span')];
  items.forEach((item,i)=>{
    const d=dayByDate(dates[i]);
    if(d&&d.kind==='weekend')item.classList.add('weekend-summary');
  });
};

renderAll();

// La versión pública definitiva usa la integración real. Para conservar el backend ya probado,
// se activa internamente el modo real antes de cargarlo y se limpia la URL al terminar.
const productionUrl=new URL(location.href);
if(productionUrl.searchParams.get('modo')!=='prueba-real'){
  productionUrl.searchParams.set('modo','prueba-real');
  history.replaceState(null,'',productionUrl.pathname+'?'+productionUrl.searchParams.toString()+productionUrl.hash);
}

const v5Script=document.createElement('script');
v5Script.src='v5.js?v=3';
v5Script.onload=()=>{
  const v6Script=document.createElement('script');
  v6Script.src='v6.js?v=2';
  v6Script.onload=()=>{
    const v7Script=document.createElement('script');
    v7Script.src='v7.js?v=1';
    v7Script.onload=()=>{
      const liveScript=document.createElement('script');
      liveScript.src='live-integration.js?v=9';
      liveScript.onload=()=>{
        document.getElementById('testBanner')?.remove();
        const cleanUrl=new URL(location.href);
        cleanUrl.searchParams.delete('modo');
        history.replaceState(null,'',cleanUrl.pathname+(cleanUrl.search?cleanUrl.search:'')+cleanUrl.hash);
        const submit=document.getElementById('submitBtn');
        if(submit&&submit.dataset.awaitingProduction==='1'){
          submit.disabled=false;
          submit.textContent='Generar pre-reserva';
          delete submit.dataset.awaitingProduction;
        }
      };
      document.head.appendChild(liveScript);
    };
    document.head.appendChild(v7Script);
  };
  document.head.appendChild(v6Script);
};
document.head.appendChild(v5Script);
