// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
const {
    contextBridge
  } = require("electron");
  const fs = require('fs');
  const path = require('path');
  const exec = require('child_process');
  const os = require("os");
  
  contextBridge.exposeInMainWorld(
    "api", {
        fs: fs,
        path: path,
        child_process: exec,
        os: os
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