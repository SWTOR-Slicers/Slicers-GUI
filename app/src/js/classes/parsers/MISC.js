import { STB } from '../formats/STB.js';
import { Area } from '../dataObjectModel/Area.js';

const fs = require('fs');

class MISCParser {
    #dest;
    /**
     * MISC parser class
     * @param {string} dest destination for ouputted hashes
     * @param {string} ext extentions to search
     */
    constructor(dest, ext) {
        this.found = 0;
        this.searched = 0;
        this.#dest = dest;
        this.extension = ext;
        this.fileNames = [];
        this.worldFileNames = [];
        this.animNames = [];
        this.mapNames = {};
        this.errors = [];
    }

    /**
     * Parse the ldnScreen node tree for file names.
     * @param {Array<Node>} ldnScreenNode ldnScreen node object
     */
    parseMISC_LdnScn(ldnScreenNode) {
        ldnScreenNode.readNode();
        const ldgLookup = ldnScreenNode.obj["ldgAreaNameToLoadScreen"];
        for (const kvpLdgClass of ldgLookup) {
            this.searched++;
            const areaLdgInfo = kvpLdgClass[1];
            const loadingScreen = areaLdgInfo["ldgScreenName"] || "";
            if (loadingScreen.length > 0) {
                this.fileNames.push("/resources/gfx/loadingscreen/" + loadingScreen + ".dds");
            }

            const loadingOverlay = areaLdgInfo["ldgOverlayName"] || "";
            if (loadingOverlay.length > 0) {
                this.fileNames.push("/resources/gfx/gfx_productions/" + loadingOverlay + ".gfx");
            }
        }
    }

    /**
     * Parse the ipp node tree for file names.
     * @param {Array<Node>} ippNodes ipp node object
     */
    parseMISC_IPP(ippNodes) {
        for (const obj of ippNodes) {
            obj.readNode();
            this.searched++;
            const full = obj.fqn.toLowerCase();
            const partial = obj.Name.toLowerCase().replace("ipp.", "");

            this.fileNames.push("/resources/gfx/icons/" + full + ".dds");
            this.fileNames.push("/resources/gfx/icons/" + partial + ".dds");

            this.fileNames.push("/resources/gfx/mtxstore/" + full + "_120x120.dds");
            this.fileNames.push("/resources/gfx/mtxstore/" + full + "_260x260.dds");
            this.fileNames.push("/resources/gfx/mtxstore/" + full + "_260x400.dds");
            this.fileNames.push("/resources/gfx/mtxstore/" + full + "_328x160.dds");
            this.fileNames.push("/resources/gfx/mtxstore/" + full + "_400x400.dds");

            this.fileNames.push("/resources/gfx/mtxstore/" + partial + "_120x120.dds");
            this.fileNames.push("/resources/gfx/mtxstore/" + partial + "_260x260.dds");
            this.fileNames.push("/resources/gfx/mtxstore/" + partial + "_260x400.dds");
            this.fileNames.push("/resources/gfx/mtxstore/" + partial + "_328x160.dds");
            this.fileNames.push("/resources/gfx/mtxstore/" + partial + "_400x400.dds");
        }
    }

    /**
     * Parse the cdx node tree for file names.
     * @param {Array<Node>} cdxNodes cdx node object
     */
    parseMISC_CDX(cdxNodes) {
        for (const obj in cdxNodes) {
            obj.readNode();
            this.searched++;
            const full = obj.fqn.toLowerCase();
            this.fileNames.push("/resources/gfx/codex/" + full + ".dds");
        }
    }

    /**
     * Parse the itm node tree for file names.
     * @param {Array<Node>} itmNodes itm node object
     */
    parseMISC_ITEM(itmNodes) {
        for (const kvp of itmNodes) {
            this.searched++;
            const itm = kvp[1];
            itm.readNode();

            const itmModel = itm.obj["itmModel"] ? itm.obj["itmModel"] : null;
            if (itmModel) this.fileNames.push(("/resources/" + (itmModel.replace("\\", "/"))).replace("//", "/"));

            const itmFxSpec = itm.obj["itmFxSpec"] ? itm.obj["itmFxSpec"] : null;
            if (itmFxSpec) this.fileNames.push(("/resources/art/fx/fxspec/" + itmFxSpec + ".fxspec").replace("//", "/").replace(".fxspec.fxspec", ".fxspec"));
        }
    }

    /**
     * Parse the misc_world nodes for file names.
     * @param {Array<Node>} worldAreas world area nodes
     * @param {Object} worldAreasProto world area prototype nodes
     * @param {Object} dom data object model
     */
    parseMISC_WORLD(worldAreas, worldAreasProto, dom) {
        for (const obj of worldAreas) {
            this.searched++;
            const areaId = obj.obj["mapDataContainerAreaID"] || 0;
            if (areaId > 0) {
                this.worldFileNames.push(`/resources/world/areas/${areaId}/area.dat`);
                this.worldFileNames.push(`/resources/world/areas/${areaId}/mapnotes.not`);

                const mapPages = obj.obj["mapDataContainerMapDataList"] || null;

                if (mapPages != null) {
                    for (const mapPage of mapPages) {
                        const mapName = mapPage.obj["mapName"] || null;
                        if (!Object.keys(this.mapNames).includes(areaId)) this.mapNames[areaId] = [];
                        this.mapNames[areaId].push(mapName);
                    }
                }
            }
        }

        for (const gomItm of worldAreasProto) {
            const area = new Area(gomItm.val);
            if (area.Id == 0 && area.areaId == 0) continue;
            this.objsearched++;
            if (area.mapPages != null) {
                let ii = 0;
                for (const map_page of area.mapPages) {
                    ii++;
                    if (map_page.hasImage == true) {
                        if (!Object.keys(this.mapNames).includes(area.areaId)) this.mapNames[area.areaId] = [];
                        this.mapNames[area.areaId].push(map_page.mapName);
                    }
                }
            }
        }
    }

    /**
     * Parse the misc_tutorial nodes for file names.
     * @param {STB} tutorialTable tutorials STB file
     */
    parseMISC_TUTORIAL(tutorialTable) {
        if (tutorialTable != null && tutorialTable.data != null) {
            for (const entr of tutorialTable.strings) {
                const text = entr.val;
                if (text.includes(".dds")) {
                    let start = 0;
                    while ((start = text.indexOf("img://", start)) != -1) {
                        let end = text.indexOf(".dds", start);
                        if (end != -1) {
                            let temp = text.substring(start, ((end - start) + 4)).toLowerCase();
                            temp = temp.replace("img://", "/resources/").replace("//", "/").replace("<<grammar::locpath>>", "en-us");
                            this.fileNames.push(temp);
                            start++;
                        }
                    }
                } else if (text.includes("img://")) {
                    let start = 0;
                    while ((start = text.indexOf("img://", start)) != -1) {
                        let end = text.indexOf("'", start);
                        if (end != -1) {
                            let temp = text.substring(start, ((end - start) + 1)).toLowerCase();
                            temp = temp.replace("img://", "/resources/").replace("//", "/").replace("<<grammar::locpath>>", "en-us");
                            this.fileNames.push(temp + ".dds");
                            start++;
                        }
                    }
                }
            }
        }
    }

    /**
     * Parse the misc node tree for file names.
     * @param {Array<Node>} miscNodes misc nodes object
     */
    parseMISC_NODE(miscNodes) {
        for (const obj of miscNodes) {
            obj.readNode();
            this.searched++;
            const node = obj;
            this.fileNames.push(`/resources/systemgenerated/prototypes/${node.Id}.node`);
        }
    }

    writeFile() {
        if (!fs.existsSync(`${this.#dest}\\File_Names`)) fs.mkdirSync(`${this.#dest}\\File_Names`);

        this.found = this.fileNames.length;
        if (this.fileNames.length > 0) {
            const outputNames = fs.createWriteStream(`${this.#dest}\\File_Names\\${extension}_file_names.txt`, {
                flags: 'a'
            });
            for (const file of this.fileNames) {
                outputNames.write(`${file.replace("\\", "/")}\r\n`);
            }
            outputNames.end();
            this.fileNames = [];
        }

        this.found += this.animNames.length;
        if (this.animNames.length > 0) {
            const outputAnimNames = fs.createWriteStream(`${this.#dest}\\File_Names\\${extension}_anim_file_names.txt`, {
                flags: 'a'
            });
            for (const file of this.animNames) {
                outputAnimNames.write(`${file.replace("\\", "/")}\r\n`);
            }
            outputAnimNames.end();
            this.animNames = [];
        }

        found += this.worldFileNames.length;
        if (this.worldFileNames.length > 0) {
            let outputWorldNames = fs.createWriteStream(`${this.#dest}\\File_Names\\${extension}_world_file_names_1.txt`, {
                flags: 'a'
            });
            let fileCount = 1;
            let lineCount = 1;
            for (const file of this.worldFileNames.length) {
                if (lineCount >= 750000) {
                    outputWorldNames.end();
                    fileCount++;
                    outputWorldNames = fs.createWriteStream(`${this.#dest}\\File_Names\\${extension}_world_file_names_${fileCount}.txt`, {
                        flags: 'a'
                    });
                    lineCount = 0;
                }
                outputWorldNames.write(`${file.replace("\\", "/")}`);
                lineCount++
            }
            outputWorldNames.end();
            this.worldFileNames = [];
        }

        found += Object.keys(this.mapNames);
        if (this.worldFileNames.length > 0) {
            let outputMapNames = fs.createWriteStream(`${this.#dest}\\File_Names\\${extension}_world_map_file_names_1.txt`, {
                flags: 'a'
            });
            let fileCount = 1;
            let lineCount = 1;
            for (const kvp of Object.entries(this.mapNames)) {
                for (const line of kvp[1]) {
                    if (lineCount >= 500000) {
                        outputMapNames.end();
                        fileCount++;
                        outputMapNames = fs.createWriteStream(`${this.#dest}\\File_Names\\${extension}_world_map_file_names_${fileCount}.txt`, {
                            flags: 'a'
                        });
                        lineCount = 0;
                    }
                    outputMapNames.write(`/resources/world/areas/${kvp[0]}/${line}_r.dds`.replace("\\", "/"));
                    lineCount++;
                    for (let m = 0; m <= 50; m++) {
                        for (let mm = 0; mm <= 50; mm++) {
                            outputMapNames.write(`/resources/world/areas/${kvp[0]}/minimaps/${line}_${m}_${mm}_r.dds`.replace("\\", "/"));
                            lineCount++;
                        }
                    }
                }
            }
            outputMapNames.end();
            this.mapNames = [];
        }

        if (errors.length > 0) {
            const outputErrors = fs.createWriteStream(`${this.#dest}\\File_Names\\${extension}_error_list.txt`, {
                flags: 'a'
            });
            for (const error of errors) {
                outputErrors.write(`${error}\r\n`);
            }
            outputErrors.end();
            this.errors = [];
        }
    }
}

export {MISCParser};