import Vec3 from "../util/Vec3.js";
import { RoomDat } from "./RoomDat.js";

class AssetInstance {
    #position;
    #assetFqn;
    #parentInstance

    /**
     * @type  {Map<number, object>}
     */
    rawProperties;

    /**
     * An object representing the assetInstance data object model
     * @param {RoomDat} roomDat the roomDat associated with this assetInstance
     */
    constructor(roomDat) {
        this.roomDat = roomDat
        this.roomName = this.roomDat.name;

        this.#position = new Vec3(0,0,0);
        this.#assetFqn = null;
        this.#parentInstance = null;

        this.rawProperties = new Map();
        this.instanceId = null;
        this.assetId = null;
        this.gomId = null;
        this.gomType = null;
        this.encounterComponent = null;
        this.spawnType = null;
        this.areaDat = null;
    }

    get assetFqn() {
        if (this.#assetFqn == null) {
            const parsedAssetString = this.roomDat.areaDat.assets[this.assetId];
            if (parsedAssetString.startsWith("\\")) parsedAssetString = parsedAssetString.substring(1);
            if (parsedAssetString.includes(':')) {
                const splits = parsedAssetString.Split(':');
                this.encounterComponent = splits[0];
                parsedAssetString = splits[1];
            }
            const assType = parsedAssetString.substring(0, 3);
            switch (assType) {
                case "ser":
                    parsedAssetString = parsedAssetString.substring(7, parsedAssetString.length - 11);
                    break;
                case "spn":
                case "enc":
                    if (parsedAssetString.includes(".spn_")) {
                        this.spawnType = parsedAssetString.substring(parsedAssetString.indexOf(".spn_") + 5);
                    }
                    parsedAssetString = parsedAssetString.replaceAll(".spn_" + this.spawnType, "");
                    if (parsedAssetString.endsWith(".enc")) parsedAssetString = parsedAssetString.substring(0, parsedAssetString.length - 4);
                    break;
                default:
                    break;
            }
            parsedAssetString = parsedAssetString.replaceAll('\\', '.');
            const obj = this.roomDat.dom.getObject(parsedAssetString);
            if (obj == null) {
                this.failed = true;
                if (this.spawnType != null) {
                    // string poisn = "s";
                }
            } else {
                this.#assetFqn = parsedAssetString;
                this.gomId = obj.Id;
                this.gomType = parsedAssetString.substring(0, 3);
            }
        }

        return this.#assetFqn;
    }

    get gomB62Id() {
        throw new Error('DB implimination missing. part of TODO');
        return this.gomId.toMaskedBase62();
    }
    
    get parentInstance() {
        if (this.rawProperties != null) {
            if (this.rawProperties.has(1082547839)) this.#parentInstance = this.rawProperties[1082547839];
        }
        return this.#parentInstance;
    }

    get position() {
        if (this.rawProperties != null) {
            if (this.rawProperties.has(1333256809)) this.position = this.rawProperties[1333256809];
        }
        return this.#position;
    }
}

export {AssetInstance};