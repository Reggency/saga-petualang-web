(function (root) {
    'use strict';
    const node = typeof module !== 'undefined' && module.exports;
    const monsters = node ? require('./monsters.js') : root.GameMonsters;
    const allyCatalog = node ? require('./allies.js') : root.GameAllyCatalog;
    const stages = ['forest', 'cave', 'ruins', 'frost-tundra', 'lava-lair', 'abyssal-void'];
    const minimums = [1, 10, 40, 65, 70, 110];
    const definitions = stages.map((stage, i) => ({ id: `dungeon_${stage}`, stage, minLevel: minimums[i] }));
    const difficulties = { normal: { name: 'Normal', waves: 3 }, veteran: { name: 'Veteran', waves: 5 } };
    const clone = p => JSON.parse(JSON.stringify(p));
    const count = n => Number.isSafeInteger(n) && n >= 0 ? n : 0;
    function state(p) {
        const d = p.dungeon;
        return d && typeof d === 'object' && !Array.isArray(d) ? d : {};
    }
    function plan(stage, difficulty) {
        if (!definitions.some(d => d.stage === stage) || !Object.hasOwn(difficulties, difficulty)) throw new Error('Dungeon tidak valid.');
        const regular = monsters.filter(m => m.stage === stage && !m.name.includes('BOSS'));
        const boss = monsters.find(m => m.stage === stage && m.name.includes('BOSS'));
        const n = difficulties[difficulty].waves;
        return [...Array.from({ length: n - 1 }, (_, i) => difficulty === 'veteran' ? regular[regular.length - 1 - i % regular.length] : regular[i % regular.length]), boss];
    }
    function restoreHealth(p, run) {
        const before=run?.healthBefore;
        if(!before||!Number.isFinite(before.hero))return false; // Old runs have no snapshot.
        p.hp=before.hero;
        for(const [id,hp]of Object.entries(before.allies||{}))if(p.allies?.[id]&&Number.isFinite(hp))p.allies[id].hp=hp;
        return true;
    }
    function start(p, stage, difficulty, now = Date.now(), heroMaxHp = p.maxHp) {
        if (state(p).active) throw new Error('Selesaikan atau akhiri Dungeon yang sedang berjalan.');
        const def = definitions.find(d => d.stage === stage);
        plan(stage, difficulty);
        if ((p.level || 1) < def.minLevel || p.hp <= 0) throw new Error('Level atau HP belum memenuhi syarat Dungeon.');
        const next = clone(p), d = { ...state(next) };
        const serial = count(d.serial) + 1;
        if (!Number.isSafeInteger(serial)) throw new Error('Kapasitas riwayat Dungeon terlampaui.');
        d.serial = serial; d.attempts = count(d.attempts) + 1;
        d.active = { id: serial, stage, difficulty, wave: 0, status: 'ready', startedAt: now, gold: 0, exp: 0, kills: 0, drops: {} };
        d.active.healthBefore={hero:p.hp,allies:{}};
        next.hp=Math.max(1,Number.isFinite(heroMaxHp)?heroMaxHp:p.maxHp);
        const members=[...new Set(p.party||[])].filter(id=>p.allies?.[id]?.active&&allyCatalog.allies[id]).slice(0,3);
        for(const id of members){
            const inst=next.allies[id],stats=allyCatalog.statsFor(allyCatalog.allies[id],inst);
            d.active.healthBefore.allies[id]=stats.hp;
            inst.hp=stats.maxHp;
        }
        next.dungeon = d; return next;
    }
    function launch(p) {
        const active = state(p).active;
        if (!active || active.status !== 'ready') throw new Error('Gelombang belum siap atau sudah dimulai.');
        const catalog = plan(active.stage, active.difficulty);
        const template = catalog[active.wave];
        if (!template) throw new Error('Progres gelombang tidak valid.');
        const next = clone(p);
        next.dungeon.active.status = 'combat';
        const token = `${active.id}:${active.wave}`;
        return { next, enemy: { ...clone(template), debuffs: [], dungeonToken: token } };
    }
    function victory(p, enemy, drops = {}) {
        const d = state(p), active = d.active;
        if (!active || active.status !== 'combat' || enemy.hp > 0 || enemy.dungeonToken !== `${active.id}:${active.wave}`) throw new Error('Kemenangan Dungeon tidak valid atau sudah diproses.');
        const waves = plan(active.stage, active.difficulty);
        if (waves[active.wave]?.name !== enemy.name) throw new Error('Monster gelombang tidak cocok.');
        active.wave++; active.kills++; active.gold += enemy.gold; active.exp += enemy.exp;
        for (const [name, qty] of Object.entries(drops)) active.drops[name] = count(active.drops[name]) + count(qty);
        d.wavesWon = count(d.wavesWon) + 1;
        if (active.wave < waves.length) { active.status = 'ready'; return { complete: false, gold: 0, exp: 0 }; }
        const key = `${active.stage}:${active.difficulty}`;
        d.cleared ||= {};
        const first = !d.cleared[key];
        const gold = first ? Math.max(1, Math.floor(enemy.gold / 2)) : 0;
        const exp = first ? Math.floor(enemy.exp / 10) : 0;
        d.cleared[key] = count(d.cleared[key]) + 1;
        d.completed = count(d.completed) + 1;
        restoreHealth(p,active);
        d.lastRun = { ...active, status: 'completed', bonusGold: gold, bonusExp: exp };
        d.active = null;
        return { complete: true, gold, exp };
    }
    function end(p, reason) {
        const active = state(p).active;
        if (!active) return false;
        const d = p.dungeon;
        restoreHealth(p,active);
        d.failed = count(d.failed) + 1;
        if (reason === 'defeat') d.defeats = count(d.defeats) + 1;
        else if (reason === 'abandoned') d.abandoned = count(d.abandoned) + 1;
        else d.interrupted = count(d.interrupted) + 1;
        d.lastRun = { ...active, status: reason };
        d.active = null; return true;
    }
    const api = { definitions, difficulties, plan, state, start, launch, victory, end, restoreHealth };
    if (node) module.exports = api;
    else root.GameDungeons = api;
})(typeof window === 'undefined' ? globalThis : window);
