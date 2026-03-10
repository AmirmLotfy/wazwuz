import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/wazwuz/app-shell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/signin");
  return (
    <div className="min-h-screen bg-background-dark text-foreground flex flex-col">
      <AppShell user={session.user}>
        {children}
      </AppShell>
    </div>
  );
}
