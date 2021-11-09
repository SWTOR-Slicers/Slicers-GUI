import { readString, assert } from "../../Util.js";
export class BNK {
    constructor (buffer) {
        const dv = new DataView(buffer);
        this.pos = 0;
        const totalLength = buffer.byteLength;

        this.sections = {};

        while (this.pos < totalLength) {
            let section = {};
            const type = dv.getUint32(this.pos, true);
            this.pos += 4;
            const sectionName = String.fromCharCode(type & 0xFF) + String.fromCharCode((type & 0xFF00) >> 8) + String.fromCharCode((type & 0xFF0000) >> 16) + String.fromCharCode((type & 0xFF000000) >> 24);
            const sectionLength = dv.getUint32(this.pos, true);
            this.pos += 4;
            const posEnd = this.pos + sectionLength;
            
            switch (sectionName) {
                case "BKHD":
                    section = new BKHD(dv, this.pos, this);
                    break;
                case "DIDX":
                    section = new DIDX(dv, this.pos, sectionLength, this);
                    break;
                case "DATA":
                    section = new DATA(dv, this.pos, this.sections.DIDX, this);
                    break;
                case "ENVS":
                    section = new ENVS(dv, this.pos, sectionLength, this);
                    break;
                case "HIRC":
                    section = new HIRC(dv, this.pos, this);
                    break;
                case "STID":
                    section = new STID(dv, this.pos, this);
                    break;
                case "STMG":
                    section = new STMG(dv, this.pos, this);
                    break;
                default:
                    console.log('BNK section', sectionName, 'not recognized');
                    section = new NANSEC(dv, this.pos, sectionLength, this);
                    break;
            }

            this.pos = posEnd;
            if (this.sections[sectionName]) console.log('BNK section', sectionName, 'already exists and will be overwritten');
            this.sections[sectionName] = section;
        }

        if (this.sections.DIDX) {
            for (let i = 0, il = this.sections.DIDX.files.length; i < il; i++) {
                const file = this.sections.DIDX.files[i];
                file.dv = new DataView(dv.buffer, this.sections.DATA.start + file.offset,file.size);
            }
        }
    }

    setPos(pos) { this.pos = pos; }
}

class BKHD {
    constructor (dv, pos, bnk) {
        this.version = dv.getUint32(pos, true);
        pos += 4;

        this.id = dv.getUint32(pos, true);
        pos += 4;

        bnk.setPos(pos);
    }
}
class DIDX {
    constructor (dv, pos, sectionLength, bnk) {
        this.numFiles = sectionLength / 0xC; //0xC = 12. this is the length of each embeded file's info.
        this.files = [];
        for (let i = 0; i < this.numFiles; i++) {
            const file = {};
            file.id = dv.getUint32(pos, true);
            pos += 4;
            file.offset = dv.getUint32(pos, true);
            pos += 4;
            file.size = dv.getUint32(pos, true);
            pos += 4;
            this.files[i] = file
        }

        bnk.setPos(pos);
    }
}
class DATA {
    constructor (dv, pos, DIDX, bnk) {
        this.start = pos;
        if (DIDX) {
            for (let i = 0; i < DIDX.files.length; i++) {
                const curFile = DIDX.files[i];
                pos = this.start + curFile.offset;
                pos += 22;
                curFile.channels = dv.getUint16(pos, true);
                pos += 2;
                curFile.sampleRate = dv.getUint32(pos, true);
                pos += 4;
                curFile.avgBytesPerSecond = dv.getUint32(pos, true);
                pos += 4;
                pos += 12;
                curFile.sampleCount = dv.getUint32(pos, true);
            }
        }

        bnk.setPos(pos);
    }
}
class ENVS {
    constructor (dv, pos, sectionLength, bnk) {
        this.envs = [];
        this.numEnvs = sectionLength / 28;
        for (let i = 0; i < this.numEnvs; i++) {
            const env = {};
            env.byte1 = dv.getUint8(pos);
            pos++;
            env.byte2 = dv.getUint8(pos);
            pos++;
            env.byte3 = dv.getUint8(pos);
            pos++;
            env.byte4 = dv.getUint8(pos);
            pos++;
            pos += 8;
            env.const4 = dv.getUint32(pos, true);
            pos += 4;
            env.unkFloat = dv.getFloat32(pos, true);
            pos += 4;
            env.unkFloat2 = dv.getFloat32(pos, true);
            pos += 4;
            env.const4b = dv.getUint32(pos, true);
            pos += 4;
            this.envs[i] = env;
        }

        bnk.setPos(pos);
    }
}
class HIRC {
    constructor (dv, pos, bnk) {
        this.objects = {};
        this.switches = {};
        this.states = {};
        const numObjects = dv.getUint32(pos, true);
        pos += 4;
        for (let i = 0; i < numObjects; i++) {
            const obj = {};
            obj.type = dv.getUint8(pos);
            pos++;
            const objLength = dv.getUint32(pos, true);
            pos += 4;
            const posEnd = pos + objLength;
            const objId = dv.getUint32(pos, true);
            pos += 4;
            switch (obj.type) {
                case 1:
                    const numSettings = dv.getUint32(pos++);
                    obj.settings = [];
                    for (let j = 0; j < numSettings; j++) {
                        obj.settings[j] = Object.create(null);
                        obj.settings[j].type = dv.getUint8(pos++);
                    }
                    for (let j = 0; j < numSettings; j++) {
                        obj.settings[j].value = dv.getFloat32(pos, true);
                        pos += 4
                    }
                    break
                case 2:
                    const unknown = dv.getUint32(pos, true);
                    pos += 4;
                    const isStreamed = dv.getUint32(pos, true);
                    pos += 4;
                    const audioId = dv.getUint32(pos, true);
                    pos += 4;
                    const audioSourceId = dv.getUint32(pos, true);
                    pos += 4;
                    if (isStreamed === 0) {
                        const audioOffset = dv.getUint32(pos, true);
                        pos += 4;
                        const audioLength = dv.getUint32(pos, true);
                        pos += 4
                    }
                    break
                case 3:
                    obj.scope = dv.getUint32(pos++);
                    obj.actionType = dv.getUint32(pos++);
                    obj.refId = dv.getUint32(pos, true);
                    pos += 4;
                    const zero = dv.getUint32(pos++);
                    const numParams = dv.getUint32(pos++);
                    obj.params = [];
                    pos += numParams * 5;
                    if (obj.actionType === 0x12) {
                        obj.stateGroupId = dv.getUint32(pos, true);
                        pos += 4;
                        obj.stateId = dv.getUint32(pos, true);
                        pos += 4
                    } else if (obj.actionType === 0x19) {
                        obj.switchGroupId = dv.getUint32(pos, true);
                        pos += 4;
                        obj.switchId = dv.getUint32(pos, true);
                        pos += 4
                    }
                    break
                case 4:
                    obj.actions = [];
                    const numActions = dv.getUint32(pos, true);
                    pos += 4;
                    for (let j = 0; j < numActions; j++) {
                        obj.actions[j] = dv.getUint32(pos, true);
                        pos += 4
                    }
                    break;
                case 10:
                    {
                        pos += read_bnk_soundstruct(dv, pos, obj);
                        const numChildren = dv.getUint32(pos, true);
                        pos += 4;
                        obj.children = [];
                        for (let j = 0; j < numChildren; j++) {
                            obj.children[j] = dv.getUint32(pos, true);
                            pos += 4
                        }
                        break
                    }
                case 11:
                    const unknown1 = dv.getUint32(pos, true);
                    pos += 4;
                    assert(unknown1 === 1, 'Expected unknown1 in music track section to be 1 but it was ' + unknown1);
                    const unknown2 = dv.getUint16(pos, true);
                    pos += 2;
                    assert(unknown2 === 1, 'Expected unknown2 in music track section to be 1 but it was ' + unknown2);
                    const unknown3 = dv.getUint16(pos, true);
                    pos += 2;
                    assert(unknown3 === 4, 'Expected unknown3 in music track section to be 4 but it was ' + unknown3);
                    obj.isStreamed = dv.getUint32(pos, true);
                    pos += 4;
                    obj.audioId = dv.getUint32(pos, true);
                    pos += 4;
                    obj.audioSourceId = dv.getUint32(pos, true);
                    pos += 4;
                    if (obj.isStreamed === 0) {
                        obj.audioOffset = dv.getUint32(pos, true);
                        pos += 4;
                        obj.audioLength = dv.getUint32(pos, true);
                        pos += 4
                    }
                    break
                case 12:
                    {
                        pos += read_bnk_soundstruct(dv, pos, obj);
                        const numChildren = dv.getUint32(pos, true);
                        pos += 4;
                        obj.children = [];
                        for (let i = 0; i < numChildren; i++) {
                            obj.children[i] = dv.getUint32(pos, true);
                            pos += 4
                        }
                        pos += 16;
                        obj.tempo = dv.getFloat32(pos, true);
                        pos += 4;
                        pos += 7;
                        const numTransitions = dv.getUint32(pos, true);
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
                        const switchType = dv.getUint32(pos, true);
                        pos += 4;
                        obj.switchStateId = dv.getUint32(pos, true);
                        pos += 4;
                        obj.defaultSwitchState = dv.getUint32(pos, true);
                        pos += 4;
                        pos++;
                        const numSwitchStates = dv.getUint32(pos, true);
                        pos += 4;
                        obj.switchStates = Object.create(null);
                        for (let i = 0; i < numSwitchStates; i++) {
                            const switchState = dv.getUint32(pos, true);
                            pos += 4;
                            const musicRef = dv.getUint32(pos, true);
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
                    pos += read_bnk_soundstruct(dv, pos, obj);
                    const numSegments = dv.getUint32(pos, true);
                    pos += 4;
                    obj.segments = [];
                    for (let i = 0; i < numSegments; i++) {
                        obj.segments[i] = dv.getUint32(pos, true);
                        pos += 4
                    }
                    break
                default:
            }
            this.objects[objId] = obj;
            pos = posEnd
        }

        bnk.setPos(pos);
    }
}
class STID {
    constructor (dv, pos, bnk) {
        this.const1 = dv.getUint32(pos, true);
        pos += 4;
        this.numSndBnk = dv.getUint32(pos, true);
        pos += 4;
        this.soundbanks = [];
        for (let i = 0; i < this.numSndBnk; i++) {
            const bank = {};
            bank.id = dv.getUint32(pos, true);
            pos += 4;
            let nameLength = dv.getUint8(pos);
            pos++;
            bank.name = readString(dv.buffer, pos, nameLength);
            pos += nameLength;
            this.soundbanks[i] = bank;
        }

        bnk.setPos(pos);
    }
}
class STMG {
    constructor (dv, pos, bnk) {
        this.volumeThreshold = dv.getFloat32(pos, true);
        pos += 4;
        this.maxVoiceInstances = dv.getUint16(pos, true);
        pos += 2;
        this.stateGroups = [];
        let numStateGroups = dv.getUint32(pos, true);
        pos += 4;
        for (let i = 0; i < numStateGroups; i++) {
            const stateGroup = {};
            stateGroup.id = dv.getUint32(pos, true);
            pos += 4;
            stateGroup.defaultTransitionTime = dv.getUint32(pos, true);
            pos += 4;
            stateGroup.customTransitions = [];
            let numCustomTrans = dv.getUint32(pos, true);
            pos += 4;
            for (let j = 0; j < numCustomTrans; j++) {
                const customTrans = {};
                customTrans.fromId = dv.getUint32(pos, true);
                pos += 4;
                customTrans.toId = dv.getUint32(pos, true);
                pos += 4;
                customTrans.transTime = dv.getUint32(pos, true);
                pos += 4;
                stateGroup.customTransitions[j] = customTrans
            }
            this.stateGroups[i] = stateGroup
        }
        this.switchGroups = [];
        let numSwitchGroups = dv.getUint32(pos, true);
        pos += 4;
        for (let i = 0; i < numSwitchGroups; i++) {
            const switchGroup = {};
            switchGroup.id = dv.getUint32(pos, true);
            pos += 4;
            switchGroup.gameParamId = dv.getUint32(pos, true);
            pos += 4;
            switchGroup.points = [];
            let numPoints = dv.getUint32(pos, true);
            pos += 4;
            for (let j = 0; j < numPoints; j++) {
                const point = {};
                point.value = dv.getFloat32(pos, true);
                pos += 4;
                point.switchId = dv.getUint32(pos, true);
                pos += 4;
                point.shape = dv.getUint32(pos, true);
                pos += 4;
                switchGroup.points[j] = point
            }
            this.switchGroups[i] = switchGroup
        }
        this.gameParams = [];
        let numGameParams = dv.getUint32(pos, true);
        pos += 4;
        for (let i = 0; i < numGameParams; i++) {
            const gameParam = {};
            gameParam.id = dv.getUint32(pos, true);
            pos += 4;
            gameParam.defaultValue = dv.getFloat32(pos, true);
            pos += 4;
            this.gameParams[i] = gameParam
        }

        bnk.setPos(pos);
    }
}
class NANSEC {
    constructor (dv, pos, secLen, bnk) {
        let out2 = '';
        for (let i = 0; i < secLen; i++) {
            const byte = dv.getUint32(pos);
            pos++;
            let byteStr = byte.toString(16).toUpperCase();
            if (byte < 16)
                byteStr = '0' + byteStr;
            if (i > 0)
                out2 += ' ';
            out2 += byteStr
        }
        this.hex = out2

        bnk.setPos(pos);
    }
}

function read_bnk_soundstruct(dv, pos, obj) {
    var startPos = pos;
    obj.overrideParentEffects = dv.getUint8(pos++);
    let numEffects = dv.getUint8(pos++);
    if (numEffects > 0) {
        pos++;
        pos += 7 * numEffects
    }
    obj.outputBus = dv.getUint32(pos, !0);
    pos += 4;
    obj.parentId = dv.getUint32(pos, !0);
    pos += 4;
    obj.overrideParentPlaybackPrio = dv.getUint8(pos++);
    obj.offsetPrioAtMaxDistance = dv.getUint8(pos++);
    let numAdditionalParams = dv.getUint8(pos++);
    obj.params = [];
    for (let i = 0; i < numAdditionalParams; i++) {
        obj.params[i] = Object.create(null);
        obj.params[i].type = dv.getUint8(pos++)
    }
    for (let i = 0; i < numAdditionalParams; i++) {
        obj.params[i].value = dv.getFloat32(pos, !0);
        pos += 4
    }
    pos++;
    let hasPositioning = dv.getUint8(pos++);
    if (hasPositioning === 1) {
        obj.positioningType = dv.getUint8(pos++);
        if (obj.positioningType === 0) {
            pos++
        } else {
            obj.positioningSourceType = dv.getUint32(pos, !0);
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
    let hasAuxiliarySends = dv.getUint8(pos++);
    if (hasAuxiliarySends === 1) {
        pos += 16
    }
    let hasPlaybackLimit = dv.getUint8(pos++);
    if (hasAuxiliarySends === 1) {
        pos += 4
    }
    pos += 4;
    let numStateGroups = dv.getUint32(pos, !0);
    pos += 4;
    for (let i = 0; i < numStateGroups; i++) {
        pos += 5;
        let numCustomStates = dv.getUint16(pos, !0);
        pos += 2;
        for (let j = 0; j < numCustomStates; j++) {
            pos += 8
        }
    }
    let numRTCPs = dv.getUint16(pos, !0);
    pos += 2;
    for (let i = 0; i < numRTCPs; i++) {
        pos += 13;
        let numPoints = dv.getUint8(pos++);
        pos++;
        pos += numPoints * 12
    }
    return pos - startPos
}