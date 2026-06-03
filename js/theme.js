function applyTheme() {
    document.body.className = state.theme;
}

function toggleTheme() {
    state.theme = state.theme === "dark" ? "" : "dark";
    applyTheme();
    saveState();

    const isDark = state.theme === "dark";
    tinymce.remove();
    initEditor(isDark);
}
