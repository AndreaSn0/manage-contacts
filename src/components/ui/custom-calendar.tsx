import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Phone, FileText } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { isToday, isThisMonth } from 'date-fns';

interface DayData {
  contracts: number;
  calls: number;
}

interface CalendarProps {
  selected?: Date | null;
  onSelect?: (date: Date) => void;
  onChange?: (changed: boolean) => void;  // Modify this prop to return a boolean
}

export default function CustomCalendar({ selected, onSelect, onChange }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [monthData, setMonthData] = useState<{ [key: number]: DayData }>({});
  const [contactCounts, setContactCounts] = useState<{ date: string; count: number }[]>([]);

  const daysOfWeek = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
  const months = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
  ];

  useEffect(() => {
    const fetchContactCounts = async () => {
      try {
        const response = await fetch(`/api/contacts?range=true`);
        const data = await response.json();
        setContactCounts(data);
      } catch (error) {
        console.error("Error fetching contact counts:", error);
      }
    };

    fetchContactCounts();
  }, []);

  const getDayData = (date: Date): DayData => {
    const previousDate = new Date(date);
    previousDate.setDate(previousDate.getDate() + 1);
    const formattedDate = previousDate.toISOString().split('T')[0]; 
  
    const contactCountEntry = contactCounts.find(contact => contact.date === formattedDate);
  
    return {
      contracts: 0,
      calls: contactCountEntry ? contactCountEntry.count : 0
    };
  };

  useEffect(() => {
    const newMonthData: { [key: number]: DayData } = {};
    const daysInMonth = getDaysInMonth(currentDate);
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      newMonthData[day] = getDayData(date);
    }
    setMonthData(newMonthData);
  }, [currentDate, contactCounts]);

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const handlePrevMonth = () => {
    if (isThisMonth(currentDate)) return;
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDateClick = (day: number) => {
    const newDate = new Date(Date.UTC(currentDate.getFullYear(), currentDate.getMonth(), day));
    
    if (onSelect) onSelect(newDate);  // Call onSelect when a date is selected

    if (onChange && (!selected || newDate.toDateString() !== selected.toDateString())) {
      onChange(true);  // Trigger onChange if a new date is selected
    }
  };

  const getColorClass = (contracts: number, calls: number) => {
    const total = contracts + calls;
    if (total > 2) return 'bg-red-300';
    if (total > 0) return 'bg-yellow-200';
    return 'bg-white'; 
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDayOfMonth = getFirstDayOfMonth(currentDate);
    const days = [];
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="p-1 sm:p-2 text-center text-gray-400"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const isToday = date.toDateString() === today.toDateString();
      const isSelected = selected && date.toDateString() === selected.toDateString();
      const isPassed = date < yesterday && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
      const dayData = monthData[day] || { contracts: 0, calls: 0 };
      const colorClass = getColorClass(dayData.contracts, dayData.calls);

      const isLowTotal = (dayData.contracts + dayData.calls) < 10;

      days.push(
        <div
          key={day}
          onClick={() => !isPassed && handleDateClick(day)}
          className={`p-1 sm:p-2 text-center rounded-lg flex flex-col items-center justify-between
            ${isSelected ? 'border-2 border-black' : 'border border-transparent'}
            ${isToday ? 'font-bold text-black' : isPassed ? 'text-gray-400' : ''}
            ${colorClass}
            ${isSelected ? colorClass.replace('bg-', 'bg-opacity-75 ') : ''}
            ${!isPassed ? 'hover:bg-opacity-75 transition-all duration-200 ease-in-out cursor-pointer' : ''}
            ${isLowTotal ? 'hover:bg-gray-200' : ''}
            h-16 sm:h-24
          `}
          role="button"
          tabIndex={isPassed ? -1 : 0}
          aria-disabled={isPassed}
        >
          <span className="text-sm sm:text-base">{day}</span>
          <div className="text-xs flex flex-col items-center justify-center flex-grow">
            <div className="flex items-center justify-center">
              <FileText className="h-3 w-3 sm:hidden mr-1" />
              <span className="hidden sm:inline">Contratti:</span> {dayData.contracts}
            </div>
            <div className="flex items-center justify-center">
              <Phone className="h-3 w-3 sm:hidden mr-1" />
              <span className="hidden sm:inline">Chiamate:</span> {dayData.calls}
            </div>
          </div>
        </div>
      );
    }

    return days;
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-white shadow-md rounded-lg overflow-hidden">
      <div className="flex justify-between items-center p-2 sm:p-4 bg-gray-50">
        <Button variant="ghost" size="sm" onClick={handlePrevMonth} type="button">
          <ChevronLeft className="h-4 w-4 sm:h-6 sm:w-6" />
        </Button>
        <h2 className="text-lg sm:text-2xl font-semibold">
          {months[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
        <Button variant="ghost" size="sm" onClick={handleNextMonth} type="button">
          <ChevronRight className="h-4 w-4 sm:h-6 sm:w-6" />
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-1 p-2 sm:p-4">
        {daysOfWeek.map(day => (
          <div key={day} className="text-center font-medium text-gray-600 mb-1 sm:mb-2 text-xs sm:text-sm">
            {day}
          </div>
        ))}
        {renderCalendarDays()}
      </div>
    </div>
  );
}

CustomCalendar.displayName = "Calendar";

export { CustomCalendar };
