function renderTree() {
    const tree = document.getElementById("fileTree");
    const filter = document.getElementById("searchFilter").value.toLowerCase();
    tree.innerHTML = "";

    state.tree.forEach(item => {
        renderItem(item, tree, filter);
    });

    if (window.lucide) lucide.createIcons();
}

function renderItem(item, parent, filter) {
    if (item.type === "folder") {
        if (item.isOpen === undefined) item.isOpen = true; // Default to open

        const wrapper = document.createElement("div");
        wrapper.className = "tree-item";
        wrapper.dataset.id = item.id;
        
        const row = document.createElement("div");
        row.className = `folder-row ${item.isOpen ? '' : 'closed'}`;
        row.draggable = true;
        row.dataset.id = item.id;

        // Drag events
        row.ondragstart = (e) => handleDragStart(e, item.id);
        row.ondragover = (e) => handleDragOver(e);
        row.ondragleave = (e) => handleDragLeave(e);
        row.ondrop = (e) => handleDrop(e, item.id);

        row.innerHTML = `
            <div class="tree-left">
                <i data-lucide="chevron-down"></i>
                <i data-lucide="folder"></i>
                <span class="tree-name">${item.name}</span>
            </div>
            <div class="tree-actions">
                <button onclick="event.stopPropagation(); createFile('${item.id}')" title="New File"><i data-lucide="file-plus"></i></button>
                <button onclick="event.stopPropagation(); renameItem('${item.id}')" title="Rename"><i data-lucide="pencil"></i></button>
                <button onclick="event.stopPropagation(); deleteItem('${item.id}')" title="Delete"><i data-lucide="trash-2"></i></button>
            </div>
        `;
        
        // Toggle open/close logic
        row.onclick = () => {
            item.isOpen = !item.isOpen;
            saveState();
            renderTree();
        };

        wrapper.appendChild(row);

        const children = document.createElement("div");
        children.className = `folder-children ${item.isOpen ? '' : 'closed'}`;
        item.children.forEach(child => { renderItem(child, children, filter); });
        
        wrapper.appendChild(children);
        parent.appendChild(wrapper);

    } else {
        if (filter && !item.name.toLowerCase().includes(filter)) return;
        
        const row = document.createElement("div");
        row.className = "file-row";
        if (item.id === state.activeFile) row.classList.add("active");
        row.draggable = true;
        row.dataset.id = item.id;

        // Drag events for file (can be dragged, but cannot accept drops natively)
        row.ondragstart = (e) => handleDragStart(e, item.id);

        row.innerHTML = `
            <div class="tree-left">
                <i data-lucide="file-text"></i>
                <span class="tree-name">${item.name}</span>
            </div>
            <div class="tree-actions">
                <button onclick="event.stopPropagation(); renameItem('${item.id}')" title="Rename"><i data-lucide="pencil"></i></button>
                <button onclick="event.stopPropagation(); deleteItem('${item.id}')" title="Delete"><i data-lucide="trash-2"></i></button>
            </div>
        `;

        row.onclick = () => {
            state.activeFile = item.id;
            saveState();
            loadCurrentFile();
            renderTree();
        };
        parent.appendChild(row);
    }
}

// --- Drag and Drop Logic ---

function handleDragStart(e, id) {
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
}

function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add("drag-over");
}

function handleDragLeave(e) {
    e.currentTarget.classList.remove("drag-over");
}

function allowDrop(e) {
    e.preventDefault(); // Allows drop on the root container
}

function handleDrop(e, targetFolderId) {
    e.preventDefault();
    e.currentTarget.classList.remove("drag-over");
    e.stopPropagation(); // Prevent root drop from also firing

    const draggedId = e.dataTransfer.getData("text/plain");
    if (draggedId === targetFolderId) return; // Cant drop on itself

    const draggedItem = findItem(draggedId, state.tree);
    if (!draggedItem) return;

    // Prevent dropping a folder into its own child
    if (draggedItem.type === "folder" && isDescendant(draggedItem, targetFolderId)) {
        openConfirmModal("Invalid Move", "You cannot drop a folder into its own subfolder.", () => {});
        return;
    }

    removeItem(draggedId, state.tree);
    const targetFolder = findItem(targetFolderId, state.tree);
    
    if (targetFolder && targetFolder.type === "folder") {
        targetFolder.children.push(draggedItem);
        targetFolder.isOpen = true; // Auto open folder receiving drop
    }
    
    saveState();
    renderTree();
}

function handleRootDrop(e) {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData("text/plain");
    const draggedItem = findItem(draggedId, state.tree);
    
    if (!draggedItem) return;
    
    // Check if it's already in root
    if (state.tree.some(item => item.id === draggedId)) return;

    removeItem(draggedId, state.tree);
    state.tree.push(draggedItem);
    
    saveState();
    renderTree();
}

function isDescendant(parentItem, targetId) {
    if (!parentItem.children) return false;
    for (const child of parentItem.children) {
        if (child.id === targetId) return true;
        if (child.children && isDescendant(child, targetId)) return true;
    }
    return false;
}

// --- Creation & Modification Logic ---

function createFolder() {
    openPromptModal("Create Folder", "Enter a folder name.", "", (value) => {
        state.tree.push({ id: Date.now()+"", type: "folder", name: value, children: [], isOpen: true });
        saveState();
        renderTree();
    });
}

function createFile(folderId = null) {
    openPromptModal("Create File", "Enter a file name.", "", (value) => {
        const newFile = { id: Date.now()+"", type: "file", name: value, content: "" };
        
        if (folderId) {
            const folder = findItem(folderId, state.tree);
            folder.children.push(newFile);
            folder.isOpen = true;
        } else {
            state.tree.push(newFile);
        }

        state.activeFile = newFile.id;
        saveState();
        renderTree();
        loadCurrentFile();
    });
}

function renameItem(id) {
    const item = findItem(id, state.tree);
    openPromptModal("Rename", "Enter a new name.", item.name, (value) => {
        item.name = value;
        saveState();
        renderTree();
        if (item.id === state.activeFile) document.getElementById("docTitle").value = value;
    });
}

function deleteItem(id) {
    openConfirmModal("Delete Item", "Are you sure you want to delete this item?", () => {
        removeItem(id, state.tree);
        if (state.activeFile === id) state.activeFile = null;
        saveState();
        renderTree();
    });
}

function removeItem(id, arr) {
    for (let i = 0; i < arr.length; i++) {
        const item = arr[i];
        if (item.id === id) { arr.splice(i, 1); return true; }
        if (item.children) {
            const removed = removeItem(id, item.children);
            if (removed) return true;
        }
    }
    return false;
}

function findItem(id, arr) {
    for (const item of arr) {
        if (item.id === id) return item;
        if (item.children) {
            const found = findItem(id, item.children);
            if (found) return found;
        }
    }
    return null;
}

function findFileById(id) {
    return findItem(id, state.tree);
}
