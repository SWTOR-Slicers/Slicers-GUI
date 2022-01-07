const fs = require('fs');
const { Float16Array } = require("@petamoriken/float16");

/**
 * A custom Reader class for ease of use.
 */
let GLOBAL_ENDIANNESS = true;
class Reader {
    constructor(data) {
        this.buffer = data instanceof ArrayBuffer ? data : data.buffer;
        this.data = data instanceof ArrayBuffer ? data : data.buffer;
        this.view = new DataView(this.buffer);
        this.offset = 0;
    }

    #readI(method, bytes) {
        return function (endianness) {
            const res = this.view[method](this.offset, endianness ? endianness : GLOBAL_ENDIANNESS);
            this.offset += bytes;
            return res;
        }
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
    readByte = this.#readI('getInt8', 1);

    /**
     * read the next char and return a string.
     * @param  {boolean} endianness whether or not to use littleEdian. Default is true.
     */
    readChar(endianness = true) {
        const res = this.#readI('getInt8', 1)(endianness);
        return res.toString();
    }

    /**
     * reads the next (length) bytes and returns a Uint8 array.
     * @param  {number} length the number of bytes to read
     * @param  {boolean} endianness whether or not to use littleEdian. Default is true.
     */
    readBytes(length, endianness = true) {
        const res = new Uint8Array(this.data, this.offset, length);
        this.offset += length;
        return (endianness ? endianness : GLOBAL_ENDIANNESS) ? res : res.reverse();
    }

    /**
     * reads the next Uint of length 1
     */
    readUint8 = this.#readI('getUint8', 1)

    /**
     * reads the next Uint of length 2
     * @param  {boolean} endianness whether or not to use littleEdian. Default is true.
     */
    readUint16 = this.#readI('getUint16', 2)

    /**
     * reads the next Uint of length 4
     * @param  {boolean} endianness whether or not to use littleEdian. Default is true.
     */
    readUint32 = this.#readI('getUint32', 4)

    /**
     * reads the next Uint of length 8
     * @param  {boolean} endianness whether or not to use littleEdian. Default is true.
     */
    readUint64 = this.#readI('getBigUint64', 8);

    /**
     * reads the next Int of length 1
     */
    readInt8 = this.#readI('getInt8', 1)

    /**
     * reads the next Int of length 2
     * @param  {boolean} endianness whether or not to use littleEdian. Default is true.
     */
    readInt16 = this.#readI('getInt16', 2)

    /**
     * reads the next Int of length 4
     * @param  {boolean} endianness whether or not to use littleEdian. Default is true.
     */
    readInt32 = this.#readI('getInt32', 4)

    /**
     * reads the next Int of length 8
     * @param  {boolean} endianness whether or not to use littleEdian. Default is true.
     */
    readInt64 = this.#readI('getBigInt64', 8)

    /**
     * reads the next Float of length 2
     * @param  {boolean} endianness whether or not to use littleEdian. Default is true.
     */
    readFloat16(endianness = true) {
        const res = new Float16Array(this.data, this.offset, 1);
        this.offset += 2;
        return (endianness ? endianness : GLOBAL_ENDIANNESS) ? res[0] : res.reverse()[0];
    }

    /**
     * reads the next Float of length 4
     * @param  {boolean} endianness whether or not to use littleEdian. Default is true.
     */
    readFloat32 = this.#readI('getFloat32', 4)

    /**
     * reads the next Float of length 4
     * @param  {boolean} endianness whether or not to use littleEdian. Default is true.
     */
    readFloat64 = this.#readI('getFloat64', 8)

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