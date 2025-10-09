const fs = require("fs");
const path = require("path");
const saleFile = path.join(__dirname, "saleData.json");
const holdFile = path.join(__dirname, "holdData.json");
const configFile = path.join(__dirname, "config.json");
const userFile = path.join(__dirname, "user.json");


let products = [];
let categories = [];
let companyDetail = [];
let paymentModes = [];
let cart = [];


const ItemPage = {
  configFile: path.join(__dirname,"config.json"),
  productsFile: path.join(__dirname,"products.json"),
  categoriesFile: path.join(__dirname,"categories.json"),
  companyFile: path.join(__dirname,"company.json"),
  paymentFile: path.join(__dirname,"paymentModes.json"),

  config: fs.existsSync(path.join(__dirname,"config.json")) ? JSON.parse(fs.readFileSync(path.join(__dirname,"config.json"),"utf-8")) : {},
  products: [],
  categories: [],
  company: [],
  paymentModes: [],

  // Load local data
  loadData: async function(){
    if(fs.existsSync(this.productsFile)) this.products = JSON.parse(fs.readFileSync(this.productsFile,"utf-8"));
    if(fs.existsSync(this.categoriesFile)) this.categories = JSON.parse(fs.readFileSync(this.categoriesFile,"utf-8"));
if (fs.existsSync(this.companyFile)) {
  let raw = fs.readFileSync(this.companyFile, "utf-8").trim();
  if (raw) {
    try {
      this.company = JSON.parse(raw);
    } catch (e) {
      console.error("❌ company.json corrupted:", e);
      this.company = [];
    }
  } else {
    this.company = []; 
  }
}
    if(fs.existsSync(this.paymentFile)) this.paymentModes = JSON.parse(fs.readFileSync(this.paymentFile,"utf-8"));

    this.renderProducts(this.products);
    this.renderCategories(this.categories);
    this.renderCompany(this.company);
    this.renderPayments(this.paymentModes);
  },

  renderProducts: function(list){
    const container = document.getElementById("item-product-list");
    container.innerHTML = "";
    list.forEach(p=>{
      container.innerHTML += `<div class="col-md-3">
        <div class="card p-2 text-center">
          <h6>${p.name}</h6>
          <p>₹ ${p.price}</p>
          <p>Category: ${p.category}</p>
        </div>
      </div>`;
    });
  },

  renderCategories: function(list){
    const container = document.getElementById("item-category-list");
    container.innerHTML = "";
    list.forEach(c=>{
      container.innerHTML += `<div class="col-md-3">
        <div class="card p-2 text-center">
          <h6>${c.name}</h6>
        </div>
      </div>`;
    });
  },

  renderCompany: function(list){
  const container = document.getElementById("company-detail");
  container.innerHTML = "";

  list.forEach(c=>{
    container.innerHTML += `
      <div class="col-md-6">
        <div class="card p-3 mb-3 shadow-sm">
          <h5 class="fw-bold">${c.company_name}</h5>
          <p><b>GSTIN:</b> ${c.company_gstin || "-"}</p>
          <p><b>FSSAI No:</b> ${c.fssai_no || "-"}</p>
          <p><b>Address:</b> ${c.company_address || "-"}</p>
          <p><b>Contact:</b> ${c.contact_number || "-"}</p>
          <p><b>Pincode:</b> ${c.pincode || "-"}</p>
          <p><b>Email:</b> ${c.official_email_id || "-"}</p>
        </div>
      </div>`;
  });
},


  renderPayments: function(list){
    const container = document.getElementById("item-payment-list");
    container.innerHTML = "";
    list.forEach(p=>{
      container.innerHTML += `<div class="col-md-3">
        <div class="card p-2 text-center">
          <h6>${p.name}</h6>
        </div>
      </div>`;
    });
  },

  filterProducts: function(){
    const q = document.getElementById("item-search-products").value.toLowerCase();
    const filtered = this.products.filter(p=>p.name.toLowerCase().includes(q));
    this.renderProducts(filtered);
  },

  filterCategories: function(){
    const q = document.getElementById("item-search-categories").value.toLowerCase();
    const filtered = this.categories.filter(c=>c.name.toLowerCase().includes(q));
    this.renderCategories(filtered);
  },

  filterPayments: function(){
    const q = document.getElementById("item-search-payments").value.toLowerCase();
    const filtered = this.paymentModes.filter(p=>p.name.toLowerCase().includes(q));
    this.renderPayments(filtered);
  },

syncProducts: async function(){
    if(!this.config.webhookUrl){ alert("Data server URL not configured!"); return; }

    try{
        const res = await fetch(`${this.config.webhookUrl}/products`); // Yii2 endpoint
        if(res.ok){
            const data = await res.json();
            // Assign fallback unique IDs if needed
            data.forEach((d,i)=>{
                if(!d.id) d.id = Date.now() + i;
            });
            fs.writeFileSync(this.productsFile, JSON.stringify(data,null,2));
            this.products = data;
            this.renderProducts(this.products);
            alert("✅ Products synced from server!");
        } else {
            alert("❌ Failed to fetch products from server");
        }
    } catch(e){
        console.error(e);
        alert("❌ Product sync error");
    }
},


  syncCategories: async function(){
    if(!this.config.webhookUrl){ alert("Data server URL not configured!"); return; }
    try{
       const res = await fetch(`${this.config.webhookUrl}/categories`); // Yii2 endpoint
      if(res.ok){
        const data = await res.json();
        data.forEach((d,i)=>{ if(!d.id) d.id = Date.now() + i; });
        fs.writeFileSync(this.categoriesFile, JSON.stringify(data,null,2));
        this.categories = data;
        this.renderCategories(this.categories);
        alert("✅ Categories synced!");
      }
    } catch(e){ console.error(e); alert("❌ Category sync failed"); }
  },

syncCompanyDetails: async function(){
  if(!this.config.webhookUrl || !this.config.authKey){ 
    alert("Data server URL or AuthKey not configured!"); 
    return; 
  }

  try {
    const res = await fetch(`${this.config.webhookUrl}/companydetail`, { // Yii2 endpoint
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.config.authKey}` 
      }
    });

    if(res.ok){
      let data = await res.json();

      if(!Array.isArray(data)) data = [data];

      data.forEach((d,i)=>{ if(!d.id) d.id = Date.now() + i; });

      fs.writeFileSync(this.companyFile, JSON.stringify(data,null,2));

      this.company = data;

      this.renderCompany(this.company);

      alert("✅ Company Detail Synced!");
    } else {
      alert("❌ Failed to fetch company details from server");
    }
  } catch(e){ 
    console.error(e); 
    alert("❌ Company sync failed"); 
  }
},




  syncPaymentModes: async function(){
    if(!this.config.webhookUrl){ alert("Data server URL not configured!"); return; }
    try{
       const res = await fetch(`${this.config.webhookUrl}/payment-modes`); // Yii2 endpoint
      if(res.ok){
        const data = await res.json();
        data.forEach((d,i)=>{ if(!d.id) d.id = Date.now() + i; });
        fs.writeFileSync(this.paymentFile, JSON.stringify(data,null,2));
        this.paymentModes = data;
        this.renderPayments(this.paymentModes);
        alert("✅ Payment modes synced!");
      }
    } catch(e){ console.error(e); alert("❌ Payment mode sync failed"); }
  }
};

// ------------------- Page Load -------------------
window.onload = () => ItemPage.loadData();


// -------------------- Open Settings Modal --------------------
window.openSettings = function() {
  // Read config.json
  let config = {};
  if(fs.existsSync(configFile)){
    try {
      config = JSON.parse(fs.readFileSync(configFile, "utf-8"));
    } catch(e){ console.error("Invalid config.json"); }
  }

  // Build HTML modal
  const modalHtml = `
  <div class="modal fade" id="settingsModal" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header bg-primary text-white">
          <h5 class="modal-title">Company Settings</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
          <form id="configForm">
            <div class="mb-3">
              <label class="form-label">Company Name</label>
              <input type="text" class="form-control" name="companyName" value="${config.companyName || ''}">
            </div>
            <div class="mb-3">
              <label class="form-label">Webhook URL</label>
              <input type="text" class="form-control" name="webhookUrl" value="${config.webhookUrl || ''}">
            </div>
            <div class="mb-3">
              <label class="form-label">Auth Key</label>
              <input type="text" class="form-control" name="authKey" value="${config.authKey || ''}">
            </div>
            <div class="mb-3">
              <label class="form-label">Mobile</label>
              <input type="text" class="form-control" name="mobile" value="${config.mobile || ''}">
            </div>
            <div class="mb-3">
              <label class="form-label">Address</label>
              <input type="text" class="form-control" name="address" value="${config.address || ''}">
            </div>
            <div class="mb-3">
              <label class="form-label">Email</label>
              <input type="email" class="form-control" name="email" value="${config.email || ''}">
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
          <button class="btn btn-success" onclick="saveSettings()">Save</button>
        </div>
      </div>
    </div>
  </div>`;

  document.body.insertAdjacentHTML('beforeend', modalHtml);
  const modal = new bootstrap.Modal(document.getElementById("settingsModal"));
  modal.show();

  // Remove modal from DOM after hidden
  document.getElementById("settingsModal").addEventListener('hidden.bs.modal', () => {
    document.getElementById("settingsModal").remove();
  });
}

// -------------------- Save Settings --------------------

window.saveSettings = function() {
  const form = document.getElementById("configForm");
  const data = Object.fromEntries(new FormData(form).entries());

  try {
    fs.writeFileSync(configFile, JSON.stringify(data, null, 2));
    alert("✅ Settings saved successfully!");
    bootstrap.Modal.getInstance(document.getElementById("settingsModal")).hide();
  } catch(e) {
    alert("❌ Error saving settings: " + e.message);
  }
}

// Hold current cart
function holdOrder() {
  if(cart.length === 0){
    alert("Cart is empty!");
    return;
  }

  
  function logout() {
    ipcRenderer.invoke("logout");
  }


  let holdData = {
    id: Date.now(),
    date: new Date().toLocaleString(),
    items: cart,
    total: document.getElementById("total").innerText,
    paymentMode: "hold"
  };

  // Read existing hold orders
  let holds = [];
  if(fs.existsSync(holdFile)){
    try{
      holds = JSON.parse(fs.readFileSync(holdFile, "utf-8"));
    }catch(e){ holds = [] }
  }

  holds.push(holdData);
  fs.writeFileSync(holdFile, JSON.stringify(holds, null, 2));

  cart = []; // clear cart
  renderCart();

  alert("Order held successfully!");
}

// Load hold orders to modal or table
function loadHoldOrders() {
  if(!fs.existsSync(holdFile)) return [];

  try{
    return JSON.parse(fs.readFileSync(holdFile, "utf-8"));
  }catch(e){ return [] }
}

// Resume hold order
// Resume hold order
function resumeHoldOrder(id) {
  let holds = loadHoldOrders();
  const index = holds.findIndex(h => h.id === id);
  if(index === -1) return;

  cart = holds[index].items;
  renderCart();

  // Remove from hold list
  holds.splice(index, 1);
  fs.writeFileSync(holdFile, JSON.stringify(holds, null, 2));

  // Show POS page
  showPage("pos-page");

  //alert("Order resumed!");
}


// Delete hold order
function deleteHoldOrder(id){
  let holds = loadHoldOrders();
  holds = holds.filter(h => h.id !== id);
  fs.writeFileSync(holdFile, JSON.stringify(holds, null, 2));
  alert("Hold order deleted!");
}

// Load data
async function loadData() {
  products = await (await fetch("products.json")).json();
  categories = await (await fetch("categories.json")).json();
  paymentModes = await (await fetch("paymentModes.json")).json();

  renderCategories();
  // sirf first 20 products load karenge
  loadProducts(products.slice(0, 20));
  renderPaymentModes();
}

// Render categories
function renderCategories() {
  const select = document.getElementById("category-filter");
  categories.forEach(c => {
    select.innerHTML += `<option value="${c.id}">${c.name}</option>`;
  });
}

// Render payment modes
function renderPaymentModes() {
  const select = document.getElementById("payment-mode");
  select.innerHTML = "";
  paymentModes.forEach(pm => {
    select.innerHTML += `<option value="${pm.id}">${pm.name}</option>`;
  });
}



// Products rendering
function loadProducts(list) {
  let container = document.getElementById("product-list");
  container.innerHTML = ""; // clear old

  let html = "";

list.forEach(p => { 

    html += `
      <div class="col-md-6 col-lg-3 mb-3">
        <div class="card product-card h-100 d-flex flex-column align-items-center justify-content-center" onclick="addToCart(${p.id})" style="cursor:pointer; padding:10px;background-color:#204a87">
         
          <h6 class="text-center mb-2" style="font-weight:600;font-size:16px;color:#fff">${p.name} (${p.item_code}</h6>
          <p class="fw-bold mb-0" style="color:#f5da55;font-size:16px">₹ ${p.price}</p>
        </div>
      </div>
    `;
  });

  // ✅ Sirf ek hi baar DOM update
  container.innerHTML = html;
}

// Filtering
function filterProducts() {
  let search = document.getElementById("search-bar").value.toLowerCase().trim();
  let category = document.getElementById("category-filter").value;
  let itemcode = document.getElementById("search-itemcode").value.toLowerCase().trim();

  if (search === "" && itemcode === "" && (category === "all" || category === "")) {
    document.getElementById("product-list").innerHTML = "";
    return;
  }

  let filtered = products.filter(p => {
    let matchCategory = (category === "all" || category === "" || String(p.category_id) === String(category));
    let matchSearch = search === "" || p.name.toLowerCase().includes(search);
    let matchCode = itemcode === "" || p.item_code.toLowerCase().includes(itemcode);
    return matchCategory && matchSearch && matchCode;
  });

  loadProducts(filtered);
}


function handleSearchKey(e) {
  if (e.key === "Enter") {
    e.preventDefault();

    const search = document.getElementById("search-bar").value.toLowerCase().trim();
    const itemInput = document.getElementById("search-itemcode");
    const itemcode = itemInput.value.toLowerCase().trim();

    if (itemcode !== "") {
      const product = products.find(p => p.item_code.toLowerCase() === itemcode);
      if (product) {
        addToCart(product.id);
      } else {
        showToast(`❌ No product found with item code: ${itemcode}`);
      }

      itemInput.value = "";
      itemInput.focus();
      return; 
    }

    if (search !== "") {
      const product = products.find(p => p.name.toLowerCase().includes(search));
      if (product) {
        addToCart(product.id);
      } else {
        showToast(`❌ No product found with name: ${search}`);
      }
    }

    itemInput.focus();
  }
}

// ✅ Non-blocking message
function showToast(message) {
  let toast = document.createElement("div");
  toast.textContent = message;
  toast.style.position = "fixed";
  toast.style.top = "50%";  // middle vertically
  toast.style.left = "50%";
  toast.style.transform = "translate(-50%, -50%)";
  toast.style.background = "#333";
  toast.style.color = "#fff";
  toast.style.padding = "8px 16px";
  toast.style.borderRadius = "6px";
  toast.style.fontSize = "14px";
  toast.style.zIndex = "9999";
  toast.style.opacity = "0.9";
  document.body.appendChild(toast);

  setTimeout(() => toast.remove(), 2000);
}

// Add to cart
function addToCart(id) {
  let product = products.find(p => String(p.id) === String(id));
  if (!product) {
    alert("Product not found for id: " + id);
    return;
  }

  let existing = cart.find(c => String(c.id) === String(id));
  if (existing) {
    existing.qty++;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: parseFloat(product.price),
      qty: 1,
      rate_change_permission: product.rate_change_permission 
    });
  }
  renderCart();
}


function renderCart() {
  let tbody = document.getElementById("cart-items");
  tbody.innerHTML = "";
  let totalQty = 0, totalAmount = 0;

  cart.forEach((c, i) => {
    let subtotal = (c.qty || 0) * (c.price || 0);
    totalQty += (c.qty || 0);
    totalAmount += subtotal;

    tbody.innerHTML += `
      <tr>
        <td>${c.name}</td>
        <td>
          <input type="number" min="0" step="any" value="${c.qty || 0}" 
            onchange="updateQty(${i},this.value)" 
            class="form-control form-control-sm" style="width:70px">
        </td>
        <td>
          ${
            (c.rate_change_permission == 1)
              ? `<input type="text" value="${c.price}" 
                   onchange="updatePrice(${i}, this.value)" 
                   class="form-control form-control-sm" style="width:80px">`
              : `₹${c.price}`
          }
        </td>
        <td>₹${subtotal.toFixed(2)}</td>
        <td>
          <button class="btn btn-sm btn-danger" onclick="removeItem(${i})">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      </tr>`;
  });

  if (cart.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">No items added yet</td></tr>`;
  }

  let finalQty = Math.round(totalQty);

  let finalAmount = Math.round(totalAmount);

  document.getElementById("qty").innerText = finalQty;
  document.getElementById("total").innerText = finalAmount;
}

// ========================


// Price Update Logic
// ========================
function updatePrice(index, value) {
  let input = value.toString().trim();

  if (cart[index].rate_change_permission == 1) {
    if (input.startsWith(".")) {
      let newPrice = parseFloat(input.substring(1)) || 0;
      cart[index].price = newPrice;
      if (!cart[index].qty || cart[index].qty <= 0) {
        cart[index].qty = 1;
      }
    } else {
      let totalAmount = parseFloat(input) || 0;
      let basePrice = parseFloat(cart[index].mrp) || parseFloat(cart[index].price);
      if (basePrice > 0) {
        let newQty = totalAmount / basePrice;
        cart[index].qty = parseFloat(newQty.toFixed(3)); 
        cart[index].price = basePrice;
      }
    }
  } else {
    cart[index].price = parseFloat(value) || 0;
    if (!cart[index].qty || cart[index].qty <= 0) {
      cart[index].qty = 1;
    }
  }

  renderCart();
}

// ========================
// Qty Update Logic
// ========================
function updateQty(index, value) {
  cart[index].qty = parseFloat(parseFloat(value).toFixed(3)) || 0; // 👈 qty bhi round off
  renderCart();
}
// ========================

// Remove item
function removeItem(index) {
  cart.splice(index, 1);
  renderCart();
}

function openPaymentModal() {
  if (cart.length === 0) {
    alert("Cart is empty!");
    return;
  }
  let modal = new bootstrap.Modal(document.getElementById("paymentModal"));
  modal.show();
}

// Confirm payment (prefix-safe + robust save)
function confirmPayment() {
  const modeEl = document.querySelector('input[name="pmode"]:checked') || document.getElementById("payment-mode");
  const mode = modeEl ? (modeEl.value || modeEl.innerText || "Cash") : "Cash";
  const totalTxt = (document.getElementById("total")?.innerText || "0").toString().trim();
  const total = isNaN(+totalTxt) ? totalTxt : (+totalTxt).toFixed(2);

  // 1) Read sale_prefix from company.json (supports array or object)
  let salePrefix = "";
  try {
    const companyPath = path.join(__dirname, "company.json");
    if (fs.existsSync(companyPath)) {
      const raw = fs.readFileSync(companyPath, "utf8").trim();
      if (raw) {
        const json = JSON.parse(raw);
        const companyObj = Array.isArray(json) ? json[0] : json;
        if (companyObj && companyObj.sale_prefix) {
          salePrefix = String(companyObj.sale_prefix).trim();
        }
      }
    }
  } catch(err) {
    console.error("company.json read error:", err);
  }

  // normalize prefix: ensure trailing '-' exactly once (if non-empty)
  if (salePrefix) {
    salePrefix = salePrefix.replace(/\s+/g, "");
    if (!salePrefix.endsWith("-")) salePrefix += "-";
    // avoid "--"
    salePrefix = salePrefix.replace(/-+$/, "-");
  }

  // 2) Load existing sales (robust)
  let sales = [];
  try {
    if (fs.existsSync(saleFile)) {
      const data = fs.readFileSync(saleFile, "utf8");
      if (data) sales = JSON.parse(data);
    }
    if (!Array.isArray(sales)) sales = [];
  } catch (e) {
    console.error("sales load error:", e);
    sales = [];
  }

  // 3) Determine last invoice number for THIS prefix only
  let lastNum = 10000; // default start
  try {
    const nums = sales.map(s => {
      let id = (s && s.id) ? String(s.id) : "";
      if (!id) return null;

      // Only consider IDs that match current prefix (or numeric only if no prefix set)
      if (salePrefix) {
        if (!id.startsWith(salePrefix)) return null;
        id = id.slice(salePrefix.length); // strip prefix for parsing
      } else {
        // when no prefix, ignore IDs that are not pure numeric at the start
        if (!/^\d+/.test(id)) return null;
      }

      // If legacy had "IN-" or anything non-numeric, drop it
      id = id.replace(/^IN-?/i, "");
      const num = parseInt(id, 10);
      return Number.isFinite(num) ? num : null;
    }).filter(n => n !== null);

    if (nums.length) lastNum = Math.max(...nums);
  } catch (e) {
    console.error("invoice parse error:", e);
  }

  // 4) Generate next id WITHOUT "IN-"
  const nextNumber = lastNum + 1;
  const invoiceNo = salePrefix ? `${salePrefix}${nextNumber}` : `${nextNumber}`;

  // 5) Build sale object
  const saleData = {
    id: invoiceNo,
    date: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
    items: Array.isArray(cart) ? cart : [],
    total: total,
    paymentMode: mode,
    sale_prefix: salePrefix
  };

  // 6) Ensure directory exists, then save safely
  try {
    const dir = path.dirname(saleFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  } catch (e) {
    console.error("mkdir error:", e);
  }

  try {
    sales.push(saleData);
    fs.writeFileSync(saleFile, JSON.stringify(sales, null, 2), "utf8");
  } catch (e) {
    console.error("write sales error:", e);
    alert("Unable to save sale! Check file permissions/path.");
    return; // don't proceed to print if save failed
  }

  // 7) Print invoice (existing flow)
  try { doPrint(saleData); } catch(e){ console.error("printInvoice error:", e); }

  // 8) Reset UI
  cart = [];
  renderCart();

  // 9) Close modal if present (non-blocking)
  try {
    const modal = bootstrap.Modal.getInstance(document.getElementById("paymentModal"));
    if (modal) modal.hide();
  } catch (e) {}
}


function printInvoice(saleData) {
  try {
    const { ipcRenderer } = require("electron");
    ipcRenderer.invoke("print-invoice", saleData);
  } catch (e) {
    console.error("printInvoice IPC failed, falling back to popup:", e);
    // fallback (optional): open print.html directly
    const w = window.open("invoice.html", "_blank", "width=420,height=800");
    if (w) setTimeout(() => { try { w.postMessage(saleData, "*"); } catch(e){} }, 200);
  }
}

function printInvoiceOnly(saleData) {
  try {
    const { ipcRenderer } = require("electron");
    ipcRenderer.invoke("print-invoice-only", saleData);
  } catch (e) {
    console.error("printInvoiceOnly IPC failed, falling back to popup:", e);
    // fallback (optional): open print.html directly
    const w = window.open("print.html", "_blank", "width=420,height=800");
    if (w) setTimeout(() => { try { w.postMessage(saleData, "*"); } catch(e){} }, 200);
  }
}

// Unified print selector (keeps existing flow intact)
function doPrint(saleData) {
  if (window.__invoiceOnlyFlow) {
    window.__invoiceOnlyFlow = false;       // reset flag for next time
    return printInvoiceOnly(saleData);      // ✅ invoice-only route
  }
  return printInvoice(saleData);            // 🟢 existing KOT + invoice route
}


loadData();

// ------------------------ Upload Sales Start -------------------

// Helper: safe JSON read
function readJsonSafe(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    const txt = fs.readFileSync(filePath, "utf-8");
    if (!txt) return fallback;
    return JSON.parse(txt);
  } catch (e) {
    console.error("readJsonSafe error:", e);
    return fallback;
  }
}

// Helper: numeric compare for invoice-like IDs (e.g., "REW-1005" -> 1005)
function numericPart(id) {
  if (!id || typeof id !== "string") return NaN;
  const m = id.match(/(\d+)(?!.*\d)/); // last number in string
  return m ? parseInt(m[1], 10) : NaN;
}

// Compute list of records to push based on lastPushedId
function computePendingSales(allSales, lastPushedId) {
  if (!Array.isArray(allSales) || allSales.length === 0) return [];

  // 1) Try exact index match
  if (lastPushedId) {
    const idx = allSales.findIndex(s => s && s.id === lastPushedId);
    if (idx >= 0) {
      return allSales.slice(idx + 1);
    }
  }

  // 2) Fallback to numeric comparison (prefix-agnostic, e.g., REW-1005)
  if (lastPushedId) {
    const lastNum = numericPart(lastPushedId);
    if (!isNaN(lastNum)) {
      return allSales.filter(s => {
        const n = numericPart(s?.id || "");
        return !isNaN(n) && n > lastNum;
      });
    }
  }

  // 3) If no lastPushedId or no match, push everything
  return allSales;
}

// ==========================
// Push only pending records
// ==========================
async function pushData(auto = false) {
  const statusEl = document.getElementById("status");
  statusEl.innerText = auto ? "Auto pushing data..." : "Pushing data...";

  try {
    // Load config
    const config = readJsonSafe(configFile, {});
    if (!config || !config.PushUrl) {
      throw new Error("PushUrl not found in config.json");
    }
    const userfile = readJsonSafe(userFile, {});
    if (!userfile || !userfile.cash_counter.id) {
      throw new Error("counter id not found in user.json");
    }
    const counterId = userfile.cash_counter.id;
    const userId = userfile.id;
    const lastPushedId = config.lastPushedId || null;

    // Load local sales
    let allSales = readJsonSafe(saleFile, []);
    if (!Array.isArray(allSales)) allSales = [allSales];

    // Filter for pending only (after lastPushedId)
    const pending = computePendingSales(allSales, lastPushedId);

    if (!pending.length) {
      statusEl.innerText = "✅ Nothing to push (already up-to-date).";
      statusEl.classList.remove("text-danger");
      statusEl.classList.add("text-success");
      setTimeout(() => { statusEl.innerText = ""; statusEl.classList.remove("text-success"); }, 2500);
      return;
    }

    // Transform for API
    const payload = pending.map(sale => ({
      sale: {
        id: sale.id,
        invoice_number: sale.id,
        token_no: "",
        year: new Date(sale.date).getFullYear(),
        customer_name: "Walk-in Customer",
        date: sale.date,
        total: sale.total,
        paymentMode: sale.paymentMode,
        cash_counter_id: counterId,
        created_by: userId,
      },
      sale_items: (sale.items || []).map(item => ({
        item_id: item.id,
        variant_value_id: null,
        item_brand: "",
        description: item.name,
        sub_title: "",
        item_description: item.name,
        qty: item.qty,
        unit: "pcs",
        unit_price: parseFloat(item.price),
        unit_tax: 0,
        discount_percent: 0,
        net_amount: parseFloat(item.price) * item.qty,
        tax_amt: 0,
        amt_without_tax: parseFloat(item.price) * item.qty,
        is_active: 1,
        process_order_status: "pending",
        process_reject_reason: "",
        created_by: 1,
        updated_by: 1,
        updated_at: new Date().toISOString().slice(0, 19).replace("T", " ")
      }))
    }));

    // Push to server (Yii2)
    const pushRes = await fetch(config.PushUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(config.authKey ? { "Authorization": `Bearer ${config.authKey}` } : {})
      },
      body: JSON.stringify(payload)
    });

    let responseJson = {};
    try { responseJson = await pushRes.json(); } catch(e){}

    if (pushRes.ok && responseJson.status === "success") {
      // Prefer server-reported last id, else take the last pending id
      const serverLast = responseJson.last_sale_id;
      const localLast = pending[pending.length - 1]?.id;
      const newLast = serverLast || localLast || lastPushedId;

      // Update config.json with lastPushedId (atomic-ish)
      try {
        const updatedConfig = { ...config, lastPushedId: newLast };
        fs.writeFileSync(configFile, JSON.stringify(updatedConfig, null, 2), "utf-8");
      } catch (e) {
        console.error("Failed to update config.json lastPushedId:", e);
      }

      statusEl.innerText = (auto ? "✅ Auto Push Success!" : "✅ Sale data successfully pushed!")
        + " Last ID: " + (newLast || "-");
      statusEl.classList.remove("text-danger");
      statusEl.classList.add("text-success");
    } else {
      const msg = responseJson.message || `Server rejected data (HTTP ${pushRes.status})`;
      statusEl.innerText = (auto ? "❌ Auto Push Failed! " : "❌ Push Failed! ") + msg;
      statusEl.classList.remove("text-success");
      statusEl.classList.add("text-danger");
    }

    setTimeout(() => {
      statusEl.innerText = "";
      statusEl.classList.remove("text-success", "text-danger");
    }, 3000);

  } catch (err) {
    console.error("Push Error:", err);
    const statusEl = document.getElementById("status");
    statusEl.innerText = "⚠️ Push Error: " + err.message;
    statusEl.classList.remove("text-success");
    statusEl.classList.add("text-danger");
  }
}





document.getElementById("pushDataBtn").addEventListener("click", () => pushData(false));

setInterval(() => pushData(true), 10 * 60 * 1000);

// setInterval(() => pushData(true), 10 * 1000);


// ------------------------  Upload Sales End-------------------


// ================== [ADDON] Inline Payment + Print Buttons + Shortcuts ==================
(function injectInlineToolbarHandlers(){
  // Guard: only wire once
  if (window.__inlineToolbarWired) return;
  window.__inlineToolbarWired = true;

  // Buttons (exist because we injected their HTML in index.html)
  const btnOnly = document.getElementById('btnPrintOnly');
  const btnKot  = document.getElementById('btnPrintKOT');

  if (btnOnly) btnOnly.addEventListener('click', handlePrintOnly);
  if (btnKot)  btnKot.addEventListener('click', handlePrintWithKot);

  // Global shortcuts
  document.addEventListener('keydown', (e) => {
    const a = document.activeElement;
    const tag = a?.tagName?.toLowerCase();
    const typing = a?.isContentEditable || tag === 'input' || tag === 'textarea' || tag === 'select';

    // Ctrl+P => Print invoice only
    if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === 'p') {
      e.preventDefault();
      handlePrintOnly();
      return;
    }
    // Ctrl+Shift+P => Print with KOT
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'p') {
      e.preventDefault();
      handlePrintWithKot();
      return;
    }
    // F2 => focus last Qty input
    if (e.key === 'F2') {
      e.preventDefault();
      const qtyInputs = Array.from(document.querySelectorAll('#cart-items input[type=\"number\"]'));
      if (qtyInputs.length) {
        const target = qtyInputs[qtyInputs.length - 1];
        target.focus();
        target.select?.();
      }
      return;
    }
    // Alt+1/Alt+2 => switch payment radio
    if (!typing && e.altKey && (e.key === '1' || e.key === '2')) {
      e.preventDefault();
      const v = e.key === '1' ? 'Cash' : 'Paytm';
      const el = document.querySelector(`input[name=\"pmode\"][value=\"${v}\"]`);
      if (el) el.checked = true;
    }
  });
})();

function getSelectedPaymentModeInline(){
  const el = document.querySelector('input[name="pmode"]:checked');
  return el ? el.value : (document.getElementById('payment-mode')?.value || 'Cash');
}

function getCompanyForPrintInline() {
  try {
    if (Array.isArray(ItemPage?.company) && ItemPage.company.length) return ItemPage.company[0];
    if (ItemPage?.company && typeof ItemPage.company === 'object') return ItemPage.company;
  } catch(e){}
  return {};
}

function buildCurrentSaleDataInline(){
  const totalTxt = document.getElementById("total")?.innerText || "0";
  return {
    id: (() => {
      // Don't collide with confirmPayment() invoice numbering; this is for ad-hoc print
      const now = Date.now();
      return `IN-${now % 1000000}`;
    })(),
    date: new Date().toLocaleString(),
    items: Array.isArray(cart) ? cart.map(c => ({
      id: c.id, name: c.name, price: parseFloat(c.price)||0, qty: parseFloat(c.qty)||0
    })) : [],
    total: parseFloat(totalTxt)||0,
    paymentMode: getSelectedPaymentModeInline(),
    company: getCompanyForPrintInline()
  };
}

function handlePrintOnly() {
  if (!cart || cart.length === 0) { alert("Cart is empty!"); return; }
 // alert('printing invoice only');
  window.__invoiceOnlyFlow = true;  // ✅ batata hai ki is baar invoice-only chahiye
  confirmPayment();                 // yahi saleData banayega + save karega + doPrint() call hoga
}

// Print with KOT using existing flow (main -> invoice.html)
function handlePrintWithKot(){
  if (!cart || cart.length === 0) { alert("Cart is empty!"); return; }
  // We will reuse confirmPayment(), but make sure it reads inline radio if available.
  confirmPayment();
}

// --- Patch confirmPayment to read inline radio without breaking anything ---
(function patchConfirmPaymentToReadInline(){
  const originalConfirm = confirmPayment;
  window.confirmPayment = function(){
    // If inline radio exists, temporarily sync the hidden select so old code keeps working
    const radio = document.querySelector('input[name="pmode"]:checked');
    const select = document.getElementById("payment-mode");
    if (radio && select) {
      // Try to match option by text || value
      const val = radio.value;
      let matched = false;
      for (const opt of Array.from(select.options)) {
        if (opt.text.trim().toLowerCase() === val.toLowerCase() || opt.value.trim().toLowerCase() == val.toLowerCase()) {
          select.value = opt.value;
          matched = true;
          break;
        }
      }
      if (!matched) {
        // Fallback: set select value to val if exists, else just leave as-is
        select.value = val;
      }
    }
    return originalConfirm.apply(this, arguments);
  }
})();

/* === SAFE ADDON: Reliable Print (invoice-only) transport === */
function openPrintWindowWithData(saleData){
  // Absolute URL for Electron 'file://' contexts
  const url = new URL('print.html', window.location.href).href;
  // Multiple channels so at least one works:
  const w = window.open(url, '_blank', 'width=420,height=800');
  if (!w) { alert('Popup blocked'); return; }

  try { w.name = JSON.stringify(saleData); } catch(e){}
  try { localStorage.setItem('lastSalePrint', JSON.stringify(saleData)); } catch(e){}

  // URL hash encoding as extra
  try {
    const enc = btoa(unescape(encodeURIComponent(JSON.stringify(saleData))));
    // if same-origin, we can navigate; otherwise child will read window.name/localStorage
    setTimeout(() => { try { w.location.hash = enc; } catch(e){} }, 20);
  } catch(e){}

  // postMessage too (primary)
  setTimeout(() => { try { w.postMessage(saleData, '*'); } catch(e){} }, 200);
}


async function login() {
  const user = document.getElementById("username").value.trim();
  const pass = document.getElementById("password").value.trim();
  const errorEl = document.getElementById("error");
  const btn = document.querySelector(".btn-login");

  errorEl.textContent = "";

  if (!user || !pass) {
    errorEl.textContent = "⚠️ Please enter both username and password.";
    return;
  }

  btn.disabled = true;
  btn.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Logging in...`;

  try {
    // ✅ Read config.json for API URL
    const configPath = path.join(__dirname, "config.json");
    let config = {};

    if (fs.existsSync(configPath)) {
      config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    } else {
      errorEl.textContent = "⚠️ config.json not found!";
      btn.disabled = false;
      btn.innerHTML = "Login";
      return;
    }

    if (!config.webhookUrl) {
      errorEl.textContent = "⚠️ Webhook URL missing in config.json";
      btn.disabled = false;
      btn.innerHTML = "Login";
      return;
    }

    console.log("🔗 Sending to:", `${config.webhookUrl}/users`);
    const response = await fetch(`${config.webhookUrl}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: user, password: pass }),
    });

    const text = await response.text();
    console.log("🌐 Raw response:", text);

    let data = {};
    try {
      data = JSON.parse(text);
    } catch (e) {
      errorEl.textContent = "❌ Invalid JSON from server.";
      btn.disabled = false;
      btn.innerHTML = "Login";
      return;
    }

    // ✅ Handle success or failure
    if (data.success) {
      const saveData = {
        user: data.user || {},
        cash_counter: data.cash_counter || {},
      };

      fs.writeFileSync(userFile, JSON.stringify(saveData, null, 2), "utf-8");
      console.log("✅ User data saved:", saveData);

      btn.innerHTML = "✅ Logged In!";
      btn.classList.remove("btn-primary");
      btn.classList.add("btn-success");
      errorEl.textContent = "";

      // ✅ Redirect to index page
      setTimeout(() => {
        window.location.href = "index.html";
      }, 1000);
    } else {
      errorEl.textContent = data.message || "❌ Invalid credentials.";
      btn.disabled = false;
      btn.innerHTML = "Login";
    }
  } catch (err) {
    console.error("🚨 Login error:", err);
    errorEl.textContent = "❌ Something went wrong. Try again.";
    btn.disabled = false;
    btn.innerHTML = "Login";
  }
}

// ✅ Enter key se login trigger
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter") login();
});

// ✅ Make function available to HTML onclick

window.login = login;


function loadUserRole() {
  const roleEl = document.getElementById("userRole");
  if (!roleEl) return;

  try {
    if (fs.existsSync(userFile)) {
      const data = JSON.parse(fs.readFileSync(userFile, "utf-8"));
      const role = data?.user?.role || "User";

      roleEl.textContent = role; // only role show
      console.log("👤 Role:", role);
    } else {
      console.warn("⚠️ user.json not found — redirecting to login");
      window.location.href = "login.html";
    }
  } catch (err) {
    console.error("❌ Error loading user role:", err);
    roleEl.textContent = "Unknown";
  }
}

window.loadUserRole = loadUserRole;


// ✅ Logout function
function logout() {
  try {
    if (fs.existsSync(userFile)) {
      fs.unlinkSync(userFile); // delete user.json
      console.log("🗑️ user.json deleted successfully");
    }
  } catch (err) {
    console.error("❌ Error deleting user.json:", err);
  }

  // Redirect to login page
  window.location.href = "login.html";
}

window.logout = logout;

