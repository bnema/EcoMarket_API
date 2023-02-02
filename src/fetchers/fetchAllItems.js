import dotenv from 'dotenv';
dotenv.config();
import { Sequelize, Model, DataTypes } from 'sequelize';
import fetch from 'node-fetch';
const sequelize = new Sequelize(process.env.POSTGRES_URL, {
  dialect: 'postgres',
  logging: false,

});
// Import my model 
import * as models from '../models/AllModels.js';
const { Item, Offer, CraftingTable,PriceHistory } = models;

// Import the list of items
import { items } from '../assets/data/items.js';
// Import the list of crafting tables
import { craftingTables } from '../assets/data/craftingTables.js';

// Add the items to the database
async function fetchItems() {
    Item.bulkCreate(items, { ignoreDuplicates: false, updateOnDuplicate: ['updatedAt', 'craftingTableId'] }
      ).then(() => {
          console.log('Items added to the database');
      }
      ).catch((err) => {
          console.log(err);
          // if duplicate, then ignore
          if (err.name === 'SequelizeUniqueConstraintError') {
              return;
          }
      }
      );
}

// Add the crafting tables to the database
// update on duplicate the field updatedAt
function fetchCraftingTables() {
   CraftingTable.bulkCreate(craftingTables, { ignoreDuplicates: false, updateOnDuplicate: ['updatedAt'] }

        ).then(() => {
            console.log('Crafting tables added to the database');
        }).catch((err) => {
            console.log(err);
            // if duplicate, then ignore
            if (err.name === 'SequelizeUniqueConstraintError') {
                return;
            }
        });
      }

 async function linkItems() {
  const items = await Item.findAll();
  const offers = await Offer.findAll();
  const priceHistories = await PriceHistory.findAll();
  // add the item.id to the table offer (offer.itemId)
  for (const item of items) {
    for (const offer of offers) {
      if (item.name === offer.itemName) {
        offer.itemId = item.id;
        await offer.save();
      }
      for (const priceHistory of priceHistories) {
        if (priceHistory.offerId === offer.id) {
          priceHistory.itemId = item.id;
     // add also the item.id to the table priceHistory (priceHistory.itemId)
          await priceHistory.save();
        }
      }
    }

  }
  console.log('Items linked to offers');
 }

fetchItems();
fetchCraftingTables();
linkItems();

export { fetchItems,fetchCraftingTables,linkItems };