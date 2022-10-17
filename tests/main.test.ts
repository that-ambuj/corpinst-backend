import { describe, test, expect } from "@jest/globals";
import supertest from "supertest";
import { existsSync } from "fs";
import path from "path";
import app from "../src/app";

const api = supertest.agent(app);

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

    expect(res.status).toBe(202);
    const file_path = path.join("assets", res.body.file_path.toString());
    expect(existsSync(file_path)).toBe(true);
    expect(res.header["content-type"]).toMatch("application/json");
});

describe("Convert text to audio", () => {
    // add every uploaded file's name to below array
    const uploaded_files: string[] = [];
    // get a cookie first
    api.post("/create_new_storage")
        .then()
        .catch((e) => console.error(e));
    // upload a text file
    const text_file = path.join(__dirname, "test_files/text.txt");

    api.post("/upload_file")
        .set("Cookie", "token=07ca9df1-6dd2-4413-abbe-6d1bd6a7ccbb")
        .set("Content-Type", "multipart/form-data")
        .attach("my_file", text_file)
        .then((res) => {
            uploaded_files.push(res.body.file_path);
        })
        .catch((err) => {
            console.error(err);
        });

    test("Should convert text to audio", async () => {
        const res = await api
            .post("/text_file_to_audio")
            .send({ file_path: uploaded_files[0] })
            .type("json");

        expect(res.status).toBe(202);
        expect(res.header["content-type"]).toMatch("application/json");
        expect(res.body).toMatchObject({
            status: "OK",
            message: "Text to Speech Converted",
        });
        expect(res.body.audio_file_path).toBeDefined();
    });
});
