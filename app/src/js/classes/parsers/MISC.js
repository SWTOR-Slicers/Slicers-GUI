const fs = require('fs');

class MISCParser {
    #dest;
    /**
     * MISC parser class
     * @param  {string} dest destination for ouputted hashes
     * @param  {string} ext extentions to search
     */
    constructor(dest, ext) {
        this.found = 0;
        this.searched = 0;
        this.#dest = dest;
        this.extension = ext;
        this.fileNames = [];
        this.worldFileNames = [];
        this.animNames = [];
        this.mapNames = {};
        this.errors = [];
    }

    public void ParseMISC_LdnScn(GomObject ldnScreenNode)
    {
        Dictionary<object, object> ldgLookup = ldnScreenNode.Data.Get<Dictionary<object, object>>("ldgAreaNameToLoadScreen");
        foreach (KeyValuePair<object, object> kvpLdgClass in ldgLookup)
        {
            searched++;
            GomObjectData areaLdgInfo = (GomObjectData)kvpLdgClass.Value;
            string loadingScreen = areaLdgInfo.ValueOrDefault("ldgScreenName", string.Empty);
            if (loadingScreen.Length > 0)
            {
                fileNames.Add("/resources/gfx/loadingscreen/" + loadingScreen + ".dds");
            }

            string loadingOverlay = areaLdgInfo.ValueOrDefault("ldgOverlayName", string.Empty);
            if (loadingOverlay.Length > 0)
            {
                fileNames.Add("/resources/gfx/gfx_productions/" + loadingOverlay + ".gfx");
            }
        }
    }

    public void ParseMISC_IPP(List<GomObject> ippNodes)
    {
        foreach (GomObject obj in ippNodes)
        {
            searched++;
            string full = obj.Name.ToLower().ToString();
            string partial = obj.Name.ToLower().ToString().Replace("ipp.", "");

            fileNames.Add("/resources/gfx/icons/" + full + ".dds");
            fileNames.Add("/resources/gfx/icons/" + partial + ".dds");

            fileNames.Add("/resources/gfx/mtxstore/" + full + "_120x120.dds");
            fileNames.Add("/resources/gfx/mtxstore/" + full + "_260x260.dds");
            fileNames.Add("/resources/gfx/mtxstore/" + full + "_260x400.dds");
            fileNames.Add("/resources/gfx/mtxstore/" + full + "_328x160.dds");
            fileNames.Add("/resources/gfx/mtxstore/" + full + "_400x400.dds");

            fileNames.Add("/resources/gfx/mtxstore/" + partial + "_120x120.dds");
            fileNames.Add("/resources/gfx/mtxstore/" + partial + "_260x260.dds");
            fileNames.Add("/resources/gfx/mtxstore/" + partial + "_260x400.dds");
            fileNames.Add("/resources/gfx/mtxstore/" + partial + "_328x160.dds");
            fileNames.Add("/resources/gfx/mtxstore/" + partial + "_400x400.dds");
            obj.Unload();
        }
    }

    public void ParseMISC_CDX(List<GomObject> cdxNodes)
    {
        foreach (GomObject obj in cdxNodes)
        {
            searched++;
            string full = obj.Name.ToLower().ToString();
            fileNames.Add("/resources/gfx/codex/" + full + ".dds");
            obj.Unload();
        }
    }

    public void ParseMISC_ITEM(Dictionary<object, object> itemApperances)
    {
        foreach (KeyValuePair<object, object> kvp in itemApperances)
        {
            searched++;
            var itemAppearance = (GomObjectData)kvp.Value;
            string itmModel = itemAppearance.ValueOrDefault<string>("itmModel", null);
            if (itmModel != null)
                fileNames.Add(("/resources/" + (itmModel.Replace("\\", "/"))).Replace("//", "/"));
            string itmFxSpec = itemAppearance.ValueOrDefault<string>("itmFxSpec", null);
            if (itmFxSpec != null)
                fileNames.Add(("/resources/art/fx/fxspec/" + itmFxSpec + ".fxspec").Replace("//", "/").Replace(".fxspec.fxspec", ".fxspec"));
        }
    }

    public void ParseMISC_WORLD(List<GomObject> worldAreas, Dictionary<object, object> worldAreasProto, DataObjectModel currentDom)
    {
        foreach (GomObject obj in worldAreas)
        {
            searched++;
            ulong areaId = obj.Data.ValueOrDefault<ulong>("mapDataContainerAreaID", 0);
            if (areaId > 0)
            {
                worldFileNames.Add(string.Format("/resources/world/areas/{0}/area.dat", areaId.ToString()));
                worldFileNames.Add(string.Format("/resources/world/areas/{0}/mapnotes.not", areaId.ToString()));

                List<object> mapPages = obj.Data.ValueOrDefault<List<object>>("mapDataContainerMapDataList", null);

                if (mapPages != null)
                {
                    foreach (GomObjectData mapPage in mapPages)
                    {
                        string mapName = mapPage.ValueOrDefault<string>("mapName", null);
                        if (!mapNames.ContainsKey(areaId.ToString()))
                            mapNames.Add(areaId.ToString(), new HashSet<string>());
                        mapNames[areaId.ToString()].Add(mapName.ToString());
                    }
                    mapPages.Clear();
                }
            }
            obj.Unload();
        }
        worldAreas.Clear();

        foreach (var gomItm in worldAreasProto)
        {
            GomLib.Models.Area area = new GomLib.Models.Area();
            currentDom.areaLoader.Load(area, (GomObjectData)gomItm.Value);
            if (area.Id == 0)
            {
                if (area.AreaId == 0)
                {
                    continue;
                }
            }
            searched++;
            if (area.MapPages != null)
            {
                int ii = 0;
                foreach (var map_page in area.MapPages)
                {
                    ii++;
                    if (map_page.HasImage == true)
                    {
                        if (!mapNames.ContainsKey(area.AreaId.ToString()))
                            mapNames.Add(area.AreaId.ToString(), new HashSet<string>());
                        mapNames[area.AreaId.ToString()].Add(map_page.MapName);
                    }
                }
                area.MapPages.Clear();
            }
            if (area.Assets != null)
                area.Assets.Clear();
        }
        worldAreasProto.Clear();
    }

    public void ParseMISC_TUTORIAL(DataObjectModel currentDom)
    {
        var tutorialTable = currentDom.stringTable.Find("str.gui.tutorials");
        if (tutorialTable != null && tutorialTable.data != null)
        {
            foreach (KeyValuePair<long, StringTableEntry> item in tutorialTable.data)
            {
                if (item.Value.LocalizedText.ContainsKey("enMale"))
                {
                    string text = item.Value.LocalizedText["enMale"];
                    if (text.Contains(".dds"))
                    {
                        int start = 0;
                        while ((start = text.IndexOf("img://", start)) != -1)
                        {
                            int end = text.IndexOf(".dds", start);
                            if (end != -1)
                            {
                                string temp = text.Substring(start, ((end - start) + 4)).ToLower();
                                temp = temp.Replace("img://", "/resources/").Replace("//", "/").Replace("<<grammar::locpath>>", "en-us");
                                fileNames.Add(temp);
                                start++;
                            }
                        }

                    }
                    else if (text.Contains("img://"))
                    {
                        int start = 0;
                        while ((start = text.IndexOf("img://", start)) != -1)
                        {
                            int end = text.IndexOf("'", start);
                            if (end != -1)
                            {
                                string temp = text.Substring(start, ((end - start) + 1)).ToLower();
                                temp = temp.Replace("img://", "/resources/").Replace("//", "/").Replace("<<grammar::locpath>>", "en-us");
                                fileNames.Add(temp + ".dds");
                                start++;
                            }
                        }
                    }
                }
            }
        }
    }

    parseMISC_NODE(nodeDict) {
        for (const obj of nodeDict) {
            searched++;
            const node = (GomObject)obj.Value;
            fileNames.Add("/resources/systemgenerated/prototypes/" + node.Id.ToString() + ".node");
            node.Unload();
        }
    }

    writeFile() {
        if (!fs.existsSync(`${this.#dest}\\File_Names`)) fs.mkdirSync(`${this.#dest}\\File_Names`);

        this.found = this.fileNames.length;
        if (this.fileNames.length > 0) {
            const outputNames = fs.createWriteStream(`${this.#dest}\\File_Names\\${extension}_file_names.txt`, {
                flags: 'a'
            });
            for (const file of this.fileNames) {
                outputNames.write(`${file.replace("\\", "/")}\r\n`);
            }
            outputNames.end();
            this.fileNames = [];
        }

        this.found += this.animNames.length;
        if (this.animNames.length > 0) {
            const outputAnimNames = fs.createWriteStream(`${this.#dest}\\File_Names\\${extension}_anim_file_names.txt`, {
                flags: 'a'
            });
            for (const file of this.animNames) {
                outputAnimNames.write(`${file.replace("\\", "/")}\r\n`);
            }
            outputAnimNames.end();
            this.animNames = [];
        }

        found += this.worldFileNames.length;
        if (this.worldFileNames.length > 0) {
            let outputWorldNames = fs.createWriteStream(`${this.#dest}\\File_Names\\${extension}_world_file_names_1.txt`, {
                flags: 'a'
            });
            let fileCount = 1;
            let lineCount = 1;
            for (const file of this.worldFileNames.length) {
                if (lineCount >= 750000) {
                    outputWorldNames.end();
                    fileCount++;
                    outputWorldNames = fs.createWriteStream(`${this.#dest}\\File_Names\\${extension}_world_file_names_${fileCount}.txt`, {
                        flags: 'a'
                    });
                    lineCount = 0;
                }
                outputWorldNames.write(`${file.replace("\\", "/")}`);
                lineCount++
            }
            outputWorldNames.end();
            this.worldFileNames = [];
        }

        found += Object.keys(this.mapNames);
        if (this.worldFileNames.length > 0) {
            let outputMapNames = fs.createWriteStream(`${this.#dest}\\File_Names\\${extension}_world_map_file_names_1.txt`, {
                flags: 'a'
            });
            let fileCount = 1;
            let lineCount = 1;
            for (const kvp of Object.entries(this.mapNames)) {
                for (const line of kvp[1]) {
                    if (lineCount >= 500000) {
                        outputMapNames.end();
                        fileCount++;
                        outputMapNames = fs.createWriteStream(`${this.#dest}\\File_Names\\${extension}_world_map_file_names_${fileCount}.txt`, {
                            flags: 'a'
                        });
                        lineCount = 0;
                    }
                    outputMapNames.write(`/resources/world/areas/${kvp[0]}/${line}_r.dds`.replace("\\", "/"));
                    lineCount++;
                    for (let m = 0; m <= 50; m++) {
                        for (let mm = 0; mm <= 50; mm++) {
                            outputMapNames.write(`/resources/world/areas/${kvp[0]}/minimaps/${line}_${m}_${mm}_r.dds`.replace("\\", "/"));
                            lineCount++;
                        }
                    }
                }
            }
            outputMapNames.end();
            this.mapNames = [];
        }

        if (errors.length > 0) {
            const outputErrors = fs.createWriteStream(`${this.#dest}\\File_Names\\${extension}_error_list.txt`, {
                flags: 'a'
            });
            for (const error of errors) {
                outputErrors.write(`${error}\r\n`);
            }
            outputErrors.end();
            this.errors = [];
        }
    }
}