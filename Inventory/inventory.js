// =========================================================================
// 1. KATEGORI MATERIAL CRAFTING
// =========================================================================
const SLOT_COUNT_PER_CATEGORY = 16;
const inventoryCategories = ['Material Drop', 'Mining', 'Ingot', 'Wood', 'Equipment'];
const inventoryTabs = ['All', 'Material Drop', 'Mining', 'Ore', 'Wood', 'Equipment'];

const itemDatabase = GameItemCatalog.items;

const itemMetaByName = itemDatabase.reduce((acc, item) => {
    acc[item.name] = item;
    return acc;
}, {});

// =========================================================================
// 3. TOAST SYSTEM (NOTIFIKASI GAME)
// =========================================================================
// Safe writer helper to merge and log who wrote the save
function writePlayerSafe(obj) { return GameStorage.savePlayer(obj); }
function showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `custom-toast ${type}`;
    let icon = type === 'success' ? 'fa-circle-check' : type === 'danger' ? 'fa-circle-exclamation' : 'fa-info-circle';
    const iEl = document.createElement('i'); iEl.className = `fa-solid ${icon}`;
    const span = document.createElement('span'); span.textContent = message;
    toast.appendChild(iEl);
    toast.appendChild(document.createTextNode(' '));
    toast.appendChild(span);
    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 50);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

const inventoryTooltip = (() => {
    const tooltip = document.createElement('div');
    tooltip.className = 'item-tooltip';
    document.body.appendChild(tooltip);
    return tooltip;
})();
let activeInventoryTab = 'Material Drop';

function getItemMeta(name) {
    return itemMetaByName[name] || {
        name,
        type: 'Unknown',
        icon: 'fa-box',
        class: 'c-iron',
        category: 'Unknown',
        rarity: 'common',
        description: 'Deskripsi tidak tersedia.'
    };
}

function guessItemCategory(itemName) {
    const normalized = (itemName || '').toString().toLowerCase().trim();
    if (!normalized) return 'Material Drop';
    if (normalized.includes('ore') || normalized.includes('bijih')) return 'Mining';
    if (normalized.includes('ingot') || normalized.includes('logam') || normalized.includes('tempa') || normalized.includes('batu bara')) return 'Ingot';
    if (normalized.includes('kayu') || normalized.includes('wood') || normalized.includes('pohon')) return 'Wood';
    if (normalized.match(/pedang|sword|panah|arrow|belati|dagger|helm|armor|zirah|robe|shield|pelindung|amulet|necklace|kalung|jimat/)) return 'Equipment';
    return 'Material Drop';
}

function buildInventoryCountsFromSlots(slotsObj) {
    const counts = {};
    if (!slotsObj || typeof slotsObj !== 'object') return counts;
    Object.values(slotsObj).forEach(slotArray => {
        if (!Array.isArray(slotArray)) return;
        slotArray.forEach(slot => {
            if (slot && slot.name && slot.qty) {
                counts[slot.name] = (counts[slot.name] || 0) + Number(slot.qty);
            }
        });
    });
    return counts;
}

function migrateLegacySlotStructure(player) {
    if (!player.inventory || typeof player.inventory !== 'object') return false;
    const hasCategoryArrays = inventoryCategories.some(category => Array.isArray(player.inventory[category]));
    if (!hasCategoryArrays) return false;

    player.inventorySlots = {};
    inventoryCategories.forEach(category => {
        player.inventorySlots[category] = Array.isArray(player.inventory[category]) && player.inventory[category].length === SLOT_COUNT_PER_CATEGORY
            ? player.inventory[category]
            : Array(SLOT_COUNT_PER_CATEGORY).fill(null);
    });

    const countMap = buildInventoryCountsFromSlots(player.inventory);
    player.inventory = countMap;
    player._inventoryMigrated = true;
    return true;
}

function migrateLegacyInventory(player, legacyMaterials = {}) {
    if (player._inventoryMigrated) return false;
    if (!player.inventorySlots || typeof player.inventorySlots !== 'object') {
        player.inventorySlots = {};
    }

    const restoredFromSlots = migrateLegacySlotStructure(player);
    if (restoredFromSlots) {
        return true;
    }

    if (!legacyMaterials || typeof legacyMaterials !== 'object') return false;
    const legacyEntries = Object.entries(legacyMaterials).filter(([itemName, qty]) => itemName && qty && Number(qty) > 0 && !GameCore.isRetiredAccessory({ name: itemName }));
    if (legacyEntries.length === 0) {
        player._inventoryMigrated = true;
        return false;
    }

    inventoryCategories.forEach(category => {
        if (!Array.isArray(player.inventorySlots[category]) || player.inventorySlots[category].length !== SLOT_COUNT_PER_CATEGORY) {
            player.inventorySlots[category] = Array(SLOT_COUNT_PER_CATEGORY).fill(null);
        }
    });

    let migrated = false;
    legacyEntries.forEach(([itemName, qty]) => {
        const meta = getItemMeta(itemName);
        const category = inventoryCategories.includes(meta.category) ? meta.category : guessItemCategory(itemName);
        const slots = player.inventorySlots[category];
        const existingIndex = slots.findIndex(slot => slot && slot.name === itemName);
        if (existingIndex !== -1) {
            slots[existingIndex].qty += Number(qty) || 0;
            migrated = true;
        } else {
            const emptyIndex = slots.findIndex(slot => !slot);
            if (emptyIndex !== -1) {
                slots[emptyIndex] = { name: itemName, qty: Number(qty) || 1 };
                migrated = true;
            }
        }
        if (!player.inventory || typeof player.inventory !== 'object') {
            player.inventory = {};
        }
        player.inventory[itemName] = (player.inventory[itemName] || 0) + Number(qty);
    });

    player._inventoryMigrated = true;
    return migrated;
}

function reconstructInventorySlotsFromCounts(player) {
    if (!player.inventory || typeof player.inventory !== 'object') return false;
    if (!player.inventorySlots || typeof player.inventorySlots !== 'object') {
        player.inventorySlots = {};
    }

    inventoryCategories.forEach(category => {
        player.inventorySlots[category] = Array(SLOT_COUNT_PER_CATEGORY).fill(null);
    });

    const entries = Object.entries(player.inventory).filter(([itemName, qty]) => itemName && qty && Number(qty) > 0);
    if (entries.length === 0) return false;

    let wroteSomething = false;
    entries.forEach(([itemName, qty]) => {
        const meta = getItemMeta(itemName);
        const category = inventoryCategories.includes(meta.category) ? meta.category : guessItemCategory(itemName);
        const slots = player.inventorySlots[category];
        const existingIndex = slots.findIndex(slot => slot && slot.name === itemName);
        if (existingIndex !== -1) {
            slots[existingIndex].qty = Number(qty) || 0;
            wroteSomething = true;
            return;
        }

        const emptyIndex = slots.findIndex(slot => !slot);
        if (emptyIndex !== -1) {
            slots[emptyIndex] = { name: itemName, qty: Number(qty) || 1 };
            wroteSomething = true;
        } else {
            slots.push({ name: itemName, qty: Number(qty) });
            wroteSomething = true;
        }
    });

    return wroteSomething;
}

function ensurePlayerInventory(player, legacyMaterials = {}) {
    // Counts are authoritative. Slot arrays are only a presentation of those counts.
    if (!player.inventory || typeof player.inventory !== 'object') {
        player.inventory = Object.keys(legacyMaterials).length ? { ...legacyMaterials }
            : buildInventoryCountsFromSlots(player.inventorySlots || {});
    }
    reconstructInventorySlotsFromCounts(player);
    return player.inventorySlots;
}

window.addItem = function(itemName, amount = 1) {
    if (!Number.isSafeInteger(amount) || amount <= 0) return;
    const player = JSON.parse(GameStorage.getItem('rpg_player')) || {};
    ensurePlayerInventory(player);
    const meta = getItemMeta(itemName);
    if (!meta || meta.category === 'Unknown') {
        showToast(`Item \"${itemName}\" tidak dikenali.`, 'danger');
        return;
    }
    let category = meta.category;
    if (!inventoryCategories.includes(category)) {
        category = guessItemCategory(itemName);
    }
    if (!inventoryCategories.includes(category)) {
        showToast(`Kategori ${category} tidak valid untuk inventory.`, 'danger');
        return;
    }

    const categorySlots = player.inventorySlots[category] || Array(SLOT_COUNT_PER_CATEGORY).fill(null);
    const existingIndex = categorySlots.findIndex(slot => slot && slot.name === itemName);
    if (existingIndex !== -1) {
        categorySlots[existingIndex].qty += Number(amount) || 1;
        player.inventory[itemName] = (player.inventory[itemName] || 0) + Number(amount);
        player.inventorySlots[category] = categorySlots;
        writePlayerSafe(player, 'inventory.js:addItem');
        showToast(`✚ Tambah ${amount}x ${itemName}`, 'success');
        loadInventory();
        return;
    }

    const emptyIndex = categorySlots.findIndex(slot => !slot);
    if (emptyIndex === -1) {
        if (category === 'Material Drop') {
            categorySlots.push({ name: itemName, qty: Number(amount) || 1 });
            player.inventory[itemName] = (player.inventory[itemName] || 0) + Number(amount);
            player.inventorySlots[category] = categorySlots;
            writePlayerSafe(player, 'inventory.js:addItem');
            showToast(`✨ Slot Material Drop ditambahkan otomatis dan ${itemName} masuk.`, 'success');
            loadInventory();
            return;
        }

        showToast(`Slot ${category} penuh. Hapus barang terlebih dahulu.`, 'danger');
        return;
    }

    categorySlots[emptyIndex] = { name: itemName, qty: Number(amount) || 1 };
    player.inventory[itemName] = (player.inventory[itemName] || 0) + Number(amount);
    player.inventorySlots[category] = categorySlots;
    writePlayerSafe(player, 'inventory.js:addItem');
    showToast(`✨ ${itemName} masuk ke slot ${category} ${emptyIndex + 1}.`, 'success');
    loadInventory();
}

function showInventoryTooltip(event) {
    const slot = event.currentTarget;
    const name = slot.dataset.itemName;
    const category = slot.dataset.category;
    const description = slot.dataset.description;
    const rarity = slot.dataset.rarity || 'common';
    if (!name) return;

    inventoryTooltip.innerHTML = `
        <span class="tooltip-name">${GameCore.escapeHtml(name)}</span>
        <span class="tooltip-category">${GameCore.escapeHtml(category)}</span>
        <p class="tooltip-desc">${GameCore.escapeHtml(description)}</p>
    `;
    inventoryTooltip.classList.add('show');
    GameItemAssets.attach(inventoryTooltip, name, { compact: true });
    moveInventoryTooltip(event);
}

function renderInventoryTabs() {
    const tabsEl = document.getElementById('inventory-tabs');
    if (!tabsEl) return;
    tabsEl.innerHTML = '';

    inventoryTabs.forEach(tab => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `inventory-tab-btn${tab === activeInventoryTab ? ' active' : ''}`;
        button.textContent = tab;
        button.addEventListener('click', () => {
            activeInventoryTab = tab;
            applyInventoryTabFilter();
            renderInventoryTabs();
        });
        tabsEl.appendChild(button);
    });
}

function applyInventoryTabFilter() {
    const tabMap = {
        'All': ['material', 'mining', 'ingot', 'wood', 'equipment'],
        'Material Drop': ['material'],
        'Mining': ['mining'],
        'Ore': ['ingot'],
        'Wood': ['wood'],
        'Equipment': ['equipment']
    };
    const visibleSections = tabMap[activeInventoryTab] || ['material', 'mining', 'ingot', 'wood', 'equipment'];

    const sections = [
        { id: 'material', title: 'title-material' },
        { id: 'mining', title: 'title-mining' },
        { id: 'ingot', title: 'title-ingot' },
        { id: 'wood', title: 'title-wood' },
        { id: 'equipment', title: 'title-equipment' }
    ];

    sections.forEach(section => {
        const grid = document.getElementById(`grid-${section.id}`);
        const title = document.getElementById(section.title);
        const show = visibleSections.includes(section.id);
        if (grid) grid.style.display = show ? 'grid' : 'none';
        if (title) title.style.display = show ? 'flex' : 'none';
    });
}

function moveInventoryTooltip(event) {
    const offset = 18;
    const left = event.clientX + offset;
    const top = event.clientY + offset;
    inventoryTooltip.style.left = `${left}px`;
    inventoryTooltip.style.top = `${top}px`;
}

function hideInventoryTooltip() {
    inventoryTooltip.classList.remove('show');
}

// =========================================================================
// 4. HELPER DETEKSI SLOT ITEM (Menentukan Slot Berdasarkan Nama Barang)
// =========================================================================
function normalisasiTipeSlot(tipeSlot) {
    const slot = (tipeSlot || '').toString().toLowerCase().trim();
    const aliasSlot = {
        weapon: 'senjata',
        armor: 'zirah',
        armour: 'zirah',
        catalyst: 'offhand',
        katalis: 'offhand',
        gloves: 'sarung_tangan',
        glove: 'sarung_tangan'
    };
    const slotFinal = aliasSlot[slot] || slot;
    const slotValid = ['senjata', 'zirah', 'sepatu', 'helm', 'amulet', 'sarung_tangan', 'offhand'];
    return slotValid.includes(slotFinal) ? slotFinal : '';
}

function dapatkanTipeSlot(namaBarang, tipeSlotTersimpan = '') {
    if (GameCore.isRetiredAccessory({ name: namaBarang, slot: tipeSlotTersimpan })) return '';
    const slotTersimpan = normalisasiTipeSlot(tipeSlotTersimpan);
    if (slotTersimpan) return slotTersimpan;

    if (!namaBarang) return 'senjata';
    let nameLower = (namaBarang || '').toString().toLowerCase().trim();

    // Deteksi Aksesoris (Wajib Paling Atas agar tidak tertimpa deteksi zirah/senjata)
    if (nameLower.match(/amulet|kalung|gantungan|charm|medali|insignia|necklace|jimat|relik|relic|eye of/)) return 'amulet';
    
    // Gloves, Gauntlet, Bracer, Vambrace, Cakar dipaksa masuk Slot Sarung Tangan
    if (nameLower.match(/sarung tangan|bracer|glove|grips|gauntlet|sarung|cakar|claws|vambrace|mittens/)) return 'sarung_tangan';

    // Armor set biasa / naga
    if (nameLower.match(/helm|topi|pelindung kepala|hood|ikat kepala|masker|visor|crown|gaze|caping|diadem|cowl|goggles/)) return 'helm';
    if (nameLower.match(/zirah|baju|pakaian|jubah|rompi|mantel|brigandine|tunic|hauberk|robe|armor|chest|regalia|garment/)) return 'zirah';
    if (nameLower.match(/sepatu|sandal|boots|treads|greaves|pelindung kaki|legging/)) return 'sepatu';
    if (nameLower.match(/tameng|perisai|quiver|case|buku|orb|tome|mirror|katalis|catalyst/)) return 'offhand'; 

    return 'senjata'; 
}

// =========================================================================
// 5. HELPER DETEKSI RAK INVENTORY (Pemisah Antara Job & Aksesoris Umum)
// =========================================================================
function normalisasiJob(job) {
    const jobFinal = (job || '').toString().toLowerCase().trim();
    return ['fighter', 'mage', 'archer', 'assassin'].includes(jobFinal) ? jobFinal : '';
}

function dapatkanClassJob(namaBarang, tipeSlot, jobTersimpan = '', statType = '') {
    // Jimat tetap berada di rak aksesori umum.
    if (tipeSlot === 'amulet') {
        return 'general';
    }

    const jobDariItem = normalisasiJob(jobTersimpan);
    if (jobDariItem) return jobDariItem;

    const statLower = (statType || '').toString().toLowerCase().trim();
    if (['matk', 'mdef', 'maxmp', 'mp', 'magic', 'magicdamage'].includes(statLower)) return 'mage';

    let nameLower = (namaBarang || '').toString().toLowerCase().trim();
    if (nameLower.match(/bow|panah|busur|quiver|archer|angin|crossbow|hunter|sniper/)) return 'archer';
    if (nameLower.match(/tongkat|sihir|wand|staff|robe|jubah sihir|buku sihir|orb|magic|penyihir|diadem|regalia|archmage|apocalyptic|pyroclastic|hellfire|scorching|essence mirror|dragon flame|infernal/)) return 'mage';
    if (nameLower.match(/belati|dagger|pisau|knife|claw|shuriken|kunai|assassin|bayangan/)) return 'assassin';
    
    return 'fighter'; 
}

// =========================================================================
// 7. ACTION: CRAFTING BARU / TAMBAH ITEM
// =========================================================================
window.tambahSenjataHasilCrafting = function(name, icon, color, rarityClass = '', statType = 'atk', statValue = 0) {
    let player = JSON.parse(GameStorage.getItem('rpg_player')) || {};
    if (!player.items) player.items = []; 
    const existingItem = player.items.find(w => w.name === name);
    if (existingItem) {
        existingItem.qty += 1;
    } else {
        player.items.push({ name, icon, color, rarityClass, statType, statValue, qty: 1 });
    }
    writePlayerSafe(player, 'inventory.js:tambahSenjataHasilCrafting');
    showToast(`🔨 Berhasil merakit [${name}]!`, 'success');
    loadInventory();
};

// =========================================================================
// 8. ACTION: TOMBOL PAKAI & LEPAS PERALATAN (REFACTORED)
// =========================================================================
window.toggleEquipItem = function(itemName) {
    let player = JSON.parse(GameStorage.getItem('rpg_player')) || {};
    if (!player.equipment) player.equipment = {};

    const itemData = player.items.find(w => w.name === itemName);
    if (!itemData) {
        showToast(`Item ${itemName} tidak ditemukan di tas!`, 'danger');
        return;
    }

    // Tentukan slot item
    const itemSlot = dapatkanTipeSlot(itemName, itemData.slot);
    if (!itemSlot || GameCore.isRetiredAccessory(itemData)) return;

    // Jika item sudah dipakai di slotnya, maka lepas
    if (player.equipment[itemSlot] && player.equipment[itemSlot].name === itemName) {
        player.equipment[itemSlot] = null;
        showToast(`[📦] ${itemName} dilepas dari slot ${itemSlot}.`, 'danger');
    } else {
        // Jika belum, pasang item dengan seluruh datanya
        player.equipment[itemSlot] = itemData;
        showToast(`[⚔️] ${itemName} dipasang ke slot ${itemSlot.toUpperCase()}!`, 'success');
    }

    writePlayerSafe(player, 'inventory.js:toggleEquipItem');
    loadInventory(); // Re-render the inventory UI
};

// =========================================================================
// 9. RENDER UI UTAMA INVENTORY (Membangun Item Grid & Pengaman Job)
// =========================================================================
function loadInventory() {
    const localPlayer = JSON.parse(GameStorage.getItem('rpg_player')) || {};
    document.getElementById('inventory-potions').textContent = localPlayer.potions || 0;
    document.getElementById('inventory-mana-potions').textContent = localPlayer.manaPotions || 0;
    const localGameData = JSON.parse(GameStorage.getItem('rpg_game_data')) || {};
    const legacyMaterials = {
        ...(localGameData.materials || {}),
        ...(localGameData.inventory || {}),
        ...(localPlayer.materials || {}),
        ...(localPlayer.inventory || {})
    };
    ensurePlayerInventory(localPlayer, legacyMaterials);

    function renderInventoryCategory(category, gridId) {
        const gridEl = document.getElementById(gridId);
        if (!gridEl) return;
        gridEl.innerHTML = '';
        const fragment = document.createDocumentFragment();
        const slots = localPlayer.inventorySlots && Array.isArray(localPlayer.inventorySlots[category])
            ? localPlayer.inventorySlots[category]
            : Array(SLOT_COUNT_PER_CATEGORY).fill(null);

        slots.forEach(slot => {
            const tile = document.createElement('div');
            tile.className = 'slot-item inventory-slot';

            if (!slot) {
                tile.classList.add('empty-slot');
                tile.innerHTML = `
                    <div class="empty-slot-icon"><i class="fa-solid fa-square-plus"></i></div>
                    <span class="slot-empty-text">Slot Kosong</span>
                `;
            } else {
                const item = getItemMeta(slot.name);
                tile.classList.add(`rarity-${item.rarity || 'common'}`);
                tile.dataset.itemName = item.name;
                tile.dataset.category = item.category;
                tile.dataset.description = item.description;
                tile.dataset.rarity = item.rarity;
                tile.innerHTML = `
                    <div class="slot-icon ${item.class}"></div>
                    <span class="slot-name">${GameCore.escapeHtml(item.name)}</span>
                    <span class="slot-qty">${slot.qty}</span>
                `;
                tile.querySelector('.slot-icon').append(GameItemCatalog.createVisual(item));
                tile.addEventListener('mouseenter', showInventoryTooltip);
                tile.addEventListener('mousemove', moveInventoryTooltip);
                tile.addEventListener('mouseleave', hideInventoryTooltip);
            }

            fragment.appendChild(tile);
        });

        gridEl.appendChild(fragment);
    }

    renderInventoryTabs();
    renderInventoryCategory('Material Drop', 'grid-material');
    renderInventoryCategory('Mining', 'grid-mining');
    renderInventoryCategory('Ingot', 'grid-ingot');
    renderInventoryCategory('Wood', 'grid-wood');
    renderInventoryCategory('Equipment', 'grid-equipment');
    const equipmentGrid = document.getElementById('grid-equipment');
    if (equipmentGrid) for (const item of localPlayer.items) {
        if (GameCore.isRetiredAccessory(item)) continue;
        const slot = dapatkanTipeSlot(item.name, item.slot);
        const equipped = localPlayer.equipment[slot]?.name === item.name;
        const tile = document.createElement('div');
        tile.className = 'slot-item inventory-slot';
        const name = document.createElement('span');
        name.className = 'slot-name';
        name.textContent = item.name;
        const stats = document.createElement('span');
        stats.className = 'slot-qty';
        stats.textContent = `${item.statType || 'atk'} +${item.statValue || 0}`;
        const button = document.createElement('button');
        button.textContent = equipped ? 'Lepas' : 'Pakai';
        button.addEventListener('click', () => toggleEquipItem(item.name));
        tile.classList.add(`rarity-${GameItemCatalog.visual(item).rarity}`);
        const art = GameItemCatalog.createVisual(item);
        art.classList.add('slot-icon');
        tile.append(art, name, stats, button);
        const member = GameEquipmentSets.membership(item, slot);
        if (member) {
            const label = document.createElement('small');
            label.className = 'equipment-set-label';
            label.textContent = `Set: ${member.set.name}`;
            tile.append(label);
        }
        equipmentGrid.append(tile);
    }
    applyInventoryTabFilter();
}

// =========================================================================
// INTERFACE ENGINE JALAN OTOMATIS
// =========================================================================
GameStorage.onReady(loadInventory);
