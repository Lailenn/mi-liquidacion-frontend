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
- Aguinaldo con referencia a la reforma aprobada el 23 de septiembre de 2026: período de pago desde el 1 de octubre, manteniendo el 12 de diciembre para el proporcional. No se presume pago completo automático por terminar en octubre. Se puede registrar reconocimiento de pago completo anticipado por la empresa cuando corresponde y restar importes ya recibidos.
- Comprobante con la estructura de dos páginas del modelo proporcionado: datos, prestaciones y base legal, deducciones, importe en letras, declaración, firmas y advertencia legal. El ISR se presenta como pendiente de cálculo.
- Paleta azul y pizarra, controles Sí/No visibles, transiciones de pasos y registros, y resaltado del campo con error. Se respeta la preferencia de movimiento reducido.
- Pasos superiores y tarjeta de información fijos; el panel central completo se desplaza hacia abajo, con sus campos y botones en el flujo para mostrar toda la información. El resumen está disponible en un panel desplegable superior en móvil.
- Preguntas destacadas con tarjetas, iconos y selección visible. Animaciones suaves al entrar a un paso, desplegar campos y elegir respuestas. La posición del formulario se conserva al cambiar respuestas y los importes laterales se actualizan sin animaciones que distraigan.

## Alcance

- Únicamente frontend, sin servidor, autenticación ni almacenamiento de datos.
- Los datos del formulario permanecen en memoria durante la sesión.
- El total de la liquidación conserva montos de ejemplo para indemnización, vacaciones y descanso semanal. El aguinaldo usa una estimación del ciclo de referencia; ISSS y AFP usan el salario mensual como referencia visual. El ISR no se calcula y el neto se etiqueta expresamente como ilustrativo antes de ISR. No es una liquidación definitiva.
- Las horas extras se estiman a partir de los registros y una jornada ordinaria de referencia de 8 horas. Si coinciden con un asueto, se señala que el recargo especial requiere revisión y no se incluye en esa estimación base.
- Los asuetos seleccionados estiman días completos sin pago a salario diario por dos. El formulario indica que el saldo debe ajustarse si ya se recibió el salario ordinario.
- Las referencias de topes y tasas se documentan con fuentes en `labor-reference.js`. El salario mínimo mensual publicado por el MTPS para comercio y servicios es $408.80 desde junio de 2025; la transcripción de clase con $418.80 se identifica como pendiente de confirmación. Los topes de indemnización y renuncia se expresan sobre el salario mínimo diario legal, sin sustituirlo por mensual/30.
- No se ha implementado un motor completo de liquidación. La app futura deberá resolver los requisitos legales de cada prestación, el preaviso, las bases cotizables por mes, los recargos especiales y el tratamiento de períodos vacacionales acumulados. La referencia mensual de cotizaciones no se descuenta automáticamente de toda la liquidación.

## Archivos

- `dist/index.html`: documento principal y metadatos.
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
