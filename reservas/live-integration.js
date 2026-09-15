'use strict';
(()=>{
  if(new URLSearchParams(location.search).get('modo')!=='prueba-real')return;

  const BACKEND='https://script.google.com/macros/s/AKfycbzktEKSf2IhLeYb79s2uSBRWvo-cSBcRQq3lDi4bmGgVfK4WVNwpYg1QAho3PyS23XK/exec';
  const banner=document.getElementById('testBanner');
  if(banner){
    banner.textContent='PRUEBA REAL CONTROLADA · esta reserva sí se registra y envía correo';
    banner.style.background='#7b2d18';
    banner.style.color='#fff';
  }

  const form=document.getElementById('reservationForm');
  if(!form)return;

  const delay=ms=>new Promise(r=>setTimeout(r,ms));
  const code=()=>`MSC-MUND-${new Date().toISOString().slice(0,10).replaceAll('-','')}-${Math.random().toString(36).slice(2,7).toUpperCase()}`;
  const ref=c=>`MUN-${c.split('-').pop()}`;
  const shortDate=d=>{
    const parts=String(d||'').split('-');
    return parts.length===3?`${parts[2]}/${parts[1]}`:String(d||'');
  };

  // Fuente independiente de precios para impedir que un valor corrupto, cacheado o
  // mal convertido llegue a Administración. Estos son los valores públicos vigentes.
  const CANONICAL_PRICES={
    weekday:{single:5000,group:15000},
    weekend:{single:7000,group:20000},
    full:{single:30000,group:80000}
  };

  function canonicalBundle(q,price){
    q=Math.max(0,Math.floor(Number(q)||0));
    if(!q)return 0;
    const options=[
      {size:1,cost:Number(price.single)},
      {size:3,cost:Number(price.group)},
      {size:4,cost:Number(price.group)}
    ];
    const dp=Array(q+1).fill(Infinity);dp[0]=0;
    for(let i=1;i<=q;i++){
      for(const o of options){
        if(i>=o.size&&Number.isFinite(dp[i-o.size]))dp[i]=Math.min(dp[i],dp[i-o.size]+o.cost);
      }
    }
    return dp[q];
  }

  function canonicalPrice(){
    const dates=selectedDates();
    const paid=Math.max(0,Math.floor(Number(state.paid)||0));
    if(!dates.length||paid<1)return{entries:0,extras:0,total:0,base:0,saving:0};

    let entries=0,base=0;
    if(state.mode==='full'){
      entries=canonicalBundle(paid,CANONICAL_PRICES.full);
      base=paid*CANONICAL_PRICES.full.single;
    }else{
      dates.forEach(date=>{
        const day=dayByDate(date);
        const price=day&&day.kind==='weekend'?CANONICAL_PRICES.weekend:CANONICAL_PRICES.weekday;
        entries+=canonicalBundle(paid,price);
        base+=paid*price.single;
      });
      if(dates.length===DAYS.length){
        entries=Math.min(entries,canonicalBundle(paid,CANONICAL_PRICES.full));
      }
    }

    let extras=0;
    ACTIVITIES.forEach(a=>{
      if(!dates.includes(a.date))return;
      const q=Math.max(0,Math.floor(Number(state.activityQty[a.id])||0));
      extras+=q*Math.max(0,Number(a.fee)||0);
    });

    const total=Math.round(entries+extras);
    return{entries:Math.round(entries),extras:Math.round(extras),total,base:Math.round(base),saving:Math.max(0,Math.round(base-entries))};
  }

  // El importe que ve el usuario y el que se envía salen de la misma cuenta canónica.
  // Aunque alguna capa anterior devolviera por error "6" o "7" en vez de miles,
  // esta última barrera lo corrige antes de mostrar o registrar la reserva.
  const previousCalculatePrice=calculatePrice;
  calculatePrice=function(){
    let previous={};
    try{previous=previousCalculatePrice()||{};}catch(_){previous={};}
    const c=canonicalPrice();
    return {...previous,base:c.base,saving:c.saving,total:c.total,canonicalEntries:c.entries,canonicalExtras:c.extras};
  };

  function payload(){
    const dates=selectedDates(),p=canonicalPrice(),c=code();
    if(!dates.length)throw new Error('sin-fechas');
    if(Number(state.paid||0)<1)throw new Error('sin-entradas');
    if(!Number.isFinite(p.total)||p.total<5000)throw new Error('importe-invalido');

    const acts=ACTIVITIES.filter(a=>Number(state.activityQty[a.id]||0)>0&&dates.includes(a.date));
    const actText=acts.map(a=>{
      const q=Number(state.activityQty[a.id]||0);
      const fee=q*Number(a.fee||0);
      return `${a.title} (${q} participante(s)${fee?`, adicional $${Math.round(fee).toLocaleString('es-AR')}`:''})`;
    }).join(' | ');
    const dni=document.getElementById('dni').value.replace(/\D/g,'');
    const dateSummary=dates.length===DAYS.length
      ? '26/09–04/10 · Pase completo'
      : dates.length===1
        ? shortDate(dates[0])
        : `${dates.length} días seleccionados`;
    const total=p.total;
    const acceptedAt=new Date().toISOString();
    return {
      programa:'Mundos Perdidos 2026',
      programa_id:'mundos',
      modalidad:state.mode==='full'?'Pase completo':'Días particulares',
      tipo:'general',
      fecha:dates[0]||'',
      horario:'Pase',
      fecha_resumen:dateSummary,
      horario_resumen:'Pase',
      fechas:dates.map(d=>({fecha:d,horario:'Pase',titulo:(dayByDate(d)?.theme||'Mundos Perdidos 2026')})),
      durationMinutes:480,
      participantes:Number(state.paid||0)+Number(state.free||0),
      adultos:Number(state.paid||0),
      menores:Number(state.free||0),
      acompanantes:0,
      grupos_necesarios:1,
      precio_estimado:`$${total}`,
      precio_entradas:p.entries,
      adicionales:p.extras,
      responsable:document.getElementById('responsible').value.trim(),
      telefono:document.getElementById('phone').value.trim(),
      email:document.getElementById('email').value.trim(),
      dni:dni,
      institucion:dni,
      ciudad:document.getElementById('city').value.trim(),
      temas:actText,
      accesibilidad:document.getElementById('notes').value.trim(),
      comentarios:`Condiciones de participación aceptadas digitalmente: ${acceptedAt}. ${acts.length?'Actividades seleccionadas: '+acts.length+'.':'Continuó expresamente sin reservar actividades.'}`,
      condiciones_aceptadas:true,
      condiciones_version:'MP-2026-v2',
      codigo_reserva:c,
      referencia_pago:ref(c),
      estado:'PENDIENTE DE CONFIRMACIÓN DE PAGO',
      timestamp:acceptedAt
    };
  }

  function sendPost(data){
    return new Promise((resolve,reject)=>{
      const id='scassoPost_'+Date.now()+'_'+Math.random().toString(36).slice(2);
      const frame=document.createElement('iframe');
      const f=document.createElement('form');
      frame.name=id;
      frame.style.display='none';
      frame.setAttribute('aria-hidden','true');
      f.method='POST';
      f.enctype='application/x-www-form-urlencoded';
      f.action=BACKEND;
      f.target=id;
      f.style.display='none';
      let finished=false;
      const timer=setTimeout(()=>{
        if(finished)return;
        finished=true;
        cleanup();
        reject(new Error('timeout-post'));
      },25000);
      const cleanup=()=>{
        clearTimeout(timer);
        window.removeEventListener('message',onMessage);
        if(f.parentNode)f.remove();
        setTimeout(()=>{if(frame.parentNode)frame.remove();},300);
      };
      const add=(n,v)=>{
        const i=document.createElement('input');
        i.type='hidden';i.name=n;i.value=v;f.appendChild(i);
      };
      const onMessage=e=>{
        if(!e.data||e.data.callbackId!==id||finished)return;
        finished=true;
        cleanup();
        resolve(e.data.result||{});
      };
      window.addEventListener('message',onMessage);
      add('iframe','1');
      add('callbackId',id);
      add('payload',JSON.stringify(data));
      document.body.append(frame,f);
      f.submit();
    });
  }

  function checkStatus(codeValue){
    return new Promise((resolve,reject)=>{
      const cb='mpStatus_'+Date.now()+'_'+Math.random().toString(36).slice(2);
      const script=document.createElement('script');
      let done=false;
      const timer=setTimeout(()=>{
        if(done)return;
        done=true;
        cleanup();
        reject(new Error('timeout-status'));
      },2200);
      function cleanup(){
        clearTimeout(timer);
        try{delete window[cb];}catch(_){window[cb]=undefined;}
        if(script.parentNode)script.remove();
      }
      window[cb]=r=>{
        if(done)return;
        done=true;
        cleanup();
        resolve(r||{});
      };
      script.onerror=()=>{
        if(done)return;
        done=true;
        cleanup();
        reject(new Error('status-error'));
      };
      const qs=new URLSearchParams({action:'status',callback:cb,code:codeValue,c:codeValue,v:'mp-live-10'});
      script.src=BACKEND+'?'+qs.toString();
      document.body.appendChild(script);
    });
  }

  async function sendAndConfirm(data){
    let postDone=false,postResult=null,postError=null;
    sendPost(data).then(r=>{postDone=true;postResult=r;}).catch(err=>{postDone=true;postError=err;});

    await delay(1600);

    for(let attempt=0;attempt<2;attempt++){
      if(postDone&&postResult){
        if(postResult.ok===false)return postResult;
        return postResult;
      }

      try{
        const st=await checkStatus(data.codigo_reserva);
        if(st&&st.registered){
          return {
            ok:true,
            code:st.code||data.codigo_reserva,
            status:st.status||'PENDIENTE DE PAGO',
            ticket:st.ticket||null,
            recoveredByStatus:true
          };
        }
      }catch(_){ }

      if(postDone&&postResult&&postResult.ok===false)return postResult;
      if(attempt===0)await delay(900);
    }

    return {
      ok:true,
      code:data.codigo_reserva,
      pendingConfirmation:true,
      postError:postError?String(postError.message||postError):''
    };
  }

  form.addEventListener('submit',async e=>{
    if(e.__mpHandled)return;
    e.preventDefault();
    e.stopImmediatePropagation();

    const msg=document.getElementById('formMessage');
    const btn=document.getElementById('submitBtn');
    const err=validateForm();
    if(err){msg.textContent=err;msg.className='form-message error';return;}

    let data;
    try{data=payload();}
    catch(ex){
      msg.textContent='Detectamos una inconsistencia en el importe. La reserva no fue enviada. Recargá la página y volvé a revisar la selección.';
      msg.className='form-message error';
      btn.disabled=false;
      btn.textContent='Generar pre-reserva';
      return;
    }

    btn.disabled=true;
    btn.textContent='Enviando…';
    msg.textContent='Enviando tu pre-reserva…';
    msg.className='form-message';

    try{
      const r=await sendAndConfirm(data);

      if(!r||r.ok===false){
        msg.textContent=(r&&r.message)?r.message:'No se pudo registrar la reserva. Intentá nuevamente.';
        msg.className='form-message error';
        btn.disabled=false;
        btn.textContent='Generar pre-reserva';
        return;
      }

      data.codigo_reserva=r.code||data.codigo_reserva;

      if(r.pendingConfirmation){
        msg.textContent=`Solicitud enviada: ${data.codigo_reserva}. No vuelvas a enviarla. Revisá tu correo: el ticket provisorio puede demorar unos minutos.`;
        msg.className='form-message success';
        btn.textContent='Solicitud enviada';
        return;
      }

      msg.textContent=`Pre-reserva registrada: ${data.codigo_reserva}. Te enviamos el ticket provisorio al correo indicado.`;
      msg.className='form-message success';
      btn.textContent='Pre-reserva registrada';
    }catch(ex){
      msg.textContent=`Solicitud enviada: ${data.codigo_reserva}. No vuelvas a enviarla. Revisá tu correo; si no llega en unos minutos, contactá al Museo.`;
      msg.className='form-message success';
      btn.textContent='Solicitud enviada';
    }
  },true);

  // Refrescar todos los resúmenes con el importe canónico ya protegido.
  try{renderAll();}catch(_){ }
  try{updateFinalReviewV6();}catch(_){ }
  try{updateMobileSelectionV7();}catch(_){ }
})();
