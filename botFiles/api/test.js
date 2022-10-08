const express = require("express");
const router = express.Router();

// const nrouter = (client) => {
//     return
// };

router.get("/", (req, res) => {
    res.send(client.id);
});
module.exports = router;