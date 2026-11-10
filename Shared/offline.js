(function (root) {
    'use strict';
    const monsters = typeof module !== 'undefined' && module.exports ? require('./monsters.js') : root.GameMonsters;
    const MAX_MS = 8 * 60 * 60 * 1000;
    const MIN_MS = 60000;
    const stages = { forest: 1, cave: 10, ruins: 40, 'frost-tundra': 65, 'lava-lair': 70, 'abyssal-void': 110 };
    const number = value => typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0;
    const timestamp = value => Number.isSafeInteger(value) && value > 0;
    const clone = value => JSON.parse(JSON.stringify(value));
    const regulars = stage => monsters.filter(m => m.stage === stage && !m.name.includes('BOSS'));

    // Shared with live exploration so offline and online stage gates cannot drift.
    function allowedStages(level) {
        return Object.keys(stages).filter(stage => level >= stages[stage]);
    }

    function snapshot(player, { now, active, stage, stats, party = [] }) {
        const previous = player.offlineProgress?.lastActivityAt;
        return {
            version: 1, lastActivityAt: Math.max(now, timestamp(previous) ? previous : 0),
            autoBattle: active === true && player.hp > 0 && allowedStages(player.level).includes(stage) && !player.dungeon?.active,
            stage, level: player.level, monsters: regulars(stage).map(m => m.name),
            hero: { ...stats, hp: Math.min(player.hp, stats.maxHp) }, party: clone(party),
            lastResult: player.offlineProgress?.lastResult || null,
            deferLevelQuest: player.offlineProgress?.deferLevelQuest === true
        };
    }

    // The existing level curve, used by live combat and offline settlement alike.
    function levelUp(player, maxHp, onLevel = () => {}) {
        while (player.exp >= player.maxExp && player.maxExp > 0) {
            player.exp -= player.maxExp;
            player.level++;
            player.maxExp = Math.floor(player.maxExp * 1.15) + 50;
            player.statPoints = (player.statPoints || 0) + 3;
            const skillPoint = player.level <= 100 && player.level % 5 === 0;
            if (skillPoint) player.skillPoints = (player.skillPoints || 0) + 1;
            player.baseDefense = (player.baseDefense || 0) + 1;
            player.hp = maxHp;
            onLevel(player.level, skillPoint);
        }
    }

    // A bounded estimate over the catalog, never a battle loop over elapsed time.
    // Ignore skills, consumables and temporary buffs; freeze strength for the whole absence.
    function estimate(player, now) {
        const saved = player.offlineProgress;
        const result = { durationMs: 0, monstersKilled: 0, exp: 0, gold: 0, materials: {}, healthCost: [], stoppedEarly: false };
        if (!saved || saved.version !== 1 || saved.autoBattle !== true || !timestamp(now) ||
            !timestamp(saved.lastActivityAt) || now <= saved.lastActivityAt || player.hp <= 0 || player.dungeon?.active) return result;
        const duration = now - saved.lastActivityAt;
        if (duration < MIN_MS || !allowedStages(Math.min(number(saved.level), player.level)).includes(saved.stage)) return result;
        result.durationMs = Math.min(MAX_MS, duration);
        const pool = regulars(saved.stage);
        // A missing/partial pool must not cherry-pick the weakest monster in a stage.
        if (!pool.length || !Array.isArray(saved.monsters) || pool.some(m => !saved.monsters.includes(m.name))) return result;
        const hero = saved.hero;
        if (!hero || !['atk', 'def', 'magic', 'dodge', 'aspd', 'hp', 'maxHp'].every(key => Number.isFinite(hero[key]) && hero[key] >= 0)) return result;
        const actors = [{ ...hero, hp: Math.min(hero.hp, player.hp) }];
        const ids = new Set();
        for (const ally of Array.isArray(saved.party) ? saved.party.slice(0, 3) : []) {
            const inst = player.allies?.[ally.id];
            if (!inst || ids.has(ally.id) || !player.party?.includes(ally.id) || !player.activeParty?.includes(ally.id) || inst.active === false ||
                !['atk', 'def', 'magic', 'dodge', 'aspd', 'hp'].every(key => Number.isFinite(ally[key]) && ally[key] >= 0)) continue;
            ids.add(ally.id);
            const hp = Math.min(ally.hp, inst.hp === undefined ? ally.hp : number(inst.hp));
            if (hp > 0) actors.push({ ...ally, hp });
        }
        if (actors[0].hp <= 1) return result;
        const clamp = (value, max = 1) => Math.min(max, Math.max(0, value));
        let cycleMs = 0;
        const costs = actors.map(() => 0);
        for (const monster of pool) {
            const hitChance = 1 - clamp(monster.speed / 400, 0.95);
            const damage = actors.reduce((sum, actor) => {
                const hits = 1 + clamp(actor.aspd / 100) + clamp((actor.aspd - 100) / 100);
                const perHit = Math.max(1, Math.max(0, actor.atk * 0.8 - monster.def) + Math.max(0, actor.magic - (monster.magicDef || 0)));
                return sum + perHit * hits * hitChance;
            }, 0);
            const rounds = Math.max(1, Math.ceil(monster.maxHp / damage));
            // Include both explore delay and the post-kill pause, plus 25% inefficiency.
            const delay = Math.max(250, Math.round(1600 / (1 + hero.aspd / 100)));
            cycleMs = Math.max(cycleMs, (2500 + rounds * delay) / 0.75);
            const counters = Math.max(0, rounds - 1) + (1 - hitChance) / hitChance;
            actors.forEach((actor, i) => {
                // Budget as if every counter targeted this actor. This deliberately
                // underestimates survival and never relies on permanent taunt/healing.
                const incoming = Math.max(1, Math.ceil(monster.attack * 1.2) - actor.def) * (1 - clamp(actor.dodge / 100, 0.75));
                costs[i] = Math.max(costs[i], incoming * counters);
            });
        }
        let kills = Math.floor(result.durationMs / cycleMs);
        actors.forEach((actor, i) => {
            if (costs[i] > 0) kills = Math.min(kills, Math.max(0, Math.floor((actor.hp - 1) / costs[i])));
        });
        // Complete whole balanced pools; rounding down prevents reload/drop rerolls.
        const perMonster = Math.floor(kills / pool.length);
        result.monstersKilled = perMonster * pool.length;
        result.stoppedEarly = result.monstersKilled < Math.floor(result.durationMs / cycleMs) - pool.length + 1;
        if (result.stoppedEarly) result.durationMs = Math.min(result.durationMs, Math.ceil((result.monstersKilled + 1) * cycleMs));
        for (const monster of pool) {
            result.exp += perMonster * monster.exp;
            result.gold += perMonster * monster.gold;
            for (const drop of monster.drops || []) {
                if (drop.type !== 'material') continue;
                const qty = Math.floor(perMonster * clamp(number(drop.chance)));
                if (qty > 0) result.materials[drop.name] = (result.materials[drop.name] || 0) + qty;
            }
        }
        result.healthCost = actors.map((actor, i) => ({ id: actor.id || null, amount: Math.ceil(costs[i] * result.monstersKilled) }));
        return result;
    }

    function settle(player, now) {
        const next = clone(player);
        const summary = estimate(player, now);
        if (next.offlineProgress && (typeof next.offlineProgress !== 'object' || Array.isArray(next.offlineProgress))) {
            next.offlineProgress = { version: 1, autoBattle: false, lastActivityAt: timestamp(now) ? now : 0 };
        }
        if (next.offlineProgress) {
            next.offlineProgress.autoBattle = false;
            next.offlineProgress.lastActivityAt = Math.max(timestamp(now) ? now : 0,
                timestamp(player.offlineProgress.lastActivityAt) ? player.offlineProgress.lastActivityAt : 0);
            if (summary.durationMs > 0) next.offlineProgress.lastResult = summary;
        }
        if (summary.monstersKilled > 0) {
            const add = (a, b) => Math.min(Number.MAX_SAFE_INTEGER, number(a) + b);
            next.gold = add(next.gold, summary.gold);
            next.exp = add(next.exp, summary.exp);
            next.inventory = next.inventory || {};
            for (const [name, qty] of Object.entries(summary.materials)) next.inventory[name] = add(next.inventory[name], qty);
            for (const cost of summary.healthCost) {
                if (!cost.id) next.hp = Math.max(1, next.hp - cost.amount);
                else next.allies[cost.id].hp = Math.max(1, next.allies[cost.id].hp - cost.amount);
            }
            // No quest/kill/boss/discovery counters are touched by offline rewards.
            levelUp(next, Math.max(1, number(player.offlineProgress.hero.maxHp)));
            if (next.level > player.level) next.offlineProgress.deferLevelQuest = true;
        }
        return { next, summary: summary.durationMs > 0 ? summary : null };
    }

    function exclusive(action) {
        if (root.navigator?.locks) return root.navigator.locks.request('saga-offline-settlement-v1', action);
        // IndexedDB read/write transactions serialize tabs too, including browsers
        // without Web Locks. No lease timeout or non-atomic localStorage lock.
        return new Promise((resolve, reject) => {
            if (!root.indexedDB) { reject(new Error('Penyimpanan transaksi offline tidak tersedia.')); return; }
            const request = root.indexedDB.open('saga-offline-lock', 1);
            request.onupgradeneeded = () => request.result.createObjectStore('mutex');
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                const db = request.result;
                const tx = db.transaction('mutex', 'readwrite');
                let result;
                tx.objectStore('mutex').put(1, 'claim').onsuccess = () => {
                    try { result = action(); } catch (error) { tx.abort(); reject(error); }
                };
                tx.oncomplete = () => { db.close(); resolve(result); };
                tx.onabort = tx.onerror = () => { db.close(); reject(tx.error || new Error('Transaksi offline gagal.')); };
            };
        });
    }

    async function claim(storage, now = Date.now(), lock = exclusive) {
        return lock(() => {
            const player = JSON.parse(storage.getItem('rpg_player'));
            if (!player?.offlineProgress) return null; // legacy saves start with no retroactive reward
            const { next, summary } = settle(player, now);
            // Reward, consumed interval and receipt are ONE existing profile write.
            // Existing storage freshness checks reject a second tab with an old snapshot.
            storage.savePlayer(next);
            return summary;
        });
    }

    const api = { MAX_MS, MIN_MS, allowedStages, snapshot, estimate, settle, claim, levelUp };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    else root.GameOffline = api;
})(typeof window === 'undefined' ? globalThis : window);
