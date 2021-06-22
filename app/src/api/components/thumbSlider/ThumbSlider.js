import { addStyleIfNotExists } from "../../../js/Util.js";

class ThumbSlider extends HTMLElement {
    constructor() {
        super();

        addStyleIfNotExists('../api/components/thumbSlider/ThumbSlider.css')

        this.attachShadow({mode: 'open'});

        const styles = document.createElement('link');
        styles.rel = 'stylesheet';
        styles.href = '../api/components/thumbSlider/ThumbSlider.css';

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
        this.checkBox.checked = this.hasAttribute('checked');
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
        this.checkBox.checked = this.checked;
    }
}

customElements.define('thumb-slider', ThumbSlider);