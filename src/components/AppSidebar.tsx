import { FileText, Merge, Scissors, Shield, RefreshCw, Stamp, Zap, Plus, BarChart3 } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";

const mainNavigationItems = [
  { title: "My Files", url: "/dashboard/files", icon: FileText },
  { title: "Merge", url: "/dashboard/merge", icon: Merge },
  { title: "Split", url: "/dashboard/split", icon: Scissors },
  { title: "Redact", url: "/dashboard/redact", icon: Shield },
  { title: "Convert", url: "/dashboard/convert", icon: RefreshCw },
  { title: "Watermark", url: "/dashboard/watermark", icon: Stamp },
  { title: "API", url: "/dashboard/api", icon: Zap },
];

const secondaryNavigationItems = [
  { title: "Feature Requests", url: "/dashboard/feature-requests", icon: Plus },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const { isAdmin } = useAuth();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar className={`${isCollapsed ? "w-14" : "w-64"} sidebar-gradient`} collapsible="icon">
      {/* Logo Header */}
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-lg text-foreground">PDF Pro</span>
              <span className="text-xs text-muted-foreground">Professional Tools</span>
            </div>
          )}
        </div>
      </SidebarHeader>
      
      <SidebarSeparator className="mx-4" />
      
      <SidebarContent className="px-2">
        {/* Main PDF Tools */}
        <SidebarGroup className="px-2">
          <SidebarGroupLabel className="text-sm font-semibold text-muted-foreground px-2 mb-3">
            PDF Tools
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {mainNavigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        `sidebar-nav-button ${
                          isActive
                            ? "sidebar-nav-button-active"
                            : "sidebar-nav-button-inactive"
                        }`
                      }
                    >
                      <item.icon className="h-5 w-5" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Secondary Actions */}
        <SidebarGroup className="mt-auto px-2">
          <SidebarSeparator className="mb-4" />
          <SidebarGroupLabel className="text-xs font-medium text-muted-foreground/80 px-2 mb-3">
            Other
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {secondaryNavigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        `sidebar-secondary-button ${
                          isActive
                            ? "sidebar-secondary-button-active"
                            : "text-muted-foreground"
                        }`
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              
              {isAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to="/dashboard/admin"
                      className={({ isActive }) =>
                        `sidebar-secondary-button ${
                          isActive
                            ? "sidebar-secondary-button-active"
                            : "text-muted-foreground"
                        }`
                      }
                    >
                      <BarChart3 className="h-4 w-4" />
                      {!isCollapsed && <span>App Admin</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}