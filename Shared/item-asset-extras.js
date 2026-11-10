(function (root) {
    // Presentation identities audited from Toko/Toko.html and Hero/hero.js / storage.js.
    // No prices, stats, rewards or save fields are defined here.
    const rows = [
    {
        "key": "buff_atk",
        "name": "💊 Ramuan Amarah (ATK)",
        "category": "potions/buff"
    },
    {
        "key": "buff_magic",
        "name": "🔮 Ramuan Mana (Magic)",
        "category": "potions/buff"
    },
    {
        "key": "buff_aspd",
        "name": "⚡ Ramuan Angin (Atk Speed)",
        "category": "potions/buff"
    },
    {
        "key": "buff_def",
        "name": "🛡️ Ramuan Kulit Batu (DEF)",
        "category": "potions/buff"
    },
    {
        "key": "buff_dodge",
        "name": "💨 Ramuan Ilusi (Dodge)",
        "category": "potions/buff"
    },
    {
        "key": "pickaxe_copper",
        "name": "⛏️ Beliung Tembaga",
        "category": "tools/pickaxes"
    },
    {
        "key": "pickaxe_iron",
        "name": "⛏️ Beliung Besi",
        "category": "tools/pickaxes"
    },
    {
        "key": "pickaxe_silver",
        "name": "⛏️ Beliung Perak",
        "category": "tools/pickaxes"
    },
    {
        "key": "pickaxe_gold",
        "name": "⛏️ Beliung Emas",
        "category": "tools/pickaxes"
    },
    {
        "key": "pickaxe_titanium",
        "name": "⛏️ Beliung Titanium",
        "category": "tools/pickaxes"
    },
    {
        "key": "pickaxe_mithril",
        "name": "⛏️ Beliung Mithril (BOSS)",
        "category": "tools/pickaxes"
    },
    {
        "key": "axe_balsa",
        "name": "🪓 Kapak Kayu Balsa",
        "category": "tools/axes"
    },
    {
        "key": "axe_pinus",
        "name": "🪓 Kapak Kayu Pinus",
        "category": "tools/axes"
    },
    {
        "key": "axe_oak",
        "name": "🪓 Kapak Kayu Oak",
        "category": "tools/axes"
    },
    {
        "key": "axe_ironwood",
        "name": "🪓 Kapak Ironwood",
        "category": "tools/axes"
    },
    {
        "key": "axe_mahoni",
        "name": "🪓 Kapak Kayu Mahoni",
        "category": "tools/axes"
    },
    {
        "key": "axe_elderwood",
        "name": "🪓 Kapak Elderwood (BOSS)",
        "category": "tools/axes"
    },
    {
        "key": "starter_pickaxe",
        "name": "Beliung Pemula",
        "category": "tools/pickaxes",
        "slot": null
    },
    {
        "key": "starter_axe",
        "name": "Kapak Berkarat",
        "category": "tools/axes",
        "slot": null
    },
    {
        "key": "starter_armor",
        "name": "Pakaian Kain",
        "category": "armor/universal",
        "slot": "zirah"
    },
    {
        "key": "starter_boots",
        "name": "Sandal Usang",
        "category": "boots/universal",
        "slot": "sepatu"
    }
];
    if (typeof module !== 'undefined' && module.exports) module.exports = rows;
    else root.GameItemAssetExtras = rows;
})(typeof window === 'undefined' ? globalThis : window);
