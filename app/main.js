// Modules to control application life and create native browser window
const {app, BrowserWindow, dialog, ipcMain, screen} = require('electron');
const fs = require('fs');
const path = require('path');
const child = require('child_process');
const dateTime = require('node-datetime');
let mainWindow;
let loggerWindow;
let unpackerWindow;
let gr2Window;
let getPatchWindow;
let appQuiting = false;
const cache = {
  assetsFolder:"",
  outputFolder:"",
  dataFolder:"",
  extraction: {
    extractionPreset: ""
  }
}
const extractionPresetConsts = {
  "names": [],
  "dynamic": [],
  "static": [],
  "sound": [],
  "gui": []
};

function createWindow () {
  mainWindow = new BrowserWindow({
    width: 716,
    height: 539,
    webPreferences: {
      preload: path.join(__dirname, '/preload.js')
    },
    icon: __dirname + "/resources/img/SlicersLogo.png"
  });

  mainWindow.setResizable(false);
  mainWindow.removeMenu();
  mainWindow.loadFile('index.html');

  mainWindow.on('close', () => {
    appQuiting = true;
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

  //grab resources
  let res = fs.readFileSync(__dirname + "/resources/extractionPresets.json");
  let json = JSON.parse(res);
  extractionPresetConsts.names = json.names;
  extractionPresetConsts.dynamic = json.dynamic;
  extractionPresetConsts.static = json.static;
  extractionPresetConsts.sound = json.sound;
  extractionPresetConsts.gui = json.gui;
}
function initListeners() {
  ipcMain.on("getConfigJSON", async (event, data) => {
    let res = fs.readFileSync(__dirname + "/resources/config.json");
    let json = JSON.parse(res);

    cache.assetsFolder = json.assetsFolder;
    cache.outputFolder = json.outputFolder;
    cache.dataFolder = json.dataFolder;
    cache.extraction.extractionPreset = json.extraction.extractionPreset;

    let dropIsEnabled = false;
    if (fs.statSync(cache.assetsFolder).isDirectory()) {
      const contents = fs.readdirSync(cache.assetsFolder);
      dropIsEnabled = extractionPresetConsts.names.every((elem) => {
        return contents.includes(elem);;
      });
    }

    mainWindow.webContents.send("sendConfigJSON", [json, !dropIsEnabled]);
  })
  ipcMain.on("showDialog", async (event, data) => {
    dialog.showOpenDialog(mainWindow, { properties: ['openDirectory'] }).then(async (dir) => {
      if (!dir.canceled) {
        switch (data) {
          case "assetsFolder":
            let dropIsEnabled = false;
            if (fs.statSync(dir.filePaths[0]).isDirectory()) {
              const contents = fs.readdirSync(dir.filePaths[0]);
              dropIsEnabled = extractionPresetConsts.names.every((elem) => {
                return contents.includes(elem);;
              });
            }
            mainWindow.webContents.send("assetsFolderReply", [dir.filePaths, dropIsEnabled]);
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
        let dropIsEnabled = false;
        if (exists && fs.statSync(data[1]).isDirectory()) {
          const contents = fs.readdirSync(data[1]);
          dropIsEnabled = extractionPresetConsts.names.every((elem) => {
            return contents.includes(path.join(data[1], elem));
          });
        }
        mainWindow.webContents.send("isDirAsset", [exists, dropIsEnabled]);
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
        if (unpackerWindow) {
          unpackerWindow.show();
        } else {
          initUnpackerGUI();
        }
        break;
      case "nodeViewer":
        //run node viewer
        break;
      case "gr2Viewer":
        if (gr2Window) {
          gr2Window.show();
        } else {
          initGR2Viewer();
        }
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
        if (getPatchWindow) {
          getPatchWindow.show();
        } else {
          initGetPatchGUI();
        }
        break;
      case "walkthrough":
        //open walkthrough window
        break;
    }
  });
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
  ipcMain.on('initLogger', (event, data) => {
    if (loggerWindow) {
      loggerWindow.show();
    } else {
      initLoggerWindow();
    }
  });
  ipcMain.on('getPoppedLoggerData', (event, data) => {
    mainWindow.webContents.send('sendPoppedLoggerData', "");
  });
  ipcMain.on('updateExtractionPreset', (event, data) => {
    let res = fs.readFileSync(__dirname + "/resources/config.json");
    let json = JSON.parse(res);
    json.extraction.extractionPreset = data;
    cache.extraction.extractionPreset = data;

    fs.writeFileSync(__dirname + "/resources/config.json", JSON.stringify(json), 'utf-8');
  });
}

async function extract() {
  try {
    const output = cache.outputFolder;
    const hashPath = path.join(__dirname, 'resources/hash/hashes_filename.txt');
    const temp = cache.assetsFolder;
    let values;

    if (cache.extraction.extractionPreset != 'All') {
      values = [];
      const tors = extractionPresetConsts[cache.extraction.extractionPreset.toLocaleLowerCase()];
      for (const tor of tors) {
        values.push(path.join(temp, tor));
      }
    } else {
      values = [temp];
    }

    const params = [JSON.stringify(values), output, hashPath];
    child.execFileSync(__dirname + "\\resources\\scripts\\Extraction\\main.exe", params);
  } catch (err) {
    console.log(err);
  } finally {
    mainWindow.webContents.send("extrCompl", "");
  }
}

//completed

//logger
function initLoggerWindow() {
  loggerWindow = new BrowserWindow({
    width: 716,
    height: 539,
    webPreferences: {
      preload: path.join(__dirname, '/src/js/log/logPreloader.js')
    },
    icon: __dirname + "/resources/img/SlicersLogo.png",
  });
  
  loggerWindow.removeMenu();
  loggerWindow.loadURL(`${__dirname}/src/html/Logger.html`);

  loggerWindow.on('close', (e) => {
    if (!appQuiting) {
      e.preventDefault();
      loggerWindow.hide();
    }
    if (mainWindow) {
      if (mainWindow.webContents) {
        mainWindow.webContents.send("loggerWindowClosed", "");
      }
    }
  });

  initLoggerListeners(loggerWindow);
}
function initLoggerListeners(window) {
  ipcMain.on('sendLoggerData', (event, data) => {
    window.webContents.send('recieveLoggerData', data);
  });
  ipcMain.on('closeLoggerWindow', (event, data) => {
    window.close();
  });
  ipcMain.on('logToPopped', (event, data) => {
    console.log('ran3');
    window.webContents.send('displayLogData', data);
  });
}
//unpacker
function initUnpackerGUI() {
  unpackerWindow = new BrowserWindow({
    width: 516,
    height: 269,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    icon: __dirname + "/resources/img/SlicersLogo.png",
  });

  unpackerWindow.removeMenu();
  unpackerWindow.setResizable(false);
  unpackerWindow.loadURL(`${__dirname}/src/html/Unpacker.html`);

  unpackerWindow.on('close', (e) => {
    if (!appQuiting) {
      e.preventDefault();
      unpackerWindow.hide();
    }
    if (mainWindow) {
      if (mainWindow.webContents) {
        mainWindow.webContents.send("unpkCompl", "");
      }
    }
  });

  initUnpackerListeners(unpackerWindow);
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
//patch downloader
function initGetPatchGUI() {
  getPatchWindow = new BrowserWindow({
    width: 516,
    height: 439,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    icon: __dirname + "/resources/img/SlicersLogo.png",
  });

  getPatchWindow.removeMenu();
  getPatchWindow.setResizable(false);
  getPatchWindow.loadURL(`${__dirname}/src/html/GetPatch.html`);

  getPatchWindow.on('close', (e) => {
    if (!appQuiting) {
      e.preventDefault();
      getPatchWindow.hide();
    }
    if (mainWindow) {
      if (mainWindow.webContents) {
        mainWindow.webContents.send("utilGPClosed", "");
      }
    }
  });

  initGetPatchListeners(getPatchWindow);
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
//gr2 viewer
function initGR2Viewer() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  
  gr2Window = new BrowserWindow({
    width: width,
    height: height,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    icon: __dirname + "/resources/img/SlicersLogo.png",
  });

  gr2Window.removeMenu();
  gr2Window.loadURL(`${__dirname}/src/html/GR2Viewer.html`);

  gr2Window.on('close', (e) => {
    if (!appQuiting) {
      e.preventDefault();
      gr2Window.hide();
    }
    if (mainWindow) {
      if (mainWindow.webContents) {
        mainWindow.webContents.send("gr2ViewClosed", "");
      }
    }
  });

  initGR2Listeners(gr2Window);
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

//utility methods
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