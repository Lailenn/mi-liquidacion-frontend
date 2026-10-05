'use strict';

/* =====================================================================
   FÓRMULAS DE LA LIQUIDACIÓN LABORAL — Código de Trabajo de El Salvador
   =====================================================================
   Índice
     1. Constantes de cálculo
     2. Salario diario y salario por hora
     3. Salario mínimo y topes legales
     4. Antigüedad (tiempo de servicio)
     5. Indemnización por despido injustificado ......... Art. 58
     6. Prestación por renuncia voluntaria .............. Ley de renuncia, Art. 8
     7. Vacaciones completas y proporcionales ........... Arts. 177 y 187
     8. Aguinaldo completo y proporcional ............... Arts. 196 a 202
     9. Horas extras diurnas y nocturnas ................ Arts. 161, 168, 169, 175 y 192
    10. Jornada ordinaria de 44 horas (sábado)
    11. Asuetos y descansos semanales trabajados ........ Arts. 175, 190, 192 y 194
    12. Descuentos de ISSS y AFP
   ===================================================================== */


/* 1. CONSTANTES DE CÁLCULO (método comercial del material de clase)
   Mes comercial = 30 días; año comercial = 360 días;
   jornada ordinaria diaria = 8 horas. */
const DAYS_PER_MONTH = 30;
const DAYS_PER_YEAR = 360;
const ORDINARY_HOURS = 8;


/* 2. SALARIO DIARIO Y SALARIO POR HORA
   Salario básico diario (SBD) = salario mensual ÷ 30
   Hora ordinaria             = salario diario ÷ 8 */
function monthlySalary() {
  return Math.max(0, Number(data.salary) || 0);
}
function dailySalary() {
  return monthlySalary() / DAYS_PER_MONTH;
}
function hourlySalary() {
  return dailySalary() / ORDINARY_HOURS;
}


/* 3. SALARIO MÍNIMO Y TOPES LEGALES
   Salario mínimo diario = salario mínimo mensual del sector ÷ 30
   (Comercio y servicios: $408.80 ÷ 30 = $13.63) */
function minimumMonthly() {
  return LABOR_REFERENCE.minimumMonthly[data.sector] ?? LABOR_REFERENCE.minimumMonthly['Comercio y servicios'];
}
function minimumDaily() {
  return minimumMonthly() / DAYS_PER_MONTH;
}


/* 4. TIEMPO DE SERVICIO
   Se cuenta en años, meses y días (incluye el último día trabajado).
   Días comerciales = años × 360 + meses × 30 + días
   Ejemplo del material: 01/01/2015 al 30/09/2021 = 6 años y 9 meses. */
function commercialPeriod(fromValue, toValue) {
  const from = dateValue(fromValue), lastDay = dateValue(toValue);
  if (!from || !lastDay || lastDay < from) return { years: 0, months: 0, days: 0, days360: 0 };
  const to = new Date(lastDay.getTime() + DAY);            // el último día trabajado cuenta completo
  const addMonths = (n) => {
    const d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + n, 1, 12));
    const lastOfMonth = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
    d.setUTCDate(Math.min(from.getUTCDate(), lastOfMonth));
    return d;
  };
  let totalMonths = (to.getUTCFullYear() - from.getUTCFullYear()) * 12 + to.getUTCMonth() - from.getUTCMonth();
  if (addMonths(totalMonths) > to) totalMonths--;
  const days = Math.round((to - addMonths(totalMonths)) / DAY);
  const years = Math.floor(totalMonths / 12), months = totalMonths % 12;
  return { years, months, days, days360: years * DAYS_PER_YEAR + months * DAYS_PER_MONTH + days };
}
function completedYears(start, end) {
  let years = end.getUTCFullYear() - start.getUTCFullYear();
  const beforeAnniversary = end.getUTCMonth() < start.getUTCMonth() ||
    (end.getUTCMonth() === start.getUTCMonth() && end.getUTCDate() < start.getUTCDate());
  if (beforeAnniversary) years--;
  return Math.max(0, years);
}
function serviceYears() {
  const p = commercialPeriod(data.start, data.end);
  const fractionDays = p.months * DAYS_PER_MONTH + p.days;   // meses × 30 + días
  return {
    full: p.years, months: p.months, days: p.days, fractionDays, days360: p.days360,
    total: p.days360 / DAYS_PER_YEAR, anniversary: addYears(data.start, p.years)
  };
}


/* 5. INDEMNIZACIÓN POR DESPIDO INJUSTIFICADO (Art. 58)
   Tope de la base            = 4 × salario mínimo diario × 30
   Base                       = el menor entre el salario y el tope
   Por años completos         = base × años
   Indemnización diaria       = base ÷ 360
   Por la fracción de año     = indemnización diaria × (meses × 30 + días)
   Indemnización total        = por años completos + por la fracción
   Mínimo                     = base ÷ 30 × 15 días
   Ejemplo del material: $600 × 6 años = $3,600; $600 ÷ 360 × 270 días = $450; total $4,050. */
function dismissalCalc() {
  const salary = monthlySalary();
  const capDaily = minimumDaily() * LABOR_REFERENCE.dismissalDailyCapFactor;   // 4 × mínimo diario
  const cap = capDaily * DAYS_PER_MONTH;
  const base = Math.min(salary, cap);
  const service = serviceYears();
  const forYears = base * service.full;
  const dailyIndemnity = base / DAYS_PER_YEAR;
  const forFraction = dailyIndemnity * service.fractionDays;
  const total = forYears + forFraction;
  const minimum = base / DAYS_PER_MONTH * LABOR_REFERENCE.dismissalMinimumDays;  // 15 días
  const appliedMinimum = total < minimum;
  return {
    salary, capDaily, cap, base, capped: salary > cap, service,
    forYears: round2(forYears), dailyIndemnity, forFraction: round2(forFraction),
    minimum: round2(minimum), appliedMinimum,
    amount: round2(appliedMinimum ? minimum : total)
  };
}


/* 6. PRESTACIÓN POR RENUNCIA VOLUNTARIA (Ley de renuncia, Art. 8)
   Tope de la base = 2 × salario mínimo diario × 30
   Prestación      = base ÷ 30 × 15 días × años de servicio
                     (la fracción de año se toma en días comerciales ÷ 360)
   Requisitos      = al menos 2 años de servicio y preaviso escrito de 15 días */
function resignationCalc() {
  const salary = monthlySalary();
  const capDaily = minimumDaily() * LABOR_REFERENCE.resignationDailyCapFactor;  // 2 × mínimo diario
  const cap = capDaily * DAYS_PER_MONTH;
  const base = Math.min(salary, cap);
  const service = serviceYears();
  const noticeDays = data.notice === 'si' ? inclusiveDays(data.noticeDate, data.end) - 1 : 0;

  const reasons = [];
  if (service.full < LABOR_REFERENCE.resignationMinimumYears) reasons.push('Se requieren al menos 2 años de servicio.');
  if (data.notice !== 'si') reasons.push('Se requiere preaviso por escrito.');
  else if (noticeDays < 15) reasons.push('El preaviso debe darse con 15 días de anticipación como mínimo.');
  const eligible = !reasons.length;

  return {
    salary, capDaily, cap, base, capped: salary > cap, service, noticeDays, eligible, reasons,
    amount: eligible ? round2(base / DAYS_PER_MONTH * 15 * service.total) : 0
  };
}


/* 7. VACACIONES (Arts. 177 y 187)
   Vacación completa     = salario diario × 15 días × 1.30   (30% de recargo)
   Vacación proporcional = (vacación completa × meses trabajados) ÷ 12
                           Los días sueltos cuentan como fracción de mes: meses + días ÷ 30.
   No se acumulan: solo se suma el período anterior si su pago quedó pendiente. */
function vacationCalc() {
  const daily = dailySalary();
  const full = daily * 15 * 1.30;
  const service = serviceYears();
  const periodStart = service.full >= 1 ? service.anniversary : data.start;
  const period = commercialPeriod(periodStart, data.end);
  const months = Math.min(12, period.years * 12 + period.months + period.days / DAYS_PER_MONTH);
  const periodDays = Math.min(DAYS_PER_YEAR, period.days360);
  const proportional = full * months / 12;

  let previous = 0;
  if (data.vacation === 'si' && service.full >= 1) {
    if (data.vacationPayment === 'pendiente') previous = full;
    else if (data.vacationPayment === 'parcial') previous = Math.max(0, full - (Number(data.vacationPaidAmount) || 0));
  }
  return { daily, full: round2(full), periodStart, period, months, periodDays, proportional: round2(proportional), previous: round2(previous), years: service.full };
}


/* 8. AGUINALDO (Arts. 196 a 202, reforma 2026)
   Días según antigüedad: 1 a menos de 3 años → 15 días
                          3 a menos de 10 años → 19 días
                          10 años o más        → 21 días
   Aguinaldo completo     = salario ÷ 30 × días del tramo
   Aguinaldo proporcional = (aguinaldo completo ÷ 360) × días comerciales trabajados
                            desde el 12 de diciembre anterior (meses × 30 + días)
   Ejemplo del material: $380 ÷ 360 = $1.055; × 289 días = $304.90.
   Es completo si la relación termina desde el 1 de octubre (o el 12 de diciembre)
   con al menos 1 año de servicio. El 30 de septiembre o antes es proporcional. */
function bonusEstimate() {
  const start = dateValue(data.start), end = dateValue(data.end), salary = Number(data.salary);
  if (!start || !end || end < start || !Number.isFinite(salary) || salary <= 0) {
    return { valid: false, amount: 0, pending: 0, paid: 0, label: 'Datos por completar' };
  }
  const year = end.getUTCFullYear();
  const reference = dateValue(`${year}-12-12`);                       // 12 de diciembre
  const cycleStart = dateValue(`${year - 1}-12-12`);
  const cycleEnd = new Date(reference.getTime() - DAY);
  const windowStart = `${year}-${year >= 2026 ? '10-01' : year === 2025 ? '10-20' : '12-12'}`;  // inicio del período de pago

  const tierDate = end < reference ? end : reference;
  const years = completedYears(start, tierDate);
  const salaryDays = years >= 10 ? 21 : years >= 3 ? 19 : 15;
  const annualAmount = salary / DAYS_PER_MONTH * salaryDays;

  const from = start > cycleStart ? start : cycleStart;
  const to = end < cycleEnd ? end : cycleEnd;
  const cycleDays = DAYS_PER_YEAR;
  const workedPeriod = commercialPeriod(from.toISOString().slice(0, 10), to.toISOString().slice(0, 10));
  const workedDays = Math.min(DAYS_PER_YEAR, workedPeriod.days360);

  const inPaymentWindow = end >= dateValue(windowStart);
  const hasYear = completedYears(start, end) >= 1;
  const full = (inPaymentWindow || end >= reference) && hasYear;
  const amount = round2(full ? annualAmount : annualAmount * Math.min(1, workedDays / cycleDays));

  const paid = data.bonusPaid === 'si' ? Math.max(0, Number(data.bonusPaidAmount) || 0) : 0;
  const pending = Math.max(0, round2(amount - paid));

  const label = full ? 'Aguinaldo completo' : 'Aguinaldo proporcional';
  const reason = full
    ? `La terminación es el ${dateLabel(data.end)}, dentro del período de pago que inicia el ${dateLabel(windowStart)}, y tienes al menos 1 año de servicio: corresponde el aguinaldo completo.`
    : !hasYear
      ? 'Aún no cumples 1 año de servicio: corresponde la parte proporcional al tiempo trabajado.'
      : `La terminación es antes del ${dateLabel(windowStart)}: corresponde la parte proporcional del ciclo anual.`;

  return {
    valid: true, year, reference: reference.toISOString().slice(0, 10), windowStart, cycleDays, workedDays, workedPeriod,
    from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10),
    years, salaryDays, annualAmount, full, label, reason, amount, paid, pending
  };
}


/* 9. HORAS EXTRAS (Arts. 161, 168, 169, 175 y 192)
   Horario diurno:   6:00 a. m. a 7:00 p. m.
   Horario nocturno: 7:00 p. m. a 6:00 a. m.
   Hora extra diurna   = hora ordinaria × 2          (recargo del 100%)
   Hora extra nocturna = hora ordinaria × 2 × 1.25   (100% + 25% de nocturnidad)
   Si cae en asueto, la hora ordinaria se multiplica primero × 2;
   si cae en descanso semanal, × 1.5. */
const toMinutes = (time) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3));

function splitHours(row) {
  const valid = /^([01]\d|2[0-3]):[0-5]\d$/;
  if (!valid.test(row.start) || !valid.test(row.end) || row.start === row.end) return null;
  const start = toMinutes(row.start);
  let end = toMinutes(row.end);
  const nextDay = end < start;            // la jornada termina al día siguiente
  if (nextDay) end += 1440;
  let day = 0, night = 0;
  for (let t = start; t < end; t++) {
    const minute = t % 1440;
    if (minute >= 360 && minute < 1140) day++;   // 6:00 a. m. a 7:00 p. m.
    else night++;
  }
  return { day: day / 60, night: night / 60, total: (end - start) / 60, nextDay };
}

function overtimePay(row) {
  const h = splitHours(row);
  if (!h) return null;
  const start = toMinutes(row.start);
  const end = toMinutes(row.end) + (h.nextDay ? 1440 : 0);
  const restDates = new Set(data.rest ? restRows.map(r => r.date) : []);
  const factorFor = (date) => holidayForDate(date) ? 2 : restDates.has(date) ? 1.5 : 1;
  const factors = [factorFor(row.date), factorFor(datePlusDays(row.date, 1))];

  let dayUnits = 0, nightUnits = 0, specialMinutes = 0;
  for (let t = start; t < end; t++) {
    const minute = t % 1440, factor = factors[t < 1440 ? 0 : 1];
    if (factor > 1) specialMinutes++;
    if (minute >= 360 && minute < 1140) dayUnits += factor;
    else nightUnits += factor;
  }
  const hourly = hourlySalary();
  const dayPay = dayUnits / 60 * hourly * 2;
  const nightPay = nightUnits / 60 * hourly * 2 * 1.25;
  return { ...h, dayPay, nightPay, pay: dayPay + nightPay, specialHours: specialMinutes / 60 };
}


/* 10. JORNADA ORDINARIA DE 44 HORAS
   Lunes a viernes: 8 horas diarias (40 h). Sábado: 8:00 a. m. a 12:00 m. (4 h).
   Un sábado laboral, las horas extras se cuentan desde las 12:00 m. */
const SATURDAY_ORDINARY = { start: 8 * 60, end: 12 * 60 };

function isWorkingSaturday(date) {
  const d = dateValue(date);
  return !!d && d.getUTCDay() === 6 && (data.restDay || 'Domingo') !== 'Sábado';
}
function saturdayOverlap(row) {
  if (!isWorkingSaturday(row.date)) return false;
  const h = splitHours(row);
  if (!h) return false;
  const start = toMinutes(row.start), end = toMinutes(row.end) + (h.nextDay ? 1440 : 0);
  return start < SATURDAY_ORDINARY.end && end > SATURDAY_ORDINARY.start;
}


/* 11. ASUETOS Y DESCANSOS SEMANALES TRABAJADOS
   Asueto trabajado (Arts. 190 y 192)          = salario diario × 2
   Descanso semanal trabajado (Art. 175)       = salario diario × 1.5 + un día compensatorio
   Descanso que coincide con asueto (Art. 194) = salario diario × 2 (no × 2.5) + día compensatorio */
function specialDaysCalc() {
  const daily = dailySalary();
  const restDates = data.rest ? [...new Set(restRows.filter(r => validEmploymentDate(r.date)).map(r => r.date))] : [];
  const restHolidays = restDates.filter(d => holidayForDate(d));
  const restOrdinary = restDates.filter(d => !holidayForDate(d));
  const holidays = selectedHolidays().filter(r => !restDates.includes(r.date));

  const holidayPay = holidays.length * daily * 2;
  const restPay = restOrdinary.length * daily * 1.5 + restHolidays.length * daily * 2;
  return { daily, holidays, holidayPay: round2(holidayPay), restOrdinary, restHolidays, restPay: round2(restPay), compensatoryDays: restDates.length };
}


/* 12. DESCUENTOS DE ISSS Y AFP
   ISSS = 3% del salario, con base máxima de $1,000 (máximo $30)
   AFP  = 7.25% del salario, sin techo
   Solo se aplican a conceptos salariales (vacaciones, horas extras, asuetos y descansos).
   Aguinaldo, indemnización y prestación por renuncia no cotizan. */
function deductionsFor(salaryBase) {
  const isss = round2(Math.min(salaryBase, LABOR_REFERENCE.isssMonthlyBaseCap) * LABOR_REFERENCE.isssRate);
  const afp = round2(salaryBase * LABOR_REFERENCE.afpRate);
  return { base: round2(salaryBase), isss, afp };
}
