// Handles UI orchestration and tab switching

function switchTab(tabId) {
    // Update Nav Buttons
    const buttons = document.querySelectorAll(".nav-btn");
    buttons.forEach(btn => btn.classList.remove("active"));
    
    // Support either passing event or programmatic activation
    if (window.event && window.event.currentTarget && window.event.currentTarget.classList) {
        window.event.currentTarget.classList.add("active");
    } else {
        const targetBtn = Array.from(buttons).find(btn => btn.getAttribute("onclick")?.includes(`switchTab('${tabId}')`));
        if (targetBtn) targetBtn.classList.add("active");
    }

    // Update Views keeping audio container alive off-screen if inactive
    const views = document.querySelectorAll(".view-container");
    views.forEach(view => {
        if (view.id === 'view-audio') {
            if (tabId === 'audio') {
                view.classList.add("active");
                view.classList.remove("keep-alive");
            } else {
                view.classList.remove("active");
                view.classList.add("keep-alive");
            }
        } else {
            if (view.id === `view-${tabId}`) {
                view.classList.add("active");
            } else {
                view.classList.remove("active");
            }
        }
    });

    // Lazy initialization for Encyclopedia
    if (tabId === 'encyclopedia' && document.getElementById("encIndexList").innerHTML === "") {
        loadEncyclopediaCategory();
    }

    if (tabId === 'settings') {
        loadCampaignSettings();
    }

    if (tabId === 'dashboard') {
        if (typeof renderDashboard === "function") {
            renderDashboard();
        }
    }

    if (tabId === 'initiative') {
        renderInitiativePartyList();
        if (typeof renderInitiativeNpcList === "function") {
            renderInitiativeNpcList();
        }
    }

    if (tabId === 'npc') {
        if (typeof loadNpcDirectory === "function") {
            loadNpcDirectory();
        }
    }

    if (tabId === 'map') {
        loadMapEngine();
        if (typeof renderMapNpcList === "function") {
            renderMapNpcList();
        }
    }

    if (tabId === 'audio') {
        renderAudioLibrary();
    }

    if (typeof updateMasterPlaybar === 'function') {
        updateMasterPlaybar();
    }
}

function toggleSidebar() {
    const sidebar = document.getElementById("sidebar");
    sidebar.classList.toggle("collapsed");

    // Auto-close open folders when collapsing sidebar
    if (sidebar.classList.contains("collapsed")) {
        state.tree.forEach(item => autoCloseFolders(item));
        saveState();
        renderTree();
    }
}

function autoCloseFolders(item) {
    if (item.type === "folder") {
        item.isOpen = false;
        item.children.forEach(child => autoCloseFolders(child));
    }
}

// Initialize on load
window.onload = () => {
    applyTheme();
    renderTree();
    if (typeof renderDashboard === "function") {
        renderDashboard();
    }
    if (window.lucide) lucide.createIcons();
    
    // Setup TinyMCE if returning to notes
    const isDark = state.theme === "dark";
    if (typeof initEditor === 'function') initEditor(isDark);
};
