"""Unit test parser lịch (adapters/nlp_mock) — thuần, không cần DB/OpenAI.

Cố định 'hôm nay' = Thứ Năm 16/07/2026 (giờ VN). Chạy: python -m pytest api/tests/test_nlp.py
"""
from adapters.nlp_mock import MockSchedule, _repeat, _parse_time, _weekdays, _now

NOW = "2026-07-16T03:00:00Z"          # 10:00 VN, Thứ Năm 16/07/2026
BASE = _now(NOW)


def R(text: str) -> str:
    return _repeat(text.lower(), BASE)


def T(text: str) -> str:
    return _parse_time(text, text.lower())


async def full(text: str) -> dict:
    return await MockSchedule().parse(text, NOW)


# ---------- BASE đúng ngày (timezone VN) ----------
def test_base_is_thursday_vn():
    assert BASE.weekday() == 3            # Thứ Năm
    assert BASE.strftime("%Y-%m-%d") == "2026-07-16"


def test_now_midnight_boundary_vn():
    # 16:30Z = 23:30 VN Thứ Năm → 'mai' phải là 17/07 (không phải 16 theo UTC).
    base = _now("2026-07-16T16:30:00Z")
    assert base.strftime("%Y-%m-%d") == "2026-07-16"


# ---------- Giờ: sáng/chiều/tối → 24h (BUG B) ----------
def test_time_basic():
    assert T("7h") == "07:00"
    assert T("7h30") == "07:30"
    assert T("18:30") == "18:30"
    assert T("12h trưa") == "12:00"


def test_time_period_conversion():
    assert T("7h tối tập gym") == "19:00"      # BUG B
    assert T("8h tối") == "20:00"
    assert T("3h chiều") == "15:00"
    assert T("8h sáng") == "08:00"
    assert T("11h đêm") == "23:00"


def test_time_single_digit_minute():
    assert T("7h5") == "07:05"                 # không mất phút 1 chữ số


# ---------- Weekday extraction (BUG A) ----------
def test_weekdays_shorthand():
    assert _weekdays("hàng tuần thứ 3 5 7 tập gym") == [1, 3, 5]   # BUG A
    assert _weekdays("thứ 3 thứ 5") == [1, 3]
    assert _weekdays("mỗi thứ 7") == [5]
    assert _weekdays("chủ nhật") == [6]


def test_weekdays_no_false_positive_cn():
    assert _weekdays("đi picnic") == []        # 'cn' trong picnic KHÔNG kích Chủ nhật (BUG G)


# ---------- repeat: daily / hours / once ----------
def test_repeat_daily():
    assert R("uống nước mỗi ngày") == "daily"
    assert R("hàng ngày 7h uống thuốc") == "daily"


def test_repeat_hours():
    assert R("uống nước mỗi 2 tiếng") == "hours:2"


async def test_hours_clears_time():
    out = await full("uống nước mỗi 2h")
    assert out["repeat"] == "hours:2"
    assert out["time"] == ""                   # BUG C


def test_repeat_weekly_shorthand():
    assert R("hàng tuần thứ 3 5 7 tập gym") == "weekly:1,3,5"   # BUG A


# ---------- once: ngày tương đối ----------
def test_once_relative():
    assert R("tập gym 18h hôm nay") == "once:2026-07-16"
    assert R("họp 9h ngày mai") == "once:2026-07-17"
    assert R("đi khám mốt") == "once:2026-07-18"
    assert R("thứ 7 tuần này dọn nhà") == "once:2026-07-18"     # T7 = 18/07


def test_once_next_week():
    # BUG D: 'tuần sau' phải cộng sang tuần kế, không phải tuần này.
    assert R("thứ 6 tuần sau nộp báo cáo") == "once:2026-07-24"  # T6 tuần sau
    assert R("thứ 2 tuần sau") == "once:2026-07-20"              # T2 tuần sau


def test_once_bare_weekday_nearest_future():
    # 'thứ 4' hôm nay Thứ Năm → T4 gần nhất tương lai = 22/07.
    assert R("thứ 4 họp team") == "once:2026-07-22"


def test_default_once_today_not_daily():
    # BUG E: có giờ nhưng KHÔNG từ lặp → once hôm nay, KHÔNG phải daily.
    assert R("18h tập gym") == "once:2026-07-16"
    assert R("đọc sách") == "once:2026-07-16"


def test_cuoi_tuan():
    assert R("cuối tuần đi chơi") == "once:2026-07-18"           # T7 tuần này


# ---------- Integration: full parse ----------
async def test_full_gym_evening():
    out = await full("7h tối tập gym hôm nay")
    assert out["time"] == "19:00"              # BUG B
    assert out["repeat"] == "once:2026-07-16"  # BUG E (không daily)


async def test_full_weekly_gym():
    out = await full("tập gym hàng tuần thứ 3 5 7")
    assert out["repeat"] == "weekly:1,3,5"     # BUG A
    assert out["time"] == ""
