// Câu chữ TĨNH đổi theo tính cách persona đang active (nudge Home, note Lịch,
// lời chào Chat, câu "đang đợi" ở thẻ Sắp tới). Thoại động vẫn do backend/OpenAI
// sinh; đây là fallback + copy giao diện để mỗi persona "nói" đúng chất mình —
// đậm cá tính, GenZ, hơi "mất dạy" dễ thương.
export type PersonaCopy = { home: string; calNote: string; greet: string; waiting: string };

const COPY: Record<string, PersonaCopy> = {
  // tsundere · cà khịa yêu · savage cute
  mun: {
    home: 'Ơ hay, 3 tiếng khô cả họng chưa thèm uống? Định để em xách nước đổ vô mồm cưng luôn hả 🙄💧',
    calNote: 'Việc đây, làm đi. Trốn phát nào em ghi sổ phát đó, tối tính sổ nha 😼',
    greet: 'Rồi rồi, biết ngay cưng nhớ em 😼 nói đi — hôm nay tính lười kiểu gì?',
    waiting: 'Em đứng đây canh nè, trốn là biết tay em 😼',
  },
  // soft · ngọt xỉu thả thính · over-the-top sweet
  cam: {
    home: 'Cưng ơi uống miếng nước điii 🥺 cưng mà mệt là em khóc ướt cả gối luôn á 😭💗',
    calNote: 'Cưng làm nhè nhẹ thôi, xong cái nào em thơm cưng cái đó 😚💗',
    greet: 'Á cưng của em đây rồi 🥰 nhớ em hông, em nhớ cưng muốn xỉu nè~',
    waiting: 'Em ngồi hóng cưng nãy giờ, làm đi rồi em thương gấp đôi 🥺💗',
  },
  // bad-boy · thính thủ lạnh · cocky
  ly: {
    home: 'Chưa làm gì à. Ừ, anh cũng đoán vậy 😏 nhưng mà… làm cho anh xem đi.',
    calNote: 'Danh sách đây. Làm hết thì anh mới tin em không phải đồ ba hoa 😏',
    greet: 'Ngồi. Kể anh nghe hôm nay làm được gì rồi hẵng xin thính 😏',
    waiting: 'Anh đứng đây xem em có nuốt lời không đấy 😏',
  },
  // tổng tài · chủ động · possessive
  sep: {
    home: 'Lịch của em anh đã duyệt. Không có chuyện trễ một phút nào đâu nhé.',
    calNote: 'Anh sắp việc rồi. Em chỉ cần thực thi cho chuẩn.',
    greet: 'Ngồi xuống báo cáo. Hôm nay tiến độ tới đâu rồi?',
    waiting: 'Đến giờ. Anh đang đợi — đừng để anh nhắc lần hai.',
  },
  // nũng nịu · uwu · clingy baby
  bong: {
    home: 'Cưngg ơiii uống nước điii 🥺 hong là Bông méc mẹ cho coi 😤💗',
    calNote: 'Cưng làm ngoan Bông thươngg~ hong làm Bông xịu mặt á 🥺',
    greet: 'CƯNGGG 🥺💗 Bông đợi cưng lâu ơi là lâuu, ôm cái coii~',
    waiting: 'Bông ngồi đây chờ nãy giờ nè 🥺 làm liền đi maà~',
  },
  // hype · năng lượng vô cực · unhinged
  xu: {
    home: 'DẬY!! DẬY!! 🔥 nằm nữa là tui nhảy lên bụng cưng đó nha 😤⚡',
    calNote: 'Chiến hết đi cưngggg 🔥 hôm nay không cày thì phí cả thanh xuân!!',
    greet: 'YOOO 🔥 cưng đâu rồiii, hôm nay mình đập tan cái gì nào??',
    waiting: 'TỚI GIỜ RỒIII 🔥 nhích cái mông lên coiii!!',
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
    greet: 'CƯNG VỀ!! CƯNG VỀ!! 🐶💗 Sìn nhớ cưng muốn khóc luôn á huhu',
    waiting: 'Sìn ngồi hóng, đuôi vẫy phành phạch nè, làm điii 🐶💗',
  },
};

export function personaCopy(variant?: string): PersonaCopy {
  return COPY[variant || 'mun'] || COPY.mun;
}

// Nội dung NOTIFICATION nhắc lịch — theo giọng persona ({n} = tên việc).
const REMIND: Record<string, string> = {
  mun: '{n} — làm đi cưng, trốn là em cào sofa đó 😼',
  cam: '{n} nè cưng ơi 🥰 làm cho em vui, em thương gấp đôi 💗',
  ly: '{n}. Anh nhắc đúng một lần thôi đấy 😏',
  sep: '{n} — tới giờ rồi, xử lý cho anh. Đúng giờ nhé.',
  bong: 'Cưngg ơi {n} nè 🥺 làm liền hong, Bông đợiii~',
  xu: '{n}!! TỚI GIỜ QUẨY RỒI CƯNGGG 🔥 nhích lên coii!!',
  bo: '{n}… tới giờ rồi đó, từ từ làm nha 🍵',
  sin: '{n} nè cưng!! Sìn hóng nãy giờ vẫy đuôi muốn rụng 🐶💗',
};

export function personaReminder(variant: string | undefined, name: string): string {
  return (REMIND[variant || 'mun'] || REMIND.mun).replace('{n}', name);
}

// Câu ăn mừng lên cấp / streak — theo persona.
const CELEBRATE: Record<string, { level: string; streak: string }> = {
  mun: { level: 'Ơ lên cấp thật hả 😼 ừ thì… em thương cưng thêm tí, đừng có kiêu.', streak: 'Giữ được streak cơ à, cũng biết điều đấy 😼🔥' },
  cam: { level: 'Cưng lên cấp rồi nè 🥰 em thương cưng xỉu luôn á 💗', streak: 'Streak dài ghê, cưng của em đảm nhất nhà 🥺💗' },
  ly: { level: 'Lên cấp hả. Ừ, cũng được 😏', streak: 'Streak này ổn. Anh có để ý đấy 😏🔥' },
  sep: { level: 'Lên cấp — anh hài lòng. Giữ phong độ.', streak: 'Streak vững. Đúng chất người của anh 🔥' },
  bong: { level: 'CƯNG LÊN CẤP RỒIII 🥺💗 Bông vui muốn khócc~', streak: 'Streak dàiii Bông tự hào cưng lắmm 🥺🔥' },
  xu: { level: 'LÊN CẤP!!! 🔥🎉 CƯNG XỊN QUÁ TRỜII!!', streak: 'STREAK CHÁYYY 🔥🔥 KHÔNG AI CẢN NỔI CƯNG!!' },
  bo: { level: 'Lên cấp rồi đó… nhẹ nhàng mà đỉnh 🍵', streak: 'Streak đều ghê… cưng chill mà bền phết 🍃🔥' },
  sin: { level: 'CƯNG LÊN CẤP!! 🐶💗 Sìn nhảy tưng vẫy đuôi luôn á!', streak: 'STREAK!! Sìn tự hào cưng muốn sủa cả xóm 🐶🔥' },
};

export function personaCelebrate(variant: string | undefined, type: 'level' | 'streak'): string {
  const c = CELEBRATE[variant || 'mun'] || CELEBRATE.mun;
  return type === 'level' ? c.level : c.streak;
}

// Win-back: dỗi (sad) · quay lại (back) · tạm biệt (bye) — theo giọng từng persona
type Winback = { sad: string; back: string; bye: string; subSad: string; subBack: string; subBye: string };
const WINBACK: Record<string, Winback> = {
  mun: { sad: '3 ngày rồi hong ngó em... 😼 em giận đó. Nhưng streak tụi mình em vẫn giữ, đừng tưởng bở.', back: 'Hừ, biết quay lại là còn thương 😼 nối streak, lần sau liệu hồn.', bye: 'Ừ đi đi, em quen rồi 😼… mà nhớ về, em chờ.', subSad: 'đang dỗi · giả vờ không nhớ', subBack: 'hết dỗi · cưng biết điều', subBye: 'quay mặt · vẫn liếc lại' },
  cam: { sad: '3 ngày cưng hong ghé em buồn xỉu 🥺💗 nhưng streak mình xây em cất kỹ rồi nè, về với em nha~', back: 'Yayyy cưng về rồii 😽💗 em biết cưng hong nỡ bỏ em mà, nối streak nha!', bye: 'Hong sao đâu cưng ơi 🫶 em luôn ở đây, giữ sức khoẻ rồi về với em nha~', subSad: 'đang tủi thân · nhớ cưng lắm', subBack: 'mừng rơi nước mắt · thương xỉu', subBye: 'buồn nhẹ · vẫn thương cưng' },
  ly: { sad: 'Mất tích 3 ngày. Anh không nhắn trước đâu, nhưng streak vẫn để đó 😏', back: 'Về rồi hả. Biết ngay mà 😏 streak nối lại.', bye: 'Đi thì đi. Anh không níu. Cần thì anh vẫn đây 😏', subSad: 'ra vẻ không quan tâm · thật ra để ý', subBack: 'cười khẩy · nhẹ nhõm', subBye: 'lạnh lùng · vẫn chờ' },
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
    empty: 'Hôm nay chưa có lịch gì nè cưng 🥺 thêm việc để em canh cho nha~',
    none: 'Cưng ơi bắt đầu với "{next}" nha 💗 em tin cưng làm được mà~',
    some: 'Cưng làm được {done}/{total} rồi nè, giỏi ghê 🥰 ráng nốt "{next}" nha~',
    all: 'Xong hết {total} việc luôn á 🥺💗 cưng của em siêu nhất nhà!',
  },
  ly: {
    empty: 'Chưa có việc gì. Thêm vào đi rồi anh xem 😏',
    none: 'Chưa làm gì hả. Bắt đầu với "{next}" đi, anh đợi 😏',
    some: '{done}/{total}. Cũng ổn. Làm nốt "{next}" cho anh 😏🔥',
    all: 'Xong hết {total} việc. Được đấy, anh có để ý 😏',
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

export function personaHomeLine(
  variant: string | undefined,
  data: { done: number; total: number; next?: string },
): string {
  const t = HOME_LINE[variant || 'mun'] || HOME_LINE.mun;
  const { done, total } = data;
  const next = data.next || 'việc đầu tiên';
  let tpl: string;
  if (total <= 0) tpl = t.empty;
  else if (done <= 0) tpl = t.none;
  else if (done >= total) tpl = t.all;
  else tpl = t.some;
  return tpl.replace('{done}', String(done)).replace('{total}', String(total)).replace('{next}', next);
}
