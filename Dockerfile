FROM node:18

COPY package*.json ./

RUN npm install
# Bundle app source
COPY . .

# CMD a curl to postgres_container on port 5432 and then run the app
CMD ["npm", "start"]