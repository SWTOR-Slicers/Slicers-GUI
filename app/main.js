// Modules to control application life and create native browser window
const {app, BrowserWindow, dialog, ipcMain, ipcRenderer} = require('electron');
const fs = require('fs');
const xml2js = require("xml2js");
const path = require('path');
const child = require('child_process');
const { inherits } = require('util');
let mainWindow;
const cache = {
  assetsFolder:"",
  outputFolder:"",
  dataFolder:""
}

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1000, //716 for production
    height: 700, //539 for production
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    },
    icon: __dirname + "/resources/img/SlicersLogo.png"
  });
  //mainWindow.removeMenu();
  mainWindow.setResizable(false);

  // and load the index.html of the app.
  mainWindow.loadFile('index.html');
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();
  
  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  init();
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

function init() {
  initListeners();
}

function initListeners() {
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
  ipcMain.on("runExec", async (event, data) => {
    switch (data) {
      case "nodeViewer":
        //run node viewer
        // child.execFile(__dirname + "/resources/scripts/Node Viewer/NodeViewer.exe", (err, data) => {
        //   if (err) console.log(err);
        //   console.log(data.toString());
        // });
        break;
      case "locate":
        if (cache.dataFolder = "" || cache.assetsFolder == "") {
          let res = fs.readFileSync(__dirname + "/resources/config.json");
          let json = JSON.parse(res);
          
          cache.assetsFolder = json.assetsFolder;
          cache.outputFolder = json.outputFolder;
          cache.dataFolder = json.dataFolder;
        }

        child.execFile(__dirname + "/resources/scripts/FileLocator/main.exe", [cache.dataFolder, cache.outputFolder + "\\resources"], (err) => {
          if (err) console.log(err);
          mainWindow.webContents.send("locCompl", "");
        });
        break;
    }
  });
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