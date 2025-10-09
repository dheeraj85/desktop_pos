const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
// const escpos = require('escpos');
// escpos.USB = require('escpos-usb');
// const usb = require('usb');

let loginWindow;
let mainWindow;

function createLoginWindow() {
  loginWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });
  loginWindow.loadFile("login.html");
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });
  mainWindow.loadFile("index.html");
}

app.whenReady().then(() => {
  createLoginWindow();
});

// ✅ Handle login


// ---------------------------
// IPC handler to read sales from JSON file
ipcMain.handle("get-sales", async () => {
  const dataDir = path.join(__dirname, "data");
  const filePath = path.join(dataDir, "saleData.json");
  
  try {
    if (!fs.existsSync(filePath)) {
      return [];
    }

    const data = fs.readFileSync(filePath, "utf-8");
    let sales = JSON.parse(data);

    sales.sort((a, b) => new Date(b.date) - new Date(a.date));
    return sales;
  } catch (err) {
    console.error("Error reading sales file:", err);
    return [];
  }
});

// -------------------- Logout Handler --------------------
ipcMain.handle("logout", () => {
  if (!mainWindow) return;

  // 1️⃣ Hide main window first
  mainWindow.hide();

  // 2️⃣ Open login window
  createLoginWindow();

  // 3️⃣ Optional: close mainWindow after login window shown
  setTimeout(() => {
    if (mainWindow) {
      mainWindow.close();
      mainWindow = null;
    }
  }, 200); // 200ms buffer
});



// ---------------------------
// IPC handler to print invoice
ipcMain.handle("print-invoice", async (event, saleData) => {
  const win = new BrowserWindow({
    width: 400,
    height: 600,
    show: false, // initially hidden
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // Invoice HTML load karo
  win.loadFile("invoice.html");

  // Jab HTML load ho jaye, tabhi data bhejna
  win.webContents.once("did-finish-load", () => {
    win.webContents.executeJavaScript(
      `window.postMessage(${JSON.stringify(saleData)})`
    );
  });

  // Agar chahte ho print hone ke baad window band ho jaye
  win.webContents.on("did-finish-print", () => {
    win.close();
  });


  const settingsPath = path.join(app.getPath('userData'), 'settings.json');
function readSettings(){
try { return JSON.parse(fs.readFileSync(settingsPath,'utf-8')); } catch(e){ return {}; }
}
function writeSettings(s){ fs.writeFileSync(settingsPath, JSON.stringify(s, null, 2)); }


ipcMain.handle('settings:get', ()=> readSettings());
ipcMain.handle('settings:set', (evt, patch)=>{
const cur = readSettings();
const next = { ...cur, ...patch };
writeSettings(next);
return next;
});


// List printers for renderer
ipcMain.handle('printer:list', (evt)=> {
const win = BrowserWindow.fromWebContents(evt.sender);
return win.webContents.getPrinters();
});
});



// IPC handler to print invoice ONLY (no KOT) using print.html
ipcMain.handle("print-invoice-only", async (event, saleData) => {
  const win = new BrowserWindow({
    width: 400,
    height: 600,
    show: false,
    webPreferences: { nodeIntegration: true, contextIsolation: false }
  });

  win.loadFile("print.html");

  win.webContents.once("did-finish-load", () => {
    if (!saleData.date) {
      saleData.date = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
    }
    win.webContents.executeJavaScript(
      `window.postMessage(${JSON.stringify(saleData)})`
    );
  });

  win.webContents.on("did-finish-print", () => { win.close(); });
});



