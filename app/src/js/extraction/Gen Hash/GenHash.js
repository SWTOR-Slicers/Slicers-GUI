import { readString } from '../../Util.js';

const fs = require('fs');
const path = require('path');
/**
 * Generates the filenames for all the files contained in the .tor files inside sourceDir.
 * @param {Buffer} sourceDir Directory containing the target .tor files.
 */
export function genHash(sourceDir) {

}

/**
 * Gets the name of the file specified by the path provided.
 * @param {String} filePath Path representing to the file.
 */
function getFilename(filePath) {
    const buffer = fs.readFileSync(filePath).buffer;
    const ext = path.extname(filePath).substring(1);
    let name;

    //Lots of 'magic numbers' here. they are garthered from class readers.

    switch (ext) {
        case 'acb':
            break;
        case 'amx':
            break;
        case 'bkt':
            break;
        case 'bnk':
            break;
        case 'clo':
            break;
        case 'dat':
            break;
        case 'dds':
            break;
        case 'dep':
            break;
        case 'dyc':
            break;
        case 'emt':
            break;
        case 'epp':
            break;
        case 'fxa':
            break;
        case 'fxe':
            break;
        case 'fxspec':
            break;
        case 'gfx':
            break;
        case 'gom':
            break;
        case 'gr2':
            const reader = (buffer) => {
                const type = new Uint32Array(buffer, 20, 1)[0];
                if (type === 0 || type === 1) {
                    const offsetMeshHeader = new Uint32Array(buffer, 84, 1);
                    const offsetMeshName = new Uint32Array(buffer, offsetMeshHeader, 1);
                    return readString(buffer, offsetMeshName);
                } else if (type === 2) {
                    
                }
            }
            name = reader(buffer);
            break;
        case 'info':
            break;
        case 'jba':
            break;
        case 'list':
            break;;
        case 'lod':
            break;
        case 'lst':
            break;
        case 'mag':
            break;
        case 'manifest':
            break;
        case 'mat':
            break;
        case 'mph':
            break;
        case 'node':
            break;
        case 'not':
            break;
        case 'prt':
            break;
        case 'rul':
            break;
        case 'spt':
            break;
        case 'stb':
            break;
        case 'svy':
            break;
        case 'swf':
            break;
        case 'tbl':
            break;
        case 'tex':
            break;
        case 'txt':
            break;
        case 'wem':
            break;
        case 'xml':
            break;
        default:
            name = "unkown";
            //try to resolve file type
    }

    return name;
}