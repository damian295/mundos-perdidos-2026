'use strict';

(()=>{
  const qs=new URLSearchParams(window.location.search);
  if(qs.get('modo')!=='prueba-real')return;

  const APPS_SCRIPT_ENDPOINT='https://script.google.com/macros/s/AKfycbwMAwCaeJm8w1GrG1wb7iz1RFv3nP0Zl6szvrgoOEVfrrNAX9JD-Tw_t5G8sMzMGdI/exec';
  const FRONTEND_VERSION='mp-2026-live-test-2';

  const banner=document.getElementById('testBanner');
  if(banner){
    banner.textContent='PRUEBA REAL CONTROLADA · esta reserva sí se registra y envía correo';
    banner.style.background='#7b2d18';
    banner.style.color='#fff';
  }

  function realReservationCode(){
    const now=new Date();
    const stamp=[now.getFullYear().toString().slice(-2),String(now.getMonth()+1).padStart(2,'0'),String(now.getDate()).padStart(2,'0')].join('');
    const tail=(Date.now().toString(36)+Math.random().toString(36).slice(2,6)).slice(-8).toUpperCase();
    return `MUN-${stamp}-${tail}`;
  }

  function paymentReferenceFromCode(code){
    const compact=String(code||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(-12);
    return `MP-${compact}`;
  }

  function activitiesForDate(date){
    return ACTIVITIES.filter(a=>a.date===date&&Number(state.activityQty[a.id]||0)>0);
  }

  function activityDescription(a){
    const q=Number(state.activityQty[a.id]||0);
    const fee=q*Number(a.fee||0);
    return `${a.title} (${q} participante${q===1?'':'s'}${fee?`, materiales ${money(fee)}`:''})`;
  }

  function buildLivePayload(){
    const dates=selectedDates();
    const price=calculatePrice();
    const code=realReservationCode();
    const adults=Number(state.paid||0);
    const minors=Number(state.free||0);
    const participants=adults+minors;
    const selectedActs=ACTIVITIES.filter(a=>Number(state.activityQty[a.id]||0)>0&&dates.includes(a.date));
    const readableDates=dates.map(date=>dayByDate(date)?.label||date).join(' · ');
    const temas=selectedActs.length?selectedActs.map(activityDescription).join(' | '):'Sin talleres o capacitaciones seleccionados';

    const rows=dates.map(date=>{
      const day=dayByDate(date);
      const acts=activitiesForDate(date);
      const detail=acts.length?` · ${acts.map(activityDescription).join(' · ')}`:'';
      return {
        date,
        fecha:date,
        horario:'Pase',
        titulo:`${day?.label||date} · ${day?.theme||'Mundos Perdidos 2026'}${detail}`,
        taller_id:'',
        taller_nombre:'',
        duracion:480,
        adultos:adults,
        menores:minors,
        participantes:participants,
        importe_estimado:0
      };
    });

    return {
      programa:'Jornadas Mundos Perdidos',
      programa_id:'mundos',
      taller_id:'',
      taller_nombre:'',
      modalidad:state.mode==='full'?'Pase completo':'Días particulares',
      tipo:'general',
      fecha:dates[0]||'',
      horario:'Pase',
      fecha_resumen:readableDates,
      horario_resumen:'Pase',
      fechas:rows,
      durationMinutes:480,
      participantes:participants,
      adultos:adults,
      menores:minors,
      precio_estimado:Number(price.total||0),
      responsable:document.getElementById('responsible').value.trim(),
      telefono:document.getElementById('phone').value.trim(),
      email:document.getElementById('email').value.trim(),
      institucion:'',
      dni:document.getElementById('dni').value.trim(),
      direccion:'',
      nivel:'',
      curso:'',
      ciudad:document.getElementById('city').value.trim(),
      temas,
      accesibilidad:document.getElementById('notes').value.trim(),
      codigo_reserva:code,
      referencia_pago:paymentReferenceFromCode(code),
      estado:'PENDIENTE DE CONFIRMACIÓN DE PAGO',
      timestamp:new Date().toISOString()
    };
  }

  function compactPayload(data){
    const keep=['programa','programa_id','taller_id','taller_nombre','modalidad','tipo','fecha','horario','fecha_resumen','horario_resumen','fechas','durationMinutes','participantes','adultos','menores','precio_estimado','responsable','telefono','email','institucion','dni','direccion','nivel','curso','ciudad','temas','accesibilidad','codigo_reserva','referencia_pago','estado','timestamp'];
    const out={};
    keep.forEach(k=>{if(data[k]!==undefined)out[k]=data[k];});
    if(Array.isArray(out.fechas)){
      out.fechas=out.fechas.map(row=>({
        date:row.date,
        fecha:row.fecha,
        horario:row.horario,
        titulo:row.titulo,
        taller_id:row.taller_id,
        taller_nombre:row.taller_nombre,
        duracion:row.duracion,
        adultos:row.adultos,
        menores:row.menores,
        participantes:row.participantes,
        importe_estimado:row.importe_estimado
      }));
    }
    return out;
  }

  function submitReservationJSONP(data){
    return new Promise((resolve,reject)=>{
      const callbackName=`scassoReserve_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const script=document.createElement('script');
      let finished=false;
      const timer=setTimeout(()=>{
        if(finished)return;
        finished=true;
        cleanup();
        reject(new Error('Tiempo de espera agotado al registrar la reserva.'));
      },60000);

      function cleanup(){
        clearTimeout(timer);
        try{delete window[callbackName];}catch(_){window[callbackName]=undefined;}
        if(script.parentNode)script.parentNode.removeChild(script);
      }

      window[callbackName]=payload=>{
        if(finished)return;
        finished=true;
        cleanup();
        resolve(payload||{});
      };

      script.onerror=()=>{
        if(finished)return;
        finished=true;
        cleanup();
        reject(new Error('No se recibió respuesta del servidor de reservas.'));
      };

      const params=new URLSearchParams({
        action:'reserve',
        callback:callbackName,
        payload:JSON.stringify(compactPayload(data)),
        v:FRONTEND_VERSION
      });
      script.src=`${APPS_SCRIPT_ENDPOINT}?${params.toString()}`;
      document.body.appendChild(script);
    });
  }

  function submitReservationDirectPost(data){
    return new Promise((resolve,reject)=>{
      const callbackId=`scassoPost_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const iframe=document.createElement('iframe');
      iframe.name=callbackId;
      iframe.style.display='none';
      iframe.setAttribute('aria-hidden','true');

      const form=document.createElement('form');
      form.method='POST';
      form.enctype='application/x-www-form-urlencoded';
      form.action=APPS_SCRIPT_ENDPOINT;
      form.target=callbackId;
      form.style.display='none';

      let finished=false;
      const timer=setTimeout(()=>{
        if(finished)return;
        finished=true;
        cleanup();
        reject(new Error('Tiempo de espera del navegador.'));
      },45000);

      function cleanup(){
        clearTimeout(timer);
        window.removeEventListener('message',onMessage);
        if(form.parentNode)form.parentNode.removeChild(form);
        setTimeout(()=>{if(iframe.parentNode)iframe.parentNode.removeChild(iframe);},500);
      }

      function add(name,value){
        const input=document.createElement('input');
        input.type='hidden';
        input.name=name;
        input.value=value;
        form.appendChild(input);
      }

      function onMessage(ev){
        const msg=ev&&ev.data?ev.data:null;
        if(!msg||msg.callbackId!==callbackId)return;
        if(finished)return;
        finished=true;
        cleanup();
        resolve(msg.result||{ok:false,message:'Respuesta vacía del servidor.'});
      }

      window.addEventListener('message',onMessage);
      add('iframe','1');
      add('callbackId',callbackId);
      add('payload',JSON.stringify(compactPayload(data)));
      document.body.appendChild(iframe);
      document.body.appendChild(form);
      form.submit();
    });
  }

  async function submitReservationRobust(data){
    try{
      return await submitReservationDirectPost(data);
    }catch(firstErr){
      try{
        return await submitReservationJSONP(data);
      }catch(secondErr){
        throw secondErr||firstErr;
      }
    }
  }

  function showSuccess(data,response){
    const ticketSection=document.getElementById('ticketSection');
    const ticketCard=document.getElementById('ticketCard');
    if(!ticketSection||!ticketCard)return;
    ticketCard.innerHTML=`
      <div class="ticket-head">
        <div>
          <p class="mini-label" style="color:#9b4f1b">Museo de Ciencias Naturales A. Scasso</p>
          <h2 style="margin:0;color:#18342e">Pre-reserva registrada</h2>
          <span class="ticket-code">${escapeHtml(data.codigo_reserva)}</span>
        </div>
        <img src="../assets/logo_museo.jpg" alt="Museo Scasso">
      </div>
      <div class="ticket-details">
        <div><strong>Responsable:</strong> ${escapeHtml(data.responsable)}</div>
        <div><strong>Fechas:</strong> ${escapeHtml(data.fecha_resumen)}</div>
        <div><strong>Total estimado:</strong> ${money(data.precio_estimado)}</div>
        <div><strong>Referencia de pago:</strong> ${escapeHtml(data.referencia_pago)}</div>
        <div><strong>Estado:</strong> PENDIENTE DE CONFIRMACIÓN DE PAGO</div>
      </div>
      <div class="ticket-note"><strong>La pre-reserva fue enviada.</strong> Revisá el correo indicado: allí deberían llegar el resumen y las instrucciones para completar el pago. El ticket definitivo con validación se habilitará cuando Administración confirme el pago.</div>`;
    ticketSection.classList.remove('hidden');
    ticketSection.scrollIntoView({behavior:'smooth',block:'start'});
    console.info('Respuesta backend Mundos Perdidos:',response);
  }

  const originalForm=document.getElementById('reservationForm');
  if(!originalForm)return;
  const liveForm=originalForm.cloneNode(true);
  originalForm.replaceWith(liveForm);

  liveForm.addEventListener('submit',async e=>{
    e.preventDefault();
    const message=document.getElementById('formMessage');
    const submit=document.getElementById('submitBtn');
    const error=validateForm();
    if(error){
      message.textContent=error;
      message.className='form-message error';
      return;
    }

    const data=buildLivePayload();
    submit.disabled=true;
    submit.textContent='Registrando…';
    message.textContent='Registrando la pre-reserva en Administración…';
    message.className='form-message';

    try{
      const response=await submitReservationRobust(data);
      if(!response||response.ok===false||response.success===false||response.error){
        throw new Error((response&&(response.error||response.message))||'El servidor no pudo registrar la reserva.');
      }
      data.codigo_reserva=response.code||data.codigo_reserva;
      message.textContent=`Pre-reserva registrada: ${data.codigo_reserva}. Revisá tu correo.`;
      message.className='form-message success';
      showSuccess(data,response);
      submit.textContent='Pre-reserva registrada';
      submit.dataset.completed='true';
    }catch(err){
      console.error(err);
      message.textContent=`No se pudo confirmar el registro. ${err.message||''}`.trim();
      message.className='form-message error';
      submit.disabled=false;
      submit.textContent='Generar pre-reserva';
    }
  });
})();
