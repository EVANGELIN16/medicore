
import "dotenv/config";
import app from "./app.js";

const PORT = Number(process.env.PORT ?? 5000);

if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
  throw new Error("PORT must be a valid port number");
}

app.listen(PORT, () => {
  console.log(`MediCore API running at http://localhost:${PORT}`);
});
