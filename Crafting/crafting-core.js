(function (root) {
    'use strict';
    const data = typeof module !== 'undefined' && module.exports ? require('./recipes.js') : root.CraftingData;
    const materials = typeof module !== 'undefined' && module.exports ? require('../Shared/materials.js') : root.GameMaterials;
    const achievements = typeof module !== 'undefined' && module.exports ? require('../Shared/achievements.js') : root.GameAchievements;
    const equipmentPolicy = typeof module !== 'undefined' && module.exports ? require('../Shared/storage.js') : root.GameCore;
    const recipesById = new Map(data.recipes.map(recipe => [recipe.id, recipe]));
    const classes = {
        Fighter: 'fighter', Warrior: 'fighter', Berserker: 'fighter',
        Mage: 'mage', Sorcerer: 'mage', Archmage: 'mage',
        Archer: 'archer', Ranger: 'archer', Marksman: 'archer',
        Assassin: 'assassin', Shadow: 'assassin', Reaper: 'assassin'
    };
    const clone = value => JSON.parse(JSON.stringify(value));
    const { integer, inventoryKey, owned, costs, canAfford } = materials;
    const fail = message => { throw new Error(message); };
    const activeJob = player => classes[player.heroClass] || classes[player.baseClass] || '';
    const canUse = (player, job) => !job || job.toLowerCase() === activeJob(player);
    const availableRecipes = player => data.recipes.filter(recipe => canUse(player, recipe.job));
    function matchingItem(player, recipe) {
        return (player.items || []).find(item => (item.baseName || item.name) === recipe.name &&
            (!item.job || item.job.toLowerCase() === recipe.job));
    }
    function quote(player, action) {
        let recipe, item, requirements, goldCost, title, chance;
        switch (action.type) {
            case 'craft':
                recipe = recipesById.get(action.id);
                if (!recipe || !canUse(player, recipe.job)) fail('Resep tidak tersedia untuk kelas aktif.');
                if (matchingItem(player, recipe)) fail('Item sudah dimiliki. Gunakan tab Enhance.');
                ({ requirements, goldCost } = recipe);
                title = `Tempa: ${recipe.name}`;
                break;
            case 'enhance': {
                if (!integer(action.index)) fail('Item tidak valid.');
                item = player.items?.[action.index];
                if (!item || equipmentPolicy.isRetiredAccessory(item) || !canUse(player, item.job) || !item.slot || !item.statType ||
                    !Number.isFinite(item.statValue) || item.statValue < 0) fail('Item tidak bisa di-Enhance.');
                const level = item.enhanceLevel ?? 0;
                if (!integer(level) || level >= 10) fail('Enhance maksimum +10.');
                recipe = data.recipes.find(r => r.name === (item.baseName || item.name) && canUse(player, r.job));
                const baseRequirements = item.enhanceMaterials?.length ? item.enhanceMaterials
                    : recipe?.requirements || [{ name: data.universalMaterial, amount: 12 }];
                requirements = baseRequirements.map(req => ({ name: req.name, amount: req.amount * (level + 1) }));
                goldCost = item.craftGoldCost ?? recipe?.goldCost ?? 120;
                chance = Math.max(0.25, 0.9 - 0.1 * level);
                title = `Enhance: ${item.name} +${level + 1}`;
                break;
            }
            case 'smelt':
                recipe = data.smelting.find(r => r.id === action.id);
                if (!recipe) fail('Resep peleburan tidak valid.');
                requirements = [{ name: recipe.input, amount: recipe.amount }];
                goldCost = recipe.goldCost;
                title = `Lebur: ${recipe.output}`;
                break;
            case 'convert':
                recipe = Object.hasOwn(data.conversions, action.name) && data.conversions[action.name];
                if (!recipe || !integer(action.quantity, 1)) fail('Jumlah atau material konversi tidak valid.');
                requirements = [{ name: action.name, amount: action.quantity }];
                goldCost = recipe.goldCost * action.quantity;
                if (!integer(recipe.yield * action.quantity, 1)) fail('Hasil konversi terlalu besar.');
                title = `Konversi: ${action.quantity} ${action.name} → ${recipe.yield * action.quantity} ${data.universalMaterial}`;
                break;
            default: fail('Aksi crafting tidak valid.');
        }
        return { recipe, item, title, chance, requirements: costs(player, requirements, goldCost) };
    }
    // Work on a snapshot. The caller persists it before replacing the live actor.
    // Every action revalidates its costs after the confirmation dialog.
    function execute(player, action, random = Math.random) {
        const plan = quote(player, action);
        const next = materials.consume(player, plan.requirements);
        next.items ||= [];
        next.equipment ||= {};
        const addMaterial = (name, amount) => {
            const key = inventoryKey(next, name);
            const total = owned(next, name) + amount;
            if (!integer(total)) fail('Kapasitas material terlampaui.');
            next.inventory[key] = total;
        };
        let message;
        let success = true;
        if (action.type === 'craft') {
            achievements.event(next, 'craft');
            const r = plan.recipe;
            const item = {
                baseName: r.name, name: r.name, icon: r.job === 'mage' ? 'fa-wand-magic-sparkles' : 'fa-hammer',
                color: '#f8fafc', rarityClass: '', qty: 1, slot: r.slot, job: r.job || null,
                statType: r.statType, baseStatValue: r.statGain, statValue: r.statGain, enhanceLevel: 0,
                craftGoldCost: r.goldCost, enhanceMaterials: clone(r.requirements)
            };
            next.items.push(item);
            next.equipment[item.slot] = clone(item);
            message = `${r.name} berhasil ditempa dan dipasang.`;
        } else if (action.type === 'enhance') {
            const item = next.items[action.index];
            success = random() < plan.chance;
            if (success) {
                item.baseStatValue ??= item.statValue;
                item.enhanceLevel = (item.enhanceLevel || 0) + 1;
                item.statValue = item.baseStatValue + Math.floor(item.baseStatValue * 0.25 * item.enhanceLevel);
                if (!Number.isFinite(item.statValue)) fail('Stat item tidak valid.');
                next.equipment[item.slot] = clone(item);
            }
            message = success ? `${item.name} berhasil di-Enhance ke +${item.enhanceLevel}.`
                : 'Enhance gagal. Level item tetap; material dan Gold terpakai.';
        } else if (action.type === 'smelt') {
            addMaterial(plan.recipe.output, 1);
            message = `Berhasil melebur 1 ${plan.recipe.output}.`;
        } else {
            addMaterial(data.universalMaterial, plan.recipe.yield * action.quantity);
            message = plan.title;
        }
        return { next, message, success };
    }
    const api = { activeJob, canUse, availableRecipes, inventoryKey, owned, canAfford, quote, execute };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    else root.CraftingCore = api;
})(typeof window === 'undefined' ? globalThis : window);
