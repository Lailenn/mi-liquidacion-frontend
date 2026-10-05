# Mi liquidación — frontend

Prototipo académico en español, escrito con HTML, CSS y JavaScript. Abrir `dist/index.html` en el navegador para recorrerlo localmente.

Incluye seis pasos visibles en la parte superior: datos del trabajo, terminación, vacaciones, aguinaldo, pagos pendientes y resumen. Las respuestas Sí/No habilitan campos condicionales. Se pueden añadir jornadas, clasificar sus intervalos horarios, revisar el comprobante y abrir el diálogo de impresión para guardarlo como PDF.

- Asuetos por año y localidad, con selección independiente de cada día de Semana Santa y registro de fiestas patronales de otras localidades.
- Detección por fecha: el 17 de junio se identifica como Día del Padre. Al agregar un día completo de asueto trabajado y pendiente de pago, se selecciona una sola vez en la lista. Las fechas de horas extras y descanso semanal muestran también el nombre del asueto detectado.
- Vacaciones completas (15 días), una semana (7 días) u otro intervalo; fecha de fin automática, saldo del período y estado del pago por separado.
- Referencia mensual de ISSS al 3%, limitada a $30 sobre una base máxima de $1,000, y AFP al 7.25% sin techo salarial. La vista se actualiza con el salario ingresado.
- Tabla de horas extras diurnas, nocturnas y mixtas, con estimaciones base y detección de jornadas que pasan a otro día.
- La tabla conserva a la vista todos los registros de la sesión, incluidos los incompletos o inválidos, y suma únicamente los válidos. Sus avisos y los errores del formulario llevan al campo que se debe corregir.
- ISSS, AFP y salario después de ambas cotizaciones se actualizan también en la tarjeta lateral. Son referencias mensuales, antes de ISR.
- Aguinaldo con referencia a la reforma aprobada el 23 de septiembre de 2026: período de pago desde el 1 de octubre. Si la relación termina el 1 de octubre o después, con al menos 1 año de servicio, el aguinaldo es completo; si termina el 30 de septiembre o antes, es proporcional. Se pueden restar importes ya recibidos.
- Comprobante con la estructura de dos páginas del modelo proporcionado: datos, prestaciones y base legal, deducciones, importe en letras, declaración, firmas y advertencia legal. El ISR se presenta como pendiente de cálculo.
- Paleta azul y pizarra, controles Sí/No visibles, transiciones de pasos y registros, y resaltado del campo con error. Se respeta la preferencia de movimiento reducido.
- Pasos superiores y tarjeta de información fijos; el panel central completo se desplaza hacia abajo, con sus campos y botones en el flujo para mostrar toda la información. El resumen está disponible en un panel desplegable superior en móvil.
- Preguntas destacadas con tarjetas, iconos y selección visible. Animaciones suaves al entrar a un paso, desplegar campos y elegir respuestas. La posición del formulario se conserva al cambiar respuestas y los importes laterales se actualizan sin animaciones que distraigan.

## Fórmulas (archivo dist/formulas.js)

Método comercial del material de clase: salario diario = salario mensual ÷ 30; mes comercial de 30 días y año comercial de 360 días. El tiempo de servicio se cuenta en años, meses y días.

| Concepto | Fórmula | Tope / regla |
|---|---|---|
| Indemnización por despido (Art. 58) | base × años completos + (base ÷ 360) × (meses × 30 + días) | Base máxima: 4 × salario mínimo diario × 30. Mínimo: 15 días de salario. |
| Prestación por renuncia | base ÷ 30 × 15 × años de servicio | Base máxima: 2 × salario mínimo diario × 30. Requiere 2 años y preaviso escrito de 15 días. |
| Vacación completa (Art. 177) | salario diario × 15 × 1.30 | No se acumula ni se cambia por dinero. No puede iniciar en día de descanso ni en asueto. |
| Vacación proporcional (Art. 187) | (vacación completa × meses trabajados) ÷ 12 | Los días sueltos cuentan como fracción de mes (días ÷ 30). |
| Aguinaldo (Arts. 196–202) | salario diario × 15, 19 o 21 días | 1 a <3 años: 15; 3 a <10: 19; 10 o más: 21. Completo si termina desde el 1 de octubre con al menos 1 año; si no, proporcional: (completo ÷ 360) × días comerciales desde el 12 de diciembre. Exento de ISSS/AFP; ISR solo arriba de $1,500. |
| Asueto trabajado (Arts. 190, 192) | salario diario × 2 | Asuetos nacionales + fiesta patronal de San Miguel (21 de noviembre). |
| Descanso semanal trabajado (Art. 175) | salario diario × 1.5 + día compensatorio | Si coincide con asueto (Art. 194): × 2, no × 2.5, y también da compensatorio. |
| Hora extra diurna / nocturna (Arts. 168, 169) | hora ordinaria × 2 / × 2 × 1.25 | Diurna 6 a. m.–7 p. m. En asueto la hora base se duplica; en descanso semanal × 1.5. |
| ISSS / AFP | 3% / 7.25% de los conceptos salariales | ISSS con base máxima de $1,000 (máx. $30). AFP sin techo. No se aplican a aguinaldo ni indemnización. |

## Mejoras según las indicaciones de clase (semana 10)

- Montos reales calculados con fórmulas visibles en el código y en el resumen (antes eran montos de ejemplo).
- Topes legales aplicados: aunque el salario sea mayor, se usa la base máxima.
- Aguinaldo con la reforma: desde el 1 de octubre es completo; el 30 de septiembre es proporcional.
- El calendario llega solo hasta la fecha actual: no se pueden registrar fechas futuras.
- Horas elegidas en listas de hora y minutos, sin reloj.
- Paso actual en grande ("Paso 1 de 6") encima del título de cada pantalla.
- Botones "?" con explicaciones para el usuario en los campos que pueden generar dudas.
- Día de descanso semanal configurable, validación del inicio de vacaciones y aviso de días compensatorios.

## Alcance

- Únicamente frontend, sin servidor, autenticación ni almacenamiento de datos. Los datos permanecen en memoria durante la sesión.
- El ISR no se calcula; el neto se presenta antes de ISR. No sustituye una liquidación oficial.
- Salario mínimo de referencia: $408.80 mensuales para comercio y servicios (MTPS, junio de 2025). Fuentes en `dist/labor-reference.js`.

## Archivos

- `dist/index.html`: documento principal y metadatos.
- `dist/formulas.js`: todas las fórmulas de la liquidación, numeradas y comentadas.
- `dist/calculations.js`: utilidades de fechas y armado del resumen con cada fórmula.
- `dist/time-picker.js`: selector de hora con botones y escritura manual.
- `dist/theme.css`: paleta de colores (azul principal, verde salvia y arena).
- `dist/improvements.css`: paso grande, ayudas "?", listas de hora y cajas de cálculo.
- `dist/styles.css`: diseño responsive y estilos para impresión.
- `dist/app.js`: navegación, formularios condicionales y vista previa del comprobante.
- `dist/refinements.css`: pasos superiores, lista de asuetos, tablas y campos adicionales.
- `dist/labor-reference.js`: tasas, fuentes y calendario de asuetos.
- `dist/pending-section.js`: registros de horas y días, detección de asuetos y reglas de referencia.
- `dist/vacations-section.js`: vacaciones completas o parciales y referencia de cotizaciones.
- `dist/bonus-section.js`: aguinaldo y resumen mensual de cotizaciones.
- `dist/form-controls.js`: opciones Sí/No, validación y navegación a errores.
- `dist/letter.js` y `dist/letter.css`: comprobante basado en el modelo adjunto y cantidad en letras.
- `dist/revision.css`: nueva paleta, controles, transiciones y adaptación móvil.
- `dist/focus-layout.css`: estructura fija de pantalla, desplazamiento del formulario, resumen móvil y tarjetas de preguntas.

No se requieren dependencias ni compilación. Las fuentes web son opcionales y tienen alternativas del sistema.
