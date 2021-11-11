import { XML_MAT } from "../../classes/formats/XML_MAT.js";
import { HashDictionary } from "../../classes/hash/HashDictionary.js";

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
    const assetsDict = Object.assign(...Object.values(assets));
    const assetDictKeys = Object.keys(assetsDict)
        .map(d => hash.getFileNameByHash(d.ph, d.sh)?.contains("." + extension.toLowerCase()));
    const matches = [];
    const dom = nodesByFqn;

    let filesSearched = 0;

    for (const assetKey in assetDictKeys) {
        if (assetKey.split('.').at(-1).toUpperCase() !== extension) continue;
        if (assets[assetKey]) {
            matches.push(asset);
        }
    }

    switch (extension) {
        case "XML":
        case "MAT":
            const xml_mat_reader = new XML_MAT(cache['hashPath'], extension);
            for (const asset of matches) {
                filesSearched++;
                const assetStream = asset.getReadStream();
                const doc = xmlJs.xml2json(xmlBuffString(assetStream), {compact: false, spaces: 4});
                // xml_mat_reader.ParseXML(assetStream, asset.hashInfo.Directory + "/" + asset.hashInfo.FileName);
            }
            namesFound = xml_mat_reader.fileNames.length + xml_mat_reader.animFileNames.length;
            // xml_mat_reader.WriteFile();
            break;
    //     case "EPP":
    //         Format_EPP epp_reader = new Format_EPP(extractPath, extension);
    //         List<GomObject> eppNodes = dom.GetObjectsStartingWith("epp.");
    //         for (const asset of matches) {
    //             filesSearched++;
    //             Stream assetStream = asset.hashInfo.File.OpenCopyInMemory();
    //             epp_reader.ParseEPP(assetStream, asset.hashInfo.Directory + "/" + asset.hashInfo.FileName);
    //         }
    //         epp_reader.ParseEPPNodes(eppNodes);
    //         namesFound = epp_reader.fileNames.Count;
    //         epp_reader.WriteFile();
    //         break;
    //     case "PRT":
    //         Format_PRT prt_reader = new Format_PRT(extractPath, extension);
    //         for (const asset of matches) {
    //             filesSearched++;
    //             Stream assetStream = asset.hashInfo.File.OpenCopyInMemory();
    //             prt_reader.ParsePRT(assetStream, asset.hashInfo.Directory + "/" + asset.hashInfo.FileName);
    //         }
    //         namesFound = prt_reader.fileNames.Count;
    //         prt_reader.WriteFile();
    //         break;
    //     case "GR2":
    //         Format_GR2 gr2_reader = new Format_GR2(extractPath, extension);
    //         for (const asset of matches) {
    //             if (asset.hashInfo.IsNamed) continue;
    //             filesSearched++;
    //             Stream assetStream = asset.hashInfo.File.OpenCopyInMemory();
    //             gr2_reader.ParseGR2(assetStream, asset.hashInfo.Directory + "/" + asset.hashInfo.FileName, asset.hashInfo.File.Archive);
    //         }
    //         namesFound = gr2_reader.matNames.Count + gr2_reader.meshNames.Count;
    //         gr2_reader.WriteFile(true);
    //         break;
    //     case "BNK":
    //         Format_BNK bnk_reader = new Format_BNK(extractPath, extension);
    //         for (const asset of matches) {
    //             filesSearched++;
    //             Stream assetStream = asset.hashInfo.File.OpenCopyInMemory();
    //             bnk_reader.ParseBNK(assetStream, asset.hashInfo.Directory + "/" + asset.hashInfo.FileName);
    //         }
    //         namesFound = bnk_reader.found;
    //         bnk_reader.WriteFile();
    //         break;
    //     case "DAT":
    //         Format_DAT dat_reader = new Format_DAT(extractPath, extension);
    //         for (const asset of matches) {
    //             filesSearched++;
    //             Stream assetStream = asset.hashInfo.File.OpenCopyInMemory();
    //             dat_reader.ParseDAT(assetStream, asset.hashInfo.Directory + "/" + asset.hashInfo.FileName, this);
    //         }
    //         namesFound = dat_reader.fileNames.Count;
    //         dat_reader.WriteFile();
    //         break;
    //     case "CNV":
    //         List<GomObject> cnvNodes = dom.GetObjectsStartingWith("cnv.");
    //         Format_CNV cnv_node_parser = new Format_CNV(extractPath, extension);
    //         cnv_node_parser.ParseCNVNodes(cnvNodes);
    //         namesFound = cnv_node_parser.fileNames.Count + cnv_node_parser.animNames.Count + cnv_node_parser.fxSpecNames.Count;
    //         filesSearched += cnvNodes.Count();
    //         cnv_node_parser.WriteFile();
    //         cnvNodes.Clear();
    //         break;
    //     case "MISC":
    //         Format_MISC misc_parser = new Format_MISC(extractPath, extension);
    //         List<GomObject> ippNodes = dom.GetObjectsStartingWith("ipp.");
    //         misc_parser.ParseMISC_IPP(ippNodes);
    //         List<GomObject> cdxNodes = dom.GetObjectsStartingWith("cdx.");
    //         misc_parser.ParseMISC_CDX(cdxNodes);
    //         Dictionary<string, DomType> nodeDict;
    //         dom.nodeLookup.TryGetValue(typeof(GomObject), out nodeDict);
    //         misc_parser.ParseMISC_NODE(nodeDict);
    //         GomObject ldgNode = dom.Get<GomObject>("loadingAreaLoadScreenPrototype");
    //         //nodeDict.Clear(); //this was destroying dom.nodeLookup causing an annoyingly hard to locate exception.
    //         Dictionary<object, object> itemApperances = dom.GetObject("itmAppearanceDatatable").Data.Get<Dictionary<object, object>>("itmAppearances");
    //         misc_parser.ParseMISC_LdnScn(ldgNode);
    //         misc_parser.ParseMISC_ITEM(itemApperances);
    //         misc_parser.ParseMISC_TUTORIAL(dom);
    //         misc_parser.WriteFile();
    //         namesFound = misc_parser.found;
    //         filesSearched += misc_parser.searched;
    //         break;
    //     case "MISC_WORLD":
    //         Format_MISC misc_world_parser = new Format_MISC(extractPath, extension);
    //         Dictionary<object, object> areaList = dom.GetObject("mapAreasDataProto").Data.Get<Dictionary<object, object>>("mapAreasDataObjectList");
    //         List<GomObject> areaList2 = dom.GetObjectsStartingWith("world.areas.");
    //         misc_world_parser.ParseMISC_WORLD(areaList2, areaList, dom);
    //         areaList.Clear();
    //         areaList2.Clear();
    //         misc_world_parser.WriteFile();
    //         namesFound = misc_world_parser.found;
    //         break;
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
    //         namesFound = hyd_parser.animFileNames.Count + hyd_parser.vfxFileNames.Count;
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
    //     case "STB":
    //         Format_STB stb_parser = new Format_STB(extractPath, extension);
    //         TorLib.File manifest = AssetHandler.Instance.GetCurrentAssets().FindFile("/resources/gamedata/str/stb.manifest");
    //         stb_parser.ParseSTBManifest(manifest.OpenCopyInMemory());
    //         namesFound = stb_parser.fileNames.Count;
    //         filesSearched += 1;
    //         stb_parser.WriteFile();
    //         break;
    //     default:
    //         break;
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
