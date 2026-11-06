const StudyNote = require('../models/StudyNote');
const Subject = require('../models/Subject');

// @desc    Get all study notes with optional search & subject filter
// @route   GET /api/notes
// @access  Private
const getNotes = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { subjectId, search } = req.query;

    const filter = { userId };
    if (subjectId) {
      filter.subjectId = subjectId;
    }

    if (search && search.trim()) {
      const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { title: { $regex: escaped, $options: 'i' } },
        { content: { $regex: escaped, $options: 'i' } }
      ];
    }

    const notes = await StudyNote.find(filter)
      .populate('subjectId', 'name color')
      .sort({ updatedAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: notes.length,
      data: notes
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create study note
// @route   POST /api/notes
// @access  Private
const createNote = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { subjectId, title, content } = req.body;

    const subject = await Subject.findOne({ _id: subjectId, userId });
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'The selected subject does not exist or does not belong to you'
      });
    }

    const note = await StudyNote.create({
      userId,
      subjectId,
      title: title.trim(),
      content: content.trim()
    });

    const populated = await StudyNote.findById(note._id).populate('subjectId', 'name color');

    return res.status(201).json({
      success: true,
      message: 'Study note created successfully',
      data: populated
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update study note
// @route   PUT /api/notes/:id
// @access  Private
const updateNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const { subjectId, title, content } = req.body;

    const note = await StudyNote.findOne({ _id: id, userId });
    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found or access denied'
      });
    }

    if (subjectId && String(subjectId) !== String(note.subjectId)) {
      const subject = await Subject.findOne({ _id: subjectId, userId });
      if (!subject) {
        return res.status(404).json({
          success: false,
          message: 'The selected subject does not exist or does not belong to you'
        });
      }
      note.subjectId = subjectId;
    }

    if (title !== undefined) note.title = title.trim();
    if (content !== undefined) note.content = content.trim();

    await note.save();

    const populated = await StudyNote.findById(note._id).populate('subjectId', 'name color');

    return res.status(200).json({
      success: true,
      message: 'Study note updated successfully',
      data: populated
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete study note
// @route   DELETE /api/notes/:id
// @access  Private
const deleteNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const note = await StudyNote.findOne({ _id: id, userId });
    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found or access denied'
      });
    }

    await StudyNote.deleteOne({ _id: id });

    return res.status(200).json({
      success: true,
      message: 'Study note deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotes,
  createNote,
  updateNote,
  deleteNote
};
