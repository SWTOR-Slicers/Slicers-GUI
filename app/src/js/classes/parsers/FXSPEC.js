
class FXSPECParser {
    #dest;
    /**
     * FXSPEC parser class
     * @param  {string} dest destination for ouputted hashes
     * @param  {string} ext extentions to search
     */
     constructor(dest, ext) {
        this.#dest = dest;
        this.extension = ext;
        this.fileNames = [];
        this.resourceFileNames = [];
        this.errors = [];
    }

    /**
     * parses an FXSPEC file
     * @param  {XDocument} doc
     * @param  {string} fullFileName
     */
    parseFXSPEC(doc, fullFileName) {
      _ = fullFileName[(fullFileName.LastIndexOf('\\') + 1)..];
      _ = fullFileName.Substring(0, fullFileName.LastIndexOf('/'));

      try {


        XmlNodeList fileElemList = doc.SelectNodes("//node()[@name='displayName']");
        foreach (XmlNode node in fileElemList) {
          string resource = node.InnerText;
          fileNames.Add(resource + ".fxspec");
        }

        XmlNodeList resourceElemList = doc.SelectNodes("//node()[@name='_fxResourceName']");
        foreach (XmlNode node in resourceElemList) {
          string resource = node.InnerText;
          if (resource.Contains(".prt")) {
            string output = "/resources/art/fx/particles/" + resource.Replace('\\', '/').ToLower();
            output = output.Replace("//", "/");
            output = output.Replace("/resources/art/fx/particles/art/fx/particles/", "/resources/art/fx/particles/");
            resourceFileNames.Add(output);
          } else if (resource.Contains(".gr2")) {
            string output = "/resources/" + resource.Replace('\\', '/').ToLower();
            output = output.Replace("//", "/");
            resourceFileNames.Add(output);
          } else if (resource.Contains(".lit") || resource.Contains(".ext") || resource.Contains(".zzp")) {
            string output = "/resources/" + resource.Replace('\\', '/').ToLower();
            output = output.Replace("//", "/");
            resourceFileNames.Add(output);

          } else if (resource.Contains("Play_") || resource.Contains("play_") || resource.Contains("Stop_") || resource.Contains("stop_") || resource == "" || resource.Contains(".sgt") || resource.Contains(".wav")) {
            continue;
          }
        }

        XmlNodeList projTexElemList = doc.SelectNodes("//node()[@name='_fxProjectionTexture']");
        foreach (XmlNode node in projTexElemList) {
          string resource = node.InnerText.Replace(".tiny.dds", "").Replace(".dds", "").Replace(".tex", "");
          string output = "/resources" + resource.Replace('\\', '/').ToLower();
          resourceFileNames.Add(output + ".dds");
          resourceFileNames.Add(output + ".tiny.dds");
          resourceFileNames.Add(output + ".tex");
        }

        XmlNodeList projTex1ElemList = doc.SelectNodes("//node()[@name='_fxProjectionTexture_layer1']");
        foreach (XmlNode node in projTex1ElemList) {
          string resource = node.InnerText.Replace(".tiny.dds", "").Replace(".dds", "").Replace(".tex", "");
          string output = "/resources" + resource.Replace('\\', '/').ToLower();
          resourceFileNames.Add(output + ".dds");
          resourceFileNames.Add(output + ".tiny.dds");
          resourceFileNames.Add(output + ".tex");
        }

        XmlNodeList texNameElemList = doc.SelectNodes("//node()[@name='_fxTextureName']");
        foreach (XmlNode node in texNameElemList) {
          string resource = node.InnerText.Replace(".tiny.dds", "").Replace(".dds", "").Replace(".tex", "");
          string output = "/resources" + resource.Replace('\\', '/').ToLower();
          resourceFileNames.Add(output + ".dds");
          resourceFileNames.Add(output + ".tiny.dds");
          resourceFileNames.Add(output + ".tex");
        }
      } catch (e) {
        this.errors.push("File: " + fullFileName);
        this.errors.push(e.message + ":");
        this.errors.push(e.stack);
        this.errors.push("");
      }
    }

    writeFile() {
        if (!fs.existsSync(`${this.#dest}\\File_Names`)) fs.mkdirSync(`${this.#dest}\\File_Names`);
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

        if (this.resourceFileNames.length > 0) {
            const outputResourceNames = fs.createWriteStream(`${this.#dest}\\File_Names\\${extension}_resource_file_names.txt`, {
                flags: 'a'
            });
            for (const file of this.resourceFileNames) {
                outputResourceNames.write(`${file.replace("\\", "/")}\r\n`);
            }
            outputResourceNames.end();
            this.resourceFileNames = [];
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

export {FXSPECParser};