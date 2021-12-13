import { toMaskedBase62 } from "../../Util.js";
import { AreaDat } from "./AreaDat.js";
import { AssetInstance } from "./AssetInstance.js";

class RoomDat {
    /**
     * @type  {Map<number, AssetInstance>} instances
     */
    instances;

    /**
     * Represents the RoomDat data model
     * @param  {string} room the roomDat name
     * @param  {number} id the areaId associated with this roomDat
     * @param  {AreaDat} areaDat the areaDat associated with this roomDat
     */
    constructor(room, id, areaDat) {
        this.areaDat = areaDat;
        this.room = room;
        this.id = ((areaDat.areaId << 8) + id);
        this.areaId = areaDat.areaId;

        if (!areaDat) throw new Error("Unexpected Null AreaDat reference");
        const reader = areaDat._assetsRef[`/resources/world/areas/${areaDat.areaId}/${room.toLowerCase()}.dat`].getReadStream();

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
                const inst = new AssetInstance(room);
                const instanceHeader = reader.readUint32();
                if (instanceHeader != 0xABCD1234) {  // 0x3412CDAB
                    throw new Error(`Expected header to be '0xABCD1234' but got '${instanceHeader}'`);
                } else {
                    // string sdifn = "";
                }

                reader.readByte();
                inst.InstanceId = reader.readUint64();
                inst.AssetId = reader.readUint64();
                reader.readByte();
                uint numProperties = reader.readUint32();
                uint propteriesLength = reader.readUint32();

                long startOffset = br.BaseStream.Position;

                if (!room.Area.Assets.ContainsKey(inst.AssetId))
                {
                    br.BaseStream.Position = startOffset + propteriesLength;
                    continue;
                }

                _ = reader.readByte();
                try
                {
                    inst.RawProperties = new Dictionary<uint, object>();
                    for (uint p = 0; p < numProperties; p++)
                    {
                        DatTypeId type = (DatTypeId)reader.readByte();
                        uint propertyId = reader.readUint32();

                        object o = null;
                        switch (type)
                        {
                            case DatTypeId.Boolean:

                                byte b = reader.readByte();
                                if (b > 1)
                                    throw new IndexOutOfRangeException();
                                bool boo = Convert.ToBoolean(b);
                                o = boo;
                                break;
                            case DatTypeId.Unknown1:
                                int ival = reader.readInt32();
                                if (ival > 1)
                                    o = ival;
                                break;
                            //case DatTypeId.Unknown2:
                            //    break;
                            case DatTypeId.UInt32:
                                uint val = reader.readUint32();
                                o = val;
                                break;
                            case DatTypeId.Single:
                                float flo = br.ReadSingle();
                                o = flo;
                                break;
                            case DatTypeId.UInt64:
                                ulong lval = reader.readUint64();
                                o = lval;
                                break;
                            case DatTypeId.Vector3:
                                float x = br.ReadSingle();
                                float y = br.ReadSingle();
                                float z = br.ReadSingle();
                                o = new Vec3(x, y, z);
                                break;
                            case DatTypeId.Unknown7:
                                //byte[] bytes = br.ReadBytes(16);
                                List<float> vec4 = new List<float>
                                {
                                    br.ReadSingle(),
                                    br.ReadSingle(),
                                    br.ReadSingle(),
                                    br.ReadSingle()
                                };
                                o = vec4;
                                break;
                            case DatTypeId.String: //these are different than the other strings in that they are unicode, but have yet to see a unicode-specific char
                                uint strlen = reader.readUint32();
                                //byte[] charbytes = br.ReadBytes((int)strlen - 2);
                                //reader.readByte(); //null byte
                                //reader.readByte(); //null byte
                                //o = System.Text.Encoding.Unicode.GetString(charbytes);

                                StringBuilder str = new StringBuilder((int)strlen);
                                char c1 = br.ReadChar();
                                char c2 = br.ReadChar();
                                uint charsRead = 1;
                                while (c1 != '\0' && c1 != '\0' && charsRead < strlen)
                                {
                                    str.Append(c1);
                                    if (c2 != '\0')
                                        throw new IndexOutOfRangeException();
                                    c1 = br.ReadChar();
                                    c2 = br.ReadChar();
                                    charsRead++;
                                }
                                o = str.ToString();
                                break;
                            case DatTypeId.Data: //skip raw data properties
                                uint datalen = reader.readUint32();
                                br.BaseStream.Position += datalen;
                                break;
                            default:
                                long curpos = br.BaseStream.Position; //this is for debugging new formats found
                                byte[] bities = reader.readBytes(32);
                                br.BaseStream.Position = curpos;
                                throw new IndexOutOfRangeException();
                        }
                        inst.RawProperties.Add(propertyId, o);
                    }
                } catch (e) {
                    br.BaseStream.Position = startOffset + propteriesLength;
                }
                if (!room.Area.AssetInstances.ContainsKey(inst.AssetId)) room.Area.AssetInstances.Add(inst.AssetId, new List<AssetInstance>());
                room.Area.AssetInstances[inst.AssetId].Add(inst);
                room.Instances.Add(inst.InstanceId, inst);
            }
        } else {
            throw new Error(`Expected header to be '24' but got '${header}'`);
        }
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