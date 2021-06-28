export class FileEntry {
    constructor(type, target, modded) {
        this.type = type;
        this.target = target;
        this.modded = modded;
    }

    render() {
        const chngElem = document.createElement('div');
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


            const fToChng = document.createElement('div');
            fToChng.className = 'file-to-change';
            fToChng.innerHTML = `
                <label class="test-label">Target: </label>
                <input type="text" class="paths-field-input-alt" style="margin-right: 7px;" value="${this.target}">
                <button class="disabled browse-paths__button-alt">
                    <i class="fas fa-ellipsis-h"></i>
                </button>
            `;

            
            const fToUse = document.createElement('div');
            fToUse.className = 'file-to-use';
            fToUse.innerHTML = `
                <label for="moddedInput" class="test-label">Modded: </label>
                <input type="text" name="moddedInput" class="paths-field-input-alt" style="margin-right: 7px;" value="${this.modded}">
                <button class="browse-paths__button-alt">
                    <i class="fas fa-ellipsis-h"></i>
                </button>
            `;

            
            const rElemWrap = document.createElement('div');
            rElemWrap.className = 'remove-elem-wrapper';

                const remove = document.createElement('button');
                remove.className = 'browse-paths__button-alt';
                remove.innerHTML = '<i class="fas fa-minus"></i>';

                remove.addEventListener('click', (e) => {
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