const StudyGoal = require('../models/StudyGoal');
const Subject = require('../models/Subject');
const StudySession = require('../models/StudySession');

// @desc    Get all study goals for current user with real session progress
// @route   GET /api/goals
// @access  Private
const getGoals = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const goals = await StudyGoal.find({ userId })
      .populate('subjectId', 'name color')
      .sort({ createdAt: -1 })
      .lean();

    // Query completed study sessions to compute actual study time per goal
    // We match sessions explicitly linked by goalId, as well as sessions for that subject
    const goalIds = goals.map(g => g._id);

    const goalSessionStats = await StudySession.aggregate([
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
          actualStudySeconds: { $sum: '$duration' },
          sessionCount: { $sum: 1 }
        }
      }
    ]);

    const statsMap = new Map();
    goalSessionStats.forEach(stat => {
      statsMap.set(String(stat._id), stat);
    });

    // Also get subject total time in case goal didn't have explicit sessions linked
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
          totalSubjectSeconds: { $sum: '$duration' }
        }
      }
    ]);

    const subjectStatsMap = new Map();
    subjectSessionStats.forEach(stat => {
      subjectStatsMap.set(String(stat._id), stat.totalSubjectSeconds);
    });

    const enrichedGoals = goals.map(goal => {
      const explicitStats = statsMap.get(String(goal._id));
      let completedSeconds = 0;
      let sessionCount = 0;

      if (explicitStats && explicitStats.actualStudySeconds > 0) {
        completedSeconds = explicitStats.actualStudySeconds;
        sessionCount = explicitStats.sessionCount;
      } else if (goal.subjectId) {
        // Fallback: subject study time if no explicit goal sessions
        const subjectSecs = subjectStatsMap.get(String(goal.subjectId._id || goal.subjectId)) || 0;
        completedSeconds = Math.min(subjectSecs, goal.plannedDuration * 60);
      }

      const completedMinutes = Math.round(completedSeconds / 60);
      const plannedMinutes = goal.plannedDuration;
      const progressPercent = Math.min(100, Math.round((completedMinutes / plannedMinutes) * 100));

      return {
        ...goal,
        completedDurationMinutes: completedMinutes,
        completedDurationSeconds: completedSeconds,
        sessionCount,
        progressPercent,
        isCompleted: goal.status === 'completed' || progressPercent >= 100
      };
    });

    return res.status(200).json({
      success: true,
      count: enrichedGoals.length,
      data: enrichedGoals
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single goal by ID
// @route   GET /api/goals/:id
// @access  Private
const getGoalById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const goal = await StudyGoal.findOne({ _id: id, userId }).populate('subjectId', 'name color');
    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found or access denied'
      });
    }

    return res.status(200).json({
      success: true,
      data: goal
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create study goal
// @route   POST /api/goals
// @access  Private
const createGoal = async (req, res, next) => {
  try {
    const { subjectId, title, description, plannedDuration, targetDate, goalType } = req.body;
    const userId = req.user._id;

    // Verify subject ownership
    const subject = await Subject.findOne({ _id: subjectId, userId });
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'The selected subject does not exist or does not belong to you'
      });
    }

    const goal = await StudyGoal.create({
      userId,
      subjectId,
      title: title.trim(),
      description: description ? description.trim() : '',
      plannedDuration: Number(plannedDuration),
      targetDate: new Date(targetDate),
      goalType: goalType || 'custom',
      status: 'in_progress'
    });

    const populated = await StudyGoal.findById(goal._id).populate('subjectId', 'name color');

    return res.status(201).json({
      success: true,
      message: 'Study goal created successfully',
      data: populated
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update study goal
// @route   PUT /api/goals/:id
// @access  Private
const updateGoal = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { subjectId, title, description, plannedDuration, targetDate, goalType, status } = req.body;
    const userId = req.user._id;

    const goal = await StudyGoal.findOne({ _id: id, userId });
    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found or access denied'
      });
    }

    if (subjectId && String(subjectId) !== String(goal.subjectId)) {
      const subject = await Subject.findOne({ _id: subjectId, userId });
      if (!subject) {
        return res.status(404).json({
          success: false,
          message: 'The selected subject does not exist or does not belong to you'
        });
      }
      goal.subjectId = subjectId;
    }

    if (title) goal.title = title.trim();
    if (description !== undefined) goal.description = description.trim();
    if (plannedDuration) goal.plannedDuration = Number(plannedDuration);
    if (targetDate) goal.targetDate = new Date(targetDate);
    if (goalType) goal.goalType = goalType;
    if (status) goal.status = status;

    await goal.save();
    const populated = await StudyGoal.findById(goal._id).populate('subjectId', 'name color');

    return res.status(200).json({
      success: true,
      message: 'Study goal updated successfully',
      data: populated
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete study goal
// @route   DELETE /api/goals/:id
// @access  Private
const deleteGoal = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const goal = await StudyGoal.findOne({ _id: id, userId });
    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found or access denied'
      });
    }

    // Unlink sessions from this goal (do not delete the study sessions themselves)
    await StudySession.updateMany({ goalId: id, userId }, { $set: { goalId: null } });

    await StudyGoal.deleteOne({ _id: id });

    return res.status(200).json({
      success: true,
      message: 'Study goal deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getGoals,
  getGoalById,
  createGoal,
  updateGoal,
  deleteGoal
};

