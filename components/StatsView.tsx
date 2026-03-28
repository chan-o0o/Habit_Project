"use client";

import React, { useState, useEffect } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line
} from "recharts";
import { X, TrendingUp, Clock, ChevronLeft, ChevronRight, Scale, Utensils, Dumbbell, Star, Activity, Camera } from "lucide-react";

interface MealRecord { type: string; food: string; }
interface CustomHabit { id: string; name: string; color: string; completed: boolean; }
interface DailyLog { weight?: number; weightPhotos?: string[]; fastingHours?: number; meals?: MealRecord[]; exercises?: string[]; customHabits?: CustomHabit[]; }

const getLocalDateString = (date: Date) => {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().split('T')[0];
};

const formatFastingTime = (hours: number) => {
  if (!hours || hours === 0) return "0h 0m";
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h ${m}m`;
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
    // 커스텀 습관 체크
    return log.customHabits?.find(h => h.name === title && h.completed) ? 1 : 0;
  };

  return (
    <div className="fixed inset-0 z-[300] bg-white/90 backdrop-blur-md flex items-center justify-center p-6 animate-modal-up" onClick={onClose}>
      <div className="bg-white w-full max-w-[340px] p-8 rounded-[40px] shadow-2xl border border-gray-100" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black text-gray-900">{title} 잔디</h3>
          <button onClick={onClose} className="p-2 bg-gray-50 rounded-full"><X size={18} /></button>
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

const StatsView = ({ externalLogs }: { externalLogs?: Record<string, DailyLog> }) => {
  const [logs, setLogs] = useState<Record<string, DailyLog>>({});
  const [selectedDate, setSelectedDate] = useState<string>(getLocalDateString(new Date()));
  const [currentDate, setCurrentDate] = useState(new Date());
  const [detailModal, setDetailModal] = useState<"weight" | "fasting" | null>(null);
  const [chartWeeksOffset, setChartWeeksOffset] = useState(0);
  const [viewingPhotos, setViewingPhotos] = useState<string[] | null>(null);
  const [currentPhotoIdx, setCurrentPhotoIdx] = useState(0);
  const [easterEgg, setEasterEgg] = useState<{title: string, color: string} | null>(null);

  useEffect(() => {
    if (externalLogs) {
      setLogs(externalLogs);
    } else {
      const savedLogs = localStorage.getItem("habit_logs");
      if (savedLogs) setLogs(JSON.parse(savedLogs));
    }
  }, [externalLogs]);

  const selectedLog = logs[selectedDate];

  const getChartData = (daysCount = 7, weeksOffset = 0) => {
    const data = [];
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() - (weeksOffset * 7));
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() - i);
      const dateStr = getLocalDateString(d);
      const log = logs[dateStr];
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
    <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center p-6" onClick={onClose}>
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
    
    // Safety check for min/max calculation
    const currentMin = validWeights.length ? Math.min(...validWeights) : 60;
    const currentMax = validWeights.length ? Math.max(...validWeights) : 100;
    const minW = currentMin - 1;
    const maxW = currentMax + 1;
    
    const validCount = type === "weight" ? validWeights.length : 7;
    const total = data.reduce((acc, curr) => acc + (type === "weight" ? (curr.weight || 0) : curr.fasting), 0);
    const avgVal = total / (validCount || 1);

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
          <div className="text-4xl font-black">
            {type === "weight" ? avgVal.toFixed(1) : formatFastingTime(avgVal)}
            <span className="text-xl ml-1 opacity-50">{type === "weight" ? "kg" : ""}</span>
          </div>
        </div>

        <div className="h-[280px] w-full mb-12">
          <ResponsiveContainer width="100%" height="100%">
            {type === "weight" ? (
              <LineChart data={data} margin={{ left: -10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 'bold'}} />
                <YAxis domain={[minW, maxW]} axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#999'}} unit="kg" width={40} />
                <Tooltip contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)'}} />
                <Line type="monotone" dataKey="weight" stroke="#8B5CF6" strokeWidth={4} dot={{r: 6, fill: "#8B5CF6", strokeWidth: 2, stroke: "#fff"}} activeDot={{r: 8}} connectNulls />
              </LineChart>
            ) : (
              <BarChart data={data} margin={{ left: -10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 'bold'}} />
                <YAxis domain={[0, 24]} axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#999'}} unit="h" width={40} />
                <Tooltip 
                  cursor={{fill: '#f3f4f6'}} 
                  contentStyle={{borderRadius: '20px', border: 'none'}}
                  formatter={(value: number) => [formatFastingTime(value), "단식 시간"]}
                />
                <Bar dataKey="fasting" fill="#10B981" radius={[10, 10, 10, 10]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        <div className="space-y-3 mb-20">
          <h3 className="text-lg font-bold px-2">기록 로그</h3>
          {data.slice().reverse().map((item, idx) => (
            <div key={idx} 
              onClick={() => item.photos.length > 0 && (setViewingPhotos(item.photos), setCurrentPhotoIdx(0))}
              className={`flex justify-between items-center p-5 bg-gray-50 rounded-[24px] ${item.photos.length > 0 ? "ring-2 ring-purple-100 active:scale-95 transition-all" : ""}`}>
              <div className="flex items-center gap-3">
                <div className="flex flex-col">
                  <span className="font-bold text-gray-900">{item.fullDate}</span>
                  <span className="text-[10px] text-gray-400 font-bold">{item.name}요일</span>
                </div>
                {item.photos.length > 0 && (
                  <div className="flex items-center gap-1.5 p-1.5 bg-purple-100 text-purple-600 rounded-lg">
                    <Camera size={14} />
                    <span className="text-[10px] font-black">{item.photos.length}</span>
                  </div>
                )}
              </div>
              <span className="font-black text-xl">{type === "weight" ? (item.weight ? `${item.weight}kg` : "-") : formatFastingTime(item.fasting)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const lastWeight = recentData[6]?.weight;

  return (
    <div className="flex flex-col gap-6 pb-32">
      {detailModal && <DetailPopup type={detailModal} />}
      {viewingPhotos && <PhotoViewer srcs={viewingPhotos} onClose={() => setViewingPhotos(null)} />}
      {easterEgg && <HeatmapPopup title={easterEgg.title} logs={logs} color={easterEgg.color} onClose={() => setEasterEgg(null)} />}
      
      <div className="flex justify-between items-center px-2">
        <h3 className="text-xl font-black">{currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월</h3>
        <div className="flex gap-2">
          <button className="p-2 bg-gray-100 rounded-full" onClick={() => { const d = new Date(currentDate); d.setMonth(d.getMonth() - 1); setCurrentDate(d); }}><ChevronLeft size={16} /></button>
          <button className="p-2 bg-gray-100 rounded-full" onClick={() => { const d = new Date(currentDate); d.setMonth(d.getMonth() + 1); setCurrentDate(d); }}><ChevronRight size={16} /></button>
        </div>
      </div>

      <section className="bg-white border border-gray-100 rounded-[32px] p-5 shadow-sm">
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
              const log = cell.dateStr ? logs[cell.dateStr] : null;
              return (
                <div key={idx} onClick={() => cell.dateStr && setSelectedDate(cell.dateStr)}
                  className={`relative flex flex-col items-center justify-center min-h-[48px] rounded-2xl transition-all ${cell.month !== "curr" ? "opacity-20" : ""} ${isSelected ? "bg-black text-white" : "hover:bg-gray-50"}`}>
                  <span className="text-xs font-bold">{cell.day}</span>
                  <div className="flex gap-0.5 mt-1 h-1">
                    {log?.exercises?.length ? <div className="w-1 h-1 rounded-full bg-blue-500" /> : null}
                    {log?.meals?.length ? <div className="w-1 h-1 rounded-full bg-green-500" /> : null}
                    {log?.weight ? <div className="w-1 h-1 rounded-full bg-purple-500" /> : null}
                    {log?.customHabits?.some(h => h.completed) ? <div className="w-1 h-1 rounded-full bg-orange-400" /> : null}
                  </div>
                </div>
              );
            });
          })()}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <div onClick={() => setDetailModal("weight")} className="bg-purple-50 p-5 rounded-[32px] h-36 flex flex-col justify-between active:scale-95 transition-transform shadow-sm">
          <div className="flex justify-between items-center"><span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Weight Trend</span><Activity size={14} className="text-purple-400" /></div>
          <div className="h-14 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={recentData}>
                <YAxis domain={['dataMin - 1', 'dataMax + 1']} hide />
                <Line type="monotone" dataKey="weight" stroke="#A855F7" strokeWidth={3} dot={false} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between items-end"><span className="text-xl font-black text-purple-600">{lastWeight || "-"}</span><span className="text-[10px] font-bold text-purple-300">kg</span></div>
        </div>
        <div onClick={() => setDetailModal("fasting")} className="bg-green-50 p-5 rounded-[32px] h-36 flex flex-col justify-between active:scale-95 transition-transform shadow-sm">
          <div className="flex justify-between items-center"><span className="text-[10px] font-bold text-green-400 uppercase tracking-wider">Fasting Avg</span><Clock size={14} className="text-green-400" /></div>
          <div className="h-14 w-full">
            <ResponsiveContainer width="100%" height="100%"><BarChart data={recentData}><Bar dataKey="fasting" fill="#10B981" radius={[4, 4, 4, 4]} /></BarChart></ResponsiveContainer>
          </div>
          <div className="flex justify-between items-end"><span className="text-xl font-black text-green-600">{(recentData.reduce((acc, curr) => acc + curr.fasting, 0) / 7).toFixed(1)}</span><span className="text-[10px] font-bold text-green-300">h</span></div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-black text-gray-900 px-2">{selectedDate === getLocalDateString(new Date()) ? "오늘" : selectedDate}의 기록</h3>
        {!selectedLog ? (
          <div className="p-10 text-center bg-gray-50 rounded-[32px] border-2 border-dashed border-gray-100"><p className="text-gray-400 text-xs font-bold">기록이 없습니다.</p></div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {selectedLog.weight && (
              <div 
                onClick={() => setEasterEgg({title: "체중", color: "bg-purple-500"})}
                className={`p-5 bg-white border border-gray-100 rounded-[28px] flex justify-between items-center shadow-sm ring-2 ring-purple-50 active:scale-95 transition-all`}>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-50 rounded-xl text-purple-500"><Scale size={18} /></div>
                  <span className="font-bold text-gray-700">체중</span>
                  <div onClick={(e) => { e.stopPropagation(); if(selectedLog.weightPhotos && selectedLog.weightPhotos.length > 0) { setViewingPhotos(selectedLog.weightPhotos); setCurrentPhotoIdx(0); } }} className="flex items-center gap-1.5 p-1.5 bg-purple-100 text-purple-600 rounded-lg">
                    <Camera size={12} />
                    <span className="text-[9px] font-black">{selectedLog.weightPhotos?.length || 0}</span>
                  </div>
                </div>
                <span className="text-lg font-black text-purple-600">{selectedLog.weight}kg</span>
              </div>
            )}
            {selectedLog.fastingHours !== undefined && (
              <div 
                onClick={() => setEasterEgg({title: "단식", color: "bg-green-500"})}
                className="p-5 bg-white border border-gray-100 rounded-[28px] flex justify-between items-center shadow-sm ring-2 ring-green-50 active:scale-95 transition-all">
                <div className="flex items-center gap-3"><div className="p-2 bg-green-50 rounded-xl text-green-500"><Clock size={18} /></div><span className="font-bold text-gray-700">단식 시간</span></div>
                <span className="text-lg font-black text-green-600">{formatFastingTime(selectedLog.fastingHours)}</span>
              </div>
            )}
            {selectedLog.meals && selectedLog.meals.length > 0 && (
              <div onClick={() => setEasterEgg({title: "식사", color: "bg-emerald-500"})} className="p-5 bg-white border border-gray-100 rounded-[28px] space-y-3 shadow-sm active:scale-95 transition-all ring-2 ring-emerald-50">
                <div className="flex items-center gap-3"><div className="p-2 bg-green-50 rounded-xl text-green-500"><Utensils size={18} /></div><span className="font-bold text-gray-700">식단 리스트</span></div>
                {selectedLog.meals.map((m, i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                    <span className="text-[10px] font-black text-green-600 bg-green-50 px-2 py-1 rounded-lg">{m.type}</span>
                    <span className="text-sm font-medium text-gray-600">{m.food}</span>
                  </div>
                ))}
              </div>
            )}
            {selectedLog.exercises && selectedLog.exercises.length > 0 && (
              <div onClick={() => setEasterEgg({title: "운동", color: "bg-blue-500"})} className="p-5 bg-white border border-gray-100 rounded-[28px] space-y-3 shadow-sm active:scale-95 transition-all ring-2 ring-blue-50">
                <div className="flex items-center gap-3"><div className="p-2 bg-blue-50 rounded-xl text-blue-500"><Dumbbell size={18} /></div><span className="font-bold text-gray-700">오늘의 운동</span></div>
                <div className="flex flex-wrap gap-2">
                  {selectedLog.exercises.map((ex, i) => <span key={i} className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold border border-blue-100">{ex}</span>)}
                </div>
              </div>
            )}
            {selectedLog.customHabits && selectedLog.customHabits.some(h => h.completed) && (
              <div className="p-5 bg-white border border-gray-100 rounded-[28px] space-y-3 shadow-sm">
                <div className="flex items-center gap-3"><div className="p-2 bg-orange-50 rounded-xl text-orange-500"><Star size={18} /></div><span className="font-bold text-gray-700">완료한 습관</span></div>
                <div className="flex flex-wrap gap-2">
                  {selectedLog.customHabits.filter(h => h.completed).map((h, i) => (
                    <span key={i} 
                      onClick={() => setEasterEgg({title: h.name, color: "bg-orange-400"})}
                      className="px-3 py-1.5 bg-orange-50 text-orange-600 rounded-xl text-xs font-bold border border-orange-100 active:scale-90 transition-transform cursor-pointer">
                      {h.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
};

export default StatsView;