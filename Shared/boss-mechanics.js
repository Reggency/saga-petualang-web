(function (root) {
    'use strict';
    const node = typeof module !== 'undefined' && module.exports;
    const monsters = node ? require('./monsters.js') : root.GameMonsters;
    const definitions = {
        forest: { id: 'BOSS_SLIME_CALL', name: 'Panggilan Lendir', cooldown: 14000, description: 'Memanggil dua bantuan Slime untuk memperkuat dua serangan berikutnya. Bantuan tidak memberi hadiah terpisah.' },
        cave: { id: 'BOSS_ORC_RAGE', name: 'Teriakan Panglima', cooldown: 14000, description: 'Meningkatkan ATK sebesar 25% selama 6 detik; tidak menumpuk.' },
        ruins: { id: 'BOSS_LICH_CURSE', name: 'Kutukan Kafan', cooldown: 12000, description: 'Memberi racun selama 6 detik pada target serangan.' },
        'frost-tundra': { id: 'BOSS_TITAN_FROST', name: 'Napas Frost', cooldown: 10000, description: 'Membekukan target selama 1,5 detik melalui efek stun.' },
        'lava-lair': { id: 'BOSS_DRAGON_INFERNO', name: 'Semburan Inferno', cooldown: 12000, description: 'Serangan 135% ATK dan efek terbakar selama 6 detik.' },
        'abyssal-void': { id: 'BOSS_VOID_SEAL', name: 'Segel Kekosongan', cooldown: 12000, description: 'Menguras 20% Mana tersisa dan mengurangi ASPD sebesar 25% selama 5 detik.' }
    };
    const definition = enemy => enemy?.name?.includes('BOSS') ? definitions[enemy.stage] : null;
    function initialize(enemy, now) {
        if (definition(enemy)) {
            enemy.bossSkillReadyAt = now + 3000;
            enemy.combatBuffs = [];
            enemy.bossSummons = 0;
        }
    }
    function action(enemy, target, now, effectsEnabled = true) {
        const skill = definition(enemy);
        let multiplier = 1, extra = 0, name = '';
        if (enemy.bossSummons > 0) {
            extra = monsters.find(m => m.name === 'Slime').attack;
            enemy.bossSummons--;
        }
        if (skill && (enemy.bossSkillReadyAt ?? now + 3000) <= now) {
            enemy.bossSkillReadyAt = now + skill.cooldown;
            name = skill.name;
            const add = (type, duration, values = {}) => {
                if (!effectsEnabled) return;
                target.debuffs = (target.debuffs || []).filter(d => d.source !== skill.id);
                target.debuffs.push({ type, source: skill.id, expiresAt: now + duration, lastTick: now, ...values });
            };
            switch (enemy.stage) {
                case 'forest': enemy.bossSummons = 2; break;
                case 'cave':
                    if (!effectsEnabled) break;
                    enemy.combatBuffs = (enemy.combatBuffs || []).filter(b => b.source !== skill.id);
                    enemy.combatBuffs.push({ stat: 'atk', value: Math.floor(enemy.attack * 0.25), expiresAt: now + 6000, source: skill.id });
                    break;
                case 'ruins': add('poison', 6001, { perTickDamage: Math.max(1, Math.floor(enemy.attack * 0.08)) }); break;
                case 'frost-tundra': add('stun', 1500); break;
                case 'lava-lair': multiplier = 1.35; add('burn', 6001, { perTickDamage: Math.max(1, Math.floor(enemy.attack * 0.08)) }); break;
                case 'abyssal-void':
                    if (effectsEnabled) target.mana = Math.max(0, Math.ceil((target.mana || 0) * 0.8));
                    add('slow', 5000, { value: 25 }); break;
            }
        }
        enemy.combatBuffs = effectsEnabled ? (enemy.combatBuffs || []).filter(b => b.expiresAt > now) : [];
        const attack = (enemy.attack || 0) + enemy.combatBuffs.filter(b => b.stat === 'atk').reduce((sum, b) => sum + b.value, 0);
        return { attack: attack * multiplier + extra, name };
    }
    function speed(actor, value, now, enabled = true) {
        if (!enabled) return value;
        const slow = Math.max(0, ...(actor.debuffs || []).filter(d => d.type === 'slow' && d.expiresAt > now).map(d => Math.min(75, Math.max(0, Number(d.value) || 20))));
        return Math.max(0, value * (1 - slow / 100));
    }
    const api = { definitions, definition, initialize, action, speed };
    if (node) module.exports = api;
    else root.GameBossMechanics = api;
})(typeof window === 'undefined' ? globalThis : window);
