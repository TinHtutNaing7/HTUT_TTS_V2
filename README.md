# Myanmar Voice — Gemini TTS

A production-ready **Next.js 15 (App Router)** web application that converts Myanmar (Burmese) text into natural speech voiceover using the **Google Gemini 2.5 Flash TTS** model.

---

## ✨ Features

- 🎙 **7 audio styles** — Normal, Excited, Whisper, News Anchor, Calm, Cheerful, Somber
- 🗣 **7 Gemini voices** — Kore, Aoede, Leda, Charon, Fenrir, Orus, Puck
- 📱 **Responsive layout** with Myanmar script typography (`Noto Sans Myanmar`)
- 🎨 **Lacquerware-inspired dark theme** (gold on obsidian black)
- ▶️ **Custom HTML5 audio player** with seek, progress bar, and WAV download
- 🔒 **Secure** — API key never exposed to the browser

---

## 🗂 Project Structure

```
myanmar-tts/
├── app/
│   ├── api/
│   │   └── tts/
│   │       └── route.ts        ← Backend API route (Gemini TTS call)
│   ├── globals.css             ← Tailwind + custom CSS theme
│   ├── layout.tsx              ← Root layout + metadata
│   └── page.tsx                ← Main UI (client component)
├── components/
│   └── AudioPlayer.tsx         ← Custom audio player component
├── .env.example                ← Environment variable template
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 🚀 Deploy to Vercel (via GitHub)

### Step 1 — Push to GitHub
```bash
git init
git add .
git commit -m "feat: Myanmar Voice TTS app"
git remote add origin https://github.com/YOUR_USERNAME/myanmar-tts.git
git push -u origin main
```

### Step 2 — Import into Vercel
1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **Import** next to your GitHub repository
3. Framework preset will auto-detect as **Next.js** ✅
4. Leave all build settings at defaults

### Step 3 — Add Environment Variable
In **Settings → Environment Variables**, add:

| Name | Value |
|---|---|
| `GEMINI_API_KEY` | `your_key_from_aistudio` |

Get your key at → [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)

### Step 4 — Deploy
Click **Deploy**. Your app goes live in ~60 seconds.

---

## 💻 Local Development

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env.local
# Edit .env.local and paste your GEMINI_API_KEY

# 3. Run dev server
npm run dev
# → http://localhost:3000
```

---

## 🔌 API Reference

### `POST /api/tts`

**Request body (JSON):**
```json
{
  "text":  "မင်္ဂလာပါ",
  "style": "normal",
  "voice": "Kore"
}
```

| Field | Type | Values |
|---|---|---|
| `text` | string | Any Myanmar text (max 4,000 chars) |
| `style` | string | `normal` `excited` `whispers` `news-anchor` `calm` `cheerful` `sad` |
| `voice` | string | `Kore` `Aoede` `Leda` `Charon` `Fenrir` `Orus` `Puck` |

**Response:** `audio/wav` binary stream

---

## 🧑‍💻 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v3 |
| AI / TTS | Google Gemini 2.5 Flash TTS (`@google/genai`) |
| Deployment | Vercel |
| Fonts | Cormorant Garamond · DM Sans · Noto Sans Myanmar |
