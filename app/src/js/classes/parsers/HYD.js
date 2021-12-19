
class HYDParser {
    public string dest = "";
    public HashSet<string> animFileNames = new HashSet<string>();
    public HashSet<string> vfxFileNames = new HashSet<string>();
    public List<string> errors = new List<string>();
    public string extension;

    public Format_HYD(string dest, string ext)
    {
        this.dest = dest;
        extension = ext;
    }

    public void ParseHYD(List<GomObject> hydNodes)
    {
        foreach (GomObject obj in hydNodes)
        {
            Dictionary<object, object> hydScriptMap = obj.Data.ValueOrDefault<Dictionary<object, object>>("hydScriptMap", null);
            if (hydScriptMap != null)
            {
                foreach (var scriptMapItem in hydScriptMap)
                {
                    var scriptMapItem2 = (GomObjectData)scriptMapItem.Value;
                    List<object> hydScriptBlocks = scriptMapItem2.ValueOrDefault<List<object>>("hydScriptBlocks", null);
                    if (hydScriptBlocks != null)
                    {
                        foreach (var hydScriptBlocksItem in hydScriptBlocks)
                        {
                            var hydScriptBlocksItem2 = (GomObjectData)hydScriptBlocksItem;
                            List<object> hydActionBlocks = hydScriptBlocksItem2.ValueOrDefault<List<object>>("hydActionBlocks", null);
                            if (hydActionBlocks != null)
                            {
                                foreach (var hydActionBlocksItem in hydActionBlocks)
                                {
                                    var hydActionBlocksItem2 = (GomObjectData)hydActionBlocksItem;
                                    List<object> hydActions = hydActionBlocksItem2.ValueOrDefault<List<object>>("hydActions", null);
                                    if (hydActions != null)
                                    {
                                        foreach (var hydActionsItem in hydActions)
                                        {
                                            var hydActionsItem2 = (GomObjectData)hydActionsItem;
                                            var action = hydActionsItem2.ValueOrDefault<object>("hydAction", "").ToString();
                                            var value = hydActionsItem2.ValueOrDefault<object>("hydValue", "").ToString().ToLower();
                                            if (action.Contains("Animation"))
                                                animFileNames.Add(value);
                                            else if (action.Contains("VFX"))
                                                vfxFileNames.Add(value);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            obj.Unload();
        }
    }

    public void WriteFile(bool _ = false)
    {
        if (!Directory.Exists(dest + "\\File_Names"))
            Directory.CreateDirectory(dest + "\\File_Names");
        if (animFileNames.Count > 0)
        {
            StreamWriter outputAnimFileNames = new StreamWriter(dest + "\\File_Names\\" + extension + "_anim_file_names.txt", false);
            foreach (string item in animFileNames)
            {
                if (item != "")
                    outputAnimFileNames.WriteLine(item);
            }
            outputAnimFileNames.Close();
            animFileNames.Clear();
        }

        if (vfxFileNames.Count > 0)
        {
            StreamWriter outputVfxFileNames = new StreamWriter(dest + "\\File_Names\\" + extension + "_fxspec_file_names.txt", false);
            foreach (string item in vfxFileNames)
            {
                if (item != "")
                {
                    if (item.Contains("art/"))
                    {
                        string output = "/resources/" + item + ".fxspec";
                        outputVfxFileNames.WriteLine(output.Replace("//", "/").Replace(".fxspec.fxspec", ".fxspec"));
                    }
                    else
                    {
                        string output = "/resources/art/fx/fxspec/" + item + ".fxspec";
                        outputVfxFileNames.WriteLine(output.Replace("//", "/").Replace(".fxspec.fxspec", ".fxspec"));
                    }
                }
            }
            outputVfxFileNames.Close();
            vfxFileNames.Clear();
        }

        if (errors.Count > 0)
        {
            StreamWriter outputErrors = new StreamWriter(dest + "\\File_Names\\" + extension + "_error_list.txt", false);
            foreach (string error in errors)
            {
                outputErrors.Write(error + "\r\n");
            }
            outputErrors.Close();
            errors.Clear();
        }
    }
}

export {HYDParser};