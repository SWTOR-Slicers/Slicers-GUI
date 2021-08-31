import { codebooks } from "./classes/util/Cookbooks.js";

const fs = require("fs");
/**
 * Shuffles a list using the modern Fisher-Yates shuffle algorithm
 * @param  {Array} a Array to be shuffled and returned.
 */
export function shuffle(a) {
    for(let i = a.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        let x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
}
/**
 * Capitalizes and returns a string;
 * @param  {String} s .
 */
export function capitalize(s) {
    return s.substr(0, 1).toUpperCase() + s.slice(1);
}
/**
 * Converts the DataView of a .wem file to a .ogg represented by a buffer.
 * @param  {DataView} dv DataView representing the .wem file.
 */
export function ww2ogg(dv) {
    var pos = 0;
    var reader = new BitReader(dv);
    var writer = new BitWriter();
    var ilog = function(n) {
        var out = 0;
        while (n > 0) {
            out++;
            n >>= 1
        }
        return out
    };
    let header = dv.getUint32(pos, !0);
    pos += 4;
    if (header != 0x46464952) {
        alert('Wrong header, not a .wem file!');
        return null
    }
    var fileSize = 8 + dv.getUint32(pos, !0);
    pos += 4;
    assert(fileSize === dv.byteLength, 'Expected file size field to match file size but it was ' + fileSize + ' instead of ' + dv.byteLength);
    var waveHeader = dv.getUint32(pos, !0);
    pos += 4;
    assert(waveHeader === 0x45564157, 'Expected WAVE but read ' + waveHeader);
    var channels, sampleRate, avgBytesPerSecond, sampleCount;
    var setupPacketOffset, firstAudioPacketOffset;
    var blocksize0pow, blocksize1pow;
    while (pos < fileSize) {
        let chunkType = dv.getUint32(pos, !0);
        pos += 4;
        let chunkSize = dv.getUint32(pos, !0);
        pos += 4;
        switch (chunkType) {
        case 0x20746D66:
            {
                assert(chunkSize === 0x42, 'fmt has unexpected chunk size ' + chunkSize);
                let codexId = dv.getUint16(pos, !0);
                pos += 2;
                assert(codexId === 0xFFFF, 'Bad codex id ' + codexId);
                channels = dv.getUint16(pos, !0);
                pos += 2;
                sampleRate = dv.getUint32(pos, !0);
                pos += 4;
                avgBytesPerSecond = dv.getUint32(pos, !0);
                pos += 4;
                let blockAlign = dv.getUint16(pos, !0);
                pos += 2;
                assert(blockAlign === 0, 'Bad block align ' + blockAlign);
                let bps = dv.getUint16(pos, !0);
                pos += 2;
                assert(bps === 0, 'Expected 0 bps but it is ' + bps);
                let vorbSize = dv.getUint16(pos, !0);
                pos += 2;
                assert(chunkSize - 0x12 === vorbSize, 'Expected vorb size to fill the remainder of fmt section but it was ' + vorbSize + ' instead of ' + (chunkSize - 0x12));
                assert(vorbSize - 6 == 0x2A, 'Expected vorb section to be 0x2A but it was ' + (vorbSize - 6));
                let extraUnknown = dv.getUint16(pos, !0);
                pos += 2;
                let subType = dv.getUint32(pos, !0);
                pos += 4;
                sampleCount = dv.getUint32(pos, !0);
                pos += 4;
                let modSignal = dv.getUint32(pos, !0);
                pos += 4;
                pos += 8;
                setupPacketOffset = dv.getUint32(pos, !0);
                pos += 4;
                firstAudioPacketOffset = dv.getUint32(pos, !0);
                pos += 4;
                pos += 12;
                var uid = dv.getUint32(pos, !0);
                pos += 4;
                blocksize0pow = dv.getUint8(pos);
                pos++;
                blocksize1pow = dv.getUint8(pos);
                pos++;
                break
            }
        case 0x20657563:
            pos += chunkSize;
            break;
        case 0x5453494C:
            pos += chunkSize;
            break;
        case 0x61746164:
            {
                var chunkEnd = pos + chunkSize;
                {
                    writer.w(1, 8);
                    writer.w(0x62726F76, 32);
                    writer.w(0x7369, 16);
                    writer.w(0, 32);
                    writer.w(channels, 8);
                    writer.w(sampleRate, 32);
                    writer.w(0, 32);
                    writer.w(avgBytesPerSecond << 3, 32);
                    writer.w(0, 32);
                    writer.w(blocksize0pow | (blocksize1pow << 4), 8);
                    writer.w(1, 8);
                    writer.flushPage(0)
                }
                {
                    writer.w(3, 8);
                    writer.w(0x62726F76, 32);
                    writer.w(0x7369, 16);
                    var vendor = 'Jedipedia File Reader';
                    writer.w(vendor.length, 32);
                    for (let i = 0; i < vendor.length; i++) {
                        writer.w(vendor.charCodeAt(i), 8)
                    }
                    writer.w(0, 32);
                    writer.w(1, 8);
                    writer.flushPage(0)
                }
                var mode_blockflag, mode_bits;
                {
                    writer.w(5, 8);
                    writer.w(0x62726F76, 32);
                    writer.w(0x7369, 16);
                    reader.pos = (pos + setupPacketOffset) << 3;
                    var packetSize = reader.r(16);
                    var numCodebooksMinus1 = reader.r(8);
                    writer.w(numCodebooksMinus1, 8);
                    for (let i = 0; i <= numCodebooksMinus1; i++) {
                        var codebookId = reader.r(10);
                        var code = codebooks[codebookId];
                        if (!code)
                            console.log('Error: Codebook', codebookId, 'not found!');
                        for (let j = 1; j < code.length - 1; j++) {
                            writer.w(code[j], 8)
                        }
                        if (code[0] === 0) {
                            writer.w(code[code.length - 1], 8)
                        } else {
                            writer.w(code[code.length - 1], code[0])
                        }
                    }
                    writer.w(0, 6);
                    writer.w(0, 16);
                    var floorCountMinus1 = reader.r(6);
                    writer.w(floorCountMinus1, 6);
                    for (var i = 0; i <= floorCountMinus1; i++) {
                        writer.w(1, 16);
                        var partitionsCount = reader.r(5);
                        writer.w(partitionsCount, 5);
                        var partitions = [];
                        var maxClass = 0;
                        for (var j = 0; j < partitionsCount; j++) {
                            partitions[j] = reader.r(4);
                            writer.w(partitions[j], 4);
                            if (partitions[j] > maxClass)
                                maxClass = partitions[j]
                        }
                        var classDimensions = [];
                        for (let j = 0; j <= maxClass; j++) {
                            var classDimensionMinus1 = reader.r(3);
                            writer.w(classDimensionMinus1, 3);
                            classDimensions[j] = classDimensionMinus1 + 1;
                            var subClasses = reader.r(2);
                            writer.w(subClasses, 2);
                            if (subClasses > 0) {
                                var masterbook = reader.r(8);
                                writer.w(masterbook, 8);
                                assert(masterbook < numCodebooksMinus1 + 1)
                            }
                            for (var k = 0; k < (1 << subClasses); k++) {
                                var subclassBookPlus1 = reader.r(8);
                                writer.w(subclassBookPlus1, 8);
                                assert(subclassBookPlus1 - 1 < numCodebooksMinus1 + 1)
                            }
                        }
                        writer.w(reader.r(2), 2);
                        var rangeBits = reader.r(4);
                        writer.w(rangeBits, 4);
                        for (let j = 0; j < partitionsCount; j++) {
                            for (let k = 0; k < classDimensions[partitions[j]]; k++) {
                                writer.w(reader.r(rangeBits), rangeBits)
                            }
                        }
                    }
                    var residueCountMinus1 = reader.r(6);
                    writer.w(residueCountMinus1, 6);
                    for (let i = 0; i <= residueCountMinus1; i++) {
                        var type = reader.r(2);
                        writer.w(type, 16);
                        assert(type <= 2);
                        writer.w(reader.r(24), 24);
                        writer.w(reader.r(24), 24);
                        writer.w(reader.r(24), 24);
                        var classificationsMinus1 = reader.r(6);
                        writer.w(classificationsMinus1, 6);
                        var classBook = reader.r(8);
                        writer.w(classBook, 8);
                        assert(classBook <= numCodebooksMinus1);
                        var cascade = [];
                        for (let j = 0; j <= classificationsMinus1; j++) {
                            var lowBits = reader.r(3);
                            writer.w(lowBits, 3);
                            var bitFlag = reader.r(1);
                            writer.w(bitFlag, 1);
                            var highBits = 0;
                            if (bitFlag == 1) {
                                highBits = reader.r(5);
                                writer.w(highBits, 5)
                            }
                            cascade[j] = (highBits << 3) + lowBits
                        }
                        for (let j = 0; j <= classificationsMinus1; j++) {
                            for (let k = 0; k < 8; k++) {
                                if ((cascade[j] & (1 << k)) !== 0) {
                                    let residueBook = reader.r(8);
                                    writer.w(residueBook, 8);
                                    assert(residueBook <= numCodebooksMinus1)
                                }
                            }
                        }
                    }
                    var mappingCountMinus1 = reader.r(6);
                    writer.w(mappingCountMinus1, 6);
                    for (let i = 0; i <= mappingCountMinus1; i++) {
                        writer.w(0, 16);
                        var submapsFlag = reader.r(1);
                        writer.w(submapsFlag, 1);
                        var numSubmaps = 1;
                        if (submapsFlag == 1) {
                            var submapsMinus1 = reader.r(4);
                            writer.w(submapsMinus1, 4);
                            numSubmaps = submapsMinus1 + 1
                        }
                        var squarePolarFlag = reader.r(1);
                        writer.w(squarePolarFlag, 1);
                        if (squarePolarFlag == 1) {
                            var couplingStepsMinus1 = reader.r(8);
                            writer.w(couplingStepsMinus1, 8);
                            var bitSize = ilog(channels - 1);
                            for (let j = 0; j <= couplingStepsMinus1; j++) {
                                var magnitude = reader.r(bitSize);
                                writer.w(magnitude, bitSize);
                                var angle = reader.r(bitSize);
                                writer.w(angle, bitSize);
                                assert(angle != magnitude && magnitude < channels && angle < channels)
                            }
                        }
                        var mappingReserved = reader.r(2);
                        writer.w(mappingReserved, 2);
                        assert(mappingReserved === 0);
                        if (numSubmaps > 1) {
                            for (let j = 0; j < channels; j++) {
                                var mappingMux = reader.r(4);
                                writer.w(mappingMux, 4);
                                assert(mappingMux < numSubmaps)
                            }
                        }
                        for (let j = 0; j < numSubmaps; j++) {
                            writer.w(reader.r(8), 8);
                            var floorNumber = reader.r(8);
                            writer.w(floorNumber, 8);
                            assert(floorNumber <= floorCountMinus1);
                            var residueNumber = reader.r(8);
                            writer.w(residueNumber, 8);
                            assert(residueNumber <= residueCountMinus1)
                        }
                    }
                    var modeCountMinus1 = reader.r(6);
                    writer.w(modeCountMinus1, 6);
                    mode_blockflag = [];
                    mode_bits = ilog(modeCountMinus1);
                    for (let i = 0; i <= modeCountMinus1; i++) {
                        var blockFlag = reader.r(1);
                        writer.w(blockFlag, 1);
                        mode_blockflag[i] = (blockFlag !== 0);
                        writer.w(0, 16);
                        writer.w(0, 16);
                        var mapping = reader.r(8);
                        writer.w(mapping, 8);
                        assert(mapping <= mappingCountMinus1)
                    }
                    writer.w(1, 8);
                    writer.flushPage(0)
                }
                var curOffset = pos + firstAudioPacketOffset;
                reader.pos = (pos + firstAudioPacketOffset) << 3;
                var prevBlockflag = !1;
                var lastBlockSize = 0;
                while ((reader.pos >> 3) + 2 < chunkEnd) {
                    var audioPacketSize = reader.r(16);
                    writer.w(0, 1);
                    var mode_number = reader.r(mode_bits);
                    writer.w(mode_number, mode_bits);
                    var remainder = reader.r(8 - mode_bits);
                    if (mode_blockflag[mode_number]) {
                        var nextBlockflag = !1;
                        if ((reader.pos >> 3) + audioPacketSize + 2 < chunkEnd) {
                            reader.pos = (curOffset + 2 + audioPacketSize + 2) << 3;
                            nextBlockflag = mode_blockflag[reader.r(mode_bits)];
                            reader.pos = (curOffset + 3) << 3
                        }
                        writer.w((prevBlockflag) ? 1 : 0, 1);
                        writer.w((nextBlockflag) ? 1 : 0, 1)
                    }
                    prevBlockflag = mode_blockflag[mode_number];
                    writer.w(remainder, 8 - mode_bits);
                    writer.copy(reader, audioPacketSize - 1);
                    curOffset += 2 + audioPacketSize;
                    var curBlocksize = Math.pow(2, blocksize0pow);
                    if (mode_blockflag[mode_number])
                        curBlocksize = Math.pow(2, blocksize1pow);
                    var granuleSize = (lastBlockSize + curBlocksize) >>> 2;
                    lastBlockSize = curBlocksize;
                    let endTest = ((reader.pos >> 3) + 2) >= chunkEnd;
                    writer.flushPage(granuleSize, endTest)
                }
                pos = fileSize;
                break
            }
        default:
            alert('Unknown chunk header: ' + chunkType);
            pos += chunkSize
        }
    }
    var buffer = writer.toArray();
    buffer.channels = channels;
    buffer.sampleRate = sampleRate;
    buffer.avgBytesPerSecond = avgBytesPerSecond;
    buffer.sampleCount = sampleCount;
    return buffer
}
/**
 * Reads the string from the specified buffer at posIn until length or next 00 byte if unspecified
 * @param  {ArrayBuffer} buffer ArrayBuffer containing the data to read.
 * @param  {Number} posIn Position of the string data in the buffer.
 * @param  {Number} length Length of data to read, or undefined if not specified
 */
export function readString(buffer, posIn, length = undefined) {
    let pos = posIn;
    let outString = '';
    if (length === undefined) {
        let curChar = new Uint8Array(buffer, pos++, 1)[0];
        while (curChar !== 0) {
            outString += String.fromCharCode(curChar);
            curChar = new Uint8Array(buffer, pos++, 1)[0];
        }
    } else {
        for (let i = 0; i < length; i++) {
            const curChar = new Uint8Array(buffer, pos++, 1)[0];
            if (curChar === 0)
                break;
            outString += String.fromCharCode(curChar)
        }
    }
    return outString
}
/**
 * Runs console.assert(), passing statement and msg as parameters
 * @param  {Boolean} statement Boolean value representing the statement to assert based upon
 * @param  {String} msg Value representing the msg to display if Statement is false.
 */
export function assert(statement, msg) {
    console.assert(statement, msg);
}
/**
 * Adds a stylesheet to the document if it has not been already
 * @param  {String} href a string representing the href attribute of the stylesheet
 */
export function addStyleIfNotExists(href) {
    let refCont = (href.indexOf('../') > -1) ? href.substr(href.lastIndexOf('../') + 3) : href;
    const existingStyles = document.getElementsByTagName('link');
    let exists = false;
    for (let i = 0; i < existingStyles.length; i++) {
        const l = existingStyles[i];
        if (l.href.indexOf(refCont) > -1) {
            exists = true;
            break;
        }
    }

    if (!exists) {
        const head = document.getElementsByTagName('head')[0];
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        head.appendChild(link);
    }
}
/**
 * Debounces the function passed to it, preventing it from firing too many times.
 * @param  {Function} func Function to debounce.
 * @param  {Number} wait Amount of time to wait before firing function
 * @param  {Boolean} immediate Whether or not the function should fire immediately
 */
export function debounce(func, wait, immediate) {
    var timeout;
    return function () {
        var context = this, args = arguments;
        var later = function () {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
};
/**
 * hashes the given file name
 * @param  {String} k the file name.
 */
export function hashlittle2(k) {
    let length = k.length;
    let offset = 0;
    let a = 0xdeadbeef + length;
    let b = a;
    let c = a;
    while (length > 12) {
        a = (a + (k.charCodeAt(offset + 0) + (k.charCodeAt(offset + 1) << 8) + (k.charCodeAt(offset + 2) << 16) + (k.charCodeAt(offset + 3) << 24))) | 0;
        b = (b + (k.charCodeAt(offset + 4) + (k.charCodeAt(offset + 5) << 8) + (k.charCodeAt(offset + 6) << 16) + (k.charCodeAt(offset + 7) << 24))) | 0;
        c = (c + (k.charCodeAt(offset + 8) + (k.charCodeAt(offset + 9) << 8) + (k.charCodeAt(offset + 10) << 16) + (k.charCodeAt(offset + 11) << 24))) | 0;
        a = (a - c) | 0;
        a ^= (c << 4) | (c >>> 28);
        c = (c + b) | 0;
        b = (b - a) | 0;
        b ^= (a << 6) | (a >>> 26);
        a = (a + c) | 0;
        c = (c - b) | 0;
        c ^= (b << 8) | (b >>> 24);
        b = (b + a) | 0;
        a = (a - c) | 0;
        a ^= (c << 16) | (c >>> 16);
        c = (c + b) | 0;
        b = (b - a) | 0;
        b ^= (a << 19) | (a >>> 13);
        a = (a + c) | 0;
        c = (c - b) | 0;
        c ^= (b << 4) | (b >>> 28);
        b = (b + a) | 0;
        length -= 12;
        offset += 12
    }
    switch (length) {
        case 12:
            c += (k.charCodeAt(offset + 8) + (k.charCodeAt(offset + 9) << 8) + (k.charCodeAt(offset + 10) << 16) + (k.charCodeAt(offset + 11) << 24));
            b += (k.charCodeAt(offset + 4) + (k.charCodeAt(offset + 5) << 8) + (k.charCodeAt(offset + 6) << 16) + (k.charCodeAt(offset + 7) << 24));
            a += (k.charCodeAt(offset + 0) + (k.charCodeAt(offset + 1) << 8) + (k.charCodeAt(offset + 2) << 16) + (k.charCodeAt(offset + 3) << 24));
            break;
        case 11:
            c += (k.charCodeAt(offset + 8) + (k.charCodeAt(offset + 9) << 8) + (k.charCodeAt(offset + 10) << 16));
            b += (k.charCodeAt(offset + 4) + (k.charCodeAt(offset + 5) << 8) + (k.charCodeAt(offset + 6) << 16) + (k.charCodeAt(offset + 7) << 24));
            a += (k.charCodeAt(offset + 0) + (k.charCodeAt(offset + 1) << 8) + (k.charCodeAt(offset + 2) << 16) + (k.charCodeAt(offset + 3) << 24));
            break;
        case 10:
            c += (k.charCodeAt(offset + 8) + (k.charCodeAt(offset + 9) << 8));
            b += (k.charCodeAt(offset + 4) + (k.charCodeAt(offset + 5) << 8) + (k.charCodeAt(offset + 6) << 16) + (k.charCodeAt(offset + 7) << 24));
            a += (k.charCodeAt(offset + 0) + (k.charCodeAt(offset + 1) << 8) + (k.charCodeAt(offset + 2) << 16) + (k.charCodeAt(offset + 3) << 24));
            break;
        case 9:
            c += (k.charCodeAt(offset + 8));
            b += (k.charCodeAt(offset + 4) + (k.charCodeAt(offset + 5) << 8) + (k.charCodeAt(offset + 6) << 16) + (k.charCodeAt(offset + 7) << 24));
            a += (k.charCodeAt(offset + 0) + (k.charCodeAt(offset + 1) << 8) + (k.charCodeAt(offset + 2) << 16) + (k.charCodeAt(offset + 3) << 24));
            break;
        case 8:
            b += (k.charCodeAt(offset + 4) + (k.charCodeAt(offset + 5) << 8) + (k.charCodeAt(offset + 6) << 16) + (k.charCodeAt(offset + 7) << 24));
            a += (k.charCodeAt(offset + 0) + (k.charCodeAt(offset + 1) << 8) + (k.charCodeAt(offset + 2) << 16) + (k.charCodeAt(offset + 3) << 24));
            break;
        case 7:
            b += (k.charCodeAt(offset + 4) + (k.charCodeAt(offset + 5) << 8) + (k.charCodeAt(offset + 6) << 16));
            a += (k.charCodeAt(offset + 0) + (k.charCodeAt(offset + 1) << 8) + (k.charCodeAt(offset + 2) << 16) + (k.charCodeAt(offset + 3) << 24));
            break;
        case 6:
            b += (k.charCodeAt(offset + 4) + (k.charCodeAt(offset + 5) << 8));
            a += (k.charCodeAt(offset + 0) + (k.charCodeAt(offset + 1) << 8) + (k.charCodeAt(offset + 2) << 16) + (k.charCodeAt(offset + 3) << 24));
            break;
        case 5:
            b += (k.charCodeAt(offset + 4));
            a += (k.charCodeAt(offset + 0) + (k.charCodeAt(offset + 1) << 8) + (k.charCodeAt(offset + 2) << 16) + (k.charCodeAt(offset + 3) << 24));
            break;
        case 4:
            a += (k.charCodeAt(offset + 0) + (k.charCodeAt(offset + 1) << 8) + (k.charCodeAt(offset + 2) << 16) + (k.charCodeAt(offset + 3) << 24));
            break;
        case 3:
            a += (k.charCodeAt(offset + 0) + (k.charCodeAt(offset + 1) << 8) + (k.charCodeAt(offset + 2) << 16));
            break;
        case 2:
            a += (k.charCodeAt(offset + 0) + (k.charCodeAt(offset + 1) << 8));
            break;
        case 1:
            a += (k.charCodeAt(offset + 0));
            break;
        default:
            return [b >>> 0, c >>> 0]
    }
    c ^= b;
    c -= (b << 14) | (b >>> 18) | 0;
    a ^= c;
    a -= (c << 11) | (c >>> 21) | 0;
    b ^= a;
    b -= (a << 25) | (a >>> 7) | 0;
    c ^= b;
    c -= (b << 16) | (b >>> 16) | 0;
    a ^= c;
    a -= (c << 4) | (c >>> 28) | 0;
    b ^= a;
    b -= (a << 14) | (a >>> 18) | 0;
    c ^= b;
    c -= (b << 24) | (b >>> 8) | 0;
    return [b >>> 0, c >>> 0]
}
/**
 * Adjusts the dpi to remove halo affect from a canvas element.
 * @param  {HTMLCanvasElement} canvas The HTML5 canvas to adjust the dpi of.
 */
export function fixDpi(canvas) {
    //get DPI
    let dpi = window.devicePixelRatio;
    //get CSS height
    //the + prefix casts it to an integer
    //the slice method gets rid of "px"
    let style_height = +getComputedStyle(canvas).getPropertyValue("height").slice(0, -2);
    //get CSS width
    let style_width = +getComputedStyle(canvas).getPropertyValue("width").slice(0, -2);
    //scale the canvas
    canvas.setAttribute('height', style_height * dpi);
    canvas.setAttribute('width', style_width * dpi);
}
/**
 * Reads the int from the specified buffer at posIn.
 * @param  {DataView} dv ArrayBuffer containing the data to read.
 * @param  {Number} pos Position of the string data in the buffer.
 */
export function readVarInt(dv, pos) {
    const firstChar = dv.getUint8(pos);
    let intLo = 0;
    let intHi = 0;
    switch (firstChar) {
    case 0xC0:
        intLo = dv.getUint8(pos + 1);
        return {
            sign: -1,
            intLo,
            intHi: 0,
            len: 2
        };
    case 0xC1:
        intLo = dv.getUint16(pos + 1);
        return {
            sign: -1,
            intLo,
            intHi: 0,
            len: 3
        };
    case 0xC2:
        intLo = (dv.getUint16(pos + 1) << 8) | dv.getUint8(pos + 3);
        return {
            sign: -1,
            intLo,
            intHi: 0,
            len: 4
        };
    case 0xC3:
        intLo = dv.getUint32(pos + 1);
        return {
            sign: -1,
            intLo,
            intHi: 0,
            len: 5
        };
    case 0xC4:
        intHi = dv.getUint8(pos + 1);
        intLo = dv.getUint32(pos + 2);
        return {
            sign: -1,
            intLo,
            intHi,
            len: 6
        };
    case 0xC5:
        intHi = dv.getUint16(pos + 1);
        intLo = dv.getUint32(pos + 3);
        return {
            sign: -1,
            intLo,
            intHi,
            len: 7
        };
    case 0xC6:
        intHi = (dv.getUint8(pos + 1) << 16) | (dv.getUint8(pos + 2) << 8) | dv.getUint8(pos + 3);
        intLo = dv.getUint32(pos + 4);
        return {
            sign: -1,
            intLo,
            intHi,
            len: 8
        };
    case 0xC7:
        intHi = dv.getUint32(pos + 1);
        intLo = dv.getUint32(pos + 5);
        return {
            sign: -1,
            intLo,
            intHi,
            len: 9
        };
    case 0xC8:
        intLo = dv.getUint8(pos + 1);
        return {
            sign: +1,
            intLo,
            intHi: 0,
            len: 2
        };
    case 0xC9:
        intLo = dv.getUint16(pos + 1);
        return {
            sign: +1,
            intLo,
            intHi: 0,
            len: 3
        };
    case 0xCA:
        intLo = (dv.getUint8(pos + 1) << 16) | (dv.getUint8(pos + 2) << 8) | dv.getUint8(pos + 3);
        return {
            sign: +1,
            intLo,
            intHi: 0,
            len: 4
        };
    case 0xCB:
        intLo = dv.getUint32(pos + 1);
        return {
            sign: +1,
            intLo,
            intHi: 0,
            len: 5
        };
    case 0xCC:
        intHi = dv.getUint8(pos + 1);
        intLo = dv.getUint32(pos + 2);
        return {
            sign: +1,
            intLo,
            intHi,
            len: 6
        };
    case 0xCD:
        intHi = dv.getUint16(pos + 1);
        intLo = dv.getUint32(pos + 3);
        return {
            sign: +1,
            intLo,
            intHi,
            len: 7
        };
    case 0xCE:
        intHi = (dv.getUint8(pos + 1) << 16) | (dv.getUint8(pos + 2) << 8) | dv.getUint8(pos + 3);
        intLo = dv.getUint32(pos + 4);
        return {
            sign: +1,
            intLo,
            intHi,
            len: 8
        };
    case 0xCF:
        intHi = dv.getUint32(pos + 1);
        intLo = dv.getUint32(pos + 5);
        return {
            sign: +1,
            intLo,
            intHi,
            len: 9
        };
    default:
        return {
            sign: +1,
            intLo: firstChar,
            intHi: 0,
            len: 1
        }
    }
}
/**
 * Converts 2 uitn32 values to a uint64
 * @param  {int} intLo First uint32.
 * @param  {int} intHi Second uint32.
 */
export function uint64(intLo, intHi) {
    const tableLo = [new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1]), new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2]), new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4]), new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8]), new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 6]), new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 2]), new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 4]), new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 8]), new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 5, 6]), new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 1, 2]), new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 2, 4]), new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 4, 8]), new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 9, 6]), new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 1, 9, 2]), new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 6, 3, 8, 4]), new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 2, 7, 6, 8]), new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 5, 5, 3, 6]), new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 3, 1, 0, 7, 2]), new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 6, 2, 1, 4, 4]), new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 2, 4, 2, 8, 8]), new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 4, 8, 5, 7, 6]), new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 9, 7, 1, 5, 2]), new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 1, 9, 4, 3, 0, 4]), new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 3, 8, 8, 6, 0, 8]), new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 6, 7, 7, 7, 2, 1, 6]), new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 3, 5, 5, 4, 4, 3, 2]), new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 7, 1, 0, 8, 8, 6, 4]), new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 3, 4, 2, 1, 7, 7, 2, 8]), new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 6, 8, 4, 3, 5, 4, 5, 6]), new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 3, 6, 8, 7, 0, 9, 1, 2]), new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 7, 3, 7, 4, 1, 8, 2, 4]), new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 1, 4, 7, 4, 8, 3, 6, 4, 8]), ];
    const tableHi = [new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 2, 9, 4, 9, 6, 7, 2, 9, 6]), new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 5, 8, 9, 9, 3, 4, 5, 9, 2]), new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 7, 1, 7, 9, 8, 6, 9, 1, 8, 4]), new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 4, 3, 5, 9, 7, 3, 8, 3, 6, 8]), new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 8, 7, 1, 9, 4, 7, 6, 7, 3, 6]), new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 1, 3, 7, 4, 3, 8, 9, 5, 3, 4, 7, 2]), new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 2, 7, 4, 8, 7, 7, 9, 0, 6, 9, 4, 4]), new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 5, 4, 9, 7, 5, 5, 8, 1, 3, 8, 8, 8]), new Uint8Array([0, 0, 0, 0, 0, 0, 0, 1, 0, 9, 9, 5, 1, 1, 6, 2, 7, 7, 7, 6]), new Uint8Array([0, 0, 0, 0, 0, 0, 0, 2, 1, 9, 9, 0, 2, 3, 2, 5, 5, 5, 5, 2]), new Uint8Array([0, 0, 0, 0, 0, 0, 0, 4, 3, 9, 8, 0, 4, 6, 5, 1, 1, 1, 0, 4]), new Uint8Array([0, 0, 0, 0, 0, 0, 0, 8, 7, 9, 6, 0, 9, 3, 0, 2, 2, 2, 0, 8]), new Uint8Array([0, 0, 0, 0, 0, 0, 1, 7, 5, 9, 2, 1, 8, 6, 0, 4, 4, 4, 1, 6]), new Uint8Array([0, 0, 0, 0, 0, 0, 3, 5, 1, 8, 4, 3, 7, 2, 0, 8, 8, 8, 3, 2]), new Uint8Array([0, 0, 0, 0, 0, 0, 7, 0, 3, 6, 8, 7, 4, 4, 1, 7, 7, 6, 6, 4]), new Uint8Array([0, 0, 0, 0, 0, 1, 4, 0, 7, 3, 7, 4, 8, 8, 3, 5, 5, 3, 2, 8]), new Uint8Array([0, 0, 0, 0, 0, 2, 8, 1, 4, 7, 4, 9, 7, 6, 7, 1, 0, 6, 5, 6]), new Uint8Array([0, 0, 0, 0, 0, 5, 6, 2, 9, 4, 9, 9, 5, 3, 4, 2, 1, 3, 1, 2]), new Uint8Array([0, 0, 0, 0, 1, 1, 2, 5, 8, 9, 9, 9, 0, 6, 8, 4, 2, 6, 2, 4]), new Uint8Array([0, 0, 0, 0, 2, 2, 5, 1, 7, 9, 9, 8, 1, 3, 6, 8, 5, 2, 4, 8]), new Uint8Array([0, 0, 0, 0, 4, 5, 0, 3, 5, 9, 9, 6, 2, 7, 3, 7, 0, 4, 9, 6]), new Uint8Array([0, 0, 0, 0, 9, 0, 0, 7, 1, 9, 9, 2, 5, 4, 7, 4, 0, 9, 9, 2]), new Uint8Array([0, 0, 0, 1, 8, 0, 1, 4, 3, 9, 8, 5, 0, 9, 4, 8, 1, 9, 8, 4]), new Uint8Array([0, 0, 0, 3, 6, 0, 2, 8, 7, 9, 7, 0, 1, 8, 9, 6, 3, 9, 6, 8]), new Uint8Array([0, 0, 0, 7, 2, 0, 5, 7, 5, 9, 4, 0, 3, 7, 9, 2, 7, 9, 3, 6]), new Uint8Array([0, 0, 1, 4, 4, 1, 1, 5, 1, 8, 8, 0, 7, 5, 8, 5, 5, 8, 7, 2]), new Uint8Array([0, 0, 2, 8, 8, 2, 3, 0, 3, 7, 6, 1, 5, 1, 7, 1, 1, 7, 4, 4]), new Uint8Array([0, 0, 5, 7, 6, 4, 6, 0, 7, 5, 2, 3, 0, 3, 4, 2, 3, 4, 8, 8]), new Uint8Array([0, 1, 1, 5, 2, 9, 2, 1, 5, 0, 4, 6, 0, 6, 8, 4, 6, 9, 7, 6]), new Uint8Array([0, 2, 3, 0, 5, 8, 4, 3, 0, 0, 9, 2, 1, 3, 6, 9, 3, 9, 5, 2]), new Uint8Array([0, 4, 6, 1, 1, 6, 8, 6, 0, 1, 8, 4, 2, 7, 3, 8, 7, 9, 0, 4]), new Uint8Array([0, 9, 2, 2, 3, 3, 7, 2, 0, 3, 6, 8, 5, 4, 7, 7, 5, 8, 0, 8]), ];
    const out = new Uint8Array(20);
    const out32 = new Uint32Array(out.buffer);

    if (intHi === 0) return (intLo === 0) ? '0' : String(intLo);
    out32[0] = 0;
    out32[1] = 0;
    out32[2] = 0;
    out32[3] = 0;
    out32[4] = 0;
    {
        for (let i = 0; i < 32; i++) {
            if ((intLo & 1) !== 0) {
                const summand = tableLo[i];
                for (let j = 19; j >= 10; j--) {
                    out[j] += summand[j]
                }
            }
            intLo >>>= 1
        }
        for (let j = 19; j >= 10; j--) {
            if (out[j] > 9) {
                const remainder = (out[j] % 10) | 0;
                out[j - 1] += ((out[j] - remainder) / 10) | 0;
                out[j] = remainder
            }
        }
    }
    for (let i = 0; i < 32; i++) {
        if ((intHi & 1) !== 0) {
            const summand = tableHi[i];
            for (let j = 19; j >= 0; j--) {
                out[j] += summand[j]
            }
        }
        intHi >>>= 1
    }
    for (let j = 19; j >= 1; j--) {
        if (out[j] > 9) {
            const remainder = (out[j] % 10) | 0;
            out[j - 1] += ((out[j] - remainder) / 10) | 0;
            out[j] = remainder
        }
    }
    return out.join('').replace(/^0+/, '')
}
/**
 * Converts 2 uitn32 values to a uint64, taking an obj as the argument
 * @param  {Object} obj Object wrapper for the uint32s.
 */
export function uint64C(obj) {
    return uint64(obj.intLo, obj.intHi)
}
/**
 * Adds 2 unit64 values
 * @param  {int} x first uint64.
 * @param  {int} y second uint64.
 */
export var uint64_add = (function() {
    var addAsString = function(x, y) {
        var s = '';
        if (y.length > x.length) {
            s = x;
            x = y;
            y = s
        }
        s = (parseInt(x.slice(-9), 10) + parseInt(y.slice(-9), 10)).toString();
        x = x.slice(0, -9);
        y = y.slice(0, -9);
        if (s.length > 9) {
            if (x === '')
                return s;
            x = addAsString(x, '1');
            s = s.slice(1)
        } else if (x.length) {
            while (s.length < 9) {
                s = '0' + s
            }
        }
        if (y === '')
            return x + s;
        return addAsString(x, y) + s
    };
    var subtractAsString = function(x, y) {
        var s;
        s = (parseInt('1' + x.slice(-9), 10) - parseInt(y.slice(-9), 10)).toString();
        x = x.slice(0, -9);
        y = y.slice(0, -9);
        if (s.length === 10 || x === '') {
            s = s.slice(1)
        } else {
            if (y.length) {
                y = addAsString(y, '1')
            } else {
                y = '1'
            }
            if (x.length) {
                while (s.length < 9) {
                    s = '0' + s
                }
            }
        }
        if (y === '') {
            s = (x + s).replace(/^0+/, '');
            return s
        }
        return subtractAsString(x, y) + s
    };
    return function(x, y) {
        var s = '';
        x = x.replace(/^(-)?0+/, '$1').replace(/^-?$/, '0');
        y = y.replace(/^(-)?0+/, '$1').replace(/^-?$/, '0');
        if (x[0] === '-') {
            if (y[0] === '-') {
                return '-' + addAsString(x.slice(1), y.slice(1))
            }
            return uint64_add(y, x)
        }
        if (y[0] === '-') {
            s = y.slice(1);
            if (s.length < x.length || (s.length === x.length && s < x))
                return subtractAsString(x, s) || '0';
            if (s === x)
                return '0';
            s = subtractAsString(s, x);
            s = (s && '-' + s) || '0';
            return s
        }
        return addAsString(x, y)
    }
}());
/**
 * Tests the given file name for validity.
 * @param  {String} path The file path to test.
 */
export function testFilename(path) {
    return fs.existsSync(path);
}
/**
 * Cleans the given string of all invalid characters.
 * @param  {String} input The string to clean.
 */
export function cleanString(input) {
    var output = "";
    for (var i=0; i<input.length; i++) {
        if (input.charCodeAt(i) <= 127) {
            output += input.charAt(i);
        }
    }
    return output;
}
/**
 * Stringifies objects with Maps as values
 * @param  {any} key The map key.
 * @param  {any} value The map value.
 */
export function serializeMap(key, value) {
    if(value instanceof Map) {
        const ret = Object.fromEntries(value);
        return ret;
    } else {
        return value;
    }
}

function readOpcode(dv, pos, offset) {
    var o = Object.create(null);
    o.len = 0;
    var opcode = dv.getUint8(pos);
    pos++;
    var byte2, byte3, byte4;
    switch (opcode) {
    case 0x09:
        byte2 = dv.getUint8(pos);
        pos++;
        switch (byte2) {
        case 0xC0:
        case 0xC1:
        case 0xC2:
        case 0xC3:
        case 0xC4:
        case 0xC5:
        case 0xC6:
        case 0xC7:
        case 0xC8:
        case 0xC9:
        case 0xCA:
        case 0xCB:
        case 0xCC:
        case 0xCD:
        case 0xCE:
        case 0xCF:
        case 0xD0:
        case 0xD1:
        case 0xD2:
        case 0xD3:
        case 0xD4:
        case 0xD5:
        case 0xD6:
        case 0xD7:
        case 0xD8:
        case 0xD9:
        case 0xDA:
        case 0xDB:
        case 0xDC:
        case 0xDD:
        case 0xDE:
        case 0xDF:
        case 0xE0:
        case 0xE1:
        case 0xE2:
        case 0xE3:
        case 0xE4:
        case 0xE5:
        case 0xE6:
        case 0xE7:
        case 0xE8:
        case 0xE9:
        case 0xEA:
        case 0xEB:
        case 0xEC:
        case 0xED:
        case 0xEE:
        case 0xEF:
        case 0xF0:
        case 0xF1:
        case 0xF2:
        case 0xF3:
        case 0xF4:
        case 0xF5:
        case 0xF6:
        case 0xF7:
        case 0xF8:
        case 0xF9:
        case 0xFA:
        case 0xFB:
        case 0xFC:
        case 0xFD:
        case 0xFE:
        case 0xFF:
            o.op = 'or';
            o.text = register[byte2 & 7] + ' |= ' + register[(byte2 - 0xC0) >>> 3];
            o.len = 2;
            break;
        default:
            console.log('Opcode 0x09 0x' + byte2.toString(16) + ' not recognized')
        }
        break;
    case 0x0B:
        byte2 = dv.getUint8(pos);
        pos++;
        switch (byte2) {
        case 0x45:
            o.op = 'or';
            o.text = 'eax |= *(ebp' + dv.getInt8(pos) + ')';
            o.len = 3;
            break;
        default:
            console.log("Opcode 0x0B 0x" + byte2.toString(16) + " not recognized")
        }
        break;
    case 0x0F:
        byte2 = dv.getUint8(pos);
        pos++;
        switch (byte2) {
        case 0x1F:
            byte3 = dv.getUint8(pos);
            pos++;
            switch (byte3) {
            case 0x00:
            case 0x01:
            case 0x02:
            case 0x03:
            case 0x04:
            case 0x05:
            case 0x06:
            case 0x07:
                o.op = 'nop';
                o.text = '// *' + register[byte3];
                o.len = 3;
                break;
            case 0x40:
            case 0x41:
            case 0x42:
            case 0x43:
            case 0x45:
            case 0x46:
            case 0x47:
                o.op = 'nop';
                o.text = '// *(' + register[byte3 - 0x40] + '+' + dv.getInt8(pos) + ')';
                o.len = 4;
                break;
            case 0x44:
                byte4 = dv.getUint8(pos);
                pos++;
                switch (byte4) {
                case 0x00:
                case 0x01:
                case 0x02:
                case 0x03:
                case 0x04:
                case 0x05:
                case 0x06:
                case 0x07:
                case 0x08:
                case 0x09:
                case 0x0A:
                case 0x0B:
                case 0x0C:
                case 0x0D:
                case 0x0E:
                case 0x0F:
                case 0x10:
                case 0x11:
                case 0x12:
                case 0x13:
                case 0x14:
                case 0x15:
                case 0x16:
                case 0x17:
                case 0x18:
                case 0x19:
                case 0x1A:
                case 0x1B:
                case 0x1C:
                case 0x1D:
                case 0x1E:
                case 0x1F:
                case 0x20:
                case 0x21:
                case 0x22:
                case 0x23:
                case 0x24:
                case 0x25:
                case 0x26:
                case 0x27:
                case 0x28:
                case 0x29:
                case 0x2A:
                case 0x2B:
                case 0x2C:
                case 0x2D:
                case 0x2E:
                case 0x2F:
                case 0x30:
                case 0x31:
                case 0x32:
                case 0x33:
                case 0x34:
                case 0x35:
                case 0x36:
                case 0x37:
                case 0x38:
                case 0x39:
                case 0x3A:
                case 0x3B:
                case 0x3C:
                case 0x3D:
                case 0x3E:
                case 0x3F:
                    o.op = 'nop';
                    o.text = '// *(' + register[byte4 & 7] + '+' + register2[byte4 >>> 3] + '*1+' + dv.getInt8(pos) + ')';
                    o.len = 5;
                    break;
                case 0x40:
                case 0x41:
                case 0x42:
                case 0x43:
                case 0x44:
                case 0x45:
                case 0x46:
                case 0x47:
                case 0x48:
                case 0x49:
                case 0x4A:
                case 0x4B:
                case 0x4C:
                case 0x4D:
                case 0x4E:
                case 0x4F:
                case 0x50:
                case 0x51:
                case 0x52:
                case 0x53:
                case 0x54:
                case 0x55:
                case 0x56:
                case 0x57:
                case 0x58:
                case 0x59:
                case 0x5A:
                case 0x5B:
                case 0x5C:
                case 0x5D:
                case 0x5E:
                case 0x5F:
                case 0x60:
                case 0x61:
                case 0x62:
                case 0x63:
                case 0x64:
                case 0x65:
                case 0x66:
                case 0x67:
                case 0x68:
                case 0x69:
                case 0x6A:
                case 0x6B:
                case 0x6C:
                case 0x6D:
                case 0x6E:
                case 0x6F:
                case 0x70:
                case 0x71:
                case 0x72:
                case 0x73:
                case 0x74:
                case 0x75:
                case 0x76:
                case 0x77:
                case 0x78:
                case 0x79:
                case 0x7A:
                case 0x7B:
                case 0x7C:
                case 0x7D:
                case 0x7E:
                case 0x7F:
                    o.op = 'nop';
                    o.text = '// *(' + register[byte4 & 7] + '+' + register2[(byte4 - 0x40) >>> 3] + '*2+' + dv.getInt8(pos) + ')';
                    o.len = 5;
                    break;
                case 0x80:
                case 0x81:
                case 0x82:
                case 0x83:
                case 0x84:
                case 0x85:
                case 0x86:
                case 0x87:
                case 0x88:
                case 0x89:
                case 0x8A:
                case 0x8B:
                case 0x8C:
                case 0x8D:
                case 0x8E:
                case 0x8F:
                case 0x90:
                case 0x91:
                case 0x92:
                case 0x93:
                case 0x94:
                case 0x95:
                case 0x96:
                case 0x97:
                case 0x98:
                case 0x99:
                case 0x9A:
                case 0x9B:
                case 0x9C:
                case 0x9D:
                case 0x9E:
                case 0x9F:
                case 0xA0:
                case 0xA1:
                case 0xA2:
                case 0xA3:
                case 0xA4:
                case 0xA5:
                case 0xA6:
                case 0xA7:
                case 0xA8:
                case 0xA9:
                case 0xAA:
                case 0xAB:
                case 0xAC:
                case 0xAD:
                case 0xAE:
                case 0xAF:
                case 0xB0:
                case 0xB1:
                case 0xB2:
                case 0xB3:
                case 0xB4:
                case 0xB5:
                case 0xB6:
                case 0xB7:
                case 0xB8:
                case 0xB9:
                case 0xBA:
                case 0xBB:
                case 0xBC:
                case 0xBD:
                case 0xBE:
                case 0xBF:
                    o.op = 'nop';
                    o.text = '// *(' + register[byte4 & 7] + '+' + register2[(byte4 - 0x80) >>> 3] + '*4+' + dv.getInt8(pos) + ')';
                    o.len = 5;
                    break;
                case 0xC0:
                case 0xC1:
                case 0xC2:
                case 0xC3:
                case 0xC4:
                case 0xC5:
                case 0xC6:
                case 0xC7:
                case 0xC8:
                case 0xC9:
                case 0xCA:
                case 0xCB:
                case 0xCC:
                case 0xCD:
                case 0xCE:
                case 0xCF:
                case 0xD0:
                case 0xD1:
                case 0xD2:
                case 0xD3:
                case 0xD4:
                case 0xD5:
                case 0xD6:
                case 0xD7:
                case 0xD8:
                case 0xD9:
                case 0xDA:
                case 0xDB:
                case 0xDC:
                case 0xDD:
                case 0xDE:
                case 0xDF:
                case 0xE0:
                case 0xE1:
                case 0xE2:
                case 0xE3:
                case 0xE4:
                case 0xE5:
                case 0xE6:
                case 0xE7:
                case 0xE8:
                case 0xE9:
                case 0xEA:
                case 0xEB:
                case 0xEC:
                case 0xED:
                case 0xEE:
                case 0xEF:
                case 0xF0:
                case 0xF1:
                case 0xF2:
                case 0xF3:
                case 0xF4:
                case 0xF5:
                case 0xF6:
                case 0xF7:
                case 0xF8:
                case 0xF9:
                case 0xFA:
                case 0xFB:
                case 0xFC:
                case 0xFD:
                case 0xFE:
                case 0xFF:
                    o.op = 'nop';
                    o.text = '// *(' + register[byte4 & 7] + '+' + register2[(byte4 - 0xC0) >>> 3] + '*8+' + dv.getInt8(pos) + ')';
                    o.len = 5;
                    break;
                default:
                    console.log('Opcode 0x0F 0x1F 0x44 0x' + byte4.toString(16) + ' not recognized')
                }
                break;
            case 0x80:
            case 0x81:
            case 0x82:
            case 0x83:
            case 0x85:
            case 0x86:
            case 0x87:
                o.op = 'nop';
                o.text = '// *(' + register[byte3 - 0x80] + '+' + dv.getInt32(pos, !0) + ')';
                o.len = 7;
                break;
            case 0x84:
                byte4 = dv.getUint8(pos);
                pos++;
                switch (byte4) {
                case 0x00:
                case 0x01:
                case 0x02:
                case 0x03:
                case 0x04:
                case 0x05:
                case 0x06:
                case 0x07:
                case 0x08:
                case 0x09:
                case 0x0A:
                case 0x0B:
                case 0x0C:
                case 0x0D:
                case 0x0E:
                case 0x0F:
                case 0x10:
                case 0x11:
                case 0x12:
                case 0x13:
                case 0x14:
                case 0x15:
                case 0x16:
                case 0x17:
                case 0x18:
                case 0x19:
                case 0x1A:
                case 0x1B:
                case 0x1C:
                case 0x1D:
                case 0x1E:
                case 0x1F:
                case 0x20:
                case 0x21:
                case 0x22:
                case 0x23:
                case 0x24:
                case 0x25:
                case 0x26:
                case 0x27:
                case 0x28:
                case 0x29:
                case 0x2A:
                case 0x2B:
                case 0x2C:
                case 0x2D:
                case 0x2E:
                case 0x2F:
                case 0x30:
                case 0x31:
                case 0x32:
                case 0x33:
                case 0x34:
                case 0x35:
                case 0x36:
                case 0x37:
                case 0x38:
                case 0x39:
                case 0x3A:
                case 0x3B:
                case 0x3C:
                case 0x3D:
                case 0x3E:
                case 0x3F:
                    o.op = 'nop';
                    o.text = '// *(' + register[byte4 & 7] + '+' + register2[byte4 >>> 3] + '*1+' + dv.getInt32(pos, !0) + ')';
                    o.len = 8;
                    break;
                default:
                    console.log("Opcode 0x0F 0x1F 0x84 0x" + byte4.toString(16) + " not recognized")
                }
                break;
            default:
                console.log("Opcode 0x0F 0x1F 0x" + byte3.toString(16) + " not recognized")
            }
            break;
        case 0x84:
            o.op = 'je';
            o.text = 'je(' + pad((offset + 6 + dv.getInt32(pos, !0)).toString(16), 8) + ')';
            o.len = 6;
            break;
        case 0x85:
            o.op = 'jne';
            o.text = 'jne(' + pad((offset + 6 + dv.getInt32(pos, !0)).toString(16), 8) + ')';
            o.len = 6;
            break;
        case 0x94:
            byte3 = dv.getUint8(pos);
            pos++;
            switch (byte3) {
            case 0xC0:
            case 0xC1:
            case 0xC2:
            case 0xC3:
            case 0xC4:
            case 0xC5:
            case 0xC6:
            case 0xC7:
                o.op = 'sete';
                o.text = registerSm[byte3 - 0xC0] + ' = (ZERO_FLAG) ? 1 : 0';
                o.len = 3;
                break;
            default:
                console.log("Opcode 0x0F 0x94 0x" + byte3.toString(16) + " not recognized")
            }
            break;
        case 0x95:
            byte3 = dv.getUint8(pos);
            pos++;
            switch (byte3) {
            case 0x44:
                byte4 = dv.getUint8(pos);
                pos++;
                switch (byte4) {
                case 0x24:
                    o.op = 'setne';
                    o.text = '*(esp+' + dv.getInt8(pos) + ') = (ZERO_FLAG) ? 0 : 1';
                    o.len = 5;
                    break;
                default:
                    console.log("Opcode 0x0F 0x95 0x44 0x" + byte4.toString(16) + " not recognized")
                }
                break;
            case 0xC0:
            case 0xC1:
            case 0xC2:
            case 0xC3:
            case 0xC4:
            case 0xC5:
            case 0xC6:
            case 0xC7:
                o.op = 'setne';
                o.text = registerSm[byte3 - 0xC0] + ' = (ZERO_FLAG) ? 0 : 1';
                o.len = 3;
                break;
            default:
                console.log("Opcode 0x0F 0x95 0x" + byte3.toString(16) + " not recognized")
            }
            break;
        case 0xB6:
            byte3 = dv.getUint8(pos);
            pos++;
            switch (byte3) {
            case 0x44:
                byte4 = dv.getUint8(pos);
                pos++;
                switch (byte4) {
                case 0x24:
                    o.op = 'movzx';
                    o.text = 'movzx eax, *(esp+' + dv.getInt8(pos) + ')';
                    o.len = 5;
                    break;
                default:
                    console.log("Opcode 0x0F 0xB6 0x44 0x" + byte4.toString(16) + " not recognized")
                }
                break;
            case 0xC0:
            case 0xC1:
            case 0xC2:
            case 0xC3:
            case 0xC4:
            case 0xC5:
            case 0xC6:
            case 0xC7:
            case 0xC8:
            case 0xC9:
            case 0xCA:
            case 0xCB:
            case 0xCC:
            case 0xCD:
            case 0xCE:
            case 0xCF:
            case 0xD0:
            case 0xD1:
            case 0xD2:
            case 0xD3:
            case 0xD4:
            case 0xD5:
            case 0xD6:
            case 0xD7:
            case 0xD8:
            case 0xD9:
            case 0xDA:
            case 0xDB:
            case 0xDC:
            case 0xDD:
            case 0xDE:
            case 0xDF:
            case 0xE0:
            case 0xE1:
            case 0xE2:
            case 0xE3:
            case 0xE4:
            case 0xE5:
            case 0xE6:
            case 0xE7:
            case 0xE8:
            case 0xE9:
            case 0xEA:
            case 0xEB:
            case 0xEC:
            case 0xED:
            case 0xEE:
            case 0xEF:
            case 0xF0:
            case 0xF1:
            case 0xF2:
            case 0xF3:
            case 0xF4:
            case 0xF5:
            case 0xF6:
            case 0xF7:
            case 0xF8:
            case 0xF9:
            case 0xFA:
            case 0xFB:
            case 0xFC:
            case 0xFD:
            case 0xFE:
            case 0xFF:
                o.op = 'movzx';
                o.text = 'movzx ' + register[(byte3 - 0xC0) >>> 3] + ', ' + registerSm[byte3 & 7];
                o.len = 3;
                break;
            default:
                console.log("Opcode 0x0F 0xB6 0x" + byte3.toString(16) + " not recognized")
            }
            break;
        default:
            console.log("Opcode 0x0F 0x" + byte2.toString(16) + " not recognized")
        }
        break;
    case 0x30:
        byte2 = dv.getUint8(pos);
        pos++;
        switch (byte2) {
        case 0xC0:
        case 0xC1:
        case 0xC2:
        case 0xC3:
        case 0xC4:
        case 0xC5:
        case 0xC6:
        case 0xC7:
        case 0xC8:
        case 0xC9:
        case 0xCA:
        case 0xCB:
        case 0xCC:
        case 0xCD:
        case 0xCE:
        case 0xCF:
        case 0xD0:
        case 0xD1:
        case 0xD2:
        case 0xD3:
        case 0xD4:
        case 0xD5:
        case 0xD6:
        case 0xD7:
        case 0xD8:
        case 0xD9:
        case 0xDA:
        case 0xDB:
        case 0xDC:
        case 0xDD:
        case 0xDE:
        case 0xDF:
        case 0xE0:
        case 0xE1:
        case 0xE2:
        case 0xE3:
        case 0xE4:
        case 0xE5:
        case 0xE6:
        case 0xE7:
        case 0xE8:
        case 0xE9:
        case 0xEA:
        case 0xEB:
        case 0xEC:
        case 0xED:
        case 0xEE:
        case 0xEF:
        case 0xF0:
        case 0xF1:
        case 0xF2:
        case 0xF3:
        case 0xF4:
        case 0xF5:
        case 0xF6:
        case 0xF7:
        case 0xF8:
        case 0xF9:
        case 0xFA:
        case 0xFB:
        case 0xFC:
        case 0xFD:
        case 0xFE:
        case 0xFF:
            o.op = 'xor';
            o.text = registerSm[byte2 & 7] + ' ^= ' + registerSm[(byte2 - 0xC0) >>> 3];
            o.len = 2;
            break;
        default:
            console.log("Opcode 0x30 0x" + byte2.toString(16) + " not recognized")
        }
        break;
    case 0x31:
        byte2 = dv.getUint8(pos);
        pos++;
        switch (byte2) {
        case 0xC0:
        case 0xC1:
        case 0xC2:
        case 0xC3:
        case 0xC4:
        case 0xC5:
        case 0xC6:
        case 0xC7:
        case 0xC8:
        case 0xC9:
        case 0xCA:
        case 0xCB:
        case 0xCC:
        case 0xCD:
        case 0xCE:
        case 0xCF:
        case 0xD0:
        case 0xD1:
        case 0xD2:
        case 0xD3:
        case 0xD4:
        case 0xD5:
        case 0xD6:
        case 0xD7:
        case 0xD8:
        case 0xD9:
        case 0xDA:
        case 0xDB:
        case 0xDC:
        case 0xDD:
        case 0xDE:
        case 0xDF:
        case 0xE0:
        case 0xE1:
        case 0xE2:
        case 0xE3:
        case 0xE4:
        case 0xE5:
        case 0xE6:
        case 0xE7:
        case 0xE8:
        case 0xE9:
        case 0xEA:
        case 0xEB:
        case 0xEC:
        case 0xED:
        case 0xEE:
        case 0xEF:
        case 0xF0:
        case 0xF1:
        case 0xF2:
        case 0xF3:
        case 0xF4:
        case 0xF5:
        case 0xF6:
        case 0xF7:
        case 0xF8:
        case 0xF9:
        case 0xFA:
        case 0xFB:
        case 0xFC:
        case 0xFD:
        case 0xFE:
        case 0xFF:
            o.op = 'xor';
            o.text = register[byte2 & 7] + ' ^= ' + register[(byte2 - 0xC0) >>> 3];
            o.len = 2;
            break;
        default:
            console.log("Opcode 0x31 0x" + byte2.toString(16) + " not recognized")
        }
        break;
    case 0x35:
        o.op = 'xor';
        o.text = 'eax ^= ' + dv.getUint32(pos, !0);
        o.len = 5;
        break;
    case 0x40:
    case 0x41:
    case 0x42:
    case 0x43:
    case 0x44:
    case 0x45:
    case 0x46:
    case 0x47:
        o.op = 'inc';
        o.text = register[opcode - 0x40] + '++';
        o.len = 1;
        break;
    case 0x48:
    case 0x49:
    case 0x4A:
    case 0x4B:
    case 0x4C:
    case 0x4D:
    case 0x4E:
    case 0x4F:
        o.op = 'dec';
        o.text = register[opcode - 0x48] + '--';
        o.len = 1;
        break;
    case 0x50:
    case 0x51:
    case 0x52:
    case 0x53:
    case 0x54:
    case 0x55:
    case 0x56:
    case 0x57:
        o.op = 'push';
        o.text = 'push(' + register[opcode - 0x50] + ')';
        o.len = 1;
        break;
    case 0x58:
    case 0x59:
    case 0x5A:
    case 0x5B:
    case 0x5C:
    case 0x5D:
    case 0x5E:
    case 0x5F:
        o.op = 'pop';
        o.text = 'pop(' + register[opcode - 0x58] + ')';
        o.len = 1;
        break;
    case 0x74:
        o.op = 'je';
        o.text = 'je(' + pad((offset + 2 + dv.getInt8(pos)).toString(16), 8) + ')';
        o.len = 2;
        break;
    case 0x75:
        o.op = 'jne';
        o.text = 'jne(' + pad((offset + 2 + dv.getInt8(pos)).toString(16), 8) + ')';
        o.len = 2;
        break;
    case 0x80:
        byte2 = dv.getUint8(pos);
        pos++;
        switch (byte2) {
        case 0x78:
        case 0x79:
        case 0x7A:
        case 0x7B:
        case 0x7D:
        case 0x7E:
        case 0x7F:
            o.op = 'cmp';
            o.text = '*(' + register[byte2 - 0x78] + '+' + dv.getInt8(pos) + ') == ' + dv.getUint8(pos + 1);
            o.len = 4;
            break;
        case 0x7C:
            byte3 = dv.getUint8(pos);
            pos++;
            switch (byte3) {
            case 0x24:
                o.op = 'cmp';
                o.text = '*(' + register[byte2 - 0x78] + '+' + dv.getInt8(pos) + ') == ' + dv.getUint8(pos + 1);
                o.len = 5;
                break;
            default:
                console.log("Opcode 0x80 0x7C 0x" + byte3.toString(16) + " not recognized")
            }
            break;
        case 0xE0:
        case 0xE1:
        case 0xE2:
        case 0xE3:
        case 0xE4:
        case 0xE5:
        case 0xE6:
        case 0xE7:
            o.op = 'and';
            o.text = registerSm[byte2 - 0xE0] + ' &= ' + dv.getInt8(pos);
            o.len = 3;
            break;
        default:
            console.log("Opcode 0x80 0x" + byte2.toString(16) + " not recognized")
        }
        break;
    case 0x81:
        byte2 = dv.getUint8(pos);
        pos++;
        switch (byte2) {
        case 0x00:
        case 0x01:
        case 0x02:
        case 0x03:
        case 0x04:
        case 0x05:
        case 0x06:
        case 0x07:
            o.op = 'add';
            o.text = '*[' + register[byte2] + '] += ' + dv.getInt32(pos, !0);
            o.len = 6;
            break;
        case 0x08:
        case 0x09:
        case 0x0A:
        case 0x0B:
        case 0x0C:
        case 0x0D:
        case 0x0E:
        case 0x0F:
            o.op = 'or';
            o.text = '*[' + register[byte2 - 0x08] + '] |= ' + dv.getInt32(pos, !0);
            o.len = 6;
            break;
        case 0x10:
        case 0x11:
        case 0x12:
        case 0x13:
        case 0x14:
        case 0x15:
        case 0x16:
        case 0x17:
            o.op = 'adc';
            o.text = 'adc *[' + register[byte2 - 0x10] + '], ' + dv.getInt32(pos, !0);
            o.len = 6;
            break;
        case 0x18:
        case 0x19:
        case 0x1A:
        case 0x1B:
        case 0x1C:
        case 0x1D:
        case 0x1E:
        case 0x1F:
            o.op = 'sbb';
            o.text = 'sbb *[' + register[byte2 - 0x18] + '], ' + dv.getInt32(pos, !0);
            o.len = 6;
            break;
        case 0x20:
        case 0x21:
        case 0x22:
        case 0x23:
        case 0x24:
        case 0x25:
        case 0x26:
        case 0x27:
            o.op = 'and';
            o.text = '*[' + register[byte2 - 0x20] + '] &= ' + dv.getInt32(pos, !0);
            o.len = 6;
            break;
        case 0x28:
        case 0x29:
        case 0x2A:
        case 0x2B:
        case 0x2C:
        case 0x2D:
        case 0x2E:
        case 0x2F:
            o.op = 'sub';
            o.text = '*[' + register[byte2 - 0x28] + '] -= ' + dv.getInt32(pos, !0);
            o.len = 6;
            break;
        case 0x30:
        case 0x31:
        case 0x32:
        case 0x33:
        case 0x34:
        case 0x35:
        case 0x36:
        case 0x37:
            o.op = 'xor';
            o.text = '*[' + register[byte2 - 0x30] + '] ^= ' + dv.getInt32(pos, !0);
            o.len = 6;
            break;
        case 0x38:
        case 0x39:
        case 0x3A:
        case 0x3B:
        case 0x3C:
        case 0x3D:
        case 0x3E:
        case 0x3F:
            o.op = 'cmp';
            o.text = 'cmp *[' + register[byte2 - 0x38] + '], ' + dv.getInt32(pos, !0);
            o.len = 6;
            break;
        case 0x40:
        case 0x41:
        case 0x42:
        case 0x43:
        case 0x44:
        case 0x45:
        case 0x46:
        case 0x47:
            o.text = 'add *[' + register[byte2 - 0x40] + '+' + dv.getInt8(pos) + '], ' + dv.getInt32(pos + 1, !0);
            o.len = 7;
            break;
        case 0x48:
        case 0x49:
        case 0x4A:
        case 0x4B:
        case 0x4C:
        case 0x4D:
        case 0x4E:
        case 0x4F:
            o.text = 'or *[' + register[byte2 - 0x48] + '+' + dv.getInt8(pos) + '], ' + dv.getInt32(pos + 1, !0);
            o.len = 7;
            break;
        case 0x50:
        case 0x51:
        case 0x52:
        case 0x53:
        case 0x54:
        case 0x55:
        case 0x56:
        case 0x57:
            o.text = 'adc *[' + register[byte2 - 0x50] + '+' + dv.getInt8(pos) + '], ' + dv.getInt32(pos + 1, !0);
            o.len = 7;
            break;
        case 0x58:
        case 0x59:
        case 0x5A:
        case 0x5B:
        case 0x5C:
        case 0x5D:
        case 0x5E:
        case 0x5F:
            o.text = 'sbb *[' + register[byte2 - 0x58] + '+' + dv.getInt8(pos) + '], ' + dv.getInt32(pos + 1, !0);
            o.len = 7;
            break;
        case 0x60:
        case 0x61:
        case 0x62:
        case 0x63:
        case 0x64:
        case 0x65:
        case 0x66:
        case 0x67:
            o.text = 'and *[' + register[byte2 - 0x60] + '+' + dv.getInt8(pos) + '], ' + dv.getInt32(pos + 1, !0);
            o.len = 7;
            break;
        case 0x68:
        case 0x69:
        case 0x6A:
        case 0x6B:
        case 0x6C:
        case 0x6D:
        case 0x6E:
        case 0x6F:
            o.text = 'sub *[' + register[byte2 - 0x68] + '+' + dv.getInt8(pos) + '], ' + dv.getInt32(pos + 1, !0);
            o.len = 7;
            break;
        case 0x70:
        case 0x71:
        case 0x72:
        case 0x73:
        case 0x74:
        case 0x75:
        case 0x76:
        case 0x77:
            o.text = 'xor *[' + register[byte2 - 0x70] + '+' + dv.getInt8(pos) + '], ' + dv.getInt32(pos + 1, !0);
            o.len = 7;
            break;
        case 0x78:
        case 0x79:
        case 0x7A:
        case 0x7B:
        case 0x7C:
        case 0x7D:
        case 0x7E:
        case 0x7F:
            o.text = 'cmp *[' + register[byte2 - 0x78] + '+' + dv.getInt8(pos) + '], ' + dv.getInt32(pos + 1, !0);
            o.len = 7;
            break;
        case 0x80:
        case 0x81:
        case 0x82:
        case 0x83:
        case 0x84:
        case 0x85:
        case 0x86:
        case 0x87:
            o.text = 'add *[' + register[byte2 - 0x80] + '+' + dv.getInt32(pos, !0) + '], ' + dv.getInt32(pos + 4, !0);
            o.len = 10;
            break;
        case 0x88:
        case 0x89:
        case 0x8A:
        case 0x8B:
        case 0x8C:
        case 0x8D:
        case 0x8E:
        case 0x8F:
            o.text = 'or *[' + register[byte2 - 0x88] + '+' + dv.getInt32(pos, !0) + '], ' + dv.getInt32(pos + 4, !0);
            o.len = 10;
            break;
        case 0x90:
        case 0x91:
        case 0x92:
        case 0x93:
        case 0x94:
        case 0x95:
        case 0x96:
        case 0x97:
            o.text = 'adc *[' + register[byte2 - 0x90] + '+' + dv.getInt32(pos, !0) + '], ' + dv.getInt32(pos + 4, !0);
            o.len = 10;
            break;
        case 0x98:
        case 0x99:
        case 0x9A:
        case 0x9B:
        case 0x9C:
        case 0x9D:
        case 0x9E:
        case 0x9F:
            o.text = 'sbb *[' + register[byte2 - 0x98] + '+' + dv.getInt32(pos, !0) + '], ' + dv.getInt32(pos + 4, !0);
            o.len = 10;
            break;
        case 0xA0:
        case 0xA1:
        case 0xA2:
        case 0xA3:
        case 0xA4:
        case 0xA5:
        case 0xA6:
        case 0xA7:
            o.text = 'and *[' + register[byte2 - 0xA0] + '+' + dv.getInt32(pos, !0) + '], ' + dv.getInt32(pos + 4, !0);
            o.len = 10;
            break;
        case 0xA8:
        case 0xA9:
        case 0xAA:
        case 0xAB:
        case 0xAC:
        case 0xAD:
        case 0xAE:
        case 0xAF:
            o.text = 'sub *[' + register[byte2 - 0xA8] + '+' + dv.getInt32(pos, !0) + '], ' + dv.getInt32(pos + 4, !0);
            o.len = 10;
            break;
        case 0xB0:
        case 0xB1:
        case 0xB2:
        case 0xB3:
        case 0xB4:
        case 0xB5:
        case 0xB6:
        case 0xB7:
            o.text = 'xor *[' + register[byte2 - 0xB0] + '+' + dv.getInt32(pos, !0) + '], ' + dv.getInt32(pos + 4, !0);
            o.len = 10;
            break;
        case 0xB8:
        case 0xB9:
        case 0xBA:
        case 0xBB:
        case 0xBC:
        case 0xBD:
        case 0xBE:
        case 0xBF:
            o.text = 'cmp *[' + register[byte2 - 0xB8] + '+' + dv.getInt32(pos, !0) + '], ' + dv.getInt32(pos + 4, !0);
            o.len = 10;
            break;
        case 0xC0:
        case 0xC1:
        case 0xC2:
        case 0xC3:
        case 0xC4:
        case 0xC5:
        case 0xC6:
        case 0xC7:
            o.op = 'add';
            o.text = register[byte2 - 0xC0] + ' += ' + dv.getInt32(pos, !0);
            o.len = 6;
            break;
        case 0xC8:
        case 0xC9:
        case 0xCA:
        case 0xCB:
        case 0xCC:
        case 0xCD:
        case 0xCE:
        case 0xCF:
            o.op = 'or';
            o.text = register[byte2 - 0xC8] + ' |= ' + dv.getInt32(pos, !0);
            o.len = 6;
            break;
        case 0xD0:
        case 0xD1:
        case 0xD2:
        case 0xD3:
        case 0xD4:
        case 0xD5:
        case 0xD6:
        case 0xD7:
            o.op = 'adc';
            o.text = 'adc ' + register[byte2 - 0xD0] + ', ' + dv.getInt32(pos, !0);
            o.len = 6;
            break;
        case 0xD8:
        case 0xD9:
        case 0xDA:
        case 0xDB:
        case 0xDC:
        case 0xDD:
        case 0xDE:
        case 0xDF:
            o.op = 'sbb';
            o.text = 'sbb ' + register[byte2 - 0xD8] + ', ' + dv.getInt32(pos, !0);
            o.len = 6;
            break;
        case 0xE0:
        case 0xE1:
        case 0xE2:
        case 0xE3:
        case 0xE4:
        case 0xE5:
        case 0xE6:
        case 0xE7:
            o.op = 'and';
            o.text = register[byte2 - 0xE0] + ' &= ' + dv.getInt32(pos, !0);
            o.len = 6;
            break;
        case 0xE8:
        case 0xE9:
        case 0xEA:
        case 0xEB:
        case 0xEC:
        case 0xED:
        case 0xEE:
        case 0xEF:
            o.op = 'sub';
            o.text = register[byte2 - 0xE8] + ' -= ' + dv.getInt32(pos, !0);
            o.len = 6;
            break;
        case 0xF0:
        case 0xF1:
        case 0xF2:
        case 0xF3:
        case 0xF4:
        case 0xF5:
        case 0xF6:
        case 0xF7:
            o.op = 'xor';
            o.text = register[byte2 - 0xF0] + ' ^= ' + dv.getInt32(pos, !0);
            o.len = 6;
            break;
        case 0xF8:
        case 0xF9:
        case 0xFA:
        case 0xFB:
        case 0xFC:
        case 0xFD:
        case 0xFE:
        case 0xFF:
            o.op = 'cmp';
            o.text = 'cmp ' + register[byte2 - 0xF8] + ', ' + dv.getInt32(pos, !0);
            o.len = 6;
            break
        }
        break;
    case 0x83:
        byte2 = dv.getUint8(pos);
        pos++;
        switch (byte2) {
        case 0x78:
        case 0x79:
        case 0x7A:
        case 0x7B:
        case 0x7C:
        case 0x7D:
        case 0x7E:
        case 0x7F:
            o.op = 'cmp';
            o.text = 'cmp *(' + register[byte2 - 0x78] + '+' + dv.getInt8(pos) + ') == ' + dv.getInt8(pos + 1);
            o.len = 4;
            break;
        case 0xC0:
        case 0xC1:
        case 0xC2:
        case 0xC3:
        case 0xC4:
        case 0xC5:
        case 0xC6:
        case 0xC7:
            o.op = 'add';
            o.text = register[byte2 - 0xC0] + ' += ' + dv.getInt8(pos);
            o.len = 3;
            break;
        case 0xC8:
        case 0xC9:
        case 0xCA:
        case 0xCB:
        case 0xCC:
        case 0xCD:
        case 0xCE:
        case 0xCF:
            o.op = 'or';
            o.text = register[byte2 - 0xC8] + ' |= ' + dv.getInt8(pos);
            o.len = 3;
            break;
        case 0xD0:
        case 0xD1:
        case 0xD2:
        case 0xD3:
        case 0xD4:
        case 0xD5:
        case 0xD6:
        case 0xD7:
            o.op = 'adc';
            o.text = 'adc ' + register[byte2 - 0xD0] + ', ' + dv.getInt8(pos);
            o.len = 3;
            break;
        case 0xE0:
        case 0xE1:
        case 0xE2:
        case 0xE3:
        case 0xE4:
        case 0xE5:
        case 0xE6:
        case 0xE7:
            o.op = 'and';
            o.text = register[byte2 - 0xE0] + ' &= ' + dv.getInt8(pos);
            o.len = 3;
            break;
        case 0xE8:
        case 0xE9:
        case 0xEA:
        case 0xEB:
        case 0xEC:
        case 0xED:
        case 0xEE:
        case 0xEF:
            o.op = 'sub';
            o.text = register[byte2 - 0xE8] + ' -= ' + dv.getInt8(pos);
            o.len = 3;
            break;
        case 0xF8:
        case 0xF9:
        case 0xFA:
        case 0xFB:
        case 0xFC:
        case 0xFD:
        case 0xFE:
        case 0xFF:
            o.op = 'cmp';
            o.text = 'cmp ' + register[byte2 - 0xF8] + ' == ' + dv.getInt8(pos);
            o.len = 3;
            break;
        default:
            console.log("Opcode 0x81 0x" + byte2.toString(16) + " not recognized")
        }
        break;
    case 0x84:
        byte2 = dv.getUint8(pos);
        pos++;
        switch (byte2) {
        case 0xC0:
        case 0xC1:
        case 0xC2:
        case 0xC3:
        case 0xC4:
        case 0xC5:
        case 0xC6:
        case 0xC7:
        case 0xC8:
        case 0xC9:
        case 0xCA:
        case 0xCB:
        case 0xCC:
        case 0xCD:
        case 0xCE:
        case 0xCF:
        case 0xD0:
        case 0xD1:
        case 0xD2:
        case 0xD3:
        case 0xD4:
        case 0xD5:
        case 0xD6:
        case 0xD7:
        case 0xD8:
        case 0xD9:
        case 0xDA:
        case 0xDB:
        case 0xDC:
        case 0xDD:
        case 0xDE:
        case 0xDF:
        case 0xE0:
        case 0xE1:
        case 0xE2:
        case 0xE3:
        case 0xE4:
        case 0xE5:
        case 0xE6:
        case 0xE7:
        case 0xE8:
        case 0xE9:
        case 0xEA:
        case 0xEB:
        case 0xEC:
        case 0xED:
        case 0xEE:
        case 0xEF:
        case 0xF0:
        case 0xF1:
        case 0xF2:
        case 0xF3:
        case 0xF4:
        case 0xF5:
        case 0xF6:
        case 0xF7:
        case 0xF8:
        case 0xF9:
        case 0xFA:
        case 0xFB:
        case 0xFC:
        case 0xFD:
        case 0xFE:
        case 0xFF:
            o.op = 'test';
            o.text = registerSm[byte2 & 7] + ' == ' + registerSm[(byte2 - 0xC0) >>> 3];
            o.len = 2;
            break;
        default:
            console.log("Opcode 0x84 0x" + byte2.toString(16) + " not recognized")
        }
        break;
    case 0x85:
        byte2 = dv.getUint8(pos);
        pos++;
        switch (byte2) {
        case 0xC0:
            o.op = 'test';
            o.text = 'eax == eax';
            o.len = 2;
            break;
        case 0xD2:
            o.op = 'test';
            o.text = 'edx == edx';
            o.len = 2;
            break;
        default:
            console.log("Opcode 0x85 0x" + byte2.toString(16) + " not recognized")
        }
        break;
    case 0x88:
        byte2 = dv.getUint8(pos);
        pos++;
        switch (byte2) {
        case 0x44:
            byte3 = dv.getUint8(pos);
            pos++;
            switch (byte3) {
            case 0x24:
                o.op = 'mov';
                o.text = '*(esp+' + dv.getInt8(pos) + ') = al';
                o.len = 4;
                break;
            default:
                console.log("Opcode 0x88 0x44 0x" + byte3.toString(16) + " not recognized")
            }
            break;
        case 0x5C:
            byte3 = dv.getUint8(pos);
            pos++;
            switch (byte3) {
            case 0x24:
                o.op = 'mov';
                o.text = '*(esp+' + dv.getInt8(pos) + ') = bl';
                o.len = 4;
                break;
            default:
                console.log("Opcode 0x88 0x5C 0x" + byte3.toString(16) + " not recognized")
            }
            break;
        case 0xC0:
        case 0xC1:
        case 0xC2:
        case 0xC3:
        case 0xC4:
        case 0xC5:
        case 0xC6:
        case 0xC7:
        case 0xC8:
        case 0xC9:
        case 0xCA:
        case 0xCB:
        case 0xCC:
        case 0xCD:
        case 0xCE:
        case 0xCF:
        case 0xD0:
        case 0xD1:
        case 0xD2:
        case 0xD3:
        case 0xD4:
        case 0xD5:
        case 0xD6:
        case 0xD7:
        case 0xD8:
        case 0xD9:
        case 0xDA:
        case 0xDB:
        case 0xDC:
        case 0xDD:
        case 0xDE:
        case 0xDF:
        case 0xE0:
        case 0xE1:
        case 0xE2:
        case 0xE3:
        case 0xE4:
        case 0xE5:
        case 0xE6:
        case 0xE7:
        case 0xE8:
        case 0xE9:
        case 0xEA:
        case 0xEB:
        case 0xEC:
        case 0xED:
        case 0xEE:
        case 0xEF:
        case 0xF0:
        case 0xF1:
        case 0xF2:
        case 0xF3:
        case 0xF4:
        case 0xF5:
        case 0xF6:
        case 0xF7:
        case 0xF8:
        case 0xF9:
        case 0xFA:
        case 0xFB:
        case 0xFC:
        case 0xFD:
        case 0xFE:
        case 0xFF:
            o.op = 'mov';
            o.text = registerSm[byte2 & 7] + ' = ' + registerSm[(byte2 - 0xC0) >>> 3];
            o.len = 2;
            break;
        default:
            console.log("Opcode 0x88 0x" + byte2.toString(16) + " not recognized")
        }
        break;
    case 0x89:
        byte2 = dv.getUint8(pos);
        pos++;
        switch (byte2) {
        case 0x04:
        case 0x0C:
        case 0x14:
        case 0x1C:
        case 0x24:
        case 0x2C:
        case 0x34:
        case 0x3C:
            byte3 = dv.getUint8(pos);
            pos++;
            switch (byte3) {
            case 0x24:
                o.op = 'mov';
                o.text = '*esp = ' + register[(byte2 - 4) / 8];
                o.len = 3;
                break;
            default:
                console.log("Opcode 0x89 0x" + byte2.toString(16) + " 0x" + byte3.toString(16) + " not recognized")
            }
            break;
        case 0x44:
        case 0x4C:
        case 0x54:
        case 0x5C:
        case 0x64:
        case 0x6C:
        case 0x74:
        case 0x7C:
            byte3 = dv.getUint8(pos);
            pos++;
            switch (byte3) {
            case 0x24:
                o.op = 'mov';
                o.text = '*(esp+' + dv.getInt8(pos) + ') = ' + register[(byte2 - 0x44) / 8];
                o.len = 4;
                break;
            default:
                console.log("Opcode 0x89 0x" + byte2.toString(16) + " 0x" + byte3.toString(16) + " not recognized")
            }
            break;
        case 0x84:
            byte3 = dv.getUint8(pos);
            pos++;
            switch (byte3) {
            case 0x24:
                o.op = 'mov';
                o.text = '*(esp+' + dv.getInt32(pos, !0) + ') = ' + register[(byte2 - 0x84) / 8];
                o.len = 7;
                break;
            default:
                console.log("Opcode 0x89 0x" + byte2.toString(16) + " 0x" + byte3.toString(16) + " not recognized")
            }
            break;
        case 0xC0:
        case 0xC1:
        case 0xC2:
        case 0xC3:
        case 0xC4:
        case 0xC5:
        case 0xC6:
        case 0xC7:
        case 0xC8:
        case 0xC9:
        case 0xCA:
        case 0xCB:
        case 0xCC:
        case 0xCD:
        case 0xCE:
        case 0xCF:
        case 0xD0:
        case 0xD1:
        case 0xD2:
        case 0xD3:
        case 0xD4:
        case 0xD5:
        case 0xD6:
        case 0xD7:
        case 0xD8:
        case 0xD9:
        case 0xDA:
        case 0xDB:
        case 0xDC:
        case 0xDD:
        case 0xDE:
        case 0xDF:
        case 0xE0:
        case 0xE1:
        case 0xE2:
        case 0xE3:
        case 0xE4:
        case 0xE5:
        case 0xE6:
        case 0xE7:
        case 0xE8:
        case 0xE9:
        case 0xEA:
        case 0xEB:
        case 0xEC:
        case 0xED:
        case 0xEE:
        case 0xEF:
        case 0xF0:
        case 0xF1:
        case 0xF2:
        case 0xF3:
        case 0xF4:
        case 0xF5:
        case 0xF6:
        case 0xF7:
        case 0xF8:
        case 0xF9:
        case 0xFA:
        case 0xFB:
        case 0xFC:
        case 0xFD:
        case 0xFE:
        case 0xFF:
            o.op = 'mov';
            o.text = register[byte2 & 7] + ' = ' + register[(byte2 - 0xC0) >>> 3];
            o.len = 2;
            break;
        default:
            console.log("Opcode 0x89 0x" + byte2.toString(16) + " not recognized")
        }
        break;
    case 0x8A:
        byte2 = dv.getUint8(pos);
        pos++;
        switch (byte2) {
        case 0x44:
            byte3 = dv.getUint8(pos);
            pos++;
            switch (byte3) {
            case 0x24:
                o.op = 'mov';
                o.text = 'al = *(esp+' + dv.getInt8(pos) + ')';
                o.len = 4;
                break;
            default:
                console.log("Opcode 0x8A 0x" + byte2.toString(16) + " 0x" + byte3.toString(16) + " not recognized")
            }
            break;
        default:
            console.log("Opcode 0x8A 0x" + byte2.toString(16) + " not recognized")
        }
        break;
    case 0x8B:
        byte2 = dv.getUint8(pos);
        pos++;
        switch (byte2) {
        case 0x00:
        case 0x01:
        case 0x02:
        case 0x03:
        case 0x04:
        case 0x05:
        case 0x06:
        case 0x07:
        case 0x08:
        case 0x09:
        case 0x0A:
        case 0x0B:
        case 0x0C:
        case 0x0D:
        case 0x0E:
        case 0x0F:
        case 0x10:
        case 0x11:
        case 0x12:
        case 0x13:
        case 0x14:
        case 0x15:
        case 0x16:
        case 0x17:
        case 0x18:
        case 0x19:
        case 0x1A:
        case 0x1B:
        case 0x1C:
        case 0x1D:
        case 0x1E:
        case 0x1F:
        case 0x20:
        case 0x21:
        case 0x22:
        case 0x23:
        case 0x24:
        case 0x25:
        case 0x26:
        case 0x27:
        case 0x28:
        case 0x29:
        case 0x2A:
        case 0x2B:
        case 0x2C:
        case 0x2D:
        case 0x2E:
        case 0x2F:
        case 0x30:
        case 0x31:
        case 0x32:
        case 0x33:
        case 0x34:
        case 0x35:
        case 0x36:
        case 0x37:
        case 0x38:
        case 0x39:
        case 0x3A:
        case 0x3B:
        case 0x3C:
        case 0x3D:
        case 0x3E:
        case 0x3F:
            if ((byte2 & 7) === 4) {
                byte3 = dv.getUint8(pos);
                pos++;
                if (byte3 === 0x24) {
                    o.op = 'mov';
                    o.text = register[byte2 >>> 3] + ' = *' + register[byte2 & 7];
                    o.len = 3
                } else {
                    console.log("Opcode 0x8B 0x" + byte2.toString(16) + " 0x" + byte3.toString(16) + " not recognized")
                }
            } else if ((byte2 & 7) === 5) {
                o.op = 'mov';
                o.text = register[byte2 >>> 3] + ' = ' + dv.getUint32(pos, !0);
                o.len = 6
            } else {
                o.op = 'mov';
                o.text = register[byte2 >>> 3] + ' = *' + register[byte2 & 7];
                o.len = 2
            }
            break;
        case 0x40:
        case 0x41:
        case 0x42:
        case 0x43:
        case 0x44:
        case 0x45:
        case 0x46:
        case 0x47:
        case 0x48:
        case 0x49:
        case 0x4A:
        case 0x4B:
        case 0x4C:
        case 0x4D:
        case 0x4E:
        case 0x4F:
        case 0x50:
        case 0x51:
        case 0x52:
        case 0x53:
        case 0x54:
        case 0x55:
        case 0x56:
        case 0x57:
        case 0x58:
        case 0x59:
        case 0x5A:
        case 0x5B:
        case 0x5C:
        case 0x5D:
        case 0x5E:
        case 0x5F:
        case 0x60:
        case 0x61:
        case 0x62:
        case 0x63:
        case 0x64:
        case 0x65:
        case 0x66:
        case 0x67:
        case 0x68:
        case 0x69:
        case 0x6A:
        case 0x6B:
        case 0x6C:
        case 0x6D:
        case 0x6E:
        case 0x6F:
        case 0x70:
        case 0x71:
        case 0x72:
        case 0x73:
        case 0x74:
        case 0x75:
        case 0x76:
        case 0x77:
        case 0x78:
        case 0x79:
        case 0x7A:
        case 0x7B:
        case 0x7C:
        case 0x7D:
        case 0x7E:
        case 0x7F:
            if ((byte2 & 7) === 4) {
                byte3 = dv.getUint8(pos);
                pos++;
                if (byte3 === 0x24) {
                    o.op = 'mov';
                    o.text = register[(byte2 - 0x40) >>> 3] + ' = *(' + register[byte2 & 7] + '+' + dv.getInt8(pos) + ')';
                    o.len = 4
                } else {
                    console.log("Opcode 0x8B 0x" + byte2.toString(16) + " 0x" + byte3.toString(16) + " not recognized")
                }
            } else {
                o.op = 'mov';
                o.text = register[(byte2 - 0x40) >>> 3] + ' = *(' + register[byte2 & 7] + '+' + dv.getInt8(pos) + ')';
                o.len = 3
            }
            break;
        case 0x80:
        case 0x81:
        case 0x82:
        case 0x83:
        case 0x84:
        case 0x85:
        case 0x86:
        case 0x87:
        case 0x88:
        case 0x89:
        case 0x8A:
        case 0x8B:
        case 0x8C:
        case 0x8D:
        case 0x8E:
        case 0x8F:
        case 0x90:
        case 0x91:
        case 0x92:
        case 0x93:
        case 0x94:
        case 0x95:
        case 0x96:
        case 0x97:
        case 0x98:
        case 0x99:
        case 0x9A:
        case 0x9B:
        case 0x9C:
        case 0x9D:
        case 0x9E:
        case 0x9F:
        case 0xA0:
        case 0xA1:
        case 0xA2:
        case 0xA3:
        case 0xA4:
        case 0xA5:
        case 0xA6:
        case 0xA7:
        case 0xA8:
        case 0xA9:
        case 0xAA:
        case 0xAB:
        case 0xAC:
        case 0xAD:
        case 0xAE:
        case 0xAF:
        case 0xB0:
        case 0xB1:
        case 0xB2:
        case 0xB3:
        case 0xB4:
        case 0xB5:
        case 0xB6:
        case 0xB7:
        case 0xB8:
        case 0xB9:
        case 0xBA:
        case 0xBB:
        case 0xBC:
        case 0xBD:
        case 0xBE:
        case 0xBF:
            if ((byte2 & 7) === 4) {
                byte3 = dv.getUint8(pos);
                pos++;
                if (byte3 === 0x24) {
                    o.op = 'mov';
                    o.text = register[(byte2 - 0x80) >>> 3] + ' = *(' + register[byte2 & 7] + '+' + dv.getInt32(pos, !0) + ')';
                    o.len = 7
                } else {
                    console.log("Opcode 0x8B 0x" + byte2.toString(16) + " 0x" + byte3.toString(16) + " not recognized")
                }
            } else {
                o.op = 'mov';
                o.text = register[(byte2 - 0x80) >>> 3] + ' = *(' + register[byte2 & 7] + '+' + dv.getInt32(pos, !0) + ')';
                o.len = 6;
                break
            }
            break;
        case 0xC0:
        case 0xC1:
        case 0xC2:
        case 0xC3:
        case 0xC4:
        case 0xC5:
        case 0xC6:
        case 0xC7:
        case 0xC8:
        case 0xC9:
        case 0xCA:
        case 0xCB:
        case 0xCC:
        case 0xCD:
        case 0xCE:
        case 0xCF:
        case 0xD0:
        case 0xD1:
        case 0xD2:
        case 0xD3:
        case 0xD4:
        case 0xD5:
        case 0xD6:
        case 0xD7:
        case 0xD8:
        case 0xD9:
        case 0xDA:
        case 0xDB:
        case 0xDC:
        case 0xDD:
        case 0xDE:
        case 0xDF:
        case 0xE0:
        case 0xE1:
        case 0xE2:
        case 0xE3:
        case 0xE4:
        case 0xE5:
        case 0xE6:
        case 0xE7:
        case 0xE8:
        case 0xE9:
        case 0xEA:
        case 0xEB:
        case 0xEC:
        case 0xED:
        case 0xEE:
        case 0xEF:
        case 0xF0:
        case 0xF1:
        case 0xF2:
        case 0xF3:
        case 0xF4:
        case 0xF5:
        case 0xF6:
        case 0xF7:
        case 0xF8:
        case 0xF9:
        case 0xFA:
        case 0xFB:
        case 0xFC:
        case 0xFD:
        case 0xFE:
        case 0xFF:
            o.op = 'mov';
            o.text = register[(byte2 - 0xC0) >>> 3] + ' = ' + register[byte2 & 7];
            o.len = 2;
            break
        }
        break;
    case 0x8D:
        byte2 = dv.getUint8(pos);
        pos++;
        switch (byte2) {
        case 0x40:
        case 0x41:
        case 0x42:
        case 0x43:
        case 0x44:
        case 0x45:
        case 0x46:
        case 0x47:
        case 0x48:
        case 0x49:
        case 0x4A:
        case 0x4B:
        case 0x4C:
        case 0x4D:
        case 0x4E:
        case 0x4F:
        case 0x50:
        case 0x51:
        case 0x52:
        case 0x53:
        case 0x54:
        case 0x55:
        case 0x56:
        case 0x57:
        case 0x58:
        case 0x59:
        case 0x5A:
        case 0x5B:
        case 0x5C:
        case 0x5D:
        case 0x5E:
        case 0x5F:
        case 0x60:
        case 0x61:
        case 0x62:
        case 0x63:
        case 0x64:
        case 0x65:
        case 0x66:
        case 0x67:
        case 0x68:
        case 0x69:
        case 0x6A:
        case 0x6B:
        case 0x6C:
        case 0x6D:
        case 0x6E:
        case 0x6F:
        case 0x70:
        case 0x71:
        case 0x72:
        case 0x73:
        case 0x74:
        case 0x75:
        case 0x76:
        case 0x77:
        case 0x78:
        case 0x79:
        case 0x7A:
        case 0x7B:
        case 0x7C:
        case 0x7D:
        case 0x7E:
        case 0x7F:
            if ((byte2 & 7) === 4) {
                byte3 = dv.getUint8(pos);
                pos++;
                if (byte3 === 0x24) {
                    o.op = 'lea';
                    o.text = 'lea ' + register[(byte2 - 0x40) >>> 3] + ', *(' + register[byte2 & 7] + '+' + dv.getInt8(pos) + ')';
                    o.len = 4
                } else {
                    console.log("Opcode 0x8D 0x" + byte2.toString(16) + " 0x" + byte3.toString(16) + " not recognized")
                }
            } else {
                o.op = 'lea';
                o.text = 'lea ' + register[(byte2 - 0x40) >>> 3] + ', *(' + register[byte2 & 7] + '+' + dv.getInt8(pos) + ')';
                o.len = 3
            }
            break;
        case 0x80:
        case 0x81:
        case 0x82:
        case 0x83:
        case 0x84:
        case 0x85:
        case 0x86:
        case 0x87:
        case 0x88:
        case 0x89:
        case 0x8A:
        case 0x8B:
        case 0x8C:
        case 0x8D:
        case 0x8E:
        case 0x8F:
        case 0x90:
        case 0x91:
        case 0x92:
        case 0x93:
        case 0x94:
        case 0x95:
        case 0x96:
        case 0x97:
        case 0x98:
        case 0x99:
        case 0x9A:
        case 0x9B:
        case 0x9C:
        case 0x9D:
        case 0x9E:
        case 0x9F:
        case 0xA0:
        case 0xA1:
        case 0xA2:
        case 0xA3:
        case 0xA4:
        case 0xA5:
        case 0xA6:
        case 0xA7:
        case 0xA8:
        case 0xA9:
        case 0xAA:
        case 0xAB:
        case 0xAC:
        case 0xAD:
        case 0xAE:
        case 0xAF:
        case 0xB0:
        case 0xB1:
        case 0xB2:
        case 0xB3:
        case 0xB4:
        case 0xB5:
        case 0xB6:
        case 0xB7:
        case 0xB8:
        case 0xB9:
        case 0xBA:
        case 0xBB:
        case 0xBC:
        case 0xBD:
        case 0xBE:
        case 0xBF:
            if ((byte2 & 7) === 4) {
                byte3 = dv.getUint8(pos);
                pos++;
                if (byte3 === 0x24) {
                    o.op = 'lea';
                    o.text = 'lea ' + register[(byte2 - 0x80) >>> 3] + ', *(' + register[byte2 & 7] + '+' + dv.getInt32(pos, !0) + ')';
                    o.len = 7
                } else {
                    console.log("Opcode 0x8D 0x" + byte2.toString(16) + " 0x" + byte3.toString(16) + " not recognized")
                }
            } else {
                o.op = 'lea';
                o.text = 'lea ' + register[(byte2 - 0x80) >>> 3] + ', *(' + register[byte2 & 7] + '+' + dv.getInt32(pos, !0) + ')';
                o.len = 6
            }
            break;
        default:
            console.log("Opcode 0x8D 0x" + byte2.toString(16) + " not recognized")
        }
        break;
    case 0xA0:
        o.op = 'mov';
        o.text = 'al = *(' + dv.getInt32(pos, !0) + ')';
        o.len = 5;
        break;
    case 0xA1:
        o.op = 'mov';
        o.text = 'eax = *(' + dv.getInt32(pos, !0) + ')';
        o.len = 5;
        break;
    case 0xA2:
        o.op = 'mov';
        o.text = '*(' + dv.getInt32(pos, !0) + ') = al';
        o.len = 5;
        break;
    case 0xA3:
        o.op = 'mov';
        o.text = '*(' + dv.getInt32(pos, !0) + ') = eax';
        o.len = 5;
        break;
    case 0xB0:
    case 0xB1:
    case 0xB2:
    case 0xB3:
    case 0xB4:
    case 0xB5:
    case 0xB6:
    case 0xB7:
        o.op = 'mov';
        o.text = registerSm[opcode - 0xB0] + ' = ' + dv.getUint8(pos, !0);
        o.len = 2;
        break;
    case 0xB8:
    case 0xB9:
    case 0xBA:
    case 0xBB:
    case 0xBC:
    case 0xBD:
    case 0xBE:
    case 0xBF:
        o.op = 'mov';
        o.text = register[opcode - 0xB8] + ' = ' + dv.getInt32(pos, !0);
        o.len = 5;
        break;
    case 0xC3:
        o.op = 'ret';
        o.text = '<b>return</b>';
        o.len = 1;
        break;
    case 0xC6:
        byte2 = dv.getUint8(pos);
        pos++;
        switch (byte2) {
        case 0x44:
            byte3 = dv.getUint8(pos);
            pos++;
            switch (byte3) {
            case 0x24:
                o.op = 'mov';
                o.text = '*(esp+' + dv.getInt8(pos) + ') = ' + dv.getInt8(pos + 1);
                o.len = 5;
                break;
            default:
                console.log("Opcode 0xC6 0x" + byte2.toString(16) + " 0x" + byte3.toString(16) + " not recognized")
            }
            break;
        default:
            console.log("Opcode 0xC6 0x" + byte2.toString(16) + " not recognized")
        }
        break;
    case 0xC7:
        byte2 = dv.getUint8(pos);
        pos++;
        switch (byte2) {
        case 0x04:
            byte3 = dv.getUint8(pos);
            pos++;
            switch (byte3) {
            case 0x24:
                o.op = 'mov';
                o.text = '*esp = ' + dv.getInt32(pos, !0);
                o.len = 7;
                break;
            default:
                console.log("Opcode 0xC7 0x04 0x" + byte3.toString(16) + " not recognized")
            }
            break;
        case 0x44:
            byte3 = dv.getUint8(pos);
            pos++;
            switch (byte3) {
            case 0x24:
                o.op = 'mov';
                o.text = '*(esp+' + dv.getInt8(pos) + ') = ' + dv.getInt32(pos + 1, !0);
                o.len = 8;
                break;
            default:
                console.log("Opcode 0xC7 0x44 0x" + byte3.toString(16) + " not recognized")
            }
            break;
        default:
            console.log("Opcode 0xC7 0x" + byte2.toString(16) + " not recognized")
        }
        break;
    case 0xE8:
        o.op = 'call';
        byte2 = dv.getInt32(pos, !0);
        if (byte2 === -4) {
            o.text = 'call(???)'
        } else {
            o.text = 'call(' + pad((offset + 5 + dv.getInt32(pos, !0)).toString(16), 8) + ')'
        }
        o.len = 5;
        break;
    case 0xE9:
        o.op = 'jmp';
        o.text = 'jmp(' + pad((offset + 5 + dv.getInt32(pos, !0)).toString(16), 8) + ')';
        o.len = 5;
        break;
    case 0xeB:
        o.op = 'jmp';
        o.text = 'jmp(' + pad((offset + 2 + dv.getInt8(pos)).toString(16), 8) + ')';
        o.len = 2;
        break;
    case 0xF6:
        byte2 = dv.getUint8(pos);
        pos++;
        switch (byte2) {
        case 0x44:
            byte3 = dv.getUint8(pos);
            pos++;
            switch (byte3) {
            case 0x24:
                o.op = 'test';
                o.text = '*(esp+' + dv.getInt8(pos) + ')' + ' == ' + dv.getInt8(pos + 1);
                o.len = 5;
                break;
            default:
                console.log("Opcode 0xF6 0x" + byte2.toString(16) + " 0x" + byte3.toString(16) + " not recognized")
            }
            break;
        case 0xC0:
        case 0xC1:
        case 0xC2:
        case 0xC3:
        case 0xC4:
        case 0xC5:
        case 0xC6:
        case 0xC7:
            o.op = 'test';
            o.text = registerSm[byte2 - 0xC0] + ' == ' + dv.getInt8(pos);
            o.len = 3;
            break;
        default:
            console.log("Opcode 0xF6 0x" + byte2.toString(16) + " not recognized")
        }
        break;
    case 0xFF:
        byte2 = dv.getUint8(pos);
        pos++;
        switch (byte2) {
        case 0xC0:
        case 0xC1:
        case 0xC2:
        case 0xC3:
        case 0xC4:
        case 0xC5:
        case 0xC6:
        case 0xC7:
            o.op = 'inc';
            o.text = register[byte2 - 0xC0] + '++';
            o.len = 2;
            break;
        case 0xC8:
        case 0xC9:
        case 0xCA:
        case 0xCB:
        case 0xCC:
        case 0xCD:
        case 0xCE:
        case 0xCF:
            o.op = 'dec';
            o.text = register[byte2 - 0xC8] + '++';
            o.len = 2;
            break;
        case 0xD0:
        case 0xD1:
        case 0xD2:
        case 0xD3:
        case 0xD4:
        case 0xD5:
        case 0xD6:
        case 0xD7:
            o.op = 'call';
            o.text = 'call(' + register[byte2 - 0xD0] + ')';
            o.len = 2;
            break;
        case 0xE0:
        case 0xE1:
        case 0xE2:
        case 0xE3:
        case 0xE4:
        case 0xE5:
        case 0xE6:
        case 0xE7:
            o.op = 'jmp';
            o.text = 'jmp(' + register[byte2 - 0xE0] + ')';
            o.len = 2;
            break;
        default:
            console.log("Opcode 0xFF 0x" + byte2.toString(16) + " not recognized")
        }
        break;
    default:
        console.log("Opcode 0x" + opcode.toString(16) + " not recognized")
    }
    return o
}
function readULEB128(dv, pos) {
    var initPos = pos;
    var result = 0;
    var shift = 0;
    for (; ; ) {
        let byte = dv.getUint8(pos);
        pos++;
        result |= (byte & 0x7F) << shift;
        shift += 7;
        if (byte < 0x80)
            break
    }
    {
        let out = Object.create(null);
        out.num = result;
        out.len = pos - initPos;
        return out
    }
}
function readSLEB128(dv, pos) {
    var initPos = pos;
    var result = 0;
    var shift = 0;
    var byte;
    for (; ; ) {
        byte = dv.getUint8(pos);
        pos++;
        result |= (byte & 0x7F) << shift;
        shift += 7;
        if (byte < 0x80)
            break
    }
    if (byte & 0x40) {
        result |= (-1) << shift
    }
    {
        let out = Object.create(null);
        out.num = result;
        out.len = pos - initPos;
        return out
    }
}
class BitReader {
    constructor(dv) {
        this.dv = dv;
        this.pos = 0;
    }
    r(numBits) {
        let out = 0;
        for (let i = 0; i < numBits; i++) {
            out += this.readBit() << i
        }
        return out
    }
    readBit() {
        const bool = this.dv.getUint8(this.pos >> 3) & (1 << (this.pos & 7));
        this.pos++;
        return (bool !== 0) ? 1 : 0
    }
}
class BitWriter {
    constructor() {
        this.pos = 0;
        this.arr = [];
        this.posFinal = 0;
        this.arrFinal = [];
        this.seqNumber = 0;
        this.granule = 0;
    }

    copy(reader, numBytes) {
        if (numBytes === 0)
            return;
        var rOffset = reader.pos & 7;
        var wOffset = this.pos & 7;
        if (rOffset === wOffset) {
            this.w(reader.r(8 - rOffset), 8 - rOffset);
            for (let i = 1; i < numBytes; i++) {
                this.arr[this.pos >>> 3] = reader.dv.getUint8(reader.pos >>> 3);
                reader.pos += 8;
                this.pos += 8
            }
            if (rOffset > 0)
                this.w(reader.r(rOffset), rOffset)
        } else {
            this.w(reader.r(8 - rOffset), 8 - rOffset);
            let newWOffset = this.pos & 7;
            let prevVal = this.arr[this.pos >>> 3];
            let andMask = (1 << (8 - newWOffset)) - 1;
            for (let i = 1; i < numBytes; i++) {
                let curVal = reader.dv.getUint8(reader.pos >>> 3);
                reader.pos += 8;
                this.arr[this.pos >>> 3] = prevVal | ((curVal & andMask) << newWOffset);
                this.pos += 8;
                prevVal = curVal >>> (8 - newWOffset)
            }
            this.arr[this.pos >>> 3] = prevVal;
            if (rOffset > 0)
                this.w(reader.r(rOffset), rOffset)
        }
    }
    w(num, numBits) {
        let bin = num.toString(2);
        if (numBits < bin.length) {
            bin = String(bin.substr(-numBits))
        } else {
            bin = String(bin).padStart(numBits, '0')
        }
        for (let i = numBits - 1; i >= 0; i--) {
            this.writeBit(bin[i] === '1')
        }
    }
    writeBit(bit) {
        if ((this.pos & 7) === 0) {
            this.arr[this.pos >>> 3] = 0
        }
        if (bit) {
            this.arr[this.pos >>> 3] |= 1 << (this.pos & 7)
        }
        this.pos++
    }
    flushPage(newGranule, isLast) {
        var payloadSize = (this.pos + 7) >>> 3;
        var numSegments = Math.floor((payloadSize + 255) / 255);
        var startPos = this.posFinal;
        this.arrFinal[this.posFinal++] = 0x4F;
        this.arrFinal[this.posFinal++] = 0x67;
        this.arrFinal[this.posFinal++] = 0x67;
        this.arrFinal[this.posFinal++] = 0x53;
        this.arrFinal[this.posFinal++] = 0;
        var headerType = 0;
        if (this.seqNumber === 0)
            headerType |= 2;
        if (isLast)
            headerType |= 4;
        this.arrFinal[this.posFinal++] = headerType;
        this.granule += newGranule;
        this.arrFinal[this.posFinal++] = this.granule & 0xFF;
        this.arrFinal[this.posFinal++] = (this.granule & 0xFF00) >>> 8;
        this.arrFinal[this.posFinal++] = (this.granule & 0xFF0000) >>> 16;
        this.arrFinal[this.posFinal++] = this.granule >>> 24;
        this.arrFinal[this.posFinal++] = 0;
        this.arrFinal[this.posFinal++] = 0;
        this.arrFinal[this.posFinal++] = 0;
        this.arrFinal[this.posFinal++] = 0;
        this.arrFinal[this.posFinal++] = 1;
        this.arrFinal[this.posFinal++] = 0;
        this.arrFinal[this.posFinal++] = 0;
        this.arrFinal[this.posFinal++] = 0;
        this.arrFinal[this.posFinal++] = this.seqNumber & 0xFF;
        this.arrFinal[this.posFinal++] = (this.seqNumber >>> 8) & 0xFF;
        this.arrFinal[this.posFinal++] = (this.seqNumber >>> 16) & 0xFF;
        this.arrFinal[this.posFinal++] = (this.seqNumber >>> 24) & 0xFF;
        var crcPos = this.posFinal;
        this.arrFinal[this.posFinal++] = 0;
        this.arrFinal[this.posFinal++] = 0;
        this.arrFinal[this.posFinal++] = 0;
        this.arrFinal[this.posFinal++] = 0;
        this.arrFinal[this.posFinal++] = numSegments;
        for (let i = 1; i < numSegments; i++) {
            this.arrFinal[this.posFinal++] = 255;
            payloadSize -= 255
        }
        this.arrFinal[this.posFinal++] = payloadSize;
        for (let i = 0; i < this.arr.length; i++) {
            this.arrFinal[this.posFinal++] = this.arr[i]
        }
        this.pos = 0;
        this.arr = [];
        var crc = 0;
        for (let i = startPos; i < this.posFinal; i++) {
            crc = (crc ^ ((this.arrFinal[i] & 0xFF) << (32 - 8))) & 0xFFFFFFFF;
            var pos = (crc >> (32 - 8)) & 0xFF;
            crc = (crc << 8) & 0xFFFFFFFF;
            crc = (crc ^ OggCrc[pos]) & 0xFFFFFFFF
        }
        this.arrFinal[crcPos] = crc & 0xFF;
        this.arrFinal[crcPos + 1] = (crc >>> 8) & 0xFF;
        this.arrFinal[crcPos + 2] = (crc >>> 16) & 0xFF;
        this.arrFinal[crcPos + 3] = (crc >>> 24) & 0xFF;
        this.seqNumber++
    }
    toArray() {
        var view = new Uint8Array(this.arrFinal.length);
        for (var i = 0; i < this.arrFinal.length; i++) {
            view[i] = this.arrFinal[i]
        }
        return view.buffer
    }
}
var OggCrc = [0x00000000, 0x04C11DB7, 0x09823B6E, 0x0D4326D9, 0x130476DC, 0x17C56B6B, 0x1A864DB2, 0x1E475005, 0x2608EDB8, 0x22C9F00F, 0x2F8AD6D6, 0x2B4BCB61, 0x350C9B64, 0x31CD86D3, 0x3C8EA00A, 0x384FBDBD, 0x4C11DB70, 0x48D0C6C7, 0x4593E01E, 0x4152FDA9, 0x5F15ADAC, 0x5BD4B01B, 0x569796C2, 0x52568B75, 0x6A1936C8, 0x6ED82B7F, 0x639B0DA6, 0x675A1011, 0x791D4014, 0x7DDC5DA3, 0x709F7B7A, 0x745E66CD, 0x9823B6E0, 0x9CE2AB57, 0x91A18D8E, 0x95609039, 0x8B27C03C, 0x8FE6DD8B, 0x82A5FB52, 0x8664E6E5, 0xBE2B5B58, 0xBAEA46EF, 0xB7A96036, 0xB3687D81, 0xAD2F2D84, 0xA9EE3033, 0xA4AD16EA, 0xA06C0B5D, 0xD4326D90, 0xD0F37027, 0xDDB056FE, 0xD9714B49, 0xC7361B4C, 0xC3F706FB, 0xCEB42022, 0xCA753D95, 0xF23A8028, 0xF6FB9D9F, 0xFBB8BB46, 0xFF79A6F1, 0xE13EF6F4, 0xE5FFEB43, 0xE8BCCD9A, 0xEC7DD02D, 0x34867077, 0x30476DC0, 0x3D044B19, 0x39C556AE, 0x278206AB, 0x23431B1C, 0x2E003DC5, 0x2AC12072, 0x128E9DCF, 0x164F8078, 0x1B0CA6A1, 0x1FCDBB16, 0x018AEB13, 0x054BF6A4, 0x0808D07D, 0x0CC9CDCA, 0x7897AB07, 0x7C56B6B0, 0x71159069, 0x75D48DDE, 0x6B93DDDB, 0x6F52C06C, 0x6211E6B5, 0x66D0FB02, 0x5E9F46BF, 0x5A5E5B08, 0x571D7DD1, 0x53DC6066, 0x4D9B3063, 0x495A2DD4, 0x44190B0D, 0x40D816BA, 0xACA5C697, 0xA864DB20, 0xA527FDF9, 0xA1E6E04E, 0xBFA1B04B, 0xBB60ADFC, 0xB6238B25, 0xB2E29692, 0x8AAD2B2F, 0x8E6C3698, 0x832F1041, 0x87EE0DF6, 0x99A95DF3, 0x9D684044, 0x902B669D, 0x94EA7B2A, 0xE0B41DE7, 0xE4750050, 0xE9362689, 0xEDF73B3E, 0xF3B06B3B, 0xF771768C, 0xFA325055, 0xFEF34DE2, 0xC6BCF05F, 0xC27DEDE8, 0xCF3ECB31, 0xCBFFD686, 0xD5B88683, 0xD1799B34, 0xDC3ABDED, 0xD8FBA05A, 0x690CE0EE, 0x6DCDFD59, 0x608EDB80, 0x644FC637, 0x7A089632, 0x7EC98B85, 0x738AAD5C, 0x774BB0EB, 0x4F040D56, 0x4BC510E1, 0x46863638, 0x42472B8F, 0x5C007B8A, 0x58C1663D, 0x558240E4, 0x51435D53, 0x251D3B9E, 0x21DC2629, 0x2C9F00F0, 0x285E1D47, 0x36194D42, 0x32D850F5, 0x3F9B762C, 0x3B5A6B9B, 0x0315D626, 0x07D4CB91, 0x0A97ED48, 0x0E56F0FF, 0x1011A0FA, 0x14D0BD4D, 0x19939B94, 0x1D528623, 0xF12F560E, 0xF5EE4BB9, 0xF8AD6D60, 0xFC6C70D7, 0xE22B20D2, 0xE6EA3D65, 0xEBA91BBC, 0xEF68060B, 0xD727BBB6, 0xD3E6A601, 0xDEA580D8, 0xDA649D6F, 0xC423CD6A, 0xC0E2D0DD, 0xCDA1F604, 0xC960EBB3, 0xBD3E8D7E, 0xB9FF90C9, 0xB4BCB610, 0xB07DABA7, 0xAE3AFBA2, 0xAAFBE615, 0xA7B8C0CC, 0xA379DD7B, 0x9B3660C6, 0x9FF77D71, 0x92B45BA8, 0x9675461F, 0x8832161A, 0x8CF30BAD, 0x81B02D74, 0x857130C3, 0x5D8A9099, 0x594B8D2E, 0x5408ABF7, 0x50C9B640, 0x4E8EE645, 0x4A4FFBF2, 0x470CDD2B, 0x43CDC09C, 0x7B827D21, 0x7F436096, 0x7200464F, 0x76C15BF8, 0x68860BFD, 0x6C47164A, 0x61043093, 0x65C52D24, 0x119B4BE9, 0x155A565E, 0x18197087, 0x1CD86D30, 0x029F3D35, 0x065E2082, 0x0B1D065B, 0x0FDC1BEC, 0x3793A651, 0x3352BBE6, 0x3E119D3F, 0x3AD08088, 0x2497D08D, 0x2056CD3A, 0x2D15EBE3, 0x29D4F654, 0xC5A92679, 0xC1683BCE, 0xCC2B1D17, 0xC8EA00A0, 0xD6AD50A5, 0xD26C4D12, 0xDF2F6BCB, 0xDBEE767C, 0xE3A1CBC1, 0xE760D676, 0xEA23F0AF, 0xEEE2ED18, 0xF0A5BD1D, 0xF464A0AA, 0xF9278673, 0xFDE69BC4, 0x89B8FD09, 0x8D79E0BE, 0x803AC667, 0x84FBDBD0, 0x9ABC8BD5, 0x9E7D9662, 0x933EB0BB, 0x97FFAD0C, 0xAFB010B1, 0xAB710D06, 0xA6322BDF, 0xA2F33668, 0xBCB4666D, 0xB8757BDA, 0xB5365D03, 0xB1F740B4, ];
