'use strict';

// Selector de hora: un botón abre un panel con pestañas por momento del día y botones cada media hora.
const TIME_PERIODS=[
 {id:'manana',name:'Mañana',kind:'Diurna',icon:'sun',from:6,to:12},
 {id:'tarde',name:'Tarde',kind:'Diurna',icon:'sun',from:12,to:19},
 {id:'noche',name:'Noche',kind:'Nocturna',icon:'moon',from:19,to:24},
 {id:'madrugada',name:'Madrugada',kind:'Nocturna',icon:'moon',from:0,to:6}
];
function timeLabel(value){if(!/^\d{2}:\d{2}$/.test(value||''))return '—';const h=Number(value.slice(0,2)),m=value.slice(3);return `${h%12||12}:${m} ${h<12?'a. m.':'p. m.'}`;}
function periodFor(value){const h=Number((value||'').slice(0,2));return /^\d{2}:/.test(value||'')?TIME_PERIODS.find(p=>h>=p.from&&h<p.to):null;}
function timeSlots(period){return Array.from({length:(period.to-period.from)*2},(_,i)=>`${String(period.from+Math.floor(i/2)).padStart(2,'0')}:${i%2?'30':'00'}`);}
function timeChips(period,value){
 return `<p class="time-kind">${icon(period.icon)}Horas ${period.kind.toLowerCase()}s · ${timeLabel(timeSlots(period)[0])} a ${timeLabel(`${String(period.to%24).padStart(2,'0')}:00`)}</p><div class="time-grid">${timeSlots(period).map(v=>`<button type="button" class="time-chip ${v===value?'is-selected':''}" data-time="${v}" aria-pressed="${v===value}">${timeLabel(v)}</button>`).join('')}</div>`;
}
function timeField(row,key,label){
 const id=`ot-${key}-${row.id}`,value=row[key]||'',period=periodFor(value)||TIME_PERIODS[key==='start'?1:2];
 return `<div class="field time-field ${key==='end'?'align-end':''}"><label for="${id}">${label}</label><button type="button" id="${id}" class="time-trigger ${value?'':'is-empty'}" data-time-row="${row.id}" data-time-key="${key}" aria-haspopup="dialog" aria-expanded="false">${icon('clock')}<span>${value?timeLabel(value):'Elige la hora'}</span>${icon('down')}</button><div class="time-pop" role="dialog" aria-label="Elegir ${label.toLowerCase()}" hidden><div class="time-tabs" role="tablist">${TIME_PERIODS.map(p=>`<button type="button" role="tab" class="time-tab ${p===period?'is-active':''}" data-period="${p.id}" aria-selected="${p===period}">${p.name}</button>`).join('')}</div><div class="time-body">${timeChips(period,value)}</div></div></div>`;
}
function closeTimePickers(except){document.querySelectorAll('.time-field').forEach(f=>{if(f===except)return;const pop=f.querySelector('.time-pop');if(pop&&!pop.hidden){pop.hidden=true;f.querySelector('.time-trigger').setAttribute('aria-expanded','false');}});}
function bindTimePickers(){
 document.querySelectorAll('.time-field').forEach(field=>{
  const trigger=field.querySelector('.time-trigger'),pop=field.querySelector('.time-pop');
  const row=()=>overtimeRows.find(r=>r.id===Number(trigger.dataset.timeRow));
  trigger.addEventListener('click',()=>{const open=pop.hidden;closeTimePickers(field);pop.hidden=!open;trigger.setAttribute('aria-expanded',String(open));if(open)(pop.querySelector('.time-chip.is-selected')||pop.querySelector('.time-tab.is-active'))?.focus({preventScroll:true});});
  pop.addEventListener('click',e=>{
   const tab=e.target.closest('[data-period]');
   if(tab){const period=TIME_PERIODS.find(p=>p.id===tab.dataset.period);pop.querySelectorAll('.time-tab').forEach(t=>{const on=t===tab;t.classList.toggle('is-active',on);t.setAttribute('aria-selected',String(on));});pop.querySelector('.time-body').innerHTML=timeChips(period,row()?.[trigger.dataset.timeKey]);return;}
   const chip=e.target.closest('[data-time]');if(!chip)return;
   const r=row();if(!r)return;
   r[trigger.dataset.timeKey]=chip.dataset.time;
   trigger.classList.remove('is-empty');trigger.removeAttribute('aria-invalid');trigger.querySelector('span').textContent=timeLabel(chip.dataset.time);
   pop.hidden=true;trigger.setAttribute('aria-expanded','false');trigger.focus({preventScroll:true});
   document.querySelector(`#ot-meta-${r.id}`).innerHTML=overtimeMeta(r);
   const error=document.querySelector('#form-error');if(error)error.hidden=true;
   updateAside();
  });
  pop.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();pop.hidden=true;trigger.setAttribute('aria-expanded','false');trigger.focus({preventScroll:true});}});
 });
}
document.addEventListener('click',e=>{if(!e.target.closest('.time-field'))closeTimePickers();});
