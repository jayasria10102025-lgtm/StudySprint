const StudySession = require('../models/StudySession');
const Subject = require('../models/Subject');
const StudyGoal = require('../models/StudyGoal');

// Calculate live elapsed seconds for an active/paused session
const calculateCurrentElapsed = (session) => {
  if (!session) return 0;
  if (session.status === 'paused') {
    return session.accumulatedDuration || 0;
  }
  if (session.status === 'active') {
    const resumedAt = session.lastResumedAt ? new Date(session.lastResumedAt).getTime() : new Date(session.startTime).getTime();
    const additional = Math.max(0, Math.floor((Date.now() - resumedAt) / 1000));
    return (session.accumulatedDuration || 0) + additional;
  }
  return session.duration || 0;
};

// @desc    Get user's study sessions
// @route   GET /api/sessions
// @access  Private
const getSessions = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { subjectId, goalId, status, limit = 50, page = 1 } = req.query;

    const filter = { userId };
    if (subjectId) filter.subjectId = subjectId;
    if (goalId) filter.goalId = goalId;
    if (status) filter.status = status;

    const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const skip = (parsedPage - 1) * parsedLimit;

    const [total, sessions] = await Promise.all([
      StudySession.countDocuments(filter),
      StudySession.find(filter)
        .populate('subjectId', 'name color')
        .populate('goalId', 'title plannedDuration targetDate')
        .sort({ startTime: -1 })
        .skip(skip)
        .limit(parsedLimit)
        .lean()
    ]);

    // Attach current live elapsed time if session is active or paused
    const enrichedSessions = sessions.map(session => {
      if (session.status === 'active' || session.status === 'paused') {
        return {
          ...session,
          currentElapsedSeconds: calculateCurrentElapsed(session)
        };
      }
      return session;
    });

    return res.status(200).json({
      success: true,
      total,
      page: parsedPage,
      pages: Math.ceil(total / parsedLimit) || 1,
      data: enrichedSessions
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current active or paused session
// @route   GET /api/sessions/active
// @access  Private
const getActiveSession = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const activeSession = await StudySession.findOne({
      userId,
      status: { $in: ['active', 'paused'] }
    })
      .populate('subjectId', 'name color')
      .populate('goalId', 'title plannedDuration targetDate');

    if (!activeSession) {
      return res.status(200).json({
        success: true,
        session: null
      });
    }

    const currentElapsed = calculateCurrentElapsed(activeSession);

    return res.status(200).json({
      success: true,
      session: {
        ...activeSession.toObject(),
        currentElapsedSeconds: currentElapsed
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Start a new study session
// @route   POST /api/sessions/start
// @access  Private
const startSession = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { subjectId, goalId, title, description } = req.body;

    // Check if user already has an active or paused session
    const existing = await StudySession.findOne({
      userId,
      status: { $in: ['active', 'paused'] }
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'You already have an active or paused study session. Please complete or cancel it first.',
        activeSessionId: existing._id
      });
    }

    // Verify subject
    const subject = await Subject.findOne({ _id: subjectId, userId });
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Selected subject was not found or access denied'
      });
    }

    // Verify goal if provided
    if (goalId) {
      const goal = await StudyGoal.findOne({ _id: goalId, userId });
      if (!goal) {
        return res.status(404).json({
          success: false,
          message: 'Selected study goal was not found or access denied'
        });
      }
    }

    const now = new Date();
    const session = await StudySession.create({
      userId,
      subjectId,
      goalId: goalId || null,
      title: title.trim(),
      description: description ? description.trim() : '',
      startTime: now,
      lastResumedAt: now,
      accumulatedDuration: 0,
      duration: 0,
      status: 'active'
    });

    const populated = await StudySession.findById(session._id)
      .populate('subjectId', 'name color')
      .populate('goalId', 'title plannedDuration targetDate');

    return res.status(201).json({
      success: true,
      message: 'Study session started',
      session: {
        ...populated.toObject(),
        currentElapsedSeconds: 0
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Pause active study session
// @route   PATCH /api/sessions/:id/pause
// @access  Private
const pauseSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const session = await StudySession.findOne({ _id: id, userId });
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found or access denied'
      });
    }

    if (session.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: `Cannot pause a session with status "${session.status}". Must be active.`
      });
    }

    const resumedAt = session.lastResumedAt ? new Date(session.lastResumedAt).getTime() : new Date(session.startTime).getTime();
    const additional = Math.max(0, Math.floor((Date.now() - resumedAt) / 1000));

    session.accumulatedDuration = (session.accumulatedDuration || 0) + additional;
    session.status = 'paused';
    session.lastResumedAt = null;

    await session.save();

    const populated = await StudySession.findById(session._id)
      .populate('subjectId', 'name color')
      .populate('goalId', 'title plannedDuration targetDate');

    return res.status(200).json({
      success: true,
      message: 'Session paused',
      session: {
        ...populated.toObject(),
        currentElapsedSeconds: session.accumulatedDuration
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Resume paused study session
// @route   PATCH /api/sessions/:id/resume
// @access  Private
const resumeSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const session = await StudySession.findOne({ _id: id, userId });
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found or access denied'
      });
    }

    if (session.status !== 'paused') {
      return res.status(400).json({
        success: false,
        message: `Cannot resume a session with status "${session.status}". Must be paused.`
      });
    }

    session.status = 'active';
    session.lastResumedAt = new Date();

    await session.save();

    const populated = await StudySession.findById(session._id)
      .populate('subjectId', 'name color')
      .populate('goalId', 'title plannedDuration targetDate');

    return res.status(200).json({
      success: true,
      message: 'Session resumed',
      session: {
        ...populated.toObject(),
        currentElapsedSeconds: session.accumulatedDuration
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Complete study session
// @route   PATCH /api/sessions/:id/complete
// @access  Private
const completeSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const session = await StudySession.findOne({ _id: id, userId });
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found or access denied'
      });
    }

    if (session.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'This session is already completed'
      });
    }

    if (session.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot complete a cancelled session'
      });
    }

    let totalDuration = session.accumulatedDuration || 0;
    if (session.status === 'active') {
      const resumedAt = session.lastResumedAt ? new Date(session.lastResumedAt).getTime() : new Date(session.startTime).getTime();
      const additional = Math.max(0, Math.floor((Date.now() - resumedAt) / 1000));
      totalDuration += additional;
    }

    session.status = 'completed';
    session.duration = totalDuration;
    session.endTime = new Date();

    await session.save();

    // If linked to a goal, check if goal is completed
    if (session.goalId) {
      const goal = await StudyGoal.findOne({ _id: session.goalId, userId });
      if (goal && goal.status !== 'completed') {
        const goalStats = await StudySession.aggregate([
          {
            $match: {
              userId,
              goalId: goal._id,
              status: 'completed'
            }
          },
          {
            $group: {
              _id: '$goalId',
              totalSeconds: { $sum: '$duration' }
            }
          }
        ]);
        const totalMinutes = Math.floor((goalStats[0]?.totalSeconds || 0) / 60);
        if (totalMinutes >= goal.plannedDuration) {
          goal.status = 'completed';
          await goal.save();
        }
      }
    }

    const populated = await StudySession.findById(session._id)
      .populate('subjectId', 'name color')
      .populate('goalId', 'title plannedDuration targetDate');

    return res.status(200).json({
      success: true,
      message: 'Study session completed successfully!',
      session: populated
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel study session
// @route   PATCH /api/sessions/:id/cancel
// @access  Private
const cancelSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const session = await StudySession.findOne({ _id: id, userId });
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found or access denied'
      });
    }

    if (session.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel an already completed session'
      });
    }

    session.status = 'cancelled';
    session.endTime = new Date();
    session.duration = 0; // Cancelled session duration is 0 and not counted

    await session.save();

    return res.status(200).json({
      success: true,
      message: 'Study session cancelled',
      session
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSessions,
  getActiveSession,
  startSession,
  pauseSession,
  resumeSession,
  completeSession,
  cancelSession
};
