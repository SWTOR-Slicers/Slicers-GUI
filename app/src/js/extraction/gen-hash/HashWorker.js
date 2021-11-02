import { GOM } from "../../classes/util/Gom.js";
import { hashlittle2, uint64, readString as readStr, readVarInt, uint64C } from "../../Util.js";

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
        case "genHash":
            generateHash(e.data.data.nodesByFqn, e.data.data.checked);
            break;
    }
}

function generateHash(nodesByFqn, checked) {

}