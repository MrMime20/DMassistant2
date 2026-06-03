function openPromptModal(title, text, defaultValue, callback) {
    const overlay = document.getElementById("modalOverlay");
    document.getElementById("modalTitle").textContent = title;
    document.getElementById("modalText").textContent = text;
    
    const input = document.getElementById("modalInput");
    input.style.display = "block";
    input.value = defaultValue;

    document.getElementById("modalConfirmBtn").onclick = () => {
        const value = input.value.trim();
        if(!value) return;
        closeModal();
        callback(value);
    };

    overlay.style.display = "flex";
}

function openConfirmModal(title, text, callback) {
    const overlay = document.getElementById("modalOverlay");
    document.getElementById("modalTitle").textContent = title;
    document.getElementById("modalText").textContent = text;
    document.getElementById("modalInput").style.display = "none";

    document.getElementById("modalConfirmBtn").onclick = () => {
        closeModal();
        callback();
    };

    overlay.style.display = "flex";
}

function closeModal() {
    document.getElementById("modalOverlay").style.display = "none";
}
