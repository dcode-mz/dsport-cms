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
import { ResponseBody } from "@/app/types/response-body";
import { Team, TeamCharacteristics } from "@/app/types/team";
import CreateTeamDialog from "@/components/create-team-dialog";
import { AppTable } from "@/components/app-table";

async function TeamPage() {
  const data = await fetch("http://localhost:4000/team", {
    method: "GET",
    next: {
      tags: ["get-teams"],
    },
  });

  const characteristicsData = await fetch(
    "http://localhost:4000/team/characteristics",
    {
      method: "GET",
      next: {
        tags: ["get-characteristics-teams"],
      },
    }
  );
  const response: ResponseBody<Team[]> = await data.json();

  const characteristicsResponse: ResponseBody<TeamCharacteristics> =
    await characteristicsData.json();

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
          <h1 className="text-3xl font-bold">Equipas</h1>
          <CreateTeamDialog
            characteristicsResponse={characteristicsResponse.payload}
          />
          <AppTable columns={columns} data={response.payload} />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default TeamPage;
