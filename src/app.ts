import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import morgan from "morgan";
import formidable from "formidable";

// @ts-ignore
import gTTS from "gtts";

import { randomUUID } from "crypto";
import path from "path";

import { NODE_ENV } from "./utils/config";
import { existsSync, readFileSync } from "fs";
import mime from "mime";
import { nextTick } from "process";
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
    res.cookie("token", randomUUID(), {
        sameSite: true,
        httpOnly: true,
        maxAge: 900000,
    });
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
        filename: (name, ext) => randomUUID() + ext,
        filter: ({ mimetype }) => {
            return (
                mimetype?.includes("image") ||
                mimetype?.includes("audio") ||
                mimetype?.includes("text") ||
                mimetype?.includes("video") ||
                false
            );
        },
    });

    form.parse(req, (err, fields, { my_file }) => {
        if (err) {
            next(err);
            return;
        }
        if (my_file === undefined) {
            res.status(400);
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

app.post("/text_file_to_audio", (req, res, next) => {
    if (req.body.file_path === undefined) {
        res.status(400);
        res.json({
            error: "File path to convert not provided",
        });
        return;
    }

    const file_path = path.join("assets", req.body.file_path?.toString());

    if (!existsSync(file_path)) {
        res.status(400);
        res.json({
            error: "File does not exist",
        });
    }

    const text_rgx = /\.txt$/;
    if (!text_rgx.test(req.body.file_path)) {
        res.status(400);
        res.json({
            error: "Provided file is not a text file",
        });
    }

    const audio_file_name = randomUUID() + ".mp3";

    // no types exist for gtts library
    // @ts-ignore
    const gtts = new gTTS(readFileSync(file_path).toString(), "en");
    // @ts-ignore
    gtts.save(`assets/public/upload/${audio_file_name}`, (err, result) => {
        if (err) {
            console.error(err);
        }
        res.status(202);
        res.json({
            status: "OK",
            message: "Text to Speech Converted",
            audio_file_path: `public/upload/${audio_file_name}`,
        });
        return;
    });
});

export default app;
