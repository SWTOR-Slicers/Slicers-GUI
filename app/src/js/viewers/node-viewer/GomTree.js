import {Node} from "../../classes/Node.js";

class NodeElem {
    /**
     * @param  {String} fqn Node fqn id.
     * @param  {Node} node Node fqn id.
     */
    constructor(fqn, node) {
        this.fqn = fqn;
        this.node = node;
    }

    render(parent, renderElem) {
        const path = this.fqn.split(".");

        for (let i = 0; i < path.length; i++) {
            if (i == path.length - 1) {
                const dFam = document.createElement('div');
                dFam.className = "node-fam";

                const dNode = document.createElement('div');
                dNode.id = this.fqn;
                dNode.className = "node";
                dNode.innerHTML = `${path[i]}.node`;
                dNode.addEventListener('click', (e) => { this.node.render(renderElem); });

                dFam.appendChild(dNode)

                if (i == 0) {
                    parent.appendChild(dFam)
                } else {
                    document.getElementById(`${path.slice(0, i).join('.')}`).appendChild(dFam);
                }
            } else {
                const id = path.slice(0, i+1).join(".");
                if (!document.getElementById(id)) {
                    const dNode = document.createElement('div');
                    dNode.id = id;
                    dNode.className = "node-fam";

                    const dFam = document.createElement('div');
                    dFam.className = "node-fam__name";

                    const dImg = document.createElement('img');
                    dImg.src = "../img/Expand Section Icon.svg";
                    dImg.width = "10";
                    dImg.height = "10";
                    dFam.appendChild(dImg);

                    const dName = document.createElement('div');
                    dName.innerHTML = path[i];
                    dName.className = "node-fam-name";
                    dFam.appendChild(dName);

                    dFam.addEventListener('click', (e) => {
                        if (dFam.nextElementSibling.classList.contains('fam-open')) {
                            dFam.nextElementSibling.classList.remove('fam-open');
                            dImg.src = "../img/Expand Section Icon.svg";
                        } else {
                            dFam.nextElementSibling.classList.add('fam-open');
                            dImg.src = "../img/Collapse Section Icon.svg";
                        }
                    });
                    dNode.appendChild(dFam);

                    if (i == 0) {
                        parent.appendChild(dNode)
                    } else {
                        document.getElementById(`${path.slice(0, i).join('.')}`).appendChild(dNode);
                    }
                }
            }
        }
    }
}

export function initGomTree(parent, renderElem) {
    const lanaNodeTest = new Node([]);
    const lanaTest = new NodeElem('ipp.exp.seasons.01.multi.lana_beniko', lanaNodeTest);
    lanaTest.render(parent, renderElem);
}