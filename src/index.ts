import express from "express";
import cors from "cors";
import morgan from "morgan";

import { PORT, NODE_ENV } from "./utils/config";

require("express-async-errors");

const port = PORT || 3000;

const app = express();

app.use(cors());
if (NODE_ENV === "dev") {
    app.use(morgan("dev"));
}

app.get("/hello", (req, res) => {
    res.send("Hello World");
});

app.listen(port, () => {
    console.log(`Express is running on port ${port}`);
});
