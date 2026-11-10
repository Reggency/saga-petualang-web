(function () {
    'use strict';
    const clone = value => JSON.parse(JSON.stringify(value));
    const api = { inTransaction: false, transactionLogs: [], lastError: '' };
    function stopAuto() {
        isAutoPlaying = false;
        stopBattleTimers();
        if (btnAuto) {
            btnAuto.textContent = 'Auto: OFF';
            btnAuto.classList.remove('btn-auto-on'); btnAuto.classList.add('btn-auto-off');
        }
    }
    function applyHealth(next) {
        player.hp=next.hp;
        for(const [id,inst]of Object.entries(next.allies||{}))if(player.allies?.[id]&&Number.isFinite(inst.hp))player.allies[id].hp=inst.hp;
        for(const actor of playerParty)if(Number.isFinite(player.allies?.[actor.id]?.hp))actor.hp=player.allies[actor.id].hp;
    }
    function persist(next) {
        GameStorage.savePlayer(next, { rpg_items: JSON.stringify(purchasedItems) });
        // Only run state changed; keep actor and skill callback references stable.
        player.dungeon = next.dungeon;
        applyHealth(next);
    }
    api.start = (stage, difficulty) => {
        if (inBattle || player.hp <= 0) throw new Error('Mulai Dungeon setelah pertempuran selesai dan HP masih tersisa.');
        globalThis.BattleVisuals?.cancelTransition();
        syncPartyHealth();
        persist(GameDungeons.start(player, stage, difficulty, Date.now(), getPlayerTotalStats().totalMaxHp));
        stopAuto();
        isGameStarted = true;
        api.lastError = '';
        api.launch();
    };
    api.launch = () => {
        if (inBattle && currentEnemy?.dungeonToken && currentEnemy.hp <= 0) return api.settleVictory();
        if (inBattle) throw new Error('Selesaikan musuh yang sedang dihadapi.');
        syncPartyHealth();
        const launched = GameDungeons.launch(player);
        persist(launched.next); // Reserve this wave before exposing an enemy.
        isGameStarted = true;
        beginEncounter(launched.enemy);
    };
    api.settleVictory = () => {
        if (!inBattle || !currentEnemy?.dungeonToken || currentEnemy.hp > 0 || isDefeatHandled || api.inTransaction) return false;
        syncPartyHealth();
        const before = clone(player);
        const allies = playerParty.map(actor => ({ actor, snapshot: clone(actor) }));
        const afk = clone(afkSummary);
        let outcome;
        api.transactionLogs = [];
        try {
            api.inTransaction = true;
            applyMonsterVictory(); // Original EXP, Gold, drops, Party and Quest path; saves deferred.
            const drops = {};
            for (const [name, qty] of Object.entries(player.inventory || {})) {
                const gain = qty - (before.inventory?.[name] || 0);
                if (gain > 0) drops[name] = gain;
            }
            outcome = GameDungeons.victory(player, currentEnemy, drops);
            player.gold += outcome.gold; player.exp += outcome.exp;
            if (afkSummary.active) {
                afkSummary.goldEarned += outcome.gold;
                afkSummary.expEarned += outcome.exp;
            }
            if (outcome.exp) checkLevelUp();
            if(outcome.complete){GameDungeons.restoreHealth(player,before.dungeon.active);applyHealth(player);}
            api.inTransaction = false;
            saveGameData(true); // One commit for every reward and the consumed wave token.
        } catch (error) {
            api.inTransaction = false;
            api.transactionLogs = [];
            for (const key of Object.keys(player)) delete player[key];
            Object.assign(player, before);
            for (const { actor, snapshot } of allies) {
                for (const key of Object.keys(actor)) delete actor[key];
                Object.assign(actor, snapshot);
            }
            Object.assign(afkSummary, afk);
            inBattle = true; isDefeatHandled = false;
            api.lastError = `Hasil belum tersimpan: ${error.message}. Buka Dungeon untuk mencoba simpan lagi.`;
            stopAuto();
            syncTypedStatsFromActors(); updateStats();
            logMessage(api.lastError, 'other');
            return false;
        }
        // Rendering/logging happens after commit and can never roll back persisted rewards.
        api.lastError = '';
        if (outcome.complete) stopAuto();
        const messages = api.transactionLogs; api.transactionLogs = [];
        for (const [message, type] of messages) logMessage(message, type);
        if (outcome.complete) logMessage(`DUNGEON SELESAI! Bonus clear pertama: ${outcome.gold} Gold, ${outcome.exp} EXP.`, 'other');
        globalThis.BattleVisuals?.emit('defeat', { target: currentEnemy });
        updateStats();
        return true;
    };
    api.abandon = () => {
        syncPartyHealth();
        const next = clone(player);
        if (!GameDungeons.end(next, 'abandoned')) return;
        persist(next);
        stopAuto(); inBattle = false; currentEnemy = null;
        player.combatBuffs = []; player.debuffs = []; playerParty = [];
        api.lastError = '';
        updateStats();
    };
    api.recover = () => {
        if (!GameDungeons.state(player).active) return;
        const next = clone(player);
        GameDungeons.end(next, 'interrupted');
        persist(next);
        logMessage('Run Dungeon terputus karena halaman ditinggalkan/dimuat ulang. Hadiah gelombang yang sudah disimpan tetap dimiliki.', 'other');
    };
    api.statusText = () => {
        if (api.lastError) return api.lastError;
        const d = GameDungeons.state(player), run = d.active;
        if (run) return `Dungeon ${GameJournal.stages[run.stage]} · ${GameDungeons.difficulties[run.difficulty].name} · Gelombang ${run.wave + 1}/${GameDungeons.plan(run.stage, run.difficulty).length} · ${run.status === 'combat' ? 'Bertempur' : 'Siap dilanjutkan'}`;
        const label = { completed: 'Selesai', defeat: 'Kalah', abandoned: 'Ditinggalkan', interrupted: 'Terputus' };
        return d.lastRun ? `Dungeon: ${d.completed || 0} selesai · ${d.failed || 0} gagal/terputus. Run terakhir: ${label[d.lastRun.status] || 'Berakhir'}.` : '';
    };
    api.render = (content, status, el, leave) => {
        const d = GameDungeons.state(player), run = d.active;
        const button = (label, action, disabled = false) => {
            const node = el('button', label); node.type = 'button'; node.disabled = disabled;
            node.addEventListener('click', () => {
                try { action(); if (!api.lastError) leave(); else status.textContent = api.lastError; }
                catch (error) { status.textContent = error.message; }
            });
            return node;
        };
        content.append(el('p', api.statusText() || 'Pilih wilayah dan tingkat tantangan.'));
        content.append(el('p', 'HP pemain dan party aktif penuh saat masuk Dungeon, lalu berlanjut antar-gelombang. Saat run berakhir, HP kembali seperti sebelum masuk. Mana tidak direset saat masuk. Menutup, meninggalkan, atau memuat ulang halaman menggagalkan run; HP dipulihkan saat game dibuka kembali. Hadiah gelombang yang sudah disimpan tetap dimiliki.'));
        if (run) {
            content.append(button(currentEnemy?.hp <= 0 && inBattle ? 'Coba Simpan Hasil' : 'Gelombang Berikutnya', api.launch, inBattle && currentEnemy?.hp > 0));
            content.append(button('Akhiri Dungeon (catat gagal)', api.abandon));
            return;
        }
        for (const definition of GameDungeons.definitions) {
            const card = el('article', undefined, 'journal-card');
            card.dataset.dungeonStage = definition.stage;
            card.append(el('h3', `Dungeon ${GameJournal.stages[definition.stage]}`), el('p', `Level minimal ${definition.minLevel}`));
            const boss = GameDungeons.plan(definition.stage, 'normal').at(-1);
            const mechanic = GameBossMechanics.definition(boss);
            card.append(el('p', `Boss: ${boss.name}. ${mechanic.name}: ${mechanic.description}`));
            for (const [id, difficulty] of Object.entries(GameDungeons.difficulties)) {
                const cleared = d.cleared?.[`${definition.stage}:${id}`] || 0;
                card.append(el('p', `${difficulty.name}: ${difficulty.waves} gelombang · Selesai ${cleared}×. Bonus pertama: ${Math.max(1, Math.floor(boss.gold / 2))} Gold + ${Math.floor(boss.exp / 10)} EXP.`));
                const enter = button(`Masuk ${difficulty.name}`, () => api.start(definition.stage, id), inBattle || player.hp <= 0 || player.level < definition.minLevel);
                enter.dataset.dungeonDifficulty = id; card.append(enter);
            }
            content.append(card);
        }
    };
    window.GameAdventures = api;
})();
