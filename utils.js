const crypto = require("crypto");
const fs = require("fs");
const axios = require("axios");
const config = require("./api/config");
const moment = require("moment/moment");
const { parentPort } = require("worker_threads");

const getFilesWithSize = (filename, path) => {
  const isFile = fs.lstatSync(`${path}/${filename}`).isFile();
  if (isFile) {
    return {
      path: `${path}/${filename}`,
      size: fs.statSync(`${path}/${filename}`).size,
    };
  }
  return [
    ...fs
      .readdirSync(`${path}/${filename}`)
      .map((file) => getFilesWithSize(file, `${path}/${filename}`)),
  ];
};

const getFilesWithHash = (serverFolder, folders) => {
  const hashedFiles = {};
  const clientFiles = {};
  for (const folder of folders) {
    const path = `${serverFolder}/${folder}`;
    if (!fs.readdirSync(serverFolder).includes(folder)) {
      fs.mkdirSync(path);
    }
    hashedFiles[folder] = {};
    try {
      const files = fs.readdirSync(path);
      clientFiles[folder] = [
        ...files.map((file) => getFilesWithSize(file, path)),
      ].flat(Infinity);
    } catch (e) {
      console.log(`[1] Error while getting hash client files: ${e}`);
    }
  }
  let totalCountFiles = 0;
  let offset = 0;
  for (const folder of folders) {
    totalCountFiles += Object.keys(clientFiles[folder]).length;
  }
  for (const folder of folders) {
    try {
      const path = `${serverFolder}/${folder}`;
      for (const [fileIndex, file] of clientFiles[folder].entries()) {
        const fileBuffer = fs.readFileSync(file.path);
        const hashFile = crypto
          .createHash("sha256")
          .update(fileBuffer)
          .digest("hex");
        hashedFiles[folder][
          hashFile +
            "/" +
            path.split("/").slice(-1) +
            file.path.split(path).slice(1).join("")
        ] = { ...file, hash: hashFile };
        parentPort.postMessage([
          "launcher-download",
          {
            content: file.path.split("/").slice(-1),
            step: "Получаем хэш-суммы файлов",
            progress: (
              ((offset + fileIndex + 1) / totalCountFiles) *
              100
            ).toFixed(0),
          },
        ]);
      }
    } catch (e) {
      console.log(`[2] Error while getting hash client files: ${e}`);
    }
    offset += clientFiles[folder].length - 1;
  }
  return hashedFiles;
};

const getPrimaryData = async (server, isNoClient, serverPath, isMods) => {
  let hashFiles = {};
  let hashFilesClient = {};
  let blackList = [];
  const clientMods = {};
  try {
    let syncFiles = (
      await axios.get(
        `${config.serverUrl}/api/launcher/filesHash/sync_${server}`,
      )
    ).data;
    blackList = syncFiles.blackList;
    syncFiles = syncFiles.files;
    syncFiles.map((file) => {
      const currentFolder = file.path.split("/")[3];
      if (!Object.keys(hashFiles).includes(currentFolder)) {
        hashFiles[currentFolder] = {};
      }
      let currentFolderHash = [
        currentFolder,
        ...file.path.split(currentFolder).slice(1).join(currentFolder),
      ].join("");
      currentFolderHash = currentFolderHash.replaceAll("//", "/");
      hashFiles[currentFolder][file.hash + "/" + currentFolderHash] = file;
    });
  } catch (e) {
    console.log(e);
  }
  if (isNoClient) {
    fs.mkdirSync(serverPath);
  } else if (isMods) {
    if (Object.keys(hashFiles).length > 0) {
      parentPort.postMessage([
        "launcher-download",
        { content: "", step: "Получаем хэш-суммы файлов", progress: "0" },
      ]);
      hashFilesClient = getFilesWithHash(serverPath, Object.keys(hashFiles));
    } else {
      fs.readdirSync(`${serverPath}/mods`).forEach((fileName) => {
        const fileMod = fileName.split("-");
        if (fileMod.length === 3 && fileMod[0] === "altromon") {
          clientMods[fileMod[1]] = { version: fileMod[2], path: fileName };
        }
      });
    }
  }
  return { hashFiles, hashFilesClient, blackList, clientMods };
};

const getDownloadedFiles = async (
  server,
  serverPath,
  isNoJdk,
  isNoClient,
  isMods,
  jdkVersion,
  hashFiles,
  hashFilesClient,
  blackList,
  clientMods,
) => {
  const serverMods = {};
  const files = (
    await axios.get(`${config.serverUrl}/api/launcher/files/${server}`)
  ).data;
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
    if (Object.keys(hashFiles).length > 0) {
      const logs = [];
      let totalFilesCount = 0;
      let offsetFiles = 0;
      Object.keys(hashFiles).map((folder) => {
        totalFilesCount += Object.keys(hashFiles[folder]).length;
      });
      Object.keys(hashFilesClient).map((folder) => {
        totalFilesCount += Object.keys(hashFilesClient[folder]).length;
      });
      Object.keys(hashFiles).map((folder) => {
        Object.keys(hashFiles[folder]).map(
          (hashServerFile, hashServerFileIndex) => {
            const currentPath =
              folder +
              hashFiles[folder][hashServerFile].path
                .split(folder)
                .slice(1)
                .join(folder);
            let skip = false;
            for (const blackFolder of blackList) {
              if (currentPath.startsWith(blackFolder)) {
                skip = true;
                break;
              }
            }
            parentPort.postMessage([
              "launcher-download",
              {
                content: hashFiles[folder][hashServerFile].path
                  .split("/")
                  .slice(-1),
                step: "Сравниваем хэш суммы файлов",
                progress: (
                  ((hashServerFileIndex + offsetFiles + 1) / totalFilesCount) *
                  100
                ).toFixed(0),
              },
            ]);
            if (
              !Object.keys(hashFilesClient[folder]).includes(hashServerFile) &&
              !skip
            ) {
              logs.push(`Download ${hashFiles[folder][hashServerFile].path}`);
              totalSize += hashFiles[folder][hashServerFile].size;
              filesDownload.push(hashFiles[folder][hashServerFile].path);
              sizes[
                hashFiles[folder][hashServerFile].path.split(server)[1].slice(1)
              ] = hashFiles[folder][hashServerFile].size;
            }
          },
        );
        offsetFiles += Object.keys(hashFiles[folder]).length - 1;
        Object.keys(hashFilesClient[folder]).map(
          (hashClientFile, hashClientFileIndex) => {
            const currentPath =
              folder +
              hashFilesClient[folder][hashClientFile].path
                .split(folder)
                .slice(1)
                .join(folder);
            parentPort.postMessage([
              "launcher-download",
              {
                content: hashFilesClient[folder][hashClientFile].path
                  .split("/")
                  .slice(-1),
                step: "Сравниваем хэш суммы файлов",
                progress: (
                  ((hashClientFileIndex + offsetFiles + 1) / totalFilesCount) *
                  100
                ).toFixed(0),
              },
            ]);
            let skip = false;
            for (const blackFolder of blackList) {
              if (currentPath.startsWith(blackFolder)) {
                skip = true;
                break;
              }
            }
            if (
              !Object.keys(hashFiles[folder]).includes(hashClientFile) &&
              !skip
            ) {
              fs.unlinkSync(`${hashFilesClient[folder][hashClientFile].path}`);
              logs.push(
                `Delete ${hashFilesClient[folder][hashClientFile].path}`,
              );
            }
          },
        );
        offsetFiles += Object.keys(hashFilesClient[folder]).length - 1;
      });
      if (logs.length > 0) {
        fs.appendFileSync(
          `${serverPath}/syncLogs.txt`,
          logs.join("\n") +
            `\n==============================${moment().format("DD-MM-YYYY HH:mm:ss")}==============================\n` +
            "\n",
          () => {},
        );
      }
    } else {
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
  }
  return { filesDownload, sizes, totalSize };
};

const downloadFiles = async (files, path, sizes, totalSize) => {
  let downloadedSizes = 0;
  const downloadListFile = [];

  const downloadFile = async (url, outputPath, filename, fileSize) => {
    try {
      const response = await axios({
        method: "GET",
        url: url,
        responseType: "stream",
      });
      return new Promise((resolve, reject) => {
        const writer = fs.createWriteStream(outputPath);
        response.data.pipe(writer);
        response.data.on("error", async () => {
          await downloadFile(url, outputPath, filename, fileSize);
          resolve("complete");
        });
        writer.on("finish", () => {
          downloadedSizes += fileSize;
          parentPort.postMessage([
            "launcher-download",
            {
              content: `Скачивание: ${filename.split("/").pop()}`,
              step: `Установка [${(downloadedSizes / 1024 / 1024).toFixed(1)}MB/${(totalSize / 1024 / 1024).toFixed(1)}MB]`,
              progress: ((downloadedSizes / totalSize) * 100).toFixed(0),
            },
          ]);
          resolve("complete");
        });
      });
    } catch (e) {
      await downloadFile(url, outputPath, filename, fileSize);
    }
  };
  const pLimit = (await import("p-limit")).default;
  const limit = pLimit(1000);
  for (const filename of files) {
    const req_url = `${config.serverUrl}/${filename.substring(2)}`;
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
    downloadListFile.push(
      limit(() =>
        downloadFile(
          req_url,
          pathFile,
          filename,
          sizes[filename.split("/").slice(3).join("/")],
        ),
      ),
    );
  }
  await Promise.all(downloadListFile);
  parentPort.postMessage([
    "launcher-download",
    {
      content: "",
      step: `Запускаем игру`,
      progress: 100,
    },
  ]);
};

const syncClientData = async (server, path, isMods, jdkVersion) => {
  const serverPath = `${path}/${server}`;
  const launcherFiles = fs.readdirSync(path);
  const isNoJdk = !launcherFiles.includes(jdkVersion);
  const isNoClient = !launcherFiles.includes(server);
  const { hashFiles, hashFilesClient, blackList, clientMods } =
    await getPrimaryData(server, isNoClient, serverPath, isMods);
  const { filesDownload, sizes, totalSize } = await getDownloadedFiles(
    server,
    serverPath,
    isNoJdk,
    isNoClient,
    isMods,
    jdkVersion,
    hashFiles,
    hashFilesClient,
    blackList,
    clientMods,
  );
  filesDownload.reverse();
  if (filesDownload.length > 0) {
    parentPort.postMessage([
      "launcher-download",
      {
        content: `Начинаем скачивание файлов...`,
        step: `Всего будет скачано: ${filesDownload.length}`,
        progress: 0,
      },
    ]);
    await downloadFiles(filesDownload, serverPath, sizes, totalSize);
    setTimeout(() => {
      parentPort.postMessage(["launcher-gameInit", ""]);
    }, 1000);
  } else {
    parentPort.postMessage(["launcher-gameInit", ""]);
  }
};

module.exports = {
  syncClientData,
};
