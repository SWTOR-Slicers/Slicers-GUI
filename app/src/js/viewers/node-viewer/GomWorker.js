import { hashlittle2, uint64, readString as readStr, readVarInt, uint64C } from "../../Util.js";
import { GOM } from "../../classes/util/Gom.js";
import { DomLoader } from "../../classes/DomLoaders.js";

const path = require('path');
const { promises: { readFile }, readFileSync, existsSync, mkdirSync } = require('fs');
const edge = require('electron-edge-js');

const cache = {
    "configPath": "",
    "tmpPath": "",
    "store": {}
}
let decompressZlib = function(){};

onmessage = (e) => {
    switch (e.data.message) {
        case "init":
            cache['configPath'] = path.normalize(path.join(e.data.data, "config.json"));
            decompressZlib = edge.func({
                source: function() {/*
                    using System.IO;
                    using ICSharpCode.SharpZipLib.Zip.Compression.Streams;
                
                    async (dynamic input) => {
                        byte[] buffer = (byte[])input.buffer;
                        MemoryStream stream = new MemoryStream(buffer);
                        InflaterInputStream inflaterStream = new InflaterInputStream(stream);
        
                        byte[] decompressed = new byte[(int)input.dataLength];
                        inflaterStream.Read(decompressed, 0, (int)input.dataLength);
                        inflaterStream.Dispose();
                        stream.Close();
        
                        return decompressed;
                    }
                */},
                references: [ `${path.join(path.dirname(cache['configPath']), 'scripts', 'ICSharpCode.SharpZipLib.dll')}` ]
            });
            break;
        case "loadNodes":
            loadNodes(e.data.data.torFile);
            break;
    }
}

async function loadNodes(torPath) {
    cache['tmpPath'] = cache['tmpPath'] == "" ? await getTmpFilePath() : cache['tmpPath'];
    let ftOffset = 0;
    let firstLoop = true;
    const ftCapacity = 1000;
    const fileName = path.basename(torPath);
    
    readFile(torPath).then(async (buff) => {
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
            } else {
                throw new Error("invalid file name");
            }
        }
    }).catch(err => {
        throw err;
    });
}

async function findClientGOM(gomArchive, data, torPath) {
    const gomFileHash = hashlittle2("/resources/systemgenerated/client.gom");
    const gomFileEntr = gomArchive.files[`${gomFileHash[1]}|${gomFileHash[0]}`];

    const dat = data.slice(gomFileEntr.offset, gomFileEntr.offset + (gomFileEntr.isCompressed ? gomFileEntr.comprSize : gomFileEntr.size));
    if (gomFileEntr.isCompressed) {
        const decompressed = decompressZlib({
            buffer: Buffer.from(dat),
            dataLength: gomFileEntr.size
        }, true);
        const infoDV = new DataView(decompressed.buffer);
        loadClientGOM(gomArchive, data, torPath, infoDV, gomFileEntr);
    }
}
function loadClientGOM(gomArchive, data, torPath, infoDV, gomFileEntr) {
    const DomElements = {};

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
        
        if (!DomElements[defType]) DomElements[defType] = {};
        DomElements[defType][DElem.id] = DElem;

        // Read the required number of padding bytes
        const padding = ((8 - (defLength & 0x7)) & 0x7);

        pos = iniPos + defLength + padding;
    }

    postMessage({
        "message": 'DomElements',
        "data": DomElements
    })
}

// Utility functions
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