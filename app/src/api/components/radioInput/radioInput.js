import { addStyleIfNotExists } from "../../../js/Util.js";

class RadioInput extends HTMLInputElement {
    constructor() {
        super();

        addStyleIfNotExists('../api/components/radioInput/radioInput.css');

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
            this.checked = !this.checked;
        });
    }
}

customElements.define('radio-input', RadioInput, { extends: 'input' });