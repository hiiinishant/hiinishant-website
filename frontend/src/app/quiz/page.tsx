import type { Metadata } from "next";
import QuizClientPage from "./QuizClientPage";

export const metadata: Metadata = {
  title: "Daily Quiz — Challenge Yourself & Earn XP",
  description:
    "Answer today's daily quiz question, earn XP, build your streak, and test your knowledge every day on Nishant Kumar's platform.",
  alternates: {
    canonical: "/quiz",
  },
};

export default function QuizPage() {
  return <QuizClientPage />;
}
