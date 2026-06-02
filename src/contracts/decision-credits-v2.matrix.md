# Decision Credits V2 - matriz comercial y tecnica

Estado: sandbox funcional para validacion de Mateo. Requiere revision legal/contable antes de salida productiva.

## Redaccion comercial sugerida

Decision Credits reconoce la reciprocidad del Data Partner por aportar informacion vigente e historica al ecosistema Decision Data. Los creditos no son prepago, no tienen valor redimible en dinero y se liquidan dentro del modelo mensual postpago.

El dato vigente M0 del sujeto de riesgo genera 1 Decision Credit. La serie historica M-1 a M-48 suma 4 Decision Credits adicionales con una ponderacion logaritmica que premia los datos mas recientes. Por tanto, la serie completa M0 a M-48 suma 5 Decision Credits por sujeto.

Para Data Partner Contributor, el beneficio se limita al reporte basico. Panorama completo, reportes inteligentes o calculados se cobran como Cliente Normal, salvo que el cliente migre a Data Partner Active o Data Partner Founding.

Para Data Partner Active y Data Partner Founding, los Decision Credits habilitan reporte basico gratuito y tarifa preferencial en Panorama completo. Cuando el saldo de Decision Credits se agota, los consumos adicionales se liquidan a tarifa de Cliente Normal.

## Formula de generacion

```text
credito(M0) = 1

credito(m) =
  4 * ln(50 / (m + 1))
  / sum(ln(50 / (i + 1)), i = 1..48)
```

Donde:

- `m = 1` es M-1.
- `m = 48` es M-48.
- La suma de M-1 a M-48 es 4.
- La suma de M0 a M-48 es 5.

## Depreciacion de saldo

La depreciacion del saldo en cuenta del cliente es distinta a la depreciacion del valor del dato.

```text
saldo_corte = max(0, saldo_anterior + carga_historica + carga_actual - dep_mensual)
dep_mensual = 1 / 12 = 0.083333 Decision Credits
```

Uso comercial:

- Incentiva carga mensual de datos actualizados.
- Evita castigar agresivamente al cliente por no usar la plataforma.
- Reduce lentamente saldos dormidos.
- No convierte los credits en prepago ni en saldo monetario.

## Matriz por modalidad

| Modalidad | Genera credits | Reporte basico | Panorama completo | Exceso sin saldo |
| --- | --- | --- | --- | --- |
| Cliente Normal | No | Tarifa Cliente Normal | Tarifa Cliente Normal | Tarifa Cliente Normal |
| Data Partner Contributor | M0 = 1; historico completo = 4 | Gratis usando 1 credit | Cliente Normal | Cliente Normal |
| Data Partner Active | M0 = 1; historico completo = 4 | Gratis usando 1 credit | Tarifa Active usando 1 credit | Cliente Normal |
| Data Partner Founding | M0 = 1; historico completo = 4 | Gratis usando 1 credit | Tarifa Founding usando 1 credit | Cliente Normal |

## Ejemplo de generacion

| Carga recibida | Creditos generados | Lectura |
| --- | ---: | --- |
| Solo M0 | 1.00 | Dato vigente actualizado |
| Solo M-1 a M-48 | 4.00 | Serie historica completa |
| M0 a M-48 | 5.00 | Serie completa del sujeto |
| M0 mensual recurrente | 1.00 por mes | Incentivo de actualizacion mensual |

## Ejemplo de depreciacion de saldo

| Mes | Saldo anterior | Historico | Carga actual | Dep. | Saldo al corte |
| --- | ---: | ---: | ---: | ---: | ---: |
| M0 | 0.00 | 4.00 | 1.00 | 0.000000 | 5.00 |
| M1 | 5.00 | 0.00 | 1.00 | 0.083333 | 5.92 |
| M2 | 5.92 | 0.00 | 1.00 | 0.083333 | 6.83 |
| M6 | 9.58 | 4.00 | 1.00 | 0.083333 | 14.50 |
| M12 | 19.08 | 0.00 | 1.00 | 0.083333 | 20.00 |

## Reglas para programacion

- Calcular creditos por sujeto de riesgo y periodo reportado, no solo por archivo.
- El identificador unificado puede ser cedula, RUC o codigo SB.
- Duplicados se descartan por sujeto-periodo antes del calculo y no generan credits.
- Si la calidad del bloque es menor a 95%, el bloque no genera Decision Credits.
- Redondear creditos a dos decimales para visualizacion.
- El ledger debe guardar creditos generados, consumidos, depreciados, saldo, sujeto, periodo, fuente, carga, usuario, canal y BAC/auditoria.
- Decision Credits no son prepago ni saldo monetario.
- Cualquier excepcion comercial, regulatoria, contable o de pricing requiere aprobacion de Mateo antes de implementarse en produccion.
