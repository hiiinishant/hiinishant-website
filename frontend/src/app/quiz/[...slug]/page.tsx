import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getQuizByDate, getQuizBySlug } from "@/data/quizServer";
import QuizClientPage from "../QuizClientPage";
import SingleQuestionClientPage from "../q/[id]/SingleQuestionClientPage";

interface Props {
  params: Promise<{ slug: string[] }>;
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
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug: segments } = await params;

  // Case 1: Date Archive (/quiz/YYYY-MM-DD)
  if (segments.length === 1 && /^\d{4}-\d{2}-\d{2}$/.test(segments[0])) {
    const date = segments[0];
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
    const questionPreview =
      first.question.length > 120
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

  // Case 2: Canonical Question Slug (/quiz/[subject]/[slug])
  if (segments.length === 2) {
    const [subject, questionSlug] = segments;
    const quiz = await getQuizBySlug(subject, questionSlug);

    if (!quiz) {
      return {
        title: "Quiz Question — Nishant Kumar",
        description: "Daily Quiz Question by Nishant Kumar (hiiinishant).",
      };
    }

    const dateLabel = formatDateLabel(quiz.date);
    const titleText = `${quiz.question} | ${quiz.subject} Quiz — Nishant Kumar`;
    const descText = `Practice question: "${quiz.question}". Subject: ${quiz.subject}. Options: A) ${quiz.optionA} B) ${quiz.optionB} C) ${quiz.optionC} D) ${quiz.optionD}. Solve on hiiinishant.com (${dateLabel}) and earn XP.`;
    const canonicalUrl = `/quiz/${encodeURIComponent(subject)}/${encodeURIComponent(questionSlug)}`;

    return {
      title: titleText,
      description: descText,
      keywords: [
        quiz.question,
        `${quiz.subject} quiz`,
        `${quiz.subject} mcq questions`,
        `${quiz.subject} practice question`,
        "Nishant Kumar quiz",
        "hiiinishant daily quiz",
        "2 AM Study quiz",
        "interview coding questions",
      ],
      alternates: {
        canonical: canonicalUrl,
      },
      openGraph: {
        title: titleText,
        description: descText,
        url: `https://hiiinishant.com${canonicalUrl}`,
        type: "article",
      },
      twitter: {
        card: "summary_large_image",
        title: titleText,
        description: descText,
      },
      robots: {
        index: true,
        follow: true,
      },
    };
  }

  return {
    title: "Quiz — Nishant Kumar",
  };
}

// ── Schemas for Date Archive ─────────────────────────────────────────────────

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

function buildDateQuizSchema(quizzes: Awaited<ReturnType<typeof getQuizByDate>>, date: string) {
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

// ── Schemas for Question Slug ────────────────────────────────────────────────

function buildQAPageSchema(
  quiz: NonNullable<Awaited<ReturnType<typeof getQuizBySlug>>>,
  subject: string,
  slug: string
) {
  const answerText = quiz.correctOption ? optionLabel(quiz) : "";
  const pageUrl = `https://hiiinishant.com/quiz/${encodeURIComponent(subject)}/${encodeURIComponent(slug)}`;

  return {
    "@context": "https://schema.org",
    "@type": "QAPage",
    name: quiz.question,
    description: `Multiple choice question on ${quiz.subject} by Nishant Kumar.`,
    url: pageUrl,
    mainEntity: {
      "@type": "Question",
      name: quiz.question,
      text: quiz.question,
      answerCount: 4,
      acceptedAnswer: quiz.correctOption
        ? {
            "@type": "Answer",
            text: `Correct Answer: Option ${quiz.correctOption}) ${answerText}. Options: A) ${quiz.optionA} | B) ${quiz.optionB} | C) ${quiz.optionC} | D) ${quiz.optionD}`,
            url: pageUrl,
            author: {
              "@type": "Person",
              name: "Nishant Kumar",
              url: "https://hiiinishant.com",
            },
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
      author: {
        "@type": "Person",
        name: "Nishant Kumar",
        url: "https://hiiinishant.com",
      },
    },
  };
}

function buildSingleQuizSchema(
  quiz: NonNullable<Awaited<ReturnType<typeof getQuizBySlug>>>,
  subject: string,
  slug: string
) {
  return {
    "@context": "https://schema.org",
    "@type": "Quiz",
    name: quiz.question,
    about: {
      "@type": "Thing",
      name: quiz.subject,
    },
    author: {
      "@type": "Person",
      name: "Nishant Kumar",
      url: "https://hiiinishant.com",
    },
    datePublished: quiz.date,
    url: `https://hiiinishant.com/quiz/${encodeURIComponent(subject)}/${encodeURIComponent(slug)}`,
    numberOfQuestions: 1,
  };
}

// ── Unified Page Component ───────────────────────────────────────────────────

export default async function DynamicQuizPage({ params }: Props) {
  const { slug: segments } = await params;

  // Case 1: Date Archive (/quiz/YYYY-MM-DD)
  if (segments.length === 1 && /^\d{4}-\d{2}-\d{2}$/.test(segments[0])) {
    const date = segments[0];
    const quizzes = await getQuizByDate(date);

    if (quizzes.length === 0) {
      notFound();
    }

    const faqSchema = buildFAQSchema(quizzes, date);
    const quizSchema = buildDateQuizSchema(quizzes, date);

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(quizSchema) }}
        />
        <QuizClientPage />
      </>
    );
  }

  // Case 2: Canonical Question Slug (/quiz/[subject]/[slug])
  if (segments.length === 2) {
    const [subject, questionSlug] = segments;
    const quiz = await getQuizBySlug(subject, questionSlug);

    if (!quiz) {
      notFound();
    }

    const qaSchema = buildQAPageSchema(quiz, subject, questionSlug);
    const quizSchema = buildSingleQuizSchema(quiz, subject, questionSlug);

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(qaSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(quizSchema) }}
        />
        <SingleQuestionClientPage initialQuiz={quiz} />
      </>
    );
  }

  notFound();
}
