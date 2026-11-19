const { analyze } = require('./database');

const descriptions = {
  recomendar_peliculas: 'Consultar las 3 películas Action de más de 120 minutos con más alquileres históricos, incluyendo alquileres por copia.',
  clientes_inactivos: 'Consultar los 10 clientes activos con al menos 30 días sin alquilar o sin alquileres. Corte en la última fecha registrada en rental.',
  movimiento_semanal: 'Consultar por tienda y día de la semana los alquileres y cobros. Promedios diarios sobre las fechas con actividad registrada en cada tienda.',
};
const tools = Object.entries(descriptions).map(([name, description]) => ({
  type: 'function', function: { name, description, parameters: {
    type: 'object', properties: {}, additionalProperties: false,
  } },
}));

async function chat(client, model, message, history) {
  const messages = [{ role: 'system', content: `Eres un analista de la base Sakila. Responde en español.
Consulta las herramientas antes de afirmar cifras, títulos o nombres de la base.
Las recomendaciones se ordenan por alquileres históricos, con desempate por título. Para películas presenta solo título, minutos y alquileres históricos. Omite las copias, pues la herramienta no consulta disponibilidad actual. Responde en texto plano sin asteriscos ni encabezados Markdown. El campo copias indica inventario total, nunca copias disponibles para alquilar ahora.
La inactividad es una señal para seguimiento, no una predicción confirmada de abandono.
Usa 30 días y la fecha máxima de rental como corte histórico, nunca la fecha actual. Escribe siempre la fecha_corte exacta al presentar clientes inactivos y aclara que es una señal de seguimiento, sin confirmar abandono.
Para movimiento semanal compara alquileres_promedio por tienda y comunica ingreso_promedio_diario del mismo día.
Los promedios se calculan sobre fechas con alquileres o pagos por tienda. Explica ese denominador.
En el análisis semanal presenta primero el día con más movimiento por tienda, su promedio de alquileres y su ingreso promedio diario, siempre en unidades monetarias. No confundas el día con más alquileres con el de mayor ingreso. Los cobros se atribuyen a la tienda del empleado que registró el pago y a payment_date.
La moneda no está especificada en los datos, usa unidades monetarias. No inventes divisas.
Indica los criterios, las cifras y las limitaciones. Si una herramienta falla, explica que no se pudo consultar la base.` },
  ...history.map(({ role, content }) => ({ role, content })), { role: 'user', content: message }];
  const evidence = [];
  for (let step = 0; step < 4; step++) {
    const completion = await client.chat.completions.create({ model, messages, tools,
      tool_choice: step === 0 ? 'required' : 'auto', max_tokens: 1800 });
    const answer = completion.choices?.[0]?.message;
    if (!answer) throw new Error('El modelo devolvió una respuesta vacía.');
    if (!answer.tool_calls?.length) {
      if (!answer.content?.trim()) throw new Error('El modelo devolvió una respuesta vacía.');
      return { reply: answer.content.trim(), evidence };
    }
    messages.push(answer);
    for (const call of answer.tool_calls) {
      try {
        const result = await analyze(call.function.name);
        evidence.push(result);
        messages.push({ role: 'tool', tool_call_id: call.id, content: JSON.stringify(result) });
      } catch {
        throw new Error('No se pudo consultar Sakila. Revisa MySQL y los datos de conexión del .env.');
      }
    }
  }
  throw new Error('El agente alcanzó el límite de consultas. Intenta una pregunta más específica.');
}

module.exports = { chat };
