class ThumbSlider extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: 'open'});

        //TODO: refactor this to use a style sheet (not supported yet, so unable to do anything right now)
        const styles = document.createElement('style');
        styles.textContent = `
        .switch {
            position: relative;
            display: inline-block;
            width: 36px;
            height: 20px;
        }
        .switch input {
            opacity: 0;
            width: 0;
            height: 0;
        }
        .slider {
            position: absolute;
            cursor: pointer;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: var(--grey-black);
            -webkit-transition: .4s;
            transition: .4s;
        }
        .slider:before {
            position: absolute;
            content: "";
            height: 15px;
            width: 15px;
            left: 3px;
            bottom: 3px;
            background-color: rgb(97, 97, 97);
            -webkit-transition: .4s;
            transition: .4s;
        }
        input:checked + .slider {
            background-color: var(--background-yellow-slicers);
        }
        input:focus + .slider {
            box-shadow: 0 0 1px var(--background-yellow-slicers);
        }
        input:checked + .slider:before {
            -webkit-transform: translateX(15px);
            -ms-transform: translateX(15px);
            transform: translateX(15px);
        }
        `;

        const sliderCont = document.createElement('div');
        sliderCont.className = 'switch';

        const ckbx = document.createElement('input');
        ckbx.type = 'checkbox';
        sliderCont.appendChild(ckbx);

        const sldr = document.createElement('span');
        sldr.className = 'slider';
        sliderCont.appendChild(sldr);

        this.addEventListener('click', (e) => {
            ckbx.checked = !ckbx.checked;
            this.checked = ckbx.checked;
        });

        this.shadowRoot.append(styles, sliderCont);
        this.checkBox = this.shadowRoot.querySelector('input');
        this.checked = this.checkBox.checked;
    }

    get checked() {
        return this.hasAttribute('checked');
    }

    set checked(isChecked) {
        if (isChecked) {
            this.setAttribute('checked', '');
        } else {
            this.removeAttribute('checked');
        }
    }
}

customElements.define('thumb-slider', ThumbSlider);