import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Clock,
  Calendar,
  CheckCircle2,
  Target,
  Percent,
  Play,
  ArrowRight,
  TrendingUp,
  BookOpen,
  Plus
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import api from '../services/api';
import { StatCard } from '../components/StatCard';
import { EmptyState } from '../components/EmptyState';
import { formatDuration, formatDateTime } from '../utils/formatters';

const CustomChartTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-3 rounded-xl bg-[#161F33] border border-slate-700 shadow-xl text-xs space-y-1">
        <p className="font-semibold text-white">{label}</p>
        {payload.map((item, index) => (
          <p key={index} className="text-slate-300 flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: item.color || item.fill }}
            />
            <span>{item.name || 'Value'}:</span>
            <span className="font-bold text-white font-mono">{item.value} {item.unit || ''}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const DashboardPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [dailyData, setDailyData] = useState([]);
  const [subjectData, setSubjectData] = useState([]);
  const [plannedVsCompleted, setPlannedVsCompleted] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const tzOffset = new Date().getTimezoneOffset();
      const [ovRes, dailyRes, subRes, pvcRes] = await Promise.all([
        api.get(`/analytics/overview?tzOffset=${tzOffset}`),
        api.get(`/analytics/daily?range=7&tzOffset=${tzOffset}`),
        api.get('/analytics/subjects'),
        api.get('/analytics/planned-vs-completed')
      ]);

      if (ovRes.data.success) setOverview(ovRes.data.data);
      if (dailyRes.data.success) setDailyData(dailyRes.data.data);
      if (subRes.data.success) setSubjectData(subRes.data.data);
      if (pvcRes.data.success) setPlannedVsCompleted(pvcRes.data.data);
    } catch (err) {
      console.error('Error loading dashboard analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-9 h-9 border-2 border-purple-500 border-t-cyan-400 rounded-full animate-spin" />
        <p className="text-xs text-slate-400">Loading productivity statistics...</p>
      </div>
    );
  }

  const hasSessions = overview && overview.totalCompletedSessions > 0;
  const hasGoals = overview && overview.totalGoalsCount > 0;
  const COLORS = ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EC4899', '#6366F1'];

  return (
    <div className="space-y-6">
      {/* 5 Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Focused Hours"
          value={`${overview?.totalStudyHours || 0}h`}
          subtitle={hasSessions ? `${overview.totalCompletedSessions} sessions logged` : 'No sessions yet'}
          icon={Clock}
          color="purple"
        />
        <StatCard
          title="Today's Study"
          value={`${overview?.todayStudyHours || 0}h`}
          subtitle={`${overview?.todaySessionsCount || 0} sessions today`}
          icon={Calendar}
          color="cyan"
        />
        <StatCard
          title="Completed Sessions"
          value={overview?.totalCompletedSessions || 0}
          subtitle="All-time verified"
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="Active Study Goals"
          value={overview?.activeGoalsCount || 0}
          subtitle={`${overview?.completedGoalsCount || 0} goals achieved`}
          icon={Target}
          color="amber"
        />
        <StatCard
          title="Goal Completion"
          value={`${overview?.goalCompletionPercentage || 0}%`}
          subtitle={hasGoals ? 'Based on target goals' : 'No active goals'}
          icon={Percent}
          color="purple"
        />
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Study Activity Chart */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-[#131A29] border border-slate-800 shadow-lg shadow-black/20">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                <span>Daily Study Progress (Past 7 Days)</span>
              </h3>
              <p className="text-xs text-slate-400">Total focused study minutes per day</p>
            </div>
            <Link to="/analytics" className="text-xs text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1">
              Deep Analytics <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {dailyData.some(d => d.studyMinutes > 0) ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                  <Tooltip content={<CustomChartTooltip />} />
                  <Bar
                    dataKey="studyMinutes"
                    name="Study Time"
                    unit="mins"
                    fill="#8B5CF6"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState
              icon={Clock}
              title="No study activity recorded yet"
              description="Start a focus session to record your daily minutes and watch your activity graph populate."
              actionText="Start Focus Session"
              onAction={() => navigate('/timer')}
            />
          )}
        </div>

        {/* Subject-wise Distribution Chart */}
        <div className="p-5 rounded-2xl bg-[#131A29] border border-slate-800 shadow-lg shadow-black/20 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2 mb-1">
              <BookOpen className="w-4 h-4 text-purple-400" />
              <span>Subject Time Distribution</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">Focus time allocated across subjects</p>

            {subjectData.length > 0 ? (
              <>
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={subjectData}
                        dataKey="totalSeconds"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={4}
                      >
                        {subjectData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.color || COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomChartTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-2 space-y-2 max-h-36 overflow-y-auto pr-1">
                  {subjectData.map((sub, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: sub.color || COLORS[idx % COLORS.length] }}
                        />
                        <span className="text-slate-300 font-medium truncate">{sub.name}</span>
                      </div>
                      <span className="text-slate-400 font-mono font-medium ml-2">
                        {sub.studyHours}h ({sub.percentage}%)
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <EmptyState
                icon={BookOpen}
                title="No subject time recorded"
                description="Assign study sessions to subjects to track time distribution."
                actionText="Add Subjects"
                onAction={() => navigate('/subjects')}
              />
            )}
          </div>
        </div>
      </div>

      {/* Planned vs Completed & Recent Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Planned vs Completed Summary */}
        <div className="p-5 rounded-2xl bg-[#131A29] border border-slate-800 shadow-lg shadow-black/20">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-400" />
                <span>Planned vs Completed</span>
              </h3>
              <p className="text-xs text-slate-400">Goals progress comparison</p>
            </div>
            <Link to="/goals" className="text-xs text-purple-400 hover:text-purple-300 font-medium">
              View All
            </Link>
          </div>

          {plannedVsCompleted?.byGoals && plannedVsCompleted.byGoals.length > 0 ? (
            <div className="space-y-3">
              {plannedVsCompleted.byGoals.slice(0, 4).map((goal) => (
                <div key={goal.id} className="p-3 rounded-xl bg-[#161F33] border border-slate-800/80">
                  <div className="flex items-center justify-between mb-1 text-xs">
                    <span className="font-semibold text-white truncate max-w-[180px]">{goal.title}</span>
                    <span className="text-slate-400 font-mono text-[11px]">
                      {goal.completedHours}h / {goal.plannedHours}h
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-cyan-400 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, goal.completionRate)}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center mt-1 text-[10px] text-slate-400">
                    <span>{goal.subjectName}</span>
                    <span className="font-semibold text-cyan-300">{goal.completionRate}% complete</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Target}
              title="No active study goals"
              description="Define weekly or target goals to measure planned vs actual focused study time."
              actionText="Create Goal"
              onAction={() => navigate('/goals')}
            />
          )}
        </div>

        {/* Recent Study Sessions Table */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-[#131A29] border border-slate-800 shadow-lg shadow-black/20">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span>Recent Study Sessions</span>
              </h3>
              <p className="text-xs text-slate-400">Latest completed focus sessions</p>
            </div>
            <Link to="/timer" className="text-xs text-purple-400 hover:text-purple-300 font-medium">
              Focus Timer
            </Link>
          </div>

          {overview?.recentSessions && overview.recentSessions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="pb-2.5 font-semibold">Subject & Session</th>
                    <th className="pb-2.5 font-semibold">Goal</th>
                    <th className="pb-2.5 font-semibold">Duration</th>
                    <th className="pb-2.5 font-semibold">Date & Time</th>
                    <th className="pb-2.5 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {overview.recentSessions.map((session) => (
                    <tr key={session._id} className="hover:bg-[#161F33]/50 transition-colors">
                      <td className="py-3 pr-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: session.subjectId?.color || '#8B5CF6' }}
                          />
                          <div>
                            <p className="font-semibold text-white truncate max-w-[140px] sm:max-w-[200px]">
                              {session.title}
                            </p>
                            <p className="text-[11px] text-slate-400 truncate">
                              {session.subjectId?.name || 'Unassigned'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 text-slate-300">
                        {session.goalId?.title ? (
                          <span className="truncate max-w-[120px] block">{session.goalId.title}</span>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                      <td className="py-3 font-mono font-bold text-cyan-300">
                        {formatDuration(session.duration)}
                      </td>
                      <td className="py-3 text-slate-400">
                        {formatDateTime(session.startTime)}
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                            session.status === 'completed'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : session.status === 'active'
                              ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                              : 'bg-slate-700/40 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {session.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={Clock}
              title="No study sessions logged yet"
              description="Start your first study sprint using the Focus Timer to see your verified sessions list here."
              actionText="Open Focus Timer"
              onAction={() => navigate('/timer')}
            />
          )}
        </div>
      </div>
    </div>
  );
};

