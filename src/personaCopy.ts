// Câu chữ TĨNH đổi theo tính cách persona đang active (nudge Home, note Lịch,
// lời chào Chat, câu "đang đợi" ở thẻ Sắp tới). Thoại động vẫn do backend/OpenAI
// sinh; đây là fallback + copy giao diện để mỗi persona "nói" đúng chất mình.
export type PersonaCopy = { home: string; calNote: string; greet: string; waiting: string };

const COPY: Record<string, PersonaCopy> = {
  // tsundere · cà khịa yêu
  mun: {
    home: 'Ơ 3 tiếng chưa uống giọt nào? Định làm khô mực cho em buồn hả 🙄💧',
    calNote: 'Có việc là làm cho đàng hoàng nha, trốn là em cào sofa đó 😼',
    greet: 'Ê cưng 😼 lại đây em canh cho, hôm nay định lười nữa hả?',
    waiting: 'Em canh nè, trốn là em dỗi cả tối đó 😼',
  },
  // soft · ngọt xỉu thả thính
  cam: {
    home: 'Cưng ơi nhớ uống nước nha, em thương cưng khoẻ mạnh xinh xinh 🥰💗',
    calNote: 'Cưng làm từ từ thôi, xong việc nào em thương việc đó nè 💗',
    greet: 'Cưng của em tới rồi 🥰 hôm nay mình làm gì cùng nhau nè?',
    waiting: 'Em đang hóng cưng làm nè, cố lên nha 🥰💗',
  },
  // bad-boy · thính thủ lạnh
  ly: {
    home: 'Chưa làm gì hả... tuỳ em thôi, anh không ép. Nhưng làm đi 😏',
    calNote: 'Làm cho xong. Anh xem em có giữ lời không đó.',
    greet: 'Tới rồi hả 😏 ngồi đi, kể anh nghe hôm nay thế nào.',
    waiting: 'Anh đợi xem em có làm thật không đó 😏',
  },
  // tổng tài · chủ động
  sep: {
    home: 'Lịch hôm nay của em, xử lý gọn gàng giúp anh. Đúng giờ nhé.',
    calNote: 'Kế hoạch rõ ràng rồi đó — thực thi cho tốt.',
    greet: 'Vào việc thôi. Anh sắp lịch cho em rồi đây.',
    waiting: 'Đến giờ rồi, xử lý cho anh nhé.',
  },
  // nũng nịu · uwu
  bong: {
    home: 'Cưngg ơi uống nước hong~ Bông thương cưng nhìu lắm nè 🥺💗',
    calNote: 'Cưng làm ngoan Bông thươngg~ cố lên nha 🥺',
    greet: 'Cưngg tớii rồii 🥺 chơi với Bông xíu nha uwu',
    waiting: 'Bông đợi cưng nãy giờ nè, làm liền hong~ 🥺',
  },
  // hype · năng lượng vô cực
  xu: {
    home: 'DẬY QUẨY THÔI CƯNGGG 🔥 hôm nay bùng cháy nào!!',
    calNote: 'Full năng lượng nha, phá đảo hết lịch hôm nay 🔥',
    greet: 'YO cưng!! 🔥 hôm nay mình chiến cái gì nào??',
    waiting: 'Tới giờ rồi cưngggg, quẩy liền đi 🔥',
  },
  // chill · ít nói mà ấm
  bo: {
    home: 'Uống ngụm nước đi cưng... từ từ thôi, không vội đâu 🍵',
    calNote: 'Cứ nhẹ nhàng làm nha, xong lúc nào cũng được 🍃',
    greet: 'Hey... ngồi chơi chút hong 🍵 kể mình nghe đi.',
    waiting: 'Tới lúc rồi... làm nhẹ nhàng thôi nha 🍃',
  },
  // shiba · trung thành quấn chủ
  sin: {
    home: 'Cưng ơi tới giờ rồi nè! Sìn hóng cưng cả ngày luôn á 🐶💗',
    calNote: 'Sìn theo cưng cả ngày, làm gì cũng có Sìn cổ vũ 🐶',
    greet: 'CƯNG VỀ RỒI!! 🐶💗 Sìn nhớ cưng muốn xỉu luôn á!',
    waiting: 'Sìn hóng cưng nãy giờ luôn á, làm nha 🐶💗',
  },
};

export function personaCopy(variant?: string): PersonaCopy {
  return COPY[variant || 'mun'] || COPY.mun;
}
