const { Dom } = require("./Dom.js");

const { ipcMain } = require("electron");

const windowsToPush = [];
const MainDom = new Dom();

// main listeners
ipcMain.on("domUpdate", (event, data) => {
    for (const webCont of windowsToPush) {
        webCont.send("mainUpdated", data);
    }

    event.returnValue = true;
});
ipcMain.on("getDom", (event) => {
    event.returnValue = JSON.stringify(MainDom);
});
ipcMain.on("subscribeDom", (event) => {
    windowsToPush.push(event.sender);
    event.returnValue = true;
});

module.exports = {
    "MainDom": MainDom
}