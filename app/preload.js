// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
const {
  contextBridge,
  ipcRenderer
} = require("electron");

contextBridge.exposeInMainWorld(
  "api", {
      send: (channel, data) => {
          let validChannels = ["showDialog", "runExec", "updateJSON", "getConfigJSON"];
          if (validChannels.includes(channel)) {
              ipcRenderer.send(channel, data);
          }
      },
      receive: (channel, func) => {
          let validChannels = ["displayLog", "assetsFolderReply", "outputFolderReply", "dataFolderReply", "extrCompl", "locCompl", "unpkCompl", "genHashCompl", "gr2ViewClosed", "nodeViewClosed", "modViewClosed", "worViewClosed", "utilFileChngClosed", "utilBnkClosed", "utilGPClosed", "walkthroughClosed", "isDirAsset", "isDirOut", "isDirDat", "sendConfigJSON"];
          if (validChannels.includes(channel)) {
              ipcRenderer.on(channel, (event, ...args) => func(...args));
          }
      }
  }
);

window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }

  for (const type of ['chrome', 'node', 'electron']) {
    replaceText(`${type}-version`, process.versions[type])
  }
});