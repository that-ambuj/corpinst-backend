import express from "express";

require("express-async-errors");

const port = process.env.PORT || 3000;

const app = express();

app.get("/hello", (req, res) => {
    res.send("Hello World");
});

app.listen(port, () => {
    console.log(`Express is running on port ${port}`);
});
