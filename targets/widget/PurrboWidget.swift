import WidgetKit
import SwiftUI
import AppIntents

let APP_GROUP = "group.com.purrbo.app"
let WIDGET_KEY = "purrbo_widget"

// ===== Dữ liệu chia sẻ từ app RN (ghi qua src/widget.ts) =====
struct PurrboData: Codable {
    var personaVariant: String
    var nextId: Int
    var nextName: String
    var nextTime: String
    var done: Int
    var total: Int
    var streak: Int
    var token: String
    var apiBase: String
}

func loadPurrbo() -> PurrboData {
    let fallback = PurrboData(personaVariant: "mun", nextId: 0, nextName: "", nextTime: "",
                              done: 0, total: 0, streak: 0, token: "", apiBase: "")
    guard let d = UserDefaults(suiteName: APP_GROUP),
          let raw = d.string(forKey: WIDGET_KEY),
          let data = raw.data(using: .utf8),
          let decoded = try? JSONDecoder().decode(PurrboData.self, from: data)
    else { return fallback }
    return decoded
}

// Màu accent theo persona (khớp variant trong app).
func personaColor(_ v: String) -> Color {
    switch v {
    case "cam": return Color(red: 1.0, green: 0.62, blue: 0.30)
    case "ly": return Color(red: 0.91, green: 0.45, blue: 0.23)
    case "sep": return Color(red: 0.55, green: 0.48, blue: 0.69)
    case "bong": return Color(red: 0.96, green: 0.65, blue: 0.75)
    case "xu": return Color(red: 0.20, green: 0.83, blue: 0.60)
    case "bo": return Color(red: 0.50, green: 0.72, blue: 0.49)
    case "sin": return Color(red: 0.91, green: 0.69, blue: 0.29)
    default: return Color(red: 0.42, green: 0.39, blue: 0.50) // mun
    }
}

// ===== App Intent: tick "Xong" ngay trên widget (iOS 17+) =====
@available(iOS 17.0, *)
struct MarkDoneIntent: AppIntent {
    static var title: LocalizedStringResource = "Khoe việc đã xong"
    @Parameter(title: "habitId") var habitId: Int

    init() {}
    init(habitId: Int) { self.habitId = habitId }

    func perform() async throws -> some IntentResult {
        let d = UserDefaults(suiteName: APP_GROUP)
        guard let raw = d?.string(forKey: WIDGET_KEY),
              var cur = try? JSONDecoder().decode(PurrboData.self, from: raw.data(using: .utf8) ?? Data()),
              habitId > 0, !cur.token.isEmpty, !cur.apiBase.isEmpty,
              let url = URL(string: "\(cur.apiBase)/v1/habits/\(habitId)/khoe")
        else { return .result() }
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("Bearer \(cur.token)", forHTTPHeaderField: "Authorization")
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        _ = try? await URLSession.shared.data(for: req)
        // Optimistic: tăng done + ẩn việc vừa xong cho lần render tới.
        cur.done = min(cur.total, cur.done + 1)
        cur.nextId = 0; cur.nextName = ""; cur.nextTime = ""
        if let enc = try? JSONEncoder().encode(cur), let s = String(data: enc, encoding: .utf8) {
            d?.set(s, forKey: WIDGET_KEY)
        }
        return .result()
    }
}

struct PurrboEntry: TimelineEntry {
    let date: Date
    let data: PurrboData
}

struct PurrboProvider: TimelineProvider {
    func placeholder(in context: Context) -> PurrboEntry { PurrboEntry(date: Date(), data: loadPurrbo()) }
    func getSnapshot(in context: Context, completion: @escaping (PurrboEntry) -> Void) {
        completion(PurrboEntry(date: Date(), data: loadPurrbo()))
    }
    func getTimeline(in context: Context, completion: @escaping (Timeline<PurrboEntry>) -> Void) {
        let next = Calendar.current.date(byAdding: .minute, value: 30, to: Date()) ?? Date().addingTimeInterval(1800)
        completion(Timeline(entries: [PurrboEntry(date: Date(), data: loadPurrbo())], policy: .after(next)))
    }
}

// Nút tick — iOS17 tương tác trực tiếp; iOS16 chỉ hiện chip (mở app để khoe).
struct DoneButton: View {
    let id: Int
    let color: Color
    var body: some View {
        if #available(iOS 17.0, *), id > 0 {
            Button(intent: MarkDoneIntent(habitId: id)) {
                Label("Xong", systemImage: "checkmark")
                    .font(.system(size: 13, weight: .bold))
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 7)
            }
            .buttonStyle(.plain)
            .foregroundColor(.white)
            .background(color)
            .clipShape(Capsule())
        } else {
            Label("Xong", systemImage: "checkmark")
                .font(.system(size: 13, weight: .bold))
                .frame(maxWidth: .infinity).padding(.vertical, 7)
                .foregroundColor(color).background(color.opacity(0.15)).clipShape(Capsule())
        }
    }
}

struct NextTask: View {
    let d: PurrboData
    var body: some View {
        if d.nextName.isEmpty {
            VStack(alignment: .leading, spacing: 2) {
                Text("Xong hết rồi 🎉").font(.system(size: 15, weight: .heavy))
                Text("nghỉ ngơi thôi cưng").font(.system(size: 11)).foregroundColor(.secondary)
            }
        } else {
            VStack(alignment: .leading, spacing: 1) {
                if !d.nextTime.isEmpty {
                    Text(d.nextTime).font(.system(size: 22, weight: .heavy))
                }
                Text(d.nextName).font(.system(size: 13, weight: .semibold))
                    .lineLimit(1).foregroundColor(.secondary)
            }
        }
    }
}

// ---- Small (2x2) ----
struct SmallView: View {
    let d: PurrboData
    var body: some View {
        let c = personaColor(d.personaVariant)
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Circle().fill(c).frame(width: 20, height: 20)
                Spacer()
                if d.total > 0 {
                    Text("\(d.done)/\(d.total)").font(.system(size: 12, weight: .bold)).foregroundColor(.secondary)
                }
            }
            Spacer()
            NextTask(d: d)
            Spacer()
            if !d.nextName.isEmpty { DoneButton(id: d.nextId, color: c) }
        }
    }
}

// ---- Medium (4x2) ----
struct MediumView: View {
    let d: PurrboData
    var body: some View {
        let c = personaColor(d.personaVariant)
        HStack(spacing: 14) {
            VStack(spacing: 6) {
                Circle().fill(c).frame(width: 42, height: 42)
                if d.streak > 0 { Text("🔥 \(d.streak)").font(.system(size: 12, weight: .bold)) }
            }
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Text("Việc kế tiếp").font(.system(size: 11, weight: .bold)).foregroundColor(.secondary)
                    Spacer()
                    if d.total > 0 { Text("\(d.done)/\(d.total)").font(.system(size: 11, weight: .bold)).foregroundColor(.secondary) }
                }
                NextTask(d: d)
                if !d.nextName.isEmpty { DoneButton(id: d.nextId, color: c) }
            }
        }
    }
}

struct PurrboWidgetView: View {
    @Environment(\.widgetFamily) var family
    var entry: PurrboEntry
    var body: some View {
        if family == .systemMedium { MediumView(d: entry.data) }
        else { SmallView(d: entry.data) }
    }
}

struct PurrboWidget: Widget {
    let kind = "PurrboWidget"
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: PurrboProvider()) { entry in
            if #available(iOS 17.0, *) {
                PurrboWidgetView(entry: entry).padding(14).containerBackground(.background, for: .widget)
            } else {
                PurrboWidgetView(entry: entry).padding(14)
            }
        }
        .configurationDisplayName("Purrbo")
        .description("Việc kế tiếp + tick Xong ngay 🐾")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

@main
struct PurrboWidgetBundle: WidgetBundle {
    var body: some Widget { PurrboWidget() }
}
