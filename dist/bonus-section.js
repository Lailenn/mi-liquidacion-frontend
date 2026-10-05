'use strict';

const BONUS_SOURCE='https://asamblea.gob.sv/node/14127';
function completedYears(start,end){
 let years=end.getUTCFullYear()-start.getUTCFullYear();
 if(end.getUTCMonth()<start.getUTCMonth()||(end.getUTCMonth()===start.getUTCMonth()&&end.getUTCDate()<start.getUTCDate()))years--;
 return Math.max(0,years);
}
function bonusEstimate(){
 const start=dateValue(data.start),end=dateValue(data.end),salary=Number(data.salary);
 if(!start||!end||end<start||!Number.isFinite(salary)||salary<=0)return {valid:false,amount:0,pending:0,paid:0,label:'Datos por completar'};
 const year=end.getUTCFullYear(),reference=dateValue(`${year}-12-12`),cycleStart=dateValue(`${year-1}-12-12`),cycleEnd=new Date(reference.getTime()-DAY);
 const windowStart=`${year}-${year>=2026?'10-01':year===2025?'10-20':'12-12'}`;
 const tierDate=end<reference?end:reference,years=completedYears(start,tierDate),salaryDays=years>=10?21:years>=3?19:15;
 const annualAmount=salary/30*salaryDays;
 const from=start>cycleStart?start:cycleStart,to=end<cycleEnd?end:cycleEnd;
 const cycleDays=Math.round((reference-cycleStart)/DAY),workedDays=Math.max(0,Math.round((to-from)/DAY)+1);
 const canRecognizeEarly=end>=dateValue(windowStart)&&end<reference&&completedYears(start,end)>=1;
 const recognizedEarly=canRecognizeEarly&&data.bonusFullRecognized==='si';
 const full=(end>=reference&&start<=cycleStart)||recognizedEarly;
 const amount=Math.round((full?annualAmount:annualAmount*Math.min(1,workedDays/cycleDays))*100)/100;
 const paid=data.bonusPaid==='si'?Math.max(0,Number(data.bonusPaidAmount)||0):0;
 const pending=Math.max(0,Math.round((amount-paid)*100)/100);
 const label=full?'Aguinaldo completo':'Aguinaldo proporcional';
 let reason=recognizedEarly?'La empresa reconoció el aguinaldo completo anticipadamente, según tu respuesta.':full?'El período anual de referencia está completo.':end<dateValue(windowStart)?'La terminación ocurre antes del período de pago. Se estima la parte del ciclo anual trabajada.':end<reference?'La terminación ocurre antes del 12 de diciembre. Entrar al período de pago no convierte automáticamente el aguinaldo en completo.':'No se completó el período anual de referencia. Se estima la parte trabajada.';
 return {valid:true,year,reference:reference.toISOString().slice(0,10),windowStart,cycleDays,workedDays,from:from.toISOString().slice(0,10),to:to.toISOString().slice(0,10),salaryDays,annualAmount,canRecognizeEarly,recognizedEarly,full,label,reason,amount,paid,pending};
}
function bonusResult(){
 const b=bonusEstimate();
 if(!b.valid)return `<div class="notice amber">${icon('info')}<div>Completa las fechas de trabajo y el salario para revisar el aguinaldo.</div></div>`;
 return `<div class="bonus-result"><div class="bonus-result-head"><span>${icon('calendar')}${b.label}</span><span class="example-chip">ESTIMACIÓN</span></div><p>${b.reason}</p><div class="bonus-amounts"><div><span>Importe estimado</span><strong>${money(b.amount)}</strong></div><div><span>Ya recibido</span><strong>${money(b.paid)}</strong></div><div><span>Pendiente</span><strong>${money(b.pending)}</strong></div></div>${b.paid>b.amount?'<p class="field-help">El pago registrado supera la estimación. El saldo pendiente se muestra en cero; revisa el importe recibido.</p>':''}<details class="calculation-details"><summary>Detalle de la estimación${icon('down')}</summary><p>Referencia anual: ${b.salaryDays} días de salario = ${money(b.annualAmount)}. ${b.full?'Se utiliza el importe anual completo.':`Período considerado: ${dateLabel(b.from)} al ${dateLabel(b.to)} (${b.workedDays} de ${b.cycleDays} días del ciclo).`}</p><p>Escala de referencia: 15 días con menos de 3 años; 19 días de 3 a menos de 10 años; 21 días desde los 10 años. Si no se cumple el período anual, se aplica la proporción correspondiente.</p></details></div>`;
}
function stepBonus(){
 const b=bonusEstimate();
 return `<div class="bonus-calendar"><span class="calendar-symbol">${icon('calendar')}</span><div><strong>Pago desde el 1 de octubre hasta el 20 de diciembre</strong><p>Reforma aprobada en septiembre de 2026. El 12 de diciembre se conserva como referencia del cálculo proporcional.</p><a href="${BONUS_SOURCE}" target="_blank" rel="noopener noreferrer">Consultar la reforma</a></div></div>${b.valid&&b.year<2026?'<p class="field-help">La fecha ingresada corresponde a un año anterior a esta reforma; la referencia del período de pago se ajusta al año seleccionado.</p>':''}<div class="section-divider"></div>${b.canRecognizeEarly?`<div class="question-box question-card bonus-recognition" role="group" aria-labelledby="bonus-recognition-label">${questionHeader('bonus-recognition-label','¿La empresa reconoció el aguinaldo completo anticipado?','coins')}<p class="field-help">Marca Sí solo si la empresa lo reconoció completo. La fecha de octubre por sí sola no lo acredita.</p>${yesno('bonusFullRecognized')}</div>`:''}<div class="question-box question-card" role="group" aria-labelledby="bonus-paid-label">${questionHeader('bonus-paid-label','¿Ya recibiste algún pago de aguinaldo de este año?','coins')}${yesno('bonusPaid')}${data.bonusPaid==='si'?`<div class="fields conditional" data-reveal="bonus-payment">${field('bonusPaidAmount','Monto recibido (USD)','number','min="0.01" step="0.01" inputmode="decimal"')}${field('bonusPaidDate','Fecha en que lo recibiste','date',`min="${b.valid?b.year+'-01-01':escapeHTML(data.start)}" max="${escapeHTML(data.end)}"`)}</div><p class="field-help">Este importe se resta de la estimación para evitar cobrarlo dos veces.</p>`:''}</div><div id="bonus-result">${bonusResult()}</div><p class="field-help bonus-scope">Referencia para despido sin causa y renuncia voluntaria. El cálculo definitivo debe validar los requisitos del caso y la norma aplicable.</p>`;
}
function monthlyContributions(){
 const salary=Math.max(0,Number(data.salary)||0),isss=Math.round(Math.min(salary,LABOR_REFERENCE.isssMonthlyBaseCap)*LABOR_REFERENCE.isssRate*100)/100,afp=Math.round(salary*LABOR_REFERENCE.afpRate*100)/100;
 return {salary,isss,afp,net:Math.round((salary-isss-afp)*100)/100};
}
function sidebarContributions(){
 const c=monthlyContributions();
 return `<div class="snapshot-contributions"><div class="snapshot-row"><span>ISSS · 3% <small>Tope: $30 / mes</small></span><strong>−${money(c.isss)}</strong></div><div class="snapshot-row"><span>AFP · 7.25% <small>Sin techo salarial</small></span><strong>−${money(c.afp)}</strong></div><div class="snapshot-monthly-net"><span>Salario después de ISSS y AFP</span><strong>${money(c.net)}</strong><small>Referencia mensual · antes de ISR</small></div></div>`;
}
