import Vec3 from "./Vec3.js";
const { Float16Array } = require("@petamoriken/float16");

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
        this.name = new Uint32Array(buffer, offset, 1);
        this.bounds = new Float32Array(buffer, offset + 4, 6);
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
class GR2 {
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

            this.materialNames = [];
            for (let i = 0; i < this.numMaterials; i++) {
                var matName = readString(buffer, this.offsetMaterialNameOffsets + i * 4);
                this.materialNames.push(matName);
            }
        } else if (this.type == 2) {
            this.bones = [];
            for (let i = 0; i < this.numBones; i++) {
                var res = new GR2Bone(buffer, this.offsetBoneStructure + (136 * i));
                this.bones.push(res);
            }
        }
    }
}

function readString(buffer, posIn, length = undefined) {
    let pos = posIn;
    let outString = '';
    if (length === undefined) {
        let curChar = new Uint8Array(buffer, pos++, 1)[0];
        while (curChar !== 0) {
            outString += String.fromCharCode(curChar);
            curChar = new Uint8Array(buffer, pos++, 1)[0];
        }
    } else {
        for (let i = 0; i < length; i++) {
            const curChar = new Uint8Array(buffer, pos++, 1)[0];
            if (curChar === 0)
                break;
            outString += String.fromCharCode(curChar)
        }
    }
    return outString
}

export { GR2 };