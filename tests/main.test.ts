import { describe, test, expect } from "@jest/globals";
import supertest from "supertest";
import app from "../src/app";

const api = supertest(app);

test("Create New Storage", async () => {
    const res = await api.post("/create_new_storage");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
        status: "OK",
        message: "Storage Created Successfully",
    });
    expect(res.header["set-cookie"]).toBeDefined();
});
