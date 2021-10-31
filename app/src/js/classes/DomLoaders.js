import { readVarInt, uint64_add, uint64C, assert, readString } from "../Util.js";

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

        // Read in names
        this.pos = result.namesOffset;
        result.values = [];
        for (let i = 0; i < result.numVals; i++) {
            const res2 = readNullString(this.dv.buffer, this.pos);
            const val = res2[0];
            this.pos = res2[1];

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
        result.gomType = new Uint8Array(this.dv.buffer, this.pos, 1)[0];
        this.pos++;

        if (result.gomType == 5) { result.data = this.dv.getBigUint64(this.pos, true); }

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