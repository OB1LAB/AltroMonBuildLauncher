const { spawn } = require("child_process");
const { syncClientData } = require("../utils");
const { parentPort } = require("worker_threads");

class MinecraftApi {
  static async runServer(server, jdkVersion, isMods, cmd, path) {
    await syncClientData(server, path, isMods, jdkVersion);
    const runtime = spawn(
      `${path}/${jdkVersion}/bin/java.exe`,
      cmd.split(" ").map((line) => `"${line}"`),
      {
        shell: "powershell.exe",
        cwd: `${path}/${server}`,
      },
    );
    // runtime.stderr.on("data", async (data) => {
    //   console.log(data.toString());
    // });
    let isClose = false;
    runtime.stdout.on("data", (line) => {
      const lineString = line.toString().split(" ");
      // console.log(line.toString());
      if (
        (lineString[3] === "[minecraft/Minecraft]:" &&
          lineString[4] === "LWJGL") ||
        lineString[2] === "[cp.mo.mo.Launcher/MODLAUNCHER]:" ||
        lineString
          .toString()
          .toLowerCase()
          .includes("ModLauncher".toLowerCase())
      ) {
        if (!isClose) {
          setTimeout(() => {
            parentPort.postMessage("quit");
          }, 5000);
          isClose = true;
        }
      }
    });
  }
}

module.exports = MinecraftApi;
