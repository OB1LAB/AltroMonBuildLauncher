const axios = require("axios");
const config = require("./config");
const fs = require("fs");
const { spawn } = require("child_process");
const { app } = require("electron");

class MinecraftApi {
  static async runServer(server, jdkVersion, isMods, cmd, path, MainWindow) {
    const serverPath = `${path}/${server}`;
    const launcherFiles = fs.readdirSync(path);
    const isNoJdk = !launcherFiles.includes(jdkVersion);
    const isNoClient = !launcherFiles.includes(server);
    const clientMods = {};
    const serverMods = {};
    const files = (
      await axios.get(`${config.serverUrl}/api/launcher/files/${server}`)
    ).data;
    if (isNoClient) {
      fs.mkdirSync(serverPath);
    } else if (isMods) {
      fs.readdirSync(`${serverPath}/mods`).forEach((fileName) => {
        const fileMod = fileName.split("-");
        if (fileMod.length === 3 && fileMod[0] === "altromon") {
          clientMods[fileMod[1]] = { version: fileMod[2], path: fileName };
        }
      });
    }
    let totalSize = 0;
    const sizes = {};
    const filesDownload = [];
    if (isNoJdk) {
      const filesJdk = (
        await axios.get(`${config.serverUrl}/api/launcher/files/${jdkVersion}`)
      ).data;
      filesJdk.forEach((file) => {
        totalSize += file.size;
        filesDownload.push(file.path);
        sizes[file.path.split(jdkVersion)[1].slice(1)] = file.size;
      });
    }
    files.forEach((file) => {
      if (isNoClient) {
        totalSize += file.size;
        filesDownload.push(file.path);
        sizes[file.path.split(server)[1].slice(1)] = file.size;
      } else if (isMods) {
        const currentDir = file.path.split(server)[1].slice(1).split("/")[0];
        if (currentDir === "mods") {
          const modFile = file.path
            .split(server)[1]
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
    if (!isNoClient && isMods) {
      const clientModList = Object.keys(clientMods);
      const serverModList = Object.keys(serverMods);
      clientModList.forEach((mod) => {
        if (!serverModList.includes(mod)) {
          fs.unlinkSync(`${serverPath}/mods/${clientMods[mod].path}`);
        }
      });
      serverModList.forEach((mod) => {
        if (!clientModList.includes(mod)) {
          totalSize += serverMods[mod].size;
          filesDownload.push(serverMods[mod].urlPath);
          sizes[serverMods[mod].urlPath.split(server)[1].slice(1)] =
            serverMods[mod].size;
        } else if (clientMods[mod].version !== serverMods[mod].version) {
          fs.unlinkSync(`${serverPath}/mods/${clientMods[mod].path}`);
          totalSize += serverMods[mod].size;
          filesDownload.push(serverMods[mod].urlPath);
          sizes[serverMods[mod].urlPath.split(server)[1].slice(1)] =
            serverMods[mod].size;
        }
      });
    }
    filesDownload.reverse();
    if (filesDownload.length > 0) {
      await downloadFiles(
        filesDownload,
        serverPath,
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
    const runtime = spawn(
      `${path}/${jdkVersion}/bin/java.exe`,
      cmd.split(" ").map((line) => `"${line}"`),
      {
        shell: "powershell.exe",
        cwd: serverPath,
      },
    );
    // runtime.stderr.on("data", async (data) => {
    //   console.log(data.toString());
    // });
    runtime.stdout.on("data", (line) => {
      const lineString = line.toString().split(" ");
      // console.log(line.toString());
      if (
        (lineString[3] === "[minecraft/Minecraft]:" &&
          lineString[4] === "LWJGL") ||
        lineString[2] === "[cp.mo.mo.Launcher/MODLAUNCHER]:"
      ) {
        app.quit();
      }
    });
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
    const req_url = `${config.serverUrl}/${filename.substring(2)}`;
    const response = await axios.get(req_url, {
      responseType: "stream",
    });
    let pathFile;
    if (req_url.split("static/")[1].split()[0].startsWith("jdk")) {
      pathFile =
        path.split("/").slice(0, -1).join("/") + req_url.split("static")[1];
    } else {
      pathFile = path + req_url.split(path.split("/").pop())[1];
    }
    fs.mkdirSync(pathFile.split("/").slice(0, -1).join("/"), {
      recursive: true,
    });
    const writer = fs.createWriteStream(pathFile);
    response.data.pipe(writer);
    let downloaded = 0;
    let lastPercent = 0;
    response.data.on("data", (data) => {
      downloaded += Buffer.byteLength(data);
      const newPercent = Math.round(
        (downloaded / sizes[filename.split("/").slice(3).join("/")]) * 100,
      );
      if (newPercent > lastPercent) {
        lastPercent = newPercent;
        MainWindow.webContents.send("launcher-download", {
          content: `Скачивание: ${filename.split("/").pop()}`,
          step: `Установка [${((downloaderSizes + downloaded) / 1024 / 1024).toFixed(1)}MB/${(totalSize / 1024 / 1024).toFixed(1)}MB]`,
          progress: (
            ((downloaderSizes + downloaded) / totalSize) *
            100
          ).toFixed(0),
        });
      }
    });
    async function write() {
      return new Promise((resolve, reject) => {
        response.data.on("end", () => {
          downloaderSizes += sizes[filename.split("/").slice(3).join("/")];
          resolve("complete");
        });
      });
    }
    await write();
  }
  MainWindow.webContents.send("launcher-download", {
    content: ``,
    step: `Запускаем игру`,
    progress: 100,
  });
};

module.exports = MinecraftApi;
