import {resourcePath} from "../../api/config/resourcePath/ResourcePath.js";
const fs = require('fs');
const path = require('path');

export function exportFBX(gr2) {
    const configPath = path.normalize(path.join(resourcePath, "config.json"));
    let res = fs.readFileSync(configPath);
    let json = JSON.parse(res);
    const outputElemPath = json.outputFolder;

    const fileName = gr2.meshes[0].name;
    const folderPath = path.join(outputElemPath, `output`);
    const filePath = path.join(folderPath, `${fileName}.fbx`);

    //create output directory if it does not already exist
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath);
    }

    //assemble string data
    // const data = JSON.stringify(gr2, null, '\t');

    //second to last step
    // fs.writeFile(filePath, data, function (err) {
    //     if (err) return console.log(err);
    // });
}