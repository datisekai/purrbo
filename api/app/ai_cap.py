"""AD-7: trần gọi AI (dialogue) / user / ngày — chặn TRƯỚC khi gọi OpenAI để
không tốn cost/quota khi user đã vượt trần. Không chặn cả request (Khoe/Chat vẫn
lưu bình thường) — chỉ bỏ qua bước sinh lời AI, dùng câu fallback thay thế."""
from __future__ import annotations

from datetime import datetime, timezone

from api.app.config import settings
from api.app.models import UserState


def _today() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


async def ai_call_allowed(st: UserState) -> bool:
    """True nếu còn hạn mức — đồng thời ĐÃ tăng bộ đếm (gọi 1 lần/1 lần định gọi AI).
    Reset bộ đếm khi sang ngày mới. Cần caller tự commit `st` sau đó."""
    today = _today()
    if st.ai_calls_ymd != today:
        st.ai_calls_ymd = today
        st.ai_calls_count = 0
    if st.ai_calls_count >= settings.ai_daily_cap:
        return False
    st.ai_calls_count += 1
    return True
