import { Toaster } from "@/components/ui/sonner";

export default function LiveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  console.log("Layout sem AppSidebar carregado");
  return (
    <>
      <main className="w-full">{children}</main>
      <Toaster />
    </>
  );
}
