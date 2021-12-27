const fs = require('fs');
const es = require('event-stream');
const hashSeperator = '#';

class HashData {
    constructor(ph, sh, filename, crc) {
        this.ph = ph;
        this.sh = sh;
        this.filename = filename;
        this.crc = crc;
    }
}

class HashDictionary {
    constructor(fPath) {
        this.fileNameByHash = {};
        this.hashByFileName = {};

        this.fPath = fPath;
    }

    /**
     * loads a hash from the hash file
     * @param  {int} ph primary hash value
     * @param  {int} sh secondary hash value
     * @param  {String} name the file's name
     * @param  {int} crc the content redundancy check number
     */
    loadHash(ph, sh, name, crc) {
        const hashData = new HashData(ph, sh, name, crc);
        this.hashByFileName[name] = hashData;
        this.fileNameByHash[`${parseInt(sh, 16)}|${parseInt(ph, 16)}`] = hashData;
    }

    async loadHashList(progressBarElem) {
        const hashData = fs.createReadStream(this.fPath)
        let downloaded = 0;
        const len = hashData.readableLength;

        hashData.pipe(es.split()).pipe(es.mapSync((line) => {
            hashData.pause();

            const strsplt = line.split(hashSeperator);
            const ph = strsplt[0];
            const sh = strsplt[1];
            const fileName = strsplt[2];
            const crc = strsplt[3];

            this.loadHash(ph, sh, fileName, crc);

            hashData.resume();
        }).on('data', (chunk) => {
            downloaded += chunk.length;
            const percentage = (100.0 * downloaded / len).toFixed(2);
            if (progressBarElem) {
                progressBarElem.style.width = `${percentage}%`;
            }
        }));
    }

    /**
     * gets the file hash given a file name
     * @param  {String} name the file's name
     * 
     * @returns {Array} Array containing primary and secondary hashes.
     */
    getHashByFileName(name) { const entry = this.hashByFileName[name]; return [entry?.ph, entry?.sh]; }

    /**
     * gets the file name based on the provided hash
     * @param  {string} hash the file's hash
     * 
     * @returns {string} Name of the file with that hash
     */
    getFileNameByHash(hash) {
        const entry = this.fileNameByHash[hash];
        return entry?.filename;
    }
}

export {HashDictionary};