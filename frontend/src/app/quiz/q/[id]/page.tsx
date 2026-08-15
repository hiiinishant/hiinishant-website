import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getQuizById } from "@/data/quizServer";
import SingleQuestionClientPage from "./SingleQuestionClientPage";

interface Props {
  params: Promise<{ id: string }>;
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

// ── Dynamic Metadata for Google Search ─────────────────────────────────────────
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const quiz = await getQuizById(id);

  if (!quiz) {
    return {
      title: "Quiz Question — Nishant Kumar",
      description: "Daily Quiz Question by Nishant Kumar (hiiinishant).",
    };
  }

  const dateLabel = formatDateLabel(quiz.date);
  const titleText = `${quiz.question} | Daily Quiz — Nishant Kumar`;
  const descText = `Question: "${quiz.question}". Subject: ${quiz.subject}. Options: A) ${quiz.optionA} B) ${quiz.optionB} C) ${quiz.optionC} D) ${quiz.optionD}. Test your knowledge and earn XP on hiiinishant.com (${dateLabel}).`;

  return {
    title: titleText,
    description: descText,
    keywords: [
      quiz.question,
      `${quiz.subject} quiz`,
      "Nishant Kumar quiz",
      "hiiinishant daily quiz",
      "2 AM Study quiz",
      "coding question",
      "interview quiz",
    ],
    alternates: {
      canonical: `/quiz/q/${id}`,
    },
    openGraph: {
      title: titleText,
      description: descText,
      url: `https://hiiinishant.com/quiz/q/${id}`,
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

// ── QAPage JSON-LD Schema (Google Featured Snippet / Answer Box) ──────────────
function buildQAPageSchema(quiz: NonNullable<Awaited<ReturnType<typeof getQuizById>>>) {
  const answerText = quiz.correctOption ? optionLabel(quiz) : "";

  return {
    "@context": "https://schema.org",
    "@type": "QAPage",
    name: quiz.question,
    description: `Question on ${quiz.subject} by Nishant Kumar.`,
    url: `https://hiiinishant.com/quiz/q/${quiz.id}`,
    mainEntity: {
      "@type": "Question",
      name: quiz.question,
      text: quiz.question,
      answerCount: 4,
      acceptedAnswer: quiz.correctOption
        ? {
            "@type": "Answer",
            text: `Correct Answer: ${quiz.correctOption}) ${answerText}. Options: A) ${quiz.optionA} | B) ${quiz.optionB} | C) ${quiz.optionC} | D) ${quiz.optionD}`,
            url: `https://hiiinishant.com/quiz/q/${quiz.id}`,
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
function buildQuizSchema(quiz: NonNullable<Awaited<ReturnType<typeof getQuizById>>>) {
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
    url: `https://hiiinishant.com/quiz/q/${quiz.id}`,
    numberOfQuestions: 1,
  };
}

// ── Page Component ────────────────────────────────────────────────────────────
export default async function SingleQuestionPage({ params }: Props) {
  const { id } = await params;
  const quiz = await getQuizById(id);

  if (!quiz) {
    notFound();
  }

  const qaSchema = buildQAPageSchema(quiz);
  const quizSchema = buildQuizSchema(quiz);

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
