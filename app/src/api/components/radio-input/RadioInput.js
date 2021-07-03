import { addStyleIfNotExists } from "../../../js/Util.js";
const chngEvn = new Event('change');

class RadioInput extends HTMLInputElement {
    constructor() {
        super();

        addStyleIfNotExists('../api/components/radio-input/RadioInput.css');

        this.type = 'radio';
        
        const parent = this.parentElement;

        const container = document.createElement('div');
        container.className = 'radio-input-container';

        parent.replaceChild(container, this);
        container.appendChild(this);

        const span = document.createElement('span');
        span.className = 'radio-input';
        container.append(span);

        span.addEventListener('click', (e) => {
            if (!this.checked)  {
                if (this.hasAttribute('radios')) {
                    const rads = this.getAttribute('radios').split(' ');
                    for (const rad of rads) {
                        document.getElementById(rad).checked = false;
                    }
                } else {
                    this.checked = true;
                    this.setAttribute('checked', '');
                }
                this.checked = true;
            }
            this.dispatchEvent(chngEvn);
        });
    }
}

customElements.define('radio-input', RadioInput, { extends: 'input' });