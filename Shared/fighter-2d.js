// Fighter presentation only. Combat results are inputs, never gameplay callbacks.
(function (root) {
    'use strict';
    // Measured on the 683x1024 PNGs: alpha > 32 for the floor, alpha > 128
    // in the lowest 16 rows for the planted foot. Scale preserves artwork size.
    const poses = {
        IDLE: { file: 'fighter-idle.png', scale: 1, footX: 205, floorY: 987 },
        READY: { file: 'fighter-ready.png', scale: 1, footX: 142, floorY: 1012 },
        SLASH: { file: 'fighter-slash.png', scale: 1, footX: 163, floorY: 1000 },
        RECOVER: { file: 'fighter-recover.png', scale: 1, footX: 224, floorY: 993 }
    };
    const timings = { ready: 180, slash: 300, hit: 200, recover: 250, cycle: 1300, normal:500 };
    const files = [...Object.values(poses).map(p => p.file), 'slash-effect.png', 'hit-effect.png'];
    async function create(arena, { assetURL, onError, job = 'Fighter' }) {
        const isWarga = job === 'Warga';
        const isMage = job === 'Mage';
        const isAssassin = job === 'Assassin';
        const poses = isAssassin ? Object.fromEntries(Object.entries({IDLE:'pembunuh_bayangan_biru_keemasan.png',READY:'pembunuh_bayangan_biru_keemasan.png',SLASH:'assassin_bayangan_menebas_dengan_belati_emas.png',RECOVER:'pembunuh_bayangan_biru_keemasan.png'})
            .map(([key,file])=>[key,{file,scale:1,footX:512,floorY:1024}])) : isMage ? Object.fromEntries(Object.entries({IDLE:'penyihir_ungu_dengan_tongkat_magis.png',READY:'penyihir_ungu_dalam_posisi_siaga.png',SLASH:'penyihir_ungu_dalam_pose_mantra_cepat.png',RECOVER:'penyihir_ungu_dalam_posisi_siaga.png'})
            .map(([key,file])=>[key,{file,scale:1,footX:512,floorY:1024}])) : isWarga ? Object.fromEntries(Object.entries({ IDLE:'idle.png', READY:'ready.png', SLASH:'attack.png', RECOVER:'ready.png', HIT:'hit.png', KO:'ko.png', WALK:'walk.png' })
            .map(([key,file]) => [key,{file,scale:1,footX:512,floorY:1024}])) : root.SagaFighter2D.poses;
        const slashFile=isAssassin?'tebasan_bulan_sabit_biru_keemasan.png':isMage?'ledakan_energi_sihir_ungu.png':'slash-effect.png';
        const hitFile=isAssassin?'ledakan_energi_biru_dan_emas.png':isMage?'sigil_sihir_ungu_bercahaya.png':'hit-effect.png';
        const files = [...new Set([...Object.values(poses).map(p=>p.file),...(isWarga?[]:[slashFile,hitFile])])];
        const wargaFiles = {
            'idle.png':['petualang_desa_dengan_pedang_pendek.png','warga-idle.png','warga-pria-idle.png'],
            'ready.png':['petualang_desa_dalam_posisi_siaga.png','warga-ready.png','warga-pria-idle.png'],
            'attack.png':['petualang_muda_menebas_dengan_pedang.png','warga-serang.png','warga-pria-attack-1.png'],
            'hit.png':['warga-hit.png','warga-pria-hit.png'],
            'ko.png':['warga-lelah.png','warga-pria-ko.png'],
            'walk.png':['warga-idle.png','warga-pria-walk.png']
        };
        const assets = {}, unavailable = [];
        await Promise.all(files.map(file => new Promise(resolve => {
            const image = new Image();
            let settled = false;
            const finish = success => {
                if (settled) return;
                settled = true; clearTimeout(timeout); image.onload = image.onerror = null;
                if (success) assets[file] = image;
                else { unavailable.push(file); console.warn(`[Battle 2D] PNG tidak tersedia: ${file}`); }
                resolve();
            };
            const timeout = setTimeout(() => finish(false), 8000);
            image.onload = () => {
                if (!image.naturalWidth) { finish(false); return; }
                image.decode().then(() => finish(true), () => finish(false));
            };
            let alternate = 0;
            image.onerror = () => {
                if(isWarga && alternate<wargaFiles[file].length){image.src=new URL(wargaFiles[file][alternate++],assetURL).href;return;}
                finish(false);
            };
            image.src = new URL(file, assetURL).href;
        })));
        const defaultPose = Object.keys(poses).find(key => assets[poses[key].file]) || (isWarga ? 'IDLE' : null);
        if (!defaultPose) throw new Error(`Tidak ada pose ${job} yang dapat dimuat`);
        const layer = document.createElement('div');
        layer.className = 'fighter-2d-layer'; layer.hidden = true; layer.setAttribute('aria-hidden', 'true');
        if(isWarga)layer.classList.add('is-warga');
        layer.classList.add('has-idle-motion');
        const actor = document.createElement('div'); actor.className = 'fighter-2d-actor';
        const body = document.createElement('div'); body.className = 'fighter-2d-body';
        const lighting = document.createElement('div'); lighting.className = 'fighter-2d-lighting';
        const shadow = document.createElement('span'); shadow.className = 'fighter-contact-shadow';
        body.append(lighting);
        const poseImages = {};
        for (const [key, config] of Object.entries(poses)) {
            const source = assets[config.file];
            const image = isWarga || isAssassin || isMage ? source?.cloneNode(true) : source;
            if (!image) continue;
            if (isWarga || isMage || isAssassin) {
                try {
                // Normalize visible pixels once per pose; transparent PNG margins never move the feet.
                const canvas=document.createElement('canvas'),ratio=Math.min(1,192/Math.max(source.naturalWidth,source.naturalHeight));
                canvas.width=Math.max(1,Math.round(source.naturalWidth*ratio));canvas.height=Math.max(1,Math.round(source.naturalHeight*ratio));
                const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(source,0,0,canvas.width,canvas.height);
                const pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data;
                let top=canvas.height,bottom=-1,left=canvas.width,right=-1;
                for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++)if(pixels[(y*canvas.width+x)*4+3]>32){top=Math.min(top,y);bottom=Math.max(bottom,y);left=Math.min(left,x);right=Math.max(right,x);}
                if(bottom>=top){config.scale=canvas.height/(bottom-top+1);config.floorY=(bottom+1)/canvas.height*1024;config.footX=(left+right+1)/2/canvas.height*1024;config.paintedWidth=(right-left+1)/canvas.height;}
                } catch { /* Keep a contained full-image pose if pixel sampling is unavailable. */ }
            }
            image.className = 'fighter-2d-pose'; image.alt = ''; image.hidden = true; image.draggable = false;
            image.style.height = `${100 * config.scale}%`;
            image.style.left = `${50 - config.footX / 1024 * 100 * config.scale}%`;
            image.style.top = `${(1 - config.floorY / 1024 * config.scale) * 100}%`;
            lighting.append(image); poseImages[key] = image;
        }
        if (isWarga && !Object.keys(poseImages).length) {
            const fallback=document.createElement('div');fallback.className='warga-2d-fallback';
            const icon=document.createElement('i');icon.className='fa-solid fa-user';fallback.append(icon);
            lighting.append(fallback);poseImages.IDLE=fallback;
        }
        actor.append(shadow,body); layer.append(actor);
        function effectImage(file, className) {
            const image = assets[file];
            if (!image) return null;
            image.className = className; image.alt = ''; image.hidden = true; image.draggable = false;
            layer.append(image); return image;
        }
        const slash = effectImage(slashFile, 'fighter-2d-slash');
        const hit = effectImage(hitFile, 'fighter-2d-hit');
        const number = document.createElement('span'); number.className = 'fighter-2d-damage';
        number.hidden = true; layer.append(number); arena.append(layer);
        const monster = arena.querySelector('#monster-img');
        const media = matchMedia('(prefers-reduced-motion: reduce)');
        let active = false, destroyed = false, dead = false, state = 'IDLE', currentPose = defaultPose;
        let target = null, timer = null, generation = 0, animations = [], reaction = null;
        let poseBlends = [];
        let poseBlendMs = 80;
        let geometry = null, result = null, events = 0, cycles = 0;
        let nextVisualAt = 0, visualStartedAt = 0, coalesced = 0, defeating = false;
        function animate(node, keyframes, duration, fill = 'none') {
            if (!node) return null;
            const animation = node.animate(keyframes, { duration, easing: 'cubic-bezier(.22,.61,.36,1)', fill });
            animations.push(animation); return animation;
        }
        function clearVisuals() {
            generation++; clearTimeout(timer); timer = null;
            animations.forEach(animation => animation.cancel()); animations = [];
            reaction?.cancel(); reaction = null;
            poseBlends.forEach(animation=>animation.cancel());poseBlends=[];
            for(const [key,image]of Object.entries(poseImages))image.hidden=key!==currentPose;
            if (slash) slash.hidden = true;
            if (hit) hit.hidden = true;
            number.hidden = true; result = null;
        }
        function showPose(next) {
            state = next;
            layer.dataset.state=next;
            const selected = poseImages[next] ? next : defaultPose;
            if (currentPose === selected && !poseImages[selected].hidden) return;
            const previous=currentPose;
            poseBlends.forEach(animation=>animation.cancel());poseBlends=[];
            for (const [key, image] of Object.entries(poseImages)) image.hidden = key !== selected;
            currentPose = selected;
            if(isWarga && active && !media.matches && previous!==selected){
                const outgoing=poseImages[previous],incoming=poseImages[selected];
                outgoing.hidden=false;
                const fade=outgoing.animate([{opacity:1},{opacity:0}],{duration:poseBlendMs,easing:'ease-out'});
                fade.onfinish=()=>{if(currentPose!==previous)outgoing.hidden=true;};
                poseBlends=[fade,incoming.animate([{opacity:0},{opacity:1}],{duration:poseBlendMs,easing:'ease-out'})];
            }
        }
        function idle() { clearVisuals(); showPose('IDLE'); }
        function suspend() {
            active = false; dead = false; defeating = false; nextVisualAt = 0; idle(); layer.hidden = true;
            arena.classList.remove('has-fighter-2d');
        }
        function fail(error) { suspend(); onError(error); }
        function guard(callback) {
            return (...args) => { if (destroyed) return; try { callback(...args); } catch (error) { fail(error); } };
        }
        function measure() {
            if (!active || destroyed) return;
            const a = arena.getBoundingClientRect(), m = monster.getBoundingClientRect();
            const wrapper = arena.querySelector('.monster-wrapper').getBoundingClientRect();
            const previousHeight = Math.min(wrapper.height * .96, a.height * .70, a.width * .68);
            const previousFloor = Math.min(a.height - 5, wrapper.bottom - a.top);
            const drop = Math.min(70, a.width * .085, a.height * .13);
            const baseFloor = Math.min(a.height - 10, previousFloor + drop), home = a.width * .19;
            // Lower only the player; keep room for its shadow above the controls.
            const floor = Math.min(baseFloor + 60, a.height - 20);
            const height = Math.max(1, Math.min(previousHeight * 1.28, baseFloor - 8, a.width * .70));
            actor.style.width = actor.style.height = `${height}px`;
            actor.style.left = `${home - height / 2}px`; actor.style.top = `${floor - height}px`;
            const sharedPoseWidth=isAssassin||isMage?Math.max(...Object.values(poses).map(p=>p.scale*(p.paintedWidth||1))):0;
            if(isWarga || isMage || isAssassin)for(const [key,image]of Object.entries(poseImages)){
                const config=poses[key];if(!image.naturalWidth)continue;
                const scale=config.scale*Math.min(1,Math.max(1,2*(home-8))/(height*(sharedPoseWidth||config.scale*(config.paintedWidth||image.naturalWidth/image.naturalHeight))));
                image.style.height=`${100*scale}%`;image.style.left=`${50-config.footX/1024*100*scale}%`;image.style.top=`${(1-config.floorY/1024*scale)*100}%`;
            }
            geometry = { home, floor, baseFloor, height, previousHeight, previousFloor,
                // Sword hand in the SLASH PNG, measured in source pixels.
                startX: isMage || isAssassin ? home+height*.2 : home + (230 - poses.SLASH.footX) / 1024 * height,
                startY: isMage || isAssassin ? floor-height*.55 : floor - (poses.SLASH.floorY - 500) / 1024 * height,
                targetX: m.left - a.left + m.width * .48,
                targetY: m.top - a.top + m.height * .48,
                effectSize: Math.max(25, Math.min(height * .62, m.width * .65, 135)) };
        }
        // Image/layout updates must not cancel an attack already in progress.
        const resize = guard(() => { if (active) measure(); });
        const motionChange=guard(()=>{if(active){idle();nextVisualAt=0;measure();}});
        const observer = new ResizeObserver(resize);
        observer.observe(arena); observer.observe(arena.querySelector('#enemy-panel'));
        monster.addEventListener('load', resize); media.addEventListener('change', motionChange);
        function schedule(callback, delay, token) {
            timer = setTimeout(guard(() => {
                timer = null;
                if (token !== generation || !active || destroyed || dead || document.hidden) return;
                callback();
            }), delay);
        }
        function impact(duration) {
            if (!result || result.miss || !(result.damage > 0)) return;
            result.impacted = true;
            root.GameAudio?.battle('impact',{job,target,...result});
            const g = geometry;
            if (hit) {
                hit.hidden = false; hit.style.width = `${g.effectSize}px`;
                hit.style.left = `${g.targetX - g.effectSize / 2}px`; hit.style.top = `${g.targetY - g.effectSize / 2}px`;
                animate(hit, [{ opacity: 0, transform: 'scale(.6)' }, { opacity: 1, offset: .25 }, { opacity: 0, transform: 'scale(1.15)' }], duration);
            }
            if (!media.matches) animate(monster, [
                { transform: 'translateX(0)' }, { transform: 'translateX(-3px)' },
                { transform: 'translateX(3px)' }, { transform: 'translateX(0)' }
            ], Math.min(duration, 150));
            // The existing engine logs damage; it has no floating damage number.
            number.textContent = `${result.critical ? 'CRIT ' : ''}${result.damage}`;
            number.classList.toggle('critical', Boolean(result.critical));
            number.style.left = `${g.targetX}px`; number.style.top = `${g.targetY}px`; number.hidden = false;
            animate(number, [{ opacity: 1, transform: 'translate(-50%, -50%)' },
                { opacity: 0, transform: `translate(-50%, ${media.matches ? '-50%' : 'calc(-50% - 18px)'})` }], duration + 50);
        }
        function start(detail, final = false) {
            clearVisuals(); measure(); result = { damage: detail.damage, critical: detail.critical, miss: detail.miss };
            visualStartedAt = performance.now();
            const token = generation;
            // All jobs share one normal tempo; shorten only to fit an actual fast attack.
            const interval=Number(detail.interval);
            const duration=Number.isFinite(interval)&&interval>0?Math.min(timings.normal,Math.max(120,interval*.82)):timings.normal;
            const pace=final?1:duration/(timings.ready+timings.slash+timings.recover);
            const readyMs = final ? 0 : timings.ready*pace;
            const slashMs = final ? 180 : timings.slash*pace;
            const recoverMs = final ? 120 : timings.recover*pace;
            if(isWarga)poseBlendMs=Math.min(80,Math.max(20,Math.min(readyMs||slashMs,slashMs,recoverMs)*.45));
            const nudge = media.matches ? 0 : Math.min(8, geometry.height * .035);
            showPose('READY');
            if(isWarga && !media.matches){
                const duration=readyMs+slashMs+recoverMs,lunge=Math.min(18,arena.clientWidth*.035);
                const anticipation=readyMs/duration,strike=(readyMs+slashMs*.4)/duration;
                animate(actor,[{transform:'translateX(0)'},{transform:`translateX(${-nudge}px)`,offset:anticipation},
                    {transform:`translateX(${lunge}px)`,offset:strike},{transform:'translateX(0)'}],duration);
                animate(body,[{transform:'rotate(0deg)'},{transform:'rotate(-1.2deg)',offset:anticipation},
                    {transform:'rotate(1deg)',offset:strike},{transform:'rotate(0deg)'}],duration);
                const shadowAnchor=getComputedStyle(shadow).transform;
                const shadowTransform=shadowAnchor==='none'?'':shadowAnchor;
                animate(shadow,[{transform:`${shadowTransform} scaleX(1)`},{transform:`${shadowTransform} scaleX(.96)`,offset:anticipation},
                    {transform:`${shadowTransform} scaleX(1.04)`,offset:strike},{transform:`${shadowTransform} scaleX(1)`}],duration);
            }else if(!media.matches){
                const duration=readyMs+slashMs+recoverMs;
                const anticipation=readyMs/duration,strike=(readyMs+slashMs*.4)/duration;
                const lunge=isMage?2:Math.min(isAssassin?14:10,geometry.height*.05);
                animate(actor,[{transform:'translateX(0)'},{transform:`translateX(${-nudge}px)`,offset:anticipation},
                    {transform:`translateX(${lunge}px)`,offset:strike},{transform:'translateX(0)'}],duration);
                animate(body,[{transform:'rotate(0deg)'},{transform:`rotate(${isMage?-.4:-1}deg)`,offset:anticipation},
                    {transform:`rotate(${isMage ? .4 : .8}deg)`,offset:strike},{transform:'rotate(0deg)'}],duration);
            }else if(!isWarga)animate(actor,[{transform:'none'},{transform:'none'}],readyMs);
            schedule(() => {
                showPose('SLASH');
                root.GameAudio?.battle('projectile',{job,target});
                if (slash) {
                    const g = geometry, size = g.effectSize;
                    const x = media.matches ? g.targetX : g.startX, y = media.matches ? g.targetY : g.startY;
                    slash.style.width = `${size}px`; slash.style.left = `${x - size / 2}px`; slash.style.top = `${y - size / 2}px`; slash.hidden = false;
                    const end = media.matches ? 'none' : `translate(${g.targetX - g.startX}px, ${g.targetY - g.startY}px) rotate(${isMage?0:10}deg)`;
                    animate(slash, [{ opacity: 0, transform: 'none' }, { opacity: .9, offset: .12 },
                        { opacity: 1, transform: end, offset: .55 }, { opacity: 0, transform: end }], slashMs);
                }
                schedule(() => {
                    impact(timings.hit*pace);
                    schedule(() => {
                        showPose('RECOVER'); if (slash) slash.hidden = true;
                        schedule(() => { cycles++; idle(); }, recoverMs, token);
                    }, slashMs * .45, token);
                }, slashMs * .55, token);
            }, readyMs, token);
        }
        showPose('IDLE');
        return {
            sync(snapshot) {
                if (destroyed) return;
                if (!snapshot.active || snapshot.job !== job || document.hidden) { suspend(); return; }
                if (snapshot.target !== target) { target = snapshot.target; dead = false; defeating = false; nextVisualAt = 0; idle(); }
                const wasActive = active; active = true;
                arena.classList.add('has-fighter-2d'); layer.hidden = false;
                if (!wasActive) measure();
            },
            event(type, detail) {
                if (!active || destroyed || document.hidden || (detail.target && detail.target !== target)) return;
                events++;
                if (type === 'dead') { idle(); dead = true; if(isWarga)showPose('KO');else state = 'CANCELLED'; return; }
                if (dead || defeating) return;
                if (isWarga && (type === 'hit' || type === 'walk')) {
                    if(timer!==null && ['READY','SLASH','RECOVER'].includes(state)){
                        // Like Fighter, damage feedback overlays the attack instead of cancelling it.
                        if(type==='hit'&&!media.matches){
                            reaction?.cancel();
                            reaction=body.animate([{filter:'brightness(1)'},{filter:'brightness(1.3)'},{filter:'brightness(1)'}],{duration:140});
                        }
                        return;
                    }
                    clearVisuals();showPose(type==='hit'?'HIT':'WALK');
                    if(type==='hit'&&!media.matches)reaction=body.animate([
                        {transform:'translateX(0)',filter:'brightness(1)'},
                        {transform:'translateX(-4px) rotate(-1deg)',filter:'brightness(1.3)',offset:.3},
                        {transform:'translateX(0)',filter:'brightness(1)'}],{duration:timings.hit,easing:'ease-out'});
                    schedule(idle,timings.hit,generation);return;
                }
                if (type === 'attack' || type === 'skill') {
                    if (performance.now() < nextVisualAt) { coalesced++; return; }
                    nextVisualAt = performance.now() + 16;
                    start(detail);
                    return true;
                }
                else if (type === 'hit' && !media.matches) {
                    reaction?.cancel();
                    reaction = body.animate([{ filter: 'brightness(1)' }, { filter: 'brightness(1.6)', transform: 'translateX(-2px)' }, { filter: 'brightness(1)', transform: 'none' }], { duration: 140 });
                }
            },
            finishForDefeat(enemy) {
                if (!active || destroyed || target !== enemy || defeating) return;
                defeating = true;
                // The final slash/impact fits inside the 300ms death reaction.
                // An already displayed impact must never be replayed.
                // Normal impact is within 237ms, before the existing 300ms death fade.
                // Let the current swing finish instead of restarting it at a faster tempo.
                if (result && !result.impacted && !result.miss && timer===null) start(result, true);
            },
            suspend,
            destroy() {
                if (destroyed) return;
                suspend(); destroyed = true; observer.disconnect();
                monster.removeEventListener('load', resize); media.removeEventListener('change', motionChange); layer.remove();
            },
            get diagnostics() {
                return { ready: true, mode: '2d', job, state, currentPose, active, dead,
                    loaded: Object.keys(assets), unavailable: [...unavailable], poseConfig: poses, reducedMotion: media.matches,
                    timerCount: timer === null ? 0 : 1, animationCount: animations.length + (reaction ? 1 : 0) + poseBlends.filter(a=>a.playState==='running').length,
                    queuedAttacks: timer === null ? 0 : 1, controllerCount: 1, rafCount: 0,
                    effectsVisible: Number(Boolean(slash && !slash.hidden)) + Number(Boolean(hit && !hit.hidden)),
                    damageVisible: !number.hidden, events, cycles, geometry, coalesced, defeating,
                    visualCooldown: Math.max(0, nextVisualAt - performance.now()), visualStartedAt, timings };
            }
        };
    }
    root.SagaFighter2D = { create, poses, timings };
})(typeof window !== 'undefined' ? window : globalThis);
