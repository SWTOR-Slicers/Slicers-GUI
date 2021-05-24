const fs = require('fs');
const path = require('path');

export function exportObj(gr2) {
    const configPath = path.normalize(path.join(__dirname, "../..", "/resources/config.json"));
    let res = fs.readFileSync(configPath);
    let json = JSON.parse(res);
    const outputElemPath = json.outputFolder;

    const fileName = gr2.meshes[0].name;
    const delimeter = `# <------- Next section ------->\n`;
    const folderPath = path.join(outputElemPath, `output`);
    const filePath = path.join(folderPath, `${fileName}.obj`);

    let info = `# Model by Bioware/EA\n# Conversion written by Tormak, generated with the Slicers GUI\no ${fileName}\n`;

    let verts = ``;
    let uvs = ``;
    let normals = ``;
    let faces = ``;

    for (const mesh of gr2.meshes) {
        for (const v of mesh.vertices) {
            verts = verts.concat(`v ${v.x.toFixed(6)} ${v.y.toFixed(6)} ${v.z.toFixed(6)}\n`);
            
            uvs = uvs.concat(`vt ${v.u} ${v.v}\n`);
            
            normals = normals.concat(`vn ${v.normal.x.toFixed(6)} ${v.normal.y.toFixed(6)} ${v.normal.z.toFixed(6)}\n`);
        }
        for (const f of mesh.faces) {
            faces = faces.concat(`f ${f.indices[0] + 1}/${f.indices[0] + 1}/${f.indices[0] + 1} ${f.indices[1] + 1}/${f.indices[1] + 1}/${f.indices[1] + 1} ${f.indices[2] + 1}/${f.indices[2] + 1}/${f.indices[2] + 1}\n`);
        }
    }

    //create output directory if it does not already exist
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath);
    }

    //assemble string data
    const data = info + delimeter + verts + delimeter + uvs + delimeter + normals + delimeter + faces;

    //last step
    fs.writeFile(filePath, data, function (err) {
        if (err) return console.log(err);
    });
}