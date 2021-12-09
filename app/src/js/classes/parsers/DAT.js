import { isNullOrWhiteSpace } from "src/js/Util.js";
import { ArchiveEntry } from "../formats/Archive.js";
import { Reader } from "../util/FileWrapper.js";
import { XDocument } from "..//util/XDocument.js";

const fs = require('fs');
const stream = require('stream');
const readLine = require('readline');
const xmlJs = require('xml-js');
const xmlBuffString = require('xml-buffer-tostring');

const DatTypeId = {
    Boolean: 0x00,
    Unknown1: 0x01,
    Unknown2: 0x02,
    UInt32: 0x03, // may be Int32
    Single: 0x04,
    UInt64: 0x05,
    Vector3: 0x06,
    Unknown7: 0x07,
    string: 0x08,
    Data: 0x09
}

class DATParser {
    #dest;
    get checkKeys() { return [".NormalMap2", ".NormalMap1", ".SurfaceMap", ".RampMap", ".Falloff", ".IlluminationMap", ".FxSpecName", ".EnvironmentMap", ".Intensity", ".PortalTarget", ".Color", ".gfxMovieName", ".DiffuseColor", ".ProjectionTexture"]; }

    /**
     * dat parser class
     * @param  {string} dest destination for ouputted hashes
     * @param  {string} ext extentions to search
     */
    constructor(dest, ext) {
        this.#dest = dest;
        this.ext = ext;
        this.fileName = null;
        
        this.fileNames = [];
        this.animNames = [];
        this.errors = [];

        this.portalTargets = [];
        this.properties = new Map();
    }

    async parseDAT(reader, fullFileName, assets) {
        this.filename = fullFileName;
        let oldFormat = true;
        const header = reader.readInt32();
        if (header == 24) {
            oldFormat = false;
            //reader.offset = 4;
            const format = reader.readString();
            switch (format) {
                case "ROOM_DAT_BINARY_FORMAT_":
                    this.#parseNewRoomDAT(reader);
                    break;
                case "AREA_DAT_BINARY_FORMAT_":
                    this.#parseNewAreaDAT(reader);
                    break;
                default:
                    break;
            }
        }

        if (oldFormat) {
            const streamReader = new stream.PassThrough();
            streamReader.end(reader.data);

            const rl = readLine.createInterface({
                input: streamReader,
                crlfDelay: Infinity
            });

            const stream_lines = [];
            for await (const line of rl) {
                stream_lines.push(line.trimStart());
            }

            streamReader.destroy();

            if (stream_lines.some(x => x.includes("! Area Specification"))) {
                this.#parseOldAreaDAT(stream_lines);
            } else if (stream_lines.some(x => x.includes("! Room Specification"))) {
                this.#parseOldRoomDAT(stream_lines);
            } else if (stream_lines.some(x => x.includes("! Character Specification"))) {
                this.#parseOldCharacterDAT(stream_lines, assets);
            } else {
                //throw new Exception("Unknown DAT Specification" + stream_lines[1]);
                console.log("Unknown DAT Specification" + stream_lines[1]);
            }
        }
    }

    /**
     * New Area Format Readers
     * @param {Reader} reader Filewrapper reader for the data
     */
    #parseNewAreaDAT(reader) {
        reader.offset = 0x1C; //Skip room header

        const roomOffset = reader.readUint32();
        const assetsOffset = reader.readUint32();
        reader.readUint32();
        const schemesOffset = reader.readUint32();
        const terTexOffset = reader.readUint32();
        const DydTexOffset = reader.readUint32();
        reader.readUint32();
        reader.readUint32();

        const guidOffset = reader.readUint32();
        reader.readBytes(0x16); //Always (01 00) repeating

        reader.offset = guidOffset;
        const areaGuid = reader.readUint64();

        let areaID = null;	//areaGuid not usually the correct ID in the file path

        if (filename.includes("/resources/world/areas")) {
            areaID = filename.replace("/resources/world/areas/", "").replace("/area.dat", "");
            this.fileNames.push(`/resources/world/areas/${areaID}/mapnotes.not`);
        }

        //Rooms
        reader.offset = roomOffset;
        const numRooms = reader.readUint32();
        for (let i = 0; i < numRooms; i++) {
            const nameLength = reader.readUint32();
            const room = reader.readString(nameLength).toLowerCase();
            
            this.fileNames.push(`/resources/world/areas/${areaID != null ? areaID : areaGuid}/${room}.dat"`);
        }

        //Assets
        reader.offset = assetsOffset;
        const numAssets = reader.readUint32();
        for (let i = 0; i < numAssets; i++) {
            reader.readUint64();
            const nameLength = reader.readUint32();
            const assetName = reader.readString(nameLength);
            if (assetName.includes(':') || assetName.includes('#')) continue;

            this.fileNames.push(`/resources${assetName.toLowerCase().replace("\\", "/")}`);
        }

        //Paths

        //Schemes
        reader.offset = schemesOffset;
        const numSchemes = reader.readUint32();
        for (let i = 0; i < numSchemes; i++) {
            const nameLength = reader.readUint32();
            reader.readString(nameLength);
            const schemeLength = reader.readUint32();
            const scheme = reader.readString(schemeLength);
            if (scheme.includes("/")) {
                let idx = 0;
                while ((idx = scheme.indexOf('/', idx)) != -1) {
                    const end = scheme.indexOf('|', idx);
                    const len = end - idx;
                    const final = scheme.substr(idx, len).toLowerCase();
                    this.fileNames.push(`/resources${final}.tex`);
                    this.fileNames.push(`/resources${final}.dds`);
                    this.fileNames.push(`/resources${final}.tiny.dds`);
                    idx = end;
                }
            }
        }

        //TERRAINTEXTURES
        reader.offset = terTexOffset;
        const numTerTex = reader.readUint32();
        for (let i = 0; i < numTerTex; i++) {
            reader.readUint64();
            const nameLength = reader.readUint32();
            const terTexName = reader.readString(nameLength);

            this.fileNames.push(`/resources/art/shaders/materials/${terTexName.toLowerCase()}.mat`);
            this.fileNames.push(`/resources/art/shaders/environmentmaterials/${terTexName.toLowerCase()}.emt`);
        }

        //TERRAINTEXTURES
        reader.offset = DydTexOffset;
        const numDydTex = reader.readUint32();
        for (let i = 0; i < numDydTex; i++) {
            reader.readUint32();
            const nameLength = reader.readUint32();
            const terTexName = reader.readString(nameLength);

            this.fileNames.push(`/resources/art/shaders/materials/${terTexName.toLowerCase()}.mat`);
            this.fileNames.push(`/resources/art/shaders/environmentmaterials/${terTexName.toLowerCase()}.emt`);
        }

        //DYDCHANNELPARAMS

        //SETTINGS
    }

    /**
     * New Room Format Readers
     * @param {Reader} reader Filewrapper reader for the data
     */
    #parseNewRoomDAT(reader) {
        const fxspecs = [];
        const textures = [];

        reader.offset = 0x1C; //Skip room header

        const instanceOffset = reader.readUint32();
        reader.readUint32();
        reader.readUint32();
        reader.readUint64(); //Always 281479271743491 : (03 00 01 00 01 00 01 00)

        const fileNameLength = reader.readUint32();
        const filename = reader.readString(fileNameLength);
        this.fileNames.push(`/resources${filename}`);

        const area = filename.substr(0, filename.lastIndexOf('/') + 1);
        this.fileNames.push(`/resources${area + "area.dat"}`);
        this.fileNames.push(`/resources${area + "mapnotes.not"}`);

        //Instances
        reader.offset = instanceOffset;
        const numInstances = reader.readUint32();
        for (let i = 0; i < numInstances; i++) {
            const instanceHeader = reader.readUint32();
            if (instanceHeader != 0xABCD1234) {// 0x3412CDAB
                throw new Error("Arguement out of range");
            } else {
                // string sdifn = "";
            }

            reader.readByte();
            reader.readUint64();
            reader.readUint64();
            reader.readByte();
            const numProperties = reader.readUint32();
            const propteriesLength = reader.readUint32();

            const startOffset = reader.offset;
            reader.readByte();
            try {
                for (let p = 0; p < numProperties; p++) {
                    const type = reader.readByte(); // will be a value from the DatTypeId object
                    const propertyId = reader.readUint32();

                    if (!Array.from(this.properties.keys()).includes(propertyId)) {
                        this.properties.set(propertyId, type);
                    } else if (this.properties[propertyId] != type) {
                        //throw new IndexOutOfRangeException();
                        this.properties[propertyId]; // oldType
                    }

                    let o = {};
                    switch (type) {
                        case DatTypeId.Boolean:
                            const b = reader.readByte();
                            if (b > 1) throw new Error("Index out of range");
                            const boo = Boolean(b);
                            o = boo;
                            break;
                        case DatTypeId.Unknown1:
                            const ival = br.ReadInt32();
                            if (ival > 1) o = ival;
                            break;
                        //case DatTypeId.Unknown2:
                        //    break;
                        case DatTypeId.UInt32:
                            const val = reader.readUint32();
                            o = val;
                            break;
                        case DatTypeId.Single:
                            const flo = br.ReadSingle();
                            o = flo;
                            break;
                        case DatTypeId.UInt64:
                            const lval = reader.readUint64();
                            o = lval;
                            break;
                        case DatTypeId.Vector3:
                            const vec3 = [
                                br.ReadSingle(),
                                br.ReadSingle(),
                                br.ReadSingle()
                            ];
                            o = vec3;
                            break;
                        case DatTypeId.Unknown7:
                            //byte[] bytes = br.ReadBytes(16);
                            const vec4 = [
                                br.ReadSingle(),
                                br.ReadSingle(),
                                br.ReadSingle(),
                                br.ReadSingle()
                            ];
                            o = vec4;
                            break;
                        case DatTypeId.string:
                            const strlen = reader.readUint32();
                            const str = reader.readString(strlen);
                            o = str;

                            if (!isNullOrWhiteSpace(o)) {
                                switch (propertyId) {
                                    case 3261558584:    // FxSpecName
                                        fxspecs.push(o);
                                        break;
                                    case 2393024011:    // spnAnimation or spnNpcIdleAnimationName
                                        animNames.push(o.toLowerCase());
                                        break;
                                    case 964697786:     // Tag
                                        this.this.fileNames.push(`/resources${area}${o}.dat`);
                                        textures.push(`${area}${0}`);
                                        break;

                                    //Skip Start
                                    case 2957064701:    // PortalTarget
                                    case 4255290973:    // rgnVolumeData
                                    case 669968511:     // rgnCharacteristics
                                    case 3166688232:    // ParentMapTag
                                    case 1768825245:    // tesselation 
                                    case 240466284:     // resolution
                                    case 3106719576:    // StopEvent 
                                    case 948461446:     // PlayEvent
                                    case 466906898:     // rgnRespawnMedCenter
                                    case 3160985587:    // Intensity
                                    case 384379389:     // Range
                                    case 3430452781:    // FxRespawnDelay
                                    case 3629101973:    // TriggerParam
                                    case 273365031:     // Speed
                                    case 2335395941:    // Path
                                    case 713588192:     // spnTagFromEncounter                                        
                                    case 1467655203:    // wtrVertexData
                                    case 113668568:     // DepthTexture
                                    case 3060549674:    // spnPhaseInstanceName
                                    case 773762347:     // name
                                    case 3235228203:    // FxMaxSpawnDistance
                                    case 446782081:     // DiffuseColor
                                    case 2793072227:    // Color
                                    case 3179516067:    // TriggerScript
                                    case 3424594045:    // JointFlags
                                    case 3084732969:    // Deformation_X
                                    case 3084732970:    // Deformation_Y
                                    case 4158591558:    // Divisions
                                    case 3839584892:    // LightningWidth
                                    case 2857627687:    // DeltaRotation3D                                        
                                    case 3522231145:    // LeafTinting
                                    case 4012120889:    // GlossColor
                                    case 489737334:     // LODFactor
                                    case 3402983087:    // BoneName
                                    case 4268140818:    // some type of color
                                    case 3069428699:    // regionEdgeData
                                    case 2766070679:    // DeepColor
                                    case 3671420588:    // FogColor1
                                    case 3671420589:    // FogColor2
                                    case 1620832956:    // FogColorSky
                                        break;
                                    //Skip End

                                    case 999479220:     // Falloff
                                    case 1820631501:    // IlluminationMap
                                    case 1117554570:    // RampMap
                                    case 1412492047:    // SurfaceMap 
                                    case 2545768381:    // NormalMap2
                                    case 2545768380:    // NormalMap1
                                    case 2829380834:    // gfxMovieName
                                    case 3003166540:    // ProjectionTexture                                            
                                    default:
                                        textures.push(o);
                                        break;
                                }
                            }
                            break;
                        case DatTypeId.Data:
                            const datalen = reader.readUint32();
                            reader.offset += datalen;
                            break;
                        default:
                            const curpos = reader.offset; //this is for debugging new formats found
                            const bities = br.ReadBytes(32);
                            reader.offset = curpos;
                            throw new Error("Index out of range");
                    }
                }
            } catch (e) {
                reader.offset = startOffset + propteriesLength;
            }
        }

        for (const fxs of fxspecs) {
            this.fileNames.push(`/resources/art/fx/fxspec/${fxs.toLowerCase().replace("\\", "/").replace("//", "/").replace(".fxspec.fxspec", ".fxspec")}.fxspec`);
        }
        for (const tex in textures) {
            const file = ("/resources/" + tex.toLowerCase()).replace("\\", "/").replace("//", "/").replace(".dds", "");
            this.fileNames.push(`${file}.dds`);
            this.fileNames.push(`${file}.tiny.dds`);
            this.fileNames.push(`${file}.tex`);
        }
    }

    /**
     * Old Area Format Readers
     * @param {Array<string>} lines Lines read from the stream.
     */
    #parseOldAreaDAT(lines) {
        if (!lines) throw new Error(`Expected lines to be string[] but was null: ${lines}`);

        return;
    }

    /**
     * Old Room Format Readers
     * @param {Array<string>} lines Lines read from the stream.
     */
    #parseOldRoomDAT(lines) {
        if (!lines) throw new Error(`Expected lines to be string[] but was null: ${lines}`);

        return;
    }

    /**
     * Old Character Format Readers
     * @param {Array<string>} lines Lines read from the stream.
     * @param {Object.<string, ArchiveEntry>} assets The assets contained in the .tor files.
     */
    #parseOldCharacterDAT(lines, assets) {
        const sectionNames = ["[PARTS]"];

        lines.shift();
        const skeleton_name = lines[0].split("for ").at(-1).trim();
        this.fileNames.push(`/resources/art/dynamic/spec/${skeleton_name}.gr2`);

        const parts = new Map();

        let current = "";

        for (const line of lines) {
            if (sectionNames.includes(line)) {
                current = line;
            } else {
                if (line.includes(':') || line.includes('#')) continue;
                switch (current)
                {
                    case "[PARTS]":
                        if (line == "") continue;
                        const split = line.split('=');
                        if (!Array.from(parts.keys()).includes(split[0])) parts.push(split[0], split[1]);
                        break;
                    default:
                        break;
                }

            }
        }

        if (Array.from(parts.keys()).includes("Model")) {
            this.fileNames.push(`/resources/art/dynamic/spec/${parts["Model"]}`);
            this.fileNames.push(`/resources/art/dynamic/spec/${parts["Model"].replace(".dyc", ".dat")}`);
            this.fileNames.push(`/resources/art/dynamic/spec/${parts["Model"].replace(".dyc", ".mag")}`);
        }

        if (Array.from(parts.keys()).includes("AnimMetadataFqn")) {
            const temp = parts["AnimMetadataFqn"].Split(',');
            for (const item of temp) {
                const tempName = `/resources/${item.replace('\\', '/').replace("//", "/")}`;
                this.fileNames.push(tempName);
                if (Array.from(parts.keys()).includes("AnimNetworkFolder")) {
                    const netfold = `/resources/${parts["AnimNetworkFolder"].replace('\\', '/').replace("//", "/")}`;
                    const file = assets[tempName];
                    if (file != null) {
                        try {
                            const assetStream = file.getReadStream();

                            const doc = new XDocument(xmlJs.xml2json(xmlBuffString(assetStream), {compact: false, spaces: 4}));

                            const aamElement = doc.element("aam");
                            if (aamElement != null) {
                                const actionElement = aamElement.element("actions");
                                if (actionElement != null) {
                                    const actionList = actionElement.elements("action");

                                    for (const action of actionList) {
                                        const actionName = action.attribute("name");
                                        if (action.attribute("actionProvider") != null) {
                                            let actionProvider = action.Attribute("actionProvider") + ".mph";
                                            this.animNames.push(netfold + actionProvider);
                                            this.animNames.push(netfold + actionProvider + ".amx");
                                        }
                                        if (action.attribute("animName") != null) {
                                            const animationName = action.attribute("animName");
                                            if (actionName != animationName) {
                                                animationName += ".jba";
                                                this.animNames.push(netfold + animationName);
                                            }
                                        }
                                        actionName += ".jba";
                                        this.animNames.push(netfold + actionName);
                                    }
                                }

                                const networkElem = aamElement.element("networks");
                                if (networkElem != null) {
                                    const networkList = networkElem.descendants("literal");
                                    for (const network of networkList) {
                                        const fqnName = network.Attribute("fqn").Value;
                                        if (fqnName != null) {
                                            this.animNames.push(netfold + fqnName);
                                            this.animNames.push(netfold + fqnName + ".amx");
                                        }
                                    }
                                }

                                const inputElement = aamElement.element("inputs");
                                if (inputElement != null) {
                                    const inputList = inputElement.elements("input").map(input => input.descendents("value"));
                                    for (const input of inputList) {
                                        const fqnName = input.attribute("name");
                                        if (fqnName != null) {
                                            this.animNames.push(netfold + fqnName);
                                            this.animNames.push(netfold + fqnName + ".amx");
                                            this.animNames.push(netfold + fqnName + ".jba");
                                        }
                                    }
                                }
                            }
                        } catch (e) {
                            this.errors.push("File: " + tempName);
                            this.errors.push(e.message + ":");
                            this.errors.push(e.stack);
                            this.errors.push("");
                        }
                    }
                }
            }
        }

        if (Array.from(parts.keys()).includes("AnimLibraryFqn")) {
            const tempName = "/resources/" + parts["AnimLibraryFqn"];
            this.fileNames.push(tempName.replace('\\', '/').replace("//", "/"));
        }

        if (Array.from(parts.keys()).includes("AnimShareMetadataFqn")) {
            const tempName = "/resources/" + parts["AnimShareMetadataFqn"];
            this.fileNames.push(tempName.replace('\\', '/').replace("//", "/"));
        }

        /** 
         * Disabled - Enable to find new keys that have slashes
         * HashSet<string> animKeys = new HashSet<string>(new string[] { "AnimShareMetadataFqn", "AnimLibraryFqn", "AnimMetadataFqn", "Model", "AnimNetworkFolder" });
         * foreach (var part in parts)
         * {
         *     if (animKeys.includes(part.Key))
         *         continue;
         *     if (part.Value.includes('\\'))
         *     {
         *         Console.WriteLine(part.Key.ToString());
         *     }
         * 
         *     if (part.Value.includes('/'))
         *     {
         *         Console.WriteLine(part.Key.ToString());
         *     }              
         * }
         **/
    }

    writeFile() {
        if (!fs.existsSync(`${this.#dest}\\File_Names`)) fs.mkdirSync(`${this.#dest}\\File_Names`);
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

        if (this.animNames.length > 0) {
            const outputNames = fs.createWriteStream(`${this.#dest}\\File_Names\\${extension}_anim_file_names.txt`, {
                flags: 'a'
            });
            for (const file of this.animNames) {
                outputNames.write(`${file.replace("\\", "/")}\r\n`);
            }
            outputNames.end();
            this.animNames = [];
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

export {DATParser}