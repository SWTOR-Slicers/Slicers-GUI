const fs = require('fs');
const path = require('path');
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
        this.hashList = {};

        this.fPath = fPath;
    }

    /**
     * loads a hash from the hash file
     * @param  {int} ph primary hash value
     * @param  {int} sh secondary hash value
     * @param  {String} name the file's name
     * @param  {int} crc the content redundancy check number
     */
    loadHash(ph, sh, name, crc) { this.hashList[name] = new HashData(ph, sh, name, crc); }

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
    getHashByFileName(name) { const entry = this.hashList[name]; return [entry.ph, entry.sh]; }

    /**
     * gets the file name based on the provided hashes
     * @param  {String} ph the file's primary hash
     * @param  {String} sh the file's secondary hash
     * 
     * @returns {HashData} HashData instance for the provided hashes.
     */
    getFileNameByHash(ph, sh) { const entry = Object.values(this.hashList).find((hash, idx) => { return hash.ph === ph && hash.sh === sh; }); return entry; }
}

export {HashDictionary};