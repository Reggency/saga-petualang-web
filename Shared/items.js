(function(root) {
    const items = [
    { name: "Esensi Universal", type: "Material", icon: "fa-gem", class: "c-soul", category: "Material Drop", rarity: "rare", description: "Hasil konversi satu arah drop monster untuk menempa dan memperkuat peralatan universal. Tidak memiliki nilai jual.", sellPrice: 0 },
    { name: "Lendir Slime", type: "Material", icon: "fa-droplet", class: "c-slime", category: "Material Drop", rarity: "common", description: "Lendir basah dari slime, cocok untuk ramuan dasar.", sellPrice: 1 },
    { name: "Sayap Kelelawar", type: "Material", icon: "fa-feather", class: "c-bat", category: "Material Drop", rarity: "common", description: "Sayap tipis yang sering jatuh dari kelelawar malam.", sellPrice: 2 },
    { name: "Sutra Laba-Laba", type: "Material", icon: "fa-spider", class: "c-spider", category: "Material Drop", rarity: "common", description: "Sutra kuat yang digunakan untuk membuat jaring dan kain ringan.", sellPrice: 2 },
    { name: "Akar Beracun", type: "Material", icon: "fa-seedling", class: "c-poison", category: "Material Drop", rarity: "common", description: "Akar beracun yang bisa dituangkan ke dalam panah atau ramuan.", sellPrice: 3 },
    { name: "Telinga Goblin", type: "Material", icon: "fa-ear-deaf", class: "c-goblin", category: "Material Drop", rarity: "common", description: "Bagian tubuh goblin yang dapat diperiksa untuk ramuan khusus.", sellPrice: 2 },
    { name: "Belati Berkarat", type: "Equipment", icon: "fa-dagger", class: "c-rust", category: "Equipment", rarity: "common", description: "Belati kecil berkarat yang sering dijatuhkan goblin, cocok untuk pedagang atau crafting dasar.", sellPrice: 5 },
    { name: "Taring Kecil", type: "Material", icon: "fa-tooth", class: "c-bone", category: "Material Drop", rarity: "common", description: "Taring kecil dari kelelawar, cocok untuk ramuan dan kerajinan.", sellPrice: 1 },
    { name: "Inti Air Kusam", type: "Material", icon: "fa-droplet", class: "c-aqua", category: "Material Drop", rarity: "rare", description: "Inti air gelap yang tersisa dari slime, berisi energi cair pekat.", sellPrice: 15 },
    { name: "Kantung Racun", type: "Material", icon: "fa-skull-crossbones", class: "c-poison", category: "Material Drop", rarity: "rare", description: "Kantung racun aktif dari laba-laba, berguna untuk racun dan senjata.", sellPrice: 20 },
    { name: "Benih Pemakan Daging", type: "Material", icon: "fa-seedling", class: "c-plant", category: "Material Drop", rarity: "rare", description: "Benih dari flora karnivora, bahan kuat untuk ramuan pelindung.", sellPrice: 18 },
    { name: "Inti Slime Raja", type: "Material", icon: "fa-gem", class: "c-slime", category: "Material Drop", rarity: "epic", description: "Inti pelindung dari raja slime, sangat berharga untuk crafting.", sellPrice: 100 },
    { name: "Mahkota Lendir", type: "Material", icon: "fa-crown", class: "c-slime", category: "Material Drop", rarity: "rare", description: "Mahkota lendir dari raja slime, bahan langka untuk item khusus.", sellPrice: 50 },
    { name: "Cakar Tajam", type: "Material", icon: "fa-paw", class: "c-claw", category: "Material Drop", rarity: "rare", description: "Cakar serigala yang tajam untuk crafting dan ramuan kekuatan.", sellPrice: 25 },
    { name: "Tengkorak Orc", type: "Material", icon: "fa-skull", class: "c-bone", category: "Material Drop", rarity: "rare", description: "Tengkorak orc yang kuat, baik untuk ramuan gelap dan dekorasi sakral.", sellPrice: 30 },
    { name: "Karapas Keras", type: "Material", icon: "fa-shield", class: "c-shell", category: "Material Drop", rarity: "rare", description: "Karapas kalajengking yang keras, cocok untuk perlindungan dan armor.", sellPrice: 40 },
    { name: "Jantung Orc", type: "Material", icon: "fa-heart", class: "c-organ", category: "Material Drop", rarity: "rare", description: "Jantung orc yang berdetak, bahan hidup untuk ramuan berani.", sellPrice: 60 },
    { name: "Taring Panglima", type: "Material", icon: "fa-tooth", class: "c-bone", category: "Material Drop", rarity: "rare", description: "Taring kuat dari panglima orc, bagus untuk ramuan atau kerajinan armor khusus.", sellPrice: 55 },
    { name: "Jimat Kutukan", type: "Material", icon: "fa-hamsa", class: "c-mystic", category: "Material Drop", rarity: "epic", description: "Jimat berenergi kutukan yang bisa meningkatkan sihir gelap.", sellPrice: 120 },
    { name: "Mata Ruby", type: "Material", icon: "fa-gem", class: "c-gem", category: "Material Drop", rarity: "rare", description: "Mata ruby berkilau, bahan permata untuk aksesori magis.", sellPrice: 80 },
    { name: "Pedang Jiwa Patah", type: "Equipment", icon: "fa-sword", class: "c-shard", category: "Equipment", rarity: "rare", description: "Pedang patah yang memancarkan jiwa, cocok untuk crafting atau dijual.", sellPrice: 70 },
    { name: "Mahkota Tulang", type: "Material", icon: "fa-crown", class: "c-bone", category: "Material Drop", rarity: "rare", description: "Mahkota tulang dari lich, bernilai untuk ritual dan ramuan.", sellPrice: 90 },
    { name: "Debu Jiwa Kuno", type: "Material", icon: "fa-wind", class: "c-soul", category: "Material Drop", rarity: "rare", description: "Debu jiwa tua, sangat cocok untuk sihir dan craft kuno.", sellPrice: 110 },
    { name: "Tanduk Es", type: "Material", icon: "fa-bone", class: "c-ice", category: "Material Drop", rarity: "rare", description: "Tanduk es langka dari yeti, dipakai untuk ramuan dingin.", sellPrice: 85 },
    { name: "Tongkat Beku", type: "Equipment", icon: "fa-wand-sparkles", class: "c-ice", category: "Equipment", rarity: "rare", description: "Tongkat magis berlapis es, cocok untuk caster dingin.", sellPrice: 150 },
    { name: "Jubah Transparan", type: "Equipment", icon: "fa-mask", class: "c-ghost", category: "Equipment", rarity: "epic", description: "Jubah hantu yang melindungi dan menyamarkan pemakainya.", sellPrice: 250 },
    { name: "Jantung Es Abadi", type: "Material", icon: "fa-heart", class: "c-ice", category: "Material Drop", rarity: "epic", description: "Jantung es abadi yang berdenyut, sumber energi dingin kuat.", sellPrice: 300 },
    { name: "Kristal Frostbite", type: "Material", icon: "fa-gem", class: "c-ice", category: "Material Drop", rarity: "epic", description: "Kristal beku yang dipenuhi es magis.", sellPrice: 280 },
    { name: "Tanduk Iblis Api", type: "Material", icon: "fa-fire", class: "c-demon", category: "Material Drop", rarity: "rare", description: "Tanduk demon berapi, baik untuk senjata berapi atau ramuan pembakaran.", sellPrice: 150 },
    { name: "Inti Magma", type: "Material", icon: "fa-fire", class: "c-magma", category: "Material Drop", rarity: "epic", description: "Inti magma pekat untuk craft tingkat tinggi.", sellPrice: 400 },
    { name: "Sisik Naga Merah", type: "Material", icon: "fa-dragon", class: "c-dragon", category: "Material Drop", rarity: "rare", description: "Sisik naga merah yang kuat untuk armor dan item api.", sellPrice: 200 },
    { name: "Mata Naga", type: "Material", icon: "fa-eye", class: "c-gem", category: "Material Drop", rarity: "epic", description: "Mata naga berkilau, digunakan untuk ritual magis dan crafting.", sellPrice: 500 },
    { name: "Esensi Gelap", type: "Material", icon: "fa-ghost", class: "c-dark", category: "Material Drop", rarity: "epic", description: "Esensi kegelapan yang pekat dari abyssal void.", sellPrice: 450 },
    { name: "Cakar Kosmik", type: "Material", icon: "fa-claw-marks", class: "c-cosmic", category: "Material Drop", rarity: "epic", description: "Cakar makhluk void, bahan langka untuk item bintang.", sellPrice: 480 },
    { name: "Pecahan Bintang", type: "Material", icon: "fa-star", class: "c-star", category: "Material Drop", rarity: "rare", description: "Pecahan bintang yang bersinar, baik untuk craft astral.", sellPrice: 220 },
    { name: "Baja Hitam", type: "Material", icon: "fa-gem", class: "c-metal", category: "Material Drop", rarity: "rare", description: "Baja hitam kuat dari abadi, digunakan untuk item elit.", sellPrice: 250 },
    { name: "Inti Kekosongan", type: "Material", icon: "fa-circle-nodes", class: "c-dark", category: "Material Drop", rarity: "legendary", description: "Inti kekosongan kosmik, sangat langka dan kuat.", sellPrice: 1500 },
    { name: "Mahkota Bayangan", type: "Equipment", icon: "fa-crown", class: "c-dark", category: "Equipment", rarity: "legendary", description: "Mahkota bayangan yang memberi aura gelap bagi pemakainya.", sellPrice: 2000 },
    { name: "Kulit Serigala", type: "Material", icon: "fa-scroll", class: "c-wolf", category: "Material Drop", rarity: "common", description: "Kulit serigala tebal untuk peralatan berdaya tahan.", sellPrice: 4 },
    { name: "Bijih Besi", type: "Material", icon: "fa-cube", class: "c-iron", category: "Material Drop", rarity: "rare", description: "Potongan besi kasar yang bisa dilebur menjadi bahan senjata.", sellPrice: 10 },
    { name: "Sengat Kristal", type: "Material", icon: "fa-bolt", class: "c-sting", category: "Material Drop", rarity: "rare", description: "Sengat kristal murni untuk ramuan berenergi.", sellPrice: 35 },
    { name: "Kain Kafan Kuno", type: "Material", icon: "fa-scroll", class: "c-shroud", category: "Material Drop", rarity: "rare", description: "Kain kuno yang sering ditemukan di reruntuhan mumi.", sellPrice: 45 },
    { name: "Pecahan Granit", type: "Material", icon: "fa-gem", class: "c-granite", category: "Material Drop", rarity: "rare", description: "Batu pecah yang kuat untuk upgrade armor.", sellPrice: 50 },
    { name: "Serpihan Zirah Kuno", type: "Material", icon: "fa-shield-halved", class: "c-armor-shard", category: "Material Drop", rarity: "epic", description: "Potongan zirah dari prajurit kuno, sangat berharga.", sellPrice: 180 },
    { name: "Bulu Yeti Tebal", type: "Material", icon: "fa-paw", class: "c-yeti", category: "Material Drop", rarity: "common", description: "Bulu tak terduga dari hewan dingin untuk pakaian hangat.", sellPrice: 8 },
    { name: "Pecahan Es Abadi", type: "Material", icon: "fa-snowflake", class: "c-ice", category: "Material Drop", rarity: "rare", description: "Es yang tak mencair sejak berabad-abad, sempurna untuk magi.", sellPrice: 120 },
    { name: "Esensi Jiwa", type: "Material", icon: "fa-ghost", class: "c-soul", category: "Material Drop", rarity: "epic", description: "Intisari jiwa yang rapuh namun sangat kuat.", sellPrice: 220 },
    { name: "Batu Bara Neraka", type: "Material", icon: "fa-fire", class: "c-coal", category: "Material Drop", rarity: "rare", description: "Batu bara yang terbakar dengan panas neraka.", sellPrice: 100 },
    { name: "Batu Obsidian", type: "Material", icon: "fa-gem", class: "c-obsidian", category: "Material Drop", rarity: "epic", description: "Obsidian gelap yang tajam untuk senjata legendaris.", sellPrice: 350 },
    { name: "Inti Api Naga", type: "Material", icon: "fa-fire-dragon", class: "c-dragon", category: "Material Drop", rarity: "legendary", description: "Sumber energi naga yang sangat langka.", sellPrice: 1200 },
    { name: "Copper Ore", type: "Ore", icon: "fa-cube", class: "c-copper", category: "Mining", rarity: "common", description: "Bijih tembaga yang mudah dilebur untuk alat ringan.", sellPrice: 2 },
    { name: "Iron Ore", type: "Ore", icon: "fa-cube", class: "c-iron-ore", category: "Mining", rarity: "common", description: "Bijih besi dasar untuk senjata dan armor.", sellPrice: 4 },
    { name: "Silver Ore", type: "Ore", icon: "fa-cube", class: "c-silver", category: "Mining", rarity: "rare", description: "Bijih perak yang baik untuk aksesori dan sihir.", sellPrice: 10 },
    { name: "Gold Ore", type: "Ore", icon: "fa-cube", class: "c-gold-ore", category: "Mining", rarity: "rare", description: "Bijih emas yang berkilau untuk peralatan premium.", sellPrice: 20 },
    { name: "Titanium Ore", type: "Ore", icon: "fa-cube", class: "c-titanium", category: "Mining", rarity: "epic", description: "Bijih titanium yang tahan lama dan ringan.", sellPrice: 50 },
    { name: "Mithril Ore", type: "Ore", icon: "fa-gem", class: "c-mithril", category: "Mining", rarity: "legendary", description: "Bijih mithril yang sangat kuat untuk gear terbaik.", sellPrice: 150 },
    { name: "Iron Ingot", type: "Ingot", icon: "fa-cube", class: "c-metal", category: "Ingot", rarity: "common", description: "Ingot besi yang siap digunakan untuk kerajinan.", sellPrice: 8 },
    { name: "Copper Ingot", type: "Ingot", icon: "fa-cube", class: "c-copper", category: "Ingot", rarity: "common", description: "Ingot tembaga untuk peralatan dasar.", sellPrice: 5 },
    { name: "Silver Ingot", type: "Ingot", icon: "fa-cube", class: "c-silver", category: "Ingot", rarity: "rare", description: "Ingot perak untuk aksesori sihir.", sellPrice: 25 },
    { name: "Gold Ingot", type: "Ingot", icon: "fa-cube", class: "c-gold-ore", category: "Ingot", rarity: "rare", description: "Ingot emas yang berharga untuk peralatan mewah.", sellPrice: 50 },
    { name: "Titanium Ingot", type: "Ingot", icon: "fa-cube", class: "c-titanium", category: "Ingot", rarity: "epic", description: "Ingot titanium yang ringan dan kuat untuk gear tinggi.", sellPrice: 120 },
    { name: "Mithril Ingot", type: "Ingot", icon: "fa-gem", class: "c-mithril", category: "Ingot", rarity: "legendary", description: "Ingot mithril sangat kuat untuk equipment terbaik.", sellPrice: 350 },
    { name: "Obsidian Ingot", type: "Ingot", icon: "fa-gem", class: "c-obsidian", category: "Ingot", rarity: "epic", description: "Ingot obsidian yang sangat kuat untuk crafting legendaris.", sellPrice: 250 },
    { name: "Kayu Balsa", type: "Wood", icon: "fa-tree", class: "c-balsa", category: "Wood", rarity: "common", description: "Kayu ringan yang mudah dibentuk.", sellPrice: 1 },
    { name: "Kayu Pinus", type: "Wood", icon: "fa-tree", class: "c-pinus", category: "Wood", rarity: "common", description: "Kayu pinus yang fleksibel untuk peralatan ringkas.", sellPrice: 2 },
    { name: "Kayu Ek / Oak", type: "Wood", icon: "fa-tree", class: "c-oak", category: "Wood", rarity: "common", description: "Kayu oak kuat untuk peralatan dasar.", sellPrice: 4 },
    { name: "Kayu Besi / Ironwood", type: "Wood", icon: "fa-tree", class: "c-ironwood", category: "Wood", rarity: "rare", description: "Kayu keras seperti besi untuk perlindungan lebih.", sellPrice: 15 },
    { name: "Kayu Mahoni", type: "Wood", icon: "fa-tree", class: "c-mahoni", category: "Wood", rarity: "rare", description: "Kayu mahoni elegan untuk senjata dan tongkat.", sellPrice: 25 },
    { name: "Kayu Purba / Elderwood", type: "Wood", icon: "fa-tree-burned", class: "c-elderwood", category: "Wood", rarity: "epic", description: "Kayu purba penuh energi magis.", sellPrice: 80 },
    { name: "Pedang Tua", type: "Equipment", icon: "fa-sword", class: "c-iron", category: "Equipment", rarity: "common", description: "Pedang usang yang cocok untuk pemula.", sellPrice: 10 },
    { name: "Robe Penyihir", type: "Equipment", icon: "fa-robes", class: "c-shroud", category: "Equipment", rarity: "rare", description: "Robe sihir ringan yang meningkatkan magis.", sellPrice: 50 },
    { name: "Panah Dasar", type: "Equipment", icon: "fa-arrow-up-right-dots", class: "c-copper", category: "Equipment", rarity: "common", description: "Panah biasa untuk pemburu pemula.", sellPrice: 10 },
    { name: "Belati Bayangan", type: "Equipment", icon: "fa-dagger", class: "c-poison", category: "Equipment", rarity: "rare", description: "Belati tajam dari assassin bayangan.", sellPrice: 60 },
    { name: "Pelindung Orichalcum", type: "Equipment", icon: "fa-shield-halved", class: "c-armor-shard", category: "Equipment", rarity: "epic", description: "Pelindung langka dengan kekuatan magis.", sellPrice: 200 }
];
    const aliases = {"mat_lendir_slime": "Lendir Slime", "mat_sayap_kelelawar": "Sayap Kelelawar", "mat_sutra_labalaba": "Sutra Laba-Laba", "mat_akar_beracun": "Akar Beracun", "mat_telinga_goblin": "Telinga Goblin", "mat_kulit_serigala": "Kulit Serigala", "mat_bijih_besi": "Bijih Besi", "mat_sengat_kristal": "Sengat Kristal", "mat_kain_kafan": "Kain Kafan Kuno", "mat_pecahan_granit": "Pecahan Granit", "mat_serpihan_zirah": "Serpihan Zirah Kuno", "mat_bulu_yeti": "Bulu Yeti Tebal", "mat_es_abadi": "Pecahan Es Abadi", "mat_esensi_jiwa": "Esensi Jiwa", "mat_batubara_neraka": "Batu Bara Neraka", "mat_batu_obsidian": "Batu Obsidian", "mat_inti_api_naga": "Inti Api Naga"};
    // Repository-relative image paths, e.g. assets/weapons/<real-file>.png.
    // No artwork is assigned until the actual item asset is available.
    for (const item of items) item.image ??= null;
    const byName = Object.fromEntries(items.map(item => [item.name, item]));
    const projectRoot = root.document?.currentScript?.src ? new URL('../', root.document.currentScript.src).href : null;
    function visual(value) {
        const item = typeof value === 'string' ? { name: value } : value || {};
        const name = item.baseName || item.name;
        const assets = root.GameItemAssets || (typeof module !== 'undefined' && module.exports ? require('./item-assets.js') : null);
        const assetInfo = assets?.getItemAssetInfo(value);
        const data = typeof module !== 'undefined' && module.exports ? require('../Crafting/recipes.js') : root.CraftingData;
        const recipe = assetInfo?.recipe || data?.recipes.find(r => r.id === item.recipeId || r.name === name);
        const meta = byName[aliases[name] || name];
        const slot = recipe?.slot || item.slot || assetInfo?.slot;
        const job = recipe?.job || item.job || assetInfo?.job;
        const icons = { senjata: job === 'mage' ? 'fa-wand-magic-sparkles' : job === 'archer' ? 'fa-bullseye' : 'fa-khanda',
            zirah: 'fa-shirt', helm: 'fa-helmet-safety', sepatu: 'fa-shoe-prints',
            amulet: 'fa-gem', sarung_tangan: 'fa-hand', offhand: 'fa-shield-halved',
            katalis: 'fa-book-open' };
        const path = recipe?.image || meta?.image || item.image;
        // Local project assets only. Never interpret save/catalog strings as HTML.
        const image = typeof path === 'string' && !path.includes('..') && !/^(?:[\\/]|[a-z]+:)/i.test(path) &&
            /^[\w /.-]+\.(?:png|jpg|webp|svg)$/i.test(path) ? path : null;
        const rarity = item.rarity || recipe?.rarity || meta?.rarity || item.rarityClass?.replace(/^rarity-/, '') || 'common';
        const candidates = assets?.getItemImageCandidates(value) || (image ? [image] : []);
        const categoryIcon = assetInfo?.category.startsWith('potions/') ? 'fa-flask'
            : assetInfo?.category === 'tools/pickaxes' ? 'fa-hammer' : assetInfo?.category === 'tools/axes' ? 'fa-tree' : 'fa-box';
        const proposedIcon = icons[slot] || meta?.icon || assetInfo?.item?.icon || categoryIcon;
        // These six legacy catalog classes are absent from the bundled FA Free font.
        const icon = ({ 'fa-dagger': 'fa-khanda', 'fa-sword': 'fa-khanda', 'fa-claw-marks': 'fa-paw',
            'fa-fire-dragon': 'fa-fire', 'fa-tree-burned': 'fa-tree', 'fa-robes': 'fa-shirt' })[proposedIcon] || proposedIcon;
        return { image: candidates[0] || null, candidates, icon,
            rarity: ['common', 'uncommon', 'rare', 'epic', 'legendary'].includes(rarity) ? rarity : 'common' };
    }
    function createVisual(item) {
        const info = visual(item);
        const wrapper = root.document.createElement('span');
        wrapper.className = 'item-art';
        wrapper.dataset.rarity = info.rarity;
        wrapper.setAttribute('aria-hidden', 'true');
        const icon = root.document.createElement('i');
        icon.className = `fa-solid ${info.icon}`;
        wrapper.append(icon);
        if (root.GameItemAssets) root.GameItemAssets.loadVisual(wrapper, icon, item);
        else if (info.image && projectRoot) {
            const img = root.document.createElement('img');
            img.alt = '';
            img.decoding = 'async';
            img.onload = () => { icon.hidden = true; };
            img.onerror = () => { img.remove(); icon.hidden = false; };
            img.src = new URL(info.image, projectRoot).href;
            wrapper.append(img);
        }
        return wrapper;
    }
    const api = { items, aliases, visual, createVisual, get(name) { return byName[name] || { name, category: 'Unknown', icon: 'fa-box' }; } };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    else root.GameItemCatalog = api;
})(typeof window === 'undefined' ? globalThis : window);
