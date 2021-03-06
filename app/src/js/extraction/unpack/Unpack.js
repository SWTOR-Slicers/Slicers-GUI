import {resourcePath} from "../../../api/config/resource-path/ResourcePath.js";
import { getSetting } from "../../../api/config/settings/Settings.js";
import { log, updateAlertType } from "../../universal/Logger.js";
import { addTooltip, updateTooltipEvent } from "../../universal/Tooltips.js";

let settingsJSON = getSetting();

const ssn = require('ssn');
const fs = require('fs');
const http = require('http');
const xmlJs = require('xml-js');
const {ipcRenderer} = require('electron');
const path = require('path');

const configPath = path.normalize(path.join(resourcePath, "config.json"));
const changeEvent = new Event('change');
let backupCache = {
    "unpackPath": "",
    "output": ""
}
const cacheInit = {
    "unpackPath": "",
    "output": ""
}
const cache = new Proxy(cacheInit, {
    set(target, property, value) {
        backupCache[property] = target[property];
        target[property] = value;
        return true;
    }
})

//action buttons
const unpackFile = document.getElementById("unpackFile");
const progressBar = document.getElementById("progressBar");

//settings inputs
const unpackPathLabel = document.getElementById('unpackPathLabel');
const filePathInput = document.getElementById("filePathInput");
const folderPathBrowserBtn = document.getElementById('folderPathBrowserBtn');
const filePathBrowserBtn = document.getElementById("filePathBrowserBtn");

const outputPathLabel = document.getElementById('outputPathLabel');
const outputInput = document.getElementById("outputInput");
const outputBrowserBtn = document.getElementById("outputBrowserBtn");

async function initialize() {
    await loadCache();
    filePathInput.value = cache["unpackPath"];
    outputInput.value = cache["output"];

    addTooltip('top', filePathInput, true, (element) => { return element.value; });
    addTooltip('top', outputInput, true, (element) => { return element.value; });
    addTooltip('top', progressBar, false, (element) => { return 'Progress Bar'; });
    addTooltip('top', unpackPathLabel, false, (element) => { return 'Unpack file or folder'; });
    addTooltip('top', outputPathLabel, false, (element) => { return 'Output folder'; });
    
    initListeners();
    initSubs();
}
//cache management functions
async function loadCache() {
    let res = fs.readFileSync(configPath);
    let jsonObj = await JSON.parse(res);
    let json = jsonObj["unpacker"];

    cache["unpackPath"] = json["unpackPath"];

    if (json["output"] == "" || !fs.existsSync(json["output"])) {
        const defaultPath = path.join(jsonObj["outputFolder"], 'unpacked');
        if (!fs.existsSync(defaultPath)) {
            fs.mkdirSync(defaultPath);
        }
        updateCache('output', defaultPath);
        cache["output"] = defaultPath
    } else {
        cache["output"] = json["output"];
    }
}
function updateCache(field, val) {
    const shouldUpdate = fs.existsSync(val); 
    if (shouldUpdate) {
        let res = fs.readFileSync(configPath);
        let json = JSON.parse(res);
        if (json["unpacker"][field] != val) {
            json["unpacker"][field] = val;
            cache[field] = val;
        
            fs.writeFileSync(configPath, JSON.stringify(json, null, '\t'), 'utf-8');

            if (field == "output") {
                outputInput.dispatchEvent(updateTooltipEvent);
            }
            if (field == "unpackPath") {
                filePathInput.dispatchEvent(updateTooltipEvent);
            }
        }
    } else {
        if (field == "output") {
            outputInput.value = cache["output"];
        }
        if (field == "unpackPath") {
            filePathInput.value = cache["unpackPath"];
        }
    }
}
//init dom listeners
function initListeners() {
    folderPathBrowserBtn.addEventListener("click", (e) => { ipcRenderer.send("showDialogUnpacker", "unpackPath"); });
    filePathBrowserBtn.addEventListener("click", (e) => { ipcRenderer.send("showUnpackerDialogFile", "unpackPath"); });
    outputBrowserBtn.addEventListener("click", (e) => { ipcRenderer.send("showDialogUnpacker", "output"); });
    unpackFile.addEventListener("click", (e) => { unpack(cache["output"], cache["unpackPath"]); });

    //listener for unpack path and output fields
    outputInput.addEventListener("change", (e) => {
        if (fs.existsSync(outputInput.value)) {
            updateCache("output", outputInput.value);
            log(`Assigned new value to output folder: ${outputInput.value}`, 'info');
        } else {
            log(`That path is invalid, please input a valid path.`, 'alert');
            outputInput.value = cache["output"];
        }
    });
    filePathInput.addEventListener("change", (e) => {
        if (fs.existsSync(filePathInput.value)) {
            updateCache("unpackPath", filePathInput.value);
            log(`Assigned new value to unpack path: ${filePathInput.value}`, 'info');
        } else {
            log(`That path is invalid, please input a valid path.`, 'alert');
            filePathInput.value = cache["unpackPath"];
        }
    });
}
//initializes main process subscriptions
function initSubs() {
    ipcRenderer.on('updateSettings', (event, data) => {
        settingsJSON = data[1];
        for (const dEnt of data[0]) {
            if (!Array.isArray(dEnt)) {
                switch (dEnt) {
                    case "alerts":
                        alertType = settingsJSON.alerts;
                        updateAlertType(settingsJSON.alerts);
                        break;
                }
            }
        }
    });
    ipcRenderer.on("recieveDialogUnpacker", (event, data) => {
        if (data != "") {
            const field = data[0];
            if (field == "unpackPath") {
                filePathInput.value = data[1][0];
                filePathInput.dispatchEvent(changeEvent);
            } else if (field == "output") {
                outputInput.value = data[1][0];
                outputInput.dispatchEvent(changeEvent);
            }
        }
    });
    ipcRenderer.on("recieveUnpackerDialogFile", (event, data) => {
        if (data != "") {
            const field = data[0];
            if (field == "unpackPath") {
                filePathInput.value = data[1][0];
                filePathInput.dispatchEvent(changeEvent);
            }
        }
    });
}

async function unpack(outputDir, patchPath) {
    if (fs.statSync(patchPath).isDirectory()) {
        const dirContents = fs.readdirSync(patchPath);
        for (let i = 0; i < dirContents.length; i++) {
            const patchElem = dirContents[i];
            if (!path.extname(patchElem).includes('0')) {
                await handleFile(outputDir, patchElem, patchPath);
            }
        }
    } else {
        const patchElem = patchPath;
        await handleFile(outputDir, patchElem);
    }
}
async function handleFile(outputDir, patchFile, patchPath) {
    const filePath = patchPath ? path.join(patchPath, patchFile) : patchFile;
    const fileType = path.extname(patchFile);
    if (fileType === ".solidpkg") {
        await unpackSolidpkg(outputDir, filePath);
    } else if (fileType === ".patchmanifest") {
        await unpackManifest(outputDir, filePath);
    } else if (fileType.substring(0, 2) === ".z") {
        await unpackZip(outputDir, filePath);
    }
}

async function unpackZip(outputDir, patchFile) {
    const fileName = patchFile.substring(patchFile.lastIndexOf("\\") + 1, patchFile.lastIndexOf("."));
    const solidPkgURL = getSolidPkgURLFromFileName(fileName);
    if (solidPkgURL) {

        const solidPkgName = `${fileName}.solidpkg`;
        let solidPkgEntries;
        let solidPkgData;

        //check if .solidpkg.json is installed
        const testName1 = path.join(path.dirname(patchFile), `${solidPkgName}.json`);
        //if not, check if .solidpkg is installed
        const testName2 = path.join(path.dirname(patchFile), solidPkgName);
        //if not, fetch .solidpkg, dont download, and parse it for info
        if (fs.existsSync(testName1)) {
            const res = fs.readFileSync(testName1);
            solidPkgData = res.toJSON();
        } else if (fs.existsSync(testName2)) {
            const res = fs.readFileSync(testName1);
            solidPkgEntries = ssn.readSsnFile(res.buffer);
            solidPkgData = await getSolidpkgData(solidPkgEntries, res);
        } else {
            const res = await (await fetch(solidPkgURL)).arrayBuffer();
            solidPkgEntries = ssn.readSsnFile(res);
            solidPkgData = await getSolidpkgData(solidPkgEntries, res);
        }

        const diskFileNames = await getDiskFileNames(patchFile, solidPkgData);

        //extract the selected .zip/.zNUM file
        const zFile = fs.readFileSync(patchFile);
        const fileEntries = ssn.readSsnFile(zFile.buffer);

        await extractZFile(outputDir, patchFile, fileEntries, solidPkgData, diskFileNames);
    }
}
async function extractZFile(outputDir, file, fileEntries, solidpkgData, diskFileNames) {
    const xyStr = file.substring(file.lastIndexOf('_') + 1, file.lastIndexOf('.'));
    verifyPatch(file.substring(file.lastIndexOf("\\") + 1), fileEntries, xyStr.substring(0, xyStr.indexOf('t')));

    console.log(solidpkgData);
    const tasks = [];
    for (let i = 0; i < fileEntries.length; i++) {
        const file = fileEntries[i];
        tasks.push(
            extractAdded.bind(null, outputDir, file, diskFileNames)
        );
    }
    await ssn.taskManager(tasks, 3);
}
async function extractAdded(targetDir, file, diskFileNames) {
    try {
        //create file write stream
        const outputName = path.join(targetDir, file.name);
        const outputNameTemp = path.join(targetDir, `${file.name}.tmp`);
  
        if (!fs.existsSync(path.dirname(outputName))) {
            fs.mkdirSync(path.dirname(outputName), {
                recursive: true
            });
        }

        //start installation
        await ssn.launch(diskFileNames[file.diskNumberStart], file.offset, file.compressedSize, file.decryptionKeys, undefined, outputNameTemp);
  
        fs.rename(outputNameTemp, outputName, function(renameError) {
            if (renameError) {
                throw new Error(`Could not rename output file "${outputNameTemp}": ${renameError.message}`);
            }
        });
    } catch (error) {
        console.error(`Could not extract file "${file.name}"`, error);
        log(`Could not extract file "${file.name}"`, 'alert');
    }
}
async function unpackManifest(outputDir, patchFile) {
    const patchFileName = patchFile.substring(patchFile.lastIndexOf("\\") + 1)
    const saveFilePath = path.join(outputDir, `${patchFileName}.json`);
    const ssnFile = fs.readFileSync(patchFile);

    const fileEntries = ssn.readSsnFile(ssnFile.buffer);

    //Verify .patchmanifest file
    if (fileEntries.length !== 1) {
        log(`Expected .patchmanifest to contain 1 file but it had "${fileEntries.length}" files.`, 'alert');
        return null;
    }

    const firstFile = fileEntries[0];
    if (firstFile.name !== 'manifest.xml') {
        log(`Expected .patchmanifest to contain a file called manifest.xml but it is called "${firstFile.name}".`, 'alert');
        return null;
    }

    const stream = ssn.arrayBufferToStream(ssnFile, firstFile.offset);

    //Extract manifest.xml file
    await ssn.readLocalFileHeader(stream, true);
    const patchmanifestStream = await ssn.extractFileAsStream(firstFile, stream);

    //Convert ArrayBuffer to string
    const patchmanifestXml = await ssn.streamToString(patchmanifestStream);

    //convert XML to JSON-converted XML
    const patchManifestJson = xmlJs.xml2js(patchmanifestXml);

    //convert JSON-converted XML to an easier to read JSON
    const patchManifestSimple = ssn.parsePatchmanifest(patchManifestJson);

    fs.writeFileSync(saveFilePath, JSON.stringify(patchManifestSimple, null, '\t'));

    log(`Unpacking of ${patchFileName} complete!`, 'info');
}
async function unpackSolidpkg(outputDir, patchFile) {
    const patchFileName = patchFile.substring(patchFile.lastIndexOf("\\") + 1)
    const saveFilePath = path.join(outputDir, `${patchFileName}.json`);
    const ssnFile = fs.readFileSync(patchFile);

    const fileEntries = ssn.readSsnFile(ssnFile.buffer);

    if (fileEntries.length !== 1) {
        log(`Expected .solidpkg to contain 1 file but it had "${fileEntries.length}" files.`, 'alert');
    }
    
    const firstFile = fileEntries[0];
    if (firstFile.name !== 'metafile.solid') {
        log(`Expected .solidpkg to contain a file called metafile.solid but it is called "${firstFile.name}".`, 'alert');
    }

    const stream = ssn.arrayBufferToStream(ssnFile, firstFile.offset);

    //Extract metafile.solid file
    await ssn.readLocalFileHeader(stream, true);
    const solidFileStream = await ssn.extractFileAsStream(firstFile, stream);
    const solidFileArrayBuffer = await ssn.streamToArrayBuffer(solidFileStream);
    const solidContents = ssn.parseBencode(solidFileArrayBuffer);
    
    const jsonSolidpkg = {
        created: new Date(solidContents['creation date'] * 1000),
        files: solidContents.info.files.map(({ length, path: [name] }) => ({ name, length })),
        pieceLength: solidContents.info['piece length'],
        pieces: solidContents.info.pieces,
    };

    fs.writeFileSync(saveFilePath, JSON.stringify(jsonSolidpkg, null, '\t'));

        log(`Unpacking of ${patchFileName} complete!`, 'info');
}

//utility methods

//get disk file names
async function getDiskFileNames(patchFileName, solidPkg) {
    const dirName = path.dirname(patchFileName);
    const diskFiles = [];
    const contentsOG = fs.readdirSync(dirName);
    const contents = contentsOG.filter((c) => { return fs.statSync(path.join(dirName, c)).isFile(); })
    for (const file of solidPkg.files) {
        if (contents.includes(file.name)) {
            diskFiles.push(path.join(dirName, file.name));
        } else {
            //fetch file
            const url = getZFileURLFromFileName(file.name);
            const dest = path.join(dirName, file.name);

            await getRemoteFile(dest, url);

            diskFiles.push(dest);
        }
    }

    return diskFiles;
}
//get zFile url from file name
function getZFileURLFromFileName(fileName) {
    const parts = fileName.substring(0, fileName.lastIndexOf('.')).split('_');
    const relivantSub = fileName.substring(0, fileName.lastIndexOf('_'));
    let url = "";

    if (relivantSub === "retailclient_swtor") {
        url = `http://cdn-patch.swtor.com/patch/swtor/retailclient_swtor/retailclient_swtor_${parts[2]}/${fileName}`;
    } else if (relivantSub.includes("assets_swtor")) {
        url = `http://cdn-patch.swtor.com/patch/assets_swtor_${parts[2]}/assets_swtor_${parts[2]}_${parts[3]}/${fileName}`;
    } else if (relivantSub === "retailclient_publictest") {
        url = `http://cdn-patch.swtor.com/patch/publictest/retailclient_publictest/retailclient_publictest_${parts[2]}/${fileName}`;
    } else if (relivantSub.includes("assets_swtor_test")) {
        url = `http://cdn-patch.swtor.com/patch/assets_swtor_test_${parts[3]}/assets_swtor_test_${parts[3]}_${parts[4]}/${fileName}`;
    } else if (relivantSub.includes("movies")) {
        url = `http://cdn-patch.swtor.com/patch/movies_${parts[1]}/movies_${parts[1]}_${parts[2]}/${fileName}`;
    } else if (relivantSub.includes('retailclient')) {
        const clientID = relivantSub.substring(relivantSub.lastIndexOf('_'));
        url = `http://cdn-patch.swtor.com/patch/${parts[1]}/retailclient_${parts[1]}/retailclient_${parts[1]}_${parts[2]}/${fileName}`;
    }

    return url;
}
//verify patch
function verifyPatch(patchFileName, fileEntries, from) {
    const fileName = patchFileName.substring(0, patchFileName.lastIndexOf('.'));
    const relivantSub = fileName.substring(0, fileName.lastIndexOf('_'));
    let product = relivantSub;
    ssn.verifyPatch(fileEntries, product, from);
}
//get solidpkg from file name
function getSolidPkgURLFromFileName(patchFileName) {
    const fileName = patchFileName.substring(0, patchFileName.lastIndexOf('.'));
    const relivantSub = fileName.substring(0, fileName.lastIndexOf('_'));
    let url = "";

    if (relivantSub === "retailclient_swtor") {
        url = `http://cdn-patch.swtor.com/patch/swtor/retailclient_swtor/${fileName}.solidpkg`;
    } else if (relivantSub.includes("assets_swtor")) {
        url = `http://cdn-patch.swtor.com/patch/${relivantSub}/${fileName}.solidpkg`;
    } else if (relivantSub === "retailclient_publictest") {
        url = `http://cdn-patch.swtor.com/patch/publictest/retailclient_publictest/${fileName}.solidpkg`;
    } else if (relivantSub.includes("assets_swtor_test")) {
        url = `http://cdn-patch.swtor.com/patch/${relivantSub}/${fileName}.solidpkg`;
    } else if (relivantSub.includes("movies")) {
        url = `http://cdn-patch.swtor.com/patch/${relivantSub}/${fileName}.solidpkg`;
    } else if (relivantSub.includes('retailclient')) {
        const clientID = relivantSub.substring(relivantSub.lastIndexOf('_'));
        url = `http://cdn-patch.swtor.com/patch/${clientID}/${relivantSub}/${fileName}.solidpkg`;
    }

    //for the memes
    //const url = (relivantSub === "retailclient_swtor") ? `http://cdn-patch.swtor.com/patch/swtor/retailclient_swtor/${fileName}.solidpkg` : (relivantSub.includes("assets_swtor")) ? `http://cdn-patch.swtor.com/patch/${relivantSub}/${fileName}.solidpkg` : (relivantSub === "retailclient_publictest") ? `http://cdn-patch.swtor.com/patch/publictest/retailclient_publictest/${fileName}.solidpkg` : (relivantSub.includes("assets_swtor_test")) ? `http://cdn-patch.swtor.com/patch/${relivantSub}/${fileName}.solidpkg` : (relivantSub.includes("movies")) ? `http://cdn-patch.swtor.com/patch/${relivantSub}/${fileName}.solidpkg` : (relivantSub.includes('retailclient')) ? `http://cdn-patch.swtor.com/patch/${relivantSub.substring(relivantSub.lastIndexOf('_'))}/${relivantSub}/${fileName}.solidpkg` : null;

    return url;
}
async function getSolidpkgData(fileEntries, ssnFile) {
    if (fileEntries.length !== 1) {
        log(`Expected .solidpkg to contain 1 file but it had "${fileEntries.length}" files.`, 'alert');
    }
    
    const firstFile = fileEntries[0];
    if (firstFile.name !== 'metafile.solid') {
        log(`Expected .solidpkg to contain a file called metafile.solid but it is called "${firstFile.name}".`, 'alert');
    }

    const stream = ssn.arrayBufferToStream(ssnFile, firstFile.offset);

    //Extract metafile.solid file
    await ssn.readLocalFileHeader(stream, true);
    const solidFileStream = await ssn.extractFileAsStream(firstFile, stream);
    const solidFileArrayBuffer = await ssn.streamToArrayBuffer(solidFileStream);
    const solidContents = ssn.parseBencode(solidFileArrayBuffer);
    
    const jsonSolidpkg = {
        created: new Date(solidContents['creation date'] * 1000),
        files: solidContents.info.files.map(({ length, path: [name] }) => ({ name, length })),
        pieceLength: solidContents.info['piece length'],
        pieces: solidContents.info.pieces,
    };

    return jsonSolidpkg;
}
//get file using http library
async function getRemoteFile(dest, url) {
    return new Promise((resolve, reject) => {
        const request = http.get(url, (response) => {
            if (response.statusCode == 200) {
                const file = fs.createWriteStream(dest);
                response.pipe(file);

                var len = parseInt(response.headers['content-length'], 10);
                var downloaded = 0;
            
                response.on('data', (chunk) => {
                    downloaded += chunk.length;
                    const percentage = (100.0 * downloaded / len).toFixed(2);
                    progressBar.style.width = `${percentage}%`;
                });

                file.on('finish', () => {
                    progressBar.style.width = ``;
                    resolve("done");
                });
            } else {
                reject("error");
            }
        });
    });
}

initialize();