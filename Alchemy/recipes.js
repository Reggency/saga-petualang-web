(function (root) {
    'use strict';
    // Reuse the Shop IDs and the exact counters consumed by Battle.
    const potions = {
        hp: { id: 'hp', field: 'potions', name: 'Potion Penyembuh', effect: 'Memulihkan 50% Max HP', icon: 'fa-flask' },
        potion_mana: { id: 'potion_mana', field: 'manaPotions', name: 'Potion Mana', effect: 'Memulihkan 50% Max Mana', icon: 'fa-bottle-droplet' }
    };
    const recipes = [
        { id: 'slime_tonic', name: 'Tonik Lendir', stage: 'forest', minLevel: 1, potionId: 'hp', amount: 1, goldCost: 2, requirements: [{ name: 'Lendir Slime', amount: 4 }] },
        { id: 'water_distillate', name: 'Distilasi Inti Air', stage: 'forest', minLevel: 1, potionId: 'potion_mana', amount: 2, goldCost: 4, requirements: [{ name: 'Inti Air Kusam', amount: 1 }, { name: 'Lendir Slime', amount: 2 }] },
        { id: 'forest_mana', name: 'Infus Akar Hutan', stage: 'forest', minLevel: 5, potionId: 'potion_mana', amount: 1, goldCost: 3, requirements: [{ name: 'Akar Beracun', amount: 2 }, { name: 'Sayap Kelelawar', amount: 2 }] },
        { id: 'venom_tonic', name: 'Tonik Racun Ternetralkan', stage: 'forest', minLevel: 5, potionId: 'hp', amount: 2, goldCost: 3, requirements: [{ name: 'Kantung Racun', amount: 1 }, { name: 'Akar Beracun', amount: 2 }] },
        { id: 'slime_royal', name: 'Eliksir Raja Slime', stage: 'forest', minLevel: 9, potionId: 'hp', amount: 5, goldCost: 8, requirements: [{ name: 'Inti Slime Raja', amount: 1 }, { name: 'Mahkota Lendir', amount: 1 }] },
        { id: 'cave_tonic', name: 'Tonik Pemburu Gua', stage: 'cave', minLevel: 12, potionId: 'hp', amount: 3, goldCost: 5, requirements: [{ name: 'Telinga Goblin', amount: 3 }, { name: 'Cakar Tajam', amount: 1 }] },
        { id: 'crystal_mana', name: 'Distilasi Sengat Kristal', stage: 'cave', minLevel: 18, potionId: 'potion_mana', amount: 3, goldCost: 6, requirements: [{ name: 'Tengkorak Orc', amount: 1 }, { name: 'Sengat Kristal', amount: 2 }] },
        { id: 'orc_royal', name: 'Eliksir Panglima Orc', stage: 'cave', minLevel: 24, potionId: 'hp', amount: 8, goldCost: 12, requirements: [{ name: 'Jantung Orc', amount: 1 }, { name: 'Taring Panglima', amount: 1 }] },
        { id: 'ruby_infusion', name: 'Infus Ruby Kuno', stage: 'ruins', minLevel: 40, potionId: 'potion_mana', amount: 8, goldCost: 12, requirements: [{ name: 'Mata Ruby', amount: 1 }, { name: 'Debu Jiwa Kuno', amount: 1 }] },
        { id: 'lich_royal', name: 'Eliksir Raja Lich', stage: 'ruins', minLevel: 40, potionId: 'potion_mana', amount: 10, goldCost: 15, requirements: [{ name: 'Mahkota Tulang', amount: 1 }, { name: 'Jimat Kutukan', amount: 1 }] },
        { id: 'frost_mana', name: 'Infus Jiwa Beku', stage: 'frost-tundra', minLevel: 55, potionId: 'potion_mana', amount: 6, goldCost: 10, requirements: [{ name: 'Pecahan Es Abadi', amount: 2 }, { name: 'Esensi Jiwa', amount: 1 }] },
        { id: 'titan_royal', name: 'Eliksir Titan Es', stage: 'frost-tundra', minLevel: 65, potionId: 'hp', amount: 12, goldCost: 20, requirements: [{ name: 'Jantung Es Abadi', amount: 1 }, { name: 'Kristal Frostbite', amount: 2 }] },
        { id: 'dragon_eye', name: 'Distilasi Mata Naga', stage: 'lava-lair', minLevel: 99, potionId: 'potion_mana', amount: 15, goldCost: 25, requirements: [{ name: 'Mata Naga', amount: 1 }, { name: 'Inti Magma', amount: 1 }] },
        { id: 'dragon_royal', name: 'Eliksir Api Naga', stage: 'lava-lair', minLevel: 99, potionId: 'hp', amount: 20, goldCost: 30, requirements: [{ name: 'Inti Api Naga', amount: 1 }, { name: 'Sisik Naga Merah', amount: 2 }] },
        { id: 'void_mana', name: 'Infus Kosmik', stage: 'abyssal-void', minLevel: 110, potionId: 'potion_mana', amount: 10, goldCost: 20, requirements: [{ name: 'Esensi Gelap', amount: 2 }, { name: 'Cakar Kosmik', amount: 1 }] },
        { id: 'void_royal', name: 'Eliksir Kekosongan', stage: 'abyssal-void', minLevel: 150, potionId: 'potion_mana', amount: 25, goldCost: 40, requirements: [{ name: 'Inti Kekosongan', amount: 1 }, { name: 'Pecahan Bintang', amount: 2 }] }
    ];
    const stages = { forest: 'Hutan', cave: 'Gua', ruins: 'Reruntuhan', 'frost-tundra': 'Tundra Es', 'lava-lair': 'Sarang Lava', 'abyssal-void': 'Kekosongan' };
    const api = { potions, recipes, stages };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    else root.AlchemyData = api;
})(typeof window === 'undefined' ? globalThis : window);
