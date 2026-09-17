'use strict';

// Ajustes puntuales del 17/09/2026.
// No modifica backend, pagos, QR ni el circuito general de reservas.
const PECES_FEE_V11=15000;

// Peces en su tinta: horario y valor definitivos.
ACTIVITIES.filter(a=>a.title==='Peces en su tinta').forEach(a=>{
  a.time='17:00';
  a.fee=PECES_FEE_V11;
  a.feeKind='taller';
  a.type='Taller de arte para infancias · Prof. Lucila Andino · $15.000';
});

// Arqueólogos por un día: cupo definitivo 25 participantes.
const arqueologosV11=ACTIVITIES.find(a=>a.id==='arqueologos-01');
if(arqueologosV11){
  arqueologosV11.capacity=25;
  arqueologosV11.remaining=25;
  arqueologosV11.limited=true;
  arqueologosV11.requiredReservation=true;
}

// La capa histórica de Peces calculaba $5.000. Corregirla antes de la integración final.
const calculatePriceBeforeV11=calculatePrice;
calculatePrice=function(){
  const p=calculatePriceBeforeV11();
  const legacyPecesFees=Math.max(0,Number(p.pecesMaterials||0));
  const pecesFees=ACTIVITIES
    .filter(a=>a.title==='Peces en su tinta')
    .reduce((sum,a)=>sum+Number(state.activityQty[a.id]||0)*PECES_FEE_V11,0);
  return {
    ...p,
    pecesMaterials:0,
    pecesFees,
    activityFees:Math.max(0,Number(p.activityFees||0))+pecesFees,
    total:Math.max(0,Number(p.total||0)-legacyPecesFees+pecesFees)
  };
};

// Mostrar el valor específico en la referencia de precios.
const refV11=document.querySelector('.price-reference details');
if(refV11&&!([...refV11.querySelectorAll(':scope > div')].some(row=>row.querySelector('span')?.textContent.trim()==='Peces en su tinta'))){
  const row=document.createElement('div');
  row.innerHTML='<span>Peces en su tinta</span><b>+$15.000</b><small>por participante</small>';
  const childRow=[...refV11.querySelectorAll(':scope > div')].find(r=>r.querySelector('span')?.textContent.trim()==='Taller para infancias');
  if(childRow)childRow.insertAdjacentElement('afterend',row);else refV11.appendChild(row);
}

renderAll();
try{updateFinalReviewV6();}catch(_){ }
try{updateMobileSelectionV7();}catch(_){ }
