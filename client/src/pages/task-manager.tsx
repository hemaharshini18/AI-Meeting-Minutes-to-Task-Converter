import { useState, useEffect } from "react";
import TaskInputForm from "@/components/task-input-form";
import ParsingPreview from "@/components/parsing-preview";
import TaskBoard from "@/components/task-board";
import type { ParsedTask } from "@/lib/natural-language-parser";
import { CalendarDays } from "lucide-react";
import UnifiedTaskEntry from "@/components/unified-task-entry";

export default function TaskManager() {
  console.log("TaskManager component rendering");
  const [parsedTask, setParsedTask] = useState<ParsedTask | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showMeetingParser, setShowMeetingParser] = useState(false);

  useEffect(() => {
    console.log("TaskManager component mounted");
  }, []);

  const handleTaskCreated = () => {
    console.log("Task created callback triggered");
    setRefreshKey(prev => prev + 1);
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
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Unified Task Entry */}
        <UnifiedTaskEntry 
          onTaskAdded={() => setRefreshKey(k => k + 1)}
          onTasksAdded={() => setRefreshKey(k => k + 1)}
        />

        {/* Task Board */}
        <TaskBoard 
          key={refreshKey}
          onTaskUpdated={() => setRefreshKey(prev => prev + 1)}
          showMeetingParser={showMeetingParser}
          setShowMeetingParser={setShowMeetingParser}
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
