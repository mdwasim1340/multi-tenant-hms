'use client';

import { useState } from 'react';
import { StaffSchedule } from '@/lib/types/staff';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

interface ScheduleCalendarProps {
  schedules: StaffSchedule[];
  onAddShift: (date: Date) => void;
  onEditShift: (schedule: StaffSchedule) => void;
}

export function ScheduleCalendar({
  schedules,
  onAddShift,
  onEditShift,
}: ScheduleCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const { daysInMonth, startingDayOfWeek, year, month } =
    getDaysInMonth(currentDate);

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const getSchedulesForDate = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(
      day
    ).padStart(2, '0')}`;
    return schedules.filter((s) => s.shift_date === dateStr);
  };

  const getShiftBadgeVariant = (
    type: string
  ): 'default' | 'secondary' | 'destructive' | 'outline' => {
    const variants: Record<
      string,
      'default' | 'secondary' | 'destructive' | 'outline'
    > = {
      morning: 'default',
      afternoon: 'secondary',
      night: 'destructive',
      'on-call': 'outline',
    };
    return variants[type] || 'default';
  };

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>
            {monthNames[month]} {year}
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={previousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(new Date())}
            >
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2">
          {/* Day headers */}
          {dayNames.map((day) => (
            <div
              key={day}
              className="text-center font-semibold text-sm py-2 border-b"
            >
              {day}
            </div>
          ))}

          {/* Empty cells for days before month starts */}
          {Array.from({ length: startingDayOfWeek }).map((_, index) => (
            <div key={`empty-${index}`} className="min-h-24 p-2 border" />
          ))}

          {/* Calendar days */}
          {Array.from({ length: daysInMonth }).map((_, index) => {
            const day = index + 1;
            const daySchedules = getSchedulesForDate(day);
            const isToday =
              new Date().getDate() === day &&
              new Date().getMonth() === month &&
              new Date().getFullYear() === year;

            return (
              <div
                key={day}
                className={`min-h-24 p-2 border rounded-lg ${
                  isToday ? 'bg-primary/5 border-primary' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-sm font-medium ${
                      isToday ? 'text-primary' : ''
                    }`}
                  >
                    {day}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() =>
                      onAddShift(new Date(year, month, day))
                    }
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <div className="space-y-1">
                  {daySchedules.map((schedule) => (
                    <button
                      key={schedule.id}
                      onClick={() => onEditShift(schedule)}
                      className="w-full text-left"
                    >
                      <Badge
                        variant={getShiftBadgeVariant(schedule.shift_type)}
                        className="text-xs w-full justify-start"
                      >
                        {schedule.shift_type}
                      </Badge>
                      <div className="text-xs text-muted-foreground mt-1">
                        {schedule.shift_start} - {schedule.shift_end}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Badge variant="default">Morning</Badge>
            <span className="text-muted-foreground">6AM - 2PM</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Afternoon</Badge>
            <span className="text-muted-foreground">2PM - 10PM</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="destructive">Night</Badge>
            <span className="text-muted-foreground">10PM - 6AM</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">On-Call</Badge>
            <span className="text-muted-foreground">24/7</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
