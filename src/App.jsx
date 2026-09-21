import { useState, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { CheckCircle, Circle, Trash2, Edit2, Sparkles, AlertCircle, Plus, Calendar, Flag } from 'lucide-react';

const IMPORTANCE_OPTIONS = ['High', 'Medium', 'Low'];

const IMPORTANCE_STYLES = {
  High: 'text-red-600 bg-red-100',
  Medium: 'text-amber-600 bg-amber-100',
  Low: 'text-slate-500 bg-slate-100',
};

const PRIORITY_LEVEL_STYLES = {
  High: 'bg-red-100 text-red-700',
  Medium: 'bg-amber-100 text-amber-700',
  Low: 'bg-slate-100 text-slate-600',
};

const getGeminiErrorMessage = (error) => {
  const details = error instanceof Error ? error.message : String(error);

  if (/401|unauthenticated|api.?key.*(?:invalid|not valid)|invalid.*api.?key/i.test(details)) {
    return 'Gemini rejected the API key. Paste a newly created key exactly as copied—no quotes, spaces, or backslashes—then restart npm run dev.';
  }
  if (/403|permission|referer|blocked/i.test(details)) {
    return 'Gemini denied this request. Check the key’s project, API access, and any website/referrer restrictions in Google AI Studio.';
  }
  if (/429|quota|resource.?exhausted/i.test(details)) {
    return 'Gemini rate limit or quota reached. Wait a moment, or check your plan and quota in Google AI Studio.';
  }
  if (/fetch|network|cors|offline/i.test(details)) {
    return 'The app could not reach Gemini. Check your internet connection and browser developer console for a network or CORS error.';
  }
  if (/503|unavailable|high demand/i.test(details)) {
    return 'Gemini is temporarily busy. The app retried automatically; please wait a minute and try again.';
  }
  if (/404|not.?found|model/i.test(details)) {
    return `Gemini model access failed: ${details.slice(0, 180)}`;
  }
  return `Gemini could not prioritize tasks: ${details.slice(0, 180)}`;
};

const generateWithRetry = async (ai, request, attempt = 0) => {
  try {
    return await ai.models.generateContent(request);
  } catch (error) {
    const details = error instanceof Error ? error.message : String(error);
    const shouldRetry = /503|unavailable|high demand/i.test(details) && attempt < 2;

    if (!shouldRetry) throw error;

    await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
    return generateWithRetry(ai, request, attempt + 1);
  }
};

const getAvailableGeminiModel = async (apiKey) => {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`,
  );

  if (!response.ok) {
    throw new Error(`Unable to check available Gemini models (${response.status}).`);
  }

  const { models = [] } = await response.json();
  const availableModels = models.filter((model) => (
    model.supportedGenerationMethods?.includes('generateContent')
    && /^models\/gemini-.*flash/i.test(model.name)
  ));
  const availableModel = availableModels.find((model) => model.name === 'models/gemini-3.6-flash')
    || availableModels.find((model) => /^models\/gemini-3\..*-flash$/i.test(model.name))
    || availableModels.find((model) => !/^models\/gemini-2\.5-flash/i.test(model.name));

  if (!availableModel) {
    throw new Error('No Gemini Flash model with generate-content access is available for this API key.');
  }

  return availableModel.name.replace(/^models\//, '');
};

export default function App() {
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem('smart_todo_tasks');
    return saved ? JSON.parse(saved) : [];
  });

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [importance, setImportance] = useState('Medium');
  const [editingId, setEditingId] = useState(null);

  const [aiPriorities, setAiPriorities] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDeadline('');
    setImportance('Medium');
    setEditingId(null);
  };

  // Persist tasks to localStorage
  useEffect(() => {
    localStorage.setItem('smart_todo_tasks', JSON.stringify(tasks));
  }, [tasks]);

  const handleSubmitTask = (e) => {
    e.preventDefault();
    if (!title.trim() || !deadline) {
      setErrorMessage('Please provide both a task title and a deadline.');
      return;
    }

    if (editingId) {
      setTasks(tasks.map(t => t.id === editingId ? { ...t, title, description, deadline, importance } : t));
      setEditingId(null);
    } else {
      const newTask = {
        id: Date.now().toString(),
        title,
        description,
        deadline,
        importance,
        completed: false,
        createdAt: new Date().toISOString()
      };
      setTasks([...tasks, newTask]);
    }

    resetForm();
    setErrorMessage('');
  };

  const handleToggleComplete = (id) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const handleDeleteTask = (id) => {
    setTasks(tasks.filter(t => t.id !== id));
    if (aiPriorities) {
      setAiPriorities(prev => prev ? prev.filter(item => item.taskId !== id) : null);
    }
    if (editingId === id) {
      handleCancelEdit();
    }
  };

  const handleEditClick = (task) => {
    setEditingId(task.id);
    setTitle(task.title);
    setDescription(task.description);
    setDeadline(task.deadline);
    setImportance(task.importance);
  };

  const handleCancelEdit = () => {
    resetForm();
  };

  const handlePrioritizeAI = async () => {
    setErrorMessage('');
    const incompleteTasks = tasks.filter(t => !t.completed);

    if (incompleteTasks.length === 0) {
      setErrorMessage('No incomplete tasks found. Add or uncheck a task to prioritize!');
      return;
    }

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      setErrorMessage('Add your Gemini API key after VITE_GEMINI_API_KEY= in .env.local, then stop and restart npm run dev.');
      return;
    }

    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey });
      const model = await getAvailableGeminiModel(apiKey);

      const prompt = `
You are prioritizing tasks for a personal task-management application.
Analyze the provided incomplete tasks considering their title, description, deadline, and importance.

Input Tasks:
${JSON.stringify(incompleteTasks, null, 2)}

Requirements:
1. Every provided incomplete task must appear EXACTLY once in the output.
2. Completed tasks must NOT be included.
3. Recommend an ordered list from highest priority (1) to lowest priority.
4. Return ONLY a raw, valid JSON object with a single key "prioritizedTasks".
5. Do NOT wrap the response in markdown code fences or backticks.

Output JSON Schema:
{
  "prioritizedTasks": [
    {
      "taskId": "string matching input task id",
      "priority": 1,
      "priorityLevel": "High" | "Medium" | "Low",
      "reason": "Short explanation for this placement"
    }
  ]
}
`;

      const response = await generateWithRetry(ai, {
        model,
        contents: prompt,
      });

      let rawText = response.text ? response.text.trim() : '';
      
      if (rawText.startsWith('```')) {
        rawText = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```$/, '').trim();
      }

      const parsed = JSON.parse(rawText);

      const returnedIds = parsed.prioritizedTasks?.map((item) => item.taskId) || [];
      const expectedIds = incompleteTasks.map((task) => task.id);
      const isValidResult = returnedIds.length === expectedIds.length
        && new Set(returnedIds).size === expectedIds.length
        && returnedIds.every((id) => expectedIds.includes(id));

      if (!isValidResult) {
        throw new Error('AI returned an invalid response structure.');
      }

      setAiPriorities(parsed.prioritizedTasks);
    } catch (err) {
      console.error('AI Error:', err);
      setErrorMessage(getGeminiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityForTask = (taskId) => {
    if (!aiPriorities) return null;
    return aiPriorities.find(item => item.taskId === taskId) || null;
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    const pa = getPriorityForTask(a.id);
    const pb = getPriorityForTask(b.id);
    if (pa && pb) return pa.priority - pb.priority;
    if (pa) return -1;
    if (pb) return 1;
    return new Date(a.deadline) - new Date(b.deadline);
  });

  const incompleteCount = tasks.filter(t => !t.completed).length;
  const completedCount = tasks.length - incompleteCount;

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-800 flex items-center justify-center gap-2">
            <Sparkles className="w-7 h-7 text-indigo-500" />
            Smart To-Do
          </h1>
          <p className="text-slate-500 mt-1">
            {incompleteCount} active &middot; {completedCount} completed
          </p>
        </header>

        {errorMessage && (
          <div className="mb-4 flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span className="text-sm">{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmitTask} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 mb-6">
          <div className="flex flex-col gap-3">
              <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
                placeholder="Task title"
                aria-label="Task title"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
              <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (optional)"
                rows={2}
                aria-label="Task description"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
            />
            <div className="flex flex-col sm:flex-row gap-3">
              <label className="flex items-center gap-2 flex-1 rounded-lg border border-slate-300 px-3 py-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full focus:outline-none"
                  aria-label="Due date"
                />
              </label>
              <label className="flex items-center gap-2 flex-1 rounded-lg border border-slate-300 px-3 py-2">
                <Flag className="w-4 h-4 text-slate-400" />
                <select
                  value={importance}
                  onChange={(e) => setImportance(e.target.value)}
                  className="w-full focus:outline-none bg-transparent"
                  aria-label="Importance"
                >
                  {IMPORTANCE_OPTIONS.map((level) => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-indigo-600 text-white px-4 py-2 font-medium hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                {editingId ? 'Save Changes' : 'Add Task'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </form>

        <div className="mb-6">
          <button
            type="button"
            onClick={handlePrioritizeAI}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-slate-800 text-white px-4 py-2.5 font-medium hover:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            {isLoading ? 'Thinking...' : 'Prioritize with Gemini'}
          </button>
        </div>

        <ul className="flex flex-col gap-3">
          {tasks.length === 0 && (
            <li className="text-center text-slate-400 py-8">
              No tasks yet. Add one above to get started.
            </li>
          )}

          {sortedTasks.map((task) => {
            const priorityInfo = getPriorityForTask(task.id);
            return (
              <li
                key={task.id}
                className={`bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col gap-2 ${task.completed ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => handleToggleComplete(task.id)}
                    className="mt-0.5 text-indigo-500 hover:text-indigo-600"
                    aria-label="Toggle complete"
                  >
                    {task.completed ? <CheckCircle className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className={`font-medium text-slate-800 ${task.completed ? 'line-through' : ''}`}>
                        {task.title}
                      </h3>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${IMPORTANCE_STYLES[task.importance] || IMPORTANCE_STYLES.Medium}`}>
                        {task.importance}
                      </span>
                      {priorityInfo && (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PRIORITY_LEVEL_STYLES[priorityInfo.priorityLevel] || PRIORITY_LEVEL_STYLES.Medium}`}>
                          #{priorityInfo.priority} &middot; {priorityInfo.priorityLevel}
                        </span>
                      )}
                    </div>
                    {task.description && (
                      <p className="text-sm text-slate-500 mt-1">{task.description}</p>
                    )}
                    {task.deadline && (
                      <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Due {task.deadline}
                      </p>
                    )}
                    {priorityInfo && priorityInfo.reason && (
                      <p className="text-xs text-indigo-600 mt-2 italic">{priorityInfo.reason}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleEditClick(task)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                      aria-label="Edit task"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                      aria-label="Delete task"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
