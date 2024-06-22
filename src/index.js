const fs = require("fs");
const { app, BrowserWindow, ipcMain } = require("electron");
const { join } = require("path");
const settings = require(`${process.env.APPDATA}/AltroMon/settings.json`);

if (require("electron-squirrel-startup")) {
  app.quit();
}

const settingsKeys = Object.keys(settings);
if (!settingsKeys.includes("ram")) {
  settings.ram = 4;
}
if (!settingsKeys.includes("player")) {
  settings.player = "";
}
if (!settingsKeys.includes("selectedServer")) {
  settings.selectedServer = "Hitech_1.12.2_forge";
}
fs.writeFile(
  `${process.env.APPDATA}/AltroMon/settings.json`,
  JSON.stringify(settings),
  () => console.log("Player", settings.player),
);
const WindowApi = require("../api/WindowApi");
const LauncherApi = require("../api/LauncherApi");
const createWindow = () => {
  let mainWindow = new BrowserWindow({
    width: 901,
    height: 551,
    frame: false,
    fullscreenable: false,
    fullscreen: false,
    simpleFullscreen: false,
    kiosk: true,
    maximizable: false,
    show: false,
    webPreferences: {
      disableHtmlFullscreenWindowResize: true,
      nodeIntegration: true,
      contextIsolation: false,
      devTools: false,
      offscreen: false,
    },
    icon: join(__dirname, "OB1LAB.png"),
    resizable: false,
  });
  // mainWindow.loadURL("http://192.168.0.101:3000");
  mainWindow.once("ready-to-show", () => {
    setTimeout(() => {
      mainWindow.show();
    }, 500);
  });
  mainWindow.loadFile(join(__dirname, "build/index.html"));
  ipcMain.on("test", () => console.log("test"));
  ipcMain.on("request-main-window", (event) => {
    event.sender.send("response-main-window", mainWindow);
  });
  return mainWindow;
};
app.whenReady().then(() => {
  const mainWindow = createWindow();
  ipcMain.on("close-window", WindowApi.close);
  ipcMain.on("hide-window", WindowApi.hide);
  ipcMain.on("start-game", () => LauncherApi.run(mainWindow));
  ipcMain.on("launcher-getRam", LauncherApi.getRam);
  ipcMain.on("launcher-setRam", LauncherApi.setRam);
  ipcMain.on("launcher-setPlayer", LauncherApi.setPlayer);
  ipcMain.on("launcher-getPlayer", (event) => {
    LauncherApi.getPlayer(event);
  });
  ipcMain.on("launcher-openFolder", LauncherApi.openFolder);
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
