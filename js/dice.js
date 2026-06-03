let diceHistory = JSON.parse(localStorage.getItem("dma-dice-history")) || [];

function toggleDiceWidget() {
    const widget = document.getElementById("diceWidget");
    if (widget.style.display === "flex") {
        widget.style.display = "none";
    } else {
        widget.style.display = "flex";
        renderDiceHistory();
    }
}

function appendDice(type) {
    const input = document.getElementById("diceExpression");
    let current = input.value.trim();
    
    if (current && !current.endsWith('+') && !current.endsWith('-')) {
        current += " + ";
    }
    input.value = current + "1" + type;
    input.focus();
}

function rollFormula() {
    const input = document.getElementById("diceExpression");
    const expr = input.value.trim().toLowerCase();
    if (!expr) return;

    try {
        const result = evaluateDiceExpression(expr);
        diceHistory.unshift({ expr: expr, result: result });
        if (diceHistory.length > 20) diceHistory.pop(); // Keep last 20
        
        localStorage.setItem("dma-dice-history", JSON.stringify(diceHistory));
        input.value = ""; // Clear input after roll
        renderDiceHistory();
    } catch (e) {
        openConfirmModal("Invalid Formula", "Could not parse dice formula. Use format like '2d20 + 5'.", () => {});
    }
}

function evaluateDiceExpression(expr) {
    // Regex to capture NdX or standalone numbers
    const parts = expr.split(/(?=[+-])/).map(p => p.trim());
    let total = 0;

    parts.forEach(part => {
        let isNegative = false;
        if (part.startsWith('-')) {
            isNegative = true;
            part = part.substring(1).trim();
        } else if (part.startsWith('+')) {
            part = part.substring(1).trim();
        }

        if (part.includes('d')) {
            const [countStr, facesStr] = part.split('d');
            let count = parseInt(countStr) || 1;
            let faces = parseInt(facesStr);
            
            if (isNaN(faces) || faces < 1) throw new Error("Invalid dice");

            let subTotal = 0;
            for(let i=0; i<count; i++) {
                subTotal += Math.floor(Math.random() * faces) + 1;
            }
            total += isNegative ? -subTotal : subTotal;
        } else {
            const flat = parseInt(part);
            if (!isNaN(flat)) {
                total += isNegative ? -flat : flat;
            }
        }
    });

    return total;
}

function renderDiceHistory() {
    const list = document.getElementById("diceHistoryList");
    list.innerHTML = "";

    diceHistory.forEach(log => {
        const row = document.createElement("div");
        row.className = "history-row";
        row.innerHTML = `
            <span class="history-expr">${log.expr}</span>
            <span class="history-res">${log.result}</span>
        `;
        list.appendChild(row);
    });
}

function clearDiceHistory() {
    diceHistory = [];
    localStorage.removeItem("dma-dice-history");
    renderDiceHistory();
}
