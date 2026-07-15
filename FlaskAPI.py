from flask import Flask, request, jsonify
import pymysql
import difflib
import os
from dotenv import load_dotenv

# Windows RAW-Printing (ZPL)
try:
    import win32print
except ImportError:
    win32print = None

# =========================
# .env laden
# =========================
load_dotenv()

app = Flask(__name__)

# =========================
# DB Config aus .env
# =========================
db_config = {
    "host": os.getenv("DB_HOST"),
    "port": int(os.getenv("DB_PORT", "3306")),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASS"),
    "database": os.getenv("DB_NAME"),
}

# =========================
# Print Config aus .env
# =========================
PRINT_TOKEN = os.getenv("PRINT_TOKEN") or "change-me"

# Wenn du willst, kannst du den Namen auch in .env auslagern:
# PRINTER_NAME=ZDesigner ...
PRINTER_NAME = os.getenv(
    "PRINTER_NAME",
    "PRINTER_NAME",
)

# =========================
# DB Verbindung
# =========================
def get_connection():
    return pymysql.connect(
        host=db_config["host"],
        port=db_config["port"],
        user=db_config["user"],
        password=db_config["password"],
        database=db_config["database"],
        cursorclass=pymysql.cursors.DictCursor,
    )

# =========================
# Ähnlichkeit
# =========================
def similarity(a, b):
    return difflib.SequenceMatcher(None, a, b).ratio()

# =========================
# API: Bestand prüfen
# =========================
@app.route("/api/bestand", methods=["GET"])
def check_bestand():
    artikel_id = request.args.get("artikel")
    if not artikel_id:
        return jsonify({"error": "artikel missing"}), 400

    # Normalisierung: Leerzeichen durch Bindestriche ersetzen
    # Damit wird aus "123 45" -> "123-45"
    normalized_id = artikel_id.replace(" ", "-")

    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            # Wir nutzen die normalisierte ID für die Suche
            like_pattern = f"{normalized_id[:4]}%"
            sql = "SELECT * FROM artikel WHERE ArtikelID LIKE %s"
            cursor.execute(sql, (like_pattern,))
            rows = cursor.fetchall()

            results = []
            for row in rows:
                # Auch beim Ähnlichkeitsvergleich nutzen wir die normalisierte ID
                sim = similarity(normalized_id, row["ArtikelID"])
                if sim >= 0.7:
                    row_copy = dict(row)
                    row_copy["similarity"] = round(sim, 2)
                    results.append(row_copy)

            if results:
                best_match = max(results, key=lambda x: x["similarity"])
                return jsonify({"found": True, "match": best_match})
            else:
                return jsonify({"found": False, "match": None})
    finally:
        conn.close()

# =========================
# ZPL erstellen (75x40mm)
# Hinweis: Werte sind ein solider Start für 203 dpi
# =========================
def build_zpl(name: str, order: str, date_str: str) -> str:
    name = (name or "—")[:60]   # etwas mehr erlauben
    order = (order or "—")[:20]
    date_str = (date_str or "—")[:20]

    return f"""
^XA
^CI28
^PW560
^LL320
^LH0,0

^CF0,40
^FO0,20^FB560,2,5,C^FD{name}^FS

^CF0,70
^FO0,140^FB560,1,0,C^FD{order}^FS

^CF0,28
^FO0,280^FB560,1,0,C^FDDatum: {date_str}^FS

^XZ
""".strip()




# =========================
# RAW an Windows Drucker senden (pywin32)
# =========================
def send_zpl_windows(printer_name: str, zpl: str):
    if win32print is None:
        raise RuntimeError("pywin32 fehlt. Installiere: pip install pywin32")

    # RAW Job an den Spooler
    hPrinter = win32print.OpenPrinter(printer_name)
    try:
        # Datatype RAW ist wichtig, damit ZPL unverändert durchgeht
        job = win32print.StartDocPrinter(hPrinter, 1, ("ZPL Label", None, "RAW"))
        try:
            win32print.StartPagePrinter(hPrinter)
            try:
                # Bei Umlauten kann es je nach Setup zicken.
                # Falls nötig: encoding auf "cp1252" ändern.
                win32print.WritePrinter(hPrinter, zpl.encode("utf-8"))
            finally:
                win32print.EndPagePrinter(hPrinter)
        finally:
            win32print.EndDocPrinter(hPrinter)
    finally:
        win32print.ClosePrinter(hPrinter)

# =========================
# API: Drucken
# =========================
@app.route("/api/print", methods=["POST", "OPTIONS"])
def print_label():
    if request.method == "OPTIONS":
        return jsonify({"ok": True})

    token = request.headers.get("X-Print-Token", "")
    if token != PRINT_TOKEN:
        return jsonify({"ok": False, "error": "unauthorized"}), 401

    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "—").strip()
    order = (data.get("order") or "—").strip()
    date_str = (data.get("date") or "—").strip()

    try:
        zpl = build_zpl(name, order, date_str)
        send_zpl_windows(PRINTER_NAME, zpl)
        return jsonify({"ok": True})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500

# =========================
# CORS
# =========================
@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, X-Print-Token"
    return response

# =========================
# Start
# =========================
if __name__ == "__main__":
    app.run(host="host", port=port)
