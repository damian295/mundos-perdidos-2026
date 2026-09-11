'use strict';

const SETTINGS={testMode:true,version:'0.1.0'};
const PRICES={weekday:{single:4000,group:12000},weekend:{single:7000,group:20000},full:{single:30000,group:80000}};
const DAYS=[
 {date:'2026-09-26',label:'Sábado 26',kind:'weekend',theme:'Apertura · El río como sistema',highlights:'Inauguración · El río como sistema · Observación astronómica'},
 {date:'2026-09-27',label:'Domingo 27',kind:'weekend',theme:'Río conocido · Arte, tierra y paisaje',highlights:'Pioneros aventureros del Río · Origen de la Tierra · Arte en vivo'},
 {date:'2026-09-28',label:'Lunes 28',kind:'weekday',theme:'Río conocido · Miradas y recorridos',highlights:'Talleres · Historia de San Nicolás · Recorrido por la muestra'},
 {date:'2026-09-29',label:'Martes 29',kind:'weekday',theme:'Río desconocido · Paleontología y biogeografía',highlights:'Talleres · Paleoarte regional · Mastodonte de Sánchez'},
 {date:'2026-09-30',label:'Miércoles 30',kind:'weekday',theme:'Río conocido y desconocido · Biodiversidad',highlights:'Capacitación docente · Micromundos · Aves de San Nicolás'},
 {date:'2026-10-01',label:'Jueves 1',kind:'weekday',theme:'Río conocido · Arte, patrimonio y educación',highlights:'Capacitación docente · Pintura del río · Arqueólogos por un día'},
 {date:'2026-10-02',label:'Viernes 2',kind:'weekday',theme:'Río legendario · Paisaje, fauna y memoria',highlights:'Carpincho Blanco · Taller para infancias · Música'},
 {date:'2026-10-03',label:'Sábado 3',kind:'weekend',theme:'Río futuro · Fauna, clima y conservación',highlights:'Capacitación docente · Serpientes · Ciervo de los Pantanos · Aguará Guazú'},
 {date:'2026-10-04',label:'Domingo 4',kind:'weekend',theme:'Río futuro · Gestión, conservación y cierre',highlights:'Vía navegable · Reservas urbanas · Áreas protegidas · Peña de cierre'}
];
const ACTIVITIES=[
 {id:'peces-28',date:'2026-09-28',time:'17:30',type:'Taller de arte',title:'Peces en su tinta',capacity:null,remaining:null},
 {id:'foto-28',date:'2026-09-28',time:'18:30',type:'Taller para infancias',title:'Taller de Fotografía de Naturaleza · Mundos Escondidos',capacity:null,remaining:null,limited:true},
 {id:'peces-29',date:'2026-09-29',time:'17:30',type:'Taller de arte',title:'Peces en su tinta',capacity:null,remaining:null},
 {id:'biogeo-29',date:'2026-09-29',time:'18:30',type:'Taller para infancias',title:'¡Cada cual en su lugar! · La Biogeografía',capacity:null,remaining:null,limited:true},
 {id:'docencia-30',date:'2026-09-30',time:'Horario de formación',type:'Capacitación docente',title:'¿Para qué sirve la ciencia?',capacity:null,remaining:null,limited:true},
 {id:'peces-30',date:'2026-09-30',time:'17:30',type:'Taller de arte',title:'Peces en su tinta',capacity:null,remaining:null},
 {id:'micro-30',date:'2026-09-30',time:'18:30',type:'Taller para infancias',title:'Taller Micromundos II · El mundo microscópico',capacity:null,remaining:null,limited:true},
 {id:'docencia-01',date:'2026-10-01',time:'Horario de formación',type:'Capacitación docente',title:'¿Cómo abordar la problemática ambiental situada?',capacity:null,remaining:null,limited:true},
 {id:'peces-01',date:'2026-10-01',time:'17:30',type:'Taller de arte',title:'Peces en su tinta',capacity:null,remaining:null},
 {id:'pintura-01',date:'2026-10-01',time:'18:00',type:'Taller con reserva obligatoria',title:'Pintura del río',capacity:null,remaining:null,limited:true},
 {id:'arqueo-01',date:'2026-10-01',time:'19:00',type:'Taller',title:'Arqueólogos por un día',capacity:null,remaining:null},
 {id:'docencia-02',date:'2026-10-02',time:'Horario de formación',type:'Capacitación docente',title:'Leer, escribir, enseñar y aprender desde la narrativa',capacity:null,remaining:null,limited:true},
 {id:'prehistoria-02',date:'2026-10-02',time:'18:30',type:'Taller para infancias',title:'Piedra, papel o tijera: animales prehistóricos',capacity:null,remaining:null,limited:true},
 {id:'docencia-03',date:'2026-10-03',time:'Mañana',type:'Capacitación docente · CIIE',title:'Capacitación docente · Evangelina Romano',capacity:null,remaining:null,limited:true}
];

const state={mode:'days',paid:1,free:0,selected:new Set(),activityQty:{}};
const $=id=>document.getElementById(id);
const money=n=>new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS',maximumFractionDigits:0}).format(Number(n||0));
const dayByDate=date=>DAYS.find(d=>d.date===date);
const selectedDates=()=>state.mode==='full'?DAYS.map(d=>d.date):DAYS.filter(d=>state.selected.has(d.date)).map(d=>d.date);

function bundlePrice(q,price){
 q=Math.max(0,Math.floor(Number(q)||0));
 if(!q)return{cost:0,parts:[]};
 const options=[{size:1,cost:price.single,label:'individual'},{size:3,cost:price.group,label:'grupo de 3'},{size:4,cost:price.group,label:'grupo de 4'}];
 const dp=Array(q+1).fill(null);dp[0]={cost:0,parts:[]};
 for(let i=1;i<=q;i++) for(const o of options){if(i>=o.size&&dp[i-o.size]){const candidate={cost:dp[i-o.size].cost+o.cost,parts:[...dp[i-o.size].parts,o]};if(!dp[i]||candidate.cost<dp[i].cost||(candidate.cost===dp[i].cost&&candidate.parts.length<dp[i].parts.length))dp[i]=candidate;}}
 return dp[q];
}
function calculatePrice(){
 if(state.mode==='full'){
  const best=bundlePrice(state.paid,PRICES.full),base=state.paid*PRICES.full.single;
  return{total:best.cost,base,saving:Math.max(0,base-best.cost),description:'Pase completo'};
 }
 const dates=selectedDates();let total=0,base=0;
 dates.forEach(date=>{const d=dayByDate(date),p=d.kind==='weekend'?PRICES.weekend:PRICES.weekday;total+=bundlePrice(state.paid,p).cost;base+=state.paid*p.single;});
 if(dates.length===DAYS.length){const full=bundlePrice(state.paid,PRICES.full);if(full.cost<total)return{total:full.cost,base,saving:Math.max(0,base-full.cost),description:'Pase completo aplicado automáticamente'};}
 return{total,base,saving:Math.max(0,base-total),description:`${dates.length} jornada${dates.length===1?'':'s'}`};
}
function maxPlacesForActivity(a){
 const attendees=state.paid+state.free;
 if(Number.isFinite(a.remaining))return Math.max(0,Math.min(attendees,a.remaining));
 return attendees;
}
function pruneActivities(){const dates=new Set(selectedDates());Object.keys(state.activityQty).forEach(id=>{const a=ACTIVITIES.find(x=>x.id===id);if(!a||!dates.has(a.date))delete state.activityQty[id];else state.activityQty[id]=Math.min(state.activityQty[id],maxPlacesForActivity(a));});}

function renderDays(){
 const host=$('daysGrid');host.innerHTML=DAYS.map(d=>{const selected=state.selected.has(d.date);const p=d.kind==='weekend'?PRICES.weekend:PRICES.weekday;const group=bundlePrice(state.paid,p);return `<button type="button" class="day-card ${selected?'selected':''}" data-date="${d.date}" aria-pressed="${selected}"><div class="day-top"><time>${d.label}</time><span class="day-price">${money(p.single)}</span></div><h4>${d.theme}</h4><p>${d.highlights}</p><p style="margin-top:9px;color:#315a50"><strong>Tu grupo: ${money(group.cost)}</strong></p><span class="check">✓</span></button>`}).join('');
 host.querySelectorAll('.day-card').forEach(btn=>btn.addEventListener('click',()=>{const date=btn.dataset.date;if(state.selected.has(date))state.selected.delete(date);else state.selected.add(date);pruneActivities();renderAll();}));
 $('selectedDaysBadge').textContent=`${state.selected.size} seleccionada${state.selected.size===1?'':'s'}`;
}
function renderActivities(){
 const dates=new Set(selectedDates());const list=ACTIVITIES.filter(a=>dates.has(a.date));const section=$('activitiesSection');
 if(!dates.size){section.classList.add('hidden');$('buyerSection').classList.add('hidden');return;}
 section.classList.remove('hidden');$('buyerSection').classList.remove('hidden');
 $('activitiesList').innerHTML=list.length?list.map(a=>{const q=Number(state.activityQty[a.id]||0),d=dayByDate(a.date);const quota=Number.isFinite(a.remaining)?`${a.remaining} lugares disponibles`:'Cupo a definir';return `<article class="activity-row"><div><h4>${a.title}</h4><div class="activity-meta"><span>${d.label}</span><span>· ${a.time}</span><span>· ${a.type}</span><span class="quota ${Number.isFinite(a.remaining)?'':'pending'}">${quota}</span></div></div><div class="activity-counter"><button type="button" data-activity="${a.id}" data-delta="-1" aria-label="Quitar lugar">−</button><output>${q}</output><button type="button" data-activity="${a.id}" data-delta="1" aria-label="Agregar lugar">+</button></div></article>`}).join(''):'<p>No hay actividades con cupo para las fechas elegidas.</p>';
 $('activitiesList').querySelectorAll('[data-activity]').forEach(btn=>btn.addEventListener('click',()=>{const a=ACTIVITIES.find(x=>x.id===btn.dataset.activity),delta=Number(btn.dataset.delta),current=Number(state.activityQty[a.id]||0),max=maxPlacesForActivity(a);state.activityQty[a.id]=Math.max(0,Math.min(max,current+delta));renderActivities();renderSummary();}));
}
function renderSummary(){
 const dates=selectedDates(),price=calculatePrice();$('summaryMode').textContent=state.mode==='full'?'Pase completo · 9 días':'Elegir mis días';$('summaryPaid').textContent=state.paid;$('summaryFree').textContent=state.free;$('summaryTotal').textContent=money(price.total);
 $('summaryDates').classList.toggle('muted',!dates.length);$('summaryDates').innerHTML=dates.length?dates.map(date=>`<span>${dayByDate(date).label}</span>`).join(''):'Todavía no elegiste días.';
 const chosen=ACTIVITIES.filter(a=>Number(state.activityQty[a.id]||0)>0&&dates.includes(a.date));const block=$('summaryActivitiesBlock');block.classList.toggle('hidden',!chosen.length);$('summaryActivities').innerHTML=chosen.map(a=>`<span>${a.title} · ${state.activityQty[a.id]} lugar${state.activityQty[a.id]===1?'':'es'}</span>`).join('');
 const note=$('discountNote');if(price.saving>0){note.classList.remove('hidden');note.textContent=`Ahorro aplicado automáticamente: ${money(price.saving)}.`;}else note.classList.add('hidden');
}
function renderMode(){document.querySelectorAll('.mode-card').forEach(btn=>{const active=btn.dataset.mode===state.mode;btn.classList.toggle('active',active);btn.setAttribute('aria-pressed',String(active));});$('daysSection').classList.toggle('hidden',state.mode==='full');if(state.mode==='full')pruneActivities();}
function renderPeople(){$('paidPeople').textContent=state.paid;$('freePeople').textContent=state.free;pruneActivities();}
function renderAll(){renderMode();renderPeople();renderDays();renderActivities();renderSummary();}

function reservationCode(){return `MUN-TEST-${Date.now().toString(36).slice(-5).toUpperCase()}-${Math.random().toString(36).slice(2,5).toUpperCase()}`;}
function selectedActivitiesPayload(){return ACTIVITIES.filter(a=>Number(state.activityQty[a.id]||0)>0).map(a=>({id:a.id,fecha:a.date,horario:a.time,titulo:a.title,participantes:Number(state.activityQty[a.id])}));}
function collectData(){const price=calculatePrice(),dates=selectedDates();return{programa:'Mundos Perdidos 2026',programa_id:'mundos',modalidad:state.mode==='full'?'Pase completo':'Días particulares',fechas:dates,participantes:state.paid+state.free,adultos:state.paid,menores:state.free,precio_estimado:price.total,actividades:selectedActivitiesPayload(),responsable:$('responsible').value.trim(),dni:$('dni').value.trim(),email:$('email').value.trim(),telefono:$('phone').value.trim(),ciudad:$('city').value.trim(),accesibilidad:$('notes').value.trim(),codigo_reserva:reservationCode(),estado:'PRUEBA · PENDIENTE',timestamp:new Date().toISOString()};}
function validateForm(){if(!selectedDates().length)return'Elegí al menos una jornada.';if(!$('responsible').value.trim())return'Ingresá el nombre del responsable.';if(!/^\d{6,10}$/.test($('dni').value.replace(/\D/g,'')))return'Revisá el DNI del responsable.';if(!/^\S+@\S+\.\S+$/.test($('email').value.trim()))return'Revisá el correo electrónico.';if(!$('phone').value.trim())return'Ingresá un número de WhatsApp.';if(!$('city').value.trim())return'Ingresá la ciudad.';if(!$('terms').checked)return'Confirmá que revisaste la selección.';return'';}
function renderTicket(data){const dates=data.fechas.map(date=>dayByDate(date).label).join(' · '),acts=data.actividades.map(a=>`${a.titulo} (${a.participantes})`).join('<br>')||'Sin actividades con cupo seleccionadas';$('ticketCard').innerHTML=`<div class="ticket-head"><div><p class="mini-label" style="color:#9b4f1b">Museo de Ciencias Naturales A. Scasso</p><h2 style="margin:0;color:#18342e">Pre-reserva · versión de prueba</h2><span class="ticket-code">${data.codigo_reserva}</span></div><img src="../assets/logo_museo.jpg" alt="Museo Scasso"></div><div class="ticket-grid"><div class="ticket-details"><div><strong>Responsable:</strong> ${escapeHtml(data.responsable)}</div><div><strong>Modalidad:</strong> ${data.modalidad}</div><div><strong>Participantes:</strong> ${data.adultos} con entrada + ${data.menores} menores de 3</div><div><strong>Fechas:</strong> ${dates}</div><div><strong>Actividades reservadas:</strong><br>${acts}</div><div><strong>Total estimado:</strong> ${money(data.precio_estimado)}</div></div><div class="ticket-qr"><div style="text-align:center;color:#6f6257;font-weight:800"><div style="font-size:2.4rem">▦</div>QR definitivo<br><small>se habilitará al confirmar ABONADO</small></div></div></div><div class="ticket-note"><strong>Prueba segura:</strong> este comprobante no fue enviado ni registrado. En la versión final, la pre-reserva llegará por correo y el QR permitirá verificar el estado del pago para el ingreso.</div>`;$('ticketSection').classList.remove('hidden');$('ticketSection').scrollIntoView({behavior:'smooth',block:'start'});}
function escapeHtml(text){return String(text||'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}

document.querySelectorAll('.mode-card').forEach(btn=>btn.addEventListener('click',()=>{state.mode=btn.dataset.mode;if(state.mode==='full')DAYS.forEach(d=>state.selected.add(d.date));else state.selected.clear();state.activityQty={};renderAll();}));
document.querySelectorAll('[data-counter]').forEach(btn=>btn.addEventListener('click',()=>{const delta=Number(btn.dataset.delta);if(btn.dataset.counter==='paid')state.paid=Math.max(1,Math.min(20,state.paid+delta));else state.free=Math.max(0,Math.min(20,state.free+delta));renderAll();}));
$('reservationForm').addEventListener('submit',ev=>{ev.preventDefault();const error=validateForm(),message=$('formMessage');if(error){message.className='form-message error';message.textContent=error;return;}const data=collectData();message.className='form-message success';message.textContent='Prueba correcta: la selección puede convertirse en una pre-reserva. No se escribió nada en la planilla.';renderTicket(data);});

renderAll();