// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
const {
  contextBridge,
  ipcRenderer
} = require("electron");
const fs = require('fs');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  "api", {
      send: (channel, data) => {
          // whitelist channels
          let validChannels = ["showDialog", "runExec"];
          if (validChannels.includes(channel)) {
              ipcRenderer.send(channel, data);
          }
      },
      receive: (channel, func) => {
          let validChannels = ["assetsFolderReply", "outputFolderReply", "dataFolderReply", "extrCompl", "locCompl", "gr2ViewClosed", "nodeViewClosed", "modViewClosed", "worViewClosed", "utilFileChngClosed", "utilBnkClosed", "utilGPClosed"];
          if (validChannels.includes(channel)) {
              // Deliberately strip event as it includes `sender` 
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