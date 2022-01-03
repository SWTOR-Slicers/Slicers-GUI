import { assert } from "../../Util.js";
import { Reader } from "../util/FileWrapper.js";

class ACB {
    /**
     * ACB file format
     * @param {Reader} reader file reader
     */
    constructor(reader) {
        this.audioFiles = [];

        this.numFiles = reader.readUint32();
        reader.seek(0x8);

        for (let i = 0; i < this.numFiles; i++) {
            let fileName = reader.readString();
            assert(fileName.endsWith('.wem'), 'Expected .acb entry to end with .wem but it was ' + fileName);
            
            const size = reader.readUint32();
            reader.readUint32(); // idk why we skip 4

            const offset = reader.readUint32();
            reader.readUint32(); // idk why we skip 4

            const r2 = new Reader(reader.data.slice(offset, offset + size));
            r2.seek(0x18);
            const sampleRate = reader.readUint32();
            r2.seek(0x2C);
            const numSamples = reader.readUint32();
            const duration = numSamples / sampleRate;
            
            this.audioFiles[i] = {
                name: fileName,
                size,
                dataview,
                duration,
            }
        }
    }
}

export { ACB };