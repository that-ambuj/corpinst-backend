import express from "express";
import type { Response, Request, NextFunction } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import morgan from "morgan";
import formidable from "formidable";
import mongoose from "mongoose";

// @ts-ignore
import gTTS from "gtts";

import { randomUUID } from "crypto";
import path from "path";
import { exec, execSync } from "child_process";
import { existsSync, readFileSync } from "fs";

import Storage from "./models/Storage";
import { storageParser } from "./utils/middlewares";

import { NODE_ENV, DATABASE_URL } from "./utils/config";

// add automatic error handling
require("express-async-errors");

mongoose
    .connect(DATABASE_URL || "")
    .then(() => {
        console.log("connected to mongodb");
    })
    .catch((error) => {
        console.log("error connecting to mongodb :", error.message);
    });

const app = express();

// enable json and cors
app.use(cors());
app.use(express.json());
// enable logging in dev environment
if (NODE_ENV === "dev") {
    app.use(morgan("dev"));
}

if (NODE_ENV === "production") {
    app.use(morgan("tiny"));
}

// enable cookie parser
app.use(cookieParser());

// serve the assets directory(routes to /public/*)
app.use(express.static("assets"));

app.post("/create_new_storage", async (req, res) => {
    const new_token = randomUUID();

    const new_storage = new Storage({ token: new_token, files: [] });
    await new_storage.save();

    res.cookie("token", new_token, {
        sameSite: true,
        httpOnly: true,
        maxAge: 9000000,
    });
    res.status(200);
    return res.json({
        status: "OK",
        message: "Storage Created Successfully",
    });
});

app.use(storageParser);

app.post("/upload_file", async (req, res) => {
    // @ts-ignore
    const storage = req.storage;

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

    form.parse(req, async (err, fields, { my_file }) => {
        if (err) {
            throw new Error(err);
        }
        if (my_file === undefined) {
            return res.status(400).json({
                error: "No file provided",
            });
        }
        // @ts-ignore wrong type declarations causing issues accessing valid keys
        const newFileName = my_file.newFilename;

        storage.files.push(newFileName);
        await storage.save();

        res.status(202);
        res.json({
            status: "OK",
            file_path: `public/upload/${newFileName}`,
        });
        return;
    });
});

app.post("/text_file_to_audio", (req, res) => {
    // @ts-ignore
    const storage = req.storage;

    if (req.body.file_path === undefined) {
        return res.status(400).json({
            error: "File path to convert not provided",
        });
    }

    const file_path = path.join("assets", req.body.file_path?.toString());

    if (!existsSync(file_path)) {
        return res.status(400).json({
            error: "File does not exist",
        });
    }

    const text_rgx = /\.txt$/;
    if (!text_rgx.test(req.body.file_path)) {
        return res.status(400).json({
            error: "Provided file is not a text file",
        });
    }

    const audio_file_name = randomUUID() + ".mp3";

    // no types exist for gtts library
    // @ts-ignore
    const gtts = new gTTS(readFileSync(file_path).toString(), "en");
    // @ts-ignore
    gtts.save(`assets/public/upload/${audio_file_name}`, async (err: Error) => {
        if (err) {
            res.status(500).json({
                error: "An error occurred while converting to file to audio",
            });
            console.error(err);
            return;
        }

        storage.files.push(audio_file_name);
        await storage.save();

        return res.status(202).json({
            status: "OK",
            message: "Text to Speech Converted",
            audio_file_path: `public/upload/${audio_file_name}`,
        });
    });
});

app.get("/download_file", async (req, res) => {
    if (req.query.file_path === undefined) {
        return res.status(400).json({
            error: "file_path not provided",
        });
    }

    const file_path = path.join("assets", req.query.file_path.toString());

    if (!existsSync(file_path)) {
        res.status(400).json({
            error: "File does not exist",
        });
        return;
    }

    res.status(200);
    res.download(file_path);
    return;
});

app.post("/merge_video_and_audio", async (req, res) => {
    // @ts-ignore
    const storage = req.storage;

    if (
        req.body.audio_file_path === undefined ||
        req.body.video_file_path === undefined
    ) {
        return res.status(400).json({
            error: "Video and/or audio file path is not provided",
        });
    }

    const audio_file_path = path.join("assets", req.body.audio_file_path);
    const video_file_path = path.join("assets", req.body.video_file_path);

    if (!existsSync(audio_file_path) || !existsSync(video_file_path)) {
        return res.status(400).json({
            error: "Video and/or audio file does not exist",
        });
    }

    const new_file_path = path.join("public", "upload", randomUUID() + ".mp4");

    exec(
        `ffmpeg -i ${video_file_path} -i ${audio_file_path} -c:v copy -map 0:v:0 -map 1:a:0 assets/${new_file_path}`,
        (err, stdout, stderr) => {
            if (err) {
                return res.status(500).json({
                    error: "error while merging the video and audio",
                });
            }

            console.log("stdout:", stdout);
            console.error("stderr:", stderr);

            storage.files.push(new_file_path);

            return res.status(200).json({
                status: "OK",
                message: "Video and Audio merged successfully",
                file_path: new_file_path,
            });
        }
    );
});

app.post("/merge_image_and_audio", async (req, res) => {
    // @ts-ignore
    const storage = req.storage;

    if (
        req.body.audio_file_path === undefined ||
        req.body.image_file_path === undefined
    ) {
        return res.status(400).json({
            error: "image and/or audio file path is not provided",
        });
    }

    const audio_file_path = path.join("assets", req.body.audio_file_path);
    const image_file_path = path.join("assets", req.body.image_file_path);

    if (!existsSync(audio_file_path) || !existsSync(image_file_path)) {
        return res.status(400).json({
            error: "Video and/or audio file does not exist",
        });
    }

    const new_file_path = path.join("public", "upload", randomUUID() + ".mp4");

    exec(
        `ffmpeg -i ${image_file_path} -i ${audio_file_path} -map 0:v:0 -map 1:a:0 assets/${new_file_path}`,
        (err, stdout, stderr) => {
            if (err) {
                return res.status(500).json({
                    error: "An error occured while convert image and audio into a video.",
                });
            }

            console.log("stdout:", stdout);
            console.error("stderr:", stderr);

            storage.files.push(new_file_path);

            return res.status(200).json({
                status: "OK",
                message: "Image and Audio merged successfully",
                file_path: new_file_path,
            });
        }
    );
});

app.post("/merge_videos", async (req, res) => {
    // @ts-ignore
    const storage = req.storage;

    // clean up after error and before starting another request
    if (existsSync("inter0.ts")) {
        execSync(`rm inter*`);
    }

    if (req.body.video_file_path_list === undefined) {
        return res.status(400).json({
            error: "List of video files to merge was not provided",
        });
    }
    const video_list: string[] = req.body.video_file_path_list.map(
        (video: string) => path.join("assets", video)
    );

    video_list.forEach((video) => {
        if (!existsSync(video)) {
            return res.status(400).json({
                error: "One of the files in list was not found",
            });
        }
    });

    const new_file_path = path.join("public", "upload", randomUUID() + ".mp4");

    const intermediate_files: string[] = [];

    for (let i = 0; i < video_list.length; i++) {
        const inter_video = `inter${i}.ts`;
        const inter = execSync(
            `ffmpeg -i ${video_list[i]} -c copy ${inter_video}`
        );
        intermediate_files.push(inter_video);
    }

    console.log(intermediate_files);

    console.log(
        `ffmpeg -i "concat:${intermediate_files.join(
            "|"
        )}" -c copy assets/${new_file_path}`
    );

    exec(
        `ffmpeg -i "concat:${intermediate_files.join(
            "|"
        )}" -c copy assets/${new_file_path}`,
        (err, stdout, stderr) => {
            if (err) {
                return res.status(500).json({
                    error: "error while merging the videos.",
                });
            }

            console.log("stdout:", stdout);
            console.error("stderr:", stderr);

            storage.files.push(new_file_path);

            if (existsSync("inter0.ts")) {
                execSync(`rm inter*`);
            }

            return res.status(200).json({
                status: "OK",
                message: "Videos merged successfully",
                file_path: new_file_path,
            });
        }
    );
});

app.get("/my_uploaded_files", async (req, res) => {
    // @ts-ignore
    const storage = req.storage;

    return res.status(200).json({
        status: "OK",
        data: storage.files,
    });
});

export default app;
