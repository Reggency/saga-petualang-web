console.log("Script Toko Material & Apotek Buff Aktif!");

let player = {};

// Quest board hanya ada di Tavern.
function initQuestBoard() {
    // intentionally no-op
}


function renderQuestBoard() {
    // Quest board hanya ada di Tavern.
    // Sengaja dimatikan agar tidak ada UI/logic quest di halaman Toko.
}

const itemDatabase = GameItemCatalog.items;

const itemMetaByName = itemDatabase.reduce((acc, item) => {
    acc[item.name] = item;
    return acc;
}, {});

function getItemMeta(name) {
    return itemMetaByName[name] || {
        name,
        type: 'Unknown',
        icon: 'fa-box',
        class: 'c-iron',
        category: 'Unknown',
        rarity: 'common',
        description: 'Deskripsi tidak tersedia.',
        sellPrice: 1 // fallback
    };
}

// =========================================================================
// 1. SISTEM PENYIMPANAN DATA (LOAD & SAVE)
// =========================================================================
function loadData() {
    const savedPlayer = GameStorage.getItem('rpg_player');
    if (savedPlayer) {
        player = JSON.parse(savedPlayer);
        
        // Pastikan object-object penting ada (Patch/Keamanan database)
        if (!player.inventory) player.inventory = {};
        if (typeof player.potions === 'undefined') player.potions = 0;
        if (typeof player.manaPotions === 'undefined') player.manaPotions = 0;
        if (!player.equipment) player.equipment = {}; 
        if (!player.tools) player.tools = {};
    } else {
        // Jika tidak ada data player, paksa balik ke arena
        window.location.href = '../Utama/Index.html';
    }
}

function saveData() {
    player = GameStorage.savePlayer(player);
}

// =========================================================================
// 2. SISTEM AUDIO EFEK
// =========================================================================
function playSound(type) {
    try { GameAudio.tone(type); } catch {}
}

// =========================================================================
// 3. UPDATE TAMPILAN KIRI (STATUS & EQUIPMENT)
// =========================================================================
function updateShopUI() {
    if (typeof player.gold !== 'number') player.gold = 0;
    if(document.getElementById('gold')) document.getElementById('gold').innerText = player.gold;
    
    renderSellPanel();

    // Update panel kiri atribut toko
    if(document.getElementById('attack')) {
        // Helper function to calculate stats from equipment, mirroring the main script
        const getStatsFromEquipment = () => {
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
                        case 'atk': case 'attack':
                            equipmentStats.bonusAtk += item.statValue;
                            break;
                        case 'def': case 'defense':
                            equipmentStats.bonusDef += item.statValue;
                            break;
                        case 'dodge':
                            equipmentStats.bonusDodge += item.statValue;
                            break;
                        case 'maxHp': case 'hp':
                            equipmentStats.bonusMaxHp += item.statValue;
                            break;
                        case 'magicDamage': case 'matk':
                            equipmentStats.bonusMagicDamage += item.statValue;
                            break;
                        case 'attackSpeed': case 'aspd':
                            equipmentStats.bonusAttackSpeed += item.statValue;
                            break;
                        case 'maxMana': case 'mana': case 'maxmp':
                            equipmentStats.bonusMaxMana += item.statValue;
                            break;
                    }
                }
            }
            return equipmentStats;
        };

        const eqStats = getStatsFromEquipment();
        const totalAtk = (player.baseAttack || 0) + eqStats.bonusAtk;
        const totalDef = (player.baseDefense || 0) + eqStats.bonusDef;
        const totalDodge = (player.baseDodge || 0) + eqStats.bonusDodge;
        const totalHpMax = (player.maxHp || 0) + eqStats.bonusMaxHp;
        const totalMagic = (player.magicDamage || 0) + eqStats.bonusMagicDamage;
        const totalAtkSpeed = (player.attackSpeed || 10) + eqStats.bonusAttackSpeed;

        // Cetak ke UI Toko
        document.getElementById('shop-hp').innerText = `${player.hp || 0} / ${totalHpMax || 0}`;
        document.getElementById('attack').innerText = totalAtk || 0;
        document.getElementById('defense').innerText = totalDef;
        document.getElementById('magic-dmg').innerText = totalMagic || 0; 
        document.getElementById('dodge').innerText = totalDodge;
        document.getElementById('atk-speed').innerText = totalAtkSpeed || 10;

        // Slot Equipment Aktif
        document.getElementById('eq-weapon').innerText = player.equipment.senjata?.name || "-";
        document.getElementById('eq-armor').innerText = player.equipment.zirah?.name || "-";
        document.getElementById('eq-boots').innerText = player.equipment.sepatu?.name || "-";
        document.getElementById('eq-helmet').innerText = player.equipment.helm?.name || "-";
        document.getElementById('eq-amulet').innerText = player.equipment.amulet?.name || "-";
        document.getElementById('eq-gloves').innerText = player.equipment.sarung_tangan?.name || "-";
        document.getElementById('eq-offhand').innerText = (player.equipment.offhand || player.equipment.katalis)?.name || "-";
    }

    // Validasi visual tombol untuk 6 Pickaxe & 6 Axe
    updateToolButton('pickaxe_copper', 'btn-pickaxe-copper', '⛏️ Beliung Tembaga');
    updateToolButton('pickaxe_iron', 'btn-pickaxe-iron', '⛏️ Beliung Besi');
    updateToolButton('pickaxe_silver', 'btn-pickaxe-silver', '⛏️ Beliung Perak');
    updateToolButton('pickaxe_gold', 'btn-pickaxe-gold', '⛏️ Beliung Emas');
    updateToolButton('pickaxe_titanium', 'btn-pickaxe-titanium', '⛏️ Beliung Titanium');
    updateToolButton('pickaxe_mithril', 'btn-pickaxe-mithril', '⛏️ Beliung Mithril (BOSS)');

    // Kategori Kapak (Axe)
    updateToolButton('axe_balsa', 'btn-axe-balsa', '🪓 Kapak Kayu Balsa');
    updateToolButton('axe_pinus', 'btn-axe-pinus', '🪓 Kapak Kayu Pinus');
    updateToolButton('axe_oak', 'btn-axe-oak', '🪓 Kapak Kayu Oak');
    updateToolButton('axe_ironwood', 'btn-axe-ironwood', '🪓 Kapak Ironwood');
    updateToolButton('axe_mahoni', 'btn-axe-mahoni', '🪓 Kapak Kayu Mahoni');
    updateToolButton('axe_elderwood', 'btn-axe-elderwood', '🪓 Kapak Elderwood (BOSS)');

}

function updateToolButton(idTool, elementId, namaAlat) {
    const btn = document.getElementById(elementId);
    if (!btn) return;
    
    if (player.tools && player.tools[idTool] === true) {
        // Build button content using elements to avoid innerHTML string concatenation
        btn.innerHTML = '';
        const nameEl = document.createElement('span'); nameEl.className = 'item-name'; nameEl.textContent = namaAlat;
        const effectEl = document.createElement('span'); effectEl.className = 'item-effect'; effectEl.style.color = '#2ecc71'; effectEl.style.fontWeight = 'bold'; effectEl.textContent = '[ SUDAH DIMILIKI ]';
        const priceEl = document.createElement('span'); priceEl.className = 'item-price'; priceEl.style.background = '#275338'; priceEl.innerHTML = '<i class="fa-solid fa-check"></i> Terbeli';
        btn.appendChild(nameEl); btn.appendChild(effectEl); btn.appendChild(priceEl);
        GameItemAssets.attach(btn, idTool);
        btn.style.opacity = "0.7";
        btn.style.cursor = "not-allowed";
        btn.onclick = null;
    }
}

window.switchTab = function(tabName) {
    const buyPanel = document.getElementById('buy-panel');
    const sellPanel = document.getElementById('sell-panel');
    const tabBuy = document.getElementById('tab-buy');
    const tabSell = document.getElementById('tab-sell');

    if (!buyPanel || !sellPanel || !tabBuy || !tabSell) return;

    if (tabName === 'sell') {
        buyPanel.style.display = 'none';
        sellPanel.style.display = 'block';
        tabBuy.classList.remove('active');
        tabSell.classList.add('active');
    } else { // 'buy' or default
        buyPanel.style.display = 'block';
        sellPanel.style.display = 'none';
        tabBuy.classList.add('active');
        tabSell.classList.remove('active');
    }
}

window.switchTab = function(tabName) {
    const buyPanel = document.getElementById('buy-panel');
    const sellPanel = document.getElementById('sell-panel');
    const tabBuy = document.getElementById('tab-buy');
    const tabSell = document.getElementById('tab-sell');

    if (!buyPanel || !sellPanel || !tabBuy || !tabSell) return;

    if (tabName === 'sell') {
        buyPanel.style.display = 'none';
        sellPanel.style.display = 'block';
        tabBuy.classList.remove('active');
        tabSell.classList.add('active');
    } else { // 'buy' or default
        buyPanel.style.display = 'block';
        sellPanel.style.display = 'none';
        tabBuy.classList.add('active');
        tabSell.classList.remove('active');
    }
}

function renderSellPanel() {
    const sellPanel = document.getElementById('sell-panel');
    if (!sellPanel) return;

    const inventoryItems = Object.entries(player.inventory || {}).filter(([name, qty]) => qty > 0 && getItemMeta(name).sellPrice !== 0);

    let content = `
        <div class="shop-booth">
            <h4><i class="fa-solid fa-sack-dollar"></i> Jual Barang Rampasan</h4>
            <div class="items-grid sell-grid">
    `;

    if (inventoryItems.length === 0) {
        content += `<p class="no-items-to-sell">Tas kamu kosong. Tidak ada yang bisa dijual.</p>`;
    } else {
        inventoryItems.forEach(([itemName, qty]) => {
            const itemMeta = getItemMeta(itemName);
            const sellPrice = itemMeta.sellPrice ?? 1;
            content += `
                <button class="btn-shop-card sell-card" onclick="sellItem('${itemName}')">
                    <span class="item-name">${itemName} (x${qty})</span>
                    <span class="item-effect">Harga Jual: ${sellPrice} Gold</span>
                    <span class="item-price"><i class="fa-solid fa-dollar-sign"></i> Jual</span>
                </button>
            `;
        });
    }

    content += `</div></div>`;
    sellPanel.innerHTML = content;
    for (const [index, button] of [...sellPanel.querySelectorAll('.sell-card')].entries()) GameItemAssets.attach(button, inventoryItems[index][0]);
}

window.sellItem = async function(itemName) {
    const itemMeta = getItemMeta(itemName);
    const sellPrice = itemMeta.sellPrice ?? 1;
    if (sellPrice <= 0) return;
    const currentQty = (player.inventory && player.inventory[itemName]) || 0;

    if (currentQty <= 0) {
        Swal.fire('Error', 'Kamu tidak memiliki item ini untuk dijual.', 'error');
        return;
    }

    const { value: quantityToSell } = await Swal.fire({
        title: `Jual ${itemName}`,
        html: `
            <div style="text-align: left; margin-top: 10px;">
                <p>Harga jual per unit: <b style="color: #f59e0b;">${sellPrice} Gold</b></p>
                <p>Kamu punya: <b>${currentQty}</b></p>
                <p>Emas kamu saat ini: <b style="color: #f59e0b;">${(player.gold || 0).toLocaleString()} Gold</b></p>
            </div>
        `,
        input: 'number',
        inputLabel: 'Jumlah yang ingin dijual:',
        inputValue: 1,
        inputAttributes: { min: 1, max: currentQty, step: 1 },
        showCancelButton: true,
        confirmButtonText: 'Jual',
        cancelButtonText: 'Batal',
        background: '#13131c',
        color: '#fff',
        preConfirm: (value) => {
            const num = Number(value);
            if (!Number.isSafeInteger(num) || num <= 0) { Swal.showValidationMessage('Jumlah harus lebih dari 0.'); return false; }
            if (num > currentQty) { Swal.showValidationMessage(`Kamu hanya punya ${currentQty} buah.`); return false; }
            return num;
        }
    });

    if (Number.isSafeInteger(quantityToSell) && quantityToSell > 0 && quantityToSell <= (player.inventory[itemName] || 0)) {
        const totalGain = quantityToSell * sellPrice;
        player.gold = (player.gold || 0) + totalGain;
        player.inventory[itemName] -= quantityToSell;
        if (player.inventory[itemName] <= 0) delete player.inventory[itemName];
        saveData();
        updateShopUI();
        Swal.fire({ title: 'Berhasil Dijual!', html: `Kamu menjual ${quantityToSell}x ${itemName} dan mendapatkan <b style="color: #f59e0b;">${totalGain} Gold</b>.`, icon: 'success', background: '#13131c', color: '#fff' });
    }
}
// =========================================================================
// 4. NOTIFIKASI ERROR GLOBAL
// =========================================================================
function alertGagalEmas(price) {
    Swal.fire({
        title: `<span style="font-family: 'Cinzel', serif; color: #e74c3c; letter-spacing:1px;">KANTONG EMAS KOSONG</span>`,
        html: `
            <div style="color: #cbd5e1; font-size: 0.95rem; text-align: center; line-height: 1.6;">
                Pundi-pundi logam mulia milikmu tidak memadai!<br>
                Kamu membutuhkan setidaknya <b style="color: #ffca28;">${price} Gold</b>.
            </div>
        `,
        icon: 'error',
        iconColor: '#e74c3c',
        background: '#13131c',
        confirmButtonColor: '#c0392b',
        confirmButtonText: '<i class="fa-solid fa-skull"></i> Kembali Berburu',
        customClass: { popup: 'rpg-swal-popup', confirmButton: 'rpg-swal-btn' }
    });
}

// =========================================================================
// 5. TRANSAKSI TOKO: POTION (BULK BUY / BELI BANYAK)
// =========================================================================
window.beliPotion = function(id, nama, hargaSatuan) {
    Swal.fire({
        title: `<span style="font-family: 'Cinzel', serif; color: #ec4899; letter-spacing:1px;">APOTEK DESA</span>`,
        html: `
            <div style="color: #cbd5e1; font-size: 0.95rem; text-align: center; margin-bottom: 10px;">
                Harga satuan: <b style="color: #ffca28;">${hargaSatuan} Gold</b>.<br>
                Emas Anda: <b style="color: #2ecc71;">${player.gold} Gold</b>.<br><br>
                Masukkan jumlah <b style="color: #fff;">${nama}</b> yang ingin dibeli:
            </div>
        `,
        input: 'number',
        inputAttributes: { min: 1, step: 1, style: 'text-align: center; background: #1c1c24; color: #fff; border: 1px solid #4a3b23; max-width: 150px; margin: 0 auto;' },
        inputValue: 1,
        showCancelButton: true,
        confirmButtonColor: '#ec4899',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Beli',
        cancelButtonText: 'Batal',
        background: '#13131c',
        customClass: { popup: 'rpg-swal-popup', confirmButton: 'rpg-swal-btn' },
        preConfirm: (quantity) => {
            const jumlah = Number(quantity);
            if (!Number.isSafeInteger(jumlah) || jumlah <= 0) return Swal.showValidationMessage('Minimal beli 1 botol!');
            return jumlah;
        }
    }).then((result) => {
        if (result.isConfirmed) {
            const jumlahBeli = Number(result.value);
            if (!Number.isSafeInteger(jumlahBeli) || jumlahBeli <= 0 || !Number.isSafeInteger(jumlahBeli * hargaSatuan) || hargaSatuan <= 0) return;
            const totalBiaya = jumlahBeli * hargaSatuan;

            if (player.gold >= totalBiaya) {
                player.gold -= totalBiaya;
                player.potions += jumlahBeli;
                
                playSound('buy');
                Swal.fire({
                    title: 'BERHASIL DIBELI!',
                    html: `<div style="color: #cbd5e1;">Mendapatkan <b style="color: #fff;">${jumlahBeli}x ${nama}</b>.<br><small style="color: #ffca28;">-${totalBiaya} Gold</small></div>`,
                    icon: 'success', iconColor: '#ec4899', background: '#13131c', confirmButtonColor: '#ec4899'
                });
                saveData(); updateShopUI();
            } else {
                playSound('error'); alertGagalEmas(totalBiaya);
            }
        }
    });
};

window.beliManaPotion = function(id, nama, hargaSatuan) {
    Swal.fire({
        title: `<span style="font-family: 'Cinzel', serif; color: #3b82f6; letter-spacing:1px;">SUMUR MANA</span>`,
        html: `
            <div style="color: #cbd5e1; font-size: 0.95rem; text-align: center; margin-bottom: 10px;">
                Harga satuan: <b style="color: #ffca28;">${hargaSatuan} Gold</b>.<br>
                Emas Anda: <b style="color: #2ecc71;">${player.gold} Gold</b>.<br><br>
                Masukkan jumlah <b style="color: #fff;">${nama}</b> yang ingin dibeli:
            </div>
        `,
        input: 'number',
        inputAttributes: { min: 1, step: 1, style: 'text-align: center; background: #1c1c24; color: #fff; border: 1px solid #4a3b23; max-width: 150px; margin: 0 auto;' },
        inputValue: 1,
        showCancelButton: true,
        confirmButtonColor: '#3b82f6',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Beli',
        cancelButtonText: 'Batal',
        background: '#13131c',
        customClass: { popup: 'rpg-swal-popup', confirmButton: 'rpg-swal-btn' },
        preConfirm: (quantity) => {
            const jumlah = Number(quantity);
            if (!Number.isSafeInteger(jumlah) || jumlah <= 0) return Swal.showValidationMessage('Minimal beli 1 botol!');
            return jumlah;
        }
    }).then((result) => {
        if (result.isConfirmed) {
            const jumlahBeli = Number(result.value);
            if (!Number.isSafeInteger(jumlahBeli) || jumlahBeli <= 0 || !Number.isSafeInteger(jumlahBeli * hargaSatuan) || hargaSatuan <= 0) return;
            const totalBiaya = jumlahBeli * hargaSatuan;

            if (player.gold >= totalBiaya) {
                player.gold -= totalBiaya;
                player.manaPotions = (player.manaPotions || 0) + jumlahBeli;
                
                playSound('buy');
                Swal.fire({
                    title: 'BERHASIL DIBELI!',
                    html: `<div style="color: #cbd5e1;">Mendapatkan <b style="color: #fff;">${jumlahBeli}x ${nama}</b>.<br><small style="color: #ffca28;">-${totalBiaya} Gold</small></div>`,
                    icon: 'success', iconColor: '#3b82f6', background: '#13131c', confirmButtonColor: '#3b82f6'
                });
                saveData(); updateShopUI();
            } else {
                playSound('error'); alertGagalEmas(totalBiaya);
            }
        }
    });
};

// =========================================================================
// 6. TRANSAKSI TOKO: MATERIAL CRAFTING (TERKONEKSI KE INVENTORY)
// =========================================================================
window.beliMaterial = function(idMaterial, nama, hargaSatuan) {
    // Ambil data jumlah terkini dari inventory (mendukung nama bersih maupun id)
    const cleanName = GameItemCatalog.aliases[idMaterial];
    if (!cleanName) return;
    
    let jumlahSaatIni = player.inventory[cleanName] || player.inventory[idMaterial] || 0;

    Swal.fire({
        title: `<span style="font-family: 'Cinzel', serif; color: #3498db; letter-spacing:1px;">PENGEPUL MATERIAL</span>`,
        html: `
            <div style="color: #cbd5e1; font-size: 0.95rem; text-align: center; margin-bottom: 10px;">
                Harga satuan: <b style="color: #ffca28;">${hargaSatuan} Gold</b>.<br>
                Emas Anda: <b style="color: #2ecc71;">${player.gold} Gold</b>.<br>
                Material Anda saat ini: <b>${jumlahSaatIni} buah</b>.<br><br>
                Berapa banyak <b style="color: #fff;">${nama}</b> yang ingin dibeli?
            </div>
        `,
        input: 'number',
        inputAttributes: { min: 1, step: 1, style: 'text-align: center; background: #1c1c24; color: #fff; border: 1px solid #4a3b23; max-width: 150px; margin: 0 auto;' },
        inputValue: 1,
        showCancelButton: true,
        confirmButtonColor: '#3498db',
        cancelButtonColor: '#7f8c8d',
        confirmButtonText: 'Borong',
        cancelButtonText: 'Batal',
        background: '#13131c',
        customClass: { popup: 'rpg-swal-popup', confirmButton: 'rpg-swal-btn' },
        preConfirm: (quantity) => {
            const jumlah = Number(quantity);
            if (!Number.isSafeInteger(jumlah) || jumlah <= 0) return Swal.showValidationMessage('Minimal beli 1 buah!');
            return jumlah;
        }
    }).then((result) => {
        if (result.isConfirmed) {
            const jumlahBeli = Number(result.value);
            if (!Number.isSafeInteger(jumlahBeli) || jumlahBeli <= 0 || !Number.isSafeInteger(jumlahBeli * hargaSatuan) || hargaSatuan <= 0) return;
            const totalBiaya = jumlahBeli * hargaSatuan;

            if (player.gold >= totalBiaya) {
                player.gold -= totalBiaya;
                
                if (!player.inventory) player.inventory = {};
                // Use canonical item name (cleanName) so inventory keys match Inventory/itemDatabase
                player.inventory[cleanName] = (player.inventory[cleanName] || 0) + jumlahBeli;
                // A material has one canonical stack.
                delete player.inventory[idMaterial];
                
                playSound('buy');
                Swal.fire({
                    title: 'MATERIAL MASUK TAS!',
                    html: `<div style="color: #cbd5e1;">Mendapatkan <b style="color: #fff;">${jumlahBeli}x ${cleanName}</b>.<br><small style="color: #ffca28;">-${totalBiaya} Gold</small></div>`,
                    icon: 'success', iconColor: '#3498db', background: '#13131c', confirmButtonColor: '#3498db'
                });
                
                saveData(); 
                updateShopUI();

                // Jika grid inventory dirender di halaman yang sama, paksa update real-time
                if (typeof loadInventory === 'function') {
                    loadInventory();
                }
            } else {
                playSound('error'); alertGagalEmas(totalBiaya);
            }
        }
    });
};

// =========================================================================
// 7. TRANSAKSI TOKO: BUFF DURASI (LANGSUNG KLIK, NO BULK)
// =========================================================================
window.beliBuff = function(tipeBuff, nama, harga, durasiMenit) {
    let buffKey = 'buff_' + tipeBuff;
    let buffExpire = GameStorage.getItem(buffKey);
    let now = Date.now();

    if (buffExpire && now < parseInt(buffExpire)) {
        let sisaMs = parseInt(buffExpire) - now;
        let sisaMenit = Math.ceil(sisaMs / 60000);
        
        playSound('error');
        Swal.fire({
            title: 'EFEK MASIH AKTIF!',
            html: `<div style="color: #cbd5e1;">Kekuatan <b>${nama}</b> masih mengalir di nadimu.<br>Sisa durasi: <b style="color: #e74c3c;">${sisaMenit} Menit</b>.</div>`,
            icon: 'warning', iconColor: '#f39c12', background: '#13131c', confirmButtonColor: '#e67e22', confirmButtonText: 'Tutup'
        });
        return;
    }

    if (player.gold >= harga) {
        player.gold -= harga;
        
        let expiredTime = now + (durasiMenit * 60000);
        player = GameStorage.savePlayer(player, { [buffKey]: expiredTime });
        
        playSound('levelup');
        Swal.fire({
            title: 'RAMUAN DIMINUM!',
            html: `<div style="color: #cbd5e1;">Kamu menenggak <b>${nama}</b>.<br>Atributmu meningkat tajam selama <b style="color: #2ecc71;">${durasiMenit} Menit</b> ke depan!</div>`,
            icon: 'success', iconColor: '#9b59b6', background: '#13131c', confirmButtonColor: '#8e44ad'
        });
        
        saveData(); updateShopUI();
    } else {
        playSound('error'); alertGagalEmas(harga);
    }
};

// =========================================================================
// 9. TRANSAKSI TOKO: PERKAKAS GATHERING (AXE & PICKAXE)
// =========================================================================
window.beliTool = function(idTool, nama, jenisProfesi, minLevel, speedMultiplier, harga) {
    if (player.tools && player.tools[idTool] === true) {
        playSound('error');
        Swal.fire({
            title: 'SUDAH DIMILIKI!',
            html: `<div style="color: #cbd5e1;">Perkakas <b>${nama}</b> sudah aman berada dalam inventaris kerjamu.</div>`,
            icon: 'info', iconColor: '#3498db', background: '#13131c', confirmButtonColor: '#2980b9'
        });
        return;
    }

    let currentProfesiLevel = player.professions[jenisProfesi]?.level || 1;
    if (typeof player[jenisProfesi] === 'number') {
        currentProfesiLevel = player[jenisProfesi];
    } else if (player.profesi && typeof player.profesi[jenisProfesi] === 'number') {
        currentProfesiLevel = player.profesi[jenisProfesi];
    } else if (player.stats && typeof player.stats[jenisProfesi] === 'number') {
        currentProfesiLevel = player.stats[jenisProfesi];
    }

    if (player.gold >= harga) {
        player.gold -= harga;
        
        if (!player.tools) player.tools = {};
        player.tools[idTool] = true;
        
        playSound('buy');
        const namaProfesi = jenisProfesi === 'mining' ? 'Penambangan' : 'Penebangan';

        if (currentProfesiLevel >= minLevel) {
            Swal.fire({
                title: 'PERKAKAS SIAP PAKAI!',
                html: `
                    <div style="color: #cbd5e1; text-align: center;">
                        Berhasil membeli <b>${nama}</b>!<br>
                        <span style="color: #2ecc71; font-weight: bold;">✔ Level ${namaProfesi} kamu memadai (Lv. ${currentProfesiLevel}). Alat langsung aktif!</span><br>
                        <small style="color: #ffca28;">-${harga} Gold</small>
                    </div>
                `,
                icon: 'success', iconColor: '#2ecc71', background: '#13131c', confirmButtonColor: '#2ecc71'
            });
        } else {
            Swal.fire({
                title: 'TERBELI & DISIMPAN!',
                html: `
                    <div style="color: #cbd5e1; text-align: center;">
                        Berhasil membeli <b>${nama}</b>!<br>
                        <span style="color: #e74c3c; font-weight: bold;">⚠ Perhatian: Disimpan di Tas Kerja.</span><br>
                        Kamu baru bisa menggunakan alat ini setelah level <b>${namaProfesi}</b> mencapai <b style="color: #f1c40f;">Lv. ${minLevel}</b> (Levelmu saat ini: Lv. ${currentProfesiLevel}).<br>
                        <small style="color: #ffca28;">-${harga} Gold</small>
                    </div>
                `,
                icon: 'warning', iconColor: '#f39c12', background: '#13131c', confirmButtonColor: '#e67e22'
            });
        }
        
        saveData(); 
        updateShopUI();
    } else {
        playSound('error'); 
        alertGagalEmas(harga);
    }
};

// =========================================================================
// 8. KEMBALI KE ARENA
// =========================================================================
const btnBack = document.getElementById('btn-back');
if (btnBack) {
    btnBack.addEventListener('click', () => { 
        saveData(); 
        window.location.href = '../Utama/Index.html'; 
    });
}

// Inisialisasi awal saat halaman diload
loadData();
updateShopUI();
