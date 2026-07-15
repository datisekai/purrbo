# Purrbo — Spec UX màn HOME (character-first)

> Trạng thái: đã chốt hướng (2026-07-15, Finn + Sally). Là **contract** — mock/code xung đột thì theo doc này.
> Nguồn: feedback "app xấu & giống todo app" → phân tích de-todo.

## 1. Vấn đề & nguyên tắc

Home cũ đọc như **todo list**: chồng thẻ trắng đều nhau, persona chỉ là 1 thẻ ngang hàng, không có khoảnh khắc "ngay bây giờ". Purrbo là **game nuôi bạn đồng hành**, không phải todo.

**3 nguyên tắc:**
1. **Nhân vật là HERO** — không phải 1 thẻ ngang hàng với task.
2. **Vòng lặp luôn hiển thị**: làm việc thật → "Khoe" → persona thương hơn (thân thiết + streak tăng). Phải *thấy* được nhân-quả.
3. **Task là phụ** — có mặt để phục vụ quan hệ, không phải trung tâm.

## 2. Kiến trúc thông tin (thứ tự đã khoá, trên→dưới)

| # | Khối | Vai trò |
|---|------|---------|
| 0 | Top bar mỏng: wordmark + chip streak + chip Lv | định vị, nhẹ |
| 1 | **HERO** — chibi toàn thân + **vòng thân thiết bao quanh** + bong bóng thoại | ngôi sao; quan hệ luôn thấy |
| 2 | **SẮP TỚI** spotlight (thẻ hồng đậm) — việc kế tiếp + nút Khoe to | khoảnh khắc hành động |
| 3 | **Cả ngày** — list việc GỌN, xong thì mờ | phụ, không phải checklist trung tâm |
| 4 | Nhiệm vụ — **strip nhỏ** cuối | giữ chân, không tranh chỗ |

(Đã có: #2 spotlight. Cần làm: #1 hero ring + #3 hạ cấp list + #4 strip.)

## 3. Quyết định đã chốt

- **CHỈ SỐ thân thiết KHÔNG ở Home** (đổi 2026-07-15, Finn). Bỏ vòng progress + Lv/điểm + chip Lv khỏi Home. Chỉ số quan hệ (Lv, tiến độ) để dành cho **màn Persona/Hồ sơ**.
  - *Vì sao:* "thân thiết" gánh 2 việc — chỉ số (stats, hợp Persona) và payoff cảm xúc (hợp Home). Đặt chỉ số ở Home biến nhân vật thành "đồng hồ đo", hơi grind.
- **Nhân vật vẫn là HERO ở Home** (trên "Sắp tới"), có animation: **nhún nhẹ liên tục** cho sống.
- **Thưởng khi Khoe = CẢM XÚC (không chỉ số)**: mèo nhảy đổi biểu cảm `love` + **"+N 💗" bay thoáng** + câu thương (thoại đổi). Giữ linh hồn vòng lặp mà không dựng thanh/vòng cố định.
- **Nhiệm vụ = strip nhỏ cuối Home**.
- Streak (metric thói quen) vẫn ở góc trên; chỉ bỏ chip Lv (thân thiết).

## 4. Hành vi component

### Hero (nhân vật + vòng thân thiết)
- Chibi toàn thân (`PersonaChibi`) cỡ lớn (~110–130), biểu cảm theo trạng thái (mặc định `love`/`happy`).
- **Vòng progress** quanh chibi = `affinity_points / mốc Lv tiếp theo`. Màu tím (`purple`).
- Số nhỏ dưới: `Thân thiết Lv.X · 320/500`. Streak = chip lửa ở top bar.
- Nền khu hero = tint (không trắng) để tách khỏi list — tạo "sân khấu" cho nhân vật.
- Bong bóng thoại: `home_nudge` từ backend (fallback: câu persona).

### Spotlight "Sắp tới" (đã có)
- Việc undone gần giờ hiện tại nhất (ưu tiên còn phía trước trong ngày).
- Nút "Khoe ngay" là hành động chính của màn.

### Reward flow (LEAN) — khi bấm Khoe
1. Optimistic: việc → done.
2. Vòng thân thiết animate chạy lên giá trị mới; **"+N 💗" float** ngắn.
3. Chibi nhảy 1 nhịp + đổi biểu cảm `love` ~1s rồi về.
4. Streak nảy nếu tăng. Lên Lv/mốc streak → `CelebrationModal` (đã có).

### List "Cả ngày" (hạ cấp)
- Row gọn hơn (icon nhỏ, ít bóng), phân biệt rõ với hero/spotlight.
- Việc đang ở spotlight → ẩn khỏi list (tránh trùng).
- Xong → mờ + gạch ngang, dồn xuống.
- Rỗng → empty state "Chưa có việc — thêm để bạn đồng hành nhắc cưng".

## 5. States
- **Loading**: skeleton cho hero + list.
- **Empty (chưa có việc)**: hero vẫn hiện (nhân vật là chính), spotlight thay bằng CTA "Thêm việc đầu tiên".
- **Tất cả đã xong**: spotlight thành lời khen "Hôm nay cưng ngoan xỉu 💗", vòng thân thiết đầy nhịp.
- **Offline/backend die**: giữ nhân vật + số 0 an toàn (không bịa mock).

## 6. Flow chính (climax = khoảnh khắc được thương)

*Finn, 22t, 10h sáng, vừa mở app:*
1. Thấy **mèo Mun** to giữa màn, vòng thân thiết đang ~64%, thoại cà khịa "chưa uống giọt nào hả".
2. Ngay dưới: **SẮP TỚI · Tập gym 18:00** — nhưng "Uống nước 9:00" đang trễ → spotlight ưu tiên việc hợp lý.
3. Finn bấm **"Khoe ngay"** → **[CLIMAX]** vòng thân thiết chạy lên, "+5 💗" bay, mèo nhảy đổi mặt `love`. Finn *cảm* được "mình làm → em vui".
4. Việc mờ đi, spotlight nhảy sang việc kế tiếp. Finn ghé lại lúc 18h.

## 7. Voice
- Giọng persona (cà khịa yêu/nũng tùy con), ngôi "em" ↔ "cưng".
- Không dùng từ hệ thống khô ("Task", "Hoàn thành") — dùng "việc", "khoe", "được thương".
