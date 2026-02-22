"""
narrator.py — AI Narrator for SymbiOS
Uses Groq (llama-3.3-70b) to generate a human-readable narration of each simulation step.
Falls back to Mistral if Groq fails.
"""
import httpx
import json
import asyncio
from config import settings

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
MISTRAL_URL = "https://api.mistral.ai/v1/chat/completions"

FALLBACK_NARRATIONS = [
    "AI negotiation engine is routing resources across the industrial park, executing peer-to-peer trades.",
    "SteelCo is offering excess furnace heat to ChemCorp. Smart contracts validating the exchange on-chain.",
    "CementWorks is converting CO₂ byproducts. MARL agents are rebalancing energy allocations.",
    "Disruption detected — Transformer model is re-routing resource flows to maintain park stability.",
    "Peak efficiency achieved. All three factories operating in a closed-loop resource cycle.",
    "Carbon offset opportunity identified. CementWorks capturing CO₂ from SteelCo blast furnace.",
    "ChemCorp's water demand matched by SteelCo coolant surplus. Trade confirmed by IoT oracle.",
    "Reputation scores updating. High-trust factories receive priority in the next resource auction.",
]

_fallback_idx = 0

def _get_fallback() -> str:
    global _fallback_idx
    narration = FALLBACK_NARRATIONS[_fallback_idx % len(FALLBACK_NARRATIONS)]
    _fallback_idx += 1
    return narration

def _build_prompt(step: int, agents_before: list[dict], agents_after: list[dict], disruptions: dict) -> str:
    lines = [f"Simulation Step {step}. Here is what changed for each factory:"]
    for before, after in zip(agents_before, agents_after):
        name = after.get("name", "Factory")
        cash_delta = round(after.get("cash", 0) - before.get("cash", 0), 1)
        cash_str = f"+${cash_delta:.0f}" if cash_delta >= 0 else f"-${abs(cash_delta):.0f}"
        disrupted = disruptions.get(after.get("id", ""), False)
        dis_str = " [DISRUPTED]" if disrupted else ""
        lines.append(f"- {name}{dis_str}: cash {cash_str}")
    lines.append("\nWrite ONE short, vivid, energetic sentence (max 20 words) describing the most important trade or event that just happened. Be specific about which factories traded what resource.")
    return "\n".join(lines)

async def _call_groq(prompt: str) -> str | None:
    if not settings.GROQ_API_KEY:
        return None
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.post(
                GROQ_URL,
                headers={"Authorization": f"Bearer {settings.GROQ_API_KEY}", "Content-Type": "application/json"},
                json={
                    "model": "llama-3.3-70b-versatile",
                    "messages": [{"role": "user", "content": prompt}],
                    "max_tokens": 60,
                    "temperature": 0.7,
                }
            )
            data = resp.json()
            return data["choices"][0]["message"]["content"].strip()
    except Exception:
        return None

async def _call_mistral(prompt: str) -> str | None:
    if not settings.MISTRAL_API_KEY:
        return None
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.post(
                MISTRAL_URL,
                headers={"Authorization": f"Bearer {settings.MISTRAL_API_KEY}", "Content-Type": "application/json"},
                json={
                    "model": "mistral-small-latest",
                    "messages": [{"role": "user", "content": prompt}],
                    "max_tokens": 60,
                }
            )
            data = resp.json()
            return data["choices"][0]["message"]["content"].strip()
    except Exception:
        return None

async def generate_narration(step: int, agents_before: list[dict], agents_after: list[dict], disruptions: dict) -> str:
    """Generate a 1-sentence AI narration of the current step. Non-blocking — returns fallback on failure."""
    prompt = _build_prompt(step, agents_before, agents_after, disruptions)
    
    # Try Groq first (fastest)
    result = await _call_groq(prompt)
    if result:
        return result
    
    # Fallback to Mistral
    result = await _call_mistral(prompt)
    if result:
        return result
    
    # Static fallback if both fail
    return _get_fallback()
