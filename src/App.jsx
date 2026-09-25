import { useEffect, useMemo, useRef, useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Circle,
  Coffee,
  Edit3,
  Flag,
  GraduationCap,
  Heart,
  Laugh,
  LayoutGrid,
  Lightbulb,
  List,
  Menu,
  Moon,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Sun,
  Trash2,
  Undo2,
  UserRound,
  X
} from 'lucide-react';

const levels = ['High', 'Medium', 'Low'];
const sorts = ['Due date', 'Importance', 'Recently added', 'Gemini priority'];
const levelRank = { High: 0, Medium: 1, Low: 2 };

// 22 Fun, Colorful, Playful Filipino & English Student Tips, Hugots, Jokes, Love Life, and Academic Advice
const focusQuotes = [
  {
    category: 'Love Life',
    emoji: '💘',
    text: 'Mag-aral muna bago lumandi! Pero kung si crush ang inspiration mo, sige lang—finish your tasks para deserve mo siya.'
  },
  {
    category: 'Hugot',
    emoji: '💔',
    text: 'Buti pa yung to-do list mo may priority. Ikaw kaya, kailan magiging priority niya? Tapusin mo na yan para may closure!'
  },
  {
    category: 'Joke',
    emoji: '😂',
    text: 'Procrastination rule #1: Bakit mo gagawin ngayon kung pwede namang bukas? Joke lang! Tapusin mo na yan bago mag-deadline!'
  },
  {
    category: 'Academic',
    emoji: '💻',
    text: 'BSIT golden rule: Mag-commit at mag-push sa Git bago mag-shutdown. Huwag magtiwala sa 10% laptop battery!'
  },
  {
    category: 'Hugot',
    emoji: '🥀',
    text: 'Mabigat man ang mga tasks mo, mas mabigat pa rin yung binitiwan ka nang walang dahilan. Check it off at mag-move on!'
  },
  {
    category: 'Life Advice',
    emoji: '⚡',
    text: 'Ang deadline parang karma—hindi natutulog, laging papalapit. One task at a time, kaya mo yan!'
  },
  {
    category: 'Joke',
    emoji: '☕',
    text: 'Kapeng matapang: Yung kayang ipaglaban ang grades mo kahit 3 hours na lang ang tulog mo.'
  },
  {
    category: 'Love Life',
    emoji: '💌',
    text: 'Wag mong i-ghost ang assignments mo na parang yung ka-chat mong biglang naglaho nang walang paalam.'
  },
  {
    category: 'Academic',
    emoji: '📚',
    text: '1 hour of focused study without scrolling TikTok or IG Reels beats 5 hours of "kunwari nag-aaral".'
  },
  {
    category: 'Hugot',
    emoji: '🥺',
    text: 'Sana all pinapahalagahan at binibigyan ng attention katulad ng High Priority tasks mo.'
  },
  {
    category: 'Joke',
    emoji: '🛌',
    text: 'Matulog nang maaga? In this economy? Tapusin muna ang to-do list para makatulog nang walang guilt!'
  },
  {
    category: 'Love Life',
    emoji: '✨',
    text: 'Green flag ang taong marunong mag-manage ng to-do list at sumusunod sa schedule. Be that green flag!'
  },
  {
    category: 'Academic',
    emoji: '🎯',
    text: 'Huwag matakot magkamali sa code; diyan natututo ang tunay na programmer. Debug one line at a time.'
  },
  {
    category: 'Life Advice',
    emoji: '🌱',
    text: 'Small progress every single day beats occasional bursts of perfection. Start with the easiest task now!'
  },
  {
    category: 'Hugot',
    emoji: '💔',
    text: 'Akala mo ba tapos na? Parang pagmamahal niya lang, biglang nagka-subtask pa na hindi mo inaasahan.'
  },
  {
    category: 'Joke',
    emoji: '🍕',
    text: 'Reward system: Pagkatapos ng isang task, may 15-minute break. Yung 15 minutes naging 3 hours. Balik ka na dito!'
  },
  {
    category: 'Academic',
    emoji: '🎓',
    text: 'Ang defense hindi nakakatakot kung alam mo bawat sulok ng project mo. Practice your demo script!'
  },
  {
    category: 'Life Advice',
    emoji: '🚀',
    text: 'Protect your energy. Finish the most stressful task first so you can enjoy the rest of your day peacefully.'
  },
  {
    category: 'Love Life',
    emoji: '👀',
    text: 'Kung hindi ka niya ma-chat buong araw, wag mag-overthink. Mag-aral ka na lang o mag-buang!'
  },
  {
    category: 'Hugot',
    emoji: '🌧️',
    text: 'Buti pa ang completed tasks, may checkmark. Tayo kaya, kailan magiging official?'
  },
  {
    category: 'Joke',
    emoji: '🤡',
    text: 'Yung feeling na nag-add ka ng 10 tasks tapos proud ka na agad kahit wala ka pang nasisimulan.'
  },
  {
    category: 'Life Advice',
    emoji: '🏆',
    text: 'Hindi kailangan mabilis, ang mahalaga hindi ka humihinto. You are doing better than you think!'
  }
];

const loadTasks = () => {
  try {
    const value = JSON.parse(localStorage.getItem('smart_todo_tasks') || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
};

const dueInfo = (value, done) => {
  if (!value) return { text: 'No due date', status: 'neutral', time: Infinity };
  const parts = value.split('-').map(Number);
  const date = new Date(parts[0], parts[1] - 1, parts[2]);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.round((date - today) / 86400000);

  if (done) return { text: 'Completed', status: 'completed', time: date.getTime() };
  if (days < 0) return { text: `Overdue by ${Math.abs(days)} day${days === -1 ? '' : 's'}`, status: 'overdue', time: date.getTime() };
  if (!days) return { text: 'Due today', status: 'today', time: date.getTime() };
  if (days === 1) return { text: 'Due tomorrow', status: 'soon', time: date.getTime() };
  return {
    text: days <= 7 ? `Due in ${days} days` : `Due ${new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(date)}`,
    status: days <= 7 ? 'soon' : 'upcoming',
    time: date.getTime()
  };
};

const errorText = (error) => {
  const message = error instanceof Error ? error.message : String(error);
  if (/429|quota|resource_exhausted/i.test(message)) return 'Gemini usage limit reached. Check billing/quota settings or try again later.';
  if (/503|unavailable|demand/i.test(message)) return 'Gemini is temporarily busy. Please try again shortly.';
  if (/401|invalid.*key/i.test(message)) return 'Gemini rejected the API key. Please check your key configuration.';
  if (/unable to check gemini model access|no compatible gemini flash model/i.test(message)) return 'Gemini Flash model is not accessible with this API key.';
  return 'Gemini could not process your request. Please try again.';
};

async function requestWithRetry(ai, request, attempt = 0) {
  try {
    return await ai.models.generateContent(request);
  } catch (error) {
    if (!/503|unavailable|demand/i.test(error.message) || attempt > 1) throw error;
    await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
    return requestWithRetry(ai, request, attempt + 1);
  }
}

function parseJsonResponse(raw) {
  const withoutFence = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  const start = withoutFence.indexOf('{');
  const end = withoutFence.lastIndexOf('}');
  if (start === -1 || end < start) throw new Error('Gemini did not return a JSON response.');
  return JSON.parse(withoutFence.slice(start, end + 1));
}

async function selectModel(key) {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`);
  if (!response.ok) throw new Error('Unable to check Gemini model access.');
  const models = (await response.json()).models || [];
  const model = models.find((item) => item.name === 'models/gemini-3.6-flash') || models.find((item) => /^models\/gemini-3.*flash/i.test(item.name));
  if (!model) throw new Error('No compatible Gemini Flash model is available.');
  return model.name.replace('models/', '');
}

// Google Keep-inspired Smart Logo Component
function KeepLogo() {
  return (
    <div className="keep-brand-logo" aria-hidden="true">
      <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="36" height="36" rx="9" fill="url(#keep-grad)" />
        <path
          d="M11 11H25M11 16H21M11 25L15 22H25V11"
          stroke="white"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.25"
        />
        <circle cx="18" cy="18" r="9.5" fill="#fbbc04" fillOpacity="0.2" />
        <path
          d="M13 18.5L16.5 22L23.5 14"
          stroke="white"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M24 10.5L25 8.5L27 7.5L25 6.5L24 4.5L23 6.5L21 7.5L23 8.5L24 10.5Z"
          fill="#fff"
        />
        <defs>
          <linearGradient id="keep-grad" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fbbc04" />
            <stop offset="1" stopColor="#f29900" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

function TaskCard({
  task,
  aiPriority,
  onToggle,
  onEdit,
  onDelete,
  onAskAiWhy,
  onClearAiReason,
  loadingAiId,
  viewMode
}) {
  const due = dueInfo(task.deadline, task.completed);
  const isAiLoading = loadingAiId === task.id;
  const activeAiReason = task.aiReason || aiPriority?.reason;

  return (
    <article
      className={`keep-card ${task.completed ? 'is-completed' : ''} ${due.status === 'overdue' ? 'is-overdue' : ''} ${viewMode === 'list' ? 'keep-card-list' : ''}`}
      onClick={(e) => {
        if (!e.target.closest('button') && !e.target.closest('input')) {
          onEdit(task);
        }
      }}
    >
      <div className="keep-card-header">
        <button
          className="keep-check-btn"
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggle(task.id);
          }}
          aria-label={task.completed ? 'Mark active' : 'Mark complete'}
        >
          {task.completed ? <CheckCircle2 className="check-done" /> : <Circle className="check-todo" />}
        </button>

        <h3 className="keep-card-title">{task.title}</h3>

        {/* Action icons row: [✨] [✎] [🗑] */}
        <div className="keep-card-hover-actions">
          {!task.completed && (
            <button
              type="button"
              className={`action-btn ai-card-btn ${isAiLoading ? 'is-loading' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                onAskAiWhy(task);
              }}
              aria-label="Ask Gemini why finish this first"
              title="Ask Gemini why finish this first"
              disabled={isAiLoading}
            >
              <Sparkles className="action-sparkle" />
            </button>
          )}

          <button
            type="button"
            className="action-btn"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(task);
            }}
            aria-label="Edit task"
            title="Edit task"
          >
            <Edit3 />
          </button>

          <button
            type="button"
            className="action-btn delete-btn"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(task);
            }}
            aria-label="Delete task"
            title="Delete task"
          >
            <Trash2 />
          </button>
        </div>
      </div>

      {task.description && (
        <p className="keep-card-description">{task.description}</p>
      )}

      {/* Per-Task AI Reason Callout Box */}
      {activeAiReason && (
        <div className="keep-ai-reason-box">
          <div className="ai-reason-header">
            <Sparkles className="sparkle-mini" />
            <span>Why finish this first:</span>
            <button
              type="button"
              className="ai-reason-clear-btn"
              onClick={(e) => {
                e.stopPropagation();
                onClearAiReason(task.id);
              }}
              title="Dismiss AI note"
              aria-label="Dismiss AI note"
            >
              <X />
            </button>
          </div>
          <p className="ai-reason-text">“{activeAiReason}”</p>
        </div>
      )}

      <div className="keep-card-footer">
        <div className="keep-card-chips">
          <span className={`chip chip-${task.importance.toLowerCase()}`}>
            <Flag className="chip-icon" />
            {task.importance}
          </span>

          <span className={`chip chip-due chip-due-${due.status}`}>
            <Calendar className="chip-icon" />
            {due.text}
          </span>

          {aiPriority && (
            <span className="chip chip-ai">
              <Sparkles className="chip-icon" />
              AI #{aiPriority.priority}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

export default function App() {
  const [tasks, setTasks] = useState(loadTasks);
  const [theme, setTheme] = useState(() => localStorage.getItem('smart_todo_theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('smart_todo_view') || 'grid');
  
  // Navigation & Filtering
  const [sidebarLockedOpen, setSidebarLockedOpen] = useState(() => window.innerWidth > 1200);
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'active', 'overdue', 'high', 'completed'
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('Due date');

  // Keep-style Quick Capture Bar
  const [isInputExpanded, setIsInputExpanded] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', deadline: '', importance: 'Medium' });
  const [fieldErrors, setFieldErrors] = useState({});
  const quickInputRef = useRef(null);

  // Edit Modal
  const [editingTask, setEditingTask] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', description: '', deadline: '', importance: 'Medium' });
  const [editErrors, setEditErrors] = useState({});

  // AI & Extras
  const [priorities, setPriorities] = useState(null);
  const [lastPrioritized, setLastPrioritized] = useState(null);
  const [loadingBatchAi, setLoadingBatchAi] = useState(false);
  const [loadingAiTaskId, setLoadingAiTaskId] = useState(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [notice, setNotice] = useState(null);
  const [deleted, setDeleted] = useState(null);

  // Dynamic Tips States (Pause, Prev/Next, Hover Pause)
  const [tipIndex, setTipIndex] = useState(0);
  const [isTipPaused, setIsTipPaused] = useState(false);
  const [isTipHovered, setIsTipHovered] = useState(false);

  const [showAuthorModal, setShowAuthorModal] = useState(false);

  // Determine whether sidebar is visually expanded:
  // On desktop: if locked open OR hovered
  // On mobile: controlled by lockedOpen state
  const isSidebarExpanded = sidebarLockedOpen || sidebarHovered;

  // Auto-cycle Focus / Hugot / Joke tips every 11 seconds (pauses on hover or manual pause)
  useEffect(() => {
    if (isTipPaused || isTipHovered) return undefined;
    const timer = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % focusQuotes.length);
    }, 11000);
    return () => clearInterval(timer);
  }, [isTipPaused, isTipHovered]);

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem('smart_todo_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('smart_todo_theme', theme);
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('smart_todo_view', viewMode);
  }, [viewMode]);

  // Notice auto-dismiss
  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(null), notice.undo ? 6000 : 3500);
    return () => clearTimeout(timer);
  }, [notice]);

  // Close quick form when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (quickInputRef.current && !quickInputRef.current.contains(event.target)) {
        if (!form.title.trim() && !form.description.trim()) {
          setIsInputExpanded(false);
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [form]);

  // Keyboard shortcut: Escape closes modal/expanded form
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (editingTask) setEditingTask(null);
        else if (isInputExpanded) setIsInputExpanded(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editingTask, isInputExpanded]);

  const notify = (message, error = false, undo = false) => setNotice({ message, error, undo });
  const priority = (id) => priorities?.find((item) => item.taskId === id);

  // Check if any AI reason is currently active on any task or batch
  const hasActiveAiAdvice = Boolean(priorities || tasks.some((t) => t.aiReason));

  // Counters for sidebar badges
  const counts = useMemo(() => ({
    all: tasks.length,
    active: tasks.filter((t) => !t.completed).length,
    completed: tasks.filter((t) => t.completed).length,
    overdue: tasks.filter((t) => !t.completed && dueInfo(t.deadline).status === 'overdue').length,
    high: tasks.filter((t) => !t.completed && t.importance === 'High').length,
  }), [tasks]);

  // Filtered & sorted task list
  const filteredTasks = useMemo(() => {
    const q = search.toLowerCase().trim();
    return tasks.filter((t) => {
      const status = dueInfo(t.deadline, t.completed).status;
      const matchesSearch = !q || (t.title + ' ' + (t.description || '')).toLowerCase().includes(q);

      let matchesFilter = true;
      if (activeFilter === 'active') matchesFilter = !t.completed;
      else if (activeFilter === 'completed') matchesFilter = t.completed;
      else if (activeFilter === 'overdue') matchesFilter = !t.completed && status === 'overdue';
      else if (activeFilter === 'high') matchesFilter = !t.completed && t.importance === 'High';

      return matchesSearch && matchesFilter;
    }).sort((a, b) => {
      if (sort === 'Importance') return levelRank[a.importance] - levelRank[b.importance];
      if (sort === 'Recently added') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sort === 'Gemini priority') return (priority(a.id)?.priority || 999) - (priority(b.id)?.priority || 999);
      return dueInfo(a.deadline).time - dueInfo(b.deadline).time;
    });
  }, [tasks, search, activeFilter, sort, priorities]);

  const activeTasks = filteredTasks.filter((t) => !t.completed);
  const completedTasks = filteredTasks.filter((t) => t.completed);

  // Add Task
  const handleQuickAdd = (e) => {
    e.preventDefault();
    const errors = {};
    if (!form.title.trim()) errors.title = 'Title is required';
    if (!form.deadline) errors.deadline = 'Choose a due date';
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;

    const newTask = {
      id: crypto.randomUUID?.() || Date.now().toString(),
      title: form.title.trim(),
      description: form.description.trim(),
      deadline: form.deadline,
      importance: form.importance,
      completed: false,
      createdAt: new Date().toISOString()
    };

    setTasks((prev) => [newTask, ...prev]);
    setForm({ title: '', description: '', deadline: '', importance: 'Medium' });
    setFieldErrors({});
    setIsInputExpanded(false);
    notify('Task created.');
  };

  // Toggle Complete
  const toggleComplete = (id) => {
    const target = tasks.find((t) => t.id === id);
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
    notify(target?.completed ? 'Task restored to active.' : 'Task completed!');
  };

  // Edit Task
  const openEdit = (task) => {
    setEditingTask(task);
    setEditForm({
      title: task.title,
      description: task.description || '',
      deadline: task.deadline,
      importance: task.importance
    });
    setEditErrors({});
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    const errors = {};
    if (!editForm.title.trim()) errors.title = 'Title is required';
    if (!editForm.deadline) errors.deadline = 'Due date is required';
    setEditErrors(errors);
    if (Object.keys(errors).length) return;

    setTasks((prev) =>
      prev.map((t) =>
        t.id === editingTask.id
          ? {
              ...t,
              title: editForm.title.trim(),
              description: editForm.description.trim(),
              deadline: editForm.deadline,
              importance: editForm.importance
            }
          : t
      )
    );
    setEditingTask(null);
    notify('Task updated.');
  };

  // Delete Task
  const deleteTask = (task) => {
    const index = tasks.findIndex((t) => t.id === task.id);
    setDeleted({ task, index, ai: priority(task.id) });
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
    setPriorities((prev) => prev?.filter((p) => p.taskId !== task.id) || null);
    if (editingTask?.id === task.id) setEditingTask(null);
    notify('Task moved to trash.', false, true);
  };

  // Undo Delete
  const handleUndo = () => {
    if (!deleted) return;
    setTasks((prev) => {
      const next = [...prev];
      next.splice(deleted.index, 0, deleted.task);
      return next;
    });
    if (deleted.ai) setPriorities((prev) => [...(prev || []), deleted.ai]);
    setDeleted(null);
    notify('Task restored.');
  };

  // Ask Gemini: "Why finish this task first?" (Per-task [✨] button)
  const handleAskAiWhy = async (task) => {
    const key = import.meta.env.VITE_GEMINI_API_KEY;
    if (!key) {
      return notify('Gemini API key is not configured in VITE_GEMINI_API_KEY.', true);
    }

    setLoadingAiTaskId(task.id);
    try {
      const ai = new GoogleGenAI({ apiKey: key });
      const prompt = `You are a motivating, helpful personal task coach. In 1 to 2 direct and punchy sentences, explain why the user needs to finish this specific task first or focus on it right now, considering its urgency, importance, and deadline. Do not use quotes, asterisks, or bullet points.
Task title: "${task.title}"
Description: "${task.description || 'None'}"
Due date: "${task.deadline || 'No deadline'}"
Importance level: "${task.importance}"
Today's date: "${new Date().toISOString().split('T')[0]}"`;

      const response = await requestWithRetry(ai, {
        model: await selectModel(key),
        contents: prompt
      });

      const explanation = response.text?.trim().replace(/^["']|["']$/g, '');
      if (!explanation) throw new Error('Gemini gave an empty response.');

      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, aiReason: explanation } : t))
      );
      notify('AI priority advice added to card!');
    } catch (error) {
      console.error(error);
      notify(errorText(error), true);
    } finally {
      setLoadingAiTaskId(null);
    }
  };

  // Clear AI Reason on a single task
  const handleClearAiReason = (taskId) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, aiReason: undefined } : t))
    );
    if (priorities) {
      setPriorities((prev) => prev?.filter((p) => p.taskId !== taskId) || null);
    }
  };

  // Complete Reset of ALL AI Advice and Order (clears both global and per-card advice!)
  const handleResetAllAi = () => {
    setPriorities(null);
    setLastPrioritized(null);
    setSort('Due date');
    setTasks((prev) => prev.map((t) => ({ ...t, aiReason: undefined })));
    notify('All AI priorities and advice have been reset.');
  };

  // Batch Gemini AI Prioritization (Top Bar Sparkle Button)
  const handlePrioritizeAll = async () => {
    const incomplete = tasks.filter((t) => !t.completed);
    const key = import.meta.env.VITE_GEMINI_API_KEY;

    if (!incomplete.length) {
      return notify('Add or activate tasks first before prioritizing.', true);
    }
    if (!key) {
      return notify('Gemini API key is not configured in VITE_GEMINI_API_KEY.', true);
    }

    setLoadingBatchAi(true);
    try {
      const ai = new GoogleGenAI({ apiKey: key });
      const prompt = `Prioritize these incomplete tasks based on urgency, deadline, and importance. Return a JSON object with a prioritizedTasks array. Each item must contain: taskId, priority (number 1..N), priorityLevel, and a concise 1-2 sentence reason explaining why to finish it first. Include every input task exactly once. Tasks: ${JSON.stringify(
        incomplete
      )}`;

      const raw = (
        await requestWithRetry(ai, {
          model: await selectModel(key),
          contents: prompt,
          config: { responseMimeType: 'application/json' }
        })
      ).text;

      const list = parseJsonResponse(raw).prioritizedTasks;
      const ids = list?.map((item) => item.taskId) || [];
      if (!Array.isArray(list) || ids.length !== incomplete.length || new Set(ids).size !== ids.length) {
        throw new Error('AI returned an incomplete prioritization structure.');
      }

      setPriorities(list);
      setLastPrioritized(new Date().toISOString());
      setSort('Gemini priority');
      notify('Gemini prioritized all tasks!');
    } catch (error) {
      console.error(error);
      notify(errorText(error), true);
    } finally {
      setLoadingBatchAi(false);
    }
  };

  // Tip navigation handlers
  const handlePrevTip = () => {
    setTipIndex((prev) => (prev === 0 ? focusQuotes.length - 1 : prev - 1));
  };

  const handleNextTip = () => {
    setTipIndex((prev) => (prev + 1) % focusQuotes.length);
  };

  const currentTip = focusQuotes[tipIndex];

  return (
    <div className="keep-app">
      {/* TOP APP BAR - Google Keep style */}
      <header className="keep-topbar">
        <div className="topbar-left">
          <button
            className="icon-btn sandwich-btn"
            type="button"
            onClick={() => setSidebarLockedOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
            title="Main menu"
          >
            <Menu />
          </button>

          <div className="keep-brand">
            <KeepLogo />
            <span className="keep-brand-title">Smart To-Do</span>
          </div>
        </div>

        {/* Integrated Search Bar */}
        <div className="keep-search-container">
          <Search className="search-icon" />
          <input
            type="text"
            className="keep-search-input"
            placeholder="Search tasks, notes, or deadlines…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              className="clear-search-btn"
              type="button"
              onClick={() => setSearch('')}
              aria-label="Clear search"
            >
              <X />
            </button>
          )}
        </div>

        {/* Topbar Actions */}
        <div className="topbar-right">
          {/* Gemini AI Batch Prioritize Trigger */}
          <button
            className={`keep-ai-topbar-btn ${loadingBatchAi ? 'is-loading' : ''}`}
            type="button"
            onClick={handlePrioritizeAll}
            disabled={loadingBatchAi}
            title="Prioritize all active tasks with Gemini AI"
          >
            <Sparkles className="sparkle-icon" />
            <span className="btn-label">{loadingBatchAi ? 'Thinking…' : 'AI Prioritize'}</span>
          </button>

          {/* Grid / List View Toggle */}
          <button
            className="icon-btn"
            type="button"
            onClick={() => setViewMode((prev) => (prev === 'grid' ? 'list' : 'grid'))}
            aria-label={viewMode === 'grid' ? 'Switch to list view' : 'Switch to grid view'}
            title={viewMode === 'grid' ? 'List view' : 'Grid view'}
          >
            {viewMode === 'grid' ? <List /> : <LayoutGrid />}
          </button>

          {/* Theme Toggle */}
          <button
            className="icon-btn"
            type="button"
            onClick={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
            aria-label="Toggle dark/light mode"
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          >
            {theme === 'dark' ? <Sun /> : <Moon />}
          </button>

          {/* User Photo Avatar */}
          <button
            className="author-avatar-btn"
            type="button"
            onClick={() => setShowAuthorModal(true)}
            aria-label="View developer profile: Jayson M. Dialde"
            title="Jayson M. Dialde • 3rd Year BSIT"
          >
            <img
              src="/jayson-profile.jpg"
              alt="Jayson M. Dialde"
              className="author-avatar-img"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement.innerText = 'JD';
              }}
            />
          </button>
        </div>
      </header>

      {/* BODY LAYOUT: Google Keep Hoverable Icon Rail + Expanded Sidebar */}
      <div className="keep-body">
        {/* Backdrop for mobile drawer */}
        {sidebarLockedOpen && (
          <div
            className="sidebar-backdrop"
            onClick={() => setSidebarLockedOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* SIDEBAR NAVIGATION - Expands smoothly on hover (Google Keep style).
            Sidebar is always position:fixed — width transitions eliminate flinch. */}
        <aside
          className={`keep-sidebar ${isSidebarExpanded ? 'is-expanded' : 'is-rail'}`}
          onMouseEnter={() => {
            if (window.innerWidth > 768) setSidebarHovered(true);
          }}
          onMouseLeave={() => {
            if (window.innerWidth > 768) setSidebarHovered(false);
          }}
        >
          <div className="sidebar-scrollable">
            {/* Filter Navigation */}
            <nav className="sidebar-nav">
              <button
                type="button"
                className={`nav-item ${activeFilter === 'all' ? 'active' : ''}`}
                onClick={() => {
                  setActiveFilter('all');
                  if (window.innerWidth <= 768) setSidebarLockedOpen(false);
                }}
                title="All Tasks"
              >
                <div className="nav-item-icon-wrapper">
                  <LayoutGrid />
                </div>
                <span className="nav-item-label">All Tasks</span>
                <span className="nav-badge">{counts.all}</span>
              </button>

              <button
                type="button"
                className={`nav-item ${activeFilter === 'active' ? 'active' : ''}`}
                onClick={() => {
                  setActiveFilter('active');
                  if (window.innerWidth <= 768) setSidebarLockedOpen(false);
                }}
                title="Active"
              >
                <div className="nav-item-icon-wrapper">
                  <Circle />
                </div>
                <span className="nav-item-label">Active</span>
                <span className="nav-badge">{counts.active}</span>
              </button>

              <button
                type="button"
                className={`nav-item ${activeFilter === 'overdue' ? 'active' : ''}`}
                onClick={() => {
                  setActiveFilter('overdue');
                  if (window.innerWidth <= 768) setSidebarLockedOpen(false);
                }}
                title="Overdue"
              >
                <div className="nav-item-icon-wrapper overdue-icon">
                  <AlertCircle />
                </div>
                <span className="nav-item-label">Overdue</span>
                {counts.overdue > 0 && <span className="nav-badge badge-overdue">{counts.overdue}</span>}
              </button>

              <button
                type="button"
                className={`nav-item ${activeFilter === 'high' ? 'active' : ''}`}
                onClick={() => {
                  setActiveFilter('high');
                  if (window.innerWidth <= 768) setSidebarLockedOpen(false);
                }}
                title="High Priority"
              >
                <div className="nav-item-icon-wrapper high-icon">
                  <Flag />
                </div>
                <span className="nav-item-label">High Priority</span>
                {counts.high > 0 && <span className="nav-badge badge-high">{counts.high}</span>}
              </button>

              <button
                type="button"
                className={`nav-item ${activeFilter === 'completed' ? 'active' : ''}`}
                onClick={() => {
                  setActiveFilter('completed');
                  if (window.innerWidth <= 768) setSidebarLockedOpen(false);
                }}
                title="Completed"
              >
                <div className="nav-item-icon-wrapper completed-icon">
                  <CheckCircle2 />
                </div>
                <span className="nav-item-label">Completed</span>
                <span className="nav-badge">{counts.completed}</span>
              </button>
            </nav>

            <div className="sidebar-divider" />

            {/* Quick Sort Section */}
            <div className="sidebar-section">
              <label htmlFor="sidebar-sort" className="sidebar-section-title">
                Sort Tasks
              </label>
              <select
                id="sidebar-sort"
                className="sidebar-select"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                {sorts.map((item) => (
                  <option key={item} disabled={item === 'Gemini priority' && !priorities}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            {/* AI Status / Reset Widget (Shown whenever AI advice is present!) */}
            {hasActiveAiAdvice && (
              <div className="sidebar-ai-card">
                <div className="ai-card-header">
                  <Sparkles className="sparkle-mini" />
                  <span>Gemini Active</span>
                </div>
                {lastPrioritized && (
                  <p className="ai-card-time">
                    Updated{' '}
                    {new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(
                      new Date(lastPrioritized)
                    )}
                  </p>
                )}
                <button
                  type="button"
                  className="sidebar-btn-ghost"
                  onClick={handleResetAllAi}
                  title="Clear all AI priority badges and reason boxes"
                >
                  Reset All AI Advice
                </button>
              </div>
            )}

            <div className="sidebar-divider" />

            {/* PLAYFUL, COLORFUL DYNAMIC FOCUS & HUGOT WIDGET WITH FULL CONTROLS */}
            <div
              className={`sidebar-focus-card focus-card-${currentTip.category.toLowerCase().replace(/\s+/g, '-')}`}
              onMouseEnter={() => setIsTipHovered(true)}
              onMouseLeave={() => setIsTipHovered(false)}
            >
              <div className="focus-header">
                <span className={`focus-cat-tag cat-${currentTip.category.toLowerCase().replace(/\s+/g, '-')}`}>
                  <span className="cat-emoji">{currentTip.emoji}</span>
                  {currentTip.category}
                </span>

                {/* Control Toolbar: Prev, Play/Pause, Next */}
                <div className="focus-ctrl-row">
                  <button
                    type="button"
                    className="focus-ctrl-btn"
                    onClick={handlePrevTip}
                    title="Previous tip"
                    aria-label="Previous tip"
                  >
                    <ChevronLeft />
                  </button>

                  <button
                    type="button"
                    className={`focus-ctrl-btn ${isTipPaused || isTipHovered ? 'is-paused-state' : ''}`}
                    onClick={() => setIsTipPaused((prev) => !prev)}
                    title={isTipPaused ? 'Resume auto-cycle' : 'Pause timer'}
                    aria-label={isTipPaused ? 'Resume auto-cycle' : 'Pause timer'}
                  >
                    {isTipPaused || isTipHovered ? <Play /> : <Pause />}
                  </button>

                  <button
                    type="button"
                    className="focus-ctrl-btn"
                    onClick={handleNextTip}
                    title="Next tip"
                    aria-label="Next tip"
                  >
                    <ChevronRight />
                  </button>
                </div>
              </div>

              {/* Tip Text */}
              <p className="focus-quote" key={tipIndex}>“{currentTip.text}”</p>

              {/* Status footer with counter & hover indicator */}
              <div className="focus-card-meta">
                <span className="tip-counter-text">
                  {tipIndex + 1} of {focusQuotes.length}
                </span>
                {(isTipPaused || isTipHovered) && (
                  <span className="tip-status-pill">
                    {isTipHovered ? 'Hovered (Paused)' : 'Paused'}
                  </span>
                )}
              </div>
            </div>

            {/* Student & Project Details in Sidebar Footer */}
            <div className="sidebar-footer">
              <div className="creator-details" onClick={() => setShowAuthorModal(true)}>
                <img
                  src="/jayson-profile.jpg"
                  alt="Jayson M. Dialde"
                  className="creator-footer-avatar"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <div className="creator-footer-info">
                  <strong className="creator-name">Jayson M. Dialde</strong>
                  <span className="creator-meta">3rd Year BSIT Student</span>
                  <span className="creator-school">
                    <GraduationCap className="school-mini-icon" /> SPU Surigao
                  </span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* MAIN TASK VIEWPORT — margin-left transitions in sync with sidebar width */}
        <main className={`keep-main ${sidebarLockedOpen ? 'sidebar-is-open' : ''}`}>
          <div className="keep-content-container">
            {/* GOOGLE KEEP EXPANDABLE "TAKE A TASK..." CAPTURE BAR */}
            <div
              className={`keep-quick-bar ${isInputExpanded ? 'is-expanded' : ''}`}
              ref={quickInputRef}
            >
              {!isInputExpanded ? (
                <div
                  className="keep-quick-collapsed"
                  onClick={() => setIsInputExpanded(true)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') setIsInputExpanded(true);
                  }}
                >
                  <Plus className="quick-plus-icon" />
                  <span className="quick-placeholder">Take a task…</span>
                  <div className="quick-collapsed-hints">
                    <Calendar className="hint-icon" />
                    <Flag className="hint-icon" />
                  </div>
                </div>
              ) : (
                <form className="keep-quick-form" onSubmit={handleQuickAdd} noValidate>
                  <div className="form-row">
                    <input
                      type="text"
                      className="form-input-title"
                      placeholder="Title"
                      autoFocus
                      value={form.title}
                      onChange={(e) => {
                        setForm({ ...form, title: e.target.value });
                        setFieldErrors({ ...fieldErrors, title: '' });
                      }}
                    />
                    {fieldErrors.title && <small className="input-err">{fieldErrors.title}</small>}
                  </div>

                  <div className="form-row">
                    <textarea
                      className="form-textarea-desc"
                      placeholder="Take notes, steps, or context…"
                      rows={2}
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                    />
                  </div>

                  <div className="quick-form-meta-row">
                    <div className="meta-field">
                      <label htmlFor="quick-deadline" className="meta-label">
                        <Calendar className="meta-icon" /> Due Date
                      </label>
                      <input
                        id="quick-deadline"
                        type="date"
                        className="form-date-input"
                        value={form.deadline}
                        onChange={(e) => {
                          setForm({ ...form, deadline: e.target.value });
                          setFieldErrors({ ...fieldErrors, deadline: '' });
                        }}
                      />
                      {fieldErrors.deadline && <small className="input-err">{fieldErrors.deadline}</small>}
                    </div>

                    <div className="meta-field">
                      <label htmlFor="quick-importance" className="meta-label">
                        <Flag className="meta-icon" /> Importance
                      </label>
                      <select
                        id="quick-importance"
                        className="form-select-input"
                        value={form.importance}
                        onChange={(e) => setForm({ ...form, importance: e.target.value })}
                      >
                        {levels.map((lvl) => (
                          <option key={lvl}>{lvl}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="quick-form-actions">
                    <button
                      type="button"
                      className="btn-text"
                      onClick={() => {
                        setIsInputExpanded(false);
                        setFieldErrors({});
                      }}
                    >
                      Close
                    </button>
                    <button type="submit" className="btn-primary">
                      <Plus className="btn-icon" /> Add Task
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* STATUS FILTER FEEDBACK */}
            {(search || activeFilter !== 'all') && (
              <div className="keep-filter-feedback">
                <span className="feedback-text">
                  Showing: <strong>{activeFilter.toUpperCase()}</strong>
                  {search && ` matching "${search}"`} ({filteredTasks.length} task{filteredTasks.length === 1 ? '' : 's'})
                </span>
                <button
                  type="button"
                  className="feedback-clear"
                  onClick={() => {
                    setActiveFilter('all');
                    setSearch('');
                  }}
                >
                  Clear filter
                </button>
              </div>
            )}

            {/* TASKS CONTAINER */}
            {!filteredTasks.length ? (
              <div className="keep-empty-state">
                <div className="empty-state-icon">
                  <CheckCircle2 />
                </div>
                <h3>{search || activeFilter !== 'all' ? 'No matching tasks' : 'All clear!'}</h3>
                <p>
                  {search || activeFilter !== 'all'
                    ? 'Try adjusting your search query or switching filters.'
                    : 'Click "Take a task…" above to capture what you need to do.'}
                </p>
              </div>
            ) : (
              <>
                {/* ACTIVE TASKS SECTION */}
                {activeTasks.length > 0 && (
                  <section className="keep-tasks-section">
                    <div className={`keep-cards-container ${viewMode === 'list' ? 'layout-list' : 'layout-grid'}`}>
                      {activeTasks.map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          aiPriority={priority(task.id)}
                          onToggle={toggleComplete}
                          onEdit={openEdit}
                          onDelete={deleteTask}
                          onAskAiWhy={handleAskAiWhy}
                          onClearAiReason={handleClearAiReason}
                          loadingAiId={loadingAiTaskId}
                          viewMode={viewMode}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {/* COMPLETED TASKS SECTION */}
                {completedTasks.length > 0 && (
                  <section className="keep-completed-section">
                    <button
                      type="button"
                      className="completed-accordion-toggle"
                      onClick={() => setShowCompleted((prev) => !prev)}
                      aria-expanded={showCompleted}
                    >
                      <ChevronDown className={`accordion-chevron ${showCompleted ? 'is-rotated' : ''}`} />
                      <span>Completed ({completedTasks.length})</span>
                    </button>

                    {showCompleted && (
                      <div className={`keep-cards-container ${viewMode === 'list' ? 'layout-list' : 'layout-grid'}`}>
                        {completedTasks.map((task) => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            aiPriority={priority(task.id)}
                            onToggle={toggleComplete}
                            onEdit={openEdit}
                            onDelete={deleteTask}
                            onAskAiWhy={handleAskAiWhy}
                            onClearAiReason={handleClearAiReason}
                            loadingAiId={loadingAiTaskId}
                            viewMode={viewMode}
                          />
                        ))}
                      </div>
                    )}
                  </section>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* EDIT TASK MODAL */}
      {editingTask && (
        <div className="keep-modal-backdrop" onClick={() => setEditingTask(null)}>
          <div
            className="keep-edit-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Edit Task"
          >
            <form onSubmit={handleSaveEdit} noValidate>
              <div className="modal-header">
                <input
                  type="text"
                  className="modal-title-input"
                  placeholder="Title"
                  value={editForm.title}
                  onChange={(e) => {
                    setEditForm({ ...editForm, title: e.target.value });
                    setEditErrors({ ...editErrors, title: '' });
                  }}
                  autoFocus
                />
                <button
                  type="button"
                  className="icon-btn modal-close-btn"
                  onClick={() => setEditingTask(null)}
                  aria-label="Close"
                >
                  <X />
                </button>
              </div>
              {editErrors.title && <small className="input-err">{editErrors.title}</small>}

              <textarea
                className="modal-desc-input"
                placeholder="Description or notes…"
                rows={3}
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              />

              <div className="modal-meta-row">
                <div className="meta-field">
                  <label htmlFor="edit-deadline" className="meta-label">
                    <Calendar className="meta-icon" /> Due Date
                  </label>
                  <input
                    id="edit-deadline"
                    type="date"
                    className="form-date-input"
                    value={editForm.deadline}
                    onChange={(e) => {
                      setEditForm({ ...editForm, deadline: e.target.value });
                      setEditErrors({ ...editErrors, deadline: '' });
                    }}
                  />
                  {editErrors.deadline && <small className="input-err">{editErrors.deadline}</small>}
                </div>

                <div className="meta-field">
                  <label htmlFor="edit-importance" className="meta-label">
                    <Flag className="meta-icon" /> Importance
                  </label>
                  <select
                    id="edit-importance"
                    className="form-select-input"
                    value={editForm.importance}
                    onChange={(e) => setEditForm({ ...editForm, importance: e.target.value })}
                  >
                    {levels.map((lvl) => (
                      <option key={lvl}>{lvl}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="action-btn delete-btn"
                  onClick={() => deleteTask(editingTask)}
                  title="Delete task"
                >
                  <Trash2 />
                </button>

                <div className="modal-actions-right">
                  <button
                    type="button"
                    className="btn-text"
                    onClick={() => setEditingTask(null)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AUTHOR / ABOUT MODAL WITH PHOTO */}
      {showAuthorModal && (
        <div className="keep-modal-backdrop" onClick={() => setShowAuthorModal(false)}>
          <div
            className="keep-author-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="About Developer"
          >
            <div className="author-modal-header">
              <div className="author-photo-wrapper">
                <img
                  src="/jayson-profile.jpg"
                  alt="Jayson M. Dialde"
                  className="author-photo-big"
                />
              </div>
              <button
                type="button"
                className="icon-btn modal-close-btn"
                onClick={() => setShowAuthorModal(false)}
                aria-label="Close"
              >
                <X />
              </button>
            </div>
            <h2>Jayson M. Dialde</h2>
            <p className="author-role">3rd Year BSIT Student</p>
            <p className="author-institution">
              <GraduationCap className="author-school-icon" /> St. Paul University Surigao
            </p>
            <div className="author-modal-bio">
              <p>
                <strong>Smart To-Do</strong> is crafted with a clean Google Keep design philosophy:
                frictionless task capture, maximum workspace space, and intelligent Gemini AI priority advice.
              </p>
            </div>
            <button
              type="button"
              className="btn-primary full-width"
              onClick={() => setShowAuthorModal(false)}
            >
              Back to To-Do List
            </button>
          </div>
        </div>
      )}

      {/* FLOATING TOAST NOTIFICATION WITH UNDO */}
      {notice && (
        <aside
          className={`keep-toast ${notice.error ? 'toast-error' : ''}`}
          role={notice.error ? 'alert' : 'status'}
        >
          <span className="toast-message">{notice.message}</span>
          {notice.undo && (
            <button type="button" className="toast-undo-btn" onClick={handleUndo}>
              <Undo2 className="undo-icon" /> Undo
            </button>
          )}
        </aside>
      )}
    </div>
  );
}
