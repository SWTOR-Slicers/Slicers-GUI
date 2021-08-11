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
                <input placeholder="Find" type="text" class="paths-field-input-alt">
                <div class="num-res">No results</div>
                <button id="moveUp" class="browse-paths__button-alt">
                    <i class="fas fa-arrow-up"></i>
                </button>
                <input id="matchCase" class="over-btn" is="check-box"/>
                <div class="num-res" style="margin-left: 5px;">match case</div>
                <button id="closeSearc" class="browse-paths__button-alt" style="margin-left: auto;">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="seg-cont" style="margin-top: 2px; margin-bottom: 4px;">
                <input placeholder="Replace" type="text" class="paths-field-input-alt" style="margin-right: 34px;">
                <button id="replaceOne" class="browse-paths__button-alt">
                    <i class="fas fa-square"></i>
                </button>
                <button id="replaceAll" class="browse-paths__button-alt">
                    <i class="fas fa-clone"></i>
                </button>
                <button id="moveDown" class="browse-paths__button-alt">
                    <i class="fas fa-arrow-down"></i>
                </button>
                <input id="regEx" class="over-btn" is="check-box"/>
                <div class="num-res" style="margin-left: 5px;">regex</div>
            </div>
        `;

        this.parent.insertBefore(this.panel, this.parent.firstElementChild);


        // add event listeners
    }

    show() {
        this.showing = true;
        this.panel.style.top = '0px';
    }

    hide() {
        this.showing = false;
        this.panel.style.top = '-60px';
    }
}