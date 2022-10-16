import { test, expect } from "@jest/globals";
import supertest from "supertest";
import { createReadStream, existsSync } from "fs";
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
    const file = createReadStream(path.join(__dirname, "test_files/text.txt"));
    const res = await api
        .post("/upload_file")
        .attach("my_file", file)
        .set("Content-Type", "multipart/form-data");

    expect(res.status).toBe(202);
    const file_path = path.join("assets", res.body.file_path);
    expect(existsSync(file_path)).toBe(true);
    expect(res.header["content-type"]).toMatch("json");
});
