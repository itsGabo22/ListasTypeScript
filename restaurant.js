"use strict";
/*
__autor__ = "Gabriel Esteban Paz Guerrero"
__license__ = "GPL"
__version__ = "1.0.0"
__email__ = "gabriel.pazg@campusucc.edu.com"
*/
// ============ Clase principal: flujo del restaurante con listas ============
class RestaurantFlow {
    constructor() {
        // Listas que representan el estado de los pedidos en cada etapa del proceso
        this.pendingOrders = []; // Pedidos recogidos por el mozo, enviados a cocina/caja
        this.kitchenOrders = []; // Pedidos en elaboración en cocina
        this.readyOrders = []; // Pedidos listos para servir
        this.servedOrders = []; // Pedidos ya servidos al cliente
        this.billingOrders = []; // Pedidos con cuenta solicitada
        this.completedOrders = []; // Pedidos pagados (ciclo completado)
    }
    // ---------- Operaciones básicas de listas ----------
    /** Agregar un pedido a una lista (add) */
    addToList(list, order) {
        list.push(order);
    }
    /** Buscar un pedido por id en una lista (search). Retorna índice o -1 */
    searchInList(list, orderId) {
        return list.findIndex((o) => o.id === orderId);
    }
    /** Buscar pedido por id en cualquier lista; retorna el pedido y la lista donde está */
    searchOrder(orderId) {
        const lists = [
            { name: "pendingOrders", arr: this.pendingOrders },
            { name: "kitchenOrders", arr: this.kitchenOrders },
            { name: "readyOrders", arr: this.readyOrders },
            { name: "servedOrders", arr: this.servedOrders },
            { name: "billingOrders", arr: this.billingOrders },
            { name: "completedOrders", arr: this.completedOrders },
        ];
        for (const { name, arr } of lists) {
            const idx = this.searchInList(arr, orderId);
            if (idx !== -1)
                return { order: arr[idx], listName: name };
        }
        return null;
    }
    /** Actualizar estado de un pedido y moverlo de lista (update: remove de una, add en otra) */
    moveOrder(fromList, toList, orderId, updateStatus, extra) {
        const idx = this.searchInList(fromList, orderId);
        if (idx === -1)
            return false;
        const order = fromList[idx];
        fromList.splice(idx, 1); // Eliminar de la lista origen
        const updated = { ...order, status: updateStatus, ...extra };
        this.addToList(toList, updated); // Agregar a la lista destino
        return true;
    }
    /** Eliminar/completar: quitar de una lista (p. ej. al finalizar). Aquí "completar" es mover a completedOrders. */
    removeFromList(list, orderId) {
        const idx = this.searchInList(list, orderId);
        if (idx === -1)
            return null;
        const [order] = list.splice(idx, 1);
        return order;
    }
    // ---------- Flujo del proceso (según diagrama) ----------
    /** 1. Cliente solicita el pedido → se crea y queda en cola para el mozo (lista interna: requested) */
    requestOrder(orderId, items) {
        const order = {
            id: orderId,
            items: [...items],
            status: "requested",
            createdAt: new Date(),
        };
        // El mozo "recoge" el pedido: lo agregamos a pendientes (mozo envía a cocina y caja)
        this.addToList(this.pendingOrders, order);
        return order;
    }
    /** 2. Mozo recoge el pedido y lo envía a cocina y a caja */
    waiterPickUpAndSend(orderId) {
        const idx = this.searchInList(this.pendingOrders, orderId);
        if (idx === -1)
            return false;
        const order = this.pendingOrders[idx];
        this.pendingOrders.splice(idx, 1);
        const toKitchen = { ...order, status: "in_kitchen" };
        this.addToList(this.kitchenOrders, toKitchen);
        // Caja también recibe el pedido (se registra para después calcular total)
        return true;
    }
    /** 3. Cocina elabora el pedido → cambio de estado en la lista */
    kitchenPrepareOrder(orderId) {
        return this.moveOrder(this.kitchenOrders, this.readyOrders, orderId, "ready");
    }
    /** 4. Mozo sirve el pedido */
    waiterServeOrder(orderId) {
        return this.moveOrder(this.readyOrders, this.servedOrders, orderId, "served");
    }
    /** 5a. Cliente pide la cuenta → Mozo pide cuenta → Caja calcula total */
    requestBill(orderId, total) {
        const idx = this.searchInList(this.servedOrders, orderId);
        if (idx === -1)
            return false;
        const order = this.servedOrders[idx];
        this.servedOrders.splice(idx, 1);
        const forBilling = { ...order, status: "billing", total };
        this.addToList(this.billingOrders, forBilling);
        return true;
    }
    /** 5b. Cliente paga → se completa el ciclo (delete/process: sale de billing, entra a completed) */
    payOrder(orderId) {
        const order = this.removeFromList(this.billingOrders, orderId);
        if (!order)
            return false;
        const completed = { ...order, status: "completed" };
        this.addToList(this.completedOrders, completed);
        return true;
    }
    // ---------- Utilidad: resumen de listas para consola ----------
    getSummary() {
        return {
            pending: this.pendingOrders.length,
            kitchen: this.kitchenOrders.length,
            ready: this.readyOrders.length,
            served: this.servedOrders.length,
            billing: this.billingOrders.length,
            completed: this.completedOrders.length,
        };
    }
    getCompletedOrders() {
        return [...this.completedOrders];
    }
}
// ============ Ejemplo de uso en consola ============
const flow = new RestaurantFlow();
// 1. Cliente solicita el pedido
flow.requestOrder("ORD-001", ["Hamburguesa", "Papas fritas", "Gaseosa"]);
console.log("--- Después de solicitar pedido ---");
console.log(flow.getSummary());
// 2. Mozo recoge y envía a cocina y caja
flow.waiterPickUpAndSend("ORD-001");
console.log("\n--- Después de que el mozo envía a cocina/caja ---");
console.log(flow.getSummary());
// 3. Cocina elabora el pedido
flow.kitchenPrepareOrder("ORD-001");
console.log("\n--- Después de que cocina elabora ---");
console.log(flow.getSummary());
// 4. Mozo sirve el pedido
flow.waiterServeOrder("ORD-001");
console.log("\n--- Después de servir al cliente ---");
console.log(flow.getSummary());
// 5. Cliente pide cuenta; caja calcula total; cliente paga
flow.requestBill("ORD-001", 25.5);
console.log("\n--- Después de pedir cuenta (total calculado) ---");
console.log(flow.getSummary());
flow.payOrder("ORD-001");
console.log("\n--- Después de pagar (ciclo completado) ---");
console.log(flow.getSummary());
console.log("Pedidos completados:", flow.getCompletedOrders());
// Prueba de búsqueda
const found = flow.searchOrder("ORD-001");
console.log("\n--- Búsqueda de ORD-001 (debe estar en completedOrders) ---");
console.log(found);
