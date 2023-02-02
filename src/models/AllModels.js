// @ src/models/AllModels.js
import { Sequelize, Model, DataTypes } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

const sequelize = new Sequelize(process.env.POSTGRES_URL, {
    dialect: 'postgres',
    logging: false,
  });
  
  class Owner extends Model {}
  Owner.init({
    name: DataTypes.STRING,
    balance: DataTypes.DECIMAL,
    currencyName: DataTypes.STRING,
    active: DataTypes.BOOLEAN,
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  }, {
    sequelize,
    modelName: 'owner',
    uniqueKeys: {
      unique_name_balance_currency: {
        fields: ['name',]
      }
    }
  });
  
  class Store extends Model {}
  Store.init({
    name: DataTypes.STRING,
    ownerName: DataTypes.STRING,
    balance: DataTypes.DECIMAL,
    currencyName: DataTypes.STRING,
    enabled: DataTypes.BOOLEAN,
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
    { sequelize, modelName: 'store',
    uniqueKeys: { 
      unique_name_ownerName: {
        fields: ['name', 'ownerName']
      }
    }
  });
  
  class Offer extends Model {}
  Offer.init({
    itemName: DataTypes.STRING,
    buying: DataTypes.BOOLEAN,
    price: DataTypes.DECIMAL,
    quantity: DataTypes.INTEGER,
    limit: DataTypes.INTEGER,
    maxNumWanted: DataTypes.INTEGER,
    minDurability: DataTypes.INTEGER,
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
    deleted: DataTypes.BOOLEAN,
  }, { sequelize, modelName: 'offer',
      uniqueKeys: { 
        unique_itemName_buying_price_quantity_limit_maxNumWanted_minDurability: {
          fields: ['itemName', 'buying', 'price', 'quantity', 'limit', 'maxNumWanted', 'minDurability']
        }
      }
 });

 // Define the PriceHistory model based on the Offer model
  class PriceHistory extends Model {}
  PriceHistory.init({
    price: DataTypes.DECIMAL,
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  }, { sequelize, modelName: 'priceHistory' });



  // Relations
  // A store can have many offers
  Store.hasMany(Offer, { foreignKey: 'storeId', as: 'offers' });
  // An offer can only have one store
  Offer.belongsTo(Store, { foreignKey: 'storeId', as: 'store' });
  // A store can have only one owner
  Store.belongsTo(Owner, { foreignKey: 'ownerId', as: 'owner' });
  // An owner can have many stores
  Owner.hasMany(Store, { foreignKey: 'ownerId', as: 'stores' });
  // Owner can have many offers
  Owner.hasMany(Offer, { foreignKey: 'ownerId', as: 'offers' });
  // An offer can only have one owner
  Offer.belongsTo(Owner, { foreignKey: 'ownerId', as: 'owner' });
  // An offer can have many price history
  Offer.hasMany(PriceHistory, { foreignKey: 'offerId', as: 'priceHistory' });
  


  class Item extends Model {}
  Item.init({
      name: DataTypes.STRING,
      nameID: {
        type: DataTypes.STRING,
        unique: true // Prevents duplicate names but new to add error handling
      },
      tag: DataTypes.BOOLEAN,
      price: DataTypes.DECIMAL,
      imageFile: DataTypes.STRING,
      xPos: DataTypes.DECIMAL,
      yPos: DataTypes.DECIMAL,
      filter: DataTypes.STRING,
    }, { sequelize, modelName: 'item' });
    
// Relations
// An item can have many offers
Item.hasMany(Offer, { foreignKey: 'itemId', as: 'offers' });
Item.hasMany(PriceHistory, { foreignKey: 'itemId', as: 'priceHistory' });
// An offer can only have one item
Offer.belongsTo(Item, { foreignKey: 'itemId', as: 'item' });

//////////////////////// CraftingTable Model ////////////////////////

class CraftingTable extends Model {}
CraftingTable.init({
    name: {
      type: DataTypes.STRING,
      unique: true // Prevents duplicate names but need to add error handling
    },
    nameID: {
      type: DataTypes.STRING,
      unique: true // Prevents duplicate names but need to add error handling
    },
    upgradeModuleType: DataTypes.STRING,
    hidden: DataTypes.BOOLEAN,
    imageFile: DataTypes.STRING,
    xPos: DataTypes.DECIMAL,
    yPos: DataTypes.DECIMAL,
  }, { sequelize, modelName: 'craftingtable' });

// Relations
// A crafting table can have many items
CraftingTable.hasMany(Item, { foreignKey: 'craftingTableId', as: 'items' });
// An item can only have one crafting table
Item.belongsTo(CraftingTable, { foreignKey: 'craftingTableId', as: 'craftingTable' });

// Function to sync when needed
async function sync(force) {
  try {
    const options = {};
    if (force) {
      options.force = true;
    }
    const result = await sequelize.sync(options);
    // If successful, log the result, log how many models were synced
    console.log(`Success sync`);
  } catch (error) {
    console.log(`Error syncing`);
    console.error(error);
  }
}

// Check if the force option is passed
if (process.argv.includes('--force')) {
  console.log('Force sync');
  sync(true);
} else if (process.env.SYNC_RAN === '0') {
  console.log(`SYNCRANC = ${process.env.SYNC_RAN}, syncing...`);
  sync(false);
  // Write in the dotenv file that the sync has ran
  process.env.SYNC_RAN = '1';
} else  {
  console.log(`SYNCRANC = ${process.env.SYNC_RAN}, not syncing...`);
}

  
  export { Owner, Store, Offer, Item, CraftingTable, PriceHistory};