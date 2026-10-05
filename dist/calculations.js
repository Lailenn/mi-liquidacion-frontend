'use strict';

// Fórmulas de la liquidación (Código de Trabajo de El Salvador, criterio de clase).
// Constantes: el mes se divide siempre entre 30 y el año proporcional entre 365.
const DAYS_PER_MONTH=30,DAYS_PER_YEAR=365,ORDINARY_HOURS=8;
const round2=(v)=>Math.round((Number(v)||0)*100)/100;

// Fecha actual en El Salvador. El calendario no permite fechas posteriores.
function todayValue(){return new Intl.DateTimeFormat('en-CA',{timeZone:'America/El_Salvador'}).format(new Date());}
function addYears(value,years){const d=dateValue(value);if(!d)return '';const month=d.getUTCMonth();d.setUTCFullYear(d.getUTCFullYear()+years);if(d.getUTCMonth()!==month)d.setUTCDate(0);return d.toISOString().slice(0,10);}
function inclusiveDays(from,to){const a=dateValue(from),b=dateValue(to);return a&&b&&b>=a?Math.round((b-a)/DAY)+1:0;}

// Salario básico: mensual ÷ 30 = diario (SBD); diario ÷ 8 = hora ordinaria.
function monthlySalary(){return Math.max(0,Number(data.salary)||0);}
function dailySalary(){return monthlySalary()/DAYS_PER_MONTH;}
function hourlySalary(){return dailySalary()/ORDINARY_HOURS;}
function minimumMonthly(){return LABOR_REFERENCE.minimumMonthly[data.sector]??LABOR_REFERENCE.minimumMonthly['Comercio y servicios'];}
function minimumDaily(){return minimumMonthly()/DAYS_PER_MONTH;}

// Antigüedad: años completos + días del año en curso ÷ 365 (incluye el día de finalización).
function serviceYears(){
 const a=dateValue(data.start),b=dateValue(data.end);if(!a||!b||b<a)return {full:0,days:0,total:0,anniversary:data.start};
 const full=completedYears(a,b),anniversary=addYears(data.start,full),days=inclusiveDays(anniversary,data.end);
 return {full,days,total:full+days/DAYS_PER_YEAR,anniversary};
}

// Indemnización por despido injustificado (Art. 58): 30 días de salario por año y proporcional por fracción.
// Tope: la base no puede superar 4 salarios mínimos diarios (× 30 al mes). Mínimo: 15 días de salario.
function dismissalCalc(){
 const salary=monthlySalary(),capDaily=minimumDaily()*LABOR_REFERENCE.dismissalDailyCapFactor,cap=capDaily*DAYS_PER_MONTH;
 const base=Math.min(salary,cap),service=serviceYears(),byYears=base*service.total,minimum=base/DAYS_PER_MONTH*LABOR_REFERENCE.dismissalMinimumDays;
 const appliedMinimum=byYears<minimum;
 return {salary,capDaily,cap,base,capped:salary>cap,service,minimum:round2(minimum),appliedMinimum,amount:round2(appliedMinimum?minimum:byYears)};
}

// Prestación por renuncia voluntaria: 15 días de salario por año de servicio.
// Tope: base máxima de 2 salarios mínimos diarios. Requiere 2 años y preaviso escrito de 15 días.
function resignationCalc(){
 const salary=monthlySalary(),capDaily=minimumDaily()*LABOR_REFERENCE.resignationDailyCapFactor,cap=capDaily*DAYS_PER_MONTH;
 const base=Math.min(salary,cap),service=serviceYears(),noticeDays=data.notice==='si'?inclusiveDays(data.noticeDate,data.end)-1:0;
 const reasons=[];
 if(service.full<LABOR_REFERENCE.resignationMinimumYears)reasons.push('Se requieren al menos 2 años de servicio.');
 if(data.notice!=='si')reasons.push('Se requiere preaviso por escrito.');
 else if(noticeDays<15)reasons.push('El preaviso debe darse con 15 días de anticipación como mínimo.');
 const eligible=!reasons.length;
 return {salary,capDaily,cap,base,capped:salary>cap,service,noticeDays,eligible,reasons,amount:eligible?round2(base/DAYS_PER_MONTH*15*service.total):0};
}

// Vacaciones (Arts. 177 y 187): 15 días de salario + 30% de recargo.
// Proporcional: vacación completa × días trabajados del período en curso ÷ 365. No se acumulan períodos.
function vacationCalc(){
 const daily=dailySalary(),full=daily*15*1.30,service=serviceYears();
 const periodStart=service.full>=1?service.anniversary:data.start,periodDays=inclusiveDays(periodStart,data.end);
 const proportional=full*Math.min(periodDays,DAYS_PER_YEAR)/DAYS_PER_YEAR;
 let previous=0;
 if(data.vacation==='si'&&service.full>=1){
  if(data.vacationPayment==='pendiente')previous=full;
  else if(data.vacationPayment==='parcial')previous=Math.max(0,full-(Number(data.vacationPaidAmount)||0));
 }
 return {daily,full:round2(full),periodStart,periodDays,proportional:round2(proportional),previous:round2(previous),years:service.full};
}

// Horas extras (Arts. 168, 169, 192 y 175): hora ordinaria × 2 (diurna) o × 2 × 1.25 (nocturna).
// En asueto la base es el salario extraordinario (× 2); en descanso semanal, × 1.5.
function overtimePay(row){
 const h=splitHours(row);if(!h)return null;
 const toMinutes=s=>Number(s.slice(0,2))*60+Number(s.slice(3));
 const start=toMinutes(row.start),end=toMinutes(row.end)+(h.nextDay?1440:0);
 const restDates=new Set(data.rest?restRows.map(r=>r.date):[]);
 const factorFor=date=>holidayForDate(date)?2:restDates.has(date)?1.5:1;
 const factors=[factorFor(row.date),factorFor(datePlusDays(row.date,1))];
 let dayUnits=0,nightUnits=0,specialMinutes=0;
 for(let t=start;t<end;t++){
  const m=t%1440,factor=factors[t<1440?0:1];
  if(factor>1)specialMinutes++;
  if(m>=360&&m<1140)dayUnits+=factor;else nightUnits+=factor;
 }
 const hourly=hourlySalary(),dayPay=dayUnits/60*hourly*2,nightPay=nightUnits/60*hourly*2*1.25;
 return {...h,dayPay,nightPay,pay:dayPay+nightPay,specialHours:specialMinutes/60};
}

// Asueto trabajado (Arts. 190 y 192): salario básico diario × 2 por cada día.
// Descanso semanal trabajado (Art. 175): salario básico diario × 1.5 más un día compensatorio.
// Si el descanso coincide con un asueto (Art. 194) se paga solo como asueto (× 2, no × 2.5) y también genera compensatorio.
function specialDaysCalc(){
 const daily=dailySalary(),restDates=data.rest?[...new Set(restRows.filter(r=>validEmploymentDate(r.date)).map(r=>r.date))]:[];
 const restHolidays=restDates.filter(d=>holidayForDate(d)),restOrdinary=restDates.filter(d=>!holidayForDate(d));
 const holidays=selectedHolidays().filter(r=>!restDates.includes(r.date));
 const holidayPay=holidays.length*daily*2,restPay=restOrdinary.length*daily*1.5+restHolidays.length*daily*2;
 return {daily,holidays,holidayPay:round2(holidayPay),restOrdinary,restHolidays,restPay:round2(restPay),compensatoryDays:restDates.length};
}

// Deducciones: ISSS 3% con base máxima de $1,000 (máx. $30) y AFP 7.25% sin techo.
// Solo se aplican a conceptos salariales. Aguinaldo, indemnización y prestación por renuncia no cotizan.
function deductionsFor(salaryBase){
 const isss=round2(Math.min(salaryBase,LABOR_REFERENCE.isssMonthlyBaseCap)*LABOR_REFERENCE.isssRate),afp=round2(salaryBase*LABOR_REFERENCE.afpRate);
 return {base:round2(salaryBase),isss,afp};
}

function liquidationRows(){
 const rows=[];
 if(data.termination==='despido'){const d=dismissalCalc();rows.push({label:'Indemnización por despido',base:'Art. 58 CT',formula:`${money(d.base)}${d.capped?' (tope)':''} × ${d.service.total.toFixed(4)} años${d.appliedMinimum?' · mínimo de 15 días':''}`,amount:d.amount,salary:false});}
 else{const r=resignationCalc();rows.push({label:'Prestación por renuncia',base:'Ley de renuncia voluntaria, Art. 8',formula:r.eligible?`${money(r.base)}${r.capped?' (tope)':''} ÷ 30 × 15 × ${r.service.total.toFixed(4)} años`:r.reasons.join(' '),amount:r.amount,salary:false});}
 const b=bonusEstimate();
 rows.push({label:b.label,base:'Arts. 196–202 CT',formula:b.valid?`${money(b.annualAmount)}${b.full?'':` × ${b.workedDays} ÷ 365`}${b.paid?` − ${money(b.paid)} recibido`:''}`:'',amount:b.pending,salary:false});
 const v=vacationCalc();
 rows.push({label:'Vacación proporcional',base:'Arts. 177 y 187 CT',formula:`${money(v.full)} × ${Math.min(v.periodDays,365)} ÷ 365`,amount:v.proportional,salary:true});
 if(v.previous)rows.push({label:'Vacación del período anterior',base:'Art. 177 CT · pago pendiente',formula:`${money(v.full)}${data.vacationPayment==='parcial'?` − ${money(Number(data.vacationPaidAmount)||0)} recibido`:''}`,amount:v.previous,salary:true});
 if(data.overtime){const o=overtimeEstimate();rows.push({label:'Horas extras diurnas',base:'Art. 169 CT',formula:`${hours(o.dayHours)} h × ${money(o.hourly)} × 2`,amount:round2(o.dayPay),salary:true},{label:'Horas extras nocturnas',base:'Arts. 168 y 169 CT',formula:`${hours(o.nightHours)} h × ${money(o.hourly)} × 2 × 1.25`,amount:round2(o.nightPay),salary:true});}
 const s=specialDaysCalc();
 if(data.holiday)rows.push({label:'Asuetos trabajados',base:'Arts. 190 y 192 CT',formula:`${s.holidays.length} × ${money(s.daily)} × 2`,amount:s.holidayPay,salary:true});
 if(data.rest)rows.push({label:'Descansos semanales trabajados',base:'Arts. 175 y 194 CT',formula:`${s.restOrdinary.length} × ${money(s.daily)} × 1.5${s.restHolidays.length?` + ${s.restHolidays.length} × ${money(s.daily)} × 2 (asueto)`:''}`,amount:s.restPay,salary:true});
 return rows;
}

// Jornada ordinaria de 44 horas semanales: lunes a viernes 8 horas y sábado de 8:00 a. m. a 12:00 m.
// Un sábado laboral, las horas extras empiezan desde las 12:00 m.
const SATURDAY_ORDINARY={start:8*60,end:12*60};
function isWorkingSaturday(date){const d=dateValue(date);return !!d&&d.getUTCDay()===6&&(data.restDay||'Domingo')!=='Sábado';}
function saturdayOverlap(row){
 if(!isWorkingSaturday(row.date))return false;
 const h=splitHours(row);if(!h)return false;
 const toMinutes=s=>Number(s.slice(0,2))*60+Number(s.slice(3));
 const start=toMinutes(row.start),end=toMinutes(row.end)+(h.nextDay?1440:0);
 return start<SATURDAY_ORDINARY.end&&end>SATURDAY_ORDINARY.start;
}
