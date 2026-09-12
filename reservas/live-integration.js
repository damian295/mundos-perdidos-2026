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

  function payload(){
    const dates=selectedDates(),p=calculatePrice(),c=code();
    const acts=ACTIVITIES.filter(a=>Number(state.activityQty[a.id]||0)>0&&dates.includes(a.date));
    const actText=acts.map(a=>`${a.title} (${Number(state.activityQty[a.id]||0)} participante(s))`).join(' | ');
    const dni=document.getElementById('dni').value.replace(/\D/g,'');
    return {
      programa:'Mundos Perdidos 2026',
      programa_id:'mundos',
      modalidad:state.mode==='full'?'Pase completo':'Días particulares',
      tipo:'general',
      fecha:dates[0]||'',
      horario:'Pase',
      fecha_resumen:dates.join(' | '),
      horario_resumen:'Pase',
      fechas:dates.map(d=>({fecha:d,horario:'Pase',titulo:(dayByDate(d)?.theme||'Mundos Perdidos 2026')})),
      durationMinutes:480,
      participantes:Number(state.paid||0)+Number(state.free||0),
      adultos:Number(state.paid||0),
      menores:Number(state.free||0),
      acompanantes:0,
      grupos_necesarios:1,
      precio_estimado:Number(p.total||0),
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
      },50000);
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
      },12000);
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
      const qs=new URLSearchParams({action:'status',callback:cb,code:codeValue,c:codeValue,v:'mp-live-4'});
      script.src=BACKEND+'?'+qs.toString();
      document.body.appendChild(script);
    });
  }

  async function sendAndConfirm(data,onVerifying){
    let postDone=false,postResult=null,postError=null;
    sendPost(data).then(r=>{postDone=true;postResult=r;}).catch(err=>{postDone=true;postError=err;});

    for(let attempt=0;attempt<14;attempt++){
      await delay(attempt===0?3500:2500);

      if(postDone&&postResult){
        return postResult;
      }

      if(attempt===1&&typeof onVerifying==='function')onVerifying();

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
      if(postDone&&postError&&attempt>=4)break;
    }

    if(postDone&&postResult)return postResult;
    throw postError||new Error('No se pudo confirmar el estado de la reserva.');
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
    btn.textContent='Registrando…';
    msg.textContent='Registrando la pre-reserva en Administración…';
    msg.className='form-message';

    try{
      const r=await sendAndConfirm(data,()=>{
        msg.textContent='La solicitud fue enviada. Estamos verificando en Administración que haya quedado registrada…';
        msg.className='form-message';
        btn.textContent='Verificando…';
      });

      if(!r||r.ok===false){
        msg.textContent=(r&&r.message)?r.message:'No se pudo registrar la reserva.';
        msg.className='form-message error';
        btn.disabled=false;
        btn.textContent='Generar pre-reserva';
        return;
      }

      data.codigo_reserva=r.code||data.codigo_reserva;
      msg.textContent=`Pre-reserva registrada: ${data.codigo_reserva}. Te enviamos el ticket provisorio al correo indicado.`;
      msg.className='form-message success';
      btn.textContent='Pre-reserva registrada';
    }catch(ex){
      msg.textContent='No pudimos confirmar el estado desde esta pantalla. No vuelvas a enviar todavía: verificá la planilla de Administración antes de repetir la reserva.';
      msg.className='form-message error';
      btn.disabled=false;
      btn.textContent='Generar pre-reserva';
    }
  },true);
})();
