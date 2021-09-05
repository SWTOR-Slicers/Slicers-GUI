import { readString } from "../Util.js";

const DomTypes = {
    "1": "Instance",
    "2": "Enum",
    "3": "Field",
    "4": "Class",
    "5": "Association"
}

class DomLoader {
    constructor(type, dv, pos) {
        this.type = DomTypes[type];
        this.dv = dv;
        this.pos = pos;
    }

    load() {
        switch (this.type) {
            case "Instance":
                break;
            case "Enum":
                return new DomEnumLoader(this.type, this.dv, this.pos);
            case "Field":
                break;
            case "Class":
                break;
            case "Association":
                break;
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
        return [out, pos];
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
        const result = res[0];
        this.pos = res[1];

        this.pos = 0x12;
        result.namesOffset = this.dv.getInt16(pos, true);
        this.pos += 2;

        this.pos = 0x18;
        result.numVals = this.dv.getInt16(pos, true);
        this.pos += 2;
        result.valOffset = this.dv.getInt16(pos, true);
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
        this.pos = result.valOffset;
        result.values = [];
        for (let i = 0; i < numVals; i++) {
            let val = dv.getInt16(this.pos, true);
            this.pos += 2;
            result.values.push(val);
        }

        return result;
    }
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