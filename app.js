/* Tiffin Table: data mirrors database/02_seed.sql.
   Cart, orders and availability persist in localStorage, which stands in for MySQL. */

const CATEGORIES = [
  { id: 1, name: "Starters" }, { id: 2, name: "Mains" },
  { id: 3, name: "Breads & Rice" }, { id: 4, name: "Drinks & Sweets" },
];
const MENU = [
  [1,1,"Paneer Tikka","Charred cottage cheese, mint chutney",220,1],
  [2,1,"Chicken 65","Crisp, curry leaf and green chilli",260,0],
  [3,1,"Mirchi Bajji","Stuffed chillies fried in gram flour",120,1],
  [4,2,"Butter Chicken","Tomato-cream gravy, kasuri methi",320,0],
  [5,2,"Dal Tadka","Yellow lentils, ghee and garlic tempering",180,1],
  [6,2,"Gongura Mutton","Andhra-style sorrel leaf curry",380,0],
  [7,3,"Hyderabadi Biryani","Dum-cooked basmati, raita on the side",299,0],
  [8,3,"Veg Pulao","Fragrant rice with seasonal vegetables",190,1],
  [9,3,"Butter Naan","Tandoor-baked, brushed with butter",50,1],
  [10,4,"Masala Chai","Ginger, cardamom, strong",40,1],
  [11,4,"Mango Lassi","Thick yogurt and Alphonso pulp",90,1],
  [12,4,"Double Ka Meetha","Bread pudding, saffron milk, nuts",110,1],
].map(([id, category_id, name, description, price, is_veg]) =>
  ({ id, category_id, name, description, price, is_veg: !!is_veg }));

const STATUSES = ["Placed", "Preparing", "Out for delivery", "Delivered"];
const $ = (s) => document.querySelector(s);
const rupee = (n) => "₹" + n.toLocaleString("en-IN");

/* ---------- storage ---------- */
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

const state = {
  cart: load("tt_cart", {}),              // { menu_item_id: quantity }
  orders: load("tt_orders", []),
  unavailable: load("tt_off", []),        // ids with available = FALSE
  cat: 0, q: "", vegOnly: false,
};
const byId = (id) => MENU.find((m) => m.id === id);
const isOn = (m) => !state.unavailable.includes(m.id);

/* ---------- menu ---------- */
function renderChips() {
  const all = [{ id: 0, name: "All" }, ...CATEGORIES];
  $("#chips").innerHTML = all.map((c) =>
    `<button class="chip ${state.cat === c.id ? "on" : ""}" data-cat="${c.id}">${c.name}</button>`).join("");
}

function renderMenu() {
  const q = state.q.trim().toLowerCase();
  let html = "";
  for (const c of CATEGORIES) {
    if (state.cat && state.cat !== c.id) continue;
    const items = MENU.filter((m) => m.category_id === c.id &&
      (!state.vegOnly || m.is_veg) &&
      (!q || (m.name + m.description).toLowerCase().includes(q)));
    if (!items.length) continue;
    html += `<h2 class="cat">${c.name}</h2>` + items.map(itemRow).join("");
  }
  $("#menuList").innerHTML = html || `<p class="empty">No dishes match. Clear the search or filters.</p>`;
}

function itemRow(m) {
  const on = isOn(m);
  return `<div class="item ${on ? "" : "off"}">
    <span class="dot ${m.is_veg ? "" : "nv"}" title="${m.is_veg ? "Vegetarian" : "Non-vegetarian"}"></span>
    <div><h3>${m.name}</h3><p>${m.description}</p></div>
    <div class="buy"><span class="price">${rupee(m.price)}</span>
      <button class="add" data-add="${m.id}" ${on ? "" : "disabled"}>${on ? "Add" : "Sold out"}</button></div>
  </div>`;
}

/* ---------- cart ---------- */
const cartTotal = () => Object.entries(state.cart).reduce((s, [id, q]) => s + byId(+id).price * q, 0);
const cartCount = () => Object.values(state.cart).reduce((s, q) => s + q, 0);

function changeQty(id, delta) {
  const n = (state.cart[id] || 0) + delta;
  if (n <= 0) delete state.cart[id]; else state.cart[id] = n;
  save("tt_cart", state.cart);
  renderCart();
}

function renderCart() {
  const ids = Object.keys(state.cart);
  $("#cartCount").textContent = cartCount();
  $("#cartTotal").textContent = rupee(cartTotal());
  $("#cartItems").innerHTML = ids.length ? ids.map((id) => {
    const m = byId(+id), q = state.cart[id];
    return `<div class="line"><b>${m.name}</b><span>${rupee(m.price * q)}</span>
      <span class="qty"><button data-dec="${id}" aria-label="Remove one ${m.name}">−</button><span>${q}</span><button data-inc="${id}" aria-label="Add one ${m.name}">+</button></span></div>`;
  }).join("") : `<p class="empty">Your cart is empty. Add a dish from the menu.</p>`;
}

function placeOrder() {
  const name = $("#custName").value.trim(), phone = $("#custPhone").value.trim(), addr = $("#custAddr").value.trim();
  const msg = $("#formMsg");
  if (!cartCount()) return (msg.textContent = "Add at least one dish before ordering.");
  if (!name || !addr) return (msg.textContent = "Enter your name and delivery address.");
  if (!/^\d{10}$/.test(phone)) return (msg.textContent = "Enter a 10-digit phone number.");

  // Same shape as the orders + order_items tables; price_at_order is frozen here.
  const order = {
    id: (state.orders.at(-1)?.id || 2) + 1,
    customer: { name, phone, address: addr },
    status: "Placed",
    created_at: new Date().toISOString(),
    total_amount: cartTotal(),
    items: Object.entries(state.cart).map(([id, quantity]) =>
      ({ menu_item_id: +id, quantity, price_at_order: byId(+id).price })),
  };
  state.orders.push(order); save("tt_orders", state.orders);
  state.cart = {}; save("tt_cart", state.cart);
  msg.textContent = ""; renderCart(); toggleCart(false); show("orders");
}

function toggleCart(open) {
  $("#cart").classList.toggle("open", open);
  $("#scrim").hidden = !open;
}

/* ---------- orders & kitchen ---------- */
function orderCard(o, admin) {
  const step = STATUSES.indexOf(o.status);
  const lines = o.items.map((i) => `<li>${i.quantity} × ${byId(i.menu_item_id).name}, ${rupee(i.price_at_order * i.quantity)}</li>`).join("");
  const track = `<div class="track" aria-hidden="true">${STATUSES.map((_, i) => `<i class="${i <= step ? "done" : ""}"></i>`).join("")}</div>`;
  const ctl = admin ? `<label>Status <select data-status="${o.id}">${STATUSES.map((s) =>
      `<option ${s === o.status ? "selected" : ""}>${s}</option>`).join("")}</select></label>` : "";
  return `<article class="order"><header>
      <strong>Order #${o.id}${admin ? ", " + o.customer.name : ""}</strong>
      <span class="badge ${o.status}">${o.status}</span></header>
      ${track}<ul>${lines}</ul>
      <p><strong>${rupee(o.total_amount)}</strong> · ${new Date(o.created_at).toLocaleString("en-IN")}</p>${ctl}</article>`;
}

function renderOrders() {
  const list = [...state.orders].reverse();
  $("#orderList").innerHTML = list.length ? list.map((o) => orderCard(o, false)).join("")
    : `<p class="empty">No orders yet. Pick something from the menu.</p>`;
}

function renderAdmin() {
  const list = [...state.orders].reverse();
  $("#adminList").innerHTML = list.length ? list.map((o) => orderCard(o, true)).join("")
    : `<p class="empty">No orders to prepare yet.</p>`;
  $("#availList").innerHTML = MENU.map((m) =>
    `<label><input type="checkbox" data-avail="${m.id}" ${isOn(m) ? "checked" : ""}> ${m.name}</label>`).join("");
}

/* ---------- navigation & events ---------- */
function show(view) {
  document.querySelectorAll(".view").forEach((v) => (v.hidden = v.id !== "view-" + view));
  document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t.dataset.view === view));
  if (view === "orders") renderOrders();
  if (view === "admin") renderAdmin();
  if (view === "menu") renderMenu();
}

document.addEventListener("click", (e) => {
  const t = e.target;
  if (t.dataset.view) show(t.dataset.view);
  if (t.dataset.cat !== undefined) { state.cat = +t.dataset.cat; renderChips(); renderMenu(); }
  if (t.dataset.add) changeQty(+t.dataset.add, 1);
  if (t.dataset.inc) changeQty(+t.dataset.inc, 1);
  if (t.dataset.dec) changeQty(+t.dataset.dec, -1);
});
document.addEventListener("change", (e) => {
  const t = e.target;
  if (t.dataset.status) {
    state.orders.find((o) => o.id === +t.dataset.status).status = t.value;
    save("tt_orders", state.orders); renderAdmin();
  }
  if (t.dataset.avail) {
    const id = +t.dataset.avail;
    state.unavailable = t.checked ? state.unavailable.filter((x) => x !== id) : [...state.unavailable, id];
    save("tt_off", state.unavailable);
    // drop sold-out items from the cart
    if (!t.checked && state.cart[id]) { delete state.cart[id]; save("tt_cart", state.cart); renderCart(); }
  }
});
$("#search").addEventListener("input", (e) => { state.q = e.target.value; renderMenu(); });
$("#vegOnly").addEventListener("change", (e) => { state.vegOnly = e.target.checked; renderMenu(); });
$("#cartToggle").addEventListener("click", () => toggleCart(true));
$("#cartClose").addEventListener("click", () => toggleCart(false));
$("#scrim").addEventListener("click", () => toggleCart(false));
$("#placeOrder").addEventListener("click", placeOrder);
document.addEventListener("keydown", (e) => e.key === "Escape" && toggleCart(false));

renderChips(); renderMenu(); renderCart();
