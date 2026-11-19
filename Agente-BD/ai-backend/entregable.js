const fs = require('node:fs/promises');
const path = require('node:path');
const { OpenAI } = require('openai');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { chat } = require('./agent');
const { analyze, query } = require('./database');

const questions = [
  'Recomiéndame 3 películas de acción que sean largas (más de 2 horas) pero que la gente alquile muy seguido en la tienda.',
  '¿Qué clientes crees que están a punto de dejar el servicio porque llevan mucho tiempo sin alquilar ninguna película?',
  'Hazme un análisis rápido de qué día de la semana hay más movimiento en las tiendas y cuánto dinero promedio se recauda en esos días.',
];

async function main() {
  if (!process.env.OPENROUTER_API_KEY) throw new Error('Configura OPENROUTER_API_KEY en .env.');
  const client = new OpenAI({ baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY, timeout: 60000, maxRetries: 0 });
  const connection = await query(`SELECT DATABASE() AS base, VERSION() AS version,
    MIN(rental_date) AS primer_alquiler, MAX(rental_date) AS ultimo_alquiler,
    COUNT(*) AS alquileres FROM rental`);
  const verification = [];
  for (const name of ['recomendar_peliculas', 'clientes_inactivos', 'movimiento_semanal']) {
    verification.push(await analyze(name));
  }
  const output = path.join(__dirname, '../entregable');
  await fs.mkdir(output, { recursive: true });
  await fs.writeFile(path.join(output, 'consultas.sql'), verification.map(result =>
    '-- ' + result.herramienta + '\n' + result.sql + ';').join('\n\n') + '\n');
  const evidence = { generado: new Date().toISOString(), conexion: connection,
    modelo: process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini', verificacion: verification, conversaciones: [] };
  await fs.writeFile(path.join(output, 'evidencia.json'), JSON.stringify(evidence, null, 2));
  let report = '# Agente BD · Sakila\n\n';
  report += '## Conexión y criterios\n\n';
  report += 'Consulta real a MySQL y respuestas generadas mediante herramientas de OpenRouter.\n\n';
  report += '```json\n' + JSON.stringify(connection, null, 2) + '\n```\n\n';
  report += 'Se recomiendan películas Action de más de 120 minutos por número de alquileres históricos. ';
  report += 'La señal de inactividad considera clientes activos con 30 días sin alquilar, usando el último alquiler de Sakila como corte. ';
  report += 'El movimiento se compara por alquileres promedio diarios por tienda. Los promedios usan las fechas con alquileres o pagos registrados por tienda. ';
  report += 'Los cobros se agrupan por su fecha de pago y por la tienda del empleado que los registró. La base no especifica moneda.\n\n';
  for (let index = 0; index < questions.length; index++) {
    const question = questions[index];
    console.log('Consultando pregunta ' + (index + 1));
    const result = await chat(client, evidence.modelo, question, []);
    if (!result.evidence.length) throw new Error('Faltó evidencia de consulta real.');
    evidence.conversaciones.push({ pregunta: question, ...result });
    await fs.writeFile(path.join(output, 'evidencia.json'), JSON.stringify(evidence, null, 2));
    report += '## ' + question + '\n\n' + result.reply + '\n\n';
    for (const detail of result.evidence) {
      report += '### Consulta ejecutada\n\n```sql\n' + detail.sql + ';\n```\n\n';
      report += '### Resultado de MySQL\n\n```json\n' + JSON.stringify(detail.filas, null, 2) + '\n```\n\n';
    }
  }
  report += '## Alcance\n\nLas conclusiones describen el historial de Sakila. ';
  report += 'La señal de inactividad requiere seguimiento para confirmar abandono. ';
  report += 'La popularidad histórica de las películas no garantiza su disponibilidad actual.\n';
  await fs.writeFile(path.join(output, 'respuestas.md'), report);
  console.log('Entregable generado con las tres respuestas y sus consultas.');
}

main().catch(error => {
  console.error('No se completó el entregable:', error.status || error.code || error.name);
  process.exitCode = 1;
});
