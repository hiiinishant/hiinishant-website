import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getQuizByDate } from "@/data/quizServer";
import QuizClientPage from "../QuizClientPage";

interface Props {
  params: Promise<{ date: string }>;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDateLabel(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "Asia/Kolkata",
    });
  } catch {
    return dateStr;
  }
}

function optionLabel(quiz: {
  optionA: string; optionB: string;
  optionC: string; optionD: string;
  correctOption?: string;
}): string {
  const map: Record<string, string> = {
    A: quiz.optionA,
    B: quiz.optionB,
    C: quiz.optionC,
    D: quiz.optionD,
  };
  return quiz.correctOption ? map[quiz.correctOption] ?? "" : "";
}

// ── Dynamic Metadata ──────────────────────────────────────────────────────────
// Generated at request time — Google sees real question text in <title> and <meta>

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { date } = await params;
  const quizzes = await getQuizByDate(date);

  if (quizzes.length === 0) {
    return {
      title: `Quiz ${date} — Nishant Kumar`,
      description: `Daily quiz questions published on ${formatDateLabel(date)} by Nishant Kumar (hiiinishant).`,
    };
  }

  const first = quizzes[0];
  const dateLabel = formatDateLabel(date);
  const subjects = [...new Set(quizzes.map((q) => q.subject))].join(", ");
  const questionPreview = first.question.length > 120
    ? first.question.slice(0, 117) + "..."
    : first.question;

  return {
    title: `${questionPreview} | Quiz ${dateLabel} — Nishant Kumar`,
    description: `${dateLabel} Daily Quiz by Nishant Kumar — ${quizzes.length} question${quizzes.length > 1 ? "s" : ""} on ${subjects}. Test your knowledge and earn XP on hiiinishant.com`,
    keywords: [
      "Nishant Kumar quiz",
      "hiiinishant daily quiz",
      "2 AM Study quiz",
      first.subject,
      first.question.slice(0, 60),
      "coding quiz",
      `quiz ${date}`,
    ],
    alternates: {
      canonical: `/quiz/${date}`,
    },
    openGraph: {
      title: `${questionPreview} | Daily Quiz — Nishant Kumar`,
      description: `Answer today's ${subjects} question on hiiinishant.com and earn XP.`,
      url: `https://hiiinishant.com/quiz/${date}`,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

// ── FAQPage JSON-LD Schema ────────────────────────────────────────────────────

function buildFAQSchema(quizzes: Awaited<ReturnType<typeof getQuizByDate>>, date: string) {
  const dateLabel = formatDateLabel(date);

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    name: `Daily Quiz — ${dateLabel} — Nishant Kumar`,
    description: `Quiz questions published by Nishant Kumar (hiiinishant) on ${dateLabel}.`,
    url: `https://hiiinishant.com/quiz/${date}`,
    author: {
      "@type": "Person",
      name: "Nishant Kumar",
      url: "https://hiiinishant.com",
    },
    mainEntity: quizzes.map((quiz) => ({
      "@type": "Question",
      name: quiz.question,
      text: quiz.question,
      answerCount: 4,
      acceptedAnswer: quiz.correctOption
        ? {
            "@type": "Answer",
            text: `Correct Answer: ${quiz.correctOption}) ${optionLabel(quiz)}. Options — A) ${quiz.optionA}  B) ${quiz.optionB}  C) ${quiz.optionC}  D) ${quiz.optionD}`,
          }
        : undefined,
      suggestedAnswer: [
        { "@type": "Answer", text: `A) ${quiz.optionA}` },
        { "@type": "Answer", text: `B) ${quiz.optionB}` },
        { "@type": "Answer", text: `C) ${quiz.optionC}` },
        { "@type": "Answer", text: `D) ${quiz.optionD}` },
      ],
      about: {
        "@type": "Thing",
        name: quiz.subject,
      },
      datePublished: quiz.date,
      publisher: {
        "@type": "Person",
        name: "Nishant Kumar",
        url: "https://hiiinishant.com",
      },
    })),
  };
}

// ── Quiz schema (additionally mark as Quiz content type) ─────────────────────

function buildQuizSchema(quizzes: Awaited<ReturnType<typeof getQuizByDate>>, date: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Quiz",
    name: `Daily Quiz — ${formatDateLabel(date)}`,
    about: {
      "@type": "Thing",
      name: [...new Set(quizzes.map((q) => q.subject))].join(", "),
    },
    author: {
      "@type": "Person",
      name: "Nishant Kumar",
      url: "https://hiiinishant.com",
    },
    datePublished: date,
    url: `https://hiiinishant.com/quiz/${date}`,
    numberOfQuestions: quizzes.length,
  };
}

// ── Page Component ────────────────────────────────────────────────────────────

export default async function QuizDatePage({ params }: Props) {
  const { date } = await params;

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    notFound();
  }

  const quizzes = await getQuizByDate(date);

  // If no quizzes exist for this date, show 404
  if (quizzes.length === 0) {
    notFound();
  }

  const faqSchema = buildFAQSchema(quizzes, date);
  const quizSchema = buildQuizSchema(quizzes, date);

  return (
    <>
      {/* ── Injected JSON-LD schemas — server-rendered, Google reads these ── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(quizSchema) }}
      />

      {/* ── The interactive quiz UI — same as /quiz ── */}
      <QuizClientPage />
    </>
  );
}
