import { readString, assert } from "../Util.js";
export class BNK {
    constructor (buffer) {
        this.pos = 0;
        const totalLength = buffer.length;

        this.sections = {};

        while (this.pos < totalLength) {
            let section = {};
            const type = new Uint32Array(buffer, this.pos, 1);
            this.pos += 4;
            const sectionName = String.fromCharCode(type & 0xFF) + String.fromCharCode((type & 0xFF00) >> 8) + String.fromCharCode((type & 0xFF0000) >> 16) + String.fromCharCode((type & 0xFF000000) >> 24);
            const sectionLength = new Uint32Array(buffer, this.pos, 1);
            this.pos += 4;
            const posEnd = this.pos + sectionLength;
            
            switch (sectionName) {
                case "BKHD":
                    section = new BKHD(buffer, this.pos);
                    break;
                case "DIDX":
                    section = new DIDX(buffer, this.pos, sectionLength);
                    break;
                case "DATA":
                    section = new DATA(buffer, this.pos, this.sections.DIDX);
                    break;
                case "ENVS":
                    section = new ENVS(buffer, this.pos, sectionLength);
                    break;
                case "FXPR":
                    console.log('BNK section', sectionName, 'not recognized');
                    section = new NANSEC(buffer, this.pos, sectionLength);
                    //section = new FXPR(buffer, this.pos);
                    break;
                case "HIRC":
                    section = new HIRC(buffer, this.pos);
                    break;
                case "STID":
                    section = new STID(buffer, this.pos);
                    break;
                case "STMG":
                    section = new STMG(buffer, this.pos);
                    break;
                default:
                    console.log('BNK section', sectionName, 'not recognized');
                    section = new NANSEC(buffer, this.pos, sectionLength);
                    break;
            }

            this.pos = posEnd;
            if (this.sections[sectionName]) console.log('BNK section', sectionName, 'already exists and will be overwritten');
            this.sections[sectionName] = section;
        }

        //TODO: figure out how to utilize this info
        if (this.sections.DIDX) {
            const files = [];
            for (let i = 0, il = this.sections.DIDX.files.length; i < il; i++) {
                const file = this.sections.DIDX.files[i];
                file.dv = new DataView(dv.buffer, this.sections.DATA.start + file.offset,file.size);
                files.push(file);
            }
            console.log(files);
        }
    }

    setPos(pos) { this.pos = pos; }
}

class BKHD extends BNK {
    constructor (buffer, pos) {
        this.version = new Uint32Array(buffer, pos, 1);
        pos += 4;

        this.id = new Uint32Array(buffer, pos, 1);
        pos += 4;

        super.setPos(pos);
    }
}
class DIDX extends BNK {
    constructor (buffer, pos, sectionLength) {
        this.numFiles = sectionLength / 0xC; //0xC = 12. this is the length of each embeded file's info.
        this.files = [];
        for (let i = 0; i < this.numFiles; i++) {
            const file = {};
            file.id = new Uint32Array(buffer, pos, 1);
            pos += 4;
            file.offset = new Uint32Array(buffer, pos, 1);
            pos += 4;
            file.size = new Uint32Array(buffer, pos, 1);
            pos += 4;
            this.files[i] = file
        }

        super.setPos(pos);
    }
}
class DATA extends BNK {
    constructor (buffer, pos, DIDX) {
        this.start = pos;
        if (DIDX) {
            for (let i = 0; i < DIDX.files.length; i++) {
                const curFile = DIDX.files[i];
                pos = this.start + curFile.offset;
                pos += 22;
                curFile.channels = new Uint16Array(buffer, pos, 1);
                pos += 2;
                curFile.sampleRate = new Uint32Array(buffer, pos, 1);
                pos += 4;
                curFile.avgBytesPerSecond = new Uint32Array(buffer, pos, 1);
                pos += 4;
                pos += 12;
                curFile.sampleCount = new Uint32Array(buffer, pos, 1);
            }
        }

        super.setPos(pos);
    }
}
class ENVS extends BNK {
    constructor (buffer, pos, sectionLength) {
        this.envs = [];
        this.numEnvs = sectionLength / 28;
        for (let i = 0; i < this.numEnvs; i++) {
            const env = {};
            env.byte1 = new Uint8Array(buffer, pos, 1);
            pos++;
            env.byte2 = new Uint8Array(buffer, pos, 1);
            pos++;
            env.byte3 = new Uint8Array(buffer, pos, 1);
            pos++;
            env.byte4 = new Uint8Array(buffer, pos, 1);
            pos++;
            pos += 8;
            env.const4 = new Uint32Array(buffer, pos, 1);
            pos += 4;
            env.unkFloat = new Float32Array(buffer, pos, 1);
            pos += 4;
            env.unkFloat2 = new Float32Array(buffer, pos, 1);
            pos += 4;
            env.const4b = new Uint32Array(buffer, pos, 1);
            pos += 4;
            this.envs[i] = env;
        }

        super.setPos(pos);
    }
}
class FXPR extends BNK {
    constructor (buffer, pos) {
        //this spec if unkown and not used by swtor. merely here for completeness
        super.setPos(pos);
    }
}
class HIRC extends BNK {
    constructor (buffer, pos) {
        this.objects = {};
        this.switches = {};
        this.states = {};
        const numObjects = new Uint32Array(buffer, pos, 1);
        pos += 4;
        for (let i = 0; i < numObjects; i++) {
            const obj = {};
            obj.type = new Uint8Array(buffer, pos, 1);
            pos++;
            const objLength = new Uint32Array(buffer, pos, 1);
            pos += 4;
            const posEnd = pos + objLength;
            const objId = new Uint32Array(buffer, pos, 1);
            pos += 4;
            switch (obj.type) {
                case 1:
                    const numSettings = new Uint8Array(buffer, pos++, 1);
                    obj.settings = [];
                    for (let j = 0; j < numSettings; j++) {
                        obj.settings[j] = Object.create(null);
                        obj.settings[j].type = new Uint8Array(buffer, pos++, 1)
                    }
                    for (let j = 0; j < numSettings; j++) {
                        obj.settings[j].value = new Float32Array(buffer, pos, 1)
                        pos += 4
                    }
                    break
                case 2:
                    const unknown = new Uint32Array(buffer, pos, 1);
                    pos += 4;
                    const isStreamed = new Uint32Array(buffer, pos, 1);
                    pos += 4;
                    const audioId = new Uint32Array(buffer, pos, 1);
                    pos += 4;
                    const audioSourceId = new Uint32Array(buffer, pos, 1);
                    pos += 4;
                    if (isStreamed === 0) {
                        const audioOffset = new Uint32Array(buffer, pos, 1);
                        pos += 4;
                        const audioLength = new Uint32Array(buffer, pos, 1);
                        pos += 4
                    }
                    break
                case 3:
                    obj.scope = new Uint8Array(buffer, pos++, 1);
                    obj.actionType = new Uint8Array(buffer, pos++, 1);
                    obj.refId = new Uint32Array(buffer, pos, 1);
                    pos += 4;
                    const zero = new Uint8Array(buffer, pos++, 1);
                    const numParams = new Uint8Array(buffer, pos++, 1);
                    obj.params = [];
                    pos += numParams * 5;
                    if (obj.actionType === 0x12) {
                        obj.stateGroupId = new Uint32Array(buffer, pos, 1);
                        pos += 4;
                        obj.stateId = new Uint32Array(buffer, pos, 1);
                        pos += 4
                    } else if (obj.actionType === 0x19) {
                        obj.switchGroupId = new Uint32Array(buffer, pos, 1);
                        pos += 4;
                        obj.switchId = new Uint32Array(buffer, pos, 1);
                        pos += 4
                    }
                    break
                case 4:
                    obj.actions = [];
                    const numActions = new Uint32Array(buffer, pos, 1);
                    pos += 4;
                    for (let j = 0; j < numActions; j++) {
                        obj.actions[j] = new Uint32Array(buffer, pos, 1);
                        pos += 4
                    }
                    break;
                case 10:
                    {
                        pos += file_bnk_read_soundstruct(dv, pos, obj);
                        const numChildren = new Uint32Array(buffer, pos, 1);
                        pos += 4;
                        obj.children = [];
                        for (let j = 0; j < numChildren; j++) {
                            obj.children[j] = new Uint32Array(buffer, pos, 1);
                            pos += 4
                        }
                        break
                    }
                case 11:
                    const unknown1 = new Uint32Array(buffer, pos, 1);
                    pos += 4;
                    assert(unknown1 === 1, 'Expected unknown1 in music track section to be 1 but it was ' + unknown1);
                    const unknown2 = new Uint16Array(buffer, pos, 1);
                    pos += 2;
                    assert(unknown2 === 1, 'Expected unknown2 in music track section to be 1 but it was ' + unknown2);
                    const unknown3 = new Uint16Array(buffer, pos, 1);
                    pos += 2;
                    assert(unknown3 === 4, 'Expected unknown3 in music track section to be 4 but it was ' + unknown3);
                    obj.isStreamed = new Uint32Array(buffer, pos, 1);
                    pos += 4;
                    obj.audioId = new Uint32Array(buffer, pos, 1);
                    pos += 4;
                    obj.audioSourceId = new Uint32Array(buffer, pos, 1);
                    pos += 4;
                    if (obj.isStreamed === 0) {
                        obj.audioOffset = new Uint32Array(buffer, pos, 1);
                        pos += 4;
                        obj.audioLength = new Uint32Array(buffer, pos, 1);
                        pos += 4
                    }
                    break
                case 12:
                    {
                        pos += file_bnk_read_soundstruct(buffer, pos, obj);
                        const numChildren = new Uint32Array(buffer, pos, 1);
                        pos += 4;
                        obj.children = [];
                        for (let i = 0; i < numChildren; i++) {
                            obj.children[i] = new Uint32Array(buffer, pos, 1);
                            pos += 4
                        }
                        pos += 16;
                        obj.tempo = new Float32Array(buffer, pos, 1)
                        pos += 4;
                        pos += 7;
                        const numTransitions = new Uint32Array(buffer, pos, 1);
                        pos += 4;
                        for (let i = 0; i < numTransitions; i++) {
                            pos += 4;
                            pos += 4;
                            pos += 4;
                            pos += 4;
                            pos += 4;
                            pos += 4;
                            pos++;
                            pos += 4;
                            pos += 4;
                            pos += 4;
                            pos += 4;
                            pos += 4;
                            pos += 2;
                            pos++;
                            pos++;
                            pos += 4;
                            pos += 4;
                            pos += 4;
                            pos += 4;
                            pos += 4;
                            pos += 4;
                            pos += 4;
                            pos++;
                            pos++
                        }
                        const switchType = new Uint32Array(buffer, pos, 1);
                        pos += 4;
                        obj.switchStateId = new Uint32Array(buffer, pos, 1);
                        pos += 4;
                        obj.defaultSwitchState = new Uint32Array(buffer, pos, 1);
                        pos += 4;
                        pos++;
                        const numSwitchStates = new Uint32Array(buffer, pos, 1);
                        pos += 4;
                        obj.switchStates = Object.create(null);
                        for (let i = 0; i < numSwitchStates; i++) {
                            const switchState = new Uint32Array(buffer, pos, 1);
                            pos += 4;
                            const musicRef = new Uint32Array(buffer, pos, 1);
                            pos += 4;
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
                    pos += file_bnk_read_soundstruct(buffer, pos, obj);
                    const numSegments = new Uint32Array(buffer, pos, 1);
                    pos += 4;
                    obj.segments = [];
                    for (let i = 0; i < numSegments; i++) {
                        obj.segments[i] = new Uint32Array(buffer, pos, 1);
                        pos += 4
                    }
                    break
                default:
            }
            this.objects[objId] = obj;
            pos = posEnd
        }

        super.setPos(pos);
    }
}
class STID extends BNK {
    constructor (buffer, pos) {
        this.const1 = new Uint32Array(buffer, pos, 1);
        pos += 4;
        this.numSndBnk = new Uint32Array(buffer, pos, 1);
        pos += 4;
        this.soundbanks = [];
        for (let i = 0; i < this.numSndBnk; i++) {
            const bank = {};
            bank.id = new Uint32Array(buffer, pos, 1);
            pos += 4;
            let nameLength = new Uint8Array(buffer, pos, 1);
            pos++;
            bank.name = readString(buffer, pos, nameLength);
            pos += nameLength;
            this.soundbanks[i] = bank;
        }

        super.setPos(pos);
    }
}
class STMG extends BNK {
    constructor (buffer, pos) {
        this.volumeThreshold = new Float32Array(buffer, pos, 1);
        pos += 4;
        this.maxVoiceInstances = new Uint16Array(buffer, pos, 1);
        pos += 2;
        this.stateGroups = [];
        let numStateGroups = new Uint32Array(buffer, pos, 1);
        pos += 4;
        for (let i = 0; i < numStateGroups; i++) {
            const stateGroup = {};
            stateGroup.id = new Uint32Array(buffer, pos, 1);
            pos += 4;
            stateGroup.defaultTransitionTime = new Uint32Array(buffer, pos, 1);
            pos += 4;
            stateGroup.customTransitions = [];
            let numCustomTrans = new Uint32Array(buffer, pos, 1);
            pos += 4;
            for (let j = 0; j < numCustomTrans; j++) {
                const customTrans = {};
                customTrans.fromId = new Uint32Array(buffer, pos, 1);
                pos += 4;
                customTrans.toId = new Uint32Array(buffer, pos, 1);
                pos += 4;
                customTrans.transTime = new Uint32Array(buffer, pos, 1);
                pos += 4;
                stateGroup.customTransitions[j] = customTrans
            }
            this.stateGroups[i] = stateGroup
        }
        this.switchGroups = [];
        let numSwitchGroups = new Uint32Array(buffer, pos, 1);
        pos += 4;
        for (let i = 0; i < numSwitchGroups; i++) {
            const switchGroup = {};
            switchGroup.id = new Uint32Array(buffer, pos, 1);
            pos += 4;
            switchGroup.gameParamId = new Uint32Array(buffer, pos, 1);
            pos += 4;
            switchGroup.points = [];
            let numPoints = new Uint32Array(buffer, pos, 1);
            pos += 4;
            for (let j = 0; j < numPoints; j++) {
                const point = {};
                point.value = new Float32Array(buffer, pos, 1);
                pos += 4;
                point.switchId = new Uint32Array(buffer, pos, 1);
                pos += 4;
                point.shape = new Uint32Array(buffer, pos, 1);
                pos += 4;
                switchGroup.points[j] = point
            }
            this.switchGroups[i] = switchGroup
        }
        this.gameParams = [];
        let numGameParams = new Uint32Array(buffer, pos, 1);
        pos += 4;
        for (let i = 0; i < numGameParams; i++) {
            const gameParam = {};
            gameParam.id = new Uint32Array(buffer, pos, 1);
            pos += 4;
            gameParam.defaultValue = new Float32Array(buffer, pos, 1);
            pos += 4;
            this.gameParams[i] = gameParam
        }

        super.setPos(pos);
    }
}
class NANSEC extends BNK {
    constructor (buffer, pos, secLen) {
        let out2 = '';
        for (let i = 0; i < secLen; i++) {
            const byte = new Uint8Array(buffer, pos, 1);
            pos++;
            let byteStr = byte.toString(16).toUpperCase();
            if (byte < 16)
                byteStr = '0' + byteStr;
            if (i > 0)
                out2 += ' ';
            out2 += byteStr
        }
        this.hex = out2

        super.setPos(pos);
    }
}

function file_bnk_read_soundstruct(buffer, pos, obj) {
    var startPos = pos;
    obj.overrideParentEffects = new Uint8Array(buffer, pos++, 1);
    let numEffects = new Uint8Array(buffer, pos++, 1);
    if (numEffects > 0) {
        pos++;
        pos += 7 * numEffects
    }
    obj.outputBus = new Uint32Array(buffer, pos, 1);
    pos += 4;
    obj.parentId = new Uint32Array(buffer, pos, 1);
    pos += 4;
    obj.overrideParentPlaybackPrio = new Uint8Array(buffer, pos++, 1);
    obj.offsetPrioAtMaxDistance = new Uint8Array(buffer, pos++, 1);
    let numAdditionalParams = new Uint8Array(buffer, pos++, 1);
    obj.params = [];
    for (let i = 0; i < numAdditionalParams; i++) {
        obj.params[i] = Object.create(null);
        obj.params[i].type = new Uint8Array(buffer, pos++, 1)
    }
    for (let i = 0; i < numAdditionalParams; i++) {
        obj.params[i].value = new Float32Array(buffer, pos, 1)
        pos += 4
    }
    pos++;
    let hasPositioning = new Uint8Array(buffer, pos++, 1);
    if (hasPositioning === 1) {
        obj.positioningType = new Uint8Array(buffer, pos++, 1);
        if (obj.positioningType === 0) {
            pos++
        } else {
            obj.positioningSourceType = new Uint32Array(buffer, pos, 1);
            pos += 4;
            pos += 5;
            if (obj.positioningSourceType === 2) {
                pos += 10
            } else if (obj.positioningSourceType === 3) {
                pos++
            }
        }
    }
    pos += 3;
    let hasAuxiliarySends = new Uint8Array(buffer, pos++, 1);
    if (hasAuxiliarySends === 1) {
        pos += 16
    }
    let hasPlaybackLimit = new Uint8Array(buffer, pos++, 1);
    if (hasAuxiliarySends === 1) {
        pos += 4
    }
    pos += 4;
    let numStateGroups = new Uint32Array(buffer, pos, 1);
    pos += 4;
    for (let i = 0; i < numStateGroups; i++) {
        pos += 5;
        let numCustomStates = new Uint16Array(buffer, pos, 1);
        pos += 2;
        for (let j = 0; j < numCustomStates; j++) {
            pos += 8
        }
    }
    let numRTCPs = new Uint16Array(buffer, pos, 1);
    pos += 2;
    for (let i = 0; i < numRTCPs; i++) {
        pos += 13;
        let numPoints = new Uint8Array(buffer, pos++, 1);
        pos++;
        pos += numPoints * 12
    }
    return pos - startPos;
}