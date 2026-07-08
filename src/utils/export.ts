import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import type { Task } from '../App';
import { translations } from '../i18n';
import type { Language } from '../i18n';

export const exportToExcel = (tasks: Task[], lang: Language) => {
  const t = translations[lang];

  if (tasks.length === 0) return;

  // Map tasks to a localized array of objects
  const data = tasks.map((task, index) => ({
    [t.serialNo]: index + 1,
    [t.taskTitle]: task.title,
    [t.description]: task.description || '-',
    [t.assignedTo]: task.assignedTo || '-',
    [t.category]: t[task.category as keyof typeof t] || task.category,
    [t.priority]: t[task.priority as keyof typeof t] || task.priority,
    [t.dueDate]: task.dueDate || '-',
    [t.completed]: task.completed ? t.completed : t.pending,
    [t.dateCreated]: new Date(task.createdAt).toLocaleDateString(lang === 'kn' ? 'kn-IN' : 'en-US'),
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, t.taskReport);

  // Auto-fit column widths
  const maxProps = Object.keys(data[0] || {});
  const wscols = maxProps.map(key => {
    let maxLen = key.length;
    data.forEach(row => {
      const val = row[key as keyof typeof row];
      if (val) {
        const strVal = String(val);
        // Basic length estimation
        maxLen = Math.max(maxLen, strVal.length);
      }
    });
    return { wch: Math.max(maxLen + 3, 10) };
  });
  worksheet['!cols'] = wscols;

  XLSX.writeFile(workbook, `${t.taskReport.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
};

export const exportToPdf = async (tasks: Task[], lang: Language, isDarkMode: boolean) => {
  const t = translations[lang];

  // Create a dynamic container to render the PDF report
  const reportContainer = document.createElement('div');
  reportContainer.style.position = 'absolute';
  reportContainer.style.left = '-9999px';
  reportContainer.style.top = '-9999px';
  reportContainer.style.width = '800px';
  reportContainer.style.padding = '40px';
  reportContainer.style.boxSizing = 'border-box';
  
  // Set theme styles for report container
  if (isDarkMode) {
    reportContainer.style.backgroundColor = '#1e1e24';
    reportContainer.style.color = '#f8fafc';
  } else {
    reportContainer.style.backgroundColor = '#ffffff';
    reportContainer.style.color = '#0f172a';
  }

  // Generate HTML content for the report
  const dateStr = new Date().toLocaleDateString(lang === 'kn' ? 'kn-IN' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  let tasksHtml = '';
  tasks.forEach((task, index) => {
    const statusText = task.completed ? t.completed : t.pending;
    const statusColor = task.completed ? '#10b981' : '#f59e0b';
    const priorityText = t[task.priority as keyof typeof t] || task.priority;
    
    let priorityColor = '#3b82f6'; // Low
    if (task.priority === 'medium') priorityColor = '#f59e0b';
    if (task.priority === 'high') priorityColor = '#ef4444';

    tasksHtml += `
      <tr style="border-bottom: 1px solid ${isDarkMode ? '#334155' : '#e2e8f0'};">
        <td style="padding: 12px 8px; text-align: center;">${index + 1}</td>
        <td style="padding: 12px 8px; font-weight: 600;">${task.title}</td>
        <td style="padding: 12px 8px; font-size: 0.9em; max-width: 150px; word-wrap: break-word;">${task.description || '-'}</td>
        <td style="padding: 12px 8px; font-size: 0.9em;">${task.assignedTo || '-'}</td>
        <td style="padding: 12px 8px;">${t[task.category as keyof typeof t] || task.category}</td>
        <td style="padding: 12px 8px; text-align: center;">
          <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 0.85em; font-weight: 600; background-color: ${priorityColor}15; color: ${priorityColor};">
            ${priorityText}
          </span>
        </td>
        <td style="padding: 12px 8px; text-align: center;">${task.dueDate || '-'}</td>
        <td style="padding: 12px 8px; text-align: center;">
          <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 0.85em; font-weight: 600; background-color: ${statusColor}15; color: ${statusColor};">
            ${statusText}
          </span>
        </td>
      </tr>
    `;
  });

  reportContainer.innerHTML = `
    <div style="border-bottom: 3px solid #6366f1; padding-bottom: 20px; margin-bottom: 30px;">
      <h1 style="margin: 0; font-size: 28px; letter-spacing: 0.5px; color: #6366f1; font-family: sans-serif;">${t.exportPdfHeader}</h1>
      <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.7; font-family: sans-serif;">${t.exportPdfSub}${dateStr}</p>
    </div>

    <div style="display: flex; justify-content: space-between; margin-bottom: 30px; font-size: 14px; font-family: sans-serif;">
      <div style="padding: 15px; border-radius: 8px; background-color: ${isDarkMode ? '#272730' : '#f8fafc'}; border: 1px solid ${isDarkMode ? '#3f3f46' : '#e2e8f0'}; width: 48%; box-sizing: border-box;">
        <strong>${t.totalTasks}:</strong> ${tasks.length} <br/>
        <strong>${t.completedTasks}:</strong> ${tasks.filter(t => t.completed).length} <br/>
        <strong>${t.pendingTasks}:</strong> ${tasks.filter(t => !t.completed).length}
      </div>
      <div style="padding: 15px; border-radius: 8px; background-color: ${isDarkMode ? '#272730' : '#f8fafc'}; border: 1px solid ${isDarkMode ? '#3f3f46' : '#e2e8f0'}; width: 48%; box-sizing: border-box; display: flex; align-items: center; justify-content: center; flex-direction: column;">
        <span style="font-size: 11px; font-weight: bold; opacity: 0.7; text-transform: uppercase; margin-bottom: 5px;">${t.completionRate}</span>
        <span style="font-size: 28px; font-weight: 800; color: #10b981;">
          ${tasks.length > 0 ? Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100) : 0}%
        </span>
      </div>
    </div>

    <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 14px; font-family: sans-serif;">
      <thead>
        <tr style="background-color: #6366f1; color: #ffffff;">
          <th style="padding: 12px 8px; border-top-left-radius: 6px; border-bottom-left-radius: 6px; text-align: center;">${t.serialNo}</th>
          <th style="padding: 12px 8px;">${t.taskTitle}</th>
          <th style="padding: 12px 8px;">${t.description}</th>
          <th style="padding: 12px 8px;">${t.assignedTo}</th>
          <th style="padding: 12px 8px;">${t.category}</th>
          <th style="padding: 12px 8px; text-align: center;">${t.priority}</th>
          <th style="padding: 12px 8px; text-align: center;">${t.dueDate}</th>
          <th style="padding: 12px 8px; border-top-right-radius: 6px; border-bottom-right-radius: 6px; text-align: center;">${t.completed}</th>
        </tr>
      </thead>
      <tbody>
        ${tasksHtml || `<tr><td colspan="8" style="padding: 30px; text-align: center; opacity: 0.5;">${t.noTasks}</td></tr>`}
      </tbody>
    </table>

    <div style="margin-top: 50px; text-align: center; font-size: 12px; opacity: 0.5; border-top: 1px dashed ${isDarkMode ? '#334155' : '#cbd5e1'}; padding-top: 20px; font-family: sans-serif;">
      Powering your productivity in Kannada & English • ${t.appTitle}
    </div>
  `;

  document.body.appendChild(reportContainer);

  try {
    const canvas = await html2canvas(reportContainer, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: isDarkMode ? '#1e1e24' : '#ffffff',
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210;
    const pageHeight = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`${t.taskReport.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
  } finally {
    document.body.removeChild(reportContainer);
  }
};
