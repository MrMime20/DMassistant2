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
    try {
        if (!state.maps) state.maps = [];
        if (!state.party) state.party = [];
        if (!state.npcs) state.npcs = [];
        
        const originalMapsData = [];
        const originalPartyData = [];
        const originalNpcData = [];

        state.maps.forEach(map => {
            const originalUrl = map.url;
            const originalFog = map.fogData;
            originalMapsData.push({ map, url: originalUrl, fogData: originalFog });
            
            if (map.url && map.url.startsWith("data:")) {
                setAsset(`map-image-${map.id}`, map.url).catch(err => {
                    console.error("Failed to save map image to IndexedDB:", err);
                });
                map.url = `indexeddb:${map.id}`;
            }
            if (map.fogData && map.fogData.startsWith("data:")) {
                setAsset(`map-fog-${map.id}`, map.fogData).catch(err => {
                    console.error("Failed to save map fog to IndexedDB:", err);
                });
                map.fogData = "indexeddb";
            }
        });

        state.party.forEach(player => {
            const originalImg = player.img;
            originalPartyData.push({ player, img: originalImg });
            
            if (player.img && player.img.startsWith("data:")) {
                setAsset(`player-image-${player.id}`, player.img).catch(err => {
                    console.error("Failed to save player image to IndexedDB:", err);
                });
                player.img = `indexeddb:${player.id}`;
            }
        });

        state.npcs.forEach(npc => {
            const originalImg = npc.img;
            originalNpcData.push({ npc, img: originalImg });
            
            if (npc.img && npc.img.startsWith("data:")) {
                setAsset(`npc-image-${npc.id}`, npc.img).catch(err => {
                    console.error("Failed to save npc image to IndexedDB:", err);
                });
                npc.img = `indexeddb:${npc.id}`;
            }
        });

        // Now serialize to localStorage (which is now guaranteed to be tiny!)
        localStorage.setItem("dm-assistant-v3", JSON.stringify(state));

        // Restore original in-memory data immediately
        originalMapsData.forEach(item => {
            item.map.url = item.url;
            item.map.fogData = item.fogData;
        });
        originalPartyData.forEach(item => {
            item.player.img = item.img;
        });
        originalNpcData.forEach(item => {
            item.npc.img = item.img;
        });

        // Run cleanup asynchronously
        cleanupIndexedDBAssets();

    } catch (e) {
        console.error("Error saving state to localStorage:", e);
        if (e.name === "QuotaExceededError" || e.code === 22) {
            if (window.showAlert) {
                window.showAlert(
                    "Storage Quota Exceeded", 
                    "Your browser's local storage is full. This is usually caused by uploading very large map images. Please delete some maps or use web URLs instead of local file uploads."
                );
            } else {
                alert("Storage Quota Exceeded: Please delete some maps or use web image URLs to free up space.");
            }
        }
    }
}

// IndexedDB Helper for storing large base64 assets (maps, fog data, portraits)
const dbName = "dm_assistant_assets_db";
const dbVersion = 1;
let dbInstance = null;

function getDB() {
    return new Promise((resolve, reject) => {
        if (dbInstance) {
            resolve(dbInstance);
            return;
        }
        const request = indexedDB.open(dbName, dbVersion);
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains("assets")) {
                db.createObjectStore("assets");
            }
        };
        request.onsuccess = (e) => {
            dbInstance = e.target.result;
            resolve(dbInstance);
        };
        request.onerror = (e) => {
            console.error("IndexedDB open error:", e.target.error);
            reject(e.target.error);
        };
    });
}

function getAsset(key) {
    return getDB().then(db => {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(["assets"], "readonly");
            const store = transaction.objectStore("assets");
            const request = store.get(key);
            request.onsuccess = (e) => {
                resolve(e.target.result || null);
            };
            request.onerror = (e) => {
                reject(e.target.error);
            };
        });
    });
}

function setAsset(key, value) {
    return getDB().then(db => {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(["assets"], "readwrite");
            const store = transaction.objectStore("assets");
            const request = store.put(value, key);
            request.onsuccess = () => {
                resolve();
            };
            request.onerror = (e) => {
                reject(e.target.error);
            };
        });
    });
}

function deleteAsset(key) {
    return getDB().then(db => {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(["assets"], "readwrite");
            const store = transaction.objectStore("assets");
            const request = store.delete(key);
            request.onsuccess = () => {
                resolve();
            };
            request.onerror = (e) => {
                reject(e.target.error);
            };
        });
    });
}

function cleanupIndexedDBAssets() {
    getDB().then(db => {
        const transaction = db.transaction(["assets"], "readwrite");
        const store = transaction.objectStore("assets");
        
        if (store.getAllKeys) {
            const request = store.getAllKeys();
            request.onsuccess = (e) => {
                const keys = e.target.result;
                const activeKeys = new Set();
                
                if (state.maps) {
                    state.maps.forEach(m => {
                        activeKeys.add(`map-image-${m.id}`);
                        activeKeys.add(`map-fog-${m.id}`);
                    });
                }
                if (state.party) {
                    state.party.forEach(p => {
                        activeKeys.add(`player-image-${p.id}`);
                    });
                }
                if (state.npcs) {
                    state.npcs.forEach(n => {
                        activeKeys.add(`npc-image-${n.id}`);
                    });
                }
                
                keys.forEach(key => {
                    if (!activeKeys.has(key)) {
                        store.delete(key);
                    }
                });
            };
        }
    }).catch(err => {
        console.error("Failed to run IndexedDB asset cleanup:", err);
    });
}

async function loadLargeAssets() {
    if (state.maps) {
        for (const map of state.maps) {
            if (map.url && map.url.startsWith("indexeddb:")) {
                try {
                    const asset = await getAsset(`map-image-${map.id}`);
                    if (asset) map.url = asset;
                } catch (err) {
                    console.error("Failed to load map image asset from IndexedDB:", err);
                }
            }
            if (map.fogData === "indexeddb") {
                try {
                    const asset = await getAsset(`map-fog-${map.id}`);
                    if (asset) map.fogData = asset;
                } catch (err) {
                    console.error("Failed to load map fog asset from IndexedDB:", err);
                }
            }
        }
    }
    
    if (state.party) {
        for (const player of state.party) {
            if (player.img && player.img.startsWith("indexeddb:")) {
                try {
                    const asset = await getAsset(`player-image-${player.id}`);
                    if (asset) player.img = asset;
                } catch (err) {
                    console.error("Failed to load player image asset from IndexedDB:", err);
                }
            }
        }
    }

    if (state.npcs) {
        for (const npc of state.npcs) {
            if (npc.img && npc.img.startsWith("indexeddb:")) {
                try {
                    const asset = await getAsset(`npc-image-${npc.id}`);
                    if (asset) npc.img = asset;
                } catch (err) {
                    console.error("Failed to load npc image asset from IndexedDB:", err);
                }
            }
        }
    }
}

async function migrateLocalStorageToIndexedDB() {
    let migratedAny = false;

    if (state.maps) {
        for (const map of state.maps) {
            if (map.url && map.url.startsWith("data:")) {
                try {
                    await setAsset(`map-image-${map.id}`, map.url);
                    map.url = `indexeddb:${map.id}`;
                    migratedAny = true;
                } catch (err) {
                    console.error("Migration failed for map image:", err);
                }
            }
            if (map.fogData && map.fogData.startsWith("data:")) {
                try {
                    await setAsset(`map-fog-${map.id}`, map.fogData);
                    map.fogData = "indexeddb";
                    migratedAny = true;
                } catch (err) {
                    console.error("Migration failed for map fog:", err);
                }
            }
        }
    }

    if (state.party) {
        for (const player of state.party) {
            if (player.img && player.img.startsWith("data:")) {
                try {
                    await setAsset(`player-image-${player.id}`, player.img);
                    player.img = `indexeddb:${player.id}`;
                    migratedAny = true;
                } catch (err) {
                    console.error("Migration failed for player image:", err);
                }
            }
        }
    }

    if (state.npcs) {
        for (const npc of state.npcs) {
            if (npc.img && npc.img.startsWith("data:")) {
                try {
                    await setAsset(`npc-image-${npc.id}`, npc.img);
                    npc.img = `indexeddb:${npc.id}`;
                    migratedAny = true;
                } catch (err) {
                    console.error("Migration failed for npc image:", err);
                }
            }
        }
    }

    if (migratedAny) {
        try {
            localStorage.setItem("dm-assistant-v3", JSON.stringify(state));
            console.log("Proactively migrated legacy localStorage data to IndexedDB.");
        } catch (err) {
            console.error("Failed to save lightened state during proactive migration:", err);
        }
    }
}

// Initial async load trigger
document.addEventListener("DOMContentLoaded", async () => {
    await migrateLocalStorageToIndexedDB();
    await loadLargeAssets();
    // After loading assets, refresh UI if currently active on the map tab
    if (typeof loadMapEngine === "function" && document.getElementById("view-map")?.classList.contains("active")) {
        loadMapEngine();
    }
    // Also update dashboard statistics if active
    if (typeof renderDashboard === "function" && document.getElementById("view-dashboard")?.classList.contains("active")) {
        renderDashboard();
    }
    // Also update npc/player UI as needed
    if (typeof renderNpcList === "function" && document.getElementById("view-npc")?.classList.contains("active")) {
        renderNpcList();
        renderNpcDetails();
    }
});
