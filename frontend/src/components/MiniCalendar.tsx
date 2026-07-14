import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function MiniCalendar({ ideas, onDateSelect, selectedDate }: { ideas: any[], onDateSelect: (d: string | null) => void, selectedDate: string | null }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  // Create an array of event dates (YYYY-M-D) to match correctly
  const eventDates = ideas.map(idea => {
    const d = new Date(idea.eventDate);
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  });

  return (
    <div className="glass-panel border border-darkBorder rounded-2xl p-4 mt-4 select-none">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-white text-sm font-outfit tracking-wide">{monthNames[month]} {year}</h3>
        <div className="flex gap-1">
          <button onClick={prevMonth} className="p-1 hover:bg-slate-800 rounded-md text-slate-400">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={nextMonth} className="p-1 hover:bg-slate-800 rounded-md text-slate-400">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-slate-500 mb-2">
        <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} className="p-1"></div>
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateStr = `${year}-${month}-${day}`;
          const hasEvent = eventDates.includes(dateStr);
          const isSelected = selectedDate === dateStr;
          
          return (
            <div 
              key={day}
              onClick={() => {
                if (isSelected) onDateSelect(null);
                else onDateSelect(dateStr);
              }}
              className={`p-1.5 rounded-md cursor-pointer transition-colors ${
                isSelected ? 'bg-indigo-600 text-white font-bold' : 
                hasEvent ? 'bg-slate-800 text-indigo-300 font-bold hover:bg-slate-700' : 'text-slate-400 hover:bg-slate-800/50'
              }`}
            >
              {day}
            </div>
          );
        })}
      </div>
      
      {selectedDate && (
        <div className="mt-3 text-center">
          <button 
            onClick={() => onDateSelect(null)}
            className="text-[10px] text-slate-500 hover:text-slate-300"
          >
            Clear Date Filter
          </button>
        </div>
      )}
    </div>
  );
}
