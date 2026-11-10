// Only presentation is delayed. This controller never spawns or rewards an enemy.
(function (root) {
    'use strict';
    const timings = { reaction: 300, fade: 700, empty: 800 };
    function create(arena, { onReady, onError }) {
        const image = arena.querySelector('#monster-img');
        const settled = new WeakSet();
        let target = null, phase = 'IDLE', timer = null, generation = 0, animation = null;
        let startedAt = 0, completed = 0;
        let shadowAnimation = null;
        function cancel() {
            generation++; clearTimeout(timer); timer = null;
            animation?.cancel(); animation = null;
            shadowAnimation?.cancel(); shadowAnimation = null;
            phase = 'IDLE'; target = null; delete arena.dataset.enemyTransition;
        }
        function schedule(callback, delay, token) {
            timer = setTimeout(() => {
                timer = null;
                if (generation !== token) return;
                try { callback(); } catch (error) { cancel(); onError(error); }
            }, delay);
        }
        function start(enemy) {
            if (!enemy || typeof enemy !== 'object' || phase !== 'IDLE' || settled.has(enemy)) return false;
            settled.add(enemy); target = enemy; startedAt = performance.now();
            phase = 'DEFEATING'; arena.dataset.enemyTransition = phase;
            const token = ++generation;
            try {
                const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
                animation = image.animate(reduced ? [{ opacity: 1 }, { opacity: 1 }] : [
                    { transform: 'translateX(0)' }, { transform: 'translateX(-4px)' },
                    { transform: 'translateX(4px)' }, { transform: 'translateX(0)' }
                ], { duration: timings.reaction });
                schedule(() => {
                    animation?.cancel(); phase = 'FADING'; arena.dataset.enemyTransition = phase;
                    root.GameAudio?.battle('death',{target:enemy});
                    animation = image.animate([
                        { opacity: 1, transform: 'none' },
                        { opacity: .65, transform: reduced ? 'none' : 'translateY(2px) scale(.985)', offset:.4 },
                        { opacity: 0, transform: reduced ? 'none' : 'translateY(7px) scale(.94)' }
                    ], { duration: timings.fade, easing: 'cubic-bezier(.4,0,.6,1)', fill: 'forwards' });
                    const shadow = arena.querySelector('.monster-contact-shadow');
                    if (shadow) shadowAnimation = shadow.animate([{opacity:1},{opacity:0}],
                        {duration:timings.fade,easing:'ease-in',fill:'forwards'});
                    schedule(() => {
                        phase = 'EMPTY'; arena.dataset.enemyTransition = phase;
                        schedule(() => { completed++; cancel(); onReady(); }, timings.empty, token);
                    }, timings.fade, token);
                }, timings.reaction, token);
                return true;
            } catch (error) { cancel(); onError(error); return false; }
        }
        return { start, cancel, get target() { return target; },
            get holding() { return phase !== 'IDLE'; },
            get diagnostics() { return { phase, timerCount: timer === null ? 0 : 1,
                startedAt, elapsed: phase === 'IDLE' ? 0 : performance.now() - startedAt,
                completed, duration: timings.reaction + timings.fade + timings.empty }; }
        };
    }
    root.SagaEnemyTransition = { create, timings };
})(typeof window !== 'undefined' ? window : globalThis);
