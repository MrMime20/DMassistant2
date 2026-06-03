let initTrackerState = JSON.parse(localStorage.getItem("dma-initiative")) || {
    round: 1,
    activeId: null,
    entities: []
};

// Ensure backward compatibility
initTrackerState.entities.forEach(e => {
    if (e.maxHp === undefined) e.maxHp = e.hp;
    if (e.tempHp === undefined) e.tempHp = 0;
    if (e.conditions === undefined) e.conditions = "";
    if (e.notes === undefined) e.notes = "";
    if (e.spellSlots === undefined) e.spellSlots = Array.from({length: 9}, () => ({used: 0, total: 0}));
    if (e.expanded === undefined) e.expanded = false;
});

function saveInitTracker() {
    localStorage.setItem("dma-initiative", JSON.stringify(initTrackerState));
    renderInitiative();
}

function addInitiativeEntity() {
    const nameEl = document.getElementById("initName");
    const valEl = document.getElementById("initVal");
    const hpEl = document.getElementById("initHp");
    const acEl = document.getElementById("initAc");
    const qtyEl = document.getElementById("initQty");

    const name = nameEl.value.trim() || "Unknown Creature";
    const val = parseInt(valEl.value) || 0;
    const hp = hpEl.value.trim() !== "" ? parseInt(hpEl.value) : null;
    const ac = acEl.value.trim() !== "" ? parseInt(acEl.value) : null;
    const qty = parseInt(qtyEl.value) || 1;

    for (let i = 0; i < qty; i++) {
        const suffix = qty > 1 ? ` #${i+1}` : "";
        initTrackerState.entities.push({
            id: "init-" + Date.now() + "-" + i,
            name: name + suffix,
            initiative: val,
            hp: hp,
            maxHp: hp,
            tempHp: 0,
            ac: ac,
            conditions: "",
            notes: "",
            spellSlots: Array.from({length: 9}, () => ({used: 0, total: 0})),
            expanded: false
        });
    }

    sortInitiative();
    
    nameEl.value = ""; valEl.value = ""; hpEl.value = ""; acEl.value = ""; qtyEl.value = "1";
    nameEl.focus();
}

function sortInitiative() {
    initTrackerState.entities.sort((a, b) => b.initiative - a.initiative);
    saveInitTracker();
}

function removeInitiativeEntity(id) {
    initTrackerState.entities = initTrackerState.entities.filter(e => e.id !== id);
    if (initTrackerState.activeId === id) initTrackerState.activeId = null;
    saveInitTracker();
}

function updateEntityStat(id, field, value) {
    const entity = initTrackerState.entities.find(e => e.id === id);
    if (entity) {
        if (field === 'conditions' || field === 'notes') {
            entity[field] = value;
        } else {
            entity[field] = value === "" ? null : parseInt(value);
        }
        saveInitTracker();
    }
}

function updateInitiative(id, value) {
    updateEntityStat(id, 'initiative', value);
    sortInitiative();
}

function updateSpellSlot(id, levelIndex, type, value) {
    const entity = initTrackerState.entities.find(e => e.id === id);
    if(entity) {
        entity.spellSlots[levelIndex][type] = parseInt(value) || 0;
        saveInitTracker();
    }
}

function adjustHp(id, adjustStr) {
    const entity = initTrackerState.entities.find(e => e.id === id);
    if (!entity || !adjustStr.trim() || entity.hp === null) return;

    let diff = parseInt(adjustStr);
    if (isNaN(diff)) return;

    if (diff < 0) {
        let dmg = Math.abs(diff);
        if (entity.tempHp !== null && entity.tempHp > 0) {
            if (entity.tempHp >= dmg) {
                entity.tempHp -= dmg;
                dmg = 0;
            } else {
                dmg -= entity.tempHp;
                entity.tempHp = 0;
            }
        }
        entity.hp = Math.max(0, entity.hp - dmg);
    } else {
        entity.hp = entity.hp + diff;
        if (entity.maxHp !== null && entity.hp > entity.maxHp) {
            entity.hp = entity.maxHp;
        }
    }
    saveInitTracker();
}

function toggleExpand(id) {
    const entity = initTrackerState.entities.find(e => e.id === id);
    if (entity) {
        entity.expanded = !entity.expanded;
        saveInitTracker();
    }
}

function nextTurn() {
    if (initTrackerState.entities.length === 0) return;

    let currentIndex = initTrackerState.entities.findIndex(e => e.id === initTrackerState.activeId);
    
    if (currentIndex === -1 || currentIndex === initTrackerState.entities.length - 1) {
        initTrackerState.activeId = initTrackerState.entities[0].id;
        if (currentIndex !== -1) initTrackerState.round++;
    } else {
        initTrackerState.activeId = initTrackerState.entities[currentIndex + 1].id;
    }
    
    saveInitTracker();
}

function endEncounter() {
    openConfirmModal("End Encounter?", "This will clear all creatures from the tracker and reset the round back to 1.", () => {
        initTrackerState.entities = [];
        initTrackerState.round = 1;
        initTrackerState.activeId = null;
        saveInitTracker();
    });
}

function renderInitiative() {
    const list = document.getElementById("initiativeList");
    list.innerHTML = "";

    document.getElementById("initCount").textContent = initTrackerState.entities.length;
    document.getElementById("initRound").textContent = initTrackerState.round;
    
    // TimeElapsed calculation: each round beyond round 1 represents 6 seconds 
    const timeElapsed = initTrackerState.entities.length > 0 ? Math.max(0, (initTrackerState.round - 1) * 6) : 0;
    document.getElementById("initTime").textContent = timeElapsed + "s";

    let activeEntity = initTrackerState.entities.find(e => e.id === initTrackerState.activeId);
    document.getElementById("initTurnName").textContent = activeEntity ? activeEntity.name : "None";

    initTrackerState.entities.forEach(entity => {
        const isActive = entity.id === initTrackerState.activeId;
        const row = document.createElement("div");
        row.className = `init-row ${isActive ? 'active-turn' : ''}`;

        const hpStr = entity.hp !== null ? entity.hp : "";
        const acStr = entity.ac !== null ? entity.ac : "";

        let html = `
            <div class="init-row-main">
                <div class="init-row-left" onclick="toggleExpand('${entity.id}')" style="cursor:pointer; flex:1">
                    <div class="init-row-name">
                        <i data-lucide="${entity.expanded ? 'chevron-down' : 'chevron-right'}" style="width:18px; margin-right:8px; color:var(--text-muted)"></i> 
                        ${entity.name}
                    </div>
                    <div class="init-row-stats">
                        <span>${entity.conditions ? '<i data-lucide="alert-circle" style="width:14px; margin-right:4px; vertical-align:middle;"></i>' + entity.conditions : 'Healthy'}</span>
                    </div>
                </div>
                <div class="init-row-right">
                    <div class="init-val-box">
                        <label>INIT</label>
                        <input type="number" value="${entity.initiative}" onchange="updateInitiative('${entity.id}', this.value)" title="Edit Initiative" />
                    </div>
                    <div class="init-val-box">
                        <label>HP</label>
                        <input type="number" value="${hpStr}" onchange="updateEntityStat('${entity.id}', 'hp', this.value)" />
                    </div>
                    <div class="init-val-box">
                        <label>AC</label>
                        <input type="number" value="${acStr}" onchange="updateEntityStat('${entity.id}', 'ac', this.value)" />
                    </div>
                    <button class="init-delete" onclick="removeInitiativeEntity('${entity.id}')" title="Remove"><i data-lucide="trash-2"></i></button>
                </div>
            </div>
        `;

        if (entity.expanded) {
            let spellSlotsHtml = '';
            for(let i=0; i<9; i++) {
                spellSlotsHtml += `
                    <div class="spell-slot-box">
                        <label>Lvl ${i+1}</label>
                        <div class="spell-inputs">
                            <input type="number" value="${entity.spellSlots[i].used}" onchange="updateSpellSlot('${entity.id}', ${i}, 'used', this.value)" title="Used Slots" />
                            <span>/</span>
                            <input type="number" value="${entity.spellSlots[i].total}" onchange="updateSpellSlot('${entity.id}', ${i}, 'total', this.value)" title="Total Slots" />
                        </div>
                    </div>
                `;
            }

            html += `
                <div class="init-expanded">
                    <div class="init-exp-row">
                        <div class="init-exp-section">
                            <div class="init-exp-section-title">Health Tracking</div>
                            <div class="init-exp-grid">
                                <div class="init-exp-col">
                                    <label>Modify HP (+/-)</label>
                                    <input type="text" placeholder="+5 or -3" onchange="adjustHp('${entity.id}', this.value); this.value='';" title="Type a + or - number to adjust HP automatically." />
                                </div>
                                <div class="init-exp-col">
                                    <label>Max HP</label>
                                    <input type="number" value="${entity.maxHp !== null ? entity.maxHp : ''}" onchange="updateEntityStat('${entity.id}', 'maxHp', this.value)" />
                                </div>
                                <div class="init-exp-col">
                                    <label>Temp HP</label>
                                    <input type="number" value="${entity.tempHp !== null ? entity.tempHp : ''}" onchange="updateEntityStat('${entity.id}', 'tempHp', this.value)" />
                                </div>
                            </div>
                        </div>
                        <div class="init-exp-section">
                            <div class="init-exp-section-title">Status & Details</div>
                            <div class="init-exp-full">
                                <label>Conditions</label>
                                <input type="text" value="${entity.conditions || ''}" onchange="updateEntityStat('${entity.id}', 'conditions', this.value)" placeholder="e.g., Poisoned, Prone, Frightened..." />
                            </div>
                            <div class="init-exp-full">
                                <label>Notes</label>
                                <textarea onchange="updateEntityStat('${entity.id}', 'notes', this.value)" placeholder="Tactics, resistances, active spells...">${entity.notes || ''}</textarea>
                            </div>
                        </div>
                    </div>
                    <div class="init-exp-section">
                        <div class="init-exp-section-title">Spell Slots (Used / Total)</div>
                        <div class="spell-tracker-grid">
                            ${spellSlotsHtml}
                        </div>
                    </div>
                </div>
            `;
        }

        row.innerHTML = html;
        list.appendChild(row);
    });

    if (window.lucide) lucide.createIcons();
}

// Saved Party Import Logic
function togglePartyPanel() {
    const panel = document.getElementById("initiativePartyPanel");
    if (panel) {
        panel.classList.toggle("collapsed");
    }
}

function renderInitiativePartyList() {
    const list = document.getElementById("initiativePartyList");
    if (!list) return;
    list.innerHTML = "";

    const party = (typeof state !== 'undefined' && state && state.party) ? state.party : [];

    if (party.length === 0) {
        list.innerHTML = `
            <div style="text-align: center; padding: 24px; color: var(--text-muted); font-style: italic; font-size: 13px;">
                <span>No saved party players. You can create saved adventurers in Campaign Settings.</span>
            </div>
        `;
        return;
    }

    party.forEach(player => {
        const div = document.createElement("div");
        div.className = "party-player-card";
        div.title = "Click to import to Initiative Tracker";
        div.onclick = () => importPlayerToInitiative(player.id);

        const acStr = player.ac !== null ? `AC: ${player.ac}` : "AC: --";
        const hpStr = player.maxHp !== null ? `HP: ${player.hp}/${player.maxHp}` : "HP: --";

        div.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 4px; overflow: hidden; flex: 1; align-items: flex-start; text-align: left;">
                <strong style="color: var(--tracker-text); font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%;">${player.name}</strong>
                <span style="font-size: 11px; color: var(--text-muted); text-transform: uppercase; font-weight: 600;">${acStr} | ${hpStr}</span>
                ${player.notes ? `<span style="font-size: 11px; color: var(--text-muted); font-style: italic; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%;">${player.notes}</span>` : ""}
            </div>
            <button class="init-action-btn" style="padding: 4px; background: var(--tracker-border); color: white; border-radius: 4px; flex-shrink: 0;" title="Import">
                <i data-lucide="plus" style="width: 14px; height: 14px;"></i>
            </button>
        `;
        list.appendChild(div);
    });

    if (window.lucide) lucide.createIcons();
}

function promptForInitiative(name, callback) {
    if (typeof openPromptModal === "function") {
        openPromptModal("Initiative Roll", `Enter initiative roll for ${name}:`, "10", (val) => {
            const initVal = parseInt(val) || 0;
            callback(initVal);
        });
    } else {
        callback(0);
    }
}

function importPlayerToInitiative(playerId) {
    const player = state.party.find(p => p.id === playerId);
    if (!player) return;

    const exists = initTrackerState.entities.some(e => e.name === player.name);
    
    const doImport = (initVal) => {
        initTrackerState.entities.push({
            id: "init-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
            name: player.name,
            initiative: initVal,
            hp: player.hp !== null ? player.hp : player.maxHp,
            maxHp: player.maxHp,
            tempHp: 0,
            ac: player.ac,
            conditions: "",
            notes: player.notes || "",
            spellSlots: Array.from({length: 9}, () => ({used: 0, total: 0})),
            expanded: false
        });
        sortInitiative();
    };

    if (exists) {
        openConfirmModal("Duplicate Character", `${player.name} is already in the initiative order. Do you want to import them again?`, () => {
            promptForInitiative(player.name, doImport);
        });
    } else {
        promptForInitiative(player.name, doImport);
    }
}

function importAllPlayersToInitiative() {
    const party = (typeof state !== 'undefined' && state && state.party) ? state.party : [];
    if (party.length === 0) {
        openConfirmModal("Party Empty", "There are no players in your saved party. Go to the Campaign Settings tab to save players.", () => {});
        return;
    }

    let importedCount = 0;
    party.forEach(player => {
        const exists = initTrackerState.entities.some(e => e.name === player.name);
        if (!exists) {
            initTrackerState.entities.push({
                id: "init-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
                name: player.name,
                initiative: 0,
                hp: player.hp !== null ? player.hp : player.maxHp,
                maxHp: player.maxHp,
                tempHp: 0,
                ac: player.ac,
                conditions: "",
                notes: player.notes || "",
                spellSlots: Array.from({length: 9}, () => ({used: 0, total: 0})),
                expanded: false
            });
            importedCount++;
        }
    });

    if (importedCount > 0) {
        sortInitiative();
    } else {
        openConfirmModal("All Players Present", "All players in your saved party are already in the initiative tracker.", () => {});
    }
}

renderInitiative();
renderInitiativePartyList();
if (typeof renderInitiativeNpcList === "function") {
    renderInitiativeNpcList();
}
