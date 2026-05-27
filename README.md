# Burned Lakes Calculator

A multi-step web calculator that converts your AI/LLM usage into lakes of evaporated water, backed by real data center research and a progressively scorched SVG landscape.

## The premise

Data centers use water to cool servers. A lot of it. [Li et al. (2023)](https://arxiv.org/abs/2304.03271) estimated meaningful per-inference water costs that compound fast at scale. This calculator takes your actual usage habits, runs them through tiered water consumption constants, and tells you how many lakes you have personally evaporated.

One lake is defined as 200,000 liters.

## How the math works

**Regular users:** frequency x session length x conversation depth x model tier x months

**Power users (token path):** monthly tokens x mL-per-1K-tokens x output ratio multiplier x months

**Power users (call path):** calls/day x estimated tokens/call, then into the token path

Water constants by model tier (mL per 1,000 tokens):

| Tier | Example models | mL / 1K tokens |
|---|---|---|
| Small | Claude Haiku, Gemini Flash-Lite, GPT-4o mini | 1.0 |
| Mid | Claude Sonnet, Gemini Flash, GPT-4o | 2.5 |
| Frontier | Claude Opus, Gemini Pro, GPT-4.5 | 6.0 |

Output tokens are weighted roughly 4x heavier than input tokens, since generating text is significantly more compute-intensive than processing a prompt.

Sources: [Li et al. 2023, "Making AI Less Thirsty"](https://arxiv.org/abs/2304.03271) and Microsoft water usage disclosures (2022-2023).

## What it asks you

Two paths through the wizard:

**Casual users** answer questions about how often they use AI, how long sessions run, which tools they use, and how deep they typically go in a conversation.

**Power users** choose between a token path (monthly token volume, output ratio, model tier) or a call path (calls per day, messages per call, model tier).

Both paths end with a slider for how long you have been at this usage level, which turns out to be the most impactful variable.

## The lake scale

| Range | Verdict |
|---|---|
| < 0.005 lakes | Barely a splash. For now. |
| 0.005 - 0.02 | The fish have noticed. |
| 0.02 - 0.1 | The waterline is measurably lower. |
| 0.1 - 0.5 | A meaningful chunk of a lake, gone. |
| 0.5 - 1 | Almost a whole lake. Almost. |
| 1 - 2 | One whole lake. The ducks are furious. |
| 2 - 5 | Multiple lakes. The ducks have filed a complaint. |
| 5 - 20 | A regional aquatic incident. |
| 20 - 100 | You are the drought. |
| 100+ | Scientists are naming the dry basin after you. |

## Running it locally

```bash
npm install
npm run dev     # http://localhost:5173
npm test
npm run build
```

Requires Node 18+.

## Stack

React 19, TypeScript, Vite, Framer Motion (the lake scene burns in real time as you fill out the wizard), Tailwind v4, Vitest.
