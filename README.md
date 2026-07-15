# Syscara Inventory & Label Printer

Ein integriertes System bestehend aus einer Google Chrome Erweiterung und einem Python-Backend. Es erleichtert den Arbeitsalltag im Werkstattbetrieb, indem es Syscara-Portale nahtlos mit der eigenen SQL-Datenbank und lokalen Netzwerk-Etikettendruckern verbindet.

## Kernfunktionen

*   **Live-Bestandsprüfung (WParts & Werkstatt):** Die Chrome-Erweiterung liest Artikelnummern direkt aus der Webseite aus, gleicht sie im Hintergrund mit der Datenbank ab und zeigt den Lagerbestand über ein farbiges Ampelsystem (Rot/Gelb/Grün) sowie detaillierte Tooltips direkt im Portal an.
*   **Fehlertolerante Artikelsuche:** Das Backend nutzt einen Ähnlichkeits-Algorithmus (Sequence-Matching), um auch bei leicht abweichenden Artikelnummern oder Tippfehlern den richtigen Artikel in der Datenbank zu finden.
*   **One-Click-Etikettendruck (ZPL):** Direkt auf der WParts-Ersatzteilseite wird ein "Drucken"-Button integriert. Per Klick werden Auftrags- und Kundendaten vollautomatisch ausgelesen, in Zebra-Druckercode (ZPL) übersetzt und ohne Umwege an den lokalen Windows-Druckerspooler geschickt.

## Systemarchitektur & Technologien

*   **Frontend (Chrome Extension):** Vanilla JavaScript (ES6), HTML5, CSS3, `MutationObserver` (für dynamisch nachladende Portal-Inhalte), XPath-Selektoren.
*   **Backend (REST-API):** Python, Flask, PyMySQL (Datenbank-Anbindung), pywin32 (RAW Windows Spooler API), Zebra Programming Language (ZPL).

## Repository-Struktur

```text
├── extension/             # Die Chrome-Erweiterung (Frontend)
│   ├── manifest.json      # Konfiguration & Berechtigungen der Extension
│   ├── bestand.js         # Logik für die Live-Bestandsabfrage im Portal
│   └── print.js           # Button-Integration & Datenextraktion für den Druck
│
└── backend/               # Der Python Microservice (Backend)
    ├── FlaskAPI.py        # Flask-Server mit API-Endpunkten für Bestand & Druck
    ├── requirements.txt   # Benötigte Python-Bibliotheken
    └── .env.example       # Vorlage für vertrauliche Zugangsdaten (DB & Drucker)

    ## Voraussetzungen & Setup

### 1. SQL-Datenbank (MySQL / MariaDB)
Für den Betrieb wird eine bestehende SQL-Datenbank benötigt. 
* Es muss eine Tabelle namens `artikel` vorhanden sein.
* Diese Tabelle benötigt mindestens die Spalten: `ArtikelID` (VARCHAR/TEXT), `Bezeichnung` (TEXT) und `Menge` (Dezimalzahl/INT).

---

## Installation & Setup

### 1. Chrome Extension installieren
1. Öffne Google Chrome und navigiere zu `chrome://extensions/`.
2. Aktiviere oben rechts den **Entwicklermodus**.
3. Klicke auf **Entpackte Erweiterung laden** und wähle den Ordner `extension/` aus diesem Repository.

### 2. Backend starten
1. Navigiere in den Ordner `backend/`.
2. Installiere die Python-Abhängigkeiten:
   ```bash
   pip install -r requirements.txt
3. Kopiere die Datei .env.example und benenne sie in .env um.

4. Trage in der .env die Zugangsdaten deiner vorhandenen SQL-Datenbank sowie den Namen deines Zebra-Druckers ein.

5. Starte den API-Server: python FlaskAPI.py
