//DOM Variables
const entriesTable = document.getElementById('entriesTable');

const credits = [
    {
        ir: "Lead Developer",
        collabs: [
            "Tormak"
        ],
        notes: "Had the idea to make the app, and did most of the programming and all of the UI."
    },
    {
        ir: "Collaborators",
        collabs: [
            "Atroxa",
            "Hayward",
            "Kihra",
            "ReallyGirlLP",
            "Silver Ranger",
            "SourApple",
            "Star | Oliver",
            "Sultana",
            "Tormak",
            "Venator",
            "ValkovAzranaeth",
            "Zerogravitas"
        ],
        notes: "Help explain existing tools, provide suggestions for features, and test beta releases."
    },
    {
        ir: "Beta Testers",
        collabs: [
            "SWTOR Slicers Community"
        ],
        notes: "Provided general input, beta release feedback, and provided additional suggestions."
    },
    {
        ir: "Tor reader lib",
        collabs: [
            "Star | Oliver"
        ],
        notes: "This lib is the base for the extraction and File Changer single extract, node extract, and change files scripts are built on."
    },
    {
        ir: "Eurofont",
        collabs: [
            "Hayward"
        ],
        notes: "A replication of The Old Republic's in game font. It is used throughout the app."
    },
    {
        ir: `<img src="../img/GR2 Icon.svg" alt="GR2" width="40px">`,
        collabs: [
            "Tormak"
        ],
        notes: "A custom made icon for the SWTOR Granny 2 3D model format."
    },
    {
        ir: `<img src="../img/JBA Icon.svg" alt="JBA" width="40px">`,
        collabs: [
            "Tormak"
        ],
        notes: "A custom made icon for the SWTOR Joint Bone Animation linear blend skinning animation format."
    },
    {
        ir: `<img src="../img/PRT Icon.svg" alt="PRT" width="40px">`,
        collabs: [
            "Tormak"
        ],
        notes: "A custom made icon for the SWTOR particle effects format."
    },
    {
        ir: `<img src="../img/TORMOD Icon.svg" alt="TORMOD" width="40px">`,
        collabs: [
            "Tormak"
        ],
        notes: "A custom made icon for the SWTOR Slicers TORMOD mod format."
    }
]

function initialize() {
    for (const cred of credits) {
        const tr = document.createElement('tr');

        const tdir = document.createElement('td');
        tdir.innerHTML = cred.ir;
        tr.appendChild(tdir);

        const tdcollabs = document.createElement('td');
        tdcollabs.innerHTML = cred.collabs.length > 1 ? cred.collabs.join(', ') : cred.collabs[0];
        tr.appendChild(tdcollabs);

        const tdnotes = document.createElement('td');
        tdnotes.innerHTML = cred.notes;
        tr.appendChild(tdnotes);

        entriesTable.appendChild(tr);
    }
}

initialize();