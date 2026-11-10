(function (root) {
    'use strict';
    const count = n => Number.isSafeInteger(n) && n >= 0 ? n : 0;
    const record = v => v && typeof v === 'object' && !Array.isArray(v);
    const clone = p => JSON.parse(JSON.stringify(p));
    const definitions = [
        { id: 'battle_first', category: 'Battle', name: 'Kemenangan Pertama', metric: 'battle', target: 1, title: 'Petarung Pemula' },
        { id: 'battle_50', category: 'Battle', name: 'Lima Puluh Kemenangan', metric: 'battle', target: 50, title: 'Pemburu Monster' },
        { id: 'battle_250', category: 'Battle', name: 'Veteran Pertempuran', metric: 'battle', target: 250, title: 'Veteran Saga' },
        { id: 'boss_first', category: 'Boss', name: 'Penakluk Boss', metric: 'boss', target: 1, title: 'Penakluk Raksasa' },
        { id: 'boss_six', category: 'Boss', name: 'Enam Penguasa', metric: 'bossKinds', target: 6, title: 'Legenda Enam Wilayah' },
        { id: 'craft_first', category: 'Crafting', name: 'Tempaan Pertama', metric: 'craft', target: 1, title: 'Penempa Pemula' },
        { id: 'craft_10', category: 'Crafting', name: 'Karya Sang Penempa', metric: 'craft', target: 10, title: 'Pandai Besi' },
        { id: 'alchemy_10', category: 'Crafting', name: 'Sepuluh Racikan', metric: 'alchemy', target: 10, title: 'Peracik Andal' },
        { id: 'gather_10', category: 'Gathering', name: 'Bekal dari Alam', metric: 'gather', target: 10, title: 'Pengumpul Bekal' },
        { id: 'gather_100', category: 'Gathering', name: 'Sahabat Alam', metric: 'gather', target: 100, title: 'Penjelajah Alam' },
        { id: 'quest_first', category: 'Quest', name: 'Tugas Pertama', metric: 'quests', target: 1, title: 'Penolong Kedai' },
        { id: 'quest_10', category: 'Quest', name: 'Sepuluh Amanah', metric: 'quests', target: 10, title: 'Andalan Kedai' },
        { id: 'level_10', category: 'Progres', name: 'Langkah Petualang', metric: 'level', target: 10, title: 'Petualang Terlatih' },
        { id: 'level_50', category: 'Progres', name: 'Perjalanan Panjang', metric: 'level', target: 50, title: 'Pengelana Senior' },
        { id: 'bestiary_24', category: 'Progres', name: 'Mengenal Dunia', metric: 'discovered', target: 24, title: 'Ahli Monster' }
    ];
    const byId = new Map(definitions.map(d => [d.id, d]));
    const node = typeof module !== 'undefined' && module.exports;
    const monsters = node ? require('./monsters.js') : root.GameMonsters;
    function evidence(p) {
        const kills = monsters.map(m => count(p.killCounts?.[m.name]));
        const bosses = monsters.filter(m => m.name.includes('BOSS')).map(m => count(p.killCounts?.[m.name]));
        const counters = p.achievements?.counters || {};
        const unique = list => new Set(list.filter(q => q?.claimed === true).map(q => q.id)).size;
        return {
            battle: kills.reduce((a, b) => Math.min(Number.MAX_SAFE_INTEGER, a + b), 0),
            boss: bosses.reduce((a, b) => Math.min(Number.MAX_SAFE_INTEGER, a + b), 0), bossKinds: bosses.filter(Boolean).length,
            craft: Math.max(count(counters.craft), new Set((p.items || []).filter(i => i?.baseName && i?.enhanceMaterials).map(i => i.baseName)).size),
            alchemy: count(counters.alchemy), gather: count(counters.gather),
            quests: Math.max(count(p.questCompletedCount), unique(p.questBoard || [])) + unique(p.quests || []),
            level: count(p.level), discovered: monsters.filter((m, i) => kills[i] > 0 || p.bestiary?.seen?.[m.name] === true).length
        };
    }
    function list(p) {
        const values = evidence(p);
        return definitions.map(d => {
            const progress = Math.min(d.target, Math.max(count(p.achievements?.progress?.[d.id]), values[d.metric]));
            return { ...d, progress, complete: progress >= d.target, claimed: p.achievements?.claimed?.[d.id] === true };
        });
    }
    function observe(p) {
        if (!record(p.achievements)) p.achievements = {};
        for (const key of ['counters', 'progress', 'claimed']) if (!record(p.achievements[key])) p.achievements[key] = {};
        for (const row of list(p)) p.achievements.progress[row.id] = row.progress;
        return p;
    }
    function event(p, type, amount = 1) {
        if (!['craft', 'alchemy', 'gather'].includes(type) || !Number.isSafeInteger(amount) || amount < 1) throw new Error('Progres achievement tidak valid.');
        const baseline = evidence(p)[type];
        observe(p);
        p.achievements.counters[type] = Math.min(Number.MAX_SAFE_INTEGER, baseline + amount);
        return observe(p);
    }
    function claim(p, id) {
        if (!byId.has(id)) throw new Error('Achievement tidak ditemukan.');
        const row = list(p).find(d => d.id === id);
        if (row.claimed) throw new Error('Hadiah achievement sudah diklaim.');
        if (!row.complete) throw new Error('Achievement belum selesai.');
        const next = observe(clone(p));
        next.achievements.claimed[id] = true;
        return next;
    }
    function title(p) {
        const id = p.achievements?.selectedTitle;
        return p.achievements?.claimed?.[id] === true ? byId.get(id)?.title || '' : '';
    }
    function selectTitle(p, id) {
        if (id && (!byId.has(id) || p.achievements?.claimed?.[id] !== true)) throw new Error('Gelar belum dimiliki.');
        const next = observe(clone(p));
        next.achievements.selectedTitle = id || '';
        return next;
    }
    const api = { definitions, list, observe, event, claim, title, selectTitle };
    if (node) module.exports = api;
    else root.GameAchievements = api;
})(typeof window === 'undefined' ? globalThis : window);
