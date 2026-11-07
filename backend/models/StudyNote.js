const mongoose = require('mongoose');

const studyNoteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Note must belong to a user'],
      index: true
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Note must be linked to a subject'],
      index: true
    },
    title: {
      type: String,
      required: [true, 'Note title is required'],
      trim: true,
      maxlength: [150, 'Note title cannot exceed 150 characters']
    },
    content: {
      type: String,
      required: [true, 'Note content is required']
    }
  },
  {
    timestamps: true
  }
);

studyNoteSchema.index({ userId: 1, subjectId: 1 });
studyNoteSchema.index({ userId: 1, title: 'text', content: 'text' });

module.exports = mongoose.model('StudyNote', studyNoteSchema);

