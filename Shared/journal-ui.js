(function () {
    'use strict';
    let dialog;
    const el = (tag, text, className) => {
        const node = document.createElement(tag);
        if (text !== undefined) node.textContent = text;
        if (className) node.className = className;
        return node;
    };
    // Read the current actor on every interaction, including after crafting replaces it.
    const actor = () => window.GameState?.player || JSON.parse(GameStorage.getItem('rpg_player'));
    function show(mode, view = {}) {
        if (!['bestiary', 'achievements', 'sets', 'dungeons'].includes(mode)) return;
        if (!GameStorage.ready) return;
        if (!dialog) {
            dialog = el('dialog', undefined, 'journal-dialog');
            document.body.append(dialog);
        }
        const player = actor();
        if (!player) return;
        dialog.replaceChildren();
        const header = el('header');
        const heading = el('h2', ({ bestiary: 'Bestiary — Buku Monster', achievements: 'Achievement & Gelar', sets: 'Equipment Set Bonus' })[mode] || 'Buku Resep');
        heading.id = 'journal-heading';
        dialog.setAttribute('aria-labelledby', heading.id);
        const close = el('button', 'Tutup');
        close.type = 'button';
        close.addEventListener('click', () => dialog.close());
        header.append(heading, close);
        const search = el('input');
        search.value = view.query || '';
        search.type = 'search'; search.placeholder = 'Cari nama atau material…';
        search.setAttribute('aria-label', 'Cari nama atau material');
        const stage = el('select');
        stage.setAttribute('aria-label', 'Filter lokasi');
        for (const [key, label] of [['', 'Semua lokasi'], ...Object.entries(GameJournal.stages)]) {
            const option = el('option', label); option.value = key; stage.append(option);
        }
        const classes = el('select');
        classes.setAttribute('aria-label', 'Kelas equipment set');
        for (const [key, label] of [['active', 'Karakter aktif'], ['fighter', 'Fighter'], ['mage', 'Mage'], ['archer', 'Archer'], ['assassin', 'Assassin'], ['all', 'Semua kelas']]) {
            const option = el('option', label); option.value = key; classes.append(option);
        }
        classes.hidden = mode !== 'sets';
        const content = el('div', undefined, 'journal-content');
        const status = el('p');
        status.setAttribute('role', 'status');
        function changeAchievement(action) {
            try {
                syncPartyHealth();
                const current = actor();
                const next = action(current);
                // Persist before changing the live actor. Keep combat callback references stable.
                GameStorage.savePlayer(next, { rpg_items: JSON.stringify(purchasedItems) });
                current.achievements = next.achievements;
                updateStats();
                show(mode, { query: search.value, scroll: dialog.querySelector('.journal-body').scrollTop });
            } catch (error) { status.textContent = error.message; }
        }
        const hint = el('p', mode === 'bestiary'
            ? 'Temukan: identitas. Kalahkan 1×: elemen & kelemahan. Kalahkan 3×: daftar drop.'
            : 'Jumlah dimiliki / dibutuhkan. Pembuatan tetap melalui Tempa atau Alchemy.');
        if (mode === 'achievements') hint.textContent = 'Hadiah berupa gelar kosmetik, tanpa bonus stat atau mata uang. Gathering dihitung per material; Alchemy per batch racikan; Quest setelah hadiah diambil.';
        if (mode === 'sets') hint.textContent = 'Bonus 2 dan 4 bagian bersifat kumulatif. Hanya equipment yang dipakai pada slot asli dan sesuai kelas yang dihitung.';
        stage.hidden = mode !== 'bestiary';
        if (mode === 'dungeons') {
            heading.textContent = 'Dungeon Tantangan'; hint.textContent = 'Monster, Boss dan hadiah Battle memakai database asli.';
            search.hidden = true;
        }
        function render() {
            content.replaceChildren();
            content.classList.toggle('set-grid', mode === 'sets');
            const query = search.value.trim().toLocaleLowerCase();
            if (mode === 'dungeons' && window.GameAdventures) {
                GameAdventures.render(content, status, el, () => dialog.close());
            } else if (mode === 'bestiary') {
                for (const m of GameJournal.bestiary(actor())) {
                    if (stage.value && stage.value !== m.stage) continue;
                    if (!`${m.name} ${m.drops.map(d => d.name).join(' ')}`.toLocaleLowerCase().includes(query)) continue;
                    const card = el('article', undefined, 'journal-card');
                    card.append(el('h3', m.name), el('p', `${GameJournal.stages[m.stage]} · ${m.level === null ? 'Level ?' : `Level ${m.level}`} · Dikalahkan: ${m.kills}`),
                        el('p', `Elemen: ${m.element || '?'} · Kelemahan: ${m.weakness.join(', ') || '?'}`));
                    if (m.tier < 3) card.append(el('p', 'Drop terkunci — butuh 3 kemenangan.'));
                    else for (const drop of m.drops) {
                        const line = el('p', `${drop.name} (${Math.round(drop.chance * 100)}%)`);
                        GameItemAssets.attach(line, drop.name, { compact: true });
                        card.append(line);
                    }
                    content.append(card);
                }
            } else if (mode === 'achievements') {
                const current = actor();
                const canManage = Boolean(window.GameState?.player);
                content.append(el('p', `Gelar aktif: ${GameAchievements.title(current) || 'Tanpa gelar'}`));
                if (canManage) {
                    const clear = el('button', 'Lepas Gelar'); clear.type = 'button';
                    clear.disabled = !GameAchievements.title(current);
                    clear.addEventListener('click', () => changeAchievement(p => GameAchievements.selectTitle(p, '')));
                    content.append(clear);
                } else {
                    const link = el('a', 'Kelola achievement dan gelar di Kota');
                    link.href = '../Utama/Index.html'; content.append(link);
                }
                for (const row of GameAchievements.list(current)) {
                    if (!`${row.name} ${row.title} ${row.category}`.toLocaleLowerCase().includes(query)) continue;
                    const card = el('article', undefined, 'journal-card');
                    card.dataset.achievementId = row.id;
                    card.append(el('h3', row.name), el('p', `${row.category} · ${row.progress} / ${row.target}`),
                        el('p', `Hadiah gelar: ${row.title}`), el('p', row.claimed ? 'Hadiah sudah diklaim.' : row.complete ? 'Selesai — hadiah tersedia.' : 'Sedang berjalan.'));
                    if (canManage) {
                        const button = el('button', row.claimed ? 'Pakai Gelar' : 'Klaim Gelar'); button.type = 'button';
                        button.disabled = !row.complete || (row.claimed && current.achievements?.selectedTitle === row.id);
                        button.addEventListener('click', () => changeAchievement(p => row.claimed ? GameAchievements.selectTitle(p, row.id) : GameAchievements.claim(p, row.id)));
                        card.append(button);
                    }
                    content.append(card);
                }
            } else if (mode === 'sets') {
                const current = actor();
                const active = new Map(GameEquipmentSets.list(current).map(set => [set.id, set]));
                const job = classes.value === 'active' ? (current.heroClass === 'Warga' ? '' : CraftingCore.activeJob(current)) : classes.value;
                for (const definition of GameEquipmentSets.definitions) {
                    if (job !== 'all' && definition.job !== job) continue;
                    const equipped = active.get(definition.id);
                    const set = equipped || { ...definition, count: 0, thresholds: definition.thresholds.map(t => ({ ...t, active: false })) };
                    if (!`${set.name} ${set.pieces.map(r => r.name).join(' ')}`.toLocaleLowerCase().includes(query)) continue;
                    const card = el('article', undefined, 'journal-card set-card');
                    card.dataset.setId = set.id;
                    card.append(el('h3', set.name), el('span', set.job[0].toUpperCase() + set.job.slice(1), 'set-class'), el('p', `${set.count} bagian dipakai`));
                    if (!equipped) card.append(el('small', 'Referensi kelas lain; bonus tidak aktif pada karakter ini.'));
                    for (const t of set.thresholds) card.append(el('p', `${t.count} bagian: ${GameEquipmentSets.describe(t.bonuses)} · ${t.active ? 'Aktif' : 'Belum aktif'}`, t.active ? 'journal-owned' : ''));
                    const pieces = el('ul');
                    for (const recipe of set.pieces) {
                        const item = actor().equipment?.[recipe.slot];
                        const worn = Boolean(equipped) && GameEquipmentSets.membership(item, recipe.slot)?.recipe.id === recipe.id;
                        const piece = el('li', `${worn ? '✓ ' : ''}${recipe.name}`, worn ? 'journal-owned' : '');
                        GameItemAssets.attach(piece, recipe, { compact: true });
                        pieces.append(piece);
                    }
                    const details = el('details', undefined, 'set-items');
                    details.append(el('summary', `Detail item (${set.pieces.length})`), pieces);
                    card.append(details); content.append(card);
                }
            }
            if (!content.childElementCount) content.append(el('p', 'Belum ada entri sesuai filter. Pilih kelas untuk melihat resep equipment.'));
        }
        search.addEventListener('input', render); stage.addEventListener('change', render); classes.addEventListener('change', render);
        const body = el('div', undefined, 'journal-body');
        const filters = el('div', undefined, 'journal-filters');
        filters.append(search, stage, classes);
        body.append(hint, filters, status, content);
        dialog.append(header, body);
        render();
        if (!dialog.open) dialog.showModal();
        body.scrollTop = view.scroll || 0;
    }
    document.addEventListener('click', event => {
        const button = event.target.closest('[data-journal]');
        if (button) show(button.dataset.journal);
    });
    // The native Tempa/Alchemy cards own recipe rendering and transactions.
    // This shared, read-only detail uses the original source lookup only.
    function materialSources(player, requirements) {
        const details = el('details', undefined, 'recipe-sources');
        details.append(el('summary', 'Sumber material'));
        const list = el('ul');
        for (const req of requirements) {
            const name = GameItemCatalog.aliases[req.name] || req.name;
            const sources = name === 'Gold' ? ['Battle / Quest / Penjualan'] : GameJournal.sources(player, name);
            const row = el('li', `${name}: ${sources.join('; ')}`);
            GameItemAssets.attach(row, name, { compact: true });
            list.append(row);
        }
        details.append(list);
        return details;
    }
    window.GameJournalUI = { materialSources };
})();
