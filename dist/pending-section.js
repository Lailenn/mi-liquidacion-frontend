'use strict';

function noPendingControl(group,label){
 return `<label class="none-option"><input type="checkbox" data-none="${group}" ${data[group]?'':'checked'}><span>${label}</span></label>`;
}
function validEmploymentDate(value){
 const date=dateValue(value),start=dateValue(data.start),end=dateValue(data.end);
 return !!date&&!!start&&!!end&&date>=start&&date<=end;
}
function registerWorkedHoliday(value){
 data.workedHolidayDate=value;
 if(!validEmploymentDate(value))return {status:'invalid'};
 const holiday=holidayForDate(value);
 if(!holiday)return {status:'ordinary'};
 const exists=holidayRows.some(r=>r.date===value);
 if(!exists)holidayRows.push({id:nextId++,date:value,label:holiday.label,locality:holiday.locality||null});
 data.holiday=true;data.holidayYear=value.slice(0,4);
 return {status:exists?'existing':'added',holiday};
}
function workedHolidayInput(){
 const value=data.workedHolidayDate||'',holiday=holidayForDate(value),valid=validEmploymentDate(value);
 const selected=data.holiday&&holidayRows.some(r=>r.date===value);
 const message=!value?'Al ingresar una fecha, verás su nombre y se marcará en la lista.':!valid?'Elige una fecha dentro del período trabajado.':holiday?`${holiday.label} · ${selected?'Detectado y seleccionado.':'Detectado. Márcalo en la lista si está pendiente de pago.'}`:'Esta fecha no coincide con un asueto de la lista. Revisa la localidad si se trata de una fiesta patronal.';
 return `<div class="worked-date-box"><div class="field"><label for="worked-holiday-date">Agregar un asueto trabajado por fecha</label><input id="worked-holiday-date" type="date" value="${escapeHTML(value)}" min="${escapeHTML(data.start)}" max="${escapeHTML(data.end)}" aria-describedby="worked-date-help worked-date-status"><small id="worked-date-help" class="field-help">Indica un día completo trabajado y sin pagar. Ejemplo: 17 de junio → Día del Padre.</small></div><div id="worked-date-status" class="date-detection ${value&&!valid?'error':''}" role="status">${icon(holiday&&valid?'check':'info')}<span>${escapeHTML(message)}</span></div></div>`;
}
function overtimeHolidays(row){
 const dates=[row.date];
 if(splitHours(row)?.nextDay)dates.push(datePlusDays(row.date,1));
 return dates.map(holidayForDate).filter(Boolean);
}
function holidayDateNotice(value){
 const holiday=holidayForDate(value);
 return holiday?`<div class="detected-holiday">${icon('calendar')}<span>Asueto detectado: <strong>${escapeHTML(holiday.label)}</strong>. También lo encontrarás en la lista de asuetos.</span></div>`:'';
}
function validOvertimeRows(){return data.overtime?overtimeRows.filter(r=>!overtimeIssue(r)):[];}
function overtimeEstimate(){
 const hourly=hourlySalary();
 let dayHours=0,nightHours=0,dayPay=0,nightPay=0;
 const rows=validOvertimeRows().map(r=>{const p=overtimePay(r);dayHours+=p.day;nightHours+=p.night;dayPay+=p.dayPay;nightPay+=p.nightPay;return {...r,...p,specialDates:overtimeHolidays(r)};});
 return {rows,dayHours,nightHours,dayPay,nightPay,total:dayPay+nightPay,hourly};
}
function overtimeTable(){
 const result=overtimeEstimate(),rows=data.overtime?overtimeRows:[],invalid=rows.filter(overtimeIssue).length;
 return `<div class="record-count"><strong>${rows.length} ${rows.length===1?'registro':'registros'}</strong><span>Se actualizan al escribir · ${result.rows.length} ${result.rows.length===1?'válido':'válidos'}${invalid?` · ${invalid} por corregir`:''}</span></div><div class="table-scroll" tabindex="0" role="region" aria-label="Todos los registros de horas extras"><table class="pending-table"><thead><tr><th scope="col">Fecha</th><th scope="col">Inicio</th><th scope="col">Fin</th><th scope="col">Tipo</th><th scope="col">Horas</th><th scope="col">Pago</th><th scope="col">Estado</th></tr></thead><tbody>${rows.length?rows.map((r,i)=>{const h=splitHours(r),issue=overtimeIssue(r),estimated=result.rows.find(x=>x.id===r.id);return `<tr class="${issue?'invalid-row':''}"><td><small>Registro ${i+1}</small>${dateLabel(r.date)}${overtimeHolidays(r).map(d=>`<small class="holiday-detected">${escapeHTML(d.label)}</small>`).join('')}</td><td>${escapeHTML(r.start)||'—'}</td><td>${escapeHTML(r.end)||'—'}${h?.nextDay?'<small>+1 día</small>':''}</td><td>${h?`<span class="type-pill ${h.day&&h.night?'mixed':h.night?'night':'day'}">${h.day&&h.night?'Mixta':h.night?'Nocturna':'Diurna'}</span>`:'Por completar'}</td><td>${h?hours(h.total):'—'}</td><td>${estimated?money(estimated.pay):'No incluido'}</td><td>${issue?`<button type="button" class="row-error-link" data-error-field="${issue.field}" data-error-step="4" aria-label="Corregir registro ${i+1}: ${escapeHTML(issue.message)}">${icon('info')}Corregir<small>${escapeHTML(issue.message)}</small></button>`:'<span class="valid-status">Listo</span>'}</td></tr>`;}).join(''):'<tr><td colspan="7" class="table-empty">Agrega una jornada para comenzar.</td></tr>'}</tbody></table></div><div class="pending-total"><span>Total de horas extras <small>${hours(result.dayHours+result.nightHours)} horas válidas${invalid?' · Los registros con errores todavía no se suman.':''}</small></span><strong>${money(result.total)}</strong></div><p class="field-help">Los registros permanecen mientras esta página está abierta. Agregar registro conserva los anteriores; eliminar retira ese registro y actualiza el total.</p>${result.rows.some(r=>r.specialHours)?`<div class="notice">${icon('info')}<div><strong>Hay horas extras en asueto o descanso semanal</strong>Esas horas se calculan sobre el salario extraordinario del día: × 2 en asueto (Art. 192) y × 1.5 en descanso semanal (Art. 175). Es un recargo adicional al pago del día.</div></div>`:''}<p class="field-help">Diurnas: 6:00 a. m.–7:00 p. m. · Nocturnas: 7:00 p. m.–6:00 a. m.</p><details class="calculation-details" open><summary>Ver cómo se calcula el pago${icon('down')}</summary><p>Hora ordinaria: ${money(monthlySalary())} ÷ 30 ÷ 8 = ${money(result.hourly)}.</p><p>Hora extra diurna: hora ordinaria × 2 (recargo del 100%). Hora extra nocturna: hora ordinaria × 2 × 1.25 (100% más 25% de nocturnidad).</p><p>Si la hora extra cae en asueto, la hora ordinaria se duplica primero; si cae en tu descanso semanal, se multiplica por 1.5. Los topes de indemnización o renuncia no se aplican a las horas extras.</p><a href="${LABOR_REFERENCE.sources.overtime}" target="_blank" rel="noopener noreferrer">Referencia del Ministerio de Trabajo</a></details>`;
}
function holidayName(row){
 if(row.label)return row.label;
 return holidayCalendar(Number(row.date?.slice(0,4)),data.workplace).find(h=>h.date===row.date)?.label||'Asueto local';
}
function selectedHolidays(){
 return data.holiday?[...new Map(holidayRows.filter(r=>validEmploymentDate(r.date)).map(r=>[r.date,r])).values()].sort((a,b)=>a.date.localeCompare(b.date)):[];
}
function holidayEstimate(){return specialDaysCalc().holidayPay;}
function restSummary(){
 const s=specialDaysCalc();
 return `<div class="pending-total"><span>Descansos trabajados <small>${s.restOrdinary.length} × ${money(s.daily)} × 1.5${s.restHolidays.length?` + ${s.restHolidays.length} en asueto × ${money(s.daily)} × 2`:''}</small></span><strong>${money(s.restPay)}</strong></div>${s.compensatoryDays?`<div class="notice">${icon('calendar')}<div><strong>Te corresponden ${s.compensatoryDays} ${s.compensatoryDays===1?'día':'días'} de descanso compensatorio</strong>Además del recargo del 50%, por cada descanso semanal trabajado la empresa debe darte otro día de descanso remunerado (Art. 175).</div></div>`:''}${s.restHolidays.length?`<div class="notice amber">${icon('info')}<div><strong>Descanso que coincide con asueto</strong>Se paga solo como asueto: salario diario × 2 (100%), no × 2.5. También genera día compensatorio (Art. 194).</div></div>`:''}<p class="field-help">El descanso semanal es un día completo de 24 horas. Darte solo unas horas libres entre turnos no cuenta como descanso.</p>`;
}
function restDateNotice(value){
 const d=dateValue(value);if(!d)return '';
 const holiday=holidayForDate(value),weekday=WEEKDAYS[d.getUTCDay()];
 return `${holiday?`<div class="detected-holiday">${icon('calendar')}<span>Coincide con asueto: <strong>${escapeHTML(holiday.label)}</strong>. Se paga × 2, no × 2.5.</span></div>`:''}${weekday!==(data.restDay||'Domingo')?`<small class="field-help">Es ${weekday.toLowerCase()}; tu descanso habitual es ${escapeHTML((data.restDay||'Domingo').toLowerCase())}. Regístralo si ese día te correspondía descansar.</small>`:''}`;
}
function holidayChecklist(){
 const startYear=dateValue(data.start)?.getUTCFullYear()||2026,endYear=dateValue(data.end)?.getUTCFullYear()||2026;
 const lower=Math.max(1950,Math.min(startYear,endYear)),upper=Math.min(2100,Math.max(startYear,endYear));
 let year=Number(data.holidayYear)||upper;
 if(year<lower||year>upper)year=upper;
 const years=Array.from({length:upper-lower+1},(_,i)=>upper-i);
 const calendar=holidayCalendar(year,data.workplace);
 const selected=selectedHolidays();
 return `${workedHolidayInput()}<div class="holiday-toolbar"><div class="field"><label for="holidayYear">Año del asueto</label><select id="holidayYear" name="holidayYear">${years.map(y=>`<option value="${y}" ${year===y?'selected':''}>${y}</option>`).join('')}</select></div><div class="field"><span class="field-label">Localidad${tip('Según la indicación de clase, solo se incluye la fiesta patronal de San Miguel (21 de noviembre), además de los asuetos nacionales del Art. 190.')}</span><p class="fixed-value">San Miguel</p></div></div><div class="holiday-grid">${calendar.map(h=>{const checked=data.holiday&&holidayRows.some(r=>r.date===h.date),available=validEmploymentDate(h.date);return `<label class="holiday-option ${checked?'selected':''} ${!available?'unavailable':''}"><input type="checkbox" id="holiday-date-${h.date}" data-holiday-date="${h.date}" ${checked?'checked':''} ${!available&&!checked?'disabled':''}><span><strong>${dateLabel(h.date,true)}</strong><span>${h.label}</span>${h.local?'<small class="local-badge">Asueto local</small>':''}${!available?'<small>Fuera de tu período de trabajo</small>':''}</span></label>`;}).join('')}</div><p class="field-help">Semana Santa (jueves, viernes y sábado) se elige día por día. Asueto: día remunerado que normalmente no se trabaja; si lo trabajaste, se paga salario diario × 2.</p><div class="holiday-selection"><div class="selection-title">${icon('calendar')} ${selected.length} ${selected.length===1?'día seleccionado':'días seleccionados'}${holidayRows.some(r=>!validEmploymentDate(r.date))?'<span class="invalid-selection">Revisa las fechas fuera de período</span>':''}</div>${data.holiday&&holidayRows.length?`<div class="selected-dates">${holidayRows.slice().sort((a,b)=>a.date.localeCompare(b.date)).map(r=>`<button type="button" id="holiday-selected-${r.id}" data-remove="holiday" data-id="${r.id}" class="selected-date" aria-label="Quitar ${escapeHTML(holidayName(r))}, ${dateLabel(r.date)}">${dateLabel(r.date,true)} ${icon('x')}</button>`).join('')}</div>`:'<p class="field-help">Marca los días que trabajaste y aún no te han pagado.</p>'}</div><div class="pending-total"><span>Asuetos trabajados <small>${specialDaysCalc().holidays.length} × ${money(dailySalary())} × 2 (salario + recargo del 100%)</small></span><strong>${money(holidayEstimate())}</strong></div><p class="field-help">Si un asueto también era tu descanso semanal, regístralo en descansos: se paga una sola vez × 2 y genera día compensatorio.</p>`;
}
function legalCapsContent(compact=false){
 const reference=LABOR_REFERENCE.minimumMonthly[data.sector];
 return `<section class="legal-caps ${compact?'compact':''}" aria-label="Topes y reglas de referencia"><div class="caps-heading">${icon('shield')}<h3>Topes y reglas del cálculo</h3><span class="example-chip">REFERENCIA</span></div><div class="caps-grid"><div class="cap-rule"><span>Indemnización por despido</span><strong>4 × salario mínimo diario</strong><small>Tope de la base salarial · Art. 58 CT. No limita el total acumulado de la prestación.</small></div><div class="cap-rule"><span>Prestación por renuncia</span><strong>2 × salario mínimo diario</strong><small>Del sector correspondiente · Art. 8. Requiere al menos 2 años y preaviso válido.</small></div><div class="cap-rule"><span>ISSS del trabajador</span><strong>3% · máximo $30 al mes</strong><small>Sobre remuneración cotizable, con base mensual máxima de $1,000.</small></div><div class="cap-rule"><span>AFP del trabajador</span><strong>7.25% · sin techo salarial</strong><small>Sobre ingreso base de cotización. No comparte el límite de $1,000 del ISSS.</small></div></div><p class="caps-note">Los descuentos requieren identificar la remuneración cotizable y su mes. No se aplican automáticamente a todo el monto de la liquidación.</p>${compact?'':`<details class="calculation-details"><summary>Salario de referencia y fuentes${icon('down')}</summary><p>${reference?`Referencia mensual de ${escapeHTML(data.sector)}: <strong>${money(reference)}</strong>, publicada para el período desde el 1 de junio de 2025.`:'Este sector requiere identificar su tarifa específica.'} La tarifa diaria legal debe consultarse en el decreto del sector para calcular los topes; no se sustituye automáticamente por la tarifa mensual dividida entre 30.</p><p>En la transcripción de clase aparece $418.80 para comercio y servicios. La publicación del MTPS indica $408.80; el dato de clase queda pendiente de confirmación.</p><div class="legal-source-links"><a href="${LABOR_REFERENCE.sources.minimum}" target="_blank" rel="noopener noreferrer">Salario mínimo · MTPS</a><a href="${LABOR_REFERENCE.sources.dismissal}" target="_blank" rel="noopener noreferrer">Indemnización · art. 58</a><a href="${LABOR_REFERENCE.sources.resignation}" target="_blank" rel="noopener noreferrer">Renuncia · art. 8</a><a href="${LABOR_REFERENCE.sources.isss}" target="_blank" rel="noopener noreferrer">Tope ISSS</a><a href="${LABOR_REFERENCE.sources.afp}" target="_blank" rel="noopener noreferrer">AFP · tasas y límites</a></div></details>`}</section>`;
}
function stepPending(){
 return `<section class="question-box question-card" role="group" aria-labelledby="overtime-label"><div class="question-heading"><div>${questionHeader('overtime-label','¿Tienes horas extras pendientes de pago?','clock')}<p>Agrega las jornadas que todavía no te han pagado. Elige la hora en las listas.${tip('Horas extras: las que trabajaste después de tu jornada ordinaria. Registra solo las que no te pagaron.')}</p></div>${yesno('overtime')}</div>${data.overtime?`<div class="pending-body" data-reveal="overtime-details">${overtimeRows.map(overtimeEntry).join('')||'<div class="empty-hint">Todavía no hay jornadas registradas.</div>'}<button class="text-button" type="button" data-add="overtime" id="add-overtime">${icon('plus')}Agregar registro</button><div id="overtime-detail">${overtimeTable()}</div></div>`:'<div class="empty-hint">Sin horas extras pendientes.</div>'}</section><section class="question-box question-card" role="group" aria-labelledby="holiday-label"><div class="question-heading"><div>${questionHeader('holiday-label','¿Tienes días de asueto trabajados y sin pagar?','calendar')}<p>Selecciona los días o ingresa una fecha para detectarlos.</p></div>${yesno('holiday')}</div>${data.holiday?`<div class="pending-body" data-reveal="holiday-details">${holidayChecklist()}</div>`:'<div class="empty-hint">Selecciona Sí para consultar y registrar los asuetos.</div>'}</section><section class="question-box question-card" role="group" aria-labelledby="rest-label"><div class="question-heading"><div>${questionHeader('rest-label','¿Trabajaste en tu descanso semanal y falta el pago?','sun')}<p>Incluye solo los días que aún no te pagaron.${tip('Si trabajaste tu día de descanso, se paga salario diario × 1.5 y te deben dar otro día de descanso (compensatorio).')}</p></div>${yesno('rest')}</div>${data.rest?`<div class="pending-body" data-reveal="rest-details">${dateEntries('rest')}<button class="text-button" type="button" data-add="rest" id="add-rest">${icon('plus')}Agregar día de descanso</button><div id="rest-summary">${restSummary()}</div></div>`:'<div class="empty-hint">Sin descansos semanales pendientes.</div>'}</section>${legalCapsContent()}`;
}
function bindPendingEvents(){
 document.querySelector('#worked-holiday-date')?.addEventListener('change',el=>{registerWorkedHoliday(el.target.value);shell();document.querySelector('#worked-holiday-date')?.focus({preventScroll:true});});
 document.querySelectorAll('[data-none]').forEach(el=>el.addEventListener('change',()=>{const group=el.dataset.none;data[group]=!el.checked;if(el.checked&&group==='holiday'){holidayRows=[];data.workedHolidayDate='';}shell();document.querySelector(`[data-none="${group}"]`)?.focus({preventScroll:true});}));
 document.querySelectorAll('[data-holiday-date]').forEach(el=>el.addEventListener('change',()=>{
  const date=el.dataset.holidayDate;
  if(el.checked){if(!validEmploymentDate(date))return;const holiday=holidayCalendar(Number(date.slice(0,4)),data.workplace).find(h=>h.date===date);if(!holidayRows.some(r=>r.date===date))holidayRows.push({id:nextId++,date,label:holiday.label,locality:holiday.locality||null});data.holiday=true;}
  else{holidayRows=holidayRows.filter(r=>r.date!==date);data.holiday=holidayRows.length>0;}
  shell();document.querySelector(`[data-holiday-date="${date}"]`)?.focus({preventScroll:true});
 }));
 document.querySelector('#add-local-holiday')?.addEventListener('click',()=>{
  const input=document.querySelector('#custom-holiday'),date=input.value;
  if(!validEmploymentDate(date)){showError('Selecciona una fecha de asueto local dentro del período trabajado.','custom-holiday');return;}
  if(holidayRows.some(r=>r.date===date)){notify('Esa fecha ya está seleccionada.');return;}
  holidayRows.push({id:nextId++,date,label:'Fiesta patronal local',locality:'Otra localidad'});data.holiday=true;shell();
 });
}
