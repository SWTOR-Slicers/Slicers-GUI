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

        for (const change of changes) {
            const fileName = change.modded.substr(change.modded.lastIndexOf('\\') + 1);
            const fBuff = await zip.folder('lut').file(fileName).async('arraybuffer');

            const fc = new FileEntry(change.type, change.target, change.modded, changesList, writeModElem, fBuff);
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

export {write, read};