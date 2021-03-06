const fs = require('fs');

class ICONSParser {
    #dest;
    /**
     * AMX parser class
     * @param  {string} dest destination for ouputted hashes
     * @param  {string} ext extentions to search
     */
     constructor(dest, ext) {
        this.#dest = dest;
        this.extension = ext;
        this.fileNames = [];
        this.errors = [];
        this.searched = 0;
        this.found = 0;
    }

    /**
     * parses the dom for all Icon names
     * @param  {Object} currentDom
     */
    parseICONS(currentDom) {
        const itmList = currentDom.getObjectsStartingWith("itm.");
        for (const gomItm of itmList) {
            gomItm.readNode();
            this.searched++;
            const icon = gomItm.fields.value["itmIcon"];
            if (icon != null) {
                this.fileNames.push("/resources/gfx/icons/" + icon + ".dds");
                this.fileNames.push("/resources/gfx/mtxstore/" + icon + "_120x120.dds");
                this.fileNames.push("/resources/gfx/mtxstore/" + icon + "_260x400.dds");
                this.fileNames.push("/resources/gfx/mtxstore/" + icon + "_260x260.dds");
                this.fileNames.push("/resources/gfx/mtxstore/" + icon + "_328x160.dds");
                this.fileNames.push("/resources/gfx/mtxstore/" + icon + "_400x400.dds");
            }
        }

        const ablList = currentDom.getObjectsStartingWith("abl.");
        for (const gomItm of ablList) {
            gomItm.readNode();
            this.searched++;
            const icon = gomItm.fields.value["ablIconSpec"];
            if (icon != null) this.fileNames.push("/resources/gfx/icons/" + icon + ".dds");

            icon = gomItm.fields.value["effIcon"];
            if (icon != null) this.fileNames.push("/resources/gfx/icons/" + icon + ".dds");
        }

        const qstList = currentDom.getObjectsStartingWith("qst.");
        for (const gomItm of qstList) {
            gomItm.readNode();
            this.searched++;
            const icon = gomItm.fields.value["qstMissionIcon"];
            if (icon != null) this.fileNames.push("/resources/gfx/codex/" + icon + ".dds");
        }

        const ippList = currentDom.getObjectsStartingWith("ipp.");
        for (const gomItm of ippList) {
            gomItm.readNode();
            this.searched++;
            const icon = gomItm.fqn.ToString();
            if (icon != null) {
                this.fileNames.push("/resources/gfx/icons/" + icon + ".dds");
                this.fileNames.push("/resources/gfx/icons/" + icon.replaceAll("ipp.", "") + ".dds");

                this.fileNames.push("/resources/gfx/mtxstore/" + icon + "_120x120.dds");
                this.fileNames.push("/resources/gfx/mtxstore/" + icon + "_260x260.dds");
                this.fileNames.push("/resources/gfx/mtxstore/" + icon + "_260x400.dds");
                this.fileNames.push("/resources/gfx/mtxstore/" + icon + "_328x160.dds");
                this.fileNames.push("/resources/gfx/mtxstore/" + icon + "_400x400.dds");

                this.fileNames.push("/resources/gfx/mtxstore/" + icon.replaceAll("ipp.", "") + "_120x120.dds");
                this.fileNames.push("/resources/gfx/mtxstore/" + icon.replaceAll("ipp.", "") + "_260x260.dds");
                this.fileNames.push("/resources/gfx/mtxstore/" + icon.replaceAll("ipp.", "") + "_260x400.dds");
                this.fileNames.push("/resources/gfx/mtxstore/" + icon.replaceAll("ipp.", "") + "_328x160.dds");
                this.fileNames.push("/resources/gfx/mtxstore/" + icon.replaceAll("ipp.", "") + "_400x400.dds");
            }
        }

        const cdxList = currentDom.getObjectsStartingWith("cdx.");
        for (const gomItm of cdxList) {
            gomItm.readNode();
            this.searched++;
            const icon = gomItm.fields.value["cdxImage"];
            if (icon != null) this.fileNames.push("/resources/gfx/codex/" + icon + ".dds");
        }

        const achList = currentDom.getObjectsStartingWith("ach.");
        for (const gomItm of achList) {
            gomItm.readNode();
            this.searched++;
            const icon = gomItm.fields.value["achIcon"];
            if (icon != null) this.fileNames.push("/resources/gfx/icons/" + icon + ".dds");
        }

        const talList = currentDom.getObjectsStartingWith("tal.");
        for (const gomItm of talList) {
            gomItm.readNode();
            this.searched++;
            const icon = gomItm.fields.value["talTalentIcon"];
            if (icon != null) this.fileNames.push("/resources/gfx/icons/" + icon + ".dds");
        }

        const spvpIcons = [
            "armor_",
            "capacitor_",
            "eng_",
            "magazine_",
            "pweap_",
            "reactor_",
            "sensor_",
            "shield_",
            "sweap_",
            "sys_",
            "thruster_"
        ];

        for (const cmp of spvpIcons) {
            const spvpList1 = currentDom.getObjectsStartingWith(cmp);
            for (const gomItm of spvpList1) {
                gomItm.readNode();
                this.searched++;
                const icon = gomItm.fields.value["scFFComponentIcon"];
                if (icon != null) this.fileNames.push("/resources/gfx/icons/" + icon + ".dds");
            }
        }

        const shipDataProto = currentDom.getObject("scFFShipsDataPrototype");
        if (shipDataProto != null) {
            const shipData = shipDataProto.fields.value["scFFShipsData"];
            if (shipData != null) {
                for (const item of shipData) {
                    this.searched++;
                    const icon1_string = item.value["scFFShipHullIcon"];
                    const icon2_string = item.value["scFFShipIcon"];
                    if (icon1_string != null) {
                        this.fileNames.push("/resources/gfx/icons/" + icon1_string + ".dds");
                        this.fileNames.push("/resources/gfx/textures/" + icon1_string + ".dds");
                    }
                    if (icon2_string != null) {
                        this.fileNames.push("/resources/gfx/icons/" + icon2_string + ".dds");
                        this.fileNames.push("/resources/gfx/textures/" + icon2_string + ".dds");
                    }
                }
            }
        }

        const shipColorOptionProto = currentDom.getObject("scFFColorOptionMasterPrototype");
        if (shipColorOptionProto != null) {
            const shipColors = shipColorOptionProto.fields.value["scFFComponentColorUIData"];
            if (shipColors != null) {
                for (const item of shipColors) {
                    this.searched++;
                    const icon_string = item.value["scFFComponentColorIcon"];
                    if (icon_string != null) {
                        this.fileNames.push("/resources/gfx/icons/" + icon_string + ".dds");
                        this.fileNames.push("/resources/gfx/textures/" + icon_string + ".dds");
                    }
                }
            }
        }

        const scffCrewProto = currentDom.getObject("scffCrewPrototype");
        if (scffCrewProto != null) {
            const shipCrew = scffCrewProto.fields.value["scFFShipsCrewAndPatternData"];
            if (shipCrew != null) {
                for (const item of shipCrew) {
                    this.searched++;
                    const icon_string = item.value["scFFCrewIcon"];
                    if (icon_string != null) {
                        this.fileNames.push("/resources/gfx/icons/" + icon_string + ".dds");
                        this.fileNames.push("/resources/gfx/textures/" + icon_string + ".dds");
                    }
                }
            }
        }

        const mtxStore = currentDom.getObject("mtxStorefrontInfoPrototype");
        if (mtxStore != null) {
            const mtxItems = mtxStore.fields.value["mtxStorefrontData"];
            if (mtxItems != null) {
                for (const item of mtxItems) {
                    this.searched++;
                    const icon_string = item.value["mtxStorefrontIcon"];
                    if (icon_string != null) {
                        const icon = icon_string.toLowerCase();
                        this.fileNames.push("/resources/gfx/icons/" + icon + ".dds");
                        this.fileNames.push("/resources/gfx/mtxstore/" + icon + "_120x120.dds");
                        this.fileNames.push("/resources/gfx/mtxstore/" + icon + "_260x400.dds");
                        this.fileNames.push("/resources/gfx/mtxstore/" + icon + "_260x260.dds");
                        this.fileNames.push("/resources/gfx/mtxstore/" + icon + "_328x160.dds");
                        this.fileNames.push("/resources/gfx/mtxstore/" + icon + "_400x400.dds");
                    }
                }
            }
        }

        const colCategoriesProto = currentDom.getObject("colCollectionCategoriesPrototype");
        if (colCategoriesProto != null) {
            const colCats = colCategoriesProto.fields.value["colCollectionCategoryData"];
            if (colCats != null) {
                for (const item of colCats) {
                    this.searched++;
                    const icon_string = item.value["colCollectionCategoryIcon"];
                    if (icon_string != null) {
                        const icon = icon_string.toLowerCase();
                        this.fileNames.push("/resources/gfx/icons/" + icon + ".dds");
                        this.fileNames.push("/resources/gfx/mtxstore/" + icon + "_120x120.dds");
                        this.fileNames.push("/resources/gfx/mtxstore/" + icon + "_260x400.dds");
                        this.fileNames.push("/resources/gfx/mtxstore/" + icon + "_260x260.dds");
                        this.fileNames.push("/resources/gfx/mtxstore/" + icon + "_328x160.dds");
                        this.fileNames.push("/resources/gfx/mtxstore/" + icon + "_400x400.dds");
                    }
                }
            }
        }

        const colCollectionItemsProto = currentDom.getObject("colCollectionItemsPrototype");
        if (colCollectionItemsProto != null) {
            const colItems = colCollectionItemsProto.fields.value["colCollectionItemsData"];
            if (colItems != null) {
                for (const item of colItems) {
                    this.searched++;
                    const icon_string = item.value["colCollectionIcon"];
                    if (icon_string != null) {
                        const icon = icon_string.toLowerCase();
                        this.fileNames.push("/resources/gfx/icons/" + icon + ".dds");
                        this.fileNames.push("/resources/gfx/mtxstore/" + icon + "_120x120.dds");
                        this.fileNames.push("/resources/gfx/mtxstore/" + icon + "_260x400.dds");
                        this.fileNames.push("/resources/gfx/mtxstore/" + icon + "_260x260.dds");
                        this.fileNames.push("/resources/gfx/mtxstore/" + icon + "_328x160.dds");
                        this.fileNames.push("/resources/gfx/mtxstore/" + icon + "_400x400.dds");
                    }
                }
                colItems.Clear();
            }
            colCollectionItemsProto.Unload();
        }

        const achCategoriesTable_Proto = currentDom.getObject("achCategoriesTable_Prototype");
        if (achCategoriesTable_Proto != null) {
            const achCategories = achCategoriesTable_Proto.fields.value["achCategoriesData"];
            if (achCategories != null) {
                for (const item of achCategories) {
                    this.searched++;
                    const icon_string1 = item.value["achCategoriesIcon"];
                    if (icon_string1 != null) {
                        const icon = icon_string1.toLowerCase();
                        this.fileNames.push("/resources/gfx/icons/" + icon + ".dds");
                    }
                    const icon_string2 = item.value["achCategoriesCodexIcon"];
                    if (icon_string2 != null) {
                        const icon = icon_string2.toLowerCase();
                        this.fileNames.push("/resources/gfx/codex/" + icon + ".dds");
                    }
                }
            }
        }
    }

    genHash() {
        const res = [...this.fileNames.map(file => {
            if (file != "") {
                return file;
            }
        })];
        return res;
    }

    writeFile() {
        if (!fs.existsSync(`${this.#dest}\\File_Names`)) fs.mkdirSync(`${this.#dest}\\File_Names`);
        if (this.fileNames.length > 0) {
            const outputNames = fs.createWriteStream(`${this.#dest}\\File_Names\\${this.extension}_file_names.txt`, {
                flags: 'a'
            });
            for (const file of this.fileNames) {
                if (file != "") outputNames.write(file);
            }
            outputNames.end();
        }

        if (this.errors.length > 0) {
            const outputErrors = fs.createWriteStream(`${this.#dest}\\File_Names\\${this.extension}_error_list.txt`, {
                flags: 'a'
            });
            for (const error of errors) {
                outputErrors.write(`${error}\r\n`);
            }
            outputErrors.end();
        }
    }
}

export {ICONSParser};