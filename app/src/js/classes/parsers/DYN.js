
class DYNParser {
    public string dest = "";
    public HashSet<string> fileNames = new HashSet<string>();
    public HashSet<string> unknownFileNames = new HashSet<string>();
    public List<string> errors = new List<string>();
    public string extension;

    public Format_DYN(string dest, string ext)
    {
        this.dest = dest;
        extension = ext;
    }

    public void ParseDYN(List<GomObject> dynNodes)
    {
        foreach (GomObject obj in dynNodes)
        {
            List<object> dynVisualList = obj.Data.ValueOrDefault<List<object>>("dynVisualList", null);
            if (dynVisualList != null)
            {
                foreach (var dynVisualListItem in dynVisualList)
                {
                    var dynVisualListItem2 = (GomObjectData)dynVisualListItem;

                    var visual = dynVisualListItem2.ValueOrDefault<object>("dynVisualFqn", "").ToString().ToLower();
                    if (visual != "")
                    {
                        string output = visual.Replace("\\", "/").Replace("//", "/");
                        if (visual.Contains(".gr2") || visual.Contains(".lit") || visual.Contains(".mag"))
                        {
                            output = ("/resources/" + output).Replace("//", "/");
                        }
                        else if (visual.Contains(".fxspec"))
                        {
                            output = ("/resources/art/fx/fxspec/" + output).Replace("//", "/");
                        }
                        else if (visual.Contains(".fxp"))
                        {
                            output = ("/resources/art/fx/fxspec/" + output).Replace("//", "/");
                        }
                        else
                        {
                            unknownFileNames.Add(visual);
                        }

                        fileNames.Add(output);
                    }
                }
            }

            Dictionary<object, object> dynLightNameToProperty = obj.Data.ValueOrDefault<Dictionary<object, object>>("dynLightNameToProperty", null);
            if (dynLightNameToProperty != null)
            {
                foreach (var dynLightNameToPropertyItem in dynLightNameToProperty)
                {
                    var dynLightNameToPropertyItem2 = (GomObjectData)dynLightNameToPropertyItem.Value;
                    var ramp = dynLightNameToPropertyItem2.ValueOrDefault<object>("dynLightRampMap", "").ToString().ToLower();
                    var illum = dynLightNameToPropertyItem2.ValueOrDefault<object>("dynLightIlluminationMap", "").ToString().ToLower();
                    var fall = dynLightNameToPropertyItem2.ValueOrDefault<object>("dynLightFalloff", "").ToString().ToLower();
                    if (ramp != "")
                        fileNames.Add("/resources/" + ramp + ".dds");
                    if (illum != "")
                        fileNames.Add("/resources/" + illum + ".dds");
                    if (fall != "")
                        fileNames.Add("/resources/" + fall + ".dds");
                }
            }
            obj.Unload();
        }
    }

    public void WriteFile(bool _ = false)
    {
        if (!Directory.Exists(dest + "\\File_Names"))
            Directory.CreateDirectory(dest + "\\File_Names");
        if (fileNames.Count > 0)
        {
            StreamWriter outputFileNames = new StreamWriter(dest + "\\File_Names\\" + extension + "_file_names.txt", false);
            foreach (string item in fileNames)
            {
                if (item != "")
                    outputFileNames.WriteLine(item);
            }
            outputFileNames.Close();
            fileNames.Clear();
        }

        if (unknownFileNames.Count > 0)
        {
            StreamWriter outputUnknownFileNames = new StreamWriter(dest + "\\File_Names\\" + extension + "_unknown_file_names.txt", false);
            foreach (string item in unknownFileNames)
            {
                if (item != "")
                    outputUnknownFileNames.WriteLine(item);
            }
            outputUnknownFileNames.Close();
            unknownFileNames.Clear();
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

export {DYNParser};