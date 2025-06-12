import { useState } from "react";
import TaskInputForm from "@/components/task-input-form";
import ParsingPreview from "@/components/parsing-preview";
import type { ParsedTask } from "@/lib/natural-language-parser";
import { CalendarDays } from "lucide-react";

export default function TaskManager() {
  const [parsedTask, setParsedTask] = useState<ParsedTask | null>(null);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <CalendarDays className="h-4 w-4 text-white" />
              </div>
              <span className="text-xl font-semibold text-gray-900">TaskFlow</span>
            </div>
            <div className="flex items-center space-x-4">
              <button className="text-gray-500 hover:text-gray-700 transition-colors">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5H9v-5l5-5z" />
                </svg>
              </button>
              <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Smart Task Entry
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Enter tasks naturally and let our AI parse the details. Just type what you need to do, when, and who should handle it.
          </p>
        </div>

        {/* Task Input Form */}
        <TaskInputForm 
          onParsedTask={setParsedTask}
          onTaskCreated={() => {
            // Could add task list refresh logic here
            console.log("Task created successfully");
          }}
        />

        {/* Real-time Parsing Preview */}
        <div className="mt-8">
          <ParsingPreview parsedTask={parsedTask} />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-sm text-gray-500">
            <p>&copy; 2024 TaskFlow. Powered by AI-driven task parsing technology.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
