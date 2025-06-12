import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  User, 
  Calendar, 
  Flag, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Filter,
  SortAsc,
  Grid3X3,
  List
} from "lucide-react";
import { formatDateForDisplay, getPriorityInfo } from "@/lib/natural-language-parser";
import type { Task } from "@shared/schema";
import TaskEditModal from "./task-edit-modal";

type ViewMode = "grid" | "list";
type SortField = "dueDate" | "priority" | "name" | "assignee";
type FilterPriority = "all" | "P1" | "P2" | "P3" | "P4";

interface TaskBoardProps {
  onTaskUpdated?: () => void;
}

export default function TaskBoard({ onTaskUpdated }: TaskBoardProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortField, setSortField] = useState<SortField>("dueDate");
  const [filterPriority, setFilterPriority] = useState<FilterPriority>("all");
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const { data: tasks = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/tasks"],
    queryFn: async () => {
      const response = await fetch("/api/tasks");
      if (!response.ok) throw new Error("Failed to fetch tasks");
      return response.json();
    }
  });

  // Filter and sort tasks
  const filteredAndSortedTasks = tasks
    .filter((task: Task) => 
      filterPriority === "all" || task.priority === filterPriority
    )
    .sort((a: Task, b: Task) => {
      switch (sortField) {
        case "dueDate":
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        case "priority":
          const priorityOrder = { P1: 1, P2: 2, P3: 3, P4: 4 };
          return priorityOrder[a.priority as keyof typeof priorityOrder] - 
                 priorityOrder[b.priority as keyof typeof priorityOrder];
        case "name":
          return a.name.localeCompare(b.name);
        case "assignee":
          const aAssignee = a.assignee || "zzz";
          const bAssignee = b.assignee || "zzz";
          return aAssignee.localeCompare(bAssignee);
        default:
          return 0;
      }
    });

  const handleTaskEdit = (task: Task) => {
    setEditingTask(task);
  };

  const handleTaskDelete = async (taskId: number) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error("Failed to delete task");
      refetch();
      onTaskUpdated?.();
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  const handleEditComplete = () => {
    setEditingTask(null);
    refetch();
    onTaskUpdated?.();
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tasks</h2>
          <p className="text-gray-600">
            {filteredAndSortedTasks.length} task{filteredAndSortedTasks.length !== 1 ? 's' : ''}
            {filterPriority !== "all" && ` (${filterPriority} priority)`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter by priority */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                {filterPriority === "all" ? "All Priorities" : filterPriority}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setFilterPriority("all")}>
                All Priorities
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterPriority("P1")}>
                <Flag className="h-4 w-4 mr-2 text-red-500" />
                P1 - Critical
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterPriority("P2")}>
                <Flag className="h-4 w-4 mr-2 text-amber-500" />
                P2 - High
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterPriority("P3")}>
                <Flag className="h-4 w-4 mr-2 text-gray-500" />
                P3 - Medium
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterPriority("P4")}>
                <Flag className="h-4 w-4 mr-2 text-gray-400" />
                P4 - Low
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Sort options */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <SortAsc className="h-4 w-4 mr-2" />
                Sort
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSortField("dueDate")}>
                <Calendar className="h-4 w-4 mr-2" />
                Due Date
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortField("priority")}>
                <Flag className="h-4 w-4 mr-2" />
                Priority
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortField("name")}>
                Task Name
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortField("assignee")}>
                <User className="h-4 w-4 mr-2" />
                Assignee
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* View mode toggle */}
          <div className="flex border rounded-lg overflow-hidden">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="rounded-none"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="rounded-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Tasks display */}
      {filteredAndSortedTasks.length === 0 ? (
        <Card className="border-dashed border-2 border-gray-300">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
              <List className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
            <p className="text-gray-500 text-center max-w-sm">
              {filterPriority !== "all" 
                ? `No tasks with ${filterPriority} priority. Try adjusting your filters.`
                : "Start by creating your first task using the form above."
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className={
          viewMode === "grid" 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            : "space-y-4"
        }>
          {filteredAndSortedTasks.map((task: Task) => (
            <TaskCard
              key={task.id}
              task={task}
              viewMode={viewMode}
              onEdit={() => handleTaskEdit(task)}
              onDelete={() => handleTaskDelete(task.id)}
            />
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editingTask && (
        <TaskEditModal
          task={editingTask}
          isOpen={!!editingTask}
          onClose={() => setEditingTask(null)}
          onSave={handleEditComplete}
        />
      )}
    </div>
  );
}

interface TaskCardProps {
  task: Task;
  viewMode: ViewMode;
  onEdit: () => void;
  onDelete: () => void;
}

function TaskCard({ task, viewMode, onEdit, onDelete }: TaskCardProps) {
  const priorityInfo = getPriorityInfo(task.priority);
  const dateInfo = formatDateForDisplay(task.dueDate ? new Date(task.dueDate) : undefined);

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();

  if (viewMode === "list") {
    return (
      <Card className="hover:shadow-md transition-all duration-200 group">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <h3 className="font-medium text-gray-900 truncate">{task.name}</h3>
                <Badge className={`${priorityInfo.classes} flex-shrink-0`}>
                  <Flag className="h-3 w-3 mr-1" />
                  {task.priority}
                </Badge>
              </div>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                {task.assignee && (
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    <span>{task.assignee}</span>
                  </div>
                )}
                {task.dueDate && (
                  <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-600' : ''}`}>
                    <Calendar className="h-4 w-4" />
                    <span>{dateInfo.date} {dateInfo.time && `at ${dateInfo.time}`}</span>
                  </div>
                )}
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Task
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDelete} className="text-red-600">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Task
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-lg transition-all duration-200 group cursor-pointer">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <Badge className={priorityInfo.classes}>
            <Flag className="h-3 w-3 mr-1" />
            {task.priority}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Task
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-red-600">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Task
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <h3 className="font-semibold text-gray-900 mb-3 line-clamp-2">{task.name}</h3>

        <div className="space-y-3">
          {task.assignee && (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-medium">
                  {task.assignee.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-sm text-gray-600">{task.assignee}</span>
            </div>
          )}

          {task.dueDate && (
            <div className={`flex items-center gap-2 text-sm ${isOverdue ? 'text-red-600' : 'text-gray-600'}`}>
              <Calendar className="h-4 w-4" />
              <div>
                <div>{dateInfo.date}</div>
                {dateInfo.time && (
                  <div className="text-xs text-gray-500">{dateInfo.time}</div>
                )}
              </div>
            </div>
          )}

          {isOverdue && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-2 py-1 rounded">
              <Flag className="h-3 w-3" />
              <span className="font-medium">Overdue</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}