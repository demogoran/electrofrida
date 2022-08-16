/* eslint-disable @typescript-eslint/ban-ts-comment */

import * as fs from "fs";
import * as path from "path";
import * as frida from "frida";
import * as ps from "ps-list";
import * as os from "os";
import * as readline from "readline";
import { exec } from "child_process";
import { Tail } from "tail";
import { contextBridge } from "electron";
import { ScriptRuntime } from "frida/dist/script";

const execAsync = (command: string, config?: any): Promise<string> =>
  new Promise((resolve, reject) => {
    // @ts-ignore
    const child = exec(command, config);

    let finalData = "";
    child.stdout.on("data", function (data) {
      finalData += data;
    });
    child.stderr.on("data", function (data) {
      //console.log("stderr: " + data);
      finalData += data;
    });
    child.addListener("error", reject);
    child.addListener("exit", () => resolve(finalData));
  });

const game = "Star Valor.exe";
const dllFolder = path.join(__dirname, "../dn/bin/Debug/net4.7.2/");
//const getPIDCommand = `powershell -command "Get-WmiObject Win32_Process -Filter \\"name = '${game}'\\" | Sort-Object -Descending WS |  Select -ExpandProperty \\"ProcessId\\""`;

const updateConfig = async () => {
  const csproj = path.join(__dirname, "../dn/dn.csproj");
  const config = await fs.promises.readFile(csproj, "utf-8");
  const parts = config.split("\n");
  const index = parts.findIndex((x) => x.includes("<AssemblyName>"));
  const fileVersion =
    +parts[index]
      .replace("<AssemblyName>", "")
      .replace("</AssemblyName>", "")
      .replace("dn-", "") + 1;

  parts[index] = `    <AssemblyName>dn-${fileVersion}</AssemblyName>\r`;

  await fs.promises.writeFile(csproj, parts.join("\n"));

  return fileVersion;
};

const readLineLogs = (callback: (data: string) => void) => {
  console.log("Lets start");
  const logfile = path.join(os.homedir(), "/Desktop/harmony.log.txt");
  try {
    fs.statSync(logfile);
  } catch {
    fs.writeFileSync(logfile, Buffer.from(""));
  }

  const tail = new Tail(logfile, {
    fromBeginning: true,
  });

  tail.on("line", function (data) {
    //window.postMessage({ type: "sendLogLine", text: data }, "*");
    callback(data);
  });

  tail.on("error", function (error) {
    console.log("ERROR: ", error);
  });
};

contextBridge.exposeInMainWorld("mainApi", {
  getProcessList: () => ps(),
  injectToProcess: (pid: number) => main(pid),
  readLogs: readLineLogs,
  // we can also expose variables, not just functions
});

const main = async (pid: number) => {
  const newVersion = await updateConfig();
  const dllPath = `dn-${newVersion}.dll`;
  try {
    console.log(path.join(__dirname, "../dn"));
    const buildOutput = await execAsync("dotnet build", {
      cwd: path.join(__dirname, "../dn"),
    });
    console.log("buildOutput", buildOutput);
  } catch (ex) {
    console.error(ex);
  }

  //const pid = +(await execAsync(getPIDCommand)).split("\n")[0];
  console.log(pid);

  const tempUrl = `${dllFolder}/${dllPath}`;

  const session = await frida.attach(+pid);
  const source = ["dist/script.js"]
    .map((path) => fs.readFileSync(path, "utf8"))
    .join("\n\n\n");

  const script = await session.createScript(
    `
    const tempUrl = "${tempUrl.replaceAll("\\", "/")}";
    ${source}
  `,
    {
      runtime: ScriptRuntime.V8,
    }
  );
  session.enableDebugger();

  script.message.connect((message) => {
    console.log("[*] Message:", message);
  });
  await script.load();
  console.log("[*] Script loaded");
};
