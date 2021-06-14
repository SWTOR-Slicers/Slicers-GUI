const {ipcRenderer} = require( 'electron');

class WindowTitle extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: 'open'});

        const styles = document.createElement('style');
        styles.textContent = `
            .window-title {
                width: 100%;
                height: 30px;
                display: flex;
                flex-direction: row;
                align-items: center;
                justify-content: flex-start;
                background-color: #1a1a1a;
                color: white;
                font-family: 'Eurofont';
                font-size: 12px;
                font-weight: lighter;
                -webkit-app-region: drag;
            }

            .window-img {
                padding: 0px 7.5px
            }

            .window-name {
                /* any styles for window title go here */
            }

            .window-btns-wrapper {
                height: 100%;
                width: auto;
                margin-left: auto;
                display: flex;
                flex-direction: row;
                align-items: center;
            }

            .title-btn {
                height: 100%;
                width: 40px;
                color: white;
                display: flex;
                flex-direction: row;
                align-items: center;
                justify-content: center;
                -webkit-app-region: no-drag;
            }

            .title-btn:hover {
                background-color: #353535;
                cursor: pointer;
            }

            .title-btn-disabled {
                pointer-events: none;
                color: rgb(177, 177, 177);
            }

            .close-win-btn {
                font-size: 18px;
            }

            .close-win-btn:hover {
                background-color: red;
            }
        `;

        const faStyle = document.createElement('link');
        faStyle.rel = 'stylesheet';
        faStyle.href = '../../node_modules/@fortawesome/fontawesome-free/css/all.min.css';

        const hIcon = document.createElement('img');
        hIcon.src = (this.hasAttribute('img')) ? this.getAttribute('img') : "../img/SlicersLogo.png";
        hIcon.height = 15;
        hIcon.className = "window-img";

        const header = document.createElement('div');
        header.className = "window-title";
        header.appendChild(hIcon);

        const winName = document.createElement('div');
        winName.className = "window-name";
        winName.textContent = (this.hasAttribute('title')) ? this.getAttribute('title') : document.getElementsByTagName('title')[0].textContent;
        header.appendChild(winName);


        const winBtnsWrapper = document.createElement('div');
        winBtnsWrapper.className = "window-btns-wrapper";

        const winMinBtn = document.createElement('div');
        winMinBtn.className = `title-btn ${(this.hasAttribute('minimize')) ? (this.getAttribute('minimize')) ? 'title-btn-disabled' : '' : ''}`;
        winMinBtn.onclick = (e) => {
            ipcRenderer.send('minimizeWindow', winName.textContent);
        }
        const minIcon = document.createElement('i');
        minIcon.className = 'far fa-window-minimize';
        winMinBtn.appendChild(minIcon);

        const maxResWinBtn = document.createElement('div');
        maxResWinBtn.className = `title-btn ${(this.hasAttribute('maximize')) ? (this.getAttribute('maximize')) ? 'title-btn-disabled' : '' : ''}`;
        maxResWinBtn.onclick = (e) => {
            if (maxResWinBtn.classList.contains('is-max-mode')) {
                ipcRenderer.send('restoreWindow', winName.textContent);
                maxResWinBtn.innerHTML = '<i class="far fa-window-maximize"></i>';
            } else {
                ipcRenderer.send('maximizeWindow', winName.textContent);
                maxResWinBtn.innerHTML = '<i class="far fa-window-restore"></i>';
            }
            maxResWinBtn.classList.toggle('is-max-mode');
        }
        maxResWinBtn.innerHTML = '<i class="far fa-window-maximize"></i>';

        const closeMinBtn = document.createElement('div');
        closeMinBtn.className = `title-btn close-win-btn`;
        closeMinBtn.onclick = (e) => {
            ipcRenderer.send('closeWindow', winName.textContent);
        }
        closeMinBtn.innerHTML = '<img src="../img/CloseWindow.png" height="20"></img>'; //get a better icon for this

        winBtnsWrapper.append(winMinBtn, maxResWinBtn, closeMinBtn);

        header.appendChild(winBtnsWrapper);

        this.shadowRoot.append(styles, faStyle, header);
    }
}

customElements.define('window-title', WindowTitle);