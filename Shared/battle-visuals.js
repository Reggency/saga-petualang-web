// Presentation bridge: never writes actors, combat timers, rewards or storage.
(function () {
    'use strict';
    const scriptURL = document.currentScript.src;
    const query = new URLSearchParams(location.search);
    let enabled = query.get('battle2d') !== '0' && query.get('battleAnimations') !== '0';
    let view = null, loading = false, failed = false, snapshot = null, disposed = false;
    let viewJob = null, loadVersion = 0;
    let transition = null, transitionJob = null;
    let look = null;
    if(query.get('battleLook')!=='0')try{look=window.GameBattleLook.create(document.getElementById('arena'));}
    catch(error){console.warn('[Battle look] Tampilan dasar digunakan.',error.message);}
    const refresh = (transitionCompleted = false) => {
        if (!disposed) window.dispatchEvent(new CustomEvent('battle-visuals-ready', { detail: { transitionCompleted } }));
    };
    function hide() {
        transition?.cancel(); view?.suspend();
        document.getElementById('arena')?.classList.remove('has-fighter-2d');
    }
    try {
        transition = window.SagaEnemyTransition.create(document.getElementById('arena'), {
            onReady() { view?.suspend(); if (snapshot) window.BattleVisuals.sync(snapshot); refresh(true); },
            onError(error) { console.warn('[Battle 2D] Transisi dibatalkan.', error.message); refresh(); }
        });
    } catch (error) { console.warn('[Battle 2D] Transisi tidak tersedia.', error.message); }
    window.BattleVisuals = {
        sync(next) {
            snapshot = next;
            if (viewJob !== next.job) { loadVersion++;view?.destroy();view=null;loading=false;failed=false;viewJob=next.job; }
            if (transition?.holding && (!enabled || document.hidden || next.session === false || !next.target || next.job !== transitionJob)) {
                transition.cancel(); view?.suspend();
            }
            try{look?.sync(!disposed&&enabled&&!document.hidden ?
                (transition?.holding?{...next,active:true,target:transition.target}:next):{active:false});}
            catch(error){look?.destroy();look=null;console.warn('[Battle look] Tampilan dasar digunakan.',error.message);}
            if (!disposed && transition?.holding) {
                try { view?.sync({ active: true, job: transitionJob, target: transition.target }); }
                catch (error) { this.fail(error); }
                return;
            }
            if(!disposed&&!document.hidden&&next.active)window.GameAudio?.battle('encounter',{target:next.target});
            if (disposed || !enabled || failed || document.hidden || !next.active || !['Fighter','Warga','Mage','Assassin'].includes(next.job)) { hide(); return; }
            if (view) { try { view.sync(next); } catch (error) { this.fail(error); } return; }
            if (loading) return;
            loading = true;
            const version=loadVersion,job=next.job;
            Promise.resolve().then(() => window.SagaFighter2D.create(document.getElementById('arena'), {
                assetURL: new URL(`../assets/characters/${job==='Warga'?'warga':job==='Mage'?'Mage':job==='Assassin'?'Assassin':'fighter'}/`, scriptURL).href, job,
                onError: error => { if(version===loadVersion)this.fail(error); }
            })).then(created => {
                if(version!==loadVersion){created.destroy();return;}
                loading = false;
                if (disposed || failed) { created.destroy(); return; }
                view = created;
                if (snapshot) this.sync(snapshot);
            }).catch(error => { if(version===loadVersion)this.fail(error); });
        },
        emit(type, detail = {}) {
            const attack=type==='attack'||type==='skill';
            const soundDetail={...detail,job:snapshot?.job};
            if(!disposed&&attack)window.GameAudio?.battle('attack',soundDetail);
            if(type==='defeat'&&(!enabled||!transition||failed))window.GameAudio?.battle('death',soundDetail);
            if(attack&&(disposed||!enabled||failed||!view?.diagnostics.active)){
                if(!disposed){window.GameAudio?.battle('projectile',soundDetail);window.GameAudio?.battle('impact',soundDetail);}
            }
            if (disposed || !enabled || document.hidden) return;
            if (type === 'defeat') {
                if (snapshot?.target === detail.target && snapshot?.session !== false && transition?.start(detail.target)) {
                    transitionJob = snapshot.job;
                    try { view?.finishForDefeat(detail.target); } catch (error) { this.fail(error); }
                }else window.GameAudio?.battle('death',soundDetail);
                return;
            }
            if (type === 'dead') { transition?.cancel(); }
            else if (transition?.holding) return;
            if (failed) return;
            try {
                const active=view?.diagnostics.active;
                const accepted=view?.event(type, detail);
                if(attack&&active&&accepted!==true){window.GameAudio?.battle('projectile',soundDetail);window.GameAudio?.battle('impact',soundDetail);}
            } catch (error) { this.fail(error); }
        },
        fail(error) {
            failed = true; loading = false; hide(); view?.destroy(); view = null;
            console.warn('[Battle 2D] Tampilan Battle lama digunakan.', error?.message || String(error));
            refresh();
        },
        setEnabled(value) { enabled = value === true; if (!enabled) { hide(); refresh(); } else if (snapshot) this.sync(snapshot); },
        cancelTransition() { transition?.cancel(); view?.suspend(); refresh(); },
        get holdsEnemy() { return Boolean(transition?.holding); },
        get diagnostics() { return { enabled, failed, loading, ready:false, timerCount:0, animationCount:0, ...(view?.diagnostics || {}), transition: transition?.diagnostics,look:look?.diagnostics }; }
    };
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {look?.suspend();hide();} else { if (snapshot) window.BattleVisuals.sync(snapshot); refresh(); }
    });
    window.addEventListener('pagehide', () => { disposed = true; hide(); look?.destroy();view?.destroy(); view = null; });
})();
