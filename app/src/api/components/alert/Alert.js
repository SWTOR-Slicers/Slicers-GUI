class LogAlert extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: 'open'});

        const styles = document.createElement('style');
        styles.textContent = `
            .alert-background {
                z-index: 1000;
                position: fixed;
                top: 35px;
                right: 0;
                padding: 5px;
                border-radius: 4px;
                height: 26px;
                width: 200px;
                background-color: black;

                display: flex;
                flex-direction: row;
                align-items: center;

                transition: transform 0.5s ease-in;
                transform: translateX(100%);
            }
            .visible {
                transform: translateX(0%);
            }

            .icon-container {
                margin: 0px 5px;
                width: 22px;
                display: flex;
                flex-direction: row;
                align-items: center;
                justify-content: center;
            }

            .msg-header {
                margin-left: 6px;
                font-size: 16px;
                color: white;
                font-family: 'Eurofont';
            }

            .fa-info {
                font-size: 18px;
                color: #1388e8;
            }
            .fa-exclamation-triangle {
                font-size: 18px;
                color: yellow;
            }
            .fa-minus-circle {
                font-size: 18px;
                color: red;
            }
        `;

        const faStyle = document.createElement('link');
        faStyle.rel = 'stylesheet';
        faStyle.href = '../../node_modules/@fortawesome/fontawesome-free/css/all.min.css';

        const alertBackground = document.createElement('div');
        alertBackground.className = "alert-background";

        const alertIconCont = document.createElement('div');
        alertIconCont.className = "icon-container";
        switch (this.getAttribute('type')) {
            case 'info':
                alertIconCont.innerHTML = '<i class="fas fa-info"></i>';
                break;
            case 'alert':
                alertIconCont.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
                break;
            case 'error':
                alertIconCont.innerHTML = '<i class="fas fa-minus-circle"></i>';
                break;
        }
        alertBackground.appendChild(alertIconCont);

        //these listen for attribute changes. this will allow the setting of notification type based on what is being logged. and displaying it at the proper time
        var observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
              if (mutation.type == "attributes") {
                if (mutation.attributeName == 'type' && mutation.oldValue != this.getAttribute('type')) {
                    switch (this.getAttribute('type')) {
                        case 'info':
                            alertIconCont.innerHTML = '<i class="fas fa-info"></i>';
                            break;
                        case 'alert':
                            alertIconCont.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
                            break;
                        case 'error':
                            alertIconCont.innerHTML = '<i class="fas fa-minus-circle"></i>';
                            break;
                    }
                } else if (mutation.attributeName == 'visible' && this.getAttribute('visible') == "true") {
                    alertBackground.classList.toggle('visible');
                    setTimeout(() => {
                        alertBackground.classList.toggle('visible');
                        this.setAttribute('visible', "false"); 
                    }, 5000)
                }
              }
            });
        });
        observer.observe(this, {
            attributes: true //configure it to listen to attribute changes
        });

        const msg = document.createElement('h2');
        msg.className = "msg-header";
        msg.innerText = 'New Log Entry';
        alertBackground.appendChild(msg);

        this.shadowRoot.append(styles, faStyle, alertBackground);
    }
}

customElements.define('log-alert', LogAlert);