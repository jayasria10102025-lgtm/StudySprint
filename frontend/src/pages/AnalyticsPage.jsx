import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Calendar,
  Clock,
  Target,
  BookOpen,
  TrendingUp,
  Percent,
  CheckCircle2,
  Layers,
  HelpCircle
} from 'lucide-react';
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import api from '../services/api';
import { StatCard } from '../components/StatCard';
import { EmptyState } from '../components/EmptyState';
import { formatDuration } from '../utils/formatters';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-3 rounded-xl bg-[#161F33] border border-slate-700 shadow-xl text-xs space-y-1">
        <p className="font-semibold text-white">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-slate-300 flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: entry.color || entry.fill }}
            />
            <span>{entry.name || 'Value'}:</span>
            <span className="font-bold text-white font-mono">{entry.value} {entry.unit || ''}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const AnalyticsPage = () => {
  const [rangeFilter, setRangeFilter] = useState('7'); // 'today', '7', '30', 'all'
  const [loading, setLoading] = useState(true);

  const [overview, setOverview] = useState(null);
  const [dailyData, setDailyData] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [subjectData, setSubjectData] = useState([]);
  const [plannedVsCompleted, setPlannedVsCompleted] = useState(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const tzOffset = new Date().getTimezoneOffset();

      const [ovRes, dailyRes, weeklyRes, monthlyRes, subjectRes, pvcRes] = await Promise.all([
        api.get(`/analytics/overview?tzOffset=${tzOffset}`),
        api.get(`/analytics/daily?range=${rangeFilter}&tzOffset=${tzOffset}`),
        api.get(`/analytics/weekly?tzOffset=${tzOffset}`),
        api.get(`/analytics/monthly?tzOffset=${tzOffset}`),
        api.get(`/analytics/subjects?range=${rangeFilter}`),
        api.get('/analytics/planned-vs-completed')
      ]);

      if (ovRes.data.success) setOverview(ovRes.data.data);
      if (dailyRes.data.success) setDailyData(dailyRes.data.data);
      if (weeklyRes.data.success) setWeeklyData(weeklyRes.data.data);
      if (monthlyRes.data.success) setMonthlyData(monthlyRes.data.data);
      if (subjectRes.data.success) setSubjectData(subjectRes.data.data);
      if (pvcRes.data.success) setPlannedVsCompleted(pvcRes.data.data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [rangeFilter]);

  const COLORS = ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EC4899', '#6366F1', '#3B82F6', '#EF4444'];

  return (
    <div className="space-y-6">
      {/* Top Header & Range Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Productivity Analytics</h2>
          <p className="text-xs text-slate-400">
            Real MongoDB aggregation metrics computed across your study timeline
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#131A29] border border-slate-800 text-xs">
          {[
            { id: 'today', label: 'Today' },
            { id: '7', label: 'Last 7 Days' },
            { id: '30', label: 'Last 30 Days' },
            { id: 'all', label: 'All Time' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setRangeFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                rangeFilter === tab.id
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metric Overview Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Focused Hours"
          value={`${overview?.totalStudyHours || 0}h`}
          subtitle={`${overview?.totalCompletedSessions || 0} sessions completed`}
          icon={Clock}
          color="purple"
        />
        <StatCard
          title="Today's Study"
          value={`${overview?.todayStudyHours || 0}h`}
          subtitle="Hours logged today"
          icon={Calendar}
          color="cyan"
        />
        <StatCard
          title="Goal Completion Rate"
          value={`${overview?.goalCompletionPercentage || 0}%`}
          subtitle={`${overview?.completedGoalsCount || 0} of ${overview?.totalGoalsCount || 0} achieved`}
          icon={Percent}
          color="emerald"
        />
        <StatCard
          title="Planned Study Time"
          value={`${Math.round((overview?.totalPlannedMinutes || 0) / 60)}h`}
          subtitle={`${overview?.totalPlannedMinutes || 0} minutes target`}
          icon={Target}
          color="amber"
        />
      </div>

      {/* Charts Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-cyan-400 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* 1. Daily Study Time Chart */}
          <div className="p-6 rounded-2xl bg-[#131A29] border border-slate-800 shadow-xl shadow-black/20">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  <span>Daily Study Time Timeline</span>
                </h3>
                <p className="text-xs text-slate-400">Total focused minutes per calendar day</p>
              </div>
            </div>

            {dailyData.some(d => d.studyMinutes > 0) ? (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.6} />
                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="label"
                      stroke="#64748B"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: '#1E293B' }}
                    />
                    <YAxis
                      stroke="#64748B"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: '#1E293B' }}
                      unit="m"
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="studyMinutes"
                      name="Study Time"
                      unit="mins"
                      stroke="#8B5CF6"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#purpleGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState
                icon={Clock}
                title="No daily study records in this window"
                description="Complete focus sessions in the timer to see your daily activity curve."
              />
            )}
          </div>

          {/* Row: Weekly Productivity + Subject Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Weekly Productivity */}
            <div className="p-6 rounded-2xl bg-[#131A29] border border-slate-800 shadow-xl shadow-black/20">
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2 mb-1">
                <BarChart3 className="w-4 h-4 text-purple-400" />
                <span>Weekly Productivity (Past 8 Weeks)</span>
              </h3>
              <p className="text-xs text-slate-400 mb-4">Total weekly study hours</p>

              {weeklyData.length > 0 ? (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis
                        dataKey="label"
                        stroke="#64748B"
                        fontSize={11}
                        tickLine={false}
                        axisLine={{ stroke: '#1E293B' }}
                      />
                      <YAxis
                        stroke="#64748B"
                        fontSize={11}
                        tickLine={false}
                        axisLine={{ stroke: '#1E293B' }}
                        unit="h"
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar
                        dataKey="studyHours"
                        name="Study Hours"
                        unit="h"
                        fill="#06B6D4"
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState
                  icon={BarChart3}
                  title="No weekly data available"
                  description="Study sprints completed across weeks will populate here."
                />
              )}
            </div>

            {/* Subject Distribution */}
            <div className="p-6 rounded-2xl bg-[#131A29] border border-slate-800 shadow-xl shadow-black/20 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2 mb-1">
                  <BookOpen className="w-4 h-4 text-emerald-400" />
                  <span>Subject Time Distribution</span>
                </h3>
                <p className="text-xs text-slate-400 mb-4">Percentage share of total focus hours</p>

                {subjectData.length > 0 ? (
                  <>
                    <div className="h-52 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={subjectData}
                            dataKey="totalSeconds"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={75}
                            paddingAngle={4}
                          >
                            {subjectData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={entry.color || COLORS[index % COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="mt-4 space-y-2 max-h-36 overflow-y-auto pr-1">
                      {subjectData.map((sub, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: sub.color || COLORS[idx % COLORS.length] }}
                            />
                            <span className="text-slate-300 font-medium truncate">{sub.name}</span>
                          </div>
                          <span className="text-slate-400 font-mono font-medium">
                            {sub.studyHours}h ({sub.percentage}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <EmptyState
                    icon={BookOpen}
                    title="No subject time logged"
                    description="Assign subjects to study sessions to see distribution percentages."
                  />
                )}
              </div>
            </div>
          </div>

          {/* Planned vs Completed Comparison Chart */}
          <div className="p-6 rounded-2xl bg-[#131A29] border border-slate-800 shadow-xl shadow-black/20">
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2 mb-1">
              <Target className="w-4 h-4 text-purple-400" />
              <span>Planned vs Completed Study Time (By Subject)</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Direct comparison between planned target duration and actual completed hours
            </p>

            {plannedVsCompleted?.bySubjects && plannedVsCompleted.bySubjects.length > 0 ? (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={plannedVsCompleted.bySubjects} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis
                      dataKey="name"
                      stroke="#64748B"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: '#1E293B' }}
                    />
                    <YAxis
                      stroke="#64748B"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: '#1E293B' }}
                      unit="h"
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar
                      dataKey="plannedHours"
                      name="Planned Hours"
                      unit="h"
                      fill="#8B5CF6"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="completedHours"
                      name="Completed Hours"
                      unit="h"
                      fill="#06B6D4"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState
                icon={Target}
                title="No comparative data"
                description="Create goals with planned durations to compare them with your verified study sessions."
              />
            )}
          </div>

          {/* Timezone & Calculation Architecture Note */}
          <div className="p-4 rounded-xl bg-[#161F33]/80 border border-slate-800 text-xs text-slate-400 flex items-start gap-3">
            <HelpCircle className="w-4 h-4 flex-shrink-0 text-cyan-400 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-300 mb-0.5">Timezone Calculation Architecture</p>
              <p>
                All study session timestamps are recorded in UTC in MongoDB. The client passes its local timezone offset (<code>{new Date().getTimezoneOffset()} minutes</code>) with API queries, ensuring that "Today's Study", daily boundaries, and calendar group dates accurately reflect your local day without time-drift.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

