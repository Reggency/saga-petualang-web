// =========================================================================
// 0. LOG CLIENT
// =========================================================================
console.log("Script Arena Aktif: Sistem 6 Atribut Upgrade, Formula Magic DEF, & Suara Sihir FIX!");

// =========================================================================
// 1. DATA STATUS PEMAIN (LOAD DARI MEMORI)
// =========================================================================

// Centralized game state: keep all dynamic runtime data inside `window.GameState`.
window.GameState = window.GameState || {};
window.GameState.player = JSON.parse(GameStorage.getItem('rpg_player'));

// Backward-compatible global accessors: codebase still reads/writes `player` and
// `purchasedItems` — proxy them to `GameState` so we avoid scattered globals.
Object.defineProperty(window, 'player', {
    get() { return window.GameState.player; },
    set(v) { window.GameState.player = v; },
    configurable: true
});

// Sistem Keamanan: Kalau pemain langsung buka index.html tanpa login/pilih karakter,
// tendang kembali ke halaman hero.html!
if (!player) {
    window.location.href = '../Hero/hero.html';
    throw new Error('Data player tidak ditemukan.');
}

window.GameState.purchasedItems = window.GameState.purchasedItems || [];
Object.defineProperty(window, 'purchasedItems', {
    get() { return window.GameState.purchasedItems; },
    set(v) { window.GameState.purchasedItems = v; },
    configurable: true
});

// =========================================================================
// 2. MAPPING ELEMEN HTML (DOM SELECTION)
// =========================================================================
const elPlayerName = document.getElementById('player-name');   
const elPlayerClass = document.getElementById('player-class'); 
const elMagicDamage = document.getElementById('magic-damage'); 
const elAttackSpeed = document.getElementById('attack-speed'); 
const elMana = document.getElementById('mana'), elMaxMana = document.getElementById('max-mana');
const elHp = document.getElementById('hp'), elMaxHp = document.getElementById('max-hp'), elLevel = document.getElementById('level');
const elGold = document.getElementById('gold'), elExp = document.getElementById('exp'), elMaxExp = document.getElementById('max-exp');
const elAttack = document.getElementById('attack'), elDefense = document.getElementById('defense'), elDodge = document.getElementById('dodge');
const elPotions = document.getElementById('potions'), elManaPotions = document.getElementById('mana-potions'), elStatPoints = document.getElementById('stat-points');

const elSkillPoints = document.getElementById('skill-points'); // Tambahan untuk poin skill
const elEqWeapon = document.getElementById('eq-weapon'), elEqArmor = document.getElementById('eq-armor'), elEqBoots = document.getElementById('eq-boots');
const elEqHelmet = document.getElementById('eq-helmet'), elEqAmulet = document.getElementById('eq-amulet'), elEqGloves = document.getElementById('eq-gloves'), elEqOffhand = document.getElementById('eq-offhand');

const enemyPanel = document.getElementById('enemy-panel'), centerPanel = document.getElementById('center-panel'), elEnemyName = document.getElementById('enemy-name'), elEnemyHp = document.getElementById('enemy-hp'), elEnemyMaxHp = document.getElementById('enemy-max-hp'), elMonsterImg = document.getElementById('monster-img'), skillsPanel = document.getElementById('skills-panel');
const gameContainerEl = document.getElementById('game-container');
// focus mode removed; no btnFocusToggle
const btnExplore = document.getElementById('btn-explore');
// const btnAttack = document.getElementById('btn-attack');

const panelUsePotion = document.getElementById('panel-use-potion');
const panelUseManaPotion = document.getElementById('panel-use-mana-potion');

// Cached DOM references untuk rendering cepat
const elAvatarImg = document.getElementById('player-avatar-img');
const elAvatarIcon = document.getElementById('player-avatar-icon');
let wargaPortraitMissing = false;
let wargaPortraitSource = '../assets/characters/warga/portrait.png';
const hpBar = document.getElementById('hp-bar');
const manaBar = document.getElementById('mana-bar');
const expBar = document.getElementById('exp-bar');
const btnPotionThreshold = document.getElementById('btn-setting-auto');
const btnGoToko = document.getElementById('btn-go-toko');
const btnGoCraft = document.getElementById('btn-go-craft');
const preBattleScreen = document.getElementById('pre-battle-screen');
const battleControls = document.getElementById('battle-controls');
const btnStartAdventure = document.getElementById('btn-start-adventure');
const btnReturnTavern = document.getElementById('btn-return-tavern');
const btnReturnAdventure = document.getElementById('btn-return-adventure');
const enemyHpBarFill = document.querySelector('.enemy-hp-bar-fill');
const enemyDebuffsContainer = document.getElementById('enemy-debuffs');
const playerBuffsContainer = document.getElementById('player-buffs');
const questListContainer = document.getElementById('quest-list');
let lastDebuffRenderAt = 0;
let lastEnemyDebuffKey = '';
let lastPlayerBuffKey = '';
// --- Cached last values to avoid redundant DOM writes ---
const lastValues = {
    hp: null, maxHp: null, hpPercent: null,
    mana: null, maxMana: null, manaPercent: null,
    level: null, gold: null, exp: null, maxExp: null,
    attack: null, defense: null, magic: null, atkSpeed: null, dodge: null,
    potions: null, manaPotions: null, statPoints: null, skillPoints: null
};

const MAX_LOG_LINES = 50;

const questDatabase = [
    { id: 'kill_any_20', title: 'Berburu Monster', description: 'Kalahkan 20 monster.', type: 'kill_any', target: 20, rewardGold: 120, rewardExp: 140 },
    { id: 'earn_gold_200', title: 'Kantong Emas', description: 'Kumpulkan 200 Gold dari pertarungan.', type: 'gold_earned', target: 200, rewardGold: 180, rewardExp: 120 },
    { id: 'boss_1', title: 'Pembunuh Bos', description: 'Kalahkan 1 bos besar.', type: 'boss_defeat', target: 1, rewardGold: 320, rewardExp: 220 },
    { id: 'reach_level_5', title: 'Naik Level 5', description: 'Capai Level 5.', type: 'reach_level', target: 5, rewardGold: 280, rewardExp: 260 },
    { id: 'kill_any_50', title: 'Berburu Lebih Banyak', description: 'Kalahkan 50 monster.', type: 'kill_any', target: 50, rewardGold: 240, rewardExp: 260 },
    { id: 'earn_gold_500', title: 'Emas Lebih Banyak', description: 'Kumpulkan 500 Gold dari pertarungan.', type: 'gold_earned', target: 500, rewardGold: 400, rewardExp: 360 }
];

function getQuestTemplate(id) {
    return questDatabase.find(q => q.id === id);
}

function initializeQuestSystem() {
    if (!Array.isArray(player.quests)) player.quests = [];
    if (!player.questCounters || typeof player.questCounters !== 'object') player.questCounters = {};
    player.questCounters = Object.assign({ monstersKilled: 0, bossesKilled: 0, battleGoldEarned: 0 }, player.questCounters);

    const existingIds = player.quests.map(q => q && q.id).filter(Boolean);
    questDatabase.forEach(template => {
        if (!existingIds.includes(template.id)) {
            player.quests.push(Object.assign({}, template, { progress: 0, completed: false }));
        }
    });

    renderQuestPanel();
}

function renderQuestPanel() {
    if (document.hidden) return;
    if (!questListContainer) return;
    questListContainer.innerHTML = '';

    if (!Array.isArray(player.quests) || player.quests.length === 0) {
        questListContainer.innerHTML = '<p class="no-quest-msg"><i>Belum ada quest aktif. Bertualang untuk mendapatkan tugas!</i></p>';
        return;
    }

    player.quests.forEach(quest => {
        const card = document.createElement('div');
        card.className = `quest-card${quest.completed ? ' completed' : ''}`;

        const titleRow = document.createElement('div');
        titleRow.className = 'quest-title';
        titleRow.innerHTML = `<span>${quest.title}</span><span>${quest.rewardGold}G / ${quest.rewardExp}XP</span>`;

        const descriptionRow = document.createElement('div');
        descriptionRow.className = 'quest-description';
        descriptionRow.textContent = quest.description;

        const statusRow = document.createElement('div');
        statusRow.className = 'quest-status';
        const statusText = quest.completed ? (quest.claimed ? 'Hadiah diklaim' : 'Selesai - Klaim di Kedai') : 'Sedang berjalan';
        statusRow.innerHTML = `<span>${quest.progress} / ${quest.target}</span><span>${statusText}</span>`;

        const progressBar = document.createElement('div');
        progressBar.className = 'quest-progress';
        const progressFill = document.createElement('div');
        progressFill.className = 'quest-progress-bar';
        progressFill.style.width = `${Math.min(100, (quest.progress / quest.target) * 100)}%`;
        progressBar.appendChild(progressFill);

        card.appendChild(titleRow);
        card.appendChild(descriptionRow);
        card.appendChild(statusRow);
        card.appendChild(progressBar);
        questListContainer.appendChild(card);
    });
}

function completeQuest(quest) {
    if (!quest || quest.completed) return;
    quest.completed = true;
    quest.claimed = Boolean(quest.claimed);
    logMessage(`🎁 Quest selesai: **${quest.title}**. Klaim hadiahnya di Kedai.`, 'other');
    renderQuestPanel();
    saveGameData(true);
}

function updateQuestProgress(type, amount) {
    if (!Array.isArray(player.quests)) return;
    player.quests.forEach(quest => {
        if (quest.completed || quest.type !== type) return;
        if (type === 'reach_level') {
            quest.progress = Math.min(quest.target, player.level);
        } else {
            quest.progress = Math.min(quest.target, (quest.progress || 0) + amount);
        }
        if (quest.progress >= quest.target) completeQuest(quest);
    });
    renderQuestPanel();
}

function handleQuestLevelProgress() {
    updateQuestProgress('reach_level', 0);
}

function reportQuestEvent(type, amount = 1) {
    if (!player.questCounters) player.questCounters = {};
    player.questCounters[type] = (player.questCounters[type] || 0) + amount;
    updateQuestProgress(type, amount);
}

function setTextIfChanged(el, key, value) {
    if (!el) return;
    if (lastValues[key] !== value) {
        lastValues[key] = value;
        el.textContent = value;
    }
}

function setHtmlIfChanged(el, key, html) {
    if (!el) return;
    if (lastValues[key] !== html) {
        lastValues[key] = html;
        el.innerHTML = html;
    }
}

function setWidthIfChanged(el, key, widthPct) {
    if (!el) return;
    if (lastValues[key] !== widthPct) {
        lastValues[key] = widthPct;
        el.style.width = widthPct;
    }
}

// Ambil 6 Tombol Upgrade Utama dari HTML
const btnUpHp = document.getElementById('btn-up-hp');
const btnUpMana = document.getElementById('btn-up-mana');
const btnUpAtk = document.getElementById('btn-up-atk');     
const btnUpDef = document.getElementById('btn-up-def');     
const btnUpMagic = document.getElementById('btn-up-magic'); 
const btnUpDodge = document.getElementById('btn-up-dodge'); 
const btnUpAspd = document.getElementById('btn-up-aspd');   

// Log container caches
const logAll = document.getElementById('log-all');
const screenEl = document.getElementById('screen');

// =========================================================================
// 3. DATABASE MONSTER (COMPACT MODE: BOSS DI SETIAP STAGE)
// =========================================================================
const monsterDatabase = GameMonsters;

// Generic debuff processor for any entity (enemy, player, ally)
// Returns { damage, stunned }
// Look-up Table: effect type -> behavior config
const DEBUFF_BEHAVIORS = {
    stun: {
        type: 'stun',
        tickIntervalMs: 0
    },
    poison: {
        type: 'poison',
        tickIntervalMs: 2000
    },
    burn: {
        type: 'burn',
        tickIntervalMs: 2000
    },
    slow: {
        type: 'slow',
        tickIntervalMs: 0
    }
};

function processEntityDebuffs(entity) {
    if (!entity || !entity.debuffs || entity.debuffs.length === 0) return { damage: 0, stunned: false };


    // Global toggle: if disabled, clear debuffs on this entity and ignore
    if (player && player.settings && player.settings.debuffsEnabled === false) {
        try { entity.debuffs = []; } catch (e) {}
        return { damage: 0, stunned: false };
    }

    let totalDebuffDamage = 0;
    let isStunned = false;
    const now = Date.now();

    // class-specific susceptibility (targets)
    const susceptibility = (target) => {
        // default multipliers for poison (target types or classes)
        const map = {
            'Mage': 0.9, 'Fighter': 0.95, 'Archer': 1.0, 'Assassin': 1.1
        };
        if (!target) return 1.0;
        if (target.heroClass && map[target.heroClass]) return map[target.heroClass];
        if (target.class && map[target.class]) return map[target.class];
        return 1.0;
    };

    entity.debuffs = entity.debuffs.filter(debuff => {
        if (!debuff) return false;
        if (debuff.expiresAt && debuff.expiresAt < now) return false; // expired

        // Behavior resolved via DEBUFF_BEHAVIORS (effect type -> behavior config)
        const behavior = DEBUFF_BEHAVIORS[debuff.type];
        if (behavior && behavior.type === 'stun') {
            isStunned = true;
            return true;
        }

        if (behavior && (behavior.type === 'poison' || behavior.type === 'burn')) {
            // compute tick interval and whether it's time
            const tickInterval = behavior.tickIntervalMs;
            if (!debuff.lastTick) debuff.lastTick = now;
            if (debuff.lastTick + tickInterval <= now) {
                // determine damage source-aware
                let dmg = 0;
                if (debuff.perTickDamage) dmg = debuff.perTickDamage;
                else if (debuff.source && debuff.baseMultiplier) {
                    dmg = Math.floor((debuff.source.atk || 0) * debuff.baseMultiplier);
                } else if (debuff.damage) {
                    dmg = debuff.damage;
                }

                // Apply susceptibility only for poison (legacy behavior)
                if (behavior.type === 'poison') {
                    dmg = Math.max(1, Math.floor(dmg * susceptibility(entity)));
                } else {
                    dmg = Math.max(1, Math.floor(dmg));
                }

                entity.hp -= dmg;
                totalDebuffDamage += dmg;
                debuff.lastTick = now;

                if (behavior.type === 'poison') {
                    logMessage(`DEBUFF: ${entity.name || 'Target'} terkena racun sebesar **${dmg} DMG**!`, 'combat');
                } else {
                    logMessage(`DEBUFF: ${entity.name || 'Target'} terbakar sebesar **${dmg} DMG**!`, 'combat');
                }
            }
            return true;
        }

        if (behavior && behavior.type === 'slow') {
            // SLOW: reduce speed while active (applies passively)
            entity._slowPercent = debuff.value || 20;
            return true;
        }

        return true;

    });

    return { damage: totalDebuffDamage, stunned: isStunned };
}

// =========================================================================
// 3.5 DATABASE SKILL AKTIF (DILENGKAPI DARI skill_selection.js)
// =========================================================================
const skillDatabase = {
    'ALLY_TAUNT': {
        id: 'ALLY_TAUNT', name: 'Provokasi', cost: 0, cooldown: 10000,
        execute: (actor, enemy) => {
            enemy.tauntedBy = actor.id;
            enemy.tauntExpiresAt = Date.now() + 5000;
            logMessage(`SKILL: ${actor.name} memprovokasi ${enemy.name} selama 5 detik.`, 'combat');
            return {};
        }
    },
    // === FIGHTER SKILLS ===
    'FIGHTER_BASH': {
        id: 'FIGHTER_BASH', name: 'Pukulan Keras', description: 'Menghantam musuh dengan kekuatan penuh, menghasilkan 180% ATK sebagai physical damage.',
        cost: 15, cooldown: 8000, icon: 'fa-hand-rock', category: 'damage', priority: 5,
        execute: (player, enemy) => {
            const { totalAtk: pAtk } = getPlayerTotalStats();
            const damage = Math.floor(pAtk * 1.8) - enemy.def;
            const finalDamage = damage > 0 ? damage : 1;
            enemy.hp -= finalDamage;
            logMessage(`SKILL: Kamu menggunakan **Pukulan Keras** dan menghantam ${enemy.name} sebesar **${finalDamage} DMG**!`, 'combat'); 
            playSound('hit'); return { damageDealt: finalDamage };
        }
    },
    'FIGHTER_DEFENSE_UP': {
        id: 'FIGHTER_DEFENSE_UP', name: 'Teriakan Perang', description: 'Meningkatkan Defense sebesar 50% selama 10 detik.',
        cost: 20, cooldown: 20000, icon: 'fa-shield-alt', 
        category: 'buff_def', priority: 8, // AI: Gunakan saat buff tidak aktif
        execute: (player, enemy) => {
            if (!player.combatBuffs) player.combatBuffs = [];
            const { totalDef } = getSkillActorStats(player);
            player.combatBuffs.push({ stat: 'def', value: Math.floor(totalDef * 0.5), duration: 10000, expiresAt: Date.now() + 10000, source: 'FIGHTER_DEFENSE_UP' });
            logMessage(`SKILL: **Teriakan Perang** menggema! Defense-mu meningkat pesat!`, 'combat');
            playSound('heal'); return {};
        }
    },
    'FIGHTER_WHIRLWIND': {
        id: 'FIGHTER_WHIRLWIND', name: 'Puting Beliung', description: 'Serangan berputar yang mengenai musuh 3 kali, masing-masing 70% ATK.',
        cost: 35, cooldown: 18000, icon: 'fa-hurricane', category: 'damage', priority: 6,
        execute: (player, enemy) => {
            const { totalAtk: pAtk } = getPlayerTotalStats(); let totalDamage = 0;
            for (let i = 0; i < 3; i++) {
                const damage = Math.floor(pAtk * 0.7) - enemy.def;
                const finalDamage = damage > 0 ? damage : 1;
                enemy.hp -= finalDamage; totalDamage += finalDamage;
            }
            logMessage(`SKILL: **Puting Beliung** menghantam ${enemy.name} sebanyak 3 kali sebesar **${totalDamage} DMG**!`, 'combat');
            playSound('hit'); return { damageDealt: totalDamage };
        }
    },

    // === MAGE SKILLS ===
    'MAGE_FIREBALL': {
        id: 'MAGE_FIREBALL', name: 'Bola Api', description: 'Menembakkan bola api yang menghasilkan 150% Magic DMG.',
        cost: 20, cooldown: 6000, icon: 'fa-fire', 
        category: 'damage', priority: 5,
        execute: (player, enemy) => {
            const { totalMagic: pMagic } = getSkillActorStats(player);
            const damage = Math.floor(pMagic * 1.5) - (enemy.magicDef || 0);
            const finalDamage = damage > 0 ? damage : 1;
            enemy.hp -= finalDamage;
            logMessage(`SKILL: **Bola Api** membakar ${enemy.name} sebesar **${finalDamage} DMG**!`, 'combat');
            playSound('magic'); return { damageDealt: finalDamage };
        }
    },
    'MAGE_HEAL': {
        id: 'MAGE_HEAL', name: 'Perisai Arcana', description: 'Memanggil perisai magis yang meningkatkan Defense selama beberapa detik.',
        cost: 25, cooldown: 15000, icon: 'fa-shield-alt', 
        category: 'shield', priority: 9, // AI: Gunakan saat HP < 60%
        execute: (player, enemy) => {
            if (!player.combatBuffs) player.combatBuffs = [];
            // Shield as a temporary defense buff (40% dari defense saat ini)
            const { totalDef } = getPlayerTotalStats();
            const shieldValue = Math.max(1, Math.floor(totalDef * 0.4));
            const duration = 8000; // 8 detik
            player.combatBuffs.push({ stat: 'def', value: shieldValue, duration: duration, expiresAt: Date.now() + duration, source: 'MAGE_HEAL' });
            logMessage(`SKILL: **Perisai Arcana** muncul, meningkatkan Defense sebesar **${shieldValue}** selama ${duration/1000} detik!`, 'combat');
            playSound('magic');
            return {};
        }
    },
    'MAGE_METEOR': {
        id: 'MAGE_METEOR', name: 'Hujan Meteor', description: 'Menjatuhkan meteor dari langit, menghasilkan 300% Magic DMG.',
        cost: 50, cooldown: 25000, icon: 'fa-meteor', 
        category: 'nuke', priority: 7, // AI: Skill damage tinggi
        execute: (player, enemy) => {
            const { totalMagic: pMagic } = getPlayerTotalStats();
            const damage = Math.floor(pMagic * 3.0) - (enemy.magicDef || 0);
            const finalDamage = damage > 0 ? damage : 1;
            enemy.hp -= finalDamage;
            logMessage(`SKILL: **Hujan Meteor** menghantam ${enemy.name} sebesar **${finalDamage} DMG**!`, 'combat');
            playSound('magic'); return { damageDealt: finalDamage };
        }
    },

    // === ARCHER SKILLS ===
    'ARCHER_MULTI_SHOT': {
        id: 'ARCHER_MULTI_SHOT', name: 'Panah Ganda', description: 'Menembakkan dua panah secara cepat, masing-masing menghasilkan 80% ATK.',
        cost: 20, cooldown: 10000, icon: 'fa-arrows-alt-h', category: 'damage', priority: 5,
        execute: (player, enemy) => {
            const { totalAtk: pAtk } = getPlayerTotalStats(); let totalDamage = 0;
            for (let i = 0; i < 2; i++) {
                const damage = Math.floor(pAtk * 0.8) - enemy.def;
                const finalDamage = damage > 0 ? damage : 1;
                enemy.hp -= finalDamage; totalDamage += finalDamage;
            }
            logMessage(`SKILL: **Panah Ganda** menghujani ${enemy.name} sebesar **${totalDamage} DMG**!`, 'combat');
            playSound('Arrow'); return { damageDealt: totalDamage };
        }
    },
    'ARCHER_SHARP_EYE': {
        id: 'ARCHER_SHARP_EYE', name: 'Mata Elang', description: 'Meningkatkan Dodge sebesar 20% selama 15 detik.',
        cost: 15, cooldown: 22000, icon: 'fa-eye', 
        category: 'buff_dodge', priority: 8,
        execute: (player, enemy) => {
            if (!player.combatBuffs) player.combatBuffs = [];
            player.combatBuffs.push({ stat: 'dodge', value: 20, duration: 15000, expiresAt: Date.now() + 15000, source: 'ARCHER_SHARP_EYE' });
            logMessage(`SKILL: **Mata Elang** membuatmu lebih lincah! Dodge meningkat!`, 'combat');
            playSound('heal'); return {};
        }
    },
    'ARCHER_ARROW_RAIN': {
        id: 'ARCHER_ARROW_RAIN', name: 'Hujan Panah', description: 'Menghujani area dengan panah, menghasilkan 250% ATK sebagai damage area.', category: 'nuke', priority: 7,
        cost: 40, cooldown: 20000, icon: 'fa-cloud-arrow-down',
        execute: (player, enemy) => {
            const { totalAtk: pAtk } = getPlayerTotalStats();
            const damage = Math.floor(pAtk * 2.5) - enemy.def;
            const finalDamage = damage > 0 ? damage : 1;
            enemy.hp -= finalDamage;
            logMessage(`SKILL: **Hujan Panah** menghantam ${enemy.name} sebesar **${finalDamage} DMG**!`, 'combat');
            playSound('Arrow'); return { damageDealt: finalDamage };
        }
    },

    // === PRIEST / HEALER PARTY REGEN ===
        'PRIEST_GROUP_REGEN': {
            id: 'PRIEST_GROUP_REGEN', name: 'Restorasi Kudus', description: 'Menyembuhkan seluruh anggota party segera lalu memberikan regenerasi HP selama beberapa detik.',
            cost: 30, cooldown: 20000, icon: 'fa-hand-holding-droplet', 
            category: 'heal', priority: 10,
            execute: (actor, enemy) => {
                const battleEnemy = enemy;
                // Bangun daftar target: pemain + semua rekan yang masih hidup
                const allTargets = [player].concat((playerParty || []).filter(a => a.hp > 0));

                let totalHealed = 0;
                // Skala penyembuhan berdasarkan stat Magic milik Healer (setiap poin magic = +1% heal)
                const magicStat = getSkillActorStats(actor).totalMagic || 0;
                const magicPct = magicStat * 0.01; // 1% per magic point

                // Penyembuhan instan: dasar 12% dari Max HP + bonus dari magic
                allTargets.forEach(t => {
                    // Ambil Max HP dengan benar: untuk pemain, gunakan fungsi total, untuk rekan, gunakan stat mereka
                    const maxHp = (t === player) ? getPlayerTotalStats().totalMaxHp : (t.maxHp || 0);
                    const healNow = Math.max(1, Math.floor(maxHp * (0.12 + magicPct)));
                    t.hp = Math.min(maxHp, (t.hp || 0) + healNow);
                    totalHealed += healNow;
                });

                // Regenerasi per detik: 4 tick, setiap 2.5 detik, sebesar 3% Max HP + bonus dari magic
                const ticks = 4; const interval = 2500;
                for (let i = 1; i <= ticks; i++) {
                    setTimeout(() => {
                        // Pengaman: Jangan jalankan regen jika pertempuran sudah selesai (mencegah lag/error)
                        if (!inBattle || currentEnemy !== battleEnemy || actor.hp <= 0 || (actor !== player && !playerParty.includes(actor))) return;

                        allTargets.forEach(t => {
                            if (t.hp <= 0 || (t !== player && !playerParty.includes(t))) return;
                            // Ambil Max HP dengan benar: untuk pemain, gunakan fungsi total, untuk rekan, gunakan stat mereka
                            const maxHp = (t === player) ? getPlayerTotalStats().totalMaxHp : (t.maxHp || 0);
                            const tickPct = 0.03 + (magicPct * 0.5);
                            const healTick = Math.max(1, Math.floor(maxHp * tickPct));
                            t.hp = Math.min(maxHp, (t.hp || 0) + healTick);
                            logMessage(`✨ ${actor.name || 'Rekan'} memulihkan **${healTick} HP** untuk ${t.name || 'Anda'}.`, 'combat');
                        });
                        syncTypedStatsFromActors();
                        saveGameData(true);
                        try { updateStats(); } catch(e){}
                    }, interval * i);
                }

                logMessage(`SKILL: **${actor.name || 'Rekan'}** menggunakan Restorasi Kudus, segera memulihkan party dan memberikan regen.`,'combat');
                try { showSkillNotification(`${actor.name || 'Rekan'}: Restorasi Kudus`); } catch(e){}
                try { playSound('heal'); } catch(e){}
                return { healed: totalHealed };
            }
        },

    // === ASSASSIN SKILLS ===
    'ASSASSIN_BACKSTAB': {
        id: 'ASSASSIN_BACKSTAB', name: 'Tusukan Belakang', description: 'Serangan mematikan dengan 50% peluang Critical, menghasilkan 200% ATK.',
        cost: 25, cooldown: 12000, icon: 'fa-dagger', category: 'damage', priority: 6,
        execute: (player, enemy) => {
            const { totalAtk: pAtk } = getSkillActorStats(player); let damage = Math.floor(pAtk * 2.0) - enemy.def;
            let isCrit = Math.random() < 0.50;
            if (isCrit) damage = Math.floor(damage * 1.5);
            const finalDamage = damage > 0 ? damage : 1;
            enemy.hp -= finalDamage;
            const critText = isCrit ? `🔥 **CRITICAL!** ` : ``;
            logMessage(`SKILL: ${critText}**Tusukan Belakang** menancap di ${enemy.name} sebesar **${finalDamage} DMG**!`, 'combat');
            playSound('assassin_hit'); return { damageDealt: finalDamage };
        }
    },
    'ASSASSIN_POISON_BLADE': {
        id: 'ASSASSIN_POISON_BLADE', name: 'Bilah Beracun', description: 'Mengolesi senjata dengan racun, menyebabkan damage tambahan selama 10 detik.',
        cost: 20, cooldown: 18000, icon: 'fa-skull-crossbones', 
        category: 'debuff_dot', priority: 9, // AI: Gunakan di awal pertarungan
        execute: (player, enemy) => {
            const { totalAtk: pAtk, totalMagic: pMagic } = getPlayerTotalStats();
            const initialDamage = Math.floor(pAtk * 0.5) - enemy.def; // Initial hit
            const poisonDamagePerTick = Math.floor(pAtk * 0.1); // 10% ATK per tick
            const duration = 10000; // 10 seconds
            const ticks = 5; // 5 ticks over 10 seconds (every 2 seconds)

            const finalInitialDamage = initialDamage > 0 ? initialDamage : 1;
            enemy.hp -= finalInitialDamage;

            if (!enemy.debuffs) enemy.debuffs = [];
            enemy.debuffs.push({
                type: 'poison',
                perTickDamage: poisonDamagePerTick,
                damage: poisonDamagePerTick,
                baseMultiplier: 0.10,
                source: { atk: pAtk, magic: pMagic, class: player.heroClass, level: player.level },
                duration: duration,
                createdAt: Date.now(),
                expiresAt: Date.now() + duration,
                tickInterval: Math.floor(duration / ticks),
                lastTick: Date.now()
            });

            logMessage(`SKILL: **Bilah Beracun** melukai ${enemy.name} sebesar **${finalInitialDamage} DMG** dan meracuninya!`, 'combat');
            playSound('assassin_hit'); return { damageDealt: finalInitialDamage };
        }
    },
    'ASSASSIN_SHADOW_CLOAK': {
        id: 'ASSASSIN_SHADOW_CLOAK', name: 'Jubah Bayangan', description: 'Menghilang ke dalam bayangan, meningkatkan Atk Speed sebesar 30% selama 10 detik.',
        cost: 30, cooldown: 25000, icon: 'fa-user-secret', 
        category: 'buff_aspd', priority: 8,
        execute: (player, enemy) => {
            if (!player.combatBuffs) player.combatBuffs = [];
            player.combatBuffs.push({ stat: 'aspd', value: 30, duration: 10000, expiresAt: Date.now() + 10000, source: 'ASSASSIN_SHADOW_CLOAK' });
            logMessage(`SKILL: Kamu menghilang ke dalam bayangan! Attack Speed meningkat!`, 'combat');
            playSound('heal'); return {};
        }
    },

    // === EVOLVED FIGHTER SKILLS ===
    'WARRIOR_SMASH': {
        id: 'WARRIOR_SMASH', name: 'Smash Sang Prajurit', description: 'Pukulan berat yang merobek pertahanan, 220% ATK.',
        cost: 20, cooldown: 10000, icon: 'fa-hammer', category: 'damage', priority: 6,
        execute: (player, enemy) => {
            const { totalAtk: pAtk } = getPlayerTotalStats();
            const damage = Math.floor(pAtk * 2.2) - enemy.def;
            const finalDamage = Math.max(1, damage);
            enemy.hp -= finalDamage;
            logMessage(`SKILL: **Smash Sang Prajurit** menghantam ${enemy.name} sebesar **${finalDamage} DMG**!`, 'combat');
            playSound('hit'); return { damageDealt: finalDamage };
        }
    },
    'BERSERKER_FRENZY': {
        id: 'BERSERKER_FRENZY', name: 'Kegilaan', description: 'Serangkaian serangan brutal selama beberapa detik.',
        cost: 40, cooldown: 25000, icon: 'fa-fire-flame-curved', category: 'nuke', priority: 7,
        execute: (player, enemy) => {
            const { totalAtk: pAtk } = getPlayerTotalStats();
            let totalDamage = 0;
            for (let i = 0; i < 4; i++) {
                const damage = Math.floor(pAtk * 0.85) - enemy.def;
                const finalDamage = Math.max(1, damage);
                enemy.hp -= finalDamage;
                totalDamage += finalDamage;
            }
            logMessage(`SKILL: **Kegilaan** mencabik ${enemy.name} sebanyak 4 kali sebesar **${totalDamage} DMG**!`, 'combat');
            playSound('hit'); return { damageDealt: totalDamage };
        }
    },

    // === EVOLVED MAGE SKILLS ===
    'SORCERER_FIRESTORM': {
        id: 'SORCERER_FIRESTORM', name: 'Badai Api', description: 'Serangan area sihir yang membakar banyak musuh.',
        cost: 35, cooldown: 20000, icon: 'fa-fire', category: 'debuff_dot', priority: 9,
        execute: (player, enemy) => {
            const { totalMagic: pMagic } = getPlayerTotalStats();
            const damage = Math.floor(pMagic * 2.4) - (enemy.magicDef || 0);
            const finalDamage = Math.max(1, damage);
            enemy.hp -= finalDamage;
            if (!enemy.debuffs) enemy.debuffs = [];
            enemy.debuffs.push({
                type: 'burn',
                perTickDamage: Math.max(1, Math.floor(pMagic * 0.15)),
                duration: 8000,
                createdAt: Date.now(),
                expiresAt: Date.now() + 8000,
                tickInterval: 2000,
                lastTick: Date.now()
            });
            logMessage(`SKILL: **Badai Api** membakar ${enemy.name} sebesar **${finalDamage} DMG**!`, 'combat');
            playSound('magic'); return { damageDealt: finalDamage };
        }
    },
    'ARCHMAGE_ARCANE': {
        id: 'ARCHMAGE_ARCANE', name: 'Arcane Mastery', description: 'Menguatkan semua sihirmu untuk beberapa menit.',
        cost: 60, cooldown: 40000, icon: 'fa-star', category: 'buff_matk', priority: 8,
        execute: (player, enemy) => {
            if (!player.combatBuffs) player.combatBuffs = [];
            const { totalMagic } = getPlayerTotalStats();
            const buffValue = Math.max(1, Math.floor(totalMagic * 0.5));
            const duration = 15000;
            player.combatBuffs.push({ stat: 'magic', value: buffValue, duration: duration, expiresAt: Date.now() + duration, source: 'ARCHMAGE_ARCANE' });
            logMessage(`SKILL: **Arcane Mastery** meningkatkan Magic DMG sebesar **${buffValue}** selama ${duration / 1000} detik!`, 'combat');
            playSound('heal'); return {};
        }
    },

    // === EVOLVED ARCHER SKILLS ===
    'RANGER_VOLLEY': {
        id: 'RANGER_VOLLEY', name: 'Balasan Panah', description: 'Melepaskan gelombang panah yang mengenai banyak target.',
        cost: 30, cooldown: 16000, icon: 'fa-bullseye', category: 'damage', priority: 6,
        execute: (player, enemy) => {
            const { totalAtk: pAtk } = getSkillActorStats(player);
            let totalDamage = 0;
            for (let i = 0; i < 3; i++) {
                const damage = Math.floor(pAtk * 0.9) - enemy.def;
                const finalDamage = Math.max(1, damage);
                enemy.hp -= finalDamage;
                totalDamage += finalDamage;
            }
            logMessage(`SKILL: **Balasan Panah** menghujani ${enemy.name} sebesar **${totalDamage} DMG**!`, 'combat');
            playSound('Arrow'); return { damageDealt: totalDamage };
        }
    },
    'MARKSMAN_SNIP': {
        id: 'MARKSMAN_SNIP', name: 'Tembakan Mematikan', description: 'Tembakan jarak jauh dengan damage sangat tinggi terhadap satu target.',
        cost: 45, cooldown: 25000, icon: 'fa-crosshairs', category: 'nuke', priority: 7,
        execute: (player, enemy) => {
            const { totalAtk: pAtk } = getPlayerTotalStats();
            let damage = Math.floor(pAtk * 3.5) - enemy.def;
            const isCrit = Math.random() < 0.35;
            if (isCrit) damage = Math.floor(damage * 1.5);
            const finalDamage = Math.max(1, damage);
            enemy.hp -= finalDamage;
            const critText = isCrit ? ` **CRITICAL!**` : ``;
            logMessage(`SKILL:${critText} **Tembakan Mematikan** menembus ${enemy.name} sebesar **${finalDamage} DMG**!`, 'combat');
            playSound('Arrow'); return { damageDealt: finalDamage };
        }
    },

    'SHADOW_STRIKE': {
        id: 'SHADOW_STRIKE', name: 'Tusukan Bayangan', description: 'Serangan dari kegelapan dengan peluang kritikal tinggi.',
        cost: 35, cooldown: 18000, icon: 'fa-mask', category: 'damage', priority: 6,
        execute: (player, enemy) => {
            const { totalAtk: pAtk } = getPlayerTotalStats();
            let damage = Math.floor(pAtk * 2.0) - enemy.def;
            let isCrit = Math.random() < 0.45; // 45% crit
            if (isCrit) damage = Math.floor(damage * 1.5);
            const finalDamage = damage > 0 ? damage : 1;
            enemy.hp -= finalDamage;
            const critText = isCrit ? `🔥 **CRITICAL!** ` : ``;
            logMessage(`SKILL: ${critText}**Tusukan Bayangan** menancap di ${enemy.name} sebesar **${finalDamage} DMG**!`, 'combat');
            playSound('assassin_hit'); return { damageDealt: finalDamage };
        }
    },
    'REAPER_EXECUTE': {
        id: 'REAPER_EXECUTE', name: 'Eksekusi Akhir', description: 'Serangan mematikan yang lebih kuat terhadap musuh yang terluka.',
        cost: 55, cooldown: 30000, icon: 'fa-skull', category: 'execute', priority: 10, // AI: Gunakan saat HP musuh rendah
        execute: (player, enemy) => {
            const { totalAtk: pAtk } = getPlayerTotalStats();
            const threshold = enemy.maxHp * 0.25;
            let damage;
            if (enemy.hp <= threshold) {
                damage = Math.floor(pAtk * 4.0) - enemy.def;
            } else {
                damage = Math.floor(pAtk * 2.2) - enemy.def;
            }
            const finalDamage = damage > 0 ? damage : 1;
            enemy.hp -= finalDamage;
            logMessage(`SKILL: **Eksekusi Akhir** menyerang ${enemy.name} sebesar **${finalDamage} DMG**!`, 'combat');
            playSound('assassin_hit'); return { damageDealt: finalDamage };
        }
    }
};

// Mapping from simple ally skill keys (used in Tavern) to full skillDatabase IDs
const allySkillToSkillDB = {
    // Map simple ally keys to the appropriate skill IDs
    'heal': 'PRIEST_GROUP_REGEN',
    'minor_heal': 'PRIEST_GROUP_REGEN',
    'regen': 'PRIEST_GROUP_REGEN',
    'smash': 'RANGER_VOLLEY',
    'taunt': 'ALLY_TAUNT',
    'buff_def': 'FIGHTER_DEFENSE_UP',
    'fireball': 'MAGE_FIREBALL',
    'backstab': 'ASSASSIN_BACKSTAB'
};

// =========================================================================
// 3.6 DATABASE ANGGOTA PARTY (ALLY)
// =========================================================================
const allyDatabase = GameAllyCatalog.allies;

// Minimal evolution definitions used at runtime to ensure evolved classes
// have exactly the skills defined for that evolution (typically 3 skills).
const runtimeEvolutionData = {
    'Fighter': [
        { name: 'Fighter', level: 0, label: 'Fighter', skills: [] },
        { name: 'Warrior', level: 20, label: 'Warrior', skills: ['WARRIOR_SMASH','FIGHTER_WHIRLWIND','FIGHTER_DEFENSE_UP'] },
        { name: 'Berserker', level: 45, label: 'Berserker', skills: ['BERSERKER_FRENZY','WARRIOR_SMASH','FIGHTER_BASH'] }
    ],
    'Mage': [
        { name: 'Mage', level: 0, label: 'Mage', skills: [] },
        { name: 'Sorcerer', level: 20, label: 'Sorcerer', skills: ['SORCERER_FIRESTORM','MAGE_METEOR','MAGE_HEAL'] },
        { name: 'Archmage', level: 45, label: 'Archmage', skills: ['ARCHMAGE_ARCANE','MAGE_METEOR','MAGE_FIREBALL'] }
    ],
    'Archer': [
        { name: 'Archer', level: 0, label: 'Archer', skills: [] },
        { name: 'Ranger', level: 20, label: 'Ranger', skills: ['RANGER_VOLLEY','ARCHER_ARROW_RAIN','ARCHER_MULTI_SHOT'] },
        { name: 'Marksman', level: 45, label: 'Marksman', skills: ['MARKSMAN_SNIP','ARCHER_ARROW_RAIN','ARCHER_SHARP_EYE'] }
    ],
    'Assassin': [
        { name: 'Assassin', level: 0, label: 'Assassin', skills: [] },
        { name: 'Shadow', level: 20, label: 'Shadow', skills: ['SHADOW_STRIKE','ASSASSIN_POISON_BLADE','ASSASSIN_SHADOW_CLOAK'] },
        { name: 'Reaper', level: 45, label: 'Reaper', skills: ['REAPER_EXECUTE','ASSASSIN_BACKSTAB','SHADOW_STRIKE'] }
    ]
};

const SKILL_POINT_LEVELS = new Set([5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100]);

function getAllowedSkillIdsForBaseClass(baseClass) {
    if (!baseClass || !runtimeEvolutionData[baseClass]) return [];
    const ids = new Set();
    runtimeEvolutionData[baseClass].forEach(node => {
        if (Array.isArray(node.skills)) node.skills.forEach(id => ids.add(id));
    });
    return Array.from(ids);
}

function isSkillAllowedForPlayer(skillId) {
    if (!skillId || !player) return false;
    const base = getPlayerEffectiveBaseClass();
    const allowedIds = getAllowedSkillIdsForBaseClass(base);
    return allowedIds.indexOf(skillId) !== -1;
}

function syncPlayerEvolutionSkills() {
    try {
        if (!player || !player.heroClass) return;
        const base = getPlayerEffectiveBaseClass();
        const path = runtimeEvolutionData[base];
        if (!path) return;

        if (!Array.isArray(player.skills)) player.skills = [];
        const existingSkillIds = new Set(player.skills.map(s => s.id));

        const node = path.find(p => p.name === player.heroClass);
        if (node && Array.isArray(node.skills)) {
            node.skills.forEach(id => {
                if (!existingSkillIds.has(id)) {
                    player.skills.push({ id: id, rank: 1, readyAt: 0 });
                    existingSkillIds.add(id);
                }
            });
        }

        try { console.log('DEBUG: syncPlayerEvolutionSkills -> final player.skills', player.skills); } catch (e) {}
        saveGameData();
    } catch (e) { console.warn('syncPlayerEvolutionSkills error', e); }
}


let inBattle = false;
let isAutoPlaying = false; 
let currentEnemy = null;
let isDefeatHandled = false; // Flag untuk mencegah pemanggilan ganda saat monster kalah
// When true, skill execution is running — restrict sounds to only 'hit' and 'heal'
let inSkillExecution = false;
let suppressSkillSound = false; // when true, `playSound` will ignore skill-related sounds
let isAfkMode = false;
let isAfkResumeRequired = false;
let afkOverlayEl = null;
let afkSummary = {
    active: false,
    startedAt: 0,
    enemiesKilled: 0,
    goldEarned: 0,
    expEarned: 0,
    potionsUsed: 0,
    manaPotionsUsed: 0,
    skillsUsed: 0,
    messages: []
};
let autoTimeoutId = null;  
let afkActivationTimeout = null;
let isGameStarted = false; // Status baru untuk melacak apakah petualangan sudah dimulai
let offlineSuspended = false;
let offlineSettling = false;
let playerParty = []; // Menyimpan data ally yang aktif dalam pertarungan
// Track last attack source class so generic 'hit' sound can map correctly
let lastAttackSourceClass = null;

function resetAfkSummary() {
    afkSummary.active = false;
    afkSummary.startedAt = 0;
    afkSummary.enemiesKilled = 0;
    afkSummary.goldEarned = 0;
    afkSummary.expEarned = 0;
    afkSummary.potionsUsed = 0;
    afkSummary.manaPotionsUsed = 0;
    afkSummary.skillsUsed = 0;
    afkSummary.messages = [];
}

function addAfkSummaryEvent(text) {
    if (!afkSummary.active || !text) return;
    afkSummary.messages.push(text);
    if (afkSummary.messages.length > 6) afkSummary.messages.shift();
}

let lastPlayerAttackAt = 0;
let attackCooldownTimer = null;
// Interval/timeout IDs that must be cleared to avoid memory leaks
let autoSaveIntervalId = null;
let manaRegenIntervalId = null;
let debuffTickIntervalId = null;

function stopBattleTimers() {
    if (autoTimeoutId) { clearTimeout(autoTimeoutId); autoTimeoutId = null; }
    if (attackCooldownTimer) { clearTimeout(attackCooldownTimer); attackCooldownTimer = null; }
}

function cleanupGameTimers() {
    try {
        if (autoSaveIntervalId) { clearInterval(autoSaveIntervalId); autoSaveIntervalId = null; }
        if (manaRegenIntervalId) { clearInterval(manaRegenIntervalId); manaRegenIntervalId = null; }
        if (debuffTickIntervalId) { clearInterval(debuffTickIntervalId); debuffTickIntervalId = null; }
        if (autoTimeoutId) { clearTimeout(autoTimeoutId); autoTimeoutId = null; }
        if (attackCooldownTimer) { clearTimeout(attackCooldownTimer); attackCooldownTimer = null; }
        if (afkActivationTimeout) { clearTimeout(afkActivationTimeout); afkActivationTimeout = null; }
    } catch (e) { console.warn('cleanupGameTimers error', e); }
}

window.addEventListener('pagehide', () => {
    try { if (GameStorage.ready && !offlineSuspended && !offlineSettling) saveGameData(true); } finally { cleanupGameTimers(); }
});

// =========================================================================
// TypedArray Hybrid Buffer (Numeric Masif):
// 0 = Player, 1..3 = Ally Aktif (maks 3)
// Slot kosong/KO => HP=0.
// =========================================================================
const TA_ACTOR_MAX = 4;
const TA_IDX_PLAYER = 0;
const TA_IDX_ALLY_START = 1;
const TA_IDX_ALLY_MAX = 3;

// HP & MaxHP
const taHp = new Int32Array(TA_ACTOR_MAX);
const taMaxHp = new Int32Array(TA_ACTOR_MAX);
// Mana (player uses) + enemy mana not needed currently
const taMana = new Int32Array(TA_ACTOR_MAX);
const taMaxMana = new Int32Array(TA_ACTOR_MAX);
// Attack/Defense/Dodge/Magic/AtkSpeed/Level (inti hitungan)
const taAtk = new Int32Array(TA_ACTOR_MAX);
const taDef = new Int32Array(TA_ACTOR_MAX);
const taDodge = new Int32Array(TA_ACTOR_MAX);
const taMagic = new Int32Array(TA_ACTOR_MAX);
const taAtkSpeed = new Int32Array(TA_ACTOR_MAX);
const taLevel = new Int32Array(TA_ACTOR_MAX);

function syncTypedStatsFromActors() {
    // Player (idx 0)
    if (player) {
        taHp[TA_IDX_PLAYER] = Math.max(0, player.hp | 0);
        const { totalMaxHp, totalAtk, totalDef, totalDodge, totalMagic, totalAspd } = getPlayerTotalStats();
        taMaxHp[TA_IDX_PLAYER] = Math.max(0, totalMaxHp | 0);
        taMana[TA_IDX_PLAYER] = Math.max(0, (player.mana || 0) | 0);
        taMaxMana[TA_IDX_PLAYER] = Math.max(0, (player.maxMana || 0) | 0);
        taAtk[TA_IDX_PLAYER] = Math.max(0, totalAtk | 0);
        taDef[TA_IDX_PLAYER] = Math.max(0, totalDef | 0);
        taDodge[TA_IDX_PLAYER] = Math.max(0, totalDodge | 0);
        taMagic[TA_IDX_PLAYER] = Math.max(0, totalMagic | 0);
        taAtkSpeed[TA_IDX_PLAYER] = Math.max(0, totalAspd | 0);
        taLevel[TA_IDX_PLAYER] = Math.max(0, (player.level || 0) | 0);
    } else {
        taHp[TA_IDX_PLAYER] = 0; taMaxHp[TA_IDX_PLAYER] = 0; taMana[TA_IDX_PLAYER] = 0; taMaxMana[TA_IDX_PLAYER] = 0;
        taAtk[TA_IDX_PLAYER] = 0; taDef[TA_IDX_PLAYER] = 0; taDodge[TA_IDX_PLAYER] = 0; taMagic[TA_IDX_PLAYER] = 0;
        taAtkSpeed[TA_IDX_PLAYER] = 0; taLevel[TA_IDX_PLAYER] = 0;
    }

    // Allies (idx 1..3)
    for (let i = 0; i < TA_ACTOR_MAX; i++) {
        // reset default numeric slots for allies beyond current list
        if (i !== TA_IDX_PLAYER) {
            taHp[i] = 0; taMaxHp[i] = 0; taMana[i] = 0; taMaxMana[i] = 0;
            taAtk[i] = 0; taDef[i] = 0; taDodge[i] = 0; taMagic[i] = 0;
            taAtkSpeed[i] = 0; taLevel[i] = 0;
        }
    }

    if (Array.isArray(playerParty)) {
        for (let allySlot = 0; allySlot < Math.min(3, playerParty.length); allySlot++) {
            const actorIdx = TA_IDX_ALLY_START + allySlot;
            const a = playerParty[allySlot];

            if (!a || (a.hp | 0) <= 0) {
                taHp[actorIdx] = 0;
                continue;
            }
            const maxHp = a.maxHp || a.hp || 0;
            taHp[actorIdx] = Math.max(0, a.hp | 0);
            taMaxHp[actorIdx] = Math.max(0, maxHp | 0);
            taMana[actorIdx] = Math.max(0, (a.mana || 0) | 0);
            taMaxMana[actorIdx] = Math.max(0, (a.maxMana || 0) | 0);

            const allyStats = getAllyCombatStats(a);
            taAtk[actorIdx] = Math.max(0, allyStats.atk | 0);
            taDef[actorIdx] = Math.max(0, allyStats.def | 0);
            taDodge[actorIdx] = Math.max(0, allyStats.dodge | 0);
            taMagic[actorIdx] = Math.max(0, allyStats.magic | 0);
            taAtkSpeed[actorIdx] = Math.max(0, allyStats.aspd | 0);
            taLevel[actorIdx] = Math.max(0, (a.level || 0) | 0);
        }
    }
}

function applyDamageToActor(actorIdx, dmg) {
    if (actorIdx < 0 || actorIdx >= TA_ACTOR_MAX) return;

    const ndmg = Math.max(0, dmg | 0);
    if (ndmg === 0) return;
    taHp[actorIdx] = Math.max(0, taHp[actorIdx] - ndmg);

    if (actorIdx === TA_IDX_PLAYER) {
        if (player) player.hp = taHp[actorIdx];
    } else {
        const allySlot = actorIdx - TA_IDX_ALLY_START;
        const a = playerParty && playerParty[allySlot];
        if (a) a.hp = taHp[actorIdx];
    }
}

function applyHealToActor(actorIdx, heal) {
    const nheal = Math.max(0, heal | 0);
    if (nheal === 0) return;
    const maxHp = taMaxHp[actorIdx];
    taHp[actorIdx] = Math.min(maxHp, taHp[actorIdx] + nheal);

    if (actorIdx === TA_IDX_PLAYER) {
        if (player) player.hp = taHp[actorIdx];
    } else {
        const allySlot = actorIdx - TA_IDX_ALLY_START;
        const a = playerParty && playerParty[allySlot];
        if (a) a.hp = taHp[actorIdx];
    }
}


function getBaseHeroClass(heroClass = player?.heroClass) {
    const normalizedClass = (heroClass || 'Warga').toString().trim().toLowerCase();
    const baseClassMap = {
        warga: 'Warga',
        fighter: 'Fighter', warrior: 'Fighter', berserker: 'Fighter',
        mage: 'Mage', sorcerer: 'Mage', archmage: 'Mage',
        archer: 'Archer', ranger: 'Archer', marksman: 'Archer',
        assassin: 'Assassin', shadow: 'Assassin', reaper: 'Assassin'
    };

    return baseClassMap[normalizedClass] || 'Warga';
}

function getPlayerEffectiveBaseClass() {
    if (!player) return 'Warga';
    const correctBase = getBaseHeroClass(player.heroClass);
    if (player.baseClass !== correctBase) {
        player.baseClass = correctBase;
    }
    return correctBase;
}

function getPlayerTotalStats() {
    const eq = getStatsFromEquipment();
    const combat = getCombatBuffs();
    const store = checkActiveBuffs();
    const party = getPartySupportBonus(); // is zero, but keep for structure

    const totalAtk = player.baseAttack + eq.bonusAtk + combat.atk + store.atk + party.atk;
    const totalDef = player.baseDefense + eq.bonusDef + combat.def + store.def + party.def;
    const totalDodge = player.baseDodge + eq.bonusDodge + combat.dodge + store.dodge;
    const totalMagic = (player.magicDamage || 0) + eq.bonusMagicDamage + combat.magic + store.magic + party.magic;
    const totalAspd = GameBossMechanics.speed(player, (player.attackSpeed || 10) + eq.bonusAttackSpeed + combat.aspd + store.aspd, Date.now(), player.settings?.debuffsEnabled !== false);
    const totalMaxHp = player.maxHp + eq.bonusMaxHp + combat.maxHp + party.maxHp;

    return { totalAtk, totalDef, totalDodge, totalMagic, totalAspd, totalMaxHp, storeBuffs: store };
}

function getAttackDelayMs(atkSpeed) {
    const baseDelay = 1600;
    return Math.max(250, Math.round(baseDelay / (1 + (atkSpeed / 100))));
}
// =========================================================================
// 4. SISTEM AUDIO GIM (KINI DENGAN SUARA SIHIR / MAGIC MP3 FIX & ANTI-BOCOR)
// =========================================================================

// Variabel penyimpan waktu untuk mencegah suara bocor/bertumpuk (Taruh di luar fungsi)
const soundThrottle = {};

const soundMap = {
    'levelup': { file: "../Sound/Level_Up.mp3", vol: 0.3 },
    'potion': { file: "../Sound/Potion.mp3", vol: 0.3 },
    'potion_mana': { file: "../Sound/Potion.mp3", vol: 0.3 }
};

function playSound(type) {
    // Attack/cast/impact audio follows Battle presentation, not legacy skill callbacks.
    if(!['potion','potion_mana','heal','levelup','buy','error'].includes(type))return;
    // Abaikan suara jika tab disembunyikan atau sedang AFK
    if (document.hidden || (typeof isAfkMode !== 'undefined' && isAfkMode) || (typeof isAfkResumeRequired !== 'undefined' && isAfkResumeRequired)) return;
    
    // Abaikan efek suara serangan biasa saat skill sedang berjalan (kecuali potion)
    if (((typeof inSkillExecution !== 'undefined' && inSkillExecution) || (typeof suppressSkillSound !== 'undefined' && suppressSkillSound)) && type !== 'potion' && type !== 'potion_mana') return;

    // --- SISTEM ANTI-BOCOR (THROTTLE) ---
    // Memberikan jeda 150ms agar suara yang sama tidak dimainkan puluhan kali dalam satu kedipan mata
    const now = Date.now();
    if (soundThrottle[type] && (now - soundThrottle[type] < 150)) {
        return; 
    }
    soundThrottle[type] = now;

    try {
        let soundConfig;

        soundConfig = soundMap[type];

        if (soundConfig && soundConfig.file) {
            GameAudio.play(soundConfig.file, soundConfig.vol ?? 0.3);
        }else GameAudio.tone(type);
    } catch (e) { 
        console.log("File Audio belum tersedia/gagal memuat: ", e); 
    }
}

// =========================================================================
// 5. PENYIMPANAN DATA GAME (LOCAL STORAGE & AUTO PATCH)
// =========================================================================
function loadGameData() {
    const savedPlayer = GameStorage.getItem('rpg_player');
    const savedItems = GameStorage.getItem('rpg_items');
    
    if (savedPlayer) {
        player = JSON.parse(savedPlayer);
        
        if (player.name === undefined || player.name === "Ksatria Pemula") {
            player.name = player.username || player.playerName || "Ksatria Pemula";
        }
        if (player.maxExp === undefined) player.maxExp = 100;
        if (player.statPoints === undefined) player.statPoints = 0;
        if (player.magicDamage === undefined) player.magicDamage = 0;
        if (player.skillPoints === undefined) player.skillPoints = 0; // Patch poin skill
        if (player.attackSpeed === undefined) player.attackSpeed = 10;
        if (player.heroClass === undefined) player.heroClass = "Warga";
        if (player.baseClass === undefined) player.baseClass = getBaseHeroClass(player.heroClass);
        if (player.level === undefined) player.level = 1;
        // Karakter tetap Warga sampai pemain memilih kelas dari menu hero; level hanya membuka prompt, bukan auto-pilih.


        // NEW PATCHES FOR SKILLS & MANA
        if (!player.items) player.items = [];
        if (player.weapons) { // Patch for old save data
            player.items = [...player.items, ...player.weapons];
            delete player.weapons;
        }
        if (player.mana === undefined) player.mana = player.maxMana;
        if (player.manaPotions === undefined) player.manaPotions = 0;
        if (!Array.isArray(player.skills)) player.skills = [];
        if (!Array.isArray(player.combatBuffs)) player.combatBuffs = []; // For temporary buffs
        if (!Array.isArray(player.party)) player.party = []; // Array of ally IDs
        if (!player.party) player.party = [];
        if (!Array.isArray(player.activeParty)) player.activeParty = []; // Array of ally IDs aktif untuk pertarungan
        if (!player.allies || typeof player.allies !== 'object') player.allies = {};
        if (!Array.isArray(player.debuffs)) player.debuffs = [];

        Object.keys(player.allies).forEach(allyId => {
            const inst = player.allies[allyId] || {};
            inst.level = Math.max(1, inst.level || 1);
            inst.xp = Math.max(0, inst.xp || 0);
            inst.maxExp = Math.max(100, inst.maxExp || 100);
            inst.statPoints = Math.max(0, inst.statPoints || 0);
            if (!Array.isArray(inst.skills)) inst.skills = inst.skills ? [inst.skills] : [];
            inst.stats = Object.assign({ hpBonus: 0, atkBonus: 0, defBonus: 0, magicBonus: 0, dodgeBonus: 0, aspdBonus: 0, maxManaBonus: GameAllyCatalog.classDefaults(allyDatabase[allyId]?.class).stats.maxManaBonus || 0 }, inst.stats || {});
            player.allies[allyId] = inst;
        });

        if (!player.settings) player.settings = {};
        if (player.settings.debuffsEnabled === undefined) player.settings.debuffsEnabled = true;

        if (!player.equipment) player.equipment = {};

        // Migration from old keys (weapon, armor, etc.) to new keys (senjata, zirah, etc.)
        const keyMap = {
            weapon: 'senjata', armor: 'zirah', boots: 'sepatu', helmet: 'helm'
        };
        const statMap = {
            bonusAtk: { type: 'atk' }, bonusDef: { type: 'def' }, bonusDodge: { type: 'dodge' }, bonusHp: { type: 'maxHp' }
        };

        Object.keys(keyMap).forEach(oldKey => {
            if (player.equipment[oldKey]) {
                const newKey = keyMap[oldKey];
                const oldItem = player.equipment[oldKey];
                // Canonical equipment is authoritative when both save formats exist.
                if (player.equipment[newKey]) {
                    delete player.equipment[oldKey];
                    return;
                }
                
                // Only migrate if it's not already in the new format
                if (oldItem && !oldItem.statType) {
                    const statKey = Object.keys(oldItem).find(k => k.startsWith('bonus'));
                    player.equipment[newKey] = {
                        name: oldItem.name,
                        statType: statMap[statKey]?.type || 'atk',
                        statValue: oldItem[statKey] || 0
                    };
                } else {
                    // It's already new format, just move it
                    player.equipment[newKey] = oldItem;
                }
                delete player.equipment[oldKey];
            }
        });

        if (!player.inventory) player.inventory = {};
        if (!player.equipment.senjata) player.equipment.senjata = { name: player.heroClass==='Warga'?'Pisau Kecil':"Tangan Kosong", statType: 'atk', statValue: 0 };
        if(player.heroClass==='Warga'&&player.equipment.senjata.name==='Tangan Kosong'&&player.equipment.senjata.statValue===0)player.equipment.senjata.name='Pisau Kecil';
        if (!player.equipment.zirah) player.equipment.zirah = { name: "Pakaian Kain", statType: 'def', statValue: 0 };
        if (!player.equipment.sepatu) player.equipment.sepatu = { name: "Sandal Usang", statType: 'dodge', statValue: 0 };
        if (!player.equipment.helm) player.equipment.helm = { name: "Tanpa Pelindung", statType: 'def', statValue: 0 };
        if (!player.equipment.amulet) player.equipment.amulet = { name: "Tanpa Amulet", statType: 'maxHp', statValue: 0 };
        if (!player.equipment.sarung_tangan) player.equipment.sarung_tangan = null;
        if (!player.equipment.offhand) player.equipment.offhand = null;
        if (player.potionThreshold === undefined) player.potionThreshold = 35;
        if (!Array.isArray(player.quests)) player.quests = [];
        if (!player.killCounts) player.killCounts = {};
        if (!player.questCounters || typeof player.questCounters !== 'object') player.questCounters = {};
    }
    if (savedItems) purchasedItems = JSON.parse(savedItems);
}

// Debounce/Throttle saveGameData: maks 1x setiap 30 detik.
// Tujuan: mencegah save berulang saat emas bertambah/monster mati.
let __lastSaveAt = 0;
const __SAVE_MIN_INTERVAL_MS = 30000;
function saveGameData(force = false) {
    if (offlineSuspended || offlineSettling) return;
    if (typeof GameAdventures !== 'undefined' && GameAdventures.inTransaction) return;
    syncPartyHealth();
    const now = Date.now();
    if (!force && (now - __lastSaveAt) < __SAVE_MIN_INTERVAL_MS) return;
    GameAchievements.observe(player);
    const eq = getStatsFromEquipment();
    const party = [...new Set(player.activeParty || [])].filter(id => player.party.includes(id) && allyDatabase[id] && player.allies[id]?.active !== false)
        .slice(0, 3).map(id => {
            const stats = GameAllyCatalog.statsFor(allyDatabase[id], player.allies[id]);
            return { id, hp: stats.hp, atk: stats.attack, def: stats.def, magic: stats.magic, dodge: stats.dodge, aspd: stats.aspd };
        });
    player.offlineProgress = GameOffline.snapshot(player, {
        now, active: isAutoPlaying && isGameStarted && !currentEnemy?.dungeonToken && !currentEnemy?.name.includes('BOSS'), stage: currentEnemy?.stage,
        stats: { atk: player.baseAttack + eq.bonusAtk, def: player.baseDefense + eq.bonusDef,
            magic: player.magicDamage + eq.bonusMagicDamage, dodge: player.baseDodge + eq.bonusDodge,
            aspd: player.attackSpeed + eq.bonusAttackSpeed, maxHp: player.maxHp + eq.bonusMaxHp }, party
    });
    player = GameStorage.savePlayer(player, { rpg_items: JSON.stringify(purchasedItems) });
    __lastSaveAt = now;
}



loadGameData(); 
initializeQuestSystem();
// Ensure player's skills reflect their current evolution (grant the evolution's skills)
try { syncPlayerEvolutionSkills(); } catch(e) { console.warn('Failed to sync evolution skills', e); }

// =========================================================================
// 6. FORMULA PERHITUNGAN TOTAL STATUS (STAT COMBINATIONS & BUFFS)
// =========================================================================
function checkActiveBuffs() {
    let buffs = { atk: 0, def: 0, magic: 0, aspd: 0, dodge: 0 };
    let now = Date.now();


    let atkExpire = GameStorage.getItem('buff_atk');
    if (atkExpire && now < parseInt(atkExpire)) buffs.atk += 20;
    else if (atkExpire) GameStorage.removeItem('buff_atk');

    let defExpire = GameStorage.getItem('buff_def');
    if (defExpire && now < parseInt(defExpire)) buffs.def += 25;
    else if (defExpire) GameStorage.removeItem('buff_def');

    let magicExpire = GameStorage.getItem('buff_magic');
    if (magicExpire && now < parseInt(magicExpire)) buffs.magic += 20;
    else if (magicExpire) GameStorage.removeItem('buff_magic');

    let aspdExpire = GameStorage.getItem('buff_aspd');
    if (aspdExpire && now < parseInt(aspdExpire)) buffs.aspd += 15;
    else if (aspdExpire) GameStorage.removeItem('buff_aspd');

    let dodgeExpire = GameStorage.getItem('buff_dodge');
    if (dodgeExpire && now < parseInt(dodgeExpire)) buffs.dodge += 15;
    else if (dodgeExpire) GameStorage.removeItem('buff_dodge');

    return buffs;
}

function getStatsFromEquipment() {
    const equipmentStats = {
        bonusAtk: 0, bonusDef: 0, bonusDodge: 0, bonusMaxHp: 0,
        bonusMagicDamage: 0, bonusAttackSpeed: 0, bonusMaxMana: 0
    };

    if (!player.equipment) return equipmentStats;

    for (const slot in player.equipment) {
        const item = player.equipment[slot];
        if (GameCore.isRetiredAccessory(item, slot)) continue;
        if (item && item.statType && typeof item.statValue === 'number') {
            switch (item.statType) {
                case 'atk':
                case 'attack':
                    equipmentStats.bonusAtk += item.statValue;
                    break;
                case 'def':
                case 'defense':
                    equipmentStats.bonusDef += item.statValue;
                    break;
                case 'dodge':
                    equipmentStats.bonusDodge += item.statValue;
                    break;
                case 'maxHp':
                case 'hp':
                    equipmentStats.bonusMaxHp += item.statValue;
                    break;
                case 'magicDamage':
                case 'matk':
                    equipmentStats.bonusMagicDamage += item.statValue;
                    break;
                case 'attackSpeed':
                case 'aspd':
                    equipmentStats.bonusAttackSpeed += item.statValue;
                    break;
                case 'maxMana':
                case 'mana':
                case 'maxmp':
                    equipmentStats.bonusMaxMana += item.statValue;
                    break;
            }
        }
    }
    const setBonuses = GameEquipmentSets.bonuses(player);
    for (const [stat, value] of Object.entries(setBonuses)) equipmentStats[stat] += value;
    return equipmentStats;
}

function getCombatBuffs() {
    // If player disabled buffs/debuffs globally, ignore combat buffs
    if (player.settings && player.settings.debuffsEnabled === false) {
        return { atk: 0, def: 0, magic: 0, aspd: 0, dodge: 0, maxHp: 0 };
    }

    let tempBuffs = { atk: 0, def: 0, magic: 0, aspd: 0, dodge: 0, maxHp: 0 };
    if (!player.combatBuffs) return tempBuffs;

    const now = Date.now();
    // Filter out expired buffs
    player.combatBuffs = player.combatBuffs.filter(b => b.expiresAt > now);

    // Apply active buffs
    player.combatBuffs.forEach(b => {
        if (tempBuffs[b.stat] !== undefined) {
            tempBuffs[b.stat] += b.value;
        }
    });
    return tempBuffs;
}

function getActivePartyStats() {
    if (!Array.isArray(playerParty) || playerParty.length === 0) {
        return { attack: 0, def: 0, magic: 0, maxHp: 0, dodge: 0, aspd: 0 };
    }
    return playerParty.reduce((tot, ally) => {
        tot.attack += (ally.attack || 0);
        tot.def += (ally.def || 0);
        tot.magic += (ally.magic || 0);
        tot.maxHp += (ally.maxHp || 0);
        tot.dodge += (ally.dodge || 0);
        tot.aspd += (ally.aspd || 0);
        return tot;
    }, { attack: 0, def: 0, magic: 0, maxHp: 0, dodge: 0, aspd: 0 });
}

function getPartySupportBonus() {
    // Bonus party support dihapus - stat pemain dan party rekrut terpisah
    return {
        atk: 0,
        def: 0,
        magic: 0,
        maxHp: 0
    };
}

function getTavernReputationBonus() {
    if (!player || typeof player.questReputationLevel !== 'number') {
        return { goldMultiplier: 1.0, expMultiplier: 1.0 };
    }
    const repLevel = player.questReputationLevel || 1;
    // Setiap level reputasi memberikan bonus 1.5% Gold dan 1% EXP.
    // Bonus dibatasi pada level 10 reputasi (maks 15% Gold, 10% EXP).
    const goldBonusPercent = Math.min(0.15, (repLevel - 1) * 0.015);
    const expBonusPercent = Math.min(0.10, (repLevel - 1) * 0.01);
    return {
        goldMultiplier: 1.0 + goldBonusPercent,
        expMultiplier: 1.0 + expBonusPercent
    };
}

function getAttackCooldownRemainingMs() {
    if (!lastPlayerAttackAt) return 0;
    const { totalAspd } = getPlayerTotalStats();
    return Math.max(0, (lastPlayerAttackAt + getAttackDelayMs(totalAspd)) - Date.now());
}

// =========================================================================
// 7. SINKRONISASI GRAFIS DAN RENDER LAYAR (UI REFRESH SYSTEM)
// =========================================================================

function updateStatUIWithBuff(element, value, buffValue, valueKey) {
    if (!element) return;
    if (buffValue > 0) {
        const html = `${value} <span style="color:#f1c40f; font-size:12px; margin-left:5px;">(Buff!)</span>`;
        setHtmlIfChanged(element, valueKey, html);
    } else {
        setTextIfChanged(element, valueKey, value);
    }
}

function updateStats() {
    if (typeof GameAdventures !== 'undefined' && GameAdventures.inTransaction) return;
    if (document.hidden || (isAfkMode && isAfkResumeRequired)) return;
    syncBattleNavigation();
    globalThis.BattleVisuals?.sync({ active: isGameStarted && inBattle && player.hp > 0,
        session: isGameStarted && player.hp > 0, job: getBaseHeroClass(player.heroClass), target: currentEnemy });
    // Saat pemain sedang berada di menu Monster melawan Raja Slime,
    // matikan total pembaruan teks/status untuk menu Toko/Inventory/Crafting.
    // (Konteks: Raja Slime Stage = `forest`, monster name mengandung `Raja Slime`)
    try {
        // Legacy: Previously code skipped all UI updates when fighting 'Raja Slime'
        // which caused the enemy image/hp bar to remain stale (showing previous monster).
        // Remove the early return so boss fights update UI normally.
        // Keep this try/catch to avoid breaking if currentEnemy is undefined.
        const isRajaSlime = !!(currentEnemy && currentEnemy.name && String(currentEnemy.name).includes('Raja Slime'));
        if (isRajaSlime) {
            // Intentionally do not return here — allow UI updates for boss encounters.
        }
    } catch (e) {}

    setTextIfChanged(elPlayerName, 'playerName', player.name || "Ksatria Pemula");

    setTextIfChanged(elPlayerClass, 'playerClass', player.heroClass || "Fighter");

    // Avatar wiring: use class-based avatar image or icon placeholder
    if (elAvatarImg) {
        const avatarMap = {
            'Warga': wargaPortraitSource,
            'Fighter': '../Avatar/fighter.png',
            'Mage': '../Avatar/mage.png',
            'Archer': '../Avatar/archer.png',
            'Assassin': '../Avatar/assassin.png'
        };
        const avatarKey = getBaseHeroClass(player.heroClass);
        if(elAvatarImg.dataset.avatarJob!==avatarKey)elAvatarImg.dataset.avatarJob=avatarKey;
        const src = avatarMap[avatarKey] || '';
        if (avatarKey === 'Warga') {
            if (wargaPortraitMissing) { elAvatarImg.style.display='none';if(elAvatarIcon)elAvatarIcon.style.display='flex'; }
            else if(elAvatarImg.getAttribute('src')!==src){
                elAvatarImg.style.display='none';if(elAvatarIcon)elAvatarIcon.style.display='flex';
                elAvatarImg.onload=()=>{if(getBaseHeroClass(player.heroClass)==='Warga'){elAvatarImg.style.display='block';if(elAvatarIcon)elAvatarIcon.style.display='none';}};
                elAvatarImg.onerror=()=>{
                    if(wargaPortraitSource.endsWith('/portrait.png')){wargaPortraitSource='../assets/characters/warga/petualang_desa_dengan_pedang_pendek.png';elAvatarImg.src=wargaPortraitSource;return;}
                    if(wargaPortraitSource.endsWith('/petualang_desa_dengan_pedang_pendek.png')){wargaPortraitSource='../assets/characters/warga/warga-idle.png';elAvatarImg.src=wargaPortraitSource;return;}
                    if(wargaPortraitSource.endsWith('/warga-idle.png')){wargaPortraitSource='../assets/characters/warga/warga-pria-idle.png';elAvatarImg.src=wargaPortraitSource;return;}
                    wargaPortraitMissing=true;elAvatarImg.style.display='none';if(elAvatarIcon)elAvatarIcon.style.display='flex';
                };
                elAvatarImg.src=src;
            }
        } else if (src) {
            player._avatarMissing = player._avatarMissing || {};
            if (player._avatarMissing[avatarKey]) {
                elAvatarImg.style.display = 'none'; if (elAvatarIcon) elAvatarIcon.style.display = 'flex';
            } else {
                elAvatarImg.onerror = function() { try { player._avatarMissing = player._avatarMissing || {}; player._avatarMissing[avatarKey] = true; elAvatarImg.style.display = 'none'; elAvatarImg.src = ''; if (elAvatarIcon) elAvatarIcon.style.display = 'flex'; elAvatarImg.onerror = null; } catch(e){} };
                if (elAvatarImg.getAttribute('src') !== src) elAvatarImg.src = src;
                elAvatarImg.style.display = 'block';
                if (elAvatarIcon) elAvatarIcon.style.display = 'none';
            }
        } else {
            elAvatarImg.style.display = 'none';
            if (elAvatarIcon) elAvatarIcon.style.display = 'flex';
        }
    }

    const { totalMaxHp, totalAtk, totalDef, totalMagic, totalAspd, totalDodge, storeBuffs } = getPlayerTotalStats();

    // Minimal DOM updates: only write when values actually change.
    setTextIfChanged(elHp, 'hp', player.hp);
    setTextIfChanged(elMaxHp, 'maxHp', totalMaxHp);
    const hpPct = `${Math.max(0, Math.min(100, (player.hp / totalMaxHp) * 100))}%`;
    setWidthIfChanged(hpBar, 'hpPercent', hpPct);

    setTextIfChanged(elMana, 'mana', player.mana);
    setTextIfChanged(elMaxMana, 'maxMana', player.maxMana);
    const manaPct = `${Math.max(0, Math.min(100, (player.mana / player.maxMana) * 100))}%`;
    setWidthIfChanged(manaBar, 'manaPercent', manaPct);

    setTextIfChanged(elLevel, 'level', player.level);
    setTextIfChanged(elGold, 'gold', player.gold);

    setTextIfChanged(elExp, 'exp', player.exp);
    setTextIfChanged(elMaxExp, 'maxExp', player.maxExp);
    const expPct = `${Math.max(0, Math.min(100, (player.exp / player.maxExp) * 100))}%`;
    setWidthIfChanged(expBar, 'expPercent', expPct);
    
    setTextIfChanged(elPotions, 'potions', player.potions);
    setTextIfChanged(elManaPotions, 'manaPotions', player.manaPotions);
    setTextIfChanged(elStatPoints, 'statPoints', player.statPoints);
    setTextIfChanged(elSkillPoints, 'skillPoints', player.skillPoints || 0);
    
    // --- UPDATE STATUS & INDIKATOR BUFF ---
    updateStatUIWithBuff(elAttack, totalAtk, storeBuffs.atk, 'attack');
    updateStatUIWithBuff(elDefense, totalDef, storeBuffs.def, 'defense');
    updateStatUIWithBuff(elMagicDamage, totalMagic, storeBuffs.magic, 'magic');
    updateStatUIWithBuff(elAttackSpeed, totalAspd, storeBuffs.aspd, 'atkSpeed');
    updateStatUIWithBuff(elDodge, totalDodge, storeBuffs.dodge, 'dodge');

    // --- UPDATE EQUIPMENT ---
    const titleEl = document.getElementById('player-title');
    setTextIfChanged(titleEl, 'title', GameAchievements.title(player));
    setTextIfChanged(document.getElementById('dungeon-status'), 'dungeonStatus', GameAdventures.statusText());
    renderDungeonArenaLabel();
    setTextIfChanged(elEqWeapon, 'senjata', player.equipment.senjata?.name || 'Tangan Kosong');
    setTextIfChanged(elEqArmor, 'zirah', player.equipment.zirah?.name || 'Pakaian Kain');
    setTextIfChanged(elEqBoots, 'sepatu', player.equipment.sepatu?.name || 'Sandal Usang');
    setTextIfChanged(elEqHelmet, 'helm', player.equipment.helm?.name || 'Tanpa Pelindung');
    setTextIfChanged(elEqAmulet, 'amulet', player.equipment.amulet?.name || 'Tanpa Amulet');
    setTextIfChanged(elEqGloves, 'sarung_tangan', player.equipment.sarung_tangan?.name || 'Tanpa Sarung Tangan');
    setTextIfChanged(elEqOffhand, 'offhand', (player.equipment.offhand || player.equipment.katalis)?.name || 'Kosong');
    for (const [slot, label] of Object.entries({ senjata: elEqWeapon, zirah: elEqArmor, sepatu: elEqBoots,
        helm: elEqHelmet, amulet: elEqAmulet,
        sarung_tangan: elEqGloves, offhand: elEqOffhand })) {
        if (!label) continue;
        const item = player.equipment[slot] || (slot === 'offhand' ? player.equipment.katalis : null) || { slot };
        const key = JSON.stringify(GameItemCatalog.visual(item));
        const row = label.closest('.eq-row');
        if (!row || row.dataset.artKey === key) continue;
        const art = GameItemCatalog.createVisual(item);
        const previous = row.querySelector('.item-art, i');
        if (previous) previous.replaceWith(art);
        else row.prepend(art);
        row.dataset.artKey = key;
    }

    // --- UPDATE SETTING & BUTTONS ---
    if (btnPotionThreshold && player.potionThreshold !== undefined) {
        setHtmlIfChanged(btnPotionThreshold, 'potionThreshold', `<i class="fa-solid fa-gear"></i> Potion: ${player.potionThreshold}%`);
    }
    
    // Tampilkan/Sembunyikan tombol upgrade berdasarkan sisa poin atribut secara aman
    const showButtons = (player.statPoints > 0) ? 'inline-flex' : 'none';
    if (btnUpHp) btnUpHp.style.display = showButtons;
    if (btnUpMana) btnUpMana.style.display = showButtons;
    if (btnUpAtk) btnUpAtk.style.display = showButtons;
    if (btnUpDef) btnUpDef.style.display = showButtons;
    if (btnUpMagic) btnUpMagic.style.display = showButtons;
    if (btnUpDodge) btnUpDodge.style.display = showButtons;
    if (btnUpAspd) btnUpAspd.style.display = showButtons;

    updatePartyUI();
    updatePlayerBuffsUI();

    const explorePrompt = document.getElementById('explore-prompt');
    const holdEnemyVisual = Boolean(globalThis.BattleVisuals?.holdsEnemy);
    if (explorePrompt) explorePrompt.classList.toggle('hidden', !isGameStarted || inBattle || holdEnemyVisual);

    if (centerPanel && !holdEnemyVisual && !centerPanel.hasAttribute('data-preserve-stage')) {
        const stage = !isGameStarted ? 'stage-tavern' : (inBattle && currentEnemy ? `stage-${currentEnemy.stage}` : '');
        const nextClass = `panel${stage ? ' ' + stage : ''}`;
        if (centerPanel.className !== nextClass) centerPanel.className = nextClass;
    }

    // --- LOGIKA TAMPILAN AWAL (KEDAI) vs TAMPILAN PERTARUNGAN ---
    if (!isGameStarted) {
        if (centerPanel) centerPanel.classList.add('stage-tavern');
        if (preBattleScreen) preBattleScreen.classList.remove('hidden');
        if (battleControls) battleControls.classList.add('hidden');
        if (btnStartAdventure) btnStartAdventure.classList.remove('hidden');
        if (enemyPanel) enemyPanel.classList.remove('fade-in');
        if (btnGoToko) btnGoToko.disabled = false;
        if (btnGoCraft) btnGoCraft.disabled = false;
        // hide return buttons while in kedai / pre-battle
        if (btnReturnTavern) btnReturnTavern.style.visibility = 'hidden';
        if (btnReturnAdventure) btnReturnAdventure.style.visibility = 'hidden';
        return; // Hentikan update lebih lanjut jika game belum dimulai
    }

    // Sembunyikan elemen pra-pertarungan jika game sudah dimulai
    if (preBattleScreen) preBattleScreen.classList.add('hidden');
    if (battleControls) battleControls.classList.remove('hidden');
    if (btnStartAdventure) btnStartAdventure.classList.add('hidden');
    
    // Show return button ketika dalam pertarungan atau di layar petualangan
    if (btnReturnAdventure) btnReturnAdventure.style.visibility = 'visible';


    // --- LOGIKA UI SAAT AUTO-PLAY ATAU MANUAL BATTLE ---
    if (isAutoPlaying) {
        if(btnExplore) btnExplore.style.display = 'none';
    }

    const isManual = !isAutoPlaying;
    if(panelUseManaPotion) panelUseManaPotion.disabled = !isManual;
    if(panelUsePotion) panelUsePotion.disabled = !isManual;
    if(btnGoToko) btnGoToko.disabled = battleNavigationLocked();
    if(btnGoCraft) btnGoCraft.disabled = battleNavigationLocked();

    if (holdEnemyVisual && enemyPanel) {
        enemyPanel.classList.add('fade-in');
        setTextIfChanged(elEnemyHp, 'enemyHp', 0);
        if (enemyHpBarFill) enemyHpBarFill.style.width = '0%';
    } else if (inBattle && currentEnemy && enemyPanel) {
        enemyPanel.classList.add('fade-in');
        setTextIfChanged(elEnemyName, 'enemyName', currentEnemy.name);
        const bossSkill = GameBossMechanics.definition(currentEnemy);
        setTextIfChanged(document.getElementById('boss-mechanic'), 'bossMechanic', bossSkill ? `${bossSkill.name}: ${bossSkill.description} Cooldown ${bossSkill.cooldown / 1000} detik.` : '');
        setTextIfChanged(elEnemyHp, 'enemyHp', currentEnemy.hp);
        setTextIfChanged(elEnemyMaxHp, 'enemyMaxHp', currentEnemy.maxHp);
        updateEnemyImage(currentEnemy);
        if (enemyHpBarFill) enemyHpBarFill.style.width = `${(currentEnemy.hp / currentEnemy.maxHp) * 100}%`;
        if (centerPanel) centerPanel.classList.add(`stage-${currentEnemy.stage}`);
    } else if (enemyPanel) {
        enemyPanel.classList.remove('fade-in');
        if (elMonsterImg) elMonsterImg.style.display = 'none';
    }

    // Update debuff UI immediately when stats refresh, tapi batasi agar tidak dipanggil terlalu sering
    const now = Date.now();
    if (now - lastDebuffRenderAt > 500) {
        renderEnemyDebuffs();
        updatePlayerBuffsUI();
        lastDebuffRenderAt = now;
    }
}

function revealBattleMonster() {
    const image=elMonsterImg;
    if(document.hidden||!inBattle||image._arrivalTarget!==currentEnemy||image._arrivalPlayed===currentEnemy||!image.complete||!image.naturalWidth)return;
    image._arrivalPlayed=currentEnemy;
    if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    const animation=image.animate([{opacity:0},{opacity:1}],{duration:currentEnemy.name?.includes('BOSS')?520:360,easing:'cubic-bezier(.22,.61,.36,1)'});
    image._arrivalAnimation=animation;
    animation.onfinish=()=>{animation.cancel();if(image._arrivalAnimation===animation)image._arrivalAnimation=null;};
}
function updateEnemyImage(enemy) {
    if (globalThis.BattleVisuals?.holdsEnemy) return;
    if (!elMonsterImg || !enemy || document.hidden) return;
    const src = enemy.img || '';
    if (!src) { elMonsterImg.style.display = 'none'; return; }
    if(!elMonsterImg._arrivalListening){elMonsterImg.addEventListener('load',revealBattleMonster);elMonsterImg._arrivalListening=true;}
    if(elMonsterImg._arrivalTarget!==enemy){elMonsterImg._arrivalAnimation?.cancel();elMonsterImg._arrivalAnimation=null;elMonsterImg._arrivalTarget=enemy;}
    if (elMonsterImg.getAttribute('src') !== src) {
        elMonsterImg.decoding = 'async';
        elMonsterImg.onerror = () => { elMonsterImg.style.display = 'none'; };
        elMonsterImg.src = src;
    }
    // The same species can appear in consecutive battles.
    elMonsterImg.style.display = elMonsterImg.complete && !elMonsterImg.naturalWidth ? 'none' : 'block';
    revealBattleMonster();
}

function renderSkillsPanel() {
    if (!skillsPanel) return;

    // Tombol skill sengaja disembunyikan; data skill dan logic skill tetap dipertahankan.
    skillsPanel.innerHTML = '';
    skillsPanel.style.display = 'none';
    skillsPanel.classList.remove('single-button');
}

// Render active debuffs for currentEnemy into #enemy-debuffs
function renderEnemyDebuffs() {
    if (document.hidden || isAfkResumeRequired) return;
    if (globalThis.BattleVisuals?.holdsEnemy) return;
    const container = enemyDebuffsContainer || document.getElementById('enemy-debuffs');
    if (!container) return;
    if (!inBattle || !currentEnemy) { container.innerHTML = ''; container.setAttribute('aria-hidden','true'); return; }

    const debuffs = currentEnemy.debuffs || [];
    if (!debuffs || debuffs.length === 0) { container.innerHTML = ''; container.setAttribute('aria-hidden','true'); return; }

    const now = Date.now();
    const debuffKey = debuffs.map(d => `${d.type}:${Math.ceil(Math.max(0, (d.expiresAt || (now + (d.duration || 0))) - now) / 1000)}:${d.expiresAt || 0}`).join('|');
    if (currentEnemy._debuffKey === debuffKey && container.children.length > 0) {
        return;
    }
    currentEnemy._debuffKey = debuffKey;

    const fragment = document.createDocumentFragment();
    debuffs.forEach(d => {
        const remaining = Math.max(0, (d.expiresAt || (now + (d.duration || 0))) - now);
        const total = d.duration || (d.expiresAt ? (d.expiresAt - (d.createdAt || (now - (d.duration || 0)))) : remaining);
        const pct = total > 0 ? Math.max(0, Math.min(100, Math.floor((remaining / total) * 100))) : 0;
        const seconds = Math.ceil(remaining / 1000);
        const label = debuffLabel(d.type);
        const icon = debuffIcon(d.type);

        const item = document.createElement('div');
        item.className = 'debuff-item';
        item.setAttribute('data-type', escapeHtml(d.type));

        const iconWrap = document.createElement('div');
        iconWrap.className = 'debuff-icon';
        iconWrap.innerHTML = icon;

        const meta = document.createElement('div');
        meta.className = 'debuff-meta';

        const topRow = document.createElement('div');
        topRow.style.display = 'flex'; topRow.style.justifyContent = 'space-between'; topRow.style.alignItems = 'center'; topRow.style.gap = '8px';

        const nameEl = document.createElement('div');
        nameEl.className = 'debuff-name';
        nameEl.textContent = label;

        const timeEl = document.createElement('div');
        timeEl.className = 'debuff-time';
        timeEl.textContent = `${seconds}s`;

        topRow.appendChild(nameEl);
        topRow.appendChild(timeEl);

        const barWrap = document.createElement('div');
        barWrap.className = 'debuff-bar';
        const fill = document.createElement('div');
        fill.className = 'debuff-bar-fill';
        fill.style.width = `${pct}%`;
        barWrap.appendChild(fill);

        meta.appendChild(topRow);
        meta.appendChild(barWrap);

        item.appendChild(iconWrap);
        item.appendChild(meta);

        fragment.appendChild(item);
    });

    container.innerHTML = '';
    container.appendChild(fragment);
    container.setAttribute('aria-hidden','false');
}

function capitalize(value) { const text = String(value || ''); return text.charAt(0).toUpperCase() + text.slice(1); }

function showSkillNotification(message) { logMessage(message, 'combat'); }

function debuffLabel(type) {
    if (!type) return 'Debuff';
    const map = { poison: 'Racun', burn: 'Terbakar', slow: 'Lambat', stun: 'Terhentak' };
    return map[type] || capitalize(type);
}

function debuffIcon(type) {
    if (!type) return '<i class="fa-solid fa-circle"></i>';
    if (type === 'poison') return '<i class="fa-solid fa-biohazard" style="color:#a3e635"></i>';
    if (type === 'burn') return '<i class="fa-solid fa-fire" style="color:#fb923c"></i>';
    if (type === 'slow') return '<i class="fa-solid fa-snail" style="color:#60a5fa"></i>';
    if (type === 'stun') return '<i class="fa-solid fa-bolt" style="color:#f472b6"></i>';
    return `<i class="fa-solid fa-circle"></i>`;
}

function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Debuff rendering now dikelola oleh updateStats dan debuff tick interval.
// Ini menghindari interval duplikat yang dapat memperbesar beban memori.

// Trim a log container to `maxLines` by removing oldest entries (top) first.
function trimLogContainer(container, maxLines = 50) {
    if (!container) return;
    try {
        while (container.children.length >= maxLines) {
            container.removeChild(container.firstElementChild);
        }
    } catch (e) { console.warn('trimLogContainer error', e); }
}

function logMessage(msg, type = 'other') {
    if (typeof GameAdventures !== 'undefined' && GameAdventures.inTransaction) {
        GameAdventures.transactionLogs.push([msg, type]);
        return;
    }
    if (document.hidden || (isAfkMode && isAfkResumeRequired)) return;
    let formattedMsg = escapeHtml(String(msg)).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    const logHtml = `<span class="log-row ${type}">> ${formattedMsg}</span>`;


    // use global MAX_LOG_LINES

    if (logAll) {
        // Remove exactly 1 oldest row when at capacity, so on each new log:
        // append 1 new + drop 1 oldest (maintain fixed-size window).
        if (logAll.children && logAll.children.length >= MAX_LOG_LINES) {
            try {
                const first = logAll.firstElementChild;
                if (first) logAll.removeChild(first);
            } catch (e) {}
        }
        logAll.insertAdjacentHTML('beforeend', logHtml);
        if (String(msg).startsWith('DROP: ') && typeof GameItemAssets !== 'undefined') {
            GameItemAssets.attach(logAll.lastElementChild, String(msg).slice(6).replace(/ \+\d+$/, ''), { compact: true });
        }
    }


    const logSpecific = document.getElementById(`log-${type}`);
    if (logSpecific) {
        trimLogContainer(logSpecific, MAX_LOG_LINES);
        logSpecific.insertAdjacentHTML('beforeend', logHtml);
        if (String(msg).startsWith('DROP: ') && typeof GameItemAssets !== 'undefined') {
            GameItemAssets.attach(logSpecific.lastElementChild, String(msg).slice(6).replace(/ \+\d+$/, ''), { compact: true });
        }
    }

    if (screenEl) screenEl.scrollTop = screenEl.scrollHeight;
}


function updatePartyUI() {
    if (document.hidden || isAfkResumeRequired) return;
    const partyList = document.getElementById('party-members-list');
    if (!partyList) return;

    // Tampilkan hanya anggota party yang active (dipilih untuk bertarung)
    if (!player.party || player.party.length === 0) {
        setHtmlIfChanged(partyList, 'party', `<p class="no-party-msg"><i>Tidak ada party yang direkrut.</i></p>`);
        return;
    }

    // Filter hanya yang active
    const activeMembers = [...new Set(player.party)].filter(id => {
        const inst = (player.allies && player.allies[id]) || {};
        return Boolean(inst.active);
    });

    if (activeMembers.length === 0) {
        setHtmlIfChanged(partyList, 'party', `<p class="no-party-msg"><i>Tidak ada party yang dipilih untuk bertarung. Atur di tombol ⚙️.</i></p>`);
        return;
    }

    const partyToDisplay = activeMembers.map(id => {
        const combatAlly = inBattle && playerParty.find(ally => ally.id === id);
        if (combatAlly) return combatAlly;
        const base = allyDatabase[id] || { id, name: id, hp: 0, attack: 0, def: 0, magic: 0, aspd: 0 };
        const inst = (player.allies && player.allies[id]) || {};
        return { ...base, ...GameAllyCatalog.statsFor(base, inst), id,
            xp: inst.xp || 0, maxExp: inst.maxExp || 100 };

    });

    const partyKey = JSON.stringify(partyToDisplay.map(ally => [ally.id, ally.name, ally.class, ally.level || 1, ally.hp, ally.maxHp, ally.mana, ally.maxMana, GameFormation.position(player, ally), getAllyCombatStats(ally)]));
    if (lastValues.party === partyKey) return;
    lastValues.party = partyKey;
    partyList.replaceChildren();
    const fragment = document.createDocumentFragment();
    partyToDisplay.forEach(ally => {
        const isKO = ally.hp <= 0;

        const member = document.createElement('div');
        member.className = `party-member ${isKO ? 'ko' : ''}`;

        const nameSpan = document.createElement('span');
        nameSpan.className = 'party-member-name';
        nameSpan.textContent = `${ally.name} (${ally.class})`;

        const metaSpan = document.createElement('span');
        metaSpan.className = 'party-member-meta';
        metaSpan.textContent = `Level ${ally.level || 1} · ${GameFormation.position(player, ally) === 'front' ? 'Frontline' : 'Backline'}`;
        const actual = getAllyCombatStats(ally);
        const statsLine = document.createElement('span');
        statsLine.className = 'party-member-meta';
        statsLine.textContent = `ATK ${actual.atk} | DEF ${actual.def} | MAG ${actual.magic} | Dodge ${Math.min(75, actual.dodge)}% | ASPD ${actual.aspd}`;

        member.appendChild(nameSpan);
        member.appendChild(metaSpan);
        member.appendChild(statsLine);
        if (ally.maxMana > 0) {
            const manaLine = document.createElement('span');
            manaLine.className = 'party-member-meta';
            manaLine.textContent = `Mana ${ally.mana}/${ally.maxMana}`;
            member.appendChild(manaLine);
        }
        const health = document.createElement('div');
        health.className = 'party-health';
        const label = document.createElement('span');
        label.textContent = `HP ${ally.hp}/${ally.maxHp}${isKO ? ' - Mati: hidupkan di Kedai' : ''}`;
        const bar = document.createElement('progress');
        bar.max = ally.maxHp;
        bar.value = ally.hp;
        bar.setAttribute('aria-label', `HP ${ally.name}`);
        health.append(label, bar);
        member.appendChild(health);
        fragment.appendChild(member);
    });
    partyList.appendChild(fragment);
}


// =========================================================================
// 8. LOGIKA PETUALANGAN & COMBAT (DENGAN INTEGRASI FULL STATS)
// =========================================================================
function checkLevelUp(trackQuests = true) {
    GameOffline.levelUp(player, getPlayerTotalStats().totalMaxHp, () => {
        playSound('levelup');

        const skillPointText = SKILL_POINT_LEVELS.has(player.level) ? ' Kamu juga mendapat 1 Poin Skill!' : '';
        logMessage(`✨ LEVEL UP! Kamu mencapai Level ${player.level}! Pertahanan alami naik +1 DEF. Kamu mendapat 3 Poin Atribut!${skillPointText}`, 'other');
        try { showLevelUpAnimation(player.level); } catch (e) { console.warn('Level animation failed', e); }
    });
    if (trackQuests) {
        if (player.offlineProgress) player.offlineProgress.deferLevelQuest = false;
        handleQuestLevelProgress();
    }
    saveGameData();
}

// Visual: show animation on the level element and a brief popup in the center
function showLevelUpAnimation(newLevel) {
    if (document.hidden || isAfkResumeRequired) return;
    const levelEl = document.getElementById('level');
    if (levelEl) {
        levelEl.classList.remove('level-up');
        // force reflow to restart animation
        void levelEl.offsetWidth;
        levelEl.classList.add('level-up');
    }

    // transient popup
    const center = document.getElementById('center-panel') || document.body;
    const popup = document.createElement('div');
    popup.className = 'level-popup';
    popup.innerText = `LEVEL UP! Level ${newLevel}`;
    center.appendChild(popup);
    // remove after animation completes (duration ~1s)
    setTimeout(() => { try { popup.remove(); } catch (e) {} }, 1100);
}

function actionExplore() {
    if (!isGameStarted || inBattle || player.hp <= 0) return;
    if (player.dungeon?.active) { GameAdventures.launch(); return; }
    const allowedStages = GameOffline.allowedStages(player.level);

    const randomStageIndex = Math.floor(Math.random() * allowedStages.length);
    const chosenStage = allowedStages[randomStageIndex];

    const availableMonsters = monsterDatabase.filter(m => m.stage === chosenStage);
    const stageBosses = availableMonsters.filter(m => m.name.includes("BOSS"));
    const stageRegulars = availableMonsters.filter(m => !m.name.includes("BOSS"));
    const bossChancePerStage = {
        'forest': 0.01,
        'cave': 0.01,
        'ruins': 0.01,
        'frost-tundra': 0.01,
        'lava-lair': 0.01,
        'abyssal-void': 0.01
    };
    const bossRoll = Math.random();
    let enemy;
    if (stageBosses.length > 0 && bossRoll < (bossChancePerStage[chosenStage] || 0.05)) {
        enemy = { ...stageBosses[Math.floor(Math.random() * stageBosses.length)] };
    } else {
        enemy = { ...(stageRegulars.length > 0 ? stageRegulars[Math.floor(Math.random() * stageRegulars.length)] : stageBosses[Math.floor(Math.random() * stageBosses.length)]) };
    }

    beginEncounter(enemy);
}

function beginEncounter(enemy) {
    isDefeatHandled = false; // Reset flag untuk pertarungan baru
    
    player.combatBuffs = []; // Hapus buff dari pertarungan sebelumnya
    syncPartyHealth();
    playerParty = []; // Hapus data party dari pertarungan sebelumnya
    lastPlayerAttackAt = 0;
    if (attackCooldownTimer) {
        clearTimeout(attackCooldownTimer);
        attackCooldownTimer = null;
    }
    currentEnemy = JSON.parse(JSON.stringify(enemy));
    const chosenStage = currentEnemy.stage;
    GameBossMechanics.initialize(currentEnemy, Date.now());
    inBattle = true;
    if (GameJournal.discover(player, currentEnemy)) saveGameData(true);
    
    if (currentEnemy.name.includes("BOSS")) {
        showBossEncounterAnimation();
        logMessage(`🔥 **BOS UTAMA BANGKIT!** Kamu tersesat ke area berbahaya... **${currentEnemy.name}** menghadang jiwamu!`, 'other');
        currentEnemy.debuffs = []; // Initialize debuffs for boss
    } else {
        logMessage(`🗺️ Berhasil berteleportasi ke area **[${chosenStage.toUpperCase()}]**, kamu dihadang oleh **${currentEnemy.name}** (HP: ${currentEnemy.hp} | DEF: ${currentEnemy.def} | M.DEF: ${currentEnemy.magicDef || 0})!`, 'other');
        currentEnemy.debuffs = []; // Initialize debuffs for regular monster
    }

    initializePartyForCombat();
    try { syncTypedStatsFromActors(); } catch (e) {}

    if (playerParty.length > 0) {
        logMessage(`👥 Partai Anda bersiap untuk bertarung! (${playerParty.length} anggota)`, 'other');
    } else {
        logMessage(`⚠️ Tidak ada anggota party yang dipilih. Anda bertarung sendirian.`, 'other');
    }
    updateStats();
}

function syncPartyHealth() {
    for (const ally of playerParty) {
        const inst = player.allies[ally.id];
        if (inst) {
            inst.hp = Math.max(0, Math.min(ally.maxHp, ally.hp));
            inst.mana = Math.max(0, Math.min(ally.maxMana, ally.mana));
            inst.skillReadyAt = Math.max(0, ally.skillReadyAt || 0);
        }
    }
}

function getAllyCombatStats(ally) {
    const now = Date.now();
    ally.combatBuffs = (ally.combatBuffs || []).filter(buff => buff.expiresAt > now);
    const stats = { atk: ally.attack || 0, def: ally.def || 0, magic: ally.magic || 0, dodge: ally.dodge || 0, aspd: ally.aspd || 0 };
    for (const buff of ally.combatBuffs) {
        if (Object.hasOwn(stats, buff.stat) && Number.isFinite(buff.value)) stats[buff.stat] += buff.value;
    }
    for (const key of Object.keys(stats)) stats[key] = Math.max(0, stats[key]);
    stats.aspd = GameBossMechanics.speed(ally, stats.aspd, now, player.settings?.debuffsEnabled !== false);
    return stats;
}

function getSkillActorStats(actor) {
    if (actor === player) return getPlayerTotalStats();
    const stats = getAllyCombatStats(actor);
    return { totalAtk: stats.atk, totalDef: stats.def, totalMagic: stats.magic, totalDodge: stats.dodge, totalAspd: stats.aspd, totalMaxHp: actor.maxHp };
}

function regeneratePartyMana() {
    if (inBattle) return false;
    syncPartyHealth();
    let changed = false;
    for (const id of new Set(player.party || [])) {
        const base = allyDatabase[id], inst = player.allies[id];
        if (!base || !inst) continue;
        const stats = GameAllyCatalog.statsFor(base, inst);
        if (stats.hp <= 0 || stats.mana >= stats.maxMana) continue;
        inst.mana = Math.min(stats.maxMana, stats.mana + Math.floor(stats.maxMana * 0.01) + 1);
        const actor = playerParty.find(ally => ally.id === id);
        if (actor) actor.mana = inst.mana;
        changed = true;
    }
    if (changed) saveGameData(true);
    return changed;
}

function initializePartyForCombat() {
    syncPartyHealth();
    playerParty = [];
    
    if (player.party && player.party.length > 0) {
        // Only include allies that have inst.active = true
        const chosenForBattle = [...new Set(player.party)].filter(id => {
            const inst = (player.allies && player.allies[id]) || {};
            return Boolean(inst.active);
        }).slice(0, 3);

        chosenForBattle.forEach(allyId => {
            const allyTemplate = allyDatabase[allyId];
            if (!allyTemplate) return;
            const inst = (player.allies && player.allies[allyId]) || {};
            const health = GameCore.allyHealth(allyTemplate, inst);
            if (health.hp <= 0) return;
            const actual = GameAllyCatalog.statsFor(allyTemplate, inst);
            const chosenSkill = (inst.skills && inst.skills[0]) || allyTemplate.skill?.type;
            playerParty.push({
                id: allyTemplate.id, name: allyTemplate.name, class: allyTemplate.class,
                ...actual,
                combatBuffs: [],
                debuffs: [],
                skillReadyAt: Number.isFinite(inst.skillReadyAt) ? Math.max(0, inst.skillReadyAt) : 0,
                skill: { ...allyTemplate.skill, type: chosenSkill, chance: (allyTemplate.skill && allyTemplate.skill.chance) || 0.25, amount: (allyTemplate.skill && allyTemplate.skill.amount) || 0 },
                nameTag: allyTemplate.name
            });
        });
    }
}

function renderDungeonArenaLabel() {
    const label=document.getElementById('arena-dungeon-label');
    if(!label)return;
    const run=GameDungeons.state(player).active;
    label.hidden=!isGameStarted||!run;
    if(label.hidden)return;
    const wave=currentEnemy?.dungeonToken&&globalThis.BattleVisuals?.holdsEnemy
        ?Number(currentEnemy.dungeonToken.split(':').pop())+1:run.wave+1;
    const detail=`${GameJournal.stages[run.stage]} · ${GameDungeons.difficulties[run.difficulty].name} · Gelombang ${wave}/${GameDungeons.plan(run.stage,run.difficulty).length}`;
    setTextIfChanged(document.getElementById('arena-dungeon-detail'),'arenaDungeonDetail',detail);
}
const shownBossIntros=new WeakSet();
function showBossEncounterAnimation() {
    if (document.hidden || isAfkResumeRequired) return;
    if (globalThis.BattleVisuals?.holdsEnemy) return;
    if(!inBattle||!currentEnemy||!(currentEnemy.isBoss||/\bBOSS\b/i.test(currentEnemy.name||''))||shownBossIntros.has(currentEnemy))return;
    try {
        shownBossIntros.add(currentEnemy);
        centerPanel.querySelector('.boss-encounter-overlay')?.remove();
        const overlay = document.createElement('div');
        overlay.className = 'boss-encounter-overlay';
        overlay.setAttribute('aria-hidden','true');
        overlay.innerHTML = '<div class="boss-encounter-card"><i class="fa-solid fa-skull" aria-hidden="true"></i><span class="boss-intro-kicker">KEHADIRAN MENGERIKAN</span><strong>BOSS</strong><span class="boss-intro-name"></span><p>Tak ada tempat untuk lengah.</p></div>';
        overlay.querySelector('.boss-intro-name').textContent=currentEnemy.name.replace(/\s*\(BOSS\)/i,'');
        centerPanel.appendChild(overlay);
        requestAnimationFrame(() => overlay.classList.add('visible'));
        setTimeout(() => overlay.classList.remove('visible'), 1700);
        setTimeout(() => { if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay); }, 2000);
    } catch (e) {
        console.warn('Boss animation failed', e);
    }
}


// Gate: cek apakah pemain boleh menyerang sekarang (termasuk saat auto)
function canPlayerAttackNow() {
    if (!inBattle || !currentEnemy) return false;
    // Auto/manual hanya boleh saat petualangan sudah dimulai
    if (!isGameStarted) return false;

    // Cooldown gate: jangan serang kalau cooldown belum habis
    const remaining = getAttackCooldownRemainingMs();
    return remaining <= 0;
}

function actionAttack() {
    if (!isGameStarted || !inBattle || !currentEnemy || player.hp <= 0) return false;

    // cooldown gate: selalu patuh cooldown, baik manual maupun auto
    const attackCooldownRemaining = getAttackCooldownRemainingMs();
    if (attackCooldownRemaining > 0) {
        return false;
    }

    lastPlayerAttackAt = Date.now();
    const playerDebuffs = processEntityDebuffs(player);
    if (player.hp <= 0) { handlePlayerDefeat(); return false; }
    if (playerDebuffs.stunned) { enemyAttackBack(); updateStats(); return false; }

    // --- PENGAMBILAN STATS PEMAIN ---
    const { totalAtk: pAtk, totalMagic: pMagic, totalAspd: pAtkSpeed } = getPlayerTotalStats();
    // --- PROSES DEBUFF MUSUH SEBELUM SERANGAN PEMAIN ---
    processEntityDebuffs(currentEnemy);
    if (currentEnemy.hp <= 0) { // Monster might die from debuffs
        handleMonsterDefeat(); 
        return true; 
    }

    // --- 8.A PENGARUH ATK SPEED (Peluang Serangan Ganda & Triple) ---
    let hitCount = 1 + (Math.random() < (pAtkSpeed / 100) ? 1 : 0) + (Math.random() < ((pAtkSpeed - 100) / 100) ? 1 : 0);
    hitCount = Math.min(3, Math.max(1, hitCount)); // Clamp between 1 and 3 hits
    const isMultiStrike = hitCount > 1;

    let totalDmgDealt = 0;
    let dmgDetailText = "";
    let isPlayerCrit = false;
    let visualCrit = false;

    // Peluang menghindar monster kini bergantung pada stat SPEED mereka.
    const enemyDodgeChance = (currentEnemy.speed || 0) / 400; // Contoh: Speed 100 = 25% dodge
    let isEnemyDodge = Math.random() < enemyDodgeChance;

    if (isEnemyDodge) {
        lastAttackSourceClass = null;
        playSound('miss'); 
        logMessage(`💨 **MISS!** Monster ${currentEnemy.name} berhasil melompat menghindar!`, 'combat');
    } else {
        // Looping serangan
        for (let i = 0; i < hitCount; i++) {
            // --- 8.B PENGARUH ATK FISIK ---
            let pVariance = Math.floor((Math.random() * 0.4 - 0.2) * pAtk); 
            let baseDmg = pAtk + pVariance - currentEnemy.def;
            if (baseDmg < 0) baseDmg = 0; 
            
            // --- 8.C PENGARUH MAGIC ATK ---
            let enemyMDef = currentEnemy.magicDef || 0; 
            let finalMagicDmg = pMagic - enemyMDef;
            if (finalMagicDmg < 0) finalMagicDmg = 0; 

            // Combine Damage
            let currentHitDmg = baseDmg + finalMagicDmg;
            if (currentHitDmg < 1) currentHitDmg = 1; 

            // Hitungan Critical Player (15%)
            let hitCrit = Math.random() < 0.15;
            visualCrit = visualCrit || hitCrit;
            if (hitCrit) currentHitDmg = Math.floor(currentHitDmg * 1.5);

            totalDmgDealt += currentHitDmg;
            
            if (i === 0 && pMagic > 0) {
                // keep string assembly minimal (only on first hit)
                dmgDetailText = " (Fisik: " + baseDmg + " + Magic: " + finalMagicDmg + ")";
            }

        }

        currentEnemy.hp -= totalDmgDealt;
        if (currentEnemy.hp < 0) currentEnemy.hp = 0;
        const cls = (player.heroClass || '').toString().trim().toLowerCase();
        lastAttackSourceClass = getBaseHeroClass(cls);
        playSound('hit');
        const strikeText = isMultiStrike ? `⚡ **${hitCount === 3 ? 'TRIPLE' : 'DOUBLE'} STRIKE!** ` : ``;
        let critText = isPlayerCrit ? `🔥 **CRITICAL!** ` : ``;
        logMessage(`⚔️ ${strikeText}${critText}Seranganmu menghantam **${currentEnemy.name}** sebesar **${totalDmgDealt} DMG**${dmgDetailText}.`, 'combat');
    }

    globalThis.BattleVisuals?.emit('attack', { target: currentEnemy, damage: totalDmgDealt,
        critical: visualCrit, miss: isEnemyDodge, interval: getAttackDelayMs(pAtkSpeed) });

    // --- PENGECEKAN KEMATIAN MONSTER ---
    if (currentEnemy.hp <= 0) { handleMonsterDefeat(); return true; }

    // --- SERANGAN ANGGOTA PARTY ---
    if (currentEnemy.hp > 0) {
        alliesAttack();
    }
    if (!inBattle || currentEnemy.hp <= 0) { handleMonsterDefeat(); return true; }

    // --- 8.D PENGARUH DODGE & DEFENSE KETIKA MUSUH MENYERANG BALIK ---
    enemyAttackBack();
    
    saveGameData(); 
    updateStats();
    return false; 
}

function handleMonsterDefeat() {
    if (currentEnemy?.dungeonToken) return GameAdventures.settleVictory();
    return applyMonsterVictory();
}

function applyMonsterVictory() {
    if (!inBattle || !currentEnemy || currentEnemy.hp > 0 || isDefeatHandled) return false;
    isDefeatHandled = true;
    inBattle = false;
    currentEnemy.hp = 0;
    const enemy = currentEnemy;
    const gold = Math.max(0, Math.floor(enemy.gold || 0));
    const exp = Math.max(0, Math.floor(enemy.exp || 0));
    player.gold += gold;
    player.exp += exp;
    player.killCounts[enemy.name] = (player.killCounts[enemy.name] || 0) + 1;
    for (const drop of enemy.drops || []) {
        if (Math.random() < drop.chance) {
            player.inventory[drop.name] = (player.inventory[drop.name] || 0) + 1;
            logMessage(`DROP: ${drop.name} +1`, 'item');
            if (afkSummary.active) addAfkSummaryEvent(`DROP: ${drop.name}`);
        }
    }
    for (const ally of playerParty) {
        const instance = player.allies[ally.id];
        if (!instance || ally.hp <= 0) continue;
        instance.xp = (instance.xp || 0) + exp;
        instance.maxExp = Math.max(100, instance.maxExp || 100);
        while (instance.xp >= instance.maxExp) {
            instance.xp -= instance.maxExp;
            instance.level = (instance.level || 1) + 1;
            instance.statPoints = (instance.statPoints || 0) + 1;
            instance.maxExp = Math.floor(instance.maxExp * 1.25);
        }
    }
    if (afkSummary.active) {
        afkSummary.enemiesKilled++;
        afkSummary.goldEarned += gold;
        afkSummary.expEarned += exp;
    }
    reportQuestEvent('kill_any', 1);
    reportQuestEvent('gold_earned', gold);
    if (enemy.name.includes('BOSS')) reportQuestEvent('boss_defeat', 1);
    checkLevelUp();
    logMessage(`MENANG: ${enemy.name}. +${gold} Gold, +${exp} EXP.`, 'combat');
    syncTypedStatsFromActors();
    saveGameData(true);
    // Dungeon emits only after its enclosing reward transaction commits.
    if (typeof GameAdventures === 'undefined' || !GameAdventures.inTransaction) {
        globalThis.BattleVisuals?.emit('defeat', { target: enemy });
    }
    updateStats();
    return true;
}

function handlePlayerDefeat() {
    if (!inBattle || player.hp > 0) return;
    globalThis.BattleVisuals?.emit('dead', { target: currentEnemy });
    const wasDungeon=Boolean(GameDungeons.state(player).active?.healthBefore);
    logMessage('Kamu gugur dalam pertempuran dan otomatis respawn di Kedai.', 'combat');
    returnToTavern(true,'defeat');
    const notice = document.getElementById('respawn-notice');
    if (notice) {
        notice.textContent = wasDungeon?'Run Dungeon berakhir. HP party kembali seperti sebelum masuk Dungeon.':'Kamu telah respawn. HP dan mana pulih penuh. Siap mencoba lagi?';
        notice.classList.remove('hidden');
    }
    if (!document.hidden && btnStartAdventure) btnStartAdventure.focus({ preventScroll: true });
}

function enemyAttackBack() {
    if (!inBattle || !currentEnemy || currentEnemy.hp <= 0) return;
    const effects = processEntityDebuffs(currentEnemy);
    if (currentEnemy.hp <= 0) { handleMonsterDefeat(); return; }
    if (effects.stunned) return;
    const targets = [player, ...playerParty.filter(ally => ally.hp > 0 && player.allies[ally.id]?.active !== false)];
    const target = GameFormation.choose(player, targets, currentEnemy, Date.now(), Math.random());
    if (!target) return;
    const totals = getPlayerTotalStats();
    const allyStats = target === player ? null : getAllyCombatStats(target);
    const defense = target === player ? totals.totalDef : allyStats.def;
    const dodge = target === player ? totals.totalDodge : allyStats.dodge;
    if (Math.random() < Math.min(0.75, Math.max(0, (dodge || 0) / 100))) {
        logMessage(`${target.name} menghindari serangan ${currentEnemy.name}.`, 'combat');
        return;
    }
    const special = GameBossMechanics.action(currentEnemy, target, Date.now(), player.settings?.debuffsEnabled !== false);
    if (special.name) logMessage(`BOSS SKILL: ${currentEnemy.name} — ${special.name}!`, 'combat');
    const rawDamage = Math.max(1, Math.floor(special.attack * (0.8 + Math.random() * 0.4)) - (defense || 0));
    const damage = Math.max(1, Math.floor(rawDamage * GameFormation.protection(player, target, targets)));
    target.hp = Math.max(0, target.hp - damage);
    if(currentEnemy.isBoss||/\bBOSS\b/i.test(currentEnemy.name||''))GameAudio.battle('bossAttack',{target:currentEnemy});
    if (target === player) globalThis.BattleVisuals?.emit(player.hp <= 0 ? 'dead' : 'hit', { target: currentEnemy, damage });
    if (target !== player) {
        if (target.hp <= 0) logMessage(`${target.name} mati. Hidupkan kembali di Kedai (100 koin).`, 'combat');
        saveGameData(true);
    }
    logMessage(`${currentEnemy.name} menyerang ${target.name}: ${damage} DMG.`, 'combat');
    syncTypedStatsFromActors();
    if (player.hp <= 0) handlePlayerDefeat();
}

function useSkill(skillId) {
    if (!isGameStarted || !inBattle || !currentEnemy || player.hp <= 0 || !isSkillAllowedForPlayer(skillId)) return false;
    const learned = player.skills.find(skill => skill.id === skillId);
    const skill = skillDatabase[skillId];
    const now = Date.now();
    if (!learned || !skill || (learned.readyAt || 0) > now || player.mana < skill.cost || getAttackCooldownRemainingMs() > 0) return false;
    const effects = processEntityDebuffs(player);
    if (player.hp <= 0) { handlePlayerDefeat(); return false; }
    if (effects.stunned) return false;
    player.mana -= skill.cost;
    learned.readyAt = now + skill.cooldown;
    lastPlayerAttackAt = now;
    const visualHpBeforeSkill = currentEnemy.hp;
    skill.execute(player, currentEnemy);
    globalThis.BattleVisuals?.emit('skill', { target: currentEnemy,
        damage: Math.max(0, visualHpBeforeSkill - currentEnemy.hp), interval: getAttackDelayMs(getPlayerTotalStats().totalAspd) });
    currentEnemy.hp = Math.max(0, currentEnemy.hp);
    if (afkSummary.active) afkSummary.skillsUsed++;
    if (currentEnemy.hp > 0) alliesAttack();
    if (currentEnemy.hp <= 0) handleMonsterDefeat();
    else enemyAttackBack();
    syncTypedStatsFromActors();
    saveGameData(true);
    updateStats();
    return true;
}

function alliesAttack() {
    if (!inBattle || !currentEnemy || playerParty.length === 0) return;


    playerParty.forEach(ally => {
        if (ally.hp > 0 && currentEnemy.hp > 0 && player.allies[ally.id]?.active !== false) {
            const effects = processEntityDebuffs(ally);
            if (ally.hp <= 0 || effects.stunned) return;
            // Aksi Skill dulu (jika ada)
            if (ally.skill && Math.random() < ally.skill.chance) {
                // If skill maps to skillDatabase, execute via wrapper to reuse logic
                const chosenSkillType = ally.skill.type;
                const mapped = allySkillToSkillDB[chosenSkillType] || chosenSkillType;
                if (mapped && skillDatabase[mapped]) {
                    executeAllySkill(ally, mapped);
                } else {
                    // Jika skill tidak dipetakan atau tidak ditemukan di skillDatabase, log peringatan
                    // dan biarkan rekan melanjutkan dengan serangan dasar.
                    console.warn(`Ally skill type '${chosenSkillType}' (mapped to '${mapped}') not found in skillDatabase or unhandled.`);
                }
            }
            if (!inBattle || currentEnemy.hp <= 0) return;

            // Serangan biasa (dipengaruhi level & stats): gabungan Fisik + Magic
            const allyStats = getAllyCombatStats(ally);
            const effectiveAtk = allyStats.atk;
            const effectiveMagic = allyStats.magic;

            // Determine hit count from attack speed (aspd) similar to player logic
            let hitCount = 1;
            let isDouble = false, isTriple = false;
            const aSpd = allyStats.aspd;
            if (aSpd > 100) {
                isDouble = true; hitCount = 2;
                let tripleChance = aSpd - 100;
                if ((Math.random() * 100) < tripleChance) { isTriple = true; hitCount = 3; }
            } else {
                if ((Math.random() * 100) < aSpd) { isDouble = true; hitCount = 2; }
            }

            // Peluang crit per rekan (dipengaruhi kelas)
            let critChance = 0.10; // default 10%
            const aClass = (ally.class || '').toString().toLowerCase();
            if (aClass.includes('rogue') || aClass.includes('assassin')) critChance = 0.25;
            else if (aClass.includes('archer') || aClass.includes('ranger')) critChance = 0.12;

            // Enemy dodge chance (reuse same formula as player)
            const enemyDodgeChance = (currentEnemy.speed || 0) / 400;

            let totalAllyDamage = 0;
            let allyCrit = false;
            let actualHits = 0;

            for (let h = 0; h < hitCount; h++) {
                if (currentEnemy.hp <= 0) break;
                // dodge check
                if (Math.random() < enemyDodgeChance) {
                    // minimize template creation in inner loop
                    logMessage('💨 ' + ally.name + ' menyerang namun ' + currentEnemy.name + ' menghindar!', 'combat');

                    continue;
                }

                actualHits++;
                // physical variance
                let variance = Math.floor((Math.random() * 0.4 - 0.2) * effectiveAtk);
                let phys = effectiveAtk + variance - (currentEnemy.def || 0);
                if (phys < 0) phys = 0;

                // magic portion reduced by enemy magic defense
                let mdef = currentEnemy.magicDef || 0;
                let mag = effectiveMagic - mdef;
                if (mag < 0) mag = 0;

                let hitDmg = phys + mag;
                if (hitDmg < 1) hitDmg = 1;

                // crit
                if (Math.random() < critChance) { hitDmg = Math.floor(hitDmg * 1.5); allyCrit = true; }

                currentEnemy.hp -= hitDmg;
                if (currentEnemy.hp < 0) currentEnemy.hp = 0;
                totalAllyDamage += hitDmg;
            }

            if (totalAllyDamage > 0) {
                const strikeText = isTriple ? '⚡⚡ **TRIPLE!** ' : (isDouble ? '⚡ **DOUBLE!** ' : '');
                const critText = allyCrit ? '🔥 **CRITICAL!** ' : '';
                logMessage(`🤝 ${strikeText}${critText}${ally.name} menyerang ${currentEnemy.name} sebesar **${totalAllyDamage} DMG** (Hits: ${actualHits}).`, 'combat');
            }
        }
    });
    updateStats();
}

function executeAllySkill(ally, mappedSkillId) {
    if (!inBattle || !currentEnemy || currentEnemy.hp <= 0 || player.hp <= 0 || ally.hp <= 0 || !playerParty.includes(ally) || player.allies[ally.id]?.active === false) return false;
    const skillId = mappedSkillId || allySkillToSkillDB[ally.skill?.type] || ally.skill?.type;
    const skill = skillDatabase[skillId];
    if (!Object.values(allySkillToSkillDB).includes(skillId) || !skill || (ally.skillReadyAt || 0) > Date.now()) return false;
    const cost = ally.skill?.usesMana ? skill.cost : 0;
    if ((ally.mana ?? 0) < cost) return false;
    if (skillId === 'PRIEST_GROUP_REGEN' && ![player, ...playerParty].some(target => target.hp > 0 && target.hp < (target === player ? getPlayerTotalStats().totalMaxHp : target.maxHp))) return false;
    if (skillId === 'FIGHTER_DEFENSE_UP' && (ally.combatBuffs || []).some(buff => buff.source === skillId && buff.expiresAt > Date.now())) return false;
    if (skillId === 'ALLY_TAUNT' && currentEnemy.tauntedBy === ally.id && currentEnemy.tauntExpiresAt > Date.now()) return false;
    // Physical procs stay free. Caster skills use their existing database Mana cost.
    const wasExecuting = inSkillExecution;
    const wasSuppressed = suppressSkillSound;
    inSkillExecution = true;
    suppressSkillSound = true;
    try {
        skill.execute(ally, currentEnemy);
        ally.mana = Math.max(0, (ally.mana ?? 0) - cost);
        ally.skillReadyAt = Date.now() + skill.cooldown;
        showSkillNotification(ally.name + ': ' + skill.name);
        if (currentEnemy.hp <= 0) handleMonsterDefeat();
        syncTypedStatsFromActors();
        saveGameData(true);
        return true;
    } finally {
        inSkillExecution = wasExecuting;
        suppressSkillSound = wasSuppressed;
    }
}

function promptReturnToTavern(onContinueCallback) {
    const { totalMaxHp } = getPlayerTotalStats();
    const hpRatio = (totalMaxHp > 0) ? (player.hp / totalMaxHp) : 0;

    if (player.hp > 0 && hpRatio <= 0.30 && typeof Swal !== 'undefined') {
        Swal.fire({
            title: 'HP Rendah — Kembali ke Kedai?',
            text: 'HP-mu rendah. Kembali ke Kedai memulihkan HP & Mana penuh. Atau lanjutkan petualangan.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Kembali ke Kedai',
            cancelButtonText: 'Lanjutkan',
            reverseButtons: true
        }).then(result => {
            if (result.isConfirmed) {
                returnToTavern(true); // true to force reset
            } else {
                onContinueCallback();
            }
        }).catch(() => onContinueCallback());
    } else {
        onContinueCallback();
    }
}

function actionPotion() {
    if (player.potions > 0) {
        const maxHp = getPlayerTotalStats().totalMaxHp;
        if (player.hp >= maxHp) { logMessage(`Darahmu sudah penuh!`, 'other'); return; }
        player.potions--; 
        player.hp = Math.min(maxHp, player.hp + Math.floor(maxHp * 0.5));
        playSound('potion'); 
        logMessage(`🧪 Potion diminum. Memulihkan 50% HP.`, 'other');
        if (afkSummary.active) {
            afkSummary.potionsUsed += 1;
            addAfkSummaryEvent('Potion HP digunakan');
        }
    } else { 
        logMessage(`⚠️ Potion habis.`, 'other'); 
    }
    saveGameData(); updateStats();
}

function actionManaPotion() {
    if (player.manaPotions > 0) {
        if (player.mana >= player.maxMana) { logMessage(`Mana-mu sudah penuh!`, 'other'); return; }
        player.manaPotions--; 
        player.mana = Math.min(player.maxMana, player.mana + Math.floor(player.maxMana * 0.5));
        playSound('potion'); 
        logMessage(`💧 Potion Mana diminum. Memulihkan 50% Mana.`, 'other');
        if (afkSummary.active) {
            afkSummary.manaPotionsUsed += 1;
            addAfkSummaryEvent('Potion Mana digunakan');
        }
    } else { 
        logMessage(`⚠️ Potion Mana habis.`, 'other'); 
    }
    saveGameData(); updateStats();
}

// ==========================================================================
// Pasang Event dengan Event Delegation
// Supaya saat panel/elemen menu disembunyikan/diganti-render, kita tidak perlu
// removeEventListener() satu per satu.
// ==========================================================================
const delegatedActionHandler = (e) => {
    const btn = e.target && e.target.closest ? e.target.closest('button') : null;
    if (!btn || !btn.id) return;

    switch (btn.id) {
        case 'btn-explore':
            actionExplore();
            break;
        // tombol serang dihapus (manual attack nonaktif)
        case 'btn-attack':
            break;
        case 'panel-use-potion':
            actionPotion();
            break;
        case 'panel-use-mana-potion':
            actionManaPotion();
            break;
    }
};

// Potion buttons live in the left status panel; delegate from their shared root.
const gameActionContainer = document.getElementById('game-container');
window.addEventListener('battle-visuals-ready', event => {
    updateStats();
    if (event.detail?.transitionCompleted && inBattle && currentEnemy?.name.includes('BOSS')) showBossEncounterAnimation();
});
if (gameActionContainer) {
    gameActionContainer.addEventListener('click', delegatedActionHandler);
}

function returnToTavern(force = false, reason = 'abandoned') {
    centerPanel.querySelector('.boss-encounter-overlay')?.remove();
    syncPartyHealth();
    const restoreDungeonHp=Number.isFinite(GameDungeons.state(player).active?.healthBefore?.hero);
    GameDungeons.end(player, reason);
    inBattle = false;
    currentEnemy = null;
    isAutoPlaying = false;
    isGameStarted = false;
    stopBattleTimers();
    lastPlayerAttackAt = 0;
    if (afkActivationTimeout) { clearTimeout(afkActivationTimeout); afkActivationTimeout = null; }
    isAfkMode = false;
    isAfkResumeRequired = false;
    suppressSkillSound = false;
    hideAfkResumeOverlay();
    resetAfkSummary();
    player.combatBuffs = [];
    player.debuffs = [];
    playerParty = [];
    if(!restoreDungeonHp)player.hp = getPlayerTotalStats().totalMaxHp;
    player.mana = player.maxMana;
    syncTypedStatsFromActors();
    if (btnAuto) {
        btnAuto.textContent = 'Auto: OFF';
        btnAuto.classList.remove('btn-auto-on');
        btnAuto.classList.add('btn-auto-off');
    }
    if (panelUsePotion) panelUsePotion.disabled = false;
    if (panelUseManaPotion) panelUseManaPotion.disabled = false;
    if (centerPanel) centerPanel.removeAttribute('data-preserve-stage');
    const notice = document.getElementById('respawn-notice');
    if (notice) notice.classList.add('hidden');
    updateEnemyDebuffsUI();
    updatePlayerBuffsUI();
    saveGameData(true);
    updateStats();
    logMessage(restoreDungeonHp?'🏠 Kamu kembali ke Kedai — HP party kembali seperti sebelum masuk Dungeon.':'🏠 Kamu kembali ke Kedai — HP dan Mana pulih penuh.', 'other');
    const btnReturnHide = document.getElementById('btn-return-tavern');
    if (btnReturnHide) btnReturnHide.style.display = 'none';
}

// Event listener untuk tombol "Mulai Petualangan"
if (btnStartAdventure) {
    btnStartAdventure.addEventListener('click', () => {
        const notice = document.getElementById('respawn-notice');
        if (notice) notice.classList.add('hidden');
        isGameStarted = true;
        logMessage('⚔️ Kamu meninggalkan kedai dan siap untuk berpetualang!', 'other');
        updateStats(); // Panggil updateStats untuk menggambar ulang UI ke mode pertarungan
        // show return-to-tavern button only when adventure started
        const btnReturn = document.getElementById('btn-return-tavern');
        if (btnReturn) btnReturn.style.display = 'inline-flex';
    });
}

// Return to tavern button (small on battlefield)
if (btnReturnTavern) {
    btnReturnTavern.addEventListener('click', () => {
        // Prevent returning while an enemy is alive/active
        if (currentEnemy && currentEnemy.hp > 0) {
            playSound('error');
            Swal.fire({ title: 'Tidak Bisa Kembali', text: 'Masih ada musuh di medan tempur! Kalahkan terlebih dahulu.', icon: 'warning', confirmButtonText: 'Mengerti' });
            return;
        }

        // Confirm with SweetAlert2 before returning to tavern
        Swal.fire({
            title: 'Kembali ke Kedai?',
            text: 'Kamu akan meninggalkan pertempuran. HP & Mana akan pulih penuh di Kedai.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Ya, kembali',
            cancelButtonText: 'Batal',
            reverseButtons: true
        }).then((result) => {
            if (result.isConfirmed) {
                returnToTavern();
            }
        });
    });
}

// Return to "Mulai Petualangan" button (restore HP & Mana)
if (btnReturnAdventure) {
    btnReturnAdventure.addEventListener('click', () => {
        // Prevent returning while a live enemy remains on the battlefield
        if (currentEnemy && currentEnemy.hp > 0) {
            playSound('error');
            Swal.fire({ 
                title: 'Tidak Bisa Kembali', 
                text: 'Masih ada musuh di medan tempur! Kalahkan musuh terlebih dahulu.', 
                icon: 'warning', 
                confirmButtonText: 'Mengerti' 
            });
            return;
        }

        // Confirm before returning to adventure start
        Swal.fire({
            title: 'Kembali ke Mulai Petualangan?',
            text: 'HP dan Mana akan dipulihkan penuh. Kamu kembali ke layar awal petualangan.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Ya, kembali',
            cancelButtonText: 'Batal',
            reverseButtons: true
        }).then((result) => {
            if (result.isConfirmed) {
                returnToTavern();
            }
        });
    });
}

// Focus mode removed — no runtime handler.
GameStorage.onReady(() => {
    loadGameData();
    updateStats();
});

// =========================================================================
// 9. EVENT ALOKASI UPGRADE ATRIBUT (ALLOCATE STATS POINTS)
// =========================================================================
function executeUpgrade(statName) {
    if (!['hp', 'mana', 'attack', 'defense', 'magic', 'dodge', 'aspd'].includes(statName)) return;
    if (player.statPoints <= 0) { alert("Poin Atribut tidak cukup!"); return; }
    player.statPoints--; 

    switch(statName) {
        case 'hp': player.maxHp += 15; player.hp += 15; break;
        case 'mana': player.maxMana += 15; player.mana = Math.min(player.maxMana,player.mana+15); break;
        case 'attack': player.baseAttack += 1; break;
        case 'defense': player.baseDefense += 1; break;
        case 'magic': player.magicDamage += 1; break; 
        case 'dodge': player.baseDodge += 1; break; 
        case 'aspd': player.attackSpeed += 1; break; 
    }
    saveGameData(statName==='mana'); updateStats();
}

if(btnUpHp) btnUpHp.addEventListener('click', () => executeUpgrade('hp'));
if(btnUpMana) btnUpMana.addEventListener('click', () => executeUpgrade('mana'));
if(btnUpAtk) btnUpAtk.addEventListener('click', () => executeUpgrade('attack'));
if(btnUpDef) btnUpDef.addEventListener('click', () => executeUpgrade('defense'));
if(btnUpMagic) btnUpMagic.addEventListener('click', () => executeUpgrade('magic'));
if(btnUpDodge) btnUpDodge.addEventListener('click', () => executeUpgrade('dodge'));
if(btnUpAspd) btnUpAspd.addEventListener('click', () => executeUpgrade('aspd'));

// =========================================================================
// 10. NAVIGASI PINDAH HALAMAN GAME (SCENE NAVIGATION) - DYNAMIC VERSION
// =========================================================================
// =========================================================================
// 10. NAVIGASI PINDAH HALAMAN GAME (SCENE NAVIGATION) - EVENT DELEGATION
// =========================================================================
// Catatan performa:
// - Jangan pasang addEventListener('click') di setiap tombol menu (Mining, Chop,
//   Tempa, Kedai). Pakai 1 listener pada kontainer utama game.
// - Gunakan e.target.id untuk menentukan tombol mana yang diklik.

const navigationRouteByBtnId = {
    'btn-go-toko': '../Toko/Toko.html',
    'btn-go-alchemy': '../Alchemy/alchemy.html',
    'btn-go-inventory': '../Inventory/inventory.html',
    'btn-go-skills': '../Skills/skill_selection.html',
    'btn-go-tavern': '../Tavern/tavern.html',
    'btn-go-mining': '../Gathering/mining.html',
    'btn-go-chopping': '../Gathering/chopping.html',
    'btn-change-hero': '../Hero/hero.html'
};

function battleNavigationLocked() { return isGameStarted && !window.SagaGMTrial; }
function useAdventureInventory() { return isGameStarted && !window.SagaGMTrial; }
function closeBattleInventory() {
    const panel=document.getElementById('battle-inventory');
    if(panel)panel.hidden=true;
    document.getElementById('btn-go-inventory')?.setAttribute('aria-expanded','false');
}
function renderBattleInventory() {
    const panel=document.getElementById('battle-inventory');
    if(!panel||panel.hidden)return;
    const entries=Object.entries(player.inventory||{}).filter(([,qty])=>Number(qty)>0).map(([name,qty])=>({name,qty}));
    for(const item of player.items||[])if(item&&item.name&&Number(item.qty??1)>0)entries.push({...item,qty:item.qty??1});
    entries.unshift({id:'hp',name:'Potion HP',qty:player.potions||0},{id:'potion_mana',name:'Potion Mana',qty:player.manaPotions||0});
    const list=document.getElementById('battle-inventory-items');
    const key=JSON.stringify(entries);
    if(list.dataset.contents===key)return;
    list.replaceChildren();
    for(const item of entries){
        const row=document.createElement('div');row.className='battle-inventory-item';
        row.title=`${item.name} (${item.qty})`;
        row.append(GameItemCatalog.createVisual(item));
        const name=document.createElement('span');name.textContent=item.name;
        const qty=document.createElement('strong');qty.textContent=`×${item.qty}`;
        row.append(name,qty);list.append(row);
    }
    for(let i=entries.length;i<16;i++){
        const empty=document.createElement('div');empty.className='battle-inventory-item is-empty';empty.setAttribute('aria-hidden','true');list.append(empty);
    }
    list.dataset.contents=key;
}
function syncBattleNavigation() {
    const locked=battleNavigationLocked();
    for(const button of document.querySelectorAll('.adventure-menu button')){
        if(button.id!=='btn-go-inventory'&&button.disabled!==locked)button.disabled=locked;
    }
    const gathering=document.querySelector('.gathering-menu');
    if(gathering){gathering.querySelector('summary').setAttribute('aria-disabled',String(locked));if(locked)gathering.open=false;}
    if(btnReturnAdventure)btnReturnAdventure.disabled=inBattle&&!window.SagaGMTrial;
    if(!useAdventureInventory())closeBattleInventory();else renderBattleInventory();
}
if(gameContainerEl)gameContainerEl.addEventListener('click',event=>{
    const inventory=event.target.closest('#btn-go-inventory');
    if(inventory&&useAdventureInventory()){
        event.preventDefault();event.stopImmediatePropagation();
        const panel=document.getElementById('battle-inventory');panel.hidden=!panel.hidden;
        inventory.setAttribute('aria-expanded',String(!panel.hidden));renderBattleInventory();return;
    }
    if(!battleNavigationLocked())return;
    if(event.target.closest('.adventure-menu')||(inBattle&&event.target.closest('#btn-return-adventure'))){event.preventDefault();event.stopImmediatePropagation();}
},true);
document.getElementById('close-battle-inventory')?.addEventListener('click',()=>{closeBattleInventory();document.getElementById('btn-go-inventory').focus();});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!document.getElementById('battle-inventory').hidden){closeBattleInventory();document.getElementById('btn-go-inventory').focus();}});
window.addEventListener('resize',syncBattleNavigation);

function handleNavigationClick(e) {
    const btn = e.target && e.target.closest ? e.target.closest('button') : null;
    if (!btn || !btn.id) return;

    const href = navigationRouteByBtnId[btn.id];
    if (!href) return;
    if(battleNavigationLocked())return;

    saveGameData(true);
    window.location.href = href;
}

if (gameContainerEl) {
    gameContainerEl.addEventListener('click', handleNavigationClick);
}

// btn-go-craft punya logika khusus per base class, sehingga tetap ditangani terpisah




// Crafting reads the active class from the saved character.
if(btnGoCraft) {
    btnGoCraft.onclick = null;
    btnGoCraft.addEventListener('click', () => { 
        saveGameData(true); 
        window.location.href = '../Crafting/crafting.html';
    }); 
}


// bindNavigationButton belum tentu tersedia (mis. karena script gagal load sebelum definisi).
// Pakai fallback: navigasi langsung.
try {
    if (typeof bindNavigationButton === 'function') {
        bindNavigationButton('btn-change-hero', '../Hero/hero.html');
    } else {
        const _btnChangeHero = document.getElementById('btn-change-hero');
        if (_btnChangeHero) _btnChangeHero.addEventListener('click', () => window.location.href = '../Hero/hero.html');
    }
} catch (e) {
    const _btnChangeHero = document.getElementById('btn-change-hero');
    if (_btnChangeHero) _btnChangeHero.addEventListener('click', () => window.location.href = '../Hero/hero.html');
}


// Party manager: open modal to choose up to 3 allies to be active in battle
function openPartyManager() {
    if (inBattle) { Swal.fire('Formasi Terkunci', 'Atur formasi setelah pertempuran selesai.', 'info'); return; }
    const roster = [...new Set(player.party || [])].filter(id => allyDatabase[id]);
    const selector = (key, actor) => `<select data-formation="${key}" aria-label="Posisi ${GameCore.escapeHtml(actor.name || 'Pemain')}"><option value="front" ${GameFormation.position(player, actor) === 'front' ? 'selected' : ''}>Frontline</option><option value="back" ${GameFormation.position(player, actor) === 'back' ? 'selected' : ''}>Backline</option></select>`;
    let html = `<div class="formation-editor"><p>Frontline berbobot target 3× Backline. Knight/Paladin mendapat bobot tambahan 1,5×. Taunt tetap prioritas. Backline menerima 20% lebih sedikit damage serangan langsung selama ada Frontline hidup. Damage efek berkala tetap mengikuti aturan debuff.</p><label>Pemain ${selector('hero', player)}</label>`;
    roster.forEach(id => {
        const base = allyDatabase[id], inst = player.allies?.[id] || {};
        const status = GameCore.allyHealth(base, inst);
        html += `<div><label><input type="checkbox" data-id="${id}" ${inst.active ? 'checked' : ''}> <strong>${base.name}</strong> (${base.class}) HP ${status.hp}/${status.maxHp}</label>${selector(id, base)}</div>`;
    });
    html += '</div>';
    Swal.fire({
        title: 'Party & Formasi (maks 3 rekan)', html, showCancelButton: true, confirmButtonText: 'Simpan', focusConfirm: false,
        preConfirm: () => {
            const ids = [...document.querySelectorAll('.formation-editor [data-id]:checked')].map(node => node.dataset.id);
            if (ids.length > 3) { Swal.showValidationMessage('Pilih maksimal 3 rekan untuk bertempur.'); return false; }
            const positions = Object.fromEntries([...document.querySelectorAll('[data-formation]')].map(node => [node.dataset.formation, node.value]));
            return { ids, positions };
        }
    }).then(res => {
        if (!res.isConfirmed) return;
        if (inBattle) { Swal.fire('Formasi Terkunci', 'Pertempuran sudah dimulai. Pengaturan belum diubah.', 'info'); return; }
        const chosen = Array.isArray(res.value) ? res.value : res.value?.ids || [];
        if (chosen.length > 3 || chosen.some(id => !roster.includes(id))) return;
        try {
            syncPartyHealth();
            const next = JSON.parse(JSON.stringify(player));
            next.formation = GameFormation.configure(player, Array.isArray(res.value) ? {} : res.value?.positions || {});
            for (const id of roster) { next.allies[id] ||= {}; next.allies[id].active = chosen.includes(id); }
            GameStorage.savePlayer(next, { rpg_items: JSON.stringify(purchasedItems) });
            player.formation = next.formation;
            for (const id of roster) { player.allies[id] ||= {}; player.allies[id].active = chosen.includes(id); }
            updateStats(); Swal.fire('Sukses', 'Party dan formasi disimpan.', 'success');
        } catch (error) { Swal.fire('Belum Tersimpan', error.message, 'error'); }
    });
}

// bind manage party button
const btnManageParty = document.getElementById('btn-manage-party');
if (btnManageParty) btnManageParty.addEventListener('click', openPartyManager);

function findBestSkillToUse() {
    if (!inBattle || !currentEnemy || !Array.isArray(player.skills)) return null;

    const availableSkills = player.skills
        .map(s => ({ ...skillDatabase[s.id], ...s }))
        .filter(skill =>
            skill &&
            isSkillAllowedForPlayer(skill.id) &&
            (skill.readyAt || 0) <= Date.now() &&
            player.mana >= skill.cost
        );

    if (availableSkills.length === 0) return null;

    const { totalMaxHp } = getPlayerTotalStats();
    const hpPercent = (player.hp / totalMaxHp) * 100;
    const enemyHpPercent = (currentEnemy.hp / currentEnemy.maxHp) * 100;

    let bestSkill = null;
    let highestPriority = -1;

    for (const skill of availableSkills) {
        let currentPriority = skill.priority || 1;
        let conditionMet = false;

        switch (skill.category) {
            case 'shield':
            case 'heal':
                if (hpPercent < 60) {
                    conditionMet = true;
                    currentPriority += 20; // Sangat penting
                }
                break;

            case 'buff_def':
            case 'buff_atk':
            case 'buff_aspd':
            case 'buff_dodge':
            case 'buff_matk':
                const isBuffActive = (player.combatBuffs || []).some(b => b.source === skill.id);
                if (!isBuffActive) {
                    conditionMet = true;
                    currentPriority += 15; // Penting di awal
                }
                break;

            case 'debuff_dot':
                const isDebuffActive = (currentEnemy.debuffs || []).some(d => d.type === 'poison' || d.type === 'burn');
                if (!isDebuffActive) {
                    conditionMet = true;
                    currentPriority += 15;
                }
                break;

            case 'execute':
                if (enemyHpPercent < 30) {
                    conditionMet = true;
                    currentPriority += 25; // Prioritas tertinggi
                }
                break;

            default: // 'damage', 'nuke', atau kategori tidak dikenal
                conditionMet = true;
                break;
        }

        if (conditionMet && currentPriority > highestPriority) {
            highestPriority = currentPriority;
            bestSkill = skill;
        }
    }

    return bestSkill ? bestSkill.id : null;
}

// =========================================================================
// 11. MODUL KECERDASAN BUATAN / AUTO BOT (AI LOOP SYSTEM)
// =========================================================================
const btnAuto = document.getElementById('btn-auto');

if (btnPotionThreshold) {
    btnPotionThreshold.addEventListener('click', function() {
        let userInput = prompt("Masukkan batas sisa darah % untuk auto minum ramuan (1 - 99):", player.potionThreshold || 35);
        if (userInput !== null) {
            let parsedValue = parseInt(userInput, 10);
            if (!isNaN(parsedValue) && parsedValue > 0 && parsedValue < 100) {
                player.potionThreshold = parsedValue;
                this.innerHTML = `<i class="fa-solid fa-gear"></i> Potion: ${player.potionThreshold}%`;
                saveGameData();
                updateStats();
                alert(`Batas pemakaian ramuan otomatis disetel ke: ${player.potionThreshold}%`);
            } else {
                alert("Input salah! Masukkan angka bulat saja di antara rentang 1 hingga 99.");
            }
        }
    });
}

function runAiLoop() {
    if (document.hidden || offlineSuspended || offlineSettling) return;
    // Always respect auto state
    if (!isAutoPlaying || !isGameStarted || player.hp <= 0) return;

    if (document.hidden) {
        suppressSkillSound = true;
    } else {
        suppressSkillSound = false;
    }

    let nextDelay = 800;
    try {
        const { totalAspd, totalMaxHp } = getPlayerTotalStats();
        const battleDelay = getAttackDelayMs(totalAspd);
        const maxHpAktif = totalMaxHp;
        const currentHpPercent = Math.floor((player.hp / maxHpAktif) * 100);
        const thresholdAman = player.potionThreshold !== undefined ? player.potionThreshold : 35;

        // 1. Prioritas utama: Minum Potion HP jika sekarat
        if (currentHpPercent <= thresholdAman && player.potions > 0 && player.hp < maxHpAktif) {
            try { actionPotion(); } catch (e) { }
            nextDelay = 900;
        } else if (inBattle) {
            // 2. Prioritas kedua: Minum Potion Mana jika mana habis
            const currentManaPercent = Math.floor((player.mana / player.maxMana) * 100);
            if (currentManaPercent <= 20 && player.manaPotions > 0 && player.mana < player.maxMana) {
                try { actionManaPotion(); } catch (e) { }
                nextDelay = 900;
            } else {
                // 3. Prioritas ketiga: Gunakan skill terbaik berdasarkan logika AI
                const bestSkillId = findBestSkillToUse();

                if (bestSkillId) {
                    if (player.hp <= 0 || !inBattle || !currentEnemy) return; // Gembok keamanan
                    try { useSkill(bestSkillId); } catch (e) { console.error(e); logMessage('Error saat menggunakan skill: ' + e.message, 'other'); }
                    nextDelay = battleDelay;
                } else {
                    // 4. Auto-attack harus selalu patuh cooldown gate
                    if (!canPlayerAttackNow()) {
                        const cdLeft = getAttackCooldownRemainingMs();
                        nextDelay = (cdLeft > 0 ? cdLeft : battleDelay) + 25;
                    } else {
                        let isMonsterKilled = false;
                        try {
                            isMonsterKilled = actionAttack();
                        } catch (e) {
                            console.error(e);
                        }
                        nextDelay = isMonsterKilled ? 1500 : battleDelay;
                    }
                }
            }
        } else {
            try { actionExplore(); } catch (e) { console.error(e); }
            nextDelay = 1000;
        }
    } catch (e) {
        console.error('runAiLoop error', e);
        logMessage('Terjadi kesalahan AI: ' + (e && e.message ? e.message : e), 'other');
        nextDelay = 1200;
    }

    // schedule next run only if still auto-playing
    if (isAutoPlaying) {
        if (autoTimeoutId) clearTimeout(autoTimeoutId);
        autoTimeoutId = setTimeout(runAiLoop, nextDelay);
    }
}


// Guard: auto loop harus jalan hanya saat game sudah dimulai dan enemy ada.
// Ini mencegah kasus "auto atk/potion tidak jalan" ketika tombol ditekan
// tetapi state inBattle/currentEnemy belum siap.
const __origSetAutoGuard = () => {
    if (!isAutoPlaying) return;
    if (!isGameStarted) return;
    if (!inBattle || !currentEnemy) {
        // tunggu state battle terbentuk
        if (autoTimeoutId) clearTimeout(autoTimeoutId);
        autoTimeoutId = setTimeout(runAiLoop, 400);
    }
};


if (btnAuto) {
    btnAuto.addEventListener('click', function() {
        if (player.hp <= 0) return alert("Tidak bisa Auto saat HP habis.");
        if (isAutoPlaying) {
            isAutoPlaying = false; if (autoTimeoutId) clearTimeout(autoTimeoutId);
            this.innerText = "Auto: OFF";
            this.classList.remove('btn-auto-on');
            this.classList.add('btn-auto-off');
            // Preserve current stage background class to avoid flicker when toggling Auto OFF
            try {
                if (centerPanel) centerPanel.setAttribute('data-preserve-stage','1');
                updateStats();
                if (centerPanel) centerPanel.removeAttribute('data-preserve-stage');
            } catch (e) { try { updateStats(); } catch(e2){} if (centerPanel) centerPanel.removeAttribute('data-preserve-stage'); }
        } else {
            isAutoPlaying = true;
            this.innerText = "Auto: ON";
            this.classList.remove('btn-auto-off');
            this.classList.add('btn-auto-on');
            updateStats();
            // Jalankan AI (walau belum siap, AI loop akan menunggu sampai state battle terbentuk)
            runAiLoop();
        }
        saveGameData(true);
    });

}


// Autosave:

// - selama pertarungan (inBattle) simpan dimatikan agar data “dikunci” di RAM.
// - saat di luar pertarungan, simpan otomatis berkala.
// - juga disimpan setiap kali pemain pindah menu utama.
let __lastAutoSaveAt = 0;
function shouldAutoSave(now, intervalMs) {
    if (!player) return false;
    if (document.hidden || offlineSuspended || offlineSettling) return false;
    if (inBattle) return false;
    if (now - __lastAutoSaveAt < intervalMs) return false;
    __lastAutoSaveAt = now;
    return true;
}

// Auto-save interval tetap jarang, cukup setiap 10 detik.
autoSaveIntervalId = setInterval(() => {
    const now = Date.now();
    if (!shouldAutoSave(now, 10000)) return;
    try { saveGameData(); } catch(e){}
}, 10000);


// Sistem Regenerasi Mana Pasif (Game Tick min 200ms..500ms untuk UI refresh)
// Regenerasi mana dibuat lebih jarang agar tidak membebani render.
manaRegenIntervalId = setInterval(() => {
    if (document.hidden) return;
    if (!player) return;

    // throttle: hanya regen bila di luar pertempuran (biar tidak terasa spam)
    if (inBattle) return;

    const partyChanged = regeneratePartyMana();

    if (player.mana < player.maxMana) {
        const regenAmount = Math.floor(player.maxMana * 0.01) + 1; // 1% dari Max Mana + 1
        player.mana = Math.min(player.maxMana, player.mana + regenAmount);
        // updateStats hanya saat memang ada perubahan nilai
        updateStats();
    }
    else if (partyChanged) updateStats();
}, 3000); // tetap 3s untuk regen, tapi tidak mengubah HP/Mana UI setiap tick 1ms

// =========================================================================
// 13. PANEL KATEGORI FILTER LOG (CHAT/COMBAT LOG FILTER)
// =========================================================================
window.filterLog = function(category) {
    const tabs = document.querySelectorAll(".log-tabs .tab-btn");
    tabs.forEach(tab => tab.classList.remove("active"));
    const clickEvent = window.event;
    if (clickEvent && clickEvent.target) clickEvent.target.classList.add("active");

    const boxes = document.querySelectorAll(".log-content-box");
    boxes.forEach(box => box.style.display = "none");

    const targetBox = document.getElementById(`log-${category}`);
    if (targetBox) targetBox.style.display = "block";
};

// =========================================================================
// 16. INITIAL BOOTING RUNNING
// =========================================================================
updateStats();

// No local avatar picker — avatars are class-based image files in ../Avatar/

// Periodic update for enemy debuff UI (renders badges with remaining time)

function updateEnemyDebuffsUI() {
    renderEnemyDebuffs();
}


// Render active player buffs and debuffs into #player-buffs
function formatRemainingTime(seconds) {
    if (seconds <= 0) return '0s';
    if (seconds >= 60) {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return secs > 0 ? `${minutes}m ${secs}s` : `${minutes}m`;
    }
    return `${seconds}s`;
}

function getBuffLabel(type, source) {
    if (!type) return 'Buff';
    const map = { atk: 'Serangan', def: 'Pertahanan', aspd: 'Attack Speed', magic: 'Magic', dodge: 'Dodge' };
    const label = map[type] || capitalize(type);
    return source === 'store' ? `${label} (Toko)` : label;
}

function getBuffIcon(type) {
    if (!type) return '<i class="fa-solid fa-circle"></i>';
    if (type === 'atk') return '<i class="fa-solid fa-sword" style="color:#eab308"></i>';
    if (type === 'def') return '<i class="fa-solid fa-shield" style="color:#10b981"></i>';
    if (type === 'aspd') return '<i class="fa-solid fa-bolt" style="color:#6366f1"></i>';
    if (type === 'magic') return '<i class="fa-solid fa-magic" style="color:#8b5cf6"></i>';
    if (type === 'dodge') return '<i class="fa-solid fa-person-running" style="color:#38bdf8"></i>';
    return `<i class="fa-solid fa-circle"></i>`;
}

function getActiveLocalStorageBuffs() {
    const now = Date.now();
    const keys = ['buff_atk', 'buff_def', 'buff_magic', 'buff_aspd', 'buff_dodge'];
    return keys.reduce((list, key) => {
        const expiresAt = parseInt(GameStorage.getItem(key), 10);
        if (!expiresAt || isNaN(expiresAt) || expiresAt <= now) return list;
        const stat = key.replace('buff_', '');
        const remaining = Math.max(0, Math.ceil((expiresAt - now) / 1000));
        list.push({ stat, source: 'store', expiresAt, remaining });
        return list;
    }, []);
}

function updatePlayerBuffsUI() {
    if (document.hidden || isAfkResumeRequired) return;
    const container = playerBuffsContainer || document.getElementById('player-buffs');
    if (!container) return;
    if (!player || !inBattle || !currentEnemy) {
        container.innerHTML = '';
        container.style.display = 'none';
        return;
    }

    const now = Date.now();
    const buffs = (player.combatBuffs || []).filter(b => !b.expiresAt || b.expiresAt > now);
    const localBuffs = getActiveLocalStorageBuffs();
    const effectiveBuffs = buffs.concat(localBuffs);
    const debuffs = (player.debuffs || []).filter(d => !d.expiresAt || d.expiresAt > now);
    if (effectiveBuffs.length === 0 && debuffs.length === 0) { container.innerHTML = ''; container.style.display = 'none'; lastPlayerBuffKey = ''; return; }

    const buffKey = effectiveBuffs.map(b => {
        const remaining = b.expiresAt ? Math.max(0, Math.ceil((b.expiresAt - now) / 1000)) : (b.remaining != null ? b.remaining : '-');
        return `${b.stat}:${b.source || 'combat'}:${remaining}`;
    }).join('|');
    const debuffKey = debuffs.map(d => {
        const remaining = d.expiresAt ? Math.max(0, Math.ceil((d.expiresAt - now) / 1000)) : '-';
        return `${d.type}:${remaining}`;
    }).join('|');
    const currentKey = `${buffKey}|${debuffKey}`;
    if (currentKey === lastPlayerBuffKey && container.children.length > 0) {
        return;
    }
    lastPlayerBuffKey = currentKey;

    const fragment = document.createDocumentFragment();

    effectiveBuffs.forEach(b => {
        const remaining = b.expiresAt ? Math.max(0, Math.ceil((b.expiresAt - now) / 1000)) : (b.remaining != null ? b.remaining : '-');
        const item = document.createElement('div');
        item.className = 'buff-item';
        item.setAttribute('data-type', b.stat || 'buff');

        const iconWrap = document.createElement('div');
        iconWrap.className = 'buff-icon';
        iconWrap.innerHTML = getBuffIcon(b.stat);

        const meta = document.createElement('div');
        meta.className = 'buff-meta';

        const nameDiv = document.createElement('div');
        nameDiv.className = 'buff-name';
        nameDiv.textContent = getBuffLabel(b.stat, b.source);

        const timeDiv = document.createElement('div');
        timeDiv.className = 'buff-time';
        timeDiv.textContent = formatRemainingTime(remaining === '-' ? 0 : remaining);

        meta.appendChild(nameDiv);
        meta.appendChild(timeDiv);
        item.appendChild(iconWrap);
        item.appendChild(meta);
        fragment.appendChild(item);
    });

    debuffs.forEach(d => {
        const remaining = d.expiresAt ? Math.max(0, Math.ceil((d.expiresAt - now) / 1000)) : '-';
        const item = document.createElement('div');
        item.className = 'debuff-item';
        item.setAttribute('data-type', d.type || 'debuff');

        const iconHtml = debuffIcon(d.type) || '<i class="fa-solid fa-circle"></i>';
        const iconWrap = document.createElement('div');
        iconWrap.className = 'debuff-icon';
        iconWrap.innerHTML = iconHtml;

        const meta = document.createElement('div');
        meta.className = 'debuff-meta';
        const nameDiv = document.createElement('div');
        nameDiv.className = 'debuff-name';
        nameDiv.textContent = debuffLabel(d.type);
        const timeDiv = document.createElement('div');
        timeDiv.className = 'debuff-time';
        timeDiv.textContent = formatRemainingTime(remaining === '-' ? 0 : remaining);
        meta.appendChild(nameDiv);
        meta.appendChild(timeDiv);

        item.appendChild(iconWrap);
        item.appendChild(meta);
        fragment.appendChild(item);
    });

    container.innerHTML = '';
    container.appendChild(fragment);
    container.style.display = 'flex';
}

// Periodic processing of player & party debuffs so every character receives ticks
debuffTickIntervalId = setInterval(() => {
    try {
        if (document.hidden || offlineSuspended || offlineSettling) return;
        if (!inBattle) return;
        let shouldRefresh = false;

        // Player
        if (player && player.debuffs && player.debuffs.length > 0) {
            const res = processEntityDebuffs(player);
            if (res.damage > 0) {
                shouldRefresh = true;
                if (player.hp <= 0) {
                    player.hp = 0;
                    logMessage(`💀 Kamu terbunuh oleh efek debuff!`, 'combat');
                }
            }
        }

        // Party members
        if (playerParty && playerParty.length > 0) {
            playerParty.forEach(member => {
                if (member.hp > 0 && member.debuffs && member.debuffs.length > 0) {
                    const r = processEntityDebuffs(member);
                    if (r.damage > 0) {
                        shouldRefresh = true;
                        if (member.hp <= 0) {
                            member.hp = 0;
                            logMessage(`💀 ${member.name} tewas karena efek debuff.`, 'combat');
                        }
                    }
                }
            });
        }

        if (inBattle && player.hp <= 0) handlePlayerDefeat();
        if (inBattle && currentEnemy && currentEnemy.hp <= 0) handleMonsterDefeat();
        if (shouldRefresh) {
            saveGameData(true);
            updateStats();
        }
        updatePlayerBuffsUI();
    } catch (e) { /* ignore */ }
}, 1000);

function createAfkResumeOverlay() {
    if (afkOverlayEl) return afkOverlayEl;

    const overlay = document.createElement('div');
    overlay.id = 'afk-resume-overlay';
    overlay.className = 'afk-resume-overlay';
    overlay.innerHTML = `
        <div class="afk-overlay-card">
            <h2 class="afk-overlay-title">Ringkasan AFK</h2>
            <p class="afk-overlay-text">Berikut hasil petualanganmu selama kamu pergi.</p>
            <div id="afk-summary" class="afk-summary"></div>
            <button id="afk-resume-button" class="afk-resume-button">Lanjutkan Petualangan</button>
        </div>
    `;

    overlay.querySelector('#afk-resume-button').addEventListener('click', resumeFromAfk);
    document.body.appendChild(overlay);
    afkOverlayEl = overlay;
    return overlay;
}

function updateAfkOverlaySummary() {
    if (!afkOverlayEl) return;
    const summaryEl = afkOverlayEl.querySelector('#afk-summary');
    if (!summaryEl) return;

    if (!afkSummary.active || !afkSummary.startedAt) {
        summaryEl.innerHTML = '<div class="afk-summary-line">Tidak ada data AFK yang tercatat.</div>';
        return;
    }

    const durationSeconds = Math.max(0, Math.round((Date.now() - afkSummary.startedAt) / 1000));
    const durationText = formatRemainingTime(durationSeconds);

    // Group item drops
    const itemDrops = {};
    afkSummary.messages.forEach(msg => {
        if (msg.startsWith('DROP: ')) {
            const itemName = msg.replace('DROP: ', '');
            itemDrops[itemName] = (itemDrops[itemName] || 0) + 1;
        }
    });

    let summaryHtml = `
        <div class="afk-summary-line"><strong><i class="fa-solid fa-clock"></i> Durasi:</strong> ${durationText}</div>
        <div class="afk-summary-line"><strong><i class="fa-solid fa-skull-crossbones"></i> Musuh:</strong> ${afkSummary.enemiesKilled}</div>
        <div class="afk-summary-line"><strong><i class="fa-solid fa-coins"></i> Gold:</strong> ${afkSummary.goldEarned} | <strong><i class="fa-solid fa-star"></i> EXP:</strong> ${afkSummary.expEarned}</div>
        <div class="afk-summary-line"><strong><i class="fa-solid fa-flask"></i> Potion HP:</strong> ${afkSummary.potionsUsed} | <strong><i class="fa-solid fa-wine-bottle"></i> Mana:</strong> ${afkSummary.manaPotionsUsed}</div>
    `;

    const droppedItemsArray = Object.entries(itemDrops);
    if (droppedItemsArray.length > 0) {
        summaryHtml += '<div class="afk-summary-list">';
        summaryHtml += '<div class="afk-summary-note"><strong>Item yang didapat:</strong></div>';
        droppedItemsArray.forEach(([name, qty]) => {
            summaryHtml += `<div class="afk-summary-note">• ${escapeHtml(name)} x${qty}</div>`;
        });
        summaryHtml += '</div>';
    }

    summaryEl.innerHTML = summaryHtml;
}

function showAfkResumeOverlay() {
    if (!isAfkMode) return;
    isAfkResumeRequired = true;
    createAfkResumeOverlay();
    updateAfkOverlaySummary();
    afkOverlayEl.classList.add('visible');
    if (centerPanel) centerPanel.style.filter = 'blur(4px) brightness(0.7)';
}

function hideAfkResumeOverlay() {
    if (!afkOverlayEl) return;
    afkOverlayEl.classList.remove('visible');
    if (centerPanel) centerPanel.style.filter = '';
}

function resumeFromAfk() {
    isAfkResumeRequired = false;
    if (afkSummary.active) {
        const durationText = formatRemainingTime(Math.round((Date.now() - afkSummary.startedAt) / 1000));
        logMessage(`📊 Ringkasan AFK (${durationText}): ${afkSummary.enemiesKilled} musuh, ${afkSummary.goldEarned} Gold, ${afkSummary.expEarned} EXP.`, 'other');
    }
    isAfkMode = false;
    suppressSkillSound = false;
    hideAfkResumeOverlay();
    updateStats();
    updateEnemyDebuffsUI();
    updatePlayerBuffsUI();
    if (afkSummary.active) resetAfkSummary();
    renderQuestPanel();
    logMessage('🔄 Kembali dari AFK. Pertempuran dilanjutkan.', 'other');
}

// A receipt only renders rewards that have already been committed to the save.
function showOfflineResults(summary = player.offlineProgress?.lastResult, onClose = () => {}) {
    if (!summary || document.getElementById('offline-results')) return;
    const dialog = document.createElement('dialog');
    dialog.id = 'offline-results';
    dialog.className = 'offline-results';
    dialog.setAttribute('tabindex', '-1');
    dialog.setAttribute('aria-labelledby', 'offline-results-title');
    const seconds = Math.floor(summary.durationMs / 1000);
    const duration = `${Math.floor(seconds / 3600)} jam ${Math.floor(seconds % 3600 / 60)} menit ${seconds % 60} detik`;
    const materials = Object.entries(summary.materials).map(([name, qty]) =>
        `<li><span data-item-asset="${escapeHtml(name)}">${escapeHtml(name)}</span><strong>&times;${qty.toLocaleString('id-ID')}</strong></li>`).join('');
    dialog.innerHTML = `
        <h2 id="offline-results-title">Hasil Petualangan Offline</h2>
        <p class="offline-subtitle">Hadiah sudah tersimpan. Maksimal farming offline 8 jam.</p>
        <dl><div><dt>Durasi farming</dt><dd>${duration}</dd></div>
        <div><dt>Monster dikalahkan</dt><dd>${summary.monstersKilled.toLocaleString('id-ID')}</dd></div>
        <div><dt>Total EXP</dt><dd>${summary.exp.toLocaleString('id-ID')}</dd></div>
        <div><dt>Total Gold</dt><dd>${summary.gold.toLocaleString('id-ID')}</dd></div></dl>
        <h3>Material Monster</h3><ul>${materials || '<li>Belum ada material diperoleh.</li>'}</ul>
        ${summary.stoppedEarly ? '<p class="offline-subtitle">Farming berhenti lebih awal karena HP tidak cukup untuk melanjutkan dengan aman.</p>' : ''}
        <button type="button">Lanjutkan</button>`;
    dialog.querySelector('button').onclick = () => dialog.close();
    dialog.addEventListener('close', () => { dialog.remove(); onClose(); }, { once: true });
    document.body.appendChild(dialog);
    GameItemAssets.decorate(dialog);
    dialog.showModal();
    dialog.focus({ preventScroll: true });
    dialog.scrollTop = 0;
}

function resumeOfflineSession() {
    offlineSuspended = false;
    suppressSkillSound = false;
    saveGameData(true);
    updateStats();
    updateEnemyDebuffsUI();
    updatePlayerBuffsUI();
    renderQuestPanel();
    if (document.hidden) {
        offlineSuspended = true;
        stopBattleTimers();
    } else if (isAutoPlaying && isGameStarted) runAiLoop();
}

async function settleHiddenProgress() {
    if (!offlineSuspended || offlineSettling || document.getElementById('offline-results')) return;
    offlineSettling = true;
    try {
        const summary = await GameOffline.claim(GameStorage);
        player = JSON.parse(GameStorage.getItem('rpg_player'));
        if (summary) {
            // Discard the paused encounter, without victory/quest/boss callbacks.
            inBattle = false;
            currentEnemy = null;
            playerParty = [];
            lastPlayerAttackAt = 0;
        }
        offlineSettling = false;
        if (document.hidden) return;
        if (summary) {
            updateStats();
            showOfflineResults(summary, resumeOfflineSession);
        } else resumeOfflineSession();
    } catch (error) {
        // Storage reports stale tabs/quota errors. Keep combat and saving paused.
        console.error('Offline progression:', error.message);
        offlineSettling = false;
    }
}

document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        if (!offlineSuspended && !offlineSettling) {
            saveGameData(true);
            offlineSuspended = true;
        }
        stopBattleTimers();
        suppressSkillSound = true;
    } else {
        settleHiddenProgress();
    }
});

// Helper to clear all buffs and debuffs (player, party, enemy)
function clearAllBuffsDebuffs() {
    if (player) { player.combatBuffs = []; player.debuffs = []; }
    if (playerParty && playerParty.length) {
        playerParty.forEach(m => { m.combatBuffs = []; m.debuffs = []; });
    }
    if (currentEnemy) { currentEnemy.debuffs = []; }
    logMessage('Semua buff dan debuff telah dihapus.', 'other');
    updateStats(); updateEnemyDebuffsUI();
}

// Helper to toggle global buff/debuff processing
function toggleBuffDebuff(enabled) {
    if (!player) return;
    player.settings = player.settings || {};
    player.settings.debuffsEnabled = !!enabled;
    if (!enabled) clearAllBuffsDebuffs();
    logMessage(`Buff/Debuff ${enabled ? 'diaktifkan' : 'dinonaktifkan'}.`, 'other');
    saveGameData(); updateStats();
}

// Expose helpers for console/temporary UI use
window.clearAllBuffsDebuffs = clearAllBuffsDebuffs;
window.toggleBuffDebuff = toggleBuffDebuff;

// =========================================================================
// 17. KELAS DAN PEMILIHAN KELAS (CLASS SELECTION)
// =========================================================================
const CLASS_UNLOCK_LEVEL = 5;

function maybePromptClassSelection(force = false) {
    if (!player || player.heroClass !== 'Warga') return;
    if (player.level < CLASS_UNLOCK_LEVEL) return;

    const alreadyShown = sessionStorage.getItem('rpg_class_prompt_shown') === '1';
    if (!force && alreadyShown) return;

    sessionStorage.setItem('rpg_class_prompt_shown', '1');
    Swal.fire({
        title: 'Kelas Sudah Terbuka!',
        text: `Kamu sudah level ${player.level}. Pilih kelasmu sekarang: Mage, Fighter, Archer, atau Assassin.`,
        icon: 'info',
        confirmButtonText: 'Pilih Kelas',
        background: '#1a1a1a',
        color: '#fff',
        confirmButtonColor: '#f59e0b'
    }).then((result) => {
        if (result.isConfirmed) {
            window.location.href = '../Hero/hero.html';
        }
    });
}

// Apply pending quest EXP, then offer class selection when unlocked.
// Recover older saves that were left at zero HP before automatic respawn existed.
GameAdventures.recover();
if (player.hp <= 0) returnToTavern(true);
checkLevelUp(!player.offlineProgress?.deferLevelQuest);
if (window.offlineStartupSummary) {
    showOfflineResults(window.offlineStartupSummary, () => maybePromptClassSelection(true));
    window.offlineStartupSummary = null;
} else maybePromptClassSelection(true);

// =========================================================================
// Developer controls are kept out of the normal game runtime.
