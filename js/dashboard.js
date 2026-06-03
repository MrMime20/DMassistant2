// Campaign Dashboard UI & Portability Operations

function renderDashboard() {
    const activeMap = (typeof state !== 'undefined' && state && state.maps) ? state.maps.find(m => m.id === state.activeMapId) : null;
    const activeTrackName = (typeof state !== 'undefined' && state && state.activeTrackId) ? ((state.audioTracks || []).find(t => t.id === state.activeTrackId)?.name || "None") : "None";

    const hpSum = (typeof initTrackerState !== 'undefined' && initTrackerState && initTrackerState.entities) ? initTrackerState.entities.reduce((sum, e) => sum + (e.hp || 0), 0) : 0;
    const activeInitiativeCount = (typeof initTrackerState !== 'undefined' && initTrackerState && initTrackerState.entities) ? initTrackerState.entities.length : 0;

    const html = `
        <div style="display: flex; flex-direction: column; flex: 1; height: 100%; overflow: hidden; background: var(--main-bg);">
            <!-- Dashboard Header, styled with high craftsmanship consistent with other views -->
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 24px 34px; border-bottom: 1px solid var(--border); flex-shrink: 0; background: var(--tracker-bg);">
                <div style="display: flex; align-items: center; gap: 16px;">
                    <button class="nav-btn" style="padding: 0; cursor: default; width: 48px; height: 48px; border-radius: 12px; background: var(--hover); color: var(--accent); display: flex; align-items: center; justify-content: center; border: none; flex-shrink:0;">
                        <i data-lucide="layout-dashboard" style="width: 24px; height: 24px;"></i>
                    </button>
                    <div style="display: flex; flex-direction: column;">
                        <span style="font-size: 24px; font-weight: 800; color: var(--text); font-family: Playfair Display, Georgia, serif;">Campaign Dashboard</span>
                        <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.7px;">Campaign Details That You Definitely Needed to Know</span>
                    </div>
                </div>
            </div>

            <!-- Scrollable Content Area -->
            <div style="flex: 1; overflow-y: auto; padding: 34px; display: flex; flex-direction: column; gap: 24px;">
                <!-- Section 1: Campaign Title & Motto -->
                <div style="background: var(--card-bg); border: 1px solid var(--border); border-radius: 12px; padding: 24px; box-shadow: var(--shadow); display: flex; flex-direction: column; gap: 12px;">
                    <div style="display: flex; align-items: center; gap: 10px; color: var(--accent);">
                        <i data-lucide="crown" style="width: 20px; height: 20px;"></i>
                        <span style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.7px;">Active Campaign Info</span>
                    </div>
                    <div style="font-size: 28px; font-weight: 800; color: var(--text); font-family: Playfair Display, Georgia, serif;" id="dashCampName">${(typeof state !== 'undefined' && state.campaignName) ? state.campaignName : 'My Epic Campaign'}</div>
                    <p style="font-size: 14px; color: var(--text-muted); line-height: 1.6; margin: 0; max-width: 800px;" id="dashCampGoal">${(typeof state !== 'undefined' && state.campaignGoal) ? state.campaignGoal : 'Complete the campaign quest.'}</p>
                </div>

                <!-- Section 2: Cards Grid -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px;">
                    <!-- Party Statistics -->
                    <div style="background: var(--card-bg); border: 1px solid var(--border); border-radius: 12px; padding: 20px; box-shadow: var(--shadow); display: flex; flex-direction: column; gap: 12px;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.5px;">Saved Party</span>
                            <div style="color: var(--accent); background: var(--hover); padding: 6px; border-radius: 8px;"><i data-lucide="users" style="width: 16px; height: 16px;"></i></div>
                        </div>
                        <div style="font-size: 32px; font-weight: 800; color: var(--text);">${(typeof state !== 'undefined' && state.party) ? state.party.length : 0}</div>
                        <div style="font-size: 12px; color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                            ${(typeof state !== 'undefined' && state.party && state.party.length > 0) ? state.party.map(p => p.name).join(', ') : 'No registered characters'}
                        </div>
                    </div>

                    <!-- NPCs Statistics -->
                    <div style="background: var(--card-bg); border: 1px solid var(--border); border-radius: 12px; padding: 20px; box-shadow: var(--shadow); display: flex; flex-direction: column; gap: 12px;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.5px;">NPC Directory</span>
                            <div style="color: var(--accent); background: var(--hover); padding: 6px; border-radius: 8px;"><i data-lucide="contact" style="width: 16px; height: 16px;"></i></div>
                        </div>
                        <div style="font-size: 32px; font-weight: 800; color: var(--text);">${(typeof state !== 'undefined' && state.npcs) ? state.npcs.length : 0}</div>
                        <div style="font-size: 12px; color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                            ${(typeof state !== 'undefined' && state.npcs && state.npcs.length > 0) ? state.npcs.map(n => n.name).join(', ') : 'No registered NPCs'}
                        </div>
                    </div>

                    <!-- Interactive Maps Statistics -->
                    <div style="background: var(--card-bg); border: 1px solid var(--border); border-radius: 12px; padding: 20px; box-shadow: var(--shadow); display: flex; flex-direction: column; gap: 12px;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.5px;">Maps</span>
                            <div style="color: var(--accent); background: var(--hover); padding: 6px; border-radius: 8px;"><i data-lucide="map" style="width: 16px; height: 16px;"></i></div>
                        </div>
                        <div style="font-size: 32px; font-weight: 800; color: var(--text);">${(typeof state !== 'undefined' && state.maps) ? state.maps.length : 0}</div>
                        <div style="font-size: 12px; color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                            Active Layout: ${activeMap ? activeMap.name : 'None selected'}
                        </div>
                    </div>

                    <!-- Ambient Music State -->
                    <div style="background: var(--card-bg); border: 1px solid var(--border); border-radius: 12px; padding: 20px; box-shadow: var(--shadow); display: flex; flex-direction: column; gap: 12px;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.5px;">Soundboard Tracks</span>
                            <div style="color: var(--accent); background: var(--hover); padding: 6px; border-radius: 8px;"><i data-lucide="music" style="width: 16px; height: 16px;"></i></div>
                        </div>
                        <div style="font-size: 32px; font-weight: 800; color: var(--text);">${(typeof state !== 'undefined' && state.audioTracks) ? state.audioTracks.length : 0}</div>
                        <div style="font-size: 12px; color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                            Active Track: ${activeTrackName}
                        </div>
                    </div>
                </div>

                <!-- Section 3: Active Encounter Board -->
                <div style="background: var(--card-bg); border: 1px solid var(--border); border-radius: 12px; padding: 24px; box-shadow: var(--shadow); display: flex; flex-direction: column; gap: 14px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div style="display: flex; align-items: center; gap: 8px; color: var(--accent);">
                            <i data-lucide="swords" style="width: 18px; height: 18px;"></i>
                            <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.7px;">Active Combat Engagement</span>
                        </div>
                        <span style="font-size: 12px; color: var(--text-muted); font-weight: 600;">HP pool of current encounter: ${hpSum}</span>
                    </div>

                    ${activeInitiativeCount > 0 ? `
                        <div style="display: flex; flex-wrap: wrap; gap: 12px;">
                            ${initTrackerState.entities.map(ent => `
                                <div style="display: flex; align-items: center; gap: 10px; padding: 8px 12px; border: 1px solid var(--border); background: var(--main-bg); border-radius: 8px; font-size: 13px;">
                                    <strong style="color: var(--text);">${ent.name}</strong>
                                    <span style="font-size: 10px; color: var(--text-muted); background: var(--hover); padding: 2px 6px; border-radius: 4px; font-weight: 800;">Init: ${ent.initiative || 0}</span>
                                    ${ent.hp !== null ? `<span style="font-size: 11px; color: var(--accent); font-weight: 700;">HP ${ent.hp}/${ent.maxHp}</span>` : ""}
                                    ${ent.ac !== null ? `<span style="font-size: 11px; color: var(--text-muted); font-weight: 700;">AC ${ent.ac}</span>` : ""}
                                </div>
                            `).join('')}
                        </div>
                    ` : `
                        <div style="font-size: 13px; color: var(--text-muted); font-style: italic;">No active initiative order. Begin an encounter in the Initiative Tracker!</div>
                    `}
                </div>

                <!-- Section 4: Campaign Portability / Backup System -->
                <div style="background: var(--card-bg); border: 1px solid var(--border); border-radius: 12px; padding: 24px; box-shadow: var(--shadow); display: flex; flex-direction: column; gap: 16px;">
                    <div style="display: flex; align-items: center; gap: 8px; color: var(--accent);">
                        <i data-lucide="database" style="width: 18px; height: 18px;"></i>
                        <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.7px;">Campaign Portability & Backup Manager</span>
                    </div>
                    <p style="font-size: 13px; color: var(--text-muted); line-height: 1.5; margin: 0; max-width: 700px;">
                        Protect your creative campaigns against browser cache clearing. Export your notes, folder hierarchies, saved parties, NPCs, active interactive maps, audio track listings, and initiative values into a portable backup file, or load an existing campaign setup file.
                    </p>
                    <div style="display: flex; gap: 12px; align-items: center;">
                        <button onclick="exportCampaignData()" class="init-add-btn" style="height: 40px; padding: 0 16px; border-radius: 8px; background: var(--tracker-border); border: none; cursor: pointer; display: flex; align-items: center; gap: 8px; color: white;">
                            <i data-lucide="download" style="width: 16px; height: 16px;"></i> Export Campaign
                        </button>
                        <button onclick="triggerCampaignImport()" class="init-add-btn" style="height: 40px; padding: 0 16px; border-radius: 8px; background: var(--main-bg); border: 1px solid var(--border); cursor: pointer; display: flex; align-items: center; gap: 8px; color: var(--text);">
                            <i data-lucide="upload" style="width: 16px; height: 16px;"></i> Import Campaign
                        </button>
                        <input type="file" id="importCampaignFile" accept=".json" onchange="importCampaignData(event)" style="display: none;" />
                    </div>
                </div>
            </div>
        </div>
    `;

    const container = document.getElementById("view-dashboard");
    if (container) {
        container.innerHTML = html;
    }

    if (window.lucide) {
        lucide.createIcons();
    }
}

// Campaign Record Serialization Exporter
function exportCampaignData() {
    const backupObj = {
        version: "2.5",
        exportedAt: new Date().toISOString(),
        campaignState: (typeof state !== 'undefined') ? state : null,
        initiativeState: (typeof initTrackerState !== 'undefined') ? initTrackerState : null,
        diceHistory: (typeof diceHistory !== 'undefined') ? diceHistory : []
    };

    const campaignName = ((typeof state !== 'undefined' && state.campaignName) ? state.campaignName : "Campaign")
        .replace(/[^a-z0-9]/gi, '_')
        .toLowerCase();
    const fileName = `${campaignName}-records.json`;

    const jsonStr = JSON.stringify(backupObj, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const blobUrl = URL.createObjectURL(blob);

    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", blobUrl);
    downloadAnchor.setAttribute("download", fileName);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    URL.revokeObjectURL(blobUrl);
}

function triggerCampaignImport() {
    const fileInput = document.getElementById("importCampaignFile");
    if (fileInput) {
        fileInput.click();
    }
}

// Campaign Record Deserialization Importer
function importCampaignData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (!data.campaignState) {
                openConfirmModal("Invalid File Format", "The uploaded file does not contain valid DM Assistant campaign records.", () => {});
                return;
            }

            openConfirmModal("Overwrite Campaign?", "Are you sure you want to load these records? Loading will replace your active notes, NPCs, map setups, and trackers.", () => {
                // Safely load and persist in localStorage
                localStorage.setItem("dm-assistant-v3", JSON.stringify(data.campaignState));

                if (data.initiativeState) {
                    localStorage.setItem("dma-initiative", JSON.stringify(data.initiativeState));
                }
                if (data.diceHistory) {
                    localStorage.setItem("dma-dice-history", JSON.stringify(data.diceHistory));
                }

                openConfirmModal("Import Complete", "Campaign restored successfully! Click confirm to refresh the screen and apply your campaign setup changes.", () => {
                    window.location.reload();
                });
            });

        } catch (err) {
            openConfirmModal("Import Failed", "Failed to deserialize the campaign JSON payload: " + err.message, () => {});
        }
    };
    reader.readAsText(file);
}
