(function (root) {
    'use strict';
    const node = typeof module !== 'undefined' && module.exports;
    const monsters = node ? require('./monsters.js') : root.GameMonsters;
    const crafting = node ? require('../Crafting/recipes.js') : root.CraftingData;
    const alchemy = node ? require('../Alchemy/recipes.js') : root.AlchemyData;
    const forge = node ? require('../Crafting/crafting-core.js') : root.CraftingCore;
    const materials = node ? require('./materials.js') : root.GameMaterials;
    const items = node ? require('./items.js') : root.GameItemCatalog;
    const count = value => Number.isSafeInteger(value) && value > 0 ? value : 0;
    const record = value => value && typeof value === 'object' && !Array.isArray(value);
    function knowledge(player, monster) {
        const kills = count(player.killCounts?.[monster.name]);
        const seen = kills > 0 || player.bestiary?.seen?.[monster.name] === true;
        return { kills, tier: kills >= 3 ? 3 : kills > 0 ? 2 : seen ? 1 : 0 };
    }
    // The existing guarded victory handler remains the only writer of killCounts.
    // Names are the original stable battle keys; old victories unlock entries too.
    function discover(player, enemy) {
        const monster = monsters.find(m => m.name === enemy?.name);
        if (!monster || knowledge(player, monster).tier > 0) return false;
        if (!record(player.bestiary)) player.bestiary = {};
        if (!record(player.bestiary.seen)) player.bestiary.seen = {};
        player.bestiary.seen[monster.name] = true;
        return true;
    }
    function bestiary(player) {
        return monsters.map(monster => {
            const { kills, tier } = knowledge(player, monster);
            return { key: monster.name, tier, kills, stage: monster.stage,
                name: tier ? monster.name : 'Monster belum ditemukan',
                level: tier ? monster.level : null,
                element: tier >= 2 ? monster.element : null,
                weakness: tier >= 2 ? monster.weakness : [],
                drops: tier >= 3 ? monster.drops : [] };
        });
    }
    function sources(player, name) {
        const result = monsters.filter(m => m.drops.some(d => d.name === name)).map(m =>
            `${knowledge(player, m).tier ? m.name : 'Monster belum ditemukan'} — ${alchemy.stages[m.stage]}`);
        const smelt = crafting.smelting.find(r => r.output === name);
        if (smelt) result.push(`Tempa / Peleburan: ${smelt.amount} ${smelt.input} → ${smelt.output} (Mining)`);
        if (/ Ore$/.test(name)) result.push('Gathering / Mining');
        if (name.startsWith('Kayu ')) result.push('Gathering / Chopping');
        if (name === crafting.universalMaterial) result.push('Tempa / Konversi Material');
        return result.length ? result : ['Sumber belum tercatat'];
    }
    function recipes(player, kind) {
        const list = kind === 'alchemy' ? alchemy.recipes : forge.availableRecipes(player);
        return list.map(recipe => ({
            recipe, unlocked: kind !== 'alchemy' || (player.level || 1) >= recipe.minLevel,
            output: kind === 'alchemy' ? `${recipe.amount} ${alchemy.potions[recipe.potionId].name}` : recipe.name,
            requirements: materials.costs(player, recipe.requirements, recipe.goldCost).map(req => ({
                ...req, name: items.aliases[req.name] || req.name, owned: materials.owned(player, req.name),
                sources: req.name === 'Gold' ? ['Battle / Quest / Penjualan'] : sources(player, items.aliases[req.name] || req.name)
            }))
        }));
    }
    const api = { knowledge, discover, bestiary, sources, recipes, stages: alchemy.stages };
    if (node) module.exports = api;
    else root.GameJournal = api;
})(typeof window === 'undefined' ? globalThis : window);
