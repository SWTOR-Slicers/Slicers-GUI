const fs = require('fs');
const Parser = require('node-xml-stream');

let parser = new Parser();

class XML_MAT {
    constructor(dest, ext) {
        this.#dest = dest;
        this.extension = ext;
        this.fileNames = {};
        this.animFileNames = {}
        this.errors = [];
    }

    parseXML(fileStream, fullFileName, baseFolder = null) {
        const fileName = fullFileName.Substring(fullFileName.LastIndexOf('\\') + 1);
        const directory = fullFileName.Substring(0, fullFileName.LastIndexOf('/'));

        try {
            if (fileName.contains("am_")) {
                const doc = XDocument.Load(fileStream);

                const temp = fileName.Split('/').Last();
                const fileNameNoExtension = temp.Substring(3, (temp.IndexOf('.') - 3));
                let fullDirectory = "";
                if (baseFolder != null)
                    fullDirectory = string.Format("/resources/{0}", baseFolder);
                else {
                    fullDirectory = directory + '/' + fileNameNoExtension + '/';
                }
                const aamElement = doc.getElementsByTagName("aam")[0];
                if (aamElement == null) {
                    return;
                }
                const actionElement = aamElement.getElementsByTagName("actions")[0];
                if (actionElement != null) {
                    const actionList = actionElement.Elements("action");

                    for (const action of actionList) {
                        let actionName = action.getAttribute("name").childNodes[0].nodeValue;
                        if (action.getAttribute("actionProvider") != null) {
                            const actionProvider = action.getAttribute("actionProvider").childNodes[0].nodeValue + ".mph";
                            if (fullDirectory.contains("/humanoid/humanoid/")) {
                                animFileNames.push(fullDirectory.replace("/humanoid/humanoid/", "/humanoid/bfanew/") + actionProvider);
                                animFileNames.push(fullDirectory.replace("/humanoid/humanoid/", "/humanoid/bfanew/") + actionProvider + ".amx");
                                animFileNames.push(fullDirectory.replace("/humanoid/humanoid/", "/humanoid/bfbnew/") + actionProvider);
                                animFileNames.push(fullDirectory.replace("/humanoid/humanoid/", "/humanoid/bfnnew/") + actionProvider);
                                animFileNames.push(fullDirectory.replace("/humanoid/humanoid/", "/humanoid/bfnnew/") + actionProvider + ".amx");
                                animFileNames.push(fullDirectory.replace("/humanoid/humanoid/", "/humanoid/bfsnew/") + actionProvider);
                                animFileNames.push(fullDirectory.replace("/humanoid/humanoid/", "/humanoid/bfsnew/") + actionProvider + ".amx");

                                animFileNames.push(fullDirectory.replace("/humanoid/humanoid/", "/humanoid/bmanew/") + actionProvider);
                                animFileNames.push(fullDirectory.replace("/humanoid/humanoid/", "/humanoid/bmanew/") + actionProvider + ".amx");
                                animFileNames.push(fullDirectory.replace("/humanoid/humanoid/", "/humanoid/bmfnew/") + actionProvider);
                                animFileNames.push(fullDirectory.replace("/humanoid/humanoid/", "/humanoid/bmfnew/") + actionProvider + ".amx");
                                animFileNames.push(fullDirectory.replace("/humanoid/humanoid/", "/humanoid/bmnnew/") + actionProvider);
                                animFileNames.push(fullDirectory.replace("/humanoid/humanoid/", "/humanoid/bmnnew/") + actionProvider + ".amx");
                                animFileNames.push(fullDirectory.replace("/humanoid/humanoid/", "/humanoid/bmsnew/") + actionProvider);
                                animFileNames.push(fullDirectory.replace("/humanoid/humanoid/", "/humanoid/bmsnew/") + actionProvider + ".amx");
                            } else {
                                animFileNames.push(fullDirectory + actionProvider);
                                animFileNames.push(fullDirectory + actionProvider + ".amx");
                            }
                        }
                        if (action.getAttribute("animName") != null) {
                            const animationName = action.getAttribute("animName").childNodes[0].nodeValue;
                            if (actionName != animationName) {
                                animationName += ".jba";
                                if (fullDirectory.contains("/humanoid/humanoid/")) {
                                    animFileNames.push(fullDirectory.replace("/humanoid/humanoid/", "/humanoid/bfanew/") + animationName);
                                    animFileNames.push(fullDirectory.replace("/humanoid/humanoid/", "/humanoid/bfbnew/") + animationName);
                                    animFileNames.push(fullDirectory.replace("/humanoid/humanoid/", "/humanoid/bfnnew/") + animationName);
                                    animFileNames.push(fullDirectory.replace("/humanoid/humanoid/", "/humanoid/bfsnew/") + animationName);

                                    animFileNames.push(fullDirectory.replace("/humanoid/humanoid/", "/humanoid/bmanew/") + animationName);
                                    animFileNames.push(fullDirectory.replace("/humanoid/humanoid/", "/humanoid/bmfnew/") + animationName);
                                    animFileNames.push(fullDirectory.replace("/humanoid/humanoid/", "/humanoid/bmnnew/") + animationName);
                                    animFileNames.push(fullDirectory.replace("/humanoid/humanoid/", "/humanoid/bmsnew/") + animationName);
                                } else {
                                    animFileNames.push(fullDirectory + animationName);
                                }
                            }
                        }
                        actionName += ".jba";
                        if (fullDirectory.contains("/humanoid/humanoid/")) {
                            animFileNames.push(fullDirectory.replace("/humanoid/humanoid/", "/humanoid/bfanew/") + actionName);
                            animFileNames.push(fullDirectory.replace("/humanoid/humanoid/", "/humanoid/bfbnew/") + actionName);
                            animFileNames.push(fullDirectory.replace("/humanoid/humanoid/", "/humanoid/bfnnew/") + actionName);
                            animFileNames.push(fullDirectory.replace("/humanoid/humanoid/", "/humanoid/bfsnew/") + actionName);

                            animFileNames.push(fullDirectory.replace("/humanoid/humanoid/", "/humanoid/bmanew/") + actionName);
                            animFileNames.push(fullDirectory.replace("/humanoid/humanoid/", "/humanoid/bmfnew/") + actionName);
                            animFileNames.push(fullDirectory.replace("/humanoid/humanoid/", "/humanoid/bmnnew/") + actionName);
                            animFileNames.push(fullDirectory.replace("/humanoid/humanoid/", "/humanoid/bmsnew/") + actionName);
                        } else {
                            animFileNames.push(fullDirectory + actionName);
                        }
                    }
                }

                const networkElem = aamElement.getElementsByTagName("networks")[0];
                if (networkElem != null) {
                    const networkList = networkElem.Descendants("literal");
                    for (const network of networkList) {
                        const fqnName = network.getAttribute("fqn").childNodes[0].nodeValue;
                        if (fqnName != null) {
                            if (fullDirectory.contains("/humanoid/humanoid/")) {
                                animFileNames.push(fullDirectory.replace("/humanoid/humanoid/", "/humanoid/bfanew/") + fqnName);
                                animFileNames.push(fullDirectory.replace("/humanoid/humanoid/", "/humanoid/bfanew/") + fqnName + ".amx");
                                animFileNames.push(fullDirectory.replace("/humanoid/humanoid/", "/humanoid/bfbnew/") + fqnName);
                                animFileNames.push(fullDirectory.replace("/humanoid/humanoid/", "/humanoid/bfbnew/") + fqnName + ".amx");
                                animFileNames.push(fullDirectory.replace("/humanoid/humanoid/", "/humanoid/bfnnew/") + fqnName);
                                animFileNames.push(fullDirectory.replace("/humanoid/humanoid/", "/humanoid/bfnnew/") + fqnName + ".amx");
                                animFileNames.push(fullDirectory.replace("/humanoid/humanoid/", "/humanoid/bfsnew/") + fqnName);
                                animFileNames.push(fullDirectory.replace("/humanoid/humanoid/", "/humanoid/bfsnew/") + fqnName + ".amx");

                                animFileNames.push(fullDirectory.replace("/humanoid/humanoid/", "/humanoid/bmanew/") + fqnName);
                                animFileNames.push(fullDirectory.replace("/humanoid/humanoid/", "/humanoid/bmanew/") + fqnName + ".amx");
                                animFileNames.push(fullDirectory.replace("/humanoid/humanoid/", "/humanoid/bmfnew/") + fqnName);
                                animFileNames.push(fullDirectory.replace("/humanoid/humanoid/", "/humanoid/bmfnew/") + fqnName + ".amx");
                                animFileNames.push(fullDirectory.replace("/humanoid/humanoid/", "/humanoid/bmnnew/") + fqnName);
                                animFileNames.push(fullDirectory.replace("/humanoid/humanoid/", "/humanoid/bmnnew/") + fqnName + ".amx");
                                animFileNames.push(fullDirectory.replace("/humanoid/humanoid/", "/humanoid/bmsnew/") + fqnName);
                                animFileNames.push(fullDirectory.replace("/humanoid/humanoid/", "/humanoid/bmsnew/") + fqnName + ".amx");
                            } else {
                                animFileNames.push(fullDirectory + fqnName);
                                animFileNames.push(fullDirectory + fqnName + ".amx");
                            }
                        }
                    }
                }
            } else {
                //! find equivilent to XDocument
                const doc = XDocument.Load(fileStream);
                for (const node of doc.childElements) {
                    NodeChecker(node);
                }
            }
        } catch (e) {
            errors.push("File: " + e.name);
            errors.push(e.message + ":");
            errors.push(e.stack);
            errors.push("");
        }
    }

    nodeChecker(node) {
        //! Need to figure out equivilant method to hasElements
        if (node.HasElements) {
            for (const childnode of node.childElements) {
                //! Need to figure out equivilant property to Name
                if (childnode.Name == "input" && childnode.getElementsByTagName("type")[0] != null) {
                    const type = childnode.getElementsByTagName("type")[0].childNodes[0].nodeValue; //new way of searching for texture file names
                    if (type == "texture") {
                        const textureName = childnode.getElementsByTagName("value")[0].childNodes[0].nodeValue;
                        if (textureName != null && textureName != "") {
                            const scrubbedName = textureName.replace("////", "//").replace("\\art", "art").replace(" #", "").replace("#", "").replace("+", "/").replace(" ", "_");
                            fileNames.push("\\resources\\" + scrubbedName + ".dds");
                            fileNames.push("\\resources\\" + scrubbedName + ".tex");
                            fileNames.push("\\resources\\" + scrubbedName + ".tiny.dds");
                            const fileName = scrubbedName.split('\\');
                            let startPosition = 0;
                            if (scrubbedName.contains('\\')) startPosition = scrubbedName.LastIndexOf('\\') + 1;
                            let length = scrubbedName.Length - startPosition;
                            const tagsToRemove = ["_d", "_n", "_s" ];
                            if (tagsToRemove.Any(name => scrubbedName.EndsWith(name.ToString()))) { length -= 2; }
                            const primaryName = scrubbedName.Substring(startPosition, length);
                            fileNames.push(`\\resources\\art\\shaders\\materials\\${primaryName}.mat`);
                        }
                    }
                    /*else //catch types for analysis. Caught the following types: bool, uvscale, float, rgba, vector4
                    {
                        System.IO.StreamWriter file3 = new System.IO.StreamWriter("c:\\swtor\\types.txt", true);
                        file3.WriteLine(type);
                        file3.Close();
                    }*/
                }
                const fxSpecList = childnode.Elements("fxSpecString");
                if (childnode.Name == "AppearanceAction" && fxSpecList.Count() > 0) {
                    for (const fxSpec of fxSpecList) {
                        const fxSpecName = "\\resources\\art\\fx\\fxspec\\" + fxSpec.childNodes[0].nodeValue;
                        if (!fxSpec.childNodes[0].nodeValue.ToLower().EndsWith(".fxspec")) fxSpecName += ".fxspec";
                        fileNames.push(fxSpecName);
                    }
                }
                if (childnode.Name == "Asset") {
                    const assetFilenames = this.#assetReader(childnode);
                    for (const name of assetFilenames) {
                        const scrubbedName = name.replace("////", "//").replace(" #", "").replace("#", "").replace("+", "/").replace(" ", "_");
                        fileNames.push(scrubbedName);
                    }
                } else {
                    this.nodeChecker(childnode);
                }
            }
        }
    }

    writeFile() {
        if (!fs.existsSync(`${dest}\\File_Names`)) fs.mkdirSync(`${dest}\\File_Names`);
        if (fileNames.length > 0) {
            const outputNames = fs.createWriteStream(`${dest}\\File_Names\\${extension}_file_names.txt.txt`, {
                flags: 'a'
            });
            for (const file of fileNames) {
                outputNames.write(`${file.replace("\\", "/")}\r\n`);
            }
            outputNames.end();
            this.fileNames = [];
        }

        if (animFileNames.length > 0) {
            const outputAnimNames = fs.createWriteStream(`${dest}\\File_Names\\${extension}_anim_file_names.txt`, {
                flags: 'a'
            });
            for (const file of animFileNames) {
                outputAnimNames.write(`${file.replace("\\", "/")}\r\n`);
            }
            outputAnimNames.end();
            this.animFileNames = [];
        }

        if (errors.length > 0) {
            const outputErrors = fs.createWriteStream(`${dest}\\File_Names\\${extension}_error_list.txt`, {
                flags: 'a'
            });
            for (const error of errors) {
                outputErrors.write(`${error}\r\n`);
            }
            outputErrors.end();
            this.errors = [];
        }
    }

    /**
     * Searches through provided xml element and generates a file list.
     * @param  {Document} childnode the xml element
     */
    #assetReader(childnode) {
        const fileList = [];
        /**
         * Util function to increase code readability
         * @param  {string} elem string to check
         * @param  {boolean} hasBodyTypes whether or not there are body types
         */
        function checkAndAdd(elem, hasBodyTypes) {
            if (elem.contains("[bt]") && hasBodyTypes) { //Checking if we need to create file names for each bodytype.
                fileList.concat(this.#bodyType(bodyTypeList, elem));
            } else {
                if (elem.contains("[gen]")) { // Checking for gender specific file names
                    fileList.concat(this.#genderize(elem));
                } else {
                    fileList.push("/resources" + elem);
                }
            }
        }

        if (childnode.getElementsByTagName("BaseFile")[0].childNodes[0].nodeValue != null) {
            const basefile = childnode.getElementsByTagName("BaseFile")[0].childNodes[0].nodeValue;
            let hasBodyTypes = false;
            let bodyTypeT = (childnode.getElementsByTagName("BodyTypes")[0] != null);
            let bodyTypet = (childnode.getElementsByTagName("Bodytypes")[0] != null);

            if (bodyTypeT) { hasBodyTypes = childnode.getElementsByTagName("BodyTypes")[0].HasElements; }
            if (bodyTypet) { hasBodyTypes = childnode.getElementsByTagName("Bodytypes")[0].HasElements; }
            if (hasBodyTypes) {
                let bodyTypeList = [];
                if (bodyTypeT) {
                    bodyTypeList = childnode.getElementsByTagName("BodyTypes")[0].childElements.map(c => c.childNodes[0].nodeValue);
                } else {
                    bodyTypeList = childnode.getElementsByTagName("Bodytypes")[0].childElements.map(c => c.childNodes[0].nodeValue);
                }
                if (childnode.getElementsByTagName("BaseFile")[0].childNodes[0].nodeValue != "") {
                    if (basefile.contains("[bt]") && hasBodyTypes) { //Checking if we need to create file names for each bodytype.
                        fileList.concat(this.#bodyType(bodyTypeList, basefile));
                    } else {
                        if (basefile.contains("[gen]")) { // Checking for gender specific file names
                            fileList.concat(this.#genderize(basefile));
                        } else {
                            fileList.push("/resources" + basefile);
                        }
                    }
                }

                const materials = childnode.getElementsByTagName("Materials")[0].childElements;
                if (materials != null) { //check for material file names.
                    for (const material of materials) {
                        const filename = material.getAttribute("filename").childNodes[0].nodeValue;
                        if (filename.contains("[bt]") && hasBodyTypes) { //Checking if we need to create file names for each bodytype.
                            fileList.concat(this.#bodyType(bodyTypeList, filename));
                        } else {
                            if (filename.contains("[gen]")) { // Checking for gender specific file names
                                fileList.concat(this.#genderize(filename));
                            }
                            else {
                                fileList.push("/resources" + filename);
                            }
                        }

                        const matoverrides = material.getElementsByTagName("MaterialOverrides")[0].childElements;
                        if (matoverrides != null) {
                            for (const over of matoverrides) {
                                const override_filename = over.getAttribute("filename").childNodes[0].nodeValue;
                                if (override_filename.contains("[bt]") && hasBodyTypes) { //Checking if we need to create file names for each bodytype.
                                    fileList.concat(this.#bodyType(bodyTypeList, override_filename));
                                } else {
                                    if (override_filename.contains("[gen]")) {
                                        fileList.concat(this.#genderize(override_filename)); // Checking for gender specific file names
                                    } else {
                                        fileList.push("/resources" + override_filename);
                                    }
                                }
                            }
                        }
                    }
                }

                const attachments = childnode.getElementsByTagName("Attachments")[0].childElements;
                if (attachments != null) { //check for attachment model file names.
                    for (const attachment of attachments) {
                        const filename = attachment.getAttribute("filename").childNodes[0].nodeValue;
                        if (filename.contains("[bt]")) { //Checking if we need to create file names for each bodytype.
                            fileList.concat(this.#bodyType(bodyTypeList, filename));
                        } else {
                            if (filename.contains("[gen]")) { // Checking for gender specific file names
                                fileList.concat(this.#genderize(filename));
                            } else {
                                fileList.push("/resources" + filename);
                            }
                        }
                    }
                }
            } else {
                if (childnode.getElementsByTagName("BaseFile")[0].childNodes[0].nodeValue != "") {
                    if (basefile.contains("[gen]")) { // Checking for gender specific file names
                        fileList.concat(this.#genderize(basefile));
                    } else {
                        fileList.push("/resources" + basefile);
                    }

                }

                const materials = childnode.getElementsByTagName("Materials")[0].childElements;
                if (materials != null) { //check for material file names.
                    for (const material of materials) {
                        const filename = material.getAttribute("filename").childNodes[0].nodeValue;
                        if (filename.contains("[gen]")) { // Checking for gender specific file names
                            fileList.concat(this.#genderize(filename));
                        } else {
                            fileList.push("/resources" + filename);
                        }
                    }
                }

                const attachments = childnode.getElementsByTagName("Attachments")[0].childElements;
                if (attachments != null) { //check for attachment model file names.
                    for (const attachment of attachments) {
                        const filename = attachment.getAttribute("filename").childNodes[0].nodeValue;
                        if (filename.contains("[gen]")) { // Checking for gender specific file names
                            fileList.concat(this.#genderize(filename));
                        } else {
                            fileList.push("/resources" + filename);
                        }
                    }
                }
            }
        }
        return fileList;
    }

    #genderize(filename) {
        const fileList = [];
        const genders = ["m", "f", "u"];

        for (const gender of genders) {
            const genderFileName = filename.replace("[gen]", gender);
            fileList.push("/resources" + genderFileName);
        }

        return fileList;
    }

    #bodyType(bodyTypeList, filename) {
        const fileList = [];

        for (const bodytype of bodyTypeList) {
            const bodyTypeFileName = filename.replace("[bt]", bodytype);
            fileList.push("/resources" + bodyTypeFileName);
        }

        return fileList;
    }
}

export { XML_MAT }