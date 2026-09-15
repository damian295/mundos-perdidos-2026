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

  function payload(){
    const dates=selectedDates(),p=calculatePrice(),c=code();
    const acts=ACTIVITIES.filter(a=>Number(state.activityQty[a.id]||0)>0&&dates.includes(a.date));
    const actText=acts.map(a=>`${a.title} (${Number(state.activityQty[a.id]||0)} participante(s))`).join(' | ');
    const dni=document.getElementById('dni').value.replace(/\D/g,'');
    const dateSummary=dates.length===DAYS.length
      ? '26/09–04/10 · Pase completo'
      : dates.length===1
        ? shortDate(dates[0])
        : `${dates.length} días seleccionados`;
    const total=Math.round(Number(p.total||0));
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
      responsable:document.getElementById('responsible').value.trim(),
      telefono:document.getElementById('phone').value.trim(),
      email:document.getElementById('email').value.trim(),
      dni:dni,
      institucion:dni,
      ciudad:document.getElementById('city').value.trim(),
      temas:actText,
      accesibilidad:document.getElementById('notes').value.trim(),
      codigo_reserva:c,
      referencia_pago:ref(c),
      estado:'PENDIENTE DE CONFIRMACIÓN DE PAGO',
      timestamp:new Date().toISOString()
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
      const qs=new URLSearchParams({action:'status',callback:cb,code:codeValue,c:codeValue,v:'mp-live-6'});
      script.src=BACKEND+'?'+qs.toString();
      document.body.appendChild(script);
    });
  }

  async function sendAndConfirm(data){
    let postDone=false,postResult=null,postError=null;
    sendPost(data).then(r=>{postDone=true;postResult=r;}).catch(err=>{postDone=true;postError=err;});

    // La reserva se envía una sola vez. Sólo esperamos unos segundos para intentar
    // confirmar el registro; si Administración tarda, evitamos mostrar un falso error
    // o habilitar un segundo envío que pueda generar duplicados.
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

    // Sin respuesta concluyente no repetimos el POST. La solicitud ya fue enviada
    // y puede estar procesándose; devolvemos estado pendiente de confirmación visual.
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

    const data=payload();
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
      // Una caída de la verificación del navegador no implica que el POST haya fallado.
      // Para evitar duplicados, no habilitamos un segundo envío automáticamente.
      msg.textContent=`Solicitud enviada: ${data.codigo_reserva}. No vuelvas a enviarla. Revisá tu correo; si no llega en unos minutos, contactá al Museo.`;
      msg.className='form-message success';
      btn.textContent='Solicitud enviada';
    }
  },true);
})();
