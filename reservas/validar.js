'use strict';
(()=>{
  const BACKEND='https://script.google.com/macros/s/AKfycbzktEKSf2IhLeYb79s2uSBRWvo-cSBcRQq3lDi4bmGgVfK4WVNwpYg1QAho3PyS23XK/exec';
  const code=(new URLSearchParams(location.search).get('c')||'').trim();
  const statusBox=document.getElementById('status');
  const body=document.getElementById('body');

  if(!code){
    statusBox.className='status bad';
    statusBox.innerHTML='<div class="eyebrow">Control de acceso</div><h1>QR INVÁLIDO</h1><p>Falta el código de reserva.</p>';
    body.innerHTML='';
    return;
  }

  const target=BACKEND+'?'+new URLSearchParams({action:'validar_qr',code:code}).toString();
  location.replace(target);
})();