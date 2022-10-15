import app from "./app";
import { PORT } from "./utils/config";

const port = PORT || 3000;

app.listen(port, () => {
    console.log(`Express is running on port ${port}`);
});
