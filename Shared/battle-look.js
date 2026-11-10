// Read-only presentation metadata. No actor stats, saves, timers or combat callbacks.
(function(root){
    'use strict';
    const areas={
        forest:{ambient:'#294b3524',rim:'#a8d7b52e',fog:'#729e8a0c',warm:'#d4c58c0b',brightness:1,saturation:.92,contrast:1.02},
        cave:{ambient:'#142c4c38',rim:'#8bbce64a',fog:'#779fc410',warm:'#d5a15f0b',brightness:1.02,saturation:.88,contrast:1.03},
        ruins:{ambient:'#3343512b',rim:'#b5cad63a',fog:'#9cb0bf13',warm:'#c6b89007',brightness:1,saturation:.87,contrast:1.03},
        'frost-tundra':{ambient:'#25516c24',rim:'#c7ecff42',fog:'#b1d6e817',warm:'#effaff08',brightness:1.03,saturation:.93,contrast:1.02},
        'lava-lair':{ambient:'#381f202c',rim:'#ef9b5f3b',fog:'#a45d3b0c',warm:'#ef8d431c',brightness:1,saturation:.94,contrast:1.03},
        'abyssal-void':{ambient:'#30244732',rim:'#bba5ee3b',fog:'#8880c513',warm:'#777fdc10',brightness:1.02,saturation:.90,contrast:1.04}
    };
    const defaults={scale:.92,heightRatio:1,offsetX:0,offsetY:0,shadowWidth:.64,shadowOpacity:.32,
        brightness:1,saturation:1,contrast:1,airborne:false,lift:.18,embeddedBase:false};
    // These exceptions describe the actual artwork, not monster combat identities.
    const monsters={
        'slime-hijau.png':{scale:.80,embeddedBase:true},
        'kelelawar.png':{scale:.84,airborne:true,shadowWidth:.52,shadowOpacity:.13,lift:.19},
        'boss-orc.png':{scale:1.04,embeddedBase:true,brightness:1.09,saturation:.96},
        'gargoyle.png':{scale:.97,embeddedBase:true,brightness:.98},
        'raja-slime.png':{scale:1,embeddedBase:true},
        'Dragonlava.png':{scale:1,embeddedBase:true,saturation:.94},
        'wraith.png':{embeddedBase:true,brightness:1.08},
        'boss-lich.png':{scale:1,embeddedBase:true},
        'boss-icetitan.png':{scale:1},'boss-voidgod.png':{scale:1,shadowOpacity:.22}
    };
    function resolve(enemy){
        const asset=String(enemy?.img||'').split('/').pop().split('?')[0];
        const area=areas[enemy?.stage]||areas.forest;
        const isBoss=enemy?.isBoss===true||/\bBOSS\b/i.test(enemy?.name||'');
        const visual={...defaults,...(isBoss?{scale:1}:{}),...monsters[asset],heightRatio:isBoss?1.8:1};
        return {area,visual,asset,stage:areas[enemy?.stage]?enemy.stage:'forest'};
    }
    function fitSize({playerHeight,heightRatio,availableWidth,availableHeight,naturalWidth,naturalHeight,alpha}){
        const desiredHeight=playerHeight*heightRatio;
        const factor=Math.max(.001,Math.min(desiredHeight/(naturalHeight*alpha.height),
            availableWidth/(naturalWidth*alpha.width),availableHeight/(naturalHeight*alpha.height)));
        return {width:naturalWidth*factor,height:naturalHeight*factor,desiredHeight,
            paintedHeight:naturalHeight*factor*alpha.height,paintedWidth:naturalWidth*factor*alpha.width};
    }
    function create(arena){
        const panel=arena.closest('#center-panel'),image=arena.querySelector('#monster-img');
        const visual=arena.querySelector('.monster-visual'),lighting=arena.querySelector('.monster-lighting');
        const bounds=new Map(),written=new Map();
        let active=false,destroyed=false,queued=false,target=null,config=null,measurements=null,shiftY=0,shiftX=0;
        function set(name,value){if(written.get(name)===value)return;written.set(name,value);panel.style.setProperty(name,String(value));}
        function alphaBounds(source=image){
            const src=source.currentSrc||source.src;
            if(bounds.has(src))return bounds.get(src);
            let bottom=1,width=1,height=1,left=0,sampled=false;
            try{
                const canvas=document.createElement('canvas'),ratio=Math.min(1,256/Math.max(source.naturalWidth,source.naturalHeight));
                canvas.width=Math.max(1,Math.round(source.naturalWidth*ratio));canvas.height=Math.max(1,Math.round(source.naturalHeight*ratio));
                const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(source,0,0,canvas.width,canvas.height);
                const pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data;
                let minX=canvas.width,maxX=0,first=canvas.height,last=0;
                for(let y=0;y<canvas.height;y++){
                    let count=0;
                    for(let x=0;x<canvas.width;x++)if(pixels[(y*canvas.width+x)*4+3]>40){count++;minX=Math.min(minX,x);maxX=Math.max(maxX,x);}
                    if(count>0){last=y;first=Math.min(first,y);}
                }
                bottom=(last+1)/canvas.height;width=Math.max(.1,(maxX-minX+1)/canvas.width);height=Math.max(.1,(last-first+1)/canvas.height);
                left=minX/canvas.width;
                sampled=true;
                canvas.width=canvas.height=1;
            }catch(error){console.warn('[Battle look] Margin PNG memakai default.',error.message);}
            const value={bottom,width,height,left,sampled};if(bounds.size>=64)bounds.delete(bounds.keys().next().value);bounds.set(src,value);return value;
        }
        function measure(){
            if(!active||destroyed||arena.dataset.enemyTransition)return;
            if(image.getAnimations().some(animation=>animation.playState==='running')){requestMeasure();return;}
            const a=arena.getBoundingClientRect(),wrapper=arena.querySelector('.monster-wrapper').getBoundingClientRect();
            const drop=Math.max(0,Math.min(70,a.width*.085,a.height*.13,a.bottom-wrapper.bottom-10));
            set('--battle-floor-drop',`${drop.toFixed(2)}px`);
            const ready=image.complete&&image.naturalWidth>0&&image.offsetWidth>0&&image.getAttribute('src')===target?.img;
            visual.dataset.imageReady=String(ready);
            if(!ready)return;
            const b=alphaBounds(),v=config.visual;
            const name=arena.querySelector('#enemy-name'),boss=arena.querySelector('#boss-mechanic'),hp=arena.querySelector('.enemy-hp-bar-container');
            // Keep existing flow/anchors (and thus the Fighter) unchanged; move only monster HUD/art.
            const nameHeight=name.offsetHeight,bossHeight=boss?.textContent.trim()?boss.offsetHeight:0;
            set('--monster-name-height',`${nameHeight}px`);
            set('--monster-hud-space',`${nameHeight+7+(bossHeight?bossHeight+10:0)}px`);
            const hudBottom=a.top+6+nameHeight+(bossHeight?7+bossHeight:0);
            const actor=arena.querySelector('.fighter-2d-actor'),pose=arena.querySelector('.fighter-2d-pose');
            const actorHeight=actor&&!actor.closest('[hidden]')?actor.getBoundingClientRect().height:
                Math.min(wrapper.height*.96,a.height*.70,a.width*.68)*1.28;
            const playerAlpha=pose?.naturalWidth?alphaBounds(pose):{height:.9,left:0,width:1};
            const poseScale=pose?parseFloat(pose.style.height)/100||1:1;
            const playerHeight=actorHeight*poseScale*playerAlpha.height;
            const playerAspect=pose?.naturalWidth?pose.naturalWidth/pose.naturalHeight:683/1024;
            const poseLeft=pose?parseFloat(pose.style.left)/100||0:.5-205/1024;
            const playerRight=actor?actor.getBoundingClientRect().left+actorHeight*(poseLeft+
                poseScale*playerAspect*(playerAlpha.left+playerAlpha.width)):a.left+a.width*.35;
            const left=Math.max(a.left+a.width*.37,playerRight+12),right=a.right-8;
            const top=hudBottom+12,ground=a.bottom-6-hp.offsetHeight-12;
            const lift=v.airborne?Math.min(wrapper.height*v.lift,Math.max(0,(ground-top)*.08)):0;
            const size=fitSize({playerHeight,heightRatio:v.heightRatio,availableWidth:Math.max(1,right-left),
                availableHeight:Math.max(1,ground-lift-top),naturalWidth:image.naturalWidth,naturalHeight:image.naturalHeight,alpha:b});
            set('--monster-render-width',`${size.width.toFixed(2)}px`);set('--monster-render-height',`${size.height.toFixed(2)}px`);
            // Transforms for hits/death stay on the img; static placement stays on its parent.
            const before=image.getBoundingClientRect(),center=(left+right)/2;
            shiftX+=center+v.offsetX-(before.left+before.width*(b.left+b.width/2));
            shiftY+=ground+v.offsetY-lift-(before.top+before.height*b.bottom);
            lighting.style.transform=`translate(${shiftX.toFixed(2)}px,${shiftY.toFixed(2)}px)`;
            const rect=image.getBoundingClientRect(),visualRect=visual.getBoundingClientRect();
            set('--monster-shadow-x',`${(center-visualRect.left).toFixed(2)}px`);
            set('--monster-shadow-y',`${(ground-visualRect.top-2).toFixed(2)}px`);
            const shadowWidth=Math.min(right-left,rect.width*b.width*v.shadowWidth);
            set('--monster-shadow-width',`${shadowWidth.toFixed(2)}px`);
            set('--monster-shadow-height',`${Math.max(6,Math.min(17,shadowWidth*.11)).toFixed(2)}px`);
            measurements={drop,shadowWidth,bottom:b.bottom,paintedWidth:b.width,paintedHeight:b.height,left:b.left,lift,asset:config.asset,sampled:b.sampled,
                measuredHeight:rect.height,measuredWidth:rect.width,wrapperBottom:wrapper.bottom-a.top,translation:lighting.style.transform,
                playerHeight,heightRatio:v.heightRatio,actualRatio:size.paintedHeight/playerHeight,desiredHeight:size.desiredHeight,
                ground:ground-a.top,hudBottom:hudBottom-a.top,availableWidth:right-left,availableHeight:ground-lift-top,
                renderedBottom:rect.top+rect.height*b.bottom-a.top};
        }
        function requestMeasure(){
            if(queued||destroyed||!active)return;queued=true;
            requestAnimationFrame(()=>{queued=false;try{measure();}catch(error){suspend();console.warn('[Battle look] Efek dinonaktifkan.',error.message);}});
        }
        function suspend(){active=false;target=null;delete panel.dataset.battleLook;delete panel.dataset.battleArea;}
        const observer=new ResizeObserver(requestMeasure);observer.observe(arena);observer.observe(panel);observer.observe(arena.querySelector('#enemy-panel'));observer.observe(image);observer.observe(visual);observer.observe(lighting);
        panel.addEventListener('scroll',requestMeasure,{passive:true});
        arena.querySelector('#enemy-panel').addEventListener('animationend',requestMeasure);
        image.addEventListener('load',requestMeasure);image.addEventListener('error',requestMeasure);
        return {
            sync(snapshot){
                if(destroyed)return;
                if(!snapshot.active||!snapshot.target||document.hidden){suspend();return;}
                const changed=!active||target!==snapshot.target;active=true;
                if(!changed)return;
                panel.dataset.battleLook='on';
                target=snapshot.target;config=resolve(target);panel.dataset.battleArea=config.stage;
                const {area,visual:v}=config;
                set('--arena-ambient',area.ambient);set('--arena-rim',area.rim);set('--arena-fog',area.fog);set('--arena-warm',area.warm);
                set('--actor-brightness',area.brightness);set('--actor-saturation',area.saturation);set('--actor-contrast',area.contrast);
                set('--monster-brightness',(area.brightness*v.brightness).toFixed(3));
                set('--monster-saturation',(area.saturation*v.saturation).toFixed(3));
                set('--monster-contrast',(area.contrast*v.contrast).toFixed(3));
                set('--monster-scale',v.scale);set('--monster-shadow-opacity',v.embeddedBase?0:v.shadowOpacity);
                visual.dataset.airborne=String(v.airborne);visual.dataset.embeddedBase=String(v.embeddedBase);
                requestMeasure();
            },suspend,
            destroy(){if(destroyed)return;suspend();destroyed=true;observer.disconnect();panel.removeEventListener('scroll',requestMeasure);arena.querySelector('#enemy-panel').removeEventListener('animationend',requestMeasure);image.removeEventListener('load',requestMeasure);image.removeEventListener('error',requestMeasure);},
            get diagnostics(){return {active,stage:config?.stage,asset:config?.asset,visual:config?.visual,measurements,cacheSize:bounds.size};}
        };
    }
    root.GameBattleLook={areas,monsters,defaults,resolve,fitSize,create};
})(typeof window==='undefined'?globalThis:window);
