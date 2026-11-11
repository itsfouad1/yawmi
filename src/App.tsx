import { FormEvent, useEffect, useMemo, useState } from 'react';
import { AlarmClock, AlignLeft, CalendarDays, Check, CheckCheck, ChevronDown, ChevronLeft, ChevronRight, Clock3, Flame, FolderKanban, Leaf, MoreHorizontal, Pencil, Plus, Search, Sparkles, Sun, Target, Trash2, X } from 'lucide-react';

type Priority = 'عالية' | 'متوسطة' | 'منخفضة';
type Task = { id: number; title: string; notes: string; category: string; dueDate: string; dueTime: string; priority: Priority; color: string; done: boolean };
type Draft = Omit<Task, 'id' | 'done' | 'color'>;
const TASKS_STORAGE_KEY = 'yawmi.tasks.v1';
const todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
const COLORS: Record<string,string> = { 'تعلّم وتطوير':'violet', 'مشروع':'coral', 'عناية بالنفس':'mint', 'تنظيم':'gold', 'شخصي':'violet', 'أخرى':'mint' };
const PRIORITY_WEIGHT: Record<Priority,number> = { 'عالية':0, 'متوسطة':1, 'منخفضة':2 };
const initialTasks: Task[] = [
  { id: 1, title: 'مراجعة محاضرة قواعد البيانات', notes: 'التركيز على الفهارس والعلاقات، وتلخيص النقاط المهمة.', category: 'تعلّم وتطوير', dueDate: todayISO(), dueTime: '10:30', priority: 'عالية', color: 'violet', done: false },
  { id: 2, title: 'إرسال ملف المشروع للفريق', notes: 'إرفاق آخر نسخة وملاحظات الاجتماع.', category: 'مشروع', dueDate: todayISO(), dueTime: '12:30', priority: 'عالية', color: 'coral', done: false },
  { id: 3, title: 'مشي خفيف لمدة نصف ساعة', notes: '', category: 'عناية بالنفس', dueDate: todayISO(), dueTime: '17:00', priority: 'منخفضة', color: 'mint', done: false },
  { id: 4, title: 'ترتيب خطة الأسبوع', notes: 'مراجعة المهام وتحديد أهم ثلاث أولويات.', category: 'تنظيم', dueDate: todayISO(), dueTime: '', priority: 'متوسطة', color: 'gold', done: true },
];
const blankDraft = (): Draft => ({ title:'', notes:'', category:'شخصي', dueDate:todayISO(), dueTime:'', priority:'متوسطة' });
function loadTasks(): Task[] {
  try {
    const raw = localStorage.getItem(TASKS_STORAGE_KEY);
    if (!raw) return initialTasks;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return initialTasks;
    return parsed.map((item: any, index): Task => {
      const category = typeof item.category === 'string' ? item.category : 'شخصي';
      const oldTime = typeof item.time === 'string' ? item.time : '';
      const priority: Priority = ['عالية','متوسطة','منخفضة'].includes(item.priority) ? item.priority : item.priority === 'عالية' || item.priority === 'مهمة اليوم' ? 'عالية' : item.priority === 'خفيفة' ? 'منخفضة' : 'متوسطة';
      return { id: Number(item.id) || Date.now()+index, title: String(item.title || ''), notes: String(item.notes || ''), category, dueDate: typeof item.dueDate === 'string' ? item.dueDate : todayISO(), dueTime: typeof item.dueTime === 'string' ? item.dueTime : (/^\d{2}:\d{2}$/.test(oldTime) ? oldTime : ''), priority, color: COLORS[category] || item.color || 'violet', done: Boolean(item.done) };
    }).filter(task => task.title.trim());
  } catch (error) { console.warn('تعذر قراءة المهام المحفوظة', error); return initialTasks; }
}
function formatDate(date: string) {
  if (!date) return 'بدون موعد';
  const d = new Date(`${date}T12:00:00`);
  if (date === todayISO()) return 'اليوم';
  return new Intl.DateTimeFormat('ar-PS', { day:'numeric', month:'short' }).format(d);
}
function App() {
  const [tasks, setTasks] = useState<Task[]>(loadTasks);
  const [activeNav, setActiveNav] = useState('اليوم');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<Draft>(blankDraft());
  const [query, setQuery] = useState('');
  const [toast, setToast] = useState('');
  useEffect(() => { try { localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks)); } catch (error) { console.warn('تعذر حفظ المهام', error); } }, [tasks]);
  const today = todayISO();
  const doneCount = tasks.filter(t => t.done).length;
  const todayCount = tasks.filter(t => !t.done && (!t.dueDate || t.dueDate <= today)).length;
  const laterCount = tasks.filter(t => !t.done && t.dueDate > today).length;
  const visibleTasks = useMemo(() => tasks.filter(t => {
    const matchesNav = activeNav === 'اليوم' ? !t.done && (!t.dueDate || t.dueDate <= today) : activeNav === 'لاحقًا' ? !t.done && t.dueDate > today : t.done;
    const haystack = `${t.title} ${t.notes} ${t.category}`.toLocaleLowerCase();
    return matchesNav && haystack.includes(query.trim().toLocaleLowerCase());
  }).sort((a,b) => a.dueDate.localeCompare(b.dueDate) || (a.dueTime || '99:99').localeCompare(b.dueTime || '99:99') || PRIORITY_WEIGHT[a.priority]-PRIORITY_WEIGHT[b.priority]), [tasks, activeNav, today, query]);
  const pct = tasks.length ? Math.round(doneCount / tasks.length * 100) : 0;
  const flash = (message: string) => { setToast(message); window.setTimeout(() => setToast(''), 2300); };
  const openNew = () => { setEditingId(null); setDraft(blankDraft()); setEditorOpen(true); };
  const openEdit = (task: Task) => { const { title, notes, category, dueDate, dueTime, priority } = task; setEditingId(task.id); setDraft({title,notes,category,dueDate,dueTime,priority}); setEditorOpen(true); };
  const toggleTask = (id: number) => setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  const removeTask = (id: number) => { setTasks(prev => prev.filter(t => t.id !== id)); flash('انحذفت المهمة'); };
  const saveTask = (e: FormEvent) => {
    e.preventDefault(); if (!draft.title.trim()) return;
    if (editingId !== null) {
      setTasks(prev => prev.map(t => t.id === editingId ? { ...t, ...draft, title:draft.title.trim(), color:COLORS[draft.category] || 'violet' } : t));
      flash('انحفظت التعديلات تلقائيًا');
    } else {
      setTasks(prev => [{ id:Date.now(), ...draft, title:draft.title.trim(), color:COLORS[draft.category] || 'violet', done:false }, ...prev]);
      flash('انضافت مهمتك للمشهد ✦');
    }
    setEditorOpen(false);
  };
  const heading = activeNav === 'اليوم' ? 'على رادارك اليوم' : activeNav === 'لاحقًا' ? 'مهامك القادمة' : 'أشياء أنجزتها';
  const todayLabel = new Intl.DateTimeFormat('ar-PS', { weekday:'long', day:'numeric', month:'long', year:'numeric' }).format(new Date());
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><Sparkles size={20}/></div><div><strong>يومي</strong><span>مساحة إنجازك اليومية</span></div></div><div className="side-sep"/><div className="nav-label">مساحتك</div>
      <nav className="nav-list">
        <button className={activeNav==='اليوم'?'nav-item active':'nav-item'} onClick={()=>setActiveNav('اليوم')}><Sun/><span>اليوم</span><b>{String(todayCount).padStart(2,'٠')}</b></button>
        <button className={activeNav==='لاحقًا'?'nav-item active':'nav-item'} onClick={()=>setActiveNav('لاحقًا')}><Clock3/><span>لاحقًا</span><b>{String(laterCount).padStart(2,'٠')}</b></button>
        <button className={activeNav==='اكتملت'?'nav-item active':'nav-item'} onClick={()=>setActiveNav('اكتملت')}><CheckCheck/><span>اكتملت</span><b>{String(doneCount).padStart(2,'٠')}</b></button>
      </nav>
      <button className="new-task-side" onClick={openNew}><Plus size={18}/> مهمة جديدة</button>
      <div className="sidebar-bottom"><div className="focus-note"><div className="note-kicker"><Sparkles size={14}/> لحظة تركيز</div><strong>خذها خطوة خطوة</strong><p>إنجاز صغير اليوم، فرق كبير بكرا.</p><div className="note-decoration"><Leaf size={52}/></div></div><div className="profile"><div className="avatar">ف</div><div><strong>فؤاد</strong><span>مساحتي الشخصية</span></div><MoreHorizontal size={18}/></div></div>
    </aside>
    <main className="main-area">
      <header className="topbar"><div className="date-line"><span className="date-dot"/> {todayLabel} <ChevronDown size={14}/></div><div className="top-actions"><span className="offline-pill"><i/> حفظ تلقائي على جهازك</span><button className="icon-btn" aria-label="بحث" onClick={()=>document.getElementById('task-search')?.focus()}><Search size={17}/></button><div className="mini-avatar">ف</div></div></header>
      <section className="welcome-row"><div><div className="eyebrow"><span/> يوم جديد، فرصة جديدة</div><h1>{activeNav==='اليوم'?'مساحتك اليوم':activeNav==='لاحقًا'?'خطط للخطوة الجاية':'إنجازاتك تستاهل' } <span className="star-sparkle">✦</span></h1><p>خلّي إنجازك يحكي. ابدأ بمهمة واحدة، والباقي بيجي.</p></div><div className="hero-art" aria-hidden="true"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="hero-orb"><Sparkles size={30}/></div><span className="float-dot dot-a"/><span className="float-dot dot-b"/><span className="float-dot dot-c"/></div></section>
      <section className="overview-grid"><article className="progress-panel"><div className="panel-top"><div className="panel-label"><span className="tiny-icon violet-icon"><Target size={16}/></span> تقدمك الكلي</div><button className="more-button" title="نسبة المهام المكتملة"><MoreHorizontal size={18}/></button></div><div className="progress-main"><div className="progress-number">{String(doneCount).padStart(2,'٠')}<small>/{String(tasks.length).padStart(2,'٠')}</small></div><div className="progress-copy"><strong>كل خطوة بتنحسب</strong><span>أنجزت {doneCount} من {tasks.length} مهامك</span></div><div className="ring" style={{'--progress':`${pct*3.6}deg`} as React.CSSProperties}><div><strong>{pct}<small>%</small></strong></div></div></div><div className="progress-track"><span style={{width:`${pct}%`}}/></div><div className="progress-foot"><span>بداية حلوة، كمّل على راحتك ✨</span><span>{pct}%</span></div></article>
        <article className="streak-panel"><div className="streak-glow"/><div className="streak-head"><span className="streak-icon"><Flame size={19}/></span><span>تنظيم يومك</span><MoreHorizontal size={18}/></div><div className="streak-number">{todayCount} <small>مهام متبقية اليوم</small></div><p>قسّم يومك إلى خطوات صغيرة وواضحة.</p><div className="streak-days">{['ث','أ','ن','ث','ج','س','ح'].map((d,i)=><div className={i<3?'day done-day':'day'} key={i}><span>{d}</span><i>{i<3?<Check size={12}/>:''}</i></div>)}</div></article></section>
      <section className="tasks-section"><div className="section-heading"><div><div className="heading-title">{heading}<span className="task-count">{visibleTasks.length}</span></div><div className="heading-sub">رتّب يومك على إيقاعك الخاص</div></div><div className="section-tools"><div className="search-box"><Search size={15}/><input id="task-search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="ابحث بالاسم أو التفاصيل..."/></div><button className="add-button" onClick={openNew}><Plus size={17}/> أضف للمشهد</button></div></div>
        {visibleTasks.length ? <div className="task-grid">{visibleTasks.map(task=><article key={task.id} className={`task-card ${task.done?'task-done':''} ${task.color}`}><div className="task-card-top"><span className="category-icon"><FolderKanban size={15}/></span><span className="category-name">{task.category}</span><button className="task-action edit-action" onClick={()=>openEdit(task)} title="تعديل المهمة" aria-label="تعديل المهمة"><Pencil size={14}/></button><button className="task-action delete-action" onClick={()=>removeTask(task.id)} title="حذف المهمة" aria-label="حذف المهمة"><Trash2 size={14}/></button></div><h3>{task.title}</h3>{task.notes&&<p className="task-notes"><AlignLeft size={12}/><span>{task.notes}</span></p>}<div className="task-meta"><button className={`task-check ${task.done?'checked':''}`} onClick={()=>toggleTask(task.id)} aria-label={task.done?'إلغاء الإنجاز':'إنجاز المهمة'}>{task.done&&<Check size={14}/>}</button><span className="task-time"><CalendarDays size={13}/>{formatDate(task.dueDate)}</span>{task.dueTime&&<span className="task-time"><AlarmClock size={13}/>{task.dueTime}</span>}<span className={`task-priority priority-${task.priority==='عالية'?'high':task.priority==='متوسطة'?'medium':'low'}`}>{task.priority}</span></div><div className="task-accent"/></article>)}</div> : <div className="empty-state"><span>✧</span><strong>{query?'ما لقينا مهام مطابقة':'ما في مهام بهذا القسم'}</strong><p>{query?'جرّب كلمة بحث ثانية.':'أضف مهمة وحدد موعدها وأولويتها وتفاصيلها.'}</p><button onClick={openNew}><Plus size={16}/> أضف مهمة</button></div>}
      </section>
      <section className="bottom-grid"><article className="quote-card"><div className="quote-spark">✦</div><div><span>تذكير لطيف</span><strong>مش لازم تخلص كل شي اليوم.<br/>المهم تبدأ.</strong><small>مساحتك، إيقاعك.</small></div><div className="quote-blob"/></article><article className="week-card"><div className="week-head"><strong>هذا الأسبوع</strong><div><button aria-label="الأسبوع السابق"><ChevronRight size={15}/></button><button aria-label="الأسبوع التالي"><ChevronLeft size={15}/></button></div></div><div className="week-days">{['ث','أ','ن','ث','ج','س','ح'].map((d,i)=><div key={i} className={i===6?'week-day today':'week-day'}><span>{d}</span><strong>{['٣','٤','٥','٦','٧','٨','٩'][i]}</strong>{[0,2,4].includes(i)&&<i/>}</div>)}</div></article></section>
      <footer className="footer-line"><span>يومي <span className="footer-star">✦</span> مساحة صغيرة لحياة أهدى</span><span>مهامك محفوظة على جهازك <span className="version-dot"/></span></footer>
    </main>
    {editorOpen&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setEditorOpen(false)}}><form className="task-modal task-editor" onSubmit={saveTask}><button type="button" className="modal-close" onClick={()=>setEditorOpen(false)}><X size={18}/></button><div className="modal-icon"><Sparkles size={20}/></div><div className="modal-kicker">{editingId!==null?'تعديل تفاصيل المهمة':'خطوة جديدة'}</div><h2>{editingId!==null?'عدّل مهمتك':'أضف للمشهد'}</h2><p>حدد التفاصيل والموعد، والتغييرات بتنحفظ تلقائيًا.</p><label>اسم المهمة<input autoFocus required maxLength={120} value={draft.title} onChange={e=>setDraft({...draft,title:e.target.value})} placeholder="مثال: أراجع ملاحظات المحاضرة"/></label><label>التفاصيل<textarea rows={3} maxLength={500} value={draft.notes} onChange={e=>setDraft({...draft,notes:e.target.value})} placeholder="اكتب ملاحظات أو خطوات تساعدك تنجزها..."/></label><div className="form-two-cols"><label>التصنيف<select value={draft.category} onChange={e=>setDraft({...draft,category:e.target.value})}><option>شخصي</option><option>مشروع</option><option>تعلّم وتطوير</option><option>عناية بالنفس</option><option>تنظيم</option><option>أخرى</option></select></label><label>الأولوية<select value={draft.priority} onChange={e=>setDraft({...draft,priority:e.target.value as Priority})}><option value="عالية">عالية</option><option value="متوسطة">متوسطة</option><option value="منخفضة">منخفضة</option></select></label></div><div className="form-two-cols"><label>تاريخ الاستحقاق<input type="date" value={draft.dueDate} onChange={e=>setDraft({...draft,dueDate:e.target.value})}/></label><label>الوقت<input type="time" value={draft.dueTime} onChange={e=>setDraft({...draft,dueTime:e.target.value})}/></label></div><button className="modal-submit" type="submit"><Check size={17}/>{editingId!==null?'حفظ التعديلات':'أضف المهمة'}</button></form></div>}
    {toast&&<div className="toast"><Check size={16}/>{toast}</div>}
  </div>;
}
export default App;
