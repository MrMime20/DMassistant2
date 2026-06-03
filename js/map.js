// Tactical Interactive Map & Miniature Tokens Engine

// Ensure state collections are declared for maps
if (!state.maps) state.maps = [];
if (state.activeMapId === undefined) state.activeMapId = null;

let selectedMovingTokenId = null;
let mapUploadBase64 = "";
let isDrawingFog = false;
let mapTool = 'move'; // 'move', 'brush', 'eraser'
function adjustMapZoom(delta) {
    const activeMap = getActiveMap();
    if (!activeMap) return;
    activeMap.zoom = Math.max(0.4, Math.min(3.0, (activeMap.zoom || 1.0) + delta));
    saveState();
    applyMapZoom();
}

function resetMapZoom() {
    const activeMap = getActiveMap();
    if (!activeMap) return;
    activeMap.zoom = 1.0;
    saveState();
    applyMapZoom();
}

function applyMapZoom() {
    const activeMap = getActiveMap();
    const zoom = activeMap ? (activeMap.zoom || 1.0) : 1.0;

    const container = document.getElementById("mapViewportContainer");
    if (!container) return;
    container.style.transform = `scale(${zoom})`;
    container.style.transformOrigin = "center center";

    const label = document.getElementById("mapZoomLabel");
    if (label) {
        label.textContent = `${Math.round(zoom * 100)}%`;
    }
}

// Pre-populate realistic battle maps on first boot if list is blank
if (state.maps.length === 0) {
    state.maps = [
        {
            id: "map-default-1",
            name: "Lich King's Dragon Sanctum",
            url: "https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?auto=format&fit=crop&q=80&w=1200", // Dark stars map theme
            tokens: [],
            fogData: null
        },
        {
            id: "map-default-2",
            name: "Whispering Druid glade (Misty)",
            url: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&q=80&w=1200", // Primeval pine forest topdown
            tokens: [],
            fogData: null
        }
    ];
    state.activeMapId = "map-default-1";
    saveState();
}

function getActiveMap() {
    if (!state.maps) return null;
    return state.maps.find(m => m.id === state.activeMapId) || null;
}

function loadMapEngine() {
    renderMapLibraryList();
    renderMapPartyList();
    if (typeof renderMapNpcList === "function") {
        renderMapNpcList();
    }

    const activeMap = getActiveMap();
    const viewport = document.getElementById("mapViewportContainer");
    const emptyMsg = document.getElementById("mapEmptyMessage");
    const displayImg = document.getElementById("mapDisplayImage");

    if (activeMap) {
        if (emptyMsg) emptyMsg.style.display = "none";
        if (viewport) viewport.style.display = "block";
        
        if (displayImg) {
            if (displayImg.src !== activeMap.url) {
                // Flash clear to prevent overlay glitch while loading
                const canvas = document.getElementById("mapFogCanvas");
                if (canvas) {
                    const ctx = canvas.getContext("2d");
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                }
                displayImg.src = activeMap.url;
            } else {
                handleMapImageLoaded();
            }
        }
    } else {
        if (viewport) viewport.style.display = "none";
        if (emptyMsg) emptyMsg.style.display = "block";
    }

    applyMapZoom();

    if (window.lucide) lucide.createIcons();
}

function handleMapImageLoaded() {
    resizeFogCanvas();
    renderMapTokens();
}

// Keep the fog canvas pixel resolutions perfectly matching layout bounds dynamically
function resizeFogCanvas() {
    const canvas = document.getElementById("mapFogCanvas");
    const img = document.getElementById("mapDisplayImage");
    if (!canvas || !img || !img.complete || img.naturalWidth === 0) return;

    const w = img.clientWidth;
    const h = img.clientHeight;

    if (w === 0 || h === 0) return;

    // Cache context state
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext("2d");
    tempCtx.drawImage(canvas, 0, 0);

    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext("2d");
    const activeMap = getActiveMap();

    if (activeMap && activeMap.fogData) {
        const savedFogImg = new Image();
        savedFogImg.onload = function() {
            ctx.clearRect(0, 0, w, h);
            ctx.drawImage(savedFogImg, 0, 0, w, h);
        };
        savedFogImg.src = activeMap.fogData;
    } else {
        ctx.clearRect(0, 0, w, h);
        if (tempCanvas.width > 0 && tempCanvas.height > 0) {
            ctx.drawImage(tempCanvas, 0, 0, w, h);
        }
    }
}

// Recalculate if DMs drag coordinates manually or change system views
window.addEventListener("resize", () => {
    resizeFogCanvas();
});

// Sidebar Collapsible layouts
function toggleMapSidebar() {
    const panel = document.getElementById("mapSidebarPanel");
    if (panel) {
        panel.classList.toggle("collapsed");
        if (!panel.classList.contains("collapsed")) {
            const npcPanel = document.getElementById("mapNpcSidebarPanel");
            if (npcPanel) npcPanel.classList.add("collapsed");
        }
        setTimeout(() => {
            resizeFogCanvas();
        }, 320);
    }
}

function setMapSidebarTab(tabName) {
    const mapSec = document.getElementById("mapSidebarSecMaps");
    const tokenSec = document.getElementById("mapSidebarSecTokens");
    if (mapSec) mapSec.style.display = tabName === 'maps' ? "flex" : "none";
    if (tokenSec) tokenSec.style.display = tabName === 'tokens' ? "flex" : "none";

    const mapsBtn = document.getElementById("mapSidebarTabMapsBtn");
    const tokensBtn = document.getElementById("mapSidebarTabTokensBtn");

    if (mapsBtn && tokensBtn) {
        if (tabName === 'maps') {
            mapsBtn.style.color = "var(--text)";
            mapsBtn.style.borderBottomColor = "var(--accent)";
            tokensBtn.style.color = "var(--text-muted)";
            tokensBtn.style.borderBottomColor = "transparent";
        } else {
            mapsBtn.style.color = "var(--text-muted)";
            mapsBtn.style.borderBottomColor = "transparent";
            tokensBtn.style.color = "var(--text)";
            tokensBtn.style.borderBottomColor = "var(--accent)";
        }
    }
}

// Maps Library configuration
function handleMapFileSelected(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById("mapUploadPreview");
            if (preview) {
                preview.src = e.target.result;
                preview.style.display = "block";
            }
            mapUploadBase64 = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

function saveNewMap() {
    const nameEl = document.getElementById("mapUploadName");
    const urlEl = document.getElementById("mapUploadUrl");

    const name = nameEl.value.trim() || ("Tactical Layout " + (state.maps.length + 1));
    const url = mapUploadBase64 || urlEl.value.trim();

    if (!url) {
        openConfirmModal("Image Source Required", "Please provide either an image URL link or load an image file from disk.", () => {});
        return;
    }

    const newMap = {
        id: "map-" + Date.now(),
        name: name,
        url: url,
        tokens: [],
        fogData: null
    };

    if (!state.maps) state.maps = [];
    state.maps.push(newMap);
    state.activeMapId = newMap.id;
    saveState();

    // Reset Form
    nameEl.value = "";
    urlEl.value = "";
    
    const fileEl = document.getElementById("mapUploadFile");
    if (fileEl) fileEl.value = "";

    const preview = document.getElementById("mapUploadPreview");
    if (preview) {
        preview.src = "";
        preview.style.display = "none";
    }
    mapUploadBase64 = "";

    loadMapEngine();
}

function switchActiveMap(mapId) {
    cancelCurrentTokenMovement();
    state.activeMapId = mapId || null;
    saveState();
    loadMapEngine();
}

function deleteMap(mapId, event) {
    if (event) event.stopPropagation();

    const map = state.maps.find(m => m.id === mapId);
    if (!map) return;

    openConfirmModal("Delete Tactical Layout?", `Are you sure you want to completely erase "${map.name}" from your active libraries?`, () => {
        state.maps = state.maps.filter(m => m.id !== mapId);
        if (state.activeMapId === mapId) {
            state.activeMapId = state.maps.length > 0 ? state.maps[0].id : null;
        }
        saveState();
        loadMapEngine();
    });
}

function renderMapLibraryList() {
    const list = document.getElementById("mapLibraryList");
    const activeSelector = document.getElementById("mapActiveSelector");
    if (!list || !activeSelector) return;

    list.innerHTML = "";
    activeSelector.innerHTML = '<option value="">-- Select Map --</option>';

    if (!state.maps) state.maps = [];

    const searchInput = document.getElementById("mapLibrarySearchInput");
    const query = searchInput ? searchInput.value.toLowerCase().trim() : "";

    state.maps.forEach(m => {
        const opt = document.createElement("option");
        opt.value = m.id;
        opt.textContent = m.name;
        if (state.activeMapId === m.id) {
            opt.selected = true;
        }
        activeSelector.appendChild(opt);

        // Filter out if query is set and doesn't match name
        if (query && !m.name.toLowerCase().includes(query)) {
            return;
        }

        const card = document.createElement("div");
        card.className = "map-list-card";
        if (state.activeMapId === m.id) {
            card.classList.add("active");
        }

        const counts = m.tokens ? m.tokens.length : 0;

        card.innerHTML = `
            <div style="flex: 1; display: flex; flex-direction: column; gap: 4px; overflow: hidden; align-items: flex-start; text-align: left;" onclick="switchActiveMap('${m.id}')">
                <strong style="color: var(--tracker-text); font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%;">${m.name}</strong>
                <span style="font-size: 10px; color: var(--text-muted); display: flex; align-items: center; gap: 4px;">
                    <i data-lucide="users" style="width:10px; height:10px;"></i> ${counts} active miniatures
                </span>
            </div>
            <button class="init-delete" onclick="deleteMap('${m.id}', event)" title="Erase Layout" style="padding: 4px; color: var(--danger); background: transparent; border: none; cursor: pointer;">
                <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
            </button>
        `;
        list.appendChild(card);
    });

    if (window.lucide) lucide.createIcons();
}

// Miniature Tokens Renderer
function renderMapTokens() {
    const container = document.getElementById("mapTokensContainer");
    if (!container) return;
    container.innerHTML = "";

    // Crucial bugfix: enable click event interception only when a token is currently being moved
    if (selectedMovingTokenId !== null) {
        container.style.pointerEvents = "auto";
    } else {
        container.style.pointerEvents = "none";
    }

    const activeMap = getActiveMap();
    if (!activeMap || !activeMap.tokens) return;

    activeMap.tokens.forEach(token => {
        const tokenDiv = document.createElement("div");
        tokenDiv.className = "map-token";
        if (selectedMovingTokenId === token.id) {
            tokenDiv.classList.add("active-moving");
        }

        // Apply visual properties
        tokenDiv.style.left = `${token.x * 100}%`;
        tokenDiv.style.top = `${token.y * 100}%`;
        tokenDiv.style.width = `${token.size || 7}%`;
        tokenDiv.style.opacity = `${(token.opacity || 100) / 100}`;
        tokenDiv.style.transform = `translate(-50%, -50%) rotate(${token.rotation || 0}deg)`;
        tokenDiv.style.borderColor = token.color || "#3b82f6";

        // Display pre-loaded image or letters/emoji base
        let innerContent = "";
        if (token.img) {
            tokenDiv.style.backgroundImage = `url(${token.img})`;
            tokenDiv.style.backgroundColor = "transparent";
        } else {
            tokenDiv.style.backgroundImage = "none";
            tokenDiv.style.backgroundColor = "var(--card-bg)";
            innerContent = `<span style="pointer-events: none; font-size: 35cqw; font-weight: 800;">${token.symbol || token.name.substring(0, 1)}</span>`;
        }

        // Append high-contrast, self-righting nameplate underneath token
        innerContent += `
            <div class="map-token-name" style="position: absolute; bottom: -28cqw; left: 50%; transform: translateX(-50%) rotate(${-token.rotation || 0}deg); font-size: 16cqw; font-weight: 700; color: white; background: rgba(0, 0, 0, 0.85); padding: 1.5cqw 8cqw; border-radius: 6cqw; white-space: nowrap; pointer-events: none; border: 1px solid rgba(255, 255, 255, 0.2); box-shadow: 0 1px 3px rgba(0, 0, 0, 0.5); z-index: 10;">
                ${token.name}
            </div>
        `;
        tokenDiv.innerHTML = innerContent;

        tokenDiv.title = `Token: ${token.name} (Click to Move / Edit)`;

        tokenDiv.onclick = (event) => {
            event.stopPropagation();
            handleTokenClicked(token.id);
        };

        container.appendChild(tokenDiv);
    });
}

function handleTokenClicked(tokenId) {
    const activeMap = getActiveMap();
    if (!activeMap) return;

    const token = activeMap.tokens.find(t => t.id === tokenId);
    if (!token) return;

    if (selectedMovingTokenId === tokenId) {
        cancelCurrentTokenMovement();
    } else {
        selectedMovingTokenId = tokenId;

        // Show status banner
        const banner = document.getElementById("mapMovementBanner");
        const bannerTxt = document.getElementById("mapMovementBannerText");
        if (banner && bannerTxt) {
            bannerTxt.textContent = `Moving "${token.name}". Click anywhere on map to move, click token to end.`;
            banner.style.display = "flex";
        }

        // Open edit panel in sidebar
        setMapSidebarTab('tokens');
        const panel = document.getElementById("mapSelectedTokenPanel");
        if (panel) {
            panel.style.display = "flex";
            document.getElementById("tokenEditSize").value = token.size || 7;
            document.getElementById("tokenEditRotation").value = token.rotation || 0;
            document.getElementById("tokenEditOpacity").value = token.opacity || 100;
            document.getElementById("tokenEditColor").value = token.color || "#3b82f6";
        }

        renderMapTokens();
    }
}

// Click place token translation on map viewport
function handleTokensLayerClick(event) {
    if (selectedMovingTokenId === null) return;

    const container = document.getElementById("mapTokensContainer");
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    const x = Math.max(0, Math.min(1, clickX / rect.width));
    const y = Math.max(0, Math.min(1, clickY / rect.height));

    const activeMap = getActiveMap();
    if (activeMap) {
        const token = activeMap.tokens.find(t => t.id === selectedMovingTokenId);
        if (token) {
            token.x = x;
            token.y = y;
            saveState();
            renderMapTokens();
        }
    }
}

function cancelCurrentTokenMovement() {
    selectedMovingTokenId = null;
    const banner = document.getElementById("mapMovementBanner");
    if (banner) banner.style.display = "none";

    const panel = document.getElementById("mapSelectedTokenPanel");
    if (panel) panel.style.display = "none";

    renderMapTokens();
}

function updateActiveTokenAttr(field, val) {
    if (selectedMovingTokenId === null) return;
    const activeMap = getActiveMap();
    if (!activeMap) return;

    const token = activeMap.tokens.find(t => t.id === selectedMovingTokenId);
    if (token) {
        if (field === 'color') {
            token.color = val;
        } else {
            token[field] = parseInt(val) || 0;
        }
        saveState();
        renderMapTokens();
    }
}

function handleDeleteActiveToken() {
    if (selectedMovingTokenId === null) return;
    const activeMap = getActiveMap();
    if (!activeMap) return;

    const token = activeMap.tokens.find(t => t.id === selectedMovingTokenId);
    if (!token) return;

    openConfirmModal("Delete Token?", `Erase the token of "${token.name}" from active map?`, () => {
        activeMap.tokens = activeMap.tokens.filter(t => t.id !== selectedMovingTokenId);
        saveState();
        cancelCurrentTokenMovement();
    });
}

function saveCustomMapToken() {
    const activeMap = getActiveMap();
    if (!activeMap) {
        openConfirmModal("Select Map First", "Please select or create an active map before editing tokens.", () => {});
        return;
    }

    const nameEl = document.getElementById("tokenGenName");
    const symbolEl = document.getElementById("tokenGenSymbol");
    const sizeEl = document.getElementById("tokenGenSize");
    const colorEl = document.getElementById("tokenGenColor");
    const rotationEl = document.getElementById("tokenGenRotation");
    const opacityEl = document.getElementById("tokenGenOpacity");

    const name = nameEl.value.trim() || "Minion";
    const symbol = symbolEl.value.trim() || name.substring(0, 1);
    const size = parseInt(sizeEl.value) || 7;
    const color = colorEl.value || "#ef4444";
    const rotation = parseInt(rotationEl.value) || 0;
    const opacity = parseInt(opacityEl.value) || 100;

    const newToken = {
        id: "token-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
        name: name,
        symbol: symbol,
        color: color,
        x: 0.5,
        y: 0.5,
        size: size,
        rotation: rotation,
        opacity: opacity,
        img: ""
    };

    if (!activeMap.tokens) activeMap.tokens = [];
    activeMap.tokens.push(newToken);
    saveState();

    nameEl.value = "";
    symbolEl.value = "";

    renderMapTokens();
    handleTokenClicked(newToken.id);
}

// Saved Party Quick Miniature imports
function renderMapPartyList() {
    const list = document.getElementById("mapPartyMembersList");
    if (!list) return;

    list.innerHTML = "";
    const party = (typeof state !== 'undefined' && state && state.party) ? state.party : [];

    if (party.length === 0) {
        list.innerHTML = `
            <div style="text-align: center; padding: 16px; color: var(--text-muted); font-style: italic; font-size: 12px;">
                <span>No saved party adventurers. Save characters in Campaign Settings first.</span>
            </div>
        `;
        return;
    }

    party.forEach(player => {
        const item = document.createElement("div");
        item.className = "party-player-card";
        item.style.padding = "10px";
        item.title = "Click to import player character token";
        item.onclick = () => importPartyMemberAsToken(player.id);

        const imgHtml = player.img ? `<img src="${player.img}" style="width: 28px; height: 28px; border-radius: 50%; object-fit: cover; border: 1px solid var(--tracker-border);" />` : `<div style="width: 28px; height: 28px; border-radius: 50%; background: var(--border); display: flex; align-items: center; justify-content: center; color: var(--text-muted); border: 1px solid var(--border); font-size: 11px;"><i data-lucide="user" style="width:12px; height:12px;"></i></div>`;

        item.innerHTML = `
            <div style="display: flex; gap: 10px; align-items: center; overflow: hidden; flex: 1;">
                ${imgHtml}
                <div style="display: flex; flex-direction: column; overflow: hidden; align-items: flex-start; text-align: left;">
                    <strong style="color: var(--tracker-text); font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%;">${player.name}</strong>
                    <span style="font-size: 10px; color: var(--text-muted); text-transform: uppercase;">${player.class || "Level " + (player.level || 1)}</span>
                </div>
            </div>
            <button class="init-action-btn" style="padding: 4px; background: var(--tracker-border); color: white; border-radius: 4px; flex-shrink: 0;" title="Import Miniature">
                <i data-lucide="plus" style="width: 12px; height: 12px;"></i>
            </button>
        `;
        list.appendChild(item);
    });

    if (window.lucide) lucide.createIcons();
}

function importPartyMemberAsToken(playerId) {
    const activeMap = getActiveMap();
    if (!activeMap) {
        openConfirmModal("Select Map First", "Please select or create an active map before importing party members.", () => {});
        return;
    }

    const player = state.party.find(p => p.id === playerId);
    if (!player) return;

    const exists = activeMap.tokens && activeMap.tokens.some(t => t.playerId === playerId);

    const doImport = () => {
        const newToken = {
            id: "token-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
            playerId: player.id,
            name: player.name,
            symbol: player.name.substring(0, 1),
            color: "#3b82f6", // Clean blue boundary preset for player units
            x: 0.5,
            y: 0.5,
            size: 7,
            rotation: 0,
            opacity: 100,
            img: player.img || ""
        };

        if (!activeMap.tokens) activeMap.tokens = [];
        activeMap.tokens.push(newToken);
        saveState();
        renderMapTokens();
        handleTokenClicked(newToken.id);
    };

    if (exists) {
        openConfirmModal("Token Already Placed", `${player.name} has a token layout already on this map. Do you want to spawn a replica on this canvas?`, () => {
            doImport();
        });
    } else {
        doImport();
    }
}

// Fog of War drawing coordinates strokes
function handleFogCanvasMouseDown(event) {
    if (mapTool !== 'brush' && mapTool !== 'eraser') return;
    isDrawingFog = true;
    drawFogStroke(event);
}

function handleFogCanvasMouseMove(event) {
    if (!isDrawingFog) return;
    drawFogStroke(event);
}

function handleFogCanvasMouseUp(event) {
    if (!isDrawingFog) return;
    isDrawingFog = false;

    const canvas = document.getElementById("mapFogCanvas");
    const activeMap = getActiveMap();
    if (canvas && activeMap) {
        activeMap.fogData = canvas.toDataURL("image/png");
        saveState();
    }
}

function drawFogStroke(event) {
    const canvas = document.getElementById("mapFogCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const rect = canvas.getBoundingClientRect();
    
    // Zoom-proof screen coordinate mapping
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;
    
    const x = (clickX / rect.width) * canvas.width;
    const y = (clickY / rect.height) * canvas.height;

    const sizeInput = document.getElementById("fogBrushSize");
    const size = sizeInput ? parseInt(sizeInput.value) : 30;

    ctx.beginPath();

    // Create custom smooth radial gradient brush for perfect feathered soft edges
    const grad = ctx.createRadialGradient(x, y, size * 0.1, x, y, size);

    if (mapTool === 'brush') {
        ctx.globalCompositeOperation = "source-over";
        grad.addColorStop(0, "rgba(0, 0, 0, 1.0)");
        grad.addColorStop(0.4, "rgba(0, 0, 0, 0.85)");
        grad.addColorStop(1, "rgba(0, 0, 0, 0.0)");
        ctx.fillStyle = grad;
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    } else if (mapTool === 'eraser') {
        ctx.globalCompositeOperation = "destination-out";
        grad.addColorStop(0, "rgba(0, 0, 0, 1.0)");
        grad.addColorStop(0.5, "rgba(0, 0, 0, 0.6)");
        grad.addColorStop(1, "rgba(0, 0, 0, 0.0)");
        ctx.fillStyle = grad;
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
}

function fillAllMapFog() {
    const activeMap = getActiveMap();
    if (!activeMap) return;

    openConfirmModal("Cloak Entire Map?", "This shunts the entire tactical board inside a dense Fog of War. Proceed?", () => {
        const canvas = document.getElementById("mapFogCanvas");
        if (canvas) {
            const ctx = canvas.getContext("2d");
            ctx.globalCompositeOperation = "source-over";
            ctx.fillStyle = "rgba(0, 0, 0, 1.0)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            activeMap.fogData = canvas.toDataURL("image/png");
            saveState();
        }
    });
}

function clearAllMapFog() {
    const activeMap = getActiveMap();
    if (!activeMap) return;

    openConfirmModal("Reveal Entire Map?", "This wipes the Fog of War clean, exposing the complete battle map layout. Proceed?", () => {
        const canvas = document.getElementById("mapFogCanvas");
        if (canvas) {
            const ctx = canvas.getContext("2d");
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            activeMap.fogData = canvas.toDataURL("image/png");
            saveState();
        }
    });
}

function selectMapTool(toolName) {
    mapTool = toolName;

    document.querySelectorAll(".map-tool-btn").forEach(btn => {
        btn.classList.remove("active");
    });

    const activeBtn = document.getElementById(`tool${toolName.charAt(0).toUpperCase() + toolName.slice(1)}`);
    if (activeBtn) activeBtn.classList.add("active");

    const sizeEl = document.getElementById("brushSizeControl");
    if (sizeEl) {
        sizeEl.style.display = (toolName === 'brush' || toolName === 'eraser') ? "flex" : "none";
    }

    const canvas = document.getElementById("mapFogCanvas");
    if (canvas) {
        canvas.style.pointerEvents = (toolName === 'move') ? "none" : "auto";
    }

    if (toolName !== 'move') {
        cancelCurrentTokenMovement();
    }
}

// Map NPC Sidebar layout integrations
function toggleMapNpcSidebar() {
    const panel = document.getElementById("mapNpcSidebarPanel");
    if (panel) {
        panel.classList.toggle("collapsed");
        if (!panel.classList.contains("collapsed")) {
            const partyPanel = document.getElementById("mapSidebarPanel");
            if (partyPanel) partyPanel.classList.add("collapsed");
        }
        setTimeout(() => {
            resizeFogCanvas();
        }, 320);
    }
}

function renderMapNpcList() {
    const list = document.getElementById("mapNpcMembersList");
    if (!list) return;

    list.innerHTML = "";
    const npcs = (typeof state !== 'undefined' && state && state.npcs) ? state.npcs : [];

    if (npcs.length === 0) {
        list.innerHTML = `
            <div style="text-align: center; padding: 16px; color: var(--text-muted); font-style: italic; font-size: 12px;">
                <span>No saved NPCs. Create some inside the NPC Directory tab first!</span>
            </div>
        `;
        return;
    }

    npcs.forEach(npc => {
        const item = document.createElement("div");
        item.className = "party-player-card";
        item.style.padding = "10px";
        item.title = "Click to import NPC token";
        item.onclick = () => importNpcAsToken(npc.id);

        const imgHtml = npc.img ? `<img src="${npc.img}" style="width: 28px; height: 28px; border-radius: 50%; object-fit: cover; border: 1px solid var(--tracker-border);" />` : `<div style="width: 28px; height: 28px; border-radius: 50%; background: var(--border); display: flex; align-items: center; justify-content: center; color: var(--text-muted); border: 1px solid var(--border); font-size: 11px;"><i data-lucide="user" style="width:12px; height:12px;"></i></div>`;

        item.innerHTML = `
            <div style="display: flex; gap: 10px; align-items: center; overflow: hidden; flex: 1;">
                ${imgHtml}
                <div style="display: flex; flex-direction: column; overflow: hidden; align-items: flex-start; text-align: left;">
                    <strong style="color: var(--tracker-text); font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%;">${npc.name}</strong>
                    <span style="font-size: 10px; color: var(--text-muted); text-transform: uppercase;">${npc.lineage || "Unknown Lineage"} • ${npc.occupation || "No Role"}</span>
                </div>
            </div>
            <button class="init-action-btn" style="padding: 4px; background: var(--tracker-border); color: white; border-radius: 4px; flex-shrink: 0;" title="Import Miniature">
                <i data-lucide="plus" style="width: 12px; height: 12px;"></i>
            </button>
        `;
        list.appendChild(item);
    });

    if (window.lucide) lucide.createIcons();
}

function importNpcAsToken(npcId) {
    const activeMap = getActiveMap();
    if (!activeMap) {
        openConfirmModal("Select Map First", "Please select or create an active map before importing NPCs.", () => {});
        return;
    }

    const npc = state.npcs.find(n => n.id === npcId);
    if (!npc) return;

    const exists = activeMap.tokens && activeMap.tokens.some(t => t.npcId === npcId);

    const doImport = () => {
        const newToken = {
            id: "token-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
            npcId: npc.id,
            name: npc.name,
            symbol: npc.name.substring(0, 1),
            color: "#ef4444", // Clean red boundary preset for NPC units
            x: 0.5,
            y: 0.5,
            size: 7,
            rotation: 0,
            opacity: 100,
            img: npc.img || ""
        };

        if (!activeMap.tokens) activeMap.tokens = [];
        activeMap.tokens.push(newToken);
        saveState();
        renderMapTokens();
        handleTokenClicked(newToken.id);
    };

    if (exists) {
        openConfirmModal("Token Already Placed", `${npc.name} has a token layout already on this map. Do you want to spawn a replica on this canvas?`, () => {
            doImport();
        });
    } else {
        doImport();
    }
}
