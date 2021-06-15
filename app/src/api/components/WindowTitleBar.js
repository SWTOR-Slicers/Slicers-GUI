const {ipcRenderer} = require( 'electron');

class WindowTitle extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: 'open'});

        //TODO: refactor this to use a style sheet (not supported yet, so unable to do anything right now)
        const styles = document.createElement('style');
        styles.textContent = `
            .window-header {
                width: 100%;
                height: 30px;
                display: flex;
                flex-direction: row;
                align-items: center;
                justify-content: flex-start;
                background-color: #1a1a1a;
                color: white;
                font-family: 'Eurofont';
                font-size: 14px;
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
        header.className = "window-header";
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
        winMinBtn.innerHTML = `
            <svg width="11" height="2" viewbox="0 0 11 2">
                <path d="m11 0v1h-11v-1z" strokeWidth=".26208" style="stroke: ${winMinBtn.classList.contains('title-btn-disabled') ? 'rgb(177, 177, 177)' : 'white'};"/>
            </svg>
        `;

        const maxResWinBtn = document.createElement('div');
        maxResWinBtn.className = `title-btn ${this.hasAttribute('maximize') ? (this.getAttribute('maximize') ? 'title-btn-disabled' : '') : ''}`;
        maxResWinBtn.onclick = (e) => {
            if (maxResWinBtn.classList.contains('is-max-mode')) {
                ipcRenderer.send('restoreWindow', winName.textContent);
                maxResWinBtn.innerHTML = `
                    <svg width="10" height="10" viewbox="0 0 10 10">
                        <path d="m10-1.667e-6v10h-10v-10zm-1.001 1.001h-7.998v7.998h7.998z" strokeWidth=".25" style="stroke: ${maxResWinBtn.classList.contains('title-btn-disabled') ? 'rgb(177, 177, 177)' : 'white'};"/>
                    </svg>
                `;
            } else {
                ipcRenderer.send('maximizeWindow', winName.textContent);
                maxResWinBtn.innerHTML = `
                <svg width="11" height="11" viewBox="0 0 11 11">
                    <path d="m11 8.7978h -2.2021v 2.2022h -8.7979v -8.7978h 2.2021v -2.2022h 8.7979z m-3.2979 -5.5h -6.6012v 6.6011h 6.6012z m2.1968 -2.1968h -6.6012v 1.1011h 5.5v 5.5h 1.1011z" stroke-width=".275" style="fill: ${maxResWinBtn.classList.contains('title-btn-disabled') ? 'rgb(177, 177, 177)' : 'white'};"/>
                </svg>
                `;
            }
            maxResWinBtn.classList.toggle('is-max-mode');
        }
        maxResWinBtn.innerHTML = `
            <svg width="10" height="10" viewbox="0 0 10 10">
                <path d="m10-1.667e-6v10h-10v-10zm-1.001 1.001h-7.998v7.998h7.998z" strokeWidth=".25" style="stroke: ${maxResWinBtn.classList.contains('title-btn-disabled') ? 'rgb(177, 177, 177)' : 'white'};"/>
            </svg>
        `;

        const closeMinBtn = document.createElement('div');
        closeMinBtn.className = `title-btn close-win-btn`;
        closeMinBtn.onclick = (e) => {
            ipcRenderer.send('closeWindow', winName.textContent);
        }
        closeMinBtn.innerHTML = '<img src="../img/CloseWindow.png" height="20"></img>';

        winBtnsWrapper.append(winMinBtn, maxResWinBtn, closeMinBtn);

        header.appendChild(winBtnsWrapper);

        this.shadowRoot.append(styles, faStyle, header);
    }
}

customElements.define('window-title', WindowTitle);