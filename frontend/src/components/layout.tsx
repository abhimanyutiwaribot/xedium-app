import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/sidebar/app-sidebar"
import { Navbar } from "./navbar"

export function Layout({ children }: { children: React.ReactNode }) {

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen w-full bg-background transition-clean no-scrollbar">
        <AppSidebar />
        <main className="relative w-full">
          <Navbar />
          <div className="mx-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>

  )
}