(async () => {
    // CSS für die Tooltips
    const style = document.createElement('style');
    style.innerHTML = `
        .addon-status-dot { position: relative; }
        .addon-status-dot::after {
            content: attr(data-tooltip);
            position: absolute;
            left: 20px;
            top: 50%;
            transform: translateY(-50%);
            background: rgba(40,40,40,0.95);
            color: #fff;
            padding: 10px;
            border-radius: 6px;
            font-size: 12px;
            font-family: sans-serif;
            white-space: pre;
            z-index: 99999;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            border: 1px solid #555;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.2s ease-in-out;
            display: block;
        }
        .addon-status-dot:hover::after { opacity: 1; }
    `;
    document.head.appendChild(style);

    const COLORS = { red: "#dc2c1d", yellow: "#f49e00", green: "#2ecc71" };

    function createStatusDot(state) {
        const dot = document.createElement("div");
        dot.className = "addon-status-dot";
        dot.style.width = "14px";
        dot.style.height = "14px";
        dot.style.borderRadius = "50%";
        dot.style.marginRight = "6px";
        dot.style.cursor = "pointer";
        dot.style.alignSelf = "center";
        dot.style.backgroundColor = COLORS[state];
        return dot;
    }

    async function checkBestand(artikelID) {
        try {
            const res = await fetch("http://192.168.8.2:5000/api/bestand?artikel=" + encodeURIComponent(artikelID));
            return await res.json();
        } catch (e) {
            console.error("API Fehler:", e);
            return { found: false };
        }
    }

    async function init() {
        // Alte Seite: Werkstatt
        const werkstattRows = document.querySelectorAll(".row_element.highlight");
        for (const row of werkstattRows) {
            if (row.querySelector(".addon-status-dot")) continue;

            const artikelID = row.querySelector('input[name="ex_intid[]"], input[name="ex_key[]"]')?.value || "row-" + Math.random().toString(36).substring(2,9);
            const dot = createStatusDot("yellow");
            const sortArea = row.querySelector(".exSortArea");
            if (sortArea && sortArea.parentElement) sortArea.parentElement.insertBefore(dot, sortArea);

            const data = await checkBestand(artikelID);
            let state = "red";
            if (data.found && parseFloat(data.match?.Menge || 0) > 0) {
                state = data.match.similarity === 1.0 ? "green" : "yellow";
            }
            dot.style.backgroundColor = COLORS[state];

            if (data.found) {
                dot.setAttribute("data-tooltip", `ArtikelID: ${data.match.ArtikelID}\nBezeichnung: ${data.match.Bezeichnung}\nMenge: ${data.match.Menge}`);
            } else {
                dot.setAttribute("data-tooltip", "Artikel nicht gefunden");
            }
            dot.removeAttribute("title");
        }

        // Neue Seite: WParts
        const wpartsRows = document.querySelectorAll("table tbody tr");
        for (const row of wpartsRows) {
            if (row.querySelector(".addon-status-dot")) continue;

            const input = row.querySelector('input[name^="ex_intid"]');
            if (!input) continue;

            const artikelID = input.value;
            const dot = createStatusDot("yellow");
            const targetCell = input.parentElement;
            if (targetCell) targetCell.insertBefore(dot, targetCell.firstChild);

            const data = await checkBestand(artikelID);
            let state = "red";
            if (data.found && parseFloat(data.match?.Menge || 0) > 0) {
                state = data.match.similarity === 1.0 ? "green" : "yellow";
            }
            dot.style.backgroundColor = COLORS[state];

            if (data.found) {
                dot.setAttribute("data-tooltip", `ArtikelID: ${data.match.ArtikelID}\nBezeichnung: ${data.match.Bezeichnung}\nMenge: ${data.match.Menge}`);
            } else {
                dot.setAttribute("data-tooltip", "Artikel nicht gefunden");
            }
            dot.removeAttribute("title");
        }
    }

    init();
    new MutationObserver(init).observe(document.body, { childList: true, subtree: true });
})();
