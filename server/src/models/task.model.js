const mongoose = require('mongoose');
const { Schema } = mongoose;

const AttachmentSchema = new Schema({
  name: { type: String, required: true },
  url: { type: String, required: true },
  type: { type: String },
  size: { type: Number },
  uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  uploadedAt: { type: Date, default: Date.now }
}, { _id: false });

const CommentAttachmentSchema = new Schema({
  name: { type: String, required: true },
  url: { type: String, required: true }
}, { _id: false });

const CommentSchema = new Schema({
  authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  attachments: [CommentAttachmentSchema],
}, {
  timestamps: true
});

const TaskSchema = new Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },

  creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  assigneeId: { type: Schema.Types.ObjectId, ref: 'User' },
  teamId: { type: Schema.Types.ObjectId, ref: 'Team' },

  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },

  status: {
    type: String,
    enum: ['todo', 'inprogress', 'review', 'done'],
    default: 'todo'
  },

  dueDate: { type: Date },
  startDate: { type: Date },

  estimatedHours: { type: Number, default: 0 },
  actualHours: { type: Number, default: 0 },

  comments: [CommentSchema],
  attachments: [AttachmentSchema],

  tags: [{ type: String }],
  dependencies: [{ type: Schema.Types.ObjectId, ref: 'Task' }],

}, {
  timestamps: true
});
TaskSchema.index({ assigneeId: 1 });
TaskSchema.index({ teamId: 1 });
TaskSchema.index({ status: 1 });
TaskSchema.index({ dueDate: 1 });

TaskSchema.methods.addComment = async function({ authorId, text, attachments = [] }) {
  this.comments.push({ authorId, text, attachments });
  await this.save();
  return this.comments[this.comments.length - 1];
};

TaskSchema.methods.addAttachment = async function(attachment) {
  this.attachments.push(attachment);
  await this.save();
  return this.attachments[this.attachments.length - 1];
};

const Task = mongoose.model('Task', TaskSchema);
module.exports = Task;
