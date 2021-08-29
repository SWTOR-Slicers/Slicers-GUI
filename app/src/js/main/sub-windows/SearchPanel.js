const {EditorView} = require('@codemirror/view');
const inpEvn = new Event('input');

export class SearchPanel {
    /**
     * A more stylish version of the codeMirror search panel.
     * @param {EditorView} view CodeMirror editor view to use with this search panel.
     * @param {HTMLElement} parent Parent element passed to the view when it was initialized.
     */
    constructor(view, parent) {
        this.view = view;
        this.parent = parent;
        this.showing = false;

        //TODO: assemble the search panel and append to the DOM

        this.panel = document.createElement('div');
        this.panel.className = "search-panel";
        this.panel.id = "searchPanel";
        this.panel.innerHTML = `
            <div class="seg-cont" style="margin-bottom: 2px; margin-top: 4px;">
                <input id="findInput" placeholder="Find" type="text" class="paths-field-input-alt">
                <div id="matchesInfo" class="num-res" style="width: 61.84px;">No results</div>
                <button id="moveUp" class="browse-paths__button-alt disabled">
                    <i class="fas fa-arrow-up"></i>
                </button>
                <input id="matchCase" class="over-btn" is="check-box"/>
                <div class="num-res" style="margin-left: 5px;">match case</div>
                <button id="closeSearch" class="browse-paths__button-alt" style="margin-left: auto;">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="seg-cont" style="margin-top: 2px; margin-bottom: 4px;">
                <input id="replaceInput" placeholder="Replace" type="text" class="paths-field-input-alt" spellcheck="false" style="margin-right: 34px;">
                <button id="replaceOne" class="browse-paths__button-alt disabled">
                    <i class="fas fa-square"></i>
                </button>
                <button id="replaceAll" class="browse-paths__button-alt disabled">
                    <i class="fas fa-clone"></i>
                </button>
                <button id="moveDown" class="browse-paths__button-alt disabled">
                    <i class="fas fa-arrow-down"></i>
                </button>
                <input id="regEx" class="over-btn" is="check-box"/>
                <div class="num-res" style="margin-left: 5px;">regex</div>
            </div>
        `;

        this.parent.insertBefore(this.panel, this.parent.firstElementChild);


        // add event listeners

        //DOM variables
        const findInput = document.getElementById('findInput');
        this.findInput = findInput;
        const replaceInput = document.getElementById('replaceInput');
        const matchesInfo = document.getElementById('matchesInfo');

        const replaceOne = document.getElementById('replaceOne');
        const replaceAll = document.getElementById('replaceAll');

        const moveUp = document.getElementById('moveUp');
        const moveDown = document.getElementById('moveDown');

        const matchCase = document.getElementById('matchCase');
        const regEx = document.getElementById('regEx');

        const closeSearch = document.getElementById('closeSearch');

        this.matches = [];

        // on keydown check for matches
        findInput.addEventListener('input', (e) => {
            this.matches = [];
            this.matchIdx = 0;
            let querey = e.currentTarget.value;
            if (querey !== "") {
                let docContents = this.view.state.doc.sliceString(0, this.view.state.doc.length);
                if (regEx.checked) {
                    // if regex apply find as regex
                    let match;
                    try {
                        const reX = new RegExp(querey, `g${matchCase.checked ? "" : "i"}`)
                        while ((match = reX.exec(docContents)) != null) {
                            this.matches.push({
                                startIdx: match.index,
                                endIdx: match.index+querey.length
                            });
                        }
                    } catch (e) {
                        console.log(e);
                    }
                } else {
                    // if match case enfroce case match
                    if (!matchCase.checked) {
                        docContents = docContents.toLowerCase();
                        querey = querey.toLowerCase();
                    }
                    // else just perform a regular search
                    let index, startIndex;
                    while ((index = docContents.indexOf(querey, startIndex)) > -1) {
                        startIndex = index + querey.length;
                        this.matches.push({
                            startIdx: index,
                            endIdx: startIndex
                        });
                    }
                    
                }
            }
            
            if (this.matches.length > 0) {
                matchesInfo.innerHTML = `1 of ${this.matches.length}`;
                moveUp.classList.remove('disabled');
                moveDown.classList.remove('disabled');
                replaceOne.classList.remove('disabled');
                replaceAll.classList.remove('disabled');

                this.setSelection(this.matches[0]);
            } else {
                matchesInfo.innerHTML = "No results";
                moveUp.classList.add('disabled');
                moveDown.classList.add('disabled');
                replaceOne.classList.add('disabled');
                replaceAll.classList.add('disabled');
            }
        });

        // on move down click move to next selection in matches list
        moveDown.addEventListener('click', (e) => {
            this.matchIdx++;
            if (this.matchIdx == this.matches.length) this.matchIdx = 0;
            this.setSelection(this.matches[this.matchIdx]);
            matchesInfo.innerHTML = `${this.matchIdx+1} of ${this.matches.length}`;
        });

        // on move up click move to previous selection in matches list
        moveUp.addEventListener('click', (e) => {
            this.matchIdx--;
            if (this.matchIdx == -1) this.matchIdx = this.matches.length-1;
            this.setSelection(this.matches[this.matchIdx]);
            matchesInfo.innerHTML = `${this.matchIdx+1} of ${this.matches.length}`;
        });

        // on replace one replace selection with replaceInput.val
        replaceOne.addEventListener('click', (e) => {
            const matchInfo = this.matches[this.matchIdx];
            this.view.dispatch({
                changes: {
                    from: matchInfo.startIdx,
                    to: matchInfo.endIdx,
                    insert: replaceInput.value
                }
            });
        });

        // on replace all replace all entries in this.matches with replaceInput.val
        replaceAll.addEventListener('click', (e) => {
            for (const matchInfo of this.matches) {
                this.view.dispatch({
                    changes: {
                        from: matchInfo.startIdx,
                        to: matchInfo.endIdx,
                        insert: replaceInput.value
                    }
                });
            }
        });

        // on close call this.hide()
        closeSearch.addEventListener('click', (e) => { this.hide(); });

        matchCase.addEventListener('change', (e) => {
            findInput.dispatchEvent(inpEvn);
        });

        regEx.addEventListener('change', (e) => {
            findInput.dispatchEvent(inpEvn);
        });
    }

    show() {
        this.showing = true; 
        this.panel.style.top = '0px';
        this.findInput.focus();
        if (this.matches.length > 0) {
            this.setSelection(this.matches[0]);
        }
    }
    hide() {
        this.showing = false;
        this.panel.style.top = '-60px';
        this.parent.focus();
    }

    setSelection(match) {
        this.view.dispatch({
            selection: {
                anchor: match.startIdx,
                head: match.endIdx
            },
            scrollIntoView: true
        });
    }
}