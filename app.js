// This a NODE.JS API that is used to obtain JSON files from the server and store them in the redis database
// The API also distributes information to the client side application

// Importing the required modules
import express from 'express';
const app = express();
import path from 'path';
import fs from 'fs';
import Sequelize from 'sequelize';
import router from './src/routes.js';
import cors from 'cors';

// Print REDIS_HOST & POSTGRES_URL
console.log(`Found REDIS_HOST: ${process.env.REDIS_HOST} and POSTGRES_URL: ${process.env.POSTGRES_URL}`);
// dotenv 
import dotenv from 'dotenv';
dotenv.config();
// Importing my modules
import fetchData from './src/fetchers/fetchStores.js';
// use cors config from dotenv
app.use(cors({
    origin: process.env.CORS_ORIGIN
}));

// Sequelize connection
const sequelize = new Sequelize(process.env.POSTGRES_URL, {
    dialect: 'postgres',
    pool: {
        max: 1,
        min: 0,
        acquire: 30000,
        idle: 10000
    },
});

    // test postgres connection
    try {
        await sequelize.authenticate();
        console.log('Postgres connected...');
        // release the connection
        await sequelize.close();
    } catch (err) {
        console.log('Postgres connection failed...');
        // console log the error
        console.log(err);
    }
    //  Console log everytime a request is made

app.use(express.json());

app.use(router);

// Starting the server


const port = process.env.EXPRESS_PORT || 4444;
app.listen(port, async () => {
    console.log(`Listening on port ${port}...`);
  });