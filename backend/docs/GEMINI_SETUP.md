# 🌟 Gemini Provider Setup (Google AI Studio Quality)

## What is This?

The **Gemini Provider** gives you the **same image generation quality as Google AI Studio** - the "Nano Banana Pro" model you see in the Studio interface!

This replaces the old Vertex AI Imagen provider, which had lower quality results.

---

## Quick Setup (3 Minutes)

### Step 1: Get Your Gemini API Key

1. Go to: **https://aistudio.google.com/app/apikey**
2. Click **"Create API key"**
3. Select a Google Cloud project (or create a new one)
4. Copy your API key

**Note**: This is **simpler** than Vertex AI - no service account JSON needed!

---

### Step 2: Add to Your `.env` File

```bash
# ⭐ Gemini API (RECOMMENDED - same as Google AI Studio)
GEMINI_API_KEY=your_gemini_api_key_here
```

---

### Step 3: Restart Your Backend

```bash
cd backend
uvicorn main:app --reload
```

You should see:
```
✅ Gemini provider initialized (Google AI Studio quality)
```

---

## Usage

### In Chat:
- **Generate**: `"create a cute robot"`
- **Edit**: Select image, then `"make it more vibrant"`
- **Style transfer**: Select image, then `"make it look like an oil painting"`

### Provider Will Be Selected Automatically

The orchestrator now **prefers Gemini** for all operations:
- ✅ Generate images
- ✅ Edit images
- ✅ Image-to-image transformations

---

## Models Available

- **`gemini-2.0-flash-exp`** (default) - Latest, fastest, best quality
- **`gemini-1.5-flash`** - Fast, good quality
- **`gemini-1.5-pro`** - Highest quality, slower

---

## Comparison: Gemini vs Vertex AI Imagen

| Feature | Gemini (NEW) | Vertex AI Imagen (OLD) |
|---------|--------------|------------------------|
| **Quality** | ⭐⭐⭐⭐⭐ (Studio quality) | ⭐⭐⭐ (Lower) |
| **Setup** | Simple (API key only) | Complex (service account JSON) |
| **Authentication** | API key | Service account |
| **Cost** | Pay-per-use | Pay-per-use |
| **Models** | Gemini 2.0 Flash, 1.5 Pro | Imagen 3.0, 006 |
| **Same as Studio?** | ✅ YES | ❌ NO |

---

## Pricing

- **Free tier**: 1500 requests/day
- **Paid**: ~$0.01 per image (varies by model)
- Check current pricing: https://ai.google.dev/pricing

---

## Troubleshooting

### "GEMINI_API_KEY not found"
Make sure your `.env` file has the key and restart the server.

### "Failed to initialize Gemini provider"
Check that you installed the package:
```bash
pip install google-generativeai
```

### Still getting low quality?
Make sure your chat is using the `gemini` provider, not `google-imagen`:
- Check logs for: `✅ Gemini provider initialized`
- The orchestrator should automatically prefer Gemini

---

## Migration from Vertex AI

**Keep both providers** for backwards compatibility:
- **Gemini**: For new projects, best quality
- **Vertex AI Imagen**: Still works, but deprecated

To force using Gemini:
```python
# In your chat prompt, specify:
"generate with gemini: a cute robot"
```

---

## Support

- **Gemini API Docs**: https://ai.google.dev/docs
- **Get API Key**: https://aistudio.google.com/app/apikey
- **Pricing**: https://ai.google.dev/pricing


