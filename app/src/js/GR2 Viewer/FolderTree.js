import { render } from "./Render.js";
const fs = require('fs');
const path = require('path');
const pathField = document.getElementById("pathField");
const changeEvent = new Event('change');

class File {
    constructor(path, name, type, canClick) {
        this.path = path;
        this.name = name;
        this.type = type;
        this.canClick = canClick;
    }
}
  
export class FolderTree {
    constructor(path, name=null) {
        pathField.value = path;
        this.path = path;
        this.name = (name) ? name : path.substring(path.lastIndexOf("\\") + 1);
        this.contents = {
            directories: [],
            files: []
        };
    }

    reInit(path, name=null) {
        pathField.value = path;
        this.path = path;
        this.name = (name) ? name : path.substring(path.lastIndexOf("\\") + 1);
        this.contents = {
            directories: [],
            files: []
        };
    }
  
    build() {
        this.contents = {
            directories: [],
            files: []
        };
  
        let files = fs.readdirSync(this.path);
  
        for (let i = 0; i < files.length; i++) {
            let file = files[i];
            let contentPath = path.resolve(this.path, file);
            try {
                let stat = fs.statSync(contentPath);
  
                if (stat.isDirectory()) {
                    //its a directory
                    this.contents.directories.push(new File(contentPath, file, "directory", true))
                } else {
                    //its a file
                    if (path.extname(file) == ".gr2") {
                        //its a gr2
                        this.contents.files.push(new File(contentPath, file, "file", true));
                    } else {
                        //some other file
                        //this.contents.files.push(new File(contentPath, file, "file", false));
                    }
                }
            } catch (e) {
                console.log(e);
            }
        }
    }
  
    render(parent) {
        this.build();
  
        parent.innerHTML = "";
  
        this.contents.directories.forEach((file) => {
            let div = document.createElement('div');
            div.classList.add("tree-elem");
            div.classList.add("tree-elem-hover");

            //its a directory
            div.innerHTML = `<i class="fas fa-folder"></i>`;

            let fileNameDiv = document.createElement('div');
            fileNameDiv.classList.add("tree-elem-text");
            fileNameDiv.innerHTML = file.name;

            div.appendChild(fileNameDiv);

            div.onclick = (e) => {
                let pathElem = getChildElements(e.currentTarget)[1];
                let dirPath = path.resolve(this.path, pathElem.innerHTML);

                this.reInit(dirPath, null);

                pathField.dispatchEvent(changeEvent);
                
                this.render(parent);
            }

            parent.appendChild(div);
        });

        this.contents.files.forEach((file) => {
            let div = document.createElement('div');
            div.classList.add("tree-elem");

            if (file.canClick) {
                div.classList.add("tree-elem-hover");
                //its a gr2
                div.innerHTML = `<i class="fas fa-file"></i>`;

                let fileNameDiv = document.createElement('div');
                fileNameDiv.classList.add("tree-elem-text");
                fileNameDiv.innerHTML = file.name;

                div.appendChild(fileNameDiv);

                div.onclick = (e) => {
                    let pathElem = getChildElements(e.currentTarget)[1];
                    let gr2Path = path.resolve(this.path, pathElem.innerHTML);

                    render(gr2Path);
                }

                parent.appendChild(div);
            } else {
                //something else
                div.innerHTML = `<i class="fas fa-ban"></i>`;

                let fileNameDiv = document.createElement('div');
                fileNameDiv.classList.add("tree-elem-text");
                fileNameDiv.classList.add("tree-elem-text__disabled");
                fileNameDiv.innerHTML = file.name;

                div.appendChild(fileNameDiv);

                parent.appendChild(div);
            }
        });
    }
}

function getChildElements(element) {
    var cNodes = element.childNodes;
    var toReturn = [];
    cNodes.forEach((e) => {
        if (e.nodeType == 1) {
            toReturn.push(e);
        }
    });
    return toReturn;
}