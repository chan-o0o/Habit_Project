"use client";

import React, { useState, useEffect } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line
} from "recharts";
import { 
  X, TrendingUp, Clock, ChevronLeft, ChevronRight, Scale, Utensils, 
  Dumbbell, Star, Activity, Camera, Settings, Download, Upload, 
  Check, Edit2, Plus, Trash2 
} from "lucide-react";

interface MealRecord { type: string; food: string; }
interface CustomHabit { id: string; name: string; color: string; completed: boolean; }
interface DailyLog { 
  weight?: number; 
  weightPhotos?: string[]; 
  fastingHours?: number; 
  meals?: MealRecord[]; 
  exercises?: string[]; 
  customHabits?: CustomHabit[]; 
}

const getLocalDateString = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatFastingTime = (hours: number) => {
  if (!hours || hours === 0) return "0h 0m";
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h ${m}m`;
};

// 습관 색상 유틸리티
const getHabitColorClasses = (color: string) => {
  switch (color) {
    case 'rose': return 'bg-rose-50 text-rose-600 border-rose-100';
    case 'amber': return 'bg-amber-50 text-amber-600 border-amber-100';
    case 'teal': return 'bg-teal-50 text-teal-600 border-teal-100';
    case 'indigo': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
    case 'cyan': return 'bg-cyan-50 text-cyan-600 border-cyan-100';
    default: return 'bg-orange-50 text-orange-600 border-orange-100';
  }
};

const HeatmapPopup = ({ title, logs, color, onClose }: { title: string, logs: Record<string, DailyLog>, color: string, onClose: () => void }) => {
  const dates = [];
  const today = new Date();
  for (let i = 120; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    dates.push(getLocalDateString(d));
  }

  const checkCompletion = (date: string) => {
    const log = logs[date];
    if (!log) return 0;
    if (title === "체중") return log.weight ? 1 : 0;
    if (title === "단식") return log.fastingHours ? 1 : 0;
    if (title === "운동") return (log.exercises?.length || 0) > 0 ? 1 : 0;
    if (title === "식사") return (log.meals?.length || 0) > 0 ? 1 : 0;
    return log.customHabits?.find(h => h.name === title && h.completed) ? 1 : 0;
  };

  return (
    <div className="fixed inset-0 z-[300] bg-white/90 backdrop-blur-md flex items-center justify-center p-6 animate-modal-up" onClick={onClose}>
      <div className="bg-white w-full max-w-[340px] p-8 rounded-[40px] shadow-2xl border border-gray-100" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black text-gray-900">{title} 잔디</h3>
          <button onClick={onClose} className="p-2 bg-gray-100 rounded-full"><X size={18} /></button>
        </div>
        <div className="grid grid-cols-11 gap-1.5 mb-6">
          {dates.map(date => {
            const level = checkCompletion(date);
            return (
              <div key={date} 
                className={`w-6 h-6 rounded-[6px] transition-all duration-500 ${level > 0 ? color : "bg-gray-100"}`}
                title={date}
              />
            );
          })}
        </div>
        <div className="text-center">
          <p className="text-xs font-bold text-gray-400 mb-1">최근 4개월의 기록</p>
          <div className="flex justify-center items-center gap-1">
            <div className={`w-3 h-3 rounded-[3px] ${color}`} />
            <span className="text-[10px] font-black text-gray-600">완료됨</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatsView = ({ externalLogs, onUpdateLogs }: { externalLogs?: Record<string, DailyLog>, onUpdateLogs?: (newLogs: Record<string, DailyLog>) => void }) => {
  const [logs, setLogs] = useState<Record<string, DailyLog>>({});
  const [selectedDate, setSelectedDate] = useState<string>(getLocalDateString(new Date()));
  const [currentDate, setCurrentDate] = useState(new Date());
  const [detailModal, setDetailModal] = useState<"weight" | "fasting" | null>(null);
  const [chartWeeksOffset, setChartWeeksOffset] = useState(0);
  const [viewingPhotos, setViewingPhotos] = useState<string[] | null>(null);
  const [currentPhotoIdx, setCurrentPhotoIdx] = useState(0);
  const [easterEgg, setEasterEgg] = useState<{title: string, color: string} | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  
  const [isEditing, setIsEditing] = useState(false);
  const [tempLogs, setTempLogs] = useState<Record<string, DailyLog>>({});

  useEffect(() => {
    if (externalLogs) {
      setLogs(externalLogs);
    } else {
      const savedLogs = localStorage.getItem("habit_logs");
      if (savedLogs) setLogs(JSON.parse(savedLogs));
    }
  }, [externalLogs]);

  const startEditing = () => {
    setTempLogs(JSON.parse(JSON.stringify(logs)));
    setIsEditing(true);
    setShowSettings(false);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setTempLogs({});
  };

  const saveEditing = () => {
    setLogs(tempLogs);
    if (onUpdateLogs) onUpdateLogs(tempLogs);
    else localStorage.setItem("habit_logs", JSON.stringify(tempLogs));
    setIsEditing(false);
  };

  const updateTempLog = (date: string, partialLog: Partial<DailyLog>) => {
    const current = tempLogs[date] || {};
    setTempLogs({
      ...tempLogs,
      [date]: { ...current, ...partialLog }
    });
  };

  const exportData = () => {
    const data = {
      logs: JSON.parse(localStorage.getItem("habit_logs") || "{}"),
      settings: JSON.parse(localStorage.getItem("habit_data") || "{}")
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `habit_tracker_backup_${getLocalDateString(new Date())}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const imported = JSON.parse(event.target?.result as string);
          if (imported.logs) {
            setLogs(imported.logs);
            if (onUpdateLogs) onUpdateLogs(imported.logs);
          }
          if (imported.settings) localStorage.setItem("habit_data", JSON.stringify(imported.settings));
          alert("데이터를 성공적으로 가져왔습니다!");
          window.location.reload();
        } catch (err) {
          alert("유효하지 않은 데이터 파일입니다.");
        }
      };
      reader.readAsText(file);
    }
  };

  const currentActiveLogs = isEditing ? tempLogs : logs;
  const selectedLog = currentActiveLogs[selectedDate] || {};

  const getChartData = (daysCount = 7, weeksOffset = 0) => {
    const data = [];
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() - (weeksOffset * 7));
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() - i);
      const dateStr = getLocalDateString(d);
      const log = currentActiveLogs[dateStr];
      data.push({
        name: ["일", "월", "화", "수", "목", "금", "토"][d.getDay()],
        weight: log?.weight || null,
        fasting: log?.fastingHours || 0,
        fullDate: dateStr,
        photos: log?.weightPhotos || []
      });
    }
    return data;
  };

  const recentData = getChartData(7, 0);

  const PhotoViewer = ({ srcs, onClose }: { srcs: string[], onClose: () => void }) => (
    <div className="fixed inset-0 z-[400] bg-black flex flex-col items-center justify-center p-6" onClick={onClose}>
      <button className="absolute top-12 right-6 text-white p-2 bg-white/10 rounded-full z-10"><X size={24} /></button>
      <div className="relative w-full h-[70vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
        {srcs.length > 1 && (
          <div className="absolute inset-x-0 flex justify-between px-4 z-10 pointer-events-none">
            <button onClick={() => setCurrentPhotoIdx(prev => (prev > 0 ? prev - 1 : srcs.length - 1))} className="p-2 bg-black/50 text-white rounded-full pointer-events-auto"><ChevronLeft size={24} /></button>
            <button onClick={() => setCurrentPhotoIdx(prev => (prev < srcs.length - 1 ? prev + 1 : 0))} className="p-2 bg-black/50 text-white rounded-full pointer-events-auto"><ChevronRight size={24} /></button>
          </div>
        )}
        <img src={srcs[currentPhotoIdx]} alt="Log" className="max-w-full max-h-full rounded-2xl object-contain shadow-2xl transition-all" />
      </div>
      <div className="mt-6 flex flex-col items-center gap-2">
        <div className="flex gap-1.5">
          {srcs.map((_, i) => (
            <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === currentPhotoIdx ? "bg-white" : "bg-white/20"}`} />
          ))}
        </div>
        <p className="text-white/50 font-bold text-sm">터치하여 닫기 ({currentPhotoIdx + 1}/{srcs.length})</p>
      </div>
    </div>
  );

  const DetailPopup = ({ type }: { type: "weight" | "fasting" }) => {
    const data = getChartData(7, chartWeeksOffset);
    const validWeights = data.filter(d => d.weight !== null).map(d => d.weight as number);
    const currentMin = validWeights.length ? Math.min(...validWeights) : 60;
    const currentMax = validWeights.length ? Math.max(...validWeights) : 100;
    const minW = Number((currentMin - 1).toFixed(1));
    const maxW = Number((currentMax + 1).toFixed(1));
    const total = data.reduce((acc, curr) => acc + (type === "weight" ? (curr.weight || 0) : curr.fasting), 0);
    const avgVal = total / (type === "weight" ? (validWeights.length || 1) : 7);

    return (
      <div className="fixed inset-0 z-[120] bg-white overflow-y-auto px-6 pt-12 animate-modal-up">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-black">{type === "weight" ? "체중 트렌드" : "단식 시간 추이"}</h2>
          <button onClick={() => {setDetailModal(null); setChartWeeksOffset(0);}} className="p-2 bg-gray-100 rounded-full"><X size={20} /></button>
        </div>
        <div className="flex items-center justify-between mb-6 bg-gray-50 p-2 rounded-2xl">
          <button onClick={() => setChartWeeksOffset(prev => prev + 1)} className="p-2 hover:bg-white rounded-xl transition-colors"><ChevronLeft size={20} /></button>
          <div className="text-sm font-bold text-gray-500">{data[0].fullDate} ~ {data[6].fullDate}</div>
          <button onClick={() => setChartWeeksOffset(prev => Math.max(0, prev - 1))} className="p-2 hover:bg-white rounded-xl transition-colors" disabled={chartWeeksOffset === 0}><ChevronRight size={20} /></button>
        </div>
        <div className="bg-black text-white p-6 rounded-[32px] mb-8 shadow-xl shadow-black/10">
          <div className="text-[10px] font-bold opacity-50 mb-1">주간 평균</div>
          <div className="text-4xl font-black">{type === "weight" ? avgVal.toFixed(2) : formatFastingTime(avgVal)}<span className="text-xl ml-1 opacity-50">{type === "weight" ? "kg" : ""}</span></div>
        </div>
        <div className="h-[280px] w-full mb-12">
          <ResponsiveContainer width="100%" height="100%">
            {type === "weight" ? (
              <LineChart data={data} margin={{ left: 0, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 'bold'}} />
                <YAxis domain={[minW, maxW]} axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#999'}} unit="kg" width={55} tickFormatter={(val) => val.toFixed(1)} />
                <Tooltip contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)'}} />
                <Line type="monotone" dataKey="weight" stroke="#8B5CF6" strokeWidth={4} dot={{r: 6, fill: "#8B5CF6", strokeWidth: 2, stroke: "#fff"}} activeDot={{r: 8}} connectNulls />
              </LineChart>
            ) : (
              <BarChart data={data} margin={{ left: 0, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 'bold'}} />
                <YAxis domain={[0, 24]} axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#999'}} unit="h" width={40} />
                <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '20px', border: 'none'}} formatter={(value: number) => [formatFastingTime(value), "단식 시간"]} />
                <Bar dataKey="fasting" fill="#10B981" radius={[10, 10, 10, 10]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const lastWeight = recentData[6]?.weight;

  return (
    <div className="flex flex-col gap-6 pb-32">
      {detailModal && <DetailPopup type={detailModal} />}
      {viewingPhotos && <PhotoViewer srcs={viewingPhotos} onClose={() => setViewingPhotos(null)} />}
      {easterEgg && <HeatmapPopup title={easterEgg.title} logs={currentActiveLogs} color={easterEgg.color} onClose={() => setEasterEgg(null)} />}
      
      {showSettings && (
        <div className="fixed inset-0 z-[250] bg-black/60 backdrop-blur-sm flex items-end justify-center p-4" onClick={() => setShowSettings(false)}>
          <div className="bg-white w-full max-w-[360px] rounded-[40px] p-8 pb-12 animate-modal-up shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black">데이터 설정</h3>
              <button onClick={() => setShowSettings(false)} className="p-2 bg-gray-100 rounded-full"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <button onClick={startEditing} className="w-full p-5 bg-purple-50 rounded-[24px] flex items-center gap-4 active:scale-95 transition-all">
                <div className="p-3 bg-purple-100 text-purple-600 rounded-xl"><Edit2 size={20} /></div>
                <div className="text-left"><p className="font-bold text-gray-900">기록 수정하기</p><p className="text-[10px] text-gray-400 font-bold">과거의 모든 데이터 편집</p></div>
              </button>
              <button onClick={exportData} className="w-full p-5 bg-gray-50 rounded-[24px] flex items-center gap-4 active:scale-95 transition-all">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-xl"><Download size={20} /></div>
                <div className="text-left"><p className="font-bold text-gray-900">데이터 내보내기</p><p className="text-[10px] text-gray-400 font-bold">JSON 파일로 기록 백업</p></div>
              </button>
              <label className="w-full p-5 bg-gray-50 rounded-[24px] flex items-center gap-4 active:scale-95 transition-all cursor-pointer">
                <div className="p-3 bg-green-100 text-green-600 rounded-xl"><Upload size={20} /></div>
                <div className="text-left"><p className="font-bold text-gray-900">데이터 가져오기</p><p className="text-[10px] text-gray-400 font-bold">백업 파일에서 복구</p></div>
                <input type="file" accept=".json" onChange={importData} className="hidden" />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* 헤더 섹션 */}
      <div className="flex justify-between items-center px-2">
        {isEditing ? (
          <>
            <button onClick={cancelEditing} className="p-2 bg-red-50 text-red-500 rounded-xl active:scale-90 transition-transform"><X size={20} /></button>
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-black text-purple-500 uppercase tracking-widest">Editing Mode</span>
              <h3 className="text-lg font-black text-gray-900">기록 수정 중</h3>
            </div>
            <button onClick={saveEditing} className="p-2 bg-green-50 text-green-600 rounded-xl active:scale-90 transition-transform"><Check size={20} /></button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-black">{currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월</h3>
              <button onClick={() => setShowSettings(true)} className="p-2 bg-gray-50 text-gray-400 rounded-xl active:scale-90 transition-transform"><Settings size={18} /></button>
            </div>
            <div className="flex gap-2">
              <button className="p-2 bg-gray-100 rounded-full" onClick={() => { const d = new Date(currentDate); d.setMonth(d.getMonth() - 1); setCurrentDate(d); }}><ChevronLeft size={16} /></button>
              <button className="p-2 bg-gray-100 rounded-full" onClick={() => { const d = new Date(currentDate); d.setMonth(d.getMonth() + 1); setCurrentDate(d); }}><ChevronRight size={16} /></button>
            </div>
          </>
        )}
      </div>

      {/* 달력 섹션 */}
      <section className={`bg-white border rounded-[32px] p-5 shadow-sm transition-all ${isEditing ? "border-purple-200 ring-4 ring-purple-50" : "border-gray-100"}`}>
        <div className="grid grid-cols-7 gap-y-1 text-center">
          {["일", "월", "화", "수", "목", "금", "토"].map((d, i) => <div key={d} className={`text-[10px] font-bold mb-2 ${i === 0 ? "text-red-400" : "text-gray-300"}`}>{d}</div>)}
          {(() => {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            const firstDay = new Date(year, month, 1).getDay();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const daysInPrevMonth = new Date(year, month, 0).getDate();
            const cells = [];
            for (let i = firstDay; i > 0; i--) cells.push({ day: daysInPrevMonth - i + 1, month: "prev", dateStr: "" });
            for (let i = 1; i <= daysInMonth; i++) cells.push({ day: i, month: "curr", dateStr: `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}` });
            const remaining = 42 - cells.length;
            for (let i = 1; i <= remaining; i++) cells.push({ day: i, month: "next", dateStr: "" });
            return cells.map((cell, idx) => {
              const isSelected = selectedDate === cell.dateStr;
              const log = cell.dateStr ? currentActiveLogs[cell.dateStr] : null;
              const hasCustomCompleted = log?.customHabits?.some(h => h.completed);
              return (
                <div key={idx} onClick={() => cell.dateStr && setSelectedDate(cell.dateStr)}
                  className={`relative flex flex-col items-center justify-center min-h-[48px] rounded-2xl transition-all ${cell.month !== "curr" ? "opacity-20" : ""} ${isSelected ? (isEditing ? "bg-purple-600 text-white" : "bg-black text-white") : "hover:bg-gray-50"}`}>
                  <span className="text-xs font-bold">{cell.day}</span>
                  <div className="flex gap-0.5 mt-1 h-1">
                    {log?.exercises?.length ? <div className={`w-1 h-1 rounded-full ${isSelected ? "bg-white" : "bg-blue-500"}`} /> : null}
                    {log?.meals?.length ? <div className={`w-1 h-1 rounded-full ${isSelected ? "bg-white" : "bg-green-500"}`} /> : null}
                    {log?.weight ? <div className={`w-1 h-1 rounded-full ${isSelected ? "bg-white" : "bg-purple-500"}`} /> : null}
                    {hasCustomCompleted ? <div className={`w-1 h-1 rounded-full ${isSelected ? "bg-white" : "bg-orange-400"}`} /> : null}
                  </div>
                </div>
              );
            });
          })()}
        </div>
      </section>

      {isEditing ? (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-purple-50 p-6 rounded-[32px] space-y-4">
            <div className="flex items-center gap-3"><Scale className="text-purple-500" size={20} /><span className="font-bold text-purple-900">체중 수정</span></div>
            <div className="flex items-center gap-3 bg-white p-4 rounded-2xl">
              <input type="number" step="0.01" value={selectedLog.weight || ""} onChange={e => updateTempLog(selectedDate, { weight: e.target.value ? parseFloat(e.target.value) : undefined })} placeholder="00.00" className="w-full text-2xl font-black text-purple-600 focus:outline-none bg-transparent" />
              <span className="font-bold text-purple-300">kg</span>
            </div>
          </div>

          <div className="bg-green-50 p-6 rounded-[32px] space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3"><Utensils className="text-green-500" size={20} /><span className="font-bold text-green-900">식단 리스트</span></div>
              <button onClick={() => { const meals = [...(selectedLog.meals || []), { type: "점심", food: "" }]; updateTempLog(selectedDate, { meals }); }} className="p-2 bg-green-100 text-green-600 rounded-xl"><Plus size={16} /></button>
            </div>
            <div className="space-y-3">
              {(selectedLog.meals || []).map((m, i) => (
                <div key={i} className="flex items-center gap-3 bg-white p-3 rounded-2xl shadow-sm">
                  <select value={m.type} onChange={e => { const meals = [...(selectedLog.meals || [])]; meals[i].type = e.target.value; updateTempLog(selectedDate, { meals }); }} className="shrink-0 bg-green-50 text-[10px] font-black text-green-600 p-2 rounded-lg border-none focus:ring-0">
                    {["아침", "점심", "저녁", "간식", "야식"].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <input type="text" value={m.food} onChange={e => { const meals = [...(selectedLog.meals || [])]; meals[i].food = e.target.value; updateTempLog(selectedDate, { meals }); }} placeholder="음식명" className="flex-1 text-sm font-bold text-gray-700 focus:outline-none bg-transparent min-w-0" />
                  <button onClick={() => { const meals = (selectedLog.meals || []).filter((_, idx) => idx !== i); updateTempLog(selectedDate, { meals }); }} className="shrink-0 p-2 text-red-400 bg-red-50 rounded-xl active:bg-red-100"><Trash2 size={16} /></button>
                </div>
              ))}
              {(!selectedLog.meals || selectedLog.meals.length === 0) && <p className="text-center py-4 text-green-300 text-xs font-bold">등록된 식단이 없습니다.</p>}
            </div>
          </div>

          <div className="bg-blue-50 p-6 rounded-[32px] space-y-4">
            <div className="flex items-center gap-3"><Dumbbell className="text-blue-500" size={20} /><span className="font-bold text-blue-900">운동 수정</span></div>
            <div className="grid grid-cols-3 gap-2">
              {["팔", "어깨", "등", "가슴", "하체", "유산소"].map(ex => {
                const isActive = (selectedLog.exercises || []).includes(ex);
                return (
                  <button key={ex} onClick={() => {
                    const currentEx = selectedLog.exercises || [];
                    const exercises = isActive ? currentEx.filter(e => e !== ex) : [...currentEx, ex];
                    updateTempLog(selectedDate, { exercises });
                  }} className={`py-3 rounded-xl text-xs font-bold transition-all ${isActive ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : "bg-white text-blue-300 border border-blue-100"}`}>{ex}</button>
                );
              })}
            </div>
          </div>

          <div className="bg-orange-50 p-6 rounded-[32px] space-y-4">
            <div className="flex items-center gap-3"><Star className="text-orange-500" size={20} /><span className="font-bold text-orange-900">습관 완료 여부</span></div>
            <div className="space-y-2">
              {(selectedLog.customHabits || []).map((h, i) => (
                <button key={h.id} onClick={() => {
                  const habits = [...(selectedLog.customHabits || [])];
                  habits[i].completed = !habits[i].completed;
                  updateTempLog(selectedDate, { customHabits: habits });
                }} className={`w-full p-4 rounded-2xl flex justify-between items-center transition-all ${h.completed ? "bg-orange-500 text-white shadow-lg shadow-orange-200" : "bg-white text-orange-300 border border-orange-100"}`}>
                  <span className="font-bold text-sm">{h.name}</span>
                  {h.completed ? <Check size={18} /> : <div className="w-[18px] h-[18px] border-2 border-orange-100 rounded-full" />}
                </button>
              ))}
              {(!selectedLog.customHabits || selectedLog.customHabits.length === 0) && <p className="text-center py-4 text-orange-300 text-xs font-bold">등록된 커스텀 습관이 없습니다.</p>}
            </div>
          </div>
        </div>
      ) : (
        <>
          <section className="grid grid-cols-2 gap-3">
            <div onClick={() => setDetailModal("weight")} className="bg-purple-50 p-5 rounded-[32px] h-36 flex flex-col justify-between active:scale-95 transition-transform shadow-sm">
              <div className="flex justify-between items-center"><span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Weight Trend</span><Activity size={14} className="text-purple-400" /></div>
              <div className="h-14 w-full"><ResponsiveContainer width="100%" height="100%"><LineChart data={recentData}><YAxis domain={['dataMin - 1', 'dataMax + 1']} hide /><Line type="monotone" dataKey="weight" stroke="#A855F7" strokeWidth={3} dot={false} connectNulls /></LineChart></ResponsiveContainer></div>
              <div className="flex justify-between items-end"><span className="text-xl font-black text-purple-600">{lastWeight || "-"}</span><span className="text-[10px] font-bold text-purple-300">kg</span></div>
            </div>
            <div onClick={() => setDetailModal("fasting")} className="bg-green-50 p-5 rounded-[32px] h-36 flex flex-col justify-between active:scale-95 transition-transform shadow-sm">
              <div className="flex justify-between items-center"><span className="text-[10px] font-bold text-green-400 uppercase tracking-wider">Fasting Avg</span><Clock size={14} className="text-green-400" /></div>
              <div className="h-14 w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={recentData}><Bar dataKey="fasting" fill="#10B981" radius={[4, 4, 4, 4]} /></BarChart></ResponsiveContainer></div>
              <div className="flex justify-between items-end"><span className="text-xl font-black text-green-600">{(recentData.reduce((acc, curr) => acc + curr.fasting, 0) / 7).toFixed(1)}</span><span className="text-[10px] font-bold text-green-300">h</span></div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-lg font-black text-gray-900 px-2">{selectedDate === getLocalDateString(new Date()) ? "오늘" : selectedDate}의 기록</h3>
            {!selectedLog.weight && !selectedLog.meals?.length && !selectedLog.exercises?.length && !selectedLog.fastingHours && !selectedLog.customHabits?.some(h => h.completed) ? (
              <div className="p-10 text-center bg-gray-50 rounded-[32px] border-2 border-dashed border-gray-100"><p className="text-gray-400 text-xs font-bold">기록이 없습니다.</p></div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {selectedLog.weight && (
                  <div onClick={() => setEasterEgg({title: "체중", color: "bg-purple-500"})} className="p-5 bg-white border border-gray-100 rounded-[28px] flex justify-between items-center shadow-sm ring-2 ring-purple-50 active:scale-95 transition-all cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-50 rounded-xl text-purple-500"><Scale size={18} /></div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-700">체중</span>
                        {selectedLog.weightPhotos && selectedLog.weightPhotos.length > 0 && (
                          <button onClick={(e) => { e.stopPropagation(); setViewingPhotos(selectedLog.weightPhotos!); setCurrentPhotoIdx(0); }} className="p-1.5 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-colors">
                            <Camera size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                    <span className="text-lg font-black text-purple-600">{selectedLog.weight}kg</span>
                  </div>
                )}
                {selectedLog.fastingHours !== undefined && selectedLog.fastingHours > 0 && (
                  <div onClick={() => setEasterEgg({title: "단식", color: "bg-green-500"})} className="p-5 bg-white border border-gray-100 rounded-[28px] flex justify-between items-center shadow-sm ring-2 ring-green-50 active:scale-95 transition-all">
                    <div className="flex items-center gap-3"><div className="p-2 bg-green-50 rounded-xl text-green-500"><Clock size={18} /></div><span className="font-bold text-gray-700">단식 시간</span></div>
                    <span className="text-lg font-black text-green-600">{formatFastingTime(selectedLog.fastingHours)}</span>
                  </div>
                )}
                {selectedLog.meals && selectedLog.meals.length > 0 && (
                  <div onClick={() => setEasterEgg({title: "식사", color: "bg-emerald-500"})} className="p-5 bg-white border border-gray-100 rounded-[28px] space-y-3 shadow-sm ring-2 ring-emerald-50 active:scale-95 transition-all">
                    <div className="flex items-center gap-3"><div className="p-2 bg-green-50 rounded-xl text-green-500"><Utensils size={18} /></div><span className="font-bold text-gray-700">식단 리스트</span></div>
                    {selectedLog.meals.map((m, i) => (
                      <div key={i} className="flex items-center py-2 border-b border-gray-50 last:border-0">
                        <span className="shrink-0 text-[10px] font-black text-green-600 bg-green-50 px-2 py-1 rounded-lg min-w-[40px] text-center">{m.type}</span>
                        <span className="flex-1 text-sm font-medium text-gray-600 truncate ml-3">{m.food}</span>
                      </div>
                    ))}
                  </div>
                )}
                {selectedLog.exercises && selectedLog.exercises.length > 0 && (
                  <div onClick={() => setEasterEgg({title: "운동", color: "bg-blue-500"})} className="p-5 bg-white border border-gray-100 rounded-[28px] space-y-3 shadow-sm ring-2 ring-blue-50 active:scale-95 transition-all">
                    <div className="flex items-center gap-3"><div className="p-2 bg-blue-50 rounded-xl text-blue-500"><Dumbbell size={18} /></div><span className="font-bold text-gray-700">오늘의 운동</span></div>
                    <div className="flex flex-wrap gap-2">
                      {selectedLog.exercises.map((ex, i) => <span key={i} className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold border border-blue-100">{ex}</span>)}
                    </div>
                  </div>
                )}
                {selectedLog.customHabits && selectedLog.customHabits.some(h => h.completed) && (
                  <div className="p-5 bg-white border border-gray-100 rounded-[28px] space-y-3 shadow-sm ring-2 ring-orange-50 active:scale-95 transition-all">
                    <div className="flex items-center gap-3"><div className="p-2 bg-orange-50 rounded-xl text-orange-500"><Star size={18} /></div><span className="font-bold text-gray-700">완료한 습관</span></div>
                    <div className="flex flex-wrap gap-2">
                      {selectedLog.customHabits.filter(h => h.completed).map((h, i) => (
                        <span key={i} 
                          onClick={(e) => { e.stopPropagation(); setEasterEgg({title: h.name, color: getHabitColorClasses(h.color).split(' ')[1].replace('text-', 'bg-')}); }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all active:scale-90 cursor-pointer ${getHabitColorClasses(h.color)}`}
                        >
                          {h.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
};

export default StatsView;