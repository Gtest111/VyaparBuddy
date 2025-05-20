const mongoose = require('mongoose');
const dotenv = require('dotenv');
const NameData = require('./models/NameData');

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { 
    useNewUrlParser: true, 
    useUnifiedTopology: true 
})
.then(() => console.log("Connected to MongoDB"))
.catch(err => console.error("Database Connection Error:", err));

// Sample Data
const seedNameData = [
    {
        name: "Linen Shirt",
        captions: [
            "Stay cool and stylish with our linen shirts!",
            "Breezy and comfortable – the perfect linen shirt.",
            "Linen shirts: Effortless elegance for any occasion."
        ],
        hashtags: [
            "#LinenShirt", "#SummerStyle", "#CasualWear",
            "#StayCool", "#EffortlessFashion"
        ]
    },
    {
        name: "Beach",
        captions: [
            "Sun, sand, and sea – the perfect getaway!",
            "Feel the waves, embrace the ocean.",
            "Life’s better at the beach."
        ],
        hashtags: [
            "#BeachVibes", "#OceanLover", "#SunSandSea",
            "#BeachDay", "#TropicalGetaway"
        ]
    },
    {
        name: "Cute",
        captions: [
            "Stay cute, stay confident!",
            "Cutest vibes only!",
            "Being cute never goes out of style."
        ],
        hashtags: [
            "#CuteVibes", "#AdorableLooks", "#CutenessOverload",
            "#BeYourself", "#SweetAndStylish"
        ]
    },
    {
        name: "Football",
        captions: [
            "Game on! Time for some football action.",
            "Eat, sleep, play football, repeat!",
            "Chasing goals on and off the field."
        ],
        hashtags: [
            "#FootballLife", "#GoalTime", "#SoccerLove",
            "#SportsFever", "#GameDay"
        ]
    },
    {
        name: "Gold",
        captions: [
            "Shine bright like gold!",
            "Luxury and elegance in every touch of gold.",
            "Timeless beauty in golden hues."
        ],
        hashtags: [
            "#GoldJewelry", "#LuxuryStyle", "#GoldenGlow",
            "#TimelessBeauty", "#ShineBright"
        ]
    },
    {
        name: "Wedding",
        captions: [
            "A day to remember, a love to cherish forever.",
            "Tying the knot in style!",
            "Happily ever after begins here."
        ],
        hashtags: [
            "#WeddingVibes", "#ForeverLove", "#BrideAndGroom",
            "#WeddingBells", "#HappilyEverAfter"
        ]
    },
    {
        name: "Formal",
        captions: [
            "Dress to impress in timeless formals.",
            "Elegance is an attitude.",
            "Perfectly tailored for success."
        ],
        hashtags: [
            "#FormalWear", "#ClassyLook", "#SuitUp",
            "#EleganceRedefined", "#PowerDressing"
        ]
    },
    {
        name: "Jeans",
        captions: [
            "Denim that never goes out of style!",
            "Find your perfect fit with our jeans collection.",
            "Casual, comfy, and classic – it’s all about jeans!"
        ],
        hashtags: [
            "#DenimStyle", "#CasualWear", "#JeansLover",
            "#ClassicDenim", "#StreetStyle"
        ]
    }
];

module.exports = seedNameData;


// Insert Data Function
const insertData = async () => {
    try {
        // Clear existing data
        await NameData.deleteMany({});
        console.log("Old Name Data Cleared!");

        // Insert New Data
        const newData = await NameData.create(seedNameData);
        console.log("New Name Data Inserted:", newData);

        console.log("Database Seeded Successfully!");
        mongoose.connection.close();
    } catch (error) {
        console.error("Seeding Error:", error);
        mongoose.connection.close();
    }
};

// Run Seed Function
insertData();
