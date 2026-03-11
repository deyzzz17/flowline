import { tasksAPI } from '@/api/tasks'
import { TaskList } from '@/components/task-list'
import CreateTask from '@/components/create-task'
import React from 'react'

import './styles.css'

export default async function HomePage() {
  const result = await tasksAPI.getAll()
  const tasks = result.docs

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Flowline<span className="text-blue-600">.</span>
          </h1> 
          <CreateTask />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            My To-do List ({tasks.length})
          </h2>
        </div>
        <TaskList tasks={tasks as any} />
      </main>

      <footer className="max-w-2xl mx-auto px-4 py-10 text-center">
        <p className="text-xs text-slate-400">
          Built with Payload & Next.js •
          <a
            href="/admin"
            className="ml-1 text-slate-400 hover:text-blue-600 underline underline-offset-4 transition-colors"
          >
            Open Admin Panel
          </a>
        </p>
      </footer>
    </div>
  )
}
