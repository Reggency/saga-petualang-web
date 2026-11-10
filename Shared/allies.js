(function (root) {
    'use strict';
    // One source for recruitment previews and Battle; existing ally IDs stay stable.
    const allies = {
        ALLY_KNIGHT: { id: 'ALLY_KNIGHT', name: 'Sir Kael', class: 'Knight', icon: 'fa-shield-halved', hp: 160, attack: 14, def: 28, magic: 0, cost: 200,
            description: 'Ksatria pelindung yang memprovokasi musuh agar menyerangnya.', skill: { type: 'taunt', chance: 0.4 } },
        ALLY_HEALER: { id: 'ALLY_HEALER', name: 'Elara', class: 'Priestess', icon: 'fa-heart-pulse', hp: 140, attack: 8, def: 8, magic: 18, cost: 750,
            description: 'Pendeta yang memulihkan HP pemain dan seluruh rekan yang masih hidup.', skill: { type: 'regen', chance: 0.25, amount: 0.15, usesMana: true } },
        ALLY_PALADIN: { id: 'ALLY_PALADIN', name: 'Lysander', class: 'Paladin', icon: 'fa-cross', hp: 150, attack: 20, def: 20, magic: 8, cost: 900,
            description: 'Paladin yang memperkuat pertahanannya dengan Teriakan Perang.', skill: { type: 'buff_def', chance: 0.3, usesMana: true } },
        ALLY_RANGER: { id: 'ALLY_RANGER', name: 'Faelan', class: 'Ranger', icon: 'fa-bow-arrow', hp: 100, attack: 32, def: 8, magic: 2, cost: 650,
            description: 'Penembak jitu yang menghujani musuh dengan tiga serangan panah.', skill: { type: 'smash', chance: 0.3 } },
        ALLY_MAGE: { id: 'ALLY_MAGE', name: 'Vesper', class: 'Mage', icon: 'fa-hat-wizard', hp: 75, attack: 6, def: 5, magic: 28, cost: 800,
            description: 'Penyihir yang membakar musuh dengan Bola Api.', skill: { type: 'fireball', chance: 0.25, usesMana: true } },
        ALLY_ROGUE: { id: 'ALLY_ROGUE', name: 'Nyx', class: 'Rogue', icon: 'fa-mask', hp: 95, attack: 28, def: 7, magic: 4, cost: 700,
            description: 'Pembunuh gesit dengan Tusukan Belakang yang berpeluang kritikal tinggi.', skill: { type: 'backstab', chance: 0.2 } }
    };
    const skillDescriptions = {
        taunt: 'Provokasi: musuh menyerang Knight selama 5 detik. Cooldown 10 detik.',
        regen: 'Restorasi Kudus: memulihkan seluruh party yang hidup, lalu 4 tick regen setiap 2,5 detik. Berskala Magic rekan. Biaya 30 Mana. Cooldown 20 detik.',
        buff_def: 'Teriakan Perang: DEF rekan ini naik 50% selama 10 detik. Tidak menumpuk. Biaya 20 Mana. Cooldown 20 detik.',
        smash: 'Balasan Panah: 3 serangan, masing-masing 90% ATK rekan dikurangi DEF musuh. Cooldown 16 detik.',
        fireball: 'Bola Api: 150% Magic rekan dikurangi Magic DEF musuh. Biaya 20 Mana. Cooldown 6 detik.',
        backstab: 'Tusukan Belakang: 200% ATK rekan dikurangi DEF musuh, dengan peluang kritikal 50%. Cooldown 12 detik.'
    };
    skillDescriptions.heal = skillDescriptions.minor_heal = skillDescriptions.regen;
    // Existing recruitment presets; shared so previews and legacy resource defaults agree.
    function classDefaults(className) {
        const name = (className || '').toLowerCase();
        if (name.includes('knight')) return { statPoints: 0, stats: { hpBonus: 80, atkBonus: 1, defBonus: 6 } };
        if (name.includes('paladin')) return { statPoints: 0, stats: { hpBonus: 70, atkBonus: 2, defBonus: 5, magicBonus: 2, maxManaBonus: 40 } };
        if (name.includes('ranger')) return { statPoints: 0, stats: { hpBonus: 25, atkBonus: 4, aspdBonus: 3, dodgeBonus: 3 } };
        if (name.includes('rogue')) return { statPoints: 0, stats: { hpBonus: 20, atkBonus: 5, dodgeBonus: 4, aspdBonus: 4 } };
        if (name.includes('mage') || name.includes('wizard') || name.includes('sorcer')) return { statPoints: 0, stats: { hpBonus: 10, magicBonus: 10, maxManaBonus: 150 } };
        if (name.includes('priest') || name.includes('healer')) return { statPoints: 0, stats: { hpBonus: 30, magicBonus: 6, maxManaBonus: 100 } };
        return { statPoints: 0, stats: { hpBonus: 10, atkBonus: 1, defBonus: 1 } };
    }
    const number = (value, fallback = 0) => value !== null && value !== '' && Number.isFinite(Number(value)) ? Math.max(0, Math.floor(Number(value))) : fallback;
    function statsFor(base, instance = {}) {
        const bonus = instance.stats || {};
        const level = Math.max(1, number(instance.level, 1));
        const maxHp = Math.max(1, number(base.hp) + number(bonus.hpBonus) + (level - 1) * 10);
        const maxMana = number(base.maxMana) + number(bonus.maxManaBonus, classDefaults(base.class).stats.maxManaBonus || 0);
        return {
            level, maxHp, hp: Math.min(maxHp, number(instance.hp, maxHp)),
            attack: Math.max(1, number(base.attack) + number(bonus.atkBonus) + (level - 1) * 2),
            def: number(base.def) + number(bonus.defBonus) + level - 1,
            magic: number(base.magic) + number(bonus.magicBonus),
            dodge: number(base.dodge) + number(bonus.dodgeBonus),
            aspd: number(base.aspd) + number(bonus.aspdBonus),
            maxMana, mana: Math.min(maxMana, number(instance.mana, maxMana))
        };
    }
    const api = { allies, skillDescriptions, classDefaults, statsFor };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    else root.GameAllyCatalog = api;
})(typeof window === 'undefined' ? globalThis : window);
