import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import './App.css'; 
import { LoaderScreen } from './screens/LoaderScreen';
import { UnsupportedBrowserScreen } from './screens/UnsupportedBrowserScreen';
import { SetGroupComponent } from './components/SetGroupComponent';
import { HelloComponent } from './components/HelloComponent';
import useBootstrap from './hooks/useBootstrap';
import { useStore } from './hooks/useStore';
import { MIN_LOADER_MS } from './config';
import { SchedulePage } from './pages/SchedulePage';
import { StudentsPage } from './pages/StudentsPage';
import { TeachersPage } from './pages/TeachersPage';
import { ExamsPage } from './pages/ExamsPage';
import { InstallBanner } from './components/InstallBannerComponent';
import { compareDay, getMondayOfWeek, shiftDate } from './utils/date';
import { useTheme } from './hooks/useTheme';
import { useStats } from './hooks/useStats';
import {
  checkBrowserSupport,
  type SupportIssue,
} from './utils/browserSupport';

function getSemesterRange(today: Date): { start: Date; end: Date } {
  const year = today.getFullYear();
  const autumnStart = new Date(year, 8, 1);
  const autumnEnd = new Date(year, 11, 31);
  if (compareDay(today, autumnEnd) <= 0) {
    return { start: autumnStart, end: autumnEnd };
  }
  const springStart = new Date(year + 1, 1, 1);
  const springEnd = new Date(year + 1, 4, 31);
  return { start: springStart, end: springEnd };
}

function App() {
  useTheme();
  useStats();

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const location = useLocation();
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [minTimePassed, setMinTimePassed] = useState(false);
  const [helloPassed, setHelloPassed] = useState(false);

  // ── Проверка совместимости браузера ──
  const [supportIssues, setSupportIssues] = useState<SupportIssue[] | null>(null);
  const [supportChecked, setSupportChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;

    checkBrowserSupport()
      .then((report) => {
        if (cancelled) return;
        setSupportIssues(report.ok ? [] : report.issues);
        setSupportChecked(true);
      })
      .catch(() => {
        if (cancelled) return;
        setSupportIssues([]);
        setSupportChecked(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const hasHydrated = useStore((s) => s._hasHydrated);
  const groups = useStore((s) => s.groups);
  const selectedGroup = useStore((s) => s.selectedGroup);
  const ready = useBootstrap();

  const prevGroupRef = useRef(selectedGroup);
  useEffect(() => {
    if (prevGroupRef.current !== selectedGroup) {
      prevGroupRef.current = selectedGroup;
      setSelectedDate(today);
    }
  }, [selectedGroup, today]);

  useEffect(() => {
    const timer = setTimeout(() => setMinTimePassed(true), MIN_LOADER_MS);
    return () => clearTimeout(timer);
  }, []);

  const { start: semesterStart, end: semesterEnd } = useMemo(
    () => getSemesterRange(today),
    [today]
  );

  const currentMonday = useMemo(() => getMondayOfWeek(selectedDate), [selectedDate]);

  const canPrev = compareDay(shiftDate(currentMonday, -7), semesterStart) >= 0;
  const canNext = compareDay(shiftDate(currentMonday, 7), semesterEnd) <= 0;

  const handlePrevWeek = () => {
    if (!canPrev) return;
    setSelectedDate(shiftDate(currentMonday, -7));
  };

  const handleNextWeek = () => {
    if (!canNext) return;
    setSelectedDate(shiftDate(currentMonday, 7));
  };

  if (!minTimePassed || !supportChecked || !hasHydrated || !ready) {
    return <LoaderScreen />;
  }

  if (supportIssues && supportIssues.length > 0) {
    return (
      <div className="container theme_light">
        <UnsupportedBrowserScreen issues={supportIssues} />
      </div>
    );
  }

  if (groups.length === 0 && !helloPassed) {
    return (
      <div className="container theme_light">
        <HelloComponent onContinue={() => setHelloPassed(true)} />
      </div>
    );
  }

  if (groups.length === 0) {
    return <SetGroupComponent />;
  }

  return (
    <div className="container">
      <AnimatePresence mode="wait" initial={false}>
        <Routes location={location} key={location.pathname}>
          <Route
            path="/"
            element={
              <SchedulePage
                today={today}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                onPrevWeek={handlePrevWeek}
                onNextWeek={handleNextWeek}
                canPrev={canPrev}
                canNext={canNext}
              />
            }
          />
          <Route path="/students" element={<StudentsPage />} />
          <Route path="/teachers" element={<TeachersPage />} />
          <Route path="/exams" element={<ExamsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>

      <InstallBanner />
    </div>
  );
}

export default App;