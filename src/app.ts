import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import morgan from "morgan";

import crypto from "crypto";

import { NODE_ENV } from "./utils/config";

// add automatic error handling
require("express-async-errors");

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

// serve the assets directory(routes to /public/*)
app.use(express.static("assets"));

app.post("/create_new_storage", (req, res) => {
    // TODO check for existing cookies in response
    // TODO add database integration
    res.cookie("token", crypto.randomUUID());
    res.status(200);
    res.json({
        status: "OK",
        message: "Storage Created Successfully",
    });
});

export default app;
