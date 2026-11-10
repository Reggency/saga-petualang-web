let player = {};
let brewPending = false;
const quantityInput = document.getElementById('brew-quantity');
const potionFilter = document.getElementById('potion-filter');

function renderRecipes() {
    const list = document.getElementById('recipe-list');
    list.replaceChildren();
    const batches = Number(quantityInput.value);
    const valid = GameMaterials.integer(batches, 1) && batches <= 99;
    if (!valid) {
        list.textContent = 'Masukkan jumlah racikan bulat antara 1 dan 99.';
        return;
    }
    const groups = new Map();
    const query = document.getElementById('recipe-search').value.trim().toLocaleLowerCase();
    for (const recipe of AlchemyData.recipes) {
        if (!`${recipe.name} ${recipe.requirements.map(req => req.name).join(' ')}`.toLocaleLowerCase().includes(query)) continue;
        if (potionFilter.value !== 'all' && recipe.potionId !== potionFilter.value) continue;
        if (!groups.has(recipe.stage)) {
            const section = document.createElement('section');
            const heading = document.createElement('h2');
            heading.className = 'stage-title';
            heading.textContent = AlchemyData.stages[recipe.stage];
            const grid = document.createElement('div');
            grid.className = 'recipe-grid';
            section.append(heading, grid);
            list.appendChild(section);
            groups.set(recipe.stage, grid);
        }
        const potion = AlchemyData.potions[recipe.potionId];
        const locked = player.level < recipe.minLevel;
        const costs = GameMaterials.costs(player, recipe.requirements.map(req => ({ name: req.name, amount: req.amount * batches })), recipe.goldCost * batches);
        const enough = GameMaterials.canAfford(player, costs);
        const card = document.createElement('article');
        card.dataset.recipeId = recipe.id;
        card.className = `recipe-card${locked ? ' locked' : ''}${enough ? '' : ' shortage'}`;
        const level = document.createElement('span');
        level.className = 'recipe-level';
        level.textContent = `Level ${recipe.minLevel}${locked ? ' · Belum terbuka' : ' · Terbuka'}`;
        const title = document.createElement('h3');
        title.textContent = recipe.name;
        const output = document.createElement('p');
        output.className = `recipe-output${recipe.potionId === 'potion_mana' ? ' mana' : ''}`;
        output.textContent = `${recipe.amount * batches}× ${potion.name}`;
        GameItemAssets.attach(output, potion.id);
        const effect = document.createElement('span');
        effect.className = 'recipe-effect';
        effect.textContent = potion.effect;
        const requirements = document.createElement('div');
        requirements.className = 'recipe-materials';
        const legend = document.createElement('span');
        legend.className = 'recipe-effect';
        legend.textContent = 'Bahan · tersedia / dibutuhkan';
        requirements.appendChild(legend);
        for (const req of costs) {
            const row = document.createElement('div');
            row.className = 'material-row';
            const name = document.createElement('span');
            name.textContent = req.name;
            GameItemAssets.attach(name, req.name, { compact: true });
            const count = document.createElement('span');
            const owned = GameMaterials.owned(player, req.name);
            count.textContent = `${owned} / ${req.amount}`;
            count.className = owned >= req.amount ? 'enough' : 'short';
            count.setAttribute('aria-label', `${req.name}: tersedia ${owned}, dibutuhkan ${req.amount}`);
            row.append(name, count);
            requirements.appendChild(row);
        }
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'brew-button';
        button.disabled = brewPending || locked || !enough;
        button.textContent = locked ? `Terbuka di Level ${recipe.minLevel}` : brewPending ? 'Meracik…' : 'Racik';
        button.addEventListener('click', () => brewRecipe(recipe.id, batches));
        card.append(level, title, output, effect, requirements, GameJournalUI.materialSources(player, costs), button);
        groups.get(recipe.stage).appendChild(card);
    }
}

function updateAlchemyUI() {
    document.getElementById('lab-character').textContent = `${player.name} · Level ${player.level} ${player.heroClass}`;
    document.getElementById('lab-gold').textContent = player.gold;
    document.getElementById('lab-potions').textContent = player.potions;
    document.getElementById('lab-mana-potions').textContent = player.manaPotions;
    renderRecipes();
}

async function brewRecipe(recipeId, batches = Number(quantityInput.value)) {
    if (brewPending) return false;
    brewPending = true;
    try {
        const plan = AlchemyCore.quote(player, recipeId, batches);
        const missing = plan.requirements.filter(req => GameMaterials.owned(player, req.name) < req.amount);
        if (missing.length) throw new Error(`Bahan atau Gold kurang: ${missing.map(req => `${req.name} (tersedia ${GameMaterials.owned(player, req.name)}, perlu ${req.amount})`).join(', ')}.`);
        renderRecipes();
        const rows = plan.requirements.map(req => `<p>${req.amount}× ${GameCore.escapeHtml(req.name)}</p>`).join('');
        const result = await Swal.fire({
            titleText: `Racik ${plan.amount} ${plan.potion.name}?`,
            html: `<p>${GameCore.escapeHtml(plan.recipe.name)} · ${GameCore.escapeHtml(plan.potion.effect)}</p>${rows}`,
            showCancelButton: true, confirmButtonText: 'Racik', cancelButtonText: 'Batal',
            background: '#0b172b', color: '#e8e3d3', confirmButtonColor: '#80652e'
        });
        if (!result.isConfirmed) return false;
        const transaction = AlchemyCore.execute(player, recipeId, batches);
        // Commit the snapshot first. Failed/stale writes cannot consume live materials.
        player = GameStorage.savePlayer(transaction.next);
        updateAlchemyUI();
        document.getElementById('lab-status').textContent = transaction.message;
        return true;
    } catch (error) {
        document.getElementById('lab-status').textContent = error.message;
        Swal.fire({ icon: 'warning', title: 'Belum Bisa Meracik', text: error.message, background: '#0b172b', color: '#e8e3d3' });
        return false;
    } finally {
        brewPending = false;
        renderRecipes();
    }
}

quantityInput.addEventListener('input', renderRecipes);
potionFilter.addEventListener('change', renderRecipes);
document.getElementById('recipe-search').addEventListener('input', renderRecipes);
GameStorage.onReady(() => {
    const saved = GameStorage.getItem('rpg_player');
    if (!saved) { location.replace('../Hero/hero.html'); return; }
    player = JSON.parse(saved);
    updateAlchemyUI();
});
