import { parse, isValid, addDays, formatISO } from "date-fns";

export interface ParsedTask {
  name: string;
  assignee?: string;
  dueDate?: Date;
  dueTime?: string;
  priority: string;
  isValid: boolean;
  warnings: string[];
  errors: string[];
}

export function parseNaturalLanguageTask(input: string): ParsedTask {
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
    { pattern: /\btonight\b/i, handler: () => new Date() },
    { pattern: /\bthis evening\b/i, handler: () => new Date() },
    { pattern: /\bthis afternoon\b/i, handler: () => new Date() },
    { pattern: /\bthis morning\b/i, handler: () => new Date() },
    { 
      pattern: /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i, 
      handler: (match: string) => getNextWeekday(match) 
    },
    { 
      pattern: /\b(\d{1,2}(?:st|nd|rd|th)?\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|may|june|july|august|september|october|november|december)(?:\s+\d{4})?)\b/i, 
      handler: (match: string) => parseCustomDate(match) 
    },
    { 
      pattern: /\b(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)\b/, 
      handler: (match: string) => parseSlashDate(match) 
    }
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
  console.log("Extracting assignee from:", workingText);

  // New: Check for '[Name] you' at the start of the sentence
  const startNameMatch = workingText.match(/^([A-Z][a-z]+)\s+you\b/i);
  if (startNameMatch && startNameMatch[1]) {
    result.assignee = startNameMatch[1];
    workingText = workingText.replace(/^([A-Z][a-z]+)\s+you\b/i, '').trim();
  } else {
    // Special handling for common task verbs that might be capitalized
    const commonVerbs = ["finish", "complete", "review", "create", "update", "send", "call", "deploy", "check", "write", "take", "take care of"];
    let verbMatch = null;
    for (const verb of commonVerbs) {
      const verbRegex = new RegExp(`\\b${verb}\\b`, 'i');
      if (workingText.match(verbRegex)) {
        verbMatch = workingText.match(verbRegex)?.[0];
        break;
      }
    }
    // List of known companies/organizations that should not be treated as assignees
    const knownCompanies = [
      "microsoft", "google", "apple", "amazon", "facebook", "meta", "netflix", "tesla", 
      "ibm", "oracle", "salesforce", "adobe", "intel", "cisco", "samsung", "sony"
    ];
    // Look for specific assignee markers
    const byMarkerMatch = workingText.match(/\b(by|for|to)\s+([A-Za-z]+)\b/i);
    if (byMarkerMatch && byMarkerMatch[2]) {
      const potentialAssignee = byMarkerMatch[2];
      // Check if it's a company name
      if (!knownCompanies.includes(potentialAssignee.toLowerCase())) {
        // Found a name after "by", "for", or "to" that's not a company
        result.assignee = potentialAssignee.charAt(0).toUpperCase() + potentialAssignee.slice(1).toLowerCase();
        workingText = workingText.replace(byMarkerMatch[0], '').trim();
        console.log("Found assignee via marker:", result.assignee);
      } else {
        console.log("Found company name, not treating as assignee:", potentialAssignee);
      }
    } else {
      // Try to find capitalized names, but exclude common verbs and companies
      const nameMatches = workingText.match(/\b[A-Z][a-z]+\b/g);
      if (nameMatches && nameMatches.length > 0) {
        // Filter out common verbs and companies from potential names
        const filteredNames = nameMatches.filter(name => 
          !commonVerbs.includes(name.toLowerCase()) && 
          !knownCompanies.includes(name.toLowerCase())
        );
        if (filteredNames.length > 0) {
          result.assignee = filteredNames[0];
          workingText = workingText.replace(new RegExp(`\\b${result.assignee}\\b`), '').trim();
          console.log("Found assignee via capitalization:", result.assignee);
        }
      }
      // If no assignee found yet, try common names
      if (!result.assignee) {
        const commonNames = ["aman", "sarah", "john", "alex", "david", "michael", "emma", "olivia", "rajeev", "shreya"];
        for (const name of commonNames) {
          if (name.toLowerCase() === "finish" && verbMatch && verbMatch.toLowerCase() === "finish") {
            continue; // Skip "finish" if it's likely a verb
          }
          const nameRegex = new RegExp(`\\b${name}\\b`, 'i');
          const match = workingText.match(nameRegex);
          if (match) {
            // Capitalize the first letter for consistency
            result.assignee = match[0].charAt(0).toUpperCase() + match[0].slice(1).toLowerCase();
            workingText = workingText.replace(nameRegex, '').trim();
            console.log("Found assignee via common names:", result.assignee);
            break;
          }
        }
      }
    }
  }

  // Extract task name (remaining text, cleaned up)
  result.name = workingText
    .replace(/\s+/g, ' ')
    .replace(/^(to\s+)?/i, '')
    .replace(/^(you\s+)?/i, '')
    .replace(/^(please\s+)?/i, '')
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
  
  const month = parseInt(parts[0]) - 1;
  const day = parseInt(parts[1]);
  const year = parts.length > 2 ? parseInt(parts[2]) : now.getFullYear();
  
  const fullYear = year < 100 ? (year > 50 ? 1900 + year : 2000 + year) : year;
  
  const date = new Date(fullYear, month, day);
  return isValid(date) ? date : null;
}

function combineDateAndTime(date: Date, timeStr: string): Date {
  const combined = new Date(date);
  
  const timeMatch = timeStr.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm|AM|PM)?/);
  if (!timeMatch) return combined;
  
  let hours = parseInt(timeMatch[1]);
  const minutes = parseInt(timeMatch[2] || '0');
  const period = timeMatch[3]?.toLowerCase();
  
  if (period === 'pm' && hours !== 12) {
    hours += 12;
  } else if (period === 'am' && hours === 12) {
    hours = 0;
  }
  
  combined.setHours(hours, minutes, 0, 0);
  return combined;
}

export function getPriorityInfo(priority: string) {
  const priorities = {
    'P1': { label: 'Critical', classes: 'bg-red-100 text-red-800' },
    'P2': { label: 'High', classes: 'bg-amber-100 text-amber-800' },
    'P3': { label: 'Medium', classes: 'bg-gray-100 text-gray-800' },
    'P4': { label: 'Low', classes: 'bg-gray-100 text-gray-600' }
  };
  return priorities[priority as keyof typeof priorities] || priorities['P3'];
}

export function formatDateForDisplay(date: Date | string | undefined | null): { date: string; time: string; relative: string } {
  if (!date) return { date: '', time: '', relative: '' };
  
  // Ensure we have a proper Date object
  let dateObj: Date;
  try {
    if (date instanceof Date) {
      dateObj = date;
    } else if (typeof date === 'string') {
      dateObj = new Date(date);
    } else {
      console.error("Invalid date type:", typeof date);
      return { date: 'Invalid date', time: '', relative: '' };
    }
    
    // Check if the date is valid
    if (isNaN(dateObj.getTime())) {
      console.error("Invalid date (NaN):", date);
      return { date: 'Invalid date', time: '', relative: '' };
    }
  } catch (error) {
    console.error("Error parsing date:", error, date);
    return { date: 'Invalid date', time: '', relative: '' };
  }
  
  const now = new Date();
  
  try {
    const diffInDays = Math.ceil((dateObj.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    let relative = '';
    if (diffInDays === 0) {
      relative = 'Due today';
    } else if (diffInDays === 1) {
      relative = 'Due tomorrow';
    } else if (diffInDays > 0) {
      relative = `Due in ${diffInDays} days`;
    } else {
      relative = `Overdue by ${Math.abs(diffInDays)} days`;
    }
    
    return {
      date: dateObj.toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      }),
      time: dateObj.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      }),
      relative
    };
  } catch (error) {
    console.error("Error calculating date display:", error, dateObj);
    return { date: 'Error displaying date', time: '', relative: '' };
  }
}
