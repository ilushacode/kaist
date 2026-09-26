import { motion } from 'motion/react';
import { DayList } from '../components/schedule/DayList';
import { HeaderComponent } from '../components/HeaderComponent';
import { ScheduleComponent } from '../components/ScheduleComponent';
import { pageVariants, PAGE_TRANSITION } from '../animations/presets';

interface SchedulePageProps {
  today: Date;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  canPrev: boolean;
  canNext: boolean;
}

export function SchedulePage({
  today,
  selectedDate,
  setSelectedDate,
  onPrevWeek,
  onNextWeek,
  canPrev,
  canNext,
}: SchedulePageProps) {
  return (
    <motion.div
      className="schedule-page-wrapper"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={PAGE_TRANSITION}
    >
      <HeaderComponent title={'Расписание'} />
      <DayList
        today={today}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        onPrevWeek={onPrevWeek}
        onNextWeek={onNextWeek}
        canPrev={canPrev}
        canNext={canNext}
      />
      <ScheduleComponent selectedDate={selectedDate} onDateChange={setSelectedDate} />
    </motion.div>
  );
}