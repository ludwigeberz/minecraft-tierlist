/* ============================================================
   data.js — Datenzugriff.

   Zwei Betriebsarten:
     "supabase"  echte Online-Datenbank, alle sehen dasselbe
     "demo"      Fallback im Browser (localStorage), solange in
                 config.js noch PLACEHOLDER steht
   Beide bieten dieselben Funktionen, der Rest der Seite merkt
   keinen Unterschied.
   ============================================================ */

const DB = (() => {
  const configured =
    CONFIG.supabaseUrl && CONFIG.supabaseUrl !== 'PLACEHOLDER' &&
    CONFIG.supabaseKey && CONFIG.supabaseKey !== 'PLACEHOLDER';

  const mode = configured ? 'supabase' : 'demo';
  const sb = configured
    ? window.supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabaseKey)
    : null;

  /* ---------- Demo-Speicher ---------- */
  const LS_KEY = 'pvp-tierlist-demo';
  const demo = {
    read() {
      try { return JSON.parse(localStorage.getItem(LS_KEY)) || { players: [], rankings: [] }; }
      catch { return { players: [], rankings: [] }; }
    },
    write(state) {
      localStorage.setItem(LS_KEY, JSON.stringify(state));
    }
  };

  const uid  = () => 'p' + Math.random().toString(36).slice(2, 10);
  const fail = (error) => { throw new Error(error.message || 'Datenbankfehler'); };

  return {
    mode,

    /* ================= Lesen ================= */

    async loadPlayers() {
      if (mode === 'demo') {
        return demo.read().players.slice().sort((a, b) => a.name.localeCompare(b.name));
      }
      const { data, error } = await sb.from('players').select('id, name, region').order('name');
      if (error) fail(error);
      return data;
    },

    /* Gibt [{ kit, place, player_id, player_name, region }] zurueck. */
    async loadRankings() {
      if (mode === 'demo') {
        const state = demo.read();
        const byId = Object.fromEntries(state.players.map(p => [p.id, p]));
        return state.rankings
          .filter(r => byId[r.player_id])
          .map(r => ({
            ...r,
            player_name: byId[r.player_id].name,
            region: byId[r.player_id].region
          }));
      }
      const { data, error } = await sb
        .from('rankings')
        .select('kit, place, player_id, players(name, region)')
        .order('place');
      if (error) fail(error);
      return data.map(r => ({
        kit: r.kit,
        place: r.place,
        player_id: r.player_id,
        player_name: r.players ? r.players.name : '?',
        region: r.players ? r.players.region : null
      }));
    },

    /* ================= Schreiben ================= */

    async addPlayer(name, region) {
      name = name.trim();
      if (!name) throw new Error('Name ist leer.');

      if (mode === 'demo') {
        const state = demo.read();
        if (state.players.some(p => p.name.toLowerCase() === name.toLowerCase())) {
          throw new Error('Diesen Spieler gibt es schon.');
        }
        const player = { id: uid(), name, region: region || null };
        state.players.push(player);
        demo.write(state);
        return player;
      }

      const { data, error } = await sb
        .from('players').insert({ name, region: region || null })
        .select('id, name, region').single();
      if (error) {
        if (error.code === '23505') throw new Error('Diesen Spieler gibt es schon.');
        fail(error);
      }
      return data;
    },

    async deletePlayer(id) {
      if (mode === 'demo') {
        const state = demo.read();
        state.players  = state.players.filter(p => p.id !== id);
        state.rankings = state.rankings.filter(r => r.player_id !== id);
        demo.write(state);
        return;
      }
      const { error } = await sb.from('players').delete().eq('id', id);
      if (error) fail(error);
    },

    /* playerId === null  =>  Platz wird freigeraeumt.
       Ist der Spieler in diesem Kit schon woanders platziert,
       wird sein alter Platz frei (ein Platz pro Kit).        */
    async setPlace(kit, place, playerId) {
      if (mode === 'demo') {
        const state = demo.read();
        state.rankings = state.rankings.filter(
          r => !(r.kit === kit && (r.place === place || r.player_id === playerId))
        );
        if (playerId) state.rankings.push({ kit, place, player_id: playerId });
        demo.write(state);
        return;
      }

      if (playerId) {
        const { error: e1 } = await sb.from('rankings')
          .delete().eq('kit', kit).eq('player_id', playerId);
        if (e1) fail(e1);
      }
      const { error: e2 } = await sb.from('rankings')
        .delete().eq('kit', kit).eq('place', place);
      if (e2) fail(e2);

      if (!playerId) return;

      const { error: e3 } = await sb.from('rankings').insert({ kit, place, player_id: playerId });
      if (e3) fail(e3);
    },

    /* ================= Login ================= */

    async currentUser() {
      if (mode === 'demo') {
        return localStorage.getItem(LS_KEY + '-admin') ? { email: 'Demo-Admin' } : null;
      }
      const { data } = await sb.auth.getSession();
      return data.session ? data.session.user : null;
    },

    /* Der PIN ist das Passwort des einen Admin-Kontos. Geprueft
       wird er von Supabase, nicht hier im Browser - deshalb
       nuetzt es nichts, den Quelltext zu lesen.               */
    async signIn(pin) {
      if (mode === 'demo') {
        if (pin !== CONFIG.demoPin) throw new Error('Falscher PIN.');
        localStorage.setItem(LS_KEY + '-admin', '1');
        return { email: 'Demo-Admin' };
      }
      const { data, error } = await sb.auth.signInWithPassword({
        email: CONFIG.adminEmail,
        password: pin
      });
      if (error) throw new Error('Falscher PIN.');
      return data.user;
    },

    async signOut() {
      if (mode === 'demo') { localStorage.removeItem(LS_KEY + '-admin'); return; }
      await sb.auth.signOut();
    },

    /* ================= Live-Updates ================= */

    /* cb() laeuft, sobald jemand anderes etwas aendert. */
    subscribe(cb) {
      if (mode === 'demo') {
        window.addEventListener('storage', (e) => { if (e.key === LS_KEY) cb(); });
        return;
      }
      sb.channel('tierlist')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'rankings' }, cb)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, cb)
        .subscribe();
    }
  };
})();
