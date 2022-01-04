import { assert } from "../../Util.js";
import { Reader } from "../util/FileWrapper.js";

export class BNK {
    /**
     * BNK file format
     * @param {Reader} reader file reader
     */
     constructor(reader) {
        reader.seek(0);
        const totalLength = reader.data.byteLength;

        this.sections = {};

        while (reader.offset < totalLength) {
            let section = {};

            const type = reader.readUint32();
            const sectionName = String.fromCharCode(type & 0xFF) + String.fromCharCode((type & 0xFF00) >> 8) + String.fromCharCode((type & 0xFF0000) >> 16) + String.fromCharCode((type & 0xFF000000) >> 24);
            const sectionLength = reader.readUint32();
            
            const posEnd = reader.offset + sectionLength;
            if (posEnd > totalLength) {
                reader.seek(totalLength);
                continue;
            }
            
            switch (sectionName) {
                case "BKHD":
                    section = new BKHD(reader);
                    break;
                case "DIDX":
                    section = new DIDX(reader, sectionLength);
                    break;
                case "DATA":
                    section = new DATA(reader, this.sections.DIDX);
                    break;
                case "ENVS":
                    section = new ENVS(reader, sectionLength);
                    break;
                case "HIRC":
                    section = new HIRC(reader);
                    break;
                case "STID":
                    section = new STID(reader);
                    break;
                case "STMG":
                    section = new STMG(reader);
                    break;
                default:
                    console.log('BNK section', sectionName, 'not recognized');
                    section = new NANSEC(reader, sectionLength);
                    break;
            }

            reader.seek(posEnd);
            if (this.sections[sectionName]) console.log('BNK section', sectionName, 'already exists and will be overwritten');
            this.sections[sectionName] = section;
        }

        if (this.sections.DIDX) {
            for (let i = 0, il = this.sections.DIDX.files.length; i < il; i++) {
                const file = this.sections.DIDX.files[i];
                const offset = this.sections.DATA.start + file.offset;

                file.dv = new Reader(reader.data.slice(offset, offset + file.size));
            }
        }
    }
}

class BKHD {
    /**
     * BKHD class
     * @param {Reader} reader file reader
     */
    constructor (reader) {
        this.version = reader.readUint32();

        this.id = reader.readUint32();
    }
}
class DIDX {
    /**
     * DIDX class
     * @param {Reader} reader file reader
     * @param {number} sectionLength length of this section
     */
    constructor (reader, sectionLength) {
        this.numFiles = sectionLength / 0xC; //0xC = 12. this is the length of each embeded file's info.
        this.files = [];
        for (let i = 0; i < this.numFiles; i++) {
            const file = {};
            file.id = reader.readUint32();
            file.offset = reader.readUint32();
            file.size = reader.readUint32();
            this.files[i] = file
        }
    }
}
class DATA {
    /**
     * DATA class
     * @param {Reader} reader file reader
     * @param {any} DIDX DIDX section
     */
    constructor (reader, DIDX) {
        this.start = reader.offset;
        if (DIDX) {
            for (let i = 0; i < DIDX.files.length; i++) {
                const curFile = DIDX.files[i];
                
                reader.seek(this.start + curFile.offset); // start of data
                reader.seek(22, 1);

                curFile.channels = reader.readUint16();
                curFile.sampleRate = reader.readUint32();
                curFile.avgBytesPerSecond = reader.readUint32();

                reader.seek(12, 1);
                
                curFile.sampleCount = reader.readUint32();
            }
        }
    }
}
class ENVS {
    /**
     * ENVS class
     * @param {Reader} reader file reader
     * @param {number} sectionLength length of this section
     */
    constructor (reader, sectionLength) {
        this.envs = [];
        this.numEnvs = sectionLength / 28;
        for (let i = 0; i < this.numEnvs; i++) {
            const env = {};

            env.byte1 = reader.readUint8();
            env.byte2 = reader.readUint8();
            env.byte3 = reader.readUint8();
            env.byte4 = reader.readUint8();

            reader.seek(8, 1);
            
            env.const4 = reader.readUint32();
            env.unkFloat = reader.readFloat32();
            env.unkFloat2 = reader.readFloat32();
            env.const4b = reader.readUint32();
            
            this.envs[i] = env;
        }
    }
}
class HIRC {
    /**
     * HIRC class
     * @param {Reader} reader file reader
     */
    constructor (reader) {
        this.objects = {};
        this.switches = {};
        this.states = {};

        const numObjects = reader.readUint32();
        
        for (let i = 0; i < numObjects; i++) {
            const obj = {};

            obj.type = reader.readUint8();
            const objLength = reader.readUint32();
            
            const posEnd = reader.offset + objLength;
            const objId = reader.readUint32();
            
            switch (obj.type) {
                case 1:
                    const numSettings = reader.readUint8();
                    obj.settings = [];
                    for (let j = 0; j < numSettings; j++) {
                        obj.settings[j] = Object.create(null);
                        obj.settings[j].type = reader.readUint8();
                    }
                    for (let j = 0; j < numSettings; j++) {
                        obj.settings[j].value = reader.readFloat32();
                    }
                    break
                case 2:
                    obj.unknown = reader.readUint32();
                    obj.isStreamed = reader.readUint32();
                    obj.audioId = reader.readUint32();
                    obj.audioSourceId = reader.readUint32();
                    
                    if (obj.isStreamed === 0) {
                        obj.audioOffset = reader.readUint32();
                        obj.audioLength = reader.readUint32();
                    }
                    break
                case 3:
                    obj.scope = reader.readUint8();
                    obj.actionType = reader.readUint8();
                    obj.refId = reader.readUint32();
                    
                    const zero = reader.readUint8();
                    const numParams = reader.readUint8();
                    obj.params = [];

                    reader.seek(numParams * 5, 1);

                    if (obj.actionType === 0x12) {
                        obj.stateGroupId = reader.readUint32();
                        obj.stateId = reader.readUint32();
                    } else if (obj.actionType === 0x19) {
                        obj.switchGroupId = reader.readUint32();
                        obj.switchId = reader.readUint32();
                    }
                    break
                case 4:
                    obj.actions = [];
                    const numActions = reader.readUint32();
                    
                    for (let j = 0; j < numActions; j++) {
                        obj.actions[j] = reader.readUint32();
                    }
                    break;
                case 10:
                    {
                        read_bnk_soundstruct(reader, obj);
                        const numChildren = reader.readUint32();
                        
                        obj.children = [];
                        for (let j = 0; j < numChildren; j++) {
                            obj.children[j] = reader.readUint32();
                        }
                        break;
                    }
                case 11:
                    obj.unknown1 = reader.readUint32();
                    assert(obj.unknown1 === 1, 'Expected unknown1 in music track section to be 1 but it was ' + unknown1);

                    obj.unknown2 = reader.readUint16();
                    assert(obj.unknown2 === 1, 'Expected unknown2 in music track section to be 1 but it was ' + unknown2);

                    obj.unknown3 = reader.readUint16();
                    assert(obj.unknown3 === 4, 'Expected unknown3 in music track section to be 4 but it was ' + unknown3);

                    obj.isStreamed = reader.readUint32();
                    obj.audioId = reader.readUint32();
                    obj.audioSourceId = reader.readUint32();
                    
                    if (obj.isStreamed === 0) {
                        obj.audioOffset = reader.readUint32();
                        obj.audioLength = reader.readUint32();
                    }
                    break
                case 12:
                    {
                        pread_bnk_soundstruct(reader, obj);
                        const numChildren = reader.readUint32();
                        
                        obj.children = [];
                        for (let i = 0; i < numChildren; i++) {
                            obj.children[i] = reader.readUint32();
                        }
                        reader.seek(16, 1);
                        
                        obj.tempo = reader.readFloat32();
                        reader.seek(7, 1);

                        const numTransitions = reader.readUint32();
                        
                        for (let i = 0; i < numTransitions; i++) {
                            reader.readUint32();
                            reader.readUint32();
                            reader.readUint32();
                            reader.readUint32();
                            reader.readUint32();
                            reader.readUint32();
                            reader.readUint8();
                            reader.readUint32();
                            reader.readUint32();
                            reader.readUint32();
                            reader.readUint32();
                            reader.readUint32();
                            reader.readUint16();
                            reader.readUint8();
                            reader.readUint8();
                            reader.readUint32();
                            reader.readUint32();
                            reader.readUint32();
                            reader.readUint32();
                            reader.readUint32();
                            reader.readUint32();
                            reader.readUint32();
                            reader.readUint8();
                            reader.readUint8()
                        }
                        const switchType = reader.readUint32();
                        obj.switchStateId = reader.readUint32();
                        obj.defaultSwitchState = reader.readUint32();

                        reader.readUint8();

                        const numSwitchStates = reader.readUint32();
                        
                        obj.switchStates = Object.create(null);
                        for (let i = 0; i < numSwitchStates; i++) {
                            const switchState = reader.readUint32();
                            const musicRef = reader.readUint32();
                            
                            obj.switchStates[switchState] = musicRef
                        }
                        if (switchType === 0) {
                            this.switches[obj.switchStateId] = obj
                        } else if (switchType === 1) {
                            this.states[obj.switchStateId] = obj
                        }
                        break
                    }
                case 13:
                    read_bnk_soundstruct(reader, obj);
                    const numSegments = reader.readUint32();
                    
                    obj.segments = [];
                    for (let i = 0; i < numSegments; i++) {
                        obj.segments[i] = reader.readUint32();
                    }
                    break
                default:
            }
            this.objects[objId] = obj;
            reader.seek(posEnd);
        }
    }
}
class STID {
    /**
     * STID class
     * @param {Reader} reader file reader
     */
    constructor (reader) {
        this.const1 = reader.readUint32();
        this.numSndBnk = reader.readUint32();
        
        this.soundbanks = [];
        for (let i = 0; i < this.numSndBnk; i++) {
            const bank = {};
            bank.id = reader.readUint32();
            let nameLength = reader.readUint8();
            bank.name = reader.readString(nameLength);
            this.soundbanks[i] = bank;
        }
    }
}
class STMG {
    /**
     * STMG class
     * @param {Reader} reader file reader
     */
    constructor (reader) {
        this.volumeThreshold = reader.readFloat32();
        this.maxVoiceInstances = reader.readUint16();
        
        this.stateGroups = [];
        let numStateGroups = reader.readUint32();
        
        for (let i = 0; i < numStateGroups; i++) {
            const stateGroup = {};

            stateGroup.id = reader.readUint32();
            stateGroup.defaultTransitionTime = reader.readUint32();
            
            stateGroup.customTransitions = [];
            let numCustomTrans = reader.readUint32();
            
            for (let j = 0; j < numCustomTrans; j++) {
                const customTrans = {};

                customTrans.fromId = reader.readUint32();
                customTrans.toId = reader.readUint32();
                customTrans.transTime = reader.readUint32();
                
                stateGroup.customTransitions[j] = customTrans
            }
            this.stateGroups[i] = stateGroup;
        }
        this.switchGroups = [];
        let numSwitchGroups = reader.readUint32();
        
        for (let i = 0; i < numSwitchGroups; i++) {
            const switchGroup = {};

            switchGroup.id = reader.readUint32();
            switchGroup.gameParamId = reader.readUint32();
            
            switchGroup.points = [];
            let numPoints = reader.readUint32();
            
            for (let j = 0; j < numPoints; j++) {
                const point = {};

                point.value = reader.readFloat32();
                point.switchId = reader.readUint32();
                point.shape = reader.readUint32();
                
                switchGroup.points[j] = point;
            }
            this.switchGroups[i] = switchGroup;
        }
        this.gameParams = [];
        let numGameParams = reader.readUint32();
        
        for (let i = 0; i < numGameParams; i++) {
            const gameParam = {};

            gameParam.id = reader.readUint32();
            gameParam.defaultValue = reader.readFloat32();
            
            this.gameParams[i] = gameParam;
        }
    }
}
class NANSEC {
    /**
     * NAN Section class
     * @param {Reader} reader file reader
     * @param {number} sectionLength length of this section
     */
    constructor (reader, sectionLength) {
        let out2 = '';
        for (let i = 0; i < sectionLength; i++) {
            const byte = reader.readUint8();
            let byteStr = byte.toString(16).toUpperCase();
            if (byte < 16)
                byteStr = '0' + byteStr;
            if (i > 0)
                out2 += ' ';
            out2 += byteStr
        }
        this.hex = out2
    }
}

/**
 * Util method for the HIRC class
 * @param {Reader} reader file reader
 * @param {object} obj
 */
function read_bnk_soundstruct(reader, obj) {
    const startPos = reader.offset;
    obj.overrideParentEffects = reader.readUint8();
    let numEffects = reader.readUint8();
    if (numEffects > 0) {
        reader.readUint8()
        reader.seek(7 * numEffects, 1);
    }

    obj.outputBus = reader.readUint32();
    obj.parentId = reader.readUint32();
    obj.overrideParentPlaybackPrio = reader.readUint8();
    obj.offsetPrioAtMaxDistance = reader.readUint8();
    let numAdditionalParams = reader.readUint8();

    obj.params = [];
    for (let i = 0; i < numAdditionalParams; i++) {
        obj.params[i] = Object.create(null);
        obj.params[i].type = reader.readUint8()
    }
    for (let i = 0; i < numAdditionalParams; i++) {
        obj.params[i].value = reader.readFloat32();
    }
    reader.readUint8()
    let hasPositioning = reader.readUint8();
    if (hasPositioning === 1) {
        obj.positioningType = reader.readUint8();
        if (obj.positioningType === 0) {
            reader.readUint8();
        } else {
            obj.positioningSourceType = reader.readUint32();
            reader.seek(5, 1);
            
            if (obj.positioningSourceType === 2) {
                reader.seek(10, 1);
            } else if (obj.positioningSourceType === 3) {
                reader.readUint8();
            }
        }
    }
    reader.seek(3, 1);
    let hasAuxiliarySends = reader.readUint8();
    if (hasAuxiliarySends === 1) {
        reader.seek(16, 1);
    }
    let hasPlaybackLimit = reader.readUint8();
    if (hasAuxiliarySends === 1) {
        reader.seek(4, 1);
    }
    reader.seek(4, 1);
    let numStateGroups = reader.readUint32();
    for (let i = 0; i < numStateGroups; i++) {
        reader.seek(5, 1);
        let numCustomStates = reader.readUint16();
        for (let j = 0; j < numCustomStates; j++) {
            reader.seek(8, 1);
        }
    }
    let numRTCPs = reader.readUint16();
    for (let i = 0; i < numRTCPs; i++) {
        reader.seek(13, 1);
        let numPoints = reader.readUint8();
        reader.seek(numPoints * 12, 1);
    }
    return reader.offset - startPos
}