import ScholarshipFeed from "@/components/ScholarshipFeed";
import AnimatedWord from "@/components/AnimatedWord";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="mb-8">
        <p className="mb-1 text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Global Scholarship Aggregator
        </p>
        <h1 className="text-3xl font-semibold tracking-tighter sm:text-4xl">
          Find your next <AnimatedWord />
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Hundreds of global opportunities updated daily. Filter by country,<br />
          field, or degree — and get alerts for new matches.
        </p>
      </div>

      <ScholarshipFeed />
    </main>
  );
}
