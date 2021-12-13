import { toMaskedBase62 } from "../../Util.js";
import { AreaDat } from "./AreaDat.js";
import { AssetInstance } from "./AssetInstance.js";

const DatTypeId = {
    'Boolean': 0x00,
    'Unknown1': 0x01,
    'Unknown2': 0x02,
    'UInt32': 0x03, // may be Int32
    'Single': 0x04,
    'UInt64': 0x05,
    'Vector3': 0x06,
    'Unknown7': 0x07,
    'String': 0x08,
    'Data': 0x09
}

class RoomDat {
    /**
     * @type  {Map<number, AssetInstance>} instances
     */
    instances;

    /**
     * Represents the RoomDat data model
     * @param  {string} roomName the roomDat name
     * @param  {number} id the areaId associated with this roomDat
     * @param  {AreaDat} areaDat the areaDat associated with this roomDat
     */
    constructor(roomName, id, areaDat) {
        this.areaDat = areaDat;
        this.name = roomName;
        this.id = ((areaDat.areaId << 8) + id);
        this.areaId = areaDat.areaId;

        if (!areaDat) throw new Error("Unexpected Null AreaDat reference");
        const reader = areaDat._assetsRef[`/resources/world/areas/${areaDat.areaId}/${roomName.toLowerCase()}.dat`].getReadStream();

        const header = reader.readInt32();
        if (header == 24) {
            const format = reader.readString();
            if (format != "ROOM_DAT_BINARY_FORMAT_") throw new Error(`Unexpected format. Expected 'ROOM_DAT_BINARY_FORMAT_' but recieved '${format}'`); //not a room dat file

            reader.offset = 0x1C; //Skip room header

            const instanceOffset = reader.readUint32();
            reader.readUint32();
            reader.readUint32();
            reader.readUint64(); //Always 281479271743491 : (03 00 01 00 01 00 01 00)
            const fileNameLength = reader.readUint32();
            reader.readString(fileNameLength);

            //Instances
            reader.offset = instanceOffset;
            const numInstances = reader.readUint32();
            this.instances = new Map();
            for (let i = 0; i < numInstances; i++) {
                const inst = new AssetInstance(this);
                const instanceHeader = reader.readUint32();
                if (instanceHeader != 0xABCD1234) {  // 0x3412CDAB
                    throw new Error(`Expected header to be '0xABCD1234' but got '${instanceHeader}'`);
                } else {
                    // string sdifn = "";
                }

                reader.readByte();
                inst.instanceId = reader.readUint64();
                inst.assetId = reader.readUint64();
                reader.readByte();
                const numProperties = reader.readUint32();
                const propteriesLength = reader.readUint32();

                const startOffset = reader.offset;

                if (!this.areaDat.assets.has(inst.assetId)) {
                    reader.offset = startOffset + propteriesLength;
                    continue;
                }

                reader.readByte();
                try {
                    inst.rawProperties = new Map();
                    for (let p = 0; p < numProperties; p++) {
                        const type = reader.readByte();
                        const propertyId = reader.readUint32();

                        let o = null;
                        switch (type) {
                            case DatTypeId.Boolean:
                                const b = reader.readByte();
                                if (b > 1) throw new IndexOutOfRangeException();
                                const boo = new Boolean(b);
                                o = boo;
                                break;
                            case DatTypeId.Unknown1:
                                const ival = reader.readInt32();
                                if (ival > 1) o = ival;
                                break;
                            //case DatTypeId.Unknown2:
                            //    break;
                            case DatTypeId.UInt32:
                                const val = reader.readUint32();
                                o = val;
                                break;
                            case DatTypeId.Single:
                                const flo = reader.readFloat32();
                                o = flo;
                                break;
                            case DatTypeId.UInt64:
                                const lval = reader.readUint64();
                                o = lval;
                                break;
                            case DatTypeId.Vector3:
                                const x = reader.readFloat32();
                                const y = reader.readFloat32();
                                const z = reader.readFloat32();
                                o = new Vec3(x, y, z);
                                break;
                            case DatTypeId.Unknown7:
                                const vec4 = [
                                    reader.readFloat32(),
                                    reader.readFloat32(),
                                    reader.readFloat32(),
                                    reader.readFloat32()
                                ];
                                o = vec4;
                                break;
                            case DatTypeId.String: //these are different than the other strings in that they are unicode, but have yet to see a unicode-specific char
                                const strlen = reader.readUint32();
                                //byte[] charbytes = br.ReadBytes((int)strlen - 2);
                                //reader.readByte(); //null byte
                                //reader.readByte(); //null byte
                                //o = System.Text.Encoding.Unicode.GetString(charbytes);

                                let str = '';
                                let c1 = reader.readChar();
                                let c2 = reader.readChar();
                                let charsRead = 1;
                                while (c1 != '\0' && c1 != '\0' && charsRead < strlen) {
                                    str.concat(c1);
                                    if (c2 != '\0') throw new Error(`Index out of range exception`);
                                    c1 = reader.readChar();
                                    c2 = reader.readChar();
                                    charsRead++;
                                }
                                o = str;
                                break;
                            case DatTypeId.Data: //skip raw data properties
                                const datalen = reader.readUint32();
                                reader.offset += datalen;
                                break;
                            default:
                                const curpos = reader.offset; //this is for debugging new formats found
                                const bities = reader.readBytes(32);
                                reader.offset = curpos;
                                throw new Error(`Index out of range exception`);
                        }
                        inst.rawProperties.set(propertyId, o);
                    }
                } catch (e) {
                    reader.offset = startOffset + propteriesLength;
                }
                if (!this.areaDat.assetInstances.has(inst.assetId)) this.areaDat.assetInstances.set(inst.assetId, []);
                this.areaDat.assetInstances[inst.assetId].push(inst);
                this.instances.set(inst.instanceId, inst);
            }
        } else {
            throw new Error(`Expected header to be '24' but got '${header}'`);
        }
    }

    get dom() {
        return this.areaDat.dom;
    }

    get areaB62Id() {
        throw new Error("this is incomplete");
        return toMaskedBase62(this.areaId);
    }

    get assetInstances() {
        return (Instances == null) ? new Map() : Object.fromEntries(this.instances);
    }
}

export {RoomDat};