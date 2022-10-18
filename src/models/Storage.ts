import mongoose from "mongoose";

const storageSchema = new mongoose.Schema({
    token: { type: String, required: true },
    files: [String],
});

storageSchema.set("toJSON", {
    transform: (document, returnedObject) => {
        returnedObject.id = returnedObject._id.toString();
        delete returnedObject._id;
        delete returnedObject.__v;
    },
});

export default mongoose.model("Storage", storageSchema);
