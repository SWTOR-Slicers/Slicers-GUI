import { readString } from "../Util.js";
import Vec3 from "./Vec3.js";
const { Float16Array } = require("@petamoriken/float16");
function cElem(type) {
    return document.createElement(type);
}

class GR2Face {
    constructor(buffer, offset) {
        this.indices = new Uint16Array(buffer, offset, 3);
    }
}
class GR2Vertex {
    constructor(buffer, offset, size) {
        this.size = size;

        var pos = new Float32Array(buffer, offset, 3);

        this.x = pos[0];
        this.y = pos[1];
        this.z = pos[2];
        offset += 12;

        if (size == 24) {
            var normal = new Uint8Array(buffer, offset, 4);
            offset += 4;
            var tangent = new Uint8Array(buffer, offset, 4);
            offset += 4;
            var uv = new Float16Array(buffer, offset, 2);

            this.normal = new Vec3(normal[0], normal[1], normal[2]);
            this.norm4 = normal[3];

            this.tangent = new Vec3(tangent[0], tangent[1], tangent[2]);
            this.tan4 = tangent[3];

            this.binormal = this.tangent.normalize().crossProduct(this.normal.normalize());

            this.u = uv[0];
            this.v = uv[1];
        } else if (size == 32) {
            this.weights = new Uint8Array(buffer, offset, 4);
            offset += 4;

            this.bones = new Uint8Array(buffer, offset, 4);
            offset += 4;

            var normal = new Uint8Array(buffer, offset, 4);
            offset += 4;

            var tangent = new Uint8Array(buffer, offset, 4);
            offset += 4;
            var uv = new Float16Array(buffer, offset, 2);

            this.normal = new Vec3(normal[0], normal[1], normal[2]);
            this.norm4 = normal[3];

            this.tangent = new Vec3(tangent[0], tangent[1], tangent[2]);
            this.tan4 = tangent[3];

            this.binormal = this.tangent.normalize().crossProduct(this.normal.normalize());

            this.u = uv[0];
            this.v = uv[1];
        } else if (size == 36) {
            this.weights = new Uint8Array(buffer, offset, 4);
            offset += 4;

            this.bones = new Uint8Array(buffer, offset, 4);
            offset += 4;

            var normal = new Uint8Array(buffer, offset, 4);
            offset += 4;

            var tangent = new Uint8Array(buffer, offset, 4);
            offset += 4;
            var uv = new Float16Array(buffer, offset, 2);

            this.normal = new Vec3(normal[0], normal[1], normal[2]);
            this.norm4 = normal[3];

            this.tangent = new Vec3(tangent[0], tangent[1], tangent[2]);
            this.tan4 = tangent[3];

            this.binormal = this.tangent.normalize().crossProduct(this.normal.normalize());

            this.u = uv[0];
            this.v = uv[1];
        }
    }
}
class GR2Piece {
    constructor(buffer, offsetMeshPiece) {
        var curPiece = this;
        curPiece.faceStartIndex = new Uint32Array(buffer, offsetMeshPiece, 1)[0];
        curPiece.numFaces = new Uint32Array(buffer, offsetMeshPiece + 4, 1)[0];
    }
}
class GR2MeshBone {
    constructor(buffer, offset) {
        this.nameOffset = new Uint32Array(buffer, offset, 1);
        this.name = readString(buffer, this.nameOffset);

        this.bounds = new Float32Array(buffer, offset + 4, 6);
    }

    render() {
        let bone = cElem('div');
        bone.className = 'section-container';

        let name = dataDiv('Name', this.name);
        bone.appendChild(name);

        return bone;
    }
}
class GR2Mesh {
    constructor(buffer, offsetMeshHeader) {
        var curMesh = this;
        curMesh.offsetMeshName = new Uint32Array(buffer, offsetMeshHeader, 1)[0];
        curMesh.name = readString(buffer, curMesh.offsetMeshName);
        curMesh.numPieces = new Uint16Array(buffer, offsetMeshHeader + 8, 1)[0];
        curMesh.numUsedBones = new Uint16Array(buffer, offsetMeshHeader + 10, 1)[0];
        curMesh.bitFlag2 = new Uint16Array(buffer, offsetMeshHeader + 12, 1)[0];
        curMesh.vertexSize = new Uint16Array(buffer, offsetMeshHeader + 14, 1)[0];
        var meshData = new Uint32Array(buffer, offsetMeshHeader + 16, 6)
        curMesh.numVertices = meshData[0];
        curMesh.numFaces = meshData[1];
        curMesh.offsetMeshVertices = meshData[2];
        curMesh.offsetMeshPieces = meshData[3];
        curMesh.offsetFaces = meshData[4];
        curMesh.offsetBones = meshData[5];

        curMesh.pieces = [];
        for (let i = 0; i < curMesh.numPieces; i++) {
            var p = new GR2Piece(buffer, curMesh.offsetMeshPieces + (48 * i));
            curMesh.pieces.push(p);
        }

        curMesh.vertices = [];
        for (let i = 0; i < curMesh.numVertices; i++) {
            var v = new GR2Vertex(buffer, curMesh.offsetMeshVertices + i * curMesh.vertexSize, curMesh.vertexSize);
            curMesh.vertices.push(v);
        }

        curMesh.faces = [];
        for (let i = 0; i < curMesh.numFaces / 3; i++) {
            var f = new GR2Face(buffer, curMesh.offsetFaces + i * 6);
            curMesh.faces.push(f);
        }

        curMesh.bones = [];
        for (let i = 0; i < curMesh.numBones; i++) {
            var mb = new GR2MeshBone(buffer, curMesh.offsetBones + i * 28);
            curMesh.bones.push(mb);
        }
    }

    render() {
        let mesh = cElem('div');
        mesh.className = 'section-container';

        let name = dataDiv('Name', this.name);
        mesh.appendChild(name);

        let nFaces = dataDiv('Faces', this.numFaces / 3);
        mesh.appendChild(nFaces);

        let nVert = dataDiv('Vertices', this.numVertices);
        mesh.appendChild(nVert);

        let sVert = dataDiv('Vertex Size', this.vertexSize);
        mesh.appendChild(sVert);

        let nInd = dataDiv('Indices', this.numFaces);
        mesh.appendChild(nInd);

        let bones = labelDiv('Bones');
        mesh.appendChild(bones);

        let meshBonesField = cElem('div');
        meshBonesField.className = 'section-container';

        let nMesheBones = dataDiv("Number of Bones", this.numUsedBones);
        meshBonesField.appendChild(nMesheBones);

        for (let i = 0; i < this.bones.length; i++) {
            let bLabel = labelDiv('Bone');
            meshesField.appendChild(bLabel);

            let b = this.bones[i];
            let data = b.render();

            meshesField.appendChild(data);
        }

        mesh.appendChild(meshBonesField);

        return mesh;
    }
}
class GR2Bone {
    constructor(buffer, offset) {
        this.offsetBoneName = new Uint32Array(buffer, offset, 1)[0];
        this.name = readString(buffer, this.offsetBoneName);
        //-1 means the bone is the root
        this.parentBoneIndex = new Int32Array(buffer, offset + 4)[0];
        this.boneToParent = new Float32Array(buffer, offset + 8, 16);
        this.rootToBone = new Float32Array(buffer, offset + 72, 16);
        
    }
}
class GR2Attachment {
    constructor(buffer, offset) {
        this.nameOffset = new Uint32Array(buffer, offset, 1);
        this.name = readString(buffer, this.nameOffset);

        this.boneNameOffset = new Uint32Array(buffer, offset + 4, 1);
        this.boneName = readString(buffer, this.boneNameOffset);

        this.matrix = new Uint32Array(buffer, offset + 8, 16);
    }

    render() {
        let att = cElem('div');
        att.className = 'section-container';

        let name = dataDiv('Name', this.name);
        att.appendChild(name);

        let bName = dataDiv('Bone Name', this.boneName);
        att.appendChild(bName);

        return att;
    }
}
class GR2Material {
    constructor (buffer, offset) {
        this.nameOffset = new Uint32Array(buffer, offset, 1);
        this.name = readString(buffer, this.nameOffset);
    }

    render() {
        let mat = cElem('div');
        mat.className = 'section-container';

        let name = dataDiv('Name', this.name);
        mat.appendChild(name);

        return mat;
    }
}
/**
 * Parses a Bioware Austin GR2 file and creates an object representation of it
 */
class GR2 {
    /**
     * @param {ArrayBuffer} buffer The array buffer of the GR2 file.
     */
    constructor(buffer) {
        this.type = new Uint32Array(buffer, 20, 1)[0];

        this.header = new Uint16Array(buffer, 24, 4);
        this.numMeshes = this.header[0];
        this.numMaterials = this.header[1];
        this.numBones = this.header[2];
        this.numAttachs = this.header[3];

        this.boundingBox = new Float32Array(buffer, 48, 8);

        var tempInfo = new Uint32Array(buffer, 80, 5);
        this.offsetCachedOffsets = tempInfo[0];
        this.offsetMeshHeader = tempInfo[1];
        this.offsetMaterialNameOffsets = tempInfo[2];
        this.offsetBoneStructure = tempInfo[3];
        this.offsetAttachments = tempInfo[4];

        if (this.type == 0 || this.type == 1) {
            this.meshes = [];
            for (let i = 0; i < this.numMeshes; i++) {
                var res = new GR2Mesh(buffer, this.offsetMeshHeader + (40 * i));
                this.meshes.push(res);
            }

            this.attachments = [];
            for (let i = 0; i < this.numAttachs; i++) {
                var att = new GR2Attachment(buffer, this.offsetAttachments + i * 72);
                this.attachments.push(att);
            }

            this.materials = [];
            for (let i = 0; i < this.numMaterials; i++) {
                let m = new GR2Material(buffer, this.offsetMaterialNameOffsets + i * 4);
                this.materials.push(m);
            }
        } else if (this.type == 2) {
            this.bones = [];
            for (let i = 0; i < this.numBones; i++) {
                var res = new GR2Bone(buffer, this.offsetBoneStructure + (136 * i));
                this.bones.push(res);
            }
        }
    }
    /**
     * Converts the GR2 element into a displayable group of DOM nodes, allowing it to be rendered to the HTML.
     */
    render() {
        if (this.type == 0 || 1) {
            let children = [];

            {
                let meshSection = cElem('div');
                meshSection.className = 'data-info-section';

                let meshes = labelDiv(`Meshes`);
                meshSection.appendChild(meshes);

                let meshesField = cElem('div');
                meshesField.className = 'section-container';

                let nMeshes = dataDiv("Number of Meshes", this.numMeshes);
                meshesField.appendChild(nMeshes);

                for (let i = 0; i < this.meshes.length; i++) {
                    let mLabel = labelDiv('Mesh');
                    meshesField.appendChild(mLabel);

                    let m = this.meshes[i];
                    let data = m.render();

                    meshesField.appendChild(data);
                }

                meshSection.appendChild(meshesField);

                children.push(meshSection);
            }

            {
                let matSection = cElem('div');
                matSection.className = 'data-info-section';

                let mats = labelDiv(`Materials`);
                matSection.appendChild(mats);

                let matsField = cElem('div');
                matsField.className = 'section-container';

                for (let i = 0; i < this.materials.length; i++) {
                    let mLabel = labelDiv('Material');
                    matsField.appendChild(mLabel);

                    let m = this.materials[i];
                    let data = m.render();

                    matsField.appendChild(data);
                }

                matSection.appendChild(matsField);

                children.push(matSection);
            }

            {
                let attSection = cElem('div');
                attSection.className = 'data-info-section';

                let atts = labelDiv(`Attachments`);
                attSection.appendChild(atts);

                let attsField = cElem('div');
                attsField.className = 'section-container';

                for (let i = 0; i < this.attachments.length; i++) {
                    let attLabel = labelDiv('Attachment');
                    attsField.appendChild(attLabel);
                    
                    let m = this.attachments[i];
                    let data = m.render();

                    attsField.appendChild(data);
                }

                attSection.appendChild(attsField);

                children.push(attSection);
            }

            return children;
        } else {
            let div = cElem("div")
            div.innerHTML = "This is a skeleton, which is not supported yet";
            return [div];
        }
    }
}

function dataDiv(name, value) {
    let d = cElem("div");
    d.className = "data-info-field";
    
    let dName = cElem('div');
    dName.className = 'data-info__name';
    dName.innerHTML = name + ":";
    d.appendChild(dName);
    
    let dValue = cElem('div');
    dValue.className = 'data-info__value';
    dValue.innerHTML = value;
    d.appendChild(dValue);

    return d;
}
function labelDiv(iHTML) {
    let d = cElem("div");
    d.className = "data-label-field-container";
    
    let dIconCont = cElem('div');
    dIconCont.className = 'data-label-field__icon';
    dIconCont.innerHTML = '<i class="fas fa-plus-square"></i>';
    d.appendChild(dIconCont);
    
    let dName = cElem('div');
    dName.className = 'data-label-field';
    dName.innerHTML = iHTML;
    d.appendChild(dName);

    return d;
}

export { GR2 };