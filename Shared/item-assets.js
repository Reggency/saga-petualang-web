(function (root) {
    'use strict';
    const node = typeof module !== 'undefined' && module.exports;
    const slotCategories = { senjata: 'weapons', offhand: 'shields', katalis: 'shields', helm: 'helmets', zirah: 'armor',
        sepatu: 'boots', sarung_tangan: 'gloves', amulet: 'accessories' };
    const clean = value => String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\p{L}\p{N}\s()&/+-]/gu, '').replace(/\s+/g, ' ').trim();
    const slug = value => clean(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const safePath = path => typeof path === 'string' && !path.includes('..') && !/^(?:[\\/]|[a-z]+:)/i.test(path) &&
        /^[\w /.-]+\.(?:png|jpg|webp|svg)$/i.test(path);

    function createCatalog({ recipes, items, monsters, potions, aliases = {}, extras = [] }) {
        const rows = [], byKey = new Map(), byName = new Map(), plainNames = new Map();
        const bossDrops = new Set(monsters.filter(m => m.name.includes('BOSS')).flatMap(m => m.drops.map(d => d.name)));
        const normalDrops = new Set(monsters.filter(m => !m.name.includes('BOSS')).flatMap(m => m.drops.map(d => d.name)));
        function add(row) {
            if (byKey.has(row.key)) throw new Error(`Identitas aset ganda: ${row.key}`);
            row.slug = slug(row.name);
            const sharedEquipment = row.recipe && (/Relik Drop Langka/i.test(row.recipe.group) || !row.recipe.job);
            row.folder = sharedEquipment ? 'assets/equipment/universal' : `assets/${row.category}`;
            if (row.job && !sharedEquipment) row.folder += `/${row.category === 'weapons' && row.job === 'mage' ? 'Mage' : row.job}`;
            rows.push(row); byKey.set(row.key, row); byName.set(row.name, row);
            const plain = clean(row.name);
            plainNames.set(plain, plainNames.has(plain) ? null : row);
        }
        for (const r of recipes) add({ key: r.id, name: r.name, category: slotCategories[r.slot] || 'equipment',
            job: r.job || 'universal', slot: r.slot, recipe: r, source: 'CraftingData.recipes' });
        for (const item of items) {
            if (byName.has(item.name)) continue;
            const category = bossDrops.has(item.name) ? 'materials/boss-drops' : normalDrops.has(item.name) ? 'materials/monster-drops'
                : item.type === 'Ore' ? 'materials/ores' : item.type === 'Ingot' ? 'materials/ingots'
                : item.type === 'Wood' ? 'materials/wood' : item.category === 'Equipment' ? 'equipment/misc' : 'materials/misc';
            add({ key: `item:${item.name}`, name: item.name, category, job: '', slot: '', item, source: 'GameItemCatalog.items' });
        }
        // Recipe names in Alchemy are processes; their actual products are these two counters.
        for (const p of Object.values(potions)) add({ key: p.id, name: p.name, category: `potions/${p.id === 'hp' ? 'hp' : 'mana'}`,
            job: '', slot: '', item: p, source: 'AlchemyData.potions' });
        for (const extra of extras) add({ ...extra, job: '', slot: extra.slot || '', source: 'Shop / starter equipment/tools' });
        for (const row of rows.filter(r => r.category === 'potions/buff')) {
            const label = clean(row.name).replace(/\s+\([^()]*\)$/, '');
            if (!plainNames.has(label)) plainNames.set(label, row);
        }
        // Only genuine collisions inside the SAME folder need the stable base ID suffix.
        const collisions = new Map();
        for (const row of rows) {
            const key = `${row.folder}/${row.slug}`;
            if (!collisions.has(key)) collisions.set(key, []);
            collisions.get(key).push(row);
        }
        for (const group of collisions.values()) if (group.length > 1) for (const row of group) row.slug += `-${slug(row.key)}`;
        const get = value => {
            const item = typeof value === 'string' ? { name: value } : value || {};
            for (const id of [item.recipeId, item.baseId, item.itemId, item.id, item.key, typeof value === 'string' ? value : null]) {
                if (byKey.has(id)) return byKey.get(id);
                const alias = aliases[id];
                if (alias && byName.has(alias)) return byName.get(alias);
            }
            const name = item.baseName || item.name;
            const canonical = aliases[name] || name;
            return byName.get(canonical) || plainNames.get(clean(canonical)) ||
                plainNames.get(clean(canonical).replace(/\s+\+\d+$/, '')) || null;
        };
        function candidates(value) {
            const row = get(value), item = typeof value === 'object' && value ? value : {};
            const list = row ? [`${row.folder}/${row.slug}.webp`, `${row.folder}/${row.slug}.png`] : [];
            list.push(row?.recipe?.image, row?.item?.image, item.image);
            // Both existing armor locations remain compatible; no file is moved.
            if (row?.category === 'shields' && row.job === 'fighter') {
                list.push(`assets/armor/fighter/${row.slug}.webp`, `assets/armor/fighter/${row.slug}.png`, `assets/armor/${row.slug}.png`);
            }
            return [...new Set(list.filter(safePath))];
        }
        return { rows, getItemAssetInfo: get, getItemImageCandidates: candidates };
    }

    const data = node ? { recipes: require('../Crafting/recipes.js').recipes, items: require('./items.js').items,
        monsters: require('./monsters.js'), potions: require('../Alchemy/recipes.js').potions,
        aliases: require('./items.js').aliases, extras: require('./item-asset-extras.js') }
        : { recipes: root.CraftingData.recipes, items: root.GameItemCatalog.items, monsters: root.GameMonsters,
            potions: root.AlchemyData.potions, aliases: root.GameItemCatalog.aliases, extras: root.GameItemAssetExtras };
    const catalog = createCatalog(data);
    const api = { ...catalog, createCatalog, slug, clean };
    if (node) { module.exports = api; return; }

    const projectRoot = new URL('../', document.currentScript.src).href;
    const cache = new Map(); // Page lifetime only: a refresh always discovers newly added art.
    function resolveItemImage(value) {
        const candidates = catalog.getItemImageCandidates(value);
        const key = candidates.join('\n');
        if (cache.has(key)) return cache.get(key);
        const result = new Promise(resolve => {
            let index = 0;
            function next() {
                if (index === candidates.length) { resolve(null); return; }
                const path = candidates[index++];
                const img = new Image();
                const finish = () => { img.onload = img.onerror = null; };
                img.onload = () => { finish(); resolve(path); };
                img.onerror = () => { finish(); next(); };
                img.src = new URL(path, projectRoot).href;
            }
            next();
        });
        cache.set(key, result);
        return result;
    }
    const pending = new Map();
    let pruneQueued = false;
    const observer = typeof IntersectionObserver === 'function' ? new IntersectionObserver(entries => {
        for (const entry of entries) {
            if (!entry.target.isConnected || entry.isIntersecting) {
                const start = pending.get(entry.target);
                pending.delete(entry.target); observer.unobserve(entry.target);
                if (entry.target.isConnected && entry.isIntersecting) start?.();
            }
        }
    }, { rootMargin: '120px' }) : null;
    function loadVisual(wrapper, icon, item) {
        wrapper.dataset.assetKey = catalog.getItemAssetInfo(item)?.key || '';
        const start = () => resolveItemImage(item).then(path => {
            if (!path || !wrapper.isConnected) return;
            const img = document.createElement('img');
            img.alt = ''; img.decoding = 'async';
            img.onload = () => { icon.hidden = true; };
            img.onerror = () => { img.remove(); icon.hidden = false; };
            img.src = new URL(path, projectRoot).href;
            wrapper.append(img);
        });
        if (!observer) { start(); return; }
        pending.set(wrapper, start); observer.observe(wrapper);
        if (!pruneQueued) {
            pruneQueued = true;
            queueMicrotask(() => {
                pruneQueued = false;
                for (const target of pending.keys()) if (!target.isConnected) { observer.unobserve(target); pending.delete(target); }
            });
        }
    }
    // Presentation helpers preserve labels, handlers, prices and count nodes.
    function attach(target, item, { replaceIcon = false, compact = false } = {}) {
        if (!target) return;
        const info = catalog.getItemAssetInfo(item);
        if (!info) return;
        const previous = target.querySelector(':scope > .item-art');
        if (previous?.dataset.assetKey === info.key) return;
        const visual = root.GameItemCatalog.createVisual(item);
        if (compact) visual.classList.add('item-art-inline');
        const icon = replaceIcon ? target.querySelector(':scope > i') : null;
        if (previous) previous.replaceWith(visual);
        else if (icon) icon.replaceWith(visual);
        else target.prepend(visual);
    }
    function decorate(scope = document) {
        for (const el of scope.querySelectorAll('[data-item-asset]')) attach(el, el.dataset.itemAsset, { compact: true, replaceIcon: true });
        for (const card of scope.querySelectorAll('.btn-shop-card[onclick]')) {
            const match = card.getAttribute('onclick').match(/^(beliPotion|beliManaPotion|beliBuff|beliTool|beliMaterial)\('([^']+)'/);
            if (match) attach(card, match[1] === 'beliBuff' ? `buff_${match[2]}` : match[2]);
        }
        for (const card of scope.querySelectorAll('.gather-card')) attach(card.querySelector('.icon-zone'), card.querySelector('h3')?.textContent, { replaceIcon: true });
        for (const [id, key] of [['potions', 'hp'], ['mana-potions', 'potion_mana']]) {
            const counter = scope.querySelector(`#${id}`);
            const label = counter?.closest('.item-potion')?.querySelector(':scope > span');
            attach(label, key, { compact: true, replaceIcon: true });
        }
        const potions = { 'inventory-potions': 'hp', 'inventory-mana-potions': 'potion_mana', 'lab-potions': 'hp', 'lab-mana-potions': 'potion_mana' };
        for (const [id, key] of Object.entries(potions)) {
            const counter = scope.querySelector(`#${id}`);
            if (counter) attach(counter.parentElement.querySelector(':scope > span') || counter.parentElement, key, { compact: true });
        }
        const slots = { 'eq-weapon': 'senjata', 'eq-armor': 'zirah', 'eq-boots': 'sepatu', 'eq-helmet': 'helm',
            'eq-amulet': 'amulet', 'eq-gloves': 'sarung_tangan', 'eq-offhand': 'offhand' };
        for (const id of Object.keys(slots)) {
            const label = scope.querySelector(`#${id}`);
            // Arena owns its cached live-actor equipment rendering; Shop uses the label.
            if (label && !root.GameState) attach(label.parentElement, label.textContent, { compact: true, replaceIcon: true });
        }
    }
    Object.assign(api, { resolveItemImage, loadVisual, attach, decorate });
    root.GameItemAssets = api;
})(typeof window === 'undefined' ? globalThis : window);
