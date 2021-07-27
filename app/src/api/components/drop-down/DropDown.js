import { addStyleIfNotExists } from "../../../js/Util.js";

class DropDown extends HTMLSelectElement {
    constructor() {
        super();

        this.clickCallback = (e) => {}

        const body = document.getElementsByTagName('body')[0];

        addStyleIfNotExists('../api/components/drop-down/DropDown.css');

        //pull select out of doc, add a wrapper div, and append select to it
        const parent = this.parentNode;
        const customSelect = document.createElement('div');
        customSelect.className = 'custom-select';
        
        const temp = parent.replaceChild(customSelect, this);
        customSelect.appendChild(temp);

        let select = this;
        let selLen = this.length;
        
        let a = document.createElement("DIV");
        a.setAttribute("class", "select-selected");
        a.innerHTML = select.options[select.selectedIndex].innerHTML;
        customSelect.appendChild(a);
        
        let b1 = document.createElement("DIV");
        b1.setAttribute("class", "select-items select-hide");

        let b = document.createElement("DIV");
        b.setAttribute("class", "select-scroll");
        b.style.height = this.hasAttribute("scrollable") && this.hasAttribute("scrollHeight") ? this.getAttribute("scrollHeight") : "100%";

        for (let j = 1; j < selLen; j++) {
            let c = document.createElement("DIV");
            c.id = select.options[j].innerHTML;
            c.innerHTML = select.options[j].innerHTML;

            if (c.id == a.innerHTML) {
                c.classList.add("same-as-selected");
            }

            c.addEventListener("click", (e) => {
                const elem = e.currentTarget;
                let s = elem.parentNode.parentNode.getElementsByTagName("select")[0];
                let sl = s.length;
                let h = elem.parentNode.previousSibling;

                for (let i = 0; i < sl; i++) {
                    if (s.options[i].innerHTML == elem.innerHTML) {
                        s.selectedIndex = i;
                        h.innerHTML = elem.innerHTML;

                        let y = elem.parentNode.getElementsByClassName("same-as-selected");
                        let yl = y.length;
                        for (let k = 0; k < yl; k++) {
                            y[k].removeAttribute("class");
                        }

                        elem.setAttribute("class", "same-as-selected");

                        break;
                    }
                }

                this.clickCallback(e);

                h.click();

            });

            b.appendChild(c);

        }

        b1.appendChild(b);
        customSelect.appendChild(b1);

        a.addEventListener("click", function(e) {
            e.stopPropagation();
            closeAllSelect(this);
            this.nextSibling.classList.toggle("select-hide");
            this.classList.toggle("select-arrow-active");
        });
        function closeAllSelect(elmnt) {
            var x, y, i, xl, yl, arrNo = [];
            x = document.getElementsByClassName("select-items");
            y = document.getElementsByClassName("select-selected");
            xl = x.length;
            yl = y.length;
            for (i = 0; i < yl; i++) {
                if (elmnt == y[i]) {
                arrNo.push(i)
                } else {
                y[i].classList.remove("select-arrow-active");
                }
            }
            for (i = 0; i < xl; i++) {
                if (arrNo.indexOf(i)) {
                x[i].classList.add("select-hide");
                }
            }
        }
        
        if (!body.hasAttribute('data-select-close')) {
            document.addEventListener("click", closeAllSelect);
            body.setAttribute('data-select-close', '');
        }
    }
}

customElements.define('drop-down', DropDown, { extends: 'select' });