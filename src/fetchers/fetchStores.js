import dotenv from 'dotenv';
dotenv.config();
import { Sequelize, Model, DataTypes } from 'sequelize';
import fetch from 'node-fetch';
// Import redis
import redis from 'redis';

const redisClient = redis.createClient({
  url: process.env.REDIS_URL,
});

const sequelize = new Sequelize(process.env.POSTGRES_URL, {
  dialect: 'postgres',
  pool: {
    max: 100,
    min: 0,
    acquire: 5000,
    idle: 10000,
  },
});

import { Owner, Store, Offer, PriceHistory } from '../models/AllModels.js';
import { fetchItems, fetchCraftingTables, linkItems } from './fetchAllItems.js';

// URL of the data
const storesURL = 'https://game.kepler62.world/data/Stores.json';

const handleError = (error) => {
  // If the error is a SequelizeUniqueConstraintError, then the entry already exists in the database
  if (error.name === 'SequelizeUniqueConstraintError') {
    return;
  }
  // SequelizeValidationError is thrown when the data is not valid
  if (error.name === 'SequelizeValidationError') {
    console.log('Validation error');
  }
  // Sequelize Timeout Error
  if (error.name === 'SequelizeConnectionError') {
    console.log('Connection error');
  }
  if (error.name === 'ConnectionAcquireTimeoutError') {
    console.log('Connection acquire timeout error');
    console.log(error);
  }

  else {
    console.log(error);
  }
};

// try catch await redisClient.connect()
async function connectRedis() {
  if (redisClient.status !== 'ready') {
    try {
      await redisClient.connect();
      console.log('Redis connected');
    } catch (error) {
      console.log(error);
    }
  } else {
    console.log('Redis already connected');
  }
}
await connectRedis();

async function fetchData() {
  try {
    const jsonData = await fetch(storesURL).then((res) => res.json());
    return jsonData;
  } catch (error) {
    if (error) {
      console.log(error);
    }
  } finally { console.log(`Fetched data at ${new Date()}`); }
}
// Add the json to redis with 20 second expiry
async function redisHandler() {
  try {
    const jsonData = await fetchData();
    await redisClient.setEx('stores', 200, JSON.stringify(jsonData));
    // Return the data from redis
    const data = await redisClient.get('stores');
    const dataParsed = JSON.parse(data);
    return dataParsed
  } catch (error) {
    if (error) {
      console.log(error);
    }
  } finally { console.log(`Added data to redis at ${new Date()}`); }
}

// Check if the entry is valid

const entryCheck = store => store.Owner === null || store.Owner === undefined || store.Owner === '' || store.Balance === undefined || store.Balance === null || store.Balance === 0;
// If balance is set to infinity, than means the store is in Barter mode so we set the balance to 999
const entryCheckInfinity = store => store.Balance === 'Infinity' ? store.Balance = 999 : store.Balance;

// Update the database with the data from the JSON
async function createOrUpdateStores() {
  // Get the data from Redis
  const data = await fetchData();
  const stores = data.Stores;
  try {
    // Define the offerPromises variable
    let offerPromises = [];

    // Loop through the stores
    const storePromises = await stores.map(async (store) => {
      // Check if the entry is valid, check for infinity first then check if the entry is valid
      entryCheckInfinity(store);

      const storeObject = {
        name: store.Name,
        ownerName: store.Owner,
        balance: store.Balance,
        currencyName: store.CurrencyName,
        enabled: store.Enabled
      };

      const [storeRecord, created] = await Store.findOrCreate({
        where: { name: store.Name, ownerName: store.Owner },
        defaults: storeObject
      });
      if (!created) {
        // Update the store record if it already exists
        storeRecord.balance = store.Balance;
        storeRecord.currencyName = store.CurrencyName;
        storeRecord.enabled = store.Enabled;
        storeRecord.updatedAt = new Date();
        await storeRecord.save();
      }

      // Loop through the store.Alloffers
      offerPromises = await store.AllOffers.map(async (offer) => {
        
      // Create the offer record
      const offerData = {
        storeId: storeRecord.id,
        itemName: offer.ItemName,
        buying: offer.Buying,
        price: offer.Price,
        quantity: offer.Quantity,
        limit: offer.Limit,
        maxNumWanted: offer.MaxNumWanted,
        minDurability: offer.MinDurability,
        deleted: false,
        updatedAt: new Date()
      };
      // Find or create the offer record
      const [offerRecord, created] = await Offer.findOrCreate({
        where: { itemName: offer.ItemName, buying: offer.Buying },
        defaults: offerData
      });
      
      if (!created) {
        // Update the offer record if it already exists
        offerRecord.price = offer.Price;
        offerRecord.quantity = offer.Quantity;
        offerRecord.limit = offer.Limit;
        offerRecord.maxNumWanted = offer.MaxNumWanted;
        offerRecord.minDurability = offer.MinDurability;
        offerRecord.deleted = false;
        offerRecord.updatedAt = new Date();
        
        // If the price of an offer changed, then update the price history
        if (offerRecord.price !== offer.Price) {
          const priceHistory = await PriceHistory.create({
            offerId: offerRecord.id,
            price: offer.Price,
            updatedAt: new Date()
          });
          console.log(`Price history created for ${offerRecord.itemName} at ${new Date()}`);
        }
        await offerRecord.save();
      }
    });
  });
  // Wait for all the promises to resolve

    await Promise.all(storePromises, offerPromises);


  } catch (error) {
    if (error) {
      handleError(error);
      console.log(error);
    } 
  } finally { 
    console.log(`Updated Store and Offer tables at ${new Date()}`);
    // close the connection
    await sequelize.close();
  }
}

async function createOrUpdateOwners() {
  try {
    // Get all the stores
    const stores = await Store.findAll();
    // Loop through the stores
    const storePromises = stores.map(async (store) => {
      // Check if the owner exists
      const owner = await Owner.findOne({ where: { name: store.ownerName } });
      // If owner is null or undefined, then create the owner
      if (owner === null || owner === undefined) {
        // Create an array of objects representing the owners to insert
        const ownersToInsert = [{ name: store.ownerName }];
        // Insert the owners using bulkCreate
        Owner.bulkCreate(ownersToInsert, { ignoreDuplicates: true });
      }
      // If the owner exists, update the updatedAt field
      if (owner) {
        // Update the owner's updatedAt field
        await Owner.update({ 
          balance: store.balance,
          currencyName: store.currencyName,
          active: true,
          updatedAt: new Date() }, { where: { name: store.ownerName } });
      }
    });
    // Wait for all the promises to resolve
    await Promise.all(storePromises);
  } catch (error) {
    if (error) {
      handleError(error);
      console.log(error);
    }
  } finally {
    console.log(`Updated Owner table at ${new Date()}`);
    // close the connection
    await sequelize.close();
  }
}

// Now that we have everything updated we check the relations between the tables
async function checkRelations() {
  try {
    // Get all the stores
    const stores = await Store.findAll();
    // Loop through the stores
    const storePromises = stores.map(async (store) => {
      entryCheckInfinity(store);
      // Get the owner by store.ownerName
      const owner = await Owner.findOne({ where: { name: store.ownerName } });
      // Add the owner.id to the store.ownerId
      store.ownerId = owner.id;
      // Save the store
      await store.save();

      
      // Get the offers 
      const offers = await Offer.findAll({ where: { storeId: store.id } });
      
      // Loop through the offers
      const offerPromises = offers.map(async (offer) => {
        // Check if the offer already have storeId and ownerId
          // If not, then set them
          offer.storeId = store.id;
          offer.ownerId = owner.id;
          await offer.save();
        
      });
      // Wait for all the promises to resolve
      await Promise.all(offerPromises);
    });
    await Promise.all(storePromises);
  } catch (error) {
    if (error) {
      handleError(error);
    }
  } finally { console.log(`Updated relations between tables at ${new Date()}`);
   }
}


// We want to run the functions in order
async function run() {
  await createOrUpdateStores();
  await createOrUpdateOwners();
  await checkRelations();
  await linkItems();
  // Repeat every 10 seconds
  setTimeout(run, 10000);
}

run();

export default {
  fetchData
}
