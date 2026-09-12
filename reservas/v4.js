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
    const q=row.querySelector('.quota');
    if(q)q.classList.add('capacity-expandable');
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

// v5 incorpora Peces en su tinta y sus materiales. La integración con el backend
// se carga únicamente después de v5 y sólo actúa si la URL lleva ?modo=prueba-real.
const v5Script=document.createElement('script');
v5Script.src='v5.js?v=2';
v5Script.onload=()=>{
  const liveScript=document.createElement('script');
  liveScript.src='live-integration.js?v=4';
  document.head.appendChild(liveScript);
};
document.head.appendChild(v5Script);
