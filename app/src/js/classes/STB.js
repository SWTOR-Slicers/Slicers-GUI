import { assert } from "../Util.js";

const Decoder = new TextDecoder('utf-8');

class STB {
    constructor(dv) {
        const numStrings = dv.getUint32(3, !0);
        const strings = [];
        for (let i = 0, pos = 7; i < numStrings; i++) {
            const curString = {};
            curString.id = dv.getUint32(pos, !0);
            pos += 4;
            curString.id2 = dv.getUint32(pos, !0);
            pos += 4;
            curString.bitflag = dv.getUint16(pos, !0);
            pos += 2;
            const version = dv.getFloat32(pos, !0);
            pos += 4;
            assert(version === 1.0, 'Expected version 1.0 but saw ' + version);
            curString.len = dv.getUint32(pos, !0);
            pos += 4;
            curString.offset = dv.getUint32(pos, !0);
            pos += 4;
            const len2 = dv.getUint32(pos, !0);
            pos += 4;
            assert(len2 === curString.len, 'Expected both string lengths to match in stb file but they didn\'t.');
            strings[i] = curString
        }
        for (let i = 0, buffer = dv.buffer; i < numStrings; i++) {
            const curString = strings[i];
            curString.name = Decoder.decode(new DataView(buffer,curString.offset,curString.len))
        }
        this.strings = strings;
    }
}

export {STB};