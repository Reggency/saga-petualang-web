(function (root) {
    'use strict';
    // IDs and recipe values are stable; add new recipes here.
    const recipes = [
        {"id":"fighter_1","image":"assets/weapons/pedang-slime-hijau.png","job":"fighter","group":"PANDAI BESI (PEDANG UTAMA)","name":"Pedang Slime Hijau","statType":"atk","statGain":6,"goldCost":0,"slot":"senjata","requirements":[{"name":"Lendir Slime","amount":5},{"name":"Akar Beracun","amount":2}]},
        {"id":"fighter_2","image":"assets/weapons/pedang-besi-orc.png","job":"fighter","group":"PANDAI BESI (PEDANG UTAMA)","name":"Pedang Besi Orc","statType":"atk","statGain":25,"goldCost":0,"slot":"senjata","requirements":[{"name":"Bijih Besi","amount":6},{"name":"Kulit Serigala","amount":3}]},
        {"id":"fighter_3","image":"assets/weapons/claymore-ksatria-kuno.png","job":"fighter","group":"PANDAI BESI (PEDANG UTAMA)","name":"Claymore Ksatria Kuno","statType":"atk","statGain":55,"goldCost":0,"slot":"senjata","requirements":[{"name":"Serpihan Zirah Kuno","amount":6},{"name":"Iron Ingot","amount":2}]},
        {"id":"fighter_4","image":"assets/weapons/greatsword-es-abadi.png","job":"fighter","group":"PANDAI BESI (PEDANG UTAMA)","name":"Greatsword Es Abadi","statType":"atk","statGain":95,"goldCost":0,"slot":"senjata","requirements":[{"name":"Pecahan Es Abadi","amount":5},{"name":"Silver Ingot","amount":3}]},
        {"id":"fighter_5","image":"assets/weapons/slayer-bara-neraka.png","job":"fighter","group":"PANDAI BESI (PEDANG UTAMA)","name":"Slayer Bara Neraka","statType":"atk","statGain":150,"goldCost":0,"slot":"senjata","requirements":[{"name":"Batu Bara Neraka","amount":6},{"name":"Gold Ingot","amount":4}]},
        {"id":"fighter_6","image":"assets/weapons/greatsword-api-naga.png","job":"fighter","group":"PANDAI BESI (PEDANG UTAMA)","name":"🌋 Greatsword Api Naga","statType":"atk","statGain":260,"goldCost":0,"slot":"senjata","requirements":[{"name":"Inti Api Naga","amount":3},{"name":"Mithril Ingot","amount":5}]},
        {"id":"fighter_7","job":"fighter","group":"PENEMPA PERISAI (TAMENG)","name":"Tameng Akar Beracun","statType":"def","statGain":4,"goldCost":0,"slot":"offhand","requirements":[{"name":"Akar Beracun","amount":5},{"name":"Kayu Balsa","amount":8}]},
        {"id":"fighter_8","job":"fighter","group":"PENEMPA PERISAI (TAMENG)","name":"Tameng Kristal Gua","statType":"def","statGain":18,"goldCost":0,"slot":"offhand","requirements":[{"name":"Sengat Kristal","amount":5},{"name":"Copper Ingot","amount":4}]},
        {"id":"fighter_9","job":"fighter","group":"PENEMPA PERISAI (TAMENG)","name":"Tameng Granit Raksasa","statType":"def","statGain":35,"goldCost":0,"slot":"offhand","requirements":[{"name":"Pecahan Granit","amount":6},{"name":"Iron Ingot","amount":3}]},
        {"id":"fighter_10","job":"fighter","group":"PENEMPA PERISAI (TAMENG)","name":"Bulwark Tundra Es","statType":"def","statGain":60,"goldCost":0,"slot":"offhand","requirements":[{"name":"Bulu Yeti Tebal","amount":5},{"name":"Silver Ingot","amount":4}]},
        {"id":"fighter_11","job":"fighter","group":"PENEMPA PERISAI (TAMENG)","name":"Aegis Lava Obsidian","statType":"def","statGain":95,"goldCost":0,"slot":"offhand","requirements":[{"name":"Batu Obsidian","amount":6},{"name":"Gold Ingot","amount":5}]},
        {"id":"fighter_12","job":"fighter","group":"PENEMPA PERISAI (TAMENG)","name":"🛡️ Perisai Cangkang Naga","statType":"def","statGain":160,"goldCost":0,"slot":"offhand","requirements":[{"name":"Inti Api Naga","amount":2},{"name":"Mithril Ingot","amount":4}]},
        {"id":"fighter_13","job":"fighter","group":"PELINDUNG KEPALA (HELM)","name":"Penutup Kepala Sutra","statType":"def","statGain":2,"goldCost":0,"slot":"helm","requirements":[{"name":"Sutra Laba-Laba","amount":5},{"name":"Lendir Slime","amount":3}]},
        {"id":"fighter_14","job":"fighter","group":"PELINDUNG KEPALA (HELM)","name":"Helm Kulit Serigala","statType":"def","statGain":10,"goldCost":0,"slot":"helm","requirements":[{"name":"Kulit Serigala","amount":5},{"name":"Telinga Goblin","amount":2}]},
        {"id":"fighter_15","job":"fighter","group":"PELINDUNG KEPALA (HELM)","name":"Visor Kafan Terkutuk","statType":"def","statGain":22,"goldCost":0,"slot":"helm","requirements":[{"name":"Kain Kafan Kuno","amount":5},{"name":"Serpihan Zirah Kuno","amount":3}]},
        {"id":"fighter_16","job":"fighter","group":"PELINDUNG KEPALA (HELM)","name":"Greathelm Bulu Yeti","statType":"def","statGain":40,"goldCost":0,"slot":"helm","requirements":[{"name":"Bulu Yeti Tebal","amount":5},{"name":"Pecahan Es Abadi","amount":2}]},
        {"id":"fighter_17","job":"fighter","group":"PELINDUNG KEPALA (HELM)","name":"Helm Kerak Obsidian","statType":"def","statGain":70,"goldCost":0,"slot":"helm","requirements":[{"name":"Batu Obsidian","amount":5},{"name":"Batu Bara Neraka","amount":3}]},
        {"id":"fighter_18","job":"fighter","group":"PELINDUNG KEPALA (HELM)","name":"👑 Helm Tanduk Naga","statType":"def","statGain":120,"goldCost":0,"slot":"helm","requirements":[{"name":"Inti Api Naga","amount":1},{"name":"Titanium Ingot","amount":3}]},
        {"id":"fighter_19","job":"fighter","group":"PENJAHIT ZIRAH (ARMOR)","name":"Zirah Sayap Malam","statType":"def","statGain":5,"goldCost":0,"slot":"zirah","requirements":[{"name":"Sayap Kelelawar","amount":6},{"name":"Sutra Laba-Laba","amount":4}]},
        {"id":"fighter_20","job":"fighter","group":"PENJAHIT ZIRAH (ARMOR)","name":"Zirah Pelat Orc","statType":"def","statGain":22,"goldCost":0,"slot":"zirah","requirements":[{"name":"Bijih Besi","amount":7},{"name":"Copper Ingot","amount":3}]},
        {"id":"fighter_21","job":"fighter","group":"PENJAHIT ZIRAH (ARMOR)","name":"Zirah Ksatria Tengkorak","statType":"def","statGain":45,"goldCost":0,"slot":"zirah","requirements":[{"name":"Serpihan Zirah Kuno","amount":6},{"name":"Iron Ingot","amount":4}]},
        {"id":"fighter_22","job":"fighter","group":"PENJAHIT ZIRAH (ARMOR)","name":"Zirah Karisma Wraith","statType":"def","statGain":75,"goldCost":0,"slot":"zirah","requirements":[{"name":"Esensi Jiwa","amount":5},{"name":"Kain Kafan Kuno","amount":3}]},
        {"id":"fighter_23","job":"fighter","group":"PENJAHIT ZIRAH (ARMOR)","name":"Zirah Kerak Magma","statType":"def","statGain":120,"goldCost":0,"slot":"zirah","requirements":[{"name":"Batu Bara Neraka","amount":6},{"name":"Gold Ingot","amount":3}]},
        {"id":"fighter_24","job":"fighter","group":"PENJAHIT ZIRAH (ARMOR)","name":"🔥 Zirah Sisik Naga","statType":"def","statGain":200,"goldCost":0,"slot":"zirah","requirements":[{"name":"Inti Api Naga","amount":3},{"name":"Mithril Ingot","amount":6}]},
        {"id":"fighter_25","job":"fighter","group":"PENGRAJIN SEPATU (BOOTS)","name":"Sepatu Slime Gesit","statType":"def","statGain":2,"goldCost":0,"slot":"sepatu","requirements":[{"name":"Lendir Slime","amount":4},{"name":"Akar Beracun","amount":2}]},
        {"id":"fighter_26","job":"fighter","group":"PENGRAJIN SEPATU (BOOTS)","name":"Boots Pemburu Serigala","statType":"def","statGain":9,"goldCost":0,"slot":"sepatu","requirements":[{"name":"Kulit Serigala","amount":5},{"name":"Sayap Kelelawar","amount":3}]},
        {"id":"fighter_27","job":"fighter","group":"PENGRAJIN SEPATU (BOOTS)","name":"Greaves Reruntuhan","statType":"def","statGain":20,"goldCost":0,"slot":"sepatu","requirements":[{"name":"Kain Kafan Kuno","amount":5},{"name":"Serpihan Zirah Kuno","amount":2}]},
        {"id":"fighter_28","job":"fighter","group":"PENGRAJIN SEPATU (BOOTS)","name":"Sepatu Bulu Yeti","statType":"def","statGain":36,"goldCost":0,"slot":"sepatu","requirements":[{"name":"Bulu Yeti Tebal","amount":5},{"name":"Kulit Serigala","amount":5}]},
        {"id":"fighter_29","job":"fighter","group":"PENGRAJIN SEPATU (BOOTS)","name":"Sabaton Kerak Obsidian","statType":"def","statGain":65,"goldCost":0,"slot":"sepatu","requirements":[{"name":"Batu Obsidian","amount":6},{"name":"Iron Ingot","amount":5}]},
        {"id":"fighter_30","job":"fighter","group":"PENGRAJIN SEPATU (BOOTS)","name":"🥾 Greaves Langkah Naga","statType":"def","statGain":110,"goldCost":0,"slot":"sepatu","requirements":[{"name":"Inti Api Naga","amount":1},{"name":"Titanium Ingot","amount":4}]},
        {"id":"fighter_31","job":"fighter","group":"PEMBUAT SARUNG TANGAN (GLOVES)","name":"Sarung Tangan Sutra","statType":"atk","statGain":3,"goldCost":0,"slot":"sarung_tangan","requirements":[{"name":"Sutra Laba-Laba","amount":4},{"name":"Kayu Balsa","amount":5}]},
        {"id":"fighter_32","job":"fighter","group":"PEMBUAT SARUNG TANGAN (GLOVES)","name":"Sarung Tangan Goblin","statType":"atk","statGain":12,"goldCost":0,"slot":"sarung_tangan","requirements":[{"name":"Telinga Goblin","amount":5},{"name":"Bijih Besi","amount":3}]},
        {"id":"fighter_33","job":"fighter","group":"PEMBUAT SARUNG TANGAN (GLOVES)","name":"Sarung Tangan Granit","statType":"atk","statGain":28,"goldCost":0,"slot":"sarung_tangan","requirements":[{"name":"Pecahan Granit","amount":5},{"name":"Iron Ingot","amount":2}]},
        {"id":"fighter_34","job":"fighter","group":"PEMBUAT SARUNG TANGAN (GLOVES)","name":"Bracers Serpihan Es","statType":"atk","statGain":50,"goldCost":0,"slot":"sarung_tangan","requirements":[{"name":"Pecahan Es Abadi","amount":4},{"name":"Silver Ingot","amount":3}]},
        {"id":"fighter_35","job":"fighter","group":"PEMBUAT SARUNG TANGAN (GLOVES)","name":"Gauntlet Bara Neraka","statType":"atk","statGain":85,"goldCost":0,"slot":"sarung_tangan","requirements":[{"name":"Batu Bara Neraka","amount":5},{"name":"Gold Ingot","amount":2}]},
        {"id":"fighter_36","job":"fighter","group":"PEMBUAT SARUNG TANGAN (GLOVES)","name":"🥊 Cakar Inferno Dragon","statType":"atk","statGain":140,"goldCost":0,"slot":"sarung_tangan","requirements":[{"name":"Inti Api Naga","amount":1},{"name":"Mithril Ingot","amount":3}]},
        {"id":"fighter_37","job":"fighter","group":"AKSESORIS KUNO (JIMAT)","name":"Jimat Kayu Hutan","statType":"maxHp","statGain":35,"goldCost":0,"slot":"amulet","requirements":[{"name":"Akar Beracun","amount":4},{"name":"Lendir Slime","amount":4}]},
        {"id":"fighter_38","job":"fighter","group":"AKSESORIS KUNO (JIMAT)","name":"Kalung Sengat Gua","statType":"maxHp","statGain":140,"goldCost":0,"slot":"amulet","requirements":[{"name":"Sengat Kristal","amount":5},{"name":"Copper Ingot","amount":2}]},
        {"id":"fighter_39","job":"fighter","group":"AKSESORIS KUNO (JIMAT)","name":"Jimat Kafan Mumi","statType":"maxHp","statGain":350,"goldCost":0,"slot":"amulet","requirements":[{"name":"Kain Kafan Kuno","amount":5},{"name":"Esensi Jiwa","amount":1}]},
        {"id":"fighter_40","job":"fighter","group":"AKSESORIS KUNO (JIMAT)","name":"Amulet Jiwa Wraith","statType":"maxHp","statGain":700,"goldCost":0,"slot":"amulet","requirements":[{"name":"Esensi Jiwa","amount":4},{"name":"Pecahan Es Abadi","amount":3}]},
        {"id":"fighter_41","job":"fighter","group":"AKSESORIS KUNO (JIMAT)","name":"Pendant Inti Obsidian","statType":"maxHp","statGain":1300,"goldCost":0,"slot":"amulet","requirements":[{"name":"Batu Obsidian","amount":5},{"name":"Batu Bara Neraka","amount":4}]},
        {"id":"fighter_42","job":"fighter","group":"AKSESORIS KUNO (JIMAT)","name":"👁️ Relik Jantung Naga","statType":"maxHp","statGain":2500,"goldCost":0,"slot":"amulet","requirements":[{"name":"Inti Api Naga","amount":2},{"name":"Gold Ingot","amount":5}]},
        {"id":"fighter_61","job":"fighter","group":"9. Relik Drop Langka","name":"Pedang Jantung Orc","statType":"atk","statGain":30,"goldCost":0,"slot":"senjata","requirements":[{"name":"Jantung Orc","amount":1},{"name":"Iron Ingot","amount":4}]},
        {"id":"fighter_62","job":"fighter","group":"9. Relik Drop Langka","name":"Pelindung Tanduk Es","statType":"def","statGain":22,"goldCost":0,"slot":"offhand","requirements":[{"name":"Tanduk Es","amount":2},{"name":"Silver Ingot","amount":3}]},
        {"id":"fighter_63","job":"fighter","group":"9. Relik Drop Langka","name":"Pelindung Kristal Frostbite","statType":"def","statGain":35,"goldCost":0,"slot":"offhand","requirements":[{"name":"Kristal Frostbite","amount":2},{"name":"Mithril Ingot","amount":4}]},
        {"id":"fighter_64","job":"fighter","group":"9. Relik Drop Langka","name":"Armor Inti Magma","statType":"def","statGain":40,"goldCost":0,"slot":"zirah","requirements":[{"name":"Inti Magma","amount":1},{"name":"Gold Ingot","amount":3}]},
        {"id":"fighter_65","job":"fighter","group":"9. Relik Drop Langka","name":"Golok Benih Pemakan","statType":"atk","statGain":18,"goldCost":0,"slot":"senjata","requirements":[{"name":"Benih Pemakan Daging","amount":2},{"name":"Kayu Balsa","amount":4}]},
        {"id":"fighter_66","job":"fighter","group":"9. Relik Drop Langka","name":"Warhammer Tanduk Iblis","statType":"atk","statGain":32,"goldCost":0,"slot":"senjata","requirements":[{"name":"Tanduk Iblis Api","amount":1},{"name":"Titanium Ingot","amount":3}]},
        {"id":"mage_1","job":"mage","group":"1. Senjata Utama (Staff & Spellbook)","name":"Apprentice Wooden Wand","statType":"magicDamage","statGain":10,"goldCost":0,"slot":"senjata","requirements":[{"name":"Kayu Balsa","amount":5},{"name":"Lendir Slime","amount":3}]},
        {"id":"mage_2","job":"mage","group":"1. Senjata Utama (Staff & Spellbook)","name":"🔮 Orb Kristal Pemula","statType":"magicDamage","statGain":25,"goldCost":0,"slot":"senjata","requirements":[{"name":"Sutra Laba-Laba","amount":4},{"name":"Sayap Kelelawar","amount":4}]},
        {"id":"mage_3","job":"mage","group":"1. Senjata Utama (Staff & Spellbook)","name":"Pyromancer Ignition Staff","statType":"magicDamage","statGain":32,"goldCost":0,"slot":"senjata","requirements":[{"name":"Sengat Kristal","amount":5},{"name":"Copper Ingot","amount":1}]},
        {"id":"mage_4","job":"mage","group":"1. Senjata Utama (Staff & Spellbook)","name":"📖 Codex Golem Purba","statType":"magicDamage","statGain":60,"goldCost":0,"slot":"senjata","requirements":[{"name":"Pecahan Granit","amount":5},{"name":"Silver Ingot","amount":2}]},
        {"id":"mage_5","job":"mage","group":"1. Senjata Utama (Staff & Spellbook)","name":"❄️ Glacial Freeze Spellbook","statType":"magicDamage","statGain":90,"goldCost":0,"slot":"senjata","requirements":[{"name":"Pecahan Es Abadi","amount":6},{"name":"Silver Ingot","amount":4}]},
        {"id":"mage_6","job":"mage","group":"1. Senjata Utama (Staff & Spellbook)","name":"🔥 Staff of Apocalyptic Dragon","statType":"magicDamage","statGain":195,"goldCost":0,"slot":"senjata","requirements":[{"name":"Inti Api Naga","amount":1},{"name":"Mithril Ingot","amount":3}]},
        {"id":"mage_7","job":"mage","group":"2. Pertahanan Tangan (Catalyst / Jimat Tangan)","name":"Grimoire Kulit Slime","statType":"def","statGain":3,"goldCost":0,"slot":"katalis","requirements":[{"name":"Lendir Slime","amount":3},{"name":"Akar Beracun","amount":3}]},
        {"id":"mage_8","job":"mage","group":"2. Pertahanan Tangan (Catalyst / Jimat Tangan)","name":"✨ Rune Shield Amulet","statType":"def","statGain":6,"goldCost":0,"slot":"katalis","requirements":[{"name":"Sutra Laba-Laba","amount":4},{"name":"Sayap Kelelawar","amount":2}]},
        {"id":"mage_9","job":"mage","group":"2. Pertahanan Tangan (Catalyst / Jimat Tangan)","name":"Cincin Pelindung Magma","statType":"def","statGain":12,"goldCost":0,"slot":"katalis","requirements":[{"name":"Sengat Kristal","amount":4},{"name":"Copper Ingot","amount":2}]},
        {"id":"mage_10","job":"mage","group":"2. Pertahanan Tangan (Catalyst / Jimat Tangan)","name":"⚙️ Enchanted Iron Ward","statType":"def","statGain":25,"goldCost":0,"slot":"katalis","requirements":[{"name":"Bijih Besi","amount":5},{"name":"Iron Ingot","amount":3}]},
        {"id":"mage_11","job":"mage","group":"2. Pertahanan Tangan (Catalyst / Jimat Tangan)","name":"❄️ Frost-Weave Ward","statType":"def","statGain":40,"goldCost":0,"slot":"katalis","requirements":[{"name":"Pecahan Es Abadi","amount":5},{"name":"Silver Ingot","amount":3}]},
        {"id":"mage_12","job":"mage","group":"2. Pertahanan Tangan (Catalyst / Jimat Tangan)","name":"🔥 Dragon Flame Essence Mirror","statType":"def","statGain":75,"goldCost":0,"slot":"katalis","requirements":[{"name":"Inti Api Naga","amount":1}]},
        {"id":"mage_13","job":"mage","group":"3. Pelindung Kepala (Topi Penyihir / Diadem)","name":"Topi Kain Magang","statType":"def","statGain":2,"goldCost":0,"slot":"helm","requirements":[{"name":"Lendir Slime","amount":3},{"name":"Sutra Laba-Laba","amount":2}]},
        {"id":"mage_14","job":"mage","group":"3. Pelindung Kepala (Topi Penyihir / Diadem)","name":"🧝‍♀️ Circlet Aliran Mana","statType":"def","statGain":5,"goldCost":0,"slot":"helm","requirements":[{"name":"Sutra Laba-Laba","amount":4},{"name":"Sayap Kelelawar","amount":3}]},
        {"id":"mage_15","job":"mage","group":"3. Pelindung Kepala (Topi Penyihir / Diadem)","name":"🔥 Hood of Blazing Ember","statType":"def","statGain":11,"goldCost":0,"slot":"helm","requirements":[{"name":"Sengat Kristal","amount":5},{"name":"Copper Ingot","amount":2}]},
        {"id":"mage_16","job":"mage","group":"3. Pelindung Kepala (Topi Penyihir / Diadem)","name":"🪖 Crown of Runestone","statType":"def","statGain":22,"goldCost":0,"slot":"helm","requirements":[{"name":"Pecahan Granit","amount":4},{"name":"Iron Ingot","amount":3}]},
        {"id":"mage_17","job":"mage","group":"3. Pelindung Kepala (Topi Penyihir / Diadem)","name":"👑 Tiara of Frozen Blizzard","statType":"def","statGain":35,"goldCost":0,"slot":"helm","requirements":[{"name":"Pecahan Es Abadi","amount":4},{"name":"Silver Ingot","amount":3}]},
        {"id":"mage_18","job":"mage","group":"3. Pelindung Kepala (Topi Penyihir / Diadem)","name":"👑 Dragonlord Overlord Diadem","statType":"def","statGain":60,"goldCost":0,"slot":"helm","requirements":[{"name":"Inti Api Naga","amount":1}]},
        {"id":"mage_19","job":"mage","group":"4. Pelindung Tubuh (Jubah Sihir / Robe)","name":"Kain Pelindung Pemula","statType":"def","statGain":3,"goldCost":0,"slot":"zirah","requirements":[{"name":"Lendir Slime","amount":4},{"name":"Sutra Laba-Laba","amount":4}]},
        {"id":"mage_20","job":"mage","group":"4. Pelindung Tubuh (Jubah Sihir / Robe)","name":"Jubah Sutra Rajutan Sihir","statType":"def","statGain":7,"goldCost":0,"slot":"zirah","requirements":[{"name":"Sutra Laba-Laba","amount":5},{"name":"Kain Kafan Kuno","amount":2}]},
        {"id":"mage_21","job":"mage","group":"4. Pelindung Tubuh (Jubah Sihir / Robe)","name":"🧥 Robe of Phoenix Flame","statType":"def","statGain":15,"goldCost":0,"slot":"zirah","requirements":[{"name":"Sengat Kristal","amount":5},{"name":"Batu Bara Neraka","amount":2}]},
        {"id":"mage_22","job":"mage","group":"4. Pelindung Tubuh (Jubah Sihir / Robe)","name":"⛓️ Spell-Weave Iron Vestment","statType":"def","statGain":28,"goldCost":0,"slot":"zirah","requirements":[{"name":"Bijih Besi","amount":5},{"name":"Iron Ingot","amount":4}]},
        {"id":"mage_23","job":"mage","group":"4. Pelindung Tubuh (Jubah Sihir / Robe)","name":"❄️ Garment of Eternal Frost","statType":"def","statGain":45,"goldCost":0,"slot":"zirah","requirements":[{"name":"Pecahan Es Abadi","amount":5},{"name":"Bulu Yeti Tebal","amount":3}]},
        {"id":"mage_24","job":"mage","group":"4. Pelindung Tubuh (Jubah Sihir / Robe)","name":"🌋 Overlord Pyroclastic Regalia","statType":"def","statGain":85,"goldCost":0,"slot":"zirah","requirements":[{"name":"Inti Api Naga","amount":1}]},
        {"id":"mage_25","job":"mage","group":"5. Alas Kaki (Sepatu Langkah Mana)","name":"Sandal Kain Ringan","statType":"maxMana","statGain":20,"goldCost":0,"slot":"sepatu","requirements":[{"name":"Lendir Slime","amount":3},{"name":"Sutra Laba-Laba","amount":3}]},
        {"id":"mage_26","job":"mage","group":"5. Alas Kaki (Sepatu Langkah Mana)","name":"Sepatu Sulur Levitasi","statType":"maxMana","statGain":50,"goldCost":0,"slot":"sepatu","requirements":[{"name":"Sutra Laba-Laba","amount":4},{"name":"Akar Beracun","amount":2}]},
        {"id":"mage_27","job":"mage","group":"5. Alas Kaki (Sepatu Langkah Mana)","name":"Boots of Scorched Earth","statType":"maxMana","statGain":100,"goldCost":0,"slot":"sepatu","requirements":[{"name":"Sengat Kristal","amount":4},{"name":"Bijih Besi","amount":2}]},
        {"id":"mage_28","job":"mage","group":"5. Alas Kaki (Sepatu Langkah Mana)","name":"⚙️ Runic Iron Greaves","statType":"maxMana","statGain":180,"goldCost":0,"slot":"sepatu","requirements":[{"name":"Bijih Besi","amount":5},{"name":"Iron Ingot","amount":2}]},
        {"id":"mage_29","job":"mage","group":"5. Alas Kaki (Sepatu Langkah Mana)","name":"❄️ Frost-Walker Treads","statType":"maxMana","statGain":300,"goldCost":0,"slot":"sepatu","requirements":[{"name":"Pecahan Es Abadi","amount":5},{"name":"Kulit Serigala","amount":4}]},
        {"id":"mage_30","job":"mage","group":"5. Alas Kaki (Sepatu Langkah Mana)","name":"👟 Hellfire Dragon Gate Boots","statType":"maxMana","statGain":600,"goldCost":0,"slot":"sepatu","requirements":[{"name":"Inti Api Naga","amount":1}]},
        {"id":"mage_31","job":"mage","group":"6. Pelindung Tangan (Sarung Tangan Tenun Mantra)","name":"Sarung Tangan Rajut Benang","statType":"magicDamage","statGain":3,"goldCost":0,"slot":"sarung_tangan","requirements":[{"name":"Lendir Slime","amount":3},{"name":"Sutra Laba-Laba","amount":2}]},
        {"id":"mage_32","job":"mage","group":"6. Pelindung Tangan (Sarung Tangan Tenun Mantra)","name":"🥊 Bracers Alkimia Pemula","statType":"magicDamage","statGain":8,"goldCost":0,"slot":"sarung_tangan","requirements":[{"name":"Sutra Laba-Laba","amount":4},{"name":"Sayap Kelelawar","amount":3}]},
        {"id":"mage_33","job":"mage","group":"6. Pelindung Tangan (Sarung Tangan Tenun Mantra)","name":"Ignition Flare Gloves","statType":"magicDamage","statGain":15,"goldCost":0,"slot":"sarung_tangan","requirements":[{"name":"Sengat Kristal","amount":4},{"name":"Copper Ingot","amount":2}]},
        {"id":"mage_34","job":"mage","group":"6. Pelindung Tangan (Sarung Tangan Tenun Mantra)","name":"⚙️ Heavy Mana Iron Gauntlets","statType":"magicDamage","statGain":24,"goldCost":0,"slot":"sarung_tangan","requirements":[{"name":"Bijih Besi","amount":5},{"name":"Iron Ingot","amount":3}]},
        {"id":"mage_35","job":"mage","group":"6. Pelindung Tangan (Sarung Tangan Tenun Mantra)","name":"❄️ Frostbite Spell-Weave Grips","statType":"magicDamage","statGain":40,"goldCost":0,"slot":"sarung_tangan","requirements":[{"name":"Pecahan Es Abadi","amount":5},{"name":"Silver Ingot","amount":2}]},
        {"id":"mage_36","job":"mage","group":"6. Pelindung Tangan (Sarung Tangan Tenun Mantra)","name":"🔥 Core-Melter Dragon Claws","statType":"magicDamage","statGain":70,"goldCost":0,"slot":"sarung_tangan","requirements":[{"name":"Inti Api Naga","amount":1}]},
        {"id":"mage_37","job":"mage","group":"7. Aksesoris Leher (Kalung Fokus Energi)","name":"Gantungan Cairan Berpendar","statType":"maxHp","statGain":20,"goldCost":0,"slot":"amulet","requirements":[{"name":"Lendir Slime","amount":4},{"name":"Akar Beracun","amount":2}]},
        {"id":"mage_38","job":"mage","group":"7. Aksesoris Leher (Kalung Fokus Energi)","name":"Amulet Pecahan Mana","statType":"maxHp","statGain":55,"goldCost":0,"slot":"amulet","requirements":[{"name":"Sutra Laba-Laba","amount":5},{"name":"Sengat Kristal","amount":2}]},
        {"id":"mage_39","job":"mage","group":"7. Aksesoris Leher (Kalung Fokus Energi)","name":"🧿 Ruby Core Catalyst Pendant","statType":"maxHp","statGain":110,"goldCost":0,"slot":"amulet","requirements":[{"name":"Sengat Kristal","amount":5},{"name":"Gold Ingot","amount":1}]},
        {"id":"mage_40","job":"mage","group":"7. Aksesoris Leher (Kalung Fokus Energi)","name":"🎯 Runic Iron Medallion","statType":"maxHp","statGain":210,"goldCost":0,"slot":"amulet","requirements":[{"name":"Bijih Besi","amount":6},{"name":"Iron Ingot","amount":3}]},
        {"id":"mage_41","job":"mage","group":"7. Aksesoris Leher (Kalung Fokus Energi)","name":"❄️ Insignia of Frost Overlord","statType":"maxHp","statGain":380,"goldCost":0,"slot":"amulet","requirements":[{"name":"Pecahan Es Abadi","amount":5},{"name":"Esensi Jiwa","amount":2}]},
        {"id":"mage_42","job":"mage","group":"7. Aksesoris Leher (Kalung Fokus Energi)","name":"👁️ Eye of the Scorching Dragon","statType":"maxHp","statGain":650,"goldCost":0,"slot":"amulet","requirements":[{"name":"Inti Api Naga","amount":1}]},
        {"id":"mage_61","job":"mage","group":"11. Relik Drop Langka","name":"Tongkat Inti Slime Raja","statType":"magicDamage","statGain":40,"goldCost":0,"slot":"senjata","requirements":[{"name":"Inti Slime Raja","amount":1},{"name":"Silver Ingot","amount":2}]},
        {"id":"mage_62","job":"mage","group":"11. Relik Drop Langka","name":"Jubah Mahkota Lendir","statType":"def","statGain":30,"goldCost":0,"slot":"zirah","requirements":[{"name":"Mahkota Lendir","amount":1},{"name":"Kayu Balsa","amount":4}]},
        {"id":"mage_63","job":"mage","group":"11. Relik Drop Langka","name":"Manik Debu Jiwa","statType":"maxMana","statGain":50,"goldCost":0,"slot":"amulet","requirements":[{"name":"Debu Jiwa Kuno","amount":2},{"name":"Gold Ingot","amount":3}]},
        {"id":"mage_64","job":"mage","group":"11. Relik Drop Langka","name":"Sfera Esensi Gelap","statType":"magicDamage","statGain":45,"goldCost":0,"slot":"senjata","requirements":[{"name":"Esensi Gelap","amount":1},{"name":"Iron Ingot","amount":2}]},
        {"id":"mage_65","job":"mage","group":"11. Relik Drop Langka","name":"Orb Kekosongan","statType":"magicDamage","statGain":80,"goldCost":0,"slot":"senjata","requirements":[{"name":"Inti Kekosongan","amount":1},{"name":"Mithril Ingot","amount":4}]},
        {"id":"mage_66","job":"mage","group":"11. Relik Drop Langka","name":"Amulet Jantung Es Abadi","statType":"def","statGain":60,"goldCost":0,"slot":"amulet","requirements":[{"name":"Jantung Es Abadi","amount":1},{"name":"Silver Ingot","amount":3}]},
        {"id":"archer_1","job":"archer","group":"1. Senjata Utama (Bow & Crossbow)","name":"Short Bow Berburu","statType":"atk","statGain":8,"goldCost":0,"slot":"senjata","requirements":[{"name":"Kulit Serigala","amount":3},{"name":"Kayu Balsa","amount":5}]},
        {"id":"archer_2","job":"archer","group":"1. Senjata Utama (Bow & Crossbow)","name":"🏹 Recurve Bow Penjarah","statType":"atk","statGain":20,"goldCost":0,"slot":"senjata","requirements":[{"name":"Telinga Goblin","amount":4},{"name":"Kayu Pinus","amount":6}]},
        {"id":"archer_3","job":"archer","group":"1. Senjata Utama (Bow & Crossbow)","name":"Heavy Iron Crossbow","statType":"atk","statGain":25,"goldCost":0,"slot":"senjata","requirements":[{"name":"Bijih Besi","amount":5},{"name":"Kayu Pinus","amount":10}]},
        {"id":"archer_4","job":"archer","group":"1. Senjata Utama (Bow & Crossbow)","name":"🪨 Greatbow Balista Golem","statType":"atk","statGain":50,"goldCost":0,"slot":"senjata","requirements":[{"name":"Pecahan Granit","amount":5},{"name":"Kayu Besi / Ironwood","amount":4}]},
        {"id":"archer_5","job":"archer","group":"1. Senjata Utama (Bow & Crossbow)","name":"🏹 Gale Wind Piercer","statType":"atk","statGain":75,"goldCost":0,"slot":"senjata","requirements":[{"name":"Pecahan Es Abadi","amount":6},{"name":"Kayu Mahoni","amount":5}]},
        {"id":"archer_6","job":"archer","group":"1. Senjata Utama (Bow & Crossbow)","name":"🔥 Sky-Piercer Dragon Bow","statType":"atk","statGain":160,"goldCost":0,"slot":"senjata","requirements":[{"name":"Inti Api Naga","amount":1},{"name":"Kayu Purba / Elderwood","amount":3}]},
        {"id":"archer_7","job":"archer","group":"2. Pertahanan Tangan (Quiver / Kantong Panah)","name":"Quiver Kulit Ringan","statType":"def","statGain":2,"goldCost":0,"slot":"offhand","requirements":[{"name":"Lendir Slime","amount":3},{"name":"Kulit Serigala","amount":2}]},
        {"id":"archer_8","job":"archer","group":"2. Pertahanan Tangan (Quiver / Kantong Panah)","name":"🎒 Quiver Pengintai Gua","statType":"def","statGain":5,"goldCost":0,"slot":"offhand","requirements":[{"name":"Telinga Goblin","amount":4},{"name":"Kulit Serigala","amount":3}]},
        {"id":"archer_9","job":"archer","group":"2. Pertahanan Tangan (Quiver / Kantong Panah)","name":"Quiver Bulu Serigala Hutan","statType":"def","statGain":10,"goldCost":0,"slot":"offhand","requirements":[{"name":"Kulit Serigala","amount":4},{"name":"Sutra Laba-Laba","amount":4}]},
        {"id":"archer_10","job":"archer","group":"2. Pertahanan Tangan (Quiver / Kantong Panah)","name":"⚙️ Reinforced Bolt Case","statType":"def","statGain":20,"goldCost":0,"slot":"offhand","requirements":[{"name":"Bijih Besi","amount":5},{"name":"Iron Ingot","amount":2}]},
        {"id":"archer_11","job":"archer","group":"2. Pertahanan Tangan (Quiver / Kantong Panah)","name":"❄️ Glacial Wind Quiver","statType":"def","statGain":35,"goldCost":0,"slot":"offhand","requirements":[{"name":"Pecahan Es Abadi","amount":5},{"name":"Bulu Yeti Tebal","amount":2}]},
        {"id":"archer_12","job":"archer","group":"2. Pertahanan Tangan (Quiver / Kantong Panah)","name":"🔥 Fire-Drake Endless Quiver","statType":"def","statGain":60,"goldCost":0,"slot":"offhand","requirements":[{"name":"Inti Api Naga","amount":1},{"name":"Batu Obsidian","amount":3}]},
        {"id":"archer_13","job":"archer","group":"3. Pelindung Kepala (Topi / Hood Camouflage)","name":"Ikat Kepala Slime Lentur","statType":"def","statGain":1,"goldCost":0,"slot":"helm","requirements":[{"name":"Lendir Slime","amount":3},{"name":"Sutra Laba-Laba","amount":3}]},
        {"id":"archer_14","job":"archer","group":"3. Pelindung Kepala (Topi / Hood Camouflage)","name":"Topi Caping Alang-Alang","statType":"def","statGain":4,"goldCost":0,"slot":"helm","requirements":[{"name":"Telinga Goblin","amount":4},{"name":"Kayu Balsa","amount":5}]},
        {"id":"archer_15","job":"archer","group":"3. Pelindung Kepala (Topi / Hood Camouflage)","name":"🐺 Masker Moncong Serigala","statType":"def","statGain":9,"goldCost":0,"slot":"helm","requirements":[{"name":"Kulit Serigala","amount":5},{"name":"Copper Ingot","amount":1}]},
        {"id":"archer_16","job":"archer","group":"3. Pelindung Kepala (Topi / Hood Camouflage)","name":"🪖 Visor Pelindung Mata Golem","statType":"def","statGain":18,"goldCost":0,"slot":"helm","requirements":[{"name":"Pecahan Granit","amount":4},{"name":"Iron Ingot","amount":2}]},
        {"id":"archer_17","job":"archer","group":"3. Pelindung Kepala (Topi / Hood Camouflage)","name":"👑 Crown of Frozen Eagle","statType":"def","statGain":30,"goldCost":0,"slot":"helm","requirements":[{"name":"Pecahan Es Abadi","amount":4},{"name":"Silver Ingot","amount":2}]},
        {"id":"archer_18","job":"archer","group":"3. Pelindung Kepala (Topi / Hood Camouflage)","name":"👹 Gaze of Fire-Drake Goggles","statType":"def","statGain":50,"goldCost":0,"slot":"helm","requirements":[{"name":"Inti Api Naga","amount":1},{"name":"Gold Ingot","amount":2}]},
        {"id":"archer_19","job":"archer","group":"4. Pelindung Tubuh (Armor / Jubah)","name":"Rompi Daun Perekat","statType":"def","statGain":2,"goldCost":0,"slot":"zirah","requirements":[{"name":"Lendir Slime","amount":4},{"name":"Akar Beracun","amount":3}]},
        {"id":"archer_20","job":"archer","group":"4. Pelindung Tubuh (Armor / Jubah)","name":"Baju Sisik Komando Hijau","statType":"def","statGain":5,"goldCost":0,"slot":"zirah","requirements":[{"name":"Telinga Goblin","amount":5},{"name":"Sayap Kelelawar","amount":5}]},
        {"id":"archer_21","job":"archer","group":"4. Pelindung Tubuh (Armor / Jubah)","name":"🧥 Mantel Kulit Alpha Wolf","statType":"def","statGain":12,"goldCost":0,"slot":"zirah","requirements":[{"name":"Kulit Serigala","amount":5},{"name":"Sutra Laba-Laba","amount":5}]},
        {"id":"archer_22","job":"archer","group":"4. Pelindung Tubuh (Armor / Jubah)","name":"⛓️ Brigandine Besi Ringan","statType":"def","statGain":24,"goldCost":0,"slot":"zirah","requirements":[{"name":"Bijih Besi","amount":5},{"name":"Iron Ingot","amount":3}]},
        {"id":"archer_23","job":"archer","group":"4. Pelindung Tubuh (Armor / Jubah)","name":"💨 Tunic of Swift Windcurrent","statType":"def","statGain":40,"goldCost":0,"slot":"zirah","requirements":[{"name":"Pecahan Es Abadi","amount":5},{"name":"Esensi Jiwa","amount":2}]},
        {"id":"archer_24","job":"archer","group":"4. Pelindung Tubuh (Armor / Jubah)","name":"🌋 Hauberk Kerak Lava Pyro","statType":"def","statGain":70,"goldCost":0,"slot":"zirah","requirements":[{"name":"Inti Api Naga","amount":1},{"name":"Batu Bara Neraka","amount":4}]},
        {"id":"archer_25","job":"archer","group":"5. Alas Kaki (Sepatu Kelincahan)","name":"Sepatu Karet Melar","statType":"dodge","statGain":1,"goldCost":0,"slot":"sepatu","requirements":[{"name":"Lendir Slime","amount":3},{"name":"Akar Beracun","amount":2}]},
        {"id":"archer_26","job":"archer","group":"5. Alas Kaki (Sepatu Kelincahan)","name":"Boots Penjejak Goblin","statType":"dodge","statGain":2,"goldCost":0,"slot":"sepatu","requirements":[{"name":"Telinga Goblin","amount":4},{"name":"Sayap Kelelawar","amount":3}]},
        {"id":"archer_27","job":"archer","group":"5. Alas Kaki (Sepatu Kelincahan)","name":"Sepatu Bot Langkah Angin","statType":"dodge","statGain":3,"goldCost":0,"slot":"sepatu","requirements":[{"name":"Kulit Serigala","amount":4},{"name":"Sutra Laba-Laba","amount":3}]},
        {"id":"archer_28","job":"archer","group":"5. Alas Kaki (Sepatu Kelincahan)","name":"⚙️ Boots Greaves Berpantek","statType":"dodge","statGain":4,"goldCost":0,"slot":"sepatu","requirements":[{"name":"Bijih Besi","amount":5},{"name":"Copper Ingot","amount":3}]},
        {"id":"archer_29","job":"archer","group":"5. Alas Kaki (Sepatu Kelincahan)","name":"❄️ Blizzard Frost Treads","statType":"dodge","statGain":6,"goldCost":0,"slot":"sepatu","requirements":[{"name":"Pecahan Es Abadi","amount":5},{"name":"Bulu Yeti Tebal","amount":3}]},
        {"id":"archer_30","job":"archer","group":"5. Alas Kaki (Sepatu Kelincahan)","name":"👟 Swiftstrike Dragon Boots","statType":"dodge","statGain":8,"goldCost":0,"slot":"sepatu","requirements":[{"name":"Inti Api Naga","amount":1},{"name":"Titanium Ingot","amount":2}]},
        {"id":"archer_31","job":"archer","group":"6. Pelindung Tangan (Sarung Tangan Pelepah Panah)","name":"Sarung Tangan Kain Rajut","statType":"atk","statGain":2,"goldCost":0,"slot":"sarung_tangan","requirements":[{"name":"Lendir Slime","amount":3},{"name":"Sutra Laba-Laba","amount":2}]},
        {"id":"archer_32","job":"archer","group":"6. Pelindung Tangan (Sarung Tangan Pelepah Panah)","name":"🥊 Bracers Pemburu Goblin","statType":"atk","statGain":5,"goldCost":0,"slot":"sarung_tangan","requirements":[{"name":"Telinga Goblin","amount":4},{"name":"Kulit Serigala","amount":2}]},
        {"id":"archer_33","job":"archer","group":"6. Pelindung Tangan (Sarung Tangan Pelepah Panah)","name":"Glove Kulit Alpha Stalker","statType":"atk","statGain":10,"goldCost":0,"slot":"sarung_tangan","requirements":[{"name":"Kulit Serigala","amount":4},{"name":"Copper Ingot","amount":1}]},
        {"id":"archer_34","job":"archer","group":"6. Pelindung Tangan (Sarung Tangan Pelepah Panah)","name":"⚙️ Heavy Iron Draw-Gloves","statType":"atk","statGain":18,"goldCost":0,"slot":"sarung_tangan","requirements":[{"name":"Bijih Besi","amount":5},{"name":"Iron Ingot","amount":2}]},
        {"id":"archer_35","job":"archer","group":"6. Pelindung Tangan (Sarung Tangan Pelepah Panah)","name":"❄️ Frostbite Trueflight Bracers","statType":"atk","statGain":32,"goldCost":0,"slot":"sarung_tangan","requirements":[{"name":"Pecahan Es Abadi","amount":5},{"name":"Silver Ingot","amount":2}]},
        {"id":"archer_36","job":"archer","group":"6. Pelindung Tangan (Sarung Tangan Pelepah Panah)","name":"🔥 Fire-Drake Bowstring Grips","statType":"atk","statGain":55,"goldCost":0,"slot":"sarung_tangan","requirements":[{"name":"Inti Api Naga","amount":1},{"name":"Mithril Ingot","amount":1}]},
        {"id":"archer_37","job":"archer","group":"7. Aksesoris Leher (Gantungan Jimat Bidik)","name":"Gantungan Cair Kelap-Kelip","statType":"maxHp","statGain":15,"goldCost":0,"slot":"amulet","requirements":[{"name":"Lendir Slime","amount":4},{"name":"Akar Beracun","amount":2}]},
        {"id":"archer_38","job":"archer","group":"7. Aksesoris Leher (Gantungan Jimat Bidik)","name":"Kalung Taring Penembus","statType":"maxHp","statGain":45,"goldCost":0,"slot":"amulet","requirements":[{"name":"Telinga Goblin","amount":5},{"name":"Sayap Kelelawar","amount":4}]},
        {"id":"archer_39","job":"archer","group":"7. Aksesoris Leher (Gantungan Jimat Bidik)","name":"🧿 Azimuth Eagle Eye Charm","statType":"maxHp","statGain":95,"goldCost":0,"slot":"amulet","requirements":[{"name":"Kulit Serigala","amount":5},{"name":"Copper Ingot","amount":2}]},
        {"id":"archer_40","job":"archer","group":"7. Aksesoris Leher (Gantungan Jimat Bidik)","name":"🎯 Medali Kokoh Bidikan Jitu","statType":"maxHp","statGain":180,"goldCost":0,"slot":"amulet","requirements":[{"name":"Bijih Besi","amount":6},{"name":"Iron Ingot","amount":2}]},
        {"id":"archer_41","job":"archer","group":"7. Aksesoris Leher (Gantungan Jimat Bidik)","name":"❄️ Insignia of Zephyr Gale","statType":"maxHp","statGain":320,"goldCost":0,"slot":"amulet","requirements":[{"name":"Pecahan Es Abadi","amount":5},{"name":"Silver Ingot","amount":3}]},
        {"id":"archer_42","job":"archer","group":"7. Aksesoris Leher (Gantungan Jimat Bidik)","name":"👁️ Dragon Sight Target Necklace","statType":"maxHp","statGain":550,"goldCost":0,"slot":"amulet","requirements":[{"name":"Inti Api Naga","amount":1},{"name":"Gold Ingot","amount":3}]},
        {"id":"archer_61","job":"archer","group":"9. Relik Drop Langka","name":"Shortbow Tulang Tajam","statType":"atk","statGain":12,"goldCost":0,"slot":"senjata","requirements":[{"name":"Taring Kecil","amount":3},{"name":"Kayu Pinus","amount":5}]},
        {"id":"archer_62","job":"archer","group":"9. Relik Drop Langka","name":"Quiver Bintang Jatuh","statType":"def","statGain":15,"goldCost":0,"slot":"offhand","requirements":[{"name":"Pecahan Bintang","amount":2},{"name":"Kayu Pinus","amount":6}]},
        {"id":"archer_63","job":"archer","group":"9. Relik Drop Langka","name":"Busur Cakar Gua","statType":"atk","statGain":18,"goldCost":0,"slot":"senjata","requirements":[{"name":"Cakar Tajam","amount":3},{"name":"Iron Ingot","amount":3}]},
        {"id":"archer_64","job":"archer","group":"9. Relik Drop Langka","name":"Panah Sisik Merah","statType":"atk","statGain":22,"goldCost":0,"slot":"senjata","requirements":[{"name":"Sisik Naga Merah","amount":2},{"name":"Gold Ingot","amount":2}]},
        {"id":"archer_65","job":"archer","group":"9. Relik Drop Langka","name":"Aegis Baja Hitam","statType":"def","statGain":30,"goldCost":0,"slot":"offhand","requirements":[{"name":"Baja Hitam","amount":2},{"name":"Iron Ingot","amount":4}]},
        {"id":"archer_66","job":"archer","group":"9. Relik Drop Langka","name":"Karapas Scorpion Bow","statType":"def","statGain":20,"goldCost":0,"slot":"offhand","requirements":[{"name":"Karapas Keras","amount":2},{"name":"Copper Ingot","amount":2}]},
        {"id":"assassin_1","job":"assassin","group":"1. Senjata Utama (Pedang / Dual Dagger)","name":"Belati Karat Tersembunyi","statType":"atk","statGain":8,"goldCost":0,"slot":"senjata","requirements":[{"name":"Sutra Laba-Laba","amount":4},{"name":"Lendir Slime","amount":3}]},
        {"id":"assassin_2","job":"assassin","group":"1. Senjata Utama (Pedang / Dual Dagger)","name":"🧪 Stiletto Beracun Korosif","statType":"atk","statGain":22,"goldCost":0,"slot":"senjata","requirements":[{"name":"Telinga Goblin","amount":4},{"name":"Akar Beracun","amount":2}]},
        {"id":"assassin_3","job":"assassin","group":"1. Senjata Utama (Pedang / Dual Dagger)","name":"⏳ Kris Baja Terkutuk","statType":"atk","statGain":45,"goldCost":0,"slot":"senjata","requirements":[{"name":"Kain Kafan Kuno","amount":5},{"name":"Iron Ingot","amount":3}]},
        {"id":"assassin_4","job":"assassin","group":"1. Senjata Utama (Pedang / Dual Dagger)","name":"🗡️ Shadowfang Ice Dagger","statType":"atk","statGain":80,"goldCost":0,"slot":"senjata","requirements":[{"name":"Pecahan Es Abadi","amount":5},{"name":"Silver Ingot","amount":2}]},
        {"id":"assassin_5","job":"assassin","group":"1. Senjata Utama (Pedang / Dual Dagger)","name":"🪨 Obsidian Piercer Dagger","statType":"atk","statGain":130,"goldCost":0,"slot":"senjata","requirements":[{"name":"Batu Obsidian","amount":6},{"name":"Gold Ingot","amount":3}]},
        {"id":"assassin_6","job":"assassin","group":"1. Senjata Utama (Pedang / Dual Dagger)","name":"🔥 Eclipse Dragon Edge","statType":"atk","statGain":220,"goldCost":0,"slot":"senjata","requirements":[{"name":"Inti Api Naga","amount":2},{"name":"Mithril Ingot","amount":4}]},
        {"id":"assassin_7","job":"assassin","group":"2. Pertahanan Tangan (Tameng / Buckler Rahasia)","name":"Perisai Kayu Ringan","statType":"def","statGain":2,"goldCost":0,"slot":"offhand","requirements":[{"name":"Lendir Slime","amount":4},{"name":"Kayu Balsa","amount":5}]},
        {"id":"assassin_8","job":"assassin","group":"2. Pertahanan Tangan (Tameng / Buckler Rahasia)","name":"🛡️ Buckler Tulang Kokoh","statType":"def","statGain":6,"goldCost":0,"slot":"offhand","requirements":[{"name":"Kulit Serigala","amount":4},{"name":"Copper Ingot","amount":2}]},
        {"id":"assassin_9","job":"assassin","group":"2. Pertahanan Tangan (Tameng / Buckler Rahasia)","name":"⏳ Aegis Bayangan Kuno","statType":"def","statGain":15,"goldCost":0,"slot":"offhand","requirements":[{"name":"Serpihan Zirah Kuno","amount":5},{"name":"Iron Ingot","amount":2}]},
        {"id":"assassin_10","job":"assassin","group":"2. Pertahanan Tangan (Tameng / Buckler Rahasia)","name":"❄️ Glacial Guard Buckler","statType":"def","statGain":30,"goldCost":0,"slot":"offhand","requirements":[{"name":"Pecahan Es Abadi","amount":5},{"name":"Silver Ingot","amount":3}]},
        {"id":"assassin_11","job":"assassin","group":"2. Pertahanan Tangan (Tameng / Buckler Rahasia)","name":"🧱 Perisai Obsidian Ringan","statType":"def","statGain":55,"goldCost":0,"slot":"offhand","requirements":[{"name":"Batu Obsidian","amount":6},{"name":"Gold Ingot","amount":4}]},
        {"id":"assassin_12","job":"assassin","group":"2. Pertahanan Tangan (Tameng / Buckler Rahasia)","name":"🔥 Eclipse Dragon Guard","statType":"def","statGain":90,"goldCost":0,"slot":"offhand","requirements":[{"name":"Inti Api Naga","amount":2},{"name":"Mithril Ingot","amount":3}]},
        {"id":"assassin_13","job":"assassin","group":"3. Pelindung Kepala (Helm / Tudung)","name":"Tudung Kain Penyamaran","statType":"def","statGain":2,"goldCost":0,"slot":"helm","requirements":[{"name":"Sutra Laba-Laba","amount":3},{"name":"Sayap Kelelawar","amount":4}]},
        {"id":"assassin_14","job":"assassin","group":"3. Pelindung Kepala (Helm / Tudung)","name":"🐺 Topeng Pemburu Serigala","statType":"def","statGain":7,"goldCost":0,"slot":"helm","requirements":[{"name":"Kulit Serigala","amount":4},{"name":"Telinga Goblin","amount":3}]},
        {"id":"assassin_15","job":"assassin","group":"3. Pelindung Kepala (Helm / Tudung)","name":"⏳ Masker Kafan Mistik","statType":"def","statGain":16,"goldCost":0,"slot":"helm","requirements":[{"name":"Kain Kafan Kuno","amount":5},{"name":"Esensi Jiwa","amount":1}]},
        {"id":"assassin_16","job":"assassin","group":"3. Pelindung Kepala (Helm / Tudung)","name":"❄️ Glacial Mist Assassin Hood","statType":"def","statGain":32,"goldCost":0,"slot":"helm","requirements":[{"name":"Esensi Jiwa","amount":5},{"name":"Pecahan Es Abadi","amount":3}]},
        {"id":"assassin_17","job":"assassin","group":"3. Pelindung Kepala (Helm / Tudung)","name":"🔥 Hellfire Visor Mask","statType":"def","statGain":58,"goldCost":0,"slot":"helm","requirements":[{"name":"Batu Bara Neraka","amount":6},{"name":"Batu Obsidian","amount":2}]},
        {"id":"assassin_18","job":"assassin","group":"3. Pelindung Kepala (Helm / Tudung)","name":"🔥 Eclipse Dragon Cowl","statType":"def","statGain":100,"goldCost":0,"slot":"helm","requirements":[{"name":"Inti Api Naga","amount":2},{"name":"Titanium Ingot","amount":2}]},
        {"id":"assassin_19","job":"assassin","group":"4. Pelindung Tubuh (Armor / Jubah)","name":"Kain Gombal Penyelinap","statType":"def","statGain":3,"goldCost":0,"slot":"zirah","requirements":[{"name":"Sayap Kelelawar","amount":4},{"name":"Sutra Laba-Laba","amount":5}]},
        {"id":"assassin_20","job":"assassin","group":"4. Pelindung Tubuh (Armor / Jubah)","name":"Baju Kulit Pencuri Gua","statType":"def","statGain":10,"goldCost":0,"slot":"zirah","requirements":[{"name":"Telinga Goblin","amount":5},{"name":"Kulit Serigala","amount":4}]},
        {"id":"assassin_21","job":"assassin","group":"4. Pelindung Tubuh (Armor / Jubah)","name":"⏳ Mantel Kafan Mumi","statType":"def","statGain":24,"goldCost":0,"slot":"zirah","requirements":[{"name":"Kain Kafan Kuno","amount":5},{"name":"Serpihan Zirah Kuno","amount":3}]},
        {"id":"assassin_22","job":"assassin","group":"4. Pelindung Tubuh (Armor / Jubah)","name":"❄️ Garb of Frozen Shadows","statType":"def","statGain":50,"goldCost":0,"slot":"zirah","requirements":[{"name":"Esensi Jiwa","amount":5},{"name":"Bulu Yeti Tebal","amount":4}]},
        {"id":"assassin_23","job":"assassin","group":"4. Pelindung Tubuh (Armor / Jubah)","name":"🧱 Jubah Obsidian Tipis","statType":"def","statGain":85,"goldCost":0,"slot":"zirah","requirements":[{"name":"Batu Obsidian","amount":6},{"name":"Batu Bara Neraka","amount":3}]},
        {"id":"assassin_24","job":"assassin","group":"4. Pelindung Tubuh (Armor / Jubah)","name":"🐈‍⬛ Nightstalker Dragon Garment","statType":"def","statGain":140,"goldCost":0,"slot":"zirah","requirements":[{"name":"Inti Api Naga","amount":2},{"name":"Mithril Ingot","amount":5}]},
        {"id":"assassin_25","job":"assassin","group":"5. Alas Kaki (Sepatu Sunyi)","name":"Sol Karet Peredam","statType":"dodge","statGain":1,"goldCost":0,"slot":"sepatu","requirements":[{"name":"Lendir Slime","amount":3},{"name":"Akar Beracun","amount":3}]},
        {"id":"assassin_26","job":"assassin","group":"5. Alas Kaki (Sepatu Sunyi)","name":"👟 Stealth Wolf Treads","statType":"dodge","statGain":3,"goldCost":0,"slot":"sepatu","requirements":[{"name":"Kulit Serigala","amount":4},{"name":"Sayap Kelelawar","amount":4}]},
        {"id":"assassin_27","job":"assassin","group":"5. Alas Kaki (Sepatu Sunyi)","name":"👣 Langkah Bayangan Kuno","statType":"dodge","statGain":5,"goldCost":0,"slot":"sepatu","requirements":[{"name":"Serpihan Zirah Kuno","amount":5},{"name":"Kain Kafan Kuno","amount":2}]},
        {"id":"assassin_28","job":"assassin","group":"5. Alas Kaki (Sepatu Sunyi)","name":"❄️ Glacial Mist Mirage Boots","statType":"dodge","statGain":7,"goldCost":0,"slot":"sepatu","requirements":[{"name":"Pecahan Es Abadi","amount":5},{"name":"Esensi Jiwa","amount":2}]},
        {"id":"assassin_29","job":"assassin","group":"5. Alas Kaki (Sepatu Sunyi)","name":"🔥 Boots Kerak Magma","statType":"dodge","statGain":9,"goldCost":0,"slot":"sepatu","requirements":[{"name":"Batu Bara Neraka","amount":6},{"name":"Batu Obsidian","amount":3}]},
        {"id":"assassin_30","job":"assassin","group":"5. Alas Kaki (Sepatu Sunyi)","name":"🔥 Hellfire Shadow Stalkers","statType":"dodge","statGain":12,"goldCost":0,"slot":"sepatu","requirements":[{"name":"Inti Api Naga","amount":2},{"name":"Titanium Ingot","amount":3}]},
        {"id":"assassin_31","job":"assassin","group":"6. Pelindung Tangan (Sarung Tangan / Cakar)","name":"Mittens Kain Tipis","statType":"atk","statGain":2,"goldCost":0,"slot":"sarung_tangan","requirements":[{"name":"Sutra Laba-Laba","amount":4},{"name":"Lendir Slime","amount":4}]},
        {"id":"assassin_32","job":"assassin","group":"6. Pelindung Tangan (Sarung Tangan / Cakar)","name":"🥊 Cakar Kulit Goblin","statType":"atk","statGain":6,"goldCost":0,"slot":"sarung_tangan","requirements":[{"name":"Telinga Goblin","amount":4},{"name":"Copper Ingot","amount":1}]},
        {"id":"assassin_33","job":"assassin","group":"6. Pelindung Tangan (Sarung Tangan / Cakar)","name":"⏳ Sarung Tangan Algojo Kuno","statType":"atk","statGain":14,"goldCost":0,"slot":"sarung_tangan","requirements":[{"name":"Serpihan Zirah Kuno","amount":5},{"name":"Iron Ingot","amount":2}]},
        {"id":"assassin_34","job":"assassin","group":"6. Pelindung Tangan (Sarung Tangan / Cakar)","name":"❄️ Frostbite Bone Bracers","statType":"atk","statGain":25,"goldCost":0,"slot":"sarung_tangan","requirements":[{"name":"Esensi Jiwa","amount":5},{"name":"Silver Ingot","amount":2}]},
        {"id":"assassin_35","job":"assassin","group":"6. Pelindung Tangan (Sarung Tangan / Cakar)","name":"🌋 Magma Grip Gauntlets","statType":"atk","statGain":45,"goldCost":0,"slot":"sarung_tangan","requirements":[{"name":"Batu Obsidian","amount":6},{"name":"Gold Ingot","amount":3}]},
        {"id":"assassin_36","job":"assassin","group":"6. Pelindung Tangan (Sarung Tangan / Cakar)","name":"🔥 Eclipse Dragon Claws","statType":"atk","statGain":75,"goldCost":0,"slot":"sarung_tangan","requirements":[{"name":"Inti Api Naga","amount":2},{"name":"Mithril Ingot","amount":2}]},
        {"id":"assassin_37","job":"assassin","group":"7. Aksesoris Leher (Jimat Kutukan)","name":"Tetesan Inti Slime Hitam","statType":"maxHp","statGain":20,"goldCost":0,"slot":"amulet","requirements":[{"name":"Lendir Slime","amount":4},{"name":"Akar Beracun","amount":4}]},
        {"id":"assassin_38","job":"assassin","group":"7. Aksesoris Leher (Jimat Kutukan)","name":"🦴 Taring Kalung Serigala","statType":"maxHp","statGain":75,"goldCost":0,"slot":"amulet","requirements":[{"name":"Kulit Serigala","amount":5},{"name":"Telinga Goblin","amount":5}]},
        {"id":"assassin_39","job":"assassin","group":"7. Aksesoris Leher (Jimat Kutukan)","name":"⏳ Belenggu Mumi Terkutuk","statType":"maxHp","statGain":200,"goldCost":0,"slot":"amulet","requirements":[{"name":"Kain Kafan Kuno","amount":5},{"name":"Serpihan Zirah Kuno","amount":4}]},
        {"id":"assassin_40","job":"assassin","group":"7. Aksesoris Leher (Jimat Kutukan)","name":"❄️ Heart of Cursed Ice Golem","statType":"maxHp","statGain":450,"goldCost":0,"slot":"amulet","requirements":[{"name":"Pecahan Es Abadi","amount":5},{"name":"Esensi Jiwa","amount":3}]},
        {"id":"assassin_41","job":"assassin","group":"7. Aksesoris Leher (Jimat Kutukan)","name":"🔥 Jimat Bara Neraka","statType":"maxHp","statGain":900,"goldCost":0,"slot":"amulet","requirements":[{"name":"Batu Bara Neraka","amount":6},{"name":"Batu Obsidian","amount":4}]},
        {"id":"assassin_42","job":"assassin","group":"7. Aksesoris Leher (Jimat Kutukan)","name":"🩸 Ashen Dragon Bloodline Artifact","statType":"maxHp","statGain":1600,"goldCost":0,"slot":"amulet","requirements":[{"name":"Inti Api Naga","amount":2},{"name":"Gold Ingot","amount":4}]},
        {"id":"assassin_61","job":"assassin","group":"9. Relik Drop Langka","name":"Belati Kutukan","statType":"atk","statGain":35,"goldCost":0,"slot":"senjata","requirements":[{"name":"Jimat Kutukan","amount":1},{"name":"Iron Ingot","amount":3}]},
        {"id":"assassin_62","job":"assassin","group":"9. Relik Drop Langka","name":"Mantel Mahkota Tulang","statType":"def","statGain":25,"goldCost":0,"slot":"zirah","requirements":[{"name":"Mahkota Tulang","amount":1},{"name":"Kayu Balsa","amount":4}]},
        {"id":"assassin_63","job":"assassin","group":"9. Relik Drop Langka","name":"Sarung Tangan Panglima","statType":"atk","statGain":30,"goldCost":0,"slot":"sarung_tangan","requirements":[{"name":"Taring Panglima","amount":1},{"name":"Gold Ingot","amount":2}]},
        {"id":"assassin_64","job":"assassin","group":"9. Relik Drop Langka","name":"Topeng Tengkorak Orc","statType":"def","statGain":20,"goldCost":0,"slot":"helm","requirements":[{"name":"Tengkorak Orc","amount":1},{"name":"Silver Ingot","amount":2}]},
        {"id":"assassin_65","job":"assassin","group":"9. Relik Drop Langka","name":"Toxin Blade","statType":"atk","statGain":28,"goldCost":0,"slot":"senjata","requirements":[{"name":"Kantung Racun","amount":1},{"name":"Copper Ingot","amount":3}]},
        {"id":"assassin_66","job":"assassin","group":"9. Relik Drop Langka","name":"Dagger Cakar Kosmik","statType":"atk","statGain":45,"goldCost":0,"slot":"senjata","requirements":[{"name":"Cakar Kosmik","amount":1},{"name":"Mithril Ingot","amount":3}]},
        {"id":"universal_amulet","job":"","group":"Peralatan Universal","name":"Jimat Esensi Universal","statType":"maxHp","statGain":20,"goldCost":120,"slot":"amulet","requirements":[{"name":"Esensi Universal","amount":12}]}
    ];
    const smelting = [
    {
        "id": "copper_ingot",
        "input": "Copper Ore",
        "amount": 3,
        "output": "Copper Ingot",
        "goldCost": 30
    },
    {
        "id": "iron_ingot",
        "input": "Iron Ore",
        "amount": 3,
        "output": "Iron Ingot",
        "goldCost": 50
    },
    {
        "id": "silver_ingot",
        "input": "Silver Ore",
        "amount": 3,
        "output": "Silver Ingot",
        "goldCost": 90
    },
    {
        "id": "gold_ingot",
        "input": "Gold Ore",
        "amount": 3,
        "output": "Gold Ingot",
        "goldCost": 150
    },
    {
        "id": "titanium_ingot",
        "input": "Titanium Ore",
        "amount": 3,
        "output": "Titanium Ingot",
        "goldCost": 250
    },
    {
        "id": "mithril_ingot",
        "input": "Mithril Ore",
        "amount": 3,
        "output": "Mithril Ingot",
        "goldCost": 400
    }
];
    // One-way conversion of inventory drop stacks, never equipped items.
    const conversions = {
    "Lendir Slime": {
        "rarity": "common",
        "yield": 1,
        "goldCost": 5
    },
    "Inti Air Kusam": {
        "rarity": "rare",
        "yield": 3,
        "goldCost": 5
    },
    "Sayap Kelelawar": {
        "rarity": "common",
        "yield": 1,
        "goldCost": 5
    },
    "Taring Kecil": {
        "rarity": "common",
        "yield": 1,
        "goldCost": 5
    },
    "Sutra Laba-Laba": {
        "rarity": "common",
        "yield": 1,
        "goldCost": 5
    },
    "Kantung Racun": {
        "rarity": "rare",
        "yield": 3,
        "goldCost": 5
    },
    "Akar Beracun": {
        "rarity": "common",
        "yield": 1,
        "goldCost": 5
    },
    "Benih Pemakan Daging": {
        "rarity": "rare",
        "yield": 3,
        "goldCost": 5
    },
    "Inti Slime Raja": {
        "rarity": "epic",
        "yield": 8,
        "goldCost": 25
    },
    "Mahkota Lendir": {
        "rarity": "rare",
        "yield": 3,
        "goldCost": 13
    },
    "Telinga Goblin": {
        "rarity": "common",
        "yield": 1,
        "goldCost": 5
    },
    "Belati Berkarat": {
        "rarity": "common",
        "yield": 1,
        "goldCost": 5
    },
    "Kulit Serigala": {
        "rarity": "common",
        "yield": 1,
        "goldCost": 5
    },
    "Cakar Tajam": {
        "rarity": "rare",
        "yield": 3,
        "goldCost": 7
    },
    "Bijih Besi": {
        "rarity": "rare",
        "yield": 3,
        "goldCost": 5
    },
    "Tengkorak Orc": {
        "rarity": "rare",
        "yield": 3,
        "goldCost": 8
    },
    "Sengat Kristal": {
        "rarity": "rare",
        "yield": 3,
        "goldCost": 9
    },
    "Karapas Keras": {
        "rarity": "rare",
        "yield": 3,
        "goldCost": 10
    },
    "Jantung Orc": {
        "rarity": "rare",
        "yield": 3,
        "goldCost": 15
    },
    "Taring Panglima": {
        "rarity": "rare",
        "yield": 3,
        "goldCost": 14
    },
    "Kain Kafan Kuno": {
        "rarity": "rare",
        "yield": 3,
        "goldCost": 12
    },
    "Jimat Kutukan": {
        "rarity": "epic",
        "yield": 8,
        "goldCost": 30
    },
    "Pecahan Granit": {
        "rarity": "rare",
        "yield": 3,
        "goldCost": 13
    },
    "Mata Ruby": {
        "rarity": "rare",
        "yield": 3,
        "goldCost": 20
    },
    "Serpihan Zirah Kuno": {
        "rarity": "epic",
        "yield": 8,
        "goldCost": 45
    },
    "Pedang Jiwa Patah": {
        "rarity": "rare",
        "yield": 3,
        "goldCost": 18
    },
    "Mahkota Tulang": {
        "rarity": "rare",
        "yield": 3,
        "goldCost": 23
    },
    "Debu Jiwa Kuno": {
        "rarity": "rare",
        "yield": 3,
        "goldCost": 28
    },
    "Bulu Yeti Tebal": {
        "rarity": "common",
        "yield": 1,
        "goldCost": 5
    },
    "Tanduk Es": {
        "rarity": "rare",
        "yield": 3,
        "goldCost": 22
    },
    "Pecahan Es Abadi": {
        "rarity": "rare",
        "yield": 3,
        "goldCost": 30
    },
    "Tongkat Beku": {
        "rarity": "rare",
        "yield": 3,
        "goldCost": 38
    },
    "Esensi Jiwa": {
        "rarity": "epic",
        "yield": 8,
        "goldCost": 55
    },
    "Jubah Transparan": {
        "rarity": "epic",
        "yield": 8,
        "goldCost": 63
    },
    "Jantung Es Abadi": {
        "rarity": "epic",
        "yield": 8,
        "goldCost": 75
    },
    "Kristal Frostbite": {
        "rarity": "epic",
        "yield": 8,
        "goldCost": 70
    },
    "Batu Bara Neraka": {
        "rarity": "rare",
        "yield": 3,
        "goldCost": 25
    },
    "Tanduk Iblis Api": {
        "rarity": "rare",
        "yield": 3,
        "goldCost": 38
    },
    "Batu Obsidian": {
        "rarity": "epic",
        "yield": 8,
        "goldCost": 88
    },
    "Inti Magma": {
        "rarity": "epic",
        "yield": 8,
        "goldCost": 100
    },
    "Inti Api Naga": {
        "rarity": "legendary",
        "yield": 20,
        "goldCost": 300
    },
    "Sisik Naga Merah": {
        "rarity": "rare",
        "yield": 3,
        "goldCost": 50
    },
    "Mata Naga": {
        "rarity": "epic",
        "yield": 8,
        "goldCost": 125
    },
    "Esensi Gelap": {
        "rarity": "epic",
        "yield": 8,
        "goldCost": 113
    },
    "Cakar Kosmik": {
        "rarity": "epic",
        "yield": 8,
        "goldCost": 120
    },
    "Pecahan Bintang": {
        "rarity": "rare",
        "yield": 3,
        "goldCost": 55
    },
    "Baja Hitam": {
        "rarity": "rare",
        "yield": 3,
        "goldCost": 63
    },
    "Inti Kekosongan": {
        "rarity": "legendary",
        "yield": 20,
        "goldCost": 375
    },
    "Mahkota Bayangan": {
        "rarity": "legendary",
        "yield": 20,
        "goldCost": 500
    }
};
    for (const recipe of recipes) recipe.image ??= null;
    const api = { recipes, smelting, conversions, universalMaterial: 'Esensi Universal' };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    else root.CraftingData = api;
})(typeof window === 'undefined' ? globalThis : window);
