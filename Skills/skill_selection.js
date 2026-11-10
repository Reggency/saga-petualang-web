// ==========================================================================
// SKILL SELECTION & LEARNING SYSTEM
// ==========================================================================

let player = {};

// Safe writer helper to merge and log who wrote the save
function writePlayerSafe(obj) { return GameStorage.savePlayer(obj); }

function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/[&<>'"]/g, tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
    }[tag]));
}

function normalizePlayerSkills(skills) {
    if (!Array.isArray(skills)) return [];
    return skills.map(skill => {
        if (typeof skill === 'string') {
            return { id: skill, rank: 1, readyAt: 0 };
        }
        if (skill && typeof skill === 'object') {
            return {
                id: skill.id || skill.name || '',
                rank: skill.rank || 1,
                readyAt: typeof skill.readyAt === 'number' ? skill.readyAt : 0
            };
        }
        return null;
    }).filter(Boolean);
}

// 1. DATABASE SKILL (Disalin dari script.js untuk kemandirian halaman)
const skillDatabase = {
    // === FIGHTER SKILLS ===
    'FIGHTER_BASH': { id: 'FIGHTER_BASH', name: 'Pukulan Keras', description: 'Menghantam musuh dengan kekuatan penuh, menghasilkan 180% ATK sebagai physical damage.', cost: 15, cooldown: 8000, icon: 'fa-hand-rock' },
    'FIGHTER_DEFENSE_UP': { id: 'FIGHTER_DEFENSE_UP', name: 'Teriakan Perang', description: 'Meningkatkan Defense sebesar 50% selama 10 detik.', cost: 20, cooldown: 20000, icon: 'fa-shield-alt' },
    'FIGHTER_WHIRLWIND': { id: 'FIGHTER_WHIRLWIND', name: 'Puting Beliung', description: 'Serangan berputar yang mengenai musuh 3 kali, masing-masing 70% ATK.', cost: 35, cooldown: 18000, icon: 'fa-hurricane' },

    // === MAGE SKILLS ===
    'MAGE_FIREBALL': { id: 'MAGE_FIREBALL', name: 'Bola Api', description: 'Menembakkan bola api yang menghasilkan 150% Magic DMG.', cost: 20, cooldown: 6000, icon: 'fa-fire' },
    'MAGE_HEAL': { id: 'MAGE_HEAL', name: 'Perisai Arcana', description: 'Memanggil perisai magis yang meningkatkan Defense selama beberapa detik.', cost: 25, cooldown: 15000, icon: 'fa-shield-alt' },
    'MAGE_METEOR': { id: 'MAGE_METEOR', name: 'Hujan Meteor', description: 'Menjatuhkan meteor dari langit, menghasilkan 300% Magic DMG.', cost: 50, cooldown: 25000, icon: 'fa-meteor' },

    // === ARCHER SKILLS ===
    'ARCHER_MULTI_SHOT': { id: 'ARCHER_MULTI_SHOT', name: 'Panah Ganda', description: 'Menembakkan dua panah secara cepat, masing-masing menghasilkan 80% ATK.', cost: 20, cooldown: 10000, icon: 'fa-arrows-alt-h' },
    'ARCHER_SHARP_EYE': { id: 'ARCHER_SHARP_EYE', name: 'Mata Elang', description: 'Meningkatkan Dodge sebesar 20% selama 15 detik.', cost: 15, cooldown: 22000, icon: 'fa-eye' },
    'ARCHER_ARROW_RAIN': { id: 'ARCHER_ARROW_RAIN', name: 'Hujan Panah', description: 'Menghujani area dengan panah, menghasilkan 250% ATK sebagai damage area.', cost: 40, cooldown: 20000, icon: 'fa-cloud-arrow-down' },

    // === ASSASSIN SKILLS ===
    'ASSASSIN_BACKSTAB': { id: 'ASSASSIN_BACKSTAB', name: 'Tusukan Belakang', description: 'Serangan mematikan dengan 50% peluang Critical, menghasilkan 200% ATK.', cost: 25, cooldown: 12000, icon: 'fa-dagger' },
    'ASSASSIN_POISON_BLADE': { id: 'ASSASSIN_POISON_BLADE', name: 'Bilah Beracun', description: 'Mengolesi senjata dengan racun, menyebabkan damage tambahan selama 10 detik.', cost: 20, cooldown: 18000, icon: 'fa-skull-crossbones' },
    'ASSASSIN_SHADOW_CLOAK': { id: 'ASSASSIN_SHADOW_CLOAK', name: 'Jubah Bayangan', description: 'Menghilang ke dalam bayangan, meningkatkan Atk Speed sebesar 30% selama 10 detik.', cost: 30, cooldown: 25000, icon: 'fa-user-secret' }
};

    // === EVOLVED / ADVANCED SKILLS ===
    skillDatabase['WARRIOR_SMASH'] = { id: 'WARRIOR_SMASH', name: 'Smash Sang Prajurit', description: 'Pukulan berat yang merobek pertahanan, 220% ATK.', cost: 20, cooldown: 10000, icon: 'fa-hammer' };
    skillDatabase['BERSERKER_FRENZY'] = { id: 'BERSERKER_FRENZY', name: 'Kegilaan', description: 'Serangkaian serangan brutal selama beberapa detik.', cost: 40, cooldown: 25000, icon: 'fa-fire-flame-curved' };

    skillDatabase['SORCERER_FIRESTORM'] = { id: 'SORCERER_FIRESTORM', name: 'Badai Api', description: 'Serangan area sihir yang membakar banyak musuh.', cost: 35, cooldown: 20000, icon: 'fa-fire' };
    skillDatabase['ARCHMAGE_ARCANE'] = { id: 'ARCHMAGE_ARCANE', name: 'Arcane Mastery', description: 'Menguatkan semua sihirmu untuk beberapa menit.', cost: 60, cooldown: 40000, icon: 'fa-star' };

    skillDatabase['RANGER_VOLLEY'] = { id: 'RANGER_VOLLEY', name: 'Balasan Panah', description: 'Melepaskan gelombang panah yang mengenai banyak target.', cost: 30, cooldown: 16000, icon: 'fa-bullseye' };
    skillDatabase['MARKSMAN_SNIP'] = { id: 'MARKSMAN_SNIP', name: 'Tembakan Mematikan', description: 'Tembakan jarak jauh dengan damage sangat tinggi terhadap satu target.', cost: 45, cooldown: 25000, icon: 'fa-crosshairs' };

    skillDatabase['SHADOW_STRIKE'] = { id: 'SHADOW_STRIKE', name: 'Tusukan Bayangan', description: 'Serangan mematikan dari kegelapan dengan peluang kritikal tinggi.', cost: 35, cooldown: 18000, icon: 'fa-mask' };
    skillDatabase['REAPER_EXECUTE'] = { id: 'REAPER_EXECUTE', name: 'Eksekusi Akhir', description: 'Serangan yang memberikan damage besar pada musuh yang terluka.', cost: 55, cooldown: 30000, icon: 'fa-skull' };

    // Additional evolved / advanced skills
    skillDatabase['WARRIOR_CHARGE'] = { id: 'WARRIOR_CHARGE', name: 'Laju Prajurit', description: 'Menerjang musuh dan memberikan stun singkat sambil memberikan 180% ATK damage.', cost: 22, cooldown: 12000, icon: 'fa-bullseye' };
    skillDatabase['WARRIOR_GUARD_BREAK'] = { id: 'WARRIOR_GUARD_BREAK', name: 'Pecah Penjagaan', description: 'Memecah pertahanan lawan, mengurangi DEF target sebesar 30% untuk beberapa detik.', cost: 25, cooldown: 18000, icon: 'fa-hammer' };

    skillDatabase['BERSERKER_RAGE'] = { id: 'BERSERKER_RAGE', name: 'Amukan Dahsyat', description: 'Masuk ke mode amukan: meningkatkan ATK sementara tapi menurunkan DEF.', cost: 30, cooldown: 25000, icon: 'fa-fire-flame-curved' };
    skillDatabase['BERSERKER_BLOODBATH'] = { id: 'BERSERKER_BLOODBATH', name: 'Pesta Darah', description: 'Serangkaian serangan beruntun yang membagi damage ke beberapa hit.', cost: 45, cooldown: 30000, icon: 'fa-triangle-exclamation' };

    skillDatabase['SORCERER_INFERNO'] = { id: 'SORCERER_INFERNO', name: 'Inferno', description: 'Menciptakan lautan api besar yang membakar musuh, memberikan damage besar dan burn.', cost: 50, cooldown: 30000, icon: 'fa-fire' };
    skillDatabase['SORCERER_ICESTORM'] = { id: 'SORCERER_ICESTORM', name: 'Topan Es', description: 'Menjatuhkan badai es yang memperlambat dan memberi magic damage per tick.', cost: 40, cooldown: 26000, icon: 'fa-snowflake' };

    skillDatabase['ARCHMAGE_BURST'] = { id: 'ARCHMAGE_BURST', name: 'Pecahan Arcane', description: 'Ledakan arcane yang memberikan damage besar ke target tunggal.', cost: 70, cooldown: 40000, icon: 'fa-star' };

    skillDatabase['RANGER_PIERCING_VOLLEY'] = { id: 'RANGER_PIERCING_VOLLEY', name: 'Volley Menusuk', description: 'Hujan panah yang menembus pertahanan musuh, mengenai target keras.', cost: 35, cooldown: 17000, icon: 'fa-bullseye' };
    skillDatabase['MARKSMAN_HEADSHOT'] = { id: 'MARKSMAN_HEADSHOT', name: 'Tembakan Kepala', description: 'Tembakan dengan akurasi tinggi yang memberikan damage kritikal besar pada satu target.', cost: 55, cooldown: 30000, icon: 'fa-crosshairs' };

    skillDatabase['SHADOW_ASSASSINATE'] = { id: 'SHADOW_ASSASSINATE', name: 'Pembunuh Bayangan', description: 'Serangan instan dari bayangan yang memberikan damage tinggi jika target tidak sadar.', cost: 50, cooldown: 32000, icon: 'fa-mask' };
    skillDatabase['REAPER_SOUL_REAVE'] = { id: 'REAPER_SOUL_REAVE', name: 'Serap Jiwa', description: 'Menghisap sebagian nyawa lawan, menyembuhkan pengguna berdasarkan damage yang diberikan.', cost: 60, cooldown: 35000, icon: 'fa-skull' };

    // Evolution path definitions per base class (ordered)
    const evolutionData = {
        'Fighter': [
                { name: 'Fighter', level: 0, label: 'Fighter', skills: [] },
                { name: 'Warrior', level: 20, label: 'Warrior', skills: ['WARRIOR_SMASH','FIGHTER_WHIRLWIND','FIGHTER_DEFENSE_UP'] },
                { name: 'Berserker', level: 40, label: 'Berserker', skills: ['BERSERKER_FRENZY','WARRIOR_SMASH','FIGHTER_BASH'] }
            ],
            'Mage': [
                { name: 'Mage', level: 0, label: 'Mage', skills: [] },
                { name: 'Sorcerer', level: 20, label: 'Sorcerer', skills: ['SORCERER_FIRESTORM','MAGE_METEOR','MAGE_HEAL'] },
                { name: 'Archmage', level: 45, label: 'Archmage', skills: ['ARCHMAGE_ARCANE','MAGE_METEOR','MAGE_FIREBALL'] }
            ],
            'Archer': [
                { name: 'Archer', level: 0, label: 'Archer', skills: [] },
                { name: 'Ranger', level: 18, label: 'Ranger', skills: ['RANGER_VOLLEY','ARCHER_ARROW_RAIN','ARCHER_MULTI_SHOT'] },
                { name: 'Marksman', level: 38, label: 'Marksman', skills: ['MARKSMAN_SNIP','ARCHER_ARROW_RAIN','ARCHER_SHARP_EYE'] }
            ],
            'Assassin': [
                { name: 'Assassin', level: 0, label: 'Assassin', skills: [] },
                { name: 'Shadow', level: 22, label: 'Shadow', skills: ['SHADOW_STRIKE','ASSASSIN_POISON_BLADE','ASSASSIN_SHADOW_CLOAK'] },
                { name: 'Reaper', level: 44, label: 'Reaper', skills: ['REAPER_EXECUTE','ASSASSIN_BACKSTAB','SHADOW_STRIKE'] }
            ]
    };


/**
 * Memuat data pemain dari localStorage
 */
function loadPlayer() {
    const savedPlayer = GameStorage.getItem('rpg_player');
    if (savedPlayer) {
        player = JSON.parse(savedPlayer);
        // Inisialisasi data skill jika belum ada
        if (!player.skills) player.skills = [];
        player.skills = normalizePlayerSkills(player.skills);
        if (player.skillPoints === undefined || player.skillPoints === null) player.skillPoints = 0;
        if (!player.heroClass) player.heroClass = player.baseClass || 'Fighter';
        // Ensure baseClass exists to map evolution path
        if (!player.baseClass) {
            const known = Object.keys(evolutionData);
            if (known.includes(player.heroClass)) player.baseClass = player.heroClass;
            else {
                const found = known.find(k => evolutionData[k].some(e => e.name === player.heroClass));
                player.baseClass = found || player.heroClass;
            }
        }
    } else {
        // Jika pemain nyasar, tendang balik
        window.location.href = '../Hero/hero.html';
    }
}

/**
 * Menyimpan data pemain ke localStorage
 */
function savePlayer() {
    player = GameStorage.savePlayer(player);
}

/**
 * Memperbarui semua elemen UI dengan data pemain terbaru
 */
function updateUI() {
    // Update Sidebar
    document.getElementById('player-name').innerText = player.name || 'Petualang';
    document.getElementById('player-class').innerText = player.heroClass || 'Fighter';
    document.getElementById('skill-points').innerText = player.skillPoints || 0;
    document.getElementById('learned-skills-count').innerText = `${player.skills.length} / 12`;

    // Update daftar skill terpasang di sidebar (DocumentFragment untuk mengurangi alokasi)
    const equippedList = document.getElementById('equipped-skills-list');
    equippedList.innerHTML = '';
    const eqFrag = document.createDocumentFragment();
    if (player.skills.length > 0) {
        player.skills.forEach(skill => {
            const skillInfo = skillDatabase[skill.id];
            if (skillInfo) {
                const slot = document.createElement('div');
                slot.className = 'equipped-slot filled';
                const icon = document.createElement('i'); icon.className = `fa-solid ${skillInfo.icon}`;
                slot.appendChild(icon);
                slot.appendChild(document.createTextNode(' ' + escapeHtml(skillInfo.name)));
                eqFrag.appendChild(slot);
            }
        });
    }
    // Isi sisa slot kosong
    const maxSlots = 3;
    for (let i = player.skills.length; i < maxSlots; i++) {
        const slot = document.createElement('div');
        slot.className = 'equipped-slot';
        const icon = document.createElement('i'); icon.className = 'fa-solid fa-question';
        slot.appendChild(icon);
        slot.appendChild(document.createTextNode(' Kosong'));
        eqFrag.appendChild(slot);
    }
    equippedList.appendChild(eqFrag);


    // Render evolution panel then Pohon Keahlian
    renderEvolutionPanel();
    renderSkillTree();
}

/**
 * Menggambar daftar skill berdasarkan kelas pemain
 */
function renderSkillTree() {
    const grid = document.getElementById('skill-list-grid');
    const title = document.getElementById('skill-tree-title');
    grid.innerHTML = '';

    const playerClass = (player.heroClass || 'Fighter').toUpperCase();
    title.innerText = `Keahlian ${player.heroClass}`;

    const classSkills = Object.values(skillDatabase).filter(skill => skill.id.startsWith(playerClass));

    const gridFrag = document.createDocumentFragment();
    if (classSkills.length === 0) {
        const noData = document.createElement('div');
        noData.className = 'skill-card locked';
        noData.style.gridColumn = '1 / -1';
        noData.innerHTML = '<p>Tidak ada skill tersedia untuk kelas ini. Pastikan kelas karakter sudah terdeteksi dengan benar.</p>';
        gridFrag.appendChild(noData);
    }

    classSkills.forEach(skill => {
        const isLearned = player.skills.some(s => s.id === skill.id);
        const canLearn = player.skillPoints > 0;

        let buttonHtml;
        let cardClass = '';

        if (isLearned) {
            buttonHtml = `<button class="btn-learn" disabled>Telah Dipelajari</button>`;
            cardClass = 'learned';
        } else if (canLearn) {
            buttonHtml = `<button class="btn-learn" onclick="learnSkill('${skill.id}')">Pelajari (1 SP)</button>`;
            cardClass = 'learnable';
        } else {
            buttonHtml = `<button class="btn-learn" disabled>Butuh 1 SP</button>`;
            cardClass = 'locked';
        }

        const cardEl = document.createElement('div');
        cardEl.className = `skill-card ${cardClass}`;

        const header = document.createElement('div'); header.className = 'skill-header-info';
        const iconEl = document.createElement('i'); iconEl.className = `skill-icon fa-solid ${skill.icon}`;
        const meta = document.createElement('div');
        const nameDiv = document.createElement('div'); nameDiv.className = 'skill-name'; nameDiv.textContent = escapeHtml(skill.name);
        const details = document.createElement('div'); details.className = 'skill-details'; details.innerHTML = `Cost: <span>${skill.cost} Mana</span> | CD: <span>${skill.cooldown / 1000}s</span>`;
        meta.appendChild(nameDiv); meta.appendChild(details);
        header.appendChild(iconEl); header.appendChild(meta);

        const desc = document.createElement('p'); desc.className = 'skill-desc'; desc.textContent = escapeHtml(skill.description);

        const btnContainer = document.createElement('div'); btnContainer.innerHTML = buttonHtml;

        cardEl.appendChild(header); cardEl.appendChild(desc); cardEl.appendChild(btnContainer);
        gridFrag.appendChild(cardEl);
    });
    grid.appendChild(gridFrag);
}

/**
 * Lightweight check preventing cross-class skill learning.
 * Only skills whose ID prefix matches any name in the player's base-class evolution path
 * are allowed. This is cheap (string checks) and prevents Mage skills leaking to Fighter, etc.
 */
function isSkillAllowedForPlayer(skillId) {
    if (!skillId || !player) return false;
    const base = player.baseClass || player.heroClass || 'Fighter';
    const path = evolutionData[base] || [{ name: base }];
    for (let i = 0; i < path.length; i++) {
        const pref = String(path[i].name).toUpperCase();
        if (skillId.startsWith(pref)) return true;
    }
    return false;
}

/**
 * Render evolution status and available evolution action
 */
function renderEvolutionPanel() {
    const panel = document.getElementById('evolution-panel');
    if (!panel) return;

    const base = player.baseClass || player.heroClass;
    const path = evolutionData[base];
    if (!path) { panel.innerHTML = ''; return; }

    // Find current index in path
    const currentName = player.heroClass;
    const currentIndex = path.findIndex(p => p.name === currentName);
    const next = path[currentIndex + 1] || null;

    let html = `<div class="evolution-info"><strong>Kelas Saat Ini:</strong> ${currentName}</div>`;
    if (next) {
        html += `<div class="evolution-require">Next: <strong>${next.label}</strong> (Level ${next.level})</div>`;
        if (player.level >= next.level) {
            html += `<button class="btn-evolve" onclick="attemptEvolve('${base}','${next.name}')">Evolve ke ${next.label}</button>`;
        } else {
            html += `<div class="evolution-locked">Butuh Level ${next.level} untuk evolusi</div>`;
        }
        // show skills unlocked by next
        if (next.skills && next.skills.length > 0) {
            html += `<div class="evolution-skills"><em>Skill yang akan tersedia:</em><ul>`;
            next.skills.forEach(sid => { const s = skillDatabase[sid]; if (s) html += `<li>${s.name}</li>`; });
            html += `</ul></div>`;
        }
    } else {
        html += `<div class="evolution-max">Anda telah mencapai evolusi tertinggi untuk kelas ini.</div>`;
    }

    panel.innerHTML = html;
}

/**
 * Attempt to evolve the player's class to the target if conditions met
 */
function attemptEvolve(baseClass, targetName) {
    const path = evolutionData[baseClass];
    if (!path) return;
    const currentIndex = path.findIndex(p => p.name === player.heroClass);
    const target = path[currentIndex + 1];
    if (baseClass !== player.baseClass || currentIndex < 0 || !target || target.name !== targetName) return;
    if (player.level < target.level) {
        Swal.fire('Kondisi Tidak Terpenuhi', `Anda butuh level ${target.level} untuk evolusi.`, 'warning');
        return;
    }

    Swal.fire({
        title: `Evolve ke ${target.label}?`,
        text: `Evolusi akan mengganti kelas Anda menjadi ${target.label} dan membuka skill baru. Lanjutkan?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Evolve', cancelButtonText: 'Batal',
        background: '#1e293b', color: '#e2e8f0'
    }).then(res => {
        if (res.isConfirmed && player.heroClass === path[currentIndex].name) {
            // Replace player's skills entirely with the target evolution skills.
            // This ensures only the evolution's skill set is usable after evolving.
            if (target.skills && target.skills.length > 0) {
                player.skills = target.skills.map(id => ({ id: id, rank: 1, readyAt: 0 }));
            } else {
                player.skills = [];
            }

            // Update class
            player.heroClass = target.name;

            // Auto-grant all skills defined for that evolution (give Rank 1)
            if (target.skills && target.skills.length > 0) {
                target.skills.forEach(grantId => {
                    if (!player.skills.some(s => s.id === grantId)) {
                        player.skills.push({ id: grantId, rank: 1, readyAt: 0 });
                    }
                });
            }
            savePlayer();
            updateUI();
            Swal.fire('Sukses!', `Kamu kini menjadi ${target.label}. Skill baru telah ditambahkan.`, 'success');
            // Debug: log current learned skills to help verify evolution grants
            try { console.log('DEBUG: player.skills after evolve:', player.skills); } catch (e) {}
        }
    });
}

/**
 * Fungsi untuk mempelajari skill baru
 * @param {string} skillId - ID dari skill yang akan dipelajari
 */
function learnSkill(skillId) {
    const skillInfo = skillDatabase[skillId];
    if (!skillInfo) return;

    // Prevent cross-class learning: only allow skills within the player's evolution path
    if (!isSkillAllowedForPlayer(skillId)) {
        Swal.fire('Gagal!', 'Keahlian ini tidak tersedia untuk kelasmu.', 'error');
        return;
    }

    // Validasi
    if (player.skillPoints <= 0) {
        Swal.fire('Gagal!', 'Poin Keahlian (SP) tidak cukup.', 'error');
        return;
    }
    if (player.skills.some(s => s.id === skillId)) {
        Swal.fire('Info', 'Anda sudah mempelajari keahlian ini.', 'info');
        return;
    }

    Swal.fire({
        title: `Pelajari ${skillInfo.name}?`,
        text: `Ini akan menggunakan 1 Poin Keahlian (SP). Anda yakin?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Ya, Pelajari!',
        cancelButtonText: 'Batal',
        background: '#1e293b',
        color: '#e2e8f0',
        confirmButtonColor: '#4ade80',
        cancelButtonColor: '#f87171',
    }).then((result) => {
        if (result.isConfirmed && player.skillPoints > 0 && !player.skills.some(skill => skill.id === skillId) && isSkillAllowedForPlayer(skillId)) {
            // Proses pembelajaran
            player.skillPoints--;
            player.skills.push({
                id: skillId,
                readyAt: 0 // Cooldown direset saat dipelajari
            });

            savePlayer();
            updateUI();

            Swal.fire({
                title: 'Berhasil!',
                text: `Anda telah mempelajari keahlian baru: ${skillInfo.name}!`,
                icon: 'success',
                background: '#1e293b',
                color: '#e2e8f0',
                confirmButtonColor: '#4ade80',
            });
        }
    });
}


// Event Listener untuk tombol kembali
document.getElementById('btn-back').addEventListener('click', () => {
    savePlayer();
    window.location.href = '../Utama/Index.html';
});

// Inisialisasi saat halaman dimuat
GameStorage.onReady(() => {
    loadPlayer();
    updateUI();
});
