const fs = require('fs');
const { Float16Array } = require("@petamoriken/float16");

/**
 * A custom Reader class for ease of use.
 */
 class Reader {
    constructor(data) {
        this.data = data instanceof ArrayBuffer ? data : data.buffer;
        this.offset = 0;
    }

    /**
     * seeks to the current offset
     * @param  {number} offset the new offset.
     * @param  {number} position the position to update from. 0 = start, 1 = current offset, 2 = end.
     */
     seek(offset, position = 0) {
        if (position == 0) {
            this.offset = Number(offset);
        } else if (position == 1) {
            this.offset = this.offset + Number(offset);
        } else if (position == 2) {
            this.offset = Number(this.data.byteLength) - Number(offset);
        } else {
            throw Error(`Unexpected position value. Expected 0, 1, or 2, but got ${position}.`);
        }
    }

    /**
     * read the next byte and return a Uint8 array.
     * @param  {boolean} endianness whether or not to use littleEdian. Default is true.
     */
    readByte(endianness = true) {
        const res = new Uint8Array(this.data, this.offset, 1);
        this.offset++;
        return endianness ? res[0] : res.reverse()[0];
    }

    /**
     * read the next char and return a string.
     * @param  {boolean} endianness whether or not to use littleEdian. Default is true.
     */
    readChar(endianness = true) {
        const res = new Uint8Array(this.data, this.offset, 1);
        this.offset += length;
        return endianness ? res[0].toString() : res.reverse()[0].toString();
    }

    /**
     * reads the next (length) bytes and returns a Uint8 array.
     * @param  {number} length the number of bytes to read
     * @param  {boolean} endianness whether or not to use littleEdian. Default is true.
     */
    readBytes(length, endianness = true) {
        const res = new Uint8Array(this.data, this.offset, length);
        this.offset += length;
        return endianness ? res : res.reverse();
    }

    /**
     * reads the next Uint of length 1
     */
     readUint8() {
        const res = new Uint8Array(this.data, this.offset, 1);
        this.offset++;
        return res[0];
    }

    /**
     * reads the next Uint of length 2
     * @param  {boolean} endianness whether or not to use littleEdian. Default is true.
     */
    readUint16(endianness = true) {
        const noDV = this.offset % 2 == 0 && endianness;
        const res = noDV ? new Uint16Array(this.data, this.offset, 1)[0] : new DataView(this.data).getUint16(this.offset, endianness);
        this.offset += 2;
        return res;
    }

    /**
     * reads the next Uint of length 4
     * @param  {boolean} endianness whether or not to use littleEdian. Default is true.
     */
    readUint32(endianness = true) {
        const noDV = this.offset % 4 == 0 && endianness;
        const res = noDV ? new Uint32Array(this.data, this.offset, 1)[0] : new DataView(this.data).getUint32(this.offset, endianness);
        this.offset += 4;
        return res;
    }

    /**
     * reads the next Uint of length 8
     * @param  {boolean} endianness whether or not to use littleEdian. Default is true.
     */
    readUint64(endianness = true) {
        const noDV = this.offset % 8 == 0;
        let res;
        if (noDV) {
            res = endianness ? BigInt(this.readUint32()) | BigInt(this.readUint32()) << 32n : BigInt(this.readUint32()) << 32n | BigInt(this.readUint32());
        } else {
            res = new DataView(this.data).getBigUint64(this.offset, endianness);
            this.offset += 8;
        }
        return res;
    }

    /**
     * reads the next Int of length 1
     */
     readInt8() {
        const res = new Int8Array(this.data, this.offset, 1);
        this.offset++;
        return res[0];
    }

    /**
     * reads the next Int of length 2
     * @param  {boolean} endianness whether or not to use littleEdian. Default is true.
     */
    readInt16(endianness = true) {
        const noDV = this.offset % 2 == 0 && endianness;
        const res = noDV ? new Int16Array(this.data, this.offset, 1)[0] : new DataView(this.data).getInt16(this.offset, endianness);
        this.offset += 2;
        return res;
    }

    /**
     * reads the next Int of length 4
     * @param  {boolean} endianness whether or not to use littleEdian. Default is true.
     */
    readInt32(endianness = true) {
        const noDV = this.offset % 4 == 0 && endianness;
        const res = noDV ? new Int32Array(this.data, this.offset, 1)[0] : new DataView(this.data).getInt32(this.offset, endianness);
        this.offset += 4;
        return res;
    }

    /**
     * reads the next Int of length 8
     * @param  {boolean} endianness whether or not to use littleEdian. Default is true.
     */
    readInt64(endianness = true) {
        const noDV = this.offset % 8 == 0;
        let res;
        if (noDV) {
            res = endianness ? BigInt(this.readInt32()) | BigInt(this.readInt32()) << 32n : BigInt(this.readInt32()) << 32n | BigInt(this.readInt32());
        } else {
            res = new DataView(this.data).getBigInt64(this.offset, endianness);
            this.offset += 8;
        }
        return res;
    }

    /**
     * reads the next Float of length 2
     * @param  {boolean} endianness whether or not to use littleEdian. Default is true.
     */
    readFloat16(endianness = true) {
        const res = new Float16Array(this.data, this.offset, 1);
        this.offset += 2;
        return endianness ? res[0] : res.reverse()[0];
    }

    /**
     * reads the next Float of length 4
     * @param  {boolean} endianness whether or not to use littleEdian. Default is true.
     */
    readFloat32(endianness = true) {
        const noDV = this.offset % 4 == 0 && endianness;
        const res = noDV ? new Float32Array(this.data, this.offset, 1)[0] : new DataView(this.data).getFloat32(this.offset, endianness);
        this.offset += 4;
        return res;
    }

    /**
     * reads the next Float of length 4
     * @param  {boolean} endianness whether or not to use littleEdian. Default is true.
     */
    readFloat64(endianness = true) {
        const noDV = this.offset % 8 == 0 && endianness;
        const res = noDV ? new Float64Array(this.data, this.offset, 1)[0] : new DataView(this.data).getFloat64(this.offset, endianness);
        this.offset += 8;
        return res;
    }

    /**
     * reads the next null terminated string.
     * @param  {number} length optional length of the string. Reads until 00 byte if undefined.
     */
    readString(length = undefined) {
        let outString = '';
        if (length === undefined) {
            let curChar = new Uint8Array(this.data, this.offset++, 1)[0];
            while (curChar !== 0) {
                outString += String.fromCharCode(curChar);
                curChar = new Uint8Array(this.data, this.offset++, 1)[0];
            }
        } else {
            for (let i = 0; i < length; i++) {
                const curChar = new Uint8Array(this.data, this.offset++, 1)[0];
                if (curChar === 0) break;
                outString += String.fromCharCode(curChar);
            }
        }
        return outString;
    }
}

class FileWrapper {
    constructor(path, mode = 'r') {
        this.path = path;
        if (!fs.existsSync(path)) fs.writeFileSync(path, new Uint8Array());
        this.descriptor = fs.openSync(path, mode);
        this.length = fs.statSync(path).size;
        this.offset = 0n;
    }

    /**
     * seeks to the current offset
     * @param  {number} offset the new offset.
     * @param  {number} position the position to update from. 0 = start, 1 = current offset, 2 = end.
     */
    seek(offset, position = 0) {
        if (position == 0) {
            this.offset = BigInt(offset);
        } else if (position == 1) {
            this.offset = this.offset + BigInt(offset);
        } else if (position == 2) {
            this.offset = BigInt(this.length) - BigInt(offset);
        } else {
            throw Error(`Unexpected position value. Expected 0, 1, or 2, but got ${position}.`);
        }
    }

    /**
     * reads 'length' bytes and returns an instance of Reader.
     * @param  {number} length the number of bytes to read.
     * @returns {Reader} custom binary reader.
     */
    read(length) {
        const data = this.copy(length);
        return new Reader(data);
    }
    /**
     * writes a data buffer to the file.
     * @param  {Buffer} data the data to write.
     */
    write(data) {
        return fs.writeSync(this.descriptor, data, 0, data.length, this.offset);
    }

    /**
     * reads 'length' bytes and returns a Uint8Array.
     * @param  {number} length the number of bytes to read.
     */
    copy(length) {
        const buffer = new Uint8Array(length);
        fs.readSync(this.descriptor, buffer, 0, length, Number(this.offset));
        this.offset += BigInt(length);
        return buffer;
    }

    /**
     * Closes the file descriptor referenced by this instance of FileWrapper.
     */
    close() {
        fs.closeSync(this.descriptor);
    }
}

export {FileWrapper, Reader};