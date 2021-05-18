const fs = window.api.fs;

class File {
    constructor(path, type, canClick) {
        this.path = path;
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

        files.forEach((file) => {
            if (fs.statSync(this.path + "/" + file).isDirectory()) {
                //its a directory
                this.contents.push(new File(file, "directory", true))
            } else {
                //its a file
                if (file.substring(file.length - 4) == ".gr2") {
                    //its a gr2
                    this.contents.push(new File(file, "file", true));
                } else {
                    //some other file
                    this.contents.push(new File(file, "file", false));
                }
            }
        })
    }

    render(parent) {
        this.build();

        parent.innerHTML = "";

        this.contents.forEach((file) => {
            if (file.type == "file") {
                if (file.canClick) {
                    //its a gr2

                } else {
                    //something else

                }
            } else {
                //its a directory
                
            }
        });
    }
}