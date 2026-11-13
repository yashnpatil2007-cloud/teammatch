const mongoose = require('mongoose');

const platformSettingSchema = new mongoose.Schema(
  {
    _id: { type: String, default: 'platform-default' },
    platformName: { type: String, default: 'TeamMatch' },
    allowMemberRegistration: { type: Boolean, default: true },
    allowLeaderRegistration: { type: Boolean, default: true },
    allowOrganizerRegistration: { type: Boolean, default: false },
    requireAdminApprovalForCompetitions: { type: Boolean, default: false },
    maxTeamsPerStudent: { type: Number, default: 3, min: 1, max: 20 },
    maintenanceMode: { type: Boolean, default: false },
    updatedBy: { type: String, default: '' },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

module.exports = mongoose.models.PlatformSetting || mongoose.model('PlatformSetting', platformSettingSchema);

