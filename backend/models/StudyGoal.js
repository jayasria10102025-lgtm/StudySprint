const mongoose = require('mongoose');

const studyGoalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Goal must belong to a user'],
      index: true
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Goal must be linked to a subject'],
      index: true
    },
    title: {
      type: String,
      required: [true, 'Goal title is required'],
      trim: true,
      maxlength: [120, 'Goal title cannot exceed 120 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: ''
    },
    plannedDuration: {
      type: Number,
      required: [true, 'Planned duration (in minutes) is required'],
      min: [1, 'Planned duration must be at least 1 minute']
    },
    targetDate: {
      type: Date,
      required: [true, 'Target date is required']
    },
    goalType: {
      type: String,
      enum: ['daily', 'weekly', 'custom'],
      default: 'custom'
    },
    status: {
      type: String,
      enum: ['in_progress', 'completed'],
      default: 'in_progress'
    }
  },
  {
    timestamps: true
  }
);

studyGoalSchema.index({ userId: 1, targetDate: 1 });
studyGoalSchema.index({ userId: 1, subjectId: 1 });

module.exports = mongoose.model('StudyGoal', studyGoalSchema);
