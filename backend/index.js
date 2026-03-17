import express from "express";
import cors from "cors";
import helmet from "helmet";
import useragent from "express-useragent";
import dotenv from "dotenv";

import connectToMongoDB from "./connect.js";
import { connectRedis } from "./redis.js";
import { errorHandler } from "./middlewares/errorHandler.js";

import apiRoutes from "./routes/apiRoutes.js";
import redirectRoutes from "./routes/redirectRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to Databases
connectToMongoDB(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/short-url")
  .then(() => console.log("Mongodb connected"))
  .catch((err) => console.log("Mongo error", err));

connectRedis();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
if (useragent && useragent.express) {
  app.use(useragent.express());
} else if (useragent && useragent.default && useragent.default.express) {
  app.use(useragent.default.express());
}

// Routes
app.use("/api/url", apiRoutes);
app.use("/", redirectRoutes);

// Error Handling (Must be last)
app.use(errorHandler);

// Fix for Jest Testing - export app without listening if imported
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
  });
}

export default app;
