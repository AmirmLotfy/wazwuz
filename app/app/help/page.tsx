import Link from "next/link";

export default function HelpPage() {
  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="font-display text-4xl font-bold mb-2">Help</h1>
      <p className="text-slate-400 mb-8">
        How to use Wazwuz: upload or camera → talk to the assistant → edit, branch, compare → export.
      </p>
      <div className="space-y-8 text-slate-300">
        <section>
          <h2 className="font-display font-bold text-lg mb-2">Getting started</h2>
          <p className="text-sm mb-2">
            Create a project from the Library by uploading images, or open Camera to capture a frame. Then open the project to enter the Live Edit Studio.
          </p>
          <p className="text-sm">
            From the studio you can view the current image, use the live assistant, make variants, and open Compare, Versions, References, Trend, Compose, or Export from the dock or nav.
          </p>
        </section>
        <section>
          <h2 className="font-display font-bold text-lg mb-2">Live assistant</h2>
          <p className="text-sm mb-2">
            Use the mic in the bottom dock to describe changes. The assistant can suggest variants, relighting, and style directions. Use the suggested action chips (Make variants, Branch here, Reset to original) for quick actions.
          </p>
          <p className="text-sm">
            Use <strong>Interrupt</strong> (coral button) to stop and rephrase. The precision strip on the right lets you tune shadow depth, style intensity, and skin naturalness for edits.
          </p>
        </section>
        <section>
          <h2 className="font-display font-bold text-lg mb-2">Versions and compare</h2>
          <p className="text-sm mb-2">
            Every edit creates a new version. Open <strong>Versions</strong> to see the version graph. Use <strong>Restore</strong> to set a version as current, or <strong>Compare</strong> to open the before/after slider.
          </p>
          <p className="text-sm">
            In Compare, choose before and after versions, drag the divider to reveal differences, then <strong>Keep this</strong> or <strong>Branch this</strong> to set the result as current.
          </p>
        </section>
        <section>
          <h2 className="font-display font-bold text-lg mb-2">Reference boards</h2>
          <p className="text-sm mb-2">
            Open <strong>References</strong> from a project to create boards. Add items by pasting URLs or uploading images. Add notes and tags per item.
          </p>
          <p className="text-sm">
            Use <strong>Analyze board</strong> to run AI over the refs and extract style traits (colors, mood, composition). Use these traits in Trend or when prompting edits.
          </p>
        </section>
        <section>
          <h2 className="font-display font-bold text-lg mb-2">Trend brain</h2>
          <p className="text-sm mb-2">
            Open <strong>Trend</strong> and type a style term (e.g. dark academia, soft minimal). Click <strong>Resolve</strong> to get structured traits.
          </p>
          <p className="text-sm">
            Apply traits to the current image with <strong>Lighting</strong>, <strong>Color</strong>, <strong>Composition</strong>, or <strong>Full vibe</strong>. Each creates a new version.
          </p>
        </section>
        <section>
          <h2 className="font-display font-bold text-lg mb-2">Compose</h2>
          <p className="text-sm">
            Use <strong>Compose</strong> to combine a subject image with optional background and mood images. Pick subject (required), background, and mood from project assets, choose a priority mode, then generate. The result becomes the active version.
          </p>
        </section>
        <section>
          <h2 className="font-display font-bold text-lg mb-2">Batch</h2>
          <p className="text-sm mb-2">
            Open <strong>Studio (Batch)</strong> from the app. Select a project and a <strong>master version</strong> (the look to apply). Create a batch job, then <strong>Generate previews</strong> to see a few samples, or <strong>Run full batch</strong> to apply the master look to all project assets.
          </p>
          <p className="text-sm">
            Outputs appear as new assets in the project. Use them in the version graph or export.
          </p>
        </section>
        <section>
          <h2 className="font-display font-bold text-lg mb-2">Export</h2>
          <p className="text-sm mb-2">
            Open <strong>Export</strong> from a project. Choose a preset (1:1, 4:5, 9:16, marketplace, web hero), then <strong>Download</strong> to get the current image, or <strong>Export to Google Drive</strong> (requires sign-in with Google).
          </p>
          <p className="text-sm">
            Connect Google Drive in <Link href="/app/settings" className="text-primary underline">Settings</Link> by signing in with Google. Drive exports create a folder and share link.
          </p>
        </section>
      </div>
      <Link href="/app" className="mt-8 inline-block text-primary font-mono text-sm uppercase">
        Back to app
      </Link>
    </div>
  );
}
