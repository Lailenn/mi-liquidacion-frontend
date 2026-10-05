'use strict';

function datePlusDays(value,days){const d=dateValue(value);if(!d)return '';d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10);}
function syncVacationDates(changed){
 if(changed==='vacationPortion'||changed==='vacStart'){
  const days=data.vacationPortion==='completas'?15:data.vacationPortion==='semana'?7:null;
  if(days&&dateValue(data.vacStart))data.vacEnd=datePlusDays(data.vacStart,days-1);
 }else if(changed==='vacEnd'){
  const days=vacationDays();data.vacationPortion=days===15?'completas':days===7?'semana':'otros';
 }
}
function vacationBalance(){return {used:vacationDays(),remaining:Math.max(0,15-vacationDays())};}
function vacationStats(){const balance=vacationBalance();return `<div class="vacation-stats"><div><span>Días que tomaste</span><strong>${balance.used}<small>de 15 días</small></strong></div><div><span>Pendientes de ese período</span><strong>${balance.remaining}<small>${balance.remaining===1?'día':'días'}</small></strong></div></div><p class="field-help">Se cuentan ambos días del calendario. El saldo corresponde a este período, no a todas las vacaciones de la relación laboral.</p>`;}
function stepVacations(){return `<div class="question-card" role="group" aria-labelledby="vacation-label">${questionHeader('vacation-label','¿Tomaste vacaciones durante este trabajo?','leaf')}${yesno('vacation')}</div>${data.vacation==='si'?`<div class="conditional" data-reveal="vacation-details"><div class="question-card" role="group" aria-labelledby="vacation-portion-label">${questionHeader('vacation-portion-label','¿Recibiste las vacaciones completas o solo una parte?','calendar','ELIGE EL PERÍODO')}<div class="choice-grid vacation-choices">${choice('vacationPortion','completas','Completas','Tomé los 15 días.')}${choice('vacationPortion','semana','Solo una semana','Tomé 7 días.')}${choice('vacationPortion','otros','Otra cantidad','Indicaré mis fechas.')}</div></div><div class="section-divider"></div><div class="section-label">${icon('calendar')}¿Cuándo fueron tus últimas vacaciones?</div><div class="fields">${field('vacStart','Primer día de vacaciones','date',`min="${escapeHTML(data.start)}" max="${escapeHTML(data.end)}"`)}${field('vacEnd','Último día de vacaciones','date',`min="${escapeHTML(data.start)}" max="${escapeHTML(data.end)}"`)}</div><p class="field-help">Al elegir 15 o 7 días, la fecha de fin se completa automáticamente contando días consecutivos. También puedes ajustar las fechas.</p><div id="vacation-start-check">${vacationStartNotice()}</div><div id="vacation-balance">${vacationStats()}</div><div class="section-divider"></div><div class="field"><label class="question-field-label" for="vacationPayment">¿Recibiste el pago de esas vacaciones?</label><select id="vacationPayment" name="vacationPayment">${[['completo','Sí, recibí el pago completo'],['parcial','Solo recibí una parte del pago'],['pendiente','No, el pago está pendiente'],['nose','No estoy seguro/a']].map(([v,t])=>`<option value="${v}" ${data.vacationPayment===v?'selected':''}>${t}</option>`).join('')}</select><small class="field-help">Tomar los días de descanso y recibir su pago son datos diferentes.</small></div>${data.vacationPayment==='parcial'?`<div class="fields" data-reveal="vacation-partial">${field('vacationPaidAmount',`Monto que recibiste (USD)${tip('Se resta de la vacación completa del período para obtener lo pendiente.')}`,'number','min="0.01" step="0.01" inputmode="decimal"')}</div>`:''}</div>`:`<div class="notice">${icon('calendar')}<div><strong>Vacaciones sin utilizar</strong>Las vacaciones no se acumulan ni se cambian por dinero. Se calcula la vacación proporcional del período en curso.</div></div>`}<div class="section-divider"></div><div id="vacation-calc">${vacationPreview()}</div>`;}
function vacationPreview(){
 const v=vacationCalc();
 return `<div class="calc-box"><div class="calc-head">${icon('leaf')}<strong>Vacación proporcional: ${money(v.proportional)}</strong></div><ul><li>Salario diario: ${money(monthlySalary())} ÷ 30 = ${money(v.daily)}</li><li>Vacación completa: ${money(v.daily)} × 15 días × 1.30 (recargo del 30%) = <b>${money(v.full)}</b></li><li>Período en curso: desde ${dateLabel(v.periodStart)} · ${Math.min(v.periodDays,365)} días trabajados</li><li>Proporcional: ${money(v.full)} × ${Math.min(v.periodDays,365)} ÷ 365 = <b>${money(v.proportional)}</b></li>${v.previous?`<li>Período anterior pendiente de pago: <b>${money(v.previous)}</b></li>`:''}</ul><p class="field-help">Derecho a vacación completa: 1 año continuo con el mismo patrono y al menos 200 días laborados. Los 15 días son consecutivos: los asuetos y descansos dentro del período sí se cuentan, pero la vacación no puede iniciar en tu día de descanso (${escapeHTML(data.restDay||'Domingo')}) ni en un asueto.</p></div>`;
}
// Regla de clase: la vacación no puede iniciar en el día de descanso semanal ni en un asueto.
function vacationStartIssue(){
 const d=dateValue(data.vacStart);if(!d)return '';
 const holiday=holidayForDate(data.vacStart);
 if(holiday)return `El ${dateLabel(data.vacStart)} es asueto (${holiday.label}). La vacación debe iniciar el día hábil siguiente.`;
 if(WEEKDAYS[d.getUTCDay()]===(data.restDay||'Domingo'))return `El ${dateLabel(data.vacStart)} es ${WEEKDAYS[d.getUTCDay()].toLowerCase()}, tu día de descanso. La vacación debe iniciar el día hábil siguiente.`;
 return '';
}
function vacationStartNotice(){const issue=vacationStartIssue();return issue?`<div class="notice amber">${icon('info')}<div><strong>Revisa el inicio de las vacaciones</strong>${escapeHTML(issue)}</div></div>`:'';}
function updateVacationView(){
 const box=document.querySelector('#vacation-balance');if(box)box.innerHTML=vacationStats();
 const check=document.querySelector('#vacation-start-check');if(check)check.innerHTML=vacationStartNotice();
 const end=document.querySelector('#vacEnd');if(end&&end.value!==data.vacEnd)end.value=data.vacEnd;
 document.querySelectorAll('[name="vacationPortion"]').forEach(el=>{el.checked=el.value===data.vacationPortion;el.closest('.choice')?.classList.toggle('checked',el.checked);});
}
function contributionPreview(){
 const salary=Math.max(0,Number(data.salary)||0),isss=Math.min(salary,LABOR_REFERENCE.isssMonthlyBaseCap)*LABOR_REFERENCE.isssRate,afp=salary*LABOR_REFERENCE.afpRate;
 return `<div class="contribution-title">Referencia de descuentos mensuales</div><div class="contribution-grid"><div><span>ISSS · 3%</span><strong>${money(isss)}</strong><small>Tope del trabajador: $30 por mes.<br>Base máxima: $1,000 mensuales.</small></div><div><span>AFP · 7.25%</span><strong>${money(afp)}</strong><small>Sin techo salarial de cotización.<br>Sobre el ingreso base cotizable.</small></div></div><p class="field-help">Ejemplo sobre tu salario mensual. Las deducciones de la liquidación requieren revisar qué conceptos cotizan y a qué mes pertenecen.</p>`;
}
