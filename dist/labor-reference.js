'use strict';

// Reference information for the frontend. This is not a complete liquidation engine.
const LABOR_REFERENCE = Object.freeze({
 reviewedOn: '2026-09-28',
 minimumEffectiveFrom: '2025-06-01',
 minimumMonthly: {'Comercio y servicios':408.80,'Industria':408.80,'Maquila textil y confección':402.32,'Agricultura':272.53},
 dismissalMinimumDays:15,
 dismissalDailyCapFactor:4,
 resignationDailyCapFactor:2,
 resignationMinimumYears:2,
 isssRate:0.03,
 isssMonthlyBaseCap:1000,
 afpRate:0.0725,
 afpMonthlyBaseCap:null,
 sources:{
  minimum:'https://www.mtps.gob.sv/2025/05/27/aprueban-incremento-del-12-al-salario-minimo-solicitado-por-el-gobierno-del-presidente-nayib-bukele/',
  dismissal:'https://www.jurisprudencia.gob.sv/DocumentosBoveda/R/2/1970-1979/1972/07/900A0.HTML',
  resignation:'https://www.asamblea.gob.sv/sites/default/files/documents/decretos/171117_073426613_archivo_documento_legislativo.pdf',
  isss:'https://ovisss.isss.gob.sv/documentos_ofivi/Lineamiento_Mod_Salario_Maximo.pdf',
  afp:'https://www.crecer.com.sv/web/empresas/tasa-de-cotizacion-y-salarios/',
  overtime:'https://www.mtps.gob.sv/2025/11/24/direccion-general-de-inspeccion-de-trabajo/',
  holidays:'https://www.mtps.gob.sv/2026/03/26/arranca-el-plan-de-inspeccion-laboral-verano-2026/'
 }
});

function easterSunday(year){
 const a=year%19,b=Math.floor(year/100),c=year%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),month=Math.floor((h+l-7*m+114)/31),day=(h+l-7*m+114)%31+1;
 return new Date(Date.UTC(year,month-1,day,12));
}
function holidayCalendar(year,locality){
 const date=(month,day)=>`${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
 const holy=(offset)=>{const d=easterSunday(year);d.setUTCDate(d.getUTCDate()+offset);return d.toISOString().slice(0,10);};
 const list=[
  {date:date(1,1),label:'Año nuevo'},
  {date:holy(-3),label:'Jueves de Semana Santa'},
  {date:holy(-2),label:'Viernes de Semana Santa'},
  {date:holy(-1),label:'Sábado de Semana Santa'},
  {date:date(5,1),label:'Día del Trabajo'},
  {date:date(5,10),label:'Día de la Madre'},
  {date:date(6,17),label:'Día del Padre'},
  {date:date(8,6),label:'Divino Salvador del Mundo'},
  {date:date(9,15),label:'Independencia'},
  {date:date(11,2),label:'Día de los Difuntos'},
  {date:date(12,25),label:'Navidad'}
 ];
 if(locality==='San Miguel')list.push({date:date(11,21),label:'Fiestas patronales de San Miguel',local:true,locality});
 if(locality==='San Salvador')list.push({date:date(8,3),label:'Fiestas de San Salvador',local:true,locality},{date:date(8,5),label:'Fiestas de San Salvador',local:true,locality});
 return list.sort((a,b)=>a.date.localeCompare(b.date));
}

function holidayForDate(value){
 if(!dateValue(value))return null;
 return holidayCalendar(Number(value.slice(0,4)),data.workplace).find(h=>h.date===value)||null;
}
