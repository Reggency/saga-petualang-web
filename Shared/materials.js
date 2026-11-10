(function (root) {
    'use strict';
    const catalog = typeof module !== 'undefined' && module.exports ? require('./items.js') : root.GameItemCatalog;
    const integer = (value, min = 0) => Number.isSafeInteger(value) && value >= min;
    const canonical = name => catalog.aliases[name] || name;
    function inventoryKey(player, name) {
        name = canonical(name);
        return Object.keys(player.inventory || {}).find(key => canonical(key).toLowerCase() === name.toLowerCase()) || name;
    }
    function owned(player, name) {
        const amount = name === 'Gold' ? player.gold : player.inventory?.[inventoryKey(player, name)];
        return integer(amount) ? amount : 0;
    }
    function costs(player, requirements, goldCost = 0) {
        if (!Array.isArray(requirements) || !requirements.length || !integer(goldCost)) throw new Error('Resep tidak valid.');
        const totals = new Map();
        for (const req of [...requirements, { name: 'Gold', amount: goldCost }]) {
            if (!req || typeof req.name !== 'string' || !req.name.trim() || !integer(req.amount)) throw new Error('Material resep tidak valid.');
            if (!req.amount) continue;
            const key = req.name.toLowerCase() === 'gold' ? 'Gold' : inventoryKey(player, req.name);
            const amount = (totals.get(key) || 0) + req.amount;
            if (!integer(amount)) throw new Error('Jumlah material terlalu besar.');
            totals.set(key, amount);
        }
        if (!totals.size) throw new Error('Resep harus memiliki biaya.');
        return [...totals].map(([name, amount]) => ({ name, amount }));
    }
    const canAfford = (player, requirements) => requirements.every(req => owned(player, req.name) >= req.amount);
    function consume(player, requirements) {
        if (!canAfford(player, requirements)) throw new Error('Material atau Gold tidak cukup.');
        const next = JSON.parse(JSON.stringify(player));
        next.inventory ||= {};
        for (const req of requirements) {
            if (req.name === 'Gold') next.gold -= req.amount;
            else {
                next.inventory[req.name] -= req.amount;
                if (!next.inventory[req.name]) delete next.inventory[req.name];
            }
        }
        return next;
    }
    const api = { integer, inventoryKey, owned, costs, canAfford, consume };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    else root.GameMaterials = api;
})(typeof window === 'undefined' ? globalThis : window);
