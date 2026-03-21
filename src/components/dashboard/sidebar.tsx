import { SidebarContent } from './sidebar-content'

export const Sidebar = () => {
  return (
    <aside className="hidden h-full w-56 shrink-0 flex-col border-r border-border/60 bg-background md:flex">
      <SidebarContent />
    </aside>
  )
}
