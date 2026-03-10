"use strict";
/*
__autor__ = "Gabriel Esteban Paz Guerrero"
__license__ = "GPL"
__version__ = "1.0.0"
__email__ = "gabriel.pazg@campusucc.edu.com"
*/
/** Taller Listas: flujo restaurante (Cliente, Mesero, Cocina, Caja). Toda la lógica con listas. */
// Precios COP por palabra clave en el ítem
const PRECIOS_COP = {
    hamburguesa: 18000, papas: 8000, gaseosa: 4500, jugo: 5000, pizza: 22000,
    perro: 12000, ensalada: 14000, café: 3500, agua: 2500, postre: 9000, sopa: 11000
};
const DEFAULT_COP = 12000;
function precioItem(nombre) {
    const k = nombre.toLowerCase();
    for (const [p, v] of Object.entries(PRECIOS_COP))
        if (k.includes(p))
            return v;
    return DEFAULT_COP;
}
function totalPedido(items) {
    return items.reduce((s, i) => s + precioItem(i), 0);
}
function formatCOP(n) {
    return Math.round(n).toLocaleString("es-CO");
}
// Clase con listas para cada etapa del flujo (add, search, update, delete entre listas)
class RestaurantFlow {
    constructor() {
        this.pending = [];
        this.kitchen = [];
        this.ready = [];
        this.served = [];
        this.billing = [];
        this.completed = [];
        this.cajaRegistro = [];
    }
    add(list, o) { list.push(o); }
    find(list, id) { return list.findIndex(o => o.id === id); }
    move(from, to, id, update) {
        const i = this.find(from, id);
        if (i === -1)
            return false;
        const o = { ...from[i], ...update };
        from.splice(i, 1);
        this.add(to, o);
        return true;
    }
    requestOrder(id, items, customerName = "") {
        const o = { id, items: items.map(s => s.trim()), customerName: customerName.trim() || "—", status: "requested", createdAt: new Date() };
        this.add(this.pending, o);
        return o;
    }
    nextStep(orderId) {
        const stages = [this.pending, this.kitchen, this.ready, this.served, this.billing];
        const next = [this.kitchen, this.ready, this.served, this.billing, this.completed];
        for (let i = 0; i < stages.length; i++) {
            const idx = this.find(stages[i], orderId);
            if (idx === -1)
                continue;
            const order = stages[i][idx];
            if (i === 0) {
                const ok = this.move(this.pending, this.kitchen, orderId, { status: "in_kitchen" });
                if (ok)
                    this.cajaRegistro.push({ id: order.id, customerName: order.customerName });
                return ok;
            }
            if (i === 3)
                return this.move(this.served, this.billing, orderId, { status: "billing", total: totalPedido(order.items) });
            return this.move(stages[i], next[i], orderId, { status: next[i] === this.ready ? "ready" : next[i] === this.served ? "served" : "completed" });
        }
        return false;
    }
    getNextAction(stage) {
        const t = { pending: "Derivar a Cocina y Caja", kitchen: "Elaborar pedido", ready: "Servir al cliente", served: "Pedir cuenta", billing: "Pagar" };
        return t[stage] || "";
    }
    getState() {
        const completedIds = new Set(this.completed.map(o => o.id));
        return {
            lists: { pending: this.pending, kitchen: this.kitchen, ready: this.ready, served: this.served, billing: this.billing, completed: this.completed },
            cajaPorCobrar: this.cajaRegistro.filter(r => !completedIds.has(r.id)),
            completed: this.completed,
            totalCobrado: this.completed.reduce((s, o) => s + (o.total ?? 0), 0),
            formatCOP,
            getNextAction: this.getNextAction.bind(this)
        };
    }
}
const flow = new RestaurantFlow();
// Browser: exponer API para el HTML (en Node no existe window)
if (typeof globalThis.window !== "undefined") {
    globalThis.RestaurantApp = {
        addOrder: (id, items, name) => flow.requestOrder(id, items, name),
        nextStep: (id) => flow.nextStep(id),
        getState: () => flow.getState()
    };
}
