import WidgetKit
import SwiftUI

// ===== Dữ liệu chia sẻ từ app RN (ghi vào App Group qua src/widget.ts) =====
struct PurrboData: Codable {
    var personaName: String
    var line: String
    var nextName: String
    var nextTime: String
    var done: Int
    var total: Int
    var streak: Int
}

let APP_GROUP = "group.com.purrbo.app"
let WIDGET_KEY = "purrbo_widget"

func loadPurrbo() -> PurrboData {
    let fallback = PurrboData(
        personaName: "Purrbo",
        line: "Chạm để mở Purrbo & xem việc hôm nay 🐾",
        nextName: "Mở app để cập nhật",
        nextTime: "",
        done: 0, total: 0, streak: 0
    )
    guard let defaults = UserDefaults(suiteName: APP_GROUP),
          let raw = defaults.string(forKey: WIDGET_KEY),
          let data = raw.data(using: .utf8),
          let decoded = try? JSONDecoder().decode(PurrboData.self, from: data)
    else { return fallback }
    return decoded
}

struct PurrboEntry: TimelineEntry {
    let date: Date
    let data: PurrboData
}

struct PurrboProvider: TimelineProvider {
    func placeholder(in context: Context) -> PurrboEntry {
        PurrboEntry(date: Date(), data: loadPurrbo())
    }
    func getSnapshot(in context: Context, completion: @escaping (PurrboEntry) -> Void) {
        completion(PurrboEntry(date: Date(), data: loadPurrbo()))
    }
    func getTimeline(in context: Context, completion: @escaping (Timeline<PurrboEntry>) -> Void) {
        let entry = PurrboEntry(date: Date(), data: loadPurrbo())
        // App chủ động reload khi có thay đổi; đây là mốc refresh dự phòng.
        let next = Calendar.current.date(byAdding: .minute, value: 30, to: Date()) ?? Date().addingTimeInterval(1800)
        completion(Timeline(entries: [entry], policy: .after(next)))
    }
}

struct PurrboWidgetView: View {
    var entry: PurrboEntry
    private let pink = Color(red: 1.0, green: 0.30, blue: 0.55)

    var body: some View {
        let d = entry.data
        VStack(alignment: .leading, spacing: 5) {
            HStack {
                Text(d.personaName)
                    .font(.system(size: 13, weight: .heavy))
                    .lineLimit(1)
                Spacer()
                if d.streak > 0 {
                    Text("🔥 \(d.streak)")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundColor(.orange)
                }
            }
            Spacer(minLength: 2)
            Text(d.line)
                .font(.system(size: 12, weight: .medium))
                .foregroundColor(.primary)
                .lineLimit(3)
            Spacer(minLength: 2)
            if !d.nextName.isEmpty {
                HStack(spacing: 5) {
                    if !d.nextTime.isEmpty {
                        Text(d.nextTime)
                            .font(.system(size: 11, weight: .heavy))
                            .foregroundColor(pink)
                    }
                    Text(d.nextName)
                        .font(.system(size: 12, weight: .semibold))
                        .lineLimit(1)
                }
            }
            if d.total > 0 {
                Text("\(d.done)/\(d.total) việc hôm nay")
                    .font(.system(size: 10, weight: .semibold))
                    .foregroundColor(.secondary)
            }
        }
    }
}

struct PurrboWidget: Widget {
    let kind = "PurrboWidget"
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: PurrboProvider()) { entry in
            if #available(iOS 17.0, *) {
                PurrboWidgetView(entry: entry)
                    .padding(14)
                    .containerBackground(.background, for: .widget)
            } else {
                PurrboWidgetView(entry: entry)
                    .padding(14)
            }
        }
        .configurationDisplayName("Purrbo")
        .description("Việc hôm nay & lời nhắc từ bạn đồng hành 🐾")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

@main
struct PurrboWidgetBundle: WidgetBundle {
    var body: some Widget {
        PurrboWidget()
    }
}
