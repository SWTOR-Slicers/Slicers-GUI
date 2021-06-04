import { log } from "../../universal/Logger.js";

const ssn = require('ssn');
const fs = require('fs');
const xmlJs = require('xml-js');
const {ipcRenderer} = require('electron');
const path = require('path');

const configPath = path.normalize(path.join(__dirname, "../../resources/config.json"));
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
const filePathInput = document.getElementById("filePathInput");
const folderPathBrowserBtn = document.getElementById('folderPathBrowserBtn');
const filePathBrowserBtn = document.getElementById("filePathBrowserBtn");
const outputInput = document.getElementById("outputInput");
const outputBrowserBtn = document.getElementById("outputBrowserBtn");

async function initialize() {
    await loadCache();
    filePathInput.value = cache["unpackPath"];
    outputInput.value = cache["output"];
    
    initListeners();
    initSubs();
}
//cache management functions
async function loadCache() {
    let res = fs.readFileSync(configPath);
    let jsonObj = await JSON.parse(res);
    let json = jsonObj["unpacker"];

    cache["unpackPath"] = json["unpackPath"];

    if (json["output"] == "") {
        const defaultPath = path.join(json["outputFolder"], 'unpacked');
        fs.mkdirSync(defaultPath);
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
        
            fs.writeFileSync(configPath, JSON.stringify(json), 'utf-8');
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
        } else {
            log(`That path is invalid, please input a valid path.`);
            outputInput.value = cache["output"];
        }
    });
    filePathInput.addEventListener("change", (e) => {
        if (fs.existsSync(filePathInput.value)) {
            updateCache("unpackPath", filePathInput.value);
        } else {
            log(`That path is invalid, please input a valid path.`);
            filePathInput.value = cache["unpackPath"];
        }
    });
}
//initializes main process subscriptions
function initSubs() {
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
            await handleFile(outputDir, patchElem);
        }
    } else {
        const patchElem = patchPath;
        await handleFile(outputDir, patchElem);
    }
}
async function handleFile(outputDir, patchFile) {
    const fileType = path.extname(patchFile);
    if (fileType === ".solidpkg") {
        await unpackSolidpkg(outputDir, patchFile);
    } else if (fileType === ".patchmanifest") {
        await unpackManifest(outputDir, patchFile);
    } else if (fileType.substr(0, 2) === ".z") {
        await unpackZip(outputDir, patchFile);
    }
}

async function unpackZip(outputDir, patchFile) {
    const fileName = patchFile.substr(patchFile.lastIndexOf("\\") + 1, patchFile.lastIndexOf("."));
    const solidPkgURL = getSolidPkgURLFromFileName(fileName);
    if (solidPkgURL) {

        const solidPkgName = `${fileName}.solidpkg`;
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
            solidPkgData = ssn.readSsnFile(res.buffer);
        } else {
            const res = await (await fetch(solidPkgURL)).arrayBuffer();
            solidPkgData = ssn.readSsnFile(res);
        }

        //extract the selected .zip/.zNUM file
        const zFile = fs.readFileSync(patchFile);
        const fileEntries = ssn.readSsnFile(zFile.buffer);

        await extractZFile(outputDir, patchFile, fileEntries, solidPkgData);
    }
}
async function extractZFile(outputDir, diskFile, fileEntries, solidpkgData) {
    console.log(solidpkgData);
    const tasks = [];
    for (let i = 0; i < fileEntries.length; i++) {
        const file = fileEntries[i];
        tasks.push(
            extractAdded.bind(outputDir, file, diskFile)
        );
    }
    console.log(tasks);
    await ssn.taskManager(tasks, 3);
}
async function extractAdded(targetDir, file, diskFile) {
    try {
        //create file write stream
        const outputName = path.join(targetDir, file.name);
        const outputNameTemp = path.join(targetDir, `${file.name}.tmp`);
  
        //start installation
        await ssn.launch(diskFile, file.offset, file.compressedSize, file.decryptionKeys, undefined, outputNameTemp);
  
        fs.rename(outputNameTemp, outputName, function(renameError) {
            if (renameError) {
                throw new Error(`Could not rename output file "${outputNameTemp}": ${renameError.message}`);
            }
        });
    } catch (error) {
        console.error(`Could not extract file "${file.name}"`, error);
        log(`Could not extract file "${file.name}"`);
    }
}
async function unpackManifest(outputDir, patchFile) {
    const patchFileName = patchFile.substr(patchFile.lastIndexOf("\\") + 1)
    const saveFilePath = path.join(outputDir, `${patchFileName}.json`);
    const ssnFile = fs.readFileSync(patchFile);

    const fileEntries = ssn.readSsnFile(ssnFile.buffer);

    //Verify .patchmanifest file
    if (fileEntries.length !== 1) {
        log(`Expected .patchmanifest to contain 1 file but it had "${fileEntries.length}" files.`);
        return null;
    }

    const firstFile = fileEntries[0];
    if (firstFile.name !== 'manifest.xml') {
        log(`Expected .patchmanifest to contain a file called manifest.xml but it is called "${firstFile.name}".`);
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

    fs.writeFileSync(saveFilePath, JSON.stringify(patchManifestSimple, null, 4));

    log(`Unpacking of ${patchFileName} complete!`);
}
async function unpackSolidpkg(outputDir, patchFile) {
    const patchFileName = patchFile.substr(patchFile.lastIndexOf("\\") + 1)
    const saveFilePath = path.join(outputDir, `${patchFileName}.json`);
    const ssnFile = fs.readFileSync(patchFile);

    const fileEntries = ssn.readSsnFile(ssnFile.buffer);

    if (fileEntries.length !== 1) {
        log(`Expected .solidpkg to contain 1 file but it had "${fileEntries.length}" files.`);
    }
    
    const firstFile = fileEntries[0];
    if (firstFile.name !== 'metafile.solid') {
        log(`Expected .solidpkg to contain a file called metafile.solid but it is called "${firstFile.name}".`);
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

    fs.writeFileSync(saveFilePath, JSON.stringify(jsonSolidpkg, null, 4));

    log(`Unpacking of ${patchFileName} complete!`);
}

//utility methods

//get solidpkg from file name
function getSolidPkgURLFromFileName(fileName) {
    const relivantSub = fileName.substr(0, fileName.lastIndexOf('_'));
    let url = "";

    if (relivantSub === "retailclient_swtor") {
        url = `http://cdn-patch.swtor.com/patch/swtor/retailclient_swtor/${fileName}.solidpkg`;
    } else if (relivantSub.contains("assets_swtor")) {
        url = `http://cdn-patch.swtor.com/patch/${relivantSub}/${fileName}.solidpkg`;
    } else if (relivantSub === "retailclient_publictest") {
        url = `http://cdn-patch.swtor.com/patch/publictest/retailclient_publictest/${fileName}.solidpkg`;
    } else if (relivantSub.contains("assets_swtor_test")) {
        url = `http://cdn-patch.swtor.com/patch/${relivantSub}/${fileName}.solidpkg`;
    } else if (relivantSub.contains("movies")) {
        url = `http://cdn-patch.swtor.com/patch/${relivantSub}/${fileName}.solidpkg`;
    } else if (relivantSub.contains('retailclient')) {
        const clientID = relivantSub.substr(relivantSub.lastIndexOf('_'));
        url = `http://cdn-patch.swtor.com/patch/${clientID}/${relivantSub}/${fileName}.solidpkg`;
    }

    //for the memes
    //const url = (relivantSub === "retailclient_swtor") ? `http://cdn-patch.swtor.com/patch/swtor/retailclient_swtor/${fileName}.solidpkg` : (relivantSub.contains("assets_swtor")) ? `http://cdn-patch.swtor.com/patch/${relivantSub}/${fileName}.solidpkg` : (relivantSub === "retailclient_publictest") ? `http://cdn-patch.swtor.com/patch/publictest/retailclient_publictest/${fileName}.solidpkg` : (relivantSub.contains("assets_swtor_test")) ? `http://cdn-patch.swtor.com/patch/${relivantSub}/${fileName}.solidpkg` : (relivantSub.contains("movies")) ? `http://cdn-patch.swtor.com/patch/${relivantSub}/${fileName}.solidpkg` : (relivantSub.contains('retailclient')) ? `http://cdn-patch.swtor.com/patch/${relivantSub.substr(relivantSub.lastIndexOf('_'))}/${relivantSub}/${fileName}.solidpkg` : null;

    return url;
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
                    //console.log(`Downloading ${percentage}% ${downloaded} bytes`);
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