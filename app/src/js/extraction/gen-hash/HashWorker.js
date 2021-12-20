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
import { FXSPECParser } from "../../classes/parsers/FXSPEC.js";
import { AMXParser } from "../../classes/parsers/AMX.js";
import { SDEFParser } from "../../classes/parsers/SDEF.js";
import { HYDParser } from "../../classes/parsers/HYD.js";
import { DYNParser } from "../../classes/parsers/DYN.js";
import { PLCParser } from "../../classes/parsers/PLC.js";
import { ICONSParser } from "../../classes/parsers/ICONS.js";

const path = require('path');
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
            generateNames(e.data.data.nodesByFqn, e.data.data.protoNodes, e.data.data.assets, e.data.data.checked, true);
            break;
        case "findFileNames":
            totalFilesSearched = 0;
            totalNamesFound = 0;
            generateNames(e.data.data.nodesByFqn, e.data.data.protoNodes, e.data.data.assets, e.data.data.checked, false);
            break;
    }
}

async function generateNames(nodesByFqn, protoNodes, assets, checked, genHash) {
    const names = [];
    await Promise.all(checked.map((ext) => { parseFiles(ext, assets, nodesByFqn, protoNodes); }));
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
 * @param  {Object} protoNodes GOM Prototype Node object
 */
async function parseFiles(extension, assets, nodesByFqn, protoNodes) {
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
            const eppNodes = dom.getObjectsStartingWith("epp.");
            const epp_reader = new EPPParser(extractPath, extension);
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
            const cnvNodes = dom.getObjectsStartingWith("cnv.");
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
            const itemApperances = dom.getObject("itmAppearanceDatatable").obj.value["itmAppearances"];
            misc_parser.parseMISC_LdnScn(ldgNode);
            misc_parser.parseMISC_ITEM(itemApperances);
            const guiTutorialsStb = new STB(assets["resources/en-us/str/gui/tutorials.stb"].getReadStream());
            misc_parser.parseMISC_TUTORIAL(guiTutorialsStb);
            misc_parser.writeFile();
            namesFound = misc_parser.found;
            filesSearched += misc_parser.searched;
            break;
        case "MISC_WORLD":
            const misc_world_parser = new MISCParser(extractPath, extension);
            const areaList = dom.getObject("mapAreasDataProto").obj.value["mapAreasDataObjectList"];
            const areaList2 = dom.getObjectsStartingWith("world.areas.");
            misc_world_parser.parseMISC_WORLD(areaList2, areaList, dom);
            misc_world_parser.writeFile();
            namesFound = misc_world_parser.found;
            break;
        case "FXSPEC":
            const fxspec_parser = new FXSPECParser(extractPath, extension);
            for (const asset of matches) {
                filesSearched++;
                const assetStream = asset.getReadStream();
                const doc = new XDocument(xmlJs.xml2json(xmlBuffString(assetStream), {compact: false, spaces: 4}));
                fxspec_parser.parseFXSPEC(doc, asset.hash);
            }
            namesFound = fxspec_parser.fileNames.length;
            fxspec_parser.writeFile();
            break;
        case "AMX":
            const amx_parser = new AMXParser(extractPath, extension);
            for (const asset of matches) {
                filesSearched++;
                const assetStream = asset.getReadStream();
                amx_parser.parseAMX(assetStream, asset.hash);
            }
            namesFound = amx_parser.fileNames.length;
            amx_parser.writeFile();
            break;
        case "SDEF":
            const sdef_parser = new SDEFParser(extractPath, extension);
            const sdef = assets["/resources/systemgenerated/scriptdef.list"];
            sdef_parser.parseSDEF(sdef.getReadStream());
            sdef_parser.writeFile();
            namesFound = sdef_parser.found;
            filesSearched = 1;
            break;
        case "HYD":
            const hydNodes = dom.getObjectsStartingWith("hyd.");
            const hyd_parser = new HYDParser(extractPath, extension);
            hyd_parser.parseHYD(hydNodes);
            namesFound = hyd_parser.animNames.length + hyd_parser.vfxFileNames.length;
            filesSearched += hydNodes.length;
            hyd_parser.writeFile();
            break;
        case "DYN":
            const dynNodes = dom.getObjectsStartingWith("dyn.");
            const dyn_parser = new DYNParser(extractPath, extension);
            dyn_parser.parseDYN(dynNodes);
            namesFound = dyn_parser.fileNames.length + dyn_parser.unknownFileNames.length;
            filesSearched += dynNodes.length;
            dyn_parser.writeFile();
            break;
        case "ICONS":
            const icon_parser = new ICONSParser(extractPath, extension);
            icon_parser.parseICONS(dom);
            namesFound = icon_parser.fileNames.length;
            filesSearched += icon_parser.searched;
            icon_parser.writeFile();
            break;
        case "PLC":
            const plcNodes = dom.getObjectsStartingWith("plc.");
            const plc_parser = new PLCParser(extractPath, extension);
            plc_parser.parsePLC(plcNodes);
            namesFound = plc_parser.fileNames.length;
            filesSearched += plcNodes.length;
            plc_parser.writeFile();
            break;
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
