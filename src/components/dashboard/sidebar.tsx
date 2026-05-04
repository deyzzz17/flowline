import { SidebarContent } from './sidebar-content'

export const Sidebar = () => {
  return (
    <aside className="hidden h-screen w-56 shrink-0 flex-col border-r border-border/60 bg-sidebar md:flex sticky top-0">
      <SidebarContent />
    </aside>
  )
}
