//DOM variables
const title = document.getElementById('title');
const currentSoundFile = document.getElementById('currentSoundFile');

//audio nav buttons
const prev = document.getElementById('prev');
const play = document.getElementById('play');
const next = document.getElementById('next');

//progress bar variables
const progressContainer = document.getElementsByClassName('progress-bar-container')[0];
const progress = document.getElementsByClassName('progress-bar')[0];

//main container
const mainContainer = document.getElementsByClassName('music-container-background')[0];

let audioNames = [];
let rootDir = "";
let songIndex = 0;

export function setSounds(soundsList, soundDir) {
    audioNames = soundsList;
    rootDir = soundDir;
    songIndex = 0;

	initListeners();
    loadSong(audioNames[songIndex]);
}

// Update song details
function loadSong(song) {
  title.innerText = song;
  currentSoundFile.src = `${rootDir}/${song}`;
}
// Play song
function playSong() {
    mainContainer.classList.add('play');
    play.children[0].classList.remove('fa-play');
    play.children[0].classList.add('fa-pause');

    currentSoundFile.play();
}
// Pause song
function pauseSong() {
    mainContainer.classList.remove('play');
    play.children[0].classList.add('fa-play');
    play.children[0].classList.remove('fa-pause');

    currentSoundFile.pause();
}
// Previous song
function prevSong() {
  songIndex--;

  if (songIndex < 0) {
    songIndex = audioNames.length - 1;
  }

  loadSong(audioNames[songIndex]);

  playSong();
}
// Next song
function nextSong() {
  songIndex++;

  if (songIndex > audioNames.length - 1) {
    songIndex = 0;
  }

  loadSong(audioNames[songIndex]);

  playSong();
}

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
    const duration = currentSoundFile.duration;

    currentSoundFile.currentTime = (clickX / width) * duration;
}
//get duration & currentTime for Time of song
function DurTime (e) {
	const {duration,currentTime} = e.srcElement;
	var sec;
	var sec_d;

	// define minutes currentTime
	let min = (currentTime==null)? 0:
	    Math.floor(currentTime/60);
	min = min <10 ? '0'+min:min;

	// define seconds currentTime
	function getSec (x) {
		if(Math.floor(x) >= 60){
			
			for (var i = 1; i<=60; i++){
				if(Math.floor(x)>=(60*i) && Math.floor(x)<(60*(i+1))) {
					sec = Math.floor(x) - (60*i);
					sec = sec <10 ? '0'+sec:sec;
				}
			}
		}else{
		 	sec = Math.floor(x);
		 	sec = sec <10 ? '0'+sec:sec;
		 }
	} 

	getSec (currentTime,sec);

	// change currentTime DOM
	currTime.innerHTML = min +':'+ sec;

	// define minutes duration
	let min_d = (isNaN(duration) === true)? '0':
	    Math.floor(duration/60);
	min_d = min_d <10 ? '0'+min_d:min_d;


	function getSecD (x) {
		if(Math.floor(x) >= 60){
			
			for (var i = 1; i<=60; i++){
				if(Math.floor(x)>=(60*i) && Math.floor(x)<(60*(i+1))) {
					sec_d = Math.floor(x) - (60*i);
					sec_d = sec_d <10 ? '0'+sec_d:sec_d;
				}
			}
		}else{
		 	sec_d = (isNaN(duration) === true)? '0':
		 	Math.floor(x);
		 	sec_d = sec_d <10 ? '0'+sec_d:sec_d;
		 }
	} 

	// define seconds duration
	
	getSecD (duration);

	// change duration DOM
	durTime.innerHTML = min_d +':'+ sec_d;
		
};

function initListeners() {
	// Event listeners
	console.log(play)
	play.addEventListener('click', () => {
		const isPlaying = mainContainer.classList.contains('play');

		if (isPlaying) {
			pauseSong();
		} else {
			playSong();
		}
	});

	// Change song
	prev.addEventListener('click', prevSong);
	next.addEventListener('click', nextSong);

	// Time/song update
	currentSoundFile.addEventListener('timeupdate', updateProgress);

	// Click on progress bar
	progressContainer.addEventListener('click', setProgress);

	// Song ends
	currentSoundFile.addEventListener('ended', nextSong);

	// Time of song
	currentSoundFile.addEventListener('timeupdate', DurTime);
}