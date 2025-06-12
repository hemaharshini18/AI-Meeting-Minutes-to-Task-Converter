import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { parseTaskSchema, insertTaskSchema, type ParsedTask } from "@shared/schema";
import { parse, isValid, formatISO, addDays, addHours, addMinutes } from "date-fns";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Parse natural language task input
  app.post("/api/tasks/parse", async (req, res) => {
    try {
      const { input } = parseTaskSchema.parse(req.body);
      const parsed = parseNaturalLanguageTask(input);
      res.json(parsed);
    } catch (error: any) {
      res.status(400).json({ 
        message: "Invalid request", 
        errors: error.errors || [error.message] 
      });
    }
  });

  // Create a new task
  app.post("/api/tasks", async (req, res) => {
    try {
      const taskData = insertTaskSchema.parse(req.body);
      const task = await storage.createTask(taskData);
      res.status(201).json(task);
    } catch (error: any) {
      res.status(400).json({ 
        message: "Invalid task data", 
        errors: error.errors || [error.message] 
      });
    }
  });

  // Get all tasks
  app.get("/api/tasks", async (req, res) => {
    try {
      const tasks = await storage.getAllTasks();
      res.json(tasks);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  // Get task by ID
  app.get("/api/tasks/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const task = await storage.getTask(id);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      res.json(task);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch task" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

function parseNaturalLanguageTask(input: string): ParsedTask {
  const result: ParsedTask = {
    name: '',
    assignee: undefined,
    dueDate: undefined,
    dueTime: undefined,
    priority: 'P3',
    isValid: false,
    warnings: [],
    errors: []
  };

  let workingText = input.trim();

  // Extract priority (P1, P2, P3, P4)
  const priorityMatch = workingText.match(/\bP([1-4])\b/i);
  if (priorityMatch) {
    result.priority = 'P' + priorityMatch[1];
    workingText = workingText.replace(priorityMatch[0], '').trim();
  }

  // Extract time patterns
  const timePatterns = [
    /\b(\d{1,2}:\d{2}(?:am|pm|AM|PM)?)\b/,
    /\b(\d{1,2}(?:am|pm|AM|PM))\b/,
    /\b(\d{1,2}:\d{2})\b/
  ];

  for (const pattern of timePatterns) {
    const timeMatch = workingText.match(pattern);
    if (timeMatch) {
      result.dueTime = timeMatch[1];
      workingText = workingText.replace(timeMatch[0], '').trim();
      break;
    }
  }

  // Extract date patterns
  const datePatterns = [
    { pattern: /\btomorrow\b/i, handler: () => addDays(new Date(), 1) },
    { pattern: /\btoday\b/i, handler: () => new Date() },
    { pattern: /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i, handler: (match: string) => getNextWeekday(match) },
    { pattern: /\b(\d{1,2}(?:st|nd|rd|th)?\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|may|june|july|august|september|october|november|december)(?:\s+\d{4})?)\b/i, handler: (match: string) => parseCustomDate(match) },
    { pattern: /\b(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)\b/, handler: (match: string) => parseSlashDate(match) }
  ];

  for (const { pattern, handler } of datePatterns) {
    const dateMatch = workingText.match(pattern);
    if (dateMatch) {
      try {
        const parsedDate = handler(dateMatch[1] || dateMatch[0]);
        if (parsedDate && isValid(parsedDate)) {
          result.dueDate = parsedDate;
          workingText = workingText.replace(dateMatch[0], '').trim();
          
          // If we have both date and time, combine them
          if (result.dueTime) {
            result.dueDate = combineDateAndTime(result.dueDate, result.dueTime);
          }
        }
      } catch (error) {
        result.warnings.push(`Could not parse date: ${dateMatch[0]}`);
      }
      break;
    }
  }

  // Extract potential assignee names (capitalized words)
  const nameMatches = workingText.match(/\b[A-Z][a-z]+\b/g);
  if (nameMatches && nameMatches.length > 0) {
    // Take the first capitalized word as potential assignee
    result.assignee = nameMatches[0];
    workingText = workingText.replace(new RegExp(`\\b${result.assignee}\\b`), '').trim();
  }

  // Extract task name (remaining text, cleaned up)
  result.name = workingText
    .replace(/\s+/g, ' ')
    .replace(/^(to\s+)?/i, '')
    .trim();

  if (!result.name) {
    result.name = 'Untitled Task';
    result.warnings.push('No task name could be extracted from the input');
  }

  // Validation
  result.isValid = result.name.length > 0;

  if (!result.assignee) {
    result.warnings.push('No assignee identified in the task');
  }

  if (!result.dueDate) {
    result.warnings.push('No due date specified');
  }

  return result;
}

function getNextWeekday(dayName: string): Date {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const targetDay = days.indexOf(dayName.toLowerCase());
  const today = new Date();
  const currentDay = today.getDay();
  
  let daysUntilTarget = targetDay - currentDay;
  if (daysUntilTarget <= 0) {
    daysUntilTarget += 7; // Next week
  }
  
  return addDays(today, daysUntilTarget);
}

function parseCustomDate(dateStr: string): Date | null {
  const now = new Date();
  const currentYear = now.getFullYear();
  
  // Try different date formats
  const formats = [
    'do MMMM yyyy',
    'do MMMM',
    'do MMM yyyy',
    'do MMM',
    'd MMMM yyyy',
    'd MMMM',
    'd MMM yyyy',
    'd MMM'
  ];

  for (const format of formats) {
    try {
      const parsed = parse(dateStr, format, now);
      if (isValid(parsed)) {
        // If no year specified, assume current year
        if (!dateStr.match(/\d{4}/)) {
          parsed.setFullYear(currentYear);
        }
        return parsed;
      }
    } catch (error) {
      // Continue to next format
    }
  }

  return null;
}

function parseSlashDate(dateStr: string): Date | null {
  const now = new Date();
  const parts = dateStr.split('/');
  
  if (parts.length < 2) return null;
  
  const month = parseInt(parts[0]) - 1; // Month is 0-indexed
  const day = parseInt(parts[1]);
  const year = parts.length > 2 ? parseInt(parts[2]) : now.getFullYear();
  
  // Handle 2-digit years
  const fullYear = year < 100 ? (year > 50 ? 1900 + year : 2000 + year) : year;
  
  const date = new Date(fullYear, month, day);
  return isValid(date) ? date : null;
}

function combineDateAndTime(date: Date, timeStr: string): Date {
  const combined = new Date(date);
  
  // Parse time string
  const timeMatch = timeStr.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm|AM|PM)?/);
  if (!timeMatch) return combined;
  
  let hours = parseInt(timeMatch[1]);
  const minutes = parseInt(timeMatch[2] || '0');
  const period = timeMatch[3]?.toLowerCase();
  
  // Handle 12-hour format
  if (period === 'pm' && hours !== 12) {
    hours += 12;
  } else if (period === 'am' && hours === 12) {
    hours = 0;
  }
  
  combined.setHours(hours, minutes, 0, 0);
  return combined;
}
