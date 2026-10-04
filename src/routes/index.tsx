import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  GraduationCap,
  BookOpen,
  MapPin,
  Phone,
  MessageCircle,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dhaka Tuition Hub — আপনার সন্তানের জন্য টিউটর খুঁজুন" },
      {
        name: "description",
        content:
          "নিচের তথ্যগুলো পূরণ করুন। আপনার দেওয়া তথ্য অনুযায়ী আমরা উপযুক্ত টিউটর খুঁজে দেওয়ার চেষ্টা করব।",
      },
      { property: "og:title", content: "Dhaka Tuition Hub — টিউটর খুঁজুন" },
      {
        property: "og:description",
        content:
          "আপনার সন্তানের জন্য উপযুক্ত টিউটর খুঁজে পেতে ফর্মটি পূরণ করুন।",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

const CLASSES = [
  "১ম শ্রেণি",
  "২য় শ্রেণি",
  "৩য় শ্রেণি",
  "৪র্থ শ্রেণি",
  "৫ম শ্রেণি",
  "৬ষ্ঠ শ্রেণি",
  "৭ম শ্রেণি",
  "৮ম শ্রেণি",
  "৯ম শ্রেণি",
  "১০ম শ্রেণি",
  "একাদশ শ্রেণি",
  "দ্বাদশ শ্রেণি",
  "বিশ্ববিদ্যালয়",
  "অন্যান্য",
];

function StepBadge({ n }: { n: number }) {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
      {n}
    </span>
  );
}

function StepHeader({
  n,
  title,
  subtitle,
}: {
  n: number;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <StepBadge n={n} />
      <div>
        <h3 className="text-base font-bold text-foreground">{title}</h3>
        <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/30 placeholder:text-muted-foreground";

function ChoiceButton({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-xl border px-4 py-3 text-sm font-medium transition ${
        selected
          ? "border-primary bg-primary text-primary-foreground"
          : "border-input bg-background text-foreground hover:border-primary/50"
      }`}
    >
      {children}
    </button>
  );
}

function Index() {
  const [studentClass, setStudentClass] = useState("");
  const [subject, setSubject] = useState("");
  const [gender, setGender] = useState("");
  const [location, setLocation] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [tutorPref, setTutorPref] = useState("");
  const [requirements, setRequirements] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentClass || !subject || !gender || !location || !phone || !tutorPref) {
      setError("অনুগ্রহ করে সকল বাধ্যতামূলক ঘর পূরণ করুন।");
      return;
    }
    setError("");
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 py-16">
        <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-10 text-center shadow-xl">
          <CheckCircle2 className="mx-auto h-16 w-16 text-primary" />
          <h1 className="mt-6 text-2xl font-bold text-foreground">
            আপনার আবেদন গ্রহণ করা হয়েছে!
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            আপনার তথ্য পাওয়ার পর আমাদের টিম আপনার সাথে যোগাযোগ করবে এবং আপনার
            প্রয়োজন অনুযায়ী উপযুক্ত টিউটর খুঁজে দেওয়ার চেষ্টা করবে।
          </p>
          <button
            onClick={() => setSubmitted(false)}
            className="mt-8 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            নতুন আবেদন করুন
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-12 sm:py-16">
      <div className="mx-auto max-w-xl">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg">
            <GraduationCap className="h-9 w-9 text-primary-foreground" />
          </div>
          <h1 className="mt-6 text-3xl font-bold leading-snug text-foreground sm:text-4xl">
            আপনার সন্তানের জন্য টিউটর খুঁজছেন?
          </h1>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
            নিচের তথ্যগুলো পূরণ করুন। আপনার দেওয়া তথ্য অনুযায়ী আমরা উপযুক্ত
            টিউটর খুঁজে দেওয়ার চেষ্টা করব।
          </p>
        </div>

        {/* Form card */}
        <form
          onSubmit={handleSubmit}
          className="mt-10 space-y-8 rounded-3xl border border-border bg-card p-6 shadow-xl sm:p-8"
        >
          {/* 1. Class */}
          <div className="space-y-3">
            <StepHeader
              n={1}
              title="শিক্ষার্থীর শ্রেণি"
              subtitle="শিক্ষার্থীর শ্রেণি নির্বাচন করুন"
            />
            <div className="relative">
              <select
                value={studentClass}
                onChange={(e) => setStudentClass(e.target.value)}
                className={`${inputCls} appearance-none pr-10 ${studentClass ? "" : "text-muted-foreground"}`}
              >
                <option value="" disabled>
                  শ্রেণি নির্বাচন করুন
                </option>
                {CLASSES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>

          {/* 2. Subject */}
          <div className="space-y-3">
            <StepHeader
              n={2}
              title="বিষয়"
              subtitle="কোন বিষয়ের জন্য টিউটর প্রয়োজন?"
            />
            <div className="relative">
              <BookOpen className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="বিষয় লিখুন"
                className={`${inputCls} pl-10`}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              উদাহরণ: গণিত, পদার্থবিজ্ঞান, রসায়ন, ইংরেজি, জীববিজ্ঞান, আইসিটি
              ইত্যাদি।
            </p>
          </div>

          {/* 3. Gender */}
          <div className="space-y-3">
            <StepHeader
              n={3}
              title="শিক্ষার্থীর লিঙ্গ"
              subtitle="শিক্ষার্থী ছেলে নাকি মেয়ে?"
            />
            <div className="flex gap-3">
              <ChoiceButton
                selected={gender === "ছেলে"}
                onClick={() => setGender("ছেলে")}
              >
                ছেলে
              </ChoiceButton>
              <ChoiceButton
                selected={gender === "মেয়ে"}
                onClick={() => setGender("মেয়ে")}
              >
                মেয়ে
              </ChoiceButton>
            </div>
          </div>

          {/* 4. Location */}
          <div className="space-y-3">
            <StepHeader
              n={4}
              title="লোকেশন"
              subtitle="যেখানে টিউটর পড়াবেন সেই এলাকার নাম লিখুন"
            />
            <div className="relative">
              <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="আপনার এলাকার নাম লিখুন"
                className={`${inputCls} pl-10`}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              উদাহরণ: মিরপুর ১০, ধানমন্ডি, উত্তরা, মোহাম্মদপুর ইত্যাদি।
            </p>
          </div>

          {/* 5. Phone */}
          <div className="space-y-3">
            <StepHeader
              n={5}
              title="আপনার ফোন নম্বর"
              subtitle="গার্ডিয়ানের ফোন নম্বর দিন"
            />
            <div className="relative">
              <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01XXXXXXXXX"
                className={`${inputCls} pl-10`}
              />
            </div>
          </div>

          {/* 6. WhatsApp */}
          <div className="space-y-3">
            <StepHeader
              n={6}
              title="WhatsApp নম্বর (ঐচ্ছিক)"
              subtitle="আপনার WhatsApp নম্বর দিন"
            />
            <div className="relative">
              <MessageCircle className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="01XXXXXXXXX"
                className={`${inputCls} pl-10`}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              WhatsApp নম্বর না থাকলে এই ঘরটি ফাঁকা রাখতে পারেন।
            </p>
          </div>

          {/* 7. Tutor preference */}
          <div className="space-y-3">
            <StepHeader
              n={7}
              title="কেমন টিউটর চান?"
              subtitle="আপনার পছন্দের টিউটর নির্বাচন করুন"
            />
            <div className="flex flex-col gap-3 sm:flex-row">
              <ChoiceButton
                selected={tutorPref === "ছেলে টিউটর"}
                onClick={() => setTutorPref("ছেলে টিউটর")}
              >
                ছেলে টিউটর
              </ChoiceButton>
              <ChoiceButton
                selected={tutorPref === "মেয়ে টিউটর"}
                onClick={() => setTutorPref("মেয়ে টিউটর")}
              >
                মেয়ে টিউটর
              </ChoiceButton>
              <ChoiceButton
                selected={tutorPref === "যেকোনো একজন"}
                onClick={() => setTutorPref("যেকোনো একজন")}
              >
                যেকোনো একজন
              </ChoiceButton>
            </div>
          </div>

          {/* 8. Requirements */}
          <div className="space-y-3">
            <StepHeader
              n={8}
              title="টিউটর রিকোয়ারমেন্ট (ঐচ্ছিক)"
              subtitle="আপনার বিশেষ কোনো চাহিদা থাকলে এখানে লিখুন"
            />
            <textarea
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              rows={4}
              placeholder="আপনার চাহিদা লিখুন..."
              className={`${inputCls} resize-none`}
            />
            <ul className="list-inside list-disc space-y-1 text-xs text-muted-foreground">
              <li>নির্দিষ্ট বিশ্ববিদ্যালয়ের শিক্ষার্থী চাই</li>
              <li>অভিজ্ঞ টিউটর চাই</li>
              <li>বাসার কাছাকাছি টিউটর চাই</li>
              <li>ভালো CGPA-এর টিউটর চাই</li>
              <li>নির্দিষ্ট সময়ে পড়াতে পারবেন এমন টিউটর চাই</li>
            </ul>
            <p className="text-xs text-muted-foreground">
              এই অংশটি পূরণ করা বাধ্যতামূলক নয়।
            </p>
          </div>

          {error && (
            <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </p>
          )}

          {/* Submit */}
          <div className="space-y-4 border-t border-border pt-6">
            <p className="text-center text-sm font-medium text-foreground">
              আপনার তথ্য ঠিক আছে কি না দেখে Apply করুন
            </p>
            <button
              type="submit"
              className="w-full rounded-xl bg-primary px-6 py-4 text-base font-bold text-primary-foreground shadow-lg transition hover:opacity-90"
            >
              টিউটর খুঁজুন / APPLY NOW
            </button>
            <p className="text-center text-xs leading-relaxed text-muted-foreground">
              আপনার তথ্য পাওয়ার পর আমাদের টিম আপনার সাথে যোগাযোগ করবে এবং
              আপনার প্রয়োজন অনুযায়ী উপযুক্ত টিউটর খুঁজে দেওয়ার চেষ্টা করবে।
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
