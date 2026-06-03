// YouTube-backed Soundboard & Audio Manager

let ytPlayer = null;
let ytPlayingTrackId = null;

// Clean extraction of YouTube Video ID
function extractYouTubeId(url) {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

// Global API hook invoked by YouTube framework script
window.onYouTubeIframeAPIReady = function() {
    initYTPlayer();
};

function initYTPlayer() {
    const frameEl = document.getElementById("ytPlayerFrame");
    if (!frameEl) return;
    
    try {
        ytPlayer = new YT.Player('ytPlayerFrame', {
            height: '100%',
            width: '100%',
            videoId: '',
            playerVars: {
                'playsinline': 1,
                'controls': 1,
                'rel': 0,
                'modestbranding': 1
            },
            events: {
                'onReady': () => {
                    if (ytPlayer && typeof ytPlayer.setVolume === 'function') {
                        ytPlayer.setVolume(state.audioVolume !== undefined ? state.audioVolume : 70);
                    }
                    // If returning with an active track, cue it up
                    if (state.activeTrackId) {
                        const track = state.audioTracks.find(t => t.id === state.activeTrackId);
                        if (track) {
                            const vidId = extractYouTubeId(track.url);
                            if (vidId) {
                                ytPlayer.cueVideoById(vidId);
                                ytPlayingTrackId = track.id;
                            }
                        }
                    }
                    renderAudioLibrary();
                    updateMasterPlaybar();
                },
                'onStateChange': () => {
                    renderAudioLibrary();
                    updateMasterPlaybar();
                }
            }
        });
    } catch (e) {
        console.error("Failed to initialize YouTube IFrame Player:", e);
    }
}

// Load YouTube API asynchronously if not already present
if (!window.YT) {
    const tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName('script')[0];
    if (firstScriptTag && firstScriptTag.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    } else {
        document.head.appendChild(tag);
    }
} else {
    initYTPlayer();
}

// Audio Library UI Renderer
function renderAudioLibrary() {
    const list = document.getElementById("audioLibraryList");
    if (!list) return;
    list.innerHTML = "";

    if (!state.audioTracks) state.audioTracks = [];

    // Refresh volume sliders to match current state
    const mainVol = document.getElementById("audioVolumeSlider");
    if (mainVol) mainVol.value = state.audioVolume;
    const mainVolLbl = document.getElementById("audioVolumeLabel");
    if (mainVolLbl) mainVolLbl.textContent = `${state.audioVolume || 0}%`;

    const masterVol = document.getElementById("masterVolumeSlider");
    if (masterVol) masterVol.value = state.audioVolume;

    // Get current player state
    // States: -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (video cued)
    let isPlaying = false;
    if (ytPlayer && typeof ytPlayer.getPlayerState === 'function') {
        isPlaying = (ytPlayer.getPlayerState() === 1);
    }

    state.audioTracks.forEach(track => {
        const isActive = (state.activeTrackId === track.id);
        const isTrackPlaying = (isActive && isPlaying);

        const card = document.createElement("div");
        card.style.display = "flex";
        card.style.alignItems = "center";
        card.style.justifyContent = "space-between";
        card.style.borderRadius = "12px";
        card.style.padding = "16px 20px";
        card.style.transition = "0.2s ease";
        card.style.border = "1px solid var(--border)";
        card.style.cursor = "pointer";

        if (isActive) {
            // Active composition: SOLID dark tracker accent theme (reminiscent of the olive vibe)
            card.style.background = "var(--tracker-border)";
            card.style.color = "#ffffff";
            card.style.borderColor = "var(--tracker-border)";
        } else {
            // Standard composition: Card bg
            card.style.background = "var(--card-bg)";
            card.style.color = "var(--text)";
            card.style.borderColor = "var(--border)";
        }

        // Left controls box and Title details
        const detailsRow = document.createElement("div");
        detailsRow.style.display = "flex";
        detailsRow.style.alignItems = "center";
        detailsRow.style.gap = "16px";
        detailsRow.style.flex = "1";
        detailsRow.style.overflow = "hidden";
        
        detailsRow.onclick = (e) => {
            // Prevent button click overlap 
            playAudioTrack(track.id);
        };

        // Icon Circle (replicates the light round icon container from the image)
        const iconCircle = document.createElement("div");
        iconCircle.style.width = "40px";
        iconCircle.style.height = "40px";
        iconCircle.style.borderRadius = "10px";
        iconCircle.style.display = "flex";
        iconCircle.style.alignItems = "center";
        iconCircle.style.justifyContent = "center";
        iconCircle.style.flexShrink = "0";

        if (isActive) {
            iconCircle.style.background = "rgba(255, 255, 255, 0.15)";
            iconCircle.style.color = "#ffffff";
            iconCircle.innerHTML = isTrackPlaying 
                ? `<i data-lucide="volume-2" style="width: 18px; height: 18px; animation: audio-spin 4s linear infinite;"></i>` 
                : `<i data-lucide="volume-x" style="width: 18px; height: 18px;"></i>`;
        } else {
            iconCircle.style.background = "var(--hover)";
            iconCircle.style.color = "var(--text-muted)";
            iconCircle.innerHTML = `<i data-lucide="play" style="width: 18px; height: 18px;"></i>`;
        }

        const textCol = document.createElement("div");
        textCol.style.display = "flex";
        textCol.style.flexDirection = "column";
        textCol.style.overflow = "hidden";

        const titleEl = document.createElement("strong");
        titleEl.style.fontSize = "15px";
        titleEl.style.fontWeight = "700";
        titleEl.style.whiteSpace = "nowrap";
        titleEl.style.overflow = "hidden";
        titleEl.style.textOverflow = "ellipsis";
        titleEl.textContent = track.name;

        const subEl = document.createElement("span");
        subEl.style.fontSize = "10px";
        subEl.style.textTransform = "uppercase";
        subEl.style.fontWeight = "600";
        subEl.style.letterSpacing = "0.5px";
        subEl.style.marginTop = "2px";
        subEl.textContent = "YOUTUBE SOURCE";

        if (isActive) {
            titleEl.style.color = "#ffffff";
            subEl.style.color = "rgba(255, 255, 255, 0.7)";
        } else {
            titleEl.style.color = "var(--text)";
            subEl.style.color = "var(--text-muted)";
        }

        textCol.appendChild(titleEl);
        textCol.appendChild(subEl);

        detailsRow.appendChild(iconCircle);
        detailsRow.appendChild(textCol);

        // Action Buttons Row (Open Link, Trash)
        const actionsRow = document.createElement("div");
        actionsRow.style.display = "flex";
        actionsRow.style.alignItems = "center";
        actionsRow.style.gap = "8px";

        const openBtn = document.createElement("button");
        openBtn.style.background = "none";
        openBtn.style.border = "none";
        openBtn.style.cursor = "pointer";
        openBtn.style.padding = "6px";
        openBtn.style.borderRadius = "6px";
        openBtn.style.display = "flex";
        openBtn.title = "Open YouTube URL";
        openBtn.innerHTML = `<i data-lucide="external-link" style="width: 15px; height: 15px;"></i>`;
        openBtn.onclick = (e) => {
            e.stopPropagation();
            window.open(track.url, "_blank");
        };

        const delBtn = document.createElement("button");
        delBtn.style.background = "none";
        delBtn.style.border = "none";
        delBtn.style.cursor = "pointer";
        delBtn.style.padding = "6px";
        delBtn.style.borderRadius = "6px";
        delBtn.style.display = "flex";
        delBtn.title = "Delete Composition";
        delBtn.innerHTML = `<i data-lucide="trash-2" style="width: 15px; height: 15px;"></i>`;
        delBtn.onclick = (e) => {
            e.stopPropagation();
            deleteAudioTrack(track.id);
        };

        if (isActive) {
            openBtn.style.color = "rgba(255, 255, 255, 0.85)";
            delBtn.style.color = "rgba(255, 255, 255, 0.85)";
        } else {
            openBtn.style.color = "var(--text-muted)";
            delBtn.style.color = "var(--text-muted)";
        }
        
        openBtn.onmouseover = () => { openBtn.style.background = "rgba(255, 255, 255, 0.15)"; };
        openBtn.onmouseleave = () => { openBtn.style.background = "none"; };
        delBtn.onmouseover = () => { delBtn.style.background = "rgba(255, 255, 255, 0.15)"; };
        delBtn.onmouseleave = () => { delBtn.style.background = "none"; };

        actionsRow.appendChild(openBtn);
        actionsRow.appendChild(delBtn);

        card.appendChild(detailsRow);
        card.appendChild(actionsRow);

        list.appendChild(card);
    });

    if (window.lucide) lucide.createIcons();
}

// Add a music track composition record to active sound list
function saveNewAudioTrack() {
    const nameEl = document.getElementById("audioTrackName");
    const urlEl = document.getElementById("audioTrackUrl");

    if (!nameEl || !urlEl) return;

    const name = nameEl.value.trim();
    const url = urlEl.value.trim();

    if (!name || !url) {
        openConfirmModal("Incomplete Entry", "Please provide a track title description and a valid YouTube web link to continue.", () => {});
        return;
    }

    const videoId = extractYouTubeId(url);
    if (!videoId) {
        openConfirmModal("Invalid YouTube Link", "The address provided does not appear to contain a regular YouTube Video ID string. Please copy-paste directly from your browser's address field.", () => {});
        return;
    }

    const newTrack = {
        id: "track-" + Date.now(),
        name: name,
        url: url
    };

    if (!state.audioTracks) state.audioTracks = [];
    state.audioTracks.push(newTrack);
    saveState();

    // Reset fields
    nameEl.value = "";
    urlEl.value = "";

    renderAudioLibrary();
}

// Eliminate track composition row from state
function deleteAudioTrack(trackId) {
    const track = state.audioTracks.find(t => t.id === trackId);
    if (!track) return;

    openConfirmModal("Delete Song?", `Are you sure you want to completely erase "${track.name}" from your system playlist?`, () => {
        state.audioTracks = state.audioTracks.filter(t => t.id !== trackId);
        
        if (state.activeTrackId === trackId) {
            state.activeTrackId = "";
            if (ytPlayer && typeof ytPlayer.stopVideo === 'function') {
                try {
                    ytPlayer.stopVideo();
                } catch (e) {}
            }
        }
        
        saveState();
        renderAudioLibrary();
        updateMasterPlaybar();
    });
}

// Set active player track and launch play stream or toggles play
function playAudioTrack(trackId) {
    const track = state.audioTracks.find(t => t.id === trackId);
    if (!track) return;

    const vidId = extractYouTubeId(track.url);
    if (!vidId) return;

    const isCurrentlyActive = (state.activeTrackId === trackId);

    if (isCurrentlyActive && ytPlayer && typeof ytPlayer.getPlayerState === 'function') {
        const playerState = ytPlayer.getPlayerState();
        if (playerState === 1) { // Playing, so pause
            ytPlayer.pauseVideo();
            return;
        } else if (playerState === 2 || playerState === 5) { // Paused or cued, so play
            ytPlayer.playVideo();
            return;
        }
    }

    state.activeTrackId = trackId;
    saveState();

    // Update system title visualizer cards
    const prTitle = document.getElementById("playerTrackTitle");
    if (prTitle) prTitle.textContent = track.name;

    if (ytPlayer && typeof ytPlayer.loadVideoById === 'function') {
        try {
            ytPlayer.loadVideoById(vidId);
        } catch (e) {
            console.error(e);
        }
    }

    ytPlayingTrackId = trackId;
    renderAudioLibrary();
    updateMasterPlaybar();
}

// Volume attributes logic
function changeAudioVolume(volumeVal) {
    const parsedVal = parseInt(volumeVal);
    state.audioVolume = parsedVal;
    saveState();

    const lbl = document.getElementById("audioVolumeLabel");
    if (lbl) lbl.textContent = `${parsedVal}%`;

    const slider = document.getElementById("audioVolumeSlider");
    if (slider) slider.value = parsedVal;

    const masterSlider = document.getElementById("masterVolumeSlider");
    if (masterSlider) masterSlider.value = parsedVal;

    if (ytPlayer && typeof ytPlayer.setVolume === 'function') {
        try {
            ytPlayer.setVolume(parsedVal);
        } catch (e) {}
    }
}

// Master Play/Pause Controller Toggle
function toggleMasterPlayState() {
    if (!ytPlayer || typeof ytPlayer.getPlayerState !== 'function') return;

    const playerState = ytPlayer.getPlayerState();
    if (playerState === 1) { // Playing -> Pause
        ytPlayer.pauseVideo();
    } else { // Playing/Cued -> Play
        ytPlayer.playVideo();
    }
}

// Keep the global Bottom Master Music status synchronized across tab view swaps
function updateMasterPlaybar() {
    const masterBar = document.getElementById("masterAudioBar");
    if (!masterBar) return;

    // Only render the master bar when NOT viewing the Soundboard tab, and we have an active track selected
    const activeTabButton = document.querySelector(".nav-btn.active");
    const isShowingAudioTab = (activeTabButton && activeTabButton.getAttribute("onclick")?.includes("audio"));

    if (isShowingAudioTab || !state.activeTrackId) {
        masterBar.style.display = "none";
        return;
    }

    const activeTrack = state.audioTracks.find(t => t.id === state.activeTrackId);
    if (!activeTrack) {
        masterBar.style.display = "none";
        return;
    }

    masterBar.style.display = "flex";

    // Set slider and title
    const titleEl = document.getElementById("masterTrackTitle");
    if (titleEl) titleEl.textContent = activeTrack.name;

    const sliderEl = document.getElementById("masterVolumeSlider");
    if (sliderEl) sliderEl.value = state.audioVolume;

    // Set play icon button visual based on state
    let isPlaying = false;
    if (ytPlayer && typeof ytPlayer.getPlayerState === 'function') {
        isPlaying = (ytPlayer.getPlayerState() === 1);
    }

    const playBtn = document.getElementById("masterPlayBtn");
    if (playBtn) {
        playBtn.innerHTML = isPlaying 
            ? `<i data-lucide="pause" style="width: 14px; height: 14px;"></i>` 
            : `<i data-lucide="play" style="width: 14px; height: 14px;"></i>`;
    }

    if (window.lucide) lucide.createIcons();
}
