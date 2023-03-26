import express = require("express");
const router = express.Router();

module.exports = function (client) {
    return ( 
        router.get("/", (req, res) => {
            res.send(client);
        })
    );
}