const MinecraftApi = require("./MinecraftApi");
const { spawn } = require("child_process");
const settings = require(`${process.env.APPDATA}/AltroMon/settings.json`);
const fs = require("fs");
let servers = {};
class LauncherApi {
  static async run(MainWindow) {
    const ram = settings.ram;
    const selectedServer = settings.selectedServer;
    const userName = settings.player;
    const accessToken = settings.accessToken;
    const uuid = settings.uuid;
    const path = `${process.env.APPDATA}/AltroMon`;
    const jdkVersion = servers[selectedServer].jdkVersion;
    const isMods = servers[selectedServer].isMods;
    const cmd = servers[selectedServer].cmd
      .replaceAll("${path}", `${path}/${selectedServer}`)
      .replace("${ram}", ram)
      .replace("${userName}", userName)
      .replace("${uuid}", uuid)
      .replace("${accessToken}", accessToken);
    await MinecraftApi.runServer(
      selectedServer,
      jdkVersion,
      isMods,
      cmd,
      path,
      MainWindow,
    );
  }
  static getData() {
    return settings;
  }
  static setRam(event, data) {
    settings.ram = data;
    LauncherApi.saveData();
  }
  static setServer(event, data) {
    settings.selectedServer = data;
    LauncherApi.saveData();
  }
  static getRam(event) {
    return event.reply("reply-ram", settings.ram);
  }
  static setPlayer(event, data) {
    const { player, password, uuid, accessToken, description } = data;
    settings.player = player;
    settings.password = password;
    settings.uuid = uuid;
    settings.accessToken = accessToken;
    servers = description;
    LauncherApi.saveData();
  }
  static getPlayer(event) {
    return event.reply("reply-player", {
      player: settings.player,
      password: settings.password,
      selectedServer: settings.selectedServer,
    });
  }
  static openFolder() {
    return spawn("explorer", [`${process.env.APPDATA}\\AltroMon`]);
  }
  static saveData() {
    fs.writeFileSync(
      `${process.env.APPDATA}/AltroMon/settings.json`,
      JSON.stringify(settings),
      () => {},
    );
  }
}

module.exports = LauncherApi;
