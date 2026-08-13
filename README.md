# PvP Tierlist

Eigene Tierlist für unsere Crew — Optik angelehnt an MCTiers, Kits vom Server `mcpvp.club`.
Pro Kit gibt es die **Plätze 1–5**, daraus wird eine Gesamtwertung mit Punkten und Rang-Titeln berechnet.

Reines HTML/CSS/JS — kein Node, kein Build. `index.html` doppelklicken reicht.

---

## Dateien

| Datei | wofür |
|---|---|
| `index.html` | Gerüst der Seite |
| `css/style.css` | komplettes Design |
| `js/config.js` | **hier stellst du alles ein** (Kits, Punkte, Supabase, PIN-Konto) |
| `js/data.js` | Datenbankzugriff (Supabase oder Demo-Modus) |
| `js/app.js` | Anzeige von Gesamtliste und Kit-Seiten |
| `js/admin.js` | PIN-Login und Bearbeiten |
| `supabase/schema.sql` | Tabellen + Rechte für Supabase |

---

## Demo-Modus

Steht in `js/config.js` bei `supabaseUrl` / `supabaseKey` wieder `PLACEHOLDER`,
speichert die Seite alles nur im eigenen Browser — praktisch zum Ausprobieren
ohne Internet. Admin-PIN dort: **`123456`** (einstellbar über `demoPin`).

---

## Supabase

Projekt **`pvp-tierlist`** ist bereits angelegt (Region Frankfurt, kostenlos),
Tabellen und Rechte sind eingespielt, URL und Key stehen schon in `js/config.js`.

Dashboard: <https://supabase.com/dashboard/project/lqsylwxznqbxljvszuys>

### Noch zu tun: Admin-Konto anlegen — das ist dein PIN

Dashboard → **Authentication → Users → Add user**

| Feld | Wert |
|---|---|
| E-Mail | `admin@tierlist.local` |
| Passwort | **dein 6-stelliger PIN** |
| Auto Confirm User | Haken setzen |

> Supabase verlangt mindestens 6 Zeichen — der PIN muss also 6-stellig sein.
> Passwörter trage ich grundsätzlich nicht für dich ein, das machst du selbst.

Empfohlen: unter **Authentication → Sign In / Providers** die Registrierung
abschalten (*Allow new users to sign up* → aus). Nötig ist es nicht — die
Schreibrechte hängen fest an `admin@tierlist.local` —, aber es hält die
Benutzerliste sauber.

### Falls du eine andere Admin-E-Mail willst

Dann muss sie an **zwei** Stellen stehen: `adminEmail` in `js/config.js`
**und** in den beiden Policies in `supabase/schema.sql` (danach im SQL Editor
ausführen). Sonst sperrt die Datenbank dich selbst aus.

---

## Warum der PIN wirklich schützt

Der PIN wird **nicht** im JavaScript verglichen — er ist das Passwort des einen
Supabase-Kontos. Die Datenbank lehnt jede Änderung ab, die nicht von einer
angemeldeten Sitzung kommt (Row Level Security in `schema.sql`).
Wer den Quelltext liest, kommt damit trotzdem nicht weiter.

---

## Bedienung

- **Admin** oben rechts → PIN eingeben
- **Spieler** hinzufügen (Minecraft-Name + Region)
- **Platzierungen** → Kit wählen → für Platz 1–5 je einen Spieler auswählen
- Änderungen sind sofort bei allen sichtbar (Live-Updates)

Ein Spieler kann pro Kit nur auf **einem** Platz stehen — wird er woanders
eingetragen, wird sein alter Platz automatisch frei.

---

## Anpassen

Alles in `js/config.js`:

- **Kits** — Name, Symbol, Farbe, Beschreibung. `id` nach dem ersten Eintrag nicht mehr ändern.
- **Punkte** — `points: { 1: 10, 2: 7, 3: 5, 4: 3, 5: 1 }`
- **Rang-Titel** — Punktegrenzen und Farben unter `titles`
- **Regionen** — Kürzel und Farben unter `regions`
- **Skins** — `avatarUrl`, leer lassen für farbige Initialen statt Skin-Köpfe

---

## Ins Netz stellen

### 1. Zusammenbauen

```
powershell -ExecutionPolicy Bypass -File build.ps1
```

Das schreibt `dist/index.html` — eine einzige Datei mit CSS und JavaScript darin.
**Nach jeder Änderung** an `index.html`, `css/` oder `js/` neu ausführen.

### 2. Hochladen

[app.netlify.com/drop](https://app.netlify.com/drop) öffnen und den **Ordner `dist`**
per Drag & Drop auf die Seite ziehen. Kein Konto nötig, du bekommst sofort eine
Adresse wie `https://schillernder-name-123.netlify.app`.

Diesen Link teilst du mit deinen Freunden. Sie sehen die Liste, ändern kann sie
nur, wer den PIN hat.

> Ohne Konto verfällt die Seite nach ein paar Stunden. Wenn du dich mit GitHub
> oder E-Mail anmeldest, bleibt sie dauerhaft und du kannst unter *Site settings →
> Change site name* eine hübschere Adresse wählen.

### Aktualisieren

`build.ps1` laufen lassen, dann bei Netlify unter **Deploys** den `dist`-Ordner
erneut auf das Feld ziehen. Der Link bleibt gleich.

### Was nicht funktioniert

Supabase Edge Functions taugen nicht als Webhoster — das Gateway setzt auf jede
Antwort `Content-Security-Policy: default-src 'none'; sandbox`, damit läuft im
Browser kein JavaScript. Wurde ausprobiert und wieder entfernt.
