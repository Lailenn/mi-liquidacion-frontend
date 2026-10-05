'use strict';

// Utilidades de fechas y armado del resumen. Las fórmulas están en formulas.js.
const round2=(v)=>Math.round((Number(v)||0)*100)/100;

// Fecha actual en El Salvador. El calendario no permite fechas posteriores.
function todayValue(){return new Intl.DateTimeFormat('en-CA',{timeZone:'America/El_Salvador'}).format(new Date());}
function addYears(value,years){const d=dateValue(value);if(!d)return '';const month=d.getUTCMonth();d.setUTCFullYear(d.getUTCFullYear()+years);if(d.getUTCMonth()!==month)d.setUTCDate(0);return d.toISOString().slice(0,10);}
function inclusiveDays(from,to){const a=dateValue(from),b=dateValue(to);return a&&b&&b>=a?Math.round((b-a)/DAY)+1:0;}

// Conceptos del resumen y del comprobante, con la fórmula aplicada a los datos de la persona.
function liquidationRows(){
 const rows=[];
 if(data.termination==='despido'){const d=dismissalCalc();rows.push({label:'Indemnización por despido',base:'Art. 58 CT',formula:`${money(d.base)}${d.capped?' (tope)':''} × ${d.service.full} años + ${money(d.base)} ÷ 360 × ${d.service.fractionDays} días${d.appliedMinimum?' · mínimo de 15 días':''}`,amount:d.amount,salary:false});}
 else{const r=resignationCalc();rows.push({label:'Prestación por renuncia',base:'Ley de renuncia voluntaria, Art. 8',formula:r.eligible?`${money(r.base)}${r.capped?' (tope)':''} ÷ 30 × 15 × ${r.service.total.toFixed(4)} años (${r.service.days360} días ÷ 360)`:r.reasons.join(' '),amount:r.amount,salary:false});}
 const b=bonusEstimate();
 rows.push({label:b.label,base:'Arts. 196–202 CT',formula:b.valid?`${money(b.annualAmount)}${b.full?'':` ÷ 360 × ${b.workedDays} días`}${b.paid?` − ${money(b.paid)} recibido`:''}`:'',amount:b.pending,salary:false});
 const v=vacationCalc();
 rows.push({label:'Vacación proporcional',base:'Arts. 177 y 187 CT',formula:`${money(v.full)} × ${v.months.toFixed(2)} meses ÷ 12`,amount:v.proportional,salary:true});
 if(v.previous)rows.push({label:'Vacación del período anterior',base:'Art. 177 CT · pago pendiente',formula:`${money(v.full)}${data.vacationPayment==='parcial'?` − ${money(Number(data.vacationPaidAmount)||0)} recibido`:''}`,amount:v.previous,salary:true});
 if(data.overtime){const o=overtimeEstimate();rows.push({label:'Horas extras diurnas',base:'Art. 169 CT',formula:`${hours(o.dayHours)} h × ${money(o.hourly)} × 2`,amount:round2(o.dayPay),salary:true},{label:'Horas extras nocturnas',base:'Arts. 168 y 169 CT',formula:`${hours(o.nightHours)} h × ${money(o.hourly)} × 2 × 1.25`,amount:round2(o.nightPay),salary:true});}
 const s=specialDaysCalc();
 if(data.holiday)rows.push({label:'Asuetos trabajados',base:'Arts. 190 y 192 CT',formula:`${s.holidays.length} × ${money(s.daily)} × 2`,amount:s.holidayPay,salary:true});
 if(data.rest)rows.push({label:'Descansos semanales trabajados',base:'Arts. 175 y 194 CT',formula:`${s.restOrdinary.length} × ${money(s.daily)} × 1.5${s.restHolidays.length?` + ${s.restHolidays.length} × ${money(s.daily)} × 2 (asueto)`:''}`,amount:s.restPay,salary:true});
 return rows;
}
