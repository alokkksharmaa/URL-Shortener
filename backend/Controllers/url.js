import { nanoid } from "nanoid";
import URL from "../Models/model.js";
import redisClient from "../redis.js";
import URL from "../Models/model.js";

async function handleGenerateNewShortURL(req, res) {
  const body = req.body;
  if (!body.url) return res.status(400).json({ error: "url is required" });
  
  const shortID = nanoid(8);
  
  await URL.create({
    shortId: shortID,
    redirectUrl: body.url,
    visitHistory: [],
  });

  return res.json({ id: shortID });
}

// handleGetAnalytics retrieves from cache or db
async function handleGetAnalytics(req, res) {
  const shortId = req.params.shortId;
  const cacheKey = `analytics:${shortId}`;

  try {
    // 1. Check cache first
    const cachedAnalytics = await redisClient.get(cacheKey);
    if (cachedAnalytics) {
      return res.json(JSON.parse(cachedAnalytics));
    }

    // 2. Cache miss, query DB
    const result = await URL.findOne({ shortId });
    if (!result) return res.status(404).json({ error: "Short URL not found" });

    // Aggregate data for our new frontend dashboard features
    const responseData = {
      totalClicks: result.visitHistory.length,
      analytics: result.visitHistory,
      redirectUrl: result.redirectUrl
    };

    // 3. Cache the response for 60 seconds
    await redisClient.setEx(cacheKey, 60, JSON.stringify(responseData));

    return res.json(responseData);
  } catch (error) {
    console.error("Error fetching analytics", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function handleShortUrlRedirect(req, res) {
  const shortId = req.params.shortId;
  const cacheKey = `url:${shortId}`;
  
  // Try to determine device from user-agent
  let deviceType = "Desktop";
  if (req.useragent) {
    if (req.useragent.isMobile) deviceType = "Mobile";
    else if (req.useragent.isTablet) deviceType = "Tablet";
  }
  
  // Extract referrer
  const referrer = req.get('Referrer') || req.get('Referer') || "Direct";
  
  const visitData = {
    timestamp: Date.now(),
    device: deviceType,
    referrer: referrer
  };

  try {
    // 1. Check Redis Cache for the Target URL
    let targetUrl = await redisClient.get(cacheKey);

    if (targetUrl) {
      // Background process to update Mongo to not block redirect
      URL.findOneAndUpdate(
        { shortId },
        { $push: { visitHistory: visitData } }
      ).exec();
      
      // Also invalidate analytics cache
      redisClient.del(`analytics:${shortId}`);

      return res.redirect(targetUrl);
    }

    // 2. Cache Miss - Query MongoDB
    const entry = await URL.findOneAndUpdate(
      { shortId },
      { $push: { visitHistory: visitData } },
      { new: true } // Return updated doc
    );
    
    if (!entry) return res.status(404).json({ error: "Short URL not found" });

    // 3. Save URL to Cache (expires in 24 hours)
    await redisClient.setEx(cacheKey, 86400, entry.redirectUrl);
    // Invalidate analytics cache
    await redisClient.del(`analytics:${shortId}`);

    return res.redirect(entry.redirectUrl);
    
  } catch (error) {
    console.error("Redirect Error", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export {
  handleGenerateNewShortURL,
  handleGetAnalytics,
  handleShortUrlRedirect
};

