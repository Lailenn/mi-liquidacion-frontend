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
function stepVacations(){return `<div class="question-card" role="group" aria-labelledby="vacation-label">${questionHeader('vacation-label','¿Tomaste vacaciones durante este trabajo?','leaf')}${yesno('vacation')}</div>${data.vacation==='si'?`<div class="conditional" data-reveal="vacation-details"><div class="question-card" role="group" aria-labelledby="vacation-portion-label">${questionHeader('vacation-portion-label','¿Recibiste las vacaciones completas o solo una parte?','calendar','ELIGE EL PERÍODO')}<div class="choice-grid vacation-choices">${choice('vacationPortion','completas','Completas','Tomé los 15 días.')}${choice('vacationPortion','semana','Solo una semana','Tomé 7 días.')}${choice('vacationPortion','otros','Otra cantidad','Indicaré mis fechas.')}</div></div><div class="section-divider"></div><div class="section-label">${icon('calendar')}¿Cuándo fueron tus últimas vacaciones?</div><div class="fields">${field('vacStart','Primer día de vacaciones','date',`min="${escapeHTML(data.start)}" max="${escapeHTML(data.end)}"`)}${field('vacEnd','Último día de vacaciones','date',`min="${escapeHTML(data.start)}" max="${escapeHTML(data.end)}"`)}</div><p class="field-help">Al elegir 15 o 7 días, la fecha de fin se completa automáticamente. También puedes ajustar las fechas.</p><div id="vacation-balance">${vacationStats()}</div><div class="section-divider"></div><div class="field"><label class="question-field-label" for="vacationPayment">¿Recibiste el pago de esas vacaciones?</label><select id="vacationPayment" name="vacationPayment">${[['completo','Sí, recibí el pago completo'],['parcial','Solo recibí una parte del pago'],['pendiente','No, el pago está pendiente'],['nose','No estoy seguro/a']].map(([v,t])=>`<option value="${v}" ${data.vacationPayment===v?'selected':''}>${t}</option>`).join('')}</select><small class="field-help">Tomar los días de descanso y recibir su pago son datos diferentes.</small></div></div>`:`<div class="notice">${icon('calendar')}<div><strong>Vacaciones sin utilizar</strong>Se revisará la antigüedad desde ${dateLabel(data.start)} para determinar la prestación que corresponde.</div></div>`}`;}
function updateVacationView(){
 const box=document.querySelector('#vacation-balance');if(box)box.innerHTML=vacationStats();
 const end=document.querySelector('#vacEnd');if(end&&end.value!==data.vacEnd)end.value=data.vacEnd;
 document.querySelectorAll('[name="vacationPortion"]').forEach(el=>{el.checked=el.value===data.vacationPortion;el.closest('.choice')?.classList.toggle('checked',el.checked);});
}
function contributionPreview(){
 const salary=Math.max(0,Number(data.salary)||0),isss=Math.min(salary,LABOR_REFERENCE.isssMonthlyBaseCap)*LABOR_REFERENCE.isssRate,afp=salary*LABOR_REFERENCE.afpRate;
 return `<div class="contribution-title">Referencia de descuentos mensuales</div><div class="contribution-grid"><div><span>ISSS · 3%</span><strong>${money(isss)}</strong><small>Tope del trabajador: $30 por mes.<br>Base máxima: $1,000 mensuales.</small></div><div><span>AFP · 7.25%</span><strong>${money(afp)}</strong><small>Sin techo salarial de cotización.<br>Sobre el ingreso base cotizable.</small></div></div><p class="field-help">Ejemplo sobre tu salario mensual. Las deducciones de la liquidación requieren revisar qué conceptos cotizan y a qué mes pertenecen.</p>`;
}
