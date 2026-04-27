import ScholarshipFeed from "@/components/ScholarshipFeed";
import HeroSection from "@/components/HeroSection";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <HeroSection />
      <ScholarshipFeed />
    </main>
  );
}
