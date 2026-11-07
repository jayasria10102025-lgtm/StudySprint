const mongoose = require('mongoose');
const StudySession = require('../models/StudySession');
const StudyGoal = require('../models/StudyGoal');
const Subject = require('../models/Subject');

// Helper to get start and end of day given an offset in minutes
const getDayBounds = (date = new Date(), offsetMinutes = 0) => {
  // Convert server time to user local time
  const userLocal = new Date(date.getTime() - offsetMinutes * 60 * 1000);
  const startLocal = new Date(Date.UTC(userLocal.getUTCFullYear(), userLocal.getUTCMonth(), userLocal.getUTCDate(), 0, 0, 0, 0));
  const endLocal = new Date(Date.UTC(userLocal.getUTCFullYear(), userLocal.getUTCMonth(), userLocal.getUTCDate(), 23, 59, 59, 999));

  // Shift back to UTC
  const startUTC = new Date(startLocal.getTime() + offsetMinutes * 60 * 1000);
  const endUTC = new Date(endLocal.getTime() + offsetMinutes * 60 * 1000);

  return { startUTC, endUTC };
};

// @desc    Overview statistics
// @route   GET /api/analytics/overview
// @access  Private
const getOverview = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const offsetMinutes = parseInt(req.query.tzOffset, 10) || 0;

    const { startUTC: todayStart, endUTC: todayEnd } = getDayBounds(new Date(), offsetMinutes);

    // Run parallel aggregation queries
    const [
      totalStats,
      todayStats,
      goalsStats,
      recentSessions
    ] = await Promise.all([
      // 1. Total completed study time & count
      StudySession.aggregate([
        { $match: { userId, status: 'completed' } },
        {
          $group: {
            _id: null,
            totalSeconds: { $sum: '$duration' },
            sessionCount: { $sum: 1 }
          }
        }
      ]),

      // 2. Today's study time
      StudySession.aggregate([
        {
          $match: {
            userId,
            status: 'completed',
            startTime: { $gte: todayStart, $lte: todayEnd }
          }
        },
        {
          $group: {
            _id: null,
            todaySeconds: { $sum: '$duration' },
            todaySessionCount: { $sum: 1 }
          }
        }
      ]),

      // 3. Goal statistics
      StudyGoal.aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: null,
            totalGoals: { $sum: 1 },
            completedGoals: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
            },
            activeGoals: {
              $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] }
            },
            totalPlannedMinutes: { $sum: '$plannedDuration' }
          }
        }
      ]),

      // 4. Recent sessions
      StudySession.find({ userId })
        .populate('subjectId', 'name color')
        .populate('goalId', 'title')
        .sort({ startTime: -1 })
        .limit(6)
        .lean()
    ]);

    const totalSeconds = totalStats[0]?.totalSeconds || 0;
    const totalSessions = totalStats[0]?.sessionCount || 0;
    const todaySeconds = todayStats[0]?.todaySeconds || 0;
    const todaySessions = todayStats[0]?.todaySessionCount || 0;

    const totalGoals = goalsStats[0]?.totalGoals || 0;
    const completedGoals = goalsStats[0]?.completedGoals || 0;
    const activeGoals = goalsStats[0]?.activeGoals || 0;
    const totalPlannedMinutes = goalsStats[0]?.totalPlannedMinutes || 0;

    const goalCompletionPercentage =
      totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

    const totalHours = Number((totalSeconds / 3600).toFixed(1));
    const todayHours = Number((todaySeconds / 3600).toFixed(1));

    return res.status(200).json({
      success: true,
      data: {
        totalStudySeconds: totalSeconds,
        totalStudyHours: totalHours,
        totalCompletedSessions: totalSessions,
        todayStudySeconds: todaySeconds,
        todayStudyHours: todayHours,
        todaySessionsCount: todaySessions,
        activeGoalsCount: activeGoals,
        completedGoalsCount: completedGoals,
        totalGoalsCount: totalGoals,
        goalCompletionPercentage,
        totalPlannedMinutes,
        recentSessions
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Daily study time distribution
// @route   GET /api/analytics/daily
// @access  Private
const getDaily = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { range = '7', tzOffset = 0 } = req.query;
    const offsetMinutes = parseInt(tzOffset, 10) || 0;

    let daysCount = 7;
    if (range === '30') daysCount = 30;
    else if (range === '14') daysCount = 14;
    else if (range === 'today') daysCount = 1;

    const now = new Date();
    const startDate = new Date(now.getTime() - (daysCount - 1) * 24 * 60 * 60 * 1000);
    const { startUTC } = getDayBounds(startDate, offsetMinutes);

    // Aggregate sessions grouped by date string
    const dailyRecords = await StudySession.aggregate([
      {
        $match: {
          userId,
          status: 'completed',
          startTime: { $gte: startUTC }
        }
      },
      {
        $project: {
          duration: 1,
          adjustedTime: {
            $subtract: ['$startTime', offsetMinutes * 60 * 1000]
          }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$adjustedTime' }
          },
          totalSeconds: { $sum: '$duration' },
          sessionsCount: { $sum: 1 }
        }
      }
    ]);

    const recordsMap = new Map();
    dailyRecords.forEach(r => recordsMap.set(r._id, r));

    // Fill every day in the requested window to provide a continuous chart
    const timeline = [];
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const userLocal = new Date(d.getTime() - offsetMinutes * 60 * 1000);
      const yyyy = userLocal.getUTCFullYear();
      const mm = String(userLocal.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(userLocal.getUTCDate()).padStart(2, '0');
      const dateKey = `${yyyy}-${mm}-${dd}`;

      const rec = recordsMap.get(dateKey);
      const seconds = rec ? rec.totalSeconds : 0;
      const minutes = Math.round(seconds / 60);
      const hours = Number((seconds / 3600).toFixed(2));
      const sessions = rec ? rec.sessionsCount : 0;

      // Friendly display label (e.g. "Mon 04" or "Nov 04")
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const label = daysCount <= 7 
        ? `${dayNames[userLocal.getUTCDay()]} ${dd}` 
        : `${monthNames[userLocal.getUTCMonth()]} ${dd}`;

      timeline.push({
        date: dateKey,
        label,
        studyMinutes: minutes,
        studyHours: hours,
        sessionsCount: sessions
      });
    }

    return res.status(200).json({
      success: true,
      range: daysCount,
      data: timeline
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Weekly productivity statistics
// @route   GET /api/analytics/weekly
// @access  Private
const getWeekly = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { tzOffset = 0 } = req.query;
    const offsetMinutes = parseInt(tzOffset, 10) || 0;

    // Past 8 weeks
    const pastWeeksCount = 8;
    const now = new Date();
    const startDate = new Date(now.getTime() - (pastWeeksCount * 7) * 24 * 60 * 60 * 1000);

    const weeklyRecords = await StudySession.aggregate([
      {
        $match: {
          userId,
          status: 'completed',
          startTime: { $gte: startDate }
        }
      },
      {
        $project: {
          duration: 1,
          adjustedTime: {
            $subtract: ['$startTime', offsetMinutes * 60 * 1000]
          }
        }
      },
      {
        $group: {
          _id: {
            year: { $isoWeekYear: '$adjustedTime' },
            week: { $isoWeek: '$adjustedTime' }
          },
          totalSeconds: { $sum: '$duration' },
          sessionsCount: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.week': 1 } }
    ]);

    const formatted = weeklyRecords.map(item => ({
      week: `W${item._id.week}`,
      year: item._id.year,
      label: `Week ${item._id.week}`,
      studyMinutes: Math.round(item.totalSeconds / 60),
      studyHours: Number((item.totalSeconds / 3600).toFixed(1)),
      sessionsCount: item.sessionsCount
    }));

    return res.status(200).json({
      success: true,
      data: formatted
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Monthly study activity
// @route   GET /api/analytics/monthly
// @access  Private
const getMonthly = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { tzOffset = 0 } = req.query;
    const offsetMinutes = parseInt(tzOffset, 10) || 0;

    // Past 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyRecords = await StudySession.aggregate([
      {
        $match: {
          userId,
          status: 'completed',
          startTime: { $gte: sixMonthsAgo }
        }
      },
      {
        $project: {
          duration: 1,
          adjustedTime: {
            $subtract: ['$startTime', offsetMinutes * 60 * 1000]
          }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m', date: '$adjustedTime' }
          },
          totalSeconds: { $sum: '$duration' },
          sessionsCount: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formatted = monthlyRecords.map(item => {
      const parts = item._id.split('-');
      const monthIdx = parseInt(parts[1], 10) - 1;
      return {
        month: item._id,
        label: `${monthNames[monthIdx]} ${parts[0]}`,
        studyMinutes: Math.round(item.totalSeconds / 60),
        studyHours: Number((item.totalSeconds / 3600).toFixed(1)),
        sessionsCount: item.sessionsCount
      };
    });

    return res.status(200).json({
      success: true,
      data: formatted
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Subject-wise study distribution
// @route   GET /api/analytics/subjects
// @access  Private
const getSubjectDistribution = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { range } = req.query;

    const filter = { userId, status: 'completed' };
    if (range === 'today') {
      const { startUTC, endUTC } = getDayBounds(new Date());
      filter.startTime = { $gte: startUTC, $lte: endUTC };
    } else if (range === '7') {
      filter.startTime = { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) };
    } else if (range === '30') {
      filter.startTime = { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) };
    }

    const distribution = await StudySession.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$subjectId',
          totalSeconds: { $sum: '$duration' },
          sessionsCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'subjects',
          localField: '_id',
          foreignField: '_id',
          as: 'subject'
        }
      },
      { $unwind: '$subject' },
      {
        $project: {
          subjectId: '$_id',
          name: '$subject.name',
          color: '$subject.color',
          totalSeconds: 1,
          sessionsCount: 1
        }
      },
      { $sort: { totalSeconds: -1 } }
    ]);

    const overallSeconds = distribution.reduce((acc, curr) => acc + curr.totalSeconds, 0);

    const formatted = distribution.map(item => ({
      ...item,
      studyMinutes: Math.round(item.totalSeconds / 60),
      studyHours: Number((item.totalSeconds / 3600).toFixed(1)),
      percentage: overallSeconds > 0 ? Math.round((item.totalSeconds / overallSeconds) * 100) : 0
    }));

    return res.status(200).json({
      success: true,
      totalSeconds: overallSeconds,
      data: formatted
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Planned vs completed study time
// @route   GET /api/analytics/planned-vs-completed
// @access  Private
const getPlannedVsCompleted = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Get all user goals with planned durations
    const goals = await StudyGoal.find({ userId })
      .populate('subjectId', 'name color')
      .lean();

    // Group actual completed duration for each goal
    const goalIds = goals.map(g => g._id);
    const completedByGoal = await StudySession.aggregate([
      {
        $match: {
          userId,
          status: 'completed',
          goalId: { $in: goalIds }
        }
      },
      {
        $group: {
          _id: '$goalId',
          actualSeconds: { $sum: '$duration' }
        }
      }
    ]);

    const actualMap = new Map();
    completedByGoal.forEach(g => {
      actualMap.set(String(g._id), g.actualSeconds);
    });

    const goalsComparison = goals.map(g => {
      const actualSec = actualMap.get(String(g._id)) || 0;
      const actualMin = Math.round(actualSec / 60);
      return {
        id: g._id,
        title: g.title,
        subjectName: g.subjectId?.name || 'General',
        color: g.subjectId?.color || '#8B5CF6',
        plannedMinutes: g.plannedDuration,
        completedMinutes: actualMin,
        plannedHours: Number((g.plannedDuration / 60).toFixed(1)),
        completedHours: Number((actualMin / 60).toFixed(1)),
        completionRate: Math.min(100, Math.round((actualMin / g.plannedDuration) * 100))
      };
    });

    // Subject-level planned vs completed
    const subjectMap = new Map();
    goals.forEach(g => {
      const subId = String(g.subjectId?._id || 'other');
      const subName = g.subjectId?.name || 'Other';
      const color = g.subjectId?.color || '#8B5CF6';

      if (!subjectMap.has(subId)) {
        subjectMap.set(subId, {
          subjectId: subId,
          name: subName,
          color,
          plannedMinutes: 0,
          completedMinutes: 0
        });
      }
      const entry = subjectMap.get(subId);
      entry.plannedMinutes += g.plannedDuration;
    });

    // Add subject completed session totals
    const subjectSessionStats = await StudySession.aggregate([
      {
        $match: {
          userId,
          status: 'completed'
        }
      },
      {
        $group: {
          _id: '$subjectId',
          totalSeconds: { $sum: '$duration' }
        }
      }
    ]);

    subjectSessionStats.forEach(stat => {
      const subId = String(stat._id);
      if (subjectMap.has(subId)) {
        const entry = subjectMap.get(subId);
        entry.completedMinutes = Math.round(stat.totalSeconds / 60);
      }
    });

    const subjectsComparison = Array.from(subjectMap.values()).map(s => ({
      ...s,
      plannedHours: Number((s.plannedMinutes / 60).toFixed(1)),
      completedHours: Number((s.completedMinutes / 60).toFixed(1))
    }));

    return res.status(200).json({
      success: true,
      data: {
        byGoals: goalsComparison,
        bySubjects: subjectsComparison
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOverview,
  getDaily,
  getWeekly,
  getMonthly,
  getSubjectDistribution,
  getPlannedVsCompleted
};

