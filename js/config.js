/* ============================================================
   config.js — hier stellst du alles ein.
   ============================================================ */

const CONFIG = {

  /* ---- Kopfzeile ---------------------------------------- */
  title: 'PvP Tierlist',
  serverIp: 'mcpvp.club',

  /* ---- Supabase ------------------------------------------
     Beide Werte stehen im Supabase-Dashboard unter
     Project Settings -> API. Der publishable/anon key ist
     oeffentlich, der darf hier stehen.
     Solange PLACEHOLDER drinsteht, laeuft alles im
     Demo-Modus (Daten nur in diesem Browser).             */
  supabaseUrl: 'https://lqsylwxznqbxljvszuys.supabase.co',
  supabaseKey: 'sb_publishable_iFYFddRKy0xdJPKLFi66UQ_EIWdqYaf',

  /* ---- Admin-PIN -----------------------------------------
     Es gibt genau einen Admin-Zugang. Nach aussen tippst du
     nur einen PIN ein - technisch ist das das Passwort dieses
     Supabase-Benutzers, geprueft wird also auf dem Server.
     Wer den PIN nicht hat, kann nichts aendern, auch nicht
     ueber Umwege im Quelltext.
     Den PIN selbst setzt du im Supabase-Dashboard unter
     Authentication -> Users (mind. 6 Zeichen).
     Hier steht nur die dazugehoerige E-Mail.              */
  adminEmail: 'admin@tierlist.local',

  /* Nur fuer den Demo-Modus ohne Supabase: */
  demoPin: '123456',

  /* ---- Plaetze und Punkte --------------------------------
     Pro Kit gibt es Platz 1 bis 15. Die Punkte fallen oben
     steil ab und unten flach - Platz 1 statt 2 ist also
     deutlich mehr wert als Platz 12 statt 13.
     Aenderst du placesPerKit auf mehr als 15, muss auch die
     Pruefregel in der Datenbank angepasst werden
     (siehe supabase/schema.sql).                           */
  placesPerKit: 15,
  points: {
     1: 30,  2: 25,  3: 21,  4: 18,  5: 15,
     6: 13,  7: 11,  8:  9,  9:  8, 10:  7,
    11:  6, 12:  5, 13:  4, 14:  3, 15:  2
  },

  /* ---- Die Kits (Reihenfolge wie in der Tableiste) -------
     id  = Schluessel in der Datenbank, nicht mehr aendern,
           sobald Daten drin sind.                         */
  kits: [
    { id: 'ltms',    name: 'LTMs',    icon: '⚔️', color: '#94a3b8', desc: 'Limited Time Modes' },
    { id: 'vanilla', name: 'Vanilla', icon: '🔮', color: '#a855f7', desc: 'Grundlagen mit Standard-Kit' },
    { id: 'uhc',     name: 'UHC',     icon: '❤️', color: '#ef4444', desc: 'Heilen, Trades und lange Kaempfe' },
    { id: 'pot',     name: 'Pot',     icon: '🧪', color: '#f472b6', desc: 'Pot-Aim, Refill und Sustain' },
    { id: 'nethop',  name: 'NethOP',  icon: '⚗️', color: '#a78bfa', desc: 'Netherite-Pot-PvP' },
    { id: 'smp',     name: 'SMP',     icon: '🟢', color: '#10b981', desc: 'Survival-Kampf und Utility' },
    { id: 'sword',   name: 'Sword',   icon: '🗡️', color: '#3b82f6', desc: 'Klassisches Schwert-PvP' },
    { id: 'axe',     name: 'Axe',     icon: '🪓', color: '#38bdf8', desc: 'Schilddruck und Axtkontrolle' },
    { id: 'mace',    name: 'Mace',    icon: '🔨', color: '#f59e0b', desc: 'Wuchtige Treffer und Timing' }
  ],

  /* ---- Regionen ------------------------------------------ */
  regions: [
    { id: 'EU', color: '#22c55e' },
    { id: 'NA', color: '#ef4444' },
    { id: 'AS', color: '#eab308' },
    { id: 'SA', color: '#8b5cf6' },
    { id: 'OCE', color: '#06b6d4' }
  ],

  /* ---- Rang-Titel ----------------------------------------
     min = ab so vielen Punkten. Von oben nach unten geprueft.
     Hoechstmoegliche Punktzahl: 9 Kits x 30 = 270.         */
  titles: [
    { min: 180, name: 'Combat Grandmaster', color: '#fbbf24' },
    { min: 120, name: 'Combat Master',      color: '#f59e0b' },
    { min:  75, name: 'Combat Ace',         color: '#f43f5e' },
    { min:  45, name: 'Combat Specialist',  color: '#a855f7' },
    { min:  20, name: 'Combat Cadet',       color: '#3b82f6' },
    { min:   1, name: 'Combat Novice',      color: '#64748b' },
    { min:   0, name: 'Unranked',           color: '#475569' }
  ],

  /* ---- Skin-Koepfe ---------------------------------------
     {name} wird durch den Spielernamen ersetzt.
     Leer lassen ('') fuer farbige Initialen statt Skins.  */
  avatarUrl: 'https://mc-heads.net/avatar/{name}/96'
};
