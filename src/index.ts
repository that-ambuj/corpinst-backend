import app from "./app";
import { existsSync, mkdirSync } from "fs";
import { PORT } from "./utils/config";

const port = PORT || 3000;
const upload_dir = "assets/public/upload/";

app.listen(port, () => {
    if (!existsSync(upload_dir)) {
        mkdirSync(upload_dir, { recursive: true });
    }
    console.log(`Express is running on port ${port}`);
});
