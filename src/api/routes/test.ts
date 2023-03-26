import express = require("express");
const router = express.Router();

export default function (client) {
    return ( 
        router.get("/", (req, res) => {
            res.send(client);
        })
    );
}