import type { Request, Response, NextFunction } from "express";
import Storage from "../models/Storage";

export const storageParser = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (req.cookies.token === undefined) {
        return res.status(400).json({
            error: "Please create a storage before uploading file",
        });
    }

    const storage = await Storage.findOne({ token: req.cookies.token });

    if (storage === null) {
        return res.status(401).json({
            error: "Storage with your token does not exist, please clear your cookies and create a new storage",
        });
    }

    // @ts-ignore
    req.storage = storage;
    next();
};
