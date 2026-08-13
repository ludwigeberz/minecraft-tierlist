/* ============================================================
   app.js — Anzeige der Tierlist.
   ============================================================ */

const App = (() => {

  const state = { players: [], rankings: [], tab: 'overall', search: '' };

  const $ = (sel) => document.querySelector(sel);
  const kitById    = (id) => CONFIG.kits.find(k => k.id === id);
  const regionById = (id) => CONFIG.regions.find(r => r.id === id);

  const esc = (s) => String(s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- Avatare ---------- */

  const initials = (name) => name.replace(/[^A-Za-z0-9]/g, '').slice(0, 2).toUpperCase() || '?';

  function hue(name) {
    let h = 0;
    for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % 360;
    return h;
  }

  function avatar(name, size) {
    const inner = CONFIG.avatarUrl
      ? `<img src="${CONFIG.avatarUrl.replace('{name}', encodeURIComponent(name))}"
              alt="" onerror="this.remove()">`
      : '';
    // Die Initialen liegen darunter und werden nur sichtbar,
    // wenn der Skin-Dienst nicht antwortet.
    return `<span class="avatar avatar-${size}" style="--h:${hue(name)}">
              <span class="avatar-fallback">${esc(initials(name))}</span>${inner}
            </span>`;
  }

  function titleFor(points) {
    return CONFIG.titles.find(t => points >= t.min) || CONFIG.titles[CONFIG.titles.length - 1];
  }

  /* ---------- Gesamtwertung ---------- */

  function standings() {
    const map = new Map();
    for (const r of state.rankings) {
      if (!map.has(r.player_id)) {
        map.set(r.player_id, {
          id: r.player_id, name: r.player_name, region: r.region,
          points: 0, places: {}, firsts: 0
        });
      }
      const e = map.get(r.player_id);
      e.points += CONFIG.points[r.place] || 0;
      e.places[r.kit] = r.place;
      if (r.place === 1) e.firsts++;
    }

    const list = [...map.values()].sort(
      (a, b) => b.points - a.points || b.firsts - a.firsts || a.name.localeCompare(b.name)
    );

    // Gleiche Punktzahl teilt sich denselben Rang (wie 6. / 6. im Original).
    let lastPoints = null, lastRank = 0;
    list.forEach((p, i) => {
      if (p.points !== lastPoints) { lastRank = i + 1; lastPoints = p.points; }
      p.rank = lastRank;
    });
    return list;
  }

  /* ---------- Tabs ---------- */

  function renderTabs() {
    const tabs = [{ id: 'overall', name: 'Gesamt', icon: '🏆', color: '#fbbf24' }, ...CONFIG.kits];
    $('#tabs').innerHTML = tabs.map(t => `
      <button class="tab ${state.tab === t.id ? 'active' : ''}"
              data-tab="${t.id}" style="--kit:${t.color}">
        <span class="tab-ico">${t.icon}</span>
        <span class="tab-name">${esc(t.name)}</span>
      </button>`).join('');

    $('#tabs').querySelectorAll('.tab').forEach(btn =>
      btn.addEventListener('click', () => {
        state.tab = btn.dataset.tab;
        render();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }));
  }

  /* ---------- Gesamtansicht ---------- */

  function regionPill(id) {
    if (!id) return '<span class="region-pill none">–</span>';
    const r = regionById(id);
    return `<span class="region-pill" style="--rc:${r ? r.color : '#64748b'}">${esc(id)}</span>`;
  }

  function renderOverall() {
    const all = standings();
    const q = state.search.trim().toLowerCase();
    const rows = q ? all.filter(p => p.name.toLowerCase().includes(q)) : all;

    $('#overall-list').innerHTML = rows.map(p => {
      const medal = p.rank === 1 ? 'gold' : p.rank === 2 ? 'silver' : p.rank === 3 ? 'bronze' : '';
      const t = titleFor(p.points);

      const chips = CONFIG.kits.map(k => {
        const place = p.places[k.id];
        if (!place) return `<div class="chip empty"><div class="chip-ring">–</div></div>`;
        return `<div class="chip place-${place}" style="--kit:${k.color}"
                     title="${esc(k.name)} · Platz ${place}">
                  <div class="chip-ring"><span>${k.icon}</span></div>
                  <div class="chip-label">#${place}</div>
                </div>`;
      }).join('');

      return `
        <article class="row ${medal}">
          <div class="plate ${medal}">
            <span class="plate-num">${p.rank}.</span>
            ${avatar(p.name, 'lg')}
          </div>

          <div class="row-main">
            <div class="row-name">${esc(p.name)}</div>
            <div class="row-title" style="--tc:${t.color}">
              <span class="title-gem">◆</span>${esc(t.name)}
              <span class="row-points">(${p.points} Punkte)</span>
            </div>
          </div>

          <div class="row-region">${regionPill(p.region)}</div>
          <div class="row-chips">${chips}</div>
        </article>`;
    }).join('');

    $('#overall-empty').classList.toggle('hidden', all.length > 0);
    if (q && rows.length === 0 && all.length > 0) {
      $('#overall-list').innerHTML = `<p class="empty">Kein Spieler gefunden für „${esc(state.search)}".</p>`;
    }
  }

  /* ---------- Kit-Ansicht ---------- */

  function renderKit() {
    const kit = kitById(state.tab);
    if (!kit) { state.tab = 'overall'; return renderOverall(); }

    document.documentElement.style.setProperty('--accent', kit.color);
    $('#kit-icon').textContent = kit.icon;
    $('#kit-title').textContent = kit.name;
    $('#kit-desc').textContent  = kit.desc;

    const byPlace = {};
    for (const r of state.rankings) if (r.kit === kit.id) byPlace[r.place] = r;

    let html = '';
    for (let place = 1; place <= CONFIG.placesPerKit; place++) {
      const r = byPlace[place];
      const medal = place === 1 ? 'gold' : place === 2 ? 'silver' : place === 3 ? 'bronze' : '';

      html += `
        <article class="row kit-row ${medal} ${r ? '' : 'is-empty'}" style="--kit:${kit.color}">
          <div class="plate ${medal}">
            <span class="plate-num">${place}.</span>
            ${r ? avatar(r.player_name, 'lg') : '<span class="avatar avatar-lg ghost">?</span>'}
          </div>
          <div class="row-main">
            <div class="row-name">${r ? esc(r.player_name) : 'noch frei'}</div>
            <div class="row-title" style="--tc:${kit.color}">
              <span class="title-gem">◆</span>Platz ${place}
              <span class="row-points">(${CONFIG.points[place] || 0} Punkte)</span>
            </div>
          </div>
          <div class="row-region">${r ? regionPill(r.region) : ''}</div>
          <div class="row-chips"><div class="big-place">#${place}</div></div>
        </article>`;
    }
    $('#kit-list').innerHTML = html;
  }

  function render() {
    renderTabs();
    const overall = state.tab === 'overall';
    $('#view-overall').classList.toggle('hidden', !overall);
    $('#view-kit').classList.toggle('hidden', overall);
    if (overall) {
      document.documentElement.style.setProperty('--accent', '#fbbf24');
      renderOverall();
    } else {
      renderKit();
    }
  }

  /* ---------- Laden ---------- */

  async function refresh() {
    try {
      const [players, rankings] = await Promise.all([DB.loadPlayers(), DB.loadRankings()]);
      state.players  = players;
      state.rankings = rankings;
      setStatus('ok');
      render();
    } catch (err) {
      setStatus('error', err.message);
      toast('Laden fehlgeschlagen: ' + err.message, 'error');
    }
  }

  function setStatus(kind, msg) {
    const badge = $('#conn-badge');
    badge.className = 'conn-badge ' + kind;
    badge.querySelector('.conn-text').textContent =
      kind === 'error' ? 'Fehler' : (DB.mode === 'demo' ? 'Demo' : 'Live');
    badge.title = msg || (DB.mode === 'demo'
      ? 'Ohne Supabase: Daten liegen nur in diesem Browser.'
      : 'Mit der Datenbank verbunden.');
  }

  let toastTimer;
  function toast(msg, kind = 'ok') {
    const el = $('#toast');
    el.textContent = msg;
    el.className = 'toast ' + kind;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.add('hidden'), 3000);
  }

  /* ---------- Overlays ---------- */

  function openOverlay(id)  { document.querySelector('#' + id + '-overlay').classList.remove('hidden'); }
  function closeOverlay(id) { document.querySelector('#' + id + '-overlay').classList.add('hidden'); }

  /* ---------- Start ---------- */

  function init() {
    document.title = CONFIG.title;
    $('#server-ip').firstChild.textContent = CONFIG.serverIp + ' ';

    $('#points-legend').innerHTML = Object.entries(CONFIG.points)
      .map(([place, pts]) => `<li><b>Platz ${place}</b><span>${pts} Punkte</span></li>`).join('');

    $('#search').addEventListener('input', (e) => {
      state.search = e.target.value;
      if (state.tab !== 'overall') { state.tab = 'overall'; render(); }
      else renderOverall();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === '/' && document.activeElement.tagName !== 'INPUT') {
        e.preventDefault(); $('#search').focus();
      }
      if (e.key === 'Escape') { closeOverlay('info'); closeOverlay('admin'); }
    });

    $('#info-btn').addEventListener('click', () => openOverlay('info'));
    document.querySelectorAll('[data-close]').forEach(b =>
      b.addEventListener('click', () => closeOverlay(b.dataset.close)));
    document.querySelectorAll('.overlay').forEach(o =>
      o.addEventListener('click', (e) => { if (e.target === o) o.classList.add('hidden'); }));

    $('#server-ip').addEventListener('click', () => {
      navigator.clipboard.writeText(CONFIG.serverIp)
        .then(() => toast('Server-IP kopiert'))
        .catch(() => toast('Kopieren nicht möglich', 'error'));
    });

    render();
    refresh();
    DB.subscribe(refresh);
  }

  document.addEventListener('DOMContentLoaded', init);

  return { refresh, state, toast, avatar, esc, regionPill, openOverlay, closeOverlay };
})();
