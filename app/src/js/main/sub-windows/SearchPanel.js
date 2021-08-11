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

        const panel = document.createElement('div');
        panel.className = "search-panel";
        panel.id = "searchPanel";
        panel.innerHTML = `
            <div class="seg-cont">
                <div class="seg-input-cont">
                    <input type="text">
                    <button id="matchCase" class=""></button>
                    <button id="regEx" class=""></button>
                </div>
                <div class="num-res">

                </div>
                <button id="moveUp" class=""></button>
                <button id="moveDown" class=""></button>
                <div class="spacer-seg"></div>
                <button id="closeSearc" class=""></button>
            </div>
            <div class="seg-cont">
                <div class="seg-input-cont">
                    <input type="text">
                </div>
                <button id="replaceOne" class=""></button>
                <button id="replaceAll" class=""></button>
            </div>
        `;

        this.parent.insertBefore(panel, this.parent.firstElementChild);
    }

    show() {

    }

    hide() {

    }
}