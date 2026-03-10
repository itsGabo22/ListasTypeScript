# Taller Listas - Flujo restaurante

Taller de Estructuras de Datos sobre listas. El proyecto modela el proceso de una orden en un restaurante (Cliente, Mesero, Cocina, Caja) usando **listas** (arreglos) para manejar el estado de los pedidos.

## Uso de listas (filas)

Los pedidos pasan por varias listas según el flujo:

- **Pendientes** → el mozo recoge y envía a cocina/caja
- **En cocina** → cocina elabora
- **Listos** → mozo sirve
- **Servidos** → cliente pide cuenta
- **Cuenta** → caja calcula total, cliente paga
- **Completados** → quedan en la caja del restaurante y se suma el total

En el código se usan las operaciones básicas de listas: **agregar** (add), **buscar** (search), **actualizar** estado entre listas (update) y **eliminar/completar** (delete/process) al pasar de una lista a otra.

## Qué contiene el sistema

- **restaurant.ts**: lógica del flujo en TypeScript (clases, listas, operaciones).
- **index.html**: frontend para ver el flujo, agregar pedidos, avanzar pasos y ver la caja con lo completado en COP.

## Cómo inicializarlo

1. **Frontend (recomendado):**  
   Abre `index.html` en el navegador (doble clic o arrastrar al Chrome/Edge). No hace falta servidor.

2. **TypeScript por consola:**  
   Instala dependencias y ejecuta:
   ```bash
   npm install
   npm start
   ```
   (o `npx ts-node restaurant.ts`).

---

_Taller Listas - Estructuras de Datos_
