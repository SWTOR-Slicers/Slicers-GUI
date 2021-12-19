import { XDocument } from "../../classes/util/XDocument.js";
import { XML_MAT } from "../../classes/parsers/XML_MAT.js";
import { HashDictionary } from "../../classes/hash/HashDictionary.js";
import { STBParser } from "../../classes/parsers/STB.js";
import { getCount, hashlittle2 } from "../../Util.js";
import { EPPParser } from "../../classes/parsers/EPP.js";
import { PRTParser } from "../../classes/parsers/PRT.js";
import { GR2Parser } from "../../classes/parsers/GR2.js";
import { BNKParser } from "../../classes/parsers/BNK.js";
import { DATParser } from "../../classes/parsers/DAT.js";
import { CNVParser } from "../../classes/parsers/CNV.js";
import { MISCParser } from "../../classes/parsers/MISC.js";
import { STB } from "src/js/classes/formats/STB.js";
import { protoNodes } from "../../viewers/node-viewer/GomTree.js";

const path = require('path');
const fs = require('fs');
const xmlJs = require('xml-js');
const xmlBuffString = require('xml-buffer-tostring');

const cache = {
    "configPath": "",
    "tmpPath": "",
    "hashPath": "",
    "store": {}
}
let totalFilesSearched;
let totalNamesFound;
let hash;
const newHash = [];

onmessage = (e) => {
    switch (e.data.message) {
        case "init":
            cache['configPath'] = path.normalize(path.join(e.data.data.resourcePath, "config.json"));
            cache['hashPath'] = e.data.data.hashPath;
            hash = new HashDictionary(path.join(cache['hashPath'], 'hashes_filename.txt'));
            hash.loadHashList();
            break;
        case "genHash":
            totalFilesSearched = 0;
            totalNamesFound = 0;
            generateHash(e.data.data.nodesByFqn, e.data.data.assets, e.data.data.checked);
            break;
    }
}

async function generateHash(nodesByFqn, assets, checked) {
    const names = [];
    await Promise.all(checked.map((ext) => { parseFiles(ext, assets, nodesByFqn); }));
    postMessage({
        "message": "complete",
        "data": names
    });
}
/**
 * Parses filenames for the given extension.
 * @param  {string} extension The current extentions
 * @param  {Object} assets Object representing all of the assets in the .tor files
 * @param  {Object} nodesByFqn GOM Node object
 */
async function parseFiles(extension, assets, nodesByFqn) {
    const assetsDict = Object.assign({}, ...Object.values(assets));

    Object.keys(assetsDict).map(key => {
        const fileH = hash.getFileNameByHash(...d.split('|').reverse());
        assetsDict[key] = {
            ...asset,
            "isNamed": fileH !== null,
            "hash": (fileH !== null) ? fileH : `${asset.crc}_${asset.fileId}`
        }
    });

    const assetDictKeys = Object.keys(assetsDict)
        .map(d => hash.getFileNameByHash(...d.split('|').reverse())?.contains("." + extension.toLowerCase()));
    
    const matches = [];
    const dom = nodesByFqn;

    let filesSearched = 0;
    let namesFound = 0;

    for (const assetKey in assetDictKeys) {
        if (assetKey.split('.').at(-1).toUpperCase() !== extension) continue;
        if (assets[assetKey]) {
            const asset = assets[assetKey];
            const fileH = hash.getFileNameByHash(...d.split('|').reverse());
            matches.push({
                ...asset,
                "isNamed": fileH !== null,
                "hash": (fileH !== null) ? fileH : `${asset.crc}_${asset.fileId}`
            });
        }
    }

    switch (extension) {
        case "XML":
        case "MAT":
            const xml_mat_reader = new XML_MAT(cache['hashPath'], extension);
            for (const asset of matches) {
                filesSearched++;
                const assetStream = asset.getReadStream();
                const doc = new XDocument(xmlJs.xml2json(xmlBuffString(assetStream), {compact: false, spaces: 4}));
                xml_mat_reader.parseXML(doc, asset.hash);
            }
            namesFound = xml_mat_reader.fileNames.length + xml_mat_reader.animNames.length;
            xml_mat_reader.writeFile();
            break;
        case "EPP":
            const epp_reader = new EPPParser(extractPath, extension);
            const eppNodes = dom["epp."];
            for (const asset of matches) {
                filesSearched++;
                const assetStream = asset.getReadStream();
                const doc = new XDocument(xmlJs.xml2json(xmlBuffString(assetStream), {compact: false, spaces: 4}));
                epp_reader.parseEPP(doc, asset.hash);
            }
            epp_reader.parseEPPNodes(eppNodes);
            namesFound = epp_reader.fileNames.length;
            epp_reader.writeFile();
            break;
        case "PRT":
            const prt_reader = new PRTParser(extractPath, extension);
            for (const asset of matches) {
                filesSearched++;
                const assetStream = asset.getReadStream();
                prt_reader.parsePRT(assetStream, asset.hash);
            }
            namesFound = prt_reader.fileNames.length;
            prt_reader.writeFile();
            break;
        case "GR2":
            const gr2_reader = new GR2Parser(extractPath, extension);
            for (const asset of matches) {
                if (asset.isNamed) { // if the hash is already included, then skip
                    newHash.push({
                        "name": asset.hash,
                        "crc": asset.crc,
                        "ph": asset.ph,
                        "sh": asset.sh
                    });
                    continue;
                }
                filesSearched++;
                const assetStream = asset.getReadStream();
                gr2_reader.parseGR2(assetStream, asset.hash, asset.tor);
            }
            namesFound = gr2_reader.matNames.length + gr2_reader.meshNames.size;
            gr2_reader.writeFile();
            break;
        case "BNK":
            const bnk_reader = new BNKParser(extractPath, extension);
            for (const asset of matches) {
                filesSearched++;
                const assetStream = asset.getReadStream();
                bnk_reader.parseBNK(assetStream, asset.hash);
            }
            namesFound = bnk_reader.fileNames.length;
            bnk_reader.writeFile();
            break;
        case "DAT":
            const dat_reader = new DATParser(extractPath, extension);
            for (const asset of matches) {
                filesSearched++;
                const assetStream = asset.getReadStream();
                dat_reader.parseDAT(assetStream, asset.hash, assetsDict);
            }
            namesFound = dat_reader.fileNames.length;
            dat_reader.writeFile();
            break;
        case "CNV":
            const cnvNodes = dom["cnv."];
            const cnv_node_parser = new CNVParser(extractPath, extension);
            cnv_node_parser.parseCNVNodes(cnvNodes);
            namesFound = cnv_node_parser.fileNames.length + cnv_node_parser.animNames.length + cnv_node_parser.fxSpecNames.length;
            filesSearched += getCount(cnvNodes, 0);
            cnv_node_parser.writeFile();
            break;
        case "MISC":
            const misc_parser = new MISCParser(extractPath, extension);
            const ippNodes = dom.getObjectsStartingWith("ipp.");
            misc_parser.parseMISC_IPP(ippNodes);
            const cdxNodes = dom.getObjectsStartingWith("cdx.");
            misc_parser.parseMISC_CDX(cdxNodes);
            misc_parser.parseMISC_NODE(protoNodes);
            const ldgNode = dom.getObject("loadingAreaLoadScreenPrototype");
            const itemApperances = dom.getObject("itmAppearanceDatatable").obj["itmAppearances"];
            misc_parser.parseMISC_LdnScn(ldgNode);
            misc_parser.parseMISC_ITEM(itemApperances);
            const guiTutorialsStb = new STB(assets["resources/en-us/str/gui/tutorials.stb"].getReadStream());
            misc_parser.parseMISC_TUTORIAL(guiTutorialsStb);
            misc_parser.writeFile();
            namesFound = misc_parser.found;
            filesSearched += misc_parser.searched;
            break;
        case "MISC_WORLD":
            Format_MISC misc_world_parser = new Format_MISC(extractPath, extension);
            Dictionary<object, object> areaList = dom.GetObject("mapAreasDataProto").Data.Get<Dictionary<object, object>>("mapAreasDataObjectList");
            List<GomObject> areaList2 = dom.GetObjectsStartingWith("world.areas.");
            misc_world_parser.ParseMISC_WORLD(areaList2, areaList, dom);
            areaList.Clear();
            areaList2.Clear();
            misc_world_parser.WriteFile();
            namesFound = misc_world_parser.found;
            break;
    //     case "FXSPEC":
    //         Format_FXSPEC fxspec_parser = new Format_FXSPEC(extractPath, extension);
    //         for (const asset of matches) {
    //             filesSearched++;
    //             Stream assetStream = asset.hashInfo.File.OpenCopyInMemory();
    //             fxspec_parser.ParseFXSPEC(assetStream, asset.hashInfo.Directory + "/" + asset.hashInfo.FileName);
    //         }
    //         namesFound = fxspec_parser.fileNames.Count();
    //         fxspec_parser.WriteFile();
    //         break;
    //     case "AMX":
    //         Format_AMX amx_parser = new Format_AMX(extractPath, extension);
    //         for (const asset of matches) {
    //             filesSearched++;
    //             Stream assetStream = asset.hashInfo.File.OpenCopyInMemory();
    //             amx_parser.ParseAMX(assetStream, asset.hashInfo.Directory + "/" + asset.hashInfo.FileName);
    //         }
    //         namesFound = amx_parser.fileNames.Count();
    //         amx_parser.WriteFile();
    //         break;
    //     case "SDEF":
    //         Format_SDEF sdef_parser = new Format_SDEF(extractPath, extension);
    //         TorLib.File sdef = AssetHandler.Instance.GetCurrentAssets().FindFile("/resources/systemgenerated/scriptdef.list");
    //         sdef_parser.ParseSDEF(sdef.OpenCopyInMemory());
    //         sdef_parser.WriteFile();
    //         namesFound = sdef_parser.found;
    //         filesSearched = 1;
    //         break;
    //     case "HYD":
    //         List<GomObject> hydNodes = dom.GetObjectsStartingWith("hyd.");
    //         Format_HYD hyd_parser = new Format_HYD(extractPath, extension);
    //         hyd_parser.ParseHYD(hydNodes);
    //         namesFound = hyd_parser.animNames.Count + hyd_parser.vfxFileNames.Count;
    //         filesSearched += hydNodes.Count();
    //         hyd_parser.WriteFile();
    //         hydNodes.Clear();
    //         break;
    //     case "DYN":
    //         List<GomObject> dynNodes = dom.GetObjectsStartingWith("dyn.");
    //         Format_DYN dyn_parser = new Format_DYN(extractPath, extension);
    //         dyn_parser.ParseDYN(dynNodes);
    //         namesFound = dyn_parser.fileNames.Count + dyn_parser.unknownFileNames.Count;
    //         filesSearched += dynNodes.Count();
    //         dyn_parser.WriteFile();
    //         break;
    //     case "ICONS":
    //         Format_ICONS icon_parser = new Format_ICONS(extractPath, extension);
    //         icon_parser.ParseICONS(dom);
    //         namesFound = icon_parser.fileNames.Count;
    //         filesSearched += icon_parser.searched;
    //         icon_parser.WriteFile();
    //         break;
    //     case "PLC":
    //         List<GomObject> plcNodes = dom.GetObjectsStartingWith("plc.");
    //         Format_PLC plc_parser = new Format_PLC(extractPath, extension);
    //         plc_parser.ParsePLC(plcNodes);
    //         namesFound = plc_parser.fileNames.Count;
    //         filesSearched += plcNodes.Count();
    //         plc_parser.WriteFile();
    //         break;
        case "STB":
            const stbParser = new STBParser(cache['hashPath'], extension);
            const manifest = assetsDict[hashlittle2("/resources/gamedata/str/stb.manifest").join('|')];
            const assetStream = manifest.getReadStream();
            const doc = new XDocument(xmlJs.xml2json(xmlBuffString(assetStream), {compact: false, spaces: 4}));
            stbParser.parseSTBManifest(doc);
            namesFound = stbParser.fileNames.length;
            filesSearched += 1;
            stbParser.writeFile();
            break;
        default:
            break;
    }
    totalFilesSearched += filesSearched;
    totalNamesFound += namesFound;

    postMessage({
        "message": "progress",
        "data": {
            "totalNamesFound": totalNamesFound,
            "totalFilesSearched": totalFilesSearched
        }
    });
}
