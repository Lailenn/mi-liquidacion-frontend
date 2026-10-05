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
// Escritura manual: acepta 5, 5:15, 515 o 17:15. De 1 a 12 se usa a. m. / p. m.; de 13 a 23 se toma como hora de 24 h.
function parseManualTime(text,ampm){
 const match=String(text||'').replace(/\s+/g,'').match(/^(\d{1,2})(?::?(\d{2}))?$/);
 if(!match)return null;
 let h=Number(match[1]);const m=Number(match[2]||0);
 if(m>59||h>23)return null;
 if(h>=1&&h<=12)h=ampm==='pm'?h%12+12:h%12;
 return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
}
function manualTimeEntry(id,value){
 const h=Number((value||'').slice(0,2)),pm=value?h>=12:true,shown=value?`${h%12||12}:${value.slice(3)}`:'';
 return `<div class="time-manual"><label for="${id}-manual">O escríbela</label><div class="time-manual-row"><input id="${id}-manual" class="time-manual-input" type="text" inputmode="numeric" autocomplete="off" maxlength="5" placeholder="Ej. 5:15" value="${shown}"><div class="time-ampm" role="group" aria-label="a. m. o p. m."><button type="button" data-ampm="am" aria-pressed="${!pm}" class="${pm?'':'is-active'}">a. m.</button><button type="button" data-ampm="pm" aria-pressed="${pm}" class="${pm?'is-active':''}">p. m.</button></div><button type="button" class="time-apply">Usar</button></div><small class="time-manual-error" role="alert" hidden>Escribe una hora válida, por ejemplo 5:15 o 17:15.</small></div>`;
}
function timeField(row,key,label){
 const id=`ot-${key}-${row.id}`,value=row[key]||'',period=periodFor(value)||TIME_PERIODS[key==='start'?1:2];
 return `<div class="field time-field ${key==='end'?'align-end':''}"><label for="${id}">${label}</label><button type="button" id="${id}" class="time-trigger ${value?'':'is-empty'}" data-time-row="${row.id}" data-time-key="${key}" aria-haspopup="dialog" aria-expanded="false">${icon('clock')}<span>${value?timeLabel(value):'Elige la hora'}</span>${icon('down')}</button><div class="time-pop" role="dialog" aria-label="Elegir ${label.toLowerCase()}" hidden><div class="time-tabs" role="tablist">${TIME_PERIODS.map(p=>`<button type="button" role="tab" class="time-tab ${p===period?'is-active':''}" data-period="${p.id}" aria-selected="${p===period}">${p.name}</button>`).join('')}</div><div class="time-body">${timeChips(period,value)}</div>${manualTimeEntry(id,value)}</div></div>`;
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
   const ampm=e.target.closest('[data-ampm]');
   if(ampm){pop.querySelectorAll('[data-ampm]').forEach(b=>{const on=b===ampm;b.classList.toggle('is-active',on);b.setAttribute('aria-pressed',String(on));});pop.querySelector('.time-manual-input').focus();return;}
   if(e.target.closest('.time-apply')){applyManual();return;}
   const chip=e.target.closest('[data-time]');if(chip)setTime(chip.dataset.time);
  });
  const setTime=(value)=>{
   const r=row();if(!r)return;
   r[trigger.dataset.timeKey]=value;
   trigger.classList.remove('is-empty');trigger.removeAttribute('aria-invalid');trigger.querySelector('span').textContent=timeLabel(value);
   pop.hidden=true;trigger.setAttribute('aria-expanded','false');trigger.focus({preventScroll:true});
   document.querySelector(`#ot-meta-${r.id}`).innerHTML=overtimeMeta(r);
   const error=document.querySelector('#form-error');if(error)error.hidden=true;
   updateAside();
  };
  const applyManual=()=>{
   const input=pop.querySelector('.time-manual-input'),ampm=pop.querySelector('[data-ampm].is-active')?.dataset.ampm||'pm';
   const value=parseManualTime(input.value,ampm),error=pop.querySelector('.time-manual-error');
   error.hidden=!!value;
   if(value){input.removeAttribute('aria-invalid');setTime(value);}else{input.setAttribute('aria-invalid','true');input.focus();}
  };
  pop.querySelector('.time-manual-input').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();applyManual();}});
  pop.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();pop.hidden=true;trigger.setAttribute('aria-expanded','false');trigger.focus({preventScroll:true});}});
 });
}
document.addEventListener('click',e=>{if(!e.target.closest('.time-field'))closeTimePickers();});
