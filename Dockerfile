FROM node
WORKDIR /
COPY package.json ./
RUN npm install
COPY . ./
COPY .env ./
CMD ["sleep", "15"]
CMD node ./index.js
EXPOSE 4000 27017