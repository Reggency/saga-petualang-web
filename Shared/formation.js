(function (root) {
    'use strict';
    const tank = actor => ['Knight', 'Paladin'].includes(actor.class);
    function position(player, actor) {
        const key = actor === player ? 'hero' : actor.id;
        const stored = player.formation?.[key];
        return ['front', 'back'].includes(stored) ? stored : actor === player || tank(actor) ? 'front' : 'back';
    }
    function choose(player, targets, enemy, now, roll) {
        const live = [...new Set(targets)].filter(a => a.hp > 0);
        const taunt = enemy.tauntExpiresAt > now && live.find(a => a !== player && a.id === enemy.tauntedBy);
        if (taunt) return taunt;
        const weights = live.map(a => (position(player, a) === 'front' ? 3 : 1) * (tank(a) ? 1.5 : 1));
        let remaining = Math.max(0, Math.min(0.999999, roll)) * weights.reduce((a, b) => a + b, 0);
        return live.find((a, i) => (remaining -= weights[i]) < 0) || live[0];
    }
    function protection(player, target, targets) {
        return position(player, target) === 'back' && targets.some(a => a !== target && a.hp > 0 && position(player, a) === 'front') ? 0.8 : 1;
    }
    function configure(player, positions) {
        const allowed = new Set(['hero', ...(player.party || [])]);
        const next = { ...(player.formation || {}) };
        for (const [id, value] of Object.entries(positions || {})) {
            if (!allowed.has(id) || !['front', 'back'].includes(value)) throw new Error('Posisi formasi tidak valid.');
            next[id] = value;
        }
        return next;
    }
    const api = { position, choose, protection, configure };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    else root.GameFormation = api;
})(typeof window === 'undefined' ? globalThis : window);
