#!/usr/bin/env node

const app = require("./app")

require("dotenv").config();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () =>{
    console.log(`Join to the website: http://localhost:${PORT}`);
});
