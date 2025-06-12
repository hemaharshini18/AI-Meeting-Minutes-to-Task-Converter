import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Lightbulb, WandSparkles, Save, Loader2 } from "lucide-react";
import type { ParsedTask } from "@/lib/natural-language-parser";

interface TaskInputFormProps {
  onParsedTask: (parsed: ParsedTask | null) => void;
  onTaskCreated?: () => void;
}

export default function TaskInputForm({ onParsedTask, onTaskCreated }: TaskInputFormProps) {
  const [input, setInput] = useState("");
  const { toast } = useToast();

  const parseTaskMutation = useMutation({
    mutationFn: async (taskInput: string) => {
      const response = await apiRequest("POST", "/api/tasks/parse", { input: taskInput });
      return response.json();
    },
    onSuccess: (parsed: ParsedTask) => {
      onParsedTask(parsed);
    },
    onError: (error: any) => {
      toast({
        title: "Parsing Failed",
        description: error.message || "Failed to parse task input",
        variant: "destructive",
      });
      onParsedTask(null);
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async (taskData: any) => {
      const response = await apiRequest("POST", "/api/tasks", taskData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Task Created",
        description: "Your task has been successfully created!",
      });
      setInput("");
      onParsedTask(null);
      onTaskCreated?.();
    },
    onError: (error: any) => {
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create task",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = useCallback((value: string) => {
    setInput(value);
    
    if (value.trim().length === 0) {
      onParsedTask(null);
      return;
    }

    // Debounced parsing
    const timeoutId = setTimeout(() => {
      parseTaskMutation.mutate(value.trim());
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [parseTaskMutation, onParsedTask]);

  const handleSmartAdd = async () => {
    if (!input.trim()) {
      toast({
        title: "Input Required",
        description: "Please enter a task description",
        variant: "destructive",
      });
      return;
    }

    try {
      // First parse the task
      const response = await apiRequest("POST", "/api/tasks/parse", { input: input.trim() });
      const parsed: ParsedTask = await response.json();

      if (!parsed.isValid) {
        toast({
          title: "Invalid Task",
          description: "Please provide a valid task description",
          variant: "destructive",
        });
        return;
      }

      // Create the task
      const taskData = {
        name: parsed.name,
        assignee: parsed.assignee,
        dueDate: parsed.dueDate,
        priority: parsed.priority,
        status: "pending",
        originalInput: input.trim(),
      };

      createTaskMutation.mutate(taskData);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to process task",
        variant: "destructive",
      });
    }
  };

  const handleExampleClick = (example: string) => {
    setInput(example);
    parseTaskMutation.mutate(example);
  };

  const exampleTasks = [
    "Review quarterly report by tomorrow",
    "Send invoice to Microsoft P2",
    "Call client Rajeev tomorrow 5pm P1",
    "Deploy staging Sarah by Friday 6pm P2",
  ];

  return (
    <div className="space-y-6">
      {/* Main Input Form */}
      <Card className="border-gray-200 shadow-sm">
        <CardContent className="p-6 sm:p-8">
          <div className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="taskInput" className="text-sm font-medium text-gray-900">
                Describe your task naturally
              </Label>
              <div className="relative">
                <Textarea
                  id="taskInput"
                  placeholder="e.g., Finish landing page Aman by 11pm 20th June P1"
                  value={input}
                  onChange={(e) => handleInputChange(e.target.value)}
                  className="min-h-[100px] px-4 py-4 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent resize-none text-lg transition-all duration-200 bg-gray-50 focus:bg-white"
                  maxLength={500}
                />
                <div className="absolute bottom-3 right-3 flex items-center space-x-2">
                  <span className="text-xs text-gray-400">{input.length}/500</span>
                  {parseTaskMutation.isPending && (
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <Lightbulb className="h-4 w-4" />
                Try: "Call client John tomorrow 2pm P1" or "Review docs Sarah by Friday"
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleSmartAdd}
                disabled={createTaskMutation.isPending || !input.trim()}
                className="flex-1 bg-primary hover:bg-indigo-600 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200"
              >
                {createTaskMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <WandSparkles className="h-4 w-4 mr-2" />
                )}
                {createTaskMutation.isPending ? "Processing..." : "Smart Add Task"}
              </Button>
              <Button
                variant="secondary"
                className="sm:w-auto bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-xl transition-all duration-200"
              >
                <Save className="h-4 w-4 mr-2" />
                <span className="sm:hidden">Save Draft</span>
                <span className="hidden sm:inline">Draft</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Examples Section */}
      <Card className="border-gray-200 shadow-sm">
        <CardContent className="p-6 sm:p-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Example Natural Language Inputs</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700 uppercase tracking-wide">Basic Tasks</h4>
              <div className="space-y-2">
                {exampleTasks.slice(0, 2).map((example, index) => (
                  <button
                    key={index}
                    onClick={() => handleExampleClick(example)}
                    className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                  >
                    <code className="text-sm text-gray-800">{example}</code>
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700 uppercase tracking-wide">Complex Tasks</h4>
              <div className="space-y-2">
                {exampleTasks.slice(2).map((example, index) => (
                  <button
                    key={index}
                    onClick={() => handleExampleClick(example)}
                    className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                  >
                    <code className="text-sm text-gray-800">{example}</code>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
