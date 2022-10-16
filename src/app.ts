import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import morgan from "morgan";
import formidable from "formidable";

import { randomUUID } from "crypto";

import { NODE_ENV } from "./utils/config";
// TODO add an error handler middleware

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
    res.cookie("token", randomUUID());
    res.status(200);
    return res.json({
        status: "OK",
        message: "Storage Created Successfully",
    });
});

app.post("/upload_file", async (req, res, next) => {
    // TODO add database integration
    const token = req.cookies.token;
    if (token === undefined) {
        res.status(400);
        return res.json({
            error: "Please create a storage before uploading file",
        });
    }

    const form = formidable({
        uploadDir: "assets/public/upload/",
        keepExtensions: true,
        multiples: false,
    });

    form.parse(req, (err, fields, { my_file }) => {
        if (err) {
            next(err);
            return;
        }
        if (my_file === undefined) {
            res.status(401);
            res.json({
                error: "No file provided",
            });
            return;
        }
        // todo add new filename to database and link with user token
        // @ts-ignore wrong type declarations causing issues accessing valid keys
        const newFileName = my_file.newFilename;
        res.status(202);
        res.json({
            status: "OK",
            file_path: `public/upload/${newFileName}`,
        });
        return;
    });
});

export default app;
