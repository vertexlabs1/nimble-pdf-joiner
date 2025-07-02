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
  useSidebar,
} from "@/components/ui/sidebar";

const navigationItems = [
  { title: "My Files", url: "/dashboard/files", icon: FileText },
  { title: "Merge", url: "/dashboard/merge", icon: Merge },
  { title: "Split", url: "/dashboard/split", icon: Scissors },
  { title: "Redact", url: "/dashboard/redact", icon: Shield },
  { title: "Convert", url: "/dashboard/convert", icon: RefreshCw },
  { title: "Watermark", url: "/dashboard/watermark", icon: Stamp },
  { title: "API", url: "/dashboard/api", icon: Zap },
  { title: "➕ Feature Requests", url: "/dashboard/feature-requests", icon: Plus },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const { isAdmin } = useAuth();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar className={isCollapsed ? "w-14" : "w-64"} collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sm font-semibold text-muted-foreground px-2 mb-2">
            PDF Tools
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted"
                        }`
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && <span className="text-sm font-medium">{item.title}</span>}
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
                        `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted"
                        }`
                      }
                    >
                      <BarChart3 className="h-4 w-4" />
                      {!isCollapsed && <span className="text-sm font-medium">App Admin</span>}
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