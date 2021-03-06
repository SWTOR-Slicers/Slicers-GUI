import { log } from '../../universal/Logger.js';
import { FileEntry } from './FileEntry.js';

const JSZip = require('jszip');
const fs = require('fs');
const path = require('path');

async function write(outputPath, modName, changesJson) {
    try {
        const writeObjs = [];
        for (const fc of changesJson) {
            const data = fc.export();
            data.modded = `::relative::\\mods\\${modName}.tormod\\lut\\${path.basename(data.modded)}`;
            writeObjs.push(data);
        }
        const tormod = new JSZip();
        tormod.file('Changes.json', JSON.stringify(writeObjs, null, '\t'), { binary: true });

        const lut = tormod.folder('lut');
        for (const change of changesJson) {
            const filePath = change.modded;
            const data = fs.readFileSync(filePath);

            lut.file(path.basename(filePath), data);
        }

        const buffer = await tormod.generateAsync({ type: "nodebuffer" });

        fs.writeFileSync(path.join(outputPath, `${modName}.tormod`), buffer);

        return 200;
    } catch (e) {
        console.log(e);
        return 400;
    }
}

async function read(path, domParent, changesList, writeModElem) {
    try {
        const buffer = fs.readFileSync(path);
        const zip = await JSZip.loadAsync(buffer);

        const chngFile = await zip.file('Changes.json').async('string');
        const changes = JSON.parse(chngFile);

        domParent.innerHTML = '';
        for (const change of changes) {
            const fileName = change.modded.substring(change.modded.lastIndexOf('\\') + 1);

            const fc = new FileEntry(change.type, change.target, change.modded, changesList, writeModElem, {
                "zip": path,
                "file": fileName
            });
            changesList.push(fc);

            const newChngElem = fc.render();
            domParent.appendChild(newChngElem);

            fc.dropDown.clickCallback = (e) => { fc.type = e.currentTarget.innerHTML; }

            writeModElem.classList.remove('disabled');
        }

        return 200;
    } catch (e) {
        console.log(e);
        return 400;
    }
}

async function convert(fPath, domParent, changesList, writeModElem, parentDir) {
    try {
        const buffer = fs.readFileSync(fPath);
        const fileStr = buffer.toString();
        const entries = fileStr.split('\n');

        const changes = [];

        for (let i = 0; i < entries.length; i++) {
            const entr = entries[i].replace(/(?:\r\n|\r|\n)/g, '');
            const info = entr.split(' ');
            if (info[0].indexOf('replace') == 0) {
                if (info.length >= 3) {
                    const chng = {
                        'type': (info[0] == 'replace') ? 'File' : 'Node', 
                        'target': info[1], 
                        'modded': path.join(parentDir, info[2])
                    }

                    changes.push(chng);
                } else {
                    log(`Error when attempting to convert old mod at line: ${i}`, 'alert');
                    return 400;
                }
            }
        }

        domParent.innerHTML = '';
        for (const change of changes) {
            const fc = new FileEntry(change.type, change.target, change.modded, changesList, writeModElem);
            changesList.push(fc);

            const newChngElem = fc.render();
            domParent.appendChild(newChngElem);

            fc.dropDown.clickCallback = (e) => { fc.type = e.currentTarget.innerHTML; }

            writeModElem.classList.remove('disabled');
        }

        return 200;
    } catch (e) {
        console.log(e);
        return 400;
    }
}

export {write, read, convert};