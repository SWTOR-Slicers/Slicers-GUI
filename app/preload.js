// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
const {
  contextBridge,
  ipcRenderer
} = require("electron");
const fs = require('fs');

contextBridge.exposeInMainWorld(
  "api", {
      send: (channel, data) => {
          let validChannels = ["showDialog", "runExec"];
          if (validChannels.includes(channel)) {
              ipcRenderer.send(channel, data);
          }
      },
      receive: (channel, func) => {
          let validChannels = ["assetsFolderReply", "outputFolderReply", "dataFolderReply", "extrCompl", "locCompl", "genHashCompl", "gr2ViewClosed", "nodeViewClosed", "modViewClosed", "worViewClosed", "utilFileChngClosed", "utilBnkClosed", "utilGPClosed"];
          if (validChannels.includes(channel)) {
              ipcRenderer.on(channel, (event, ...args) => func(...args));
          }
      }
  }
);

window.addEventListener('DOMContentLoaded', () => {
  let res = fs.readFileSync(__dirname + "/resources/config.json");
  let json = JSON.parse(res);
  
  document.getElementById("assetTextField").value = json.assetsFolder;
  document.getElementById("outputTextField").value = json.outputFolder;
  document.getElementById("dataTextField").value = json.dataFolder;

  const replaceText = (selector, text) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }

  for (const type of ['chrome', 'node', 'electron']) {
    replaceText(`${type}-version`, process.versions[type])
  }
});