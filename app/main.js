// Modules to control application life and create native browser window
const {app, BrowserWindow, dialog, ipcMain, screen} = require('electron');
const fs = require('fs');
const path = require('path');
const child = require('child_process');
const dateTime = require('node-datetime');
let mainWindow;
const cache = {
  assetsFolder:"",
  outputFolder:"",
  dataFolder:""
}
let gr2WindowOpened = false;
let getPatchWindowOpened = false;
let unpackerWindowOpened = false;

let loggerWindowOpened = false;

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
  ipcMain.on("logToFile", async (event, data) => {
    var dt = dateTime.create();
    var formatted = dt.format('Y-m-d H_M_S');

    let logPath = path.join(data[0], 'logs', `${formatted}.txt`);
    fs.mkdirSync(path.dirname(logPath), {
      recursive: true
    });
    fs.writeFileSync(logPath, data[1]);
    mainWindow.webContents.send("loggedToFile", [logPath]);
  });
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
        extract();
        break;
      case "locate":
        locate();
        break;
      case "genHash":
        //generate new hash
        break;
      case "unpack":
        initUnpackerGUI();
        break;
      case "nodeViewer":
        //run node viewer
        break;
      case "gr2Viewer":
        initGR2Viewer();
        break;
      case "modelViewer":
        //open modal viewer window
        break;
      case "worldViewer":
        //open world viewer window
        break;
      case "convBnk":
        //open sound converter window
        break;
      case "fileChanger":
        //open file changer window
        break;
      case "getPatch":
        initGetPatchGUI();
        break;
      case "walkthrough":
        //open walkthrough window
        break;
      case "logger":
        initLoggerWindow();
        break;
    }
  });
}

function initLoggerWindow() {
  let win = new BrowserWindow({
    width: 716,
    height: 539,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    icon: __dirname + "/resources/img/SlicersLogo.png",
  });
  
  win.removeMenu();
  win.webContents.openDevTools();
  win.loadURL(`${__dirname}/src/html/Logger.html`);

  win.on('close', () => {
    removeLoggerListeners();
    if (mainWindow) {
      if (mainWindow.webContents) {
        mainWindow.webContents.send("loggerWindowClosed", "");
      }
    }
  });

  if (!loggerWindowOpened) {
    initLoggerListeners(win);
    loggerWindowOpened = true;
  }
}
function initLoggerListeners(window) {
  ipcMain.on('sendLoggerData', (event, data) => {
    console.log('ran1');
    window.webContents.send('recieveLoggerData', data);
  });
  ipcMain.on('closeLoggerWindow', (event, data) => {
    console.log('ran2');
    window.close();
  });
  ipcMain.on('logToPopped', (event, data) => {
    console.log('ran3');
    window.webContents.send('displayLogData', data);
  });
}
function removeLoggerListeners() {
  ipcMain.removeListener('sendLoggerData');
  ipcMain.removeListener('closeLoggerWindow');
  ipcMain.removeListener('logToPopped');
}

function initUnpackerGUI() {
  let win = new BrowserWindow({
    width: 516,
    height: 269,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    icon: __dirname + "/resources/img/SlicersLogo.png",
  });

  win.removeMenu();
  win.setResizable(false);
  win.loadURL(`${__dirname}/src/html/Unpacker.html`);

  win.on('close', () => {
    if (mainWindow) {
      if (mainWindow.webContents) {
        mainWindow.webContents.send("unpkCompl", "");
      }
    }
  });

  if (!unpackerWindowOpened) {
    initUnpackerListeners(win);
    unpackerWindowOpened = true;
  }
}
function initUnpackerListeners(window) {
  ipcMain.on("showDialogUnpacker", async (event, data) => {
    dialog.showOpenDialog(window, { properties: ['openDirectory'] }).then(async (dir) => {
        if (!dir.canceled) {
          event.reply("recieveDialogUnpacker", [data, dir.filePaths]);
        } else {
          event.reply("recieveDialogUnpacker", "");
        }
    });
  });
  ipcMain.on("showUnpackerDialogFile", async (event, data) => {
    dialog.showOpenDialog(window, { properties: ['openFile'] }).then(async (file) => {
        if (!file.canceled) {
          event.reply("recieveUnpackerDialogFile", [data, file.filePaths]);
        } else {
          event.reply("recieveUnpackerDialogFile", "");
        }
    });
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

  win.removeMenu();
  win.setResizable(false);
  win.loadURL(`${__dirname}/src/html/GetPatch.html`);

  win.on('close', () => {
    if (mainWindow) {
      if (mainWindow.webContents) {
        mainWindow.webContents.send("utilGPClosed", "");
      }
    }
  });

  if (!getPatchWindowOpened) {
    initGetPatchListeners(win);
    getPatchWindowOpened = true;
  }
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

  if (!gr2WindowOpened) {
    initGR2Listeners(win);
    gr2WindowOpened = true;
  }
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

async function extract() {
  try {
    const temp = cache.dataFolder;
    const params = [temp, cache.outputFolder + "\\resources"];
    //child.execFileSync(__dirname + "\\resources\\scripts\\Extraction\\main.exe", params);
  } catch (err) {
    console.log(err);
  } finally {
    mainWindow.webContents.send("extrCompl", "");
  }
}
async function locate() {
  try {
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