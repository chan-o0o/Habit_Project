import React from "react";
import { LucideIcon } from "lucide-react";

export type HabitColor = "blue" | "green" | "purple" | "gray" | "yellow" | "orange" | "pink" | "teal" | "indigo" | "amber";

interface HabitCardProps {
  title: string;
  icon: LucideIcon;
  color: HabitColor;
  children?: React.ReactNode;
  onClick?: () => void;
  isCompleted?: boolean;
  className?: string;
}

const HabitCard: React.FC<HabitCardProps> = ({
  title,
  icon: Icon,
  color,
  children,
  onClick,
  isCompleted = false,
  className = "",
}) => {
  const colorMap: Record<HabitColor, string> = {
    blue: "bg-blue-50 border-blue-100 text-blue-600",
    green: "bg-green-50 border-green-100 text-green-600",
    purple: "bg-purple-50 border-purple-100 text-purple-600",
    gray: "bg-gray-50 border-gray-200 text-gray-600",
    yellow: "bg-yellow-50 border-yellow-100 text-yellow-600",
    orange: "bg-orange-50 border-orange-100 text-orange-600",
    pink: "bg-pink-50 border-pink-100 text-pink-600",
    teal: "bg-teal-50 border-teal-100 text-teal-600",
    indigo: "bg-indigo-50 border-indigo-100 text-indigo-600",
    amber: "bg-amber-50 border-amber-100 text-amber-600",
  };

  const activeColorMap: Record<HabitColor, string> = {
    blue: "bg-blue-500 text-white",
    green: "bg-green-500 text-white",
    purple: "bg-purple-500 text-white",
    gray: "bg-gray-500 text-white",
    yellow: "bg-yellow-500 text-white",
    orange: "bg-orange-500 text-white",
    pink: "bg-pink-500 text-white",
    teal: "bg-teal-500 text-white",
    indigo: "bg-indigo-500 text-white",
    amber: "bg-amber-500 text-white",
  };

  return (
    <div
      onClick={onClick}
      className={`card-press relative flex flex-col p-4 rounded-3xl border transition-all h-[180px] w-full overflow-hidden ${
        isCompleted ? activeColorMap[color] : colorMap[color]
      } ${className}`}
    >
      <div className="flex justify-between items-start mb-2">
        <Icon size={24} className={isCompleted ? "text-white" : ""} />
        {isCompleted && (
          <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
        )}
      </div>
      <h3 className="text-lg font-bold mb-1 leading-tight">{title}</h3>
      <div className="flex-1 text-sm opacity-80 overflow-hidden">
        {children}
      </div>
    </div>
  );
};

export default HabitCard;