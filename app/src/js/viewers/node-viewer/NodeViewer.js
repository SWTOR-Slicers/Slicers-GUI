

// DOM Elements
const viewerWindow = document.getElementById('viewerWindow');
const fileTreeContainer = document.getElementById('fileTreeContainer');
const leftDrag = document.getElementById('leftDrag');
let leftResize = {
    "shouldResize": false,
    "currX": null
};
const viewContainer = document.getElementById('viewContainer');
const rightDrag = document.getElementById('rightDrag');
let rightResize = {
    "shouldResize": false,
    "currX": null
};
const dataViewContainer = document.getElementById('dataViewContainer');


function init() {
    initCache();
    initListeners();
    initSubs();
}

function initCache() {

}

function initListeners() {
    leftDrag.addEventListener('mousedown', (e) => { leftResize.shouldResize = true; leftResize.currX = fileTreeContainer.clientWidth; });
    document.addEventListener('mouseup', (e) => {
        if (leftResize.shouldResize) leftResize.shouldResize = false; leftResize.currX = null;
        if (rightResize.shouldResize) rightResize.shouldResize = false; rightResize.currX = null;
    });
    document.addEventListener('mousemove', (e) => {
        if (leftResize.shouldResize) {
            let changePercent = ((e.clientX + leftResize.currX) / viewerWindow.clientWidth) * 100;
            let existingIncr = dataViewContainer.clientWidth / viewerWindow.clientWidth * 100;
            changePercent -= existingIncr;
            fileTreeContainer.style.width = `${changePercent}%`;
            viewContainer.style.width = `${100 - changePercent - existingIncr}%`;
        } else if (rightResize.shouldResize) {

        }
    });
}

function initSubs() {

}

init()