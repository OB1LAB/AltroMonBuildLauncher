const { spawn } = require("child_process");
const settings = require(`${process.env.APPDATA}/AltroMon/settings.json`);
const fs = require("fs");
const { app } = require("electron");
const axios = require("axios");
const config = require("./config");
class LauncherApi {
  static async run(MainWindow) {
    const ram = settings.ram;
    const selectedServer = settings.selectedServer;
    const userName = settings.player;
    const accessToken = "test";
    const uuid = "test";
    const path = `${process.env.APPDATA}/AltroMon`;
    const cmd = `-XX:HeapDumpPath=MojangTricksIntelDriversForPerformance_javaw.exe_minecraft.exe.heapdump -Djava.library.path=${path}\\Hitech_1.12.2_forge\\bin -Dminecraft.launcher.brand=minecraft-launcher -Dminecraft.launcher.version=2.26.2 -Dminecraft.client.jar=${path}\\Hitech_1.12.2_forge\\versions\\1.12.2-forge-14.23.5.2860\\1.12.2-forge-14.23.5.2860.jar -cp ${path}\\Hitech_1.12.2_forge\\libraries\\net\\minecraftforge\\forge\\1.12.2-14.23.5.2860\\forge-1.12.2-14.23.5.2860.jar;${path}\\Hitech_1.12.2_forge\\libraries\\org\\ow2\\asm\\asm-debug-all\\5.2\\asm-debug-all-5.2.jar;${path}\\Hitech_1.12.2_forge\\libraries\\net\\minecraft\\launchwrapper\\1.12\\launchwrapper-1.12.jar;${path}\\Hitech_1.12.2_forge\\libraries\\org\\jline\\jline\\3.5.1\\jline-3.5.1.jar;${path}\\Hitech_1.12.2_forge\\libraries\\com\\typesafe\\akka\\akka-actor_2.11\\2.3.3\\akka-actor_2.11-2.3.3.jar;${path}\\Hitech_1.12.2_forge\\libraries\\com\\typesafe\\config\\1.2.1\\config-1.2.1.jar;${path}\\Hitech_1.12.2_forge\\libraries\\org\\scala-lang\\scala-actors-migration_2.11\\1.1.0\\scala-actors-migration_2.11-1.1.0.jar;${path}\\Hitech_1.12.2_forge\\libraries\\org\\scala-lang\\scala-compiler\\2.11.1\\scala-compiler-2.11.1.jar;${path}\\Hitech_1.12.2_forge\\libraries\\org\\scala-lang\\plugins\\scala-continuations-library_2.11\\1.0.2_mc\\scala-continuations-library_2.11-1.0.2_mc.jar;${path}\\Hitech_1.12.2_forge\\libraries\\org\\scala-lang\\plugins\\scala-continuations-plugin_2.11.1\\1.0.2_mc\\scala-continuations-plugin_2.11.1-1.0.2_mc.jar;${path}\\Hitech_1.12.2_forge\\libraries\\org\\scala-lang\\scala-library\\2.11.1\\scala-library-2.11.1.jar;${path}\\Hitech_1.12.2_forge\\libraries\\org\\scala-lang\\scala-parser-combinators_2.11\\1.0.1\\scala-parser-combinators_2.11-1.0.1.jar;${path}\\Hitech_1.12.2_forge\\libraries\\org\\scala-lang\\scala-reflect\\2.11.1\\scala-reflect-2.11.1.jar;${path}\\Hitech_1.12.2_forge\\libraries\\org\\scala-lang\\scala-swing_2.11\\1.0.1\\scala-swing_2.11-1.0.1.jar;${path}\\Hitech_1.12.2_forge\\libraries\\org\\scala-lang\\scala-xml_2.11\\1.0.2\\scala-xml_2.11-1.0.2.jar;${path}\\Hitech_1.12.2_forge\\libraries\\lzma\\lzma\\0.0.1\\lzma-0.0.1.jar;${path}\\Hitech_1.12.2_forge\\libraries\\java3d\\vecmath\\1.5.2\\vecmath-1.5.2.jar;${path}\\Hitech_1.12.2_forge\\libraries\\net\\sf\\trove4j\\trove4j\\3.0.3\\trove4j-3.0.3.jar;${path}\\Hitech_1.12.2_forge\\libraries\\org\\apache\\maven\\maven-artifact\\3.5.3\\maven-artifact-3.5.3.jar;${path}\\Hitech_1.12.2_forge\\libraries\\net\\sf\\jopt-simple\\jopt-simple\\5.0.3\\jopt-simple-5.0.3.jar;${path}\\Hitech_1.12.2_forge\\libraries\\org\\apache\\logging\\log4j\\log4j-api\\2.15.0\\log4j-api-2.15.0.jar;${path}\\Hitech_1.12.2_forge\\libraries\\org\\apache\\logging\\log4j\\log4j-core\\2.15.0\\log4j-core-2.15.0.jar;${path}\\Hitech_1.12.2_forge\\libraries\\com\\mojang\\patchy\\1.3.9\\patchy-1.3.9.jar;${path}\\Hitech_1.12.2_forge\\libraries\\oshi-project\\oshi-core\\1.1\\oshi-core-1.1.jar;${path}\\Hitech_1.12.2_forge\\libraries\\net\\java\\dev\\jna\\jna\\4.4.0\\jna-4.4.0.jar;${path}\\Hitech_1.12.2_forge\\libraries\\net\\java\\dev\\jna\\platform\\3.4.0\\platform-3.4.0.jar;${path}\\Hitech_1.12.2_forge\\libraries\\com\\ibm\\icu\\icu4j-core-mojang\\51.2\\icu4j-core-mojang-51.2.jar;${path}\\Hitech_1.12.2_forge\\libraries\\com\\paulscode\\codecjorbis\\20101023\\codecjorbis-20101023.jar;${path}\\Hitech_1.12.2_forge\\libraries\\com\\paulscode\\codecwav\\20101023\\codecwav-20101023.jar;${path}\\Hitech_1.12.2_forge\\libraries\\com\\paulscode\\libraryjavasound\\20101123\\libraryjavasound-20101123.jar;${path}\\Hitech_1.12.2_forge\\libraries\\com\\paulscode\\librarylwjglopenal\\20100824\\librarylwjglopenal-20100824.jar;${path}\\Hitech_1.12.2_forge\\libraries\\com\\paulscode\\soundsystem\\20120107\\soundsystem-20120107.jar;${path}\\Hitech_1.12.2_forge\\libraries\\io\\netty\\netty-all\\4.1.9.Final\\netty-all-4.1.9.Final.jar;${path}\\Hitech_1.12.2_forge\\libraries\\com\\google\\guava\\guava\\21.0\\guava-21.0.jar;${path}\\Hitech_1.12.2_forge\\libraries\\org\\apache\\commons\\commons-lang3\\3.5\\commons-lang3-3.5.jar;${path}\\Hitech_1.12.2_forge\\libraries\\commons-io\\commons-io\\2.5\\commons-io-2.5.jar;${path}\\Hitech_1.12.2_forge\\libraries\\commons-codec\\commons-codec\\1.10\\commons-codec-1.10.jar;${path}\\Hitech_1.12.2_forge\\libraries\\net\\java\\jinput\\jinput\\2.0.5\\jinput-2.0.5.jar;${path}\\Hitech_1.12.2_forge\\libraries\\net\\java\\jutils\\jutils\\1.0.0\\jutils-1.0.0.jar;${path}\\Hitech_1.12.2_forge\\libraries\\com\\google\\code\\gson\\gson\\2.8.0\\gson-2.8.0.jar;${path}\\Hitech_1.12.2_forge\\libraries\\com\\mojang\\authlib\\1.5.25\\authlib-1.5.25.jar;${path}\\Hitech_1.12.2_forge\\libraries\\com\\mojang\\realms\\1.10.22\\realms-1.10.22.jar;${path}\\Hitech_1.12.2_forge\\libraries\\org\\apache\\commons\\commons-compress\\1.8.1\\commons-compress-1.8.1.jar;${path}\\Hitech_1.12.2_forge\\libraries\\org\\apache\\httpcomponents\\httpclient\\4.3.3\\httpclient-4.3.3.jar;${path}\\Hitech_1.12.2_forge\\libraries\\commons-logging\\commons-logging\\1.1.3\\commons-logging-1.1.3.jar;${path}\\Hitech_1.12.2_forge\\libraries\\org\\apache\\httpcomponents\\httpcore\\4.3.2\\httpcore-4.3.2.jar;${path}\\Hitech_1.12.2_forge\\libraries\\it\\unimi\\dsi\\fastutil\\7.1.0\\fastutil-7.1.0.jar;${path}\\Hitech_1.12.2_forge\\libraries\\org\\lwjgl\\lwjgl\\lwjgl\\2.9.4-nightly-20150209\\lwjgl-2.9.4-nightly-20150209.jar;${path}\\Hitech_1.12.2_forge\\libraries\\org\\lwjgl\\lwjgl\\lwjgl_util\\2.9.4-nightly-20150209\\lwjgl_util-2.9.4-nightly-20150209.jar;${path}\\Hitech_1.12.2_forge\\libraries\\com\\mojang\\text2speech\\1.10.3\\text2speech-1.10.3.jar;${path}\\Hitech_1.12.2_forge\\versions\\1.12.2-forge-14.23.5.2860\\1.12.2-forge-14.23.5.2860.jar -Xmx${ram}G -XX:+UnlockExperimentalVMOptions -XX:+UseG1GC -XX:G1NewSizePercent=20 -XX:G1ReservePercent=20 -XX:MaxGCPauseMillis=50 -XX:G1HeapRegionSize=32M -Dfml.ignoreInvalidMinecraftCertificates=true -Dfml.ignorePatchDiscrepancies=true -Djava.net.preferIPv4Stack=true net.minecraft.launchwrapper.Launch --username ${userName} --version 1.12.2-forge-14.23.5.2860 --gameDir ${path}\\Hitech_1.12.2_forge --assetsDir ${path}\\Hitech_1.12.2_forge\\assets --assetIndex 1.12 --uuid ${uuid} --accessToken ${accessToken} --userType mojang --tweakClass net.minecraftforge.fml.common.launcher.FMLTweaker --versionType Forge`;
    const files = (
      await axios.get(
        `${config.serverUrl}/api/launcher/files/${selectedServer}`,
      )
    ).data;
    let isNoClient = false;
    const clientMods = {};
    const serverMods = {};
    const launcherFiles = fs.readdirSync(path);
    if (!launcherFiles.includes(selectedServer)) {
      fs.mkdirSync(`${path}/${selectedServer}`);
      isNoClient = true;
    } else {
      fs.readdirSync(`${path}/${selectedServer}/mods`).forEach((fileName) => {
        const fileMod = fileName.split("-");
        if (fileMod.length === 3 && fileMod[0] === "altromon") {
          clientMods[fileMod[1]] = { version: fileMod[2], path: fileName };
        }
      });
    }
    let totalSize = 0;
    const sizes = {};
    const filesDownload = [];
    files.forEach((file) => {
      if (isNoClient) {
        totalSize += file.size;
        filesDownload.push(file.path);
        sizes[file.path.split(selectedServer)[1].slice(1)] = file.size;
      } else {
        const currentDir = file.path
          .split(selectedServer)[1]
          .slice(1)
          .split("/")[0];
        if (currentDir === "mods") {
          const modFile = file.path
            .split(selectedServer)[1]
            .slice(1)
            .split("/")[1]
            .split("-");
          if (modFile.length === 3 && modFile[0] === "altromon") {
            serverMods[modFile[1]] = {
              version: modFile[2],
              size: file.size,
              urlPath: file.path,
            };
          }
        }
      }
    });
    if (!isNoClient) {
      const clientModList = Object.keys(clientMods);
      const serverModList = Object.keys(serverMods);
      clientModList.forEach((mod) => {
        if (!serverModList.includes(mod)) {
          fs.unlinkSync(
            `${path}/${selectedServer}/mods/${clientMods[mod].path}`,
          );
        }
      });
      serverModList.forEach((mod) => {
        if (!clientModList.includes(mod)) {
          totalSize += serverMods[mod].size;
          filesDownload.push(serverMods[mod].urlPath);
          sizes[serverMods[mod].urlPath.split(selectedServer)[1].slice(1)] =
            serverMods[mod].size;
        } else if (clientMods[mod].version !== serverMods[mod].version) {
          fs.unlinkSync(
            `${path}/${selectedServer}/mods/${clientMods[mod].path}`,
          );
          totalSize += serverMods[mod].size;
          filesDownload.push(serverMods[mod].urlPath);
          sizes[serverMods[mod].urlPath.split(selectedServer)[1].slice(1)] =
            serverMods[mod].size;
        }
      });
    }
    filesDownload.reverse();
    if (filesDownload.length > 0) {
      await downloadFiles(
        filesDownload,
        `${path}/${selectedServer}`,
        sizes,
        totalSize,
        MainWindow,
      );
      setTimeout(() => {
        MainWindow.webContents.send("launcher-gameInit", "");
      }, 1000);
    } else {
      MainWindow.webContents.send("launcher-gameInit", "");
    }
    const runtime = spawn("java.exe", cmd.split(" "), {
      shell: true,
      cwd: `${process.env.APPDATA}/AltroMon/jdk-1.8/bin`,
    });
    runtime.stdout.on("data", (line) => {
      const lineString = line.toString().split(" ");
      if (
        lineString[3] === "[minecraft/Minecraft]:" &&
        lineString[4] === "LWJGL"
      ) {
        app.quit();
      }
    });
  }
  static getData() {
    return settings;
  }
  static setRam(event, data) {
    settings.ram = data;
    LauncherApi.saveData();
  }
  static getRam(event) {
    return event.reply("reply-ram", settings.ram);
  }
  static setPlayer(event, data) {
    settings.player = data;
    LauncherApi.saveData();
  }
  static getPlayer(event) {
    return event.reply("reply-player", settings.player);
  }
  static openFolder() {
    return spawn("explorer", [`${process.env.APPDATA}\\AltroMon`]);
  }
  static saveData() {
    fs.writeFile(
      `${process.env.APPDATA}/AltroMon/settings.json`,
      JSON.stringify(settings),
      () => console.log("saved"),
    );
  }
}

const downloadFiles = async (files, path, sizes, totalSize, MainWindow) => {
  let downloaderSizes = 0;
  for (const filename of files) {
    MainWindow.webContents.send("launcher-download", {
      content: `Скачивание: ${filename.split("/").pop()}`,
      step: `Установка [${(downloaderSizes / 1024 / 1024).toFixed(1)}MB/${(totalSize / 1024 / 1024).toFixed(1)}MB]`,
      progress: ((downloaderSizes / totalSize) * 100).toFixed(0),
    });
    const response = await axios.get(`${config.serverUrl}/${filename}`, {
      responseType: "stream",
    });
    const pathFile =
      path + response.data.responseUrl.split(path.split("/").pop())[1];
    fs.mkdirSync(pathFile.split("/").slice(0, -1).join("/"), {
      recursive: true,
    });
    const writer = fs.createWriteStream(pathFile);
    response.data.pipe(writer);
    response.data.on("end", () => {
      downloaderSizes += sizes[filename.split("/").slice(3).join("/")];
    });
  }
  MainWindow.webContents.send("launcher-download", {
    content: ``,
    step: `Запускаем игру`,
    progress: 100,
  });
};

module.exports = LauncherApi;
