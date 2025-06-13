import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { parseNaturalLanguageTask, type ParsedTask } from "@/lib/natural-language-parser";
import ParsingPreview from "./parsing-preview";
import { CheckCircle, AlertCircle } from "lucide-react";

interface UnifiedTaskEntryProps {
  onTaskAdded?: () => void;
  onTasksAdded?: () => void;
}

export default function UnifiedTaskEntry({ onTaskAdded, onTasksAdded }: UnifiedTaskEntryProps) {
  const [input, setInput] = useState("");
  const [parsedTask, setParsedTask] = useState<ParsedTask | null>(null);
  const [parsedTasks, setParsedTasks] = useState<ParsedTask[]>([]);
  const [mode, setMode] = useState<"single" | "meeting" | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Single task parse and add
  const handleSmartAdd = async () => {
    setMode("single");
    setError(null);
    setSuccess(false);
    setParsedTasks([]);
    setParsedTask(null);
    if (!input.trim()) {
      setError("Please enter a task");
      return;
    }
    const task = parseNaturalLanguageTask(input);
    setParsedTask(task);
    if (!task.isValid) return;
    setLoading(true);
    try {
      await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: task.name,
          assignee: task.assignee || undefined,
          dueDate: task.dueDate ? task.dueDate.toISOString() : undefined,
          priority: task.priority || "P3",
        }),
      });
      setSuccess(true);
      setInput("");
      setParsedTask(null);
      if (onTaskAdded) onTaskAdded();
    } catch (err) {
      setError("Failed to add task");
    } finally {
      setLoading(false);
    }
  };

  // Meeting parse (multi-task)
  const handleMeetingParse = () => {
    setMode("meeting");
    setError(null);
    setSuccess(false);
    setParsedTask(null);
    if (!input.trim()) {
      setError("Please enter a meeting transcript");
      return;
    }
    const sentences = input
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
    const tasks = sentences.map(sentence => parseNaturalLanguageTask(sentence));
    setParsedTasks(tasks);
  };

  // Add all parsed meeting tasks
  const handleAddAll = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const validTasks = parsedTasks.filter(t => t.isValid && t.name);
      for (const task of validTasks) {
        await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: task.name,
            assignee: task.assignee || undefined,
            dueDate: task.dueDate ? task.dueDate.toISOString() : undefined,
            priority: task.priority || "P3",
          }),
        });
      }
      setSuccess(true);
      setInput("");
      setParsedTasks([]);
      if (onTasksAdded) onTasksAdded();
    } catch (err) {
      setError("Failed to add tasks");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mb-8">
      <CardContent className="p-6 space-y-6">
        <Textarea
          placeholder="Type a task or paste meeting transcript..."
          value={input}
          onChange={e => setInput(e.target.value)}
          className="min-h-[120px]"
          disabled={loading}
        />
        <div className="flex gap-4">
          <Button onClick={handleSmartAdd} disabled={loading}>
            Smart Add Task
          </Button>
          <Button onClick={handleMeetingParse} disabled={loading} variant="outline">
            Parse Meeting
          </Button>
        </div>
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start space-x-3">
            <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <AlertCircle className="h-3 w-3 text-red-600" />
            </div>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start space-x-3">
            <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <CheckCircle className="h-3 w-3 text-green-600" />
            </div>
            <p className="text-green-800 text-sm">Task(s) added successfully!</p>
          </div>
        )}
        {/* Single task preview */}
        {mode === "single" && parsedTask && (
          <ParsingPreview parsedTask={parsedTask} />
        )}
        {/* Meeting tasks preview and add all button */}
        {mode === "meeting" && parsedTasks.length > 0 && (
          <div className="space-y-6">
            <h3 className="font-medium text-gray-900">Parsed Tasks</h3>
            {parsedTasks.map((task, idx) => (
              <ParsingPreview key={idx} parsedTask={task} />
            ))}
            <Button
              onClick={handleAddAll}
              className="w-full"
              disabled={loading || parsedTasks.filter(t => t.isValid && t.name).length === 0}
            >
              {loading ? "Adding..." : "Add All to Task Board"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 