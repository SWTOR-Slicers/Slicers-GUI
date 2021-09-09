import { hashlittle2, uint64, readString as readStr, readVarInt, uint64C } from "../../Util.js";
import { GOM } from "../../classes/util/Gom.js";
import { DomLoader } from "../../classes/DomLoaders.js";

const path = require('path');
const { promises: { readFile }, writeFileSync, readFileSync, existsSync, mkdirSync, unlinkSync } = require('fs');
const edge = require('electron-edge-js');

const cache = {
    "configPath": "",
    "tmpPath": "",
    "dump": {
        "client": {},
        "buckets": {},
        "prototypes": {}
    },
    "store": {}
}
const decompressZlib = edge.func({
    source: function() {/*
        using ICSharpCode.SharpZipLib.Zip.Compression.Streams;
    
        public class Startup
        {
            public async Task<object> Invoke(object input)
            {
                byte[] buffer = (byte[])input.buffer;
                Stream stream = new Stream(buffer);
                var inflaterStream = new InflaterInputStream(archiveStream);

                byte[] decompressed = new byte[inflaterStream.Length];
                inflaterStream.Read(decompressed, 0, inflaterStream.Length);

                return decompressed;
            }
        }
    */},
    references: [ `${path.join(path.dirname(cache['configPath']), 'scripts', 'ICSharpCode.SharpZipLib.dll')}` ]
});

onmessage = (e) => {
    console.log(e);
    switch (e.data.message) {
        case "init":
            console.log('worker created.');
            cache['configPath'] = path.normalize(path.join(e.data.data, "config.json"));
            break;
        case "loadNodes":
            // loadNodes(e.data.data.torFiles[1], false);
            loadNodes(e.data.data.torFiles[0], e.data.data.loadProts);
            // if (e.data.data.loadProts) {
            //     loadNodes(e.data.data.torFiles[0], false);
            // }
            // setTimeout(() => {
            //     loadNodes(e.data.data.torFiles[0], e.data.data.loadProts);
            // }, 100);
            break;
        case "decompressCompl":
            const decompressedPath = e.data.data[1];
            const resData = readFileSync(decompressedPath).buffer;
            unlinkSync(decompressedPath);
            if (e.data.data[0] == "clientGOM") {
                const {gomArchive, data, torPath} = cache['dump']['client'];
                cache['dump']['client'] = {};
                loadClientGOM(gomArchive, data, torPath, new DataView(resData));
            } else if (e.data.data[0] == "buckets") {
                const {gomArchive, data, torPath} = cache['dump']['buckets'];
                cache['dump']['buckets'] = {};
                loadBuckets(gomArchive, data, torPath, new DataView(resData));
            } else if (e.data.data[0] == "prototypes") {
                const {gomArchive, data, torPath} = cache['dump']['prototypes'];
                cache['dump']['prototypes'] = {};
                loadPrototypes(gomArchive, data, torPath, new DataView(resData));
            } else {
                throw new Error("Unexpected compressed name");
            }
            break;
    }
}

async function loadNodes(torPath, loadProts) {
    cache['tmpPath'] = cache['tmpPath'] == "" ? await getTmpFilePath() : cache['tmpPath'];
    let ftOffset = 0;
    let firstLoop = true;
    const ftCapacity = 1000;
    const fileName = path.basename(torPath);

    const gomArchive = {
        "files": {
            /* format:
             * "hash": data
             */
        }
    }
    
    readFile(torPath).then(buff => {
        const data = buff.buffer;
        const datView = new DataView(data);
        ftOffset = datView.getUint32(12, !0);

        while (ftOffset != 0 || firstLoop) {
            if (firstLoop) firstLoop = false;
            const blob = data.slice(ftOffset, ftOffset + 12 + ftCapacity * 34);
            const dv = new DataView(blob);

            const newCapacity = dv.getUint32(0, !0);
            if (newCapacity !== ftCapacity) {
                console.error('Expected capacity of' + ftCapacity + 'but saw capacity' + newCapacity + 'in' + fileName);
                ftCapacity = newCapacity;
                break;
            }

            ftOffset = dv.getUint32(4, !0);

            for (let i = 12, c = 12 + ftCapacity * 34; i < c; i += 34) {
                let offset = dv.getUint32(i, !0);
                if (offset === 0)
                    continue;
                offset += dv.getUint32(i + 8, !0);
                const comprSize = dv.getUint32(i + 12, !0);
                const uncomprSize = dv.getUint32(i + 16, !0);
                const sh = dv.getUint32(i + 20, !0);
                const ph = dv.getUint32(i + 24, !0);
                if (sh === 0xC75A71E6 && ph === 0xE4B96113)
                    continue;
                if (sh === 0xCB34F836 && ph === 0x8478D2E1)
                    continue;
                if (sh === 0x02C9CF77 && ph === 0xF077E262)
                    continue;
                const compression = dv.getUint8(i + 32);
                const fileObj = {};
                fileObj.sh = sh;
                fileObj.ph = ph;
                fileObj.offset = offset;
                fileObj.size = uncomprSize;
                fileObj.comprSize = (compression !== 0) ? comprSize : 0;
                fileObj.isCompressed = compression !== 0;
                fileObj.name = undefined;
                const hash = sh + '|' + ph;
                
                gomArchive.files[hash] = fileObj
            }
        }

        if (Object.keys(gomArchive.files).length > 0) {
            if (path.basename(torPath).indexOf('systemgenerated_gom_1') > -1) {
                findClientGOM(gomArchive, data, torPath);
            } else if (loadProts) {
                findPrototypes(gomArchive, data, torPath);
            } else {
                cache['store']['gomArchive'] = gomArchive;
                cache['store']['data'] = data;
                cache['store']['torPath'] = torPath;
                findGom(gomArchive, data, torPath);
            }
        }
    }).catch(err => {
        throw err;
    });
}

function findClientGOM(gomArchive, data, torPath) {
    const gomFileHash = hashlittle2("/resources/systemgenerated/client.gom");
    const gomFileEntr = gomArchive.files[`${gomFileHash[1]}|${gomFileHash[0]}`];

    const dat = data.slice(gomFileEntr.offset, gomFileEntr.offset + (gomFileEntr.isCompressed ? gomFileEntr.comprSize : gomFileEntr.size));
    let blob = null;
    if (gomFileEntr.isCompressed) {
        cache['dump']['client']['gomArchive'] = gomArchive;
        cache['dump']['client']['data'] = data;
        cache['dump']['client']['torPath'] = torPath;
        ionicDecompress(path.join(cache['tmpPath'], 'client.gom'), new Uint8Array(dat), 'clientGOM');
    } else {
        blob = dat;
        const infoDV = new DataView(blob);
        loadClientGOM(gomArchive, data, torPath, infoDV);
    }
}
/**
 * Loads the client gom nodes.
 * @param {Object} gomArchive An object representing the gom archive file table.
 * @param {ArrayBuffer} data Raw arraybuffer representing the gom archive .tor file.
 * @param {String} torPath File path of the gom archive .tor file.
 * @param {DataView} infoDV DataView representing the gom archive .tor file.
 */
function loadClientGOM(gomArchive, data, torPath, infoDV) {
    const DomElements = [];

    let pos = 0
    // Check DBLB
    const magicNum = infoDV.getInt32(pos, true)
    pos += 4;
    if (magicNum != 0x424C4244) {
        throw new Error("client.gom does not begin with DBLB");
    }

    pos += 4;

    while (true) {
        const iniPos = pos;
        // Begin Reading Gom Definitions

        const defLength = infoDV.getInt32(pos, true);
        pos += 4;

        // Length == 0 means we've read them all!
        if (defLength == 0) {
            break;
        }

        const defBuffer = new Uint8Array(defLength);
        pos += 4; // 4 blank bytes
        const defId = infoDV.getBigUint64(pos, true); // 8-byte type ID
        pos += 8;
        const defFlags = infoDV.getInt16(pos, true); // 16-bit flag field
        pos += 2;
        const defType = (defFlags >> 3) & 0x7;

        const defData = new Uint8Array(infoDV.buffer, pos, defLength - 18);
        defBuffer.set(defData, 18);

        const DomElem = new DomLoader(defType, new DataView(defBuffer.buffer), 0).getLoader().load();
        delete DomElem.Name;
        delete DomElem.Description;

        const DElem = DomElem;
        DElem.id = defId;
        DElem.fqn = GOM.fields[DElem.id];
        
        DomElements.push(DElem)

        // Read the required number of padding bytes
        const padding = ((8 - (defLength & 0x7)) & 0x7);

        pos = iniPos + defLength + padding;
    }

    postMessage({
        "message": 'DomElements',
        "data": DomElements
    })
}

function findGom(gomArchive, data, torPath) {
    const bucketInfoHash = hashlittle2(`/resources/systemgenerated/buckets.info`);
    const bucketInfoEntr = gomArchive.files[`${bucketInfoHash[1]}|${bucketInfoHash[0]}`];

    const dat = data.slice(bucketInfoEntr.offset, bucketInfoEntr.offset + (bucketInfoEntr.isCompressed ? bucketInfoEntr.comprSize : bucketInfoEntr.size));
    let blob = null;
    if (bucketInfoEntr.isCompressed) {
        cache['dump']['buckets']['gomArchive'] = gomArchive;
        cache['dump']['buckets']['data'] = data;
        cache['dump']['buckets']['torPath'] = torPath;
        ionicDecompress(path.join(cache['tmpPath'], 'buckets.info'), new Uint8Array(dat), 'buckets');
    } else {
        blob = dat;
        const infoDV = new DataView(blob);
        loadBuckets(gomArchive, data, torPath, infoDV);
    }
}
function loadBuckets(gomArchive, data, torPath, infoDV) {
    const bucketNames = [];
    let pos = 0x8;

    const c9 = new Uint8Array(infoDV.buffer, pos, 1)[0];
    pos++;
    if (c9 != 0xC9) {
        throw new Error(`Unexpected character in buckets.info @ offset 0x8 - expected 0xC9 found ${c9}`);
    }

    let numEntries = infoDV.getInt16(pos, false);
    pos += 2;

    for (var i = 0; i < numEntries; i++) {
        const res = readLengthPrefixString(infoDV, pos);
        const fileName = res[0];
        pos += res[1];
        bucketNames.push(fileName);
    }

    for (let i = 0; i < numEntries; i++) {
        const hashArr = hashlittle2(`/resources/systemgenerated/buckets/${bucketNames[i]}`);
        const file = gomArchive.files[`${hashArr[1]}|${hashArr[0]}`];

        if (file) {
            const blob = data.slice(file.offset, file.offset + file.size);
            loadBucket(i, new DataView(blob), torPath, file);
        }
    }
}
function loadBucket(bktIdx, dv, torPath, bktFile) {
    const magic = dv.getUint32(0, !0);
    if (magic !== 0x4B554250)
        return postMessage({
            "message": 'NODES',
            "data": []
        });
    const versionMajor = dv.getUint16(4, !0);
    const versionMinor = dv.getUint16(6, !0);
    if (versionMajor !== 2 || versionMinor !== 5)
        return postMessage({
            "message": 'NODES',
            "data": []
        });
    let pos = 8;
    const length = dv.byteLength - 12;
    const nodes = [];
    while (pos < length) {
        const dblbLength = dv.getUint32(pos, !0);
        pos += 4;
        const dblbStartOffset = pos;
        const dblbMagic = dv.getUint32(pos, !0);
        pos += 4;
        const dblbVersion = dv.getUint32(pos, !0);
        pos += 4;
        while (dblbStartOffset + dblbLength - pos >= 4) {
            const startOffset = pos;
            const tmpLength = dv.getUint32(pos, !0);
            pos += 4;
            if (tmpLength === 0)
                break;
            pos += 4;
            const idLo = dv.getUint32(pos, !0);
            pos += 4;
            const idHi = dv.getUint32(pos, !0);
            pos += 4;
            const id = uint64(idLo, idHi);
            const type = dv.getUint16(pos, !0);
            pos += 2;
            const dataOffset = dv.getUint16(pos, !0);
            pos += 2;
            const nameOffset = dv.getUint16(pos, !0);
            pos += 2;
            pos += 2;
            const baseClassLo = dv.getUint32(pos, !0);
            pos += 4;
            const baseClassHi = dv.getUint32(pos, !0);
            pos += 4;
            const baseClass = uint64(baseClassLo, baseClassHi);
            pos += 8;
            const uncomprLength = dv.getUint16(pos, !0);
            pos += 2;
            pos += 2;
            const uncomprOffset = dv.getUint16(pos, !0);
            pos += 2;
            pos += 2;
            const streamStyle = dv.getUint8(pos++);
            const name = readString(dv, startOffset + nameOffset);
            const dataLength = tmpLength - dataOffset;
            const node = {};
            node.id = id;
            node.fqn = name;
            node.baseClass = baseClass;
            node.bkt = {...bktFile, "bktIdx": bktIdx};
            node.isBucket = !0;
            node.dataOffset = startOffset + dataOffset;
            node.dataLength = dataLength;
            node.contentOffset = uncomprOffset - dataOffset;
            node.uncomprLength = uncomprLength;
            node.streamStyle = streamStyle;
            nodes.push({
                "node": node,
                "torPath": torPath
            });
            pos = dblbStartOffset + ((startOffset - dblbStartOffset + tmpLength + 7) & -8)
        }
    }
    postMessage({
        "message": 'NODES',
        "data": nodes
    })
}

function findPrototypes(gomArchive, data, torPath) {
    const protInfoHash = hashlittle2(`/resources/systemgenerated/prototypes.info`);
    const protInfoEntr = gomArchive.files[`${protInfoHash[1]}|${protInfoHash[0]}`];

    const dat = data.slice(protInfoEntr.offset, protInfoEntr.offset + (protInfoEntr.isCompressed ? protInfoEntr.comprSize : protInfoEntr.size));
    let blob = null;
    if (protInfoEntr.isCompressed) {
        cache['dump']['prototypes']['gomArchive'] = gomArchive;
        cache['dump']['prototypes']['data'] = data;
        cache['dump']['prototypes']['torPath'] = torPath;
        ionicDecompress(path.join(cache['tmpPath'], 'prototypes.info'), new Uint8Array(dat), 'prototypes');
    } else {
        blob = dat;
        const infoDV = new DataView(blob);
        loadPrototypes(gomArchive, data, torPath, infoDV);
    }
}
function loadPrototypes(gomArchive, data, torPath, dv) {
    const prototypes = [];
    let pos = 0;

    const magicNum = dv.getInt32(pos, true);
    pos += 4;
    if (magicNum != 0x464E4950) {
        throw new Error("prototypes.info does not begin with PINF");
    }

    pos += 4; // Skip 4 bytes

    const res = readVarInt(dv, pos);
    const numPrototypes = uint64C(res);
    pos += res.len;

    let protoLoaded = 0;
    for (let i = 0; i < numPrototypes; i++) {
        const res = readVarInt(dv, pos);
        const protId = uint64C(res);
        pos += res.len;

        const flag = new Uint8Array(dv.buffer, pos, 1)[0];
        pos++;

        if (flag == 1) {
            const hashArr = hashlittle2(`/resources/systemgenerated/prototypes/${protId}.node`);
            const file = gomArchive.files[`${hashArr[1]}|${hashArr[0]}`];

            if (file) {
                const blob = data.slice(file.offset, file.offset + file.comprSize);
                const decompressed = decompressZlib({
                    buffer: blob.buffer
                }, true);
                console.log(new Int32Array(blob));
                const node = loadPrototype(protId, new DataView(blob), torPath, file);
                prototypes.push(node);
                protoLoaded++;
            }
        }
    }

    console.log(prototypes);
    console.log(protoLoaded);
}
function loadPrototype(id, dv, torPath, prototype) {
    let pos = 0;

    // Check PROT
    const magicNum = dv.getInt32(pos, true);
    pos += 4;
    if (magicNum != 0x544F5250) {
        console.log(magicNum, 0x544F5250);
        console.error(`PROT node ${id} does not begin with PROT`);
        return null
    }

    pos += 4; // Skip 4 bytes

    const node = {};
    node.Id = dv.getBigUint64(pos, true);
    pos += 8;
    const nameLen = dv.getInt32(pos, true);
    pos += 4;
    node.fqn = GOM.fields[node.Id];
    node.Name = readString(dv, pos);
    pos++;

    pos++;

    // reader.ReadInt32();
    pos += 4;

    // reader.ReadInt32();
    pos += 4;
    
    // reader.ReadInt32();
    pos += 4;

    const baseClassRes = readVarInt(dv, pos);
    node.baseClass = uint64C(baseClassRes);
    pos += baseClassRes.len;

    // reader.ReadBytes(0x8);
    pos += 8;

    node.ObjectSizeInFile = dv.getInt32(pos, true); // 0x24
    node.IsCompressed = false;
    node.dataOffset = 20 + nameLen + 33; // 8 byte file header + node ID + nameLen + node name + 33 byte node header

    if (node.ObjectSizeInFile > 0) {
        node.dataLength = node.ObjectSizeInFile;
    } else {
        node.dataLength = 0;
    }

    // const startOffset = pos;
    // const tmpLength = dv.getUint32(pos, !0);
    // pos += 4;
    // if (tmpLength === 0)
    //     break;
    // pos += 4;
    // const idLo = dv.getUint32(pos, !0);
    // pos += 4;
    // const idHi = dv.getUint32(pos, !0);
    // pos += 4;
    // const id = uint64(idLo, idHi);
    // const type = dv.getUint16(pos, !0);
    // pos += 2;
    // const dataOffset = dv.getUint16(pos, !0);
    // pos += 2;
    // const nameOffset = dv.getUint16(pos, !0);
    // pos += 2;
    // pos += 2;
    // const baseClassLo = dv.getUint32(pos, !0);
    // pos += 4;
    // const baseClassHi = dv.getUint32(pos, !0);
    // pos += 4;
    // const baseClass = uint64(baseClassLo, baseClassHi);
    // pos += 8;
    // const uncomprLength = dv.getUint16(pos, !0);
    // pos += 2;
    // pos += 2;
    // const uncomprOffset = dv.getUint16(pos, !0);
    // pos += 2;
    // pos += 2;
    // const streamStyle = dv.getUint8(pos++);
    // const name = readString(dv, startOffset + nameOffset);
    // const dataLength = tmpLength - dataOffset;
    // const node = {};
    // node.id = id;
    // node.fqn = name;
    // node.baseClass = baseClass;
    // node.bkt = {...bktFile, "bktIdx": bktIdx};
    // node.isBucket = !0;
    // node.dataOffset = startOffset + dataOffset;
    // node.dataLength = dataLength;
    // node.contentOffset = uncomprOffset - dataOffset;
    // node.uncomprLength = uncomprLength;
    // node.streamStyle = streamStyle;
    node.torPath = torPath;

    return node;
}

// Utility functions
function readString(dv, pos) {
    let curChar = 0;
    let outName = '';
    while ((curChar = dv.getUint8(pos++)) !== 0) {
        outName += String.fromCharCode(curChar)
    }
    return outName
}
function readLengthPrefixString(dv, pos, length) {
    const strLength = length | readVarInt(dv, pos);
    return [readStr(dv.buffer, pos + strLength.len, strLength.intLo), strLength.len + strLength.intLo];
}
async function getTmpFilePath() {
    let res = readFileSync(cache['configPath']);
    let jsonObj = await JSON.parse(res);
    const resPath = path.join(jsonObj['outputFolder'], 'tmp');
    if (!existsSync(resPath)) {
        mkdirSync(resPath, {
            recursive: true
        });
    }
    return resPath;
}
function ionicDecompress(path, data, type) {
    writeFileSync(path, data);
    postMessage({
        "message": 'decompressIonic',
        "data": [type, path]
    });
}