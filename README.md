# Slicers-GUI

The Slicers GUI is a datamining tool built on [ElectronJS](https://www.electronjs.org/) for Star Wars: The Old Republic (SWTOR). This tool is a part of the [SWTOR Slicers](https://github.com/SWTOR-Slicers), and contains many Quality of Life improvements over existing tools, and adds new functions to expidite the extraction, modding, and datamining processes.

**NOTE**: Windows only for the time being

**Download**: [Grab the newest release!](https://github.com/Tormak9970/Slicers-GUI/releases)

For directions on its installation, please check our [**wiki**](https://github.com/SWTOR-Slicers/WikiPedia/wiki/). Also, if your intention is to use the tool to extract SWTOR Player Characters and NPCs, please check this specific guide that will show you how to install and use this tool for that purpose: [**Locating and assembling characters' assets automatically: a step by step guide**](https://github.com/SWTOR-Slicers/WikiPedia/wiki/locating-swtor-characters-assets-automatically).


### Contents

This repository has a few different components:
 - **git-hooks** - These are the git hooks used by this repo. Copy them into your `.git/hooks/` directory.
 - **version control bat files** - These are .bat files that should be used to commit, push and pull changes.
 - **app source** - The actual source code for the application itself.

### Building yourself

I do not recommend trying to build any non production versions, because odds are it will break.

### Features

Listed below are the different sub tools of the GUI, and their current status:
 - Extraction
    - Asset Extraction (Complete)
    - Locator (Complete)
    - Unzipper (Complete)
    - Has Generation (In progress)
    - Filename Finder (Not started)
 - Viewers
    - GR2 Viewer (In progress)
    - Node Viewer (In progress)
    - Asset Viewer (Not started)
 - Utilities
    - File Changer (Unstable)
    - Sound Converter (Complete)
    - Patch Getter (Complete)
    - DBM Utils (Not started)
    - UI Editor (Complete)

### Supporting Repositories

 - [tor-reader](https://github.com/Tormak9970/tor-reader)
 - [node-reader](https://github.com/Tormak9970/node-reader)
 - [file-changer](https://github.com/Tormak9970/file-changer)
 - [node-extract](https://github.com/Tormak9970/node-extract)
 - [single-node-extraction](https://github.com/Tormak9970/single-node-extraction)
 - [single-file-extraction](https://github.com/Tormak9970/single-file-extractor)
 - [ssn](https://github.com/Tormak9970/ssn)
