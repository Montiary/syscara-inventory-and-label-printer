(function () {

    console.log("Print-Addon aktiv");

    function getByXPath(xpath) {
        return document.evaluate(
            xpath,
            document,
            null,
            XPathResult.FIRST_ORDERED_NODE_TYPE,
            null
        ).singleNodeValue;
    }

    function addPrintButton() {
        const menu = document.querySelector(".sectionList.loaded");
        if (!menu) return;
        if (menu.querySelector(".syscara-print-link")) return;

        const link = document.createElement("a");
        link.href = "#";
        link.className = "syscara-print-link";
        link.innerHTML = `<i class="fas fa-print"></i> Drucken`;
        link.style.cursor = "pointer";

        link.addEventListener("click", (e) => {
            e.preventDefault();
            startPrint();
        });

        menu.appendChild(link);
        console.log("Print-Link eingefügt");
    }

async function startPrint() {
  const nameEl = getByXPath('//*[@id="content"]/form/table/tbody/tr[3]/td[4]/b[1]');
  const orderEl = getByXPath('//*[@id="content"]/h1');

  const name = nameEl ? nameEl.innerText.trim() : "—";

  const orderRaw = orderEl ? orderEl.innerText.trim() : "—";
  const match = orderRaw.match(/#\d{7}/);
  const order = match ? match[0] : orderRaw;

  const today = new Date();
  const date = today.toLocaleDateString('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });

  try {
    const res = await fetch("http://192.168.8.2:5000/api/print", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Print-Token": "Token"
      },
      body: JSON.stringify({ name, order, date })
    });

    const json = await res.json();
    if (!res.ok || !json.ok) throw new Error(json.error || "unknown error");

    console.log("Label gedruckt");
    alert("✅ Label wurde gedruckt");
  } catch (err) {
    console.error("Druck fehlgeschlagen:", err);
    alert("❌ Druck fehlgeschlagen: " + err.message);
  }
}



    addPrintButton();
    new MutationObserver(addPrintButton)
        .observe(document.body, { childList: true, subtree: true });

})();
