import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border-muted px-6 py-4">
        <Link href="/" className="font-display font-bold text-xl">
          Wazwuz
        </Link>
      </header>
      <main className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="font-display text-4xl font-bold mb-6">Privacy</h1>
        <p className="text-slate-400 mb-6">
          Privacy policy content will be added here. We use your data only to
          run the service and do not sell it.
        </p>
        <Link href="/" className="text-primary hover:underline">
          Back to home
        </Link>
      </main>
    </div>
  );
}
