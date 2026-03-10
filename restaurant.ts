/*
__autor__ = "Gabriel Esteban Paz Guerrero"
__license__ = "GPL"
__version__ = "1.0.0"
__email__ = "gabriel.pazg@campusucc.edu.com"
*/
/** Taller Listas: flujo restaurante (Cliente, Mesero, Cocina, Caja). Toda la lógica con listas. */

type OrderStatus = "requested" | "in_kitchen" | "ready" | "served" | "billing" | "completed";

interface Order {
  id: string;
  items: string[];
  customerName: string;
  status: OrderStatus;
  total?: number;
  createdAt: Date;
}

// Precios COP por palabra clave en el ítem
const PRECIOS_COP: Record<string, number> = {
  hamburguesa: 18000, papas: 8000, gaseosa: 4500, jugo: 5000, pizza: 22000,
  perro: 12000, ensalada: 14000, café: 3500, agua: 2500, postre: 9000, sopa: 11000
};
const DEFAULT_COP = 12000;

function precioItem(nombre: string): number {
  const k = nombre.toLowerCase();
  for (const [p, v] of Object.entries(PRECIOS_COP)) if (k.includes(p)) return v;
  return DEFAULT_COP;
}

function totalPedido(items: string[]): number {
  return items.reduce((s, i) => s + precioItem(i), 0);
}

function formatCOP(n: number): string {
  return Math.round(n).toLocaleString("es-CO");
}

// Clase con listas para cada etapa del flujo (add, search, update, delete entre listas)
class RestaurantFlow {
  private pending: Order[] = [];
  private kitchen: Order[] = [];
  private ready: Order[] = [];
  private served: Order[] = [];
  private billing: Order[] = [];
  private completed: Order[] = [];
  private cajaRegistro: { id: string; customerName: string }[] = [];

  private add(list: Order[], o: Order): void { list.push(o); }
  private find(list: Order[], id: string): number { return list.findIndex(o => o.id === id); }
  private move(from: Order[], to: Order[], id: string, update: Partial<Order>): boolean {
    const i = this.find(from, id);
    if (i === -1) return false;
    const o = { ...from[i], ...update };
    from.splice(i, 1);
    this.add(to, o);
    return true;
  }

  requestOrder(id: string, items: string[], customerName = ""): Order {
    const o: Order = { id, items: items.map(s => s.trim()), customerName: customerName.trim() || "—", status: "requested", createdAt: new Date() };
    this.add(this.pending, o);
    return o;
  }

  nextStep(orderId: string): boolean {
    const stages: Order[][] = [this.pending, this.kitchen, this.ready, this.served, this.billing];
    const next: Order[][] = [this.kitchen, this.ready, this.served, this.billing, this.completed];
    for (let i = 0; i < stages.length; i++) {
      const idx = this.find(stages[i], orderId);
      if (idx === -1) continue;
      const order = stages[i][idx];
      if (i === 0) {
        const ok = this.move(this.pending, this.kitchen, orderId, { status: "in_kitchen" });
        if (ok) this.cajaRegistro.push({ id: order.id, customerName: order.customerName });
        return ok;
      }
      if (i === 3) return this.move(this.served, this.billing, orderId, { status: "billing", total: totalPedido(order.items) });
      return this.move(stages[i], next[i], orderId, { status: next[i] === this.ready ? "ready" : next[i] === this.served ? "served" : "completed" });
    }
    return false;
  }

  getNextAction(stage: string): string {
    const t: Record<string, string> = { pending: "Derivar a Cocina y Caja", kitchen: "Elaborar pedido", ready: "Servir al cliente", served: "Pedir cuenta", billing: "Pagar" };
    return t[stage] || "";
  }

  getState(): {
    lists: Record<string, Order[]>;
    cajaPorCobrar: { id: string; customerName: string }[];
    completed: Order[];
    totalCobrado: number;
    formatCOP: (n: number) => string;
    getNextAction: (stage: string) => string;
  } {
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
if (typeof (globalThis as any).window !== "undefined") {
  (globalThis as any).RestaurantApp = {
    addOrder: (id: string, items: string[], name: string) => flow.requestOrder(id, items, name),
    nextStep: (id: string) => flow.nextStep(id),
    getState: () => flow.getState()
  };
}
