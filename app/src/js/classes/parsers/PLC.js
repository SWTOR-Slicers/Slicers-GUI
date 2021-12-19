
class PLCParser {
    public string dest = "";
    public HashSet<string> fileNames = new HashSet<string>();
    public List<string> errors = new List<string>();
    public string extension;

    public Format_PLC(string dest, string ext)
    {
        this.dest = dest;
        extension = ext;
    }

    public void ParsePLC(List<GomObject> plcNodes)
    {
        foreach (GomObject obj in plcNodes)
        {
            string plcModel = obj.Data.ValueOrDefault<string>("plcModel", null);
            if (plcModel != null)
                if (plcModel.Contains("dyn."))
                    continue;
                else
                    fileNames.Add(plcModel.Replace("\\", "/").Replace("//", "/"));
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
                    outputFileNames.WriteLine(("/resources/" + item).Replace("//", "/"));
            }
            outputFileNames.Close();
            fileNames.Clear();
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

export {PLCParser};