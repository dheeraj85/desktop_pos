const fs = require("fs");
const path = require("path");

const dataDir = path.join(__dirname, "data");

const configFile  = path.join(dataDir, "config.json");
const companyFile = path.join(dataDir, "company.json");
const userFile    = path.join(dataDir, "user.json");
const saleFile    = path.join(dataDir, "saleData.json");
const holdFile    = path.join(dataDir, "holdData.json");


let products = [];
let categories = [];
let companyDetail = [];
let paymentModes = [];
let cart = [];

// 🔒 Disable browser print completely
window.print = () => {
  console.warn("window.print blocked");
};


document.addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.key.toLowerCase() === "p") {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }
});


const ItemPage = {
  configFile: path.join(dataDir,"config.json"),
  productsFile: path.join(dataDir,"products.json"),
  categoriesFile: path.join(dataDir,"categories.json"),
  companyFile: path.join(dataDir,"company.json"),
  paymentFile: path.join(dataDir,"paymentModes.json"),

  config: fs.existsSync(path.join(dataDir,"config.json")) ? JSON.parse(fs.readFileSync(path.join(dataDir,"config.json"),"utf-8")) : {},
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

// syncCompanyDetails: async function() {
//   try {
//     // 1️⃣ Check config
//     if (!this.config.webhookUrl) {
//       alert("❌ Data server URL not configured!");
//       return;
//     }

//     // 2️⃣ Read user.json and extract comp_id
    
//     const userPath = path.join(dataDir, "user.json");
//     if (!fs.existsSync(userPath)) {
//       alert("❌ user.json not found!");
//       return;
//     }

//     const userRaw = fs.readFileSync(userPath, "utf8");
//     const userData = JSON.parse(userRaw);
//     const compId = userData?.user?.comp_id || null;

//     if (!compId) {
//       alert("❌ comp_id missing in user.json!");
//       return;
//     }

//     // 3️⃣ Prepare request headers (your new logic: Authorization = compId)
//     const headers = {
//       "Content-Type": "application/json",
//       "Authorization": `Bearer ${compId}`
//     };

//     // 4️⃣ Call server (no body, as per your current change)
//     const res = await fetch(`${this.config.webhookUrl}/companydetail`, {
//       method: "POST",
//       headers
//       // body intentionally omitted per your latest change
//     });

//     // 5️⃣ Handle response
//     if (res.ok) {
//       let data = await res.json();
//       if (!Array.isArray(data)) data = [data];

//       // Add fallback ids for local storage
//       data.forEach((d, i) => { if (!d.id) d.id = Date.now() + i; });

//       // 6️⃣ Save company.json
//       fs.writeFileSync(this.companyFile, JSON.stringify(data, null, 2));
//       this.company = data;
//       this.renderCompany(this.company);

//       // 7️⃣ If response contains pos_access_key, update config.json -> authKey
//       const newKey =
//         (data.find(d => d && d.pos_access_key)?.pos_access_key) ||
//         data[0]?.pos_access_key || null;

//       if (newKey) {
//         try {
//           const configPath = path.join(dataDir, "config.json");
//           const currentCfg = fs.existsSync(configPath)
//             ? JSON.parse(fs.readFileSync(configPath, "utf8") || "{}")
//             : {};

//           currentCfg.authKey = newKey; // overwrite/set
//           // keep existing webhookUrl if present in memory
//           if (this.config?.webhookUrl && !currentCfg.webhookUrl) {
//             currentCfg.webhookUrl = this.config.webhookUrl;
//           }

//           fs.writeFileSync(configPath, JSON.stringify(currentCfg, null, 2));

//           // Update in-memory too
//           this.config.authKey = newKey;
//           console.log("🔑 authKey updated from pos_access_key");
//         } catch (err) {
//           console.error("Failed to update config.json authKey:", err);
//         }
//       } else {
//         console.warn("pos_access_key not found in response; authKey unchanged.");
//       }

//       alert("✅ Company Detail Synced!");
//     } else {
//       const text = await res.text();
//       alert("❌ Failed to fetch company details: " + text);
//     }

//   } catch (e) {
//     console.error(e);
//     alert("❌ Company sync failed: " + e.message);
//   }
  // },
  


  syncCompanyDetails: async function () {
  try {
    // 1️⃣ Check config
    if (!this.config.webhookUrl) {
      alert("❌ Data server URL not configured!");
      return;
    }

    // 2️⃣ Read user.json and extract comp_id
    const userPath = path.join(dataDir, "user.json");
    if (!fs.existsSync(userPath)) {
      alert("❌ user.json not found!");
      return;
    }

    const userRaw = fs.readFileSync(userPath, "utf8");
    const userData = JSON.parse(userRaw);
    const compId = userData?.user?.comp_id || null;

    if (!compId) {
      alert("❌ comp_id missing in user.json!");
      return;
    }

    // 3️⃣ Prepare request headers (Authorization = Bearer compId)
    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${compId}`
    };

    // 4️⃣ Call server API
    const res = await fetch(`${this.config.webhookUrl}/companydetail`, {
      method: "POST",
      headers
      // body omitted as per new change
    });

    // 5️⃣ Handle response
    if (res.ok) {
      let data = await res.json();
      if (!Array.isArray(data)) data = [data];

      // 6️⃣ Save company.json
      fs.writeFileSync(this.companyFile, JSON.stringify(data, null, 2));
      this.company = data;
      this.renderCompany(this.company);

      // 🧠 NEW: If saleFile is empty, save lastPushedId from backend
      const salePath = path.join(dataDir, "saleData.json");
      const configPath = path.join(dataDir, "config.json");

      let saleEmpty = true;
      if (fs.existsSync(salePath)) {
        const saleRaw = fs.readFileSync(salePath, "utf8").trim();
        saleEmpty = !saleRaw || saleRaw === "[]" || saleRaw === "{}";
      }

      if (saleEmpty) {
        try {
          const lastInvoice = data[0]?.last_invoice_number || null;

          if (lastInvoice) {
            const configData = fs.existsSync(configPath)
              ? JSON.parse(fs.readFileSync(configPath, "utf8") || "{}")
              : {};

            configData.lastPushedId = lastInvoice;

            fs.writeFileSync(configPath, JSON.stringify(configData, null, 2));
            console.log("🧾 lastPushedId updated:", lastInvoice);
          } else {
            console.warn("⚠️ No last_invoice_number received from server.");
          }
        } catch (err) {
          console.error("❌ Failed to update lastPushedId:", err);
        }
      }

      // 7️⃣ Update authKey if found
      const newKey =
        (data.find(d => d && d.pos_access_key)?.pos_access_key) ||
        data[0]?.pos_access_key || null;

      if (newKey) {
        try {
          const configPath = path.join(dataDir, "config.json");
          const currentCfg = fs.existsSync(configPath)
            ? JSON.parse(fs.readFileSync(configPath, "utf8") || "{}")
            : {};

          currentCfg.authKey = newKey;
          if (this.config?.webhookUrl && !currentCfg.webhookUrl) {
            currentCfg.webhookUrl = this.config.webhookUrl;
          }

          fs.writeFileSync(configPath, JSON.stringify(currentCfg, null, 2));
          this.config.authKey = newKey;
          console.log("🔑 authKey updated from pos_access_key");
        } catch (err) {
          console.error("Failed to update config.json authKey:", err);
        }
      } else {
        console.warn("pos_access_key not found in response; authKey unchanged.");
      }

      alert("✅ Company Detail Synced!");
    } else {
      const text = await res.text();
      alert("❌ Failed to fetch company details: " + text);
    }
  } catch (e) {
    console.error(e);
    alert("❌ Company sync failed: " + e.message);
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
    if (cart.length === 0) {
    showMessage("🛒 Cart is empty!");
    return;
  }



  function showMessage(msg) {
  const alertBox = document.createElement("div");
  alertBox.className = "alert alert-warning position-fixed top-0 start-50 translate-middle-x mt-3 shadow";
  alertBox.style.zIndex = "2000";
  alertBox.style.minWidth = "300px";
  alertBox.innerHTML = msg;

  document.body.appendChild(alertBox);

  setTimeout(() => {
    alertBox.classList.add("fade");
    setTimeout(() => alertBox.remove(), 500);
  }, 2000);
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
  products = await (await fetch("data/products.json")).json();
  categories = await (await fetch("data/categories.json")).json();
  paymentModes = await (await fetch("data/paymentModes.json")).json();

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



function loadProducts(list) {
  const container = document.getElementById("product-list");
  let html = "";
  list.forEach(p => {
    html += `
      <div class="col-md-6 col-lg-3 mb-3">
        <div class="card product-card h-100 d-flex flex-column align-items-center justify-content-center"
             onclick="addToCart(${p.id}, true)"
             style="cursor:pointer; padding:10px; background-color:#204a87">
          <h6 class="text-center mb-2" style="font-weight:600;font-size:16px;color:#fff">
            ${p.name} (${p.item_code})
          </h6>
          <p class="fw-bold mb-0" style="color:#f5da55;font-size:16px">₹ ${p.price}</p>
        </div>
      </div>`;
  });
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


function setButtonLoading(btn, loading) {
  if (!btn) return;

  const spinner = btn.querySelector(".btn-spinner");
  const text = btn.querySelector(".btn-text");

  if (loading) {
    btn.disabled = true;
    spinner?.classList.remove("d-none");
    text?.classList.add("d-none");
  } else {
    btn.disabled = false;
    spinner?.classList.add("d-none");
    text?.classList.remove("d-none");
  }
}
// function handleSearchKey(e) {
//   if (e.key === "Enter") {
//     e.preventDefault();

//     const search = document.getElementById("search-bar").value.toLowerCase().trim();
//     const itemInput = document.getElementById("search-itemcode");
//     const itemcode = itemInput.value.toLowerCase().trim();

//     if (itemcode !== "") {
//       const product = products.find(p => p.item_code.toLowerCase() === itemcode);
//       if (product) {
//         addToCart(product.id);
//       } else {
//         showToast(`❌ No product found with item code: ${itemcode}`);
//       }

//       itemInput.value = "";
//       itemInput.focus();
//       return; 
//     }

//     if (search !== "") {
//       const product = products.find(p => p.name.toLowerCase().includes(search));
//       if (product) {
//         addToCart(product.id);
//       } else {
//         showToast(`❌ No product found with name: ${search}`);
//       }
//     }

//     itemInput.focus();
//   }
// }

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

        // Wait a moment for cart to render, then focus qty box
        setTimeout(() => {
          const rows = document.querySelectorAll("#cart-items tr");
          if (rows.length > 0) {
            const lastRow = rows[rows.length - 1];
            const qtyInput = lastRow.querySelector("input[type='number']");
            if (qtyInput) {
              qtyInput.focus();
              qtyInput.select();

              // When pressing Enter again in qty box → go back to itemcode input
              qtyInput.addEventListener("keydown", function qtyEnterHandler(ev) {
                if (ev.key === "Enter") {
                  ev.preventDefault();
                  itemInput.focus();
                  qtyInput.removeEventListener("keydown", qtyEnterHandler);
                }
              });
            }
          }
        }, 120);
      } else {
        showToast(`❌ No product found with item code: ${itemcode}`);
      }

      itemInput.value = "";
      return;
    }

    if (search !== "") {
      const product = products.find(p => p.name.toLowerCase().includes(search));
      if (product) {
        addToCart(product.id);

        // Same logic for name search
        setTimeout(() => {
          const rows = document.querySelectorAll("#cart-items tr");
          if (rows.length > 0) {
            const lastRow = rows[rows.length - 1];
            const qtyInput = lastRow.querySelector("input[type='number']");
            if (qtyInput) {
              qtyInput.focus();
              qtyInput.select();
              qtyInput.addEventListener("keydown", function qtyEnterHandler(ev) {
                if (ev.key === "Enter") {
                  ev.preventDefault();
                  itemInput.focus();
                  qtyInput.removeEventListener("keydown", qtyEnterHandler);
                }
              });
            }
          }
        }, 120);
      } else {
        showToast(`❌ No product found with name: ${search}`);
      }
    }

    itemInput.focus();
  }
}


// Helper to focus qty of a specific row index
function focusQtyRow(rowIndex) {
  const rows = document.querySelectorAll("#cart-items tr");
  if (!rows[rowIndex]) return;

  const qtyInput = rows[rowIndex].querySelector('input[type="number"]');
  if (!qtyInput) return;

  qtyInput.focus();
  qtyInput.select();

  // Press Enter in qty -> back to itemcode box
  const itemInput = document.getElementById("search-itemcode");
  function qtyEnterHandler(ev) {
    if (ev.key === "Enter") {
      ev.preventDefault();
      itemInput && itemInput.focus();
      qtyInput.removeEventListener("keydown", qtyEnterHandler);
    }
  }
  qtyInput.addEventListener("keydown", qtyEnterHandler);
}

function loadProducts(list) {
  const container = document.getElementById("product-list");
  container.innerHTML = "";

  let html = "";
  list.forEach(p => {
    html += `
      <div class="col-md-6 col-lg-3 mb-3">
        <div class="card product-card h-100 d-flex flex-column align-items-center justify-content-center"
             onclick="addToCart(${p.id}, true)" 
             style="cursor:pointer; padding:10px;background-color:#204a87">
          <h6 class="text-center mb-2" style="font-weight:600;font-size:16px;color:#fff">
            ${p.name} (${p.item_code})
          </h6>
          <p class="fw-bold mb-0" style="color:#f5da55;font-size:16px">₹ ${p.price}</p>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}


function renderCart() {
  const tbody = document.getElementById("cart-items");
  tbody.innerHTML = "";
  let totalQty = 0, totalAmount = 0;

  // ✅ Inject CSS only once
  if (!document.getElementById("customer-info-style")) {
    const style = document.createElement("style");
    style.id = "customer-info-style";
    style.innerHTML = `
      /* ===== Customer Info Styles ===== */
      .customer-info-box {
        background: #f9fafc;
        border: 1px solid #dee2e6;
        border-radius: 8px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      }

      .customer-info-box label {
        font-weight: 500;
        color: #555;
      }

      .customer-info-box input {
        border-radius: 6px;
        border: 1px solid #ced4da;
        transition: all 0.2s ease-in-out;
      }

      .customer-info-box input:focus {
        border-color: #007bff;
        box-shadow: 0 0 0 0.1rem rgba(0,123,255,0.25);
      }

      .btn-customer-info {
        background-color: #495057;
        border: none;
        color: white;
        font-size: 13px;
        padding: 5px 12px;
        border-radius: 6px;
        transition: 0.2s ease-in-out;
      }

      .btn-customer-info:hover {
        background-color: #343a40;
      }

      /* Small screen responsive */
      @media (max-width: 768px) {
        .customer-info-box .col-md-4, .customer-info-box .col-md-12 {
          margin-bottom: 10px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // ✅ Render Cart Items
  cart.forEach((c, i) => {
    const subtotal = (c.qty || 0) * (c.price || 0);
    totalQty += (c.qty || 0);
    totalAmount += subtotal;

    tbody.innerHTML += `
      <tr>
        <td>${c.name}</td>
        <td>
          <input id="qty-${c.id}" type="number" min="0" step="any" value="${c.qty || 0}"
            onchange="updateQty(${i}, this.value)"
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
      </tr>
    `;
  });

  // ✅ If no items
  if (cart.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">No items added yet</td></tr>`;
  } else {
    // ✅ Customer Info Section
    tbody.innerHTML += `
      <tr>
       <td colspan="5" class="text-end">
  <a href="#customer-info" 
     data-bs-toggle="collapse" 
     class="text-decoration-none text-primary fw-bold">
     <i class="bi bi-person-lines-fill"></i> Customer Info
  </a>
</td>
      </tr>

      <tr class="collapse" id="customer-info">
        <td colspan="5">
          <div class="customer-info-box p-3 mt-1">
            <div class="row g-3 align-items-center">
              <div class="col-md-6 col-sm-6">
                <label class="form-label mb-1 small text-muted">Customer / firm Name</label>
                <input type="text" id="cust-name" class="form-control form-control-sm" placeholder="Enter name">
              </div>
              <div class="col-md-6 col-sm-6">
                <label class="form-label mb-1 small text-muted">Mobile No.</label>
                <input type="text" id="cust-mobile" class="form-control form-control-sm" placeholder="Enter mobile">
              </div>
             <div class="col-md-6 col-sm-6">
  <label class="form-label mb-1 small text-muted">GSTIN</label>
  <input type="text" id="cust-gstin" 
         class="form-control form-control-sm" 
         placeholder="Enter GSTIN" 
         style="text-transform: uppercase;">
</div>

              <div class="col-md-6 col-sm-12">
                <label class="form-label mb-1 small text-muted">Address</label>
                <textarea id="cust-address" class="form-control form-control-sm" placeholder="Enter address"></textarea>
              </div>
            </div>
          </div>
        </td>
      </tr>
    `;
  }

  // ✅ Update Totals
  document.getElementById("qty").innerText = Math.round(totalQty);
  document.getElementById("total").innerText = Math.round(totalAmount);
}




// ========================

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
// Price Update Logic
// ========================
// function updatePrice(index, value) {
//   let input = value.toString().trim();

//   if (cart[index].rate_change_permission == 1) {
//     if (input.startsWith(".")) {
//       let newPrice = parseFloat(input.substring(1)) || 0;
//       cart[index].price = newPrice;
//       if (!cart[index].qty || cart[index].qty <= 0) {
//         cart[index].qty = 1;
//       }
//     } else {
//       let totalAmount = parseFloat(input) || 0;
//       let basePrice = parseFloat(cart[index].mrp) || parseFloat(cart[index].price);
//       if (basePrice > 0) {
//         let newQty = totalAmount / basePrice;
//         cart[index].qty = parseFloat(newQty.toFixed(3));
//         cart[index].price = basePrice;
//       }
//     }
//   } else {
//     cart[index].price = parseFloat(value) || 0;
//     if (!cart[index].qty || cart[index].qty <= 0) {
//       cart[index].qty = 1;
//     }
//   }

//   renderCart();
// }


function updatePrice(index, value) {
  if (!cart[index]) return;

  let price = parseFloat(value);

  if (isNaN(price) || price < 0) {
    price = 0;
  }

  if (cart[index].rate_change_permission == 1) {
    cart[index].price = price;

    // qty empty ho to default 1
    if (!cart[index].qty || cart[index].qty <= 0) {
      cart[index].qty = 1;
    }
  } 
  else {
    cart[index].price = price;
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
// function removeItem(index) {
//   cart.splice(index, 1);
//   renderCart();
// }

function removeItem(index) {
  const removedItem = cart[index];
  cart.splice(index, 1);
  renderCart();

  // Check if that token has any items left in cart
  const stillHasItems = cart.some(c => c.token_no === removedItem.token_no);
  if (!stillHasItems) {
    const hold = currentHolds.find(h => h.items[0].token_no === removedItem.token_no);
    if (hold) {
      const tokenBox = document.getElementById(`token-${hold.id}`);
      if (tokenBox) {
        tokenBox.style.backgroundColor = "#204a87"; // reset color
      }
      selectedTokens.delete(hold.id); // remove from selected list
    }
  }
}


function openPaymentModal() {
  if (cart.length === 0) {
    showMessage("🛒 Cart is empty!");
    return;
  }
  let modal = new bootstrap.Modal(document.getElementById("paymentModal"));
  modal.show();
}


function addToCart(id, focusQty = false) {
  const product = products.find(p => String(p.id) === String(id));
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
      rate_change_permission: product.rate_change_permission,
      gst_percent: product.gst_percent,
      
    });
  }

  renderCart();

  if (focusQty) {
    const qtyInput = document.getElementById(`qty-${product.id}`);
    if (qtyInput) {
      qtyInput.focus();
      qtyInput.select();

      // Enter in qty → back to itemcode
      const itemInput = document.getElementById("search-itemcode");
      const handler = (ev) => {
        if (ev.key === "Enter") {
          ev.preventDefault();
          itemInput && itemInput.focus();
          qtyInput.removeEventListener("keydown", handler);
        }
      };
      qtyInput.addEventListener("keydown", handler);
    }
  }
}





// ✅ Confirm Payment Function
async function confirmPayment() {
  const modeEl = document.querySelector('input[name="pmode"]:checked') || document.getElementById("payment-mode");
  const mode = modeEl ? (modeEl.value || modeEl.innerText || "Cash") : "Cash";
  const totalTxt = (document.getElementById("total")?.innerText || "0").toString().trim();
  const total = isNaN(+totalTxt) ? totalTxt : (+totalTxt).toFixed(2);

  // 🔹 1) Read sale_prefix from company.json
  let salePrefix = "";
  try {
    const companyPath = path.join(dataDir, "company.json");
    if (fs.existsSync(companyPath)) {
      const raw = fs.readFileSync(companyPath, "utf8").trim();
      if (raw) {
        const json = JSON.parse(raw);
        const companyObj = Array.isArray(json) ? json[0] : json;
        salePrefix = (companyObj?.sale_prefix || "").toString().trim();
      }
    }
  } catch (err) {
    console.error("company.json read error:", err);
  }

  if (salePrefix) {
    salePrefix = salePrefix.replace(/\s+/g, "");
    if (!salePrefix.endsWith("-")) salePrefix += "-";
    salePrefix = salePrefix.replace(/-+$/, "-");
  }

  // 🔹 2) Load existing sales
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

  // 🔹 3) Read config.json (READ-ONLY here) to use only if sales file is empty
  const configPath = path.join(dataDir, "config.json");
  let config = {};
  try {
    if (fs.existsSync(configPath)) {
      const rawCfg = fs.readFileSync(configPath, "utf8").trim();
      if (rawCfg) config = JSON.parse(rawCfg);
    }
  } catch (e) {
    console.error("config.json read error:", e);
    config = {};
  }

  // 🔹 4) Determine invoice sequence
  let baseNum = 10000;
  if (sales.length === 0) {
    // Sales file empty -> prefer config.lastPushedId (if valid), else use baseNum
    if (config && config.lastPushedId != null) {
      const rawId = String(config.lastPushedId);
      let numericPart = rawId;
      if (salePrefix && rawId.startsWith(salePrefix)) numericPart = rawId.slice(salePrefix.length);
      const m = numericPart.match(/(\d+)$/);
      const parsed = m ? parseInt(m[1], 10) : NaN;
      if (Number.isFinite(parsed)) baseNum = parsed;
    }
  } else {
    // Sales exist -> compute max numeric suffix from sales and use it
    const nums = sales.map((s) => {
      let id = (s && s.id) ? String(s.id) : "";
      if (!id) return null;
      if (salePrefix && id.startsWith(salePrefix)) id = id.slice(salePrefix.length);
      id = id.replace(/^IN-?/i, "");
      const num = parseInt(id, 10);
      return Number.isFinite(num) ? num : null;
    }).filter(n => n !== null);

    if (nums.length) baseNum = Math.max(...nums);
  }

  const nextSeq = baseNum + 1;
  const invoiceNo = `${salePrefix}${nextSeq}`;

  // 🔹 5) Build sale data
  const saleData = {
    id: invoiceNo,
    cust_name: document.getElementById("cust-name")?.value || "",
    cust_mobile: document.getElementById("cust-mobile")?.value || "",
    cust_address: document.getElementById("cust-address")?.value || "",
    cust_gstin: document.getElementById("cust-gstin")?.value || "",
    date: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
    items: Array.isArray(cart)
      ? cart.map((item) => ({
          id: item.id || null,
          gst_percent: item.gst_percent || null,
          name: item.name || "",
          qty: +item.qty || 0,
          price: +item.price || 0,
          // gst_percent: +item.gst_percent || 0,
          total: (+item.qty || 0) * (+item.price || 0),
        }))
      : [],
    total: +total || 0,
    paymentMode: mode,
    sale_prefix: salePrefix,
  };

  // 🔹 6) Save sale (append to sales file)
  try {
    const dir = path.dirname(saleFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    sales.push(saleData);
    fs.writeFileSync(saleFile, JSON.stringify(sales, null, 2), "utf8");
  } catch (e) {
    console.error("write sales error:", e);
    alert("Unable to save sale! Check file permissions/path.");
    return;
  }

  // NOTE: Intentionally NOT updating config.json.lastPushedId here.
  // Another function (server push) is responsible for pulling/updating lastPushedId.

  // 🔹 7) Print invoice
// 🔹 7) Print invoice (WAIT till print completes)
try {
  await doPrint(saleData);   // ⭐ YAHI MAIN FIX HAI
} catch (e) {
  console.error("printInvoice error:", e);
}

  // 🔹 8) Clear cart + close modal
  cart = [];
  renderCart();
  try {
    const modal = bootstrap.Modal.getInstance(document.getElementById("paymentModal"));
    if (modal) modal.hide();
  } catch (e) {}

  // 🔹 9) Update Hold Status
  try {
    await updateSelectedHolds();
  } catch (err) {
    console.error("❌ Failed to update hold status:", err);
  }
}

async function updateSelectedHolds() {
  if (!selectedTokens || selectedTokens.size === 0) {
    console.warn("⚠️ No tokens selected to update");
    // showMessage("⚠️ No tokens selected to update!");
    return;
  }

  try {
    const configPath = path.join(dataDir, "config.json");
    const configData = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    const webhookUrl = configData.webhookUrl;

    // 🔹 Prepare array of holds
    const payload = [];
    selectedTokens.forEach((tokenId) => {
      const hold = currentHolds.find((h) => h.id === tokenId);
      if (hold) {
        payload.push({
          token_no: hold.token_no,
          hold_id: hold.id,
          is_running: 0
        });
      }
    });

    if (payload.length === 0) {
      showMessage("⚠️ No valid tokens found to update!");
      return;
    }

    console.log("🟢 Sending bulk update payload:", payload);

    const res = await fetch(`${webhookUrl}/updateholdstatus`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const text = await res.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      console.error("⚠️ Invalid JSON from server:", text);
      showMessage("⚠️ Invalid server response!");
      return;
    }

    console.log("✅ Hold update response:", json);

    if (json.status === "success") {
      // 🔹 Update UI (reset token colors)
      selectedTokens.forEach((tokenId) => {
        const tokenBox = document.getElementById(`token-${tokenId}`);
        if (tokenBox) {
          tokenBox.style.backgroundColor = "#204a87";
          tokenBox.classList.remove("selected-token");
        }
      });

      showMessage(`✅ ${json.updated_count || 0} token(s) updated successfully!`);
    } else {
      showMessage(`⚠️ ${json.message || "Failed to update holds!"}`);
    }

    selectedTokens.clear();
    await pullTokens(false);
  } catch (err) {
    console.error("❌ Failed to update holds:", err);
    showMessage("❌ Failed to update selected holds!");
  }
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
// function doPrint(saleData) {
//   if (window.__invoiceOnlyFlow) {
//     window.__invoiceOnlyFlow = false;       // reset flag for next time
//     return printInvoiceOnly(saleData);      // ✅ invoice-only route
//   }
//   return printInvoice(saleData);            // 🟢 existing KOT + invoice route
// }

function doPrint(saleData) {
  const { ipcRenderer } = require("electron");

  // invoice only ya invoice + KOT
  if (window.__invoiceOnlyFlow) {
    return ipcRenderer.invoke("print-invoice-only", saleData);
  } else {
    return ipcRenderer.invoke("print-invoice", saleData);
  }
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
    if (!userfile || !userfile.user.id) {
      throw new Error("user id not found in user.json");
    }
    const counterId = userfile.cash_counter.id;
    const user_id = userfile.user.id;
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
        cust_name: sale.cust_name,
        cust_mobile: sale.cust_mobile,
        cust_address: sale.cust_address,
        cust_gstin: sale.cust_gstin,
        created_by: user_id,
        year: new Date(sale.date).getFullYear(),
        customer_name: "Walk-in Customer",
        date: sale.date,
        total: sale.total,
        paymentMode: sale.paymentMode,
        cash_counter_id: counterId
        
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



//---------------------TOKEN PULL--------------------/////////




let tokenAutoPullInterval = null;
let currentHolds = [];

// 🔹 Show message on screen
function showMessage(msg) {
  const div = document.createElement("div");
  div.className = "alert alert-info text-center py-1";
  div.textContent = msg;
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 2000);
}

// 🔹 Manual Refresh Button Logic
document.getElementById("refreshTokensBtn").addEventListener("click", async () => {
  if (tokenAutoPullInterval) {
    clearInterval(tokenAutoPullInterval);
    tokenAutoPullInterval = null;
    console.log("🛑 Auto Token Pull stopped!");
  }

  console.log("🔄 Manual Token Pull started...");
  await pullTokens(true);
  // showMessage("🔁 Tokens manually refreshed!");
});

let selectedTokens = new Set(); // 🔹 Store selected token IDs

// 🔹 Pull Tokens from API
async function pullTokens(showLoader = true) {
  const tokenContainer = document.getElementById("tokens");
  if (showLoader)
    tokenContainer.innerHTML =
      "<p class='text-center text-muted'>Loading tokens...</p>";

  try {
    const userFile = path.join(dataDir, "user.json");
    const configPath = path.join(dataDir, "config.json");

    if (!fs.existsSync(configPath)) {
      alert("❌ config.json not found!");
      return;
    }

    const configData = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    const webhookUrl = configData.webhookUrl;

    if (!webhookUrl) {
      alert("⚠️ webhookUrl missing in config.json");
      return;
    }

    const userData = JSON.parse(fs.readFileSync(userFile, "utf-8"));
    const compId = userData?.user?.comp_id;

    const response = await fetch(`${webhookUrl}/tokenpull`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comp_id: compId }),
    });

    const result = await response.json();
    console.log("🔹 Token Pull Result:", result);

    if (result.status === "success" && Array.isArray(result.data)) {
      currentHolds = result.data.map((h) => {
        const total = h.items.reduce(
          (sum, i) => sum + parseFloat(i.qty) * parseFloat(i.rate),
          0
        );
        return {
          id: h.hold.id,
          token_no: h.hold.token_no,
          date: h.hold.hold_date,
          total: total.toFixed(2),
          items: h.items.map((i) => ({
            name: i.item_name,
            qty: parseFloat(i.qty),
            price: parseFloat(i.rate),
            token_no: h.hold.token_no,
          })),
        };
      });
    } else {
      tokenContainer.innerHTML =
        "<p class='text-center text-muted'>No active tokens found.</p>";
      return;
    }
  } catch (error) {
    console.error("❌ Error fetching from API:", error);
    tokenContainer.innerHTML = `<p class='text-center text-danger'>Error loading tokens.</p>`;
    return;
  }

  // 🔹 Inject CSS if not already
  if (!document.getElementById("tokenStyle")) {
    const style = document.createElement("style");
    style.id = "tokenStyle";
    style.textContent = `
      .token-scroll {
        overflow-x: auto;
        white-space: nowrap;
        padding: 6px 0;
        margin-bottom: 8px;
      }
      .token-grid {
        display: inline-flex;
        gap: 6px;
        flex-wrap: wrap;
      }
      .token-box {
        background-color: #204a87;
        color: #fff;
        border-radius: 8px;
        padding: 10px 16px;
        text-align: center;
        font-weight: 600;
        cursor: pointer;
        min-width: 90px;
        transition: 0.2s;
      }
      .token-box:hover {
        background-color: #0044aa;
        transform: scale(1.05);
      }
      // .token-box.selected {
      //   background-color: #35a2acff !important; /* 🟢 Highlight */
      //   box-shadow: 0 0 10px #a4952fff;
      // }
      .token-text {
        font-size: 14px;
      }
    `;
    document.head.appendChild(style);
  }

  // 🔹 Render Tokens
 tokenContainer.innerHTML = `
  <div class="token-scroll">
    <div class="token-grid">
      ${currentHolds
        .map(
          (hold) => `
            <div class="token-box"
              id="token-${hold.id}"
              onclick="toggleTokenSelection(${hold.id});">
              <span class="token-text">Token #${hold.token_no}</span>
            </div>`
        )
        .join("")}
    </div>
  </div>`;

}




function toggleTokenSelection(holdId) {
  const tokenBox = document.getElementById(`token-${holdId}`);
  const hold = currentHolds.find(h => h.id === holdId);
  if (!hold) return;

  if (selectedTokens.has(holdId)) {
    // Deselect (remove)
    selectedTokens.delete(holdId);
    tokenBox.style.backgroundColor = "#204a87";
    // Remove token ke items cart se bhi hata do
    cart = cart.filter(c => c.token_no !== hold.items[0].token_no);
  } else {
    // Select (add)
    selectedTokens.add(holdId);
    tokenBox.style.backgroundColor = "#9caf32ff";
    // Add items to cart
    cart.push(...hold.items);
  }

  renderCart();
}



function loadSelectedTokensToCart() {
  cart = [];
  selectedTokens.forEach((tokenId) => {
    const hold = currentHolds.find((h) => h.id === tokenId);
    if (hold) {
      cart = cart.concat(hold.items);
    }
  });
  renderCart();
}





// 🔹 Token click → directly add to cart
function loadTokenToCart(tokenId) {
  const hold = currentHolds.find((h) => h.id === tokenId);
  if (!hold) return;
  cart = hold.items; // directly load items
  renderCart();
  // showMessage(`✅ Token #${tokenId} items added to bill`);
}

// 🔹 Auto Refresh Every 10 Seconds




// ✅ Start Auto Pull when Page Loads





//---------------TOKEN PULL END ------------------//






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

 function showMessage(msg) {
  const alertBox = document.createElement("div");
  alertBox.className = "alert alert-warning position-fixed top-0 start-50 translate-middle-x mt-3 shadow";
  alertBox.style.zIndex = "2000";
  alertBox.style.minWidth = "300px";
  alertBox.innerHTML = msg;

  document.body.appendChild(alertBox);

  setTimeout(() => {
    alertBox.classList.add("fade");
    setTimeout(() => alertBox.remove(), 500);
  }, 2000);
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

// function handlePrintOnly() {
//   if (!cart || cart.length === 0) {
//     showMessage("🛒 Cart is empty!");
//     return;
//   }
//   window.__invoiceOnlyFlow = true;  
//   confirmPayment();                 
// }

// // Print with KOT using existing flow (main -> invoice.html)
// function handlePrintWithKot() {
//   if (!cart || cart.length === 0) {
//     showMessage("🛒 Cart is empty!");
//     return;
//   }
//   confirmPayment();
// }

async function handlePrintOnly() {
  if (!cart || cart.length === 0) {
    showMessage("🛒 Cart is empty!");
    return;
  }

  const btn = document.getElementById("btnPrintOnly");

  try {
    setButtonLoading(btn, true);     // 🔄 spinner ON
    window.__invoiceOnlyFlow = true;
    await confirmPayment();          // ⏳ wait till print completes
  } catch (err) {
    console.error("Print Invoice Only failed:", err);
    showMessage("❌ Printing failed");
  } finally {
    setButtonLoading(btn, false);    // ✅ spinner OFF
  }
}


// ================= Print with KOT =================
async function handlePrintWithKot() {
  if (!cart || cart.length === 0) {
    showMessage("🛒 Cart is empty!");
    return;
  }

  const btn = document.getElementById("btnPrintKOT");

  try {
    setButtonLoading(btn, true);     // 🔄 spinner ON
    window.__invoiceOnlyFlow = false;
    await confirmPayment();          // ⏳ wait till print completes
  } catch (err) {
    console.error("Print with KOT failed:", err);
    showMessage("❌ Printing failed");
  } finally {
    setButtonLoading(btn, false);    // ✅ spinner OFF
  }
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


// ==================Login  user ==================
// Utilities for a full-screen loading overlay
function ensureLoaderMount() {
  if (document.getElementById("global-loader")) return;
  const style = document.createElement("style");
  style.id = "global-loader-style";
  style.textContent = `
  #global-loader {
    position: fixed; inset: 0; z-index: 99999;
    display: none; align-items: center; justify-content: center;
    background: rgba(0,0,0,0.45); backdrop-filter: blur(2px);
  }
  #global-loader .box {
    background: #111; color: #fff; padding: 16px 20px; border-radius: 10px;
    font-size: 14px; display: flex; align-items: center; gap: 10px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
  }
  #global-loader .spinner {
    width: 16px; height: 16px; border: 2px solid #fff; border-top-color: transparent;
    border-radius: 50%; animation: spin 0.8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  `;
  document.head.appendChild(style);

  const wrap = document.createElement("div");
  wrap.id = "global-loader";
  wrap.innerHTML = `<div class="box"><div class="spinner"></div><span id="global-loader-text">Loading, please wait…</span></div>`;
  document.body.appendChild(wrap);
}

function showLoader(text = "Loading, please wait…") {
  ensureLoaderMount();
  const el = document.getElementById("global-loader");
  const txt = document.getElementById("global-loader-text");
  if (txt) txt.textContent = text;
  if (el) el.style.display = "flex";
}

function hideLoader() {
  const el = document.getElementById("global-loader");
  if (el) el.style.display = "none";
}

// ================== LOGIN ==================
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
    const configPath = path.join(dataDir, "config.json");
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

      // 🔽 NEW: Sync company details before redirect
      showLoader("Syncing company details… Please wait");
      try {
        // If your method is on a global object (e.g., window.app), call that:
        if (window.app && typeof window.app.syncCompanyDetails === "function") {
          await window.app.syncCompanyDetails();
        } else if (typeof syncCompanyDetails === "function") {
          await syncCompanyDetails();
        } else {
          console.warn("syncCompanyDetails() not found – skipping.");
        }
      } catch (syncErr) {
        console.error("❌ Company sync failed after login:", syncErr);
        hideLoader();
        errorEl.textContent = "❌ Company sync failed. Please try again.";
        btn.disabled = false;
        btn.innerHTML = "Login";
        return; // stop here, don't redirect
      }

      hideLoader();

      // ✅ Redirect to index page only after successful sync
      window.location.href = "index.html";

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

// ================== [END ADDON] login user==================




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

