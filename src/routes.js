import express from 'express';
const router = express.Router();
// dotenv 
import dotenv from 'dotenv';
dotenv.config();
// Create an array that contains our AUTH_TOKEN1,2,3 etc values from .env
const tokens = [
    // Display the array of tokens as a string
    process.env.AUTH_TOKEN1,
    process.env.AUTH_TOKEN2,
    process.env.AUTH_TOKEN3,
  ];




// Load your models
import { Owner, Store, Offer,Item, CraftingTable,PriceHistory } from './models/AllModels.js';
// Define dynamic routes for each model
router.use((req, res, next) => {
    console.log(`${req.method} request for ${req.url}`);
    next();
}
);
// Create router.get / 
router.get('/', (req, res) => {
    // Send the index.html file
    res.sendFile('index.html', { root: './src/assets' });
});


// Owners
router.get('/owners', async (req, res) => {
  // Retrieve all owners from the database
  try {
    const owners = await Owner.findAll();
    res.json(owners);
  } catch (err) {
    res.status(500).send(err);
  }
});

router.get('/owners/:id', async (req, res) => {
  // Retrieve a specific owner by ID
  try {
    const owner = await Owner.findByPk(req.params.id);
    res.json(owner);
  } catch (err) {
    res.status(500).send(err);
  }
});

// Stores
router.get('/stores', async (req, res) => {
  // Retrieve all stores from the database
  try {
    const stores = await Store.findAll();
    res.json(stores);
  } catch (err) {
    res.status(500).send(err);
  }
});

router.get('/stores/:id', async (req, res) => {
  // Retrieve a specific store by ID
  try {
    const store = await Store.findByPk(req.params.id);
    res.json(store);
  } catch (err) {
    res.status(500).send(err);
  }
});

// Offers
router.get('/offers', async (req, res) => {
  // Retrieve all offers from the database
  try {
    const offers = await Offer.findAll();
    res.json(offers);
  } catch (err) {
    res.status(500).send(err);
  }
});

router.get('/offers/:id', async (req, res) => {
  // Retrieve a specific offer by ID
  try {
    const offer = await Offer.findByPk(req.params.id);
    res.json(offer);
  } catch (err) {
    res.status(500).send(err);
  }
});

// Items
router.get('/items', async (req, res) => {
  // Retrieve all items from the database
  try {
    const items = await Item.findAll();
    res.json(items);
  } catch (err) {
    res.status(500).send(err);
  }
});

router.get('/items/:id', async (req, res) => {
    // Retrieve a specific item by ID
    try {
        const item = await Item.findByPk(req.params.id);
        res.json(item);
    } catch (err) {
        res.status(500).send(err);
    }
    }
);

// Crafting tables
router.get('/craftingtables', async (req, res) => {
    // Retrieve all crafting tables from the database
    try {
        const craftingTables = await CraftingTable.findAll();
        res.json(craftingTables);
    } catch (err) {
        res.status(500).send(err);
    }
    }
);

router.get('/craftingtables:id', async (req, res) => {
    // Retrieve a specific crafting table by ID
    try {
        const craftingTable = await CraftingTable.findByPk(req.params.id);
        res.json(craftingTable);
    } catch (err) {
        res.status(500).send
    }
    }
);

// Price history
router.get('/pricehistory', async (req, res) => {
    // Retrieve all price history from the database
    try {
        const priceHistory = await PriceHistory.findAll();
        res.json(priceHistory);
    } catch (err) {
        res.status(500).send
    }
    }
);

router.get('/pricehistory:id', async (req, res) => {
    // Retrieve a specific price history by the offer ID
    try {
        const priceHistory = await PriceHistory.offerId(req.params.id);
        res.json(priceHistory);
    } catch (err) {
        res.status(500).send
    }
    }
);



// export default router;
export default router;