import type { Metadata } from "next";
import QuizClientPage from "./QuizClientPage";

export const metadata: Metadata = {
  title: "Daily Quiz — Nishant Kumar | Test Your Knowledge & Earn XP",
  description: "Answer today's daily quiz question, earn XP, build your streak, and test your knowledge on Nishant Kumar's platform. Topics include JavaScript, React, Data Structures, Algorithms, and more.",
  keywords: [
    "Nishant Kumar quiz",
    "hiiinishant daily quiz",
    "2 AM Study quiz",
    "coding quiz",
    "JavaScript quiz",
    "React quiz",
    "data structures quiz",
    "algorithms quiz",
    "daily challenge",
  ],
  alternates: {
    canonical: "/quiz",
  },
  openGraph: {
    title: "Daily Quiz — Nishant Kumar | Test Your Knowledge & Earn XP",
    description: "Answer today's daily quiz question, earn XP, build your streak, and test your knowledge on Nishant Kumar's platform.",
    url: "https://hiiinishant.com/quiz",
  },
};

export default function QuizPage() {
  return <QuizClientPage />;
}
