import ProjectSidebar from "@/components/ProjectSidebar";

export default function ProjetLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex grow h-screen overflow-hidden">
      <ProjectSidebar />
      <main className="p-4 flex flex-col grow overflow-auto">
        {children}
      </main>
    </div>
  )
}
