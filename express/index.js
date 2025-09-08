
const express = require("express");
require("dotenv").config();
const passport = require('passport');
const bodyParser = require('body-parser');
const noc = require('no-console');
const morgan = require('morgan')
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require("path");
const app = express();

// Bootstrap schemas, models
require("./bootstrap");

// App configuration
noc(app);
app.use(cookieParser());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(passport.initialize());
app.use(cors());
app.use(morgan(':method :url :status :user-agent - :response-time ms'));

app.use(express.static(path.join(__dirname, "public")));
app.use("/.well-known", express.static(path.join(__dirname, ".well-known")));

//Database connection
require('./db');
//Passport configuration
require('./passport')(passport);
//Routes configuration
require("./../src/routes")(app);

app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});
module.exports = app;