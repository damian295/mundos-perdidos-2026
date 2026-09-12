'use strict';
(()=>{
  if(new URLSearchParams(location.search).get('modo')!=='prueba-real')return;
  const BACKEND='https://script.google.com/macros/s/AKfycbzktEKSf2IhLeYb79s2uSBRWvo-cSBcRQq3lDi4bmGgVfK4WVNwpYg1QAho3PyS23XK/exec';
  const banner=document.getElementById('testBanner');
  if(banner){banner.textContent='PRUEBA REAL CONTROLADA · esta reserva sí se registra y envía correo';banner.style.background='#7b2d18';banner.style.color='#fff';}
  const form=document.getElementById('reservationForm');
  if(!form)return;
  const code=()=>`MSC-MUND-${new Date().toISOString().slice(0,10).replaceAll('-','')}-${Math.random().toString(36).slice(2,7).toUpperCase()}`;
  const ref=c=>`MUN-${c.split('-').pop()}`;
  function payload(){
    const dates=selectedDates(),p=calculatePrice(),c=code();
    const acts=ACTIVITIES.filter(a=>Number(state.activityQty[a.id]||0)>0&&dates.includes(a.date));
    const actText=acts.map(a=>`${a.title} (${Number(state.activityQty[a.id]||0)} participante(s))`).join(' | ');
    return {programa:'Mundos Perdidos 2026',programa_id:'mundos',modalidad:state.mode==='full'?'Pase completo':'Días particulares',tipo:'general',fecha:dates[0]||'',horario:'Pase',fecha_resumen:dates.join(' | '),horario_resumen:'Pase',fechas:dates.map(d=>({fecha:d,horario:'Pase',titulo:(dayByDate(d)?.theme||'Mundos Perdidos 2026')})),durationMinutes:480,participantes:Number(state.paid||0)+Number(state.free||0),adultos:Number(state.paid||0),menores:Number(state.free||0),acompanantes:0,grupos_necesarios:1,precio_estimado:Number(p.total||0),responsable:document.getElementById('responsible').value.trim(),telefono:document.getElementById('phone').value.trim(),email:document.getElementById('email').value.trim(),dni:document.getElementById('dni').value.trim(),ciudad:document.getElementById('city').value.trim(),temas:actText,accesibilidad:document.getElementById('notes').value.trim(),codigo_reserva:c,referencia_pago:ref(c),estado:'PENDIENTE DE CONFIRMACIÓN DE PAGO',timestamp:new Date().toISOString()};
  }
  function send(data){return new Promise((resolve,reject)=>{
    const id='scassoPost_'+Date.now()+'_'+Math.random().toString(36).slice(2),frame=document.createElement('iframe'),f=document.createElement('form');
    frame.name=id;frame.style.display='none';f.method='POST';f.enctype='application/x-www-form-urlencoded';f.action=BACKEND;f.target=id;f.style.display='none';
    const add=(n,v)=>{const i=document.createElement('input');i.type='hidden';i.name=n;i.value=v;f.appendChild(i)};
    const timer=setTimeout(()=>{cleanup();reject(new Error('El servidor no respondió en 30 segundos.'));},30000);
    const onMessage=e=>{if(!e.data||e.data.callbackId!==id)return;clearTimeout(timer);cleanup();resolve(e.data.result||{});};
    const cleanup=()=>{window.removeEventListener('message',onMessage);f.remove();setTimeout(()=>frame.remove(),300)};
    window.addEventListener('message',onMessage);add('iframe','1');add('callbackId',id);add('payload',JSON.stringify(data));document.body.append(frame,f);f.submit();
  })}
  form.addEventListener('submit',async e=>{
    if(e.__mpHandled)return;e.preventDefault();e.stopImmediatePropagation();
    const msg=document.getElementById('formMessage'),btn=document.getElementById('submitBtn'),err=validateForm();
    if(err){msg.textContent=err;msg.className='form-message error';return;}
    const data=payload();btn.disabled=true;btn.textContent='Registrando…';msg.textContent='Registrando la pre-reserva en Administración…';msg.className='form-message';
    try{const r=await send(data);if(!r||r.ok===false)throw new Error(r?.message||'No se pudo registrar la reserva.');data.codigo_reserva=r.code||data.codigo_reserva;msg.textContent=`Pre-reserva registrada: ${data.codigo_reserva}. Revisá tu correo.`;msg.className='form-message success';btn.textContent='Pre-reserva registrada';}
    catch(ex){msg.textContent='No se pudo registrar la reserva. '+(ex.message||'');msg.className='form-message error';btn.disabled=false;btn.textContent='Generar pre-reserva';}
  },true);
})();
