import { capitalize } from "../../Util.js";
import { sourcePath } from "../../../api/config/resource-path/ResourcePath.js";
import { vsCode, vsCodeHighlightStyle, vsCodeTheme } from "./EditorTheme.js";
import { SearchPanel } from "./SearchPanel.js";

// Code mirror imports
const { EditorView, highlightSpecialChars, drawSelection, highlightActiveLine, keymap } = require('@codemirror/view');
const { EditorState } = require('@codemirror/state');
const { css, cssCompletion, cssLanguage } = require('@codemirror/lang-css');
const { defaultTabBinding } = require('@codemirror/commands');
const { history, historyKeymap } = require('@codemirror/history');
const { foldGutter, foldKeymap } = require('@codemirror/fold');
const { indentOnInput } = require('@codemirror/language');
const { highlightActiveLineGutter, lineNumbers } = require('@codemirror/gutter');
const { defaultKeymap } = require('@codemirror/commands');
const { bracketMatching } = require('@codemirror/matchbrackets');
const { closeBrackets, closeBracketsKeymap } = require('@codemirror/closebrackets');
const { highlightSelectionMatches } = require('@codemirror/search');
const { completionKeymap, autocompletion } = require('@codemirror/autocomplete');
const { commentKeymap } = require('@codemirror/comment');
const { rectangularSelection } = require('@codemirror/rectangular-selection');
const { defaultHighlightStyle } = require('@codemirror/highlight');
const { lintKeymap } = require('@codemirror/lint');

const fs = require('fs');
const path = require('path');

// DOM Variables

// stylesheet accordions
const mainUISheetsCont = document.getElementById('mainUISheetsCont');
const componentUISheetsCont = document.getElementById('componentUISheetsCont');
const openSheetName = document.getElementById('openSheetName');
const saveIcon = document.getElementById("saveIcon");
const editorContainer = document.getElementById('editorContainer');

const closeModal = document.getElementById('closeModal');
const confirmClose = document.getElementById('confirmClose');
const cancelClose = document.getElementById('cancelClose');

// Consts
const sheets = [
    /**
     * {
     *  sheet: sheet
     *  isOpen: bool
     * }
     */
];
let openSheet = null;
let originalData = "Slicers GUI Layout Editor";
let isRendering = false;
const state = EditorState.create({
    doc: "Slicers GUI Layout Editor",
    extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightSpecialChars(),
        drawSelection(),
        highlightActiveLine(),
        history(),
        foldGutter(),
        EditorState.allowMultipleSelections.of(true),
        indentOnInput(),
        defaultHighlightStyle.fallback,
        bracketMatching(),
        closeBrackets(),
        autocompletion(),
        rectangularSelection(),
        highlightSelectionMatches(),
        cssCompletion,
        css(),
        keymap.of([
            {
                key: "Mod-f",
                run: handleCtrlF,
                preventDefault: true
            },
            {
                key: "Mod-s",
                run: handleCtrlS,
                preventDefault: true
            },
            ...closeBracketsKeymap,
            ...defaultKeymap,
            ...historyKeymap,
            ...foldKeymap,
            ...commentKeymap,
            ...completionKeymap,
            ...lintKeymap,
            defaultTabBinding
        ]),
        vsCodeTheme,
        vsCodeHighlightStyle,
        EditorState.tabSize.of(4),
        EditorView.updateListener.of((v) => {
            if (v.docChanged && openSheet && !isRendering) {
                openSheet.needsSave = openSheet.isSaved && view.state.doc.sliceString(0, view.state.doc.length) != originalData;
            }
        })
    ]
});
const view = new EditorView({ state: state, parent: editorContainer });
const searchPanel = new SearchPanel(view, editorContainer);
let closeCallback = () => {};

function initialize() {
    initListeners();
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

function initListeners() {
    confirmClose.addEventListener('click', (e) => {
        closeModal.style.display = 'none';
        closeCallback();
    });
    cancelClose.addEventListener('click', (e) => {
        closeModal.style.display = 'none';
        closeCallback = () => {};
    })
}

function handleCtrlF() { (searchPanel.showing) ? searchPanel.hide() : searchPanel.show(); }
function handleCtrlS() { if (openSheet) openSheet.save(); }

class ExistingSheet {
    /**
     * Represents and existing css stylesheet in the Slicers GUI.
     * @param {String} fileName The full filepath to the css sheet.
     * @param {String} type Type of sheet. Must be "main" or "comp".
     */
    constructor(fileName, type) {
        this.fileName = fileName;
        this.displayName = capitalize(fileName.substr(fileName.lastIndexOf("\\")+1));
        this.type = type;
        this.isSaved = false;
        this.needsSave = false;

        //add sheet to the existing section of the DOM
        const esCont = document.createElement('div');
        esCont.className = "existing-sheet";
        esCont.addEventListener("click", (e) => {
            this.open();
        });

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

    /**
     * @param {any} newVal
     */
    set needsSave(newVal) {
        this.isSaved = !newVal;
        (newVal) ? saveIcon.classList.remove('saved') : saveIcon.classList.add('saved');
    }

    open() {
        if (openSheet && !openSheet.isSaved && openSheet.displayName !== this.displayName) {
            closeModal.style.display = 'flex';
            closeCallback = () => {
                this.render();
            }
        } else {
            this.render();
        }
    }

    render() {
        isRendering = true;
        const buffer = fs.readFileSync(this.fileName);
        /* This is the contents of the css file. They are already properly formatted */
        const contents = buffer.toString();

        originalData = contents;

        let clearTransaction = view.state.update({
            changes: {
                from: 0,
                to: view.state.doc.length,
                insert: ""
            }
        });
        view.dispatch(clearTransaction);

        view.state.doc.replace(0, view.state.doc.lines, "");

        let sheetRenderTransaction = view.state.update({
            changes: {
                from: 0,
                insert: contents
            }
        });

        view.dispatch(sheetRenderTransaction);
        
        openSheetName.innerHTML = this.displayName;
        openSheet = this;
        setTimeout(() => {
            isRendering = false
        }, 100);
    }

    save() {
        if (!this.isSaved) {
            const docCont = view.state.doc.sliceString(0, view.state.doc.length, "\n");

            fs.writeFileSync(this.fileName, docCont);

            this.needsSave = false;
        }
    }
}

initialize();