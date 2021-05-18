const fs = require('fs');
const path = require('path');

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
        this.path = path;
        this.name = (name) ? name : path.substring(path.lastIndexOf("\\") + 1);
        this.contents = [];
    }
  
    build() {
        this.contents = [];
  
        let files = fs.readdirSync(this.path);
  
        for (let i = 0; i < files.length; i++) {
            let file = files[i];
  
            let contentPath = path.resolve(this.path, file);
            
            console.log(contentPath);
  
            let stat = fs.statSync(contentPath);
  
            if (stat.isDirectory()) {
                //its a directory
                this.contents.push(new File(contentPath, file, "directory", true))
            } else {
                //its a file
                if (path.extname(file) == ".gr2") {
                    //its a gr2
                    this.contents.push(new File(contentPath, file, "file", true));
                } else {
                    //some other file
                    this.contents.push(new File(contentPath, file, "file", false));
                }
            }
        }
    }
  
    render(parent) {
        this.build();
  
        parent.innerHTML = "";
  
        this.contents.forEach((file) => {
            let div = document.createElement('div');
            div.classList.add("tree-elem");

            if (file.type == "file") {
                if (file.canClick) {
                    //its a gr2
                    div.innerHTML = `<i class="fas fa-file"></i>`;

                    let fileNameDiv = document.createElement('div');
                    fileNameDiv.innerHTML = file.name;

                    div.appendChild(fileNameDiv);

                    parent.appendChild(div);
                } else {
                    //something else
                    div.innerHTML = `<i class="fas fa-ban"></i>`;

                    let fileNameDiv = document.createElement('div');
                    fileNameDiv.innerHTML = file.name;

                    div.appendChild(fileNameDiv);

                    parent.appendChild(div);
                }
            } else {
                //its a directory
                div.innerHTML = `<i class="fas fa-folder"></i>`; //also try fas instead of far

                let fileNameDiv = document.createElement('div');
                fileNameDiv.innerHTML = file.name;

                div.appendChild(fileNameDiv);

                parent.appendChild(div);
            }
        });
    }
}