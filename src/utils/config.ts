import * as dotenv from "dotenv";
dotenv.config();

export const PORT = process.env.PORT;

export const DATABASE_URL =
    process.env.NODE_ENV === "test"
        ? process.env.TEST_DATABASE_URL
        : process.env.DATABASE_URL;

export const NODE_ENV = process.env.NODE_ENV;
