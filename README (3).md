# Roboflow Proxy

A tiny serverless function that forwards image-detection requests to Roboflow
from the server side, so a static site (e.g. GitHub Pages) can call it without
hitting Roboflow's CORS restriction on the workflow inference endpoint.

## Deploy to Vercel

1. Push this folder to its own GitHub repo (or a subfolder of an existing one).
2. Go to https://vercel.com → "Add New Project" → import that repo.
3. Before the first deploy (or right after, then redeploy), go to
   **Project → Settings → Environment Variables** and add:
   - Key: `ROBOFLOW_API_KEY`
   - Value: your real Roboflow API key (the one currently sitting in your HTML)
4. Deploy. Vercel will give you a URL like `https://your-project.vercel.app`.
5. Your endpoint is then `https://your-project.vercel.app/api/infer`.

## Test it

```bash
curl -X POST https://your-project.vercel.app/api/infer \
  -H "Content-Type: application/json" \
  -d '{"image":"<base64 jpeg here>"}'
```

You should get back the same JSON shape Roboflow normally returns
(`predictions`, etc.) — no CORS error, because this request is server-to-server.

## Update the game

In `high-voltage-cache-fixed.html`, point `callRoboflow()` at this proxy
instead of `detect.roboflow.com` directly, and stop sending `api_key` from
the browser (see the updated file).

## Security note

The API key now lives only in Vercel's environment variables — it is never
sent to or visible in the browser. You can (and should) now remove/rotate the
key that was previously hardcoded in the HTML, since it was exposed to anyone
who viewed the page source.
