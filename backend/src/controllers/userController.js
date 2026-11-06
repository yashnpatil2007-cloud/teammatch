const fs = require('fs');
const path = require('path');
const { db, save, uid, now } = require('../data/store');
const { asyncHandler } = require('../utils/generateToken');
const { publicUser } = require('../middleware/auth');
const { CERTIFICATES_DIR, RESUMES_DIR, AVATARS_DIR } = require('../middleware/upload');
const { storageService } = require('../services/storageService');

const badgeFor = (score) => {
  if (score >= 90) return 'Platinum';
  if (score >= 75) return 'Gold';
  if (score >= 60) return 'Silver';
  return 'Bronze';
};

const publicList = (users) => users.map(publicUser);

const getLeaderboard = asyncHandler(async (req, res) => {
  const metric = req.query.metric || 'reliability';
  const list = [...db.users].filter((u) => u.role !== 'admin');
  if (metric === 'rating') list.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
  else list.sort((a, b) => (b.reliabilityScore || 0) - (a.reliabilityScore || 0));
  res.json(publicList(list).slice(0, 50));
});

const listUsers = asyncHandler(async (req, res) => {
  const { role, q } = req.query;
  let list = [...db.users];
  if (role) list = list.filter((u) => u.role === role);
  if (q) {
    const term = String(q).toLowerCase();
    list = list.filter((u) => u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term));
  }
  res.json(publicList(list));
});

const getProfile = asyncHandler(async (req, res) => {
  const user = db.users.find((u) => u._id === req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  const reviews = db.reviews.filter((r) => r.reviewee === user._id);
  res.json({ ...publicUser(user), reviews });
});

const updateProfile = asyncHandler(async (req, res) => {
  const user = db.users.find((u) => u._id === req.user._id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  const {
    name,
    skills,
    github,
    linkedin,
    bio,
    about,
    avatar,
    profilePicture,
    phone,
    college,
    year,
    branch,
    location,
    portfolio,
    website,
    resumeUrl,
  } = req.body;
  if (name !== undefined && String(name).trim()) user.name = String(name).trim();
  if (skills !== undefined && Array.isArray(skills)) {
    const existingSkills = user.skills || [];
    user.skills = skills.map((s) => {
      const sName = typeof s === 'string' ? s.trim().toLowerCase() : (s.name || '').trim().toLowerCase();
      const existing = existingSkills.find((ex) => ex.name.toLowerCase() === sName);
      if (typeof s === 'object' && s !== null) {
        return {
          name: sName,
          level: existing ? Math.max(existing.level || 1, Number(s.level) || 1) : Math.max(1, Math.min(10, Number(s.level) || 5)),
          verifiedScore: existing?.verifiedScore !== undefined ? existing.verifiedScore : (s.verifiedScore !== undefined ? Number(s.verifiedScore) : 0),
          badge: existing?.badge || s.badge || 'Bronze',
        };
      }
      return existing || { name: sName, level: 5, verifiedScore: 0, badge: 'Bronze' };
    }).filter((s) => s.name);
  }
  if (github !== undefined) user.github = String(github).trim();
  if (linkedin !== undefined) user.linkedin = String(linkedin).trim();
  if (bio !== undefined) user.bio = String(bio).trim();
  if (about !== undefined) user.about = String(about).trim();
  if (avatar !== undefined) user.avatar = String(avatar).trim();
  if (profilePicture !== undefined) user.profilePicture = String(profilePicture).trim();
  if (phone !== undefined) user.phone = String(phone).trim();
  if (college !== undefined) user.college = String(college).trim();
  if (year !== undefined) user.year = String(year).trim();
  if (branch !== undefined) user.branch = String(branch).trim();
  if (location !== undefined) user.location = String(location).trim();
  if (portfolio !== undefined) user.portfolio = String(portfolio).trim();
  if (website !== undefined) user.website = String(website).trim();
  if (resumeUrl !== undefined) user.resumeUrl = String(resumeUrl).trim();
  user.updatedAt = now();
  save();
  res.json(publicUser(user));
});

const quizSubmit = asyncHandler(async (req, res) => {
  const { skill, level, score } = req.body;
  if (skill === undefined || score === undefined) {
    return res.status(400).json({ message: 'skill and score are required' });
  }
  const badge = badgeFor(Number(score));
  const verified = Number(score) >= 60;
  const user = db.users.find((u) => u._id === req.user._id);

  if (user) {
    user.quizScores = user.quizScores || [];
    user.quizScores.push({ _id: uid(), skill, level: Number(level) || 1, score: Number(score), badge, takenAt: now() });
    const existing = (user.skills || []).find((s) => s.name.toLowerCase() === String(skill).toLowerCase());
    if (verified) {
      const estLevel = Math.max(1, Math.min(10, Math.round(Number(score) / 10)));
      if (existing) {
        existing.level = Math.max(existing.level, estLevel);
        existing.verifiedScore = Number(score);
        existing.badge = badge;
      } else {
        user.skills = user.skills || [];
        user.skills.push({ name: skill, level: estLevel, verifiedScore: Number(score), badge });
      }
      user.reliabilityScore = Math.min(100, (user.reliabilityScore || 75) + 2);
    }
    save();
  }

  res.json({ skill, level, score: Number(score), badge, verified });
});

const quizHistory = asyncHandler(async (req, res) => {
  const user = db.users.find((u) => u._id === req.user._id);
  res.json((user && user.quizScores) || []);
});

const adminUpdateUser = asyncHandler(async (req, res) => {
  const user = db.users.find((u) => u._id === req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  const allowedRoles = ['member', 'leader', 'organizer', 'admin'];
  const { role, isVerified, reliabilityScore, name, bio } = req.body;
  if (role !== undefined) {
    if (!allowedRoles.includes(role)) return res.status(400).json({ message: 'Invalid role' });
    if (user._id === req.user._id && role !== 'admin') {
      return res.status(400).json({ message: 'You cannot remove your own admin role' });
    }
    user.role = role;
  }
  if (isVerified !== undefined) user.isVerified = !!isVerified;
  if (reliabilityScore !== undefined) user.reliabilityScore = Math.max(0, Math.min(100, Number(reliabilityScore)));
  if (name !== undefined && String(name).trim()) user.name = String(name).trim();
  if (bio !== undefined) user.bio = bio;
  user.updatedAt = now();
  save();
  res.json(publicUser(user));
});

const removeUser = asyncHandler(async (req, res) => {
  if (req.params.id === req.user._id) return res.status(400).json({ message: 'You cannot delete your own account' });
  const idx = db.users.findIndex((u) => u._id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'User not found' });
  db.users.splice(idx, 1);
  save();
  res.json({ message: 'User removed' });
});

const addCertificate = asyncHandler(async (req, res) => {
  const user = db.users.find((u) => u._id === req.user._id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  const { title, issuer, issueDate, credentialId, verificationUrl, url, skill } = req.body;
  if (!title || !String(title).trim()) return res.status(400).json({ message: 'Certificate title is required' });

  user.certificates = user.certificates || [];
  db.certificates = db.certificates || [];

  const certId = 'c-' + uid().slice(0, 10);
  const cert = {
    _id: certId,
    userId: user._id,
    title: String(title).trim(),
    issuer: (issuer && String(issuer).trim()) || 'Self-uploaded',
    issueDate: issueDate || null,
    credentialId: (credentialId && String(credentialId).trim()) || '',
    verificationUrl: (verificationUrl && String(verificationUrl).trim()) || '',
    fileUrl: (url && String(url).trim()) || '',
    fileName: '',
    fileSize: 0,
    url: (url && String(url).trim()) || '',
    skill: (skill && String(skill).trim().toLowerCase()) || '',
    status: 'pending',
    rejectionReason: '',
    submittedAt: now(),
  };

  user.certificates.unshift(cert);
  db.certificates.unshift(cert);
  save();
  res.status(201).json({ certificate: cert, user: publicUser(user) });
});

const uploadCertificateFile = asyncHandler(async (req, res) => {
  const user = db.users.find((u) => u._id === req.user._id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  if (!req.file) return res.status(400).json({ message: 'Please select a certificate document (PDF, JPG, PNG or WEBP)' });

  const { title, issuer, issueDate, credentialId, verificationUrl, skill } = req.body;
  const certTitle = (title && String(title).trim()) || path.basename(req.file.originalname, path.extname(req.file.originalname));

  user.certificates = user.certificates || [];
  db.certificates = db.certificates || [];

  const certId = 'c-' + uid().slice(0, 10);
  const fileUrl = `/uploads/certificates/${req.file.filename}`;
  const cert = {
    _id: certId,
    userId: user._id,
    title: certTitle,
    issuer: (issuer && String(issuer).trim()) || 'Self-uploaded',
    issueDate: issueDate || null,
    credentialId: (credentialId && String(credentialId).trim()) || '',
    verificationUrl: (verificationUrl && String(verificationUrl).trim()) || '',
    fileUrl,
    fileName: req.file.filename,
    fileSize: req.file.size,
    fileMimeType: req.file.mimetype,
    url: fileUrl,
    skill: (skill && String(skill).trim().toLowerCase()) || '',
    status: 'pending',
    rejectionReason: '',
    submittedAt: now(),
  };

  user.certificates.unshift(cert);
  db.certificates.unshift(cert);
  save();

  res.status(201).json({ certificate: cert, user: publicUser(user), message: 'Certificate uploaded and queued for verification' });
});

const deleteCertificate = asyncHandler(async (req, res) => {
  const { certId } = req.params;
  const user = db.users.find((u) => u._id === req.user._id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  const certIndex = (user.certificates || []).findIndex((c) => c._id === certId);
  if (certIndex === -1 && req.user.role !== 'admin') {
    return res.status(404).json({ message: 'Certificate not found in your profile' });
  }

  // Remove physical file if exists
  const cert = (user.certificates || [])[certIndex];
  if (cert && cert.fileName) {
    const filePath = path.join(CERTIFICATES_DIR, cert.fileName);
    if (fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch (_) {}
    }
  }

  if (certIndex !== -1) user.certificates.splice(certIndex, 1);
  if (db.certificates) {
    const gIndex = db.certificates.findIndex((c) => c._id === certId);
    if (gIndex !== -1) db.certificates.splice(gIndex, 1);
  }

  save();
  res.json({ message: 'Certificate removed successfully', user: publicUser(user) });
});

const uploadResumeFile = asyncHandler(async (req, res) => {
  const user = db.users.find((u) => u._id === req.user._id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  if (!req.file) return res.status(400).json({ message: 'Please upload a valid PDF resume file' });

  // Delete previous resume file if existed
  if (user.resumeFileName) {
    const oldPath = path.join(RESUMES_DIR, user.resumeFileName);
    if (fs.existsSync(oldPath)) {
      try { fs.unlinkSync(oldPath); } catch (_) {}
    }
  }

  const fileUrl = `/uploads/resumes/${req.file.filename}`;
  user.resumeUrl = fileUrl;
  user.resumeFileName = req.file.filename;
  user.resumeOriginalName = req.file.originalname;
  user.resumeFileSize = req.file.size;
  user.resumeUploadedAt = now();
  user.updatedAt = now();

  save();
  res.json({
    user: publicUser(user),
    message: 'Resume uploaded successfully',
    resume: {
      url: fileUrl,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      uploadedAt: user.resumeUploadedAt,
    },
  });
});

const deleteResume = asyncHandler(async (req, res) => {
  const user = db.users.find((u) => u._id === req.user._id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  if (user.resumeFileName) {
    const filePath = path.join(RESUMES_DIR, user.resumeFileName);
    if (fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch (_) {}
    }
  }

  user.resumeUrl = '';
  user.resumeFileName = '';
  user.resumeOriginalName = '';
  user.resumeFileSize = 0;
  user.resumeUploadedAt = null;
  user.updatedAt = now();

  save();
  res.json({ user: publicUser(user), message: 'Resume deleted successfully' });
});

const pendingCertificates = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 50 } = req.query;
  const list = [];

  db.users.forEach((u) => {
    (u.certificates || []).forEach((c) => {
      list.push({
        ...c,
        user: { _id: u._id, name: u.name, email: u.email, avatar: u.avatar, role: u.role, reliabilityScore: u.reliabilityScore },
      });
    });
  });

  let filtered = list;
  if (status && status !== 'all') {
    filtered = list.filter((c) => c.status === status);
  }

  filtered.sort((a, b) => new Date(b.submittedAt || b.uploadedAt || 0) - new Date(a.submittedAt || a.uploadedAt || 0));

  const p = Math.max(1, Number(page));
  const l = Math.max(1, Number(limit));
  const total = filtered.length;
  const paginated = filtered.slice((p - 1) * l, p * l);

  res.json(paginated);
});

const verifyCertificate = asyncHandler(async (req, res) => {
  const { certId } = req.params;
  const action = req.body.action; // 'verify' | 'reject' | 'under_review'
  const reason = (req.body.rejectionReason && String(req.body.rejectionReason).trim()) || '';

  let foundCert = null;
  for (const u of db.users) {
    const cert = (u.certificates || []).find((c) => c._id === certId);
    if (cert) {
      foundCert = cert;
      if (action === 'verify') {
        cert.status = 'verified';
        cert.rejectionReason = '';
        cert.verifiedAt = now();
        cert.reviewedAt = now();
        cert.reviewedBy = req.user._id;
        u.reliabilityScore = Math.min(100, (u.reliabilityScore || 75) + 3);
        if (cert.skill) {
          u.skills = u.skills || [];
          const existing = u.skills.find((s) => s.name.toLowerCase() === cert.skill.toLowerCase());
          if (existing) existing.badge = 'Certified';
          else u.skills.push({ name: cert.skill.toLowerCase(), level: 7, badge: 'Certified' });
        }
      } else if (action === 'reject') {
        cert.status = 'rejected';
        cert.rejectionReason = reason || 'Documentation does not meet verification requirements';
        cert.reviewedAt = now();
        cert.reviewedBy = req.user._id;
      } else if (action === 'under_review') {
        cert.status = 'under_review';
        cert.reviewedAt = now();
        cert.reviewedBy = req.user._id;
      }

      // Also update in db.certificates if present
      if (db.certificates) {
        const gCert = db.certificates.find((c) => c._id === certId);
        if (gCert) {
          Object.assign(gCert, cert);
        }
      }

      save();
      return res.json({
        certificate: cert,
        user: publicUser(u),
        message: `Certificate status updated to ${cert.status}`,
      });
    }
  }

  return res.status(404).json({ message: 'Certificate not found' });
});

/**
 * POST /api/users/profile-photo
 * Authenticated user uploads an avatar (JPG, PNG, WEBP <= 5MB)
 * Uses storageService abstraction (S3/Cloudinary in prod, local in dev)
 */
const uploadProfilePhoto = asyncHandler(async (req, res) => {
  const user = db.users.find((u) => u._id === req.user._id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  if (!req.file) {
    return res.status(400).json({ message: 'Please select an image file (JPG, PNG, or WEBP, max 5 MB)' });
  }

  // If previous avatar was stored locally in AVATARS_DIR, clean it up
  if (user.avatar && user.avatar.includes('/uploads/avatars/')) {
    const oldFileName = path.basename(user.avatar);
    const oldPath = path.join(AVATARS_DIR, oldFileName);
    if (fs.existsSync(oldPath)) {
      try { fs.unlinkSync(oldPath); } catch (_) {}
    }
  }

  // Process through storageService abstraction (S3 / Cloudinary / Local)
  const processed = await storageService.processUpload(req.file, 'avatars');

  user.profilePicture = processed.url;
  user.avatar = processed.url;
  user.updatedAt = now();

  save();

  res.status(200).json({
    message: 'Profile photo uploaded successfully',
    photoUrl: processed.url,
    user: publicUser(user),
  });
});

/**
 * DELETE /api/users/profile-photo
 * Authenticated user removes their avatar photo
 */
const deleteProfilePhoto = asyncHandler(async (req, res) => {
  const user = db.users.find((u) => u._id === req.user._id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  // Clean up local file if stored locally
  if (user.avatar && user.avatar.includes('/uploads/avatars/')) {
    const oldFileName = path.basename(user.avatar);
    const oldPath = path.join(AVATARS_DIR, oldFileName);
    if (fs.existsSync(oldPath)) {
      try { fs.unlinkSync(oldPath); } catch (_) {}
    }
  }

  user.profilePicture = '';
  user.avatar = '';
  user.updatedAt = now();

  save();

  res.status(200).json({
    message: 'Profile photo removed successfully',
    user: publicUser(user),
  });
});

module.exports = {
  getLeaderboard,
  listUsers,
  getProfile,
  updateProfile,
  quizSubmit,
  quizHistory,
  adminUpdateUser,
  removeUser,
  addCertificate,
  uploadCertificateFile,
  deleteCertificate,
  uploadResumeFile,
  deleteResume,
  pendingCertificates,
  verifyCertificate,
  uploadProfilePhoto,
  deleteProfilePhoto,
};
