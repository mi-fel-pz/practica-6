const { execFile } = require('node:child_process');
const { promisify } = require('node:util');
const execute = promisify(execFile);

const queries = {
  recomendar_peliculas: `SELECT f.film_id, f.title, f.length AS minutos,
    COUNT(r.rental_id) AS alquileres,
    COUNT(DISTINCT i.inventory_id) AS copias,
    ROUND(COUNT(r.rental_id) / COUNT(DISTINCT i.inventory_id), 2) AS alquileres_por_copia
    FROM film f JOIN film_category fc ON fc.film_id = f.film_id
    JOIN category c ON c.category_id = fc.category_id
    JOIN inventory i ON i.film_id = f.film_id
    LEFT JOIN rental r ON r.inventory_id = i.inventory_id
    WHERE c.name = 'Action' AND f.length > 120
    GROUP BY f.film_id, f.title, f.length
    ORDER BY alquileres DESC, f.title LIMIT 3`,
  clientes_inactivos: `SELECT c.customer_id, CONCAT(c.first_name, ' ', c.last_name) AS cliente,
    c.store_id AS tienda, COUNT(r.rental_id) AS alquileres,
    MAX(r.rental_date) AS ultimo_alquiler,
    DATE((SELECT MAX(rental_date) FROM rental)) AS fecha_corte,
    DATEDIFF((SELECT MAX(rental_date) FROM rental), MAX(r.rental_date)) AS dias_sin_alquilar
    FROM customer c LEFT JOIN rental r ON r.customer_id = c.customer_id
    WHERE c.active = 1
    GROUP BY c.customer_id, c.first_name, c.last_name, c.store_id
    HAVING ultimo_alquiler IS NULL OR dias_sin_alquilar >= 30
    ORDER BY ultimo_alquiler IS NOT NULL, dias_sin_alquilar DESC, c.customer_id LIMIT 10`,
  movimiento_semanal: `WITH alquileres AS (
      SELECT i.store_id, DATE(r.rental_date) AS fecha, COUNT(*) AS cantidad
      FROM rental r JOIN inventory i ON i.inventory_id = r.inventory_id
      GROUP BY i.store_id, DATE(r.rental_date)
    ), cobros AS (
      SELECT s.store_id, DATE(p.payment_date) AS fecha, SUM(p.amount) AS ingreso
      FROM payment p JOIN staff s ON s.staff_id = p.staff_id
      GROUP BY s.store_id, DATE(p.payment_date)
    ), fechas AS (
      SELECT store_id, fecha FROM alquileres UNION SELECT store_id, fecha FROM cobros
    )
    SELECT d.store_id AS tienda, WEEKDAY(d.fecha) AS dia_numero,
      ELT(WEEKDAY(d.fecha)+1,'Lunes','Martes','Miercoles','Jueves','Viernes','Sabado','Domingo') AS dia,
      MIN(d.fecha) AS primera_fecha, MAX(d.fecha) AS ultima_fecha,
      COUNT(*) AS dias_con_actividad,
      SUM(COALESCE(a.cantidad,0)) AS alquileres,
      ROUND(AVG(COALESCE(a.cantidad,0)),2) AS alquileres_promedio,
      ROUND(SUM(COALESCE(c.ingreso,0)),2) AS ingreso_total,
      ROUND(AVG(COALESCE(c.ingreso,0)),2) AS ingreso_promedio_diario
    FROM fechas d LEFT JOIN alquileres a ON a.store_id=d.store_id AND a.fecha=d.fecha
    LEFT JOIN cobros c ON c.store_id=d.store_id AND c.fecha=d.fecha
    GROUP BY d.store_id, WEEKDAY(d.fecha), ELT(WEEKDAY(d.fecha)+1,'Lunes','Martes','Miercoles','Jueves','Viernes','Sabado','Domingo')
    ORDER BY tienda, alquileres_promedio DESC, dia_numero`,
};

async function query(sql) {
  const { stdout } = await execute(process.env.MYSQL_BIN || 'mysql', [
    '--host=' + (process.env.DB_HOST || '127.0.0.1'),
    '--port=' + (process.env.DB_PORT || '3306'),
    '--user=' + (process.env.DB_USER || 'root'),
    '--database=' + (process.env.DB_NAME || 'sakila'),
    '--default-character-set=utf8mb4', '--connect-timeout=5', '--batch', '--raw', '--execute', sql,
  ], {
    env: { ...process.env, MYSQL_PWD: process.env.DB_PASSWORD || '' },
    timeout: 15000, maxBuffer: 1024 * 1024, windowsHide: true,
  });
  const [header, ...lines] = stdout.trim().split(/\r?\n/);
  const columns = header.split('\t');
  return lines.map(line => Object.fromEntries(line.split('\t').map((value, index) =>
    [columns[index], value === 'NULL' ? null : value])));
}

async function analyze(name) {
  if (!Object.hasOwn(queries, name)) throw new Error('Análisis desconocido.');
  const rows = await query(queries[name]);
  return { herramienta: name, sql: queries[name], filas: rows };
}

module.exports = { analyze, queries, query };
