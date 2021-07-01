import { resourcePath } from "../../../api/config/resource-path/ResourcePath.js";
import { getSetting } from "../../../api/config/settings/Settings.js";
import { log, updateAlertType } from "../../universal/Logger.js";
import { addTooltip, removeTooltip, updateTooltipEvent } from "../../universal/Tooltips.js";

let settingsJSON = getSetting();

const ssn = require('ssn');
const fs = require('fs');
const http = require('http');
const xml2js = require('xml2js');
const xmlJS = require('xml-js');
const parser = new xml2js.Parser({ attrkey: "attributes" });

const {ipcRenderer} = require('electron');
const path = require('path');

const configPath = path.normalize(path.join(resourcePath, "config.json"));
const changeEvent = new Event('change');
const patches = [];
const cache = {
    "devmode": null,
    "enviromentType": "", 
    "productType": "", 
    "varient": "", 
    "version": "",
    "output": ""
}

//action buttons
const downloadPatch = document.getElementById("downloadPatch");
const updatePatches = document.getElementById("updatePatches");
const downloadManifest = document.getElementById("downloadManifest");
const showDate = document.getElementById("showDate");
const downloadPkg = document.getElementById("downloadPkg");
const progressBar = document.getElementById("progressBar");

//settings inputs
const envTypeLabel = document.getElementById('envTypeLabel');
const enviromentType = document.getElementById("enviromentType");


const prodTypeLabel = document.getElementById('prodTypeLabel');
const productType = document.getElementById("productType");

const varientLabel = document.getElementById('varientLabel');
const varient = document.getElementById("varient");

const versionYLabel = document.getElementById('versionYLabel');
const versionInput = document.getElementById("versionInput");

const outputFolderLabel = document.getElementById('outputFolderLabel');
const output = document.getElementById("output");

const pathsBrowseBtn = document.getElementById("pathsBrowseBtn");

async function initialize() {
    await getPatches();
    await loadCache();
    enviromentType.options[0].innerHTML = cache["enviromentType"];
    enviromentType.nextElementSibling.innerHTML = enviromentType.options[0].innerHTML;
    enviromentType.nextElementSibling.nextElementSibling.querySelector('.same-as-selected').classList.toggle('same-as-selected');
    enviromentType.nextElementSibling.nextElementSibling.querySelector(`#${enviromentType.options[0].innerHTML}`).classList.toggle('same-as-selected');

    productType.options[0].innerHTML = cache["productType"];
    productType.nextElementSibling.innerHTML = productType.options[0].innerHTML;
    productType.nextElementSibling.nextElementSibling.querySelector('.same-as-selected').classList.toggle('same-as-selected');
    productType.nextElementSibling.nextElementSibling.querySelector(`#${productType.options[0].innerHTML}`).classList.toggle('same-as-selected');

    varient.options[0].innerHTML = cache["varient"];
    varient.nextElementSibling.innerHTML = varient.options[0].innerHTML;
    varient.nextElementSibling.nextElementSibling.querySelector('.same-as-selected').classList.toggle('same-as-selected');
    if (varient.options[0].innerHTML == '-1to0') {
        document.getElementById('-1to0').classList.toggle('same-as-selected');
    } else {
        varient.nextElementSibling.nextElementSibling.querySelector(`#${varient.options[0].innerHTML}`).classList.toggle('same-as-selected');
    }

    versionInput.value = cache["version"];
    output.value = cache["output"];

    if (settingsJSON.usePathTooltips) {
        addTooltip('top', output, true, (element) => { return element.value; });
    }

    if (settingsJSON.useLabelTooltips) {
        addTooltip('top', envTypeLabel, false, (element) => { return 'Patch enviroment type'; });
        addTooltip('top', prodTypeLabel, false, (element) => { return 'Patch product type'; });
        addTooltip('top', varientLabel, false, (element) => { return 'Patch varient type'; });
        addTooltip('top', versionYLabel, false, (element) => { return 'Version Y value'; });
        addTooltip('top', outputFolderLabel, false, (element) => { return 'Patch output folder'; });
    }
    
    initListeners();
    initSubs();

    checkFields();
}
async function getPatches() {
    const patchFilePath = path.normalize(path.join(resourcePath, "patches.xml"));
    const res = fs.readFileSync(patchFilePath);
    const xml = await parser.parseStringPromise(res);

    for (const patch of xml.patches.patch) {
        let p = {
            version: patch.attributes.version,
            date: patch.attributes.date,
            main: patch.attributes.assets_swtor_main,
            client: patch.attributes.retailclient_swtor,
            en_us: patch.attributes.assets_swtor_en_us,
            de_de: patch.attributes.assets_swtor_de_de,
            fr_fr: patch.attributes.assets_swtor_fr_fr
        }

        patches.push(p);
    }
}
//cache management functions
async function loadCache() {
    let res = fs.readFileSync(configPath);
    let jsonObj = await JSON.parse(res);
    let json = jsonObj["getPatch"];

    cache["devmode"] = json["devmode"];
    cache["enviromentType"] = json["enviromentType"];
    cache["productType"] = json["productType"];
    cache["varient"] = json["varient"];
    cache["version"] = json["version"];

    if (json["output"] == "") {
        const defaultPath = path.join(jsonObj["outputFolder"], 'patches');
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
    const shouldUpdate = (field == "output") ? fs.existsSync(val) : true; 
    if (shouldUpdate) {
        let res = fs.readFileSync(configPath);
        let json = JSON.parse(res);
        if (json["getPatch"][field] != val) {
            json["getPatch"][field] = val;
            cache[field] = val;
        
            fs.writeFileSync(configPath, JSON.stringify(json, null, '\t'), 'utf-8');
        }

        if (field == "output") {
            output.dispatchEvent(updateTooltipEvent);
        }
    } else {
        output.value = cache["output"];
    }
}
//init dom listeners
function initListeners() {
    enviromentType.clickCallback = (e) => {
        const elem = e.currentTarget;
        updateCache(enviromentType.id, elem.innerHTML);
    }
    productType.clickCallback = (e) => {
        const elem = e.currentTarget;
        updateCache(productType.id, elem.innerHTML);
    }
    varient.clickCallback = (e) => {
        const elem = e.currentTarget;
        updateCache(varient.id, elem.innerHTML);
    }
    pathsBrowseBtn.addEventListener("click", (e) => {
        ipcRenderer.send("showDialogPatch")
    });
    downloadPatch.addEventListener("click", (e) => {
        dlFiles();
    });
    updatePatches.addEventListener("click", (e) => {
        checkForUpdates();
    });
    downloadManifest.addEventListener("click", (e) => {
        dlMan();
    });
    downloadPkg.addEventListener("click", (e) => {
        dlSolid();
    });
    showDate.addEventListener("click", (e) => {
        checkDate();
    });

    //listener for version input and output fields
    output.addEventListener("change", (e) => {
        if (fs.existsSync(output.value)) {
            updateCache("output", output.value);
        } else {
            log(`That path is invalid, please input a valid path.`, 'alert');
            output.value = cache["output"];
        }
    });
    versionInput.addEventListener("change", (e) => {
        updateCache("version", versionInput.value);
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
                    case "usePathTooltips":
                        if (settingsJSON.usePathTooltips) {
                            addTooltip('top', output, true, (element) => { return element.value; });
                        } else {
                            removeTooltip(output, true, (element) => { return element.value; });
                        }
                        break;
                    case "useLabelTooltips":
                        if (settingsJSON.useLabelTooltips) {
                            addTooltip('top', envTypeLabel, false, (element) => { return 'Patch enviroment type'; });
                            addTooltip('top', prodTypeLabel, false, (element) => { return 'Patch product type'; });
                            addTooltip('top', varientLabel, false, (element) => { return 'Patch varient type'; });
                            addTooltip('top', versionYLabel, false, (element) => { return 'Version Y value'; });
                            addTooltip('top', outputFolderLabel, false, (element) => { return 'Patch output folder'; });
                        } else {
                            removeTooltip(envTypeLabel, false, (element) => { return 'Patch enviroment type'; });
                            removeTooltip(prodTypeLabel, false, (element) => { return 'Patch product type'; });
                            removeTooltip(varientLabel, false, (element) => { return 'Patch varient type'; });
                            removeTooltip(versionYLabel, false, (element) => { return 'Version Y value'; });
                            removeTooltip(outputFolderLabel, false, (element) => { return 'Patch output folder'; });
                        }
                        break;
                }
            }
        }
    });
    ipcRenderer.on("getDialogResponsePatch", (event, data) => {
        output.value = data[0];
        output.dispatchEvent(changeEvent);
    });
}
//this checks field values and if certain cases are met, then it will hide certain other inputs
function checkFields() {
    //check if fields need to be adjusted based on value of devmode. if a removed field is selected, revert to default. also check inverse
    let betatest = document.getElementById("betatest");
    if (!cache["devmode"] && !(betatest.style.display == "none")) {
        let liveqatest = document.getElementById("liveqatest");
        let liveeptest = document.getElementById("liveeptest");
        let cstraining = document.getElementById("cstraining");

        betatest.style.display = "none";
        liveqatest.style.display = "none";
        liveeptest.style.display = "none";
        cstraining.style.display = "none";

        if (betatest.classList.contains("same-as-selected") || liveqatest.classList.contains("same-as-selected") || liveeptest.classList.contains("same-as-selected") || cstraining.classList.contains("same-as-selected")) {
            document.getElementById("live").click();
        }

    } else if (cache["devmode"] && (betatest.style.display == "none")) {
        let liveqatest = document.getElementById("liveqatest");
        let liveeptest = document.getElementById("liveeptest");
        let cstraining = document.getElementById("cstraining");

        betatest.style.display = "";
        liveqatest.style.display = "";
        liveeptest.style.display = "";
        cstraining.style.display = "";
    }

    //if movies gets selected, then disable main and client. also check inverse
    let main = document.getElementById("main");
    if ((cache["enviromentType"] == "movies") && !(main.style.display == "none")) {
        let client = document.getElementById("client");

        main.style.display = "none";
        client.style.display = "none";

        if (main.classList.contains("same-as-selected") || client.classList.contains("same-as-selected")) {
            document.getElementById("en_us").click();
        }
    } else if (!(cache["enviromentType"] == "movies") && (main.style.display == "none")) {
        let client = document.getElementById("client");

        main.style.display = "";
        client.style.display = "";
    }

    //if movies gets selected, then disable main and client. also check inverse
    let dropdownSelected = productType.nextElementSibling;
    if ((cache["enviromentType"] != "live" && cache["enviromentType"] != "pts" && cache["enviromentType"] != "movies") && !(dropdownSelected.classList.contains("disabled"))) {
        dropdownSelected.classList.add("disabled");
        let client = document.getElementById("client");

        if (!client.classList.contains("same-as-selected")) {
            document.getElementById("client").click();
        }
    } else if ((cache["enviromentType"] == "live" || cache["enviromentType"] == "pts" || cache["enviromentType"] == "movies") && dropdownSelected.classList.contains("disabled")) {
        dropdownSelected.classList.remove("disabled");
    }

    //if varient == -1to0 then disable version input
    if ((cache["varient"] == "-1to0") && !(versionInput.classList.contains("disabled"))) {
        versionInput.value = "0";
        versionInput.classList.add("disabled");
    } else if (!(cache["varient"] == "-1to0") && (versionInput.classList.contains("disabled"))) {
        versionInput.value = cache["version"];
        versionInput.classList.remove("disabled");
    }
}

//download functions
function dlFiles() {
    let vTo = cache["version"];
    if (vTo.indexOf(".") != -1 && varient == "XtoY") {
        const patch = findByLiveVersion(vTo);
        const patchID = parseInt(patch[cache["productType"]]);
        const lastVersion = patchID - 1;

        if (cache["enviromentType"] === "live") {
            let xyStr = (cache["varient"] == "0toY") ? `0to${patchID}` : `${lastVersion}to${patchID}`;
            download_files(patchID, xyStr, cache["enviromentType"], cache["productType"]);
        } else {
            log("Version numbers are live enviroment only. Please use version ID", 'alert');
        }
    } else {
        const patchID = cache["version"];
        const lastVersion = patchID - 1;
        let xyStr = (cache["varient"] == "-1to0") ? `-1to0` : (cache["varient"] == "0toY") ? `0to${patchID}` : `${lastVersion}to${patchID}`;

        if (cache["enviromentType"] === "live") {
            download_files(patchID, xyStr, cache["enviromentType"], cache["productType"]);
        } else if (cache["enviromentType"] === "pts") {
            download_files_pts(patchID, xyStr, cache["enviromentType"], cache["productType"]);
        } else if (cache["enviromentType"] === "movies") {
            download_movies(patchID, xyStr, cache["enviromentType"], cache["productType"]);
        } else if ((cache["enviromentType"] === "liveqatest") || (cache["enviromentType"] === "liveeptest") || (cache["enviromentType"] === "betatest") || (cache["enviromentType"] === "cstraining")) {
            download_exp_client(patchID, xyStr, cache["enviromentType"], cache["productType"]);
        }
    }
}
function dlMan() {
    if (cache["enviromentType"] === "live") {
        download_manifest(cache["enviromentType"], cache["productType"]);
    } else if (cache["enviromentType"] === "pts") {
        download_manifest_pts(cache["enviromentType"], cache["productType"]);
    } else if (cache["enviromentType"] === "movies") {
        download_manifest_movies(cache["enviromentType"], cache["productType"]);
    } else if ((cache["enviromentType"] === "liveqatest") || (cache["enviromentType"] === "liveeptest") || (cache["enviromentType"] === "betatest") || (cache["enviromentType"] === "cstraining")) {
        download_manifest_exp_client(cache["enviromentType"], cache["productType"]);
    }
}
function dlSolid() {
    let vTo = cache["version"];
    if (vTo.indexOf(".") != -1) {
        const patch = findByLiveVersion(vTo);
        const patchID = parseInt(patch[cache["productType"]]);
        const lastVersion = patchID - 1;

        if (cache["enviromentType"] === "live") {
            let xyStr = (cache["varient"] == "0toY") ? `0to${patchID}` : `${lastVersion}to${patchID}`;
            download_solidpkg(patchID, xyStr, cache["enviromentType"], cache["productType"]);
        } else {
            log("Version numbers are live enviroment only. Please use version ID", 'alert');
        }
    } else {
        const patchID = cache["version"];
        const lastVersion = patchID - 1;
        let xyStr = (cache["varient"] == "-1to0") ? `-1to0` : (cache["varient"] == "0toY") ? `0to${patchID}` : `${lastVersion}to${patchID}`;

        if (cache["enviromentType"] === "live") {
            download_solidpkg(patchID, xyStr, cache["enviromentType"], cache["productType"]);
        } else if (cache["enviromentType"] === "pts") {
            download_solidpkg_pts(patchID, xyStr, cache["enviromentType"], cache["productType"]);
        } else if (cache["enviromentType"] === "movies") {
            download_solidpkg_movies(patchID, xyStr, cache["enviromentType"], cache["productType"]);
        } else if ((cache["enviromentType"] === "liveqatest") || (cache["enviromentType"] === "liveeptest") || (cache["enviromentType"] === "betatest") || (cache["enviromentType"] === "cstraining")) {
            download_solidpkg_exp_client(patchID, xyStr, cache["enviromentType"], cache["productType"]);
        }
    }
}
function checkDate() {
    let vTo = cache["version"];
    if (vTo.indexOf(".") != -1) {
        const patch = findByLiveVersion(vTo);
        const patchID = parseInt(patch[cache["productType"]]);
        const lastVersion = patchID - 1;

        if (cache["enviromentType"] === "live") {
            let xyStr = (cache["varient"] == "0toY") ? `0to${patchID}` : `${lastVersion}to${patchID}`;
            checkDate_files(patchID, xyStr, cache["enviromentType"], cache["productType"]);
        } else {
            log("Version numbers are live enviroment only. Please use version ID", 'alert');
        }
    } else {
        const patchID = cache["version"];
        const lastVersion = patchID - 1;
        let xyStr = (cache["varient"] == "-1to0") ? `-1to0` : (cache["varient"] == "0toY") ? `0to${patchID}` : `${lastVersion}to${patchID}`;

        if (cache["enviromentType"] === "live") {
            checkDate_files(patchID, xyStr, cache["enviromentType"], cache["productType"]);
        } else if (cache["enviromentType"] === "pts") {
            checkDate_files_pts(patchID, xyStr, cache["enviromentType"], cache["productType"]);
        } else if (cache["enviromentType"] === "movies") {
            checkDate_movies(patchID, xyStr, cache["enviromentType"], cache["productType"]);
        } else if ((cache["enviromentType"] === "liveqatest") || (cache["enviromentType"] === "liveeptest") || (cache["enviromentType"] === "betatest") || (cache["enviromentType"] === "cstraining")) {
            checkDate_exp_client(patchID, xyStr, cache["enviromentType"], cache["productType"]);
        }
    }
}
async function checkForUpdates() {
    log(`this function currently does not work.`, 'alert');
    // const products = {
    //     'live': {
    //         'client': 'retailclient_swtor',
    //         'main': 'assets_swtor_main',
    //         'en_us': 'assets_swtor_en_us',
    //         'de_de': 'assets_swtor_de_de',
    //         'fr_fr': 'assets_swtor_fr_fr'
    //     },
    //     'pts': {
    //         'client': 'retailclient_publictest',
    //         'main': 'assets_swtor_test_main',
    //         'en_us': 'assets_swtor_test_en_us',
    //         'de_de': 'assets_swtor_test_de_de',
    //         'fr_fr': 'assets_swtor_test_fr_fr'
    //     },
    //     'movies': {
    //         'en_us': 'movies_en_us',
    //         'de_de': 'movies_de_de',
    //         'fr_fr': 'movies_fr_fr'
    //     }
    // };
    // function genURL(prod) {
    //     return `http://manifest.swtor.com/patch/${prod}.patchmanifest`;
    // }
    // function genURL2(prod, xyStr) {
    //     return `http://cdn-patch.swtor.com/patch/swtor/${prod}/${prod}_${xyStr}/${prod}_${xyStr}.zip`;
    // }
    // const newPatches = [];

    // //get SSN Lib product equvilent
    // let product = products['live']['client'];
    // //fetch manifest
    // const res = await fetch(genURL(product));
    // //read but dont download
    // const fileData = await res.arrayBuffer();
    // //process manifest
    // const jsonManifest = await processManifest(fileData, product);
    // console.log(jsonManifest);

    // //code to get version and date
    // const res2 = await fetch(genURL2(product, `${parseInt(jsonManifest.current) - 1}to${jsonManifest.current}`));
    // const fileData2 = await res2.arrayBuffer();
    // const versionData = await getRelease(fileData2, product);
}
async function processManifest(ssnFile, product) {
    //Parse .patchmanifest file
    const fileEntries = ssn.readSsnFile(ssnFile);

    //Verify .patchmanifest file
    if (fileEntries.length !== 1) {
        log(`Expected .patchmanifest to contain 1 file but it had "${fileEntries.length}" files.`, 'alert');
        return "error";
    }

    const firstFile = fileEntries[0];
    if (firstFile.name !== 'manifest.xml') {
        log(`Expected .patchmanifest to contain a file called manifest.xml but it is called "${firstFile.name}".`, 'alert');
        return "error";
    }

    const stream = ssn.arrayBufferToStream(ssnFile, firstFile.offset);

    //Extract manifest.xml file
    await ssn.readLocalFileHeader(stream, true);
    const patchmanifestStream = await ssn.extractFileAsStream(firstFile, stream);

    //Convert ArrayBuffer to string
    const patchmanifestXml = await ssn.streamToString(patchmanifestStream);

    //convert XML to JSON-converted XML
    const patchManifestJson = xmlJS.xml2js(patchmanifestXml);

    //verify that XML file contains all required elements and attributes
    ssn.verifyPatchmanifest(patchManifestJson, product);

    //convert JSON-converted XML to an easier to read JSON
    const patchManifestSimple = ssn.parsePatchmanifest(patchManifestJson);
    return patchManifestSimple;
}
async function getRelease(ssnFile, product) {
    const entries = ssn.readSsnFile(ssnFile);
    console.log(entries);

    return "";
}

async function download_files(to, xyStr, envType, prodType) {
    const saveLoc = cache["output"];
    if (prodType == "client") {
        const fileName = `${saveLoc}/retailclient_swtor_${xyStr}.zip`;
        log(`Download of ${envType} ${prodType} version ${xyStr} started! (${to})`, 'info');

        if (!fs.existsSync(fileName)) {
            const url = `http://cdn-patch.swtor.com/patch/swtor/retailclient_swtor/retailclient_swtor_${xyStr}/retailclient_swtor_${xyStr}.zip`;

            const dl_status = await getRemoteFile(fileName, url).then(async (res) => {
                if (res == "done") {
                    log(`Dowloaded: ${url}.`, 'info');

                    let zpv = 0;
                    while (true) {
                        zpv = parseInt(zpv) + 1;
                        if (zpv < 10) zpv = "0" + zpv;
                        
                        const fileName2 = `${saveLoc}/retailclient_swtor_${xyStr}.z${zpv}`;
                        
                        if (!fs.existsSync(fileName2)) {
                            const url2 = `http://cdn-patch.swtor.com/patch/swtor/retailclient_swtor/retailclient_swtor_${xyStr}/retailclient_swtor_${xyStr}.z${zpv}`;

                            const dl_status2 = await getRemoteFile(fileName2, url2);

                            if (dl_status2 == "done") {
                                log(`Dowloaded: ${url2}.`, 'info');
                            } else {
                                log(`Download finished.`, 'info');
                                break;
                            }
                        }
                    }
                }
            }).catch((err) => {
                console.log(err);
            });
        } else {
            log(`You already downloaded this zip. To download again delete the existing version.`, 'alert');
        }
    } else {
        const fileName = `${saveLoc}/assets_swtor_${prodType}_${xyStr}.zip`;
        log(`Download of ${envType} ${prodType} version ${xyStr} started! (${to})`, 'info');

        if (!fs.existsSync(fileName)) {
            const url = `http://cdn-patch.swtor.com/patch/assets_swtor_${prodType}/assets_swtor_${prodType}_${xyStr}/assets_swtor_${prodType}_${xyStr}.zip`;

            const dl_status = await getRemoteFile(fileName, url).then(async (res) => {
                if (res == "done") {
                    log(`Dowloaded: ${url}.`, 'info');

                    let zpv = 0;
                    while (true) {
                        zpv = parseInt(zpv) + 1;
                        if (zpv < 10) zpv = "0" + zpv;
                        
                        const fileName2 = `${saveLoc}/assets_swtor_${prodType}_${xyStr}.z${zpv}`;
                        
                        if (!fs.existsSync(fileName2)) {
                            const url2 = `http://cdn-patch.swtor.com/patch/assets_swtor_${prodType}/assets_swtor_${prodType}_${xyStr}/assets_swtor_${prodType}_${xyStr}.z${zpv}`;

                            const dl_status2 = await getRemoteFile(fileName2, url2);

                            if (dl_status2 == "done") {
                                log(`Dowloaded: ${url2}.`, 'info');
                            } else {
                                log(`Download complete.`, 'info');
                                break;
                            }
                        }
                    }
                }
            }).catch((err) => {
                console.log(err);
            });
        } else {
            log(`You already downloaded this zip. To download again delete the existing version.`, 'alert');
        }
    }
}
async function download_files_pts(to, xyStr, envType, prodType) {
    const saveLoc = cache["output"];
    if (prodType == "client") {
        const fileName = `${saveLoc}/retailclient_publictest_${xyStr}.zip`;
        log(`Download of ${envType} ${prodType} version ${xyStr} started! (${to})`, 'info');

        if (!fs.existsSync(fileName)) {
            const url = `http://cdn-patch.swtor.com/patch/publictest/retailclient_publictest/retailclient_publictest_${xyStr}/retailclient_publictest_${xyStr}.zip`;

            const dl_status = getRemoteFile(fileName, url).then(async (res) => {
                if (res == "done") {
                    log(`Dowloaded: ${url}.`, 'info');

                    let zpv = 0;
                    while (true) {
                        zpv = parseInt(zpv) + 1;
                        if (zpv < 10) zpv = "0" + zpv;
                        
                        const fileName2 = `${saveLoc}/retailclient_publictest_${xyStr}.z${zpv}`;
                        
                        if (!fs.existsSync(fileName2)) {
                            const url2 = `http://cdn-patch.swtor.com/patch/publictest/retailclient_publictest/retailclient_publictest_${xyStr}/retailclient_publictest_${xyStr}.z${zpv}`;

                            const dl_status2 = await getRemoteFile(fileName2, url2);

                            if (dl_status2 == "done") {
                                log(`Dowloaded: ${url2}.`, 'info');
                            } else {
                                log(`Download complete.`, 'info');
                                break;
                            }
                        }
                    }
                }
            }).catch((err) => {
                console.log(err);
            });
        } else {
            log(`You already downloaded this zip. To download again delete the existing version.`, 'alert');
        }
    } else {
        const fileName = `${saveLoc}/assets_swtor_test_${prodType}_${xyStr}.zip`;
        log(`Download of ${envType} ${prodType} version ${xyStr} started! (${to})`, 'info');

        if (!fs.existsSync(fileName)) {
            const url = `http://cdn-patch.swtor.com/patch/assets_swtor_test_${prodType}/assets_swtor_test_${prodType}_${xyStr}/assets_swtor_test_${prodType}_${xyStr}.zip`;

            const dl_status = await getRemoteFile(fileName, url).then(async (res) => {
                if (res == "done") {
                    log(`Dowloaded: ${url}.`, 'info');

                    let zpv = 0;
                    while (true) {
                        zpv = parseInt(zpv) + 1;
                        if (zpv < 10) zpv = "0" + zpv;
                        
                        const fileName2 = `${saveLoc}/assets_swtor_test_${prodType}_${xyStr}.z${zpv}`;
                        
                        if (!fs.existsSync(fileName2)) {
                            const url2 = `http://cdn-patch.swtor.com/patch/assets_swtor_test_${prodType}/assets_swtor_test_${prodType}_${xyStr}/assets_swtor_test_${prodType}_${xyStr}.z${zpv}`;

                            const dl_status2 = getRemoteFile(fileName2, url2);

                            if (dl_status2 == "done") {
                                log(`Dowloaded: ${url2}.`, 'info');
                            } else {
                                log(`Download complete.`, 'info');
                                break;
                            }
                        }
                    }
                }
            }).catch((err) => {
                console.log(err);
            });
        } else {
            log(`You already downloaded this zip. To download again delete the existing version.`, 'alert');
        }
    }
}
async function download_movies(to, xyStr, envType, prodType) {
    const saveLoc = cache["output"];

    const fileName = `${saveLoc}/movies_${prodType}_${xyStr}.zip`;
    log(`Download of ${envType} ${prodType} version ${xyStr} started! (${to})`, 'info');

    if (!fs.existsSync(fileName)) {
        const url = `http://cdn-patch.swtor.com/patch/movies_${prodType}/movies_${prodType}_${xyStr}/movies_${prodType}_${xyStr}.zip`;

        const dl_status = await getRemoteFile(fileName, url).then(async (res) => {
            if (res == "done") {
                log(`Dowloaded: ${url}.`, 'info');

                let zpv = 0;
                while (true) {
                    zpv = parseInt(zpv) + 1;
                    if (zpv < 10) zpv = "0" + zpv;
                    
                    const fileName2 = `${saveLoc}/movies_${prodType}_${xyStr}.z${zpv}`;
                    
                    if (!fs.existsSync(fileName2)) {
                        const url2 = `http://cdn-patch.swtor.com/patch/movies_${prodType}/movies_${prodType}_${xyStr}/movies_${prodType}_${xyStr}.z${zpv}`;

                        const dl_status2 = await getRemoteFile(fileName2, url2);

                        if (dl_status2 == "done") {
                            log(`Dowloaded: ${url2}.`, 'info');
                        } else {
                            log(`Download complete.`, 'info');
                            break;
                        }
                    }
                }
            }
        }).catch((err) => {
            console.log(err);
        });
    } else {
        log(`You already downloaded this zip. To download again delete the existing version.`, 'alert');
    }
}
async function download_exp_client(to, xyStr, envType, prodType) {
    const saveLoc = cache["output"];
    const clientID = envType;

    const fileName = `${saveLoc}/retailclient_${clientID}_${xyStr}.zip`;
    log(`Download of ${envType} version ${xyStr} started! (${to})`);

    if (!fs.existsSync(fileName)) {
        const url = `http://cdn-patch.swtor.com/patch/${clientID}/retailclient_${clientID}/retailclient_${clientID}_${xyStr}/retailclient_${clientID}_${xyStr}.zip`;

        const dl_status = await getRemoteFile(fileName, url).then(async (res) => {
            if (res == "done") {
                log(`Dowloaded: ${url}.`, 'info');

                let zpv = 0;
                while (true) {
                    zpv = parseInt(zpv) + 1;
                    if (zpv < 10) zpv = "0" + zpv;
                    
                    const fileName2 = `${saveLoc}/retailclient_${clientID}_${xyStr}.z${zpv}`;
                    
                    if (!fs.existsSync(fileName2)) {
                        const url2 = `http://cdn-patch.swtor.com/patch/${clientID}/retailclient_${clientID}/retailclient_${clientID}_${xyStr}/retailclient_${clientID}_${xyStr}.z${zpv}`;

                        const dl_status2 = getRemoteFile(fileName2, url2);

                        if (dl_status2 == "done") {
                            log(`Dowloaded: ${url2}.`, 'info');
                        } else {
                            log(`Download complete.`, 'info');
                            break;
                        }
                    }
                }
            }
        }).catch((err) => {
            console.log(err);
        });
    } else {
        log(`You already downloaded this zip. To download again delete the existing version.`, 'alert');
    }
}

async function download_manifest(envType, prodType) {
    const saveLoc = cache["output"];
    if (prodType == "client") {
        const fileName = `${saveLoc}/retailclient_swtor.patchmanifest`;
        log(`Download of Manifest ${envType} ${prodType} started!`, 'info');

        if (!fs.existsSync(fileName)) {
            const url = `http://manifest.swtor.com/patch/retailclient_swtor.patchmanifest`;

            const dl_status = await getRemoteFile(fileName, url).then((res) => {
                if (res == "done") {
                    log(`Dowloaded: ${url}.`, 'info');
                    log(`Download complete.`, 'info');
                }
            }).catch((err) => {
                console.log(err);
            });
        } else {
            log(`You already downloaded this zip. To download again delete the existing version.`, 'alert');
        }
    } else {
        const fileName = `${saveLoc}/assets_swtor_${prodType}.patchmanifest`;
        log(`Download of Manifest ${envType} ${prodType} started!`, 'info');

        if (!fs.existsSync(fileName)) {
            const url = `http://manifest.swtor.com/patch/assets_swtor_${prodType}.patchmanifest`;

            const dl_status = await getRemoteFile(fileName, url).then((res) => {
                if (res == "done") {
                    log(`Dowloaded: ${url}.`, 'info');
                    log(`Download complete`, 'info');
                }
            }).catch((err) => {
                console.log(err);
            });
        } else {
            log(`You already downloaded this zip. To download again delete the existing version.`, 'alert');
        }
    }
}
async function download_manifest_pts(envType, prodType) {
    const saveLoc = cache["output"];
    if (prodType == "client") {
        const fileName = `${saveLoc}/retailclient_publictest.patchmanifest`;
        log(`Download of Manifest ${envType} ${prodType} started!`, 'info');

        if (!fs.existsSync(fileName)) {
            const url = `http://manifest.swtor.com/patch/retailclient_publictest.patchmanifest`;

            const dl_status = await getRemoteFile(fileName, url).then((res) => {
                if (res == "done") {
                    log(`Dowloaded: ${url}.`, 'info');
                    log(`Download complete`, 'info');
                }
            }).catch((err) => {
                console.log(err);
            });
        } else {
            log(`You already downloaded this zip. To download again delete the existing version.`, 'alert');
        }
    } else {
        const fileName = `${saveLoc}/assets_swtor_test_${prodType}.patchmanifest`;
        log(`Download of Manifest ${envType} ${prodType} started!`, 'info');

        if (!fs.existsSync(fileName)) {
            const url = `http://manifest.swtor.com/patch/assets_swtor_test_${prodType}.patchmanifest`;

            const dl_status = await getRemoteFile(fileName, url).then((res) => {
                if (res == "done") {
                    log(`Dowloaded: ${url}.`, 'info');
                    log(`Download complete`, 'info');
                }
            }).catch((err) => {
                console.log(err);
            });
        } else {
            log(`You already downloaded this zip. To download again delete the existing version.`, 'alert');
        }
    }
}
async function download_manifest_movies(envType, prodType) {
    const saveLoc = cache["output"];

    const fileName = `${saveLoc}/movies_${prodType}.patchmanifest`;
    log(`Download of Manifest ${envType} ${prodType} started!`, 'info');

    if (!fs.existsSync(fileName)) {
        const url = `http://manifest.swtor.com/patch/movies_${prodType}.patchmanifest`;

        const dl_status = await getRemoteFile(fileName, url).then((res) => {
            if (res == "done") {
                log(`Dowloaded: ${url}.`, 'info');
                log(`Download complete`, 'info');
            }
        }).catch((err) => {
            console.log(err);
        });
    } else {
        log(`You already downloaded this manifest. To download again delete the existing version.`);
    }
}
async function download_manifest_exp_client(envType, prodType) {
    const saveLoc = cache["output"];
    const clientID = envType;

    const fileName = `${saveLoc}/retailclient_${clientID}.patchmanifest`;
    log(`Download of Manifest ${envType} ${prodType} started!`, 'info');

    if (!fs.existsSync(fileName)) {
        const url = `http://manifest.swtor.com/patch/retailclient_${clientID}.patchmanifest`;

        const dl_status = await getRemoteFile(fileName, url).then((res) => {
            if (res == "done") {
                log(`Dowloaded: ${url}.`, 'info');
                log(`Download complete`, 'info');
            }
        }).catch((err) => {
            console.log(err);
        });
    } else {
        log(`You already downloaded this manifest. To download again delete the existing version.`);
    }
}

async function download_solidpkg(to, xyStr, envType, prodType) {
    const saveLoc = cache["output"];
    if (prodType == "client") {
        const fileName = `${saveLoc}/retailclient_swtor_${xyStr}.solidpkg`;
        log(`Download of Solidpkg ${envType} ${prodType} started!`, 'info');

        if (!fs.existsSync(fileName)) {
            const url = `http://cdn-patch.swtor.com/patch/swtor/retailclient_swtor/retailclient_swtor_${xyStr}.solidpkg`;

            const dl_status = await getRemoteFile(fileName, url).then((res) => {
                if (res == "done") {
                    log(`Dowloaded: ${url}.`, 'info');
                    log(`Download complete`, 'info');
                }
            }).catch((err) => {
                console.log(err);
            });
        } else {
            log(`You already downloaded this zip. To download again delete the existing version.`, 'alert');
        }
    } else {
        const fileName = `${saveLoc}/assets_swtor_${prodType}_${xyStr}.solidpkg`;
        log(`Download of Solidpkg ${envType} ${prodType} started!`, 'info');

        if (!fs.existsSync(fileName)) {
            const url = `http://cdn-patch.swtor.com/patch/assets_swtor_${prodType}/assets_swtor_${prodType}_${xyStr}.solidpkg`;

            const dl_status = await getRemoteFile(fileName, url).then((res) => {
                if (res == "done") {
                    log(`Dowloaded: ${url}.`, 'info');
                    log(`Download complete`, 'info');
                }
            }).catch((err) => {
                console.log(err);
            });
        } else {
            log(`You already downloaded this zip. To download again delete the existing version.`, 'alert');
        }
    }
}
async function download_solidpkg_pts(to, xyStr, envType, prodType) {
    const saveLoc = cache["output"];
    if (prodType == "client") {
        const fileName = `${saveLoc}/retailclient_publictest_${xyStr}.solidpkg`;
        log(`Download of Solidpkg ${envType} ${prodType} started!`, 'info');

        if (!fs.existsSync(fileName)) {
            const url = `http://cdn-patch.swtor.com/patch/publictest/retailclient_publictest/retailclient_publictest_${xyStr}.solidpkg`;

            const dl_status = await getRemoteFile(fileName, url).then((res) => {
                if (res == "done") {
                    log(`Dowloaded: ${url}.`, 'info');
                    log(`Download complete`, 'info');
                }
            }).catch((err) => {
                console.log(err);
            });
        } else {
            log(`You already downloaded this zip. To download again delete the existing version.`, 'alert');
        }
    } else {
        const fileName = `${saveLoc}/assets_swtor_test_${prodType}_${xyStr}.solidpkg`;
        log(`Download of Solidpkg ${envType} ${prodType} started!`, 'info');

        if (!fs.existsSync(fileName)) {
            const url = `http://cdn-patch.swtor.com/patch/assets_swtor_test_${prodType}/assets_swtor_test_${prodType}_${xyStr}.solidpkg`;

            const dl_status = await getRemoteFile(fileName, url).then((res) => {
                if (res == "done") {
                    log(`Dowloaded: ${url}.`, 'info');
                    log(`Download complete`, 'info');
                }
            }).catch((err) => {
                console.log(err);
            });
        } else {
            log(`You already downloaded this zip. To download again delete the existing version.`, 'alert');
        }
    }
}
async function download_solidpkg_movies(to, xyStr, envType, prodType) {
    const saveLoc = cache["output"];

    const fileName = `${saveLoc}/movies_${prodType}_${xyStr}.solidpkg`;
    log(`Download of Solidpkg ${envType} ${prodType} started!`, 'info');

    if (!fs.existsSync(fileName)) {
        const url = `http://cdn-patch.swtor.com/patch/movies_${prodType}/movies_${prodType}_${xyStr}.solidpkg`;

        const dl_status = await getRemoteFile(fileName, url).then((res) => {
            if (res == "done") {
                log(`Dowloaded: ${url}.`, 'info');
                log(`Download complete`, 'info');
            }
        }).catch((err) => {
            console.log(err);
        });
    } else {
        log(`You already downloaded this manifest. To download again delete the existing version.`);
    }
}
async function download_solidpkg_exp_client(to, xyStr, envType, prodType) {
    const saveLoc = cache["output"];
    const clientID = envType;

    const fileName = `${saveLoc}/retailclient_${clientID}_${xyStr}.solidpkg`;
    log(`Download of Solidpkg ${envType} ${prodType} started!`, 'info');

    if (!fs.existsSync(fileName)) {
        const url = `http://cdn-patch.swtor.com/patch/${clientID}/retailclient_${clientID}/retailclient_${clientID}_${xyStr}.solidpkg`;

        const dl_status = await getRemoteFile(fileName, url).then((res) => {
            if (res == "done") {
                log(`Dowloaded: ${url}.`, 'info');
                log(`Download complete`, 'info');
            }
        }).catch((err) => {
            console.log(err);
        });
    } else {
        log(`You already downloaded this manifest. To download again delete the existing version.`);
    }
}

async function checkDate_files(to, xyStr, envType, prodType) {
    if (prodType == "client") {
        const solidPkgURL = `http://cdn-patch.swtor.com/patch/swtor/retailclient_swtor/retailclient_swtor_${xyStr}.solidpkg`;
        const solidPkgFile = await (await fetch(solidPkgURL)).arrayBuffer();
        const solidPkgSsn = ssn.readSsnFile(solidPkgFile);
        const solidPkg = await getSolidPkg(solidPkgFile, solidPkgSsn);
        
        const date = solidPkg.created;
        log(`Released on: ${date}`, 'info');
    } else {
        const solidPkgURL = `http://cdn-patch.swtor.com/patch/swtor/assets_swtor_${prodType}/assets_swtor_${prodType}_${xyStr}.solidpkg`;
        const solidPkgFile = await (await fetch(solidPkgURL)).arrayBuffer();
        const solidPkgSsn = ssn.readSsnFile(solidPkgFile);
        const solidPkg = await getSolidPkg(solidPkgFile, solidPkgSsn);
        
        const date = solidPkg.created;
        log(`Released on: ${date}`, 'info');
    }
}
async function checkDate_files_pts(to, xyStr, envType, prodType) {
    if (prodType == "client") {
        const solidPkgURL = `http://cdn-patch.swtor.com/patch/publictest/retailclient_publictest/retailclient_publictest_${xyStr}.solidpkg`;
        const solidPkgFile = await (await fetch(solidPkgURL)).arrayBuffer();
        const solidPkgSsn = ssn.readSsnFile(solidPkgFile);
        const solidPkg = await getSolidPkg(solidPkgFile, solidPkgSsn);
        
        const date = solidPkg.created;
        log(`Released on: ${date}`, 'info');
    } else {
        const solidPkgURL = `http://cdn-patch.swtor.com/patch/assets_swtor_test_${prodType}/assets_swtor_test_${prodType}_${xyStr}.solidpkg`;
        const solidPkgFile = await (await fetch(solidPkgURL)).arrayBuffer();
        const solidPkgSsn = ssn.readSsnFile(solidPkgFile);
        const solidPkg = await getSolidPkg(solidPkgFile, solidPkgSsn);
        
        const date = solidPkg.created;
        log(`Released on: ${date}`, 'info');
    }
}
async function checkDate_movies(to, xyStr, envType, prodType) {
    const solidPkgURL = `http://cdn-patch.swtor.com/patch/movies_${prodType}/movies_${prodType}_${xyStr}.solidpkg`;
    const solidPkgFile = await (await fetch(solidPkgURL)).arrayBuffer();
    const solidPkgSsn = ssn.readSsnFile(solidPkgFile);
    const solidPkg = await getSolidPkg(solidPkgFile, solidPkgSsn);
    
    const date = solidPkg.created;
    log(`Released on: ${date}`, 'info');
}
async function checkDate_exp_client(to, xyStr, envType, prodType) {
    const clientID = envType;
    const solidPkgURL = `http://cdn-patch.swtor.com/patch/${clientID}/retailclient_${clientID}/retailclient_${clientID}_${xyStr}.solidpkg`;
    const solidPkgFile = await (await fetch(solidPkgURL)).arrayBuffer();
    const solidPkgSsn = ssn.readSsnFile(solidPkgFile);
    const solidPkg = await getSolidPkg(solidPkgFile, solidPkgSsn);
    
    const date = solidPkg.created;
    log(`Released on: ${date}`, 'info');
}
//utility methods

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
//read solidpkg
async function getSolidPkg(ssnFile, fileEntries) {
    if (fileEntries.length !== 1) {
        log(`Expected .solidpkg to contain 1 file but it had "${fileEntries.length}" files.`, 'error');
        return;
    }
    
    const firstFile = fileEntries[0];
    if (firstFile.name !== 'metafile.solid') {
        log(`Expected .solidpkg to contain a file called metafile.solid but it is called "${firstFile.name}".`, 'error');
        return;
    }

    const stream = ssn.arrayBufferToStream(ssnFile, firstFile.offset);

    //Extract metafile.solid file
    await ssn.readLocalFileHeader(stream, true);
    const solidFileStream = await ssn.extractFileAsStream(firstFile, stream);
    const solidFileArrayBuffer = await ssn.streamToArrayBuffer(solidFileStream);
    const solidContents = ssn.parseBencode(solidFileArrayBuffer);
    
    return {
        created: new Date(solidContents['creation date'] * 1000),
        files: solidContents.info.files.map(({ length, path: [name] }) => ({ name, length })),
        pieceLength: solidContents.info['piece length'],
        pieces: solidContents.info.pieces,
    };
}
//search through patches list looking for patch with matching version number (v)
function findByLiveVersion(v) {
    return patches.find((p) => { return p.version == v; });
}

initialize();