// Modules to control application life and create native browser window
//TODO: make a sources list/window
//TODO: Icons8 <a target="_blank" href="https://icons8.com">Icons8</a>

const {app, BrowserWindow, dialog, ipcMain, screen} = require('electron');
const fs = require('fs');
const path = require('path');
const child = require('child_process');
const dateTime = require('node-datetime');

if (handleSquirrelEvent()) {
  return;
}

const devBuild = true;

const sourceResourceDir = (devBuild) ? path.join(__dirname, "resources") : process.resourcesPath;

const ogResPath = path.join(sourceResourceDir, 'resources.json');
const resourceResp = fs.readFileSync(ogResPath);
const resourceJson = JSON.parse(resourceResp);
let resourcePath = resourceJson['resourceDirPath'];

let setupWindow;
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

// TODO: rename createWindow
function createWindow () {
  mainWindow = new BrowserWindow({
    width: 716,
    height: 539,
    frame: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    icon: "src/img/SlicersLogo.ico"
  });

  //mainWindow.setResizable(false);
  mainWindow.removeMenu();
  mainWindow.loadFile('./src/html/index.html');

  mainWindow.on('close', () => {
    appQuiting = true;
    app.quit();
  })
}

function initGlobalListeners() {
  ipcMain.on('minimizeWindow', (event, data) => {
    const win = getWindowFromArg(data);
    win.minimize();
  });
  ipcMain.on('maximizeWindow', (event, data) => {
    const win = getWindowFromArg(data);
    win.maximize();
  });
  ipcMain.on('restoreWindow', (event, data) => {
    const win = getWindowFromArg(data);
    win.restore();
  });
  ipcMain.on('closeWindow', (event, data) => {
    const win = getWindowFromArg(data);
    win.close();
  });
}
function getWindowFromArg(arg) {
  let win;
  switch (arg) {
    case "Slicers GUI Boot Config":
      win = setupWindow;
      break;
    case "Slicers GUI":
      win = mainWindow;
      break;
    case "SWTOR Patch Downloader":
      win = getPatchWindow;
      break;
    case "SWTOR Unpacker":
      win = unpackerWindow;
      break;
    case "SWTOR GR2 Viewer":
      win = gr2Window;
      break;
    case "Slicers GUI Logger":
      win = loggerWindow;
      break;
  }

  return win;
}

// This method will be called when Electron has finished
app.whenReady().then(() => {
  app.setAppUserModelId('com.swtor-slicers.tormak');
  handleBootUp();
  initGlobalListeners();
  
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) handleBootUp();
  });
});
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

function handleBootUp() {
  const res = fs.readFileSync(path.join(sourceResourceDir, 'resources.json'));
  const resJson = JSON.parse(res);

  if (resJson['resourceDirPath'] !== "") {
    if (fs.existsSync(resJson['resourceDirPath'])) {
      createWindow();
      init();
    } else {
      initSetupUI();
    }
  } else {
    initSetupUI();
  }
}

function init() {
  initListeners();

  //grab resources
  let res = fs.readFileSync(path.join(resourcePath, "extractionPresets.json"));
  let json = JSON.parse(res);
  extractionPresetConsts.names = json.names;
  extractionPresetConsts.dynamic = json.dynamic;
  extractionPresetConsts.static = json.static;
  extractionPresetConsts.sound = json.sound;
  extractionPresetConsts.gui = json.gui;
}
function initListeners() {
  ipcMain.on("getConfigJSON", async (event, data) => {
    let res = fs.readFileSync(path.join(resourcePath, "config.json"));
    let json = JSON.parse(res);

    cache.assetsFolder = json.assetsFolder;
    cache.outputFolder = json.outputFolder;
    cache.dataFolder = json.dataFolder;
    cache.extraction.extractionPreset = json.extraction.extractionPreset;

    let dropIsEnabled = false;
    if (cache.assetsFolder != "") {
      if (fs.statSync(cache.assetsFolder).isDirectory()) {
        const contents = fs.readdirSync(cache.assetsFolder);
        dropIsEnabled = extractionPresetConsts.names.every((elem) => {
          return contents.includes(elem);;
        });
      }
    }

    mainWindow.webContents.send("sendConfigJSON", [json, !dropIsEnabled]);
  });
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
    if (!fs.existsSync(path.dirname(logPath))) {
      fs.mkdirSync(path.dirname(logPath), {
        recursive: true
      });
    }
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

//completed

//boot config
function initSetupUI() {
  setupWindow = new BrowserWindow({
    width: 432,
    height: 376,
    frame: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    icon: "src/img/SlicersLogo.ico"
  });

  //mainWindow.setResizable(false);
  setupWindow.removeMenu();
  setupWindow.loadFile('./src/html/Setup.html');

  setupWindow.on('close', (e) => {
    if (mainWindow && !appQuiting)  {
      e.preventDefault();
      setupWindow.hide();
    }
  });

  initSetupListeners(setupWindow);
}
function initSetupListeners(window) {
  ipcMain.on("showBootConfigDialog", async (event, data) => {
    dialog.showOpenDialog(window, { properties: ['openDirectory'] }).then(async (dir) => {
      if (!dir.canceled) {
        event.reply(`${data}Reply`, dir.filePaths);
      }
    });
  });
  ipcMain.on('proceedToMain', async (event, data) => {
    //handle setup data
    const resVal = {"resourceDirPath": data[0]};
    const astVal = data[1];
    const outVal = data[2];

    //copy resources to new location
    await copyResourcesRecursive(sourceResourceDir, data[0]);

    //set resource paths
    resourcePath = data[0];

    fs.writeFileSync(path.join(sourceResourceDir, 'resources.json'), JSON.stringify(resVal));
    updateJSON('assetsFolder', astVal);
    updateJSON('outputFolder', outVal);

    //complete boot
    handleBootUp();
    window.hide();
  });
}
async function copyResourcesRecursive(originalDir, targetDir) {
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, {
      recursive: true
    });
  }
  const dirContents = fs.readdirSync(originalDir);
  for (const entr of dirContents) {
    const ogPath = path.join(originalDir, entr);
    const tPath = path.join(targetDir, entr);
    if (fs.statSync(ogPath).isFile()) {
      //is a file
      if (entr != "resources.json") {
        fs.copyFileSync(ogPath, tPath);
      }
    } else {
      //is a dir
      await copyResourcesRecursive(ogPath, tPath);
    }
  }
}

//logger
function initLoggerWindow() {
  loggerWindow = new BrowserWindow({
    width: 716,
    height: 539,
    frame: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    icon: "src/img/SlicersLogo.ico",
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
    window.webContents.send('displayLogData', data);
  });
}
//unpacker
function initUnpackerGUI() {
  unpackerWindow = new BrowserWindow({
    width: 516,
    height: 269,
    frame: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    icon: "src/img/SlicersLogo.ico",
  });

  unpackerWindow.removeMenu();
  //unpackerWindow.setResizable(false);
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
    frame: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    icon: "src/img/SlicersLogo.ico",
  });

  getPatchWindow.removeMenu();
  //getPatchWindow.setResizable(false);
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
    frame: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    icon: "src/img/SlicersLogo.ico",
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
//TODO: add a form of progress bar to extraction, and make it async
async function extract() {
  try {
    const output = cache.outputFolder;
    const hashPath = path.join(resourcePath, 'hash/hashes_filename.txt');
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
    //possibly change this to be async. Only if I can figure out how to make a progress bar. maybe in log?
    child.execFileSync(path.join(resourcePath, "scripts\\Extraction\\main.exe"), params);
  } catch (err) {
    console.log(err);
  } finally {
    mainWindow.webContents.send("extrCompl", "");
  }
}
async function locate() {
  try {
    const temp = cache.dataFolder;
    const params = [temp, path.join(cache.outputFolder, "resources")];
    child.execFileSync(path.join(resourcePath, "scripts\\FileLocator\\main.exe"), params);
    console.log(cache);
  } catch (err) {
    console.log(err);
  } finally {
    mainWindow.webContents.send("locCompl", "");
  }
}
async function updateJSON(param, val) {
  let res = fs.readFileSync(path.join(resourcePath, "config.json"));
  let json = JSON.parse(res);
  json[param] = val;
  cache[param] = val;

  fs.writeFileSync(path.join(resourcePath, "config.json"), JSON.stringify(json), 'utf-8');
}
//handles installation events
function handleSquirrelEvent() {
  if (process.argv.length === 1) {
    return false;
  }

  const ChildProcess = require('child_process');
  const path = require('path');

  const appFolder = path.resolve(process.execPath, '..');
  const rootAtomFolder = path.resolve(appFolder, '..');
  const updateDotExe = path.resolve(path.join(rootAtomFolder, 'Update.exe'));
  const exeName = path.basename(process.execPath);

  const spawn = function(command, args) {
    let spawnedProcess, error;

    try {
      spawnedProcess = ChildProcess.spawn(command, args, {detached: true});
    } catch (error) {}

    return spawnedProcess;
  };

  const spawnUpdate = function(args) {
    return spawn(updateDotExe, args);
  };

  const squirrelEvent = process.argv[1];
  switch (squirrelEvent) {
    case '--squirrel-install':
    case '--squirrel-updated':
      // Optionally do things such as:
      // - Add your .exe to the PATH
      // - Write to the registry for things like file associations and
      //   explorer context menus

      // Install desktop and start menu shortcuts
      spawnUpdate(['--createShortcut', exeName]);

      setTimeout(app.quit, 1000);
      return true;

    case '--squirrel-uninstall':
      // Undo anything you did in the --squirrel-install and
      // --squirrel-updated handlers

      // Remove desktop and start menu shortcuts
      spawnUpdate(['--removeShortcut', exeName]);

      setTimeout(app.quit, 1000);
      return true;

    case '--squirrel-obsolete':
      // This is called on the outgoing version of your app before
      // we update to the new version - it's the opposite of
      // --squirrel-updated

      app.quit();
      return true;
  }
};