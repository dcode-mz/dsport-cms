"use client";

import * as React from "react";
import {
  Bolt,
  Boxes,
  Calendar,
  GalleryVerticalEnd,
  LayoutDashboard,
  PersonStanding,
  Trophy,
  Volleyball,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import Link from "next/link";

// This is sample data.
const data = {
  user: {
    name: "Adolfo Ricardo",
    email: "adolfo.ricardo@dcode.co.mz",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Dsport",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    // {
    //   name: "Acme Corp.",
    //   logo: AudioWaveform,
    //   plan: "Startup",
    // },
    // {
    //   name: "Evil Corp.",
    //   logo: Command,
    //   plan: "Free",
    // },
  ],
  navMain: [
    {
      title: "Desportos",
      url: "#",
      icon: Volleyball,
      isActive: true,
      items: [
        {
          title: "List",
          url: "/dashboard/sports",
        },
      ],
    },
    {
      title: "Torneios",
      url: "#",
      icon: Trophy,
      items: [
        {
          title: "List",
          url: "/dashboard/tournaments",
        },
        {
          title: "Create",
          url: "/dashboard/tournaments/create",
        },
      ],
    },
    {
      title: "Clubes",
      url: "#",
      icon: Bolt,
      items: [
        {
          title: "List",
          url: "/dashboard/clubs",
        },
      ],
    },
    {
      title: "Equipas",
      url: "#",
      icon: Boxes,
      items: [
        {
          title: "List",
          url: "/dashboard/teams",
        },
      ],
    },
    {
      title: "Jogadores",
      url: "#",
      icon: PersonStanding,
      items: [
        {
          title: "List",
          url: "/dashboard/players",
        },
      ],
    },
    {
      title: "Temporadas",
      url: "#",
      icon: Calendar,
      items: [
        {
          title: "List",
          url: "/dashboard/seasons",
        },
      ],
    },
    // {
    //   title: "Documentation",
    //   url: "#",
    //   icon: BookOpen,
    //   items: [
    //     {
    //       title: "Introduction",
    //       url: "#",
    //     },
    //     {
    //       title: "Get Started",
    //       url: "#",
    //     },
    //     {
    //       title: "Tutorials",
    //       url: "#",
    //     },
    //     {
    //       title: "Changelog",
    //       url: "#",
    //     },
    //   ],
    // },
    // {
    //   title: "Settings",
    //   url: "#",
    //   icon: Settings2,
    //   items: [
    //     {
    //       title: "General",
    //       url: "#",
    //     },
    //     {
    //       title: "Team",
    //       url: "#",
    //     },
    //     {
    //       title: "Billing",
    //       url: "#",
    //     },
    //     {
    //       title: "Limits",
    //       url: "#",
    //     },
    //   ],
    // },
  ],
  // projects: [
  //   {
  //     name: "Design Engineering",
  //     url: "#",
  //     icon: Frame,
  //   },
  //   {
  //     name: "Sales & Marketing",
  //     url: "#",
  //     icon: PieChart,
  //   },
  //   {
  //     name: "Travel",
  //     url: "#",
  //     icon: Map,
  //   },
  // ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Dashboard">
                <LayoutDashboard />
                <Link href="/dashboard">Dashboard</Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        <NavMain items={data.navMain} />
        {/* <NavProjects projects={data.projects} /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
