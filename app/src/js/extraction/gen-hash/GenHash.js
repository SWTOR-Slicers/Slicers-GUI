import { readString } from '../../Util.js';

const fs = require('fs');
const path = require('path');
/**
 * Generates the filenames for all the files contained in the .tor files inside sourceDir.
 * @param {Buffer} sourceDir Directory containing the target .tor files.
 */
export function genHash(sourceDir) {
    let assetFiles = fs.readdirSync(sourceDir);
    assetFiles = assetFiles.filter((f) => {
        let isValid = true;
        if (path.extname(f) == '.tor') {
            let assetName = f.substr(f.lastIndexOf('\\') + 1);
            if (cache['verion'] == 'pts' && !assetName.indexOf('swtor_test_') > -1) isValid = false;
            if (cache['verion'] == 'Live' && assetName.indexOf('swtor_test_') > -1) isValid = false;
        } else {
            isValid = false;
        }
        return isValid;
    }).map((f) => { return path.join(sourceDir, f); });

    const retPath = path.normalize(path.join(sourceDir, `../${cache['version'] == 'Live'? 'swtor' : 'publictest'}/retailclient`));
    if (fs.existsSync(retPath)) {
        let retCli = fs.readdirSync(retPath);
        let filtered = retCli.filter((f) => { return path.extname(f) == '.tor'; }).map((f) => { return path.join(sourceDir, f); });
        assetFiles.concat(filtered);
    }
}