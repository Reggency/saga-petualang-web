// Player guide only: does not write saves, award resources or start combat.
(function () {
    'use strict';
    const pages=[
        {title:'Langkah pertama sebagai Warga',intro:'Mulai dari petualang biasa, lalu tentukan jalanmu sendiri.',tips:[
            'Karakter baru dimulai sebagai Warga level 1, dengan Pisau Kecil sebagai senjata awal.',
            'Warga belum memiliki skill Fighter, Mage, Archer, atau Assassin. Kumpulkan EXP lewat pertarungan untuk mencapai level 5.',
            'Ada 4 slot karakter. Nama, inventory, equipment, dan progres setiap slot disimpan terpisah.'
        ]},
        {title:'Pilih class mulai level 5',intro:'Empat jalan petualangan tersedia ketika Warga mencapai level 5.',tips:[
            'Fighter: petarung fisik dengan pertahanan awal lebih kuat. Skill awal: Pukulan Keras.',
            'Mage: mengandalkan serangan sihir dan Mana. Skill awal: Bola Api.',
            'Archer: penyerang dengan busur dan panah. Skill awal: Panah Ganda.',
            'Assassin: petarung belati yang cepat. Skill awal: Tusukan Belakang.',
            'Saat muncul pemberitahuan class terbuka, pilih “Pilih Kelas”. Kamu juga dapat kembali ke Kedai, membuka Ganti Karakter, lalu memilih class untuk slot Warga tersebut.'
        ]},
        {title:'Mulai Battle dan jaga persediaan',intro:'Berangkat dari Kedai lewat Mulai Petualangan, lalu pilih area yang tersedia.',tips:[
            'Gunakan Auto untuk menjalankan serangan secara otomatis. Skill memakai Mana dan memiliki cooldown.',
            'Potion HP memulihkan 50% Max HP; Potion Mana memulihkan 50% Max Mana, sampai batas maksimal.',
            'Pengaturan Potion menentukan ambang HP untuk Auto Potion. Periksa stok sebelum berangkat.',
            'Saat Auto aktif, tombol potion manual dinonaktifkan. Jika HP habis, karakter kembali ke Kedai lewat sistem pemulihan game.'
        ]},
        {title:'Menu selama petualangan',intro:'Siapkan keperluanmu di Kedai sebelum menghadapi monster.',tips:[
            'Selama petualangan, menu persiapan tampak redup dan terkunci. Kalahkan musuh, lalu gunakan tombol kembali untuk pulang ke Kedai.',
            'Tombol Inventory tetap bisa ditekan untuk membuka kotak isi tas. Tekan lagi, tombol ×, atau Escape untuk menutupnya; Auto Battle tetap berjalan.',
            'Inventory lengkap, Toko, Tempa, Alchemy, Skill, Kedai, Gathering, dan Ganti Karakter dapat digunakan setelah kembali ke Kedai.',
            'Toko untuk belanja; Tempa untuk crafting equipment; Alchemy untuk meracik potion; Gathering menyediakan Mining dan Chopping.'
        ]},
        {title:'Level, atribut, dan skill',intro:'Kekuatan karakter tumbuh dari level, atribut, equipment, dan skill.',tips:[
            'Setiap naik level memberikan 3 Poin Atribut dan menambah 1 DEF dasar. Atur atribut lewat panel Atribut & Peralatan.',
            'Tambahan 1 Poin Skill diberikan setiap kelipatan 5 level, dari level 5 sampai 100. Periksa menu Skill di Kedai.',
            'ATK mendukung serangan fisik, Magic Damage mendukung sihir, DEF mengurangi serangan fisik, dan Dodge membantu menghindar.',
            'Attack Speed memengaruhi jeda serangan serta peluang Double/Triple Strike. Serangan ganda merupakan bagian dari sistem pertarungan.',
            'Equipment memberi bonus stat. Periksa jalur perkembangan class dan syarat skill pada menu Skill sebelum memakai poin.'
        ]},
        {title:'Loot dan tujuan petualangan',intro:'Target awalmu: jelajahi Forest, kumpulkan persediaan, lalu pilih class di level 5.',tips:[
            'Monster memberi EXP dan Gold saat dikalahkan. Item drop mengikuti peluang masing-masing monster; tidak selalu keluar setiap kemenangan.',
            'Periksa tab Item pada Log Petualangan untuk melihat barang yang didapat, lalu gunakan material untuk kebutuhan crafting atau Alchemy.',
            'Area game meliputi Forest, Cave, Ruins, Frost Tundra, Lava Lair, dan Abyssal Void. Perhatikan level serta persyaratan area sebelum masuk.',
            'Boss lebih besar dan memiliki mekanik khusus. Siapkan equipment, potion, dan skill sebelum menghadapinya.',
            'Progres tersimpan pada browser dan akun yang digunakan. Memilih slot lain tidak memindahkan barang dari slot sebelumnya.'
        ]}
    ];
    const dialog=document.createElement('dialog');dialog.id='hero-guide';dialog.className='hero-guide';
    dialog.setAttribute('aria-labelledby','hero-guide-title');
    dialog.innerHTML='<header><div><p class="guide-kicker">BUKU PANDUAN PETUALANG</p><h2 id="hero-guide-title"></h2></div><button type="button" data-guide="close" aria-label="Kembali ke pemilihan karakter">×</button></header><div class="guide-progress" aria-hidden="true"><span></span></div><div class="guide-content"><p id="guide-welcome"></p><p id="guide-count" role="status"></p><h3 id="guide-heading"></h3><p id="guide-intro"></p><ul id="guide-tips"></ul></div><footer><button type="button" data-guide="prev">Sebelumnya</button><button type="button" data-guide="next">Berikutnya</button><button type="button" data-guide="start">Mulai Bermain</button></footer>';
    document.body.append(dialog);
    let index=0;
    function render(){
        const page=pages[index];
        dialog.querySelector('#guide-count').textContent=`Langkah ${index+1} dari ${pages.length}`;
        dialog.querySelector('#guide-heading').textContent=page.title;
        dialog.querySelector('#guide-intro').textContent=page.intro;
        const list=dialog.querySelector('#guide-tips');list.replaceChildren();
        for(const text of page.tips){const item=document.createElement('li');item.textContent=text;list.append(item);}
        dialog.querySelector('.guide-progress span').style.width=`${(index+1)/pages.length*100}%`;
        dialog.querySelector('[data-guide="prev"]').disabled=index===0;
        dialog.querySelector('[data-guide="next"]').hidden=index===pages.length-1;
        dialog.querySelector('[data-guide="start"]').hidden=index!==pages.length-1;
        dialog.querySelector('.guide-content').scrollTop=0;
    }
    dialog.addEventListener('click',event=>{
        const action=event.target.closest('[data-guide]')?.dataset.guide;
        if(action==='close')dialog.close();
        if(action==='prev'&&index>0){index--;render();dialog.querySelector('[data-guide="prev"]').focus();}
        if(action==='next'&&index<pages.length-1){index++;render();dialog.querySelector(index===pages.length-1?'[data-guide="start"]':'[data-guide="next"]').focus();}
        if(action==='start'&&index===pages.length-1)window.location.href='../Utama/Index.html';
    });
    window.HeroGuide={open(name){
        const selected=JSON.parse(GameStorage.getItem('rpg_player')||'null');
        if(selected&&selected.heroClass!=='Warga'){window.location.href='../Utama/Index.html';return;}
        index=0;dialog.querySelector('#hero-guide-title').textContent='Kenali Saga Petualang';
        dialog.querySelector('#guide-welcome').textContent=`Selamat datang, ${name}. Berikut bekal sebelum memulai kisahmu.`;
        render();if(!dialog.open)dialog.showModal();dialog.querySelector('[data-guide="next"]').focus();
    }};
})();
