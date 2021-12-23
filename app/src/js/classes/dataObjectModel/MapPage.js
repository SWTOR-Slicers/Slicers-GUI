

class MapPage {
    #mapNameB62Id;
    #miniMapColumCount = -1;
    #miniMapRowcount = -1;

    constructor() {
        this.mapName = null;
        this.name = null;
        this.localizedName = null;
        this.parent = null;
        this.parentId = null;
        this.minX = null;
        this.minY = null;
        this.minZ = null;
        this.maxX = null;
        this.maxY = null;
        this.maxZ = null;
        this.isHeroic = null;
        this.mountAllowed = null;
        this.tag = null;
        this.hasImage = null;
        this.volume = null;
        this.miniMapVolume = null;
        this.miniMapMinX = null;
        this.miniMapMinZ = null;
        this.miniMapMaxX = null;
        this.miniMapMaxZ = null;

        this.explorationId = null;
        this.mapFowRadius = null;

        this.explorationType = null;
        
        this.id = null;
        this.area = null;
        this.guid = null;
        this.sId = null;
    }

    get mapNameB62Id() {
        throw new Error('DB implimentation is missing. its on the TODO');
        if (this.#mapNameB62Id == null) this.#mapNameB62Id = this.sId.toMaskedBase62();
        return this.#mapNameB62Id;
    }
    get imagePath() {
        return `/resources/world/areas/${area.areaId}/${this.mapName}_r.dds`;
    }

    get miniMapColumnCount() {
        if (this.#miniMapColumCount != -1) {
            return this.#miniMapColumCount;
        } else {
            this.findMiniMapPartCounts();
            return this.#miniMapColumCount;
        }
    }

    get miniMapRowCount() {
        if (this.#miniMapRowcount != -1) {
            return this.#miniMapRowcount;
        } else {
            this.findMiniMapPartCounts();
            return this.#miniMapRowcount;
        }
    }

    findMiniMapPartCounts() {
        //Find how many map tiles we have for the minimap.
        let columns = 0;
        let rows = 0;

        //Find the row tile count.
        let foundAllRows = false;
        while (!foundAllRows) {
            const miniMapPartPath = `/resources/world/areas/${area.areaId}/minimaps/${this.mapName}_${Math.round(rows)}_${"00"}_r.dds`;

            if (area.dom.assets[miniMapPartPath]) {
                //Found map tile. Increment counter.
                rows++;
            } else {
                //Can't find map tile.
                foundAllRows = true;
            }
        }

        //Find the column tile count.
        let foundAllColumns = false;
        while (!foundAllColumns) {
            const miniMapPartPath = `/resources/world/areas/${area.areaId}/minimaps/${this.mapName}_${"00"}_${Math.round(columns)}_r.dds`

            if (area.dom.assets[miniMapPartPath]) {
                //Found map tile. Increment counter.
                columns++;
            } else {
                //Can't find map tile.
                foundAllColumns = true;
            }
        }

        this.#miniMapColumCount = columns;
        this.#miniMapRowcount = rows;
    }

    calculateVolume() {
        const dx = this.maxX - this.minX;
        const dy = this.maxY - this.minY;
        const dz = this.maxZ - this.minZ;
        this.volume = dx * dy * dz;

        const mdx = this.miniMapMaxX - this.miniMapMinX;
        const mdz = this.miniMapMaxZ - this.miniMapMinZ;
        this.miniMapVolume = mdx * dy * mdz;
    }

    containsPoint(x, y, z) {
        return this.hasImage &&         // We don't want to link MapMarkers to maps with no image
                (x >= this.minX) &&
                (y >= this.minY) &&
                (z >= this.minZ) &&
                (x <= this.maxX) &&
                (y <= this.maxY) &&
                (z <= this.maxZ);
    }

    miniMapContainsPoint(x, y, z) {
        return this.hasImage &&         // We don't want to link MapMarkers to maps with no image
                (x >= this.miniMapMinX) && (x >= this.minX) &&
                (y >= this.minY) &&
                (z >= this.miniMapMinZ) && (z >= this.minZ) &&
                (x <= this.miniMapMaxX) && (x <= this.maxX) &&
                (y <= this.maxY) &&
                (z <= this.miniMapMaxZ) && (z <= this.maxZ);
    }
}

export {MapPage};