import { capitalize } from "../../Util.js";
import { sourcePath } from "../../../api/config/resource-path/ResourcePath.js";
const fs = require('fs');
const path = require('path');

const sheets = [
    /**
     * {
     *  sheet: sheet
     *  isOpen: bool
     * }
     */
]
//DOM Variables

//stylesheet accordions
const mainUISheetsCont = document.getElementById('mainUISheetsCont');
const componentUISheetsCont = document.getElementById('componentUISheetsCont');


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
    for (const mSheet of mainUISheets) {
        const es = new ExistingSheet(mSheet, "main");
        sheets.push({
            "sheet": es,
            "isOpen": false
        });
    }
    
    for (const cSheet of componentSheets) {
        const es = new ExistingSheet(cSheet, "comp");
        sheets.push({
            "sheet": es,
            "isOpen": false
        });
    }
}

class ExistingSheet {
    /**
     * Represents and existing css stylesheet in the Slicers GUI.
     * @param {String} fileName The full filepath to the css sheet.
     * @param {String} type Type of sheet. Must be "main" or "comp".
     */
    constructor(fileName, type) {
        this.fileName = fileName;
        this.displayName = capitalize(fileName.subStr(fileName.lastIndexOf("\\")+1));
        this.type = type;

        //add sheet to the existing section of the DOM
        const esCont = document.createElement('div');
        esCont.className = "existing-sheet";

        const hTag = document.createElement('i');
        hTag.className = "fas fa-hashtag";
        esCont.appendChild(hTag);

        const nDiv = document.createElement('div');
        nDiv.innerHTML = this.displayName;
        esCont.appendChild(nDiv);
        
        if (type == "main") {
            mainUISheetsCont.appendChild(esCont);
        } else if (type == "comp") {
            componentUISheetsCont.appendChild(esCont);
        } else {
            throw new Error(`Unexpect type value: expected type with value of 'main' or 'comp' but got ${type}.`);
        }
    }

    open() {
        //render file here
    }
}

initialize();