// Campaign Settings & Party Management Logic

let newPlayerImgBase64 = "";

function handlePlayerImageUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            newPlayerImgBase64 = e.target.result;
            const preview = document.getElementById("newPlayerImgPreview");
            if (preview) {
                preview.src = newPlayerImgBase64;
                preview.style.display = "block";
            }
        };
        reader.readAsDataURL(file);
    }
}

function loadCampaignSettings() {
    document.getElementById("campaignNameInput").value = state.campaignName || "";
    document.getElementById("campaignGoalInput").value = state.campaignGoal || "";
    renderSettingsPlayers();
}

function updateCampaignDetails() {
    state.campaignName = document.getElementById("campaignNameInput").value;
    state.campaignGoal = document.getElementById("campaignGoalInput").value;
    saveState();
}

function saveNewPlayer() {
    const nameEl = document.getElementById("newPlayerName");
    const acEl = document.getElementById("newPlayerAc");
    const maxHpEl = document.getElementById("newPlayerMaxHp");
    const notesEl = document.getElementById("newPlayerNotes");
    const classEl = document.getElementById("newPlayerClass");
    const bgEl = document.getElementById("newPlayerBg");
    const levelEl = document.getElementById("newPlayerLevel");
    const expEl = document.getElementById("newPlayerExp");
    const imgUrlEl = document.getElementById("newPlayerImgUrl");

    const name = nameEl.value.trim();
    if (!name) {
        openConfirmModal("Name Required", "Please enter a name for the player character.", () => {});
        return;
    }

    const ac = acEl.value.trim() !== "" ? parseInt(acEl.value) : null;
    const maxHp = maxHpEl.value.trim() !== "" ? parseInt(maxHpEl.value) : null;
    const level = levelEl.value.trim() !== "" ? parseInt(levelEl.value) : null;
    const exp = expEl.value.trim() !== "" ? parseInt(expEl.value) : null;
    const notes = notesEl.value.trim();
    const pClass = classEl.value.trim();
    const background = bgEl.value.trim();
    
    // Prioritize base64 uploaded image, fallback to image URL
    const imgValue = newPlayerImgBase64 || imgUrlEl.value.trim() || "";

    const newPlayer = {
        id: "player-" + Date.now(),
        name: name,
        ac: ac,
        maxHp: maxHp,
        hp: maxHp, // starts at max
        level: level,
        exp: exp,
        class: pClass,
        background: background,
        img: imgValue,
        notes: notes || ""
    };

    state.party.push(newPlayer);
    saveState();

    // Reset inputs
    nameEl.value = "";
    acEl.value = "";
    maxHpEl.value = "";
    notesEl.value = "";
    classEl.value = "";
    bgEl.value = "";
    levelEl.value = "";
    expEl.value = "";
    imgUrlEl.value = "";
    newPlayerImgBase64 = "";
    
    const fileInput = document.getElementById("newPlayerImgFile");
    if (fileInput) fileInput.value = "";
    
    const preview = document.getElementById("newPlayerImgPreview");
    if (preview) {
        preview.src = "";
        preview.style.display = "none";
    }

    renderSettingsPlayers();
    
    // Also update initiative panel list if needed
    if (typeof renderInitiativePartyList === "function") {
        renderInitiativePartyList();
    }
    if (typeof renderMapPartyList === "function") {
        renderMapPartyList();
    }
}

function renderSettingsPlayers() {
    const list = document.getElementById("settingsPlayerList");
    if (!list) return;
    list.innerHTML = "";

    if (!state.party || state.party.length === 0) {
        list.innerHTML = `
            <div style="text-align: center; padding: 24px; color: var(--text-muted); font-style: italic; background: var(--tracker-bg); border: 1px dashed var(--border); border-radius: 10px;">
                <i data-lucide="shield" style="width: 24px; height: 24px; margin-bottom: 8px; color: var(--text-muted); opacity: 0.6;"></i>
                <p>No adventurers in your party yet. Add your player characters above!</p>
            </div>
        `;
        if (window.lucide) lucide.createIcons();
        return;
    }

    state.party.forEach(player => {
        const row = document.createElement("div");
        row.className = "init-row";
        row.style.padding = "20px";
        row.style.background = "var(--tracker-bg)";
        row.style.border = "1px solid var(--tracker-border)";
        row.style.borderRadius = "10px";
        row.style.display = "flex";
        row.style.flexDirection = "column";
        row.style.gap = "14px";

        const acVal = player.ac !== null && player.ac !== undefined ? player.ac : "";
        const maxHpVal = player.maxHp !== null && player.maxHp !== undefined ? player.maxHp : "";
        const hpVal = player.hp !== null && player.hp !== undefined ? player.hp : "";
        const lvlVal = player.level !== null && player.level !== undefined ? player.level : "";
        const expVal = player.exp !== null && player.exp !== undefined ? player.exp : "";

        row.innerHTML = `
            <div style="display: flex; gap: 16px; align-items: center; border-bottom: 1px solid var(--border); padding-bottom: 8px;">
                ${player.img ? `<img src="${player.img}" style="width: 48px; height: 48px; border-radius: 50%; object-fit: cover; border: 2px solid var(--tracker-border);" />` : `<div style="width: 48px; height: 48px; border-radius: 50%; background: var(--border); display: flex; align-items: center; justify-content: center; color: var(--text-muted); border: 2px solid var(--border);"><i data-lucide="user" style="width: 20px; height: 20px;"></i></div>`}
                <div style="flex: 1; display: flex; flex-direction: column; align-items: flex-start; text-align: left;">
                    <span style="font-weight: 700; font-size: 18px; color: var(--tracker-text);">${player.name}</span>
                    <span style="font-size: 12px; color: var(--text-muted);">${player.class || 'No Class'} | ${player.background || 'No Background'}</span>
                </div>
                <button class="init-delete" onclick="deletePlayer('${player.id}')" title="Remove Player" style="padding: 4px; border-radius: 6px; color: var(--danger); background: transparent; border: none; cursor: pointer;">
                    <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>
                </button>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px;">
                <div class="ce-field" style="margin-bottom: 0;">
                    <label style="font-size: 11px; font-weight: 700;">Level</label>
                    <input type="number" value="${lvlVal}" oninput="updatePlayer('${player.id}', 'level', this.value)" style="padding: 8px; border-radius: 6px; font-size: 14px;" placeholder="Lvl" />
                </div>
                <div class="ce-field" style="margin-bottom: 0;">
                    <label style="font-size: 11px; font-weight: 700;">EXP</label>
                    <input type="number" value="${expVal}" oninput="updatePlayer('${player.id}', 'exp', this.value)" style="padding: 8px; border-radius: 6px; font-size: 14px;" placeholder="EXP" />
                </div>
                <div class="ce-field" style="margin-bottom: 0;">
                    <label style="font-size: 11px; font-weight: 700;">Armor Class</label>
                    <input type="number" value="${acVal}" oninput="updatePlayer('${player.id}', 'ac', this.value)" style="padding: 8px; border-radius: 6px; font-size: 14px;" placeholder="AC" />
                </div>
                <div class="ce-field" style="margin-bottom: 0;">
                    <label style="font-size: 11px; font-weight: 700;">Max HP</label>
                    <input type="number" value="${maxHpVal}" oninput="updatePlayer('${player.id}', 'maxHp', this.value)" style="padding: 8px; border-radius: 6px; font-size: 14px;" placeholder="Max HP" />
                </div>
                <div class="ce-field" style="margin-bottom: 0;">
                    <label style="font-size: 11px; font-weight: 700;">Current HP</label>
                    <input type="number" value="${hpVal}" oninput="updatePlayer('${player.id}', 'hp', this.value)" style="padding: 8px; border-radius: 6px; font-size: 14px;" placeholder="Current HP" />
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                <div class="ce-field" style="margin-bottom: 0;">
                    <label style="font-size: 11px; font-weight: 700;">Class</label>
                    <input type="text" value="${player.class || ''}" oninput="updatePlayer('${player.id}', 'class', this.value)" style="padding: 8px; border-radius: 6px; font-size: 14px;" placeholder="e.g. Rogue" />
                </div>
                <div class="ce-field" style="margin-bottom: 0;">
                    <label style="font-size: 11px; font-weight: 700;">Background</label>
                    <input type="text" value="${player.background || ''}" oninput="updatePlayer('${player.id}', 'background', this.value)" style="padding: 8px; border-radius: 6px; font-size: 14px;" placeholder="e.g. Outlander" />
                </div>
            </div>

            <div class="ce-field" style="margin-bottom: 0;">
                <label style="font-size: 11px; font-weight: 700;">Avatar Image (URL)</label>
                <input type="text" value="${player.img || ''}" oninput="updatePlayer('${player.id}', 'img', this.value)" style="padding: 10px; border-radius: 6px; font-size: 14px; text-overflow: ellipsis;" placeholder="Image URL (e.g. https://...)" />
            </div>

            <div class="ce-field" style="margin-bottom: 0;">
                <label style="font-size: 11px; font-weight: 700;">Passive Stats / Reference Notes</label>
                <input type="text" value="${player.notes || ''}" oninput="updatePlayer('${player.id}', 'notes', this.value)" style="padding: 10px; border-radius: 6px; font-size: 14px;" placeholder="e.g. Passive Perception 14, Darkvision, Spell Save DC 15..." />
            </div>
        `;
        list.appendChild(row);
    });

    if (window.lucide) lucide.createIcons();
}

function updatePlayer(playerId, field, value) {
    const player = state.party.find(p => p.id === playerId);
    if (player) {
         if (['notes', 'class', 'background', 'img'].includes(field)) {
            player[field] = value;
        } else {
            player[field] = value === "" ? null : parseInt(value);
        }
        saveState();
        
        // Update initiative list panel if active
        if (typeof renderInitiativePartyList === "function") {
            renderInitiativePartyList();
        }
        if (typeof renderMapPartyList === "function") {
            renderMapPartyList();
        }
    }
}

function deletePlayer(playerId) {
    const player = state.party.find(p => p.id === playerId);
    if (!player) return;

    openConfirmModal("Delete Character?", `Are you sure you want to remove ${player.name} from the saved party?`, () => {
        state.party = state.party.filter(p => p.id !== playerId);
        saveState();
        renderSettingsPlayers();
        if (typeof renderInitiativePartyList === "function") {
            renderInitiativePartyList();
        }
        if (typeof renderMapPartyList === "function") {
            renderMapPartyList();
        }
    });
}
