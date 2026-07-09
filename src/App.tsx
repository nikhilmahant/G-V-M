import { useState, useEffect } from 'react';
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

const generateEmptyTask = (): Task => ({
  id: Math.random().toString(36).substring(2, 11),
  title: '',
  description: '',
  category: 'work',
  priority: 'medium',
  dueDate: '',
  assignedTo: '',
  completed: false,
  createdAt: new Date().toISOString()
});

function App() {
  // --- STATE ---
  const [tasks, setTasks] = useState<Task[]>(() => {
    let parsed: any[] = [];
    try {
      const saved = localStorage.getItem('gvm_work_list_tasks');
      if (saved) {
        parsed = JSON.parse(saved);
        if (!Array.isArray(parsed)) parsed = [];
      }
    } catch (e) {
      console.error('Failed to parse local storage tasks', e);
    }
    
    // Keep only valid tasks and append empty rows for the spreadsheet
    const validTasks = parsed.filter((t: Task) => t?.title || t?.assignedTo || t?.dueDate);
    const emptyRows = Array.from({ length: 2 }).map(generateEmptyTask);
    
    return [...validTasks, ...emptyRows];
  });

  const [supabase] = useState(() => {
    const url = localStorage.getItem('gvm_supabase_url') || (import.meta.env.VITE_SUPABASE_URL as string) || '';
    const key = localStorage.getItem('gvm_supabase_key') || (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';
    return initSupabase(url, key);
  });

  // --- PERSISTENCE ---
  useEffect(() => {
    // Only save real tasks to local storage
    const validTasks = tasks.filter(t => t.title || t.assignedTo || t.dueDate);
    localStorage.setItem('gvm_work_list_tasks', JSON.stringify(validTasks));
  }, [tasks]);

  useEffect(() => {
    if (!supabase) return;

    const fetchTasks = async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('createdAt', { ascending: true }); // Oldest first, like a sheet

      if (error) {
        console.error('Error fetching tasks from Supabase:', error);
      } else if (data) {
        setTasks((prev) => {
          const dbTasks = data as Task[];
          // If db is empty, preserve local valid tasks
          if (dbTasks.length === 0) {
            const localValid = prev.filter(t => t.title || t.assignedTo || t.dueDate);
            if (localValid.length > 0) return prev;
          }
          
          const emptyRows = Array.from({ length: 2 }).map(generateEmptyTask);
          return [...dbTasks, ...emptyRows];
        });
      }
    };

    fetchTasks();
  }, [supabase]);

  // Real-time Supabase sync
  useEffect(() => {
    if (!supabase) return;

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const serverTask = payload.new as Task;
            setTasks((prev) => {
              const exists = prev.some(t => t.id === serverTask.id);
              if (exists) {
                return prev.map(t => t.id === serverTask.id ? serverTask : t);
              } else {
                // Insert before the first empty task
                const firstEmptyIdx = prev.findIndex(t => !t.title && !t.assignedTo && !t.dueDate);
                const insertIdx = firstEmptyIdx === -1 ? prev.length : firstEmptyIdx;
                const newTasks = [...prev];
                newTasks.splice(insertIdx, 0, serverTask);
                return newTasks;
              }
            });
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

  // --- EVENT HANDLERS ---
  const updateTaskState = (id: string, field: keyof Task, value: any) => {
    setTasks((prev) => {
      const newTasks = prev.map((t) => (t.id === id ? { ...t, [field]: value } : t));
      
      // Auto-add disabled in favor of manual add button
      return newTasks;
    });
  };

  const syncTaskToDb = (task: Task) => {
    if (!supabase) return;
    
    // Only upsert if it has some data. If it's a completely blank row, ignore.
    if (!(task.title || '').trim() && !(task.assignedTo || '').trim() && !(task.dueDate || '').trim()) {
      return; 
    }
    
    supabase.from('tasks').upsert({
      id: task.id,
      title: task.title,
      description: task.description || '',
      category: task.category || 'work',
      priority: task.priority || 'medium',
      dueDate: task.dueDate,
      assignedTo: task.assignedTo || '',
      completed: task.completed,
      createdAt: task.createdAt
    }).then(({ error }) => {
      if (error) console.error("Supabase upsert failed:", error);
    });
  };

  // --- COMPUTATIONS ---
  const validTasks = tasks.filter(t => t.title || t.assignedTo || t.dueDate);
  const totalCount = validTasks.length;
  const completedCount = validTasks.filter((t) => t.completed).length;

  return (
    <div className="app-container">
      <div className="spreadsheet-wrapper">
        
        {/* Header / Banner */}
        <div className="spreadsheet-banner">
          <div className="header-title">G V M Tasks</div>
          <span className="completion-stats">
            {completedCount}/{totalCount} completed
          </span>
        </div>

        {/* Spreadsheet Table */}
        <table className="spreadsheet-table">
          <thead>
            <tr>
              <th className="col-serial center">S.No</th>
              <th className="col-date">Date</th>
              <th className="col-task">Task</th>
              <th className="col-name">NAME</th>
              <th className="col-check center">✓</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task, index) => (
              <tr key={task.id} className={task.completed ? 'row-completed' : ''}>
                
                {/* Serial Number */}
                <td className="center" style={{ color: 'var(--text-main)', fontSize: '0.9rem', fontWeight: 500 }}>
                  {index + 1}
                </td>

                {/* Due Date */}
                <td>
                  <input
                    type="text"
                    placeholder="DD/MM/YYYY"
                    className="cell-input"
                    value={task.dueDate || ''}
                    onChange={(e) => updateTaskState(task.id, 'dueDate', e.target.value)}
                    onBlur={() => syncTaskToDb(task)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') e.currentTarget.blur();
                    }}
                  />
                </td>

                {/* Task Title */}
                <td>
                  <input
                    type="text"
                    className="cell-input"
                    value={task.title || ''}
                    onChange={(e) => updateTaskState(task.id, 'title', e.target.value)}
                    onBlur={() => syncTaskToDb(task)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') e.currentTarget.blur();
                    }}
                  />
                </td>

                {/* Assigned To (NAME) */}
                <td>
                  <input
                    type="text"
                    className="cell-input"
                    value={task.assignedTo || ''}
                    onChange={(e) => updateTaskState(task.id, 'assignedTo', e.target.value)}
                    onBlur={() => syncTaskToDb(task)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') e.currentTarget.blur();
                    }}
                  />
                </td>
                
                {/* Completed Checkbox */}
                <td className="checkbox-cell">
                  <input
                    type="checkbox"
                    className="cell-checkbox"
                    checked={task.completed}
                    onChange={(e) => {
                      const isChecked = e.target.checked;
                      updateTaskState(task.id, 'completed', isChecked);
                      syncTaskToDb({ ...task, completed: isChecked });
                    }}
                  />
                </td>

              </tr>
            ))}
          </tbody>
        </table>
        
        {/* Add Row Button */}
        <div style={{ padding: '0.75rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'center', backgroundColor: 'var(--row-hover)' }}>
          <button 
            onClick={() => setTasks(prev => [...prev, generateEmptyTask()])} 
            style={{ 
              padding: '0.4rem 1rem', 
              background: 'transparent', 
              color: 'var(--text-main)', 
              border: '1px solid var(--border-color)', 
              borderRadius: '4px', 
              cursor: 'pointer', 
              fontWeight: 600,
              fontSize: '0.9rem'
            }}
          >
            + Add Row
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
