const mongoose = require('mongoose');

const EmbeddedUserSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName:  { type: String, required: true, trim: true },
    email:     { type: String, required: true, lowercase: true, trim: true },
    role:      { type: String, enum: ['admin', 'manager'], required: true }
  },
  { _id: false }
);

const DepartmentSchema = new mongoose.Schema(
  {
    name:           { type: String, required: true, trim: true },
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },

    description: { type: String, default: '' },

    createdBy: { type: EmbeddedUserSchema, required: true },

    managers:  [EmbeddedUserSchema],

    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Department', DepartmentSchema);
