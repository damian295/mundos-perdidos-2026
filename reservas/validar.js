'use strict';
(()=>{
  // Usamos el backend estable de Reservas, que ya soporta action=status por iframe/postMessage.
  // Evitamos abrir directamente el Web App de Apps Script, porque Google puede mostrar la pantalla
  // de Drive "no se pudo abrir el archivo" en algunos navegadores/cuentas.
  const BACKEND='https://script.google.com/macros/s/AKfycbzktEKSf2IhLeYb79s2uSBRWvo-cSBcRQq3lDi4bmGgVfK4WVNwpYg1QAho3PyS23XK/exec';
  const code=(new URLSearchParams(location.search).get('c')||'').trim();
  const statusBox=document.getElementById('status');
  const body=document.getElementById('body');
  let done=false;

  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));

  function setError(title,msg){
    statusBox.className='status bad';
    statusBox.innerHTML=`<div class="eyebrow">Control de acceso</div><h1>${esc(title)}</h1><p>${esc(msg)}</p>`;
    body.innerHTML='<button class="refresh" type="button">Volver a verificar</button>';
    body.querySelector('.refresh').addEventListener('click',()=>location.reload());
  }

  if(!code){
    setError('QR INVÁLIDO','Falta el código de reserva.');
    return;
  }

  const normalizeDate=value=>{
    const s=String(value||'').trim();
    if(/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    const m=s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if(m) return `${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`;
    return s;
  };
  const today=()=>{
    const d=new Date();
    const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');
    return `${y}-${m}-${day}`;
  };

  function render(result){
    if(done) return;
    done=true;
    document.querySelectorAll('.qr-helper').forEach(el=>el.remove());

    if(!result || result.ok===false || !result.registered){
      setError('NO HABILITADO',result&&result.message?result.message:'No se encontró una reserva válida con este código.');
      return;
    }

    const ticket=result.ticket||{};
    const status=String(result.status||ticket.estado||'').toUpperCase();
    const paid=status.includes('ABONADO');
    const fechas=Array.isArray(ticket.fechas)?ticket.fechas:[];
    const validToday=fechas.some(f=>normalizeDate(f&&f.fecha)===today());

    let cls='bad',title='NO HABILITADO',detail='Pago no confirmado.';
    if(paid&&validToday){cls='ok';title='HABILITADO';detail='Pago confirmado · entrada válida para hoy.';}
    else if(paid){cls='warn';title='ABONADO';detail='Pago confirmado · la entrada no corresponde al día de hoy.';}

    statusBox.className=`status ${cls}`;
    statusBox.innerHTML=`<div class="eyebrow">Control de acceso</div><h1>${title}</h1><p>${detail}</p>`;

    const dias=fechas.length
      ? fechas.map(f=>`<div class="activity"><div class="mark yes">✓</div><div><b>${esc(f.fecha||'')}</b><small>${esc(f.titulo||f.horario||'Entrada')}</small></div></div>`).join('')
      : '<p>No hay fechas registradas en esta reserva.</p>';

    let acts=[];
    const rawTopics=String(ticket.temas||'').trim();
    if(rawTopics) acts=rawTopics.split(/\s*\|\s*|\n+/).map(x=>x.trim()).filter(Boolean);
    if(!acts.length){
      const seen=new Set();
      fechas.forEach(f=>{
        const t=String((f&&f.taller)||'').trim();
        if(t && !/jornadas mundos perdidos/i.test(t) && !seen.has(t)){seen.add(t);acts.push(t);}
      });
    }
    const actsHtml=acts.length
      ? acts.map(a=>`<div class="activity"><div class="mark yes">✓</div><div><b>${esc(a)}</b><small>Actividad registrada</small></div></div>`).join('')
      : '<div class="note">No hay talleres o capacitaciones registrados. Si la entrada está ABONADA, el ingreso general sigue siendo válido para sus fechas.</div>';

    body.innerHTML=`
      <div class="code">${esc(result.code||code)}</div>
      <div class="grid">
        <section class="box"><h2>Reserva</h2>
          <div class="row"><span>Responsable</span><strong>${esc(ticket.responsable||'—')}</strong></div>
          <div class="row"><span>DNI</span><strong>${esc(ticket.dni||ticket.institucion||'—')}</strong></div>
          <div class="row"><span>Participantes</span><strong>${esc(ticket.participantes||'—')}</strong></div>
          <div class="row"><span>Estado</span><strong>${esc(status||'—')}</strong></div>
        </section>
        <section class="box"><h2>Días habilitados</h2>${dias}</section>
      </div>
      <section class="box activities"><h2>Talleres y capacitaciones</h2>${actsHtml}</section>
      <button class="refresh" type="button">Volver a verificar</button>`;
    body.querySelector('.refresh').addEventListener('click',()=>location.reload());
  }

  const callbackId='qr_'+Date.now()+'_'+Math.random().toString(36).slice(2,8);
  const onMessage=ev=>{
    const data=ev&&ev.data;
    if(!data || data.callbackId!==callbackId) return;
    window.removeEventListener('message',onMessage);
    render(data.result);
  };
  window.addEventListener('message',onMessage);

  const iframe=document.createElement('iframe');
  iframe.className='qr-helper';
  iframe.style.display='none';
  iframe.src=BACKEND+'?'+new URLSearchParams({
    action:'status',estado_reserva:'1',code:code,c:code,iframe:'1',callbackId
  }).toString();
  document.body.appendChild(iframe);

  // Respaldo JSONP de sólo lectura usando el mismo backend.
  const cb='__qrStatus_'+Math.random().toString(36).slice(2,10);
  window[cb]=result=>{
    try{delete window[cb];}catch(_){window[cb]=undefined;}
    render(result);
  };
  const script=document.createElement('script');
  script.className='qr-helper';
  script.src=BACKEND+'?'+new URLSearchParams({action:'status',code:code,c:code,callback:cb}).toString();
  document.head.appendChild(script);

  setTimeout(()=>{
    if(!done) setError('ERROR DE CONEXIÓN','No se pudo consultar Administración.');
  },12000);
})();