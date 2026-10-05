'use strict';

function yesno(name){
 const value=typeof data[name]==='boolean'?(data[name]?'si':'no'):data[name];
 return `<div class="yes-no" role="group" aria-label="Selecciona Sí o No">${[['si','Sí'],['no','No']].map(([v,t])=>`<label class="yes-no-option ${value===v?'selected':''}"><input type="radio" id="${name}-${v}" name="${name}" value="${v}" ${value===v?'checked':''}><span>${icon(v==='si'?'check':'x')}${t}</span></label>`).join('')}</div>`;
}
function overtimeIssue(row){
 const target={step:4};
 if(!validEmploymentDate(row.date))return {...target,field:`ot-date-${row.id}`,message:'La fecha debe estar dentro del período trabajado.'};
 if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(row.start||''))return {...target,field:`ot-start-${row.id}`,message:'Completa una hora de inicio válida.'};
 if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(row.end||''))return {...target,field:`ot-end-${row.id}`,message:'Completa una hora de fin válida.'};
 const h=splitHours(row);
 if(!h)return {...target,field:`ot-end-${row.id}`,message:'La hora de fin debe ser diferente de la hora de inicio.'};
 if(h.nextDay&&dateValue(datePlusDays(row.date,1))>dateValue(data.end))return {...target,field:`ot-end-${row.id}`,message:`Termina el ${dateLabel(datePlusDays(row.date,1))}, después de la finalización del trabajo. Corrige la fecha o la hora de fin.`};
 return null;
}
function focusErrorField(field,step){
 if(Number.isInteger(step)&&step!==currentStep)navigate(step,{focus:false});
 const el=document.getElementById(field);
 if(!el)return;
 el.setAttribute('aria-invalid','true');
 el.scrollIntoView({behavior:window.matchMedia?.('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'center'});
 el.focus({preventScroll:true});
 el.classList.remove('field-highlight');
 void el.offsetWidth;
 el.classList.add('field-highlight');
 setTimeout(()=>el.classList.remove('field-highlight'),1600);
}
function showError(message,fieldName,step=currentStep){
 const e=document.querySelector('#form-error');
 e.innerHTML=`${icon('info')}<div><strong>Revisa este dato</strong>${fieldName?`<button type="button" class="error-link" data-error-field="${escapeHTML(fieldName)}" data-error-step="${step}">${escapeHTML(message)}<span>Ir al campo para corregirlo</span></button>`:`<p>${escapeHTML(message)}</p>`}</div>`;
 e.hidden=false;
 if(fieldName)document.getElementById(fieldName)?.setAttribute('aria-invalid','true');
 e.scrollIntoView({behavior:'smooth',block:'center'});
}
function collectErrors(step){
 const errors=[],a=dateValue(data.start),b=dateValue(data.end);
 const add=(message,field)=>errors.push({message,field,step});
 if(step===0){
  if(!a||a.getUTCFullYear()<1950||a.getUTCFullYear()>2100)add('Selecciona una fecha de inicio válida.','start');
  if(!b||b.getUTCFullYear()<1950||b.getUTCFullYear()>2100)add('Selecciona una fecha de finalización válida.','end');
  if(a&&b&&b<a)add('La fecha de finalización debe ser igual o posterior al inicio.','end');
  const today=dateValue(todayValue());
  if(a&&a>today)add('La fecha de inicio no puede ser futura.','start');
  if(b&&b>today)add(`La fecha de finalización no puede ser posterior a hoy (${dateLabel(todayValue())}).`,'end');
  if(!Number.isFinite(Number(data.salary))||Number(data.salary)<=0||Number(data.salary)>1000000)add('Escribe un salario mayor que $0 y menor o igual a $1,000,000.','salary');
 }
 if(step===1&&data.termination==='renuncia'&&data.notice==='si'&&!validEmploymentDate(data.noticeDate))add('La fecha del preaviso debe estar dentro del período trabajado.','noticeDate');
 if(step===2&&data.vacation==='si'){
  if(!validEmploymentDate(data.vacStart))add('El primer día de vacaciones debe estar dentro del período trabajado.','vacStart');
  else if(vacationStartIssue())add(vacationStartIssue(),'vacStart');
  if(data.vacationPayment==='parcial'&&!(Number(data.vacationPaidAmount)>0))add('Indica el monto que recibiste por las vacaciones.','vacationPaidAmount');
  if(!validEmploymentDate(data.vacEnd)||dateValue(data.vacEnd)<dateValue(data.vacStart))add('Revisa el último día de vacaciones: debe ser posterior al inicio y estar dentro del período trabajado.','vacEnd');
 }
 if(step===3&&data.bonusPaid==='si'){
  if(!Number.isFinite(Number(data.bonusPaidAmount))||Number(data.bonusPaidAmount)<=0||Number(data.bonusPaidAmount)>1000000)add('Indica un monto recibido mayor que cero y menor o igual a $1,000,000.','bonusPaidAmount');
  if(!validEmploymentDate(data.bonusPaidDate)||data.bonusPaidDate.slice(0,4)!==data.end.slice(0,4))add('El pago debe corresponder al año de terminación y al período trabajado.','bonusPaidDate');
 }
 if(step===4){
  for(const group of ['overtime','holiday','rest']){
   if(!data[group])continue;
   const rows=rowsFor(group),seen=new Set();
   if(!rows.length)add('Agrega al menos un registro o selecciona No.',`${group}-si`);
   for(const r of rows){
    if(group==='overtime'){const issue=overtimeIssue(r);if(issue)errors.push(issue);continue;}
    const field=group==='holiday'?`holiday-selected-${r.id}`:`rest-${r.id}`;
    if(!validEmploymentDate(r.date))add('La fecha registrada está fuera del período trabajado.',field);
    else if(seen.has(r.date))add('Esta fecha está repetida. Elimina el registro duplicado.',field);
    seen.add(r.date);
   }
  }
 }
 return errors;
}
function validate(){const issue=collectErrors(currentStep)[0];if(issue){showError(issue.message,issue.field,issue.step);return false;}return true;}
function allFormErrors(){return [0,1,2,3,4].flatMap(collectErrors);}
function summaryErrors(){
 const errors=allFormErrors();
 return errors.length?`<div class="summary-errors" role="alert"><strong>${errors.length} ${errors.length===1?'dato por corregir':'datos por corregir'}</strong><p>Puedes abrir cada aviso para ir directamente al campo.</p><ul>${errors.map(e=>`<li><button type="button" class="error-link" data-error-field="${escapeHTML(e.field)}" data-error-step="${e.step}">${escapeHTML(e.message)}<span>${steps[e.step].name}</span></button></li>`).join('')}</ul></div>`:'';
}
function stepSummary(){
 return `${summaryErrors()}<div class="example-note">${icon('info')}<div><strong>Cálculo con tus datos.</strong> Cada concepto muestra su base legal y la fórmula usada, con los topes legales aplicados. ISSS y AFP se descuentan solo de los conceptos salariales; el ISR está pendiente de cálculo.</div></div><div class="results-header"><h3>Datos del comprobante</h3><button type="button" class="text-button" data-step="0">Editar</button></div>${identity()}<div class="results-header"><h3>Prestaciones y descuentos</h3><span class="example-chip">CON FÓRMULAS</span></div>${breakdown()}<div class="summary-bonus"><strong>${bonusEstimate().label}</strong><p>${bonusEstimate().reason||'Completa los datos de trabajo.'}</p><button type="button" class="text-button" data-step="3">Revisar aguinaldo</button></div>${legalCapsContent()}<details class="legal-details"><summary>Formato del comprobante${icon('down')}</summary><p>Incluye los datos de las partes, prestaciones con base legal, deducciones, monto en letras, declaración, firmas y advertencia del modelo proporcionado.</p></details>`;
}
