'use strict';
(()=>{
  const BACKEND='https://script.google.com/macros/s/AKfycbyEmstX5x1ombFsYu57hqB9dvbcbGvbpld4-mvhY0FPq8y_K0vb-m_SZYK5sXY-y8bW/exec';
  const code=new URLSearchParams(location.search).get('c')||'';
  const statusBox=document.getElementById('status');
  const body=document.getElementById('body');

  if(!code){
    statusBox.className='status bad';
    statusBox.innerHTML='<div class="eyebrow">Control de acceso</div><h1>QR INVÁLIDO</h1><p>Falta el código de reserva.</p>';
    body.innerHTML='';
    return;
  }

  const target=BACKEND+'?'+new URLSearchParams({action:'validar_qr',c:code,code:code}).toString();
  location.replace(target);
})();