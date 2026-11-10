(function (root) {
    'use strict';

    const own = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
    const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
    const copy = value => JSON.parse(JSON.stringify(value, (_key, entry) => {
        if (typeof entry === 'number' && !Number.isFinite(entry)) {
            throw new Error('Data angka tidak valid. Penyimpanan dibatalkan; progres sebelumnya tetap disimpan.');
        }
        return entry;
    }));
    const count = (value, fallback = 0, minimum = 0) => {
        const n = Number(value);
        return value !== null && value !== '' && Number.isFinite(n)
            ? Math.min(Number.MAX_SAFE_INTEGER, Math.max(minimum, Math.floor(n))) : fallback;
    };

    function defaultPlayer(name = 'Warga') {
        return {
            name, username: name, heroClass: 'Warga', baseClass: 'Warga',
            level: 1, exp: 0, maxExp: 100, gold: 50, hp: 120, maxHp: 120,
            mana: 60, maxMana: 60, baseAttack: 10, magicDamage: 0,
            attackSpeed: 8, baseDefense: 6, baseDodge: 8, statPoints: 0,
            skillPoints: 0, potions: 3, manaPotions: 2, potionThreshold: 35,
            skills: [], combatBuffs: [], debuffs: [], items: [], party: [], activeParty: [],
            allies: {}, equipment: {}, inventory: {}, settings: {}, quests: [],
            professions: {
                mining: { level: 1, exp: 0, maxExp: 100 },
                chopping: { level: 1, exp: 0, maxExp: 100 }
            },
            tools: {
                equippedPickaxe: { name: 'Beliung Pemula', speed: 1 },
                equippedAxe: { name: 'Kapak Berkarat', speed: 1 }
            }
        };
    }

    // Legacy identities are retained only for migration, never as craftable items.
    const retiredAccessoryIdentities = new Map([
        ["fighter_43","Anting Sayap Kelelawar"],
        ["fighter_44","Anting Telinga Goblin"],
        ["fighter_45","Anting Granit Reruntuhan"],
        ["fighter_46","Anting Serpihan Es"],
        ["fighter_47","Earrings Bara Neraka"],
        ["fighter_48","✨ Tatapan Lava Dragon"],
        ["fighter_49","Cincin Serat Sutra"],
        ["fighter_50","Cincin Logam Orc"],
        ["fighter_51","Band Ksatria Tengkorak"],
        ["fighter_52","Cincin Esensi Jiwa"],
        ["fighter_53","Signet Obsidian Cair"],
        ["fighter_54","🔥 Cincin Api Abadi"],
        ["fighter_55","Gelang Lendir Melar"],
        ["fighter_56","Gelang Benang Giok"],
        ["fighter_57","Gelang Besi Tempa"],
        ["fighter_58","Bracer Kulit Keras"],
        ["fighter_59","Gelang Energi Purba"],
        ["fighter_60","Vambrace Api Naga"],
        ["mage_43","Tindik Kristal Slime Lembut"],
        ["mage_44","💎 Giwang Kecubung Mistis"],
        ["mage_45","Anting Percikan Pyromanic"],
        ["mage_46","🪨 Earth-Core Echo Studs"],
        ["mage_47","❄️ Cryo Tear Droplets"],
        ["mage_48","🔥 Dragon Blood Spark Earrings"],
        ["mage_49","Cincin Lendir Mengeras"],
        ["mage_50","💍 Loop of Mystic Dust"],
        ["mage_51","🔥 Flare Igniter Signet Ring"],
        ["mage_52","⚙️ Heavy Runic Iron Ring"],
        ["mage_53","❄️ Frost-Bite Channeling Ring"],
        ["mage_54","👑 Seal of the Infernal Archmage"],
        ["mage_55","Gelang Rajutan Rambut Peri"],
        ["mage_56","🦴 Wristband Manik Tulang Mistis"],
        ["mage_57","Bangle Of Phoenix Core"],
        ["mage_58","🪨 Stoneguard Runed Bangle"],
        ["mage_59","❄️ Glacial Crest Wristchain"],
        ["mage_60","🩸 Molten Dragon Heart Bracelet"],
        ["archer_43","Tindik Bulu Hutan Pemula"],
        ["archer_44","💎 Giwang Zamrud Pemburu"],
        ["archer_45","Anting Taring Gale Stalker"],
        ["archer_46","🪨 Core-Rock Earring"],
        ["archer_47","❄️ Blizzard Cryo Drops"],
        ["archer_48","🔥 Pyre-Spark Ember Earrings"],
        ["archer_49","Cincin Getah Mengkilap"],
        ["archer_50","💍 Band of Goblin Poachers"],
        ["archer_51","🐺 Swift-Grip Wolf Ring"],
        ["archer_52","⚙️ Heavy Draw Ring Line"],
        ["archer_53","❄️ Piercing Frost Loop"],
        ["archer_54","👑 Signet of the Inferno Archer"],
        ["archer_55","Gelang Rajutan Akar Hutan"],
        ["archer_56","🦴 Wristband Manik Tulang"],
        ["archer_57","Bangle Of Wild Hunter"],
        ["archer_58","🪨 Stoneguard Heavy Bangle"],
        ["archer_59","❄️ Glacial Mist Wristchain"],
        ["archer_60","🩸 Molten Dragon Pulse Bracelet"],
        ["assassin_43","Tindik Benang Hutan"],
        ["assassin_44","💎 Giwang Kristal Gua"],
        ["assassin_45","⏳ Anting Manik-Manik Kuno"],
        ["assassin_46","❄️ Glacial Drop Earring"],
        ["assassin_47","🔥 Earring of Lava Sparks"],
        ["assassin_48","👁️ Dragon Eye Earring"],
        ["assassin_49","Cincin Taring Kelelawar"],
        ["assassin_50","🐺 Band of the Dire Wolf"],
        ["assassin_51","⏳ Ring of Ruined Kings"],
        ["assassin_52","❄️ Frostbite Signet Ring"],
        ["assassin_53","🔥 Magma Core Loop Ring"],
        ["assassin_54","👑 Eclipse Dragon Signet"],
        ["assassin_55","Gelang Ikatan Akar Hutan"],
        ["assassin_56","🦴 Vambrace Tulang Kasar"],
        ["assassin_57","⏳ Gelang Mistik Reruntuhan"],
        ["assassin_58","❄️ Glacial Soul Wristband"],
        ["assassin_59","🔥 Bangle of Molten Obsidian"],
        ["assassin_60","🩸 Ashen Dragon Bloodline Bangle"],
        ["assassin_67","Gelang Air Kusam"]
    ]);
    const retiredAccessoryNames = new Set(retiredAccessoryIdentities.values());
    const retiredAccessorySlots = new Set(['gelang', 'bracelet', 'bracelets', 'cincin', 'ring', 'rings', 'anting', 'earing', 'earring', 'earrings']);
    function isRetiredAccessory(item, slot = '') {
        if (retiredAccessorySlots.has(String(slot).toLowerCase()) || retiredAccessorySlots.has(String(item?.slot || '').toLowerCase())) return true;
        if (!record(item)) return false;
        if (retiredAccessoryIdentities.has(item.recipeId || item.id)) return true;
        const name = String(item.baseName || item.name || '').replace(/\s*\+\d+$/, '').trim();
        // This existing Mage item is a catalyst/offhand, despite its display name.
        if (name === 'Cincin Pelindung Magma') return false;
        return retiredAccessoryNames.has(name) || /\b(gelang|bracelet|wristband|bangle|wristchain|cincin|ring|signet|anting|earring|earrings|tindik|giwang)\b/i.test(name);
    }
    function migrateRetiredAccessories(result, original) {
        const entries = [];
        function archive(source, key, value) { entries.push({ source, key, value: copy(value) }); }
        for (const [slot, item] of Object.entries(result.equipment)) if (isRetiredAccessory(item, slot)) {
            archive('equipment', slot, item);
            delete result.equipment[slot];
        }
        result.items = result.items.filter((item, index) => {
            if (!isRetiredAccessory(item)) return true;
            archive('items', index, item); return false;
        });
        for (const [name, quantity] of Object.entries(result.inventory)) if (isRetiredAccessory({ name })) {
            archive('inventory', name, quantity); delete result.inventory[name];
        }
        if (record(result.materials)) for (const [name, quantity] of Object.entries(result.materials)) if (isRetiredAccessory({ name })) {
            archive('materials', name, quantity); delete result.materials[name];
        }
        if (record(result.inventorySlots)) for (const [category, slots] of Object.entries(result.inventorySlots)) if (Array.isArray(slots)) {
            result.inventorySlots[category] = slots.map((item, index) => {
                if (!isRetiredAccessory(item)) return item;
                archive(`inventorySlots.${category}`, index, item); return null;
            });
        }
        if (entries.length) {
            // A full pre-migration character snapshot makes the change reversible.
            // The snapshot is created once and never replaced by later saves.
            if (!own(result, 'equipmentMigrationBackupV1')) result.equipmentMigrationBackupV1 = copy(original);
            const previous = record(result.retiredAccessoriesV1) && Array.isArray(result.retiredAccessoriesV1.entries)
                ? result.retiredAccessoriesV1.entries : [];
            result.retiredAccessoriesV1 = { version: 1, entries: [...previous, ...entries] };
            // A stored combat estimate can contain bonuses from the removed gear.
            if (record(result.offlineProgress)) result.offlineProgress.autoBattle = false;
        }
        return result;
    }
    function normalizePlayer(value) {
        if (!record(value)) throw new Error('Format data karakter tidak valid. Data asli tetap disimpan.');
        const defaults = defaultPlayer();
        const result = { ...defaults, ...copy(value) };
        for (const [key, fallback] of Object.entries(defaults)) {
            if (typeof fallback === 'number') {
                result[key] = count(result[key], fallback, ['level', 'maxHp', 'maxExp', 'attackSpeed'].includes(key) ? 1 : 0);
            } else if (Array.isArray(fallback)) {
                result[key] = Array.isArray(result[key]) ? result[key] : [];
            } else if (record(fallback)) {
                result[key] = record(result[key]) ? result[key] : {};
            } else if (typeof result[key] !== 'string') result[key] = fallback;
        }
        result.potionThreshold = Math.min(100, result.potionThreshold);
        result.items = result.items.filter(record);
        result.skills = result.skills.filter(skill => typeof skill === 'string' || (record(skill) && typeof skill.id === 'string'))
            .map(skill => typeof skill === 'string' ? { id: skill, rank: 1, readyAt: 0 } : { ...skill, readyAt: count(skill.readyAt) });
        const classes = { Warga: 'Warga', Fighter: 'Fighter', Warrior: 'Fighter', Berserker: 'Fighter', Mage: 'Mage', Sorcerer: 'Mage', Archmage: 'Mage', Archer: 'Archer', Ranger: 'Archer', Marksman: 'Archer', Assassin: 'Assassin', Shadow: 'Assassin', Reaper: 'Assassin' };
        result.baseClass = classes[result.heroClass] || 'Warga';
        if (!own(classes, result.heroClass)) result.heroClass = 'Warga';
        const catalog = root.GameItemCatalog || (typeof require === 'function' ? require('./items.js') : null);
        const legacySlots = Object.values(result.inventory).some(Array.isArray) ? result.inventory
            : (!own(value, 'inventory') && record(value.inventorySlots) ? value.inventorySlots : null);
        if (legacySlots) {
            const modern = Object.fromEntries(Object.entries(result.inventory).filter(([, amount]) => !Array.isArray(amount)));
            const modernNames = new Set(Object.keys(modern).map(name => catalog?.aliases[name] || name));
            const imported = Object.create(null);
            for (const slots of Object.values(legacySlots)) if (Array.isArray(slots)) {
                for (const item of slots) if (record(item) && typeof item.name === 'string') {
                    const name = catalog?.aliases[item.name] || item.name;
                    if (!modernNames.has(name)) imported[name] = (imported[name] || 0) + count(item.qty);
                }
            }
            result.inventory = { ...imported, ...modern };
        }
        for (const [alias, name] of Object.entries(catalog?.aliases || {})) {
            if (own(result.inventory, alias)) {
                if (!own(result.inventory, name)) result.inventory[name] = result.inventory[alias];
                delete result.inventory[alias];
            }
        }
        result.inventory = Object.fromEntries(Object.entries(result.inventory)
            .filter(([key]) => !['__proto__', 'constructor', 'prototype'].includes(key))
            .map(([key, value]) => [key, count(value)]).filter(([, value]) => value > 0));
        for (const key of ['mining', 'chopping']) {
            const profession = record(result.professions[key]) ? result.professions[key] : {};
            result.professions[key] = {
                ...profession,
                level: count(profession.level, 1, 1), exp: count(profession.exp), maxExp: count(profession.maxExp, 100, 1)
            };
        }
        for (const key of ['equippedPickaxe', 'equippedAxe']) {
            const tool = result.tools[key];
            if (!record(tool) || !Number.isFinite(tool.speed) || tool.speed <= 0) result.tools[key] = defaults.tools[key];
        }
        return migrateRetiredAccessories(result, value);
    }

    function createStorage(storage, session, report = () => {}) {
        let account = null;
        let state = null;
        let expectedRaw = null;
        const profileKey = email => `rpg_profile_v2:${encodeURIComponent(email)}`;
        const fail = message => { const error = new Error(message); report(error); throw error; };
        function parse(raw, label) {
            try { return JSON.parse(raw); }
            catch { return fail(`Data ${label} rusak. Data asli tidak dihapus; pulihkan dari cadangan sebelum melanjutkan.`); }
        }
        function commit(next) {
            if (!account || session.getItem('rpg_account_id') !== account) return fail('Sesi akun berubah. Silakan masuk kembali.');
            const key = profileKey(account);
            if (storage.getItem(key) !== expectedRaw) return fail('Progres berubah di halaman lain. Muat ulang halaman sebelum melanjutkan.');
            // Validate freshness before skipping an identical write.
            next.revision = state?.revision || 0;
            if (JSON.stringify(next) === expectedRaw) return;
            next.revision = (state?.revision || 0) + 1;
            const raw = JSON.stringify(next);
            try { storage.setItem(key, raw); }
            catch { return fail('Progres gagal disimpan. Penyimpanan mungkin penuh atau tidak diizinkan.'); }
            state = next;
            expectedRaw = raw;
        }
        function requireState() {
            if (!state) return fail('Silakan masuk terlebih dahulu.');
        }
        function extraValue(value) {
            if (value === undefined || value === null) return fail('Data tambahan tidak valid. Progres sebelumnya tetap disimpan.');
            return String(value);
        }
        function activate(email, { isNew = false, legacyAccounts = {} } = {}) {
            // A failed activation must never leave the previous actor writable.
            state = null;
            account = email;
            expectedRaw = storage.getItem(profileKey(email));
            if (expectedRaw !== null) {
                const saved = parse(expectedRaw, 'progres akun');
                if (!record(saved) || saved.version !== 2 || !Array.isArray(saved.slots) || saved.slots.length !== 4 ||
                    !(saved.activeSlot === null || (Number.isInteger(saved.activeSlot) && saved.activeSlot >= 0 && saved.activeSlot < 4)) ||
                    (saved.extras !== undefined && !record(saved.extras))) {
                    return fail('Struktur progres akun tidak valid. Data asli tetap disimpan.');
                }
                state = { ...saved, slots: saved.slots.map(slot => slot === null ? null : normalizePlayer(slot)), extras: saved.extras || {} };
                return;
            }
            const name = email.split('@')[0].toUpperCase();
            const next = { version: 2, revision: 0, slots: [null, null, null, null], activeSlot: null, extras: {} };
            // Old saves used only the email prefix. Import only when the owner is unambiguous.
            const matchingAccounts = Object.keys(legacyAccounts).filter(key => key.split('@')[0].toUpperCase() === name);
            if (!isNew && matchingAccounts.length === 1) {
                const slotsRaw = storage.getItem(`rpg_slots_${name}`);
                if (slotsRaw) {
                    const slots = parse(slotsRaw, 'slot lama');
                    if (!Array.isArray(slots) || slots.length > 4) return fail('Slot lama tidak valid. Data asli tetap disimpan.');
                    next.slots = Array.from({ length: 4 }, (_, i) => slots[i] ? normalizePlayer(slots[i]) : null);
                }
                // A global player has no owner marker. Only a single-account installation is safe to import.
                if (Object.keys(legacyAccounts).length === 1 && storage.getItem('rpg_player')) {
                    const index = count(storage.getItem('rpg_active_slot'));
                    next.activeSlot = index < 4 ? index : 0;
                    next.slots[next.activeSlot] = normalizePlayer(parse(storage.getItem('rpg_player'), 'karakter lama'));
                    for (const key of ['rpg_items', 'rpg_game_data', 'buff_atk', 'buff_def', 'buff_magic', 'buff_aspd', 'buff_dodge']) {
                        const value = storage.getItem(key);
                        if (value !== null) next.extras[`${next.activeSlot}:${key}`] = value;
                    }
                }
            }
            if (next.activeSlot === null) next.activeSlot = next.slots.findIndex(Boolean);
            if (next.activeSlot < 0) {
                next.activeSlot = 0;
                next.slots[0] = defaultPlayer(name);
            }
            state = null;
            commit(next);
        }
        function getItem(key) {
            requireState();
            if (key === 'rpg_player') return state.activeSlot === null || !state.slots[state.activeSlot] ? null : JSON.stringify(state.slots[state.activeSlot]);
            if (key === 'rpg_active_slot') return state.activeSlot === null ? null : String(state.activeSlot);
            if (key.startsWith('rpg_slots_')) return JSON.stringify(state.slots);
            return state.extras[`${state.activeSlot}:${key}`] ?? null;
        }
        function setItem(key, value) {
            requireState();
            const next = copy(state);
            if (key === 'rpg_player') {
                if (next.activeSlot === null) return fail('Pilih slot karakter sebelum menyimpan.');
                next.slots[next.activeSlot] = normalizePlayer(parse(value, 'karakter'));
            } else if (key === 'rpg_active_slot') {
                const index = Number(value);
                if (!Number.isInteger(index) || index < 0 || index > 3) return fail('Slot karakter tidak valid.');
                next.activeSlot = index;
            } else if (key.startsWith('rpg_slots_')) {
                const slots = parse(value, 'slot');
                if (!Array.isArray(slots) || slots.length !== 4) return fail('Jumlah slot harus empat.');
                next.slots = slots.map(slot => slot === null ? null : normalizePlayer(slot));
                for (let i = 0; i < 4; i++) if (slots[i] === null) {
                    for (const extra of Object.keys(next.extras)) if (extra.startsWith(`${i}:`)) delete next.extras[extra];
                }
            } else next.extras[`${next.activeSlot}:${key}`] = extraValue(value);
            commit(next);
        }
        function removeItem(key) {
            requireState();
            const next = copy(state);
            if (key === 'rpg_player' && next.activeSlot !== null) {
                next.slots[next.activeSlot] = null;
                for (const extra of Object.keys(next.extras)) if (extra.startsWith(`${next.activeSlot}:`)) delete next.extras[extra];
            }
            else if (key === 'rpg_active_slot') next.activeSlot = null;
            else delete next.extras[`${next.activeSlot}:${key}`];
            commit(next);
        }
        function selectSlot(index, player) {
            requireState();
            if (!Number.isInteger(index) || index < 0 || index > 3) return fail('Slot karakter tidak valid.');
            const next = copy(state);
            if (player) next.slots[index] = normalizePlayer(player);
            if (!next.slots[index]) return fail('Slot karakter masih kosong.');
            next.activeSlot = index;
            commit(next);
        }
        return { activate, getItem, setItem, removeItem, selectSlot,
            savePlayer(player, extras = {}) {
                requireState();
                if (state.activeSlot === null) return fail('Pilih slot karakter sebelum menyimpan.');
                const next = copy(state);
                next.slots[next.activeSlot] = normalizePlayer(player);
                for (const [key, value] of Object.entries(extras)) next.extras[`${next.activeSlot}:${key}`] = extraValue(value);
                commit(next);
                // Keep the live actor and quest references stable during combat callbacks.
                // Only the persisted snapshot is cloned and normalized.
                return player;
            },
            onReady(fn) { if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', fn, { once: true }); else fn(); }
        };
    }
    const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
    function allyHealth(template, instance = {}) {
        const maxHp = Math.max(1, template.hp + count(instance.stats?.hpBonus) + (count(instance.level, 1, 1) - 1) * 10);
        return { maxHp, hp: Math.min(maxHp, count(instance.hp, maxHp)) };
    }
    const api = { createStorage, defaultPlayer, normalizePlayer, isRetiredAccessory, count, own, record, escapeHtml, allyHealth };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    else {
        root.GameCore = api;
        root.GameStorage = createStorage(root.localStorage, root.sessionStorage, error => {
            if (!root.document.getElementById('save-error')) {
                const panel = root.document.createElement('div');
                panel.id = 'save-error';
                panel.setAttribute('role', 'alert');
                panel.style.cssText = 'position:fixed;inset:0;z-index:99999;background:#151923;color:white;padding:15vh 10vw;font:18px sans-serif';
                panel.textContent = error.message;
                const reload = root.document.createElement('button');
                reload.textContent = 'Muat ulang';
                reload.onclick = () => root.location.reload();
                panel.append(root.document.createElement('br'), reload);
                root.document.body.append(panel);
            }
        });
    }
})(typeof window === 'undefined' ? globalThis : window);
