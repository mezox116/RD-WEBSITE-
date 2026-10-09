(() => {
'use strict';

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

const STORE = 'rd_red_devils_site_v2';
const OWNER_PASSWORD = 'RDrun';

let data = { players: [], matches: [], results: [] };

try {
    const saved = JSON.parse(localStorage.getItem(STORE));
    if (saved && Array.isArray(saved.players)) {
        data = { ...data, ...saved };
    }
} catch (e) {}

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
}[c]));

function fmt(s) {
    if (!s) return 'Date to be announced';
    const d = new Date(s);
    return isNaN(d) ? s : d.toLocaleString([], {
        dateStyle: 'medium',
        timeStyle: 'short'
    });
}

function save() {
    localStorage.setItem(STORE, JSON.stringify(data));
    render();
}

function avatar(p) {
    return p.photo
        ? `<img class="avatar" src="${p.photo}" alt="${esc(p.name)}">`
        : `<div class="avatar placeholder">${esc((p.name || '?').trim().charAt(0).toUpperCase())}</div>`;
}

function playerCard(p) {
    return `
    <article class="card player clickable"
        tabindex="0" role="button" data-profile="${esc(p.id)}">
        ${avatar(p)}
        <div>
            <h3>${esc(p.name)}</h3>
            <div class="tiny">${esc(p.position || 'Position not set')}</div>
            ${p.captain ? '<span class="pill captain">Captain</span>' : ''}
        </div>
    </article>`;
}

function render() {
    const captains = data.players.filter(p => p.captain);
    const players = data.players.filter(p => !p.captain);

    $('#captainsGrid').innerHTML = captains.length
        ? captains.map(playerCard).join('')
        : '<div class="empty">No captains added yet.</div>';

    $('#playersGrid').innerHTML = players.length
        ? players.map(playerCard).join('')
        : '<div class="empty">No players added yet.</div>';

    const matches = data.matches.slice()
        .sort((a, b) => new Date(a.time) - new Date(b.time));

    $('#matchesGrid').innerHTML = matches.length
        ? matches.map(m => `
        <article class="card match">
            <div class="matchtop">
                <span class="pill">Upcoming</span>
                <span class="tiny">RD MATCH</span>
            </div>
            <div class="teams">
                <div>${esc(m.team1)}</div>
                <div class="vs">VS</div>
                <div>${esc(m.team2)}</div>
            </div>
            <div class="time">${esc(fmt(m.time))}</div>
            <div class="countdown" data-countdown="${esc(m.time)}"></div>
        </article>`).join('')
        : '<div class="empty">No upcoming matches.</div>';

    const results = data.results.slice()
        .sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0));

    $('#resultsGrid').innerHTML = results.length
        ? results.map(r => `
        <article class="card match">
            <div class="matchtop">
                <span class="pill">Full time</span>
                <span class="tiny">${esc(r.time || 'Result')}</span>
            </div>
            <div class="teams">
                <div class="resultteam ${Number(r.score1) > Number(r.score2) ? 'winner' : ''}">
                    ${esc(r.team1)}
                </div>
                <div class="score">${Number(r.score1)} : ${Number(r.score2)}</div>
                <div class="resultteam ${Number(r.score2) > Number(r.score1) ? 'winner' : ''}">
                    ${esc(r.team2)}
                </div>
            </div>
        </article>`).join('')
        : '<div class="empty">No results recorded yet.</div>';

    $('#playerCount').textContent = data.players.length;
    $('#matchCount').textContent = data.matches.length;
    $('#resultCount').textContent = data.results.length;

    fillSelects();
    updateCountdowns();
}

function fillSelects() {
    const opts = data.players.map(p => `
        <option value="${esc(p.id)}">
            ${esc(p.name)}${p.captain ? ' (Captain)' : ''}
        </option>`).join('');

    [
        '#captainSelect',
        '#removePlayerSelect',
        '#removeCaptainSelect'
    ].forEach(id => {
        const el = $(id);
        if (!el) return;

        const old = el.value;
        el.innerHTML = opts || '<option value="">No players available</option>';

        if ([...el.options].some(o => o.value === old)) {
            el.value = old;
        }
    });

    const m = $('#removeMatchSelect');

    if (m) {
        const old = m.value;

        m.innerHTML = data.matches.map(x => `
            <option value="${esc(x.id)}">
                ${esc(x.team1)} vs ${esc(x.team2)} — ${esc(fmt(x.time))}
            </option>`).join('')
            || '<option value="">No matches available</option>';

        if ([...m.options].some(o => o.value === old)) {
            m.value = old;
        }
    }
}

function updateCountdowns() {
    $$('.countdown').forEach(el => {
        const diff = new Date(el.dataset.countdown).getTime() - Date.now();

        if (!Number.isFinite(diff)) {
            el.textContent = '';
            return;
        }

        if (diff <= 0) {
            el.textContent = 'Kick-off time reached';
            return;
        }

        const d = Math.floor(diff / 86400000);
        const h = Math.floor(diff % 86400000 / 3600000);
        const m = Math.floor(diff % 3600000 / 60000);
        const s = Math.floor(diff % 60000 / 1000);

        el.textContent = `KICK-OFF IN ${d}d ${h}h ${m}m ${s}s`;
    });
}

function notice(id, msg, ok = true) {
    const el = $(id);
    if (!el) return;

    el.textContent = msg;
    el.style.background = ok ? '#16301d' : '#351016';
    el.style.borderColor = ok ? '#28643b' : '#81202b';
    el.classList.add('show');
}

$('#year').textContent = new Date().getFullYear();

$$('.admin-tabs button').forEach(b => {
    b.addEventListener('click', () => {
        $$('.admin-tabs button').forEach(x =>
            x.classList.toggle('active', x === b)
        );

        $$('.adminform').forEach(x =>
            x.classList.toggle('active', x.id === 'form-' + b.dataset.tab)
        );
    });
});

/* OWNER LOGIN — PASSWORD: RDrun */
$('#loginForm').addEventListener('submit', e => {
    e.preventDefault();

    const password = $('#password').value.trim();

    if (password === OWNER_PASSWORD) {
        $('#loginView').classList.add('hide');
        $('#dashboard').classList.remove('hide');
        notice('#adminNotice', 'Owner panel unlocked.');
    } else {
        notice('#loginNotice', 'Incorrect password.', false);
    }
});

$('#logout').addEventListener('click', () => {
    $('#dashboard').classList.add('hide');
    $('#loginView').classList.remove('hide');
    $('#password').value = '';
});

function formData(form) {
    return Object.fromEntries(new FormData(form).entries());
}

/* ADD PLAYER */
$('#playerForm').addEventListener('submit', async e => {
    e.preventDefault();

    const f = e.currentTarget;
    const v = formData(f);
    let photo = '';

    const file = f.elements.photo.files[0];

    if (file) {
        if (file.size > 1500000) {
            notice('#adminNotice', 'Photo must be smaller than 1.5 MB.', false);
            return;
        }

        photo = await new Promise((resolve, reject) => {
            const r = new FileReader();
            r.onload = () => resolve(r.result);
            r.onerror = reject;
            r.readAsDataURL(file);
        });
    }

    data.players.push({
        id: crypto.randomUUID
            ? crypto.randomUUID()
            : String(Date.now()),
        name: v.name.trim(),
        position: v.position.trim(),
        matchesPlayed: Math.max(0, Number(v.matchesPlayed) || 0),
        wins: Math.max(0, Number(v.wins) || 0),
        tenure: v.tenure.trim() || 'Not specified',
        photo,
        captain: false
    });

    save();
    f.reset();

    f.elements.matchesPlayed.value = 0;
    f.elements.wins.value = 0;

    notice('#adminNotice', 'Player added successfully.');
});

/* ADD CAPTAIN */
$('#captainForm').addEventListener('submit', e => {
    e.preventDefault();

    const p = data.players.find(
        x => x.id === e.currentTarget.elements.player.value
    );

    if (!p) {
        notice('#adminNotice', 'Add a player first.', false);
        return;
    }

    p.captain = true;
    save();
    notice('#adminNotice', `${p.name} is now a captain.`);
});

/* REMOVE PLAYER */
$('#removePlayerForm').addEventListener('submit', e => {
    e.preventDefault();

    const id = e.currentTarget.elements.player.value;
    const p = data.players.find(x => x.id === id);

    if (!p) return;

    data.players = data.players.filter(x => x.id !== id);
    save();
    notice('#adminNotice', `${p.name} removed.`);
});

/* REMOVE CAPTAIN STATUS */
$('#removeCaptainForm').addEventListener('submit', e => {
    e.preventDefault();

    const p = data.players.find(
        x => x.id === e.currentTarget.elements.player.value
    );

    if (!p) return;

    p.captain = false;
    save();
    notice('#adminNotice', `${p.name} is no longer a captain.`);
});

/* ADD MATCH */
$('#matchForm').addEventListener('submit', e => {
    e.preventDefault();

    const f = e.currentTarget;
    const v = formData(f);
    const time = new Date(`${v.date}T${v.clock}`);

    if (!v.date || !v.clock || isNaN(time)) {
        notice('#adminNotice', 'Choose a valid date and time.', false);
        return;
    }

    if (time.getTime() < Date.now()) {
        notice('#adminNotice', 'Match date/time must be in the future.', false);
        return;
    }

    data.matches.push({
        id: String(Date.now()),
        team1: v.team1.trim(),
        team2: v.team2.trim(),
        time: time.toISOString()
    });

    save();
    f.reset();
    notice('#adminNotice', 'Match added with live countdown.');
});

/* REMOVE MATCH */
$('#removeMatchForm').addEventListener('submit', e => {
    e.preventDefault();

    const id = e.currentTarget.elements.match.value;
    if (!id) return;

    data.matches = data.matches.filter(x => x.id !== id);
    save();
    notice('#adminNotice', 'Match removed.');
});

/* ADD RESULT */
$('#resultForm').addEventListener('submit', e => {
    e.preventDefault();

    const v = formData(e.currentTarget);

    data.results.push({
        id: String(Date.now()),
        team1: v.team1.trim(),
        team2: v.team2.trim(),
        score1: Number(v.score1),
        score2: Number(v.score2),
        time: v.time || new Date().toLocaleDateString()
    });

    save();
    e.currentTarget.reset();
    notice('#adminNotice', 'Result saved.');
});

/* PLAYER PROFILES */
function openProfile(id) {
    const p = data.players.find(x => x.id === id);
    if (!p) return;

    $('#profileContent').innerHTML = `
        <div class="profile-top" style="margin-top:20px">
            ${avatar(p)}
            <div>
                <h2 style="margin:0 0 8px">${esc(p.name)}</h2>
                <span class="pill ${p.captain ? 'captain' : ''}">
                    ${p.captain ? 'Captain' : 'Player'}
                </span>
                <p class="tiny">${esc(p.position || 'Position not set')}</p>
            </div>
        </div>

        <div class="profile-stats">
            <div>
                <strong>${Number(p.matchesPlayed) || 0}</strong>
                <span>Matches played</span>
            </div>
            <div>
                <strong>${Number(p.wins) || 0}</strong>
                <span>Wins</span>
            </div>
            <div>
                <strong>${esc(p.tenure || 'Not specified')}</strong>
                <span>Time in team</span>
            </div>
            <div>
                <strong>${esc(p.position || '—')}</strong>
                <span>Position</span>
            </div>
        </div>`;

    $('#profileModal').classList.add('open');
}

['#playersGrid', '#captainsGrid'].forEach(sel => {
    $(sel).addEventListener('click', e => {
        const card = e.target.closest('[data-profile]');
        if (card) openProfile(card.dataset.profile);
    });

    $(sel).addEventListener('keydown', e => {
        if ((e.key === 'Enter' || e.key === ' ') &&
            e.target.matches('[data-profile]')) {
            e.preventDefault();
            openProfile(e.target.dataset.profile);
        }
    });
});

$('#closeProfile').addEventListener('click', () => {
    $('#profileModal').classList.remove('open');
});

$('#profileModal').addEventListener('click', e => {
    if (e.target.id === 'profileModal') {
        $('#profileModal').classList.remove('open');
    }
});

document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        $('#profileModal').classList.remove('open');
    }
});

/* EXPORT BACKUP */
$('#exportData').addEventListener('click', () => {
    const blob = new Blob(
        [JSON.stringify(data, null, 2)],
        { type: 'application/json' }
    );

    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'red-devils-backup.json';
    a.click();

    URL.revokeObjectURL(a.href);
});

/* IMPORT BACKUP */
$('#importFile').addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file) return;

    try {
        const v = JSON.parse(await file.text());

        if (!v ||
            !Array.isArray(v.players) ||
            !Array.isArray(v.matches) ||
            !Array.isArray(v.results)) {
            throw Error('Invalid backup');
        }

        data = v;
        save();
        notice('#adminNotice', 'Backup imported.');
    } catch (_) {
        notice('#adminNotice', 'Invalid backup file.', false);
    }

    e.target.value = '';
});

/* CLEAR DATA */
$('#resetData').addEventListener('click', () => {
    if (confirm('Delete all players, matches, and results from this browser?')) {
        data = { players: [], matches: [], results: [] };
        save();
        notice('#adminNotice', 'All local data cleared.');
    }
});

render();
setInterval(updateCountdowns, 1000);

})();
