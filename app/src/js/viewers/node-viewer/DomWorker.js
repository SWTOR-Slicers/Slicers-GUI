const esmRequire = require("esm")(module/*, options*/);
const { hashlittle2, uint32ToUint64 } = esmRequire("../../Util.js");
const { parentPort } = require("worker_threads");
const { GOM } = esmRequire("../../classes/util/Gom.js");
const { DomLoader } = require("../../classes/dataObjectModel/DomLoaders.js");
const { Archive } = esmRequire("../../classes/formats/Archive.js");

const path = require('path');
const zlib = require('zlib');
const fzstd = require('fzstd');
const { promises: { readFile }, readFileSync, existsSync, mkdirSync } = require('fs');

const cache = {
    "configPath": "",
    "tmpPath": "",
    "store": {}
}
let decompressZlib = function(data){
    const decompr = zlib.inflateSync(data.buffer, {
        level: zlib.constants.Z_BEST_COMPRESSION,
        maxOutputLength: data.dataLength
    });

    return decompr
};

parentPort.on("message", (data) => {
    switch (data.message) {
        case "init":
            cache['configPath'] = path.join(data.data, 'config.json');
            break;
        case "loadNodes":
            loadNodes(data.data);
            break;
    }
})

async function loadNodes(torPath) {
    cache['tmpPath'] = cache['tmpPath'] == "" ? await getTmpFilePath() : cache['tmpPath'];
    const fileName = path.basename(torPath);
    
    const archive = new Archive(torPath, 0, true);

    const gomFileHash = hashlittle2("/resources/systemgenerated/client.gom");
    const gomFileEntr = archive.entries[uint32ToUint64(gomFileHash[0], gomFileHash[1])];

    if (gomFileEntr.isCompr) {
      const reader = gomFileEntr.getReadStream();
        
      const infoDV = new DataView(reader.data);
      loadClientGOM(torPath, infoDV, gomFileEntr);
    } else {
        throw new Error("Expected GOM file to be compressed!");
    }
}

function loadClientGOM(torPath, infoDV, gomFileEntr) {
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

    parentPort.postMessage({
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