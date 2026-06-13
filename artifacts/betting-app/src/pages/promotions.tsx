import { Layout } from "@/components/layout";
import { motion } from "framer-motion";
import { Gift, Clock, Zap, Star, Flame, ChevronRight, Calendar } from "lucide-react";
import { Link } from "wouter";
import { formatCurrency } from "@/lib/format";

const PROMOTIONS = [
  {
    id: 1, icon: "🎁", badge: "নতুন", title: "স্বাগত বোনাস", description: "প্রথম ডিপোজিটে ১০০% বোনাস পান",
    value: "১০০% পর্যন্ত ৳10,000", highlight: "#E0AA3E", expires: "সীমাহীন",
    details: ["প্রথম ডিপোজিটে প্রযোজ্য", "সর্বোচ্চ ৳10,000 বোনাস", "৩০x ওয়েজার প্রয়োজন", "সব গেমে প্রযোজ্য"],
  },
  {
    id: 2, icon: "🔥", badge: "HOT", title: "ডেইলি ক্যাশব্যাক", description: "প্রতিদিন ১০% ক্যাশব্যাক পান",
    value: "১০% ক্যাশব্যাক", highlight: "#ef4444", expires: "প্রতিদিন",
    details: ["প্রতিদিন রাত ১২টায় ক্রেডিট", "Losses-এ প্রযোজ্য", "সর্বোচ্চ ৳5,000", "VIP লেভেলে বেশি"],
  },
  {
    id: 3, icon: "🚀", badge: "LIVE", title: "Crash টুর্নামেন্ট", description: "প্রতি সপ্তাহে বিশাল Prize Pool",
    value: "Prize Pool ৳1,00,000", highlight: "#8b5cf6", expires: "সাপ্তাহিক",
    details: ["১০০ জন অংশগ্রহণকারী", "Top 10 পুরস্কার পাবেন", "১০০+ রাউন্ড খেলতে হবে", "লিডারবোর্ডে দেখুন"],
  },
  {
    id: 4, icon: "🎰", badge: "NEW", title: "স্লট ফ্রি স্পিন", description: "ডিপোজিটে পান ফ্রি স্পিন",
    value: "৳500 ডিপোজিটে ৫০ Spins", highlight: "#f59e0b", expires: "সীমিত সময়",
    details: ["৳500+ ডিপোজিটে প্রযোজ্য", "স্লট গেমে ব্যবহার করুন", "প্রতি স্পিন ৳20 মূল্য", "জয় সরাসরি ব্যালেন্সে"],
  },
  {
    id: 5, icon: "👥", badge: "REFERRAL", title: "রেফার করুন, আয় করুন", description: "বন্ধু রেফার করুন বোনাস পান",
    value: "প্রতি রেফারে ৳500", highlight: "#10b981", expires: "সীমাহীন",
    details: ["বন্ধু রেজিস্টার করলে ৳500", "বন্ধু প্রথম ডিপোজিটে ৳1000", "কোনো সীমা নেই", "রেফারেল লিংক শেয়ার করুন"],
  },
  {
    id: 6, icon: "🎂", badge: "VIP", title: "জন্মদিনের বোনাস", description: "জন্মদিনে বিশেষ উপহার পান",
    value: "৳2,000 বোনাস", highlight: "#ec4899", expires: "বার্ষিক",
    details: ["Profile-এ তারিখ যোগ করুন", "VIP Silver+ প্রযোজ্য", "জন্মদিনের দিন ক্রেডিট", "Wager-free বোনাস"],
  },
  {
    id: 7, icon: "⚡", badge: "FLASH", title: "ফ্ল্যাশ ডিপোজিট বোনাস", description: "আগামী ২৪ ঘন্টার বিশেষ অফার",
    value: "৫০% বোনাস সর্বোচ্চ ৳5,000", highlight: "#06b6d4", expires: "২৪ ঘন্টা",
    details: ["সীমিত সময়ের অফার", "যেকোনো ডিপোজিটে প্রযোজ্য", "২০x ওয়েজার", "এখনই সুযোগ নিন"],
  },
  {
    id: 8, icon: "🏆", badge: "VIP", title: "VIP Weekly Reload", description: "প্রতি সোমবার VIP রিলোড বোনাস",
    value: "৩০% পর্যন্ত ৳20,000", highlight: "#E0AA3E", expires: "সাপ্তাহিক সোমবার",
    details: ["Gold+ VIP প্রযোজ্য", "প্রতি সোমবার সকাল ১০টা", "১ সপ্তাহে ১বার", "২৫x ওয়েজার প্রয়োজন"],
  },
];

export default function Promotions() {
  return (
    <Layout>
      <div className="p-4 max-w-2xl mx-auto w-full">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Gift className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-serif font-bold gold-gradient-text">প্রমোশন</h1>
            <p className="text-sm text-muted-foreground">সর্বশেষ অফার ও বোনাস</p>
          </div>
        </div>

        {/* Banner */}
        <div className="relative rounded-2xl overflow-hidden mb-6 h-32 bg-gradient-to-br from-primary/30 via-purple-900/50 to-black border border-primary/30">
          <div className="absolute inset-0 flex items-center p-6">
            <div>
              <p className="text-xs text-primary font-semibold uppercase tracking-widest mb-1">Limited Time</p>
              <h2 className="text-2xl font-serif font-bold">স্বাগত বোনাস</h2>
              <p className="text-sm text-muted-foreground">প্রথম ডিপোজিটে ১০০% পর্যন্ত ৳10,000!</p>
            </div>
          </div>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-6xl opacity-30">🎁</div>
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-none">
          {["সব", "স্বাগত", "ক্যাশব্যাক", "টুর্নামেন্ট", "ফ্রি স্পিন", "রেফারেল"].map(f => (
            <button key={f} className={`flex-shrink-0 px-3 py-1 rounded-full text-xs border transition-all ${
              f === "সব" ? "bg-primary text-black border-primary" : "border-white/10 text-muted-foreground hover:border-white/30"
            }`}>{f}</button>
          ))}
        </div>

        {/* Promotions Grid */}
        <div className="space-y-4">
          {PROMOTIONS.map((promo, i) => (
            <motion.div
              key={promo.id}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.06 }}
              className="rounded-2xl border overflow-hidden"
              style={{ borderColor: promo.highlight + "33" }}
            >
              <div className="p-4" style={{ background: `linear-gradient(135deg, ${promo.highlight}11, transparent)` }}>
                <div className="flex items-start gap-4">
                  <div className="text-4xl">{promo.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-black"
                        style={{ background: promo.highlight }}>{promo.badge}</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />{promo.expires}
                      </span>
                    </div>
                    <h3 className="font-bold text-base">{promo.title}</h3>
                    <p className="text-sm text-muted-foreground">{promo.description}</p>
                    <p className="text-sm font-bold mt-1" style={{ color: promo.highlight }}>{promo.value}</p>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-white/5">
                  <ul className="grid grid-cols-2 gap-1">
                    {promo.details.map((d, j) => (
                      <li key={j} className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Zap className="w-3 h-3 flex-shrink-0" style={{ color: promo.highlight }} />
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>

                <Link href="/wallet">
                  <button className="mt-3 w-full py-2 rounded-xl text-sm font-bold transition-all text-black"
                    style={{ background: `linear-gradient(135deg, ${promo.highlight}, ${promo.highlight}cc)` }}>
                    এখনই নিন
                  </button>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
