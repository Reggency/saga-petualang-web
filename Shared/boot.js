// Do not execute page logic until its account and character have been validated.
(function () {
    // Back/forward cache restores a frozen page. Reload its current save and timers.
    window.addEventListener('pageshow', event => {
        if (!event.persisted) return;
        GameStorage.ready = false; // Do not save the stale snapshot while reloading.
        location.reload();
    });
    const boot = document.currentScript;
    const page = boot.dataset.page;
    const account = sessionStorage.getItem('rpg_account_id');
    if (!account) { location.replace('../Login/Login.html'); return; }
    const projectRoot = new URL('../', boot.src);
    function loadPresentationScript(path) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = new URL(path, projectRoot).href;
            script.onload = resolve;
            script.onerror = () => reject(new Error(`Gagal memuat tampilan item: ${path}`));
            document.body.append(script);
        });
    }
    async function start() {
      try {
        GameStorage.activate(account);
        if (page !== 'hero' && !GameStorage.getItem('rpg_player')) {
            location.replace('../Hero/hero.html');
            return;
        }
        if (page === 'utama' && window.GameOffline) {
            window.offlineStartupSummary = await GameOffline.claim(GameStorage);
        }
        // The same catalog is available in every item view, including Shop/Gathering.
        // Only presentation metadata is loaded; gameplay and saves retain their owners.
        if (!window.CraftingData) await loadPresentationScript('Crafting/recipes.js');
        if (!window.AlchemyData) await loadPresentationScript('Alchemy/recipes.js');
        if (!window.GameMonsters) await loadPresentationScript('Shared/monsters.js');
        await loadPresentationScript('Shared/item-asset-extras.js');
        await loadPresentationScript('Shared/item-assets.js');
        const script = document.createElement('script');
        script.src = boot.dataset.src;
        script.async = false;
        script.onload = () => { GameStorage.ready = true; GameItemAssets.decorate(); };
        script.onerror = () => { console.error('Gagal memuat sistem halaman:', script.src); };
        document.body.append(script);
      } catch (error) { console.error(error.message); }
    }
    start();
})();
