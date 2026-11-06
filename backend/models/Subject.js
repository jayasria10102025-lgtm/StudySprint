const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Subject must belong to a user'],
      index: true
    },
    name: {
      type: String,
      required: [true, 'Subject name is required'],
      trim: true,
      maxlength: [80, 'Subject name cannot exceed 80 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [300, 'Description cannot exceed 300 characters'],
      default: ''
    },
    color: {
      type: String,
      default: '#8B5CF6'
    }
  },
  {
    timestamps: true
  }
);

// Ensure subject name is unique per user (case-insensitive indexing handled at query / lowercased comparison)
subjectSchema.index({ userId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Subject', subjectSchema);
