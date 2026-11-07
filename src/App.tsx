import React, { useState, useEffect } from 'react';
import {
  Home,
  Camera,
  Images,
  FlaskConical,
  FileSpreadsheet,
  Bell,
  Plus,
  ChevronDown,
  Sparkles,
  ShieldCheck,
  Heart,
  Droplets,
  Calendar,
  AlertTriangle,
  Bot,
  Volume2,
} from 'lucide-react';
import {
  ChildProfile,
  CheckIn,
  ProductTrial,
  AppNotification,
  FlareRisk,
} from './types';
import {
  INITIAL_CHILDREN,
  generateMockCheckIns,
  INITIAL_PRODUCT_TRIALS,
  INITIAL_NOTIFICATIONS,
} from './utils/mockData';
import {
  fetchWeatherForecast,
  WeatherForecastResult,
} from './utils/weatherForecast';

// Subcomponents
import { ForecastSection } from './components/ForecastSection';
import { AudioSummaryCard } from './components/AudioSummaryCard';
import { AIAssistantModal } from './components/AIAssistantModal';
import { ProgressRings } from './components/ProgressRings';
import { TrendChart } from './components/TrendChart';
import { GrowingPlant } from './components/GrowingPlant';
import { CalmPlanCard } from './components/CalmPlanCard';
import { TrustedTipsCard } from './components/TrustedTipsCard';
import { CheckInFlow } from './components/CheckInFlow';
import { PhotoTimeline } from './components/PhotoTimeline';
import { ProductTrialsView } from './components/ProductTrialsView';
import { DoctorReportView } from './components/DoctorReportView';
import { RedFlagAlert } from './components/RedFlagAlert';
import { NotificationDrawer } from './components/NotificationDrawer';
import { AddChildModal } from './components/AddChildModal';

type NavTab = 'home' | 'timeline' | 'products' | 'report';

export default function App() {
  // Navigation
  const [currentTab, setCurrentTab] = useState<NavTab>('home');

  // Children State
  const [children, setChildren] = useState<ChildProfile[]>(() => {
    const saved = localStorage.getItem('flarecast_children');
    return saved ? JSON.parse(saved) : INITIAL_CHILDREN;
  });
  const [activeChildId, setActiveChildId] = useState<string>(children[0]?.id || 'child-mia');
  const [isChildDropdownOpen, setIsChildDropdownOpen] = useState(false);
  const [isAddChildOpen, setIsAddChildOpen] = useState(false);

  const activeChild = children.find((c) => c.id === activeChildId) || children[0];

  // Check-ins State
  const [checkIns, setCheckIns] = useState<CheckIn[]>(() => {
    const saved = localStorage.getItem('flarecast_checkins');
    return saved ? JSON.parse(saved) : generateMockCheckIns('child-mia');
  });

  // Product Trials State
  const [trials, setTrials] = useState<ProductTrial[]>(() => {
    const saved = localStorage.getItem('flarecast_trials');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCT_TRIALS;
  });

  // Notifications State
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem('flarecast_notifications');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  // Weather & Flare Forecast State
  const [weatherData, setWeatherData] = useState<WeatherForecastResult | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);

  // Modals
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [lastWateredTimestamp, setLastWateredTimestamp] = useState<number | undefined>(undefined);
  const [justLogged, setJustLogged] = useState(false);
  const [redFlagModal, setRedFlagModal] = useState<{ isOpen: boolean; reason?: string }>({
    isOpen: false,
  });

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('flarecast_children', JSON.stringify(children));
  }, [children]);

  useEffect(() => {
    localStorage.setItem('flarecast_checkins', JSON.stringify(checkIns));
  }, [checkIns]);

  useEffect(() => {
    localStorage.setItem('flarecast_trials', JSON.stringify(trials));
  }, [trials]);

  useEffect(() => {
    localStorage.setItem('flarecast_notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Load weather and prediction
  useEffect(() => {
    let isMounted = true;
    const loadWeather = async () => {
      setIsLoadingWeather(true);
      const childCheckIns = checkIns.filter((c) => c.childId === activeChildId);
      const res = await fetchWeatherForecast(childCheckIns, activeChild?.name);
      if (isMounted) {
        setWeatherData(res);
        setIsLoadingWeather(false);
      }
    };
    loadWeather();
    return () => {
      isMounted = false;
    };
  }, [activeChildId, checkIns.length]);

  // Derived metrics for active child
  const childCheckIns = checkIns.filter((c) => c.childId === activeChildId);
  const latestCheckIn = childCheckIns[childCheckIns.length - 1];
  const latestScore = latestCheckIn ? latestCheckIn.skinScore : 84;

  // Previous week avg score
  const previousWeekCheckIns = childCheckIns.slice(-14, -7);
  const previousWeekAvg = previousWeekCheckIns.length
    ? Math.round(previousWeekCheckIns.reduce((s, c) => s + c.skinScore, 0) / previousWeekCheckIns.length)
    : 72;

  // Ring 1: Check-ins this week (last 7 days count, goal: 5)
  const last7DaysCheckIns = childCheckIns.slice(-7).length;
  // Ring 2: Calm plan done this week
  const calmPlanDoneCount = childCheckIns.slice(-7).filter((c) => c.calmPlanDone).length;
  // Ring 3: Photos logged this week
  const photosCount = childCheckIns.slice(-7).filter((c) => c.photoUrl).length;

  // Check if today has calm plan marked done
  const isCalmPlanDoneToday = latestCheckIn?.calmPlanDone ?? false;

  const handleToggleCalmPlanToday = () => {
    if (latestCheckIn) {
      const updated = checkIns.map((c) =>
        c.id === latestCheckIn.id ? { ...c, calmPlanDone: !c.calmPlanDone } : c
      );
      setCheckIns(updated);
    }
  };

  const handleSaveCheckIn = (newCheckIn: CheckIn) => {
    setCheckIns((prev) => [...prev, newCheckIn]);
    setLastWateredTimestamp(Date.now());
    setJustLogged(true);
    setCurrentTab('home'); // Return to dashboard where the plant is
    // Also update active trial days if matched
    if (newCheckIn.productUsed) {
      setTrials((prevTrials) =>
        prevTrials.map((t) => {
          if (t.status === 'active' && t.name.toLowerCase().includes(newCheckIn.productUsed!.name.toLowerCase())) {
            return {
              ...t,
              daysLogged: t.daysLogged + 1,
            };
          }
          return t;
        })
      );
    }
  };

  const handleUpdateCalmPlan = (updatedPlan: ChildProfile['calmPlan']) => {
    setChildren((prev) =>
      prev.map((c) => (c.id === activeChildId ? { ...c, calmPlan: updatedPlan } : c))
    );
  };

  const handleAddChild = (newChild: ChildProfile) => {
    setChildren((prev) => [...prev, newChild]);
    setActiveChildId(newChild.id);
  };

  const unreadNotifsCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-[#FAF6EF] text-[#2C3E38] pb-24 md:pb-12">
      {/* TOP BAR / APP HEADER */}
      <header className="sticky top-0 z-40 bg-[#FAF6EF]/90 backdrop-blur-md border-b border-[#6FA79A]/15 px-4 sm:px-6 py-3 transition-colors">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#6FA79A] text-white flex items-center justify-center shadow-sm">
              {/* Logo: soft sun & cloud curve */}
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                <path d="M12 3a4 4 0 0 0-4 4c0 .3.04.58.11.86A5.5 5.5 0 0 0 3 13.5C3 16.54 5.46 19 8.5 19h9c2.49 0 4.5-2.01 4.5-4.5a4.5 4.5 0 0 0-3.5-4.4c.06-.35.1-.72.1-1.1a5 5 0 0 0-5-5c-.56 0-1.1.09-1.6.26A4 4 0 0 0 12 3z" />
              </svg>
            </div>
            <div>
              <span className="text-base font-black tracking-tight text-[#2C3E38] block leading-none">
                Flarecast
              </span>
              <span className="text-[10px] text-[#5C736C] font-semibold tracking-wide">
                Forecast the flare
              </span>
            </div>
          </div>

          {/* Right Zone: Child Profile Selector & Notification Bell */}
          <div className="flex items-center gap-2.5">
            {/* Child Selector Button */}
            <div className="relative">
              <button
                onClick={() => setIsChildDropdownOpen(!isChildDropdownOpen)}
                className="h-9 px-3 rounded-full bg-white border border-[#6FA79A]/20 flex items-center gap-2 text-xs font-bold text-[#2C3E38] shadow-sm hover:bg-[#F2F7F6] transition-colors"
              >
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: activeChild?.avatarColor || '#6FA79A' }}
                />
                <span>
                  {activeChild?.name}, {activeChild?.age}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Child Switcher Dropdown */}
              {isChildDropdownOpen && (
                <div className="absolute right-0 mt-1.5 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 p-1.5 z-50 animate-fade-in">
                  <div className="text-[10px] uppercase font-bold text-slate-400 px-3 py-1">
                    Select Child Profile
                  </div>
                  {children.map((child) => (
                    <button
                      key={child.id}
                      onClick={() => {
                        setActiveChildId(child.id);
                        setIsChildDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-left transition-colors ${
                        child.id === activeChildId
                          ? 'bg-[#E8F2F0] text-[#426C63]'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: child.avatarColor }}
                        />
                        <span>
                          {child.name}, age {child.age}
                        </span>
                      </div>
                      {child.id === activeChildId && <span className="text-[10px]">Active</span>}
                    </button>
                  ))}

                  <div className="border-t border-slate-100 mt-1 pt-1">
                    <button
                      onClick={() => {
                        setIsChildDropdownOpen(false);
                        setIsAddChildOpen(true);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold text-[#578C80] hover:bg-[#F2F7F6] transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add another child</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Ask AI Care Assistant Button (Direct accessible AI Agent) */}
            <button
              onClick={() => setIsAIAssistantOpen(true)}
              className="h-9 px-3 rounded-full bg-[#E8F2F0] hover:bg-[#D6ECE6] text-[#3B665E] border border-[#6FA79A]/30 flex items-center gap-1.5 text-xs font-bold shadow-2xs transition-colors"
              title="Ask AI Care Assistant"
              aria-label="Ask AI Care Assistant"
            >
              <Bot className="w-4 h-4 text-[#578C80]" />
              <span className="hidden sm:inline">Ask AI</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </button>

            {/* In-app Notification Bell */}
            <button
              onClick={() => setIsNotificationOpen(true)}
              className="relative w-9 h-9 rounded-full bg-white border border-[#6FA79A]/20 flex items-center justify-center text-slate-600 hover:text-slate-900 shadow-sm"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifsCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#D9644F] text-white text-[9px] font-black flex items-center justify-center">
                  {unreadNotifsCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* DESKTOP TOP NAVIGATION TABS (Single-line, clean tabs for tablet/desktop) */}
      <div className="hidden md:block max-w-4xl mx-auto px-6 pt-4 pb-2">
        <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm p-1.5 rounded-2xl border border-[#6FA79A]/15 shadow-xs">
          {[
            { id: 'home', label: 'Dashboard & Forecast', icon: Home },
            { id: 'timeline', label: 'Photo Timeline', icon: Images },
            { id: 'products', label: 'Product Trials', icon: FlaskConical },
            { id: 'report', label: 'Doctor Report', icon: FileSpreadsheet },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id as NavTab)}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  isActive
                    ? 'bg-[#6FA79A] text-white shadow-sm'
                    : 'text-[#5C736C] hover:bg-[#F2F7F6] hover:text-[#2C3E38]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}

          <button
            onClick={() => setIsAIAssistantOpen(true)}
            className="py-2 px-3.5 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-[#FAF6EF] text-[#3B665E] border border-[#6FA79A]/25 hover:bg-[#E8F2F0] transition-colors shrink-0"
          >
            <Bot className="w-4 h-4 text-[#6FA79A]" />
            <span>Ask AI Agent</span>
          </button>
        </div>
      </div>

      {/* MAIN VIEWPORT CONTENT */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-3 space-y-5">
        {/* TAB 1: HOME DASHBOARD */}
        {currentTab === 'home' && (
          <div className="space-y-5 animate-fade-in">
            {/* Primary Action Button (Big & prominent for 1-handed midnight use) */}
            <div className="w-full">
              <button
                onClick={() => setIsCheckInOpen(true)}
                className="w-full py-4 px-6 rounded-3xl bg-gradient-to-r from-[#6FA79A] to-[#558E82] text-white font-extrabold text-base sm:text-lg flex items-center justify-between shadow-lg shadow-[#6FA79A]/25 active:scale-[0.99] hover:brightness-105 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <span className="block leading-tight">Snap Today's Check-In</span>
                    <span className="text-xs font-medium text-white/85">
                      Fast 1-screen check-in · Under 10 seconds · 3 Taps
                    </span>
                  </div>
                </div>

                <div className="px-3 py-1 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wider backdrop-blur-sm hidden sm:block">
                  Fast Tap
                </div>
              </button>
            </div>

            {/* 1. Today's Forecast Card & Indoor Sensor */}
            {weatherData ? (
              <ForecastSection
                weather={weatherData}
                childName={activeChild.name}
                latestSkinScore={latestScore}
                previousWeekAvgScore={previousWeekAvg}
                onRefreshWeather={() => {}}
                isLoadingWeather={isLoadingWeather}
                onSensorCheckInPrompt={() => setIsCheckInOpen(true)}
              />
            ) : (
              <div className="h-44 bg-white rounded-3xl animate-pulse border border-[#6FA79A]/15" />
            )}

            {/* 1b. Accessible Spoken AI Audio Summary Briefing */}
            {weatherData && (
              <AudioSummaryCard
                child={activeChild}
                latestScore={latestScore}
                weather={weatherData}
                onOpenAssistant={() => setIsAIAssistantOpen(true)}
              />
            )}

            {/* 2. Fitness-Style Activity Progress Rings */}
            <ProgressRings
              checkIns={{ current: last7DaysCheckIns, goal: 5 }}
              calmPlan={{ current: calmPlanDoneCount, goal: 7 }}
              photos={{ current: photosCount, goal: 5 }}
            />

            {/* 3. Growing Plant Virtual Garden & Streak */}
            <GrowingPlant
              streakDays={9}
              checkInsThisWeek={last7DaysCheckIns}
              weeklyGoal={5}
              childName={activeChild.name}
              reminderTime={activeChild.reminderTime}
              lastWateredTimestamp={lastWateredTimestamp}
            />

            {/* 4. 14-Day Weekly Severity Trend Line Chart */}
            <TrendChart checkIns={childCheckIns} childName={activeChild.name} />

            {/* 5. Calm Plan Prevention Routine Card */}
            <CalmPlanCard
              child={activeChild}
              forecastRisk={weatherData?.days[0]?.riskLevel || 'Low'}
              isCalmPlanDoneToday={isCalmPlanDoneToday}
              onToggleDoneToday={handleToggleCalmPlanToday}
              onUpdatePlan={handleUpdateCalmPlan}
            />

            {/* 6. Contextual Trusted Tips */}
            <TrustedTipsCard />
          </div>
        )}

        {/* TAB 2: PHOTO TIMELINE */}
        {currentTab === 'timeline' && (
          <div className="animate-fade-in">
            <PhotoTimeline checkIns={childCheckIns} childName={activeChild.name} />
          </div>
        )}

        {/* TAB 3: PRODUCT TRIALS */}
        {currentTab === 'products' && (
          <div className="animate-fade-in">
            <ProductTrialsView
              trials={trials.filter((t) => t.childId === activeChildId || !t.childId)}
              child={activeChild}
              onAddTrial={(newTrial) => setTrials((prev) => [newTrial, ...prev])}
            />
          </div>
        )}

        {/* TAB 4: DOCTOR REPORT */}
        {currentTab === 'report' && (
          <div className="animate-fade-in">
            <DoctorReportView
              child={activeChild}
              checkIns={childCheckIns}
              trials={trials.filter((t) => t.childId === activeChildId || !t.childId)}
            />
          </div>
        )}
      </main>

      {/* MOBILE-FIRST FIXED BOTTOM NAVIGATION BAR */}
      <nav className="no-print fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#6FA79A]/20 md:hidden">
        <div className="grid grid-cols-5 items-center h-16 max-w-md mx-auto px-2">
          {/* Tab 1: Home */}
          <button
            onClick={() => setCurrentTab('home')}
            className={`flex flex-col items-center justify-center h-full transition-colors ${
              currentTab === 'home' ? 'text-[#578C80]' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] font-bold tracking-tight mt-1">Home</span>
          </button>

          {/* Tab 2: Timeline */}
          <button
            onClick={() => setCurrentTab('timeline')}
            className={`flex flex-col items-center justify-center h-full transition-colors ${
              currentTab === 'timeline' ? 'text-[#578C80]' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Images className="w-5 h-5" />
            <span className="text-[10px] font-bold tracking-tight mt-1">Timeline</span>
          </button>

          {/* Center Primary Action: Snap Check-in */}
          <div className="flex items-center justify-center">
            <button
              onClick={() => setIsCheckInOpen(true)}
              className="w-12 h-12 rounded-full bg-[#6FA79A] text-white flex items-center justify-center shadow-lg shadow-[#6FA79A]/30 -mt-5 active:scale-95 transition-transform"
              title="Snap Check-in"
            >
              <Camera className="w-6 h-6" />
            </button>
          </div>

          {/* Tab 3: Products */}
          <button
            onClick={() => setCurrentTab('products')}
            className={`flex flex-col items-center justify-center h-full transition-colors ${
              currentTab === 'products' ? 'text-[#578C80]' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <FlaskConical className="w-5 h-5" />
            <span className="text-[10px] font-bold tracking-tight mt-1">Trials</span>
          </button>

          {/* Tab 4: Doctor Report */}
          <button
            onClick={() => setCurrentTab('report')}
            className={`flex flex-col items-center justify-center h-full transition-colors ${
              currentTab === 'report' ? 'text-[#578C80]' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <FileSpreadsheet className="w-5 h-5" />
            <span className="text-[10px] font-bold tracking-tight mt-1">Report</span>
          </button>
        </div>
      </nav>

      {/* DAILY CHECK-IN MODAL (Step 1-4 with Gemini AI analysis) */}
      <CheckInFlow
        isOpen={isCheckInOpen}
        onClose={() => {
          setIsCheckInOpen(false);
          if (justLogged) {
            setLastWateredTimestamp(Date.now());
            setJustLogged(false);
          }
        }}
        child={activeChild}
        previousCheckIns={childCheckIns}
        onSaveCheckIn={handleSaveCheckIn}
        onTriggerRedFlag={(reason) => {
          setRedFlagModal({ isOpen: true, reason });
        }}
      />

      {/* RED FLAG INFECTION SAFETY MODAL */}
      <RedFlagAlert
        isOpen={redFlagModal.isOpen}
        reason={redFlagModal.reason}
        childName={activeChild.name}
        doctorName={activeChild.calmPlan.doctorName}
        onClose={() => setRedFlagModal({ isOpen: false })}
      />

      {/* NOTIFICATIONS DRAWER */}
      <NotificationDrawer
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        notifications={notifications}
        onMarkAllRead={() => {
          setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        }}
        onSelectNotification={(n) => {
          if (n.type === 'reminder') setIsCheckInOpen(true);
          else if (n.type === 'summary') setCurrentTab('products');
        }}
      />

      {/* ADD CHILD PROFILE MODAL */}
      <AddChildModal
        isOpen={isAddChildOpen}
        onClose={() => setIsAddChildOpen(false)}
        onAddChild={handleAddChild}
      />

      {/* FLOATING ACTION BUTTON: ASK AI AGENT */}
      <button
        type="button"
        onClick={() => setIsAIAssistantOpen(true)}
        className="no-print fixed bottom-20 md:bottom-6 right-4 md:right-8 z-40 px-4 py-2.5 rounded-full bg-[#2C3E38] text-white shadow-xl hover:bg-[#1E2B27] flex items-center gap-2 border border-[#6FA79A]/40 active:scale-95 transition-all"
        aria-label="Open Flarecast AI Care Assistant"
      >
        <Bot className="w-4 h-4 text-[#9EE0D2]" />
        <span className="text-xs font-bold">Ask AI Agent</span>
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
      </button>

      {/* AI CARE ASSISTANT MODAL (Chatbot) */}
      <AIAssistantModal
        isOpen={isAIAssistantOpen}
        onClose={() => setIsAIAssistantOpen(false)}
        child={activeChild}
        latestScore={latestScore}
        recentCheckIns={childCheckIns}
        trials={trials}
        flareRisk={weatherData?.days[0]?.riskLevel || 'Low'}
      />
    </div>
  );
}
