const { app, BrowserWindow, ipcMain, Menu } = require("electron");
const path = require("path");
const fs = require("fs");

// Menu.setApplicationMenu(null); ❌

const dataDir = path.join(__dirname, "data");
let loginWindow;
let mainWindow;

// Load settings (printer name etc.)
const settingsPath = path.join(dataDir, "settings.json");
let settings = {};
let printerName = "";
try {
  if (fs.existsSync(settingsPath)) {
    settings = JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
    printerName = settings.printerName || settings.printer || "";
  }
} catch (e) {
  console.error("Failed to load settings:", e);
}

// ---------------- LOGIN WINDOW ----------------
function createLoginWindow() {
  loginWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    resizable: false,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      backgroundThrottling: false,
      spellcheck: false
    }
  });
  loginWindow.loadFile("login.html");
  loginWindow.once("ready-to-show", () => loginWindow.show());
}

// ---------------- MAIN WINDOW ----------------
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      backgroundThrottling: false,
      spellcheck: false
    }
  });
  mainWindow.loadFile("index.html");
  mainWindow.once("ready-to-show", () => {
    mainWindow.maximize();
    mainWindow.show();
  });
}

// app.whenReady().then(createLoginWindow);

const { session } = require("electron");

app.whenReady().then(async () => {

    await session.defaultSession.clearCache();

    await session.defaultSession.clearStorageData();

    createLoginWindow();

});
// ---------------- LOGIN HANDLER ----------------
ipcMain.handle("check-login", (event, { user, pass }) => {
  if (user === "admin" && pass === "1234") {
    loginWindow.close();
    createMainWindow();
    return true;
  }
  return false;
});

// ---------------- LOGOUT ----------------
ipcMain.handle("logout", () => {
  if (!mainWindow) return;
  mainWindow.close();
  mainWindow = null;
  createLoginWindow();
});

// ---------------- READ SALES ----------------
ipcMain.handle("get-sales", async () => {
  const filePath = path.join(dataDir, "saleData.json");
  try {
    if (!fs.existsSync(filePath)) return [];
    const data = fs.readFileSync(filePath, "utf-8");
    const sales = JSON.parse(data);
    sales.sort((a, b) => new Date(b.date) - new Date(a.date));
    return sales;
  } catch (e) {
    console.error("Sales read error:", e);
    return [];
  }
});

// ================= PRINT INVOICE (SILENT) =================
// ipcMain.handle("print-invoice", async (event, saleData) => {
//   const printWin = new BrowserWindow({
//     width: 400,
//     height: 600,
//     show: false,
//       autoHideMenuBar: true,   // ✅ ADD THIS

//     webPreferences: {
//       nodeIntegration: true,
//       contextIsolation: false
//     }
//   });

//   printWin.loadFile("invoice.html");

//   printWin.webContents.once("did-finish-load", () => {

//     printWin.webContents.send("invoice-data", saleData);

//     setTimeout(() => {
//       printWin.webContents.print(
//         {
//           silent: true,
//           printBackground: true,
//           deviceName: "POS-80",
//           margins: { marginType: "none" }
//         },
//         () => {
//           printWin.close();
//         }
//       );
//     }, 300);
//   });
// });



// // ================= print-invoice-only =================
// ipcMain.handle("print-invoice-only", async (event, saleData) => {
//   const printWin = new BrowserWindow({
//     width: 400,
//     height: 600,
//     show: false,
//     autoHideMenuBar: true,   // ✅ ADD THIS
//     webPreferences: {
//       nodeIntegration: true,
//       contextIsolation: false
//     }
//   });

//   printWin.loadFile("print.html");

//   printWin.webContents.once("did-finish-load", () => {

//     printWin.webContents.send("invoice-data", saleData);

//     setTimeout(() => {
//       printWin.webContents.print(
//         {
//           silent: true,
//           printBackground: true,
//           deviceName: "POS-80",
//           margins: { marginType: "none" }
//         },
//         () => {
//           printWin.close();
//         }
//       );
//     }, 300);
//   });
// });


ipcMain.handle("print-invoice", async (event, saleData) => {
  return new Promise((resolve, reject) => {

    const printWin = new BrowserWindow({
      width: 400,
      height: 600,
      show: false,
      autoHideMenuBar: true,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      }
    });

    printWin.loadFile("invoice.html");

    printWin.webContents.once("did-finish-load", () => {
      printWin.webContents.send("invoice-data", saleData);

      setTimeout(() => {
        printWin.webContents.print(
          {
            silent: true,
            printBackground: true,
            deviceName: printerName || "",
            margins: { marginType: "none" }
          },
          (success, errorType) => {
            printWin.close();

            if (success) resolve(true);
            else reject(errorType);
          }
        );
      }, 150);
    });
  });
});


ipcMain.handle("print-invoice-only", async (event, saleData) => {
  return new Promise((resolve, reject) => {

    const printWin = new BrowserWindow({
      width: 400,
      height: 600,
      show: false,
      autoHideMenuBar: true,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      }
    });

    printWin.loadFile("print.html");

    printWin.webContents.once("did-finish-load", () => {
      printWin.webContents.send("invoice-data", saleData);

      setTimeout(() => {
        printWin.webContents.print(
          {
            silent: true,
            printBackground: true,
            deviceName: printerName || "",
            margins: { marginType: "none" }
          },
          (success, errorType) => {
            printWin.close();

            if (success) resolve(true);
            else reject(errorType);
          }
        );
      }, 150);
    });
  });
});


