// ==========================================================================
// RPG IDLE ENGINE - METODE ULTIMATE (UPDATED: AUTO-EQUIP & CLEAN STRUCTURE)
// ==========================================================================

// 1. Ambil Data Karakter Utama dari Engine Game
let playerData = JSON.parse(GameStorage.getItem('rpg_player'));

// Jika pemain nyasar ke halaman ini tanpa buat karakter, lemparkan kembali!
if (!playerData) {
    window.location.href = '../Hero/hero.html';
}

// 2. VALIDASI & INJEKSI DATA (Jika karakter baru belum punya tas, buatkan otomatis)
if (!playerData.professions) playerData.professions = { mining: { level: 1, exp: 0, maxExp: 100 }, chopping: { level: 1, exp: 0, maxExp: 100 } };
if (!playerData.tools) playerData.tools = { equippedPickaxe: { name: "Beliung Pemula", speed: 1.0 }, equippedAxe: { name: "Kapak Berkarat", speed: 1.0 } };
if (!playerData.inventory) playerData.inventory = {};

// Konfigurasi durasi dasar dan EXP per level
const resourceConfig = {
    "Copper Ore": { reqLevel: 1, baseTime: 3000, expGive: 15 },
    "Iron Ore": { reqLevel: 5, baseTime: 6000, expGive: 35 },
    "Silver Ore": { reqLevel: 10, baseTime: 10000, expGive: 70 },
    "Gold Ore": { reqLevel: 20, baseTime: 18000, expGive: 150 },
    "Titanium Ore": { reqLevel: 30, baseTime: 25000, expGive: 300 },
    "Mithril Ore": { reqLevel: 45, baseTime: 40000, expGive: 700 }, 
    
    "Kayu Balsa": { reqLevel: 1, baseTime: 3000, expGive: 15 },
    "Kayu Pinus": { reqLevel: 5, baseTime: 6000, expGive: 35 },
    "Kayu Ek / Oak": { reqLevel: 10, baseTime: 10000, expGive: 70 },
    "Kayu Besi / Ironwood": { reqLevel: 20, baseTime: 18000, expGive: 150 },
    "Kayu Mahoni": { reqLevel: 30, baseTime: 25000, expGive: 300 },
    "Kayu Purba / Elderwood": { reqLevel: 45, baseTime: 40000, expGive: 700 }
};

let activeGatherItem = null;
let loopInterval = null;
let gatherTick = null;
let currentProgress = 0;
let currentType = document.body.dataset.type; // Deteksi jenis halaman (mining / chopping)
let prevProgress = 0;

function getSafeId(name) {
    if (name === "Kayu Ek / Oak") return "Kayu-Oak";
    if (name === "Kayu Besi / Ironwood") return "Kayu-Ironwood";
    if (name === "Kayu Purba / Elderwood") return "Kayu-Elderwood";
    return name.replace(/\s+/g, '-');
}

// 3. FUNGSI SIMPAN OTOMATIS
function saveGame() {
    playerData = GameStorage.savePlayer(playerData);
}

// ==========================================================================
// CONNECTOR LOGIC: AUTO DETECT & EQUIP TOOLS FROM SHOP
// ==========================================================================
function autoEquipBestTool() {
    if (!currentType) return;

    let profLevel = playerData.professions[currentType].level;

    if (currentType === 'mining') {
        // Default Beliung
        let bestPick = { name: "Beliung Pemula", speed: 1.0 };

        // Cek kepemilikan di database tool dari Toko & syarat level profesi
        if (playerData.tools['pickaxe_mithril'] && profLevel >= 45) {
            bestPick = { name: "⛏️ Beliung Mithril (BOSS)", speed: 5.0 };
        } else if (playerData.tools['pickaxe_titanium'] && profLevel >= 30) {
            bestPick = { name: "⛏️ Beliung Titanium", speed: 3.5 };
        } else if (playerData.tools['pickaxe_gold'] && profLevel >= 20) {
            bestPick = { name: "⛏️ Beliung Emas", speed: 2.5 };
        } else if (playerData.tools['pickaxe_silver'] && profLevel >= 10) {
            bestPick = { name: "⛏️ Beliung Perak", speed: 1.8 };
        } else if (playerData.tools['pickaxe_iron'] && profLevel >= 5) {
            bestPick = { name: "⛏️ Beliung Besi", speed: 1.4 };
        } else if (playerData.tools['pickaxe_copper'] && profLevel >= 1) {
            bestPick = { name: "⛏️ Beliung Tembaga", speed: 1.2 };
        }

        playerData.tools.equippedPickaxe = bestPick;

    } else if (currentType === 'chopping') {
        // Default Kapak
        let bestAxe = { name: "Kapak Berkarat", speed: 1.0 };

        // Cek kepemilikan di database tool dari Toko & syarat level profesi
        if (playerData.tools['axe_elderwood'] && profLevel >= 45) {
            bestAxe = { name: "🪓 Kapak Elderwood (BOSS)", speed: 5.0 };
        } else if (playerData.tools['axe_mahoni'] && profLevel >= 30) {
            bestAxe = { name: "🪓 Kapak Kayu Mahoni", speed: 3.5 };
        } else if (playerData.tools['axe_ironwood'] && profLevel >= 20) {
            bestAxe = { name: "🪓 Kapak Ironwood", speed: 2.5 };
        } else if (playerData.tools['axe_oak'] && profLevel >= 10) {
            bestAxe = { name: "🪓 Kapak Kayu Oak", speed: 1.8 };
        } else if (playerData.tools['axe_pinus'] && profLevel >= 5) {
            bestAxe = { name: "🪓 Kapak Kayu Pinus", speed: 1.4 };
        } else if (playerData.tools['axe_balsa'] && profLevel >= 1) {
            bestAxe = { name: "🪓 Kapak Kayu Balsa", speed: 1.2 };
        }

        playerData.tools.equippedAxe = bestAxe;
    }
}

// Perbarui Seluruh Angka & Status Lock di Layar
function refreshUI() {
    if (document.hidden) return;
    if (!currentType) return;
    
    // PANGGIL AUTO EQUIP sebelum merender statistik ke UI
    autoEquipBestTool();
    
    let profData = playerData.professions[currentType];
    let toolData = currentType === 'mining' ? playerData.tools.equippedPickaxe : playerData.tools.equippedAxe;

    let goldEl = document.getElementById('gold-display');
    if (goldEl) goldEl.innerText = (playerData.gold || 0).toLocaleString('id-ID');
    
    let lvlEl = document.getElementById('profesi-level');
    if (lvlEl) lvlEl.innerText = profData.level;
    
    let expEl = document.getElementById('profesi-exp');
    if (expEl) expEl.innerText = profData.exp;
    
    let maxExpEl = document.getElementById('profesi-max-exp');
    if (maxExpEl) maxExpEl.innerText = profData.maxExp;
    
    let expBarEl = document.getElementById('profesi-exp-bar');
    if (expBarEl) expBarEl.style.width = ((profData.exp / profData.maxExp) * 100) + "%";
    
    let toolNameEl = document.getElementById('tool-name');
    if (toolNameEl) toolNameEl.innerText = toolData.name;
    if (toolNameEl) GameItemAssets.attach(toolNameEl, toolData.name, { compact: true });
    
    let toolSpeedEl = document.getElementById('tool-speed');
    if (toolSpeedEl) toolSpeedEl.innerText = toolData.speed + "x";

    // Scan kartu material untuk update isi tas & efek lock level
    for (let material in resourceConfig) {
        let safeId = getSafeId(material);
        let qtyElement = document.getElementById('qty-' + safeId);
        if (qtyElement) qtyElement.innerText = playerData.inventory[material] || 0;

        let cardElement = document.getElementById('card-' + safeId);
        if (cardElement) {
            if (profData.level < resourceConfig[material].reqLevel) {
                cardElement.classList.add('locked');
            } else {
                cardElement.classList.remove('locked');
            }
        }
    }
}

// Logika ON/OFF Auto-Gathering
function toggleGather(itemName, type) {
    if (!Object.hasOwn(resourceConfig, itemName) || !['mining', 'chopping'].includes(type) || type !== currentType) return;
    if ((type === 'mining') !== itemName.endsWith(' Ore')) return;
    let config = resourceConfig[itemName];
    let profData = playerData.professions[type];

    if (profData.level < config.reqLevel) {
        Swal.fire({ icon: 'error', title: 'Level Kurang!', text: `Butuh level ${config.reqLevel} untuk mengakses area ini!`, background: '#131722', color: '#f1f5f9' });
        return;
    }

    if (activeGatherItem === itemName) {
        stopActiveGathering();
        return;
    }

    if (activeGatherItem !== null) stopActiveGathering();

    activeGatherItem = itemName;
    let safeId = getSafeId(itemName);
    let targetButton = document.getElementById('btn-' + safeId);
    let targetProgressBar = document.getElementById('pg-' + safeId);

    if (targetButton) {
        // Update button content safely
        targetButton.innerHTML = '';
        const stopIcon = document.createElement('i'); stopIcon.className = 'fa-solid fa-circle-stop';
        targetButton.appendChild(stopIcon);
        targetButton.appendChild(document.createTextNode(' Berhenti'));
        targetButton.classList.add('btn-stop-active');
    }

    // Mengambil data tool yang sudah melalui proses auto-equip terbaru
    autoEquipBestTool();
    let toolData = type === 'mining' ? playerData.tools.equippedPickaxe : playerData.tools.equippedAxe;
    let realDuration = config.baseTime / toolData.speed; 
    // Use elapsed time, so reducing UI refreshes does not slow down gathering.
    let cycleStartedAt = performance.now();

    // initialize progress-sync tracking (sounds disabled for mining)
    prevProgress = 0;

    currentProgress = 0;
    function tickGathering() {
        loopInterval = null;
        if (activeGatherItem !== itemName) return;
        currentProgress = Math.min(100, (performance.now() - cycleStartedAt) / realDuration * 100);
        if (!document.hidden && targetProgressBar) targetProgressBar.style.width = currentProgress + '%';

        // Update progress tracking (mining sounds disabled)
        try {
            prevProgress = currentProgress;
        } catch (e) {}

        // Penuh & Berhasil Panen
        if (currentProgress >= 100) {
            currentProgress = 0;
            cycleStartedAt = performance.now();
            if (!document.hidden && targetProgressBar) targetProgressBar.style.width = '0%';

            let rewardQty = Math.floor(Math.random() * 3) + 1;
            GameAchievements.event(playerData, 'gather', rewardQty);
            playerData.inventory[itemName] = (playerData.inventory[itemName] || 0) + rewardQty;

            gainExp(type, config.expGive);

            // No completion sound for mining (disabled)
            prevProgress = 0;

            saveGame();
            refreshUI();
        }
        const remaining = Math.max(1, realDuration - (performance.now() - cycleStartedAt));
        loopInterval = setTimeout(tickGathering, document.hidden ? Math.max(1000, remaining) : Math.min(200, remaining));
    }
    gatherTick = tickGathering;
    loopInterval = setTimeout(tickGathering, Math.min(200, realDuration));

    // audio will be played via user-triggered actions; no explicit unlock here
}

// Penambahan EXP & Kenaikan Level Profesi
function gainExp(type, amount) {
    let profData = playerData.professions[type];
    profData.exp += amount;

    while (profData.exp >= profData.maxExp) {
        profData.level++;
        profData.exp -= profData.maxExp;
        profData.maxExp = Math.floor(profData.maxExp * 1.25); 
        
        if (!document.hidden) Swal.fire({ icon: 'success', title: 'PROFESI NAIK LEVEL!', text: `Selamat! Profesi ${type === 'mining' ? 'Tambang' : 'Tebang'} naik ke Level ${profData.level}!`, background: '#131722', color: '#f1f5f9' });
        
        // Pemicu auto-equip ulang saat level naik (siapa tahu ada perkakas tertunda yang bisa dipakai)
        autoEquipBestTool();
    }
}

// Fungsi stop/reset manual atau otomatis
function stopActiveGathering() {
    if (!activeGatherItem) return;
    let safeId = getSafeId(activeGatherItem);
    let targetButton = document.getElementById('btn-' + safeId);
    let targetProgressBar = document.getElementById('pg-' + safeId);

    clearTimeout(loopInterval);
    loopInterval = null;
    gatherTick = null;
    if (targetProgressBar) targetProgressBar.style.width = '0%';

    // Sounds are disabled for mining; nothing to pause

    try { prevProgress = 0; } catch (e) {}

    if (targetButton) {
        targetButton.classList.remove('btn-stop-active');
        // Use textContent with optional icon for start label
        targetButton.innerHTML = '';
        const label = document.createTextNode(currentType === 'mining' ? 'Mulai Menambang' : 'Mulai Menebang');
        targetButton.appendChild(label);
    }
    activeGatherItem = null;
}

// Jalankan saat layar dimuat
GameStorage.onReady(refreshUI);

// Pastikan interval dibersihkan saat meninggalkan halaman
window.addEventListener('pagehide', () => {
    clearTimeout(loopInterval);
    loopInterval = null;
    gatherTick = null;
});
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) refreshUI();
    if (gatherTick) {
        clearTimeout(loopInterval);
        gatherTick(); // Immediately adapt the progress cadence when switching tabs.
    }
});
