const corsOptions = {
  origin: '*',
  credentials: true,
  optionSuccessStatus: 200,
  port: process.env.PORT,
};

require('dotenv').config();

const database = require('./config/databaseConfig');

const express = require("express");
const cors = require("cors");
const bodyParser = require('body-parser');

require('mongodb');

const app = express();

app.use(cors(corsOptions));

app.use(express.json())
app.use(express.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ extended: true }));

async function init() {
    try {
        await database.connect();

        const userService = require('./services/user.service.js');

        app.use('/user', userService);

        app.get('/', (req, res) => {
          res.status(200).json('Welcome to devbook API');
        });

        app.use('*', (req, res) => {
          res.status(404).json({
            success: 'false',
            message: 'Page not found',
            error: {
              statusCode: 404,
              message: 'This route is not defined',
            },
          });
        });
    } catch(err) {
      console.error("Failed to start application", err);
      process.exit(1);
    }
}

init();

module.exports = app;
