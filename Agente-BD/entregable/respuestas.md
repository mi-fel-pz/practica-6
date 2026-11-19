# Agente BD · Sakila

## Conexión y criterios

Consulta real a MySQL y respuestas generadas mediante herramientas de OpenRouter.

```json
[
  {
    "base": "sakila",
    "version": "8.4.3",
    "primer_alquiler": "2005-05-24 22:53:30",
    "ultimo_alquiler": "2006-02-14 15:16:03",
    "alquileres": "16044"
  }
]
```

Se recomiendan películas Action de más de 120 minutos por número de alquileres históricos. La señal de inactividad considera clientes activos con 30 días sin alquilar, usando el último alquiler de Sakila como corte. El movimiento se compara por alquileres promedio diarios por tienda. Los promedios usan las fechas con alquileres o pagos registrados por tienda. Los cobros se agrupan por su fecha de pago y por la tienda del empleado que los registró. La base no especifica moneda.

## Recomiéndame 3 películas de acción que sean largas (más de 2 horas) pero que la gente alquile muy seguido en la tienda.

Aquí tienes las 3 películas de acción que tienen una duración de más de 2 horas y han sido alquiladas con frecuencia en la tienda:

1. **STORY SIDE**
   - Duración: 163 minutos
   - Alquileres: 28
   - Copias: 7
   - Alquileres por copia: 4.00

2. **EASY GLADIATOR**
   - Duración: 148 minutos
   - Alquileres: 23
   - Copias: 5
   - Alquileres por copia: 4.60

3. **FOOL MOCKINGBIRD**
   - Duración: 158 minutos
   - Alquileres: 23
   - Copias: 6
   - Alquileres por copia: 3.83

Estas películas son las que han tenido una mayor cantidad de alquileres históricos en la tienda.

### Consulta ejecutada

```sql
SELECT f.film_id, f.title, f.length AS minutos,
    COUNT(r.rental_id) AS alquileres,
    COUNT(DISTINCT i.inventory_id) AS copias,
    ROUND(COUNT(r.rental_id) / COUNT(DISTINCT i.inventory_id), 2) AS alquileres_por_copia
    FROM film f JOIN film_category fc ON fc.film_id = f.film_id
    JOIN category c ON c.category_id = fc.category_id
    JOIN inventory i ON i.film_id = f.film_id
    LEFT JOIN rental r ON r.inventory_id = i.inventory_id
    WHERE c.name = 'Action' AND f.length > 120
    GROUP BY f.film_id, f.title, f.length
    ORDER BY alquileres DESC, f.title LIMIT 3;
```

### Resultado de MySQL

```json
[
  {
    "film_id": "850",
    "title": "STORY SIDE",
    "minutos": "163",
    "alquileres": "28",
    "copias": "7",
    "alquileres_por_copia": "4.00"
  },
  {
    "film_id": "271",
    "title": "EASY GLADIATOR",
    "minutos": "148",
    "alquileres": "23",
    "copias": "5",
    "alquileres_por_copia": "4.60"
  },
  {
    "film_id": "327",
    "title": "FOOL MOCKINGBIRD",
    "minutos": "158",
    "alquileres": "23",
    "copias": "6",
    "alquileres_por_copia": "3.83"
  }
]
```

## ¿Qué clientes crees que están a punto de dejar el servicio porque llevan mucho tiempo sin alquilar ninguna película?

He identificado una lista de clientes que están inactivos y que podrían estar a punto de dejar el servicio, dado que no han alquilado durante más de 30 días. La fecha de corte considerada es el **14 de febrero de 2006**. Es importante mencionar que esta inactividad es solo una señal para seguimiento y no una confirmación de abandono. A continuación se presentan los detalles:

1. **HERBERT KRUGER**
   - Tienda: 2
   - Alquileres: 20
   - Último alquiler: 17 de agosto de 2005
   - Días sin alquilar: 181

2. **JOSE ANDREW**
   - Tienda: 1
   - Alquileres: 25
   - Último alquiler: 19 de agosto de 2005
   - Días sin alquilar: 179

3. **VERNON CHAPA**
   - Tienda: 2
   - Alquileres: 18
   - Último alquiler: 19 de agosto de 2005
   - Días sin alquilar: 179

4. **CLYDE TOBIAS**
   - Tienda: 1
   - Alquileres: 29
   - Último alquiler: 19 de agosto de 2005
   - Días sin alquilar: 179

5. **GENE SANBORN**
   - Tienda: 1
   - Alquileres: 27
   - Último alquiler: 19 de agosto de 2005
   - Días sin alquilar: 179

6. **BYRON BOX**
   - Tienda: 1
   - Alquileres: 29
   - Último alquiler: 19 de agosto de 2005
   - Días sin alquilar: 179

7. **CAROL GARCIA**
   - Tienda: 2
   - Alquileres: 22
   - Último alquiler: 20 de agosto de 2005
   - Días sin alquilar: 178

8. **ANNE POWELL**
   - Tienda: 2
   - Alquileres: 23
   - Último alquiler: 20 de agosto de 2005
   - Días sin alquilar: 178

9. **JOANN GARDNER**
   - Tienda: 2
   - Alquileres: 16
   - Último alquiler: 20 de agosto de 2005
   - Días sin alquilar: 178

10. **IDA ANDREWS**
    - Tienda: 2
    - Alquileres: 23
    - Último alquiler: 20 de agosto de 2005
    - Días sin alquilar: 178

Sería recomendable seguir el comportamiento de estos clientes para determinar si efectivamente pueden estar abandonando el servicio.

### Consulta ejecutada

```sql
SELECT c.customer_id, CONCAT(c.first_name, ' ', c.last_name) AS cliente,
    c.store_id AS tienda, COUNT(r.rental_id) AS alquileres,
    MAX(r.rental_date) AS ultimo_alquiler,
    DATE((SELECT MAX(rental_date) FROM rental)) AS fecha_corte,
    DATEDIFF((SELECT MAX(rental_date) FROM rental), MAX(r.rental_date)) AS dias_sin_alquilar
    FROM customer c LEFT JOIN rental r ON r.customer_id = c.customer_id
    WHERE c.active = 1
    GROUP BY c.customer_id, c.first_name, c.last_name, c.store_id
    HAVING ultimo_alquiler IS NULL OR dias_sin_alquilar >= 30
    ORDER BY ultimo_alquiler IS NOT NULL, dias_sin_alquilar DESC, c.customer_id LIMIT 10;
```

### Resultado de MySQL

```json
[
  {
    "customer_id": "428",
    "cliente": "HERBERT KRUGER",
    "tienda": "2",
    "alquileres": "20",
    "ultimo_alquiler": "2005-08-17 00:40:03",
    "fecha_corte": "2006-02-14",
    "dias_sin_alquilar": "181"
  },
  {
    "customer_id": "326",
    "cliente": "JOSE ANDREW",
    "tienda": "1",
    "alquileres": "25",
    "ultimo_alquiler": "2005-08-19 01:38:18",
    "fecha_corte": "2006-02-14",
    "dias_sin_alquilar": "179"
  },
  {
    "customer_id": "483",
    "cliente": "VERNON CHAPA",
    "tienda": "2",
    "alquileres": "18",
    "ultimo_alquiler": "2005-08-19 03:10:21",
    "fecha_corte": "2006-02-14",
    "dias_sin_alquilar": "179"
  },
  {
    "customer_id": "485",
    "cliente": "CLYDE TOBIAS",
    "tienda": "1",
    "alquileres": "29",
    "ultimo_alquiler": "2005-08-19 09:36:28",
    "fecha_corte": "2006-02-14",
    "dias_sin_alquilar": "179"
  },
  {
    "customer_id": "498",
    "cliente": "GENE SANBORN",
    "tienda": "1",
    "alquileres": "27",
    "ultimo_alquiler": "2005-08-19 03:46:43",
    "fecha_corte": "2006-02-14",
    "dias_sin_alquilar": "179"
  },
  {
    "customer_id": "573",
    "cliente": "BYRON BOX",
    "tienda": "1",
    "alquileres": "29",
    "ultimo_alquiler": "2005-08-19 11:27:20",
    "fecha_corte": "2006-02-14",
    "dias_sin_alquilar": "179"
  },
  {
    "customer_id": "18",
    "cliente": "CAROL GARCIA",
    "tienda": "2",
    "alquileres": "22",
    "ultimo_alquiler": "2005-08-20 01:29:29",
    "fecha_corte": "2006-02-14",
    "dias_sin_alquilar": "178"
  },
  {
    "customer_id": "85",
    "cliente": "ANNE POWELL",
    "tienda": "2",
    "alquileres": "23",
    "ultimo_alquiler": "2005-08-20 10:25:12",
    "fecha_corte": "2006-02-14",
    "dias_sin_alquilar": "178"
  },
  {
    "customer_id": "164",
    "cliente": "JOANN GARDNER",
    "tienda": "2",
    "alquileres": "16",
    "ultimo_alquiler": "2005-08-20 00:30:51",
    "fecha_corte": "2006-02-14",
    "dias_sin_alquilar": "178"
  },
  {
    "customer_id": "183",
    "cliente": "IDA ANDREWS",
    "tienda": "2",
    "alquileres": "23",
    "ultimo_alquiler": "2005-08-20 03:35:16",
    "fecha_corte": "2006-02-14",
    "dias_sin_alquilar": "178"
  }
]
```

## Hazme un análisis rápido de qué día de la semana hay más movimiento en las tiendas y cuánto dinero promedio se recauda en esos días.

Aquí tienes un análisis del movimiento semanal en las tiendas, destacando el día con más actividad en cuanto a alquileres y el ingreso promedio diario correspondiente:

### Tienda 1
- **Día con más Alquileres**: **Domingo**
  - **Alquileres**: 1154
  - **Promedio de Alquileres**: 230.80
  - **Ingreso Total**: 4747.56
  - **Ingreso Promedio Diario**: 949.51

### Tienda 2
- **Día con más Alquileres**: **Domingo**
  - **Alquileres**: 1166
  - **Promedio de Alquileres**: 233.20
  - **Ingreso Total**: 4998.24
  - **Ingreso Promedio Diario**: 999.65

#### Resumen
- El **domingo** es el día de mayor movimiento tanto en la **Tienda 1** como en la **Tienda 2**.
- La **Tienda 1** genera un ingreso promedio diario de **949.51** unidades monetarias, mientras que la **Tienda 2** genera **999.65** unidades monetarias.

### Notas:
- Los promedios se calcularon sobre las fechas en las que hubo actividad registrada en cada tienda, lo cual asegura que las cifras reflejen días efectivamente activos. 
- Se observa un fuerte rendimiento en los domingos, lo cual podría influir en decisiones de inventario y marketing.

### Consulta ejecutada

```sql
WITH alquileres AS (
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
    ORDER BY tienda, alquileres_promedio DESC, dia_numero;
```

### Resultado de MySQL

```json
[
  {
    "tienda": "1",
    "dia_numero": "6",
    "dia": "Domingo",
    "primera_fecha": "2005-05-29",
    "ultima_fecha": "2005-08-21",
    "dias_con_actividad": "5",
    "alquileres": "1154",
    "alquileres_promedio": "230.80",
    "ingreso_total": "4747.56",
    "ingreso_promedio_diario": "949.51"
  },
  {
    "tienda": "1",
    "dia_numero": "5",
    "dia": "Sabado",
    "primera_fecha": "2005-05-28",
    "ultima_fecha": "2005-08-20",
    "dias_con_actividad": "5",
    "alquileres": "1153",
    "alquileres_promedio": "230.60",
    "ingreso_total": "4945.34",
    "ingreso_promedio_diario": "989.07"
  },
  {
    "tienda": "1",
    "dia_numero": "4",
    "dia": "Viernes",
    "primera_fecha": "2005-05-27",
    "ultima_fecha": "2005-08-19",
    "dias_con_actividad": "5",
    "alquileres": "1131",
    "alquileres_promedio": "226.20",
    "ingreso_total": "4596.87",
    "ingreso_promedio_diario": "919.37"
  },
  {
    "tienda": "1",
    "dia_numero": "0",
    "dia": "Lunes",
    "primera_fecha": "2005-05-30",
    "ultima_fecha": "2005-08-22",
    "dias_con_actividad": "5",
    "alquileres": "1126",
    "alquileres_promedio": "225.20",
    "ingreso_total": "4694.61",
    "ingreso_promedio_diario": "938.92"
  },
  {
    "tienda": "1",
    "dia_numero": "2",
    "dia": "Miercoles",
    "primera_fecha": "2005-05-25",
    "ultima_fecha": "2005-08-17",
    "dias_con_actividad": "5",
    "alquileres": "1071",
    "alquileres_promedio": "214.20",
    "ingreso_total": "4708.60",
    "ingreso_promedio_diario": "941.72"
  },
  {
    "tienda": "1",
    "dia_numero": "3",
    "dia": "Jueves",
    "primera_fecha": "2005-05-26",
    "ultima_fecha": "2005-08-18",
    "dias_con_actividad": "5",
    "alquileres": "1066",
    "alquileres_promedio": "213.20",
    "ingreso_total": "4709.84",
    "ingreso_promedio_diario": "941.97"
  },
  {
    "tienda": "1",
    "dia_numero": "1",
    "dia": "Martes",
    "primera_fecha": "2005-05-24",
    "ultima_fecha": "2006-02-14",
    "dias_con_actividad": "11",
    "alquileres": "1222",
    "alquileres_promedio": "111.09",
    "ingreso_total": "5086.65",
    "ingreso_promedio_diario": "462.42"
  },
  {
    "tienda": "2",
    "dia_numero": "6",
    "dia": "Domingo",
    "primera_fecha": "2005-05-29",
    "ultima_fecha": "2005-08-21",
    "dias_con_actividad": "5",
    "alquileres": "1166",
    "alquileres_promedio": "233.20",
    "ingreso_total": "4998.24",
    "ingreso_promedio_diario": "999.65"
  },
  {
    "tienda": "2",
    "dia_numero": "2",
    "dia": "Miercoles",
    "primera_fecha": "2005-05-25",
    "ultima_fecha": "2005-08-17",
    "dias_con_actividad": "5",
    "alquileres": "1160",
    "alquileres_promedio": "232.00",
    "ingreso_total": "4557.09",
    "ingreso_promedio_diario": "911.42"
  },
  {
    "tienda": "2",
    "dia_numero": "5",
    "dia": "Sabado",
    "primera_fecha": "2005-05-28",
    "ultima_fecha": "2005-08-20",
    "dias_con_actividad": "5",
    "alquileres": "1158",
    "alquileres_promedio": "231.60",
    "ingreso_total": "4991.53",
    "ingreso_promedio_diario": "998.31"
  },
  {
    "tienda": "2",
    "dia_numero": "4",
    "dia": "Viernes",
    "primera_fecha": "2005-05-27",
    "ultima_fecha": "2005-08-19",
    "dias_con_actividad": "5",
    "alquileres": "1141",
    "alquileres_promedio": "228.20",
    "ingreso_total": "4969.40",
    "ingreso_promedio_diario": "993.88"
  },
  {
    "tienda": "2",
    "dia_numero": "3",
    "dia": "Jueves",
    "primera_fecha": "2005-05-26",
    "ultima_fecha": "2005-08-18",
    "dias_con_actividad": "5",
    "alquileres": "1134",
    "alquileres_promedio": "226.80",
    "ingreso_total": "4626.16",
    "ingreso_promedio_diario": "925.23"
  },
  {
    "tienda": "2",
    "dia_numero": "0",
    "dia": "Lunes",
    "primera_fecha": "2005-05-30",
    "ultima_fecha": "2005-08-22",
    "dias_con_actividad": "5",
    "alquileres": "1121",
    "alquileres_promedio": "224.20",
    "ingreso_total": "4650.92",
    "ingreso_promedio_diario": "930.18"
  },
  {
    "tienda": "2",
    "dia_numero": "1",
    "dia": "Martes",
    "primera_fecha": "2005-05-24",
    "ultima_fecha": "2006-02-14",
    "dias_con_actividad": "11",
    "alquileres": "1241",
    "alquileres_promedio": "112.82",
    "ingreso_total": "5133.70",
    "ingreso_promedio_diario": "466.70"
  }
]
```

## Alcance

Las conclusiones describen el historial de Sakila. La señal de inactividad requiere seguimiento para confirmar abandono. La popularidad histórica de las películas no garantiza su disponibilidad actual.
