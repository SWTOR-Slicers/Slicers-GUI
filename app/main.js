// Modules to control application life and create native browser window
//TODO: make a sources list/window

const {app, BrowserWindow, dialog, ipcMain, screen, shell} = require('electron');
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

const fs = require('fs');
const ChildProcess = require('child_process');
const path = require('path');
const child = require('child_process');
const dateTime = require('node-datetime');
const UUID = require('uuid');
const uuidV4 = UUID.v4;

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
let soundConverterWindow;
let settingsWindow;
let fileChangerWin;
let creditsWindow;
let editorWindow;
let nodeSelectWin;
let nodeViewerWin;
const windows = [mainWindow, setupWindow, unpackerWindow, soundConverterWindow, getPatchWindow, gr2Window, fileChangerWin, creditsWindow, editorWindow, nodeSelectWin, nodeViewerWin];

let appQuiting = false;
const cache = {
  assetsFolder:"",
  outputFolder:"",
  dataFolder:"",
  extraction: {
    extractionPreset: "",
    version: ""
  }
}
const extractionPresetConsts = {
  "Live": {
    "names": [],
    "dynamic": [],
    "static": [],
    "sound": [],
    "gui": []
  },
  "pts": {
    "names": [],
    "dynamic": [],
    "static": [],
    "sound": [],
    "gui": []
  }
};

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
    case "SWTOR Sound Converter":
      win = soundConverterWindow;
      break;
    case "Slicers GUI Settings":
      win = settingsWindow;
      break;
    case "SWTOR File Changer":
      win = fileChangerWin;
      break;
    case "Slicers GUI Credits":
      win = creditsWindow;
      break;
    case "Slicers GUI Layout Editor":
      win = editorWindow;
      break;
    case "Node Extract Selection":
      win = nodeSelectWin;
      break;
    case "Node Viewer":
      win = nodeViewerWin;
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
      initMain();
      initApp();
    } else {
      initSetupUI();
    }
  } else {
    initSetupUI();
  }
}

//completed

//main window
function initMain () {
  mainWindow = new BrowserWindow({
    width: 716,
    height: 545,
    frame: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    icon: "src/img/SlicersLogo.ico",
    show: false
  });
  mainWindow.once('ready-to-show', () => mainWindow.show());

  mainWindow.removeMenu();
  mainWindow.loadFile('./src/html/Index.html');
  
  let wasMinimized = false;
  mainWindow.on('minimize', () => { mainWindow.webContents.send('minimizedMain'); wasMinimized = true; });
  mainWindow.on('maximize', () => { if (wasMinimized) mainWindow.webContents.send('restoredMain'); wasMinimized = false; });
  mainWindow.on('restore', () => { mainWindow.webContents.send('restoredMain'); wasMinimized = false; });

  mainWindow.on('close', () => {  appQuiting = true; app.quit(); });
}
function initApp() {
  initMainListeners();

  //grab resources
  let res = fs.readFileSync(path.join(resourcePath, "extractionPresets.json"));
  let json = JSON.parse(res);
  extractionPresetConsts.Live.names = json.Live.names;
  extractionPresetConsts.Live.dynamic = json.Live.dynamic;
  extractionPresetConsts.Live.static = json.Live.static;
  extractionPresetConsts.Live.sound = json.Live.sound;
  extractionPresetConsts.Live.gui = json.Live.gui;
  
  extractionPresetConsts.pts.names = json.pts.names;
  extractionPresetConsts.pts.dynamic = json.pts.dynamic;
  extractionPresetConsts.pts.static = json.pts.static;
  extractionPresetConsts.pts.sound = json.pts.sound;
  extractionPresetConsts.pts.gui = json.pts.gui;
}
function initMainListeners() {
  ipcMain.on('getWindowStatus', (event, data) => {
    event.reply('sendWindowStatus', [mainWindow.isMinimized()]);
  });
  ipcMain.on("getConfigJSON", async (event, data) => {
    let res = fs.readFileSync(path.join(resourcePath, "config.json"));
    let json = JSON.parse(res);

    cache.assetsFolder = json.assetsFolder;
    cache.outputFolder = json.outputFolder;
    cache.dataFolder = json.dataFolder;
    cache.extraction.extractionPreset = json.extraction.extractionPreset;
    cache.extraction.version = json.extraction.version;

    let dropIsEnabled = false;
    if (cache.assetsFolder != "") {
      if (fs.statSync(cache.assetsFolder).isDirectory()) {
        const contents = fs.readdirSync(cache.assetsFolder);
        dropIsEnabled = extractionPresetConsts[cache.extraction.version].names.every((elem) => {
          return contents.includes(elem);
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
              dropIsEnabled = extractionPresetConsts[cache.extraction.version].names.every((elem) => {
                return contents.includes(elem);
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
          dropIsEnabled = extractionPresetConsts[cache.extraction.version].names.every((elem) => {
            return contents.includes(elem);
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
    if (data[0] == "extraction") {
      if (cache.extraction.extractionPreset == "Node") {
        if (nodeSelectWin) {
          nodeSelectWin.show();
        } else {
          initNodeSelect();
        }
      } else {
        extract(data[1]);
      }
    } else {
      switch (data) {
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
          if (nodeViewerWin) {
            nodeViewerWin.show();
          } else {
            initNodeViewer();
          }
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
        case "fileBrowser":
          //open fileBrowser window
          break;
        case "convBnk":
          if (soundConverterWindow) {
            soundConverterWindow.show();
          } else {
            initSoundConvGUI();
          }
          break;
        case "fileChanger":
          if (fileChangerWin) {
            fileChangerWin.show();
          } else {
            initFileChanger();
          }
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
        case "dbmUtils":
          //open dbmUtils window
          break;
        case "settings":
          if (settingsWindow) {
            settingsWindow.show();
          } else {
            initSettingsWindow();
          }
          break;
        case "credits":
          if (creditsWindow) {
            creditsWindow.show();
          } else {
            initCreditsWindow();
          }
          break;
        case "editor":
          if (editorWindow) {
            editorWindow.show();
          } else {
            initEditorWindow();
          }
          break;
      }
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
  ipcMain.on('updateMainUIVersion', (event, data) => {
    let res = fs.readFileSync(path.join(resourcePath, 'config.json'));
    let json = JSON.parse(res);
    json.extraction.version = data;
    cache.extraction.version = data;

    fs.writeFileSync(path.join(resourcePath, 'config.json'), JSON.stringify(json, null, '\t'), 'utf-8');

    let dropIsEnabled = false;
    if (fs.statSync(cache.assetsFolder).isDirectory()) {
      const contents = fs.readdirSync(cache.assetsFolder);
      dropIsEnabled = extractionPresetConsts[cache.extraction.version].names.every((elem) => {
        return contents.includes(elem);;
      });
    }
    mainWindow.webContents.send('updateExtractionPresetStatus', [dropIsEnabled]);
  });
  ipcMain.on('updateExtractionPreset', (event, data) => {
    let res = fs.readFileSync(path.join(resourcePath, 'config.json'));
    let json = JSON.parse(res);
    json.extraction.extractionPreset = data;
    cache.extraction.extractionPreset = data;

    fs.writeFileSync(path.join(resourcePath, 'config.json'), JSON.stringify(json, null, '\t'), 'utf-8');
  });
  ipcMain.on('openLink', (event, data) => { shell.openExternal(data[0]); });
}
//boot config
function initSetupUI() {
  setupWindow = new BrowserWindow({
    width: 453,
    height: 376,
    frame: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    icon: "src/img/SlicersLogo.ico",
    show: false
  });
  setupWindow.once('ready-to-show', () => setupWindow.show());

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

    fs.writeFileSync(path.join(sourceResourceDir, 'resources.json'), JSON.stringify(resVal, null, '\t'));
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
  } else {
    const fileRemovalChecklist = ["resources.json", "appSettings.json", "app.ico", "SlicersLogo.ico", "app", "hash", "scripts"]
    for (const elem of fileRemovalChecklist) {
      const elemPath = path.join(targetDir, elem)
      if (fs.existsSync(elemPath)) {
        if (fs.statSync(elemPath).isDirectory()) {
          fs.rmSync(elemPath, { recursive: true, force: true});
        } else {
          fs.rmSync(elemPath)
        }
      }
    }
  }
  const dirContents = fs.readdirSync(originalDir);
  for (const entr of dirContents) {
    const ogPath = path.join(originalDir, entr);
    const tPath = path.join(targetDir, entr);
    if (fs.statSync(ogPath).isFile()) {
      //is a file
      if (entr != "resources.json" && entr != "appSettings.json" && entr != "app.ico" && entr != "SlicersLogo.ico") {
        fs.copyFileSync(ogPath, tPath);
      }
    } else {
      //is a dir
      if (entr != "app") {
        await copyResourcesRecursive(ogPath, tPath);
      }
    }
  }
}
//credits
function initCreditsWindow() {
  creditsWindow = new BrowserWindow({
    width: 716,
    height: 539,
    frame: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    icon: "src/img/SlicersLogo.ico",
    show: false
  });
  creditsWindow.once('ready-to-show', () => creditsWindow.show());
  
  creditsWindow.removeMenu();
  creditsWindow.loadURL(`${__dirname}/src/html/Credits.html`);

  creditsWindow.on('close', (e) => {
    if (!appQuiting) {
      e.preventDefault();
      creditsWindow.hide();
    }
    if (mainWindow) {
      if (mainWindow.webContents) {
        mainWindow.webContents.send("creditsWindowClosed", "");
      }
    }
  });
}
//Layout Editor
function initEditorWindow() {
  editorWindow = new BrowserWindow({
    width: 1100,
    height: 700,
    frame: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    icon: 'src/img/SlicersLogo.ico',
    show: false
  });
  editorWindow.once('ready-to-show', () => editorWindow.show());
  
  editorWindow.removeMenu();
  editorWindow.loadFile(`${__dirname}/src/html/Editor.html`);
  
  editorWindow.on('close', (e) => {
    if (!appQuiting) {
      e.preventDefault();
      editorWindow.hide();
    }
    if (mainWindow) {
      if (mainWindow.webContents) {
        mainWindow.webContents.send('editorWindowClosed', '');
      }
    }
  
    initEditorListeners(editorWindow);
  });
}
function initEditorListeners(window) {
  
}
//Node Select
function initNodeSelect () {
  nodeSelectWin = new BrowserWindow({
    width: 300,
    height: 500,
    frame: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    icon: 'src/img/SlicersLogo.ico',
    show: false
  });
  nodeSelectWin.once('ready-to-show', () => nodeSelectWin.show());
  
  nodeSelectWin.removeMenu();
  nodeSelectWin.loadFile(`${__dirname}/src/html/NodeSelect.html`);
  
  
  nodeSelectWin.on('close', (e) => {
    if (!appQuiting) {
      e.preventDefault();
      nodeSelectWin.hide();
    }
    if (mainWindow) {
      if (mainWindow.webContents) {
        mainWindow.webContents.send('extrCanceled', '');
      }
    }
  });
  
  initNodeSelectListeners(nodeSelectWin);
}
function initNodeSelectListeners(window) {
  ipcMain.on('extractNodes', (event, data) => { extractNodes('extractProgBar', data[0]); });
  ipcMain.on('cancelNodeExtr', (event, data) => { window.close(); });
}
//settings
function initSettingsWindow() {
  settingsWindow = new BrowserWindow({
    width: 716,
    height: 539,
    frame: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    icon: "src/img/SlicersLogo.ico",
    show: false
  });
  settingsWindow.once('ready-to-show', () => settingsWindow.show());
  
  settingsWindow.removeMenu();
  settingsWindow.loadURL(`${__dirname}/src/html/Settings.html`);

  settingsWindow.on('close', (e) => {
    if (!appQuiting) {
      e.preventDefault();
      settingsWindow.hide();
    }
    if (mainWindow) {
      if (mainWindow.webContents) {
        mainWindow.webContents.send("settingsWindowClosed", "");
      }
    }
  });

  initSettingsListeners(settingsWindow);
}
function initSettingsListeners(window) {
  ipcMain.on('settingsSaved', (event, data) => {
    const changedFields = data[0];

    for (const win of windows) {
      if (win) {
        win.webContents.send('updateSettings', [changedFields, data[1]]);
      }
    }

    window.close();
  });
  ipcMain.on('settingsCanceled', (event, data) => {
    window.close();
  });
  ipcMain.on("openMusicFolderDialog", async (event, data) => {
    dialog.showOpenDialog(window, { properties: ['openDirectory'] }).then(async (dir) => {
      event.reply("musicFolderResponse", (dir.canceled) ? "" : dir.filePaths);
    });
  });
  ipcMain.on("openMusicFileDialog", async (event, data) => {
    dialog.showOpenDialog(window, { properties: ['openFile'] }).then(async (file) => {
      event.reply("musicFileResponse", (file.canceled) ? "" : file.filePaths);
    });
  });
}
//logger
function initLoggerWindow() {
  loggerWindow = new BrowserWindow({
    width: 716,
    height: 545,
    frame: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    icon: "src/img/SlicersLogo.ico",
    show: false
  });
  loggerWindow.once('ready-to-show', () => loggerWindow.show());
  
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
//file changer
function initFileChanger () {
  fileChangerWin = new BrowserWindow({
    width: 952,
    height: 485,
    frame: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    icon: 'src/img/SlicersLogo.ico',
    show: false
  });
  fileChangerWin.once('ready-to-show', () => fileChangerWin.show());
  
  fileChangerWin.removeMenu();
  fileChangerWin.loadFile(`${__dirname}/src/html/FileChanger.html`);
  
  fileChangerWin.on('close', (e) => {
    if (!appQuiting) {
      e.preventDefault();
      fileChangerWin.hide();
    }
    if (mainWindow) {
      if (mainWindow.webContents) {
        mainWindow.webContents.send('utilFileChngClosed', '');
      }
    }
  });

  initFileChangerListeners(fileChangerWin);
}
function initFileChangerListeners(window) {
  ipcMain.on('openFileDialogChanger', (event, data) => {
    dialog.showOpenDialog(window, { properties: ['openFile'] }).then(async (file) => {
      if (!file.canceled) {
        event.reply("changerDialogResponse", [data, file.filePaths]);
      } else {
        event.reply("changerDialogResponse", "");
      }
    });
  });
  ipcMain.on('openFolderDialogChanger', (event, data) => {
    dialog.showOpenDialog(window, { properties: ['openDirectory'] }).then(async (file) => {
      if (!file.canceled) {
        event.reply("changerFolderDialogResponse", [data, file.filePaths]);
      } else {
        event.reply("changerFolderDialogResponse", "");
      }
    });
  });
  ipcMain.on("changerExtrNodeStart", (event, data) => {
    const progId = data[0];
    const assetFile = data[1][0];
    const outputDir = data[2];
    const nodeName = data[3];

    const params = [assetFile, outputDir, nodeName];

    extractSingleNode(progId, params);
  });
  ipcMain.on("changerExtrFileStart", (event, data) => {
    const progId = data[0];
    const assetFiles = data[1];
    const outputDir = data[2];
    const hashes = data[3];
    const hashPath = path.join(resourcePath, 'hash', 'hashes_filename.txt');

    const params = [JSON.stringify(assetFiles), outputDir, hashPath, JSON.stringify(hashes)];

    extractSingleFile(progId, params);
  });
  ipcMain.on("changerRestoreBackupStart", (event, data) => {
    const progId = data[0];
    const params = data[1];

    restoreBackups(progId, params);
  });
  ipcMain.on("changerChangeFiles", (event, data) => {
    const progBarId = data[0];
    const assetFiles = data[1];
    const backupObj = data[2];
    const fChanges = data[3];
    const hashPath = path.join(resourcePath, 'hash', 'hashes_filename.txt');
    const ionicComprExe = path.join(resourcePath, 'scripts', 'IonicCompress.exe');
    const zipPath = data[4];

    const changesName = path.join(cache['outputFolder'], 'tmp', `${uuidV4()}-changer.json`);
    fs.mkdirSync(path.dirname(changesName), { recursive: true });
    fs.writeFileSync(changesName, JSON.stringify(fChanges))

    const params = [JSON.stringify(assetFiles), hashPath, JSON.stringify(backupObj), changesName, ionicComprExe, zipPath];

    changeFiles(progBarId, params);
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
    show: false
  });
  unpackerWindow.once('ready-to-show', () => unpackerWindow.show());

  unpackerWindow.removeMenu();
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
    show: false
  });
  getPatchWindow.once('ready-to-show', () => getPatchWindow.show());

  getPatchWindow.removeMenu();
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
//unpacker
function initSoundConvGUI() {
  soundConverterWindow = new BrowserWindow({
    width: 516,
    height: 409,
    frame: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    icon: "src/img/SlicersLogo.ico",
    show: false
  });
  soundConverterWindow.once('ready-to-show', () => soundConverterWindow.show());

  soundConverterWindow.removeMenu();
  soundConverterWindow.loadURL(`${__dirname}/src/html/SoundConverter.html`);

  soundConverterWindow.on('close', (e) => {
    if (!appQuiting) {
      e.preventDefault();
      soundConverterWindow.hide();
    }
    if (mainWindow) {
      if (mainWindow.webContents) {
        mainWindow.webContents.send("utilBnkClosed", "");
      }
    }
  });

  initSoundConvListeners(soundConverterWindow);
}
function initSoundConvListeners(window) {
  ipcMain.on("showDialogSoundConv", async (event, data) => {
    dialog.showOpenDialog(window, { properties: ['openDirectory'] }).then(async (dir) => {
        if (!dir.canceled) {
          event.reply("recieveSoundConvDialog", [data, dir.filePaths]);
        } else {
          event.reply("recieveSoundConvDialog", "");
        }
    });
  });
  ipcMain.on("showDialogSoundConvFile", async (event, data) => {
    dialog.showOpenDialog(window, { properties: ['openFile'] }).then(async (file) => {
        if (!file.canceled) {
          event.reply("recieveSoundConvDialogFile", [data, file.filePaths]);
        } else {
          event.reply("recieveSoundConvDialogFile", "");
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
    show: false
  });
  gr2Window.once('ready-to-show', () => gr2Window.show());

  gr2Window.removeMenu();
  gr2Window.webContents.openDevTools();
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
//Node viewer
function initNodeViewer () {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  nodeViewerWin = new BrowserWindow({
    width: width,
    height: height,
    frame: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      nodeIntegrationInWorker: true
    },
    icon: 'src/img/SlicersLogo.ico',
    show: false
  });
  nodeViewerWin.once('ready-to-show', () => nodeViewerWin.show());
  
  nodeViewerWin.removeMenu();
  nodeViewerWin.webContents.openDevTools();
  nodeViewerWin.loadFile(`${__dirname}/src/html/NodeViewer.html`);
  
  
  nodeViewerWin.on('close', (e) => {
    if (!appQuiting) {
      e.preventDefault();
      nodeViewerWin.hide();
    }
    if (mainWindow) {
      if (mainWindow.webContents) {
        mainWindow.webContents.send('nodeViewClosed', '');
      }
    }
  
  });
  
  initNodeViewerListeners(nodeViewerWin);
}
function initNodeViewerListeners(window) {
  ipcMain.on('readAllNodes', (event, data) => { readAllNodes(); });
}


//utility methods
async function extractSingleFile(progBarId, params) {
  try {
    const extrProc = child.spawn(path.join(resourcePath, "scripts", "fileExtractor.exe"), params);
    let len = 0;
    extrProc.stdout.on('data', (data) => {
      const lDat = data.toString().split(' ');
      len = (lDat[1] != '' && len == 0) ? lDat[1] : 0;
      const percent = `${lDat[0] / len * 100}%`;
      fileChangerWin.webContents.send('updateProgBar', [progBarId, percent]);
    });
    extrProc.stderr.on('data', (data) => { console.log(`Error: ${data.toString()}`); });
    extrProc.on('exit', (code) => {
      console.log(`child process exited with status: ${code.toString()}`);
      fileChangerWin.webContents.send("changerFileExtr", [code == 0]);
    });
  } catch (err) {
    console.log(err);
  }
}
async function extractSingleNode(progBarId, params) {
  try {
    const extrProc = child.spawn(path.join(resourcePath, "scripts", "nodeExtractor.exe"), params);
    let len = 0;
    extrProc.stdout.on('data', (data) => {
      const lDat = data.toString().split(' ');
      len = (lDat[1] != '' && len == 0) ? lDat[1] : 0;
      const percent = `${lDat[0] / len * 100}%`;
      fileChangerWin.webContents.send('updateProgBar', [progBarId, percent]);
    });
    extrProc.stderr.on('data', (data) => { console.log(`Error: ${data.toString()}`); });
    extrProc.on('exit', (code) => {
      console.log(`child process exited with status: ${code.toString()}`);
      fileChangerWin.webContents.send("changerNodeExtr", [code == 0]);
    });
  } catch (err) {
    console.log(err);
  }
}
async function changeFiles(progBarId, params) {
  try {
    const extrProc = child.spawn(path.join(resourcePath, "scripts", "fileChanger.exe"), params);
    let len = 0;
    extrProc.stdout.on('data', (data) => {
      const lDat = data.toString().split(' ');
      len = (lDat[1] != '' && len == 0) ? lDat[1] : 0;
      const percent = `${lDat[0] / len * 100}%`;
      fileChangerWin.webContents.send('updateProgBar', [progBarId, percent]);
    });
    extrProc.stderr.on('data', (data) => { console.log(`Error: ${data.toString()}`); });
    extrProc.on('exit', (code) => {
      console.log(`child process exited with status: ${code.toString()}`);
      fileChangerWin.webContents.send("changerChangedFiles", [code == 0]);
    });
  } catch (err) {
    console.log(err);
  }
}

async function restoreBackups(progBarId, params) {
  let completed = false;
  let deadIdx = 0
  let totalSize = 0;
  let currentSize = 0;

  const dirPath = path.join(params['output'], 'backups');
  const backupContents = fs.readdirSync(dirPath);
  const pathInfos = [];
  const sizes = backupContents.map((val, idx) => {
    const fPath = path.join(dirPath, val);
    let destPath = path.join(params['assets'], val);
    if (val == "main_gfx_1.tor") { destPath = path.join(params['assets'], params['version'] == 'Live' ? 'swtor' : 'publictest', "retailclient", val); }
    pathInfos[idx] = {
      fPath: fPath,
      destPath: destPath
    };
    const size = fs.statSync(fPath).size;
    totalSize += size;
    return size;
  });
  for (let i = 0; i < pathInfos.length; i++) {
    const pathInfo = pathInfos[i];
    const size = sizes[i]
    
    const pipeRes = await copyFileViaStream(progBarId, pathInfo.fPath, pathInfo.destPath, currentSize, totalSize);
    currentSize = pipeRes[1];
    if (pipeRes[0] != 200) {
      deadIdx = i;
      break
    } else {
      completed = true;
    }
  }
  if (completed) {
    fileChangerWin.webContents.send("changerBackupRestore", [true])
  } else {
    fileChangerWin.webContents.send("changerBackupRestore", [false, deadIdx])
  }
}
async function extract(progBarId) {
  try {
    const output = cache.outputFolder;
    const hashPath = path.join(resourcePath, 'hash', 'hashes_filename.txt');
    const temp = cache.assetsFolder;
    let values;

    const lastPath = path.normalize(path.join(temp, `../${cache.extraction.version == 'Live' ? 'swtor' : 'publictest'}/retailclient/main_gfx_1.tor`));
    if (cache.extraction.extractionPreset != 'All' && cache.extraction.extractionPreset != 'Unnamed') {
      values = [];
      const tors = extractionPresetConsts[cache.extraction.version][cache.extraction.extractionPreset.toLowerCase()];
      for (const tor of tors) {
        values.push(path.join(temp, tor));
      }
      if (cache.extraction.extractionPreset == "gui" && fs.existsSync(lastPath)) {
        values.push(lastPath);
      }
    } else {
      values = [];
      const tors = extractionPresetConsts[cache.extraction.version]["names"];
      for (const tor of tors) {
        values.push(path.join(temp, tor));
      }
      if (fs.existsSync(lastPath)) {
        values.push(lastPath);
      }
    }

    const torsName = path.join(cache['outputFolder'], 'tmp', `${uuidV4()}-tors.json`);
    fs.mkdirSync(path.dirname(torsName), { recursive: true });
    fs.writeFileSync(torsName, JSON.stringify(values))

    const params = [torsName, output, hashPath, (cache['extraction']['extractionPreset'] == 'Unnamed') ? "true" : "false"];
    const extrProc = child.spawn(path.join(resourcePath, "scripts", "extraction.exe"), params);
    extrProc.stdout.on('data', (data) => {
      const lDat = data.toString().split(' ');
      const percent = `${lDat[0] / lDat[1] * 100}%`;
      mainWindow.webContents.send('updateProgBar', [progBarId, percent]);
    });
    extrProc.stderr.on('data', (data) => {
      console.log(`Error: ${data.toString()}`);
    });
    extrProc.on('exit', (code) => {
      console.log(`child process exited with status: ${code.toString()}`);
      mainWindow.webContents.send("extrCompl", "");
    });
  } catch (err) {
    console.log(err);
  }
}
async function extractNodes(progBarId, nodeFamilies) {
  try {
    const output = path.join(cache.outputFolder, 'resources', 'nodes');
    let tor = path.join(cache.assetsFolder, cache.extraction.version == 'Live' ? 'swtor_main_global_1.tor' : 'swtor_test_main_global_1.tor');

    const params = [tor, output, JSON.stringify(nodeFamilies)];
    const extrProc = child.spawn(path.join(resourcePath, "scripts", "nodeExtraction.exe"), params);
    extrProc.stdout.on('data', (data) => {
      const lDat = data.toString().split(' ');
      const percent = `${lDat[0] / lDat[1] * 100}%`;
      mainWindow.webContents.send('updateProgBar', [progBarId, percent]);
    });
    extrProc.stderr.on('data', (data) => {
      console.log(`Error: ${data.toString()}`);
    });
    extrProc.on('exit', (code) => {
      console.log(`child process exited with status: ${code.toString()}`);
      mainWindow.webContents.send("extrCompl", "");
    });
  } catch (err) {
    console.log(err);
  }
}
async function locate() {
  try {
    const temp = cache.dataFolder;
    const params = [temp, path.join(cache.outputFolder, "resources")];
    child.execFileSync(path.join(resourcePath, "scripts", "locator.exe"), params);
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

  fs.writeFileSync(path.join(resourcePath, "config.json"), JSON.stringify(json, null, '\t'), 'utf-8');
}

async function readAllNodes() {
  try {
    let torFile = path.join(cache.assetsFolder, cache.extraction.version == 'Live' ? 'swtor_main_global_1.tor' : 'swtor_test_main_global_1.tor');
    let torFile2 = path.join(cache.assetsFolder, cache.extraction.version == 'Live' ? 'swtor_main_systemgenerated_gom_1.tor' : 'swtor_test_main_systemgenerated_gom_1.tor');

    nodeViewerWin.webContents.send('nodeTorPath', [torFile, torFile2]);
  } catch (err) {
    console.log(err);
  }
}
//handles installation events
function handleSquirrelEvent() {
  if (process.argv.length === 1) {
    return false;
  }

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

async function copyFileViaStream(progBarId, tPath, dPath, cSize, tSize) {
  return new Promise((resolve, reject) => {
    const tarFile = fs.createReadStream(tPath)
    const destFile = fs.createWriteStream(dPath);
    tarFile.pipe(destFile);

    tarFile.on('data', (chunk) => {
      cSize += chunk.length;
      const percent = (100.0 * cSize / tSize).toFixed(2);
      fileChangerWin.webContents.send('updateProgBar', [progBarId, `${percent}%`]);
    });

    destFile.on('finish', () => {
      resolve([200, cSize]);
    });
    destFile.on('error', (e) => {
      reject([500, cSize]);
    });
  });
}