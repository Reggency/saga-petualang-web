// One UI and transaction entry point for every character and crafting mode.
let player = {};
let currentCraftMode = 'crafting';
let craftPending = false;
const craftModes = ['crafting', 'enhance', 'smelting', 'conversion'];
const craftStatLabels = { atk: 'ATK', def: 'DEF', maxHp: 'Max HP', dodge: 'Dodge', magicDamage: 'M.ATK', maxMana: 'Max Mana' };

function loadData() {
    const saved = GameStorage.getItem('rpg_player');
    if (!saved) { window.location.replace('../Hero/hero.html'); return; }
    player = JSON.parse(saved);
}

function saveData() {
    player = GameStorage.savePlayer(player);
}

function createMaterialPill(name, amount) {
    const owned = CraftingCore.owned(player, name);
    const pill = document.createElement('span');
    pill.className = `material-pill${owned < amount ? ' insufficient' : ''}${name === 'Gold' ? ' currency' : ''}`;
    const text = document.createElement('span');
    text.className = 'mat-text';
    text.textContent = `${amount}x ${name}`;
    const count = document.createElement('span');
    count.className = 'mat-count';
    count.textContent = owned;
    pill.append(text, count);
    if (typeof GameItemAssets !== 'undefined') GameItemAssets.attach(text, name, { compact: true });
    return pill;
}

function createActionCard(title, description, action, item = null) {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'btn-craft-card';
    const name = document.createElement('span');
    name.className = 'item-name';
    name.textContent = title;
    const effect = document.createElement('span');
    effect.className = 'item-effect';
    effect.textContent = description;
    const materials = document.createElement('span');
    materials.className = 'materials';
    if (item) {
        const header = document.createElement('span');
        header.className = 'item-top';
        const details = document.createElement('span');
        details.className = 'item-details';
        details.append(name, effect);
        header.append(GameItemCatalog.createVisual(item), details);
        card.append(header, materials);
        card.dataset.rarity = GameItemCatalog.visual(item).rarity;
    } else card.append(name, effect, materials);
    try {
        const plan = CraftingCore.quote(player, action);
        for (const req of plan.requirements) materials.appendChild(createMaterialPill(req.name, req.amount));
        const enough = CraftingCore.canAfford(player, plan.requirements);
        card.classList.toggle('insufficient', !enough);
        card.disabled = !enough;
        if (plan.chance !== undefined) effect.textContent += ` · Sukses ${Math.round(plan.chance * 100)}%`;
        card.addEventListener('click', () => runCraftAction(action));
    } catch (error) {
        card.disabled = true;
        const note = document.createElement('span');
        note.className = 'craft-note';
        note.textContent = error.message;
        card.appendChild(note);
    }
    return card;
}

function renderRecipes() {
    const panel = document.getElementById('panel-crafting');
    panel.replaceChildren();
    const sections = new Map();
    const query = document.getElementById('craft-recipe-search').value.trim().toLocaleLowerCase();
    for (const recipe of CraftingCore.availableRecipes(player)) {
        if (!`${recipe.name} ${recipe.requirements.map(req => req.name).join(' ')}`.toLocaleLowerCase().includes(query)) continue;
        if (!sections.has(recipe.group)) {
            const section = document.createElement('section');
            section.className = 'craft-booth';
            const heading = document.createElement('h4');
            heading.textContent = recipe.group;
            const grid = document.createElement('div');
            grid.className = 'items-grid';
            section.append(heading, grid);
            panel.appendChild(section);
            sections.set(recipe.group, grid);
        }
        const card = createActionCard(recipe.name, `+${recipe.statGain} ${craftStatLabels[recipe.statType] || recipe.statType}`, { type: 'craft', id: recipe.id }, recipe);
        card.dataset.recipeId = recipe.id;
        // Owned recipes remain readable even when the original action is disabled.
        const materials = card.querySelector('.materials');
        if (!materials.childElementCount) for (const req of GameMaterials.costs(player, recipe.requirements, recipe.goldCost)) {
            materials.appendChild(createMaterialPill(req.name, req.amount));
        }
        const entry = document.createElement('article');
        entry.className = 'recipe-entry';
        entry.append(card, GameJournalUI.materialSources(player, recipe.requirements));
        sections.get(recipe.group).appendChild(entry);
    }
    if (!panel.childElementCount) panel.textContent = 'Tidak ada resep sesuai kelas atau pencarian.';
}

function renderEnhancePanel() {
    const list = document.getElementById('enhance-list');
    list.replaceChildren();
    (player.items || []).forEach((item, index) => {
        if (!item?.slot || GameCore.isRetiredAccessory(item) || !item.statType || !Number.isFinite(item.statValue) || !CraftingCore.canUse(player, item.job)) return;
        const card = createActionCard(`${item.name} +${item.enhanceLevel || 0}`, `+${item.statValue} ${craftStatLabels[item.statType] || item.statType}`, { type: 'enhance', index }, item);
        card.dataset.itemIndex = index;
        list.appendChild(card);
    });
    if (!list.childElementCount) list.textContent = 'Belum ada peralatan untuk di-Enhance. Tempa peralatan terlebih dahulu.';
}

function renderSmeltingPanel() {
    const list = document.getElementById('smelting-list');
    list.replaceChildren(...CraftingData.smelting.map(recipe =>
        createActionCard(recipe.output, 'Bahan penempaan peralatan', { type: 'smelt', id: recipe.id }, { name: recipe.output })));
}

function renderConversionPanel() {
    const list = document.getElementById('conversion-list');
    list.replaceChildren();
    const quantity = Number(document.getElementById('conversion-quantity').value);
    if (!Number.isSafeInteger(quantity) || quantity <= 0) {
        list.textContent = 'Masukkan jumlah bulat minimal 1.';
        return;
    }
    const directMaterials = new Set(CraftingCore.availableRecipes(player).flatMap(recipe => recipe.requirements.map(req => req.name)));
    for (const [name, conversion] of Object.entries(CraftingData.conversions)) {
        if (!CraftingCore.owned(player, name)) continue;
        const description = `${conversion.rarity} · ${conversion.yield} Esensi/item${directMaterials.has(name) ? ' · Juga dipakai resep kelas ini' : ''}`;
        const card = createActionCard(name, description, { type: 'convert', name, quantity }, { name });
        card.dataset.conversionName = name;
        list.appendChild(card);
    }
    if (!list.childElementCount) list.textContent = 'Belum ada drop monster di tas untuk dikonversi.';
}

function updateCraftingUI() {
    document.getElementById('craft-recipe-search').closest('label').hidden = currentCraftMode !== 'crafting';
    const job = CraftingCore.activeJob(player);
    document.getElementById('craft-class').textContent = job
        ? `Resep ${player.heroClass} dan peralatan universal`
        : 'Pilih kelas karakter di Kota untuk membuka resep kelas. Peralatan universal tetap tersedia.';
    document.getElementById('craft-gold').textContent = player.gold || 0;
    document.getElementById('craft-essence').textContent = CraftingCore.owned(player, CraftingData.universalMaterial);
    switch (currentCraftMode) {
        case 'crafting': renderRecipes(); break;
        case 'enhance': renderEnhancePanel(); break;
        case 'smelting': renderSmeltingPanel(); break;
        case 'conversion': renderConversionPanel(); break;
    }
}

function switchMode(mode) {
    if (!craftModes.includes(mode)) return;
    currentCraftMode = mode;
    for (const name of craftModes) {
        document.getElementById(`panel-${name}`).hidden = name !== mode;
        const button = document.getElementById(`btn-mode-${name}`);
        button.classList.toggle('active', name === mode);
        button.setAttribute('aria-pressed', String(name === mode));
    }
    updateCraftingUI();
}

async function runCraftAction(action) {
    if (craftPending) return false;
    craftPending = true;
    try {
        const plan = CraftingCore.quote(player, action);
        if (!CraftingCore.canAfford(player, plan.requirements)) throw new Error('Material atau Gold tidak cukup.');
        const rows = plan.requirements.map(req => `<p>${req.amount}x ${GameCore.escapeHtml(req.name)}</p>`).join('');
        const chance = plan.chance === undefined ? '' : `<p>Sukses ${Math.round(plan.chance * 100)}%. Bahan dan Gold tetap terpakai jika gagal.</p>`;
        const result = await Swal.fire({
            titleText: plan.title, html: rows + chance, showCancelButton: true,
            confirmButtonText: 'Proses 1x', cancelButtonText: 'Batal', background: '#14151d', color: '#fff'
        });
        if (!result.isConfirmed) return false;
        const transaction = CraftingCore.execute(player, action);
        // Save before changing live state; a failed or stale write keeps it intact.
        player = GameStorage.savePlayer(transaction.next);
        updateCraftingUI();
        document.getElementById('craft-status').textContent = transaction.message;
        Swal.fire({ icon: transaction.success ? 'success' : 'warning', title: 'Hasil Penempaan', text: transaction.message });
        return true;
    } catch (error) {
        Swal.fire({ icon: 'error', title: 'Penempaan gagal', text: error.message });
        return false;
    } finally {
        craftPending = false;
    }
}

document.querySelectorAll('[data-mode]').forEach(button => {
    button.addEventListener('click', () => switchMode(button.dataset.mode));
});
document.getElementById('conversion-quantity').addEventListener('input', renderConversionPanel);
document.getElementById('craft-recipe-search').addEventListener('input', renderRecipes);
GameStorage.onReady(() => {
    loadData();
    updateCraftingUI();
});
