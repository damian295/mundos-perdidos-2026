'use strict';
(()=>{
  const BACKEND='https://script.google.com/macros/s/AKfycbzktEKSf2IhLeYb79s2uSBRWvo-cSBcRQq3lDi4bmGgVfK4WVNwpYg1QAho3PyS23XK/exec';
  const code=new URLSearchParams(location.search).get('c')||'';
  const statusBox=document.getElementById('status');
  const body=document.getElementById('body');
  const esc=s=>String(s??'').replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]));
  const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Argentina/Buenos_Aires',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());

  function check(){
    if(!code){renderError('QR inválido','Falta el código de reserva.');return;}
    checkViaIframe();
  }

  // Método principal: el mismo canal iframe/postMessage que ya usa el sistema de reservas.
  // Es más robusto en móviles que cargar la respuesta de Apps Script como <script> JSONP.
  function checkViaIframe(){
    const callbackId='qr_iframe_'+Date.now()+'_'+Math.random().toString(36).slice(2);
    const frame=document.createElement('iframe');
    frame.style.display='none';
    frame.setAttribute('aria-hidden','true');
    let finished=false;

    function cleanup(){
      window.removeEventListener('message',onMessage);
      if(frame.parentNode)frame.remove();
      clearTimeout(timer);
    }
    function fallback(){
      if(finished)return;
      finished=true;
      cleanup();
      checkViaJsonp();
    }
    function onMessage(ev){
      const msg=ev&&ev.data;
      if(!msg||msg.callbackId!==callbackId)return;
      finished=true;
      cleanup();
      render(msg.result||{});
    }

    window.addEventListener('message',onMessage);
    const timer=setTimeout(fallback,12000);
    frame.onerror=fallback;
    const qs=new URLSearchParams({action:'status',iframe:'1',callbackId:callbackId,code:code,c:code,v:'qr-2'});
    frame.src=BACKEND+'?'+qs.toString();
    document.body.appendChild(frame);
  }

  // Respaldo: JSONP, por compatibilidad con navegadores/redes donde el iframe no responda.
  function checkViaJsonp(){
    const cb='qr_'+Date.now()+'_'+Math.random().toString(36).slice(2);
    const s=document.createElement('script');
    let done=false;
    const timer=setTimeout(()=>{cleanup();if(!done)renderError('SIN RESPUESTA','No se pudo consultar Administración. Volvé a intentar.');},12000);
    function cleanup(){clearTimeout(timer);try{delete window[cb]}catch(_){window[cb]=undefined}if(s.parentNode)s.remove();}
    window[cb]=r=>{done=true;cleanup();render(r||{});};
    s.onerror=()=>{cleanup();if(!done)renderError('ERROR DE CONEXIÓN','No se pudo consultar Administración.');};
    const qs=new URLSearchParams({action:'status',callback:cb,code:code,c:code,v:'qr-2'});
    s.src=BACKEND+'?'+qs.toString();
    document.body.appendChild(s);
  }

  function renderError(title,msg){
    statusBox.className='status bad';
    statusBox.innerHTML='<div class="eyebrow">Control de acceso</div><h1>'+esc(title)+'</h1><p>'+esc(msg)+'</p>';
    body.innerHTML='<button class="refresh" onclick="location.reload()">Volver a verificar</button>';
  }
  function render(r){
    if(!r.ok||!r.registered){renderError('NO HABILITADO','No existe una reserva registrada con este código.');return;}
    const t=r.ticket||{};
    const paid=String(r.status||t.estado||'').toUpperCase().includes('ABONADO');
    const dates=(t.fechas||[]).map(x=>String(x.fecha||''));
    const validToday=dates.includes(today());
    let cls='bad',title='NO HABILITADO',sub='Pago no confirmado';
    if(paid&&validToday){cls='ok';title='HABILITADO';sub='Pago confirmado y entrada válida para hoy';}
    else if(paid&&!validToday){cls='warn';title='ABONADO';sub='Pago confirmado, pero la entrada no corresponde al día de hoy';}
    statusBox.className='status '+cls;
    statusBox.innerHTML='<div class="eyebrow">Control de acceso</div><h1>'+title+'</h1><p>'+sub+'</p>';
    const selected=String(t.temas||'').split(' | ').map(x=>x.trim()).filter(Boolean);
    const dateLines=(t.fechas||[]).map(x=>'<div class="row"><span>'+esc(x.fecha)+'</span><strong>'+esc(x.titulo||x.horario||'Entrada')+'</strong></div>').join('');
    const acts=selected.length?selected.map(x=>'<div class="activity"><span class="mark yes">✓</span><div><b>'+esc(x)+'</b><small>Inscripción registrada</small></div></div>').join(''):'<div class="activity"><span class="mark no">—</span><div><b>Sin talleres seleccionados</b><small>La entrada general sigue siendo válida si el pago está confirmado.</small></div></div>';
    body.innerHTML='<div class="code">'+esc(r.code||code)+'</div><div class="grid"><div class="box"><h2>Visitante / reserva</h2><div class="row"><span>Responsable</span><strong>'+esc(t.responsable||'')+'</strong></div><div class="row"><span>DNI</span><strong>'+esc(t.dni||t.institucion||'')+'</strong></div><div class="row"><span>Participantes</span><strong>'+esc(t.participantes||'')+'</strong></div></div><div class="box"><h2>Estado</h2><div class="row"><span>Pago</span><strong>'+esc(r.status||t.estado||'')+'</strong></div><div class="row"><span>Modalidad</span><strong>'+esc(t.modalidad||'')+'</strong></div><div class="row"><span>Hoy</span><strong>'+esc(today())+'</strong></div></div></div><div class="box" style="margin-top:10px"><h2>Días habilitados</h2>'+dateLines+'</div><div class="activities"><div class="box"><h2>Talleres y capacitaciones registrados</h2>'+acts+'</div></div><div class="note"><strong>Regla de acceso:</strong> si figura ABONADO, la entrada general está paga. La falta de inscripción previa a un taller no invalida el ingreso general; para incorporarse a una actividad no registrada debe consultarse disponibilidad.</div><button class="refresh" onclick="location.reload()">Actualizar estado</button>';
  }
  check();
})();