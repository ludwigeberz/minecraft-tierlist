/* ============================================================
   admin.js — PIN-Login und Bearbeiten.
   ============================================================ */

(() => {
  const $ = (sel) => document.querySelector(sel);
  const esc = (s) => App.esc(s);

  /* welches Kit die Uebersicht unten gerade zeigt */
  let viewKit = CONFIG.kits[0].id;

  /* Auswahl im Dialog "Platz vergeben" */
  const draft = { playerId: '', kit: CONFIG.kits[0].id, place: null };

  const playerById = (id) => App.state.players.find(p => p.id === id);

  function placeHolder(kit, place) {
    const r = App.state.rankings.find(x => x.kit === kit && x.place === place);
    return r ? r.player_name : null;
  }

  /* ============================================================
     Umschalten Login <-> Editor
     ============================================================ */

  async function syncPanel() {
    const user = await DB.currentUser();
    $('#login-form').classList.toggle('hidden', !!user);
    $('#editor').classList.toggle('hidden', !user);
    $('#admin-btn').classList.toggle('is-admin', !!user);
    if (user) {
      $('#who').textContent = user.email;
      renderEditor();
    }
  }

  /* ============================================================
     Editor: Spielerliste
     ============================================================ */

  function renderPlayerList() {
    const players = App.state.players;
    $('#player-admin-list').innerHTML = players.length
      ? players.map(p => `
          <li>
            ${App.avatar(p.name, 'xs')}
            <span class="pa-name">${esc(p.name)}</span>
            ${App.regionPill(p.region)}
            <button class="icon-btn danger" data-del="${esc(p.id)}"
                    title="${esc(p.name)} löschen">✕</button>
          </li>`).join('')
      : '<li class="muted small">Noch keine Spieler.</li>';

    $('#player-admin-list').querySelectorAll('[data-del]').forEach(btn =>
      btn.addEventListener('click', async () => {
        const player = playerById(btn.dataset.del);
        if (!confirm(`"${player.name}" wirklich löschen? Alle Platzierungen gehen mit.`)) return;
        try {
          await DB.deletePlayer(player.id);
          await App.refresh();
          renderEditor();
          App.toast(player.name + ' gelöscht');
        } catch (err) { App.toast(err.message, 'error'); }
      }));
  }

  /* ============================================================
     Editor: Uebersicht der Plaetze (nur ansehen + freimachen)
     ============================================================ */

  function renderPlaceEditor() {
    let html = '';
    for (let place = 1; place <= CONFIG.placesPerKit; place++) {
      const name = placeHolder(viewKit, place);
      html += `
        <div class="place-row place-${place} ${name ? '' : 'is-free'}">
          <span class="slot-num">${place}</span>
          ${name ? App.avatar(name, 'xs') : ''}
          <span class="place-name">${name ? esc(name) : 'frei'}</span>
          ${name ? `<button type="button" class="icon-btn danger" data-clear="${place}"
                            title="Platz ${place} freimachen">✕</button>` : ''}
        </div>`;
    }
    $('#place-editor').innerHTML = html;

    $('#place-editor').querySelectorAll('[data-clear]').forEach(btn =>
      btn.addEventListener('click', async () => {
        try {
          await DB.setPlace(viewKit, Number(btn.dataset.clear), null);
          await App.refresh();
          renderPlaceEditor();
          App.toast('Platz freigemacht');
        } catch (err) { App.toast(err.message, 'error'); }
      }));
  }

  function renderEditor() {
    $('#edit-kit').innerHTML = CONFIG.kits.map(k =>
      `<option value="${k.id}" ${k.id === viewKit ? 'selected' : ''}>${k.icon} ${esc(k.name)}</option>`
    ).join('');
    $('#new-region').innerHTML = '<option value="">Region…</option>' +
      CONFIG.regions.map(r => `<option value="${r.id}">${r.id}</option>`).join('');
    renderPlayerList();
    renderPlaceEditor();
  }

  /* ============================================================
     Dialog "Platz vergeben"
     ============================================================ */

  function renderAssign() {
    /* Schritt 1 — Spieler */
    $('#assign-player').innerHTML =
      '<option value="">— Spieler wählen —</option>' +
      App.state.players.map(p =>
        `<option value="${esc(p.id)}" ${p.id === draft.playerId ? 'selected' : ''}>${esc(p.name)}</option>`
      ).join('') +
      `<option value="__new__" ${draft.playerId === '__new__' ? 'selected' : ''}>➕ Neuer Spieler…</option>`;

    $('#assign-new').classList.toggle('hidden', draft.playerId !== '__new__');
    $('#assign-newregion').innerHTML = '<option value="">Region…</option>' +
      CONFIG.regions.map(r => `<option value="${r.id}">${r.id}</option>`).join('');

    /* Schritt 2 — Kit */
    $('#assign-kit').innerHTML = CONFIG.kits.map(k =>
      `<option value="${k.id}" ${k.id === draft.kit ? 'selected' : ''}>${k.icon} ${esc(k.name)}</option>`
    ).join('');

    /* Schritt 3 — Platz */
    let picker = '';
    for (let place = 1; place <= CONFIG.placesPerKit; place++) {
      const taken = placeHolder(draft.kit, place);
      picker += `
        <button type="button" class="pp-btn place-${place} ${draft.place === place ? 'selected' : ''}"
                data-place="${place}">
          <span class="pp-num">${place}</span>
          <span class="pp-who">${taken ? esc(taken) : 'frei'}</span>
        </button>`;
    }
    $('#assign-places').innerHTML = picker;

    $('#assign-places').querySelectorAll('[data-place]').forEach(btn =>
      btn.addEventListener('click', () => {
        draft.place = Number(btn.dataset.place);
        renderAssign();
      }));

    renderHint();
  }

  /* Sagt vorher, was das Speichern bewirkt. */
  function renderHint() {
    const hint = $('#assign-hint');
    const kit = CONFIG.kits.find(k => k.id === draft.kit);

    if (!draft.place || !draft.playerId) { hint.classList.add('hidden'); return; }

    const name = draft.playerId === '__new__'
      ? ($('#assign-newname').value.trim() || 'Der neue Spieler')
      : (playerById(draft.playerId) || {}).name;

    const parts = [];
    const taken = placeHolder(draft.kit, draft.place);
    if (taken && taken !== name) parts.push(`<b>${esc(taken)}</b> verliert Platz ${draft.place}`);

    const old = App.state.rankings.find(
      r => r.kit === draft.kit && r.player_id === draft.playerId && r.place !== draft.place);
    if (old) parts.push(`Platz ${old.place} wird frei`);

    hint.innerHTML =
      `<b>${esc(name)}</b> kommt bei <b>${esc(kit.name)}</b> auf <b>Platz ${draft.place}</b>` +
      (parts.length ? ` · ${parts.join(' · ')}` : '');
    hint.classList.remove('hidden');
  }

  function openAssign() {
    draft.playerId = '';
    draft.kit = viewKit;
    draft.place = null;
    $('#assign-newname').value = '';
    $('#assign-error').classList.add('hidden');
    renderAssign();
    App.openOverlay('assign');
  }

  async function saveAssign(e) {
    e.preventDefault();
    const err = $('#assign-error');
    err.classList.add('hidden');

    if (!draft.playerId) { err.textContent = 'Bitte einen Spieler wählen.'; err.classList.remove('hidden'); return; }
    if (!draft.place)    { err.textContent = 'Bitte einen Platz wählen.';   err.classList.remove('hidden'); return; }

    const btn = $('#assign-form button[type=submit]');
    btn.disabled = true;
    try {
      let playerId = draft.playerId;

      if (playerId === '__new__') {
        const name = $('#assign-newname').value.trim();
        if (!name) throw new Error('Bitte einen Namen eingeben.');
        const created = await DB.addPlayer(name, $('#assign-newregion').value);
        playerId = created.id;
      }

      await DB.setPlace(draft.kit, draft.place, playerId);
      await App.refresh();

      viewKit = draft.kit;
      renderEditor();
      App.closeOverlay('assign');
      App.toast('Platz vergeben');
    } catch (ex) {
      err.textContent = ex.message;
      err.classList.remove('hidden');
    } finally {
      btn.disabled = false;
    }
  }

  /* ============================================================
     Ereignisse
     ============================================================ */

  document.addEventListener('DOMContentLoaded', () => {

    $('#admin-btn').addEventListener('click', async () => {
      App.openOverlay('admin');
      await syncPanel();
    });

    $('#login-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const err = $('#login-error');
      const pin = $('#login-pin');
      err.classList.add('hidden');
      try {
        await DB.signIn(pin.value);
        pin.value = '';
        await syncPanel();
        App.toast('Entsperrt');
      } catch (ex) {
        err.textContent = ex.message;
        err.classList.remove('hidden');
        pin.select();
      }
    });

    $('#logout-btn').addEventListener('click', async () => {
      await DB.signOut();
      await syncPanel();
      App.toast('Gesperrt');
    });

    $('#add-player-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = $('#new-player');
      try {
        await DB.addPlayer(input.value, $('#new-region').value);
        input.value = '';
        await App.refresh();
        renderEditor();
        App.toast('Spieler hinzugefügt');
      } catch (err) { App.toast(err.message, 'error'); }
    });

    $('#edit-kit').addEventListener('change', (e) => {
      viewKit = e.target.value;
      renderPlaceEditor();
    });

    /* --- Dialog "Platz vergeben" --- */
    $('#assign-btn').addEventListener('click', openAssign);
    $('#assign-form').addEventListener('submit', saveAssign);

    $('#assign-player').addEventListener('change', (e) => {
      draft.playerId = e.target.value;
      renderAssign();
      if (draft.playerId === '__new__') $('#assign-newname').focus();
    });

    $('#assign-kit').addEventListener('change', (e) => {
      draft.kit = e.target.value;
      draft.place = null;
      renderAssign();
    });

    $('#assign-newname').addEventListener('input', renderHint);
  });
})();
