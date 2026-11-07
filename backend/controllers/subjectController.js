const Subject = require('../models/Subject');
const StudyGoal = require('../models/StudyGoal');
const StudySession = require('../models/StudySession');
const StudyNote = require('../models/StudyNote');

// @desc    Get all subjects for current user with statistics
// @route   GET /api/subjects
// @access  Private
const getSubjects = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Fetch user subjects
    const subjects = await Subject.find({ userId }).sort({ createdAt: -1 }).lean();

    // Aggregate completed session statistics per subject
    const sessionStats = await StudySession.aggregate([
      {
        $match: {
          userId,
          status: 'completed'
        }
      },
      {
        $group: {
          _id: '$subjectId',
          totalStudySeconds: { $sum: '$duration' },
          completedSessionsCount: { $sum: 1 }
        }
      }
    ]);

    // Aggregate active goals per subject
    const goalStats = await StudyGoal.aggregate([
      {
        $match: {
          userId,
          status: 'in_progress'
        }
      },
      {
        $group: {
          _id: '$subjectId',
          activeGoalsCount: { $sum: 1 }
        }
      }
    ]);

    const sessionStatsMap = new Map();
    sessionStats.forEach(stat => {
      sessionStatsMap.set(String(stat._id), stat);
    });

    const goalStatsMap = new Map();
    goalStats.forEach(stat => {
      goalStatsMap.set(String(stat._id), stat.activeGoalsCount);
    });

    const enrichedSubjects = subjects.map(subject => {
      const stats = sessionStatsMap.get(String(subject._id)) || {
        totalStudySeconds: 0,
        completedSessionsCount: 0
      };
      return {
        ...subject,
        totalStudySeconds: stats.totalStudySeconds || 0,
        completedSessionsCount: stats.completedSessionsCount || 0,
        activeGoalsCount: goalStatsMap.get(String(subject._id)) || 0
      };
    });

    return res.status(200).json({
      success: true,
      count: enrichedSubjects.length,
      data: enrichedSubjects
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single subject by ID
// @route   GET /api/subjects/:id
// @access  Private
const getSubjectById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const subject = await Subject.findOne({ _id: id, userId });
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found or access denied'
      });
    }

    return res.status(200).json({
      success: true,
      data: subject
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new subject
// @route   POST /api/subjects
// @access  Private
const createSubject = async (req, res, next) => {
  try {
    const { name, description, color } = req.body;
    const userId = req.user._id;

    // Check for duplicate name for this user (case-insensitive)
    const existing = await Subject.findOne({
      userId,
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') }
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'A subject with this name already exists in your workspace'
      });
    }

    const subject = await Subject.create({
      userId,
      name: name.trim(),
      description: description ? description.trim() : '',
      color: color || '#8B5CF6'
    });

    return res.status(201).json({
      success: true,
      message: 'Subject created successfully',
      data: subject
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a subject
// @route   PUT /api/subjects/:id
// @access  Private
const updateSubject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, color } = req.body;
    const userId = req.user._id;

    const subject = await Subject.findOne({ _id: id, userId });
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found or access denied'
      });
    }

    if (name && name.trim().toLowerCase() !== subject.name.toLowerCase()) {
      const existing = await Subject.findOne({
        userId,
        _id: { $ne: id },
        name: { $regex: new RegExp(`^${name.trim()}$`, 'i') }
      });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'Another subject with this name already exists'
        });
      }
      subject.name = name.trim();
    }

    if (description !== undefined) {
      subject.description = description.trim();
    }
    if (color) {
      subject.color = color;
    }

    await subject.save();

    return res.status(200).json({
      success: true,
      message: 'Subject updated successfully',
      data: subject
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Safely delete a subject
// @route   DELETE /api/subjects/:id
// @access  Private
const deleteSubject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { cascade } = req.query;
    const userId = req.user._id;

    const subject = await Subject.findOne({ _id: id, userId });
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found or access denied'
      });
    }

    // Check for associated records to prevent orphan data
    const [goalsCount, sessionsCount, notesCount] = await Promise.all([
      StudyGoal.countDocuments({ subjectId: id, userId }),
      StudySession.countDocuments({ subjectId: id, userId }),
      StudyNote.countDocuments({ subjectId: id, userId })
    ]);

    const hasAssociatedData = goalsCount > 0 || sessionsCount > 0 || notesCount > 0;

    if (hasAssociatedData && cascade !== 'true') {
      return res.status(409).json({
        success: false,
        message: `Cannot safely delete subject "${subject.name}" because it contains associated records.`,
        requiresCascade: true,
        counts: {
          goals: goalsCount,
          sessions: sessionsCount,
          notes: notesCount
        }
      });
    }

    // If cascade=true was confirmed by the user, remove associated records cleanly
    if (hasAssociatedData && cascade === 'true') {
      await Promise.all([
        StudyGoal.deleteMany({ subjectId: id, userId }),
        StudySession.deleteMany({ subjectId: id, userId }),
        StudyNote.deleteMany({ subjectId: id, userId })
      ]);
    }

    await Subject.deleteOne({ _id: id });

    return res.status(200).json({
      success: true,
      message: `Subject "${subject.name}" and all associated data were successfully deleted`
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject
};

