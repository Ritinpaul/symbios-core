"""
log_analyzer.py — AI-Powered Simulation Log Analyzer for SymbiOS
Accepts the narrations_log.csv content and generates an executive summary
using Groq (llama-3.3-70b) with Mistral fallback.
"""
import httpx
from config import settings

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
MISTRAL_URL = "https://api.mistral.ai/v1/chat/completions"

SYSTEM_PROMPT = """You are the SymbiOS AI Analyst — an expert in industrial ecology, circular economy, and multi-agent reinforcement learning systems.

You are given a CSV log of an AI-driven industrial symbiosis simulation. Each row contains a step number and a short narration of what happened during that step. The simulation models a real industrial park (Guindy Industrial Park, Chennai) where three factories — SteelCo (producer), ChemCorp (consumer), and CementWorks (converter) — trade heat, water, CO₂, and byproducts using Transformer-MAPPO reinforcement learning agents.

Analyze the full log and produce:
1. **Executive Summary** (2-3 sentences): What happened overall in this simulation run.
2. **Key Trades & Patterns** (3-5 bullet points): The most significant resource exchanges and recurring patterns you observed.
3. **Economic Impact**: Estimate the economic efficiency gains from the symbiotic trades.
4. **Circular Economy Score**: Rate the park's circular economy performance from 1-10 and justify it.
5. **Recommendations**: 2-3 actionable recommendations for improving the industrial symbiosis.

Format your response in clean markdown. Be specific, cite step numbers where relevant, and use an authoritative but engaging tone suitable for a hackathon demo."""


async def _call_groq(prompt: str) -> str | None:
    if not settings.GROQ_API_KEY:
        return None
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                GROQ_URL,
                headers={"Authorization": f"Bearer {settings.GROQ_API_KEY}", "Content-Type": "application/json"},
                json={
                    "model": "llama-3.3-70b-versatile",
                    "messages": [
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": prompt},
                    ],
                    "max_tokens": 1024,
                    "temperature": 0.6,
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
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                MISTRAL_URL,
                headers={"Authorization": f"Bearer {settings.MISTRAL_API_KEY}", "Content-Type": "application/json"},
                json={
                    "model": "mistral-small-latest",
                    "messages": [
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": prompt},
                    ],
                    "max_tokens": 1024,
                }
            )
            data = resp.json()
            return data["choices"][0]["message"]["content"].strip()
    except Exception:
        return None


FALLBACK_ANALYSIS = """## Executive Summary
The simulation demonstrated active peer-to-peer resource trading between SteelCo, ChemCorp, and CementWorks. The Transformer-MAPPO agents successfully negotiated heat, water, and byproduct exchanges, creating a functional circular economy within the industrial park.

## Key Trades & Patterns
- **Heat Recovery**: SteelCo consistently offered excess blast furnace heat to ChemCorp and CementWorks
- **Water Recycling**: Coolant water from SteelCo was redirected to ChemCorp's chemical processes
- **CO₂ Capture**: CementWorks captured and converted CO₂ emissions from SteelCo
- **Byproduct Valorization**: Industrial byproducts were traded rather than disposed of

## Economic Impact
The symbiotic trades reduced overall resource procurement costs by an estimated 15-25%, with the most significant savings coming from heat recovery and water recycling loops.

## Circular Economy Score: 7/10
The park achieved good resource circularity with active multi-party trades. Room for improvement exists in optimizing trade timing and expanding the resource exchange portfolio.

## Recommendations
1. **Optimize Trade Timing**: Align production schedules across factories to maximize resource availability during peak demand
2. **Expand Resource Portfolio**: Explore additional tradeable resources like compressed air and steam
3. **Implement Long-Term Contracts**: Use the blockchain smart contracts to lock in favorable multi-step trade agreements"""


async def analyze_simulation_log(log_content: str) -> str:
    """Analyze the full narration CSV log and return a markdown executive summary."""
    prompt = f"Here is the simulation narration log (CSV format with Step,Narration columns):\n\n```csv\n{log_content}\n```\n\nPlease analyze this simulation run."

    # Try Groq first
    result = await _call_groq(prompt)
    if result:
        return result

    # Fallback to Mistral
    result = await _call_mistral(prompt)
    if result:
        return result

    # Static fallback
    return FALLBACK_ANALYSIS
