import React, { useState, useEffect, useRef } from 'react';
import {
  Circle, CheckCircle2, Trash2, Inbox, Sparkles, Clock,
  Calendar as CalendarIcon, Bot, Loader2, BookOpen, Hourglass,
  SunMoon, Lock, MessageCircle, X, Send, Activity, PlusCircle,
  BellRing, AlertCircle, ArrowRightCircle, Paperclip, FileText,
  Timer, ChevronLeft, ChevronRight, Flag, Play, Pause, RotateCcw,
  Coffee, Plus, BarChart2, TrendingUp, CheckSquare, GripVertical,
  Lightbulb, RefreshCw
} from 'lucide-react';

const apiKey = "AIzaSyAHoVzpprG8IVOPUSBiWWtrLCoHKl5rcDI";

// ─────────────────────────────────────────────
// 🍅 番茄钟（支持绑定任务，自动记录用时）
// ─────────────────────────────────────────────
function PomodoroTimer({ onClose, tasks, onRecordTime }) {
  const [mode, setMode] = useState('focus');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [cycles, setCycles] = useState(0);
  const [boundTaskId, setBoundTaskId] = useState('');
  // accumulatedMinutes: total focus minutes logged to bound task this session
  const [accumulatedMinutes, setAccumulatedMinutes] = useState(0);
  // sessionLog: list of {taskId, taskText, minutes} for today
  const [sessionLog, setSessionLog] = useState([]);

  const totalTime = mode === 'focus' ? 25 * 60 : 5 * 60;
  const r = 52; const circ = 2 * Math.PI * r;
  const progress = (totalTime - timeLeft) / totalTime;

  const boundTask = tasks.find(t => t.id === boundTaskId) || null;

  // When a focus session ends, record 25 min to bound task
  const handleFocusComplete = () => {
    setMode('break');
    setTimeLeft(5 * 60);
    setCycles(c => c + 1);
    if (boundTask) {
      const mins = 25;
      onRecordTime(boundTask.id, boundTask.text, mins);
      setAccumulatedMinutes(a => a + mins);
      setSessionLog(prev => {
        const existing = prev.find(l => l.taskId === boundTask.id);
        if (existing) return prev.map(l => l.taskId === boundTask.id ? { ...l, minutes: l.minutes + mins } : l);
        return [...prev, { taskId: boundTask.id, taskText: boundTask.text, minutes: mins }];
      });
    }
    if (Notification.permission === 'granted')
      new Notification('🍅 专注完成！', { body: boundTask ? `已为「${boundTask.text.slice(0, 15)}」记录 25 分钟` : '休息5分钟！' });
  };

  useEffect(() => {
    if (!isRunning) return;
    const iv = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          setIsRunning(false);
          if (mode === 'focus') { handleFocusComplete(); }
          else { setMode('focus'); setTimeLeft(25 * 60); if (Notification.permission === 'granted') new Notification('☕ 休息结束', { body: '开始下一轮！' }); }
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [isRunning, mode, boundTask]);

  const reset = () => { setIsRunning(false); setTimeLeft(mode === 'focus' ? 25 * 60 : 5 * 60); };
  const switchMode = () => { const n = mode === 'focus' ? 'break' : 'focus'; setMode(n); setIsRunning(false); setTimeLeft(n === 'focus' ? 25 * 60 : 5 * 60); };
  const mins = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const secs = String(timeLeft % 60).padStart(2, '0');
  const isFocus = mode === 'focus';
  const accent = isFocus ? { ring: '#f43f5e', bg: 'bg-rose-500', hover: 'hover:bg-rose-600', label: '专注时间' } : { ring: '#10b981', bg: 'bg-emerald-500', hover: 'hover:bg-emerald-600', label: '休息时间' };

  // Only show incomplete tasks
  const selectableTasks = tasks.filter(t => !t.completed);

  return (
    <div className="fixed bottom-28 left-6 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
      <div className={`${accent.bg} px-4 py-3 text-white flex justify-between items-center`}>
        <div className="flex items-center gap-2">{isFocus ? <Timer className="w-4 h-4" /> : <Coffee className="w-4 h-4" />}<span className="font-semibold text-sm">{accent.label}</span></div>
        <button onClick={onClose} className="opacity-70 hover:opacity-100"><X className="w-4 h-4" /></button>
      </div>

      <div className="p-4 flex flex-col items-center gap-3">
        {/* Task binding selector */}
        <div className="w-full">
          <p className="text-[11px] text-gray-400 mb-1.5 font-medium">绑定任务（专注结束自动记录用时）</p>
          <select
            value={boundTaskId}
            onChange={e => { setBoundTaskId(e.target.value); setAccumulatedMinutes(0); }}
            disabled={isRunning}
            className="w-full text-xs px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:border-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">— 不绑定任务 —</option>
            {selectableTasks.map(t => (
              <option key={t.id} value={t.id}>{t.text.slice(0, 28)}{t.text.length > 28 ? '…' : ''}</option>
            ))}
          </select>
        </div>

        {/* Bound task display */}
        {boundTask && (
          <div className="w-full bg-rose-50 border border-rose-100 rounded-xl px-3 py-2 flex items-center justify-between">
            <span className="text-xs text-rose-700 font-medium truncate flex-1">{boundTask.text.slice(0, 22)}{boundTask.text.length > 22 ? '…' : ''}</span>
            {accumulatedMinutes > 0 && (
              <span className="text-[11px] text-rose-500 font-bold shrink-0 ml-2">+{accumulatedMinutes}min 已记录</span>
            )}
          </div>
        )}

        {/* Timer ring */}
        <div className="relative">
          <svg width="110" height="110" className="-rotate-90">
            <circle cx="55" cy="55" r={r} fill="none" stroke="#f1f5f9" strokeWidth="7" />
            <circle cx="55" cy="55" r={r} fill="none" stroke={accent.ring} strokeWidth="7"
              strokeDasharray={circ} strokeDashoffset={circ * (1 - progress)}
              strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s linear' }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-gray-800 tabular-nums">{mins}:{secs}</span>
            <span className="text-[10px] text-gray-400 mt-0.5">第 {cycles + 1} 轮</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button onClick={reset} className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50"><RotateCcw className="w-4 h-4" /></button>
          <button onClick={() => setIsRunning(r => !r)}
            className={`flex items-center gap-1.5 px-5 py-2 rounded-xl text-white text-sm font-medium ${accent.bg} ${accent.hover}`}>
            {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isRunning ? '暂停' : '开始'}
          </button>
          <button onClick={switchMode} className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50">
            {isFocus ? <Coffee className="w-4 h-4" /> : <Timer className="w-4 h-4" />}
          </button>
        </div>

        {/* Session log */}
        {sessionLog.length > 0 && (
          <div className="w-full border-t border-gray-100 pt-3 space-y-1.5">
            <p className="text-[11px] text-gray-400 font-medium mb-1">本次会话记录</p>
            {sessionLog.map((l, i) => (
              <div key={i} className="flex justify-between items-center text-[11px]">
                <span className="text-gray-600 truncate flex-1">{l.taskText.slice(0, 20)}{l.taskText.length > 20 ? '…' : ''}</span>
                <span className="text-rose-500 font-bold shrink-0 ml-2">{l.minutes}min</span>
              </div>
            ))}
          </div>
        )}

        <p className="text-[11px] text-gray-400">今日完成 {cycles} 个专注周期 🍅</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// 📅 未来日历
// ─────────────────────────────────────────────
function FutureCalendar({ futureEvents, setFutureEvents, setTasks, apiKey, showMessage, onClose }) {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const [isDDL, setIsDDL] = useState(false);
  const [breakingId, setBreakingId] = useState(null);
  const year = viewDate.getFullYear(); const month = viewDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7;
  const fmt = (d) => `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const monthName = viewDate.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' });
  const eventsOn = (ds) => futureEvents.filter(e => e.date === ds);
  const selectedEvents = selectedDate ? futureEvents.filter(e => e.date === selectedDate) : [];
  const upcomingDDLs = futureEvents.filter(e => e.isDDL && e.date >= todayStr).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 6);

  const addEvent = () => {
    if (!newTitle.trim() || !selectedDate) return;
    setFutureEvents(prev => [...prev, { id: Date.now().toString(), title: newTitle.trim(), date: selectedDate, isDDL, broken: false, subtaskCount: 0 }]);
    setNewTitle(''); setIsDDL(false);
    showMessage(isDDL ? '📌 DDL 已记录！点击"AI拆解"自动规划进度' : '✅ 事项已记录');
  };

  const breakdownDDL = async (event) => {
    if (!apiKey) return showMessage('请先配置 API Key');
    setBreakingId(event.id);
    const ddlDate = new Date(event.date + 'T12:00:00');
    const targetDate = new Date(ddlDate); targetDate.setDate(targetDate.getDate() - 1);
    const daysAvail = Math.max(1, Math.ceil((ddlDate - today) / 86400000));
    try {
      const payload = {
        contents: [{ parts: [{ text: `你是学习规划助手。【任务】：${event.title}【DDL】：${event.date}（今天${todayStr}，还有${daysAvail}天）【目标】在${targetDate.toISOString().split('T')[0]}前完成。拆解成每日执行步骤，每天最多2个，合理分散，早期调研中期输出后期修改。严格返回JSON：[{"date":"YYYY-MM-DD","task":"步骤","duration":"时长"}] duration仅限(30分钟,1小时,2小时,半天)。` }] }],
        generationConfig: { responseMimeType: 'application/json', responseSchema: { type: 'ARRAY', items: { type: 'OBJECT', properties: { date: { type: 'STRING' }, task: { type: 'STRING' }, duration: { type: 'STRING' } }, required: ['date', 'task', 'duration'] } } }
      };
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error('失败');
      const data = await res.json();
      const subtasks = JSON.parse(data.candidates?.[0]?.content?.parts?.[0]?.text || '[]');
      const newTasks = subtasks.map((s, i) => { const d = new Date(s.date + 'T12:00:00'); const dow = d.getDay() === 0 ? 7 : d.getDay(); return { id: `${Date.now()}-ddl-${i}`, text: `📌 ${s.task}`, completed: false, createdAt: new Date().toISOString(), day: dow, startTime: null, endTime: null, duration: s.duration, preferredTime: '不限时段', priority: '🔴 紧急', isFixed: false, fromDDL: event.id, ddlTitle: event.title.slice(0, 20) }; });
      setTasks(prev => [...newTasks, ...prev]);
      setFutureEvents(prev => prev.map(e => e.id === event.id ? { ...e, broken: true, subtaskCount: subtasks.length } : e));
      showMessage(`🎉 已拆解成 ${subtasks.length} 个子任务！`, 6000);
    } catch { showMessage('AI 拆解失败，请稍后重试'); } finally { setBreakingId(null); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <div className="flex items-center gap-3"><div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center"><CalendarIcon className="w-4 h-4 text-violet-600" /></div><div><h2 className="font-bold text-gray-900 text-base">未来日历 & DDL 追踪</h2><p className="text-xs text-gray-400">记录截止日期，AI 帮你提前规划</p></div></div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex flex-1 overflow-hidden min-h-0">
          <div className="flex-1 p-5 overflow-y-auto border-r border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => setViewDate(new Date(year, month - 1, 1))} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"><ChevronLeft className="w-4 h-4" /></button>
              <span className="font-semibold text-gray-700 text-sm">{monthName}</span>
              <button onClick={() => setViewDate(new Date(year, month + 1, 1))} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"><ChevronRight className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-1">{['一','二','三','四','五','六','日'].map(d => <div key={d} className="text-center text-[11px] text-gray-400 font-medium py-1">{d}</div>)}</div>
            <div className="grid grid-cols-7 gap-1">
              {Array(firstDow).fill(null).map((_, i) => <div key={`e${i}`} />)}
              {Array.from({ length: daysInMonth }, (_, i) => { const d = i + 1; const ds = fmt(d); const evts = eventsOn(ds); const isToday = ds === todayStr; const isSel = ds === selectedDate; const isPast = ds < todayStr; return (<button key={d} onClick={() => setSelectedDate(ds)} disabled={isPast} className={`aspect-square rounded-xl text-xs flex flex-col items-center justify-start pt-1.5 pb-1 gap-0.5 transition-all ${isSel ? 'bg-indigo-600 text-white shadow-md' : isToday ? 'bg-indigo-50 text-indigo-700 font-bold ring-1 ring-indigo-200' : isPast ? 'text-gray-200 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}><span>{d}</span>{evts.length > 0 && <div className="flex gap-0.5">{evts.slice(0, 3).map((e, idx) => <span key={idx} className={`w-1 h-1 rounded-full ${isSel ? 'bg-white/80' : e.isDDL ? 'bg-red-400' : 'bg-indigo-400'}`} />)}</div>}</button>); })}
            </div>
            <div className="flex items-center gap-5 mt-4 text-[11px] text-gray-400"><div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" />DDL</div><div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-indigo-400 inline-block" />普通事项</div></div>
          </div>
          <div className="w-64 p-5 overflow-y-auto flex flex-col gap-4 bg-gray-50/50">
            {selectedDate ? (<>
              <p className="text-xs font-semibold text-gray-500">{new Date(selectedDate + 'T12:00:00').toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })}</p>
              <div className="space-y-2">{selectedEvents.length === 0 ? <p className="text-xs text-gray-300 py-1">暂无安排</p> : selectedEvents.map(ev => (<div key={ev.id} className={`p-3 rounded-xl border ${ev.isDDL ? 'bg-red-50 border-red-100' : 'bg-white border-gray-100'}`}><div className="flex justify-between items-start gap-1"><div className="flex-1 min-w-0">{ev.isDDL && <div className="flex items-center gap-1 text-[10px] text-red-500 font-bold mb-0.5"><Flag className="w-2.5 h-2.5" /> DDL</div>}<p className="text-gray-800 font-medium text-xs">{ev.title}</p>{ev.broken && <p className="text-[10px] text-emerald-600 mt-1 flex items-center gap-1"><CheckCircle2 className="w-2.5 h-2.5" />已拆解 {ev.subtaskCount} 个子任务</p>}</div><button onClick={() => setFutureEvents(prev => prev.filter(e => e.id !== ev.id))} className="text-gray-300 hover:text-red-400"><X className="w-3.5 h-3.5" /></button></div>{ev.isDDL && !ev.broken && <button onClick={() => breakdownDDL(ev)} disabled={breakingId === ev.id} className="mt-2.5 w-full flex items-center justify-center gap-1.5 py-1.5 bg-gradient-to-r from-violet-500 to-indigo-500 text-white text-xs rounded-lg font-medium disabled:opacity-60">{breakingId === ev.id ? <><Loader2 className="w-3 h-3 animate-spin" />拆解中...</> : <><Sparkles className="w-3 h-3" />AI 智能拆解</>}</button>}</div>))}</div>
              <div className="space-y-2">
                <input value={newTitle} onChange={e => setNewTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && addEvent()} placeholder="添加事项..." className="w-full text-xs px-3 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 placeholder:text-gray-300" />
                <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer select-none"><input type="checkbox" checked={isDDL} onChange={e => setIsDDL(e.target.checked)} className="rounded accent-red-500" /><Flag className="w-3 h-3 text-red-400" />标记为 DDL</label>
                <button onClick={addEvent} disabled={!newTitle.trim()} className="w-full py-2 bg-gray-900 text-white text-xs font-medium rounded-xl disabled:opacity-30">确认添加</button>
              </div>
            </>) : <div className="text-center py-10 text-gray-300"><CalendarIcon className="w-8 h-8 mx-auto mb-2" /><p className="text-xs">点击日期查看或添加</p></div>}
            {upcomingDDLs.length > 0 && <div className="border-t border-gray-100 pt-4"><p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-3">即将到期</p><div className="space-y-2">{upcomingDDLs.map(e => { const days = Math.ceil((new Date(e.date + 'T12:00:00') - today) / 86400000); return <div key={e.id} className="flex items-center justify-between gap-2"><span className="text-xs text-gray-700 truncate flex-1">{e.title}</span><span className={`text-[11px] font-bold shrink-0 ${days <= 2 ? 'text-red-500' : days <= 5 ? 'text-amber-500' : 'text-gray-400'}`}>{days === 0 ? '今天！' : `${days}天`}</span></div>; })}</div></div>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// 📊 每日回顾
// ─────────────────────────────────────────────
function DailyReview({ tasks, classes, selectedDay, onClose }) {
  const dayNames = ['周一','周二','周三','周四','周五','周六','周日'];
  const dayTasks = tasks.filter(t => t.day === selectedDay || !t.day);
  const completed = dayTasks.filter(t => t.completed);
  const total = dayTasks.length;
  const rate = total === 0 ? 0 : Math.round((completed.length / total) * 100);

  const parseMin = (t) => { if (!t) return 0; const [h, m] = t.split(':').map(Number); return h * 60 + m; };

  let classMin = 0, deepMin = 0, miscMin = 0, devMin = 0;
  classes.filter(c => c.day === selectedDay).forEach(c => classMin += parseMin(c.endTime) - parseMin(c.startTime));
  completed.forEach(t => {
    let min = 0;
    if (t.startTime && t.endTime) min = parseMin(t.endTime) - parseMin(t.startTime);
    else if (t.duration === '15分钟') min = 15; else if (t.duration === '30分钟') min = 30;
    else if (t.duration === '1小时') min = 60; else if (t.duration === '2小时') min = 120;
    else if (t.duration === '半天') min = 240; else min = 45;
    if (t.priority === '🔴 紧急') deepMin += min; else miscMin += min;
  });
  dayTasks.filter(t => !t.completed).forEach(t => {
    let min = 0;
    if (t.duration === '15分钟') min = 15; else if (t.duration === '30分钟') min = 30;
    else if (t.duration === '1小时') min = 60; else if (t.duration === '2小时') min = 120;
    else if (t.duration === '半天') min = 240; else min = 45;
    devMin += min;
  });

  const focusHours = ((deepMin + miscMin) / 60).toFixed(1);
  const totalEstMin = dayTasks.reduce((acc, t) => {
    if (t.duration === '15分钟') return acc + 15; if (t.duration === '30分钟') return acc + 30;
    if (t.duration === '1小时') return acc + 60; if (t.duration === '2小时') return acc + 120;
    if (t.duration === '半天') return acc + 240; return acc + 45;
  }, 0);
  const deviation = totalEstMin > 0 ? Math.round(((deepMin + miscMin - totalEstMin) / totalEstMin) * 100) : 0;

  const totalVis = classMin + deepMin + miscMin + 1;
  const bars = [
    { label: '上课', min: classMin, color: '#e07b39' },
    { label: '紧急任务', min: deepMin, color: '#4338ca' },
    { label: '常规事务', min: miscMin, color: '#1D9E75' },
    { label: '未完成', min: devMin, color: '#e5e7eb' },
  ];

  const insight = rate >= 80 ? '完成率很高，节奏稳定！' :
    rate >= 50 ? `有 ${total - completed.length} 项任务未完成，下次规划时可以适当减少每日任务量。` :
    `今天超过一半任务未完成，建议检查是否把任务估时调太低了。`;

  const level = rate >= 80 ? { text: '出色', cls: 'bg-emerald-500' } : rate >= 50 ? { text: '良好', cls: 'bg-amber-500' } : { text: '待改进', cls: 'bg-rose-500' };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <div className="flex items-center gap-3"><div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center"><BarChart2 className="w-4 h-4 text-indigo-600" /></div><div><h2 className="font-bold text-gray-900 text-base">每日回顾</h2><p className="text-xs text-gray-400">{dayNames[selectedDay - 1]} · 时间去哪了</p></div></div>
          <div className="flex items-center gap-2"><span className={`px-2.5 py-1 text-xs font-bold rounded-lg text-white ${level.cls}`}>{level.text}</span><button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400"><X className="w-4 h-4" /></button></div>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: '完成任务', val: `${completed.length} / ${total}`, sub: `${rate}%` },
              { label: '专注时间', val: `${focusHours}h`, sub: '已记录' },
              { label: '预估偏差', val: `${deviation > 0 ? '+' : ''}${deviation}%`, sub: deviation > 20 ? '偏高' : '正常', warn: deviation > 20 },
            ].map(m => (
              <div key={m.label} className="bg-gray-50 rounded-2xl p-3 text-center">
                <p className="text-[11px] text-gray-400 mb-1">{m.label}</p>
                <p className={`text-xl font-bold ${m.warn ? 'text-rose-500' : 'text-gray-800'}`}>{m.val}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">{m.sub}</p>
              </div>
            ))}
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 mb-3">时间去哪了</p>
            <div className="space-y-2.5">
              {bars.filter(b => b.min > 0).map(b => (
                <div key={b.label}>
                  <div className="flex justify-between text-xs mb-1"><span className="text-gray-500">{b.label}</span><span className="font-medium text-gray-700">{(b.min / 60).toFixed(1)}h</span></div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(b.min / totalVis) * 100}%`, background: b.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-indigo-50 rounded-2xl p-4 flex gap-3">
            <Lightbulb className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
            <p className="text-sm text-indigo-800 leading-relaxed"><span className="font-semibold">AI 洞察：</span>{insight}</p>
          </div>

          {completed.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2">今日完成战绩</p>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {completed.map(t => <div key={t.id} className="flex items-center gap-2 text-xs text-gray-600"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /><span className="line-through text-gray-400 truncate">{t.text}</span></div>)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// ⏱ 时间感知：查找历史同类任务
// ─────────────────────────────────────────────
function getTimeAwareness(taskText, estimatedDuration, taskHistory) {
  if (!taskText || taskHistory.length === 0) return null;
  const keywords = taskText.toLowerCase().split(/[\s，,。.]+/).filter(w => w.length >= 2);
  const similar = taskHistory.filter(h => {
    const htxt = h.text.toLowerCase();
    return keywords.some(k => htxt.includes(k));
  });
  if (similar.length === 0) return null;
  const avgActual = similar.reduce((acc, h) => acc + h.actualMinutes, 0) / similar.length;
  const durationMap = { '15分钟': 15, '30分钟': 30, '1小时': 60, '2小时': 120, '半天': 240, 'AI自动评估': null };
  const estMin = durationMap[estimatedDuration];
  if (!estMin) return null;
  const ratio = avgActual / estMin;
  if (ratio < 1.4) return null;
  const suggested = avgActual < 45 ? '30分钟' : avgActual < 75 ? '1小时' : avgActual < 150 ? '2小时' : '半天';
  return { avgActual: Math.round(avgActual), ratio: ratio.toFixed(1), suggested, count: similar.length };
}

// ─────────────────────────────────────────────
// 🏠 主 App
// ─────────────────────────────────────────────

// ─────────────────────────────────────────────
// 🥗 饮食健康模块
// ─────────────────────────────────────────────
function NutritionPanel({ apiKey, showMessage, onClose }) {
  const todayKey = new Date().toISOString().split('T')[0];

  // Body profile
  const [profile, setProfile] = React.useState(() => {
    const s = localStorage.getItem('companion-star-body');
    return s ? JSON.parse(s) : { height: '', weight: '', age: '', gender: 'female', activityLevel: 'moderate' };
  });
  const [editingProfile, setEditingProfile] = React.useState(false);
  const [profileDraft, setProfileDraft] = React.useState(profile);

  // Daily nutrition data — auto-reset each day
  const loadDayData = () => {
    const s = localStorage.getItem('companion-star-nutrition');
    if (!s) return null;
    const d = JSON.parse(s);
    return d.date === todayKey ? d : null;
  };

  const defaultDayData = () => ({
    date: todayKey,
    water: 0,
    meals: { breakfast: null, lunch: null, dinner: null, snack: null },
    aiSummary: null,
  });

  const [dayData, setDayData] = React.useState(() => loadDayData() || defaultDayData());
  const [mealInput, setMealInput] = React.useState({ breakfast: '', lunch: '', dinner: '', snack: '' });
  const [analyzingMeal, setAnalyzingMeal] = React.useState(null);
  const [waterInput, setWaterInput] = React.useState('');
  const [activeSection, setActiveSection] = React.useState('today'); // 'today' | 'profile'

  React.useEffect(() => {
    localStorage.setItem('companion-star-body', JSON.stringify(profile));
  }, [profile]);

  React.useEffect(() => {
    localStorage.setItem('companion-star-nutrition', JSON.stringify(dayData));
  }, [dayData]);

  // Calculate TDEE based on profile
  const calcTargets = () => {
    const h = parseFloat(profile.height), w = parseFloat(profile.weight), a = parseFloat(profile.age);
    if (!h || !w || !a) return null;
    // Mifflin-St Jeor
    const bmr = profile.gender === 'female'
      ? 10 * w + 6.25 * h - 5 * a - 161
      : 10 * w + 6.25 * h - 5 * a + 5;
    const actMap = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725 };
    const tdee = Math.round(bmr * (actMap[profile.activityLevel] || 1.55));
    const protein = Math.round(w * 1.6); // 1.6g/kg
    const veggies = 5; // portions
    const water = Math.round(w * 35); // ml
    const carbs = Math.round((tdee * 0.45) / 4);
    const fat = Math.round((tdee * 0.3) / 9);
    return { tdee, protein, veggies, water, carbs, fat };
  };
  const targets = calcTargets();

  // Analyze meal via AI
  const analyzeMeal = async (mealKey) => {
    const input = mealInput[mealKey];
    if (!input.trim()) return;
    if (!apiKey) { showMessage('请先在设置中配置 API Key'); return; }
    setAnalyzingMeal(mealKey);
    try {
      const targetStr = targets ? `用户身高${profile.height}cm体重${profile.weight}kg，每日目标：热量${targets.tdee}kcal、蛋白质${targets.protein}g、蔬菜${targets.veggies}份、饮水${targets.water}ml。` : '';
      const payload = {
        contents: [{ parts: [{ text: `你是营养师助手。用户描述了一餐的内容。${targetStr}
餐次：${mealKey === 'breakfast' ? '早餐' : mealKey === 'lunch' ? '午餐' : mealKey === 'dinner' ? '晚餐' : '加餐'}
用户描述：「${input}」

请估算这餐的营养情况，严格返回JSON（不加markdown）：
{
  "description": "简洁描述这餐内容（15字内）",
  "calories": 数字,
  "protein": 数字,
  "carbs": 数字,
  "fat": 数字,
  "veggies": 数字,
  "quality": "优质|均衡|偏油|偏咸|蛋白不足|蔬菜不足|热量偏高|热量偏低",
  "tip": "一句针对性建议（20字内，温和不焦虑）"
}` }] }],
        generationConfig: { responseMimeType: 'application/json' }
      };
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('失败');
      const result = await res.json();
      const raw = result.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      const data = JSON.parse(raw.replace(/```json|```/g, '').trim());
      setDayData(prev => ({ ...prev, meals: { ...prev.meals, [mealKey]: data } }));
      setMealInput(prev => ({ ...prev, [mealKey]: '' }));
    } catch { showMessage('AI 解析失败，请重试'); }
    finally { setAnalyzingMeal(null); }
  };

  const addWater = (ml) => {
    setDayData(prev => ({ ...prev, water: Math.min((prev.water || 0) + ml, targets?.water ? targets.water * 1.5 : 3000) }));
  };

  const mealNames = { breakfast: '🌅 早餐', lunch: '☀️ 午餐', dinner: '🌙 晚餐', snack: '🍎 加餐' };
  const qualityColor = { '优质': 'bg-emerald-100 text-emerald-700', '均衡': 'bg-green-100 text-green-700', '偏油': 'bg-amber-100 text-amber-700', '偏咸': 'bg-amber-100 text-amber-700', '蛋白不足': 'bg-blue-100 text-blue-700', '蔬菜不足': 'bg-lime-100 text-lime-700', '热量偏高': 'bg-orange-100 text-orange-700', '热量偏低': 'bg-sky-100 text-sky-700' };

  // Totals from recorded meals
  const totals = Object.values(dayData.meals).filter(Boolean).reduce((acc, m) => ({
    calories: acc.calories + (m.calories || 0),
    protein: acc.protein + (m.protein || 0),
    veggies: acc.veggies + (m.veggies || 0),
    fat: acc.fat + (m.fat || 0),
    carbs: acc.carbs + (m.carbs || 0),
  }), { calories: 0, protein: 0, veggies: 0, fat: 0, carbs: 0 });

  const pct = (v, t) => t ? Math.min(100, Math.round((v / t) * 100)) : 0;
  const waterPct = targets ? pct(dayData.water, targets.water) : pct(dayData.water, 2000);

  const saveProfile = () => {
    setProfile(profileDraft);
    setEditingProfile(false);
    showMessage('✅ 身体信息已保存，营养目标已更新');
  };

  const activityLabels = { sedentary: '久坐（少运动）', light: '轻度活动（每周1-3次）', moderate: '中度活动（每周3-5次）', active: '高度活动（每天运动）' };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center text-lg">🥗</div>
            <div>
              <h2 className="font-bold text-gray-900 text-base">饮食健康</h2>
              <p className="text-xs text-gray-400">今日营养追踪 · 每天自动重置</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setActiveSection(s => s === 'profile' ? 'today' : 'profile')}
              className={`text-xs px-3 py-1.5 rounded-xl border font-medium transition-colors ${activeSection === 'profile' ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
              👤 我的信息
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400"><X className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          {/* ── Profile section ── */}
          {activeSection === 'profile' && (
            <div className="space-y-4">
              {!targets && (
                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-sm text-amber-800">
                  填写你的基本信息，我会计算你个性化的每日营养目标（热量、蛋白质、饮水量等）。
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: '身高 (cm)', key: 'height', placeholder: '如：165' },
                  { label: '体重 (kg)', key: 'weight', placeholder: '如：55' },
                  { label: '年龄', key: 'age', placeholder: '如：20' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-xs text-gray-500 mb-1 block">{f.label}</label>
                    <input type="number" value={profileDraft[f.key]}
                      onChange={e => setProfileDraft(p => ({ ...p, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                      className="w-full text-sm px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-300 placeholder:text-gray-300" />
                  </div>
                ))}
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">性别</label>
                  <select value={profileDraft.gender} onChange={e => setProfileDraft(p => ({ ...p, gender: e.target.value }))}
                    className="w-full text-sm px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-300">
                    <option value="female">女</option>
                    <option value="male">男</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">活动水平</label>
                <select value={profileDraft.activityLevel} onChange={e => setProfileDraft(p => ({ ...p, activityLevel: e.target.value }))}
                  className="w-full text-sm px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-300">
                  {Object.entries(activityLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              {targets && (
                <div className="bg-indigo-50 rounded-2xl p-4 grid grid-cols-3 gap-3">
                  {[
                    { label: '每日热量', val: `${targets.tdee} kcal`, color: 'text-indigo-700' },
                    { label: '蛋白质', val: `${targets.protein} g`, color: 'text-emerald-700' },
                    { label: '碳水', val: `${targets.carbs} g`, color: 'text-amber-700' },
                    { label: '脂肪', val: `${targets.fat} g`, color: 'text-orange-700' },
                    { label: '蔬菜', val: `${targets.veggies} 份`, color: 'text-green-700' },
                    { label: '饮水', val: `${targets.water} ml`, color: 'text-blue-700' },
                  ].map(m => (
                    <div key={m.label} className="text-center bg-white rounded-xl p-2.5">
                      <p className="text-[10px] text-gray-400 mb-1">{m.label}</p>
                      <p className={`text-sm font-bold ${m.color}`}>{m.val}</p>
                    </div>
                  ))}
                </div>
              )}
              <button onClick={saveProfile} className="w-full py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700">保存并更新目标</button>
            </div>
          )}

          {/* ── Today section ── */}
          {activeSection === 'today' && (<>

            {/* No profile prompt */}
            {!targets && (
              <button onClick={() => setActiveSection('profile')}
                className="w-full bg-amber-50 border border-amber-200 rounded-2xl p-3 text-xs text-amber-700 text-left hover:bg-amber-100 transition-colors">
                ⚠️ 填写你的身高体重，获取个性化营养目标 →
              </button>
            )}

            {/* Nutrition overview */}
            <div className="bg-gray-50 rounded-2xl p-4">
              <div className="flex justify-between items-center mb-3">
                <p className="text-xs font-semibold text-gray-600">今日营养概览</p>
                {targets && <p className="text-[11px] text-gray-400">目标 {targets.tdee} kcal</p>}
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                {[
                  { label: '热量', cur: totals.calories, target: targets?.tdee, unit: 'kcal', color: '#4f46e5' },
                  { label: '蛋白质', cur: totals.protein, target: targets?.protein, unit: 'g', color: '#1D9E75' },
                  { label: '蔬菜', cur: totals.veggies, target: targets?.veggies || 5, unit: '份', color: '#639922' },
                  { label: '饮水', cur: Math.round(dayData.water / 100) / 10, target: targets ? targets.water / 1000 : 2, unit: 'L', color: '#378ADD' },
                ].map(m => (
                  <div key={m.label} className="bg-white rounded-xl p-3">
                    <div className="flex justify-between items-baseline mb-1.5">
                      <span className="text-[11px] text-gray-400">{m.label}</span>
                      <span className="text-[11px] font-bold" style={{ color: m.color }}>
                        {m.label === '饮水' ? `${m.cur.toFixed(1)}` : m.cur}<span className="text-[10px] font-normal text-gray-400 ml-0.5">{m.unit}</span>
                        {m.target && <span className="text-[10px] font-normal text-gray-300"> / {m.label === '饮水' ? (m.target/1000).toFixed(1) : m.target}</span>}
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${m.target ? Math.min(100, Math.round((m.label === '饮水' ? dayData.water : (m.label === 'kcal' ? totals.calories : m.label === '蛋白质' ? totals.protein : totals.veggies)) / m.target * 100)) : 0}%`, background: m.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Water tracker */}
            <div className="bg-blue-50 rounded-2xl p-4">
              <div className="flex justify-between items-center mb-3">
                <p className="text-sm font-semibold text-blue-800">💧 饮水追踪</p>
                <span className="text-xs font-bold text-blue-600">{dayData.water} / {targets?.water || 2000} ml</span>
              </div>
              {/* Water progress dots */}
              <div className="flex gap-1.5 flex-wrap mb-3">
                {Array.from({ length: Math.ceil((targets?.water || 2000) / 200) }, (_, i) => (
                  <div key={i} className={`w-6 h-6 rounded-full border-2 transition-all ${(i * 200) < dayData.water ? 'bg-blue-400 border-blue-400' : 'bg-white border-blue-200'}`} />
                ))}
              </div>
              <div className="flex gap-2 flex-wrap">
                {[150, 200, 300, 500].map(ml => (
                  <button key={ml} onClick={() => addWater(ml)}
                    className="text-xs px-3 py-1.5 bg-white border border-blue-200 text-blue-600 rounded-xl hover:bg-blue-100 font-medium transition-colors">
                    +{ml}ml
                  </button>
                ))}
                <div className="flex items-center gap-1">
                  <input type="number" value={waterInput} onChange={e => setWaterInput(e.target.value)}
                    placeholder="自定义" className="text-xs px-2 py-1.5 bg-white border border-blue-200 rounded-xl w-20 focus:outline-none focus:border-blue-400 placeholder:text-gray-300" />
                  <button onClick={() => { if (waterInput) { addWater(parseInt(waterInput)); setWaterInput(''); } }}
                    className="text-xs px-2.5 py-1.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600">加入</button>
                </div>
                {dayData.water > 0 && (
                  <button onClick={() => setDayData(p => ({ ...p, water: Math.max(0, p.water - 200) }))}
                    className="text-xs px-2.5 py-1.5 bg-white border border-gray-200 text-gray-400 rounded-xl hover:bg-gray-50">-200ml</button>
                )}
              </div>
            </div>

            {/* Meals */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-gray-500">三餐记录</p>
              {Object.entries(mealNames).map(([key, name]) => {
                const meal = dayData.meals[key];
                const isAnalyzing = analyzingMeal === key;
                return (
                  <div key={key} className="bg-white border border-gray-100 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-700">{name}</span>
                      {meal && (
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${qualityColor[meal.quality] || 'bg-gray-100 text-gray-500'}`}>{meal.quality}</span>
                          <button onClick={() => setDayData(p => ({ ...p, meals: { ...p.meals, [key]: null } }))}
                            className="text-gray-300 hover:text-red-400"><X className="w-3.5 h-3.5" /></button>
                        </div>
                      )}
                    </div>

                    {meal ? (
                      <div>
                        <p className="text-xs text-gray-600 mb-2">{meal.description}</p>
                        <div className="flex gap-3 text-[11px] text-gray-400 mb-2">
                          <span>🔥 {meal.calories}kcal</span>
                          <span>🥩 {meal.protein}g蛋白</span>
                          <span>🥦 {meal.veggies}份菜</span>
                        </div>
                        {meal.tip && (
                          <div className="bg-gray-50 rounded-xl px-3 py-2 text-[11px] text-gray-500">
                            💡 {meal.tip}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input value={mealInput[key]} onChange={e => setMealInput(p => ({ ...p, [key]: e.target.value }))}
                          onKeyDown={e => e.key === 'Enter' && analyzeMeal(key)}
                          placeholder={`描述你吃了什么，如"一碗米饭、红烧肉、炒青菜"`}
                          className="flex-1 text-xs px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-300 placeholder:text-gray-300" />
                        <button onClick={() => analyzeMeal(key)} disabled={isAnalyzing || !mealInput[key].trim()}
                          className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${isAnalyzing || !mealInput[key].trim() ? 'bg-gray-100 text-gray-300' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
                          {isAnalyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                          {isAnalyzing ? '分析中' : 'AI分析'}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Today's AI summary */}
            {Object.values(dayData.meals).filter(Boolean).length >= 2 && targets && (() => {
              const proteinPct = pct(totals.protein, targets.protein);
              const calPct = pct(totals.calories, targets.tdee);
              const tips = [];
              if (proteinPct < 70) tips.push(`蛋白质只达标 ${proteinPct}%，晚餐可以加鸡蛋或豆腐`);
              if (totals.veggies < targets.veggies - 1) tips.push(`蔬菜还差 ${targets.veggies - totals.veggies} 份，尽量补一份绿叶菜`);
              if (dayData.water < targets.water * 0.6) tips.push(`饮水只有目标的 ${Math.round(dayData.water / targets.water * 100)}%，记得多喝水`);
              if (calPct > 110) tips.push(`热量已超目标 ${calPct - 100}%，晚餐可以清淡一些`);
              if (tips.length === 0) return null;
              return (
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
                  <p className="text-xs font-semibold text-emerald-800 mb-2">📊 今日营养小结</p>
                  <div className="space-y-1.5">
                    {tips.map((t, i) => <p key={i} className="text-xs text-emerald-700 leading-relaxed">· {t}</p>)}
                  </div>
                </div>
              );
            })()}

          </>)}
        </div>
      </div>
    </div>
  );
}


// ─────────────────────────────────────────────
// 🛌 作息设置弹窗
// ─────────────────────────────────────────────
function RoutineSettings({ routineBlocks, setRoutineBlocks, onClose }) {
  const [blocks, setBlocks] = React.useState(routineBlocks);
  const [newLabel, setNewLabel] = React.useState('');
  const [newStart, setNewStart] = React.useState('');
  const [newEnd, setNewEnd] = React.useState('');

  const update = (id, field, value) => setBlocks(prev => prev.map(b => b.id === id ? { ...b, [field]: value } : b));
  const remove = (id) => setBlocks(prev => prev.filter(b => b.id !== id));
  const addCustom = () => {
    if (!newLabel.trim() || !newStart || !newEnd) return;
    setBlocks(prev => [...prev, { id: 'custom_' + Date.now(), label: newLabel.trim(), emoji: '⏰', startTime: newStart, endTime: newEnd, enabled: true }]);
    setNewLabel(''); setNewStart(''); setNewEnd('');
  };
  const save = () => { setRoutineBlocks(blocks); onClose(); };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-lg">🛌</div>
            <div>
              <h2 className="font-bold text-gray-900 text-base">作息时间设置</h2>
              <p className="text-xs text-gray-400">AI 排期时会自动跳过这些时间段</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400"><X className="w-4 h-4" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-2">
          {blocks.map(b => (
            <div key={b.id} className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${b.enabled ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100 opacity-50'}`}>
              <span className="text-lg shrink-0">{b.emoji}</span>
              <span className="text-sm font-medium text-gray-700 w-20 shrink-0">{b.label}</span>
              <div className="flex items-center gap-1.5 flex-1">
                <input type="time" value={b.startTime} onChange={e => update(b.id, 'startTime', e.target.value)} disabled={!b.enabled}
                  className="text-xs px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:border-indigo-300 disabled:cursor-not-allowed w-24" />
                <span className="text-gray-300 text-xs">—</span>
                <input type="time" value={b.endTime} onChange={e => update(b.id, 'endTime', e.target.value)} disabled={!b.enabled}
                  className="text-xs px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:border-indigo-300 disabled:cursor-not-allowed w-24" />
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input type="checkbox" checked={b.enabled} onChange={e => update(b.id, 'enabled', e.target.checked)} className="sr-only peer" />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-500"></div>
              </label>
              {b.id.startsWith('custom_') && (
                <button onClick={() => remove(b.id)} className="text-gray-300 hover:text-red-400 transition-colors shrink-0"><X className="w-3.5 h-3.5" /></button>
              )}
            </div>
          ))}

          <div className="border-t border-dashed border-gray-200 pt-4 mt-4">
            <p className="text-xs font-semibold text-gray-400 mb-3">添加自定义时间块（运动、通勤等）</p>
            <div className="flex items-center gap-2 flex-wrap">
              <input value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="名称" className="text-xs px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg flex-1 min-w-[80px] focus:outline-none focus:border-indigo-300 placeholder:text-gray-300" />
              <input type="time" value={newStart} onChange={e => setNewStart(e.target.value)} className="text-xs px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg w-24 focus:outline-none focus:border-indigo-300" />
              <span className="text-gray-300 text-xs">—</span>
              <input type="time" value={newEnd} onChange={e => setNewEnd(e.target.value)} className="text-xs px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg w-24 focus:outline-none focus:border-indigo-300" />
              <button onClick={addCustom} disabled={!newLabel.trim() || !newStart || !newEnd}
                className="flex items-center gap-1 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg disabled:opacity-30 hover:bg-gray-800">
                <Plus className="w-3 h-3" />添加
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 flex justify-between items-center">
          <p className="text-xs text-gray-400">{blocks.filter(b => b.enabled).length} 个时间段已启用</p>
          <button onClick={save} className="px-5 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 active:scale-95">保存</button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [actualToday] = useState(new Date().getDay() || 7);
  const [selectedDay, setSelectedDay] = useState(actualToday);

  const [tasks, setTasks] = useState(() => { const s = localStorage.getItem('companion-star-tasks'); return s ? JSON.parse(s) : []; });
  const [taskHistory, setTaskHistory] = useState(() => { const s = localStorage.getItem('companion-star-history'); return s ? JSON.parse(s) : []; });
  const [futureEvents, setFutureEvents] = useState(() => { const s = localStorage.getItem('companion-star-future'); return s ? JSON.parse(s) : []; });

  // Reminders: { id, text, date (YYYY-MM-DD or null=today), type ('memo'|'ddl'|'task'), completed, broken, subtaskCount }
  const [reminders, setReminders] = useState(() => {
    const s = localStorage.getItem('companion-star-reminders');
    return s ? JSON.parse(s) : [];
  });
  const [showReminderForm, setShowReminderForm] = useState(false);

  const [classes] = useState(() => {
    const saved = localStorage.getItem('companion-star-classes');
    if (saved) return JSON.parse(saved);
    return [
      { id: 'mon1', day: 1, title: 'Consumer Psychology (T5-504)', startTime: '09:00', endTime: '09:50' },
      { id: 'mon2', day: 1, title: 'New Media, Culture & Society (T6-402)', startTime: '13:00', endTime: '14:50' },
      { id: 'tue1', day: 2, title: 'Positive Psychology (T5-202)', startTime: '08:00', endTime: '09:50' },
      { id: 'tue2', day: 2, title: 'Educational Psychology (T6-603)', startTime: '10:00', endTime: '10:50' },
      { id: 'tue3', day: 2, title: 'Psychological Assessment (T7-202)', startTime: '11:00', endTime: '11:50' },
      { id: 'tue4', day: 2, title: 'Abnormal Psychology (T4-605)', startTime: '14:00', endTime: '15:50' },
      { id: 'tue5', day: 2, title: 'Advanced Data Analytics (T8-301)', startTime: '16:00', endTime: '17:50' },
      { id: 'wed1', day: 3, title: 'Psychological Assessment (T29-404)', startTime: '10:00', endTime: '11:50' },
      { id: 'thu1', day: 4, title: 'Abnormal Psychology (T5-404)', startTime: '09:00', endTime: '09:50' },
      { id: 'thu2', day: 4, title: 'Positive Psychology (T7-203)', startTime: '13:00', endTime: '13:50' },
      { id: 'thu3', day: 4, title: 'New Media, Culture & Society (T7-407)', startTime: '14:00', endTime: '14:50' },
      { id: 'thu4', day: 4, title: 'Consumer Psychology (T29-602)', startTime: '15:00', endTime: '16:50' },
      { id: 'fri1', day: 5, title: 'Educational Psychology (T7-203)', startTime: '13:00', endTime: '14:50' },
      { id: 'fri2', day: 5, title: 'Advanced Data Analytics (T8-301)', startTime: '15:00', endTime: '15:50' },
    ];
  });

  const [isFixedTask, setIsFixedTask] = useState(false);
  const [fixedStartTime, setFixedStartTime] = useState('');
  const [fixedEndTime, setFixedEndTime] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [taskDuration, setTaskDuration] = useState('AI自动评估');
  const [taskTimePref, setTaskTimePref] = useState('不限时段');
  const [taskPriority, setTaskPriority] = useState('🟡 常规');
  const [taskTargetDay, setTaskTargetDay] = useState(selectedDay);
  const [timeWarning, setTimeWarning] = useState(null);

  const [isAiPlanning, setIsAiPlanning] = useState(false);
  const [systemMessage, setSystemMessage] = useState('');

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([{ role: 'ai', text: '你好！上传图片或 PDF 文件，我会帮你阅读并拆分成可执行任务，还能预估用时哦！', tasks: [] }]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef(null);
  const [attachedFile, setAttachedFile] = useState(null);
  const [attachedFileBase64, setAttachedFileBase64] = useState(null);
  const [notifiedItems, setNotifiedItems] = useState(new Set());

  const [showCalendar, setShowCalendar] = useState(false);
  const [showPomodoro, setShowPomodoro] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [showRoutine, setShowRoutine] = useState(false);
  const [showNutrition, setShowNutrition] = useState(false);
  const [activeTab, setActiveTab] = useState('plan');
  const [nowTime, setNowTime] = useState(() => {
    const n = new Date();
    return String(n.getHours()).padStart(2,'0') + ':' + String(n.getMinutes()).padStart(2,'0');
  });
  useEffect(() => {
    const iv = setInterval(() => {
      const n = new Date();
      setNowTime(String(n.getHours()).padStart(2,'0') + ':' + String(n.getMinutes()).padStart(2,'0'));
    }, 60000);
    return () => clearInterval(iv);
  }, []);

  const [routineBlocks, setRoutineBlocks] = useState(() => {
    const s = localStorage.getItem('companion-star-routine');
    if (s) return JSON.parse(s);
    return [
      { id: 'wake',      label: '起床准备', emoji: '🌅', startTime: '07:00', endTime: '07:30', enabled: true },
      { id: 'breakfast', label: '早餐',     emoji: '🥐', startTime: '07:30', endTime: '08:00', enabled: true },
      { id: 'lunch',     label: '午餐',     emoji: '🍱', startTime: '12:00', endTime: '13:00', enabled: true },
      { id: 'dinner',    label: '晚餐',     emoji: '🍜', startTime: '18:00', endTime: '19:00', enabled: true },
      { id: 'wind',      label: '睡前放松', emoji: '🛁', startTime: '22:30', endTime: '23:00', enabled: true },
      { id: 'sleep',     label: '睡眠',     emoji: '😴', startTime: '23:00', endTime: '07:00', enabled: true },
    ];
  });

  // Drag state for inbox
  const dragItem = useRef(null);
  const dragOverItem = useRef(null);
  const [editingTimeId, setEditingTimeId] = useState(null);
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');

  useEffect(() => { setTaskTargetDay(selectedDay); }, [selectedDay]);
  useEffect(() => { localStorage.setItem('companion-star-tasks', JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => { localStorage.setItem('companion-star-history', JSON.stringify(taskHistory)); }, [taskHistory]);
  useEffect(() => { localStorage.setItem('companion-star-future', JSON.stringify(futureEvents)); }, [futureEvents]);
  useEffect(() => { localStorage.setItem('companion-star-reminders', JSON.stringify(reminders)); }, [reminders]);
  useEffect(() => { localStorage.setItem('companion-star-routine', JSON.stringify(routineBlocks)); }, [routineBlocks]);
  useEffect(() => { if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages, isChatOpen]);

  // Time awareness: update warning when input or duration changes
  useEffect(() => {
    if (!inputValue.trim() || isFixedTask) { setTimeWarning(null); return; }
    const w = getTimeAwareness(inputValue, taskDuration, taskHistory);
    setTimeWarning(w);
  }, [inputValue, taskDuration, taskHistory, isFixedTask]);

  const showMessage = (msg, duration = 4000) => { setSystemMessage(msg); setTimeout(() => setSystemMessage(''), duration); };

  useEffect(() => { if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') Notification.requestPermission(); }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date(); const currentDay = now.getDay() || 7;
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      classes.filter(c => c.day === currentDay).forEach(c => { if (c.startTime === timeStr && !notifiedItems.has(c.id)) { triggerNotification('⏰ 上课提醒', `《${c.title}》现在开始！`); setNotifiedItems(prev => new Set(prev).add(c.id)); } });
      tasks.filter(t => (t.day === currentDay || !t.day) && !t.completed && t.startTime).forEach(t => { if (t.startTime === timeStr && !notifiedItems.has(t.id)) { triggerNotification(t.priority === '🔴 紧急' ? '🚨 紧急任务' : '🚀 任务提醒', `该执行：${t.text}`); setNotifiedItems(prev => new Set(prev).add(t.id)); } });
    }, 10000);
    return () => clearInterval(timer);
  }, [classes, tasks, notifiedItems]);

  const triggerNotification = (title, body) => {
    showMessage(`${title}：${body}`, 8000);
    if ('Notification' in window && Notification.permission === 'granted') new Notification(title, { body });
  };

  // Record actual duration when task is completed
  const toggleComplete = (id) => {
    setTasks(prev => prev.map(task => {
      if (task.id !== id) return task;
      const willComplete = !task.completed;
      if (willComplete && task.startTime && task.endTime) {
        const parseMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
        const actualMinutes = parseMin(task.endTime) - parseMin(task.startTime);
        if (actualMinutes > 0) {
          setTaskHistory(prev => [...prev.slice(-100), { text: task.text, actualMinutes, date: new Date().toISOString() }]);
        }
      }
      return { ...task, completed: willComplete };
    }));
  };

  const deleteTask = (id) => setTasks(tasks.filter(t => t.id !== id));

  const assignTaskDay = (id, day) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, day: day === 0 ? null : parseInt(day) } : t));
  };

  const toggleReminder = (id) => setReminders(prev => prev.map(r => r.id === id ? { ...r, completed: !r.completed } : r));
  const deleteReminder = (id) => setReminders(prev => prev.filter(r => r.id !== id));

  const startEditTime = (task) => {
    setEditingTimeId(task.id);
    setEditStart(task.startTime || '');
    setEditEnd(task.endTime || '');
  };

  const saveEditTime = (id) => {
    if (!editStart || !editEnd) { setEditingTimeId(null); return; }
    if (editStart >= editEnd) { alert('结束时间必须晚于开始时间'); return; }
    setTasks(prev => prev.map(t => t.id === id ? { ...t, startTime: editStart, endTime: editEnd } : t));
    setEditingTimeId(null);
  };

  const clearTaskTime = (id) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, startTime: null, endTime: null } : t));
    setEditingTimeId(null);
  };

  const calculateWorkload = () => {
    const parseTime = (t) => { if (!t) return 0; const [h, m] = t.split(':').map(Number); return h * 60 + m; };
    let total = 0;
    classes.filter(c => c.day === selectedDay).forEach(c => total += parseTime(c.endTime) - parseTime(c.startTime));
    tasks.filter(t => t.day === selectedDay && !t.completed).forEach(t => {
      if (t.startTime && t.endTime) total += parseTime(t.endTime) - parseTime(t.startTime);
      else { if (t.duration === '15分钟') total += 15; else if (t.duration === '30分钟') total += 30; else if (t.duration === '1小时') total += 60; else if (t.duration === '2小时') total += 120; else if (t.duration === '半天') total += 240; else total += 45; }
    });
    const hours = (total / 60).toFixed(1);
    const percentage = Math.min(100, (total / (8 * 60)) * 100);
    let level = '轻松', colorClass = 'bg-emerald-500', barColor = 'from-emerald-400 to-emerald-500', advice = '时间宽裕，适合安排深度思考任务。';
    if (total > 6 * 60) { level = '高压'; colorClass = 'bg-rose-500'; barColor = 'from-rose-400 to-rose-500'; advice = '今日安排密集！做不完请用"顺延"功能。'; }
    else if (total > 3.5 * 60) { level = '充实'; colorClass = 'bg-amber-500'; barColor = 'from-amber-400 to-amber-500'; advice = '工作量适中。优先解决🔴紧急任务。'; }
    return { hours, level, colorClass, advice, percentage, barColor };
  };
  const workload = calculateWorkload();

  const addTask = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    if (isFixedTask) {
      if (!fixedStartTime || !fixedEndTime) return showMessage('请填写完整时间');
      if (fixedStartTime >= fixedEndTime) return showMessage('结束时间必须晚于开始');
    }
    const newTask = { id: Date.now().toString(), text: inputValue.trim(), completed: false, createdAt: new Date().toISOString(), day: parseInt(taskTargetDay), startTime: isFixedTask ? fixedStartTime : null, endTime: isFixedTask ? fixedEndTime : null, duration: isFixedTask ? '已定时间' : taskDuration, preferredTime: isFixedTask ? '手动固定' : taskTimePref, priority: taskPriority, isFixed: isFixedTask };
    setTasks([newTask, ...tasks]); setInputValue(''); setTimeWarning(null);
    if (isFixedTask) { setFixedStartTime(''); setFixedEndTime(''); showMessage('已添加固定任务！'); }
    else { setTaskDuration('AI自动评估'); setTaskTimePref('不限时段'); setTaskPriority('🟡 常规'); showMessage('已加入收集箱！'); }
  };

  const carryOverTask = (task) => {
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: true, text: t.text + ' (今日进度已结)' } : t));
    let nextDay = task.day + 1; if (nextDay > 7) nextDay = 1;
    setTasks(prev => [{ ...task, id: Date.now().toString(), text: task.text.replace(' (今日进度已结)', '') + ' (剩余进度)', day: nextDay, startTime: null, endTime: null, completed: false }, ...prev]);
    showMessage(task.priority === '🔴 紧急' ? '🚨 紧急任务已顺延至明天！' : '✅ 剩余进度已挪至明天。');
  };

  // ── Drag & drop for inbox ──
  const handleDragStart = (e, index) => { dragItem.current = index; e.dataTransfer.effectAllowed = 'move'; };
  const handleDragOver = (e, index) => { e.preventDefault(); dragOverItem.current = index; };
  const handleDrop = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    const unscheduled = tasks.filter(t => (t.day === selectedDay || !t.day) && !t.startTime && !t.completed);
    const rest = tasks.filter(t => !unscheduled.find(u => u.id === t.id));
    const reordered = [...unscheduled];
    const [removed] = reordered.splice(dragItem.current, 1);
    reordered.splice(dragOverItem.current, 0, removed);
    setTasks([...reordered, ...rest]);
    dragItem.current = null; dragOverItem.current = null;
  };

  // ── AI reschedule remaining ──
  const handleAiReschedule = async () => {
    if (!apiKey) return showMessage('⚠️ 请填写 API Key！');
    const now = new Date(); const nowStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const remaining = tasks.filter(t => (t.day === selectedDay || !t.day) && !t.completed && t.startTime && t.startTime > nowStr);
    const unscheduled = tasks.filter(t => (t.day === selectedDay || !t.day) && !t.completed && !t.startTime);
    const all = [...unscheduled, ...remaining];
    if (all.length === 0) return showMessage('没有需要重排的任务');
    setIsAiPlanning(true); showMessage('AI 正在重新规划剩余时间...');
    try {
      const fixedItems = [...classes.filter(c => c.day === selectedDay), ...tasks.filter(t => t.isFixed && t.startTime && !t.completed)];
      const payload = { contents: [{ parts: [{ text: `现在${nowStr}，为今日剩余任务重新排期，区间${nowStr}-22:00。【⚠️ 作息禁止区间（绝对不能排任务进去）】${JSON.stringify(routineBlocks.filter(b=>b.enabled).map(b=>({名称:b.emoji+b.label,开始:b.startTime,结束:b.endTime})))}【固定课程与任务占用】${JSON.stringify(fixedItems.map(i => ({ 名称: i.title || i.text, 开始: i.startTime, 结束: i.endTime })))}【待排任务】${JSON.stringify(all.map(t => ({ id: t.id, 任务: t.text, 耗时: t.duration, 紧急度: t.priority })))}【要求】优先紧急任务，间隔5分钟休息，严格返回JSON：[{"id":"","startTime":"HH:mm","endTime":"HH:mm"}]` }] }], generationConfig: { responseMimeType: 'application/json', responseSchema: { type: 'ARRAY', items: { type: 'OBJECT', properties: { id: { type: 'STRING' }, startTime: { type: 'STRING' }, endTime: { type: 'STRING' } }, required: ['id', 'startTime', 'endTime'] } } } };
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error('失败');
      const result = await res.json();
      const data = JSON.parse(result.candidates?.[0]?.content?.parts?.[0]?.text);
      setTasks(prev => prev.map(task => { const info = data.find(s => s.id === task.id); return info ? { ...task, startTime: info.startTime, endTime: info.endTime } : task; }));
      showMessage('🎉 剩余任务已重新规划！');
    } catch (err) { showMessage(`重排失败: ${err.message}`); } finally { setIsAiPlanning(false); }
  };

  const handleAiSchedule = async () => {
    if (!apiKey) return showMessage('⚠️ 请填写 API Key！');
    const currentDayClasses = classes.filter(c => c.day === selectedDay).sort((a, b) => a.startTime.localeCompare(b.startTime));
    const currentDayTasks = tasks.filter(t => t.day === selectedDay || !t.day);
    const unscheduledTasks = tasks.filter(t => t.day === selectedDay && !t.startTime && !t.completed);
    const preScheduledTasks = currentDayTasks.filter(t => t.startTime && !t.completed);
    if (unscheduledTasks.length === 0) return showMessage('当前没有需要规划的任务（备忘任务需先分配到今天）');
    setIsAiPlanning(true); showMessage('AI 正在评估优先级并排期...');
    try {
      const payload = { contents: [{ parts: [{ text: `为灵活任务排期，当前09:00，区间09:00-22:00。【⚠️ 作息禁止区间（绝对不能排任务进去）】${JSON.stringify(routineBlocks.filter(b=>b.enabled).map(b=>({名称:b.emoji+b.label,开始:b.startTime,结束:b.endTime})))}【避让课程与已排任务】${JSON.stringify([...currentDayClasses, ...preScheduledTasks].map(i => ({ 名称: i.title || i.text, 开始: i.startTime, 结束: i.endTime })))}【待排】${JSON.stringify(unscheduledTasks.map(t => ({ id: t.id, 任务: t.text, 耗时: t.duration, 偏好: t.preferredTime, 紧急度: t.priority })))}【要求】1.避开固定时间，间隔5分钟 2.优先🔴紧急 3.时间不够丢弃🟢可延后 4.严格返回JSON：[{"id":"","startTime":"HH:mm","endTime":"HH:mm"}]` }] }], generationConfig: { responseMimeType: 'application/json', responseSchema: { type: 'ARRAY', items: { type: 'OBJECT', properties: { id: { type: 'STRING' }, startTime: { type: 'STRING' }, endTime: { type: 'STRING' } }, required: ['id', 'startTime', 'endTime'] } } } };
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error('失败');
      const result = await res.json();
      const scheduledData = JSON.parse(result.candidates?.[0]?.content?.parts?.[0]?.text);
      setTasks(prev => prev.map(task => { const info = scheduledData.find(s => s.id === task.id); return info ? { ...task, startTime: info.startTime, endTime: info.endTime } : task; }));
      showMessage('🎉 智能排期完成！');
    } catch (err) { showMessage(`排期失败: ${err.message}`); } finally { setIsAiPlanning(false); }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0]; if (!file) return;
    if (file.size > 5 * 1024 * 1024) return showMessage('文件不能超过 5MB');
    setAttachedFile({ name: file.name, type: file.type });
    const reader = new FileReader();
    reader.onloadend = () => setAttachedFileBase64(reader.result.split(',')[1]);
    reader.readAsDataURL(file);
  };

  // ── Chat submit with editable task cards ──
  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() && !attachedFile) return;
    if (!apiKey) { showMessage('请先配置 API Key'); return; }
    const userMsg = chatInput.trim() || '请帮我阅读并分析这个文件，拆分成任务清单。';
    setChatInput('');
    const displayMsg = attachedFile ? `[📁 ${attachedFile.name}]\n${userMsg}` : userMsg;
    setChatMessages(prev => [...prev, { role: 'user', text: displayMsg, tasks: [] }]);
    setIsChatLoading(true);
    try {
      const historyText = chatMessages.map(m => `${m.role === 'user' ? '用户' : '你'}: ${m.text}`).join('\n');
      const payloadParts = [{ text: `你是伴星日程AI助理。周${selectedDay}，当前工作量${workload.hours}h（${workload.level}）。
【历史】：${historyText}
【指令】：${userMsg}
${attachedFile ? '【⚠️注意：用户附带了文件，请仔细阅读，评估难度，合理拆解。】' : ''}
【核心规则】：
1. 自然回答用户问题，说明文字用普通段落，禁止使用 markdown 标题、加粗、列表符号。
2. 每一个具体可执行的任务步骤，必须单独占一行，严格按照以下格式，行首禁止加任何符号（禁止加 *、-、数字序号、空格）：
[TASK] 任务名称 | 预估时长 | 偏好时段
3. 预估时长仅限以下选项之一：15分钟、30分钟、1小时、2小时、半天、AI自动评估。根据任务复杂度合理选择。
4. 偏好时段仅限以下选项之一：早上 (09:00-12:00)、下午 (13:00-18:00)、晚上 (19:00-22:00)、不限时段。
5. 如果用户上传了文件，先用1-2句话简要说明文件内容，再输出任务列表。` }];
      if (attachedFile && attachedFileBase64) payloadParts.push({ inlineData: { mimeType: attachedFile.type, data: attachedFileBase64 } });
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ role: 'user', parts: payloadParts }] }) });
      if (!res.ok) throw new Error('失败');
      const result = await res.json();
      const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text || '抱歉，解析遇到问题。';

      // Parse [TASK] lines — tolerant of leading *, -, numbers, spaces
      const parsedTasks = [];
      const cleanLines = rawText.split('\n').map(line => {
        // Strip leading markdown bullets / numbering before [TASK]
        const stripped = line.replace(/^[\s*\-•]+/, '').replace(/^\d+\.\s*/, '').trim();
        if (stripped.startsWith('[TASK]')) {
          const parts = stripped.replace('[TASK]', '').split('|').map(s => s.trim());
          const task = { id: Date.now().toString() + Math.random().toString(36).substr(2, 5), name: parts[0] || '未命名任务', duration: parts[1] || '1小时', timePref: parts[2] || '不限时段' };
          parsedTasks.push(task);
          return null;
        }
        return line;
      }).filter(l => l !== null);

      setChatMessages(prev => [...prev, { role: 'ai', text: cleanLines.join('\n'), tasks: parsedTasks }]);
    } catch { setChatMessages(prev => [...prev, { role: 'ai', text: '❌ 连接失败，请稍后重试。', tasks: [] }]); }
    finally { setIsChatLoading(false); setAttachedFile(null); setAttachedFileBase64(null); }
  };

  const addSuggestedTask = (taskName, duration, timePref) => {
    const newTask = { id: Date.now().toString() + Math.random().toString(36).substr(2, 5), text: taskName, completed: false, createdAt: new Date().toISOString(), day: parseInt(selectedDay), startTime: null, endTime: null, duration, preferredTime: timePref, priority: '🟡 常规', isFixed: false };
    setTasks(prev => [newTask, ...prev]); showMessage(`✅ 已将"${taskName}"加入收集箱！`);
  };

  const addAllSuggestedTasks = (taskList) => {
    const newTasks = taskList.map(t => ({ id: Date.now().toString() + Math.random().toString(36).substr(2, 5), text: t.name, completed: false, createdAt: new Date().toISOString(), day: parseInt(selectedDay), startTime: null, endTime: null, duration: t.duration, preferredTime: t.timePref, priority: '🟡 常规', isFixed: false }));
    setTasks(prev => [...newTasks, ...prev]); showMessage(`✅ 已将 ${newTasks.length} 个任务全部加入收集箱！`);
  };

  const currentDayTasks = tasks.filter(t => t.day === selectedDay || !t.day);
  const scheduledTasks = currentDayTasks.filter(t => t.startTime && !t.completed);
  const completedTasks = currentDayTasks.filter(t => t.completed);
  const memoTasks = tasks.filter(t => !t.day && !t.completed && !t.startTime);
  const assignedInboxTasks = tasks.filter(t => t.day && !t.startTime && !t.completed);
  const unscheduledTasks = [...assignedInboxTasks, ...memoTasks];
  const todaySchedulable = tasks.filter(t => t.day === selectedDay && !t.startTime && !t.completed);
  const currentDayClasses = classes.filter(c => c.day === selectedDay).sort((a, b) => a.startTime.localeCompare(b.startTime));
  const dayNames = ['周一','周二','周三','周四','周五','周六','周日'];
  const enabledRoutineBlocks = routineBlocks.filter(b => b.enabled && b.startTime < b.endTime);
  const timelineItems = [...scheduledTasks.map(t => ({ ...t, type: 'task' })), ...currentDayClasses.map(c => ({ ...c, type: 'class' })), ...enabledRoutineBlocks.map(b => ({ ...b, type: 'routine', title: b.emoji + ' ' + b.label }))].sort((a, b) => a.startTime.localeCompare(b.startTime));
  const todayStr = new Date().toISOString().split('T')[0];
  const urgentDDLCount = futureEvents.filter(e => { if (!e.isDDL) return false; const days = Math.ceil((new Date(e.date + 'T12:00:00') - new Date()) / 86400000); return days >= 0 && days <= 7; }).length;

  // Insert current time marker into timeline
  const timelineWithNow = (() => {
    // Recalculate today's day number each render so it stays accurate
    const realToday = new Date().getDay() || 7;
    if (selectedDay !== realToday) return timelineItems;
    const items = [...timelineItems];
    const insertIdx = items.findIndex(item => item.startTime > nowTime);
    const marker = { id: '__now__', type: 'now', startTime: nowTime };
    if (insertIdx === -1) items.push(marker);
    else items.splice(insertIdx, 0, marker);
    return items;
  })();

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans selection:bg-indigo-100 relative">
      {systemMessage && <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-full shadow-lg z-50 text-sm font-medium max-w-sm text-center">{systemMessage}</div>}
      {showCalendar && <FutureCalendar futureEvents={futureEvents} setFutureEvents={setFutureEvents} setTasks={setTasks} apiKey={apiKey} showMessage={showMessage} onClose={() => setShowCalendar(false)} />}
      {showReview && <DailyReview tasks={tasks} classes={classes} selectedDay={selectedDay} onClose={() => setShowReview(false)} />}
      {showRoutine && <RoutineSettings routineBlocks={routineBlocks} setRoutineBlocks={setRoutineBlocks} onClose={() => setShowRoutine(false)} />}
      {showReminderForm && <ReminderForm dayNames={dayNames} onAdd={(r) => setReminders(prev => [r, ...prev])} onClose={() => setShowReminderForm(false)} />}
      {showNutrition && <NutritionPanel apiKey={apiKey} showMessage={showMessage} onClose={() => setShowNutrition(false)} />}

      <div className="max-w-5xl mx-auto p-5 pt-7">

        {/* ── Header ── */}
        <header className="mb-5 flex justify-between items-center flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-500" />
            <h1 className="text-xl font-bold tracking-tight text-gray-900">神的日常</h1>
            <span className="text-xs bg-white border border-gray-200 px-2 py-0.5 rounded-lg text-gray-500 ml-1">{dayNames[selectedDay - 1]} · {currentDayClasses.length} 节课</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => { if ('Notification' in window) Notification.requestPermission().then(p => { if (p === 'granted') { showMessage('✅ 通知已开启'); new Notification('伴星日程 Pro', { body: '测试成功！' }); } }); }} className="flex items-center gap-1.5 text-xs text-gray-500 bg-white border border-gray-200 px-2.5 py-1.5 rounded-xl hover:bg-gray-50"><BellRing className="w-3 h-3" /></button>
            <button onClick={() => setShowCalendar(true)} className="relative flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-xl border bg-white border-gray-200 text-gray-500 hover:bg-gray-50 font-medium"><CalendarIcon className="w-3.5 h-3.5" /> 未来日历{urgentDDLCount > 0 && <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{urgentDDLCount}</span>}</button>
            <button onClick={() => setShowReview(true)} className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-xl border bg-white border-gray-200 text-gray-500 hover:bg-gray-50 font-medium"><BarChart2 className="w-3.5 h-3.5" /> 今日回顾</button>
            <button onClick={() => setShowNutrition(true)} className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-xl border bg-white border-gray-200 text-gray-500 hover:bg-gray-50 font-medium">🥗 饮食</button>
            <button onClick={() => setShowRoutine(true)} className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-xl border bg-white border-gray-200 text-gray-500 hover:bg-gray-50 font-medium">🛌 作息</button>
            <button onClick={handleAiSchedule} disabled={isAiPlanning || todaySchedulable.length === 0}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm ${isAiPlanning ? 'bg-indigo-100 text-indigo-400' : unscheduledTasks.length === 0 ? 'bg-gray-100 text-gray-400' : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95'}`}>
              {isAiPlanning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bot className="w-3.5 h-3.5" />}
              {isAiPlanning ? '排期中...' : 'AI 智能排期'}
            </button>
          </div>
        </header>

        {/* ── Tabs ── */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl w-fit mb-5">
          <button onClick={() => setActiveTab('plan')}
            className={`flex items-center gap-2 px-5 py-2 text-sm font-medium rounded-xl transition-all ${activeTab === 'plan' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            <Inbox className="w-3.5 h-3.5" /> 规划
            {todaySchedulable.length > 0 && <span className="bg-indigo-100 text-indigo-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{todaySchedulable.length}</span>}
          </button>
          <button onClick={() => setActiveTab('timeline')}
            className={`flex items-center gap-2 px-5 py-2 text-sm font-medium rounded-xl transition-all ${activeTab === 'timeline' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            <Clock className="w-3.5 h-3.5" /> 今日时间轴
          </button>
        </div>

        {/* ══════════════════════════ TAB: 规划 ══════════════════════════ */}
        {activeTab === 'plan' && (
          <div className="space-y-5">

            {/* Workload bar */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <div className="flex justify-between items-center mb-2.5">
                <div className="flex items-center gap-2 text-gray-700"><Activity className="w-4 h-4" /><span className="text-sm font-semibold">今日工作量</span></div>
                <span className={`px-2.5 py-1 text-xs font-bold rounded-lg text-white ${workload.colorClass}`}>{workload.level}</span>
              </div>
              <div className="relative h-1.5 bg-gray-100 rounded-full overflow-hidden mb-2"><div className={`absolute inset-y-0 left-0 bg-gradient-to-r ${workload.barColor} rounded-full transition-all duration-700`} style={{ width: `${workload.percentage}%` }} /></div>
              <p className="text-xs text-gray-500"><strong className="text-gray-700">{workload.hours} 小时</strong> · {workload.advice}</p>
            </div>

            {/* Two-column: Add form + Inbox */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

              {/* Add task form */}
              <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-200">
                <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2"><Plus className="w-4 h-4 text-indigo-400" />添加新任务</h2>
                <form onSubmit={addTask}>
                  <div className="flex bg-gray-100 p-1 rounded-xl w-fit mb-3">
                    <button type="button" onClick={() => setIsFixedTask(false)} className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${!isFixedTask ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500'}`}><Sparkles className="w-3 h-3 inline mr-1" />待规划</button>
                    <button type="button" onClick={() => setIsFixedTask(true)} className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${isFixedTask ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500'}`}><Clock className="w-3 h-3 inline mr-1" />定时间</button>
                  </div>
                  <div className="relative mb-3">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">{isFixedTask ? <Lock className="h-3.5 w-3.5 text-indigo-400" /> : <Plus className="h-3.5 w-3.5 text-indigo-400" />}</div>
                    <input type="text" className="block w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-transparent rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 placeholder:text-gray-400 transition-all" placeholder={isFixedTask ? '例如：14:00 小组讨论' : '接下来有什么新任务？'} value={inputValue} onChange={e => setInputValue(e.target.value)} />
                  </div>
                  {timeWarning && (
                    <div className="mb-3 bg-amber-50 border-l-3 border-amber-400 rounded-r-xl p-3">
                      <div className="flex items-center gap-1.5 mb-1"><Clock className="w-3 h-3 text-amber-600" /><span className="text-xs font-semibold text-amber-800">时间感知</span></div>
                      <p className="text-xs text-amber-700 mb-2">历史 {timeWarning.count} 次类似任务实际花了 <strong>{timeWarning.avgActual} 分钟</strong>（预估的 {timeWarning.ratio}x）</p>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => setTimeWarning(null)} className="text-xs px-2 py-1 border border-amber-200 rounded-lg text-amber-700 bg-white">保持</button>
                        <button type="button" onClick={() => { setTaskDuration(timeWarning.suggested); setTimeWarning(null); }} className="text-xs px-2 py-1 bg-amber-500 text-white rounded-lg">→ {timeWarning.suggested}</button>
                      </div>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2 mb-3">
                    <div className="flex items-center bg-gray-50 border border-gray-100 rounded-lg px-2 py-1.5 gap-1.5"><CalendarIcon className="w-3 h-3 text-gray-400" /><select value={taskTargetDay} onChange={e => setTaskTargetDay(e.target.value)} className="bg-transparent text-xs text-gray-600 focus:outline-none cursor-pointer">{dayNames.map((name, idx) => <option key={idx} value={idx + 1}>{name}</option>)}</select></div>
                    <div className="flex items-center bg-gray-50 border border-gray-100 rounded-lg px-2 py-1.5 gap-1.5"><AlertCircle className={`w-3 h-3 ${taskPriority === '🔴 紧急' ? 'text-red-400' : taskPriority === '🟢 可延后' ? 'text-green-400' : 'text-amber-400'}`} /><select value={taskPriority} onChange={e => setTaskPriority(e.target.value)} className="bg-transparent text-xs text-gray-600 focus:outline-none cursor-pointer"><option value="🔴 紧急">🔴 紧急</option><option value="🟡 常规">🟡 常规</option><option value="🟢 可延后">🟢 可延后</option></select></div>
                    {!isFixedTask ? (<>
                      <div className="flex items-center bg-gray-50 border border-gray-100 rounded-lg px-2 py-1.5 gap-1.5"><Hourglass className="w-3 h-3 text-gray-400" /><select value={taskDuration} onChange={e => setTaskDuration(e.target.value)} className="bg-transparent text-xs text-gray-600 focus:outline-none cursor-pointer"><option value="AI自动评估">AI 评估</option><option value="15分钟">15分钟</option><option value="30分钟">30分钟</option><option value="1小时">1小时</option><option value="2小时">2小时</option><option value="半天">半天</option></select></div>
                      <div className="flex items-center bg-gray-50 border border-gray-100 rounded-lg px-2 py-1.5 gap-1.5"><SunMoon className="w-3 h-3 text-gray-400" /><select value={taskTimePref} onChange={e => setTaskTimePref(e.target.value)} className="bg-transparent text-xs text-gray-600 focus:outline-none cursor-pointer"><option value="不限时段">不限</option><option value="早上 (09:00-12:00)">早晨</option><option value="下午 (13:00-18:00)">下午</option><option value="晚上 (19:00-22:00)">晚上</option></select></div>
                    </>) : (<div className="flex items-center gap-2"><input type="time" className="text-xs px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-indigo-700" value={fixedStartTime} onChange={e => setFixedStartTime(e.target.value)} /><span className="text-gray-300 text-xs">—</span><input type="time" className="text-xs px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-indigo-700" value={fixedEndTime} onChange={e => setFixedEndTime(e.target.value)} /></div>)}
                  </div>
                  <button type="submit" className="w-full py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 active:scale-95">{isFixedTask ? '锁定时间轴' : '放入收集箱'}</button>
                </form>
              </div>

              {/* Inbox */}
              <div className="flex flex-col gap-4">
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-gray-600"><Inbox className="w-4 h-4" /><h2 className="text-sm font-semibold">待办收集箱</h2></div>
                    <div className="flex items-center gap-2">
                      {memoTasks.length > 0 && <span className="text-[10px] bg-amber-100 text-amber-600 font-bold px-1.5 py-0.5 rounded-full">📌 备忘 {memoTasks.length}</span>}
                      {assignedInboxTasks.length > 0 && <span className="text-[10px] bg-indigo-100 text-indigo-600 font-bold px-1.5 py-0.5 rounded-full">待排 {assignedInboxTasks.length}</span>}
                    </div>
                  </div>
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {unscheduledTasks.length === 0 && <div className="text-center py-8 text-xs text-gray-300">收集箱是空的～</div>}
                    {unscheduledTasks.map((task, index) => {
                      const isMemo = !task.day;
                      return (
                        <div key={task.id} draggable onDragStart={e => handleDragStart(e, index)} onDragOver={e => handleDragOver(e, index)} onDrop={handleDrop}
                          className={`group flex flex-col p-3 border rounded-xl transition-all cursor-grab active:cursor-grabbing active:scale-[0.98] ${isMemo ? 'bg-amber-50/50 border-amber-100 hover:border-amber-300' : task.day === selectedDay ? 'bg-indigo-50/40 border-indigo-100 hover:border-indigo-300' : 'bg-gray-50 border-gray-100 hover:border-indigo-200'}`}>
                          <div className="flex items-center gap-2 mb-1.5">
                            <GripVertical className="w-3 h-3 text-gray-200 group-hover:text-gray-400 shrink-0" />
                            <button onClick={() => toggleComplete(task.id)} className="shrink-0"><Circle className="w-3.5 h-3.5 text-gray-300 hover:text-indigo-400" /></button>
                            <span className="flex-grow text-gray-700 text-xs leading-snug">{task.text}</span>
                            <button onClick={() => deleteTask(task.id)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 shrink-0"><Trash2 className="w-3 h-3" /></button>
                          </div>
                          <div className="flex gap-1.5 pl-8 flex-wrap items-center">
                            <select
                              value={task.day || 0}
                              onChange={e => assignTaskDay(task.id, e.target.value)}
                              className={`text-[10px] px-1.5 py-0.5 rounded-md border focus:outline-none cursor-pointer font-medium ${isMemo ? 'bg-amber-100 border-amber-200 text-amber-700' : 'bg-indigo-50 border-indigo-100 text-indigo-600'}`}>
                              <option value={0}>📌 备忘</option>
                              {['周一','周二','周三','周四','周五','周六','周日'].map((d, i) => (
                                <option key={i} value={i+1}>{d}</option>
                              ))}
                            </select>
                            <span className="text-[10px] bg-white border border-gray-100 px-1.5 py-0.5 rounded-md text-gray-400">{task.priority}</span>
                            {task.duration !== 'AI自动评估' && <span className="text-[10px] bg-white border border-gray-100 px-1.5 py-0.5 rounded-md text-gray-400">{task.duration}</span>}
                            {task.preferredTime !== '不限时段' && <span className="text-[10px] bg-white border border-gray-100 px-1.5 py-0.5 rounded-md text-gray-400">{task.preferredTime}</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {completedTasks.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                    <div className="flex items-center gap-2 mb-2 text-gray-400"><CheckCircle2 className="w-3.5 h-3.5" /><h2 className="text-xs font-semibold">今日已完成 ({completedTasks.length})</h2></div>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                      {completedTasks.map(task => (
                        <div key={task.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg opacity-55">
                          <button onClick={() => toggleComplete(task.id)}><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /></button>
                          <span className="flex-grow text-gray-400 text-xs line-through truncate">{task.text}</span>
                          <button onClick={() => deleteTask(task.id)}><Trash2 className="w-3 h-3 text-gray-300 hover:text-red-400" /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Reminder block */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-base">📌</span>
                  <div>
                    <h2 className="text-sm font-semibold text-gray-800">待办提醒</h2>
                    <p className="text-[11px] text-gray-400">跨日事项一眼看到，不再遗忘</p>
                  </div>
                </div>
                <button onClick={() => setShowReminderForm(true)}
                  className="flex items-center gap-1 text-xs px-3 py-1.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium">
                  <Plus className="w-3 h-3"/> 添加提醒
                </button>
              </div>
              <ReminderBlock
                reminders={reminders}
                setReminders={setReminders}
                setTasks={setTasks}
                apiKey={apiKey}
                showMessage={showMessage}
                dayNames={dayNames}
                selectedDay={selectedDay}
              />
            </div>
          </div>
        )}

        {/* ══════════════════════════ TAB: 时间轴 ══════════════════════════ */}
        {activeTab === 'timeline' && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5">

            {/* Timeline panel */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-gray-700">
                  <Clock className="w-4 h-4" />
                  <h2 className="text-base font-semibold">{dayNames[selectedDay - 1]} 时间轴</h2>
                  {scheduledTasks.length > 0 && (
                    <button onClick={handleAiReschedule} disabled={isAiPlanning} className="flex items-center gap-1 text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg hover:bg-indigo-100 ml-1">
                      <RefreshCw className="w-3 h-3" />重排剩余
                    </button>
                  )}
                </div>
                <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
                  {[1,2,3,4,5,6,7].map(d => (
                    <button key={d} onClick={() => setSelectedDay(d)}
                      className={`px-2 py-1 text-xs font-medium rounded-lg transition-all ${selectedDay === d ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>
                      {['一','二','三','四','五','六','日'][d - 1]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scrollable timeline */}
              <div className="overflow-y-auto max-h-[560px] pr-1 scrollbar-thin">
                {timelineWithNow.length === 0 ? (
                  <div className="text-center py-20 text-gray-300"><Clock className="w-10 h-10 mb-3 opacity-30 mx-auto" /><p className="text-sm">今日暂无安排</p></div>
                ) : (
                  <div className="relative">
                    {/* Vertical line */}
                    <div className="absolute left-[1.15rem] top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-gray-100 to-transparent" />

                    {timelineWithNow.map(item => {
                      // Current time indicator
                      if (item.type === 'now') return (
                        <div key="__now__" className="relative flex items-center gap-3 py-1 z-10">
                          <div className="w-[9px] h-[9px] rounded-full bg-red-500 border-2 border-white shadow-sm shrink-0 z-10 ring-2 ring-red-200" style={{marginLeft:'0.8rem'}} />
                          <div className="flex-grow h-px bg-red-400" style={{opacity:0.7}} />
                          <span className="text-[10px] font-bold text-red-500 shrink-0 tabular-nums bg-white px-1 rounded">{nowTime}</span>
                        </div>
                      );

                      return (
                        <div key={item.id} className="relative flex items-start gap-3 py-2.5 group">
                          {/* Dot */}
                          <div className={`w-[9px] h-[9px] rounded-full border-2 border-white shadow-sm shrink-0 z-10 mt-1.5 ${
                            item.type === 'routine' ? 'bg-gray-300' :
                            item.type === 'class' ? 'bg-orange-400' :
                            item.priority === '🔴 紧急' ? 'bg-red-400' : 'bg-indigo-400'
                          }`} style={{marginLeft:'0.8rem'}} />

                          {/* Card */}
                          {item.type === 'routine' ? (
                            <div className="flex-grow flex items-center justify-between py-2 px-3 rounded-xl border border-dashed border-gray-200 bg-gray-50/60 opacity-50">
                              <span className="text-xs text-gray-400 font-medium">{item.title}</span>
                              <span className="text-[11px] text-gray-400">{item.startTime} — {item.endTime}</span>
                            </div>
                          ) : item.type === 'class' ? (
                            <div className="flex-grow bg-orange-50 px-3 py-2.5 rounded-xl border border-orange-100">
                              <div className="flex items-center gap-1.5 mb-0.5"><BookOpen className="w-3 h-3 text-orange-400 shrink-0" /><h3 className="text-gray-700 font-medium text-xs">{item.title}</h3></div>
                              <span className="text-[11px] font-semibold text-orange-500">{item.startTime} — {item.endTime}</span>
                            </div>
                          ) : (
                            <div className={`flex-grow px-3 py-2.5 rounded-xl border transition-colors ${
                              item.isFixed ? 'bg-indigo-50/60 border-indigo-100' :
                              item.priority === '🔴 紧急' ? 'bg-red-50/40 border-red-100' :
                              'bg-gray-50 border-gray-100'
                            }`}>
                              <div className="flex items-start gap-2">
                                <button onClick={() => toggleComplete(item.id)} className="shrink-0 mt-0.5">
                                  <Circle className="w-3.5 h-3.5 text-gray-300 hover:text-indigo-400" />
                                </button>
                                <div className="flex-grow min-w-0">
                                  <h3 className={`font-medium text-xs mb-1 ${item.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>{item.text}</h3>

                                  {editingTimeId === item.id ? (
                                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                      <input type="time" value={editStart} onChange={e => setEditStart(e.target.value)} className="text-xs px-2 py-1 bg-white border border-indigo-300 rounded-lg text-indigo-700 focus:outline-none" />
                                      <span className="text-gray-300 text-xs">—</span>
                                      <input type="time" value={editEnd} onChange={e => setEditEnd(e.target.value)} className="text-xs px-2 py-1 bg-white border border-indigo-300 rounded-lg text-indigo-700 focus:outline-none" />
                                      <button onClick={() => saveEditTime(item.id)} className="text-xs px-2 py-1 bg-indigo-600 text-white rounded-lg font-medium">确认</button>
                                      <button onClick={() => clearTaskTime(item.id)} className="text-xs px-2 py-1 bg-gray-100 text-gray-500 rounded-lg">移回收集箱</button>
                                      <button onClick={() => setEditingTimeId(null)} className="text-xs text-gray-400 hover:text-gray-600 px-1">取消</button>
                                    </div>
                                  ) : (
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      <button onClick={() => !item.completed && startEditTime(item)} title="点击修改时间"
                                        className={`text-[11px] font-bold px-1.5 py-0.5 rounded-md transition-colors ${item.completed ? 'cursor-default' : 'hover:bg-indigo-100 cursor-pointer'} ${item.priority === '🔴 紧急' ? 'text-red-500' : 'text-indigo-600'}`}>
                                        {item.startTime} — {item.endTime}{!item.completed && <span className="ml-1 opacity-40 text-[9px]">✎</span>}
                                      </button>
                                      <span className="text-[10px] bg-white px-1.5 py-0.5 rounded border border-gray-100 text-gray-400">{item.priority}</span>
                                      {item.isFixed && <span className="text-[10px] flex items-center gap-0.5 px-1.5 bg-indigo-100 rounded text-indigo-600 font-bold"><Lock className="w-2 h-2" />固定</span>}
                                      {item.fromDDL && <span className="text-[10px] flex items-center gap-0.5 px-1.5 bg-violet-100 rounded text-violet-600 font-bold"><Flag className="w-2 h-2" />DDL</span>}
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                  {!item.completed && !editingTimeId && <button onClick={() => carryOverTask(item)} title="顺延至明日" className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"><ArrowRightCircle className="w-3.5 h-3.5" /></button>}
                                  <button onClick={() => deleteTask(item.id)} className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right column: Pomodoro + Overview Table */}
            <div className="flex flex-col gap-4">
              <PomodoroInline
                tasks={tasks.filter(t => !t.completed)}
                onRecordTime={(taskId, taskText, minutes) => {
                  setTaskHistory(prev => [...prev.slice(-200), { text: taskText, actualMinutes: minutes, date: new Date().toISOString(), source: 'pomodoro' }]);
                }}
              />
              <DayOverviewTable
                scheduledTasks={scheduledTasks}
                completedTasks={completedTasks}
                reminders={reminders}
                toggleComplete={toggleComplete}
                deleteTask={deleteTask}
                toggleReminder={toggleReminder}
                deleteReminder={deleteReminder}
                selectedDay={selectedDay}
              />
            </div>
          </div>
        )}

      </div>

      {/* Chat window */}
      {isChatOpen && (
        <div className="fixed bottom-20 right-6 w-80 md:w-[28rem] h-[40rem] bg-white rounded-2xl shadow-2xl flex flex-col border border-gray-100 z-50 overflow-hidden">
          <div className="bg-indigo-600 p-4 text-white flex justify-between items-center">
            <div className="flex items-center gap-2"><Bot className="w-4 h-4 text-indigo-200" /><span className="font-semibold text-sm">AI 日程顾问</span></div>
            <button onClick={() => setIsChatOpen(false)} className="text-indigo-200 hover:text-white"><X className="w-4 h-4" /></button>
          </div>
          <div className="flex-grow p-4 overflow-y-auto space-y-3 bg-gray-50/40">
            {chatMessages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[95%] ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-2xl rounded-tr-sm p-3' : 'w-full'}`}>
                  {msg.role === 'user' ? (
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                  ) : (
                    <div className="space-y-2">
                      {msg.text && <div className="bg-white text-gray-800 border border-gray-100 shadow-sm rounded-2xl rounded-tl-sm p-3">{msg.text.split('\n').map((line, i) => <span key={i} className="block text-sm leading-relaxed mb-0.5">{line}</span>)}</div>}
                      {msg.tasks && msg.tasks.length > 0 && <TaskCardGroup tasks={msg.tasks} onAddOne={addSuggestedTask} onAddAll={addAllSuggestedTasks} taskHistory={taskHistory} />}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isChatLoading && <div className="flex justify-start"><div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-2"><Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin" /><span className="text-xs text-gray-400">正在阅读与思考...</span></div></div>}
            <div ref={chatEndRef} />
          </div>
          <form onSubmit={handleChatSubmit} className="p-3 bg-white border-t border-gray-100 flex flex-col gap-2">
            {attachedFile && <div className="flex items-center gap-2 bg-indigo-50 text-indigo-600 text-xs px-3 py-1.5 rounded-lg w-fit border border-indigo-100"><FileText className="w-3 h-3 shrink-0" /><span className="truncate max-w-[180px] font-medium">{attachedFile.name}</span><button type="button" onClick={() => { setAttachedFile(null); setAttachedFileBase64(null); }}><X className="w-3 h-3 hover:text-red-500" /></button></div>}
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-1 pr-2 border border-gray-200 focus-within:border-indigo-300 transition-colors">
              <input type="file" id="ai-file-upload" className="hidden" accept="image/*,application/pdf" onChange={handleFileChange} />
              <button type="button" onClick={() => document.getElementById('ai-file-upload').click()} className="p-2 text-gray-400 hover:text-indigo-500 rounded-lg hover:bg-white"><Paperclip className="w-4 h-4" /></button>
              <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="上传文件或直接提问..." className="flex-grow bg-transparent text-sm p-1.5 outline-none" />
              <button type="submit" disabled={isChatLoading || (!chatInput.trim() && !attachedFile)} className={`p-1.5 rounded-lg transition-colors ${(chatInput.trim() || attachedFile) ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-400'}`}><Send className="w-4 h-4" /></button>
            </div>
          </form>
        </div>
      )}

      {/* Chat FAB only */}
      <button onClick={() => setIsChatOpen(!isChatOpen)} className={`fixed bottom-6 right-6 p-4 rounded-full shadow-xl transition-all hover:scale-105 active:scale-95 z-40 ${isChatOpen ? 'bg-gray-800 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>{isChatOpen ? <X className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}</button>
    </div>
  );
}

// ─────────────────────────────────────────────
// 📌 快速添加提醒弹窗
// ─────────────────────────────────────────────
function ReminderForm({ onAdd, onClose, dayNames }) {
  const [text, setText] = React.useState('');
  const [dateMode, setDateMode] = React.useState('today'); // 'today' | 'weekday' | 'custom'
  const [weekday, setWeekday] = React.useState(1);
  const [customDate, setCustomDate] = React.useState('');
  const [type, setType] = React.useState('memo');

  const getDate = () => {
    if (dateMode === 'today') return null;
    if (dateMode === 'weekday') {
      // Find next occurrence of that weekday
      const today = new Date();
      const todayDow = today.getDay() || 7; // 1-7
      let diff = parseInt(weekday) - todayDow;
      if (diff <= 0) diff += 7;
      const d = new Date(today); d.setDate(today.getDate() + diff);
      return d.toISOString().split('T')[0];
    }
    return customDate;
  };

  const submit = () => {
    if (!text.trim()) return;
    const date = getDate();
    onAdd({ id: Date.now().toString(), text: text.trim(), date, type, completed: false, broken: false, subtaskCount: 0 });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 text-sm">📌 新建提醒</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
        </div>
        <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder="要提醒什么？如：周四交 Consumer 论文提纲"
          autoFocus
          className="w-full text-sm px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl mb-3 focus:outline-none focus:border-indigo-300 placeholder:text-gray-300" />
        <div className="flex gap-2 mb-3 flex-wrap">
          {/* Date mode */}
          <div className="flex bg-gray-100 p-0.5 rounded-lg text-xs">
            {[['today','今天'],['weekday','本周'],['custom','日期']].map(([v,l]) => (
              <button key={v} onClick={() => setDateMode(v)}
                className={`px-2.5 py-1.5 rounded-md font-medium transition-all ${dateMode===v?'bg-white shadow-sm text-gray-800':'text-gray-500'}`}>{l}</button>
            ))}
          </div>
          {dateMode === 'weekday' && (
            <select value={weekday} onChange={e => setWeekday(e.target.value)}
              className="text-xs px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-300 text-gray-700">
              {dayNames.map((d,i) => <option key={i} value={i+1}>{d}</option>)}
            </select>
          )}
          {dateMode === 'custom' && (
            <input type="date" value={customDate} onChange={e => setCustomDate(e.target.value)}
              className="text-xs px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-300 text-gray-700" />
          )}
        </div>
        <div className="flex gap-2 mb-4">
          {[['memo','📌 普通提醒'],['ddl','🔴 DDL 截止'],['task','🛒 生活事务']].map(([v,l]) => (
            <button key={v} onClick={() => setType(v)}
              className={`flex-1 text-[11px] py-1.5 rounded-lg border font-medium transition-all ${type===v?'bg-indigo-600 text-white border-indigo-600':'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}>{l}</button>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 text-sm border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50">取消</button>
          <button onClick={submit} disabled={!text.trim()} className="flex-[2] py-2 text-sm bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-30">确认添加</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// 📋 规划Tab — 提醒区块
// ─────────────────────────────────────────────
function ReminderBlock({ reminders, setReminders, setTasks, apiKey, showMessage, dayNames, selectedDay }) {
  const todayStr = new Date().toISOString().split('T')[0];

  const getDaysUntil = (dateStr) => {
    if (!dateStr) return 0;
    return Math.ceil((new Date(dateStr + 'T12:00:00') - new Date()) / 86400000);
  };

  // Group by urgency
  const active = reminders.filter(r => !r.completed);
  const todayItems = active.filter(r => !r.date || r.date === todayStr || getDaysUntil(r.date) <= 0);
  const soon = active.filter(r => r.date && getDaysUntil(r.date) > 0 && getDaysUntil(r.date) <= 3);
  const thisWeek = active.filter(r => r.date && getDaysUntil(r.date) > 3 && getDaysUntil(r.date) <= 7);
  const later = active.filter(r => r.date && getDaysUntil(r.date) > 7);
  const done = reminders.filter(r => r.completed);

  const toggleReminder = (id) => setReminders(prev => prev.map(r => r.id === id ? { ...r, completed: !r.completed } : r));
  const deleteReminder = (id) => setReminders(prev => prev.filter(r => r.id !== id));

  // AI breakdown for DDL reminders
  const [breakingId, setBreakingId] = React.useState(null);
  const breakdownReminder = async (reminder) => {
    if (!apiKey) return showMessage('请先配置 API Key');
    setBreakingId(reminder.id);
    try {
      const days = getDaysUntil(reminder.date);
      const payload = {
        contents: [{ parts: [{ text: `你是学习规划助手。任务：${reminder.text}，截止日期：${reminder.date}（还有${days}天）。
拆解成每日执行步骤，每天最多2个，早期调研中期输出后期修改，目标提前1天完成。
严格返回JSON（不加markdown）：[{"date":"YYYY-MM-DD","task":"步骤","duration":"时长"}]
duration仅限：30分钟、1小时、2小时、半天。` }] }],
        generationConfig: { responseMimeType: 'application/json' }
      };
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      const data = await res.json();
      const subtasks = JSON.parse(data.candidates?.[0]?.content?.parts?.[0]?.text || '[]');
      const newTasks = subtasks.map((s, i) => {
        const d = new Date(s.date + 'T12:00:00'); const dow = d.getDay() === 0 ? 7 : d.getDay();
        return { id: `${Date.now()}-r-${i}`, text: `📌 ${s.task}`, completed: false, createdAt: new Date().toISOString(), day: dow, startTime: null, endTime: null, duration: s.duration, preferredTime: '不限时段', priority: '🔴 紧急', isFixed: false };
      });
      setTasks(prev => [...newTasks, ...prev]);
      setReminders(prev => prev.map(r => r.id === reminder.id ? { ...r, broken: true, subtaskCount: subtasks.length } : r));
      showMessage(`🎉 已拆解成 ${subtasks.length} 个子任务！`, 5000);
    } catch { showMessage('AI 拆解失败'); }
    finally { setBreakingId(null); }
  };

  const ReminderItem = ({ r, showDate = true }) => {
    const days = getDaysUntil(r.date);
    const urgency = !r.date || days <= 0 ? 'today' : days <= 2 ? 'soon' : days <= 7 ? 'week' : 'later';
    const dayBadge = !r.date ? null : days <= 0 ? '今天' : days === 1 ? '明天' : `${days}天`;
    const badgeStyle = urgency === 'today' ? 'bg-red-100 text-red-700' : urgency === 'soon' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500';

    return (
      <div className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl group transition-all ${
        urgency === 'today' && r.type === 'ddl' ? 'bg-red-50 border border-red-100' : 'bg-gray-50 border border-gray-100 hover:border-gray-200'
      }`}>
        <button onClick={() => toggleReminder(r.id)} className="shrink-0">
          <div className={`w-[15px] h-[15px] rounded-full border-2 flex items-center justify-center transition-all ${r.completed ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300 hover:border-indigo-400'}`}>
            {r.completed && <svg width="8" height="8" viewBox="0 0 8 8"><path d="M1.5 4L3.5 6L6.5 2" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" fill="none"/></svg>}
          </div>
        </button>
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-medium leading-snug ${r.completed ? 'line-through text-gray-400' : urgency === 'today' && r.type === 'ddl' ? 'text-red-800' : 'text-gray-700'}`}>{r.text}</p>
          {r.broken && <p className="text-[10px] text-emerald-600 mt-0.5 flex items-center gap-1"><CheckCircle2 className="w-2.5 h-2.5"/>已拆解 {r.subtaskCount} 个子任务</p>}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {dayBadge && showDate && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${badgeStyle}`}>{dayBadge}</span>}
          {r.type === 'ddl' && !r.broken && !r.completed && (
            <button onClick={() => breakdownReminder(r)} disabled={breakingId === r.id}
              className="text-[10px] px-1.5 py-0.5 bg-violet-100 text-violet-700 rounded-lg hover:bg-violet-200 font-medium disabled:opacity-50 flex items-center gap-0.5">
              {breakingId === r.id ? <Loader2 className="w-2.5 h-2.5 animate-spin"/> : <Sparkles className="w-2.5 h-2.5"/>}
              AI拆解
            </button>
          )}
          <button onClick={() => deleteReminder(r.id)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all">
            <X className="w-3.5 h-3.5"/>
          </button>
        </div>
      </div>
    );
  };

  const Section = ({ label, dot, items, showDate }) => items.length === 0 ? null : (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5">
        <div className="w-1.5 h-1.5 rounded-full" style={{background: dot}}/>
        <span className="text-[11px] font-medium text-gray-400">{label}</span>
        <span className="text-[10px] text-gray-300">{items.length} 项</span>
      </div>
      <div className="space-y-1.5">
        {items.map(r => <ReminderItem key={r.id} r={r} showDate={showDate}/>)}
      </div>
    </div>
  );

  const hasAny = active.length > 0 || done.length > 0;

  return (
    <div className="space-y-3">
      <Section label="今天" dot="#ef4444" items={todayItems} showDate={false}/>
      <Section label="2–3 天内" dot="#f59e0b" items={soon} showDate={true}/>
      <Section label="本周内" dot="#9ca3af" items={thisWeek} showDate={true}/>
      {later.length > 0 && (
        <details className="group">
          <summary className="flex items-center gap-1.5 text-[11px] text-gray-400 cursor-pointer list-none select-none">
            <div className="w-1.5 h-1.5 rounded-full bg-gray-300"/>
            更远的安排 ({later.length} 项)
            <ChevronRight className="w-3 h-3 group-open:rotate-90 transition-transform"/>
          </summary>
          <div className="mt-1.5 space-y-1.5">{later.map(r => <ReminderItem key={r.id} r={r} showDate={true}/>)}</div>
        </details>
      )}
      {!hasAny && <p className="text-xs text-gray-300 text-center py-4">暂无提醒，点「+ 添加」新建一个</p>}
      {done.length > 0 && (
        <details>
          <summary className="text-[11px] text-gray-300 cursor-pointer list-none select-none">已完成 {done.length} 项 ▾</summary>
          <div className="mt-1.5 space-y-1.5 opacity-50">{done.map(r => <ReminderItem key={r.id} r={r} showDate={true}/>)}</div>
        </details>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// 📋 时间轴Tab — 番茄钟下方总览 Table
// ─────────────────────────────────────────────
function DayOverviewTable({ scheduledTasks, completedTasks, reminders, toggleComplete, deleteTask, toggleReminder, deleteReminder, selectedDay }) {
  const todayStr = new Date().toISOString().split('T')[0];
  const realToday = new Date().getDay() || 7;
  const isToday = selectedDay === realToday;

  // Reminders for today (no date or today's date)
  const todayReminders = reminders.filter(r => !r.date || r.date === todayStr);
  const allScheduled = [...scheduledTasks].sort((a,b) => (a.startTime||'').localeCompare(b.startTime||''));

  const priorityStyle = { '🔴 紧急': 'bg-red-100 text-red-700', '🟡 常规': 'bg-amber-100 text-amber-700', '🟢 可延后': 'bg-green-100 text-green-700' };

  if (allScheduled.length === 0 && completedTasks.length === 0 && todayReminders.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Scheduled tasks */}
      {(allScheduled.length > 0 || completedTasks.length > 0) && (
        <div className="p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <div className="w-2 h-2 rounded-sm bg-indigo-500"/>
            <span className="text-[11px] font-semibold text-gray-500">已规划时间</span>
          </div>
          <table className="w-full">
            <tbody>
              {allScheduled.map(t => (
                <tr key={t.id} className="group border-b border-gray-50 last:border-0">
                  <td className="py-1.5 pr-1 w-5">
                    <button onClick={() => toggleComplete(t.id)}>
                      <Circle className="w-3.5 h-3.5 text-gray-300 hover:text-indigo-400"/>
                    </button>
                  </td>
                  <td className="py-1.5 text-xs text-gray-700 font-medium max-w-0 w-full">
                    <span className="truncate block">{t.text}</span>
                  </td>
                  <td className="py-1.5 px-1.5 text-[10px] font-bold text-indigo-600 whitespace-nowrap">{t.startTime}—{t.endTime}</td>
                  <td className="py-1.5 pl-1">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap ${priorityStyle[t.priority] || 'bg-gray-100 text-gray-500'}`}>{t.priority}</span>
                  </td>
                </tr>
              ))}
              {completedTasks.map(t => (
                <tr key={t.id} className="opacity-40">
                  <td className="py-1.5 pr-1 w-5">
                    <button onClick={() => toggleComplete(t.id)}>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500"/>
                    </button>
                  </td>
                  <td className="py-1.5 text-xs text-gray-400 line-through max-w-0 w-full">
                    <span className="truncate block">{t.text}</span>
                  </td>
                  <td className="py-1.5 px-1.5 text-[10px] text-gray-300 whitespace-nowrap">{t.startTime}—{t.endTime}</td>
                  <td className="py-1.5 pl-1"><span className="text-[9px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-full">完成</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Divider */}
      {todayReminders.length > 0 && (allScheduled.length > 0 || completedTasks.length > 0) && (
        <div className="flex items-center gap-2 px-3 py-1">
          <div className="flex-1 h-px bg-gray-100"/>
          <span className="text-[10px] text-gray-300 whitespace-nowrap">今日备忘</span>
          <div className="flex-1 h-px bg-gray-100"/>
        </div>
      )}

      {/* Reminders */}
      {todayReminders.length > 0 && (
        <div className="p-3 pt-1">
          {!(allScheduled.length > 0 || completedTasks.length > 0) && (
            <div className="flex items-center gap-1.5 mb-2">
              <div className="w-2 h-2 rounded-full bg-amber-400"/>
              <span className="text-[11px] font-semibold text-gray-500">今日备忘</span>
            </div>
          )}
          <div className="space-y-1">
            {todayReminders.map(r => (
              <div key={r.id} className={`flex items-center gap-2 group ${r.completed ? 'opacity-40' : ''}`}>
                <button onClick={() => toggleReminder(r.id)} className="shrink-0">
                  <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${r.completed ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300 hover:border-amber-400'}`}>
                    {r.completed && <svg width="7" height="7" viewBox="0 0 8 8"><path d="M1.5 4L3.5 6L6.5 2" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" fill="none"/></svg>}
                  </div>
                </button>
                <span className={`flex-1 text-xs ${r.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>{r.text}</span>
                <span className="text-[9px] text-gray-300">{r.type === 'ddl' ? '🔴' : r.type === 'task' ? '🛒' : '📌'}</span>
                <button onClick={() => deleteReminder(r.id)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all">
                  <X className="w-3 h-3"/>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


// ─────────────────────────────────────────────
// 🍅 番茄钟（内嵌侧边栏版）
// ─────────────────────────────────────────────
function PomodoroInline({ tasks, onRecordTime }) {
  const [mode, setMode] = useState('focus');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [cycles, setCycles] = useState(0);
  const [boundTaskId, setBoundTaskId] = useState('');
  const [accumulatedMinutes, setAccumulatedMinutes] = useState(0);
  const [sessionLog, setSessionLog] = useState([]);

  const totalTime = mode === 'focus' ? 25 * 60 : 5 * 60;
  const r = 40; const circ = 2 * Math.PI * r;
  const progress = (totalTime - timeLeft) / totalTime;
  const boundTask = tasks.find(t => t.id === boundTaskId) || null;

  const handleFocusComplete = () => {
    setMode('break'); setTimeLeft(5 * 60); setCycles(c => c + 1);
    if (boundTask) {
      onRecordTime(boundTask.id, boundTask.text, 25);
      setAccumulatedMinutes(a => a + 25);
      setSessionLog(prev => {
        const ex = prev.find(l => l.taskId === boundTask.id);
        if (ex) return prev.map(l => l.taskId === boundTask.id ? { ...l, minutes: l.minutes + 25 } : l);
        return [...prev, { taskId: boundTask.id, taskText: boundTask.text, minutes: 25 }];
      });
    }
    if (Notification.permission === 'granted')
      new Notification('🍅 专注完成！', { body: boundTask ? `已为「${boundTask.text.slice(0, 15)}」记录 25 分钟` : '休息5分钟！' });
  };

  useEffect(() => {
    if (!isRunning) return;
    const iv = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          setIsRunning(false);
          if (mode === 'focus') handleFocusComplete();
          else { setMode('focus'); setTimeLeft(25 * 60); }
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [isRunning, mode, boundTask]);

  const reset = () => { setIsRunning(false); setTimeLeft(mode === 'focus' ? 25 * 60 : 5 * 60); };
  const switchMode = () => { const n = mode === 'focus' ? 'break' : 'focus'; setMode(n); setIsRunning(false); setTimeLeft(n === 'focus' ? 25 * 60 : 5 * 60); };
  const mins = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const secs = String(timeLeft % 60).padStart(2, '0');
  const isFocus = mode === 'focus';
  const ringColor = isFocus ? '#ef4444' : '#10b981';
  const headerBg = isFocus ? 'bg-rose-500' : 'bg-emerald-500';

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className={`${headerBg} px-4 py-2.5 text-white flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          {isFocus ? <Timer className="w-3.5 h-3.5" /> : <Coffee className="w-3.5 h-3.5" />}
          <span className="text-xs font-semibold">{isFocus ? '专注时间' : '休息时间'}</span>
        </div>
        <span className="text-[11px] opacity-75">第 {cycles + 1} 轮 · 今日 {cycles} 个🍅</span>
      </div>

      <div className="p-4 flex gap-4 items-center">
        {/* Ring */}
        <div className="relative shrink-0">
          <svg width="88" height="88" className="-rotate-90">
            <circle cx="44" cy="44" r={r} fill="none" stroke="#f1f5f9" strokeWidth="6" />
            <circle cx="44" cy="44" r={r} fill="none" stroke={ringColor} strokeWidth="6"
              strokeDasharray={circ} strokeDashoffset={circ * (1 - progress)}
              strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s linear' }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-bold text-gray-800 tabular-nums leading-none">{mins}:{secs}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex-1 flex flex-col gap-2.5">
          <select value={boundTaskId} onChange={e => { setBoundTaskId(e.target.value); setAccumulatedMinutes(0); }} disabled={isRunning}
            className="w-full text-xs px-2.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-600 focus:outline-none focus:border-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed">
            <option value="">— 不绑定任务 —</option>
            {tasks.map(t => <option key={t.id} value={t.id}>{t.text.slice(0, 22)}{t.text.length > 22 ? '…' : ''}</option>)}
          </select>

          {boundTask && accumulatedMinutes > 0 && (
            <div className="text-[10px] text-rose-500 font-bold bg-rose-50 px-2 py-1 rounded-lg text-center">
              +{accumulatedMinutes}min 已记录至此任务
            </div>
          )}

          <div className="flex gap-1.5">
            <button onClick={reset} className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"><RotateCcw className="w-3.5 h-3.5" /></button>
            <button onClick={() => setIsRunning(r => !r)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-white text-xs font-medium ${isFocus ? 'bg-rose-500 hover:bg-rose-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}>
              {isRunning ? <><Pause className="w-3.5 h-3.5" />暂停</> : <><Play className="w-3.5 h-3.5" />开始</>}
            </button>
            <button onClick={switchMode} className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50">
              {isFocus ? <Coffee className="w-3.5 h-3.5" /> : <Timer className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {sessionLog.length > 0 && (
        <div className="border-t border-gray-100 px-4 py-2.5 space-y-1">
          <p className="text-[10px] font-semibold text-gray-400 mb-1.5">本次记录</p>
          {sessionLog.map((l, i) => (
            <div key={i} className="flex justify-between text-[11px]">
              <span className="text-gray-500 truncate flex-1">{l.taskText.slice(0, 18)}{l.taskText.length > 18 ? '…' : ''}</span>
              <span className="text-rose-500 font-bold ml-2">{l.minutes}min</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


// ─────────────────────────────────────────────
// 🃏 可编辑任务卡片组（AI Chat 内）
// ─────────────────────────────────────────────
function TaskCardGroup({ tasks: initialTasks, onAddOne, onAddAll, taskHistory }) {
  const [localTasks, setLocalTasks] = useState(initialTasks.map(t => ({ ...t })));
  const [added, setAdded] = useState(new Set());

  const updateDuration = (id, val) => setLocalTasks(prev => prev.map(t => t.id === id ? { ...t, duration: val } : t));
  const updateTimePref = (id, val) => setLocalTasks(prev => prev.map(t => t.id === id ? { ...t, timePref: val } : t));

  const handleAddOne = (task) => { onAddOne(task.name, task.duration, task.timePref); setAdded(prev => new Set(prev).add(task.id)); };
  const handleAddAll = () => { const remaining = localTasks.filter(t => !added.has(t.id)); onAddAll(remaining); setAdded(new Set(localTasks.map(t => t.id))); };

  const totalH = localTasks.reduce((acc, t) => {
    const map = { '15分钟': 0.25, '30分钟': 0.5, '1小时': 1, '2小时': 2, '半天': 4, 'AI自动评估': 0.75 };
    return acc + (map[t.duration] || 0.75);
  }, 0);

  const allAdded = localTasks.every(t => added.has(t.id));

  return (
    <div className="bg-indigo-50 border border-indigo-100 rounded-2xl rounded-tl-sm p-3 space-y-2">
      <p className="text-xs font-semibold text-indigo-700 mb-2">为你拆解了 {localTasks.length} 个任务，可调整用时后加入：</p>
      {localTasks.map(task => {
        const warn = getTimeAwareness(task.name, task.duration, taskHistory);
        const isDone = added.has(task.id);
        return (
          <div key={task.id} className={`bg-white border rounded-xl p-2.5 transition-all ${isDone ? 'opacity-40' : 'border-indigo-100'}`}>
            <div className="flex items-start gap-2 mb-1.5">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-800 leading-snug">{task.name}</p>
              </div>
              {isDone ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> :
                <button onClick={() => handleAddOne(task)} className="shrink-0 flex items-center gap-1 bg-indigo-500 hover:bg-indigo-600 text-white text-[10px] px-2 py-1 rounded-lg transition-colors font-medium"><Plus className="w-2.5 h-2.5" />加入</button>}
            </div>
            {!isDone && (
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1 bg-gray-50 border border-gray-100 rounded-lg px-2 py-1">
                  <Hourglass className="w-2.5 h-2.5 text-gray-400" />
                  <select value={task.duration} onChange={e => updateDuration(task.id, e.target.value)} className="bg-transparent text-[10px] text-gray-600 focus:outline-none cursor-pointer font-medium">
                    <option value="15分钟">15分钟</option><option value="30分钟">30分钟</option><option value="1小时">1小时</option><option value="2小时">2小时</option><option value="半天">半天</option><option value="AI自动评估">AI评估</option>
                  </select>
                </div>
                <div className="flex items-center gap-1 bg-gray-50 border border-gray-100 rounded-lg px-2 py-1">
                  <SunMoon className="w-2.5 h-2.5 text-gray-400" />
                  <select value={task.timePref} onChange={e => updateTimePref(task.id, e.target.value)} className="bg-transparent text-[10px] text-gray-600 focus:outline-none cursor-pointer">
                    <option value="不限时段">不限</option><option value="早上 (09:00-12:00)">早晨</option><option value="下午 (13:00-18:00)">下午</option><option value="晚上 (19:00-22:00)">晚上</option>
                  </select>
                </div>
                {warn && <span className="text-[10px] text-amber-600 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded-lg">⚡ 历史实际 {warn.avgActual}min</span>}
              </div>
            )}
          </div>
        );
      })}
      <div className="flex items-center justify-between pt-1">
        <span className="text-[10px] text-indigo-500">总预估约 {totalH.toFixed(1)}h</span>
        {!allAdded && <button onClick={handleAddAll} className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"><CheckSquare className="w-3 h-3" />全部加入</button>}
        {allAdded && <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />全部已加入</span>}
      </div>
    </div>
  );
}