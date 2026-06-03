// NPC Directory & Management Logic

let activeNpcImgBase64 = "";

function addNewNpc() {
    const newNpc = {
        id: "npc-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
        name: "Commoner Name",
        lineage: "Human",
        alignment: "Neutral",
        occupation: "Shoe Salesman",
        personality: "Talks with a heavy lisp, hates pigeons...",
        hp: 10,
        ac: 10,
        img: "",
        notes: "Actually a spy for the Penguins of the North Pole..."
    };

    if (!state.npcs) state.npcs = [];
    state.npcs.push(newNpc);
    state.activeNpcId = newNpc.id;
    saveState();

    renderNpcList();
    renderNpcDetails();

    // Keep Initiative & Map Sidebars updated too
    if (typeof renderInitiativeNpcList === "function") renderInitiativeNpcList();
    if (typeof renderMapNpcList === "function") renderMapNpcList();
}

function renderNpcList() {
    const list = document.getElementById("npcSidebarList");
    if (!list) return;
    list.innerHTML = "";

    const query = document.getElementById("npcSearchFilter") ? document.getElementById("npcSearchFilter").value.toLowerCase().trim() : "";
    const npcs = state.npcs || [];

    const filtered = npcs.filter(npc => {
        const name = (npc.name || "").toLowerCase();
        const lineage = (npc.lineage || "").toLowerCase();
        const occupation = (npc.occupation || "").toLowerCase();
        return name.includes(query) || lineage.includes(query) || occupation.includes(query);
    });

    if (filtered.length === 0) {
        list.innerHTML = `
            <div style="text-align: center; padding: 24px; color: var(--text-muted); font-style: italic; font-size: 13px;">
                <span>No NPCs found.</span>
            </div>
        `;
        return;
    }

    filtered.forEach(npc => {
        const isActive = npc.id === state.activeNpcId;
        const card = document.createElement("div");
        card.className = "map-list-card" + (isActive ? " active" : "");
        card.style.display = "flex";
        card.style.flexDirection = "row";
        card.style.padding = "12px";
        card.style.alignItems = "center";
        card.style.justifyContent = "space-between";
        card.onclick = () => {
            state.activeNpcId = npc.id;
            saveState();
            renderNpcList();
            renderNpcDetails();
        };

        const imgHtml = npc.img ? `<img src="${npc.img}" style="width: 34px; height: 34px; border-radius: 50%; object-fit: cover; border: 1.5px solid var(--border); margin-right: 12px; flex-shrink: 0;" />` : `<div style="width: 34px; height: 34px; border-radius: 50%; background: var(--border); display: flex; align-items: center; justify-content: center; color: var(--text-muted); border: 1.5px solid var(--border); font-size: 12px; margin-right: 12px; flex-shrink: 0;"><i data-lucide="user" style="width:14px; height:14px;"></i></div>`;

        card.innerHTML = `
            <div style="display: flex; align-items: center; overflow: hidden; flex: 1;">
                ${imgHtml}
                <div style="display: flex; flex-direction: column; overflow: hidden; align-items: flex-start; text-align: left;">
                    <strong style="color: var(--text); font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%;">${npc.name}</strong>
                    <span style="font-size: 11px; color: var(--text-muted); text-transform: uppercase;">${npc.lineage || "Unknown Lineage"} • ${npc.occupation || "No Role"}</span>
                </div>
            </div>
            <button class="init-action-btn" style="padding: 4px; border-radius: 4px; pointer-events: none; flex-shrink: 0;" title="Active">
                <i data-lucide="${isActive ? 'check' : 'chevron-right'}" style="width:14px; height:14px; color: ${isActive ? 'var(--accent)' : 'var(--text-muted)'}"></i>
            </button>
        `;

        list.appendChild(card);
    });

    if (window.lucide) lucide.createIcons();
}

function renderNpcDetails() {
    const container = document.getElementById("npcDetailsContainer");
    if (!container) return;

    const activeNpc = (state.npcs || []).find(n => n.id === state.activeNpcId);

    if (!activeNpc) {
        container.innerHTML = `
            <div style="display: flex; flex: 1; flex-direction: column; align-items: center; justify-content: center; color: var(--text-muted); text-align: center; height: 100%; min-height: 300px; gap: 12px;">
                <i data-lucide="contact" style="width: 48px; height: 48px; opacity: 0.5;"></i>
                <div>
                    <h3 style="font-size: 18px; margin-bottom: 4px; color: var(--text);">No NPC Selected</h3>
                    <p style="font-size: 13px; max-width: 320px;">Choose an entity from the directory on the left or create a brand new character to begin viewing and customizing details.</p>
                </div>
            </div>
        `;
        if (window.lucide) lucide.createIcons();
        return;
    }

    container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 12px; border-bottom: 1px solid var(--border);">
            <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: var(--accent); letter-spacing: 0.7px;">NPC Configuration</span>
            <button onclick="deleteActiveNpc()" style="background: none; border: none; color: var(--danger); cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 700; padding: 6px 12px; border-radius: 6px; transition: 0.2s;" onmouseover="this.style.background='var(--danger-soft)'" onmouseleave="this.style.background='none'">
                <i data-lucide="trash-2" style="width: 15px; height: 15px;"></i> Delete NPC
            </button>
        </div>

        <div style="display: flex; gap: 24px; flex-wrap: wrap;">
            <!-- Left inputs column -->
            <div style="flex: 1.2; display: flex; flex-direction: column; gap: 20px; min-width: 300px;">
                <div class="ce-field" style="margin-bottom: 0;">
                    <label style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.5px; display: block; margin-bottom: 6px;">Full Identity</label>
                    <input type="text" id="npcEditName" value="${activeNpc.name || ''}" placeholder="e.g. Commoner Name" oninput="updateActiveNpc('name', this.value)" style="width: 100%; padding: 14px 16px; font-size: 16px; border-radius: 8px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text); outline: none;" />
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                    <div class="ce-field" style="margin-bottom: 0;">
                        <label style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.5px; display: block; margin-bottom: 6px;">Lineage</label>
                        <input type="text" id="npcEditLineage" value="${activeNpc.lineage || ''}" placeholder="e.g. Human" oninput="updateActiveNpc('lineage', this.value)" style="width: 100%; padding: 12px 14px; font-size: 14px; border-radius: 8px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text); outline: none;" />
                    </div>
                    <div class="ce-field" style="margin-bottom: 0;">
                        <label style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.5px; display: block; margin-bottom: 6px;">Alignment</label>
                        <input type="text" id="npcEditAlignment" value="${activeNpc.alignment || ''}" placeholder="e.g. Neutral" oninput="updateActiveNpc('alignment', this.value)" style="width: 100%; padding: 12px 14px; font-size: 14px; border-radius: 8px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text); outline: none;" />
                    </div>
                </div>
                
                <div class="ce-field" style="margin-bottom: 0;">
                    <label style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.5px; display: block; margin-bottom: 6px;">Occupation / Role</label>
                    <input type="text" id="npcEditOccupation" value="${activeNpc.occupation || ''}" placeholder="e.g. Innkeeper" oninput="updateActiveNpc('occupation', this.value)" style="width: 100%; padding: 12px 14px; font-size: 14px; border-radius: 8px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text); outline: none;" />
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                    <div class="ce-field" style="margin-bottom: 0;">
                        <label style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.5px; display: block; margin-bottom: 6px;">Hit Points (HP)</label>
                        <input type="number" id="npcEditHp" value="${activeNpc.hp !== undefined ? activeNpc.hp : '10'}" placeholder="e.g. 10" oninput="updateActiveNpc('hp', parseInt(this.value) || 0)" style="width: 100%; padding: 12px 14px; font-size: 14px; border-radius: 8px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text); outline: none;" />
                    </div>
                    <div class="ce-field" style="margin-bottom: 0;">
                        <label style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.5px; display: block; margin-bottom: 6px;">Armor Class (AC)</label>
                        <input type="number" id="npcEditAc" value="${activeNpc.ac !== undefined ? activeNpc.ac : '10'}" placeholder="e.g. 10" oninput="updateActiveNpc('ac', parseInt(this.value) || 0)" style="width: 100%; padding: 12px 14px; font-size: 14px; border-radius: 8px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text); outline: none;" />
                    </div>
                </div>
            </div>
            
            <!-- Right inputs column -->
            <div style="flex: 1; display: flex; flex-direction: column; gap: 20px; min-width: 250px;">
                <div class="ce-field" style="height: 100%; display: flex; flex-direction: column; margin-bottom: 0;">
                    <label style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.5px; display: block; margin-bottom: 6px;">Personality & Mannerisms</label>
                    <textarea id="npcEditPersonality" placeholder="Talks with a heavy lisp, hates pigeons..." oninput="updateActiveNpc('personality', this.value)" style="width: 100%; flex: 1; min-height: 154px; padding: 14px; font-size: 14px; border-radius: 8px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text); resize: vertical; outline: none; line-height: 1.5;">${activeNpc.personality || ''}</textarea>
                </div>
            </div>
        </div>

        <!-- Portrait uploader block style equivalent to image -->
        <div style="background: var(--card-bg); border: 1px solid var(--border); border-radius: 12px; padding: 20px; display: flex; flex-direction: column; gap: 16px; margin-top: 10px; box-shadow: var(--shadow);">
            <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.7px;">Portrait Gallery</div>
            <div style="display: flex; gap: 16px; align-items: center;">
                <div style="position: relative; width: 80px; height: 80px; border-radius: 12px; border: 2px dashed var(--border); display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0; background: var(--main-bg);">
                    <img id="npcEditImgPreview" src="${activeNpc.img || ''}" style="${activeNpc.img ? 'display: block;' : 'display: none;'} width: 100%; height: 100%; object-fit: cover;" />
                    <div id="npcNoImageText" style="${activeNpc.img ? 'display: none;' : 'display: block;'} font-size: 9px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; text-align: center; pointer-events: none; line-height: 1.2;">No<br>Images</div>
                </div>
                <div style="flex: 1; display: flex; flex-direction: column; gap: 8px;">
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <input type="text" id="npcEditImgUrlInput" value="${activeNpc.img || ''}" placeholder="Paste Image URL here..." oninput="handleNpcImgUrlEntered(this.value)" style="flex: 1; padding: 10px 12px; font-size: 13px; border-radius: 8px; border: 1px solid var(--border); background: var(--main-bg); color: var(--text); outline: none;" />
                        <label style="background: var(--tracker-border); color: white; padding: 8px 12px; border-radius: 8px; font-size: 12px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 4px; border: none; flex-shrink: 0; user-select: none;">
                            <i data-lucide="upload" style="width:14px; height:14px;"></i> Upload
                            <input type="file" id="npcEditImgFile" accept="image/*" onchange="handleNpcImageUpload(event)" style="display: none;" />
                        </label>
                    </div>
                    <span style="font-size: 11px; color: var(--text-muted);">Paste URL and/or press Enter to save image</span>
                </div>
            </div>
        </div>

        <!-- Lore block -->
        <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 10px;">
            <span style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.7px;">Lore & Secret Notes</span>
            <textarea id="npcEditNotes" placeholder="Actually a spy for the Radiant Order..." oninput="updateActiveNpc('notes', this.value)" style="width: 100%; min-height: 120px; padding: 14px; font-size: 14px; border-radius: 8px; border: 1px solid var(--border); background: var(--card-bg); color: var(--text); resize: vertical; outline: none; line-height: 1.5;">${activeNpc.notes || ''}</textarea>
        </div>
    `;

    if (window.lucide) lucide.createIcons();
}

function updateActiveNpc(field, val) {
    const activeNpc = (state.npcs || []).find(n => n.id === state.activeNpcId);
    if (!activeNpc) return;

    activeNpc[field] = val;
    saveState();

    // Re-render sidebar text dynamically without losing focus on input
    const query = document.getElementById("npcSearchFilter") ? document.getElementById("npcSearchFilter").value.toLowerCase().trim() : "";
    const npcs = state.npcs || [];
    const filtered = npcs.filter(npc => {
        const name = (npc.name || "").toLowerCase();
        const lineage = (npc.lineage || "").toLowerCase();
        const occupation = (npc.occupation || "").toLowerCase();
        return name.includes(query) || lineage.includes(query) || occupation.includes(query);
    });

    const list = document.getElementById("npcSidebarList");
    if (list) {
        // Redraw list to ensure titles are in sync
        const cards = list.querySelectorAll(".map-list-card");
        filtered.forEach((npc, index) => {
            if (npc.id === activeNpc.id && cards[index]) {
                const titleStr = cards[index].querySelector("strong");
                const subtitleStr = cards[index].querySelector("span");
                if (titleStr) titleStr.textContent = npc.name;
                if (subtitleStr) subtitleStr.textContent = `${npc.lineage || "Unknown Lineage"} • ${npc.occupation || "No Role"}`;
                
                // Keep image thumbnail updated
                const imgEl = cards[index].querySelector("img");
                if (imgEl && npc.img) {
                    imgEl.src = npc.img;
                }
            }
        });
    }

    // Update other active views
    if (typeof renderInitiativeNpcList === "function") renderInitiativeNpcList();
    if (typeof renderMapNpcList === "function") renderMapNpcList();
}

function handleNpcImgUrlEntered(val) {
    updateActiveNpc('img', val);

    const preview = document.getElementById("npcEditImgPreview");
    const placeholder = document.getElementById("npcNoImageText");

    if (preview && placeholder) {
        if (val) {
            preview.src = val;
            preview.style.display = "block";
            placeholder.style.display = "none";
        } else {
            preview.src = "";
            preview.style.display = "none";
            placeholder.style.display = "block";
        }
    }
}

function handleNpcImageUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const base64Str = e.target.result;
            const urlInput = document.getElementById("npcEditImgUrlInput");
            if (urlInput) urlInput.value = base64Str;
            handleNpcImgUrlEntered(base64Str);
        };
        reader.readAsDataURL(file);
    }
}

function deleteActiveNpc() {
    const activeNpc = (state.npcs || []).find(n => n.id === state.activeNpcId);
    if (!activeNpc) return;

    openConfirmModal("Delete NPC?", `Are you sure you want to permanently delete "${activeNpc.name}" from your campaign records?`, () => {
        state.npcs = state.npcs.filter(n => n.id !== activeNpc.id);
        
        // Pick another active NPC if available, or empty
        if (state.npcs.length > 0) {
            state.activeNpcId = state.npcs[0].id;
        } else {
            state.activeNpcId = "";
        }
        
        saveState();
        renderNpcList();
        renderNpcDetails();

        // Update side views
        if (typeof renderInitiativeNpcList === "function") renderInitiativeNpcList();
        if (typeof renderMapNpcList === "function") renderMapNpcList();
    });
}

function loadNpcDirectory() {
    if (!state.npcs) {
        state.npcs = [];
    }
    renderNpcList();
    renderNpcDetails();
}

// ================= INITIATIVE TRACKER INTEGRATION =================

function toggleNpcPanel() {
    const panel = document.getElementById("initiativeNpcPanel");
    if (panel) {
        panel.classList.toggle("collapsed");
        // Collapse the other panel if opened
        if (!panel.classList.contains("collapsed")) {
            const partyPanel = document.getElementById("initiativePartyPanel");
            if (partyPanel) partyPanel.classList.add("collapsed");
        }
    }
}

function renderInitiativeNpcList() {
    const list = document.getElementById("initiativeNpcList");
    if (!list) return;
    list.innerHTML = "";

    const npcs = state.npcs || [];

    if (npcs.length === 0) {
        list.innerHTML = `
            <div style="text-align: center; padding: 24px; color: var(--text-muted); font-style: italic; font-size: 13px;">
                <span>No saved NPCs. Create some inside the NPC Directory tab view!</span>
            </div>
        `;
        return;
    }

    npcs.forEach(npc => {
        const div = document.createElement("div");
        div.className = "party-player-card";
        div.title = "Click to import NPC directly into the Initiative Tracker";
        div.onclick = () => importNpcToInitiative(npc.id);

        div.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 4px; overflow: hidden; flex: 1; align-items: flex-start; text-align: left;">
                <strong style="color: var(--tracker-text); font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%;">${npc.name}</strong>
                <span style="font-size: 11px; color: var(--text-muted); text-transform: uppercase; font-weight: 600;">${npc.lineage || "Unknown race"} | ${npc.occupation || "No Role"}</span>
                ${npc.personality ? `<span style="font-size: 10px; color: var(--text-muted); font-style: italic; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%;">${npc.personality}</span>` : ""}
            </div>
            <button class="init-action-btn" style="padding: 4px; background: var(--tracker-border); color: white; border-radius: 4px; flex-shrink: 0;" title="Import">
                <i data-lucide="plus" style="width: 14px; height: 14px;"></i>
            </button>
        `;
        list.appendChild(div);
    });

    if (window.lucide) lucide.createIcons();
}

function importNpcToInitiative(npcId) {
    const npc = state.npcs.find(n => n.id === npcId);
    if (!npc) return;

    const exists = initTrackerState.entities.some(e => e.name === npc.name);

    const doImport = (initVal) => {
        const npcHp = npc.hp !== undefined ? parseInt(npc.hp) : 10;
        const npcAc = npc.ac !== undefined ? parseInt(npc.ac) : 10;
        initTrackerState.entities.push({
            id: "init-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
            npcId: npc.id,
            name: npc.name,
            initiative: initVal,
            hp: npcHp,
            maxHp: npcHp,
            tempHp: 0,
            ac: npcAc,
            conditions: "",
            notes: npc.notes || npc.personality || "",
            spellSlots: Array.from({length: 9}, () => ({used: 0, total: 0})),
            expanded: false
        });
        sortInitiative();
    };

    if (exists) {
        openConfirmModal("Duplicate Character", `"${npc.name}" is already in the initiative order list. Do you want to import copy of them?`, () => {
            promptForInitiative(npc.name, doImport);
        });
    } else {
        promptForInitiative(npc.name, doImport);
    }
}

function importAllNpcsToInitiative() {
    const npcs = state.npcs || [];
    if (npcs.length === 0) {
        openConfirmModal("Directory Empty", "There are no saved NPCs inside your Directory page.", () => {});
        return;
    }

    let importedCount = 0;
    npcs.forEach(npc => {
        const exists = initTrackerState.entities.some(e => e.name === npc.name);
        if (!exists) {
            const npcHp = npc.hp !== undefined ? parseInt(npc.hp) : 10;
            const npcAc = npc.ac !== undefined ? parseInt(npc.ac) : 10;
            initTrackerState.entities.push({
                id: "init-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
                npcId: npc.id,
                name: npc.name,
                initiative: 0,
                hp: npcHp,
                maxHp: npcHp,
                tempHp: 0,
                ac: npcAc,
                conditions: "",
                notes: npc.notes || npc.personality || "",
                spellSlots: Array.from({length: 9}, () => ({used: 0, total: 0})),
                expanded: false
            });
            importedCount++;
        }
    });

    if (importedCount > 0) {
        sortInitiative();
    } else {
        openConfirmModal("All NPCs Present", "All NPCs in your saved Directory are already active inside the initiative tracker.", () => {});
    }
}
