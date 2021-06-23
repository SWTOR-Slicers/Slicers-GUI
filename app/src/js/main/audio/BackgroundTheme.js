import { shuffle } from '../../Util.js';

const fs = require('fs');
const path = require('path');
const audioSrc = document.getElementById('ambience');

const progress = document.getElementById('ambientProgress');
const progressContainer = document.getElementById('ambientProgressCont');

let sounds = [];
let soundIdx = 0;

function nextSong() {
    soundIdx++;

    if (soundIdx > sounds.length - 1) {
        soundIdx = 0;
    }

    loadSong(sounds[soundIdx]);

    playAudio();
}
function loadSong(str) {
    audioSrc.src = str;
}

function changeSource(sourcePath) {
    sounds = [];
    soundIdx = 0;
    
    if (fs.statSync(sourcePath).isDirectory()) {
        const contents = fs.readdirSync(sourcePath);

        for (const f of contents) {
            const fPath = path.join(sourcePath, f);
            if (fs.statSync(fPath).isFile() && path.extname(fPath) === '.ogg') {
                sounds.push(fPath);
            }
        }

        sounds = shuffle(sounds);
    } else {
        sounds.push(sourcePath);
    }

    loadSong(sounds[soundIdx]);

    playAudio();
}

function pauseAudio() { audioSrc.pause(); }
function playAudio() {  audioSrc.play(); }

// Update progress bar
function updateProgress(e) {
    const { duration, currentTime } = e.srcElement;
    const progressPercent = (currentTime / duration) * 100;
    progress.style.width = `${progressPercent}%`;
}
// Set progress bar
function setProgress(e) {
    const width = this.clientWidth;
    const clickX = e.offsetX;
    const duration = audioSrc.duration;

    audioSrc.currentTime = (clickX / width) * duration;
}

audioSrc.addEventListener('timeupdate', updateProgress);

progressContainer.addEventListener('click', setProgress);

audioSrc.addEventListener('ended', nextSong);

export { changeSource, pauseAudio, playAudio };