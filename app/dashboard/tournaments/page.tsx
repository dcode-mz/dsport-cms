import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@radix-ui/react-separator";
import { columns } from "./columns";
import { Tournament } from "@/app/types/tournament";
import { AppTable } from "@/components/app-table";
import Link from "next/link";
import { Button } from "@/components/ui/button";

async function TournamentPage() {
  const data = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/tournament`, {
    method: "GET",
    next: {
      tags: ["get-tournaments"],
    },
  });

  const response: Tournament[] = await data.json();

  return (
    <SidebarProvider>
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="#">
                    Building Your Application
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Data Fetching</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-10 md:pl-20">
          <h1 className="text-3xl font-bold">Torneios</h1>
          <Link href="/dashboard/tournaments/create">
            <Button className="cursor-pointer">Criar Torneio</Button>
          </Link>
          <AppTable columns={columns} data={response} />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default TournamentPage;
