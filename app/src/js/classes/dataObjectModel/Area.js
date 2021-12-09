import { Node } from "../formats/Node";
import { STB } from "../formats/STB";

class Area {
    /**
     * Represents the Area data model
     * @param  {Node} gomObj Node containing data to use
     * @param  {STB} sysWorldMapTbl the system world map String Table
     * @param  {Object} dom the data object model
     * @param  {Object} assets the tor assets object
     */
    constructor(gomObj, sysWorldMapTbl, dom, assets) {
        if (gomObj != null && sysWorldMapTbl != null) {
            this.sysWorldMapTbl = sysWorldMapTbl;
            this.displayNameId = gomObj.obj["mapAreasDataDisplayNameId"] || 0;
            this.name = this.sysWorldMapTbl.getText(this.displayNameId);
            this.localizedName = this.name;
            this.areaId = gomObj.obj["mapAreasDataAreaId"] || 0;
            this.id = this.areaId;

            this.explorationType = gomObj.obj["mapAreasDataExplorationType"] || null;
            this.zoneName = gomObj.obj["mapAreasDataDefaultZoneName"] || "";

            this.mapPages;
            this.mapNotes;

            const mapDataPath = `world.areas.${this.areaId}.mapdata`;
            const mapDataObj = dom.getObject(mapDataPath);
            if (mapDataObj != null) {
                mapDataObj.readNode();
                this.loadMapdata(this, mapDataObj);

                this.fowGroupStringIds = {};
                const mapDataContainerFowGroupList = mapDataObj.obj["mapDataContainerFowGroupList"] || null;
                if (mapDataContainerFowGroupList != null) {
                    for (const kvp of Object.entries(mapDataContainerFowGroupList)) {
                        const fowId = kvp[0];
                        const stringId = kvp[0]["mapFowGroupGUID"]; //"str.sys.worldmap"
                        this.fowGroupStringIds[fowId] = stringId;
                    }
                }
            }
            const mapNotePath = `/resources/world/areas/${this.areaId}/mapnotes.not`;
            const mapNoteObj = assets.findFile(mapNotePath);
            if (mapNoteObj != null) {
                this.loadMapNotes(area, mapNoteObj);
            }

            //area.Assets = LoadAssets(area.AreaId);
            area.areaDat = dom.areaDatLoader.Load(area.AreaId);

            this.fowGroupStringIds;
            this.fowGroupLocalizedStrings_;
            this.sortedByVolume = false;

            this.areaDat; //new
    

        
        } else {
            console.log("unexpect null values. Expected Non-null gomObj and sysWorldMapTbl.");
        }
    }

    private void LoadMapNotes(Area area, TorLib.File file) {
        string xml = "";
        using (var reader = new StreamReader(file.OpenCopyInMemory())) {
            xml = reader.ReadToEnd();
        }
        xml = xml.Replace("&lt;", "<").Replace("&gt;", ">").Replace("&amp;lt;", "<").Replace("&amp;gt;", ">").Replace("&amp;apos;", "'").Replace("\0", "");
        XDocument notes = XDocument.Parse(xml);
        var elements = notes.Root.Element("e").Element("v").Elements();
        Dictionary<ulong, MapNoteData> mapNotes = new Dictionary<ulong, MapNoteData>();
        var count = elements.Count();
        for (int i = 0; i < count; i += 2)
        {
            var key = elements.ElementAt(i).Value;
            ulong.TryParse(key, out ulong k);
            var value = elements.ElementAt(i + 1);
            var node = value.Element("node");
            if (node != null)
            {
                MapNoteData mpn = new MapNoteData(area.Dom_).Load(node);
                mapNotes.Add(k, mpn);
            }
            else
            {
                continue;
            }
        }
        area.MapNotes = mapNotes;
    }

    private void LoadMapdata(Area area, GomObject obj)
    {
        List<object> mapPages = obj.Data.ValueOrDefault<List<object>>("mapDataContainerMapDataList", null);
        Dictionary<long, MapPage> pageLookup = new Dictionary<long, MapPage>();

        if (mapPages != null)
        {
            area.MapPages = new List<MapPage>();
            foreach (GomObjectData mapPage in mapPages)
            {
                MapPage page = new MapPage
                {
                    Area = area,
                    Guid = mapPage.ValueOrDefault<long>("mapPageGUID", 0)
                };
                page.Id = (int)(page.Guid & 0x7FFFFFFF);
                if (page.Id == 40003)
                {
                    // string sdf = "";
                }
                var minCoord = mapPage.ValueOrDefault<List<float>>("mapPageMinCoord", null);
                if (minCoord != null)
                {
                    page.MinX = minCoord[0];
                    page.MinY = minCoord[1];
                    page.MinZ = minCoord[2];
                }
                var maxCoord = mapPage.ValueOrDefault<List<float>>("mapPageMaxCoord", null);
                if (maxCoord != null)
                {
                    page.MaxX = maxCoord[0];
                    page.MaxY = maxCoord[1];
                    page.MaxZ = maxCoord[2];
                }
                var miniMinCoord = mapPage.ValueOrDefault<List<float>>("mapPageMiniMinCoord", null);
                if (miniMinCoord != null)
                {
                    page.MiniMapMinX = miniMinCoord[0];
                    page.MiniMapMinZ = miniMinCoord[2];
                }
                var miniMaxCoord = mapPage.ValueOrDefault<List<float>>("mapPageMiniMaxCoord", null);
                if (miniMaxCoord != null)
                {
                    page.MiniMapMaxX = miniMaxCoord[0];
                    page.MiniMapMaxZ = miniMaxCoord[2];
                }
                page.CalculateVolume();
                page.ExplorationType = mapPage.ValueOrDefault("mapExplorationType", new ScriptEnum()).ToString();
                page.MountAllowed = mapPage.ValueOrDefault("mapMountAllowed", false);
                page.IsHeroic = mapPage.ValueOrDefault("mapIsHeroic", false);
                page.ParentId = mapPage.ValueOrDefault<long>("mapParentNameSId", 0);
                page.SId = mapPage.ValueOrDefault<long>("mapNameSId", 0);
                page.MapName = mapPage.ValueOrDefault<string>("mapName", null);

                string mapImagePath = string.Format("/resources/world/areas/{0}/{1}_r.dds", area.AreaId, page.MapName);
                page.HasImage = _dom._assets.HasFile(mapImagePath);

                if (page.HasImage)
                {
                    if (page.Area.RequiredFiles == null)
                        page.Area.RequiredFiles = new HashSet<string>();
                    page.Area.RequiredFiles.Add(mapImagePath);
                }

                _dom._assets.icons.AddMap(area.AreaId, page.MapName);

                page.Name = strTable.GetText(page.Guid, "MapPage." + page.MapName);
                //if (String.IsNullOrWhiteSpace(page.Name))
                //{
                //    string sdfin = "";
                //    if (mapPage.Dictionary.ContainsKey("locTextRetrieverMap"))
                //    {
                //        var descLookupData = (GomObjectData)(mapPage.Get<Dictionary<object, object>>("locTextRetrieverMap")[-2761358831308646330]);
                //        var stringId = descLookupData.Get<long>("strLocalizedTextRetrieverStringID");
                //        var bucket = descLookupData.Get<string>("strLocalizedTextRetrieverBucket");
                //        var checkname = strTable.GetText(stringId, bucket);
                //        string sdf = "";
                //    }
                //}
                page.LocalizedName = strTable.GetLocalizedText(page.Guid, "MapPage." + page.MapName);

                page.ExplorationId = long.Parse(mapPage.ValueOrDefault<object>("mapExplorationId", 0).ToString());
                page.MapFowRadius = mapPage.ValueOrDefault("mapFowRadius", 0f);

                pageLookup[page.SId] = page;
                area.MapPages.Add(page);
            }

            foreach (var p in area.MapPages)
            {
                if (p.ParentId == 0) continue; // MapPage has no parent (this is a world map)

                if (pageLookup.TryGetValue(p.ParentId, out MapPage parent))
                {
                    p.Parent = parent;
                }
                else
                {
                    throw new InvalidOperationException("Unable to find parent map page");
                }
            }
        }
    }

    public void LoadReferences(GameObject obj, GomObject gom)
    {
        if (obj is null)
        {
            throw new ArgumentNullException(nameof(obj));
        }

        if (gom is null)
        {
            throw new ArgumentNullException(nameof(gom));
        }
        // No references to load
    }

    get fowGroupLocalizedStrings() {
        if (this.fowGroupLocalizedStrings_ == null) {
            this.fowGroupLocalizedStrings_ = {};
            if (this.fowGroupStringIds == null) return this.fowGroupLocalizedStrings_;

            for (const kvp in Object.entries(this.fowGroupStringIds)) {
                this.fowGroupLocalizedStrings_[kvp.Key] = this.sysWorldMapTbl.strings.find((v) => v === kvp[1]);
            }
        }
        return this.fowGroupLocalizedStrings_;
    }

    sortMaps() {
        if (this.mapPages == null) return;
        this.mapPages.sort((x, y) => x.volume < y.volume); // Sort MapPages by Volume (smallest to largest)
        sortedByVolume = true;
    }

    findSmallestMapContaining(x, y, z) {
        if (!this.sortedByVolume) this.sortMaps();
        return this.mapPages.find(m => m.containsPoint(x, y, z)); // Find first Map that contains the point -- since maps are sorted from smallest to largest, the first found will be the one we want
    }

    findSmallestMapContainingInMinimap(x, y, z) {
        if (!this.sortedByVolume) this.sortMaps();
        return this.mapPages.Find(m => m.miniMapContainsPoint(x, y, z));
    }
}


export {Area}