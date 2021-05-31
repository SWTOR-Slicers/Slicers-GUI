// Modules to control application life and create native browser window
const {app, BrowserWindow, dialog, ipcMain, screen} = require('electron');
const fs = require('fs');
const axios = require('axios');
const path = require('path');
const child = require('child_process');
let mainWindow;
const cache = {
  assetsFolder:"",
  outputFolder:"",
  dataFolder:""
}

function createWindow () {
  mainWindow = new BrowserWindow({
    width: 716,
    height: 539,
    webPreferences: {
      preload: path.join(__dirname, '/preload.js')
    },
    icon: __dirname + "/resources/img/SlicersLogo.png"
  });

  mainWindow.removeMenu();
  mainWindow.setResizable(false);
  mainWindow.loadFile('index.html');

  mainWindow.on('close', () => {
    app.quit();
  })
}

// This method will be called when Electron has finished
app.whenReady().then(() => {
  createWindow();
  
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  init();
});
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

function init() {
  initListeners();
}
function initListeners() {
  ipcMain.on("logToMain", async (event, data) => {
    mainWindow.webContents.send("displayLog", data);
  });
  ipcMain.on("getConfigJSON", async (event, data) => {
    let res = fs.readFileSync(__dirname + "/resources/config.json");
    let json = JSON.parse(res);

    cache.assetsFolder = json.assetsFolder;
    cache.outputFolder = json.outputFolder;
    cache.dataFolder = json.dataFolder;

    mainWindow.webContents.send("sendConfigJSON", json);
  })
  ipcMain.on("showDialog", async (event, data) => {
    dialog.showOpenDialog(mainWindow, { properties: ['openDirectory'] }).then(async (dir) => {
      if (!dir.canceled) {
        switch (data) {
          case "assetsFolder":
            mainWindow.webContents.send("assetsFolderReply", dir.filePaths);
            await updateJSON("assetsFolder", dir.filePaths[0]);
            break;
          case "outputFolder":
            mainWindow.webContents.send("outputFolderReply", dir.filePaths);
            await updateJSON("outputFolder", dir.filePaths[0]);
            break;
          case "dataFolder":
            mainWindow.webContents.send("dataFolderReply", dir.filePaths);
            await updateJSON("dataFolder", dir.filePaths[0]);
            break;
        }
      }
    });
  });
  ipcMain.on("updateJSON", async (event, data) => {
    let exists = fs.existsSync(data[1]);
    switch (data[0]) {
      case "assetsFolder":
        mainWindow.webContents.send("isDirAsset", exists);
        break;
      case "outputFolder":
        mainWindow.webContents.send("isDirOut", exists);
        break;
      case "dataFolder":
        mainWindow.webContents.send("isDirDat", exists);
        break;
    }
    if (exists) {
      await updateJSON(data[1], data[0]);
    }
  });
  ipcMain.on("runExec", async (event, data) => {
    switch (data) {
      case "extraction":
        mainWindow.webContents.send("extrCompl", "");
        break;
      case "locate":
        locate();
        break;
      case "unpack":
        break;
      case "genHash":
        
        break;
      case "getPatch":
        initGetPatchGUI();
        break;
      case "gr2Viewer":
        initGR2Viewer();
        break;
      case "nodeViewer":
        //run node viewer
        break;
    }
  });
}

function initGetPatchGUI() {
  let win = new BrowserWindow({
    width: 516,
    height: 439,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    icon: __dirname + "/resources/img/SlicersLogo.png",
  });
  win.webContents.openDevTools();

  win.removeMenu();
  win.loadURL(`${__dirname}/src/html/GetPatch.html`);

  win.on('close', () => {
    if (mainWindow) {
      if (mainWindow.webContents) {
        mainWindow.webContents.send("utilGPClosed", "");
      }
    }
  });

  initGetPatchListeners(win);
}
function initGetPatchListeners(window) {
  ipcMain.on("showDialogPatch", async (event, data) => {
    dialog.showOpenDialog(window, { properties: ['openDirectory'] }).then(async (dir) => {
        if (!dir.canceled) {
          event.reply("getDialogResponsePatch", dir.filePaths);
        } else {
          event.reply("getDialogResponsePatch", "");
        }
    });
  });
  ipcMain.on("downloadPatchFile", async (event, data) => {
    const file = data[0];
    const url = data[1];
    const preMsg = data[2];
    const postMsg = data[3];

    mainWindow.webContents.send("displayLog", preMsg);

    try {
      const writer = fs.createWriteStream(file);

      const response = await axios({
        url: url,
        method: 'GET',
        responseType: 'stream'
      });

      response.data.pipe(writer);
    } catch (err) {
      event.reply("fileDownloadResolve", [`There was an error downloading the file. Please try again.`]);
    }

    event.reply("fileDownloadResolve", [postMsg]);
  });
}

function initGR2Viewer() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  
  let win = new BrowserWindow({
    width: width,
    height: height,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    icon: __dirname + "/resources/img/SlicersLogo.png",
  });

  win.removeMenu();
  win.loadURL(`${__dirname}/src/html/GR2Viewer.html`);

  win.on('close', () => {
    if (mainWindow) {
      if (mainWindow.webContents) {
        mainWindow.webContents.send("gr2ViewClosed", "");
      }
    }
  });

  initGR2Listeners(win);
}
function initGR2Listeners(window) {
  ipcMain.on("showDialogGR2", async (event, data) => {
    dialog.showOpenDialog(window, { properties: ['openDirectory'] }).then(async (dir) => {
        if (!dir.canceled) {
          event.reply("getDialogResponseGR2", dir.filePaths);
        } else {
          event.reply("getDialogResponseGR2", "");
        }
    });
  });
}

async function locate() {
  try {
    console.log(cache);
    const temp = cache.dataFolder;
    const params = [temp, cache.outputFolder + "\\resources"];
    child.execFileSync(__dirname + "\\resources\\scripts\\FileLocator\\main.exe", params);
    console.log(cache);
  } catch (err) {
    console.log(err);
  } finally {
    mainWindow.webContents.send("locCompl", "");
  }
}
async function updateJSON(param, val) {
  let res = fs.readFileSync(__dirname + "/resources/config.json");
  let json = JSON.parse(res);
  json[param] = val;
  cache[param] = val;

  fs.writeFileSync(__dirname + "/resources/config.json", JSON.stringify(json), 'utf-8');
}