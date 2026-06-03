function initEditor(isDark) {
    tinymce.init({
        selector: "#editor",
        height: "100%",
        skin: isDark ? "oxide-dark" : "oxide",
        content_css: isDark ? "dark" : "default",
        // Removed 'autoresize' to allow the editor to use native internal scrollbars
        plugins: 'accordion anchor autolink autosave charmap code codesample directionality emoticons fullscreen help image importcss insertdatetime link lists advlist media nonbreaking pagebreak preview quickbars save searchreplace table visualblocks visualchars wordcount',
        toolbar: 'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | alignleft aligncenter alignright | numlist bullist blockquote outdent indent | link image table | hr pagebreak accordion | charmap emoticons | searchreplace code fullscreen preview',
        setup(editor) {
            editor.on("init", () => {
                loadCurrentFile();
            });
            editor.on("change input", () => {
                const file = findFileById(state.activeFile);
                if (file) {
                    file.content = editor.getContent();
                    saveState();
                }
            });
        }
    });
}

function loadCurrentFile() {
    const file = findFileById(state.activeFile);
    if (!file) return;
    
    document.getElementById("docTitle").value = file.name;
    const editor = tinymce.get("editor");
    
    if (editor) {
        editor.setContent(file.content || "");
    }
}

function updateCurrentFileTitle() {
    const file = findFileById(state.activeFile);
    if (file) {
        file.name = document.getElementById("docTitle").value;
        saveState();
        renderTree();
    }
}
