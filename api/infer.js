// Vercel serverless function: POST /api/infer
// Proxies image-detection requests to Roboflow from the server side, so the
// browser never talks to detect.roboflow.com directly (sidesteps Roboflow's
// CORS restriction on the workflow endpoint) and the API key never ships to
// client-side JS.
//
// Set ROBOFLOW_API_KEY as an Environment Variable in the Vercel project
// settings (Project -> Settings -> Environment Variables). Do NOT hardcode
// it here.

const ROBOFLOW_URL = "https://detect.roboflow.com/infer/workflows/deimax-s-workspace/find-tree-rock-and-more";

export default async function handler(req, res) {
  // CORS: only allow your actual GitHub Pages origin to call this function,
  // rather than the wildcard "*" used during initial setup/debugging.
  res.setHeader("Access-Control-Allow-Origin", "https://deimaxlt.github.io");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    // Preflight request — answer it directly, no body needed.
    res.status(204).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.ROBOFLOW_API_KEY;
  if (!apiKey) {
    console.error("ROBOFLOW_API_KEY is not set in environment variables");
    res.status(500).json({ error: "Server misconfigured: missing API key" });
    return;
  }

  const { image } = req.body || {};
  if (!image) {
    res.status(400).json({ error: "Missing 'image' (base64) in request body" });
    return;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const rfResponse = await fetch(ROBOFLOW_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        inputs: { image: { type: "base64", value: image } },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const text = await rfResponse.text();

    if (!rfResponse.ok) {
      console.error("Roboflow error:", rfResponse.status, text);
      res.status(rfResponse.status).json({ error: "Roboflow error", detail: text });
      return;
    }

    // Roboflow returns JSON — pass it straight through.
    res.status(200).send(text);
  } catch (err) {
    console.error("Proxy fetch failed:", err);
    res.status(502).json({ error: "Failed to reach Roboflow", detail: String(err) });
  }
}
