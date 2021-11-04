import { hashlittle2, uint64, readString as readStr, readVarInt, uint64C } from "../../Util.js";
import { GOM } from "../../classes/util/Gom.js";
import { DomLoader } from "../../classes/DomLoaders.js";

const path = require('path');
const fs = require('fs');
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
        case "loadAssets":
            loadArchives(e.data.data.torFiles);
            break;
    }
}

async function loadArchives(torFiles) {
    const loadedArchives = Promise.all()
}

function loadArchive(torPath) {

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
function readLengthPrefixString(dv, pos) {
    const strLength = readVarInt(dv, pos);
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