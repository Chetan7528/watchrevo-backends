'use strict';
const path = require("path");


module.exports = (app) => {
    app.use('/v1/api', require('./v1_routes'));
    app.get('/', (req, res) => res.status(200).json({ status: "OK" }));
    app.get("/.well-known/assetlinks.json", (req, res) => {
        res.sendFile(path.join(__dirname, ".well-known/assetlinks.json"));
    });
    app.get("/.well-known/apple-app-site-association", (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        // res.sendFile(path.join(__dirname, ".well-known/apple-app-site-association"));
        res.json({
            applinks: {
                apps: [],
                details: [
                    {
                        "appID": "LGR4C68J28.watchrevo.com",
                        paths: ["*"]
                    }
                ]
            }
        });
    });
    app.get("/reffer/:reffercode/:uniquecode", (req, res) => {
        // res.sendFile(path.join(__dirname, "public", "index.html"));
        res.sendFile(path.join(__dirname, "index.html")); // place index.html at project root
    });
    app.get("/reffer", (req, res) => {
        // res.sendFile(path.join(__dirname, "public", "index.html"));
        res.sendFile(path.join(__dirname, "index.html")); // place index.html at project root
    });
};
