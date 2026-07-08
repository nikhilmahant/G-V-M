export type Language = 'en' | 'kn';

export interface Translations {
  appTitle: string;
  appSubtitle: string;
  assignedTo: string;
  enterAssignedTo: string;
  addTask: string;
  editTask: string;
  saveChanges: string;
  taskTitle: string;
  enterTaskTitle: string;
  description: string;
  enterDescription: string;
  category: string;
  selectCategory: string;
  work: string;
  personal: string;
  shopping: string;
  health: string;
  education: string;
  others: string;
  priority: string;
  selectPriority: string;
  low: string;
  medium: string;
  high: string;
  dueDate: string;
  actions: string;
  edit: string;
  delete: string;
  complete: string;
  completed: string;
  pending: string;
  searchPlaceholder: string;
  filterByStatus: string;
  filterByCategory: string;
  filterByPriority: string;
  sortBy: string;
  dateCreated: string;
  dueDateSort: string;
  prioritySort: string;
  statusSort: string;
  exportToExcel: string;
  exportToPdf: string;
  totalTasks: string;
  completedTasks: string;
  pendingTasks: string;
  completionRate: string;
  darkMode: string;
  lightMode: string;
  confirmDelete: string;
  confirmCancel: string;
  confirmYes: string;
  noTasks: string;
  clearFilters: string;
  taskAddedSuccess: string;
  taskUpdatedSuccess: string;
  taskDeletedSuccess: string;
  overdue: string;
  dueToday: string;
  activeTasks: string;
  all: string;
  toastSuccess: string;
  toastDeleted: string;
  toastToggled: string;
  exportPdfHeader: string;
  exportPdfSub: string;
  taskReport: string;
  serialNo: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    appTitle: 'G V M Work list',
    appSubtitle: 'Daily tasks',
    assignedTo: 'Assigned To',
    enterAssignedTo: 'Enter assignee name...',
    addTask: 'Add Task',
    editTask: 'Edit Task',
    saveChanges: 'Save Changes',
    taskTitle: 'Task Title',
    enterTaskTitle: 'Enter task title...',
    description: 'Description',
    enterDescription: 'Enter task description...',
    category: 'Category',
    selectCategory: 'Select Category',
    work: 'Work',
    personal: 'Personal',
    shopping: 'Shopping',
    health: 'Health',
    education: 'Education',
    others: 'Others',
    priority: 'Priority',
    selectPriority: 'Select Priority',
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    dueDate: 'Due Date',
    actions: 'Actions',
    edit: 'Edit',
    delete: 'Delete',
    complete: 'Complete',
    completed: 'Completed',
    pending: 'Pending',
    searchPlaceholder: 'Search tasks by title or description...',
    filterByStatus: 'Status',
    filterByCategory: 'Category',
    filterByPriority: 'Priority',
    sortBy: 'Sort By',
    dateCreated: 'Date Created',
    dueDateSort: 'Due Date',
    prioritySort: 'Priority',
    statusSort: 'Status',
    exportToExcel: 'Export to Excel',
    exportToPdf: 'Export to PDF',
    totalTasks: 'Total Tasks',
    completedTasks: 'Completed',
    pendingTasks: 'Pending',
    completionRate: 'Completion Rate',
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
    confirmDelete: 'Are you sure you want to delete this task?',
    confirmCancel: 'Cancel',
    confirmYes: 'Yes, Delete',
    noTasks: 'No tasks found. Add a task to get started!',
    clearFilters: 'Clear Filters',
    taskAddedSuccess: 'Task added successfully!',
    taskUpdatedSuccess: 'Task updated successfully!',
    taskDeletedSuccess: 'Task deleted successfully!',
    overdue: 'Overdue',
    dueToday: 'Due Today',
    activeTasks: 'Active',
    all: 'All',
    toastSuccess: 'Task saved successfully!',
    toastDeleted: 'Task deleted successfully!',
    toastToggled: 'Task status updated!',
    exportPdfHeader: 'TASK REPORT',
    exportPdfSub: 'Generated on: ',
    taskReport: 'Task Report',
    serialNo: 'S.No',
  },
  kn: {
    appTitle: 'ಜಿ ವಿ ಎಮ್ ಕೆಲಸದ ಪಟ್ಟಿ',
    appSubtitle: 'ದೈನಂದಿನ ಕೆಲಸಗಳು',
    assignedTo: 'ಕೆಲಸ ನಿಯೋಜನೆ (ವ್ಯಕ್ತಿ)',
    enterAssignedTo: 'ಹೆಸರನ್ನು ನಮೂದಿಸಿ...',
    addTask: 'ಕೆಲಸ ಸೇರಿಸಿ',
    editTask: 'ಕೆಲಸ ತಿದ್ದುಪಡಿ',
    saveChanges: 'ಬದಲಾವಣೆ ಉಳಿಸಿ',
    taskTitle: 'ಕೆಲಸದ ಹೆಸರು',
    enterTaskTitle: 'ಕೆಲಸದ ಹೆಸರನ್ನು ನಮೂದಿಸಿ...',
    description: 'ವಿವರಣೆ',
    enterDescription: 'ಕೆಲಸದ ವಿವರಣೆಯನ್ನು ನಮೂದಿಸಿ...',
    category: 'ವರ್ಗ',
    selectCategory: 'ವರ್ಗವನ್ನು ಆಯ್ಕೆ ಮಾಡಿ',
    work: 'ಕೆಲಸ (ಉದ್ಯೋಗ)',
    personal: 'ವೈಯಕ್ತಿಕ',
    shopping: 'ಖರೀದಿ (ಶಾಪಿಂಗ್)',
    health: 'ಆರೋಗ್ಯ',
    education: 'ಶಿಕ್ಷಣ',
    others: 'ಇತರೆ',
    priority: 'ಆದ್ಯತೆ',
    selectPriority: 'ಆದ್ಯತೆಯನ್ನು ಆಯ್ಕೆ ಮಾಡಿ',
    low: 'ಕಡಿಮೆ',
    medium: 'ಮಧ್ಯಮ',
    high: 'ಹೆಚ್ಚು',
    dueDate: 'ಗಡುವು ದಿನಾಂಕ',
    actions: 'ಕ್ರಮಗಳು',
    edit: 'ತಿದ್ದುಪಡಿ',
    delete: 'ಅಳಿಸಿ',
    complete: 'ಪೂರ್ಣಗೊಳಿಸಿ',
    completed: 'ಪೂರ್ಣಗೊಂಡಿದೆ',
    pending: 'ಬಾಕಿ ಇದೆ',
    searchPlaceholder: 'ಹೆಸರು ಅಥವಾ ವಿವರಣೆಯ ಮೂಲಕ ಹುಡುಕಿ...',
    filterByStatus: 'ಸ್ಥಿತಿ',
    filterByCategory: 'ವರ್ಗ',
    filterByPriority: 'ಆದ್ಯತೆ',
    sortBy: 'ವಿಂಗಡಣೆ',
    dateCreated: 'ರಚಿಸಿದ ದಿನಾಂಕ',
    dueDateSort: 'ಗಡುವು ದಿನಾಂಕ',
    prioritySort: 'ಆದ್ಯತೆ',
    statusSort: 'ಸ್ಥಿತಿ',
    exportToExcel: 'ಎಕ್ಸೆಲ್‌ಗೆ ರಫ್ತು ಮಾಡಿ',
    exportToPdf: 'ಪಿಡಿಎಫ್‌ಗೆ ರಫ್ತು ಮಾಡಿ',
    totalTasks: 'ಒಟ್ಟು ಕೆಲಸಗಳು',
    completedTasks: 'ಪೂರ್ಣಗೊಂಡಿದೆ',
    pendingTasks: 'ಬಾಕಿ ಇದೆ',
    completionRate: 'ಪೂರ್ಣಗೊಂಡ ಪ್ರಮಾಣ',
    darkMode: 'ಡಾರ್ಕ್ ಮೋಡ್',
    lightMode: 'ಲೈಟ್ ಮೋಡ್',
    confirmDelete: 'ಈ ಕೆಲಸವನ್ನು ಅಳಿಸಲು ನೀವು ಖಚಿತವಾಗಿಯೂ ಬಯಸುತ್ತೀರಾ?',
    confirmCancel: 'ರದ್ದುಮಾಡಿ',
    confirmYes: 'ಹೌದು, ಅಳಿಸಿ',
    noTasks: 'ಯಾವುದೇ ಕೆಲಸಗಳು ಕಂಡುಬಂದಿಲ್ಲ. ಪ್ರಾರಂಭಿಸಲು ಒಂದು ಕೆಲಸವನ್ನು ಸೇರಿಸಿ!',
    clearFilters: 'ಫಿಲ್ಟರ್‌ಗಳನ್ನು ತೆಗೆದುಹಾಕಿ',
    taskAddedSuccess: 'ಕೆಲಸವನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಸೇರಿಸಲಾಗಿದೆ!',
    taskUpdatedSuccess: 'ಕೆಲಸವನ್ನು ಯಶಸ್ವಿಯಾಗಿ ನವೀಕರಿಸಲಾಗಿದೆ!',
    taskDeletedSuccess: 'ಕೆಲಸವನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಅಳಿಸಲಾಗಿದೆ!',
    overdue: 'ಸಮಯ ಮೀರಿದೆ',
    dueToday: 'ಇಂದೇ ಕೊನೆ ದಿನ',
    activeTasks: 'ಸಕ್ರಿಯ',
    all: 'ಎಲ್ಲಾ',
    toastSuccess: 'ಕೆಲಸವನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಉಳಿಸಲಾಗಿದೆ!',
    toastDeleted: 'ಕೆಲಸವನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಅಳಿಸಲಾಗಿದೆ!',
    toastToggled: 'ಕೆಲಸದ ಸ್ಥಿತಿಯನ್ನು ನವೀಕರಿಸಲಾಗಿದೆ!',
    exportPdfHeader: 'ಕೆಲಸಗಳ ವರದಿ',
    exportPdfSub: 'ರಚಿಸಲಾದ ದಿನಾಂಕ: ',
    taskReport: 'ಕೆಲಸದ ವರದಿ',
    serialNo: 'ಕ್ರಮ ಸಂಖ್ಯೆ',
  },
};
