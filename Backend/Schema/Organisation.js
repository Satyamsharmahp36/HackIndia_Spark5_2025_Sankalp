const mongoose = require('mongoose');

const AdminSubSchema = new mongoose.Schema(
  {
    firstName:  { type: String, required: true, trim: true },
    lastName:   { type: String, required: true, trim: true },
    email:      { type: String, required: true, lowercase: true, trim: true },
    password:   { type: String, required: true },           // bcrypt hash
    role:       { type: String, enum: ['admin'], default: 'admin' },
    isVerified: { type: Boolean, default: false }
  },
  { _id: false }           // don’t generate a separate _id for the sub-doc
);

const OrganizationSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true, trim: true },
    industry: { type: String, required: true, trim: true },
    size:     { type: String, required: true, trim: true },

    domain: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    admin:     { type: AdminSubSchema, required: true },

    ssoConfig: {
      enabled:  { type: Boolean, default: false },
      provider: { type: String, default: null },
      metadata: { type: Object, default: {} }
    },

    departments: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'Department' }
    ],

    active: { type: Boolean, default: true }
  },
  { timestamps: true }   // adds createdAt + updatedAt
);

module.exports = mongoose.model('Organization', OrganizationSchema);
