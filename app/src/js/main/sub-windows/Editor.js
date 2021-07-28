import { sourcePath } from "../../../api/config/resource-path/ResourcePath.js";
const fs = require('fs');
const path = require('path');

const openSheets = [
    /**
     * {
     *  tab: Tab,
     *  openSheet: OpenSheet
     * }
     */
]
//DOM Variables

//stylesheet accordions
const openSheetsCont = document.getElementById('openSheetsCont');
const existingSheetsCont = document.getElementById('existingSheetsCont');

function initialize() {
    initAccordions();
    initSheets();
}

function initAccordions() {
    const accordions = document.getElementsByClassName('file-list-header');
    for (const accordion of accordions) {
        accordion.addEventListener("click", (e) => {
            const panel = accordion.nextElementSibling;
            const chevron = accordion.children[0].children[0];
            if (panel.classList.contains('section-open')) {
                panel.classList.remove('section-open');

                chevron.classList.remove('fa-chevron-down');
                chevron.classList.add('fa-chevron-right');
            } else {
                panel.classList.add('section-open');
                
                chevron.classList.remove('fa-chevron-right');
                chevron.classList.add('fa-chevron-down');
            }
        });
    }
}

function initSheets() {
    const mainUISheetsPath = path.join(sourcePath, 'css');
    const mUDir = fs.readdirSync(mainUISheetsPath);
    const mainUISheets = mUDir.map((p) => { return path.join(mainUISheetsPath, p); });
    
    const componentSheetsPath = path.join(sourcePath, 'api', 'components');
    const compDirs = fs.readdirSync(componentSheetsPath);
    const componentSheets = compDirs.map((dirPath) => {
        const parentPath = path.join(componentSheetsPath, dirPath);
        const contents = fs.readdirSync(parentPath);
        const styleSheet = contents.find((file) => { return path.extname(file) === ".css"; });
        return path.join(parentPath, styleSheet);
    });

    console.log(mainUISheets, componentSheets);
}

class Tab {
    /**
     * Represents a tab in the editor UI
     * @param  {ExistingSheet} parent parent of this object
     */
    constructor(parent) {
        this.fileName = parent.fileName;
        this.parent = parent;
    }

    render() {
        // read file (will always be a css file)
        // add tab to the DOM
    }

    save() {

    }

    close(wasMe) {
        // remove tab from the DOM
        if (wasMe) {
            // close open sheet obj
            this.parent.openSheet.close(false);
        }
    }
}

class OpenSheet {
    /**
     * Represents a tab in the editor UI
     * @param  {ExistingSheet} parent parent of this object
     */
    constructor(parent) {
        this.fileName = parent.fileName;
        this.parent = parent;
    }

    render() {
        // read file (will always be a css file)
        // add sheet to the DOM
    }

    close(wasMe) {
        // remove openSheet from the DOM
        if (wasMe) {
            // close tab obj
            this.parent.tab.close(false);
        }
    }
}

class ExistingSheet {
    constructor(fileName) {
        this.fileName = fileName;
        this.openSheet = new OpenSheet(this);
        this.tab = new Tab(this);

        //add sheet to the existing section of the DOM
    }

    open() {
        this.openSheet.render();
        this.tab.render();
    }
}

initialize();