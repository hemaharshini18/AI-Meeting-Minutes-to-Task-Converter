import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Brain, AlertCircle, CheckCircle } from "lucide-react";
import { parseNaturalLanguageTask, type ParsedTask } from "@/lib/natural-language-parser";
import ParsingPreview from "./parsing-preview";

export default function MeetingMinutesParser({ onTasksAdded }: { onTasksAdded?: () => void }) {
  const [transcript, setTranscript] = useState("");
  const [parsedTasks, setParsedTasks] = useState<ParsedTask[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleParse = () => {
    if (!transcript.trim()) {
      setError("Please enter a meeting transcript");
      return;
    }

    try {
      // Split transcript into sentences
      const sentences = transcript
        .split(/[.!?]+/)
        .map(s => s.trim())
        .filter(s => s.length > 0);

      // Parse each sentence as a task
      const tasks = sentences.map(sentence => parseNaturalLanguageTask(sentence));
      setParsedTasks(tasks);
      setError(null);
      setSuccess(false);
    } catch (err) {
      setError("Failed to parse meeting transcript");
      console.error(err);
    }
  };

  const handleAddAll = async () => {
    setAdding(true);
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
      setParsedTasks([]);
      setTranscript("");
      setSuccess(true);
      if (onTasksAdded) onTasksAdded();
    } catch (err) {
      setError("Failed to add tasks to board");
      console.error(err);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                <Brain className="h-3 w-3 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Meeting Minutes Parser</h3>
                <p className="text-sm text-gray-500">
                  Paste your meeting transcript to extract tasks
                </p>
              </div>
            </div>

            <Textarea
              placeholder="Paste meeting transcript here... Example: 'Aman you take the landing page by 10pm tomorrow. Rajeev you take care of client follow-up by Wednesday.'"
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              className="min-h-[200px]"
              disabled={adding}
            />

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
                <p className="text-green-800 text-sm">All tasks added to the board!</p>
              </div>
            )}

            <Button onClick={handleParse} className="w-full" disabled={adding}>
              Parse Tasks
            </Button>
          </div>
        </CardContent>
      </Card>

      {parsedTasks.length > 0 && (
        <div className="space-y-6">
          <h3 className="font-medium text-gray-900">Parsed Tasks</h3>
          {parsedTasks.map((task, index) => (
            <ParsingPreview key={index} parsedTask={task} />
          ))}
          <Button
            onClick={handleAddAll}
            className="w-full"
            disabled={adding || parsedTasks.filter(t => t.isValid && t.name).length === 0}
          >
            {adding ? "Adding..." : "Add All to Task Board"}
          </Button>
        </div>
      )}
    </div>
  );
} 