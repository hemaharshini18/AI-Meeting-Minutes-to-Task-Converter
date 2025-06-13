import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  CalendarIcon, 
  Clock, 
  User, 
  Flag, 
  Save, 
  X,
  Loader2
} from "lucide-react";
import { format, parse } from "date-fns";
import { cn } from "@/lib/utils";
import { getPriorityInfo } from "@/lib/natural-language-parser";
import type { Task } from "@shared/schema";
import { ensureDate } from "@shared/schema";

const editTaskSchema = z.object({
  name: z.string().min(1, "Task name is required"),
  description: z.string().optional(),
  assignee: z.string().optional(),
  dueDate: z.date().optional(),
  dueTime: z.string().optional(),
  priority: z.enum(["P1", "P2", "P3", "P4"]),
  status: z.enum(["pending", "in-progress", "completed", "cancelled"]),
});

type EditTaskFormData = z.infer<typeof editTaskSchema>;

interface TaskEditModalProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export default function TaskEditModal({ task, isOpen, onClose, onSave }: TaskEditModalProps) {
  // Safely handle the date
  const safeDate = task.dueDate ? ensureDate(task.dueDate) : undefined;
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(safeDate);
  const { toast } = useToast();

  const form = useForm<EditTaskFormData>({
    resolver: zodResolver(editTaskSchema),
    defaultValues: {
      name: task.name,
      description: task.description || "",
      assignee: task.assignee || "",
      dueDate: safeDate,
      dueTime: safeDate ? format(safeDate, "HH:mm") : "",
      priority: task.priority as "P1" | "P2" | "P3" | "P4",
      status: task.status as "pending" | "in-progress" | "completed" | "cancelled",
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async (data: EditTaskFormData) => {
      // Combine date and time if both are provided
      let combinedDateTime = data.dueDate;
      if (data.dueDate && data.dueTime) {
        const [hours, minutes] = data.dueTime.split(':').map(Number);
        combinedDateTime = new Date(data.dueDate);
        combinedDateTime.setHours(hours, minutes, 0, 0);
      }

      const payload = {
        name: data.name,
        description: data.description || null,
        assignee: data.assignee || null,
        dueDate: combinedDateTime || null,
        priority: data.priority,
        status: data.status,
      };

      const response = await apiRequest("PUT", `/api/tasks/${task.id}`, payload);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Task Updated",
        description: "Your task has been successfully updated!",
      });
      onSave();
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update task",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: EditTaskFormData) => {
    updateTaskMutation.mutate(data);
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    form.setValue("dueDate", date);
  };

  const priorityOptions = [
    { value: "P1", label: "P1 - Critical", classes: "bg-red-100 text-red-800" },
    { value: "P2", label: "P2 - High", classes: "bg-amber-100 text-amber-800" },
    { value: "P3", label: "P3 - Medium", classes: "bg-gray-100 text-gray-800" },
    { value: "P4", label: "P4 - Low", classes: "bg-gray-100 text-gray-600" },
  ];

  const statusOptions = [
    { value: "pending", label: "Pending", classes: "bg-gray-100 text-gray-800" },
    { value: "in-progress", label: "In Progress", classes: "bg-blue-100 text-blue-800" },
    { value: "completed", label: "Completed", classes: "bg-green-100 text-green-800" },
    { value: "cancelled", label: "Cancelled", classes: "bg-red-100 text-red-800" },
  ];

  // Reset form when task changes
  useEffect(() => {
    if (task) {
      // Safely handle the date
      const safeDate = task.dueDate ? ensureDate(task.dueDate) : undefined;
      
      form.reset({
        name: task.name,
        description: task.description || "",
        assignee: task.assignee || "",
        dueDate: safeDate,
        dueTime: safeDate ? format(safeDate, "HH:mm") : "",
        priority: task.priority as "P1" | "P2" | "P3" | "P4",
        status: task.status as "pending" | "in-progress" | "completed" | "cancelled",
      });
      
      setSelectedDate(safeDate);
    }
  }, [task, form]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-primary" />
            Edit Task
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Task Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Task Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter task name..." 
                      {...field} 
                      className="text-base"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Add task description..." 
                      {...field} 
                      className="min-h-[80px] resize-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Assignee */}
              <FormField
                control={form.control}
                name="assignee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Assignee
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter assignee name..." 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Priority */}
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Flag className="h-4 w-4" />
                      Priority
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {priorityOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                              <Badge className={option.classes}>
                                <Flag className="h-3 w-3 mr-1" />
                                {option.value}
                              </Badge>
                              <span>{option.label.split(' - ')[1]}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Due Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4" />
                      Due Date
                    </FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={handleDateSelect}
                          disabled={(date) =>
                            date < new Date(new Date().setHours(0, 0, 0, 0))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dueTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Due Time
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="time"
                        {...field} 
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Status */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {statusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <Badge className={option.classes}>
                              {option.label}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="flex gap-2 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={updateTaskMutation.isPending}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateTaskMutation.isPending}
                className="bg-primary hover:bg-primary/90"
              >
                {updateTaskMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {updateTaskMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}