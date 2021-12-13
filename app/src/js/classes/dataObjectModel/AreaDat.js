import { ArchiveEntry } from "../formats/Archive.js";
import { RoomDat } from "./Room.js";

class AreaDat {
    #rooms_;

    _assetsRef;
    /**
     * Represents the AreaDat data model
     * @param  {number} id the areaId associated with this areaDat
     * @param  {Object.<string, ArchiveEntry>} assets the tor assets object
     */
    constructor(id, assets) {
        this._assetsRef = assets;
        this.areaId = id;
        this.id = id;

        // load the data
        const reader = assets[`/resources/world/areas/${this.areaId}/area.dat`].getReadStream();
        const header = reader.readInt32();
        if (header == 24) {
            const format = reader.readString();
            if (format != "AREA_DAT_BINARY_FORMAT_") throw new Error(`Unexpected format. Expected 'AREA_DAT_BINARY_FORMAT_' but recieved '${format}'`); //not an area dat file

            reader.offset = 0x1C; //Skip to area header

            const roomOffset = reader.readUint32();
            const assetsOffset = reader.readUint32();
            reader.readUint32()
            reader.readUint32()
            reader.readUint32()
            reader.readUint32()
            reader.readUint32()
            reader.readUint32()

            const guidOffset = reader.readUint32();
            reader.readBytes(0x16); //Always (01 00) repeating

            reader.offset = guidOffset;
            this.areaGuid = reader.readUInt64();

            //Rooms
            reader.offset = roomOffset;
            const numRooms = reader.readUint32();
            this.roomNames = [];
            for (let i = 0; i < numRooms; i++) {
                const nameLength = reader.readUint32();
                const room = reader.readString(nameLength);
                this.roomNames.push(room);
            }

            //Assets
            reader.offset = assetsOffset;
            const numAssets = reader.readUint32();
            this.assets = new Map();
            this.assetInstances = new Map();
            for (let i = 0; i < numAssets; i++) {
                const assetId = reader.readUInt64();
                const nameLength = reader.readUint32();
                const assetName = reader.readString(nameLength);
                if (assetName.includes(":enc.")) {
                    // string sofdijhn = "";
                }
                if (assetName.includes(":enc.") || assetName.includes("\\enc\\") || assetName.includes("spn") || assetName.includes("mpn")) {
                    if (!assetName.startsWith("\\engine\\")) this.assets.set(assetId, assetName);
                }
            }

            ////Paths
            //
            ////Schemes
            //br.BaseStream.Position = schemesOffset;
            //uint numSchemes = reader.readUint32();
            //for (uint i = 0; i < numSchemes; i++)
            //{
            //    uint nameLength = reader.readUint32();
            //    string schemeName = ReadString(br, nameLength);
            //    uint schemeLength = reader.readUint32();
            //    string scheme = ReadString(br, schemeLength);
            //    if (scheme.Contains("/"))
            //    {
            //        int idx = 0;
            //        while ((idx = scheme.IndexOf('/', idx)) != -1)
            //        {
            //            int end = scheme.IndexOf('|', idx);
            //            int len = end - idx;
            //            string final = scheme.Substring(idx, len).ToLower();
            //            fileNames.Add(String.Format("/resources{0}.tex", final));
            //            fileNames.Add(String.Format("/resources{0}.dds", final));
            //            fileNames.Add(String.Format("/resources{0}.tiny.dds", final));
            //            idx = end;
            //        }
            //    }
            //}

            ////TERRAINTEXTURES
            //br.BaseStream.Position = terTexOffset;
            //uint numTerTex = reader.readUint32();
            //for (uint i = 0; i < numTerTex; i++)
            //{
            //    ulong texId = br.ReadUInt64();
            //    uint nameLength = reader.readUint32();
            //    string terTexName = ReadString(br, nameLength);

            //    fileNames.Add(String.Format("/resources/art/shaders/materials/{0}.mat", terTexName.ToLower()));
            //    fileNames.Add(String.Format("/resources/art/shaders/environmentmaterials/{0}.emt", terTexName.ToLower()));
            //}

            ////TERRAINTEXTURES
            //br.BaseStream.Position = DydTexOffset;
            //uint numDydTex = reader.readUint32();
            //for (uint i = 0; i < numDydTex; i++)
            //{
            //    uint texId = reader.readUint32();
            //    uint nameLength = reader.readUint32();
            //    string terTexName = ReadString(br, nameLength);

            //    fileNames.Add(String.Format("/resources/art/shaders/materials/{0}.mat", terTexName.ToLower()));
            //    fileNames.Add(String.Format("/resources/art/shaders/environmentmaterials/{0}.emt", terTexName.ToLower()));
            //}

            ////DYDCHANNELPARAMS

            ////SETTINGS

        } else {
            throw new Error(`Expected header to be '24' but got '${header}'`);
        }
    }

    get assetDefs() { return (this.assets == null) ? new Map(): Object.fromEntries(this.assets); }

    get rooms() {
        if (this.#rooms_ == null) this.loadRooms();
        return this.#rooms_;
    }
    get b62RoomIds() {
        if (this.#rooms_ == null) this.loadRooms();
        let ret = Object.fromEntries(this.#rooms_);
        Object.keys(ret).map(key => {
            ret[key] = ret[key].base62Id;
        });
        return ret;
    }

    loadRooms() {
        if (this.#rooms_ == null) {
            this.#rooms_ = new Map();
            let i = 0;
            for (const room of this.roomNames) {
                i++;
                this.#rooms_.set(room, new RoomDat(room, i, this));
            }
        }
    }
}

export {AreaDat};