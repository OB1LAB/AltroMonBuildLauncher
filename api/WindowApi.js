const { app, BrowserWindow } = require("electron");
class WindowApi {
  static close = () => {
    app.quit();
  };
  static hide = () => {
    BrowserWindow.getFocusedWindow().minimize();
  };
}

module.exports = WindowApi;
