import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getQuizBySlug } from "@/data/quizServer";
import SingleQuestionClientPage from "../../q/[id]/SingleQuestionClientPage";

interface Props {
  params: Promise<{ subject: string; slug: string }>;
}

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

// ── Dynamic Metadata for Google Search ─────────────────────────────────────────
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { subject, slug } = await params;
  const quiz = await getQuizBySlug(subject, slug);

  if (!quiz) {
    return {
      title: "Quiz Question — Nishant Kumar",
      description: "Daily Quiz Question by Nishant Kumar (hiiinishant).",
    };
  }

  const dateLabel = formatDateLabel(quiz.date);
  const titleText = `${quiz.question} | ${quiz.subject} Quiz — Nishant Kumar`;
  const descText = `Practice question: "${quiz.question}". Subject: ${quiz.subject}. Options: A) ${quiz.optionA} B) ${quiz.optionB} C) ${quiz.optionC} D) ${quiz.optionD}. Solve on hiiinishant.com (${dateLabel}) and earn XP.`;
  const canonicalUrl = `/quiz/${encodeURIComponent(subject)}/${encodeURIComponent(slug)}`;

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

// ── QAPage JSON-LD Schema (Google Search Snippet / Answer Box) ─────────────────
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

// ── Quiz JSON-LD Schema ────────────────────────────────────────────────────────
function buildQuizSchema(
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

// ── Canonical Slug Page Component ──────────────────────────────────────────────
export default async function SlugQuestionPage({ params }: Props) {
  const { subject, slug } = await params;
  const quiz = await getQuizBySlug(subject, slug);

  if (!quiz) {
    notFound();
  }

  const qaSchema = buildQAPageSchema(quiz, subject, slug);
  const quizSchema = buildQuizSchema(quiz, subject, slug);

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
