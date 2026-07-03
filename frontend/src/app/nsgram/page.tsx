import NsgramApp from "@/components/nsgram/NsgramApp";

export const metadata = {
  title: "Nsgram",
  description: "A simple social platform with profiles, posts, likes, comments, chat, and notifications.",
  alternates: {
    canonical: "/nsgram",
  },
};

export default function NsgramPage() {
  return <NsgramApp />;
}
