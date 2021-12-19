import { Reader } from "../util/FileWrapper.js";

const hooks = {
    479: [
        {name: '/resources/art/static/area/str_stronghold/hooks/str_hook_wall_small_01.gr2', offset: [0, 0, 0],}
    ],
    481: [
        {name: '/resources/art/static/area/str_stronghold/hooks/str_hook_floor_med_01.gr2', offset: [0, 0, 0],}
    ],
    483: [
        {name: '/resources/art/static/area/str_stronghold/hooks/str_hook_wall_large_01.gr2', offset: [0, 0, 0],}
    ],
    576: [
        {name: '/resources/art/static/area/str_stronghold/hooks/str_hook_floor_small_01.gr2', offset: [0, 0, 0],}
    ],
    578: [
        {name: '/resources/art/static/area/str_stronghold/hooks/str_hook_floor_med_01.gr2', offset: [0, 0, 0],}
    ],
    580: [
        {name: '/resources/art/static/area/str_stronghold/hooks/str_hook_floor_large_01.gr2', offset: [0, 0, 0],}
    ],
    584: [
        {name: '/resources/art/static/area/str_stronghold/hooks/str_hook_ceiling_large_01.gr2', offset: [0, 0, 0],}
    ],
    586: [
        {name: '/resources/art/static/area/str_stronghold/hooks/str_hook_floor_med_01.gr2', offset: [0, 0, 0],}
    ],
    598: [
        {name: '/resources/art/static/area/str_stronghold/hooks/str_hook_wall_large_01.gr2', offset: [0, 0, 0],}
    ],
    631: [
        {name: '/resources/art/static/area/str_stronghold/hooks/str_hook_floor_large_01.gr2', offset: [0, 0, 0],}, 
        {name: '/resources/art/static/area/str_stronghold/hooks/str_hook_floor_small_01.gr2', offset: [0.30000001192092896, 0, 0.30000001192092896]}, 
        {name: '/resources/art/static/area/str_stronghold/hooks/str_hook_floor_small_01.gr2', offset: [-0.30000001192092896, 0, 0.30000001192092896]}, 
        {name: '/resources/art/static/area/str_stronghold/hooks/str_hook_floor_small_01.gr2', offset: [0, 0, 0.30000001192092896]}, 
        {name: '/resources/art/static/area/str_stronghold/hooks/str_hook_floor_small_01.gr2', offset: [-0.30000001192092896, 0, 0]}, 
        {name: '/resources/art/static/area/str_stronghold/hooks/str_hook_floor_small_01.gr2', offset: [0.30000001192092896, 0, 0]}, 
        {name: '/resources/art/static/area/str_stronghold/hooks/str_hook_floor_small_01.gr2', offset: [0.30000001192092896, 0, -0.30000001192092896]}, 
        {name: '/resources/art/static/area/str_stronghold/hooks/str_hook_floor_small_01.gr2', offset: [-0.30000001192092896, 0, -0.30000001192092896]}, 
        {name: '/resources/art/static/area/str_stronghold/hooks/str_hook_floor_small_01.gr2', offset: [0, 0, -0.30000001192092896]}, 
        {name: '/resources/art/static/area/str_stronghold/hooks/str_hook_floor_small_01.gr2', offset: [0, 0, 0],}
    ],
    663: [
        {name: '/resources/art/static/area/str_stronghold/hooks/str_hook_ceiling_large_01.gr2', offset: [0, 0, 0],}
    ],
    1148: [
        {name: '/resources/art/static/area/str_stronghold/hooks/str_hook_wall_large_01.gr2', offset: [-0.20000000298023224, 0, 0]},
        {name: '/resources/art/static/area/str_stronghold/hooks/str_hook_wall_large_01.gr2', offset: [0.20000000298023224, 0, 0]}
    ],
    1203: [
        {name: '/resources/art/static/area/str_stronghold/hooks/str_hook_floor_med_01.gr2', offset: [0, 0, 0],}
    ],
    1402: [
        {name: '/resources/art/static/area/str_stronghold/hooks/str_hook_floor_med_narrow_01.gr2', offset: [0, 0, 0],}
    ],
    1487: [
        {name: '/resources/art/static/area/str_stronghold/hooks/str_hook_floor_med_01.gr2', offset: [0, 0, 0],},
        {name: '/resources/art/static/area/str_stronghold/hooks/str_hook_wall_small_01.gr2', offset: [-0.10000000149011612, 0, -0.2750000059604645]},
        {name: '/resources/art/static/area/str_stronghold/hooks/str_hook_wall_small_01.gr2', offset: [0.10000000149011612, 0, -0.2750000059604645]},
        {name: '/resources/art/static/area/str_stronghold/hooks/str_hook_wall_small_01.gr2', offset: [0.10000000149011612, 0, 0.2750000059604645]},
        {name: '/resources/art/static/area/str_stronghold/hooks/str_hook_wall_small_01.gr2', offset: [-0.10000000149011612, 0, 0.2750000059604645]},
        {name: '/resources/art/static/area/str_stronghold/hooks/str_hook_wall_small_01.gr2', offset: [0.2750000059604645, 0, -0.10000000149011612]},
        {name: '/resources/art/static/area/str_stronghold/hooks/str_hook_wall_small_01.gr2', offset: [0.2750000059604645, 0, 0.10000000149011612]},
        {name: '/resources/art/static/area/str_stronghold/hooks/str_hook_wall_small_01.gr2', offset: [-0.2750000059604645, 0, -0.10000000149011612]},
        {name: '/resources/art/static/area/str_stronghold/hooks/str_hook_wall_small_01.gr2', offset: [-0.2750000059604645, 0, 0.10000000149011612]},
        {name: '/resources/art/static/area/str_stronghold/hooks/str_hook_wall_small_01.gr2', offset: [0.2750000059604645, 0, -0.2750000059604645]},
        {name: '/resources/art/static/area/str_stronghold/hooks/str_hook_wall_small_01.gr2', offset: [0.2750000059604645, 0, 0.2750000059604645]},
        {name: '/resources/art/static/area/str_stronghold/hooks/str_hook_wall_small_01.gr2', offset: [-0.2750000059604645, 0, -0.2750000059604645]},
        {name: '/resources/art/static/area/str_stronghold/hooks/str_hook_wall_small_01.gr2', offset: [-0.2750000059604645, 0, 0.2750000059604645]}
    ],
    1495: [
        {name: '/resources/art/static/area/str_stronghold/hooks/str_hook_floor_large_01.gr2', offset: [0, 0, 0],},
        {name: '/resources/art/static/area/str_stronghold/hooks/str_hook_floor_med_narrow_01.gr2', offset: [-0.6000000238418579, 0, -0.30000001192092896]},
        {name: '/resources/art/static/area/str_stronghold/hooks/str_hook_floor_med_narrow_01.gr2', offset: [0.6000000238418579, 0, -0.30000001192092896]},
        {name: '/resources/art/static/area/str_stronghold/hooks/str_hook_floor_med_narrow_01.gr2', offset: [-0.6000000238418579, 0, 0.30000001192092896]},
        {name: '/resources/art/static/area/str_stronghold/hooks/str_hook_floor_med_narrow_01.gr2', offset: [0.6000000238418579, 0, 0.30000001192092896]},
        {name: '/resources/art/static/area/str_stronghold/hooks/str_hook_floor_small_01.gr2', offset: [0.699999988079071, 0, -0.10000000149011612]},
        {name: '/resources/art/static/area/str_stronghold/hooks/str_hook_floor_small_01.gr2', offset: [0.5, 0, -0.10000000149011612]},
        {name: '/resources/art/static/area/str_stronghold/hooks/str_hook_floor_small_01.gr2', offset: [-0.699999988079071, 0, -0.10000000149011612]},
        {name: '/resources/art/static/area/str_stronghold/hooks/str_hook_floor_small_01.gr2', offset: [-0.5, 0, -0.10000000149011612]},
        {name: '/resources/art/static/area/str_stronghold/hooks/str_hook_floor_small_01.gr2', offset: [-0.5, 0, 0.10000000149011612]},
        {name: '/resources/art/static/area/str_stronghold/hooks/str_hook_floor_small_01.gr2', offset: [-0.699999988079071, 0, 0.10000000149011612]},
        {name: '/resources/art/static/area/str_stronghold/hooks/str_hook_floor_small_01.gr2', offset: [0.699999988079071, 0, 0.10000000149011612]},
        {name: '/resources/art/static/area/str_stronghold/hooks/str_hook_floor_small_01.gr2', offset: [0.5, 0, 0.10000000149011612]}
    ],
    1776: [
        {name: '/resources/art/static/area/str_stronghold/hooks/str_hook_floor_small_01.gr2', offset: [-0.10000000149011612, 0, 0]},
        {name: '/resources/art/static/area/str_stronghold/hooks/str_hook_floor_small_01.gr2', offset: [0.10000000149011612, 0, 0]}
    ],
    1809: [
        {name: '/resources/art/static/area/str_stronghold/hooks/str_hook_floor_cover_01.gr2', offset: [0, 0, 0],}
    ],
    1815: [
        {name: '/resources/art/static/area/str_stronghold/hooks/str_hook_floor_large_centerpiece_01.gr2', offset: [0, 0, 0],}
    ],
    1852: [
        {name: '/resources/art/static/area/str_stronghold/hooks/str_hook_skyscraper_01.gr2', offset: [0, 0, 0],}
    ],
    1856: [
        {name: '/resources/art/static/area/str_stronghold/hooks/str_hook_starship_01.gr2', offset: [0, 0, 0],}
    ],
    1890: [
        {name: '/resources/art/static/area/str_stronghold/hooks/str_hook_floor_large_01.gr2', offset: [0, 0, 0],},
        {name: '/resources/art/static/area/str_stronghold/hooks/str_hook_floor_med_narrow_01.gr2', offset: [0, 0, -0.5]},
        {name: '/resources/art/static/area/str_stronghold/hooks/str_hook_floor_med_narrow_01.gr2', offset: [0.5, 0, 0]},
        {name: '/resources/art/static/area/str_stronghold/hooks/str_hook_floor_med_narrow_01.gr2', offset: [0, 0, 0.5]},
        {name: '/resources/art/static/area/str_stronghold/hooks/str_hook_floor_med_narrow_01.gr2', offset: [-0.5, 0, 0]},
        {name: '/resources/art/static/area/str_stronghold/hooks/str_hook_floor_small_01.gr2', offset: [-0.30000001192092896, 0, -0.30000001192092896]},
        {name: '/resources/art/static/area/str_stronghold/hooks/str_hook_floor_small_01.gr2', offset: [0, 0, -0.30000001192092896]},
        {name: '/resources/art/static/area/str_stronghold/hooks/str_hook_floor_small_01.gr2', offset: [0.30000001192092896, 0, -0.30000001192092896]},
        {name: '/resources/art/static/area/str_stronghold/hooks/str_hook_floor_small_01.gr2', offset: [0.30000001192092896, 0, 0.30000001192092896]},
        {name: '/resources/art/static/area/str_stronghold/hooks/str_hook_floor_small_01.gr2', offset: [0, 0, 0.30000001192092896]},
        {name: '/resources/art/static/area/str_stronghold/hooks/str_hook_floor_small_01.gr2', offset: [-0.30000001192092896, 0, 0.30000001192092896]},
        {name: '/resources/art/static/area/str_stronghold/hooks/str_hook_floor_small_01.gr2', offset: [0.30000001192092896, 0, 0]},
        {name: '/resources/art/static/area/str_stronghold/hooks/str_hook_floor_small_01.gr2', offset: [-0.30000001192092896, 0, 0]}
    ],
    1992: [
        {name: '/resources/art/static/area/str_stronghold/hooks/str_hook_floor_large_01.gr2', offset: [0, 0, 0],}, 
        {name: '/resources/art/static/area/str_stronghold/hooks/str_hook_floor_med_01.gr2', offset: [-0.6000000238418579, 0, 0.20000000298023224]}, 
        {name: '/resources/art/static/area/str_stronghold/hooks/str_hook_floor_med_01.gr2', offset: [0.6000000238418579, 0, 0.20000000298023224]}, 
        {name: '/resources/art/static/area/str_stronghold/hooks/str_hook_floor_small_01.gr2', offset: [0.6000000238418579, 0, -0.15000000596046448]}, 
        {name: '/resources/art/static/area/str_stronghold/hooks/str_hook_floor_small_01.gr2', offset: [-0.6000000238418579, 0, -0.15000000596046448]}
    ],
    2227: [
        {name: '/resources/art/static/area/str_stronghold/hooks/str_hook_starship_01.gr2', offset: [0, 0, 0],}
    ],
    2361: [
        {name: '/resources/art/static/area/str_stronghold/hooks/str_hook_floor_large_01.gr2', offset: [0.4000000059604645, 0, -0.4000000059604645]}, 
        {name: '/resources/art/static/area/str_stronghold/hooks/str_hook_floor_large_01.gr2', offset: [-0.4000000059604645, 0, 0.4000000059604645]}, 
        {name: '/resources/art/static/area/str_stronghold/hooks/str_hook_floor_large_01.gr2', offset: [-0.4000000059604645, 0, -0.4000000059604645]}, 
        {name: '/resources/art/static/area/str_stronghold/hooks/str_hook_floor_large_01.gr2', offset: [0.4000000059604645, 0, 0.4000000059604645]}
    ]
};
const hooksGr2 = [];
Object.keys(hooks).forEach((layoutListId)=>{
    hooks[layoutListId].forEach((entry)=>{
        if (!hooksGr2.includes(entry.name)) hooksGr2.push(entry.name);
    });
});
const hooksGr2ByName = {};
for (let i = 0; i < hooksGr2.length; i++) {
    hooksGr2ByName[hooksGr2[i]] = {}
}

class Room {
    constructor(roomName) {
        var room = Object.create(null);
            room.instances = Object.create(null);
            var pos = 0x34 + dv.getUint32(0x30, !0);
            var numInstances = dv.getUint32(pos, !0);
            pos += 4;
            for (let i = 0; i < numInstances; i++) {
                const instance = Object.create(null);
                pos += 5;
                const idLo = dv.getUint32(pos, !0);
                pos += 4;
                const idHi = dv.getUint32(pos, !0);
                pos += 4;
                const assetIdLo = dv.getUint32(pos, !0);
                pos += 4;
                const assetIdHi = dv.getUint32(pos, !0);
                pos += 4;
                instance.asset = assets[assetIdLo + '|' + assetIdHi];
                pos++;
                const numProperties = dv.getUint32(pos, !0);
                pos += 4;
                const propsLength = dv.getUint32(pos, !0);
                pos += 4;
                const propEnd = pos + propsLength;
                pos++;
                instance.parent = undefined;
                instance.posX = instance.posY = instance.posZ = 0;
                instance.rotX = instance.rotY = instance.rotZ = 0;
                instance.scaleX = instance.scaleY = instance.scaleZ = 1;
                instance.width = 64;
                instance.depth = 64;
                while (pos < propEnd) {
                    const type = dv.getUint8(pos++);
                    const name = dv.getUint32(pos, !0);
                    pos += 4;
                    if (name === 0x40865e7f && type === 5) {
                        const parentIdLo = dv.getUint32(pos, !0);
                        pos += 4;
                        const parentIdHi = dv.getUint32(pos, !0);
                        pos += 4;
                        if (parentIdLo !== 0 || parentIdHi !== 0) {
                            instance.parent = parentIdLo + '|' + parentIdHi
                        }
                    } else if (name === 0x4f77e269 && type === 6) {
                        instance.posX = dv.getFloat32(pos, !0);
                        pos += 4;
                        instance.posY = dv.getFloat32(pos, !0);
                        pos += 4;
                        instance.posZ = dv.getFloat32(pos, !0);
                        pos += 4
                    } else if (name === 0x8c64af1e && type === 6) {
                        instance.rotX = dv.getFloat32(pos, !0);
                        pos += 4;
                        instance.rotY = dv.getFloat32(pos, !0);
                        pos += 4;
                        instance.rotZ = dv.getFloat32(pos, !0);
                        pos += 4
                    } else if (name === 0xb181622a && type === 6) {
                        instance.scaleX = dv.getFloat32(pos, !0);
                        pos += 4;
                        instance.scaleY = dv.getFloat32(pos, !0);
                        pos += 4;
                        instance.scaleZ = dv.getFloat32(pos, !0);
                        pos += 4
                    } else if (name === 0xd9ddf326 && type === 4) {
                        instance.width = dv.getFloat32(pos, !0);
                        pos += 4
                    } else if (name === 0x1b205d23 && type === 4) {
                        instance.depth = dv.getFloat32(pos, !0);
                        pos += 4
                    } else if (name === 0xa3ab26ae && type === 9) {
                        const length = dv.getUint32(pos, !0);
                        pos += 4;
                        if (length > 0) {
                            const magic = dv.getUint16(pos, !0);
                            let dv2;
                            if (magic === 0x8B1F) {
                                const dvcompr = new Uint8Array(dv.buffer,pos + 10,length - 18);
                                const buffer = new ArrayBuffer(dv.getUint32(pos + length - 4, !0));
                                RawDeflate.inflate(dvcompr, buffer);
                                dv2 = new DataView(buffer)
                            } else if (magic === 0x9C78) {
                                const dvcompr = new Uint8Array(dv.buffer,pos + 2,length - 6);
                                const buffer = new ArrayBuffer(0xFFFFF);
                                RawDeflate.inflate(dvcompr, buffer);
                                dv2 = new DataView(buffer)
                            } else {
                                console.log('Unknown VertexData compression: 0x' + magic.toString(16))
                            }
                            readHeightmap(dv2, instance)
                        }
                        pos += length
                    } else if (name === 0xd576d2cf && type === 1) {
                        instance.hook = dv.getUint32(pos, !0);
                        pos += 4
                    } else {
                        switch (type) {
                        case 0:
                            pos++;
                            break;
                        case 1:
                        case 3:
                        case 4:
                            pos += 4;
                            break;
                        case 5:
                            pos += 8;
                            break;
                        case 6:
                            pos += 12;
                            break;
                        case 7:
                            pos += 16;
                            break;
                        case 8:
                        case 9:
                            pos += 4 + dv.getUint32(pos, !0)
                        }
                    }
                }
                pos = propEnd;
                if (instance.hook) {
                    instance.scaleX = 1;
                    instance.scaleY = 1;
                    instance.scaleZ = 1
                }
                const scale = mat4.fromValues(instance.scaleX, 0, 0, 0, 0, instance.scaleY, 0, 0, 0, 0, instance.scaleZ, 0, 0, 0, 0, 1);
                const rotX = mat4.create();
                mat4.fromXRotation(rotX, instance.rotX * Math.PI / 180);
                const rotY = mat4.create();
                mat4.fromYRotation(rotY, instance.rotY * Math.PI / 180);
                const rotZ = mat4.create();
                mat4.fromZRotation(rotZ, instance.rotZ * Math.PI / 180);
                const transl = mat4.create();
                mat4.fromTranslation(transl, vec3.fromValues(instance.posX, instance.posY, instance.posZ));
                const modelViewMatrix = mat4.create();
                mat4.multiply(modelViewMatrix, scale, modelViewMatrix);
                mat4.multiply(modelViewMatrix, rotZ, modelViewMatrix);
                mat4.multiply(modelViewMatrix, rotX, modelViewMatrix);
                mat4.multiply(modelViewMatrix, rotY, modelViewMatrix);
                mat4.multiply(modelViewMatrix, transl, modelViewMatrix);
                instance.mvMatrix = modelViewMatrix;
                instance.mvMatrixFixed = !1;
                room.instances[idLo + '|' + idHi] = instance
            }
            room.visible = [];
            const numVisible = dv.getUint32(pos, !0);
            pos += 4;
            for (let i = 0; i < numVisible; i++) {
                const visibleLength = dv.getUint32(pos, !0);
                pos += 4;
                const visible = readWString(dv, pos, visibleLength).toLowerCase();
                pos += visibleLength;
                const visibleIndex = roomsNameToIndex[visible];
                if (visibleIndex !== undefined)
                    room.visible.push(visibleIndex)
            }
            for (const inst in room.instances) {
                const r = room.instances[inst];
                let p;
                if (r.parent !== undefined) {
                    p = r;
                    while (p.parent !== undefined && !p.mvMatrixFixed) {
                        p = room.instances[p.parent];
                        if (!p)
                            break;
                        mat4.multiply(r.mvMatrix, p.mvMatrix, r.mvMatrix)
                    }
                }
                r.mvMatrixFixed = !0
            }
            window.rooms[roomsNameToIndex[roomName]] = room;
            loading.roomsLoaded++;
            checkLoaded2()
    }
}

class DAT {
    constructor(buffer, areaId) {
        this.areaId = areaId;
        this.assets = [];
        this.roomsNameToIndex = {};

        const reader = new Reader(buffer.buffer);
        reader.offset = 0x56;
        this.numRooms = reader.readUint32();
        reader.offset = 0x5A;
        let roomIndex = 0;
        for (let i = 0; i < numRooms; i++) {
            const roomNameLength = reader.readUint32();
            pos += 4;
            const name = reader.readString(roomNameLength);
            const nameL = name.toLowerCase();
            const room = getFile('/resources/world/areas/' + this.areaId + '/' + nameL + '.dat');
            if (room) {
                loadFile(room, loadRoom, nameL);
                this.roomsNameToIndex[nameL] = roomIndex++;
                loading.roomsMax++
            }
        }
        this.numAssets = reader.readUint32();
        pos += 4;
        for (let i = 0; i < numAssets; i++) {
            const idLo = reader.readUint32();
            const idHi = reader.readUint32();

            const assetNameLength = reader.readUint32();
            const assetName = reader.readString(assetNameLength);
            
            const asset = {};
            asset.name = assetName;
            this.assets[idLo + '|' + idHi] = asset;
            if (assetName.substring(assetName.length - 4) === '.gr2') {
                const file = getFile('/resources' + assetName.toLowerCase().replace(/\\/g, '/'));
                if (file) {
                    loadFile(file, loadGr2, asset);
                    loading.gr2Max++
                }
            }
        }
        for (let i = 0; i < hooksGr2.length; i++) {
            const file = getFile(hooksGr2[i]);
            if (file) {
                loadFile(file, loadGr2, hooksGr2ByName[hooksGr2[i]]);
                loading.gr2Max++
            }
        }
        document.getElementById('loading').innerHTML = 'Reading rooms...'
    }
}

export {DAT, hooks, hooksGr2, hooksGr2ByName}