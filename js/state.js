let state = JSON.parse(localStorage.getItem("dm-assistant-v3")) || {
    theme: "dark",
    activeFile: "1",
    favorites: [],
    customEntries: [],
    tree: [
        {
            id: "root-file-1",
            type: "file",
            name: "Campaign Blueprint",
            content: "<h1>Campaign Overview</h1><p>Begin writing...</p>"
        },
        {
            id: "folder-1",
            type: "folder",
            name: "Monsters & Adversaries",
            children: [
                {
                    id: "file-2",
                    type: "file",
                    name: "Cave Goblin Ambushers",
                    content: "<h2>Goblin Encounter</h2><p>Small ambush squad...</p>"
                }
            ]
        }
    ]
};

// Ensure arrays exist for older local storage states
if (!state.favorites || !Array.isArray(state.favorites)) state.favorites = [];
if (!state.customEntries || !Array.isArray(state.customEntries)) state.customEntries = [];
if (!state.tree || !Array.isArray(state.tree)) {
    state.tree = [
        {
            id: "root-file-1",
            type: "file",
            name: "Campaign Blueprint",
            content: "<h1>Campaign Overview</h1><p>Begin writing...</p>"
        },
        {
            id: "folder-1",
            type: "folder",
            name: "Monsters & Adversaries",
            children: [
                {
                    id: "file-2",
                    type: "file",
                    name: "Cave Goblin Ambushers",
                    content: "<h2>Goblin Encounter</h2><p>Small ambush squad...</p>"
                }
            ]
        }
    ];
}
if (state.campaignName === undefined || state.campaignName === null) state.campaignName = "My Epic Campaign";
if (state.campaignGoal === undefined || state.campaignGoal === null) state.campaignGoal = "Defeat the rising darkness and complete the campaign quest.";
if (!state.party || !Array.isArray(state.party)) state.party = [];
if (!state.npcs) {
    state.npcs = [
        {
            id: "npc-default-1",
            name: "Commoner Name",
            lineage: "Human",
            alignment: "Neutral",
            occupation: "Shoe Salesman",
            personality: "Talks with a heavy lisp, hates pigeons...",
            hp: 10,
            ac: 10,
            img: "",
            notes: "Actually a spy for the Pigeons of the North Pole..."
        }
    ];
}
if (!state.activeNpcId) state.activeNpcId = "npc-default-1";
if (!state.audioTracks) {
    state.audioTracks = [
        { id: "track-default-1", name: "Village", url: "https://www.youtube.com/watch?v=q9yaKpYS9qc&t=10s" },
        { id: "track-default-2", name: "The Adventure Ends", url: "https://www.youtube.com/watch?v=S9FsrV72wGY" }
    ];
}
if (!state.activeTrackId) state.activeTrackId = "";
if (state.audioVolume === undefined) state.audioVolume = 70;

function saveState() {
    localStorage.setItem("dm-assistant-v3", JSON.stringify(state));
}
