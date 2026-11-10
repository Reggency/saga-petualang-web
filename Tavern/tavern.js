// ==========================================================================
// TAVERN RECRUITMENT SYSTEM
// ==========================================================================

let player = {};
const ALLY_REVIVE_COST = 100;

function escapeHtml(str) {
    if (typeof str !== 'string') return str || '';
    return str.replace(/[&<>'"]/g, function (tag) {
        const chars = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        };
        return chars[tag] || tag;
    });
}

// Database Calon Anggota Party
const allyDatabase = GameAllyCatalog.allies;

// Each ally has a single built-in skill defined in `allyDatabase`.
// Skill selection UI removed — allies always use their default skill.
const skillDescriptionMap = GameAllyCatalog.skillDescriptions;

// Mapping dari target quest ke nama item di inventory untuk pengecekan
const questTargetToItemMap = {
    // Hunting (Target di quest adalah nama monster, value adalah nama item drop)
    'Goblin': 'Telinga Goblin',
    'Serigala': 'Kulit Serigala',
    'Orc Prajurit': 'Tengkorak Orc',
    'Slime': 'Lendir Slime',
    'Kelelawar': 'Sayap Kelelawar',
    'Mumi Kutukan': 'Kain Kafan Kuno',

    // Mining (Target di quest adalah nama resource, value adalah nama item di inventory)
    'Iron Ore': 'Iron Ore',
    'Silver Ore': 'Silver Ore',
    'Gold Ore': 'Gold Ore',
    'Copper Ore': 'Copper Ore',

    // Chopping (Target di quest adalah nama resource, value adalah nama item di inventory)
    'Kayu Pinus': 'Kayu Pinus',
    'Kayu Ek / Oak': 'Kayu Ek / Oak',
    'Kayu Mahoni': 'Kayu Mahoni',
    'Kayu Balsa': 'Kayu Balsa',
    'Kayu Purba / Elderwood': 'Kayu Purba / Elderwood',

    // Misi abstrak (selesai otomatis tanpa item)
    'Antar Bantuan': 'AUTO', 'Esensi Bantuan': 'AUTO',
    'Sesi Latihan': 'AUTO', 'Rangkaian Duel': 'AUTO'
};

// Deskripsi dan Hadiah Quest yang Lebih Baik
const REWARD_POOLS = {
    hunting: {
        common: ['Lendir Slime', 'Sayap Kelelawar', 'Taring Kecil'],
        rare: ['Kulit Serigala', 'Tengkorak Orc', 'Kain Kafan Kuno', 'Cakar Tajam'],
        epic: ['Bulu Yeti Tebal', 'Esensi Jiwa', 'Tanduk Iblis Api', 'Jimat Kutukan'],
        mythic: ['Inti Api Naga', 'Inti Kekosongan', 'Jantung Es Abadi']
    },
    mining: {
        common: ['Copper Ore', 'Iron Ore'],
        rare: ['Silver Ore', 'Gold Ore', 'Sengat Kristal'],
        epic: ['Titanium Ore', 'Pecahan Granit'],
        mythic: ['Mithril Ore', 'Batu Obsidian']
    },
    chopping: {
        common: ['Kayu Balsa', 'Kayu Pinus', 'Kayu Ek / Oak'],
        rare: ['Kayu Besi / Ironwood', 'Kayu Mahoni'],
        epic: ['Kayu Purba / Elderwood'],
        mythic: ['Kayu Purba / Elderwood']
    }
};

const QUEST_DESCRIPTIONS = {
    hunting: [
        "Seorang pedagang membutuhkan material dari {target} untuk ramuan. Bantu dia.",
        "Monster jenis {target} mengganggu jalur karavan. Basmi mereka.",
        "Kepala desa menawarkan imbalan bagi siapa saja yang bisa mengurangi populasi {target}.",
        "Buktikan kemampuanmu dengan berburu {amount} {target}."
    ],
    mining: [
        "Pandai besi lokal kehabisan {target}. Tambang beberapa untuknya.",
        "Sebuah permintaan datang untuk {amount} {target}. Peluang bagus untuk dapat emas.",
        "Uji beliung barumu dengan menambang {amount} {target}."
    ],
    chopping: [
        "Tukang kayu membutuhkan {amount} {target} untuk proyek terbarunya.",
        "Persediaan kayu di desa menipis. Kumpulkan {target} untuk warga.",
        "Latih kemampuan menebangmu dengan mengumpulkan {amount} {target}."
    ]
};

// Default stat presets per ally class to make recruits feel class-appropriate.
const getClassDefaults = GameAllyCatalog.classDefaults;

function loadPlayer() {
    const savedPlayer = GameStorage.getItem('rpg_player');
    if (savedPlayer) {
        player = JSON.parse(savedPlayer);
        player.gold = Number(player.gold) || 0;
        player.party = Array.isArray(player.party) ? player.party : [];
        player.allies = player.allies && typeof player.allies === 'object' ? player.allies : {};
        player.questBoard = Array.isArray(player.questBoard) ? player.questBoard : [];
        player.questReputationLevel = typeof player.questReputationLevel === 'number' ? player.questReputationLevel : 1;
        player.questCompletedCount = typeof player.questCompletedCount === 'number' ? player.questCompletedCount : 0;
        if (typeof player.questReputationExp !== 'number') {
            // Migrasi: berikan exp awal berdasarkan quest yang sudah selesai
            player.questReputationExp = (player.questCompletedCount || 0) * 5;
        }
        if (typeof player.questReputationMaxExp !== 'number') {
            player.questReputationMaxExp = 100 + ((player.questReputationLevel - 1) * 50);
        }
        if (!player.inventory || typeof player.inventory !== 'object') player.inventory = {};
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
    } else {
        window.location.href = '../Hero/hero.html';
    }
}

function savePlayer() {
    GameAchievements.observe(player);
    player = GameStorage.savePlayer(player);
}

function claimQuestReward(questId) {
    if (!questId) return;

    const list = (Array.isArray(player.quests) && player.quests) ||
        (Array.isArray(player.questBoard) && player.questBoard) ||
        [];

    const quest = list.find(q => q && q.id === questId);
    if (!quest || quest.claimed) return;

    // Wajib COMPLETED
    if (!(quest.status === 'COMPLETED' || quest.completed === true)) return;

    quest.claimed = true;

    const rewardGold = Number(quest.rewardGold || 0);
    const rewardExp = Number(quest.rewardExp || 0);

    player.gold = Number(player.gold || 0) + rewardGold;
    player.exp = Number(player.exp || 0) + rewardExp;

    savePlayer();
    updateUI();

    if (window.Swal) {
        Swal.fire({
            title: 'Hadiah diklaim!',
            text: `Anda menerima ${rewardGold} Gold dan ${rewardExp} EXP.`,
            icon: 'success',
            confirmButtonText: 'OK'
        });
    }
}



const QUEST_TYPES = [
    {
        key: 'hunting',
        label: 'Berburu Monster',
        icon: '🗡️',
        objectives: [
            // Target disesuaikan dengan nama monster di script.js
            { target: 'Goblin', min: 8, max: 14 },
            { target: 'Serigala', min: 5, max: 10 },
            { target: 'Orc Prajurit', min: 3, max: 6 },
            { target: 'Slime', min: 10, max: 20 },
            { target: 'Kelelawar', min: 8, max: 15 },
            { target: 'Mumi Kutukan', min: 3, max: 5 }
        ]
    },
    {
        key: 'mining',
        label: 'Menambang',
        icon: '⛏️',
        objectives: [
            // Target disesuaikan dengan nama resource di gathering.js
            { target: 'Copper Ore', min: 15, max: 25 },
            { target: 'Iron Ore', min: 10, max: 18 },
            { target: 'Silver Ore', min: 5, max: 10 },
            { target: 'Gold Ore', min: 3, max: 8 }
        ]
    },
    {
        key: 'chopping',
        label: 'Menebang Pohon',
        icon: '🪓',
        objectives: [
            // Target disesuaikan dengan nama resource di gathering.js
            { target: 'Kayu Balsa', min: 15, max: 25 },
            { target: 'Kayu Pinus', min: 10, max: 16 },
            { target: 'Kayu Ek / Oak', min: 5, max: 10 },
            { target: 'Kayu Mahoni', min: 2, max: 5 },
            { target: 'Kayu Purba / Elderwood', min: 1, max: 3 }
        ]
    },
    // Tipe quest 'forging' dan lainnya dihapus sesuai permintaan sebelumnya
];

const QUEST_RARITY_CONFIG = {
    common: { tag: 'Common', color: '#6cc37d', goldMin: 120, goldMax: 220, rep: 10 },
    rare: { tag: 'Rare', color: '#60a5fa', goldMin: 260, goldMax: 380, rep: 25 },
    epic: { tag: 'Epic', color: '#a855f7', goldMin: 430, goldMax: 600, rep: 50 },
    mythic: { tag: 'Mythic', color: '#f97316', goldMin: 650, goldMax: 820, rep: 100 }
};

const STAGE_7_MATERIALS = [
    { id: 'mat_inti_api_naga', name: 'Inti Api Naga' },
    { id: 'mat_batu_obsidian', name: 'Batu Obsidian' },
    { id: 'mat_esensi_jiwa', name: 'Esensi Jiwa' }
];

const QUEST_REFRESH_BASE_COST = 10;
const MAX_QUEST_SLOTS = 9;

function checkQuestReputationLevelUp() {
    if (!player.questReputationExp || !player.questReputationMaxExp) return;

    while (player.questReputationExp >= player.questReputationMaxExp) {
        if (player.questReputationLevel >= 10) {
            player.questReputationExp = player.questReputationMaxExp;
            break;
        }
        player.questReputationLevel++;
        player.questReputationExp -= player.questReputationMaxExp;
        player.questReputationMaxExp = Math.floor(player.questReputationMaxExp * 1.15);
        Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: `Reputasi Kedai Naik!`,
                html: `Kini mencapai <b>Level ${player.questReputationLevel} - ${getQuestReputationTitle(player.questReputationLevel)}</b>`,
                showConfirmButton: false,
                timer: 3500,
                background: '#13131c',
                color: '#cbd5e1'
        });
    }
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getQuestRarity(level) {
    const mythicChance = Math.min(2 + (level - 1) * 2, 12);
    const epicChance = Math.min(8 + (level - 1) * 4, 30);
    const rareChance = Math.min(25 + (level - 1) * 6, 45);
    const roll = getRandomInt(1, 100);
    if (roll <= mythicChance) return 'mythic';
    if (roll <= mythicChance + epicChance) return 'epic';
    if (roll <= mythicChance + epicChance + rareChance) return 'rare';
    return 'common';
}

function getQuestReputationTitle(level) {
    if (level >= 9) return 'Legendaris';
    if (level >= 7) return 'Ternama';
    if (level >= 5) return 'Terkenal';
    if (level >= 3) return 'Dikenal';
    return 'Pendatang';
}

function generateQuest() {
    const type = QUEST_TYPES[getRandomInt(0, QUEST_TYPES.length - 1)];
    const objective = type.objectives[getRandomInt(0, type.objectives.length - 1)];
    const amount = getRandomInt(objective.min, objective.max);
    const rarity = getQuestRarity(player.questReputationLevel || 1);
    const rewardConfig = QUEST_RARITY_CONFIG[rarity];
    const goldReward = getRandomInt(rewardConfig.goldMin, rewardConfig.goldMax);

    const rewardPool = REWARD_POOLS[type.key];
    const possibleRewards = rewardPool[rarity] || rewardPool.common;
    const materialName = possibleRewards[getRandomInt(0, possibleRewards.length - 1)];
    
    const materialCountMap = { common: getRandomInt(2, 4), rare: getRandomInt(2, 3), epic: getRandomInt(1, 2), mythic: 1 };
    const materialCount = materialCountMap[rarity];

    const descTemplate = QUEST_DESCRIPTIONS[type.key][getRandomInt(0, QUEST_DESCRIPTIONS[type.key].length - 1)];
    const description = descTemplate.replace('{target}', objective.target).replace('{amount}', amount);

    // Sesuaikan teks objektif berdasarkan tipe quest
    let objectiveText = '';
    if (type.key === 'hunting') {
        objectiveText = `Kalahkan ${amount} ${objective.target}`;
    } else {
        objectiveText = `Kumpulkan ${amount} ${objective.target}`;
    }

    return {
        id: `quest_${Date.now()}_${Math.random()}`,
        type: type.key,
        label: type.label,
        icon: type.icon,
        objective: objectiveText,
        target: objective.target,
        amount: amount,
        description: description,
        rarity,
        goldReward,
        rewardMaterial: {
            id: materialName.toLowerCase().replace(/\s/g, '_'),
            name: materialName,
            count: materialCount
        },
        completed: false,
        claimed: false
    };
}

function initQuestBoard() {
    if (!Array.isArray(player.questBoard)) player.questBoard = [];
    if (typeof player.questReputationLevel !== 'number') player.questReputationLevel = 1;
    if (typeof player.questCompletedCount !== 'number') player.questCompletedCount = 0;

    if (player.questBoard.length < MAX_QUEST_SLOTS) {
        player.questBoard = Array.from({ length: MAX_QUEST_SLOTS }, () => generateQuest());
    }

    const refreshButton = document.getElementById('btn-refresh-quests');
    if (refreshButton) {
        refreshButton.addEventListener('click', refreshQuestBoard);
    }

    renderQuestPanel();
}

function renderQuestPanel() {
    const questPanel = document.getElementById('quest-panel');
    if (!questPanel) return;
    questPanel.innerHTML = '';

    if (!Array.isArray(player.questBoard) || player.questBoard.length === 0) {
        questPanel.innerHTML = '<p class="no-quest-msg"><i>Belum ada misi. Klik refresh untuk mendapatkan papan misi baru.</i></p>';
        return;
    }

    player.questBoard = player.questBoard.slice(0, MAX_QUEST_SLOTS);

    player.questBoard.forEach((quest, index) => {
        const card = document.createElement('div');
        card.className = `quest-card ${quest.rarity}`;

        // Cek progres untuk UI
        const requiredItemName = questTargetToItemMap[quest.target] || quest.target;
        const currentAmount = (player.inventory && player.inventory[requiredItemName]) || 0;
        const requiredAmount = quest.amount;
        const isCompletable = currentAmount >= requiredAmount || requiredItemName === 'AUTO';
        const progressText = requiredItemName === 'AUTO' ? 'Otomatis' : `${currentAmount}/${requiredAmount}`;

        let buttonHtml;
        let buttonClass = '';
        if (quest.completed) {
            buttonHtml = `<button type="button" class="btn-claim" onclick="claimReward(${index})"><i class="fa-solid fa-gift"></i> Klaim Hadiah</button>`;
        } else if (isCompletable) {
            buttonClass = 'btn-completable'; // A new class for styling
            buttonHtml = `<button type="button" class="${buttonClass}" onclick="completeQuest(${index})"><i class="fa-solid fa-check-double"></i> Selesaikan Misi</button>`;
        } else {
            buttonHtml = `<button type="button" disabled><i class="fa-solid fa-hourglass-half"></i> Sedang Berjalan (${progressText})</button>`;
        }

        card.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;">
                <div>
                    <div class="quest-rarity ${quest.rarity}">${QUEST_RARITY_CONFIG[quest.rarity].tag}</div>
                    <div class="quest-title-row">${quest.icon} ${quest.label}</div>
                </div>
                <div style="font-weight:700;color:${QUEST_RARITY_CONFIG[quest.rarity].color};">Rep. Lv ${player.questReputationLevel}</div>
            </div>
            <div class="quest-description" style="margin: 8px 0; font-size: 0.9em; color: #cbd5e1;">${escapeHtml(quest.description)}</div>
            <div class="quest-objective" style="font-weight: bold; margin-bottom: 8px;">${escapeHtml(quest.objective)}</div>
            
            <div class="quest-rewards" style="margin-bottom: 12px; display: flex; flex-direction: column; gap: 4px; font-size: 0.85em;">
                <span class="reward-item"><i class="fa-solid fa-coins" style="color: #facc15;"></i> ${quest.goldReward} Gold</span>
                <span class="reward-item" data-item-asset="${escapeHtml(quest.rewardMaterial.name)}"><i class="fa-solid fa-gem" style="color: #60a5fa;"></i> ${quest.rewardMaterial.count}x ${escapeHtml(quest.rewardMaterial.name)}</span>
                <span class="reward-item"><i class="fa-solid fa-star" style="color: #c084fc;"></i> ${QUEST_RARITY_CONFIG[quest.rarity].rep} Reputasi</span>
            </div>
            ${buttonHtml}
        `;

        questPanel.appendChild(card);
        GameItemAssets.decorate(card);
        GameItemAssets.attach(card.querySelector('.quest-objective'), questTargetToItemMap[quest.target] || quest.target, { compact: true });
    });

    updateQuestBoardUI();
}

function updateQuestBoardUI() {
    const reputationInfo = document.getElementById('quest-reputation-info');
    const refreshCost = document.getElementById('quest-refresh-cost');
    const refreshButton = document.getElementById('btn-refresh-quests');
    const reputationBar = document.getElementById('quest-reputation-bar');
    const reputationExpText = document.getElementById('quest-reputation-exp');

    if (reputationInfo) {
        const level = player.questReputationLevel || 1;
        const title = getQuestReputationTitle(level);
        reputationInfo.innerHTML = `⭐ ${title} (Level ${level})`;
    }

    if (reputationBar && reputationExpText) {
        const currentExp = player.questReputationExp || 0;
        const maxExp = player.questReputationMaxExp || 100;
        const percent = Math.min(100, (currentExp / maxExp) * 100);
        reputationBar.style.width = `${percent}%`;
        reputationExpText.innerText = `${currentExp} / ${maxExp} Reputasi`;
    }

    const cost = QUEST_REFRESH_BASE_COST + (player.questReputationLevel - 1) * 25;
    if (refreshCost) refreshCost.innerText = cost;
    if (refreshButton) {
        refreshButton.disabled = player.gold < cost;
        refreshButton.style.opacity = player.gold < cost ? '0.5' : '1';
        refreshButton.style.cursor = player.gold < cost ? 'not-allowed' : 'pointer';
    }
}

function refreshQuestBoard() {
    const cost = QUEST_REFRESH_BASE_COST + (player.questReputationLevel - 1) * 25;
    if (player.gold < cost) {
        if (window.Swal) {
            Swal.fire({ title: 'Emas tidak cukup', text: `Kamu membutuhkan ${cost} Gold untuk refresh misi.`, icon: 'error', confirmButtonText: 'OK' });
        }
        return;
    }

    player.gold -= cost;
    player.questBoard = Array.from({ length: MAX_QUEST_SLOTS }, () => generateQuest());
    savePlayer();
    updateUI();
    renderQuestPanel();
}

function completeQuest(index) {
    const quest = player.questBoard[index];
    if (!quest || quest.completed) return;

    const itemName = questTargetToItemMap[quest.target] || quest.target;
    const requiredAmount = quest.amount;

    if (itemName === 'AUTO') {
        quest.completed = true;
        savePlayer();
        renderQuestPanel();
        Swal.fire({
            toast: true, position: 'top-end', icon: 'success', title: 'Misi Selesai!',
            html: 'Tugas berhasil diselesaikan. Klaim hadiahmu!',
            showConfirmButton: false, timer: 2500, background: '#13131c', color: '#cbd5e1'
        });
        return;
    }

    const currentAmount = player.inventory[itemName] || 0;

    if (currentAmount >= requiredAmount) {
        player.inventory[itemName] -= requiredAmount;
        if (player.inventory[itemName] <= 0) delete player.inventory[itemName];

        quest.completed = true;
        savePlayer();
        renderQuestPanel();
        Swal.fire({
            toast: true, position: 'top-end', icon: 'success', title: 'Tugas Dilaporkan!',
            html: `Kamu menyerahkan <b>${requiredAmount}x ${itemName}</b>. Misi selesai!`,
            showConfirmButton: false, timer: 3000, background: '#13131c', color: '#cbd5e1'
        });
    } else {
        Swal.fire({
            title: 'Item Tidak Cukup',
            html: `Tugasmu belum selesai. Kamu membutuhkan <b>${requiredAmount - currentAmount}x ${itemName}</b> lagi.`,
            icon: 'error', confirmButtonText: 'OK', background: '#13131c', color: '#cbd5e1'
        });
    }
}

function claimReward(index) {
    const quest = player.questBoard[index];
    if (!quest || !quest.completed || quest.claimed) return;

    quest.claimed = true; 

    const repGained = QUEST_RARITY_CONFIG[quest.rarity]?.rep || 10;

    player.gold = (player.gold || 0) + quest.goldReward;
    if (!player.inventory) player.inventory = {};
    // FIX: Gunakan nama item sebagai kunci di inventory, bukan ID quest.
    const rewardName = quest.rewardMaterial.name;
    player.inventory[rewardName] = (player.inventory[rewardName] || 0) + quest.rewardMaterial.count;
    player.questReputationExp = (player.questReputationExp || 0) + repGained;
    
    player.questCompletedCount = (player.questCompletedCount || 0) + 1;
    
    const oldQuest = { ...quest }; 
    player.questBoard[index] = generateQuest();

    savePlayer();
    checkQuestReputationLevelUp(); 
    updateUI();
    renderQuestPanel();

    Swal.fire({
        title: 'Hadiah Diambil!',
        didOpen: () => GameItemAssets.decorate(Swal.getPopup()),
        html: `
            <div style="text-align: left; line-height: 1.6;">
                Kamu menerima:
                <ul style="list-style-position: inside; padding-left: 10px; margin-top: 8px;">
                    <li><i class="fa-solid fa-coins" style="color: #facc15;"></i> <b>${oldQuest.goldReward}</b> Gold</li>
                    <li data-item-asset="${escapeHtml(oldQuest.rewardMaterial.name)}"><i class="fa-solid fa-gem" style="color: #60a5fa;"></i> <b>${oldQuest.rewardMaterial.count}x</b> ${escapeHtml(oldQuest.rewardMaterial.name)}</li>
                    <li><i class="fa-solid fa-star" style="color: #c084fc;"></i> <b>${repGained}</b> Poin Reputasi</li>
                </ul>
            </div>
        `,
        icon: 'success',
        confirmButtonText: 'Luar Biasa!',
        background: '#13131c', 
        color: '#cbd5e1'
    });
}


function setTavernTab(activeId) {
    const recruitBtn = document.getElementById('tab-recruit');
    const questBtn = document.getElementById('tab-quest');
    const allyList = document.getElementById('ally-list');
    const questBoard = document.getElementById('quest-board-wrapper');

    if (!allyList || !questBoard || !recruitBtn || !questBtn) return;

    if (activeId === 'quest') {
        // Aktifkan tab Quest
        recruitBtn.classList.remove('active');
        questBtn.classList.add('active');

        // Sembunyikan Rekrut, tampilkan semua Quest
        allyList.style.display = 'none';
        questBoard.hidden = false;
        questBoard.style.display = 'block';

    } else {
        // Aktifkan tab Rekrut
        recruitBtn.classList.add('active');
        questBtn.classList.remove('active');

        // Tampilkan Rekrut, sembunyikan semua Quest
        allyList.style.display = 'grid';
        questBoard.hidden = true;
        questBoard.style.display = 'none';
    }
}


function initTavernTabs() {
    const recruitBtn = document.getElementById('tab-recruit');
    const questBtn = document.getElementById('tab-quest');
    if (recruitBtn) recruitBtn.addEventListener('click', () => setTavernTab('recruit'));
    if (questBtn) questBtn.addEventListener('click', () => setTavernTab('quest'));
    setTavernTab('recruit');
}

function updateUI() {
    document.getElementById('player-gold').innerText = player.gold.toLocaleString();
    renderPartySummary();
    renderAllies();
    const questPanel = document.getElementById('quest-panel');
    if (questPanel && questPanel.style.display !== 'none') {
        renderQuestPanel();
    }
}

function getRecruitedPartyStats() {
    const totals = { attack: 0, def: 0, magic: 0, hp: 0, aspd: 0, count: 0 };
    if (!Array.isArray(player.party) || player.party.length === 0) return totals;

    player.party.forEach(allyId => {
        const ally = allyDatabase[allyId];
        if (!ally) return;
        const inst = (player.allies && player.allies[allyId]) || {};
        const { maxHp: hpVal, attack, def, magic, aspd } = GameAllyCatalog.statsFor(ally, inst);

        totals.count += 1;
        totals.hp += hpVal;
        totals.attack += attack;
        totals.def += def;
        totals.magic += magic;
        totals.aspd += aspd;
    });

    return totals;
}

function renderPartySummary() {
    // Party summary removed - individual stats only shown via 'Lihat Stat' button
}

function renderAllies() {
    const allyList = document.getElementById('ally-list');
    allyList.innerHTML = '';
    const frag = document.createDocumentFragment();

    for (const allyId in allyDatabase) {
        const ally = allyDatabase[allyId];
        const isRecruited = player.party.includes(ally.id);
        const canAfford = player.gold >= ally.cost;

        let buttonHtml;
        if (isRecruited) {
            buttonHtml = `<button class="btn-recruit" onclick="manageAlly('${ally.id}')">Kelola</button>&nbsp;<button class="btn-recruit" style="background:#7c3aed" onclick="viewAllyStats('${ally.id}')">Lihat Stat</button>`;
            if (GameCore.allyHealth(ally, player.allies[ally.id]).hp <= 0) {
                buttonHtml += `<button class="btn-recruit" onclick="reviveAlly('${ally.id}')" ${player.gold < ALLY_REVIVE_COST ? 'disabled' : ''}>Hidupkan (${ALLY_REVIVE_COST} Koin)</button>`;
            }
        } else if (canAfford) {
            buttonHtml = `<button class="btn-recruit" onclick="recruitAlly('${ally.id}')">Rekrut (${ally.cost.toLocaleString()} G)</button>`;
        } else {
            buttonHtml = `<button class="btn-recruit" disabled>Emas Tidak Cukup</button>`;
        }

        // show class default bonuses as a small summary (preview only)
        const defaults = getClassDefaults(ally.class || ally.name).stats || {};
        const badgeParts = [];
        if (defaults.hpBonus) badgeParts.push(`+${defaults.hpBonus} HP`);
        if (defaults.atkBonus) badgeParts.push(`+${defaults.atkBonus} ATK`);
        if (defaults.defBonus) badgeParts.push(`+${defaults.defBonus} DEF`);
        if (defaults.magicBonus) badgeParts.push(`+${defaults.magicBonus} M.DMG`);
        if (defaults.dodgeBonus) badgeParts.push(`+${defaults.dodgeBonus} Dodge`);
        if (defaults.aspdBonus) badgeParts.push(`+${defaults.aspdBonus} ASPD`);
        if (defaults.maxManaBonus) badgeParts.push(`+${defaults.maxManaBonus} Mana`);

        const cardEl = document.createElement('div');
        cardEl.className = `ally-card ${isRecruited ? 'recruited' : ''}`;

        const header = document.createElement('div');
        header.className = 'ally-header';
        const iconEl = document.createElement('i');
        iconEl.className = `ally-icon fa-solid ${ally.icon}`;
        header.appendChild(iconEl);
        const headerMeta = document.createElement('div');
        const nameDiv = document.createElement('div'); nameDiv.className = 'ally-name'; nameDiv.textContent = escapeHtml(ally.name);
        const classDiv = document.createElement('div'); classDiv.className = 'ally-class'; classDiv.textContent = escapeHtml(ally.class);
        headerMeta.appendChild(nameDiv); headerMeta.appendChild(classDiv);
        header.appendChild(headerMeta);

        const desc = document.createElement('p'); desc.className = 'ally-desc'; desc.textContent = escapeHtml(ally.description);

        const infoRow = document.createElement('div'); infoRow.style.display = 'flex'; infoRow.style.alignItems = 'center'; infoRow.style.gap = '8px'; infoRow.style.marginBottom = '6px';
        const skillSmall = document.createElement('small'); skillSmall.innerHTML = `<strong>Skill awal:</strong> ${(ally.skill && ally.skill.type) || '—'}`;
        const infoBtn = document.createElement('button'); infoBtn.className = 'btn-info-small'; infoBtn.title = 'Info Skill'; infoBtn.onclick = () => showSkillInfo(ally.id, (ally.skill && ally.skill.type) || '');
        infoBtn.innerHTML = '<i class="fa-solid fa-circle-info"></i>';
        infoRow.appendChild(skillSmall); infoRow.appendChild(infoBtn);

        const shownInstance = player.allies[ally.id] || { stats: getClassDefaults(ally.class).stats };
        const shown = GameAllyCatalog.statsFor(ally, shownInstance);
        const statsWrap = document.createElement('div'); statsWrap.className = 'ally-stats';
        const statHp = document.createElement('div'); statHp.className = 'stat-item'; statHp.innerHTML = `<i class="fa-solid fa-heart"></i> ${shown.maxHp}<span>HP</span>`;
        const statAtk = document.createElement('div'); statAtk.className = 'stat-item'; statAtk.innerHTML = `<i class="fa-solid fa-khanda"></i> ${shown.attack}<span>ATK</span>`;
        const statDef = document.createElement('div'); statDef.className = 'stat-item'; statDef.innerHTML = `<i class="fa-solid fa-shield"></i> ${shown.def}<span>DEF</span>`;
        statsWrap.appendChild(statHp); statsWrap.appendChild(statAtk); statsWrap.appendChild(statDef);

        const preset = document.createElement('div'); preset.style.margin = '6px 0'; preset.style.color = '#cfcfcf'; preset.style.fontSize = '0.9em';
        preset.innerHTML = `<strong>Preset kelas:</strong> ${badgeParts.join(' • ') || '—'}`;

        if (isRecruited) {
            const inst = (player.allies && player.allies[ally.id]) || { level: 1, xp: 0, maxExp: 100 };
            const xpCurrent = Math.max(0, inst.xp || 0);
            const xpMax = Math.max(1, inst.maxExp || 100);
            const xpPercent = Math.min(100, Math.round((xpCurrent / xpMax) * 100));
            const xpSection = document.createElement('div');
            xpSection.className = 'ally-xp';
            xpSection.innerHTML = `
                <div class="xp-row"><span>Level ${inst.level || 1}</span><span>${xpCurrent}/${xpMax} XP</span></div>
                <div class="xp-bar-container"><div class="xp-bar-fill" style="width:${xpPercent}%;"></div></div>
            `;
            cardEl.appendChild(xpSection);
            const health = GameCore.allyHealth(ally, inst);
            const hpSection = document.createElement('div');
            hpSection.className = 'ally-health';
            hpSection.innerHTML = `<span>HP ${health.hp}/${health.maxHp}${health.hp <= 0 ? ' - Mati' : ''}</span><progress aria-label="HP ${ally.name}" max="${health.maxHp}" value="${health.hp}"></progress>`;
            cardEl.appendChild(hpSection);
        }

        // Insert buttonHtml safely by creating a container and setting innerHTML once
        const btnContainer = document.createElement('div');
        btnContainer.innerHTML = buttonHtml;

        cardEl.appendChild(header);
        cardEl.appendChild(desc);
        cardEl.appendChild(infoRow);
        cardEl.appendChild(statsWrap);
        cardEl.appendChild(preset);
        cardEl.appendChild(btnContainer);

        frag.appendChild(cardEl);
    }
    allyList.appendChild(frag);
}

function reviveAlly(allyId) {
    const ally = allyDatabase[allyId];
    if (!ally || !player.party.includes(allyId)) return;
    const inst = player.allies[allyId];
    const health = GameCore.allyHealth(ally, inst);
    if (!inst || health.hp > 0) return;
    if (player.gold < ALLY_REVIVE_COST) {
        Swal.fire('Koin Tidak Cukup', `Perlu ${ALLY_REVIVE_COST} koin untuk menghidupkan anggota party.`, 'warning');
        return;
    }
    player.gold -= ALLY_REVIVE_COST;
    inst.hp = health.maxHp;
    inst.debuffs = [];
    inst.combatBuffs = [];
    savePlayer();
    updateUI();
}

function showSkillInfo(allyId, skillKey) {
    const key = skillKey || (allyDatabase[allyId] && allyDatabase[allyId].skill && allyDatabase[allyId].skill.type) || '';
    const desc = skillDescriptionMap[key] || 'Tidak ada deskripsi tersedia.';
    Swal.fire({ title: `Info Skill: ${key || '—'}`, html: `<p>${desc}</p><p>Skill otomatis mengikuti peluang dan cooldown. Mana rekan pulih di Arena saat di luar Battle.</p>`, confirmButtonText: 'Tutup' });
}

function recruitAlly(allyId) {
    const ally = allyDatabase[allyId];
    if (!ally) return;

    if (player.gold < ally.cost) {
        Swal.fire('Gagal!', 'Emas Anda tidak cukup untuk merekrut.', 'error');
        return;
    }

    if (player.party.includes(allyId)) {
        Swal.fire('Info', 'Anda sudah merekrut anggota ini.', 'info');
        return;
    }

    Swal.fire({
        title: `Rekrut ${ally.name}?`,
        text: `Ini akan memotong ${ally.cost.toLocaleString()} Gold dari kantong Anda.`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Ya, Rekrut!',
        cancelButtonText: 'Batal',
        background: '#3a2d23',
        color: '#e0c9a6',
        confirmButtonColor: '#4caf50',
        cancelButtonColor: '#f44336',
    }).then((result) => {
        if (result.isConfirmed) {
            // Revalidate after the async dialog: double clicks cannot recruit/pay twice.
            if (player.party.includes(allyId)) return;
            if (player.gold < ally.cost) {
                Swal.fire('Gagal!', 'Emas Anda tidak cukup untuk merekrut.', 'error');
                return;
            }
            player.gold -= ally.cost;
            player.party.push(allyId);
            // Initialize instance data for the recruited ally if not present
            if (!player.allies) player.allies = {};
            if (!player.allies[allyId]) {
                    // apply class defaults so recruits match their archetype
                    const defaults = getClassDefaults(ally.class || ally.name);
                    player.allies[allyId] = {
                        id: allyId,
                        level: 1,
                        xp: 0,
                        maxExp: 100,
                        statPoints: defaults.statPoints || 0,
                        stats: Object.assign({ hpBonus:0, atkBonus:0, defBonus:0, magicBonus:0, dodgeBonus:0, aspdBonus:0, maxManaBonus:0 }, defaults.stats || {}),
                        skills: [ally.skill ? ally.skill.type : null]
                    };
            }

            const resources = GameAllyCatalog.statsFor(ally, player.allies[allyId]);
            player.allies[allyId].hp ??= resources.maxHp;
            player.allies[allyId].mana ??= resources.maxMana;
            savePlayer();
            updateUI();

            Swal.fire({
                title: 'Rekrutmen Berhasil!',
                text: `${ally.name} telah bergabung dengan party Anda!`,
                icon: 'success',
                background: '#3a2d23',
                color: '#e0c9a6',
                confirmButtonColor: '#4caf50',
            });
        }
    });
}

// Event Listener untuk tombol kembali
document.getElementById('btn-back').addEventListener('click', () => {
    window.location.href = '../Utama/Index.html';
});

// Manage an already recruited ally: level up, allocate stat points, choose skill
function manageAlly(allyId) {
    const ally = allyDatabase[allyId];
    if (!ally) return;
    const instance = (player.allies && player.allies[allyId]) || { level:1, xp:0, statPoints:0, stats:{}, skills:[] };

    const infoHtml = `
        <div style="text-align:left;">
            <strong>${ally.name} (${ally.class})</strong>
            <p>${ally.description}</p>
            <p>Level: <b>${instance.level}</b> &nbsp; XP: <b>${instance.xp}</b></p>
            <p>Poin Stat: <b>${instance.statPoints || 0}</b></p>
            <p>Skill Terpilih: <b>${(instance.skills && instance.skills[0]) || (ally.skill && ally.skill.type) || 'Tidak ada'}</b></p>
            <p><small>${skillDescriptionMap[(instance.skills && instance.skills[0]) || (ally.skill && ally.skill.type) || ''] || ''}</small></p>
        </div>
    `;

    Swal.fire({
        title: `Kelola ${ally.name}`,
        html: infoHtml,
        input: 'select',
        inputOptions: {
            'none': 'Tutup',
            'level': 'Naikkan Level (200 G)',
            'stat': 'Tambahkan Stat (jika punya poin)'
        },
        inputPlaceholder: 'Pilih aksi',
        showCancelButton: true
    }).then(res => {
        const action = res.value;
        if (!action || action === 'none') return;

        if (action === 'level') {
            const cost = 200;
            if (player.gold < cost) { Swal.fire('Gagal', 'Emas tidak cukup untuk menaikkan level.', 'error'); return; }
            player.gold -= cost;
            if (!player.allies) player.allies = {};
            if (!player.allies[allyId]) player.allies[allyId] = instance;
            player.allies[allyId].level = (player.allies[allyId].level || 1) + 1;
            player.allies[allyId].statPoints = (player.allies[allyId].statPoints || 0) + 2;
            savePlayer(); updateUI();
            Swal.fire('Sukses', `${ally.name} naik 1 level! Mendapat 2 Poin Stat.`, 'success');
            return;
        }

        if (action === 'stat') {
            const points = instance.statPoints || 0;
            if (points <= 0) { Swal.fire('Info', 'Rekan tidak memiliki poin stat untuk dibagikan.', 'info'); return; }

            // Build allocation modal (plus/minus UI like player status)
            const html = `
                <div style="display:flex;flex-direction:column;gap:10px;text-align:left">
                    <p>Poin yang tersedia: <strong id="avail-points">${points}</strong></p>
                    <div style="display:flex;gap:8px;">
                        <button id="preset-tank" class="swal2-styled" type="button" style="flex:1;background:#2563eb">Tank</button>
                        <button id="preset-dps" class="swal2-styled" type="button" style="flex:1;background:#dc2626">DPS</button>
                        <button id="preset-support" class="swal2-styled" type="button" style="flex:1;background:#a78bfa">Support</button>
                    </div>
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <div>HP <small style="color:#cfcfcf">(+15 max HP)</small></div>
                        <div style="display:flex;gap:8px;align-items:center">
                            <button data-key="hp" class="atk-minus" style="width:28px">-</button>
                            <span id="val-hp">0</span>
                            <button data-key="hp" class="atk-plus" style="width:28px">+</button>
                        </div>
                    </div>
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <div>Attack <small style="color:#cfcfcf">(+1)</small></div>
                        <div style="display:flex;gap:8px;align-items:center">
                            <button data-key="attack" class="atk-minus" style="width:28px">-</button>
                            <span id="val-attack">0</span>
                            <button data-key="attack" class="atk-plus" style="width:28px">+</button>
                        </div>
                    </div>
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <div>Defense <small style="color:#cfcfcf">(+1)</small></div>
                        <div style="display:flex;gap:8px;align-items:center">
                            <button data-key="defense" class="atk-minus" style="width:28px">-</button>
                            <span id="val-defense">0</span>
                            <button data-key="defense" class="atk-plus" style="width:28px">+</button>
                        </div>
                    </div>
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <div>Magic DMG <small style="color:#cfcfcf">(+1)</small></div>
                        <div style="display:flex;gap:8px;align-items:center">
                            <button data-key="magic" class="atk-minus" style="width:28px">-</button>
                            <span id="val-magic">0</span>
                            <button data-key="magic" class="atk-plus" style="width:28px">+</button>
                        </div>
                    </div>
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <div>Dodge <small style="color:#cfcfcf">(+1)</small></div>
                        <div style="display:flex;gap:8px;align-items:center">
                            <button data-key="dodge" class="atk-minus" style="width:28px">-</button>
                            <span id="val-dodge">0</span>
                            <button data-key="dodge" class="atk-plus" style="width:28px">+</button>
                        </div>
                    </div>
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <div>Attack Speed <small style="color:#cfcfcf">(+1)</small></div>
                        <div style="display:flex;gap:8px;align-items:center">
                            <button data-key="aspd" class="atk-minus" style="width:28px">-</button>
                            <span id="val-aspd">0</span>
                            <button data-key="aspd" class="atk-plus" style="width:28px">+</button>
                        </div>
                    </div>
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <div>Max Mana <small style="color:#cfcfcf">(+10)</small></div>
                        <div style="display:flex;gap:8px;align-items:center">
                            <button data-key="maxMana" class="atk-minus" style="width:28px">-</button>
                            <span id="val-maxMana">0</span>
                            <button data-key="maxMana" class="atk-plus" style="width:28px">+</button>
                        </div>
                    </div>
                </div>`;

            Swal.fire({
                title: `Tambahkan Stat untuk ${ally.name}`,
                html: html,
                showCancelButton: true,
                confirmButtonText: 'Terapkan',
                cancelButtonText: 'Batal',
                focusConfirm: false,
                background: '#3a2d23',
                color: '#e0c9a6',
                didOpen: () => {
                    const popup = Swal.getPopup();
                    const availEl = popup.querySelector('#avail-points');
                    const pts = points;
                    const alloc = { hp:0, attack:0, defense:0, magic:0, dodge:0, aspd:0, maxMana:0 };

                    function remaining() { return pts - Object.values(alloc).reduce((a,b)=>a+b,0); }

                    function update() {
                        popup.querySelector('#val-hp').textContent = alloc.hp;
                        popup.querySelector('#val-attack').textContent = alloc.attack;
                        popup.querySelector('#val-defense').textContent = alloc.defense;
                        popup.querySelector('#val-magic').textContent = alloc.magic;
                        popup.querySelector('#val-dodge').textContent = alloc.dodge;
                        popup.querySelector('#val-aspd').textContent = alloc.aspd;
                        popup.querySelector('#val-maxMana').textContent = alloc.maxMana;
                        availEl.textContent = remaining();
                    }

                    popup.querySelectorAll('.atk-plus').forEach(btn => btn.addEventListener('click', () => {
                        const k = btn.dataset.key; if (remaining() <= 0) return; alloc[k] = (alloc[k]||0)+1; update();
                    }));
                    popup.querySelectorAll('.atk-minus').forEach(btn => btn.addEventListener('click', () => {
                        const k = btn.dataset.key; if ((alloc[k]||0) <= 0) return; alloc[k] = alloc[k]-1; update();
                    }));

                    // Preset handlers: distribute points in priority order without exceeding available
                    function applyPresetOrder(order) {
                        // reset
                        Object.keys(alloc).forEach(k => alloc[k] = 0);
                        let rem = points;
                        for (let key of order) {
                            if (rem <= 0) break;
                            // desired amounts per preset (tunable)
                            const desiredMap = {
                                hp: 3, attack: 4, defense: 3, magic: 3, dodge: 2, aspd: 2, maxMana: 2
                            };
                            const want = desiredMap[key] || 1;
                            const give = Math.min(want, rem);
                            alloc[key] = give;
                            rem -= give;
                        }
                        update();
                    }

                    const btnTank = popup.querySelector('#preset-tank');
                    const btnDps = popup.querySelector('#preset-dps');
                    const btnSupport = popup.querySelector('#preset-support');
                    if (btnTank) btnTank.addEventListener('click', () => applyPresetOrder(['hp','defense','atk','attack','dodge']));
                    if (btnDps) btnDps.addEventListener('click', () => applyPresetOrder(['attack','aspd','hp','dodge','defense']));
                    if (btnSupport) btnSupport.addEventListener('click', () => applyPresetOrder(['magic','maxMana','hp','defense','attack']));

                    update();
                },
                preConfirm: () => {
                    const popup = Swal.getPopup();
                    const alloc = {
                        hp: parseInt(popup.querySelector('#val-hp').textContent) || 0,
                        attack: parseInt(popup.querySelector('#val-attack').textContent) || 0,
                        defense: parseInt(popup.querySelector('#val-defense').textContent) || 0,
                        magic: parseInt(popup.querySelector('#val-magic').textContent) || 0,
                        dodge: parseInt(popup.querySelector('#val-dodge').textContent) || 0,
                        aspd: parseInt(popup.querySelector('#val-aspd').textContent) || 0,
                        maxMana: parseInt(popup.querySelector('#val-maxMana').textContent) || 0
                    };
                    const used = Object.values(alloc).reduce((a,b)=>a+b,0);
                    if (used > points) { Swal.showValidationMessage('Penggunaan poin melebihi batas'); return false; }
                    return alloc;
                }
            }).then(res => {
                if (!res.isConfirmed || !res.value) return;
                const chosen = res.value;
                if (!player.allies) player.allies = {};
                if (!player.allies[allyId]) player.allies[allyId] = instance;
                const inst = player.allies[allyId];
                inst.stats = inst.stats || { hpBonus:0, atkBonus:0, defBonus:0, magicBonus:0, dodgeBonus:0, aspdBonus:0, maxManaBonus:0 };
                inst.stats.hpBonus += (chosen.hp || 0) * 15;
                inst.stats.atkBonus += (chosen.attack || 0);
                inst.stats.defBonus += (chosen.defense || 0);
                inst.stats.magicBonus += (chosen.magic || 0);
                inst.stats.dodgeBonus += (chosen.dodge || 0);
                inst.stats.aspdBonus += (chosen.aspd || 0);
                inst.stats.maxManaBonus += (chosen.maxMana || 0) * 10;
                inst.statPoints = Math.max(0, (inst.statPoints||0) - Object.values(chosen).reduce((a,b)=>a+b,0));
                savePlayer(); updateUI();
                Swal.fire('Sukses', 'Stat berhasil ditingkatkan.', 'success');
            });
            return;
        }

        // active toggle removed — party selection is controlled from the main Party manager
    });
}

function viewAllyStats(allyId) {
    const ally = allyDatabase[allyId];
    if (!ally) return;
    
    const instance = (player.allies && player.allies[allyId]) || { level: 1, xp: 0, statPoints: 0, stats: {} };
    const actual = GameAllyCatalog.statsFor(ally, instance);
    const { level, maxHp: totalHp, attack: totalAtk, def: totalDef, magic: totalMag, dodge: totalDodge, aspd: totalAspd, maxMana: totalMana } = actual;

    const statsHtml = `
        <div style="text-align:left; background:#2a2420; padding:12px; border-radius:8px; margin:10px 0;">
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:10px;">
                <div><strong><i class="fa-solid fa-heart" style="color:#ef4444;"></i> HP</strong><br><span style="font-size:18px; color:#fca5a5;">${GameCore.allyHealth(ally, instance).hp}/${totalHp}</span></div>
                <div><strong><i class="fa-solid fa-khanda" style="color:#f97316;"></i> ATK</strong><br><span style="font-size:18px; color:#fed7aa;">${totalAtk}</span></div>
                <div><strong><i class="fa-solid fa-shield" style="color:#3b82f6;"></i> DEF</strong><br><span style="font-size:18px; color:#93c5fd;">${totalDef}</span></div>
                <div><strong><i class="fa-solid fa-wand-magic-sparkles" style="color:#a855f7;"></i> MAG</strong><br><span style="font-size:18px; color:#d8b4fe;">${totalMag}</span></div>
                <div><strong><i class="fa-solid fa-wind" style="color:#06b6d4;"></i> Dodge</strong><br><span style="font-size:18px; color:#67e8f9;">${Math.min(75, totalDodge)}% (stat ${totalDodge})</span></div>
                <div><strong><i class="fa-solid fa-bolt" style="color:#eab308;"></i> ASPD</strong><br><span style="font-size:18px; color:#fde047;">${totalAspd}</span></div>
            </div>
            ${totalMana > 0 ? `<div style="margin-top:8px;"><strong><i class="fa-solid fa-flask-vial" style="color:#60a5fa;"></i> Mana</strong>: <span style="color:#93c5fd;">${actual.mana}/${totalMana}</span></div>` : ''}
        </div>
        <div style="text-align:left; margin:10px 0; font-size:0.9em; color:#cfcfcf;">
            <p><strong>Level:</strong> ${level} &nbsp; <strong>XP:</strong> ${instance.xp}/${instance.maxExp || 100}</p>
            <p><strong>Poin Stat Tersisa:</strong> ${instance.statPoints || 0}</p>
            <p><strong>Skill:</strong> ${(instance.skills && instance.skills[0]) || (ally.skill && ally.skill.type) || 'Tidak ada'}</p>
        </div>
    `;
    
    Swal.fire({
        title: `${ally.name} (${ally.class})`,
        html: statsHtml,
        confirmButtonText: 'Tutup',
        width: '400px'
    });
}

// Inisialisasi saat halaman dimuat
GameStorage.onReady(() => {
    loadPlayer();
    initQuestBoard();
    initTavernTabs();
    updateUI();
});

