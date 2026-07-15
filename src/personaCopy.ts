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
