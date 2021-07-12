import { assert } from "@js/Util";

class ACB {
    constructor(buffer) {
        this.audioFiles = [];

        const dv = new DataView(buffer);
        this.numFiles = dv.getUint32(0, !0);
        let pos = 0x8;
        for (let i = 0; i < this.numFiles; i++) {
            let fileName = '';
            {
                let curChar = dv.getUint8(pos++);
                while (curChar !== 0) {
                    fileName += String.fromCharCode(curChar);
                    curChar = dv.getUint8(pos++)
                }
                assert(fileName.endsWith('.wem'), 'Expected .acb entry to end with .wem but it was ' + fileName)
            }
            const size = dv.getUint32(pos, !0);
            pos += 8;
            const offset = dv.getUint32(pos, !0);
            pos += 8;
            const dataview = new DataView(dv.buffer,offset,size);
            const sampleRate = dataview.getUint32(0x18, !0);
            const numSamples = dataview.getUint32(0x2C, !0);
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

export {ACB};