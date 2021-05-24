// Modules to control application life and create native browser window
const {app, BrowserWindow, dialog, ipcMain, screen} = require('electron');
const fs = require('fs');
const xml2js = require("xml2js");
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

  // and load the index.html of the app.
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
      case "genHash":
        
        break;
      case "gr2Viewer":
        initGR2Viewer();
        break;
      case "nodeViewer":
        //run node viewer
        // child.execFile(__dirname + "/resources/scripts/Node Viewer/NodeViewer.exe", (err, data) => {
        //   if (err) console.log(err);
        //   console.log(data.toString());
        // });
        break;
    }
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
  win.webContents.openDevTools();

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
          event.reply("getDialogResponse", dir.filePaths);
        } else {
          event.reply("getDialogResponse", "");
        }
    });
  })
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
  if (param == "assetsFolder") {
    handleXMLUpadate(val);
  }
}
function handleXMLUpadate(val) {
  // fs.readFile(__dirname + "/resources/scripts/Node Viewer/NodeViewer.exe.config", "utf-8", function(err, data) {
  //   if (err) console.log(err);
    
  //   xml2js.parseString(data, function(err, result) {
  //     if (err) console.log(err);
  
  //     var json = result;
  //     json.configuration.appSettings[0].add[0]['$'].value = val;
  
  //     var builder = new xml2js.Builder();
  //     var xml = builder.buildObject(json);
  
  //     fs.writeFile(__dirname + "/resources/scripts/Node Viewer/NodeViewer.exe.config", xml, function(err, data) {
  //       if (err) console.log(err);
  //     });
  //   });
  // });
}