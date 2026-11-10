// A small, lazy pool: combat never creates an audio player per attack.
(function (root) {
    'use strict';
    const channels = [];
    const voices = new Set();
    const MAX_CHANNELS = 4;
    let context = null;
    let lastToneAt = 0;
    const recent = new Map();
    const soundRoot = root.document.currentScript?.src
        ? new URL('../Sound/', root.document.currentScript.src).href : '../Sound/';
    const jobFiles = {
        Warga: { attack:'Warga/Warga.mp3' },
        Fighter: { attack:'Fighter/Fighter.mp3' },
        Assassin: { attack:'Assassin/Assassin.mp3' },
        Archer: { attack:'Archer/Archer.mp3' },
        Mage: { attack:'Mage/Mage.mp3' }
    };

    function play(file, volume = 0.3) {
        if (root.document.hidden || !file) return;
        const now=Date.now();
        if(recent.has(file)&&now-recent.get(file)<80)return;
        recent.set(file,now);
        if(recent.size>64)recent.delete(recent.keys().next().value);
        let channel = channels.find(item => item.file === file);
        channel ||= channels.find(item => item.audio.paused || item.audio.ended);
        if (!channel && channels.length < MAX_CHANNELS) {
            channel = { audio: new root.Audio(), file: '', usedAt: 0 };
            channel.audio.preload = 'none';
            channels.push(channel);
        }
        channel ||= channels.reduce((oldest, item) => item.usedAt < oldest.usedAt ? item : oldest);
        const audio = channel.audio;
        audio.pause();
        if (channel.file !== file) { audio.src = file; channel.file = file; }
        else { try { audio.currentTime = 0; } catch {} }
        audio.volume = Math.max(0, Math.min(1, volume));
        channel.usedAt = Date.now();
        audio.onerror=()=>{
            if(channel.file===file&&audio.src.endsWith('.ogg')){
                audio.src=file.replace(/\.ogg$/,'.wav');
                try{audio.play()?.catch(()=>{});}catch{}
            }
        };
        try { audio.play()?.catch(() => {}); } catch {} // Autoplay never interrupts combat.
    }

    function effect(name) {
        if(!name)return;
        play(soundRoot+name);
    }
    function battle(event, {job,target,damage=0,critical=false,miss=false} = {}) {
        if(root.document.hidden)return;
        const files=jobFiles[job]||{};
        if(event==='attack')effect(files.attack);
        else if(event==='projectile')effect(files.projectile);
        else if(event==='impact'&&!miss&&damage>0){
            effect(files.impact);
            if(critical)effect(files.critical);
        }else if(event==='block')effect(files.block);
        else if(event==='potion')play(soundRoot+'Potion.mp3');
    }

    function tone(type) {
        if (root.document.hidden || !['heal', 'levelup', 'buy', 'error'].includes(type)) return;
        if (Date.now() - lastToneAt < 100 || voices.size >= MAX_CHANNELS) return;
        const AudioContext = root.AudioContext || root.webkitAudioContext;
        if (!AudioContext) return;
        context ||= new AudioContext();
        if (context.state === 'suspended') context.resume().catch(() => {});
        const ctx = context;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const voice = { osc, gain };
        voices.add(voice);
        lastToneAt = Date.now();
        osc.connect(gain);
        gain.connect(ctx.destination);
        const error = type === 'error';
        osc.type = error ? 'sawtooth' : 'sine';
        osc.frequency.setValueAtTime(error ? 150 : 400, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(error ? 50 : 800, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(error ? 0.2 : 0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.onended = () => { osc.disconnect(); gain.disconnect(); voices.delete(voice); };
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
    }

    function release() {
        for (const { audio } of channels) {
            audio.pause();
            audio.onerror=null;
            audio.removeAttribute('src');
            audio.load();
        }
        channels.length = 0;
        recent.clear();
        for (const { osc, gain } of voices) {
            osc.onended = null;
            try { osc.stop(); } catch {}
            osc.disconnect();
            gain.disconnect();
        }
        voices.clear();
        if (context) { context.close().catch(() => {}); context = null; }
    }

    root.GameAudio = { play, tone, battle, release };
    function unlock() { if(context?.state==='suspended')context.resume().catch(()=>{}); }
    root.document.addEventListener('pointerdown',unlock,{passive:true});
    root.document.addEventListener('keydown',unlock);
    root.document.addEventListener('visibilitychange', () => { if (root.document.hidden) release(); });
    root.addEventListener('pagehide', release);
})(window);
