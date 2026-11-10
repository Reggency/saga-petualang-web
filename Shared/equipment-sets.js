(function (root) {
    'use strict';
    const node = typeof module !== 'undefined' && module.exports;
    const data = node ? require('../Crafting/recipes.js') : root.CraftingData;
    const forge = node ? require('../Crafting/crafting-core.js') : root.CraftingCore;
    const tiers = [
        ['forest', 'Perintis Hutan'], ['cave', 'Pemburu Gua'], ['ruins', 'Penjaga Reruntuhan'],
        ['frost', 'Pelindung Tundra'], ['ember', 'Bara Neraka'], ['dragon', 'Warisan Naga']
    ];
    // Existing recipe IDs are membership keys. No set fields are added to old items.
    const definitions = ['fighter', 'mage', 'archer', 'assassin'].flatMap(job => tiers.map(([id, name], tier) => ({
        id: `set_${job}_${id}`, name, job,
        pieces: Array.from({ length: 9 }, (_, slot) => data.recipes.find(r => r.id === `${job}_${slot * 6 + tier + 1}`)).filter(Boolean),
        thresholds: [
            { count: 2, bonuses: { bonusDef: 2 * (tier + 1) } },
            { count: 4, bonuses: { bonusAtk: 3 * (tier + 1), bonusMagicDamage: 3 * (tier + 1) } }
        ]
    })));
    const byName = new Map(definitions.flatMap(set => set.pieces.map(recipe => [recipe.name, { set, recipe }])));
    function membership(item, slot) {
        if (!item || typeof item !== 'object') return null;
        const member = byName.get(item.baseName || item.name);
        if (!member || member.recipe.slot !== slot || (item.slot && item.slot !== slot)) return null;
        if (item.job && item.job.toLowerCase() !== member.set.job) return null;
        return member;
    }
    function list(p) {
        const job = p.heroClass === 'Warga' ? '' : forge.activeJob(p);
        const equipped = new Map();
        for (const [slot, item] of Object.entries(p.equipment || {})) {
            const member = membership(item, slot);
            if (!member || member.set.job !== job) continue;
            if (!equipped.has(member.set.id)) equipped.set(member.set.id, new Set());
            equipped.get(member.set.id).add(member.recipe.id);
        }
        return definitions.filter(set => set.job === job).map(set => ({ ...set,
            count: equipped.get(set.id)?.size || 0,
            thresholds: set.thresholds.map(t => ({ ...t, active: (equipped.get(set.id)?.size || 0) >= t.count }))
        }));
    }
    function bonuses(p) {
        const result = {};
        for (const set of list(p)) for (const threshold of set.thresholds) if (threshold.active) {
            for (const [stat, value] of Object.entries(threshold.bonuses)) result[stat] = (result[stat] || 0) + value;
        }
        return result;
    }
    const labels = { bonusDef: 'DEF', bonusAtk: 'ATK', bonusMagicDamage: 'Magic' };
    const describe = values => Object.entries(values).map(([key, value]) => `+${value} ${labels[key]}`).join(', ');
    const api = { definitions, membership, list, bonuses, describe };
    if (node) module.exports = api;
    else root.GameEquipmentSets = api;
})(typeof window === 'undefined' ? globalThis : window);
