"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Utensils, 
  Dumbbell, 
  Scale, 
  Plus, 
  Calendar, 
  TrendingUp, 
  MoreHorizontal,
  Clock,
  X,
  Check,
  Camera,
  ChevronRight
} from "lucide-react";
import HabitCard, { HabitColor } from "../components/HabitCard";
import StatsView from "../components/StatsView";

interface CustomHabit {
  id: string;
  name: string;
  color: HabitColor;
  completed: boolean;
}

interface MealRecord {
  type: string;
  food: string;
}

const getLocalDateString = (date: Date) => {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().split('T')[0];
};

const Modal = ({ title, onClose, children }: { title: string, onClose: () => void, children: React.ReactNode }) => (
  <div className="fixed inset-0 z-[100] flex items-end justify-center modal-overlay">
    <div className="bg-white w-full max-w-[390px] rounded-t-[40px] p-8 pb-12 animate-modal-up shadow-2xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">{title}</h2>
        <button onClick={onClose} className="p-2 bg-gray-100 rounded-full text-gray-400">
          <X size={20} />
        </button>
      </div>
      {children}
    </div>
  </div>
);

export default function Home() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showModal, setShowModal] = useState<string | null>(null);
  
  const [logs, setLogs] = useState<Record<string, any>>({});
  const [fasting, setFasting] = useState(false);
  const [fastingStartTime, setFastingStartTime] = useState<number | null>(null);
  const [fastingHours, setFastingHours] = useState<number>(0);
  const [weight, setWeight] = useState("");
  const [weightPhotos, setWeightPhotos] = useState<string[]>([]);
  const [meals, setMeals] = useState<MealRecord[]>([]);
  const [exercises, setExercises] = useState<string[]>([]);
  const [customHabits, setCustomHabits] = useState<CustomHabit[]>([]);
  const [editingHabit, setEditingHabit] = useState<CustomHabit | null>(null);

  const [selectedMealType, setSelectedMealType] = useState<string | null>(null);
  const [foodInput, setFoodInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("habit_data");
    if (saved) {
      const parsed = JSON.parse(saved);
      setFasting(parsed.fasting || false);
      setFastingStartTime(parsed.fastingStartTime || null);
      setFastingHours(parsed.fastingHours || 0);
      setWeight(parsed.weight || "");
      setWeightPhotos(parsed.weightPhotos || (parsed.weightPhoto ? [parsed.weightPhoto] : []));
      setMeals(parsed.meals || []);
      setExercises(parsed.exercises || []);
      setCustomHabits(parsed.customHabits || []);
    }
    const savedLogs = localStorage.getItem("habit_logs");
    if (savedLogs) setLogs(JSON.parse(savedLogs));
  }, []);

  useEffect(() => {
    const data = { fasting, fastingStartTime, fastingHours, weight, weightPhotos, meals, exercises, customHabits };
    localStorage.setItem("habit_data", JSON.stringify(data));
    
    const today = getLocalDateString(new Date());
    const savedLogs = localStorage.getItem("habit_logs");
    const currentLogs = savedLogs ? JSON.parse(savedLogs) : {};
    currentLogs[today] = { 
      weight: weight ? parseFloat(weight) : null, 
      weightPhotos, 
      fastingHours, 
      meals, 
      exercises,
      customHabits 
    };
    localStorage.setItem("habit_logs", JSON.stringify(currentLogs));
    setLogs(currentLogs);
  }, [fasting, fastingStartTime, fastingHours, weight, weightPhotos, meals, exercises, customHabits]);

  const handleStartFasting = () => {
    setFasting(true);
    setFastingStartTime(Date.now());
    setFastingHours(0);
    setShowModal(null);
  };

  const confirmMeal = () => {
    if (selectedMealType && foodInput) {
      setMeals([...meals, { type: selectedMealType, food: foodInput }]);
      setFoodInput("");
      setSelectedMealType(null);
      if (fasting && fastingStartTime) { 
        const duration = (Date.now() - fastingStartTime) / (1000 * 60 * 60);
        setFastingHours(duration);
        setFasting(false); 
        setFastingStartTime(null); 
      }
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newPhotos = [...weightPhotos];
      Array.from(files).forEach(file => {
        if (newPhotos.length < 5) {
          const reader = new FileReader();
          reader.onloadend = () => {
            setWeightPhotos(prev => {
              if (prev.length < 5) return [...prev, reader.result as string];
              return prev;
            });
          };
          reader.readAsDataURL(file);
        }
      });
    }
  };

  const deletePhoto = (idx: number) => {
    setWeightPhotos(weightPhotos.filter((_, i) => i !== idx));
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <header className="px-6 pt-12 pb-4 flex justify-between items-end bg-white">
        <div>
          <h2 className="text-gray-400 text-sm font-medium">{getLocalDateString(new Date())}</h2>
          <h1 className="text-3xl font-bold tracking-tight">오늘의 습관</h1>
        </div>
        <button onClick={() => setActiveTab(activeTab === "dashboard" ? "stats" : "dashboard")} className="p-3 bg-gray-100 rounded-2xl text-gray-600 active:scale-90 transition-transform">
          {activeTab === "dashboard" ? <TrendingUp size={24} /> : <Calendar size={24} />}
        </button>
      </header>

      <main className="flex-1 overflow-y-auto px-6 pb-24 pt-4 custom-scrollbar">
        {activeTab === "dashboard" ? (
          <div className="grid grid-cols-2 gap-4">
            <HabitCard title="체중 & 사진 기록" icon={Scale} color="purple" className="col-span-2" onClick={() => setShowModal("weight")}>
              <div className="flex items-center justify-between h-full">
                <div className="text-3xl font-black text-purple-600">{weight ? `${weight} kg` : "입력 필요"}</div>
                <div className="flex gap-2">
                  {weightPhotos.length > 0 ? (
                    <div className="flex -space-x-4">
                      {weightPhotos.slice(0, 3).map((p, i) => (
                        <div key={i} className="w-14 h-14 rounded-xl border-2 border-white overflow-hidden shadow-sm">
                          <img src={p} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      ))}
                      {weightPhotos.length > 3 && (
                        <div className="w-14 h-14 rounded-xl border-2 border-white bg-purple-50 flex items-center justify-center text-[10px] font-black text-purple-400 shadow-sm">
                          +{weightPhotos.length - 3}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-14 h-14 bg-purple-50 rounded-xl flex items-center justify-center text-purple-300">
                      <Camera size={24} />
                    </div>
                  )}
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handlePhotoUpload} />
              </div>
            </HabitCard>

            <HabitCard title="식사 & 단식" icon={Utensils} color="green" onClick={() => setShowModal("meal")}>
              <div className="flex flex-col h-full">
                <div className="flex-1 flex flex-col justify-center gap-1">
                  {meals.length > 0 ? meals.slice(-2).map((m, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-[9px] font-black text-green-700 bg-green-100 px-1.5 py-0.5 rounded-md min-w-[32px] text-center">{m.type}</span>
                      <span className="text-[10px] font-medium text-green-900 truncate">{m.food}</span>
                    </div>
                  )) : <span className="text-xs text-green-300">식사 기록 없음</span>}
                </div>
                {fasting && (
                  <div className="mt-auto py-1 border-t border-green-200/50 text-[10px] font-bold text-green-600 flex items-center gap-1">
                    <Clock size={10} /> 단식 진행 중
                  </div>
                )}
              </div>
            </HabitCard>

            <HabitCard title="오늘의 운동" icon={Dumbbell} color="blue" onClick={() => setShowModal("exercise")}>
              <div className="flex flex-wrap gap-1 mt-1">
                {exercises.length > 0 ? exercises.map(type => (
                  <span key={type} className="bg-blue-100 px-2 py-0.5 rounded-full text-[10px] font-bold">{type}</span>
                )) : <span className="text-xs text-blue-300">운동 기록 없음</span>}
              </div>
            </HabitCard>

            {customHabits.map((habit) => (
              <HabitCard 
                key={habit.id} title={habit.name} icon={MoreHorizontal} 
                color={habit.color}
                isCompleted={habit.completed} onClick={() => setCustomHabits(customHabits.map(h => h.id === habit.id ? { ...h, completed: !h.completed } : h))}
              >
                <div className="flex items-end justify-between h-full">
                  <button onClick={(e) => { e.stopPropagation(); setEditingHabit(habit); setShowModal("custom-edit"); }} className="p-1.5 bg-black/5 rounded-lg text-black/30 hover:text-black">편집</button>
                  {habit.completed && <Check size={16} />}
                </div>
              </HabitCard>
            ))}

            <button 
              onClick={() => { const newHabit: CustomHabit = { id: Date.now().toString(), name: "새 습관", color: "orange", completed: false }; setCustomHabits([...customHabits, newHabit]); setEditingHabit(newHabit); setShowModal("custom-edit"); }}
              className="flex flex-col items-center justify-center p-4 rounded-3xl border-2 border-dashed border-gray-200 text-gray-300 h-[180px] active:scale-95 transition-transform"
            >
              <Plus size={32} /><span className="text-sm font-bold mt-2">습관 추가</span>
            </button>
          </div>
        ) : ( <StatsView externalLogs={logs} /> )}
      </main>

      {showModal === "weight" && (
        <Modal title="체중 & 사진 기록" onClose={() => setShowModal(null)}>
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <input autoFocus type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="00.0" className="flex-1 text-5xl font-black text-center focus:outline-none bg-gray-50 p-6 rounded-[32px]" />
              <span className="text-2xl font-bold text-gray-400">kg</span>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center px-1">
                <span className="text-sm font-bold text-gray-400">사진 기록 (최대 5장)</span>
                <span className="text-xs font-black text-purple-500">{weightPhotos.length}/5</span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {weightPhotos.map((p, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden group">
                    <img src={p} alt="Preview" className="w-full h-full object-cover" />
                    <button onClick={() => deletePhoto(i)} className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full"><X size={10} /></button>
                  </div>
                ))}
                {weightPhotos.length < 5 && (
                  <button onClick={() => fileInputRef.current?.click()} className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-300 hover:border-purple-300 hover:text-purple-300 transition-colors">
                    <Plus size={20} />
                  </button>
                )}
              </div>
            </div>

            <button onClick={() => setShowModal(null)} className="w-full py-4 bg-purple-600 text-white rounded-[24px] font-bold text-lg shadow-lg shadow-purple-200">저장하기</button>
          </div>
        </Modal>
      )}

      {showModal === "meal" && (
        <Modal title="식사 기록" onClose={() => setShowModal(null)}>
          <div className="space-y-6">
            {!selectedMealType ? (
              <div className="grid grid-cols-2 gap-3">
                {["아침", "점심", "저녁", "간식", "야식"].map(m => (
                  <button key={m} onClick={() => setSelectedMealType(m)} className="py-4 bg-gray-50 rounded-2xl font-bold text-lg hover:bg-green-500 hover:text-white transition-all flex justify-between px-6 items-center group">{m} <ChevronRight size={18} className="text-gray-300 group-hover:text-white" /></button>
                ))}
              </div>
            ) : (
              <div className="space-y-4 animate-modal-up">
                <div className="text-sm font-bold text-green-600 mb-1">{selectedMealType}에 무엇을 드셨나요?</div>
                <input autoFocus type="text" value={foodInput} onChange={(e) => setFoodInput(e.target.value)} placeholder="예: 연어 샐러드" className="w-full text-xl font-bold p-5 bg-gray-50 rounded-[24px] focus:outline-none border-2 border-transparent focus:border-green-500 transition-all" />
                <div className="flex gap-3"><button onClick={() => setSelectedMealType(null)} className="flex-1 py-4 bg-gray-100 text-gray-400 rounded-[20px] font-bold">취소</button><button onClick={confirmMeal} className="flex-[2] py-4 bg-green-600 text-white rounded-[20px] font-bold">기록 완료</button></div>
              </div>
            )}
            {!selectedMealType && ( <> <div className="h-px bg-gray-100" /> <button onClick={handleStartFasting} className={`w-full py-5 rounded-[24px] font-bold text-lg ${fasting ? "bg-gray-100 text-gray-400" : "bg-black text-white"}`} disabled={fasting}>{fasting ? "단식 진행 중" : "단식 시작하기"}</button> </> )}
          </div>
        </Modal>
      )}

      {showModal === "exercise" && (
        <Modal title="오늘의 운동" onClose={() => setShowModal(null)}>
          <div className="grid grid-cols-2 gap-3 mb-6">
            {["팔", "어깨", "등", "가슴", "하체", "유산소"].map(type => (
              <button key={type} onClick={() => setExercises(exercises.includes(type) ? exercises.filter(e => e !== type) : [...exercises, type])} className={`py-4 rounded-2xl font-bold transition-all border-2 ${exercises.includes(type) ? "bg-blue-600 border-blue-600 text-white" : "bg-white border-gray-100 text-gray-400"}`}>{type}</button>
            ))}
          </div>
          <button onClick={() => setShowModal(null)} className="w-full py-4 bg-blue-600 text-white rounded-[24px] font-bold text-lg">기록 완료</button>
        </Modal>
      )}

      {showModal === "custom-edit" && editingHabit && (
        <Modal title="습관 편집" onClose={() => setShowModal(null)}>
          <div className="space-y-6">
            <input type="text" value={editingHabit.name} onChange={(e) => setEditingHabit({...editingHabit, name: e.target.value})} className="w-full text-2xl font-bold p-4 bg-gray-50 rounded-2xl focus:outline-none" />
            <div className="flex gap-3 justify-center">
              {(["orange", "pink", "teal", "indigo", "amber"] as HabitColor[]).map(c => (
                <button 
                  key={c} onClick={() => setEditingHabit({...editingHabit, color: c})}
                  className={`w-10 h-10 rounded-full border-4 ${editingHabit.color === c ? "border-black" : "border-transparent"}`}
                  style={{ backgroundColor: c === 'orange' ? '#F97316' : c === 'pink' ? '#EC4899' : c === 'teal' ? '#14B8A6' : c === 'indigo' ? '#6366F1' : '#F59E0B' }}
                />
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setCustomHabits(customHabits.filter(h => h.id !== editingHabit.id)); setShowModal(null); }} className="flex-1 py-4 bg-red-50 text-red-500 rounded-[24px] font-bold">삭제</button>
              <button onClick={() => { setCustomHabits(customHabits.map(h => h.id === editingHabit.id ? editingHabit : h)); setShowModal(null); }} className="flex-[2] py-4 bg-black text-white rounded-[24px] font-bold">저장</button>
            </div>
          </div>
        </Modal>
      )}

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[80%] bg-white/80 backdrop-blur-xl border border-white/50 shadow-2xl rounded-[32px] p-2 flex justify-between items-center z-[80]">
        <button onClick={() => setActiveTab("dashboard")} className={`flex-1 py-3 rounded-[24px] flex flex-col items-center gap-1 transition-all ${activeTab === "dashboard" ? "bg-black text-white" : "text-gray-400"}`}>
          <Calendar size={20} /><span className="text-[10px] font-bold">홈</span>
        </button>
        <button onClick={() => setActiveTab("stats")} className={`flex-1 py-3 rounded-[24px] flex flex-col items-center gap-1 transition-all ${activeTab === "stats" ? "bg-black text-white" : "text-gray-400"}`}>
          <TrendingUp size={20} /><span className="text-[10px] font-bold">통계</span>
        </button>
      </div>
    </div>
  );
}