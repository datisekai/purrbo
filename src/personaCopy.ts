// Câu chữ TĨNH đổi theo tính cách persona đang active (nudge Home, note Lịch,
// lời chào Chat). Thoại động vẫn do backend/OpenAI sinh; đây là fallback + copy
// giao diện để mỗi persona "nói" đúng chất mình.
export type PersonaCopy = { home: string; calNote: string; greet: string };

const COPY: Record<string, PersonaCopy> = {
  // tsundere · cà khịa yêu
  mun: {
    home: 'Ơ 3 tiếng chưa uống giọt nào? Định làm khô mực cho em buồn hả 🙄💧',
    calNote: 'Có việc là làm cho đàng hoàng nha, trốn là em cào sofa đó 😼',
    greet: 'Ê cưng 😼 lại đây em canh cho, hôm nay định lười nữa hả?',
  },
  // soft · ngọt xỉu thả thính
  cam: {
    home: 'Cưng ơi nhớ uống nước nha, em thương cưng khoẻ mạnh xinh xinh 🥰💗',
    calNote: 'Cưng làm từ từ thôi, xong việc nào em thương việc đó nè 💗',
    greet: 'Cưng của em tới rồi 🥰 hôm nay mình làm gì cùng nhau nè?',
  },
  // bad-boy · thính thủ lạnh
  ly: {
    home: 'Chưa làm gì hả... tuỳ em thôi, anh không ép. Nhưng làm đi 😏',
    calNote: 'Làm cho xong. Anh xem em có giữ lời không đó.',
    greet: 'Tới rồi hả 😏 ngồi đi, kể anh nghe hôm nay thế nào.',
  },
  // tổng tài · chủ động
  sep: {
    home: 'Lịch hôm nay của em, xử lý gọn gàng giúp anh. Đúng giờ nhé.',
    calNote: 'Kế hoạch rõ ràng rồi đó — thực thi cho tốt.',
    greet: 'Vào việc thôi. Anh sắp lịch cho em rồi đây.',
  },
  // nũng nịu · uwu
  bong: {
    home: 'Cưngg ơi uống nước hong~ Bông thương cưng nhìu lắm nè 🥺💗',
    calNote: 'Cưng làm ngoan Bông thươngg~ cố lên nha 🥺',
    greet: 'Cưngg tớii rồii 🥺 chơi với Bông xíu nha uwu',
  },
  // hype · năng lượng vô cực
  xu: {
    home: 'DẬY QUẨY THÔI CƯNGGG 🔥 hôm nay bùng cháy nào!!',
    calNote: 'Full năng lượng nha, phá đảo hết lịch hôm nay 🔥',
    greet: 'YO cưng!! 🔥 hôm nay mình chiến cái gì nào??',
  },
  // chill · ít nói mà ấm
  bo: {
    home: 'Uống ngụm nước đi cưng... từ từ thôi, không vội đâu 🍵',
    calNote: 'Cứ nhẹ nhàng làm nha, xong lúc nào cũng được 🍃',
    greet: 'Hey... ngồi chơi chút hong 🍵 kể mình nghe đi.',
  },
  // shiba · trung thành quấn chủ
  sin: {
    home: 'Cưng ơi tới giờ rồi nè! Sìn hóng cưng cả ngày luôn á 🐶💗',
    calNote: 'Sìn theo cưng cả ngày, làm gì cũng có Sìn cổ vũ 🐶',
    greet: 'CƯNG VỀ RỒI!! 🐶💗 Sìn nhớ cưng muốn xỉu luôn á!',
  },
};

export function personaCopy(variant?: string): PersonaCopy {
  return COPY[variant || 'mun'] || COPY.mun;
}
