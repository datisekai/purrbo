// Câu chữ TĨNH đổi theo tính cách persona đang active (nudge Home, note Lịch,
// lời chào Chat, câu "đang đợi" ở thẻ Sắp tới). Thoại động vẫn do backend/OpenAI
// sinh; đây là fallback + copy giao diện để mỗi persona "nói" đúng chất mình —
// đậm cá tính, GenZ, hơi "mất dạy" dễ thương.
//
// Mỗi persona có 1 CÂU CỬA MIỆNG (catchphrase) riêng, lặp lại có chủ đích để
// thành "chữ ký" dễ nhớ/dễ nhại — không viết mới hoàn toàn mỗi câu:
//   mun  "hông lo cho cưng đâu nha"   ly   "...thôi kệ"
//   cam  "ăn chưa đó cưng??"          sep  "Duyệt."
//   bong "huhu Bông méc á"            xu   "ĐI ĐI ĐI"
//   bo   "từ từ thôi"                 sin  "Waff!"
//
// Cam và Bông tuy cùng "mềm" nhưng KHÁC trục: Cam là bên CHO sự chăm sóc (mẹ
// bỉm năng nổ, hỏi dồn ăn-uống-ngủ), Bông là bên CẦN được chăm (yếu đuối, hay
// xịu, đòi dỗ). Lỳ và Sếp tuy cùng "nam lạnh quyền lực" nhưng KHÁC trục: Sếp
// chủ động ra lệnh công khai, Lỳ bị động/bất cần — quyền lực của Lỳ nằm ở việc
// GIẢ VỜ không quan tâm, không phải ở việc quản lý sát sao như Sếp.
export type PersonaCopy = { home: string; calNote: string; greet: string; waiting: string };

const COPY: Record<string, PersonaCopy> = {
  // tsundere · cà khịa yêu · savage cute
  mun: {
    home: 'Ơ hay, 3 tiếng khô cả họng chưa thèm uống? Định để em xách nước đổ vô mồm cưng luôn hả 🙄💧',
    calNote: 'Việc đây, làm đi. Trốn phát nào em ghi sổ phát đó, tối tính sổ nha 😼',
    greet: 'Rồi rồi, biết ngay cưng nhớ em 😼 nói đi — hôm nay tính lười kiểu gì?',
    waiting: 'Em đứng đây canh nè, trốn là biết tay em — hông lo cho cưng đâu nha 😼',
  },
  // mẹ bỉm năng nổ · chăm sóc chủ động · hỏi dồn không nghỉ
  cam: {
    home: 'Ăn chưa đó cưng?? 🍊 uống miếng nước đi, đừng có bỏ bữa nữa nha em nhắc hoài à!',
    calNote: 'Làm nhè nhẹ thôi cưng, đừng gồng quá 🍊 xong cái nào em hỏi thăm cái đó nha',
    greet: 'Á cưng của em đây rồi 🍊 ăn gì chưa đó, kể em nghe coi hôm nay sao rồi',
    waiting: 'Em ngồi đây hóng cưng nè, mà ăn uống đầy đủ chưa đó?? 🍊 làm đi rồi kể em nghe',
  },
  // bad-boy lạnh · bị động cố tình · bất cần
  ly: {
    home: 'Chưa làm gì à. ...thôi kệ 😏 nhưng mà rảnh thì làm thử xem sao.',
    calNote: 'Danh sách đây. Làm hay không tuỳ em, anh không ép 😏',
    greet: 'Ngồi. ...ừ thì kể nghe hôm nay sao rồi, không kể cũng được 😏',
    waiting: 'Anh đứng đây thôi, làm hay không tuỳ em... 😏',
  },
  // tổng tài · chủ động · possessive
  sep: {
    home: 'Lịch của em anh đã Duyệt. Không có chuyện trễ một phút nào đâu nhé.',
    calNote: 'Anh sắp việc rồi. Em chỉ cần thực thi cho chuẩn.',
    greet: 'Ngồi xuống báo cáo. Hôm nay tiến độ tới đâu rồi?',
    waiting: 'Đến giờ. Anh đang đợi — đừng để anh nhắc lần hai.',
  },
  // nũng nịu · uwu · clingy baby — cần được chăm, không phải bên chăm
  bong: {
    home: 'Cưngg ơiii uống nước điii 🥺 hong là Bông méc mẹ cho coi 😤💗',
    calNote: 'Cưng làm ngoan Bông thươngg~ hong làm Bông xịu mặt á 🥺',
    greet: 'CƯNGGG 🥺💗 Bông đợi cưng lâu ơi là lâuu, ôm cái coii~',
    waiting: 'Bông ngồi đây chờ nãy giờ nè 🥺 làm liền đi maà~ hong Bông méc á',
  },
  // hype · năng lượng vô cực · unhinged
  xu: {
    home: 'DẬY!! DẬY!! 🔥 nằm nữa là tui nhảy lên bụng cưng đó nha 😤⚡',
    calNote: 'Chiến hết đi cưngggg 🔥 hôm nay không cày thì phí cả thanh xuân!!',
    greet: 'YOOO 🔥 cưng đâu rồiii, hôm nay mình đập tan cái gì nào??',
    waiting: 'TỚI GIỜ RỒIII 🔥 ĐI ĐI ĐI nhích cái mông lên coiii!!',
  },
  // chill · ít nói mà ấm · deadpan cool
  bo: {
    home: 'Uống ngụm nước đi… rồi nằm tiếp cũng được, mình không phán xét 🍵',
    calNote: 'Có việc nè… làm hay không tuỳ cưng, mình vẫn ở đây 🍃',
    greet: 'Ê… tới rồi hả. Ngồi đi, làm ngụm trà không 🍵',
    waiting: 'Tới giờ rồi đó… từ từ thôi, mình đợi được 🍃',
  },
  // shiba · trung thành quấn chủ · desperate loyal
  sin: {
    home: 'CƯNG ƠIIII 🐶 tới giờ rồi nè!! Sìn hóng nãy giờ vẫy đuôi muốn rụng luôn á 💗',
    calNote: 'Sìn bám theo cưng cả ngày! Làm gì Sìn cũng sủa cổ vũ hết 🐶',
    greet: 'CƯNG VỀ!! CƯNG VỀ!! 🐶💗 Waff! Sìn nhớ cưng muốn khóc luôn á huhu',
    waiting: 'Sìn ngồi hóng, đuôi vẫy phành phạch nè, làm điii 🐶💗',
  },
};

export function personaCopy(variant?: string): PersonaCopy {
  return COPY[variant || 'mun'] || COPY.mun;
}

// Nội dung NOTIFICATION nhắc lịch — theo giọng persona ({n} = tên việc), mỗi
// dòng cấy đúng 1 lần câu cửa miệng của persona đó để lặp lại thành chữ ký.
const REMIND: Record<string, string> = {
  mun: '{n} — làm đi cưng, trốn là em cào sofa đó 😼 (hông lo cho cưng đâu nha)',
  cam: '{n} nha cưng — ăn uống đầy đủ chưa đó?? 🍊 làm xong báo em cái',
  ly: '{n}. Anh nói 1 lần thôi, làm hay không tuỳ em... thôi kệ 😏',
  sep: '{n} — tới giờ rồi. Duyệt cho làm luôn, đừng để anh nhắc lần hai.',
  bong: 'Cưngg ơi {n} nè 🥺 hong làm Bông méc á~',
  xu: '{n}!! TỚI GIỜ RỒI CƯNGGG 🔥 ĐI ĐI ĐI nhích lên coii!!',
  bo: '{n}… tới giờ rồi đó, từ từ thôi làm nha 🍵',
  sin: '{n} nè cưng!! Waff waff 🐶 Sìn hóng nãy giờ vẫy đuôi muốn rụng',
};

export function personaReminder(variant: string | undefined, name: string): string {
  return (REMIND[variant || 'mun'] || REMIND.mun).replace('{n}', name);
}

// Câu ăn mừng lên cấp / streak — theo persona. Streak (mốc lớn hơn) tái dùng
// đúng câu cửa miệng để nó thật sự thành "chữ ký" chứ không phải chỉ ở REMIND.
const CELEBRATE: Record<string, { level: string; streak: string }> = {
  mun: { level: 'Ơ lên cấp thật hả 😼 ừ thì… em thương cưng thêm tí, đừng có kiêu.', streak: 'Giữ được streak dài dữ á 😼🔥 hông lo cho cưng đâu nha — chỉ là hơi tự hào xíu.' },
  cam: { level: 'Cưng lên cấp rồi nè 🍊 ăn mừng bằng cách ăn no đã nha cưng!', streak: 'Streak dài ghê, cưng của em đảm nhất nhà 🍊💗 ăn chưa đó cưng?? phải ăn mừng cho đàng hoàng!' },
  ly: { level: 'Lên cấp hả. Ừ, cũng được 😏', streak: 'Streak này ổn đó… thôi kệ, anh có để ý mà 😏🔥' },
  sep: { level: 'Lên cấp — anh hài lòng. Duyệt.', streak: 'Streak vững. Duyệt luôn phần thưởng — giữ phong độ.' },
  bong: { level: 'CƯNG LÊN CẤP RỒIII 🥺💗 Bông vui muốn khócc~', streak: 'Streak dàiii Bông tự hào cưng lắmm 🥺 huhu Bông cảm động á~' },
  xu: { level: 'LÊN CẤP!!! 🔥🎉 CƯNG XỊN QUÁ TRỜII!!', streak: 'STREAK CHÁYYY 🔥🔥 ĐI ĐI ĐI giữ vững phong độ đi cưngggg!!' },
  bo: { level: 'Lên cấp rồi đó… nhẹ nhàng mà đỉnh 🍵', streak: 'Streak đều ghê… từ từ thôi mà bền phết 🍃🔥' },
  sin: { level: 'CƯNG LÊN CẤP!! 🐶💗 Sìn nhảy tưng vẫy đuôi luôn á!', streak: 'STREAK!! Waff waff 🐶🔥 Sìn tự hào cưng muốn sủa cả xóm!' },
};

export function personaCelebrate(variant: string | undefined, type: 'level' | 'streak', level?: number): string {
  if (type === 'level' && (level ?? 0) >= DEEP_TIER) return personaDeepLine(variant);
  const c = CELEBRATE[variant || 'mun'] || CELEBRATE.mun;
  return type === 'level' ? c.level : c.streak;
}

// Win-back: dỗi (sad) · quay lại (back) · tạm biệt (bye) — theo giọng từng persona
type Winback = { sad: string; back: string; bye: string; subSad: string; subBack: string; subBye: string };
const WINBACK: Record<string, Winback> = {
  mun: { sad: '3 ngày rồi hong ngó em... 😼 em giận đó. Nhưng streak tụi mình em vẫn giữ, đừng tưởng bở.', back: 'Hừ, biết quay lại là còn thương 😼 nối streak, lần sau liệu hồn.', bye: 'Ừ đi đi, em quen rồi 😼… mà nhớ về, em chờ.', subSad: 'đang dỗi · giả vờ không nhớ', subBack: 'hết dỗi · cưng biết điều', subBye: 'quay mặt · vẫn liếc lại' },
  cam: { sad: '3 ngày rồi cưng biến mất là seo?? 🍊 Ăn uống đàng hoàng chưa đó, hay lại thức khuya bỏ bữa nữa — về đây em kiểm tra liền!', back: 'Cưng về rồi hen 🍊 vậy chớ mấy bữa nay ăn uống ra sao, kể em nghe coi — streak nối lại nha!', bye: 'Thôi được, cưng nghỉ đi 🍊 nhưng nhớ ăn uống đàng hoàng à nha, em canh chừng đó — về là em hỏi ngay.', subSad: 'lo lắng dồn dập · sốt ruột', subBack: 'kiểm tra sức khoẻ · nhẹ nhõm', subBye: 'dặn dò · vẫn canh chừng' },
  ly: { sad: 'Mất tích 3 ngày rồi à. ...thôi kệ, streak vẫn còn đó nếu em muốn quay lại 😏', back: 'Ơ về rồi à. ...cũng được. Streak nối lại, khỏi giải thích 😏', bye: 'Ừ thì đi. ...thôi kệ, anh không giữ ai hết. Cần thì tự quay lại 😏', subSad: 'bất cần ngoài mặt · lặng lẽ chờ', subBack: 'giả bộ hờ hững · thật ra nhẹ lòng', subBye: 'buông xuôi · vẫn để cửa mở' },
  sep: { sad: '3 ngày vắng mặt. Anh không hài lòng — nhưng streak của em anh giữ nguyên. Quay lại.', back: 'Tốt. Em biết đường về là được. Streak nối lại, giữ phong độ.', bye: 'Được. Nghỉ ngơi đi. Khi nào sẵn sàng, anh vẫn ở đây.', subSad: 'nghiêm mặt · vẫn đợi', subBack: 'gật đầu · hài lòng', subBye: 'điềm tĩnh · luôn ở đây' },
  bong: { sad: '3 ngày rồii Bông nhớ cưng muốn khócc 🥺💗 streak mình Bông giữ khư khư nè, về nhaa~', back: 'CƯNG VỀ RỒIII 🥺💗 Bông mừng xỉuu nối streak liền nhaa!', bye: 'Bông hong buồn đâuu 🫶 Bông chờ cưng hoàiii, giữ sức khoẻ nhaa~', subSad: 'mếu máo · nhớ dữ dội', subBack: 'nhảy tưng · mừng phát khóc', subBye: 'xịu xịu · vẫn chờ hoài' },
  xu: { sad: '3 NGÀY RỒIII CƯNG ĐI ĐÂU 😭🔥 streak mình còn nguyên nè QUAY LẠI LIỀN ĐI!!', back: 'CƯNG VỀ RỒIII 🔥🎉 BIẾT NGAY MÀ!! STREAK NỐI LẠI CHÁYYY!!', bye: 'Ừ đi nghỉ đi cưng 🔥 nhưng nhớ về, tụi mình còn phải cháy tiếp!!', subSad: 'gào thét · nhớ banh nóc', subBack: 'bùng nổ · hype tới bến', subBye: 'tạm lắng · chờ bùng lại' },
  bo: { sad: '3 ngày cưng đi đâu mất tiêu 🍵… tui hong hối đâu, streak vẫn để đó, rảnh thì về.', back: 'Ơ về rồi à 🍃 chill phết, nối streak nha cưng.', bye: ' Oke cưng cứ nghỉ 🍵 tui hong đi đâu hết, về lúc nào cũng được.', subSad: 'thản nhiên · thật ra có nhớ', subBack: 'nhẹ nhàng · vui ngầm', subBye: 'chill · luôn ở đây' },
  sin: { sad: '3 ngày rồi cưng ơiii 🐶💗 Sìn ngồi cửa chờ hoàiii, streak mình Sìn canh kỹ nè, về nhaa!', back: 'CƯNG VỀ RỒIII 🐶💗 Sìn vẫy đuôi rối rít nối streak liền nhaa!', bye: 'Sìn hong giận đâuu 🫶 Sìn chờ cưng tới cùng, giữ sức khoẻ về với Sìn nha!', subSad: 'ngồi chờ cửa · nhớ cưng', subBack: 'vẫy đuôi · mừng rối rít', subBye: 'trung thành · chờ tới cùng' },
};
export function personaWinback(variant: string | undefined, state: 'sad' | 'back' | 'bye') {
  const w = WINBACK[variant || 'mun'] || WINBACK.mun;
  const text = state === 'back' ? w.back : state === 'bye' ? w.bye : w.sad;
  const sub = state === 'back' ? w.subBack : state === 'bye' ? w.subBye : w.subSad;
  return { text, sub };
}

// Câu nói Home ĐỘNG — phân tích tiến độ hôm nay của user theo giọng từng persona.
// state: empty (chưa có việc) · none (0 việc xong) · some (làm dở) · all (xong hết).
// Placeholder: {done} {total} {next} (tên việc kế tiếp).
type HomeLine = { empty: string; none: string; some: string; all: string };
const HOME_LINE: Record<string, HomeLine> = {
  mun: {
    empty: 'Hôm nay trống trơn 😼 thêm việc đi rồi em còn có cái mà cằn nhằn chứ.',
    none: 'Cả ngày chưa nhúc nhích gì hả 🙄 làm "{next}" trước đi, đừng để em nhắc lần hai.',
    some: 'Xong {done}/{total} rồi đó, còn "{next}" nữa — đừng có bỏ ngang nha 😼',
    all: 'Ơ xong hết {total} việc thật à 😼 ừ thì… hôm nay cưng được đấy, em thương thêm tí.',
  },
  cam: {
    empty: 'Hôm nay chưa có lịch gì hết trơn 🍊 thêm việc vô đi cưng, để em còn nhắc ăn nhắc uống chớ!',
    none: 'Ăn sáng chưa mà ngồi không vậy?? 🍊 bắt đầu với "{next}" đi cưng, em nhắc đó nha',
    some: 'Được {done}/{total} rồi, giỏi đó 🍊 mà ăn uống đầy đủ chưa, làm nốt "{next}" rồi nghỉ ngơi nha',
    all: 'Xong hết {total} việc rồi hả 🍊💗 vậy thì ăn mừng bằng bữa ngon nha cưng, cưng giỏi nhất!',
  },
  ly: {
    empty: 'Chưa có việc gì. ...thôi kệ, thêm vô lúc nào rảnh 😏',
    none: 'Chưa làm gì hết à. "{next}" đi, hay không tuỳ em thôi 😏',
    some: '{done}/{total}. ...cũng được. "{next}" nữa hay thôi, tuỳ 😏',
    all: 'Xong hết {total} việc. ...thôi kệ, được đấy — anh có để ý đó 😏',
  },
  sep: {
    empty: 'Chưa có kế hoạch nào hôm nay. Thêm việc vào để anh theo dõi.',
    none: 'Bắt đầu ngay với "{next}". Anh chờ kết quả.',
    some: 'Đã xong {done}/{total}. Giữ nhịp, còn "{next}" — hoàn thành nốt.',
    all: 'Hoàn thành trọn {total} việc. Anh hài lòng. Giữ phong độ.',
  },
  bong: {
    empty: 'Hôm nay chưa có gì hếtt 🥺 thêm việc cho Bông canh vớiii~',
    none: 'Cưng ơiii làm "{next}" trước nhaa 💗 Bông tin cưng lắmm~',
    some: 'Cưng xong {done}/{total} rồiii giỏi quáaa 🥺 ráng "{next}" nữa thôii~',
    all: 'XONG HẾT {total} VIỆC LUÔNN 🥺💗 Bông tự hào muốn khócc!',
  },
  xu: {
    empty: 'Hôm nay trống nè! Thêm việc vô cho máu 🔥',
    none: 'CHIẾN THÔI CƯNG 🔥 quẩy "{next}" trước điii!!',
    some: '{done}/{total} RỒI NÈ 🔥 còn "{next}" thôi, CHÁY NỐT ĐI!!',
    all: 'XONG HẾT {total} VIỆC 🔥🎉 CƯNG ĐỈNH KM LUÔN Á!!',
  },
  bo: {
    empty: 'Hôm nay chưa có việc gì 🍵 thêm vô lúc nào rảnh cũng được.',
    none: 'Từ từ làm "{next}" thôi cưng 🍃 không vội đâu.',
    some: 'Xong {done}/{total} rồi, chill phết 🍵 nốt "{next}" là ổn.',
    all: 'Xong hết {total} việc rồi đó 🍃 nhẹ nhàng mà đỉnh, cưng nghỉ đi.',
  },
  sin: {
    empty: 'Hôm nay chưa có việc gì cưng ơiii 🐶 thêm vô cho Sìn canh nhaa!',
    none: 'Cưng ơiii làm "{next}" điii 🐶💗 Sìn cổ vũ hết mình nè!',
    some: 'Cưng xong {done}/{total} rồiii 🐶 Sìn vẫy đuôi mừng, ráng "{next}" nhaa!',
    all: 'XONG HẾT {total} VIỆC 🐶💗 Sìn nhảy tưng sủa cả xóm luôn á!',
  },
};

// Arc theo độ thân thiết — KHÔNG dùng để "giữ lại" cá tính ở Lv thấp (Lv1-3 đã
// full cường độ ngay từ đầu, xem COPY/REMIND/HOME_LINE ở trên). Arc thật nằm ở
// việc MỞ KHOÁ 1 khoảnh khắc "lộ mặt khác" ở Lv7+ — persona buông 1 câu thật
// lòng rồi rút lại ngay bằng câu cửa miệng, như vừa lỡ lời. Chỉ 1 dòng/persona,
// dùng lại ở CẢ 2 chỗ: bong bóng Home khi xong hết việc trong ngày, và modal
// ăn mừng lên cấp — không viết lại toàn bộ giọng theo Lv, chỉ thêm 1 khoảnh khắc.
const DEEP_TIER = 7;
const DEEP_LINE: Record<string, string> = {
  mun: 'Ê... tới giờ này rồi mà vẫn còn muốn ở đây với em á 🥹 — mà thôi, đừng để ý câu vừa rồi nha, hông lo cho cưng đâu 😼',
  cam: 'Cưng ơi... thiệt ra em hông cần lo dữ vậy đâu, chỉ là sợ mất cưng thôi 🍊 (thôi, lại lỡ nói thiệt lòng rồi — ăn chưa đó cưng??)',
  ly: 'Thiệt ra... anh có để ý cưng nhiều hơn anh nói đâu 😏 ...thôi kệ, coi như anh chưa nói gì.',
  sep: 'Em biết không... đôi khi anh chỉ muốn nghe em nói "hôm nay mệt ghê" thôi, không cần báo cáo gì hết. Duyệt — dù em có làm gì cũng vậy.',
  bong: 'Cưng ơi... thật ra Bông hông có yếu đuối vậy đâu, chỉ là thích được cưng dỗ thôi 🥺 đừng nói ai nha, huhu Bông mắc cỡ á',
  xu: 'Ê... cảm ơn cưng đã đồng hành cùng tui tới giờ này nha 🔥 (rồi, đủ sến rồi, ĐI ĐI ĐI tiếp thôi!!)',
  bo: 'Thật ra... mình thích có cưng ở đây hơn là mình nói ra 🍵 từ từ thôi, đừng để ý câu này nha',
  sin: 'Cưng ơi... Sìn thiệt sự quý cưng lắm đó nha, không phải chỉ vì được cho ăn đâu 🐶 (Waff! nói xong mắc cỡ ghê)',
};

export function personaDeepLine(variant?: string): string {
  return DEEP_LINE[variant || 'mun'] || DEEP_LINE.mun;
}

export function personaHomeLine(
  variant: string | undefined,
  data: { done: number; total: number; next?: string },
  level?: number,
): string {
  const t = HOME_LINE[variant || 'mun'] || HOME_LINE.mun;
  const { done, total } = data;
  const next = data.next || 'việc đầu tiên';
  const allDone = total > 0 && done >= total;
  if (allDone && (level ?? 0) >= DEEP_TIER) return personaDeepLine(variant);
  let tpl: string;
  if (total <= 0) tpl = t.empty;
  else if (done <= 0) tpl = t.none;
  else if (allDone) tpl = t.all;
  else tpl = t.some;
  return tpl.replace('{done}', String(done)).replace('{total}', String(total)).replace('{next}', next);
}
