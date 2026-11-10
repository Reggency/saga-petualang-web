// =======================================================
// SYSTEM MULTI-SLOT CHARACTER & AUTOMATIC SYNC
// =======================================================

// Safe writer helper to merge and log who wrote the save
function writePlayerSafe(obj) { return GameStorage.savePlayer(obj); }

// 1. Ambil data akun yang sedang aktif dari Session Storage
const currentAccount = sessionStorage.getItem('rpg_current_player') || 'GUEST';
const slotsKey = `rpg_slots_${currentAccount}`;

// FIX: PROTEKSI HALAMAN (Jika belum login, paksa balik ke folder Login)
if (!currentAccount || currentAccount === 'GUEST') {
    window.location.href = '../Login/Login.html';
}

// Ambil list 4 slot milik akun ini dari Local Storage (jika kosong, bikin array berisi 4 null)
let characterSlots = JSON.parse(GameStorage.getItem(slotsKey)) || [null, null, null, null];

// Small HTML escape helper to avoid runtime errors when this file is loaded alone
function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/[&<>'\"]/g, tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
    }[tag]));
}

let dipilihSlotIndex = null;  // Menyimpan slot mana yang sedang diklik (0-3)
let dipilihClassBaru = 'Warga'; // Default awal: karakter berstatus Warga sebelum naik level
const CLASS_UNLOCK_LEVEL = 5;

// Database status bawaan class
const statsPerClass = {
    'Warga': { maxHp: 120, baseAttack: 10, magicDamage: 0, attackSpeed: 8, baseDefense: 6, baseDodge: 8, maxMana: 60 },
    'Fighter': { maxHp: 180, baseAttack: 24, magicDamage: 0, attackSpeed: 8, baseDefense: 12, baseDodge: 5, maxMana: 60 },
    'Mage': { maxHp: 75, baseAttack: 6, magicDamage: 35, attackSpeed: 10, baseDefense: 4, baseDodge: 10, maxMana: 160 },
    'Archer': { maxHp: 110, baseAttack: 20, magicDamage: 0, attackSpeed: 16, baseDefense: 6, baseDodge: 15, maxMana: 80 },
    'Assassin': { maxHp: 90, baseAttack: 24, magicDamage: 0, attackSpeed: 22, baseDefense: 3, baseDodge: 20, maxMana: 90 }
};

// Skill awal untuk setiap class
const startingSkillsPerClass = {
    'Warga': [],
    'Fighter': ['FIGHTER_BASH'],
    'Mage': ['MAGE_FIREBALL'],
    'Archer': ['ARCHER_MULTI_SHOT'],
    'Assassin': ['ASSASSIN_BACKSTAB']
};

function isHeroClassUnlocked(heroClass, level) {
    if (!heroClass || heroClass === 'Warga') return true;
    return Number(level || 0) >= CLASS_UNLOCK_LEVEL;
}

// =======================================================
// TRICK SYNC: Update data slot berdasarkan petualangan terakhir di arena
// =======================================================
function sinkronisasiProgressTerakhir() {
    characterSlots = JSON.parse(GameStorage.getItem(slotsKey));
}

// Menampilkan daftar slot ke layar HTML
function renderSlotsUI() {
    document.getElementById('display-username').innerText = currentAccount;
    const container = document.getElementById('slots-container');
    container.innerHTML = '';
    const fragment = document.createDocumentFragment();

    characterSlots.forEach((char, index) => {
        const slotEl = document.createElement('div');
        if (char) {
            slotEl.className = 'slot-card filled';
            slotEl.id = `slot-${index}`;
            slotEl.setAttribute('data-slot-index', index);
            slotEl.onclick = () => pilihSlot(index, true);

            const badge = document.createElement('span'); badge.className = 'slot-status-badge'; badge.textContent = `SLOT ${index + 1}`;
            const title = document.createElement('h4'); title.innerHTML = `⚔️ ${escapeHtml(char.name)} <span style="font-size: 12px; color: #ff9800; font-weight: normal;">(${escapeHtml(char.heroClass)})</span>`;
            const p1 = document.createElement('p'); p1.innerHTML = `<b>Level:</b> ${char.level} | <b>Gold:</b> 💰${char.gold}`;
            const p2 = document.createElement('p'); p2.innerHTML = `<b>HP:</b> ${char.maxHp} | <b>DEF:</b> ${char.baseDefense}`;
            const p3 = document.createElement('p'); p3.innerHTML = `<b>ATK:</b> ${char.baseAttack} | <b>M.DMG:</b> ✨${char.magicDamage} | <b>ASPD:</b> ⚡${char.attackSpeed}`;

            slotEl.appendChild(badge); slotEl.appendChild(title); slotEl.appendChild(p1); slotEl.appendChild(p2); slotEl.appendChild(p3);
        } else {
            slotEl.className = 'slot-card empty';
            slotEl.id = `slot-${index}`;
            slotEl.setAttribute('data-slot-index', index);
            slotEl.onclick = () => pilihSlot(index, false);

            const badge = document.createElement('span'); badge.className = 'slot-status-badge'; badge.textContent = 'KOSONG';
            const title = document.createElement('h4'); title.style.color = '#888'; title.style.marginTop = '10px'; title.innerHTML = '<i class="fa-solid fa-plus-circle"></i> Buat Karakter';
            const p = document.createElement('p'); p.style.color = '#b0bec5'; p.textContent = 'Klik untuk mengisi slot ini dengan petualang baru.';

            slotEl.appendChild(badge); slotEl.appendChild(title); slotEl.appendChild(p);
        }
        fragment.appendChild(slotEl);
    });

    container.appendChild(fragment);
}

function getClassIcon(heroClass) {
    const cls = (heroClass || '').toString().trim().toLowerCase();
    if (cls.includes('warga')) return 'fa-user';
    if (cls.includes('mage')) return 'fa-wand-magic-sparkles';
    if (cls.includes('archer')) return 'fa-bow-arrow';
    if (cls.includes('assassin')) return 'fa-skull-crossbones';
    return 'fa-sword';
}

function pilihClass(namaClass, element) {
    if (!Object.hasOwn(statsPerClass, namaClass)) return;
    const selected = characterSlots[dipilihSlotIndex];
    const canChoose = namaClass === 'Warga' || (selected && selected.heroClass === 'Warga' && isHeroClassUnlocked(namaClass, selected.level));

    if (!canChoose) {
        Swal.fire({
            icon: 'info',
            title: 'Kelas belum terbuka',
            text: `Kelas ${namaClass} baru dapat dipilih saat level ${CLASS_UNLOCK_LEVEL}. Saat ini kamu masih menjadi Warga.`,
            background: '#222', color: '#fff',
            confirmButtonColor: '#ff9800'
        });
        return;
    }

    dipilihClassBaru = namaClass;
    const cards = document.querySelectorAll('.class-card');
    cards.forEach(card => card.classList.remove('selected'));
    element.classList.add('selected');
    renderClassStatusHint();
    if(selected)document.getElementById('btn-action').textContent=namaClass==='Warga'?'Lanjutkan sebagai Warga':`Pilih ${namaClass} & Mainkan`;
    if (dipilihSlotIndex !== null && !characterSlots[dipilihSlotIndex]) {
        renderSlotPreview(dipilihSlotIndex);
    }
}

function applyClassLockState() {
    const cards = document.querySelectorAll('.class-card');
    cards.forEach(card => {
        const className = card.querySelector('h4')?.textContent?.trim();
        const isWarga = className === 'Warga';
        const selected = characterSlots[dipilihSlotIndex];
        const locked = !isWarga && !(selected && selected.heroClass === 'Warga' && isHeroClassUnlocked(className, selected.level));
        card.style.opacity = locked ? '0.62' : '1';
        card.style.filter = 'none';
        card.style.cursor = locked ? 'not-allowed' : 'pointer';
        card.setAttribute('data-locked', locked ? 'true' : 'false');
        card.setAttribute('aria-disabled',String(locked));
        card.classList.toggle('selected',className===dipilihClassBaru);
        card.setAttribute('aria-pressed',String(className===dipilihClassBaru));
        const badge=card.querySelector('.class-status');
        if(badge)badge.textContent=locked?`TERBUKA LV ${CLASS_UNLOCK_LEVEL}`:className===dipilihClassBaru?'DIPILIH':isWarga?'KARAKTER AWAL':'TERSEDIA';
    });
}

function renderSlotPreview(index) {
    const preview = document.getElementById('slot-preview');
    if (!preview) return;
    preview.innerHTML = '';

    if (index === null || index === undefined) {
        preview.innerHTML = '<p class="empty">Pilih salah satu slot untuk melihat detail karakter atau membuat karakter baru di slot kosong.</p>';
        return;
    }

    const char = characterSlots[index];
    if (!char) {
        const selectText = document.createElement('div');
        selectText.className = 'preview-meta';
        selectText.innerHTML = `Slot ${index + 1} kosong. Gunakan panel di bawah untuk membuat karakter baru dan mulai petualanganmu.`;

        const emptyInfo = document.createElement('div');
        emptyInfo.className = 'preview-stats';
        emptyInfo.innerHTML = `
            <div class="preview-stat"><strong>Kelas Terpilih</strong>${dipilihClassBaru}</div>
            <div class="preview-stat"><strong>Stat Awal</strong>HP ${statsPerClass[dipilihClassBaru].maxHp}, ATK ${statsPerClass[dipilihClassBaru].baseAttack}</div>
            <div class="preview-stat"><strong>Kecepatan</strong>ASPD ${statsPerClass[dipilihClassBaru].attackSpeed}</div>
            <div class="preview-stat"><strong>Mana</strong>${statsPerClass[dipilihClassBaru].maxMana} Max</div>
        `;

        preview.appendChild(selectText);
        preview.appendChild(emptyInfo);
        return;
    }

    const header = document.createElement('div');
    header.className = 'preview-header';
    header.innerHTML = `<i class="fa-solid ${getClassIcon(char.heroClass)}"></i><div><p class="preview-title">${escapeHtml(char.name)}</p><p class="preview-meta">Slot ${index + 1} • ${escapeHtml(char.heroClass)} • Level ${char.level}</p></div>`;

    const stats = document.createElement('div');
    stats.className = 'preview-stats';
    stats.innerHTML = `
        <div class="preview-stat"><strong>HP</strong>${char.maxHp}</div>
        <div class="preview-stat"><strong>ATK</strong>${char.baseAttack}</div>
        <div class="preview-stat"><strong>Magic</strong>${char.magicDamage}</div>
        <div class="preview-stat"><strong>ASPD</strong>${char.attackSpeed}</div>
    `;

    const footer = document.createElement('div');
    footer.className = 'preview-meta';
    footer.innerHTML = `Gold: 💰${char.gold} • DEF: ${char.baseDefense} • Potions: ${char.potions || 0}`;

    preview.appendChild(header);
    preview.appendChild(stats);
    preview.appendChild(footer);
}

// Aksi ketika salah satu dari 4 Slot diklik
function pilihSlot(index, isFilled) {
    if (!Number.isInteger(index) || index < 0 || index > 3) return;
    dipilihSlotIndex = index;
    dipilihClassBaru = 'Warga';

    // Highlight slot yang dipilih
    for (let i = 0; i < 4; i++) {
        const el = document.getElementById(`slot-${i}`);
        if(el) el.classList.remove('selected');
    }
    document.getElementById(`slot-${index}`).classList.add('selected');

    const btnAction = document.getElementById('btn-action');
    const btnDelete = document.getElementById('btn-delete');
    btnAction.disabled = false;

    if (isFilled) {
        // Jika slot terisi, sembunyikan menu pembuatan, aktifkan tombol Hapus & Masuk Arena
        document.getElementById('creation-section').style.display = characterSlots[index].heroClass === 'Warga' && characterSlots[index].level >= CLASS_UNLOCK_LEVEL ? 'block' : 'none';
        btnAction.innerHTML = `<i class="fa-solid fa-shield-halved"></i> Mainkan Karakter (Slot ${index + 1})`;
        btnAction.style.removeProperty('background-color');
        btnDelete.style.display = 'inline-block';
    } else {
        // Jika slot kosong, tunjukkan menu pemilihan class, sembunyikan tombol hapus
        document.getElementById('creation-section').style.display = 'block';
        if(document.getElementById('hero-name')) {
            document.getElementById('hero-name').value = ''; 
        }
        btnAction.innerHTML = `<i class="fa-solid fa-plus"></i> Buat & Mulai Petualangan di Slot ${index + 1}`;
        btnAction.style.removeProperty('background-color');
        btnDelete.style.display = 'none';
    }

    renderClassStatusHint();
    renderSlotPreview(index);
}

// Eksekutor utama saat tombol paling bawah diklik
function eksekusiAksi() {
    if (dipilihSlotIndex === null) return;

    const slotTerpilih = characterSlots[dipilihSlotIndex];

    if (slotTerpilih) {
        // AMBIL DATA YANG ADA & MASUK GAME (Karakter lama langsung masuk tanpa cek nama lagi)
        const slotData = Object.assign({}, slotTerpilih);
        if (slotData.heroClass === 'Warga' && dipilihClassBaru !== 'Warga' && slotData.level >= CLASS_UNLOCK_LEVEL) {
            const base = statsPerClass.Warga;
            const chosen = statsPerClass[dipilihClassBaru];
            for (const key of Object.keys(chosen)) slotData[key] += chosen[key] - base[key];
            slotData.heroClass = slotData.baseClass = dipilihClassBaru;
            slotData.hp = slotData.maxHp;
            slotData.mana = slotData.maxMana;
            slotData.skills = startingSkillsPerClass[dipilihClassBaru].map(id => ({ id, rank: 1, readyAt: 0 }));
        }
        if (!Array.isArray(slotData.party)) slotData.party = [];
        if (!slotData.allies || typeof slotData.allies !== 'object') slotData.allies = {};
        GameStorage.selectSlot(dipilihSlotIndex, slotData);
        
        if(slotData.heroClass==='Warga'&&!window.SagaGMTrial)HeroGuide.open(slotData.name);
        else window.location.href = '../Utama/Index.html';
    } else {
        // JIKA SLOT KOSONG -> PROSES PEMBUATAN BARU
        
        // Mengambil input nama kustom milik pemain
        let inputName = document.getElementById('hero-name').value.trim();
        
        // 🛑 VALIDASI KUNCI: Jika nama kosong, batalkan masuk ke halaman utama!
        if (inputName === "" || inputName.length > 12) {
            Swal.fire({
                icon: 'warning',
                title: 'Nama Pahlawan Kosong!',
                text: 'Kamu harus memasukkan nama karakter terlebih dahulu untuk mengukir sejarah di Saga Petualang!',
                confirmButtonColor: '#ff9800',
                background: '#222', color: '#fff'
            });
            return; // Menghentikan fungsi di sini, sehingga tidak akan redirect ke index.html
        }

        dipilihClassBaru = 'Warga';
        const statusBawaan = statsPerClass.Warga;
        
        const playerBaru = {
            name: inputName, 
            heroClass: dipilihClassBaru,
            level: 1,
            exp: 0,
            maxExp: 100, // <-- Tambahan dari script.js
            gold: 100,
            hp: statusBawaan.maxHp,
            maxHp: statusBawaan.maxHp,
            mana: statusBawaan.maxMana,
            maxMana: statusBawaan.maxMana,
            baseAttack: statusBawaan.baseAttack,
            magicDamage: statusBawaan.magicDamage,
            attackSpeed: statusBawaan.attackSpeed,
            baseDefense: statusBawaan.baseDefense,
            baseDodge: statusBawaan.baseDodge, 
            statPoints: 0,
            skillPoints: 1, // Poin skill awal
            potions: 3,
            manaPotions: 3,
            potionThreshold: 35, // <-- Tambahan dari script.js
            skills: (startingSkillsPerClass[dipilihClassBaru] || []).map(id => ({ id, rank: 1, readyAt: 0 })),
            combatBuffs: [],
            items: [],
            party: [],
            allies: {},
            
            // --- TAMBAHAN EQUIPMENT DARI SCRIPT.JS ---
            equipment: {
                senjata: { name: "Pisau Kecil", statType: 'atk', statValue: 0 },
                zirah: { name: "Pakaian Kain", statType: 'def', statValue: 0 },
                sepatu: { name: "Sandal Usang", statType: 'dodge', statValue: 0 },
                helm: { name: "Tanpa Pelindung", statType: 'def', statValue: 0 },
                amulet: { name: "Tanpa Amulet", statType: 'maxHp', statValue: 0 },
                sarung_tangan: null,
                offhand: null
            },
            
            inventory: {},
            professions: {
                mining: { level: 1, exp: 0, maxExp: 100 },
                chopping: { level: 1, exp: 0, maxExp: 100 }
            },
            tools: {
                equippedPickaxe: { name: "Beliung Pemula", speed: 1.0 },
                equippedAxe: { name: "Kapak Berkarat", speed: 1.0 }
            }
        };

        // Simpan karakter baru ke list slot milik akun
        characterSlots[dipilihSlotIndex] = playerBaru;
        GameStorage.setItem(slotsKey, JSON.stringify(characterSlots));

        // Inject data ke engine game utama
        GameStorage.selectSlot(dipilihSlotIndex, playerBaru);

        renderSlotsUI();
        pilihSlot(dipilihSlotIndex,true);
        if(!window.SagaGMTrial)HeroGuide.open(inputName);
        else window.location.href='../Utama/Index.html';
    }
}

// =======================================================
// FITUR HAPUS KARAKTER DARI SLOT
// =======================================================
function hapusKarakter() {
    if (dipilihSlotIndex === null) return;
    const char = characterSlots[dipilihSlotIndex];
    if (!char) return;

    Swal.fire({
        title: 'Hapus Karakter?',
        text: `Apakah kamu yakin ingin menghapus "${char.name}" (${char.heroClass})? Semua progress di slot ini akan hilang selamanya!`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d32f2f',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Ya, Hapus!',
        cancelButtonText: 'Batal',
        background: '#222', color: '#fff'
    }).then((result) => {
        if (result.isConfirmed) {
            // 1. Hapus data karakter dari array slot
            characterSlots[dipilihSlotIndex] = null;
            GameStorage.setItem(slotsKey, JSON.stringify(characterSlots));

            // 2. HAPUS DATA TAS MINING/CHOPPING KHUSUS SLOT INI
            const gatherSaveKey = `rpg_gather_${currentAccount}_slot_${dipilihSlotIndex}`;
            GameStorage.removeItem(gatherSaveKey);

            // 3. Bersihkan memori game aktif jika slot yang sedang dimainkan dihapus
            const activeSlot = GameStorage.getItem('rpg_active_slot');
            if (activeSlot !== null && parseInt(activeSlot) === dipilihSlotIndex) {
                GameStorage.removeItem('rpg_player');
                GameStorage.removeItem('rpg_active_slot');
            }

            // Reset tampilan UI Slot
            dipilihSlotIndex = null;
            const btnAction = document.getElementById('btn-action');
            btnAction.disabled = true;
            btnAction.innerHTML = `<i class="fa-solid fa-lock"></i> Pilih Slot Terlebih Dahulu`;
            btnAction.style.backgroundColor = '';
            document.getElementById('btn-delete').style.display = 'none';
            document.getElementById('creation-section').style.display = 'none';

            renderSlotsUI();

            Swal.fire({
                icon: 'success',
                title: 'Terhapus!',
                text: 'Karakter dan seluruh tas barangnya berhasil dilenyapkan dari slot.',
                timer: 1500,
                showConfirmButton: false,
                background: '#222', color: '#fff'
            });
        }
    });
}

function renderClassStatusHint() {
    const selected = characterSlots[dipilihSlotIndex];
    document.getElementById('class-section-title').textContent=selected?'Pilih Class Karaktermu':'Awali Kisah sebagai Warga';
    document.getElementById('class-selection-status').textContent=selected
        ?`Pilihan: ${dipilihClassBaru}. ${dipilihClassBaru==='Warga'?'Kamu dapat tetap menjadi Warga.':'Class diterapkan saat tombol konfirmasi ditekan; setelah itu langsung masuk game tanpa panduan.'}`
        :'Mulai sebagai Warga. Empat class spesialis terbuka saat level 5.';
    document.getElementById('class-unlock-hint').textContent = selected && selected.heroClass === 'Warga' && selected.level >= CLASS_UNLOCK_LEVEL
        ? 'Pilih kelas, lalu tekan Mainkan Karakter untuk menerapkannya.'
        : 'Karakter baru dimulai sebagai Warga. Pilihan kelas terbuka pada level 5.';
    const nameInput = document.querySelector('.input-name-container');
    if (nameInput) nameInput.style.display = selected ? 'none' : 'block';
    applyClassLockState();
}

function setupClassCards(){
    const art={
        Warga:['../assets/characters/warga/petualang_desa_dengan_pedang_pendek.png','Petualang pemula','fa-user'],
        Fighter:['../assets/characters/fighter/fighter-idle.png','Fisik & pertahanan','fa-khanda'],
        Mage:['../assets/characters/Mage/penyihir_ungu_dengan_tongkat_magis.png','Sihir & Mana','fa-wand-magic-sparkles'],
        Archer:['../Avatar/archer.png','Busur & kecepatan','fa-bullseye'],
        Assassin:['../assets/characters/Assassin/pembunuh_bayangan_biru_keemasan.png','Belati & mobilitas','fa-khanda']
    };
    for(const card of document.querySelectorAll('.class-card')){
        const title=card.querySelector('h4'),name=title.textContent.trim(),stats=statsPerClass[name];
        const description=card.querySelector('.desc-text');
        if(name==='Warga')description.textContent=`Karakter awal dengan Pisau Kecil. Pilih class spesialis mulai level ${CLASS_UNLOCK_LEVEL}.`;
        card.dataset.class=name;card.setAttribute('role','button');card.tabIndex=0;
        card.setAttribute('aria-label',`Pilih ${name}`);
        const picture=document.createElement('div');picture.className='class-portrait';
        const icon=document.createElement('i');icon.className=`fa-solid ${art[name][2]}`;icon.setAttribute('aria-hidden','true');
        const image=document.createElement('img');image.alt='';image.draggable=false;
        image.onload=()=>{icon.hidden=true;};image.onerror=()=>image.remove();image.src=art[name][0];
        picture.append(icon,image);
        const badge=document.createElement('span');badge.className='class-status';
        const role=document.createElement('p');role.className='class-role';role.textContent=art[name][1];
        const grid=document.createElement('div');grid.className='class-stats';
        for(const [label,key]of [['HP','maxHp'],['ATK','baseAttack'],['DEF','baseDefense'],['MAG','magicDamage'],['ASPD','attackSpeed'],['MP','maxMana']]){
            const stat=document.createElement('span'),value=document.createElement('strong');stat.append(document.createTextNode(label));value.textContent=stats[key];stat.append(value);grid.append(stat);
        }
        card.replaceChildren(picture,badge,title,role,grid,description);
        card.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();pilihClass(name,card);}});
    }
}
setupClassCards();
// Jalankan auto-sync dan render saat halaman dibuka
sinkronisasiProgressTerakhir();
renderSlotsUI();
renderClassStatusHint();
