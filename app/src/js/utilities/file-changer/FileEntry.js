const { ipcRenderer } = require('electron');
const fs = require('fs');
import { v4 as uuidV4} from 'uuid';

export class FileEntry {
    constructor(type, target, modded, fileChanges) {
        this.id = uuidV4();
        this.type = type;
        this.oldTarget = target;
        this.target = target;
        this.modded = modded;
        this.fileChanges = fileChanges;
    }

    render() {
        const chngElem = document.createElement('div');
        chngElem.id = this.id;
        chngElem.className = 'change-elem';

            const cType = document.createElement('div');
            cType.className = 'change-type';
            cType.innerHTML = `
                <label class="test-label">Type: </label>
                <select is="drop-down">
                    <option value="0">${this.type}</option>
                    <option value="file">File</option>
                    <option value="node">Node</option>
                </select>
            `;
            this.dropDown = cType.querySelector('select');

            const fToChng = document.createElement('div');
            fToChng.className = 'file-to-change';
            fToChng.innerHTML = `
                <label class="test-label">Target: </label>
                <input type="text" class="paths-field-input-alt" style="margin-right: 7px;" value="${this.target}">
                <button class="disabled browse-paths__button-alt">
                    <i class="fas fa-ellipsis-h"></i>
                </button>
            `;

            fToChng.querySelector('input').addEventListener('change', (e) => {
                const idx = fileChanges.findIndex(fc => { return fc.type == newChng.type && fc.target == newChng.target && fc.modded == newChng.modded; })
                const match = fileChanges.find(fc => { return fc.target == newChng.target; })
                if (match && !(fileChanges.indexOf(match) == idx)) {
                    this.target = this.oldTarget;
                } else {
                    this.target = e.currentTarget.value;
                    this.oldTarget = this.target
                }
            });
            fToChng.querySelector('button').addEventListener('click', (e) => {
                //TODO this functionality will be added once I better understand how nodes work.
            });
            
            const fToUse = document.createElement('div');
            fToUse.className = 'file-to-use';
            fToUse.innerHTML = `
                <label for="moddedInput" class="test-label">Modded: </label>
                <input id="${this.id}-TargetInput" type="text" name="moddedInput" class="paths-field-input-alt" style="margin-right: 7px;" value="${this.modded}">
                <button class="browse-paths__button-alt">
                    <i class="fas fa-ellipsis-h"></i>
                </button>
            `;
            fToUse.querySelector('input').addEventListener('change', (e) => {
                if (fs.existsSync(e.currentTarget.value)) {
                    this.target = e.currentTarget.value;
                    this.oldTarget = this.target
                } else {
                    this.target = this.oldTarget;
                }
            });
            fToUse.querySelector('button').addEventListener('click', (e) => {
                ipcRenderer.send('openFileDialogChanger', chngElem.id);
            });

            
            const rElemWrap = document.createElement('div');
            rElemWrap.className = 'remove-elem-wrapper';

                const remove = document.createElement('button');
                remove.className = 'browse-paths__button-alt';
                remove.innerHTML = '<i class="fas fa-minus"></i>';

                remove.addEventListener('click', (e) => {
                    chngElem.parentElement.removeChild(chngElem);
                    this.fileChanges.splice(this.fileChanges.indexOf(this), 1);
                    chngElem.parentElement.removeChild(chngElem);
                });

            rElemWrap.append(remove);

        chngElem.append(cType, fToChng, fToUse, rElemWrap);

        return chngElem;
    }

    export() {
        return JSON.stringify(this, null, '\t');
    }
}