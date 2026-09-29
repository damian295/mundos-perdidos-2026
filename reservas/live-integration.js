'use strict';
(()=>{
  if(new URLSearchParams(location.search).get('modo')!=='prueba-real')return;

  const BACKEND='https://script.google.com/macros/s/AKfycbzktEKSf2IhLeYb79s2uSBRWvo-cSBcRQq3lDi4bmGgVfK4WVNwpYg1QAho3PyS23XK/exec';
  // Cupos de talleres: lectura pública y acotada desde la hoja "Cupos públicos".
  // No expone la hoja Reservas ni modifica el motor general de disponibilidad.
  const CUPOS_PUBLIC_PUBLISHED_ID='2PACX-1vT7WFzRwrwt7iNwigQoUSgzB2Ec74lb2AO4jHfkD2A6eVIMarvGS28Yz_8PAhkwZhrOFiD9ftgGwHHz';
  const CUPOS_PUBLIC_GID='1386957732';
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

  // Cierre automático por fecha. Una jornada anterior a hoy en Argentina
  // no puede volver a venderse ni aceptar inscripciones a sus talleres.
  function argentinaTodayYmd(){
    const parts=new Intl.DateTimeFormat('en-CA',{
      timeZone:'America/Argentina/Buenos_Aires',
      year:'numeric',month:'2-digit',day:'2-digit'
    }).formatToParts(new Date());
    const get=t=>parts.find(p=>p.type===t)?.value||'';
    return `${get('year')}-${get('month')}-${get('day')}`;
  }
  function isPastEventDate(date){
    return /^\d{4}-\d{2}-\d{2}$/.test(String(date||'')) && String(date)<argentinaTodayYmd();
  }
  function activityDateClosed(a){
    return Boolean(a&&isPastEventDate(a.date));
  }

  const maxPlacesBeforePastDate=maxPlacesForActivity;
  maxPlacesForActivity=function(a){
    if(activityDateClosed(a))return 0;
    return maxPlacesBeforePastDate(a);
  };

  const quotaTextBeforePastDate=quotaText;
  quotaText=function(a){
    if(activityDateClosed(a))return 'Inscripción cerrada · actividad finalizada';
    return quotaTextBeforePastDate(a);
  };

  const renderDaysBeforePastDate=renderDays;
  renderDays=function(){
    // Limpiar cualquier fecha pasada que hubiera quedado seleccionada en modo por días.
    if(state.mode!=='full'){
      [...state.selected].forEach(date=>{if(isPastEventDate(date))state.selected.delete(date);});
    }
    renderDaysBeforePastDate();
    document.querySelectorAll('.day-card[data-date]').forEach(card=>{
      if(!isPastEventDate(card.dataset.date))return;
      card.disabled=true;
      card.setAttribute('aria-disabled','true');
      card.classList.add('day-past-closed');
      const price=card.querySelector('.day-price');
      if(price)price.textContent='Finalizada';
    });
  };

  const validateFormBeforePastDate=validateForm;
  validateForm=function(){
    const base=validateFormBeforePastDate();
    if(base)return base;
    if(state.mode!=='full'){
      const past=selectedDates().find(isPastEventDate);
      if(past)return 'No se puede reservar una jornada que ya finalizó.';
    }
    const closedActivity=ACTIVITIES.find(a=>activityDateClosed(a)&&Number(state.activityQty[a.id]||0)>0);
    if(closedActivity)return `La inscripción para ${closedActivity.title} está cerrada porque la actividad ya finalizó.`;
    return '';
  };

  const pastDateStyle=document.createElement('style');
  pastDateStyle.textContent='.day-card.day-past-closed{opacity:.5;cursor:not-allowed;filter:grayscale(.25)}';
  document.head.appendChild(pastDateStyle);

  let workshopCapacityRequest=null;
  function readGvizNumber(cell){
    if(!cell)return 0;
    const n=Number(cell.v);
    if(Number.isFinite(n))return n;
    const f=String(cell.f||'').replace(/\./g,'').replace(',','.').replace(/[^0-9.-]/g,'');
    return Number(f)||0;
  }
  function applyWorkshopCapacity(payload){
    const rows=payload&&payload.table&&payload.table.rows;
    if(!Array.isArray(rows))throw new Error('cupos-invalidos');
    let applied=0;
    rows.forEach(row=>{
      const c=row&&row.c||[];
      const label=String((c[3]&&(c[3].f||c[3].v))||'');
      if(!label.startsWith('MP · '))return;
      const parts=label.split(' · ');
      const id=parts[1]||'';
      const a=ACTIVITIES.find(x=>x.id===id);
      if(!a)return;
      const capacity=readGvizNumber(c[4]);
      const used=readGvizNumber(c[5]);
      const remaining=Math.max(0,readGvizNumber(c[6]));
      if(capacity>0){
        a.capacity=capacity;
        a.used=used;
        a.remaining=remaining;
        a.limited=true;
        applied++;
      }
    });
    if(!applied)throw new Error('cupos-vacios');
    try{renderAll();}catch(_){}
    try{updateFinalReviewV6();}catch(_){}
    try{updateMobileSelectionV7();}catch(_){}
    return applied;
  }
  function refreshWorkshopCapacity(){
    if(workshopCapacityRequest)return workshopCapacityRequest;
    workshopCapacityRequest=new Promise((resolve,reject)=>{
      const cb='mpCupos_'+Date.now()+'_'+Math.random().toString(36).slice(2);
      const script=document.createElement('script');
      let done=false;
      const cleanup=()=>{
        try{delete window[cb];}catch(_){window[cb]=undefined;}
        if(script.parentNode)script.remove();
        workshopCapacityRequest=null;
      };
      const timer=setTimeout(()=>{
        if(done)return;done=true;cleanup();reject(new Error('timeout-cupos'));
      },6500);
      window[cb]=payload=>{
        if(done)return;done=true;clearTimeout(timer);
        try{resolve(applyWorkshopCapacity(payload));}
        catch(err){reject(err);}
        finally{cleanup();}
      };
      script.onerror=()=>{
        if(done)return;done=true;clearTimeout(timer);cleanup();reject(new Error('error-cupos'));
      };
      const qs=new URLSearchParams({
        gid:CUPOS_PUBLIC_GID,
        tqx:'out:json;responseHandler:'+cb,
        tq:"select D,E,F,G,H where D starts with 'MP ·'",
        headers:'1',
        v:String(Date.now())
      });
      script.src='https://docs.google.com/spreadsheets/d/e/'+encodeURIComponent(CUPOS_PUBLIC_PUBLISHED_ID)+'/gviz/tq?'+qs.toString();
      document.body.appendChild(script);
    });
    return workshopCapacityRequest;
  }

  // Fuente independiente de precios para impedir que un valor corrupto, cacheado o
  // mal convertido llegue a Administración. Estos son los valores públicos vigentes.
  const CANONICAL_PRICES={
    weekday:{single:5000,group:15000},
    weekend:{single:7000,group:20000}
  };
  // Combo dinámico por todas las jornadas que todavía quedan. El valor baja
  // automáticamente a medida que avanza el evento; el 4/10 queda sólo entrada individual.
  const REMAINING_COMBO_PRICES={6:20000,5:17000,4:14000,3:11000,2:8000};
  function remainingEventDates(){
    return DAYS.filter(d=>!isPastEventDate(d.date)).map(d=>d.date);
  }
  function remainingComboUnitPrice(){
    return REMAINING_COMBO_PRICES[remainingEventDates().length]||null;
  }

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
    if(!dates.length||paid<1)return{entries:0,extras:0,total:0,base:0,saving:0,comboApplied:false,comboUnit:null};

    let entries=0,base=0;
    dates.forEach(date=>{
      const day=dayByDate(date);
      const price=day&&day.kind==='weekend'?CANONICAL_PRICES.weekend:CANONICAL_PRICES.weekday;
      entries+=canonicalBundle(paid,price);
      base+=paid*price.single;
    });

    const remainingDates=remainingEventDates();
    const allRemaining=remainingDates.length>=2&&dates.length===remainingDates.length&&remainingDates.every(d=>dates.includes(d));
    const comboUnit=allRemaining?remainingComboUnitPrice():null;
    let comboApplied=false;
    if(comboUnit){
      const comboTotal=paid*comboUnit;
      if(comboTotal<entries){
        entries=comboTotal;
        comboApplied=true;
      }
    }

    let extras=0;
    ACTIVITIES.forEach(a=>{
      if(!dates.includes(a.date))return;
      const q=Math.max(0,Math.floor(Number(state.activityQty[a.id])||0));
      extras+=q*Math.max(0,Number(a.fee)||0);
    });

    const total=Math.round(entries+extras);
    return{
      entries:Math.round(entries),
      extras:Math.round(extras),
      total,
      base:Math.round(base),
      saving:Math.max(0,Math.round(base-entries)),
      comboApplied,
      comboUnit
    };
  }

  // El importe que ve el usuario y el que se envía salen de la misma cuenta canónica.
  // Aunque alguna capa anterior devolviera por error "6" o "7" en vez de miles,
  // esta última barrera lo corrige antes de mostrar o registrar la reserva.
  const previousCalculatePrice=calculatePrice;
  calculatePrice=function(){
    let previous={};
    try{previous=previousCalculatePrice()||{};}catch(_){previous={};}
    const c=canonicalPrice();
    return {...previous,base:c.base,saving:c.saving,total:c.total,canonicalEntries:c.entries,canonicalExtras:c.extras,remainingComboApplied:c.comboApplied,remainingComboUnit:c.comboUnit};
  };

  const renderSummaryBeforeRemainingCombo=renderSummary;
  renderSummary=function(){
    renderSummaryBeforeRemainingCombo();
    const c=canonicalPrice();
    const dates=selectedDates();
    const remaining=remainingEventDates();
    const allRemaining=remaining.length>=2&&dates.length===remaining.length&&remaining.every(d=>dates.includes(d));
    const title=document.getElementById('summaryMode');
    if(title&&allRemaining&&c.comboApplied)title.textContent='Todos los días restantes';
    const note=document.getElementById('discountNote');
    if(note&&allRemaining&&c.comboApplied){
      note.classList.remove('hidden');
      note.textContent=`Combo de jornadas restantes aplicado automáticamente · Ahorrás ${money(c.saving)}.`;
    }
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
      // "Peces en su tinta" existe en cuatro fechas: guardar la fecha evita mezclar sus cupos.
      const activityLabel=a.title==='Peces en su tinta'?`${a.title} · ${shortDate(a.date)}`:a.title;
      return `${activityLabel} (${q} participante(s)${fee?`, adicional ${Math.round(fee).toLocaleString('es-AR')}`:''})`;
    }).join(' | ');
    const dni=document.getElementById('dni').value.replace(/\D/g,'');
    const remainingDates=remainingEventDates();
    const allRemaining=remainingDates.length&&dates.length===remainingDates.length&&remainingDates.every(d=>dates.includes(d));
    const dateSummary=allRemaining
      ? 'Todos los días restantes'
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

    // Antes de enviar, refrescar los cupos para evitar trabajar con un contador viejo.
    try{await refreshWorkshopCapacity();}catch(_){ }
    const overbooked=ACTIVITIES.find(a=>{
      const q=Math.max(0,Number(state.activityQty[a.id]||0));
      return q>0&&Number.isFinite(a.remaining)&&q>a.remaining;
    });
    if(overbooked){
      msg.textContent=`Ya no quedan ${Number(state.activityQty[overbooked.id]||0)} lugares disponibles en ${overbooked.title}. Revisá la cantidad antes de enviar.`;
      msg.className='form-message error';
      try{renderActivities();renderSummary();}catch(_){}
      btn.disabled=false;
      btn.textContent='Generar pre-reserva';
      return;
    }

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

  // Sincronización quirúrgica de cupos de talleres. Se actualiza al abrir la página
  // y periódicamente, sin tocar pagos, QR, calendarios ni cupos generales.
  refreshWorkshopCapacity().catch(()=>{});
  setInterval(()=>{refreshWorkshopCapacity().catch(()=>{});},60000);
})();
