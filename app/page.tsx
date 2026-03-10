import Link from "next/link";
import Image from "next/image";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border-muted bg-background/80 backdrop-blur-md px-6 lg:px-20 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="bg-primary p-1.5 rounded-sm">
              <Image
                src="/logo-icon.png"
                alt="Wazwuz"
                width={24}
                height={24}
                className="block"
              />
            </div>
            <span className="font-display text-xl font-bold tracking-tight">
              Wazwuz
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-10">
            <a
              href="#features"
              className="font-mono text-xs uppercase tracking-widest text-slate-400 hover:text-primary transition-colors"
            >
              Features
            </a>
            <a
              href="#loop"
              className="font-mono text-xs uppercase tracking-widest text-slate-400 hover:text-primary transition-colors"
            >
              How it works
            </a>
            <a
              href="#faq"
              className="font-mono text-xs uppercase tracking-widest text-slate-400 hover:text-primary transition-colors"
            >
              FAQ
            </a>
          </nav>
          <div className="flex items-center gap-4">
            <Link
              href="/signin"
              className="hidden sm:block font-mono text-xs uppercase tracking-widest px-4 py-2 border border-border-muted hover:bg-surface rounded-lg transition-all"
            >
              Login
            </Link>
            <Link
              href="/signin"
              className="bg-primary text-background-dark font-display font-bold text-sm px-6 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
            >
              Start Creating
            </Link>
          </div>
        </div>
      </header>
      <main>
        <section className="max-w-7xl mx-auto px-6 lg:px-20 pt-20 pb-32">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="flex flex-col gap-8">
              <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 w-fit">
                <span className="font-mono text-[10px] text-primary uppercase font-bold tracking-tighter">
                  Live creative operating system
                </span>
              </div>
              <h1 className="font-display text-6xl md:text-8xl font-bold leading-[0.9] tracking-tighter">
                What are we{" "}
                <span className="text-primary italic">making?</span>
              </h1>
              <p className="text-xl text-slate-400 max-w-md font-light leading-relaxed">
                Live AI creative partner for image workflows. Camera-aware
                guidance, voice, and non-destructive editing—then export to
                Drive.
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <Link
                  href="/signin"
                  className="flex items-center gap-2 bg-primary text-background-dark font-display font-black text-lg px-8 py-4 rounded-xl hover:shadow-[0_0_40px_rgba(199,255,56,0.3)] transition-all"
                >
                  Drop an image
                </Link>
                <Link
                  href="/signin"
                  className="flex items-center gap-2 bg-surface text-white border border-border-muted font-display font-bold text-lg px-8 py-4 rounded-xl hover:bg-border-muted transition-all"
                >
                  Go live
                </Link>
              </div>
            </div>
            <div className="relative aspect-square rounded-2xl overflow-hidden border border-border-muted bg-surface">
              <Image
                src="/logo.png"
                alt="Wazwuz"
                fill
                className="object-contain p-12"
              />
            </div>
          </div>
        </section>
        <section id="features" className="max-w-7xl mx-auto px-6 lg:px-20 py-24">
          <div className="mb-12 text-center">
            <h2 className="font-display text-4xl font-bold tracking-tight mb-4">
              Features
            </h2>
            <p className="text-slate-400 font-mono text-sm tracking-widest uppercase">
              Everything you need to create
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "Live assistant", desc: "Voice and real-time guidance in the studio." },
              { title: "Version graph", desc: "Branch, compare, and restore any version." },
              { title: "Reference boards", desc: "Collect refs and analyze style traits." },
              { title: "Export", desc: "Presets, download, or push to Google Drive." },
            ].map((f) => (
              <div
                key={f.title}
                className="p-6 rounded-2xl border border-border-muted bg-surface/50 hover:border-primary/30 transition-colors"
              >
                <h3 className="font-display font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>
        <section className="max-w-7xl mx-auto px-6 lg:px-20 pb-8">
          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                quote: "Wazwuz feels like an art director sitting beside me, not another prompt box.",
                by: "Maya, Product Photographer",
              },
              {
                quote: "Live voice + version branching cut my campaign iteration time by more than half.",
                by: "Jules, DTC Creative Lead",
              },
              {
                quote: "Drive delivery is finally part of the same workflow, so approvals move fast.",
                by: "Nia, Studio Manager",
              },
            ].map((item) => (
              <blockquote
                key={item.by}
                className="p-5 rounded-2xl border border-border-muted bg-surface/60"
              >
                <p className="text-sm text-slate-300 leading-relaxed">{item.quote}</p>
                <footer className="mt-3 font-mono text-[10px] uppercase text-slate-500 tracking-widest">
                  {item.by}
                </footer>
              </blockquote>
            ))}
          </div>
        </section>
        <section id="faq" className="max-w-3xl mx-auto px-6 lg:px-20 py-24">
          <div className="mb-12 text-center">
            <h2 className="font-display text-4xl font-bold tracking-tight mb-4">
              FAQ
            </h2>
          </div>
          <div className="space-y-4">
            {[
              { q: "What is Wazwuz?", a: "Wazwuz is a live AI creative partner for image workflows. You upload or capture images, talk to the assistant, and get non-destructive edits, variants, and export to Drive." },
              { q: "Do I need to sign in?", a: "Yes. Sign in with Google or use the magic link (email) to access the app and save projects." },
              { q: "Where are my images stored?", a: "Projects and assets are stored in your account. Export downloads go to your device; Drive export uses your Google Drive." },
              { q: "Can I use the camera on mobile?", a: "Yes. The camera page supports front and back cameras, overlays, and output targets (e.g. 4:5, 9:16)." },
            ].map((faq) => (
              <details
                key={faq.q}
                className="group p-4 rounded-xl border border-border-muted bg-surface/50"
              >
                <summary className="font-display font-bold cursor-pointer list-none">
                  {faq.q}
                </summary>
                <p className="mt-2 text-sm text-slate-500">{faq.a}</p>
              </details>
            ))}
          </div>
        </section>
        <section
          id="loop"
          className="bg-surface py-24 border-y border-border-muted"
        >
          <div className="max-w-7xl mx-auto px-6 lg:px-20">
            <div className="mb-16 text-center lg:text-left">
              <h2 className="font-display text-4xl font-bold tracking-tight mb-4">
                The Creative Loop
              </h2>
              <p className="text-slate-400 font-mono text-sm tracking-widest uppercase">
                From capture to export
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-0">
              {[
                { icon: "Upload/Camera", title: "Upload or camera", desc: "Start with raw intent. Live feed or files." },
                { icon: "Talk", title: "Talk & listen", desc: "Describe changes in real time." },
                { icon: "Guidance", title: "Live guidance", desc: "AI suggests lighting and composition." },
                { icon: "Edit", title: "Edit", desc: "Variants, branch, reset—non-destructive." },
                { icon: "Branch", title: "Branch", desc: "Version graph and compare mode." },
                { icon: "Export", title: "Export", desc: "Download or push to Google Drive." },
              ].map((step) => (
                <div
                  key={step.title}
                  className="group relative flex flex-col items-center lg:items-start p-6 border-b lg:border-b-0 lg:border-r border-border-muted hover:bg-background transition-colors"
                >
                  <span className="font-mono text-primary text-sm mb-2">
                    {step.icon}
                  </span>
                  <h4 className="font-display font-bold text-lg mb-2">
                    {step.title}
                  </h4>
                  <p className="text-sm text-slate-500 text-center lg:text-left">
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
        <footer className="border-t border-border-muted py-12 px-6 lg:px-20">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="font-display font-bold text-lg">Wazwuz</span>
            <div className="flex items-center gap-6 font-mono text-xs text-slate-500 uppercase tracking-widest">
              <Link href="/privacy" className="hover:text-primary transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-primary transition-colors">
                Terms
              </Link>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
