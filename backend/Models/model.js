import mongoose from "mongoose";

const urlSchema = new mongoose.Schema(
  {
    shortId: {
      type: String,
      required: true,
      unique: true,
    },

    redirectUrl: {
      type: String,
      required: true,
    },

    visitHistory: [
      {
        timestamp: { type: Number },
        device: { type: String, default: "Unknown" },
        referrer: { type: String, default: "Direct" }
      },
    ],
  },
  {
    timestamps: true,
  }
);

const URL = mongoose.model("url", urlSchema);

export default URL;