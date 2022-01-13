import { XDocument } from "../../classes/util/XDocument.js";
import { HashDictionary } from "../../classes/hash/HashDictionary.js";
import { NodeEntr } from "../../classes/formats/Node.js";
import { STB } from "../../classes/formats/STB.js";

import { inflateZlib, hashlittle2, uint32ToUint64 } from "../../Util.js";
import { StaticGomTree, nodeFolderSort } from "../../viewers/node-viewer/GomTree.js";

import { FXSPECParser } from "../../classes/parsers/FXSPEC.js";
import { ICONSParser } from "../../classes/parsers/ICONS.js";
import { XML_MAT } from "../../classes/parsers/XML_MAT.js";
import { MISCParser } from "../../classes/parsers/MISC.js";
import { SDEFParser } from "../../classes/parsers/SDEF.js";
import { STBParser } from "../../classes/parsers/STB.js";
import { EPPParser } from "../../classes/parsers/EPP.js";
import { PRTParser } from "../../classes/parsers/PRT.js";
import { GR2Parser } from "../../classes/parsers/GR2.js";
import { BNKParser } from "../../classes/parsers/BNK.js";
import { DATParser } from "../../classes/parsers/DAT.js";
import { CNVParser } from "../../classes/parsers/CNV.js";
import { AMXParser } from "../../classes/parsers/AMX.js";
import { HYDParser } from "../../classes/parsers/HYD.js";
import { DYNParser } from "../../classes/parsers/DYN.js";
import { PLCParser } from "../../classes/parsers/PLC.js";

import { ArchiveEntry, FileExtension } from "../../classes/formats/Archive.js";

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
let totalActualFound;
let hash;
let GTree;
let _dom = null;
let archives;

let decompressZlib = (params) => {
    const ret = inflateZlib(path.dirname(cache['configPath']), params);
    return ret;
}

onmessage = (e) => {
    switch (e.data.message) {
        case "init":
            GTree = new StaticGomTree();
            cache['configPath'] = path.normalize(path.join(e.data.data, "config.json"));
            cache['hashPath'] = path.join(e.data.data, "hash");

            hash = new HashDictionary(path.join(cache['hashPath'], 'hashes_filename.txt'));
            hash.loadHashList();
            break;
        case "genHash":
            totalFilesSearched = 0;
            totalNamesFound = 0;
            totalActualFound = 0;
            generateNames(GTree.nodesByFqn, GTree.nodesList, archives, e.data.data.checked, true);
            break;
        case "findFileNames":
            totalFilesSearched = 0;
            totalNamesFound = 0;
            totalActualFound = 0;
            generateNames(GTree.nodesByFqn, GTree.nodesList, archives, e.data.data.checked, false, e.data.data.extractPath);
            break;
        case "setDOM":
            _dom = e.data.data;
            break;
        case "nodesProgress":
            if (e.data.data.isBkt) {
                for (const n of e.data.data.nodes) {
                    const node = new NodeEntr(n.node, n.torPath, _dom, decompressZlib);
                    GTree.addNode(node);
                }
                GTree.loadedBuckets++;
                GTree.nodesByFqn.$F.sort(nodeFolderSort);
            } else {
                for (const n of e.data.data.nodes) {
                    const testProto = new NodeEntr(n.node, n.torPath, _dom, decompressZlib);
                    GTree.addNode(testProto);
                }
                GTree.nodesByFqn.$F.sort(nodeFolderSort);
            }
            break;
        case "archivesComplete":
            archives = e.data.data;
            break;
        default:
            console.log(`Unexpected message with value ${e.data.message}`);
            break;
    }
}

async function generateNames(nodesByFqn, nodesList, assets, checked, genHash, extractPath) {
    const names = [];
    await Promise.all(checked.map((ext) => { parseFiles(ext, assets, nodesByFqn, nodesList, genHash, names, genHash ? "" : extractPath); }));
    postMessage({
        "message": "complete",
        "data": {
            "names": (genHash) ? names : `File name output complete. Found ${totalNamesFound} names, and searched ${totalFilesSearched} files.`,
            "numActualFound": totalActualFound,
            "numFilesFound": totalNamesFound,
            "numFilesSearched": totalFilesSearched
        }
    });
}

/**
 * Parses filenames for the given extension.
 * @param  {string} extension The current extentions
 * @param  {Object} archives Object representing a list of all the .tor archive files
 * @param  {Object} nodesByFqn GOM Node object
 * @param  {Object} nodesList GOM Node object
 * @param  {boolean} genHash Wether to generateHash or findFileNames
 * @param  {Array<Object>} names An array of objects that represent lines in the hash file
 * @param  {string} extractPath the path to write filenames to, if finding files
 */
async function parseFiles(extension, archives, nodesByFqn, nodesList, genHash, names, extractPath) {
    let parseReturns = [];
    const assets = Object.values(archives).map(asset => asset.entries);
    
    let assetsDict = {};
    for (const entrList of assets) {
        Object.assign(assetsDict, entrList);
    }

    const matches = [];
    const fileExt = new FileExtension();
    Object.keys(assetsDict).map(key => {
        assetsDict[key] = ArchiveEntry.fromJSON(assetsDict[key]);

        const asset = assetsDict[key];
        const fileH = hash.getFileNameByHash(key);

        asset.isNamed = new Boolean(fileH);
        asset.hash = (fileH) ? fileH : `${asset.crc}_${asset.fileId}`;
        asset.type = (asset.isNamed) ? asset.hash.substring(asset.hash.lastIndexOf(".") + 1) : fileExt.guessExtension(asset);

        if (asset.type == extension.toLowerCase()) {
            matches.push(asset);
        }
    });
    
    const dom = nodesByFqn;

    let filesSearched = 0;
    let namesFound = 0;
    let actualFound = 0;

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
            if (genHash) {
                parseReturns = xml_mat_reader.genHash();
            } else {
                xml_mat_reader.writeFile();
            }
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
            if (genHash) {
                parseReturns = epp_reader.genHash();
            } else {
                epp_reader.writeFile();
            }
            break;
        case "PRT":
            const prt_reader = new PRTParser(extractPath, extension);
            for (const asset of matches) {
                filesSearched++;
                const assetStream = asset.getReadStream();
                prt_reader.parsePRT(assetStream, asset.hash);
            }
            namesFound = prt_reader.fileNames.length;
            if (genHash) {
                parseReturns = prt_reader.genHash();
            } else {
                prt_reader.writeFile();
            }
            break;
        case "GR2":
            const gr2_reader = new GR2Parser(extractPath, extension);
            for (const asset of matches) {
                if (asset.isNamed) { // if the hash is already included, then skip
                    names.push([asset.sh.toString(16).toUpperCase(), asset.ph.toString(16).toUpperCase(), asset.hash, asset.crc.toString(16).toUpperCase()].join('#'));
                    continue;
                }
                filesSearched++;
                const assetStream = asset.getReadStream();
                gr2_reader.parseGR2(assetStream, asset.hash, asset.tor);
            }
            namesFound = gr2_reader.matNames.length + gr2_reader.meshNames.size;
            if (genHash) {
                parseReturns = gr2_reader.genHash();
            } else {
                gr2_reader.writeFile();
            }
            break;
        case "BNK":
            const bnk_reader = new BNKParser(extractPath, extension);
            for (const asset of matches) {
                filesSearched++;
                const assetStream = asset.getReadStream();
                bnk_reader.parseBNK(assetStream, asset.hash);
            }
            namesFound = bnk_reader.fileNames.size;
            if (genHash) {
                parseReturns = bnk_reader.genHash();
            } else {
                bnk_reader.writeFile();
            }
            break;
        case "DAT":
            const dat_reader = new DATParser(extractPath, extension);
            for (const asset of matches) {
                filesSearched++;
                const assetStream = asset.getReadStream();
                dat_reader.parseDAT(assetStream, asset.hash, assetsDict);
            }
            namesFound = dat_reader.fileNames.length;
            if (genHash) {
                parseReturns = dat_reader.genHash();
            } else {
                dat_reader.writeFile();
            }
            break;
        case "CNV":
            const cnvNodes = dom.getObjectsStartingWith("cnv.");
            const cnv_node_parser = new CNVParser(extractPath, extension);
            cnv_node_parser.parseCNVNodes(cnvNodes);
            namesFound = cnv_node_parser.fileNames.length + cnv_node_parser.animNames.length + cnv_node_parser.fxSpecNames.length;
            filesSearched += cnvNodes.length;
            if (genHash) {
                parseReturns = cnv_node_parser.genHash();
            } else {
                cnv_node_parser.writeFile();
            }
            break;
        case "MISC":
            const misc_parser = new MISCParser(extractPath, extension);
            const ippNodes = dom.getObjectsStartingWith("ipp.");
            misc_parser.parseMISC_IPP(ippNodes);
            const cdxNodes = dom.getObjectsStartingWith("cdx.");
            misc_parser.parseMISC_CDX(cdxNodes);
            misc_parser.parseMISC_NODE(nodesList);
            const ldgNode = dom.getObject("loadingAreaLoadScreenPrototype");
            const itemApperances = dom.getObject("itmAppearanceDatatable").fields.value["itmAppearances"];
            misc_parser.parseMISC_LdnScn(ldgNode);
            misc_parser.parseMISC_ITEM(itemApperances);
            const guiTutorialsStb = new STB(assets["resources/en-us/str/gui/tutorials.stb"].getReadStream());
            misc_parser.parseMISC_TUTORIAL(guiTutorialsStb);
            if (genHash) {
                parseReturns = misc_parser.genHash();
            } else {
                misc_parser.writeFile();
            }
            namesFound = misc_parser.found;
            filesSearched += misc_parser.searched;
            break;
        case "MISC_WORLD":
            const misc_world_parser = new MISCParser(extractPath, extension);
            const areaList = dom.getObject("mapAreasDataProto").fields.value["mapAreasDataObjectList"];
            const areaList2 = dom.getObjectsStartingWith("world.areas.");
            misc_world_parser.parseMISC_WORLD(areaList2, areaList, dom);
            if (genHash) {
                parseReturns = misc_world_parser.genHash();
            } else {
                misc_world_parser.writeFile();
            }
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
            if (genHash) {
                parseReturns = fxspec_parser.genHash();
            } else {
                fxspec_parser.writeFile();
            }
            break;
        case "AMX":
            const amx_parser = new AMXParser(extractPath, extension);
            for (const asset of matches) {
                filesSearched++;
                const assetStream = asset.getReadStream();
                amx_parser.parseAMX(assetStream, asset.hash);
            }
            namesFound = amx_parser.fileNames.size;
            if (genHash) {
                parseReturns = amx_parser.genHash();
            } else {
                amx_parser.writeFile();
            }
            break;
        case "SDEF":
            const sdef_parser = new SDEFParser(extractPath, extension);
            const sdef = assets["/resources/systemgenerated/scriptdef.list"];
            sdef_parser.parseSDEF(sdef.getReadStream());
            if (genHash) {
                parseReturns = sdef_parser.genHash();
            } else {
                sdef_parser.writeFile();
            }
            namesFound = sdef_parser.found;
            filesSearched = 1;
            break;
        case "HYD":
            const hydNodes = dom.getObjectsStartingWith("hyd.");
            const hyd_parser = new HYDParser(extractPath, extension);
            hyd_parser.parseHYD(hydNodes);
            namesFound = hyd_parser.animNames.length + hyd_parser.vfxFileNames.length;
            filesSearched += hydNodes.length;
            if (genHash) {
                parseReturns = hyd_parser.genHash();
            } else {
                hyd_parser.writeFile();
            }
            break;
        case "DYN":
            const dynNodes = dom.getObjectsStartingWith("dyn.");
            const dyn_parser = new DYNParser(extractPath, extension);
            dyn_parser.parseDYN(dynNodes);
            namesFound = dyn_parser.fileNames.length + dyn_parser.unknownFileNames.length;
            filesSearched += dynNodes.length;
            if (genHash) {
                parseReturns = dyn_parser.genHash();
            } else {
                dyn_parser.writeFile();
            }
            break;
        case "ICONS":
            const icon_parser = new ICONSParser(extractPath, extension);
            icon_parser.parseICONS(dom);
            namesFound = icon_parser.fileNames.length;
            filesSearched += icon_parser.searched;
            if (genHash) {
                parseReturns = icon_parser.genHash();
            } else {
                icon_parser.writeFile();
            }
            break;
        case "PLC":
            const plcNodes = dom.getObjectsStartingWith("plc.");
            const plc_parser = new PLCParser(extractPath, extension);
            plc_parser.parsePLC(plcNodes);
            namesFound = plc_parser.fileNames.length;
            filesSearched += plcNodes.length;
            if (genHash) {
                parseReturns = plc_parser.genHash();
            } else {
                plc_parser.writeFile();
            }
            break;
        case "STB":
            const stbParser = new STBParser(cache['hashPath'], extension);
            const manifest = assetsDict[hashlittle2("/resources/gamedata/str/stb.manifest").join('|')];
            const assetStream = manifest.getReadStream();
            const doc = new XDocument(xmlJs.xml2json(xmlBuffString(assetStream), {compact: false, spaces: 4}));
            stbParser.parseSTBManifest(doc);
            namesFound = stbParser.fileNames.length;
            filesSearched += 1;
            if (genHash) {
                parseReturns = stbParser.genHash();
            } else {
                stbParser.writeFile();
            }
            break;
        default:
            break;
    }
    totalFilesSearched += filesSearched;
    totalNamesFound += namesFound;

    let namesNotFound = [];

    if (parseReturns.length > 0 && genHash) {
        for (const n of parseReturns) {
            if (n) {
                const hash = hashlittle2(n);
                const file = assetsDict[uint32ToUint64(hash[0], hash[1])];
                if (file) {
                    actualFound++;
                    names.push([hash[0].toString(16).toUpperCase(), hash[1].toString(16).toUpperCase(), n, file.crc.toString(16).toUpperCase()].join('#'));
                } else {
                    namesNotFound.push(n);
                    console.log(`File name ${n} has no matching file. Need to check parser ${extension}`);
                }
            }
        }
    }

    console.log(namesNotFound);

    totalActualFound += actualFound;

    postMessage({
        "message": "progress",
        "data": {
            "totalActualFound": totalActualFound,
            "totalNamesFound": totalNamesFound,
            "totalFilesSearched": totalFilesSearched
        }
    });
}