# PATA AI proxy — deploy in about five minutes

This little server holds your Mistral API key so the app never has to. The
app calls this; this calls Mistral.

**Why it exists:** an APK is a zip file. A key shipped inside the app can be
pulled out with one `unzip` command, and then anyone can spend your credits.
Keeping the key here means you can also rotate it without shipping a new APK.

You do not need to understand the code to run it.

---

## 1. Get a Mistral key

1. Sign up at <https://console.mistral.ai>
2. Create an API key and copy it
3. **Set a spending limit on the account.** Do this even on the free tier — it
   is the one control that makes a runaway bill impossible.

## 2. Deploy

You need [Node.js](https://nodejs.org) installed. Then, from this folder:

```bash
npx wrangler login                    # opens a browser, sign in / sign up free
npx wrangler secret put MISTRAL_API_KEY   # paste your key when prompted
npx wrangler deploy
```

The last command prints your URL, something like:

```
https://pata-ai.<your-name>.workers.dev
```

Check it works:

```bash
curl https://pata-ai.<your-name>.workers.dev/health
# {"ok":true,"ai":true}
```

## 3. Point the app at it

Either rebuild the app with the URL baked in:

```bash
cd ..                                  # back to pata/
echo 'VITE_PATA_AI_URL=https://pata-ai.<your-name>.workers.dev' > .env
npm run build
npx cap sync android
cd android && ./gradlew assembleDebug
```

…or, without rebuilding, open the app → ⚙ Settings → Advanced and paste the
URL there. Useful for testing, or for a district running its own copy.

---

## What it costs

Both free tiers are generous:

- **Cloudflare Workers** — 100,000 requests/day free, no card required
- **Mistral** — has a free tier; check current limits at
  <https://mistral.ai/pricing>

For a few hundred classrooms this should stay at zero. Set the spend limit in
step 1 anyway.

## Abuse protection

The URL is inside the app, so treat it as public. Built in:

| Guard | Limit |
|---|---|
| Per device, per hour | 60 requests |
| Per IP, per hour | 300 requests (a whole school shares one IP) |
| Request body | ~6 MB |
| Upstream timeout | 45 s |
| Model choice | fixed server-side — a caller cannot ask for an expensive model |

Counters live in the Cloudflare cache, which is free but per-datacentre, so
someone spread across regions gets a higher effective ceiling. That is why the
**spend limit on the Mistral account is the real backstop.** These limits stop
casual abuse and runaway loops, not a determined attacker.

Watch live traffic with:

```bash
npx wrangler tail
```

## If the app says AI is unavailable

The app is designed to shrug this off — it falls back to on-device OCR, the
offline summariser and the built-in question bank, so nothing breaks for the
teacher. To find out why anyway:

| `/health` says | Meaning |
|---|---|
| `{"ok":true,"ai":true}` | Working; the problem is elsewhere |
| `{"ok":true,"ai":false}` | Key not set — re-run `wrangler secret put` |
| nothing / error | Not deployed, or wrong URL |

`npx wrangler tail` prints the real upstream error (a `401` there means the
Mistral key is wrong or revoked).

## Changing provider

Nothing in the app is Mistral-specific — it only speaks to `/lesson`, `/page`
and `/judge` here. To switch provider, change `MISTRAL_URL`, the auth header
and the model names in `worker.js`; the app needs no change at all.
