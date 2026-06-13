import { Layout } from "@/components/layout";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HelpCircle, MessageCircle, Phone, Mail, ChevronDown, ChevronUp, Send, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const FAQS = [
  {
    q: "কিভাবে ডিপোজিট করব?", 
    a: "Wallet পেজে যান, পরিমাণ দিন, bKash/Nagad/Rocket সিলেক্ট করুন। আমাদের নম্বরে টাকা পাঠিয়ে Transaction ID লিখুন। Admin অনুমোদন করলে আপনার ব্যালেন্সে যোগ হবে।"
  },
  {
    q: "আমার bKash নম্বর কোথায় পাঠাব?",
    a: "আমাদের bKash নম্বর: +8801944265045 (Personal)। Send Money করুন এবং Transaction ID টি Wallet পেজে দিন।"
  },
  {
    q: "ডিপোজিট কতক্ষণে যোগ হয়?",
    a: "সাধারণত ৫-৩০ মিনিটের মধ্যে Admin অনুমোদন করেন। রাত ১২টা থেকে ভোর ৬টার মধ্যে একটু দেরি হতে পারে।"
  },
  {
    q: "সর্বনিম্ন ডিপোজিট কত?",
    a: "সর্বনিম্ন ডিপোজিট ৳100 এবং সর্বোচ্চ একটি transaction-এ ৳50,000।"
  },
  {
    q: "উইথড্র কিভাবে করব?",
    a: "Wallet পেজে Withdraw ট্যাব এ যান, আপনার bKash/Nagad নম্বর দিন এবং পরিমাণ লিখুন। সর্বনিম্ন উইথড্র ৳200।"
  },
  {
    q: "উইথড্র কতক্ষণ লাগে?",
    a: "সাধারণত ৩০ মিনিট থেকে ২ ঘন্টার মধ্যে প্রসেস হয়। VIP সদস্যদের জন্য দ্রুততর।"
  },
  {
    q: "বোনাস কিভাবে পাব?",
    a: "Bonuses পেজে গিয়ে উপলব্ধ বোনাসগুলো দেখুন এবং Claim করুন। ডেইলি লগইন করলে প্রতিদিন বোনাস পাওয়া যায়।"
  },
  {
    q: "একাউন্ট ব্লক হলে কি করব?",
    a: "আমাদের WhatsApp বা Email-এ যোগাযোগ করুন। সাধারণত ২৪ ঘন্টার মধ্যে সমাধান হয়।"
  },
  {
    q: "Provably Fair কি?",
    a: "আমাদের গেম ফলাফল সম্পূর্ণ নিরপেক্ষ। প্রতিটি গেমের Hash Code যাচাই করা যায়।"
  },
  {
    q: "রেফারেল বোনাস কিভাবে পাব?",
    a: "Referrals পেজে আপনার Referral Code বা Link পাবেন। বন্ধু সেই লিংক দিয়ে রেজিস্টার করলে আপনি বোনাস পাবেন।"
  },
];

const CONTACT_METHODS = [
  { icon: "💬", label: "WhatsApp", value: "+8801944265045", link: "https://wa.me/8801944265045", color: "#25D366" },
  { icon: "📱", label: "Telegram", value: "@betroyal_bd", link: "https://t.me/betroyal_bd", color: "#2CA5E0" },
  { icon: "📧", label: "Email", value: "support@betroyal.com", link: "mailto:support@betroyal.com", color: "#E0AA3E" },
];

export default function Support() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [subject, setSubject] = useState("");
  const { toast } = useToast();

  const handleSubmit = () => {
    if (!subject || !message) {
      toast({ title: "সব তথ্য দিন", variant: "destructive" });
      return;
    }
    toast({ title: "✅ বার্তা পাঠানো হয়েছে!", description: "২৪ ঘন্টার মধ্যে উত্তর দেওয়া হবে।" });
    setSubject(""); setMessage("");
  };

  return (
    <Layout>
      <div className="p-4 max-w-2xl mx-auto w-full">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <HelpCircle className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-serif font-bold gold-gradient-text">সাহায্য কেন্দ্র</h1>
            <p className="text-sm text-muted-foreground">যেকোনো সমস্যায় আমরা আছি</p>
          </div>
        </div>

        {/* Contact Methods */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {CONTACT_METHODS.map(c => (
            <a key={c.label} href={c.link} target="_blank" rel="noopener noreferrer"
              className="flex flex-col items-center p-3 rounded-xl border border-white/10 bg-white/3 hover:border-white/30 transition-all text-center">
              <div className="text-2xl mb-1">{c.icon}</div>
              <span className="text-xs font-bold" style={{ color: c.color }}>{c.label}</span>
              <span className="text-[10px] text-muted-foreground truncate w-full text-center">{c.value}</span>
            </a>
          ))}
        </div>

        {/* 24/7 Banner */}
        <div className="bg-gradient-to-r from-primary/20 to-purple-900/20 rounded-2xl p-4 mb-6 border border-primary/20 flex items-center gap-3">
          <div className="text-3xl">🕐</div>
          <div>
            <h3 className="font-bold">২৪/৭ সাপোর্ট</h3>
            <p className="text-sm text-muted-foreground">যেকোনো সময় WhatsApp-এ বার্তা দিন</p>
          </div>
          <a href="https://wa.me/8801944265045" target="_blank" rel="noopener noreferrer"
            className="ml-auto flex-shrink-0">
            <Button size="sm" className="rounded-full text-xs">
              Chat <ExternalLink className="w-3 h-3 ml-1" />
            </Button>
          </a>
        </div>

        {/* FAQ */}
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-primary" /> সাধারণ প্রশ্ন
        </h3>
        <div className="space-y-2 mb-8">
          {FAQS.map((faq, i) => (
            <div key={i} className="rounded-xl border border-white/5 bg-white/3 overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition-colors"
              >
                <span className="font-medium text-sm pr-4">{faq.q}</span>
                {openFaq === i ? <ChevronUp className="w-4 h-4 text-primary flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
              </button>
              <AnimatePresence>
                {openFaq === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="px-4 pb-4 text-sm text-muted-foreground border-t border-white/5 pt-3">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        {/* Contact Form */}
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-primary" /> বার্তা পাঠান
        </h3>
        <div className="space-y-3">
          <Input
            placeholder="বিষয়"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            className="bg-white/5 border-white/10"
          />
          <textarea
            rows={4}
            placeholder="আপনার সমস্যা বিস্তারিত লিখুন..."
            value={message}
            onChange={e => setMessage(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:border-primary/50"
          />
          <Button onClick={handleSubmit} className="w-full rounded-xl">
            <Send className="w-4 h-4 mr-2" /> পাঠান
          </Button>
        </div>
      </div>
    </Layout>
  );
}
