
class AMXParser {
    public string dest = "";
    public HashSet<string> fileNames = new HashSet<string>();
    public List<string> errors = new List<string>();
    public string extension;

    public Format_AMX(string dest, string ext)
    {
        this.dest = dest;
        extension = ext;
    }

    public void ParseAMX(Stream fileStream, string fullFileName)
    {
        BinaryReader br = new BinaryReader(fileStream);

        ulong header = br.ReadUInt32();

        if (header.ToString("X") != "20584D41")
        {
            errors.Add("File: " + fullFileName);
            errors.Add("Invalid header" + header.ToString());
            return;
        }
        else
        {
            br.ReadUInt16(); //unknown
            bool stop = false;
            do
            {
                byte fileLen = br.ReadByte();
                if (fileLen == 0)
                {
                    stop = true;
                }
                else
                {
                    byte[] fileNameBytes = br.ReadBytes(fileLen);
                    string fileName = Encoding.ASCII.GetString(fileNameBytes);

                    byte dirLen = br.ReadByte();
                    byte[] dirNameBytes = br.ReadBytes(dirLen);
                    string dirName = Encoding.ASCII.GetString(dirNameBytes);
                    string fullName = "/resources/anim/" + dirName.Replace('\\', '/') + "/" + fileName;
                    fullName = fullName.Replace("//", "/");

                    //humanoid\bfanew
                    //em_wookiee_10
                    fileNames.Add(fullName + ".jba");
                    fileNames.Add(fullName + ".mph");
                    fileNames.Add(fullName + ".mph.amx");

                    br.ReadUInt32();
                    byte check = br.ReadByte();
                    if (check != 2 && check != 3)
                        stop = true;
                }
            } while (!stop);
        }
    }

    public void WriteFile(bool _ = false)
    {
        if (!Directory.Exists(dest + "\\File_Names"))
            Directory.CreateDirectory(dest + "\\File_Names");
        if (fileNames.Count > 0) {
            StreamWriter outputFileNames = new StreamWriter(dest + "\\File_Names\\" + extension + "_file_names.txt", false);
            foreach (var file in fileNames)
            {
                outputFileNames.WriteLine(file);
            }
            outputFileNames.Close();
            fileNames.Clear();
        }

        if (errors.Count > 0) {
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

export {AMXParser}