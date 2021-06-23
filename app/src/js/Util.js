import { codebooks } from "./classes/Cookbooks.js";
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
    const existingStyles = document.getElementsByTagName('link');
    let exists = false;
    for (let i = 0; i < existingStyles.length; i++) {
        const l = existingStyles[i];
        if (l.href == href) {
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
