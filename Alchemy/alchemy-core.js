(function (root) {
    'use strict';
    const data = typeof module !== 'undefined' && module.exports ? require('./recipes.js') : root.AlchemyData;
    const materials = typeof module !== 'undefined' && module.exports ? require('../Shared/materials.js') : root.GameMaterials;
    const achievements = typeof module !== 'undefined' && module.exports ? require('../Shared/achievements.js') : root.GameAchievements;
    const recipesById = new Map(data.recipes.map(recipe => [recipe.id, recipe]));
    function quote(player, recipeId, batches = 1) {
        const recipe = recipesById.get(recipeId);
        if (!recipe) throw new Error('Resep Alchemy tidak ditemukan.');
        if (!materials.integer(batches, 1) || batches > 99) throw new Error('Jumlah racikan harus bulat antara 1 dan 99.');
        if ((player.level || 1) < recipe.minLevel) throw new Error(`Resep ini terbuka di level ${recipe.minLevel}.`);
        const potion = data.potions[recipe.potionId];
        const amount = recipe.amount * batches;
        const count = player[potion.field] ?? 0;
        if (!materials.integer(count) || !materials.integer(count + amount)) throw new Error('Kapasitas Potion terlampaui.');
        return {
            recipe, potion, amount,
            requirements: materials.costs(player, recipe.requirements.map(req => ({ name: req.name, amount: req.amount * batches })), recipe.goldCost * batches)
        };
    }
    function execute(player, recipeId, batches = 1) {
        const plan = quote(player, recipeId, batches);
        const next = materials.consume(player, plan.requirements);
        achievements.event(next, 'alchemy', batches);
        next[plan.potion.field] = (next[plan.potion.field] ?? 0) + plan.amount;
        return { next, message: `Berhasil meracik ${plan.amount} ${plan.potion.name}.`, amount: plan.amount };
    }
    const api = { quote, execute };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    else root.AlchemyCore = api;
})(typeof window === 'undefined' ? globalThis : window);
