const fs = require('fs');
const path = require('path');

const outputElem = document.getElementById('outputTextField');

export function exportObj(gr2) {
    const fileName = gr2.meshes[0].name;
    const delimeter = `# <------- Next section ------->\n`;
    const folderPath = path.join(outputElem.value, `output`);
    const filePath = path.join(folderPath, `${fileName}.obj`);

    let info = `
    # Model by Bioware/EA\n
    # Conversion written by Tormak, generated with the Slicers GUI\n
    o ${fileName}\n
    `;

    let verts = ``;
    let uvs = ``;
    let normals = ``;
    let faces = ``;

    for (mesh of gr2.meshes) {
        for (v of mesh.vertices) {
            verts.concat(`v ${v.x} ${v.y} ${v.z}\n`);
            
            uvs.concat(`vt ${v.u} ${v.v}\n`);
            
            normals.concat(`vn ${v.normal.x} ${v.normal.y} ${v.normal.z}\n`);
        }
        for (f of mesh.faces) {
            faces.concat(`f ${f.indices[0] + 1}/${f.indices[0] + 1}/${f.indices[0] + 1} ${f.indices[1] + 1}/${f.indices[1] + 1}/${f.indices[1] + 1} ${f.indices[2] + 1}/${f.indices[2] + 1}/${f.indices[2] + 1}\n`);
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