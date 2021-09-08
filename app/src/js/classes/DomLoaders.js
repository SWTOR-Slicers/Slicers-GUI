import { readString } from "../Util.js";

const DomTypes = {
    "1": "Instance",
    "2": "Enum",
    "3": "Field",
    "4": "Class",
    "5": "Association"
}

const DOM_TYPES = {};
DOM_TYPES.ID = 1;
DOM_TYPES.INTEGER = 2;
DOM_TYPES.BOOLEAN = 3;
DOM_TYPES.FLOAT = 4;
DOM_TYPES.ENUM = 5;
DOM_TYPES.STRING = 6;
DOM_TYPES.LIST = 7;
DOM_TYPES.LOOKUPLIST = 8;
DOM_TYPES.CLASS = 9;
DOM_TYPES.SCRIPTREF = 14;
DOM_TYPES.NODEREF = 15;
DOM_TYPES.VECTOR3 = 18;
DOM_TYPES.TIMEINTERVAL = 20;
DOM_TYPES.DATE = 21;

class DomLoader {
    constructor(type, dv, pos) {
        this.type = DomTypes[type];
        this.dv = dv;
        this.pos = pos;
    }

    getLoader() {
        switch (this.type) {
            case "Instance":
                return new DomInstanceLoader(this.type, this.dv, this.pos);
            case "Enum":
                return new DomEnumLoader(this.type, this.dv, this.pos);
            case "Field":
                return new DomFieldLoader(this.type, this.dv, this.pos);
            case "Class":
                return new DomClassLoader(this.type, this.dv, this.pos);
            case "Association":
                return new DomAssociationLoader(this.type, this.dv, this.pos);
        }
    }

    parseShared(dv, pos) {
        const out = {};
        const offset = pos;

        pos = 0x14;
        const nameOffset = dv.getInt16(pos, true);
        pos += 2;
        const descOffset = dv.getInt16(pos, true);
        pos += 2;

        pos = nameOffset;
        out.Name = readString(dv.buffer, pos);

        pos = descOffset;
        out.Description = readString(dv.buffer, pos);

        pos = offset;
        return out;
    }
}

class DomInstanceLoader extends DomLoader {
    constructor(type, dv, pos) {
        super(type, dv, pos);

        this.Id = null;
        this.type = type;
        this.dv = dv;
        this.pos = pos;
    }

    load() {
        const res = super.parseShared(this.dv, this.pos);
        const result = res;

        this.pos = 0x12;
        result.headerEnd = this.dv.getInt16(this.pos, true);
        this.pos += 2;

        this.pos = 0x18;

        result.ClassId = this.dv.getBigUint64(this.pos, true); // Offset 0x18
        this.pos += 8;

        result.Offset20 = this.dv.getInt32(this.pos, true); // 0x20
        this.pos += 4;

        result.NumGlommed = this.dv.getInt16(this.pos, true); // 0x24
        this.pos += 2;
        result.Offset26 = this.dv.getInt16(this.pos, true); // 0x26
        this.pos += 2;
        result.ObjectSizeInFile = this.dv.getInt32(this.pos, true); // 0x28
        this.pos += 4;
        result.Offset2C = this.dv.getInt16(this.pos, true); // 0x2C
        this.pos += 2;
        result.Offset2E = this.dv.getInt16(this.pos, true); // 0x2E
        this.pos += 2;
        result.Offset30 = new Uint8Array(this.dv.buffer, this.pos, 1)[0];  // 0x30
        this.pos++;
        result.Offset31 = new Uint8Array(this.dv.buffer, this.pos, 1)[0];  // 0x31
        this.pos++;

        this.pos = result.headerEnd;

        if (result.headerEnd != this.dv.byteLength) {
            // Copy the compressed data to the instance
            const compressedLength = this.dv.byteLength - this.pos;
            const buff = this.dv.buffer.slice(this.pos, this.pos+compressedLength);

            result.Checksum = calcAdler32(new Uint8Array(buff));

            result.IsCompressed = true;
            result.DataLength = compressedLength;
            result.DataBuffer = buff;
        } else {
            result.DataLength = 0;
        }

        return result;
    }
}
class DomEnumLoader extends DomLoader {
    constructor(type, dv, pos) {
        super(type, dv, pos);

        this.Id = null;
        this.type = type;
        this.dv = dv;
        this.pos = pos;
    }

    load() {
        const res = super.parseShared(this.dv, this.pos);
        const result = res;

        this.pos = 0x12;
        result.namesOffset = this.dv.getInt16(this.pos, true);
        this.pos += 2;

        this.pos = 0x18;
        result.numVals = this.dv.getInt16(this.pos, true);
        this.pos += 2;
        result.valsOffset = this.dv.getInt16(this.pos, true);
        this.pos += 2;

        // Read in names
        this.pos = result.namesOffset;
        result.names = [];
        for (let i = 0; i < result.numVals; i++) {
            const res2 = readNullString(this.dv.buffer, this.pos);
            const name = res2[0];
            this.pos = res2[1];

            result.names.push(name);
        }

        // Read in values
        this.pos = result.valsOffset;
        result.values = [];
        for (let i = 0; i < result.numVals; i++) {
            let val = this.dv.getInt16(this.pos, true);
            this.pos += 2;
            result.values.push(val);
        }

        return result;
    }
}
class DomFieldLoader extends DomLoader {
    constructor(type, dv, pos) {
        super(type, dv, pos);

        this.Id = null;
        this.type = type;
        this.dv = dv;
        this.pos = pos;
    }

    load() {
        const res = super.parseShared(this.dv, this.pos);
        const result = res;

        this.pos = 0x12;
        result.typeOffset = this.dv.getInt16(this.pos, true);
        this.pos += 2;

        this.pos = result.typeOffset;
        result.gomType = getGomType(this.dv, this.pos);

        return result;
    }
}
class DomClassLoader extends DomLoader {
    constructor(type, dv, pos) {
        super(type, dv, pos);

        this.Id = null;
        this.type = type;
        this.dv = dv;
        this.pos = pos;
    }

    load() {
        const res = super.parseShared(this.dv, this.pos);
        const result = res;

        this.pos = 0x2A;
        result.numComponents = this.dv.getInt16(this.pos, true);
        this.pos += 2;
        result.componentOffset = this.dv.getInt16(this.pos, true);
        this.pos += 2;
        result.numFields = this.dv.getInt16(this.pos, true);
        this.pos += 2;
        result.fieldsOffset = this.dv.getInt16(this.pos, true);
        this.pos += 2;

        if (result.numComponents > 0) {
            this.pos = result.componentOffset;
            result.componentIds = [];
            for (let i = 0; i < result.numComponents; i++) {
                result.componentIds.push(this.dv.getBigInt64(this.pos, true));
                this.pos += 8;
            }
        }

        if (result.numFields > 0) {
            this.pos = result.fieldsOffset;
            result.fieldIds = [];
            for (let i = 0; i < result.numFields; i++) {
                result.fieldIds.push(this.dv.getBigInt64(this.pos, true));
                this.pos += 8;
            }
        }

        return result;
    }
}
class DomAssociationLoader extends DomLoader {
    constructor(type, dv, pos) {
        super(type, dv, pos);

        this.Id = null;
        this.type = type;
        this.dv = dv;
        this.pos = pos;
    }

    load() {
        const res = super.parseShared(this.dv, this.pos);
        const result = res;

        return result;
    }
}

function getGomType(dv, pos) {
    const type = new Uint8Array(dv.buffer, pos, 1)[0];
    pos += 1;
    const res = {}; // fileNodeReadfield(dv, pos, type); // this is bugged
    return res.val;
}

function fileNodeReadfield(dv, pos, type) {
    const out = {};
    out.len = 0;
    out.val = null;
    switch (type) {
    case DOM_TYPES.ID:
        out.val = readVarInt(dv, pos);
        out.len = out.val.len;
        break;
    case DOM_TYPES.INTEGER:
        out.val = readVarInt(dv, pos);
        out.len = out.val.len;
        break;
    case DOM_TYPES.BOOLEAN:
        {
            const bool = dv.getUint8(pos);
            if (bool === 0)
                out.val = !1;
            else if (bool === 1)
                out.val = !0;
            else {
                out.val = !1;
                console.log('Unexpected bool', bool)
            }
            out.len = 1;
            break
        }
    case DOM_TYPES.FLOAT:
        out.val = dv.getFloat32(pos, !0);
        out.len = 4;
        break;
    case DOM_TYPES.ENUM:
        out.val = readVarInt(dv, pos);
        out.len = out.val.len;
        break;
    case DOM_TYPES.STRING:
        {
            const strLength = readVarInt(dv, pos);
            out.val = readString(dv.buffer, pos + strLength.len, strLength.intLo);
            out.len = strLength.len + strLength.intLo;
            break
        }
    case DOM_TYPES.LIST:
        {
            const listType = dv.getUint8(pos);
            const count1V = readVarInt(dv, pos + 1);
            let length = 1 + count1V.len;
            const count1 = count1V.intLo;
            const count2V = readVarInt(dv, pos + length);
            length += count2V.len;
            const count2 = count2V.intLo;
            assert(count1 === count2, 'Expected 1st and 2nd count in list to be identical but they were not (' + count1 + ' != ' + count2 + ')');
            out.val = {};
            out.val.type = listType;
            out.val.list = [];
            for (let i = 0; i < count1; i++) {
                const index = readVarInt(dv, pos + length);
                length += index.len;
                assert(index.intLo === i + 1, 'Expected list index to be identical to iterator but it was ' + index.intLo + ' instead of ' + (i + 1));
                const ele = fileNodeReadfield(dv, pos + length, '0', listType);
                out.val.list[i] = ele.val;
                length += ele.len
            }
            out.len = length;
            break
        }
    case DOM_TYPES.LOOKUPLIST:
        {
            const indexerType = dv.getUint8(pos);
            const listType = dv.getUint8(pos + 1);
            const count1V = readVarInt(dv, pos + 2);
            let length = 2 + count1V.len;
            const count1 = count1V.intLo;
            const count2V = readVarInt(dv, pos + length);
            length += count2V.len;
            const count2 = count2V.intLo;
            assert(count1 === count2, 'Expected 1st and 2nd count in lookuplist to be identical but they were not (' + count1 + ' != ' + count2 + ')');
            out.val = {};
            out.val.indexType = indexerType;
            out.val.type = listType;
            out.val.list = [];
            for (let i = 0; i < count1; i++) {
                if (dv.getUint8(pos + length) === 0xD2)
                    length++;
                out.val.list[i] = {};
                const key = fileNodeReadfield(dv, pos + length, '0', indexerType);
                out.val.list[i].key = key.val;
                length += key.len;
                const ele = fileNodeReadfield(dv, pos + length, '0', listType);
                out.val.list[i].val = ele.val;
                length += ele.len
            }
            out.len = length;
            break
        }
    case DOM_TYPES.CLASS:
        {
            const const7 = dv.getUint8(pos);
            const numFieldsV = readVarInt(dv, pos + 1);
            const numFields = numFieldsV.intLo;
            let length = 1 + numFieldsV.len;
            let prevId = '0';
            out.val = [];
            for (let i = 0; i < numFields; i++) {
                out.val[i] = {};
                const idOffset = readVarInt(dv, pos + length);
                length += idOffset.len;
                prevId = uint64_add(prevId, uint64C(idOffset));
                out.val[i].id = prevId;
                out.val[i].type = dv.getUint8(pos + length);
                length++;
                const obj = fileNodeReadfield(dv, pos + length, prevId, out.val[i].type);
                out.val[i].val = obj.val;
                length += obj.len
            }
            out.len = length;
            break
        }
    case DOM_TYPES.SCRIPTREF:
        {
            out.val = readVarInt(dv, pos);
            out.len = out.val.len;
            break
        }
    case DOM_TYPES.NODEREF:
        {
            out.val = readVarInt(dv, pos);
            out.len = out.val.len;
            break
        }
    case DOM_TYPES.VECTOR3:
        {
            out.val = [dv.getFloat32(pos, !0), dv.getFloat32(pos + 4, !0), dv.getFloat32(pos + 8, !0)];
            out.len = 12;
            break
        }
    case DOM_TYPES.TIMEINTERVAL:
        {
            out.val = readVarInt(dv, pos);
            out.len = out.val.len;
            break
        }
    case DOM_TYPES.DATE:
        {
            out.val = readVarInt(dv, pos);
            out.len = out.val.len;
            break
        }
    default:
        console.log('Warning: Unexpected DOM data type ', type)
    }
    return out
}

function calcAdler32(buffer) {
    let A = 1;
    let B = 0;

    for (let i = 0; i < buffer.length; i++) {
        const D = buffer[i];
        A += D % 65521;
        B += A % 65521;
    }

    return B * 65536 + A;
}

function readNullString(buffer, posIn, length = undefined) {
    let pos = posIn;
    let outString = '';
    let curChar = new Uint8Array(buffer, pos++, 1)[0];
    while (curChar !== 0) {
        outString += String.fromCharCode(curChar);
        curChar = new Uint8Array(buffer, pos++, 1)[0];
    }
    return [outString, pos];
}

export { DomTypes, DomLoader }