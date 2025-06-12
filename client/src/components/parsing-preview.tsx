import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, User, Calendar, Flag, Clock, AlertTriangle, AlertCircle, Brain } from "lucide-react";
import type { ParsedTask } from "@/lib/natural-language-parser";
import { getPriorityInfo, formatDateForDisplay } from "@/lib/natural-language-parser";

interface ParsingPreviewProps {
  parsedTask: ParsedTask | null;
}

export default function ParsingPreview({ parsedTask }: ParsingPreviewProps) {
  if (!parsedTask) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
            <Brain className="h-3 w-3 text-blue-600" />
          </div>
          <div>
            <h3 className="font-medium text-blue-900">AI Parsing Results</h3>
            <p className="text-sm text-blue-700">Ready to parse your task...</p>
          </div>
        </div>
      </div>
    );
  }

  const priorityInfo = getPriorityInfo(parsedTask.priority);
  const dateInfo = formatDateForDisplay(parsedTask.dueDate);

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
      {/* Parsing Status */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
            <Brain className="h-3 w-3 text-blue-600" />
          </div>
          <div>
            <h3 className="font-medium text-blue-900">AI Parsing Results</h3>
            <p className="text-sm text-blue-700">
              {parsedTask.isValid ? "Task parsed and validated successfully" : "Task parsed with warnings"}
            </p>
          </div>
        </div>
      </div>

      {/* Parsed Components Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Task Name */}
        <Card className="border-gray-200 animate-in slide-in-from-left-4 duration-300">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 mb-2">Task Name</h4>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-gray-900 font-medium">{parsedTask.name}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Assignee */}
        <Card className="border-gray-200 animate-in slide-in-from-right-4 duration-300 delay-75">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <User className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 mb-2">Assignee</h4>
                <div className="bg-gray-50 rounded-lg p-3">
                  {parsedTask.assignee ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-medium">
                          {parsedTask.assignee.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-gray-900 font-medium">{parsedTask.assignee}</span>
                      <div className="w-2 h-2 bg-green-400 rounded-full" title="Active user" />
                    </div>
                  ) : (
                    <span className="text-gray-500 italic">Unassigned</span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Due Date & Time */}
        <Card className="border-gray-200 animate-in slide-in-from-left-4 duration-300 delay-150">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Calendar className="h-4 w-4 text-orange-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 mb-2">Due Date & Time</h4>
                {parsedTask.dueDate ? (
                  <div className="space-y-2">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-900 font-medium">{dateInfo.date}</span>
                        {dateInfo.time && (
                          <span className="text-sm text-gray-500">{dateInfo.time}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-orange-600">
                      <Clock className="h-3 w-3" />
                      <span>{dateInfo.relative}</span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <span className="text-gray-500 italic">No due date specified</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Priority Level */}
        <Card className="border-gray-200 animate-in slide-in-from-right-4 duration-300 delay-225">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Flag className="h-4 w-4 text-red-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 mb-2">Priority Level</h4>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center space-x-3">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${priorityInfo.classes}`}>
                      <Flag className="h-3 w-3 mr-1" />
                      {parsedTask.priority} - {priorityInfo.label}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Priority Legend */}
      <Card className="border-gray-200">
        <CardContent className="p-6">
          <h4 className="font-medium text-gray-900 mb-4">Priority Levels</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { priority: 'P1', label: 'Critical', classes: 'bg-red-100 text-red-800' },
              { priority: 'P2', label: 'High', classes: 'bg-amber-100 text-amber-800' },
              { priority: 'P3', label: 'Medium', classes: 'bg-gray-100 text-gray-800' },
              { priority: 'P4', label: 'Low', classes: 'bg-gray-100 text-gray-600' },
            ].map(({ priority, label, classes }) => (
              <div key={priority} className="flex items-center space-x-2">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${classes}`}>
                  <Flag className="h-3 w-3 mr-1" />
                  {priority}
                </span>
                <span className="text-sm text-gray-600">{label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Validation Messages */}
      <div className="space-y-3">
        {/* Success Message */}
        {parsedTask.isValid && parsedTask.warnings.length === 0 && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start space-x-3">
            <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <CheckCircle className="h-3 w-3 text-green-600" />
            </div>
            <div>
              <p className="text-green-800 font-medium">Task parsed successfully!</p>
              <p className="text-green-700 text-sm">All required fields have been identified and validated.</p>
            </div>
          </div>
        )}

        {/* Warning Messages */}
        {parsedTask.warnings.map((warning, index) => (
          <div key={index} className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start space-x-3">
            <div className="w-5 h-5 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <AlertTriangle className="h-3 w-3 text-amber-600" />
            </div>
            <div>
              <p className="text-amber-800 font-medium">Warning</p>
              <p className="text-amber-700 text-sm">{warning}</p>
            </div>
          </div>
        ))}

        {/* Error Messages */}
        {parsedTask.errors.map((error, index) => (
          <div key={index} className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start space-x-3">
            <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <AlertCircle className="h-3 w-3 text-red-600" />
            </div>
            <div>
              <p className="text-red-800 font-medium">Error</p>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
