const mongoose = require('mongoose');

const studySessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Session must belong to a user'],
      index: true
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Session must be linked to a subject'],
      index: true
    },
    goalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudyGoal',
      default: null,
      index: true
    },
    title: {
      type: String,
      required: [true, 'Session title is required'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: ''
    },
    startTime: {
      type: Date,
      required: [true, 'Start time is required'],
      default: Date.now
    },
    endTime: {
      type: Date,
      default: null
    },
    duration: {
      type: Number,
      default: 0,
      min: [0, 'Duration cannot be negative']
    },
    status: {
      type: String,
      enum: ['active', 'paused', 'completed', 'cancelled'],
      default: 'active'
    },
    accumulatedDuration: {
      type: Number,
      default: 0,
      min: [0, 'Accumulated duration cannot be negative']
    },
    lastResumedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Index to quickly look up active or paused sessions for a user
studySessionSchema.index({ userId: 1, status: 1 });
studySessionSchema.index({ userId: 1, startTime: -1 });

module.exports = mongoose.model('StudySession', studySessionSchema);

