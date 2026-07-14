from __future__ import annotations

from fastapi import APIRouter, Depends

from api.app.deps import get_current_user, get_schedule
from api.app.schemas import NlpIn, NlpOut

router = APIRouter(tags=["nlp"])


@router.post("/nlp/parse", response_model=NlpOut)
async def parse(body: NlpIn, user_id: str = Depends(get_current_user)):
    """Nhập lịch bằng lời → tách field, báo field còn thiếu (persona sẽ hỏi thêm)."""
    parser = get_schedule()
    data = await parser.parse(body.text)
    return NlpOut(**data)
