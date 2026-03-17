import express from "express";
import connectToMongoDB from "./connect.js";
import urlRoute from "./Routes/url.js";
import { handleShortUrlRedirect } from "./Controllers/url.js";
import cors from "cors";
import helmet from "helmet";
import useragent from "express-useragent";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import { connectRedis } from "./redis.js";

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
app.use(useragent.express());

// Rate Limiting on URL Generation to prevent abuse
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again after 15 minutes"
});

app.use("/url", apiLimiter, urlRoute);

// Redirect Route
app.get("/:shortId", handleShortUrlRedirect);

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
