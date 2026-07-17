"""Giới hạn số OpenAI call chạy ĐỒNG THỜI trong toàn process — nhiều CCU cùng
lúc gọi AI (khoe/chat/nlp) mà không chặn thì dễ tràn rate-limit tài khoản và
khiến worker bị nghẽn chờ hết cả loạt. Dùng CHUNG 1 semaphore cho mọi adapter
OpenAI (dialogue/memory/nlp) vì chúng share cùng 1 tài khoản/rate-limit.

OPENAI_MAX_CONCURRENCY chỉnh qua env, mặc định 8 — đủ dùng cho VPS 2 vCPU mà
không đẩy rate-limit OpenAI (gpt-4o-mini) lên quá cao cùng lúc.
"""
from __future__ import annotations

import asyncio
import os

OPENAI_SEMAPHORE = asyncio.Semaphore(int(os.environ.get("OPENAI_MAX_CONCURRENCY", "8")))
