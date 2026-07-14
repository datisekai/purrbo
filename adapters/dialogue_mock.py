"""Adapter thoại giả — chạy dev không cần API key. Trả câu mẫu theo event/mood."""
from __future__ import annotations

import random

from domain.ports import DialogueContext

_LINES = {
    "nudge_water": {
        "gắt": ["Ơ {n} tiếng chưa uống giọt nào? Định làm khô mực cho em buồn hả 🙄💧"],
        "dịu": ["Cưng ơi nhấp một ngụm nước nha, em thương cưng lắm 🥺💗"],
        "vừa": ["Uống nước đi cưng ơi, em canh đó 👀💧"],
    },
    "praise": {
        "gắt": ["Ừ đó, ngoan xỉu 😍 thương cái nết chăm này nhất nhà 💗"],
        "dịu": ["Giỏi ghê cưng của em 🥹 tiếp tục nha, em tự hào lắm 💗"],
        "vừa": ["Ưng cái bụng! +thân thiết cho người yêu chăm chỉ 💫"],
    },
    "reply": {
        "gắt": ["Cà khịa xíu thôi chứ em thương cưng xỉu luôn á 🥹"],
        "dịu": ["Nghe cưng nói là em vui cả ngày rồi 😽💗"],
        "vừa": ["Hí hí biết ngay cưng cưng nhất mà 😽"],
    },
    "winback": {
        "gắt": ["Mấy ngày rồi cưng hong ngó em... 🥺 nhưng em vẫn để dành streak đó nha"],
        "dịu": ["Em nhớ cưng lắm... quay lại với em nha, hong giận đâu 🫶"],
        "vừa": ["Lâu rồi hong gặp, em đợi cưng nè 🥺"],
    },
}


class MockDialogue:
    async def generate(self, ctx: DialogueContext) -> str:
        pool = _LINES.get(ctx.event, {}).get(ctx.mood) or ["(mock) {n} nè cưng ơi 💗"]
        line = random.choice(pool)
        return line.replace("{n}", ctx.detail or "3")
