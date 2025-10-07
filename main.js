const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const escpos = require('escpos');
escpos.USB = require('escpos-usb');
const usb = require('usb');

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
ipcMain.handle("check-login", (event, { user, pass }) => {
  if (user === "admin" && pass === "1234") {
    loginWindow.close();
    createMainWindow();
    return true;
  }
  return false;
});

// ---------------------------
// IPC handler to read sales from JSON file
ipcMain.handle("get-sales", async () => {
  const filePath = path.join(__dirname, "saleData.json");
  
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


