import { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Check, 
  Search, 
  FileSpreadsheet, 
  FileText, 
  Sun, 
  Moon, 
  Languages, 
  Calendar, 
  AlertCircle, 
  CheckCircle2,
  Clock, 
  Filter, 
  Download, 
  X,
  ListTodo,
  CheckSquare,
  Cloud,
  CloudOff,
  Database,
  Upload
} from 'lucide-react';
import { translations } from './i18n';
import type { Language } from './i18n';
import { exportToExcel, exportToPdf } from './utils/export';
import { initSupabase } from './utils/supabaseClient';
import './App.css';

export interface Task {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  assignedTo?: string;
  completed: boolean;
  createdAt: string;
}

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'deleted' | 'info';
}

function App() {
  // --- STATE ---
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('kannada_todo_tasks');
    return saved ? JSON.parse(saved) : [];
  });

  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('kannada_todo_lang');
    return (saved as Language) || 'kn'; // Default to Kannada!
  });

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('kannada_todo_theme');
    if (saved) return saved as 'light' | 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // Task form fields (Add)
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState<Task['priority']>('medium');
  const [dueDate, setDueDate] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  // Supabase Sync states
  const [sbUrl, setSbUrl] = useState(() => localStorage.getItem('gvm_supabase_url') || (import.meta.env.VITE_SUPABASE_URL as string) || '');
  const [sbKey, setSbKey] = useState(() => localStorage.getItem('gvm_supabase_key') || (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [supabase, setSupabase] = useState(() => {
    const url = localStorage.getItem('gvm_supabase_url') || (import.meta.env.VITE_SUPABASE_URL as string) || '';
    const key = localStorage.getItem('gvm_supabase_key') || (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';
    return initSupabase(url, key);
  });

  // Filters & Sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('dateCreated');

  // Modals & Popups
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const t = translations[lang];

  // --- PERSISTENCE ---
  useEffect(() => {
    localStorage.setItem('kannada_todo_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('kannada_todo_lang', lang);
  }, [lang]);

  useEffect(() => {
    localStorage.setItem('kannada_todo_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    setCategory(t.work);
  }, [lang]);

  // --- SUPABASE EFFECTS & HELPERS ---
  useEffect(() => {
    const activeUrl = sbUrl || (import.meta.env.VITE_SUPABASE_URL as string) || '';
    const activeKey = sbKey || (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';
    const client = initSupabase(activeUrl, activeKey);
    setSupabase(client);
    if (sbUrl && sbKey) {
      localStorage.setItem('gvm_supabase_url', sbUrl);
      localStorage.setItem('gvm_supabase_key', sbKey);
    }
  }, [sbUrl, sbKey]);

  useEffect(() => {
    if (!supabase) return;

    const fetchTasks = async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('createdAt', { ascending: false });

      if (error) {
        console.error('Error fetching tasks from Supabase:', error);
        showToast('Failed to sync from cloud!', 'deleted');
      } else if (data) {
        setTasks(data);
        showToast('Synced with Supabase!', 'success');
      }
    };

    fetchTasks();
  }, [supabase]);

  useEffect(() => {
    if (!supabase) return;

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newTask = payload.new as Task;
            setTasks((prev) => {
              if (prev.some((t) => t.id === newTask.id)) return prev;
              return [newTask, ...prev];
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedTask = payload.new as Task;
            setTasks((prev) =>
              prev.map((t) => (t.id === updatedTask.id ? updatedTask : t))
            );
          } else if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as { id: string }).id;
            setTasks((prev) => prev.filter((t) => t.id !== deletedId));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const handleUploadLocalTasks = async () => {
    if (!supabase || tasks.length === 0) return;
    showToast('Uploading tasks...', 'info');
    
    const { error } = await supabase.from('tasks').insert(tasks);
    if (error) {
      console.error('Error uploading local tasks:', error);
      showToast('Upload failed! (Duplicates?)', 'deleted');
    } else {
      showToast('All tasks uploaded to cloud!', 'success');
    }
  };

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallApp = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };

  // --- TOAST HELPER ---
  const showToast = (message: string, type: Toast['type'] = 'success') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3000);
  };

  // --- HANDLERS ---
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newTask: Task = {
      id: Math.random().toString(36).substr(2, 9),
      title: title.trim(),
      description: description.trim(),
      category,
      priority,
      dueDate,
      assignedTo: assignedTo.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
    };

    if (supabase) {
      supabase.from('tasks').insert(newTask).then(({ error }) => {
        if (error) {
          console.error(error);
          showToast('Cloud save failed!', 'deleted');
        }
      });
    }

    setTasks((prev) => [newTask, ...prev]);
    showToast(t.taskAddedSuccess, 'success');

    // Reset Form
    setTitle('');
    setDescription('');
    setCategory(t.work);
    setPriority('medium');
    setDueDate('');
    setAssignedTo('');
  };

  const handleUpdateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask || !editingTask.title.trim()) return;

    if (supabase) {
      supabase.from('tasks').update({
        title: editingTask.title,
        description: editingTask.description,
        category: editingTask.category,
        priority: editingTask.priority,
        dueDate: editingTask.dueDate,
        assignedTo: editingTask.assignedTo
      }).eq('id', editingTask.id).then(({ error }) => {
        if (error) {
          console.error(error);
          showToast('Cloud update failed!', 'deleted');
        }
      });
    }

    setTasks((prev) =>
      prev.map((task) => (task.id === editingTask.id ? editingTask : task))
    );
    setEditingTask(null);
    showToast(t.taskUpdatedSuccess, 'success');
  };

  const handleDeleteTask = (id: string) => {
    if (supabase) {
      supabase.from('tasks').delete().eq('id', id).then(({ error }) => {
        if (error) {
          console.error(error);
          showToast('Cloud delete failed!', 'deleted');
        }
      });
    }

    setTasks((prev) => prev.filter((task) => task.id !== id));
    setDeletingTaskId(null);
    showToast(t.taskDeletedSuccess, 'deleted');
  };

  const toggleTaskStatus = (id: string) => {
    const target = tasks.find(t => t.id === id);
    if (!target) return;
    const nextCompleted = !target.completed;

    if (supabase) {
      supabase.from('tasks').update({ completed: nextCompleted }).eq('id', id).then(({ error }) => {
        if (error) {
          console.error(error);
          showToast('Cloud toggle failed!', 'deleted');
        }
      });
    }

    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, completed: nextCompleted } : task
      )
    );
    showToast(t.toastToggled, 'info');
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setFilterCategory('all');
    setFilterPriority('all');
    setFilterStatus('all');
    setSortBy('dateCreated');
  };

  // --- UTILITIES ---
  const isTaskOverdue = (taskDueDate: string, completed: boolean) => {
    if (completed || !taskDueDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(taskDueDate);
    due.setHours(0, 0, 0, 0);
    return due < today;
  };

  const isTaskDueToday = (taskDueDate: string, completed: boolean) => {
    if (completed || !taskDueDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(taskDueDate);
    due.setHours(0, 0, 0, 0);
    return due.getTime() === today.getTime();
  };

  // --- FILTERING & SORTING LOGIC ---
  const filteredTasks = tasks
    .filter((task) => {
      const matchesSearch =
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.assignedTo && task.assignedTo.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory =
        filterCategory === 'all' || task.category === filterCategory;
      const matchesPriority =
        filterPriority === 'all' || task.priority === filterPriority;
      const matchesStatus =
        filterStatus === 'all' ||
        (filterStatus === 'completed' && task.completed) ||
        (filterStatus === 'pending' && !task.completed) ||
        (filterStatus === 'overdue' && isTaskOverdue(task.dueDate, task.completed));

      return matchesSearch && matchesCategory && matchesPriority && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'dueDate') {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      if (sortBy === 'priority') {
        const priorityWeight = { high: 3, medium: 2, low: 1 };
        return priorityWeight[b.priority] - priorityWeight[a.priority];
      }
      if (sortBy === 'status') {
        return (a.completed ? 1 : 0) - (b.completed ? 0 : 1);
      }
      // Default: dateCreated (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  // --- STATS COMPUTATIONS ---
  const totalCount = tasks.length;
  const completedCount = tasks.filter((t) => t.completed).length;
  const pendingCount = totalCount - completedCount;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const uniqueCategories = Array.from(new Set(tasks.map((task) => task.category).filter(Boolean)));

  return (
    <div className="app-container">
      {/* 1. Header Panel */}
      <header className="glass-panel app-header">
        <div className="header-title-section">
          <div className="logo-badge">
            <ListTodo size={26} />
          </div>
          <div className="header-text">
            <h1>{t.appTitle}</h1>
            <p>{t.appSubtitle}</p>
          </div>
        </div>
        
        <div className="header-controls">
          {/* Supabase Sync Button */}
          <button 
            className="control-btn" 
            onClick={() => setIsSettingsOpen(true)}
            title="Cloud Sync Settings / ಕ್ಲೌಡ್ ಸಿಂಕ್ ಸೆಟ್ಟಿಂಗ್ಸ್"
            style={{ borderColor: supabase ? 'var(--success)' : '' }}
          >
            {supabase ? <Cloud size={18} style={{ color: 'var(--success)' }} /> : <CloudOff size={18} />}
            <span>{supabase ? 'Synced / ಕ್ಲೌಡ್ ಸಿಂಕ್' : 'Local / ಲೋಕಲ್'}</span>
          </button>

          {/* Language Switcher */}
          <button 
            className="control-btn lang-toggle" 
            onClick={() => setLang(lang === 'en' ? 'kn' : 'en')}
            title="Toggle Language / ಭಾಷೆಯನ್ನು ಬದಲಾಯಿಸಿ"
          >
            <Languages size={18} />
            <span>{lang === 'en' ? 'ಕನ್ನಡ' : 'English'}</span>
          </button>

          {installPrompt && (
            <button 
              className="control-btn" 
              onClick={handleInstallApp}
              style={{ background: 'linear-gradient(135deg, var(--success) 0%, var(--accent-primary) 100%)', color: 'white', border: 'none' }}
              title="Install G V M Work list / ಆಪ್ ಇನ್‌ಸ್ಟಾಲ್ ಮಾಡಿ"
            >
              <Download size={18} />
              <span>Install / ಇನ್‌ಸ್ಟಾಲ್</span>
            </button>
          )}

          {/* Theme Switcher */}
          <button 
            className="control-btn" 
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            title={theme === 'light' ? t.darkMode : t.lightMode}
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </div>
      </header>

      {/* 2. Stats Dashboard */}
      <section className="stats-grid">
        <div className="glass-panel stats-card total">
          <div className="stats-info">
            <span className="stats-label">{t.totalTasks}</span>
            <span className="stats-value">{totalCount}</span>
          </div>
          <div className="stats-icon-wrapper">
            <ListTodo size={24} />
          </div>
        </div>

        <div className="glass-panel stats-card completed">
          <div className="stats-info">
            <span className="stats-label">{t.completedTasks}</span>
            <span className="stats-value">{completedCount}</span>
          </div>
          <div className="stats-icon-wrapper">
            <CheckCircle2 size={24} />
          </div>
        </div>

        <div className="glass-panel stats-card pending">
          <div className="stats-info">
            <span className="stats-label">{t.pendingTasks}</span>
            <span className="stats-value">{pendingCount}</span>
          </div>
          <div className="stats-icon-wrapper">
            <Clock size={24} />
          </div>
        </div>

        <div className="glass-panel stats-card rate">
          <div className="stats-info" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="stats-label">{t.completionRate}</span>
              <span className="stats-value" style={{ fontSize: '1.5rem', color: 'var(--success)' }}>{completionRate}%</span>
            </div>
            <div className="progress-bar-container">
              <div className="progress-bar-fill" style={{ width: `${completionRate}%` }}></div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Main Content Area */}
      <main className="workspace-grid">
        
        {/* Sidebar: Add Task Form */}
        <section className="glass-panel task-form-panel">
          <h2 className="form-title">{t.addTask}</h2>
          <form onSubmit={handleAddTask} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label">{t.taskTitle} *</label>
              <input
                type="text"
                className="form-input"
                placeholder={t.enterTaskTitle}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t.description}</label>
              <textarea
                className="form-input form-textarea"
                placeholder={t.enterDescription}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t.assignedTo}</label>
              <input
                type="text"
                className="form-input"
                placeholder={t.enterAssignedTo}
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t.category}</label>
              <input
                type="text"
                className="form-input"
                placeholder={t.selectCategory}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                list="category-suggestions"
              />
              <datalist id="category-suggestions">
                <option value={t.work} />
                <option value={t.personal} />
                <option value={t.shopping} />
                <option value={t.health} />
                <option value={t.education} />
                <option value={t.others} />
              </datalist>
            </div>

            <div className="form-group">
              <label className="form-label">{t.priority}</label>
              <select
                className="form-select"
                value={priority}
                onChange={(e) => setPriority(e.target.value as Task['priority'])}
              >
                <option value="low">{t.low}</option>
                <option value="medium">{t.medium}</option>
                <option value="high">{t.high}</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">{t.dueDate}</label>
              <input
                type="date"
                className="form-input"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            <button type="submit" className="btn-primary">
              <Plus size={18} />
              <span>{t.addTask}</span>
            </button>
          </form>
        </section>

        {/* Right Pane: Filters, Exporters & Tasks List */}
        <section className="tasks-panel">
          
          {/* Filters Dashboard Toolbar */}
          <div className="glass-panel filter-toolbar">
            <div className="search-wrapper">
              <Search className="search-icon" size={18} />
              <input
                type="text"
                className="form-input search-input"
                placeholder={t.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="filters-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)' }}>
                <Filter size={16} />
              </div>
              
              <select
                className="form-select"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">{t.filterByStatus}: {t.all}</option>
                <option value="pending">{t.pending}</option>
                <option value="completed">{t.completed}</option>
                <option value="overdue">{t.overdue}</option>
              </select>

              <select
                className="form-select"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="all">{t.filterByCategory}: {t.all}</option>
                {uniqueCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              <select
                className="form-select"
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
              >
                <option value="all">{t.filterByPriority}: {t.all}</option>
                <option value="low">{t.low}</option>
                <option value="medium">{t.medium}</option>
                <option value="high">{t.high}</option>
              </select>

              <select
                className="form-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="dateCreated">{t.sortBy}: {t.dateCreated}</option>
                <option value="dueDate">{t.sortBy}: {t.dueDateSort}</option>
                <option value="priority">{t.sortBy}: {t.prioritySort}</option>
                <option value="status">{t.sortBy}: {t.statusSort}</option>
              </select>

              {(searchQuery || filterCategory !== 'all' || filterPriority !== 'all' || filterStatus !== 'all' || sortBy !== 'dateCreated') && (
                <button className="control-btn btn-icon-label" onClick={clearAllFilters}>
                  <X size={14} />
                  <span>{t.clearFilters}</span>
                </button>
              )}
            </div>

            {/* Export buttons */}
            {tasks.length > 0 && (
              <div className="export-row">
                <button 
                  className="control-btn export-btn excel"
                  onClick={() => exportToExcel(filteredTasks, lang)}
                  title={t.exportToExcel}
                >
                  <FileSpreadsheet size={16} />
                  <span>{t.exportToExcel}</span>
                </button>

                <button 
                  className="control-btn export-btn pdf"
                  onClick={() => exportToPdf(filteredTasks, lang, theme === 'dark')}
                  title={t.exportToPdf}
                >
                  <FileText size={16} />
                  <span>{t.exportToPdf}</span>
                </button>
              </div>
            )}
          </div>

          {/* Tasks Cards List */}
          <div className="tasks-list-container">
            {filteredTasks.length > 0 ? (
              filteredTasks.map((task) => {
                const isOverdue = isTaskOverdue(task.dueDate, task.completed);
                const isToday = isTaskDueToday(task.dueDate, task.completed);
                
                return (
                  <div 
                    key={task.id} 
                    className={`glass-panel task-card priority-${task.priority} ${task.completed ? 'completed' : ''}`}
                  >
                    {/* Checkbox */}
                    <div className="checkbox-container" onClick={() => toggleTaskStatus(task.id)}>
                      <div className="custom-checkbox">
                        {task.completed && <Check size={14} strokeWidth={3} />}
                      </div>
                    </div>

                    {/* Task Info */}
                    <div className="task-content">
                      <div className="task-title-row">
                        <span className="task-title">{task.title}</span>
                      </div>
                      
                      {task.description && (
                        <p className="task-desc">{task.description}</p>
                      )}

                      <div className="task-tags">
                        <span className="tag category">
                          {task.category}
                        </span>

                        <span className="tag" style={{
                          backgroundColor: task.priority === 'high' ? 'var(--danger-bg)' : task.priority === 'medium' ? 'var(--warning-bg)' : 'var(--accent-bg)',
                          color: task.priority === 'high' ? 'var(--danger)' : task.priority === 'medium' ? 'var(--warning)' : 'var(--accent-primary)',
                        }}>
                          {t[task.priority as keyof typeof t] || task.priority}
                        </span>

                        {task.dueDate && (
                          <span className={`tag due-date ${isOverdue ? 'overdue' : isToday ? 'today' : ''}`}>
                            <Calendar size={12} />
                            <span>
                              {isOverdue 
                                ? `${t.overdue}: ${task.dueDate}` 
                                : isToday 
                                ? `${t.dueToday}: ${task.dueDate}` 
                                : task.dueDate}
                            </span>
                          </span>
                        )}

                        {task.assignedTo && (
                          <span className="tag category" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)', border: '1px solid var(--panel-border)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                            👤 {task.assignedTo}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="task-actions">
                      <button 
                        className="action-btn edit" 
                        onClick={() => setEditingTask(task)}
                        title={t.edit}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        className="action-btn delete" 
                        onClick={() => setDeletingTaskId(task.id)}
                        title={t.delete}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="glass-panel no-tasks-card">
                <CheckSquare size={48} className="no-tasks-icon" />
                <p>{t.noTasks}</p>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* --- 4. MODALS --- */}

      {/* Edit Task Modal */}
      {editingTask && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content">
            <h2 className="modal-header">{t.editTask}</h2>
            <form onSubmit={handleUpdateTask} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">{t.taskTitle} *</label>
                <input
                  type="text"
                  className="form-input"
                  value={editingTask.title}
                  onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t.description}</label>
                <textarea
                  className="form-input form-textarea"
                  value={editingTask.description}
                  onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t.assignedTo}</label>
                <input
                  type="text"
                  className="form-input"
                  value={editingTask.assignedTo || ''}
                  onChange={(e) => setEditingTask({ ...editingTask, assignedTo: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t.category}</label>
                <input
                  type="text"
                  className="form-input"
                  value={editingTask.category}
                  onChange={(e) => setEditingTask({ ...editingTask, category: e.target.value })}
                  list="edit-category-suggestions"
                />
                <datalist id="edit-category-suggestions">
                  <option value={t.work} />
                  <option value={t.personal} />
                  <option value={t.shopping} />
                  <option value={t.health} />
                  <option value={t.education} />
                  <option value={t.others} />
                </datalist>
              </div>

              <div className="form-group">
                <label className="form-label">{t.priority}</label>
                <select
                  className="form-select"
                  value={editingTask.priority}
                  onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value as Task['priority'] })}
                >
                  <option value="low">{t.low}</option>
                  <option value="medium">{t.medium}</option>
                  <option value="high">{t.high}</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">{t.dueDate}</label>
                <input
                  type="date"
                  className="form-input"
                  value={editingTask.dueDate}
                  onChange={(e) => setEditingTask({ ...editingTask, dueDate: e.target.value })}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="control-btn btn-secondary" onClick={() => setEditingTask(null)}>
                  {t.confirmCancel}
                </button>
                <button type="submit" className="btn-primary">
                  {t.saveChanges}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingTaskId && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ maxWidth: '400px' }}>
            <h2 className="modal-header" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)' }}>
              <AlertCircle size={22} />
              <span>{t.delete}</span>
            </h2>
            <p style={{ color: 'var(--text-main)', fontSize: '0.95rem' }}>{t.confirmDelete}</p>
            <div className="modal-actions">
              <button className="control-btn btn-secondary" onClick={() => setDeletingTaskId(null)}>
                {t.confirmCancel}
              </button>
              <button className="control-btn btn-danger" onClick={() => handleDeleteTask(deletingTaskId)}>
                {t.confirmYes}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Supabase Sync Settings Modal */}
      {isSettingsOpen && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ maxWidth: '520px' }}>
            <h2 className="modal-header" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Database size={22} className="no-tasks-icon" style={{ opacity: 1 }} />
              <span>Cloud Sync / ಕ್ಲೌಡ್ ಸಿಂಕ್</span>
            </h2>
            
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Enable real-time task sync between multiple devices using a free Supabase database.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
              <div className="form-group">
                <label className="form-label">Supabase URL</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="https://your-project.supabase.co"
                  value={sbUrl}
                  onChange={(e) => setSbUrl(e.target.value.trim())}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Supabase Anon Key</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="eyJhbGciOi..."
                  value={sbKey}
                  onChange={(e) => setSbKey(e.target.value.trim())}
                />
              </div>
            </div>

            {supabase && tasks.length > 0 && (
              <div style={{ padding: '0.8rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--accent-bg)', border: '1px solid var(--panel-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Sync existing local tasks?</span>
                <button className="control-btn" onClick={handleUploadLocalTasks} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                  <Upload size={14} />
                  <span>Upload to Cloud</span>
                </button>
              </div>
            )}

            {/* SQL Instructions */}
            <details style={{ marginTop: '0.5rem', cursor: 'pointer' }}>
              <summary style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-primary)' }}>
                Database Setup Guide / ಡೇಟಾಬೇಸ್ ಗೈಡ್
              </summary>
              <div style={{ marginTop: '0.5rem', padding: '0.75rem', borderRadius: '4px', backgroundColor: 'var(--input-bg)', border: '1px solid var(--panel-border)', fontSize: '0.8rem', cursor: 'text', maxHeight: '180px', overflowY: 'auto' }}>
                <p style={{ marginBottom: '0.5rem' }}>1. Create a free account at <strong>supabase.com</strong> and create a project.</p>
                <p style={{ marginBottom: '0.5rem' }}>2. Go to the <strong>SQL Editor</strong> in Supabase and run this script to create the table:</p>
                <pre style={{ padding: '0.5rem', backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: '4px', overflowX: 'auto', fontSize: '0.75rem', fontFamily: 'monospace' }}>
{`-- Drop the table if it already exists
drop table if exists tasks cascade;

create table tasks (
  id text primary key,
  title text not null,
  description text,
  category text,
  priority text,
  "dueDate" text,
  "assignedTo" text,
  completed boolean default false,
  "createdAt" text not null
);

-- Enable Realtime
alter publication supabase_realtime add table tasks;

-- Disable RLS (or enable public access)
alter table tasks disable row level security;`}
                </pre>
              </div>
            </details>

            <div className="modal-actions" style={{ marginTop: '1rem' }}>
              {supabase && (
                <button 
                  type="button" 
                  className="control-btn btn-danger" 
                  onClick={() => {
                    setSbUrl('');
                    setSbKey('');
                    setIsSettingsOpen(false);
                    showToast('Disconnected from cloud!', 'deleted');
                  }}
                  style={{ marginRight: 'auto' }}
                >
                  Disconnect / ಕಡಿತಗೊಳಿಸಿ
                </button>
              )}
              <button type="button" className="btn-primary" onClick={() => setIsSettingsOpen(false)}>
                Close / ಮುಚ್ಚಿ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification Container */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div 
            key={toast.id} 
            className="toast" 
            style={{ 
              borderLeftColor: toast.type === 'success' ? 'var(--success)' : toast.type === 'deleted' ? 'var(--danger)' : 'var(--accent-primary)' 
            }}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 size={16} style={{ color: 'var(--success)' }} />
            ) : toast.type === 'deleted' ? (
              <AlertCircle size={16} style={{ color: 'var(--danger)' }} />
            ) : (
              <Clock size={16} style={{ color: 'var(--accent-primary)' }} />
            )}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <footer style={{ marginTop: 'auto', textAlign: 'center', padding: '2rem 0 1rem 0', fontSize: '0.85rem', color: 'var(--text-muted)', borderTop: '1px solid var(--panel-border)' }}>
        <p>© 2026 Developed by nikhil mahant</p>
      </footer>
    </div>
  );
}

export default App;
