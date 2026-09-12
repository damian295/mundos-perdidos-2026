'use strict';
(()=>{
  const BACKEND='https://script.google.com/macros/s/AKfycbzktEKSf2IhLeYb79s2uSBRWvo-cSBcRQq3lDi4bmGgVfK4WVNwpYg1QAho3PyS23XK/exec';
  const code=new URLSearchParams(location.search).get('c')||'';
  const statusBox=document.getElementById('status');
  const body=document.getElementById('body');
  const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Argentina/Buenos_Aires',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  function check(){
    if(!code){renderError('QR inválido','Falta el código de reserva.');return;}
    const cb='qr_'+Date.now()+'_'+Math.random().toString(36).slice(2);
    const s=document.createElement('script');
    const timer=setTimeout(()=>{cleanup();renderError('SIN RESPUESTA','No se pudo consultar Administración. Volvé a intentar.');},12000);
    function cleanup(){clearTimeout(timer);try{delete window[cb]}catch(_){window[cb]=undefined}if(s.parentNode)s.remove();}
    window[cb]=r=>{cleanup();render(r||{});};
    s.onerror=()=>{cleanup();renderError('ERROR DE CONEXIÓN','No se pudo consultar Administración.');};
    const qs=new URLSearchParams({action:'status',callback:cb,code:code,c:code,v:'qr-1'});
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