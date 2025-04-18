// Schema/MeetingRecord.js
const mongoose = require('mongoose');

const meetingRecordSchema = new mongoose.Schema({
  taskId: {
    type: String,
    required: true,
  },
  google_meeting_link: {
    type: String,
    required: true
  },
  start_time: {
    type: Date,
    required: true
  },
  end_time: {
    type: Date,
    required: true
  },
  duration: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true
  }
}, { timestamps: true });

const MeetingRecord = mongoose.model('MeetingRecord', meetingRecordSchema);

module.exports = MeetingRecord;