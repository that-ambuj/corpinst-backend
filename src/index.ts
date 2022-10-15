import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import morgan from "morgan";

import { PORT, NODE_ENV } from "./utils/config";

// add automatic error handling
require("express-async-errors");

const port = PORT || 3000;

const app = express();

// enable json and cors
app.use(cors());
app.use(express.json());
// enable logging in dev environment
if (NODE_ENV === "dev") {
    app.use(morgan("dev"));
}

// enable cookie parser
app.use(cookieParser());

app.get("/hello", (req, res) => {
    res.send("Hello World");
});

app.listen(port, () => {
    console.log(`Express is running on port ${port}`);
});
