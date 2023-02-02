# Eco Market API

This project is an API who use the mod Eco Live Data Exporter to read  data from the in game Stores and serve it to the client as a REST API.


## Features
- Endpoints for each data model (Owners, Stores, Offers, Items, Crafting Tables, Price History)
- Caching the json files to redis (with short TTL) to avoid requesting the files too often
- Mapping the data to Sequelize models
- Pushing the data to a Postgres database
- Logging of incoming requests


## Installation

- Install the mod [Eco Live Data Exporter](https://mod.io/g/eco/m/live-data-exporter) on your Eco server 

- Check if the mod is working by requesting the json file from your server

`https://YOURSERVERIP/data/Stores.json`


- Install dependencies

```bash
npm install
```

- Setup your environment variables in a .env file (see .env.example)


- In addition, a Dockerfile is provided to build the image and deploy it easily.

```bash
FROM node:18

COPY package*.json ./

RUN npm install
# Bundle app source
COPY . .

# CMD a curl to postgres_container on port 5432 and then run the app
CMD ["npm", "start"]

```

## TODO

- Map all existing items to the Json file (pictures, descriptions, etc.)
- Fetch the other data models (Crafting Tables, etc.)
- Price History logs (not working yet)
- Crafting cost calculation


## License
Apache 2.0 License

Feel free to contribute to this project or fork it.
