# Agente BD · Sakila

Continuación del agente web de la Práctica 6 para responder las tres preguntas de la actividad Agente BD mediante consultas reales a MySQL.

## Ejecutar

1. Inicia MySQL en Laragon y verifica que la base `sakila` esté importada.
2. En `ai-backend`, ejecuta `npm.cmd ci`.
3. Copia `.env.example` como `.env` y configura OpenRouter y los datos de MySQL. `MYSQL_BIN` indica la ubicación del cliente MySQL. Puedes usar `mysql` si está en PATH.
4. Ejecuta `npm.cmd start` y abre http://127.0.0.1:3001 o `ai-frontend/index.html` con doble clic.
5. Escribe cualquiera de las tres preguntas de la actividad. Cada respuesta permite desplegar la consulta y sus resultados.

El agente selecciona herramientas de consulta mediante OpenRouter. Las tres herramientas ejecutan SQL predefinido de lectura. El historial del chat se conserva en memoria. Las claves quedan en `.env`, excluido de Git.

## Entregable

Ejecuta `node entregable.js` desde `ai-backend` para generar `entregable/respuestas.md`, `entregable/consultas.sql` y `entregable/evidencia.json`. Este proceso consulta Sakila y realiza tres conversaciones reales con el modelo configurado. Requiere una clave válida de OpenRouter con acceso al modelo.

## Criterios del análisis

- Películas de categoría `Action`, duración mayor de 120 minutos, ordenadas por total de alquileres históricos. Se muestran también los alquileres por copia.
- Diez clientes activos con al menos 30 días sin alquiler o sin alquileres registrados. La fecha de corte es el último alquiler de la base. Esta señal permite priorizar seguimiento.
- Movimiento semanal por tienda, ordenado por alquileres promedio diarios. Se informa el ingreso diario promedio del mismo día de la semana. Los promedios se calculan sobre las fechas con actividad registrada por tienda, incluyendo los ceros de alquileres o cobros de esas fechas.
- Los cobros pertenecen a la tienda del empleado que los registró y se agrupan por `payment_date`. La moneda no está especificada en Sakila.
