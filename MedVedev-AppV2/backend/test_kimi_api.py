"""
LLM API connectivity check (NVIDIA build.nvidia / NIM or Moonshot Kimi).

Loads backend/.env — does not print secrets.

Usage (from backend/):
  python test_kimi_api.py
"""

from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

try:
    from dotenv import load_dotenv
except ImportError:
    print("Install: pip install python-dotenv")
    sys.exit(1)

_BACKEND = Path(__file__).resolve().parent
load_dotenv(_BACKEND / ".env")
load_dotenv(Path.cwd() / ".env")

KEY = (
    os.environ.get("KIMI_API_KEY")
    or os.environ.get("MOONSHOT_API_KEY")
    or os.environ.get("NVIDIA_API_KEY")
    or ""
).strip()

print("backend/.env path:", _BACKEND / ".env")
print("API key present:", bool(KEY), "| length:", len(KEY))
if KEY:
    print("Key prefix (safe):", KEY[:12] + "..." if len(KEY) > 12 else KEY)

if not KEY:
    print("\nFAIL: No API key. Save backend/.env with e.g.:")
    print("  NVIDIA_API_KEY=nvapi-...   # build.nvidia.com")
    print("  or KIMI_API_KEY=sk-...     # platform.moonshot.cn")
    sys.exit(1)

from services.llm_service import resolve_llm_endpoint

url, model = resolve_llm_endpoint(KEY)
print("Resolved endpoint:", url)
print("Resolved model:", model)

payload = {
    "model": model,
    "temperature": 0,
    "messages": [{"role": "user", "content": "Reply with exactly: ok"}],
}
req = urllib.request.Request(
    url,
    data=json.dumps(payload).encode("utf-8"),
    headers={
        "Authorization": f"Bearer {KEY}",
        "Content-Type": "application/json",
    },
    method="POST",
)

print("\nCalling chat completions ...")
try:
    with urllib.request.urlopen(req, timeout=60) as resp:
        body = json.loads(resp.read().decode("utf-8"))
    text = body["choices"][0]["message"]["content"]
    print("SUCCESS. Model reply:", repr(text[:120]))
except urllib.error.HTTPError as e:
    err = e.read().decode("utf-8", errors="replace")[:800]
    print("HTTP ERROR", e.code)
    print(err)
    sys.exit(1)
except Exception as e:
    print("ERROR:", type(e).__name__, e)
    sys.exit(1)
