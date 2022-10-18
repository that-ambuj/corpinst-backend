import { test, expect, beforeAll, afterAll } from "@jest/globals";
import supertest from "supertest";
import { existsSync } from "fs";
import path from "path";
import app from "../src/app";
import Storage from "../src/models/Storage";
import mongoose from "mongoose";

const api = supertest.agent(app);

const uploaded_files: string[] = [];

beforeAll(async () => {
    await Storage.deleteMany();
});

test("Create New Storage", async () => {
    const res = await api.post("/create_new_storage");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
        status: "OK",
        message: "Storage Created Successfully",
    });
    expect(res.header["set-cookie"]).toBeDefined();
});

test("Upload File", async () => {
    const text_file = path.join(__dirname, "test_files/text.txt");
    const res = await api
        .post("/upload_file")
        .attach("my_file", text_file)
        .set("Content-Type", "multipart/form-data");

    uploaded_files.push(res.body.file_path);

    expect(res.status).toBe(202);
    const file_path = path.join("assets", res.body.file_path.toString());
    expect(existsSync(file_path)).toBe(true);
    expect(res.header["content-type"]).toMatch("application/json");
});

test("Should convert text to audio", async () => {
    const res = await api
        .post("/text_file_to_audio")
        .send({ file_path: uploaded_files[0] });

    expect(res.status).toBe(202);
    expect(res.header["content-type"]).toMatch("application/json");
    expect(res.body).toMatchObject({
        status: "OK",
        message: "Text to Speech Converted",
    });
    expect(res.body.audio_file_path).toBeDefined();
});

afterAll(async () => {
    mongoose.disconnect();
});
