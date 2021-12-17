import { Reader } from "../util/FileWrapper.js";

const Decoder = new TextDecoder('utf-8');

class StringTableEntry {
    constructor(id, type1, type2, len, offset) {
        this.id = id;
        this.type1 = type1;
        this.type2 = type2;
        this.len = len;
        this.offset = offset;
        this.val = "";
    }
}

class STB {
    constructor(data) {
        this.strings = [];
        if (Reader.prototype.isPrototypeOf(data)) {
            this.reader = data;
        } else {
            this.reader = new Reader(data);
        }

        // Parse Header. Not important for our purposes
        this.reader.readUint8();
        this.reader.readUint8();
        this.reader.readUint8();

        // Number of strings in this STB file
        this.numStrings = this.reader.readUint32();

        this.#parseSTB();
    }

    #parseSTB() {
        for (let i = 0; i < this.numStrings; i++) {
            const id = this.reader.readUint64();
            const t1 = this.reader.readUint8();
            const t2 = this.reader.readUint8();
            this.reader.readFloat32(); // read speed float. always 00 00 80 3F = 1.0
            const len = this.reader.readUint32();
            const dataOffset = this.reader.readUint32();
            this.reader.readUint32(); // repeat of len

            const entr = new StringTableEntry(id, t1, t2, len, dataOffset);

            entr.val = Decoder.decode(new DataView(data, entr.offset, entr.len));

            this.strings.push(entr);
        }
    }

    getText(id) {
        return this.strings.find((entr) => entr.id == id);
    }
}

export {STB, StringTableEntry};