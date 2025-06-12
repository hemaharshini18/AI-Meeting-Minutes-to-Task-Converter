import { useState } from "react";
import TaskInputForm from "@/components/task-input-form";
import ParsingPreview from "@/components/parsing-preview";
import TaskBoard from "@/components/task-board";
import type { ParsedTask } from "@/lib/natural-language-parser";
import { CalendarDays, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TaskManager() {
  const [parsedTask, setParsedTask] = useState<ParsedTask | null>(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleTaskCreated = () => {
    setRefreshKey(prev => prev + 1);
    setShowTaskForm(false);
    setParsedTask(null);
  };

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
              <Button
                onClick={() => setShowTaskForm(!showTaskForm)}
                className="bg-primary hover:bg-primary/90"
              >
                {showTaskForm ? (
                  <>
                    <X className="h-4 w-4 mr-2" />
                    Close Form
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Task
                  </>
                )}
              </Button>
              <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Task Input Form - Collapsible */}
        {showTaskForm && (
          <div className="mb-8 animate-in slide-in-from-top-4 duration-300">
            <div className="text-center mb-8">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Smart Task Entry
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Enter tasks naturally and let our AI parse the details. Just type what you need to do, when, and who should handle it.
              </p>
            </div>

            <TaskInputForm 
              onParsedTask={setParsedTask}
              onTaskCreated={handleTaskCreated}
            />

            {/* Real-time Parsing Preview */}
            <div className="mt-8">
              <ParsingPreview parsedTask={parsedTask} />
            </div>
          </div>
        )}

        {/* Task Board */}
        <TaskBoard 
          key={refreshKey}
          onTaskUpdated={() => setRefreshKey(prev => prev + 1)} 
        />
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
