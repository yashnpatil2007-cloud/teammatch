const fs = require('fs');
const path = require('path');
const { db, save, uid, now } = require('../data/store');
const { asyncHandler } = require('../utils/generateToken');
const { publicUser } = require('../middleware/auth');
const { CERTIFICATES_DIR, RESUMES_DIR, AVATARS_DIR } = require('../middleware/upload');
const { storageService } = require('../services/storageService');
const { recordAudit } = require('../utils/audit');

const badgeFor = (score) => {
  if (score >= 90) return 'Platinum';
  if (score >= 75) return 'Gold';
  if (score >= 60) return 'Silver';
  return 'Bronze';
};

const publicList = (users) => users.map(publicUser);

const directorySummaryUser = (u) => ({
  _id: u._id,
  name: u.name,
  role: u.role,
  avatar: u.avatar || '',
  profilePicture: u.profilePicture || '',
  skills: u.skills || [],
  reliabilityScore: u.reliabilityScore ?? 70,
  averageRating: u.averageRating || 0,
  totalReviews: u.totalReviews || 0,
  isVerified: !!u.isVerified,
  accountStatus: u.accountStatus || 'active',
});

const getLeaderboard = asyncHandler(async (req, res) => {
  const metric = req.query.metric || 'reliability';
  const list = [...db.users].filter((u) => u.role !== 'admin' && (u.accountStatus || 'active') === 'active');
  if (metric === 'rating') list.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
  else list.sort((a, b) => (b.reliabilityScore || 0) - (a.reliabilityScore || 0));
  res.json(list.map(directorySummaryUser).slice(0, 50));
});

const listUsers = asyncHandler(async (req, res) => {
  const { role, q } = req.query;
  let list = [...db.users];
  if (role) list = list.filter((u) => u.role === role);
  if (q) {
    const term = String(q).toLowerCase();
    list = list.filter((u) => {
      if (req.user.role === 'admin') {
        return u.name.toLowerCase().includes(term) || (u.email || '').toLowerCase().includes(term);
      }
      return u.name.toLowerCase().includes(term);
    });
  }
  if (req.user.role === 'admin') {
    return res.json(publicList(list));
  }
  res.json(list.filter((u) => (u.accountStatus || 'active') === 'active').map(directorySummaryUser));
});

const getProfile = asyncHandler(async (req, res) => {
  const user = db.users.find((u) => u._id === req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  const reviews = db.reviews.filter((r) => r.reviewee === user._id);
  const canViewFull = req.user.role === 'admin' || req.user._id === user._id;
  if (canViewFull) {
    return res.json({ ...publicUser(user), reviews });
  }
  return res.json({
    ...directorySummaryUser(user),
    bio: user.bio || '',
    about: user.about || '',
    college: user.college || '',
    course: user.course || '',
    year: user.year || '',
    branch: user.branch || '',
    github: user.github || '',
    linkedin: user.linkedin || '',
    portfolio: user.portfolio || '',
    interests: user.interests || [],
    availability: user.availability || '',
    reviews,
  });
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
    course,
    year,
    branch,
    location,
    interests,
    availability,
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
  if (course !== undefined) user.course = String(course).trim();
  if (year !== undefined) user.year = String(year).trim();
  if (branch !== undefined) user.branch = String(branch).trim();
  if (location !== undefined) user.location = String(location).trim();
  if (interests !== undefined) {
    user.interests = Array.isArray(interests)
      ? interests.map((i) => String(i).trim()).filter(Boolean)
      : String(interests)
          .split(',')
          .map((i) => i.trim())
          .filter(Boolean);
  }
  if (availability !== undefined) user.availability = String(availability).trim();
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
  const { role, isVerified, reliabilityScore, name, bio, accountStatus, statusReason } = req.body;
  const previous = {
    role: user.role,
    isVerified: !!user.isVerified,
    reliabilityScore: user.reliabilityScore,
    accountStatus: user.accountStatus || 'active',
  };
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
  if (accountStatus !== undefined) {
    const allowedStatuses = ['active', 'suspended', 'deactivated'];
    if (!allowedStatuses.includes(accountStatus)) {
      return res.status(400).json({ message: 'Invalid accountStatus. Must be active, suspended, or deactivated' });
    }
    if (user._id === req.user._id && accountStatus !== 'active') {
      return res.status(400).json({ message: 'You cannot suspend or deactivate your own admin account' });
    }
    user.accountStatus = accountStatus;
    user.statusReason = statusReason !== undefined ? String(statusReason).trim() : user.statusReason || '';
    user.statusUpdatedAt = now();
    user.statusUpdatedBy = req.user._id;
  }
  user.updatedAt = now();
  save();
  recordAudit({
    actor: req.user,
    action: 'admin_update_user',
    targetType: 'user',
    targetId: user._id,
    details: `Admin updated user record for ${user.name} (${user.email})`,
    previousValue: previous,
    newValue: {
      role: user.role,
      isVerified: !!user.isVerified,
      reliabilityScore: user.reliabilityScore,
      accountStatus: user.accountStatus || 'active',
    },
  });
  res.json(publicUser(user));
});

const removeUser = asyncHandler(async (req, res) => {
  if (req.params.id === req.user._id) return res.status(400).json({ message: 'You cannot delete your own account' });
  const idx = db.users.findIndex((u) => u._id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'User not found' });
  const target = db.users[idx];
  db.users.splice(idx, 1);
  save();
  recordAudit({
    actor: req.user,
    action: 'admin_delete_user',
    targetType: 'user',
    targetId: target._id,
    details: `Admin deleted user ${target.name} (${target.email})`,
    previousValue: { _id: target._id, name: target.name, email: target.email, role: target.role },
    newValue: null,
  });
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
      const previousStatus = cert.status;
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

      db.notifications = db.notifications || [];
      db.notifications.unshift({
        _id: uid(),
        recipient: u._id,
        type: 'system',
        title:
          cert.status === 'verified'
            ? 'Certificate Verified'
            : cert.status === 'rejected'
            ? 'Certificate Rejected'
            : 'Certificate Under Review',
        message:
          cert.status === 'verified'
            ? `Your certificate "${cert.title}" has been verified by an administrator.`
            : cert.status === 'rejected'
            ? `Your certificate "${cert.title}" was rejected: ${cert.rejectionReason}`
            : `Your certificate "${cert.title}" is now under administrator review.`,
        link: '/dashboard/member',
        read: false,
        createdAt: now(),
      });

      save();
      recordAudit({
        actor: req.user,
        action: `certificate_${action || cert.status}`,
        targetType: 'user',
        targetId: u._id,
        details: `Certificate "${cert.title}" (${cert._id}) marked ${cert.status}${cert.rejectionReason ? ` — Reason: ${cert.rejectionReason}` : ''}`,
        previousValue: { certId: cert._id, status: previousStatus },
        newValue: { certId: cert._id, status: cert.status, rejectionReason: cert.rejectionReason || '' },
      });
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

/**
 * GET /api/users/admin/directory
 * Admin-only paginated, searchable, filterable user directory with record counts.
 */
const adminDirectory = asyncHandler(async (req, res) => {
  const {
    q = '',
    role = 'all',
    accountStatus = 'all',
    isVerified = 'all',
    hasPendingCert = 'all',
    sortBy = 'createdAt',
    sortDir = 'desc',
    page = 1,
    limit = 12,
  } = req.query;

  const allUsers = db.users || [];
  const teams = db.teams || [];
  const submissions = db.submissions || [];

  const summary = {
    totalUsers: allUsers.length,
    activeUsers: allUsers.filter((u) => (u.accountStatus || 'active') === 'active').length,
    suspendedUsers: allUsers.filter((u) => u.accountStatus === 'suspended').length,
    deactivatedUsers: allUsers.filter((u) => u.accountStatus === 'deactivated').length,
    verifiedUsers: allUsers.filter((u) => !!u.isVerified).length,
    pendingCertificatesTotal: allUsers.reduce(
      (acc, u) => acc + (u.certificates || []).filter((c) => c.status === 'pending' || c.status === 'under_review').length,
      0
    ),
  };

  let filtered = allUsers.map((u) => {
    const clean = publicUser(u);
    const certs = clean.certificates || [];
    const userTeams = teams.filter(
      (t) =>
        t.leader === u._id ||
        (t.members || []).some((m) => (typeof m === 'string' ? m : m.user) === u._id)
    );
    const teamIds = new Set(userTeams.map((t) => t._id));
    const userSubs = submissions.filter((s) => s.submittedBy === u._id || teamIds.has(s.teamId));
    return {
      ...clean,
      skillsCount: (clean.skills || []).length,
      certificatesCount: certs.length,
      pendingCertificatesCount: certs.filter((c) => c.status === 'pending' || c.status === 'under_review').length,
      hasResume: !!(clean.resumeUrl || clean.resumeFileName),
      teamsCount: userTeams.length,
      submissionsCount: userSubs.length,
    };
  });

  if (q && String(q).trim()) {
    const term = String(q).trim().toLowerCase();
    filtered = filtered.filter((u) => {
      const skillMatch = (u.skills || []).some((s) => (s.name || '').toLowerCase().includes(term));
      return (
        (u.name || '').toLowerCase().includes(term) ||
        (u.email || '').toLowerCase().includes(term) ||
        (u.college || '').toLowerCase().includes(term) ||
        (u.course || '').toLowerCase().includes(term) ||
        (u.branch || '').toLowerCase().includes(term) ||
        (u.phone || '').toLowerCase().includes(term) ||
        (u.location || '').toLowerCase().includes(term) ||
        skillMatch
      );
    });
  }

  if (role && role !== 'all') {
    filtered = filtered.filter((u) => u.role === role);
  }
  if (accountStatus && accountStatus !== 'all') {
    filtered = filtered.filter((u) => (u.accountStatus || 'active') === accountStatus);
  }
  if (isVerified === 'true') {
    filtered = filtered.filter((u) => !!u.isVerified);
  } else if (isVerified === 'false') {
    filtered = filtered.filter((u) => !u.isVerified);
  }
  if (hasPendingCert === 'true') {
    filtered = filtered.filter((u) => u.pendingCertificatesCount > 0);
  }

  const dir = sortDir === 'asc' ? 1 : -1;
  filtered.sort((a, b) => {
    if (sortBy === 'name') return dir * (a.name || '').localeCompare(b.name || '');
    if (sortBy === 'reliabilityScore') return dir * ((a.reliabilityScore || 0) - (b.reliabilityScore || 0));
    return dir * (new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
  });

  const p = Math.max(1, Number(page) || 1);
  const l = Math.max(1, Math.min(100, Number(limit) || 12));
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / l));
  const users = filtered.slice((p - 1) * l, p * l);

  res.json({ users, total, page: p, limit: l, totalPages, summary });
});

/**
 * GET /api/users/admin/:id
 * Admin-only complete 8-section user record profile.
 */
const adminGetUserDetails = asyncHandler(async (req, res) => {
  const user = db.users.find((u) => u._id === req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  const clean = publicUser(user);
  const problemMap = new Map((db.problems || []).map((p) => [p._id, p]));
  const userMap = new Map((db.users || []).map((u) => [u._id, u]));

  // 1. Personal Information
  const personalInfo = {
    _id: clean._id,
    name: clean.name || '',
    email: clean.email || '',
    phone: clean.phone || '',
    location: clean.location || '',
    profilePicture: clean.profilePicture || '',
    avatar: clean.avatar || '',
    college: clean.college || '',
    course: clean.course || '',
    branch: clean.branch || '',
    year: clean.year || '',
    bio: clean.bio || '',
    about: clean.about || '',
    github: clean.github || '',
    linkedin: clean.linkedin || '',
    portfolio: clean.portfolio || '',
    website: clean.website || '',
  };

  // 2. Skills & Experience
  const skillsAndExperience = {
    skills: clean.skills || [],
    interests: clean.interests || [],
    availability: clean.availability || '',
  };

  // 3. Certificates (merge embedded + flat db.certificates without duplicates)
  const certMap = new Map();
  (clean.certificates || []).forEach((c) => certMap.set(c._id, c));
  (db.certificates || [])
    .filter((c) => c.userId === clean._id)
    .forEach((c) => {
      if (!certMap.has(c._id)) certMap.set(c._id, c);
    });
  const certificates = Array.from(certMap.values()).sort(
    (a, b) => new Date(b.submittedAt || b.uploadedAt || 0) - new Date(a.submittedAt || a.uploadedAt || 0)
  );

  // 4. Resume
  const resume = {
    url: clean.resumeUrl || '',
    fileName: clean.resumeFileName || '',
    originalName: clean.resumeOriginalName || '',
    fileSize: clean.resumeFileSize || 0,
    uploadedAt: clean.resumeUploadedAt || null,
  };

  // 5. Assessments (Aptitude, Technical, Personality + full history)
  const dbAssessments = (db.assessments || [])
    .filter((a) => a.userId === clean._id)
    .sort((a, b) => new Date(b.takenAt || b.createdAt || 0) - new Date(a.takenAt || a.createdAt || 0));

  const latestAptitude = dbAssessments.find((a) => a.assessmentType === 'aptitude') || null;
  const latestPersonality =
    dbAssessments.find((a) => a.assessmentType === 'personality' || a.assessmentType === 'working_style') || null;

  const history = [
    ...dbAssessments.map((a) => ({
      _id: a._id,
      source: 'assessment',
      assessmentType: a.assessmentType,
      title: a.skillOrDomain || a.archetype || a.assessmentType,
      score: a.score ?? null,
      level: a.level || '',
      badge: a.badge || '',
      archetype: a.archetype || '',
      metrics: a.metrics || null,
      details: a.details || null,
      takenAt: a.takenAt || a.createdAt || null,
    })),
    ...(clean.quizScores || []).map((q, idx) => ({
      _id: q._id || `quiz-${idx}`,
      source: 'quiz',
      assessmentType: 'technical',
      title: q.skill || 'Technical Quiz',
      score: q.score ?? null,
      level: q.level ? `Level ${q.level}` : '',
      badge: q.badge || '',
      archetype: '',
      metrics: null,
      details: null,
      takenAt: q.takenAt || null,
    })),
  ].sort((a, b) => new Date(b.takenAt || 0) - new Date(a.takenAt || 0));

  const assessments = {
    aptitude: {
      score: clean.aptitudeScore || latestAptitude?.score || 0,
      level: clean.aptitudeLevel || latestAptitude?.level || '',
      badge: clean.aptitudeBadge || latestAptitude?.badge || '',
      takenAt: latestAptitude?.takenAt || null,
      metrics: latestAptitude?.metrics || null,
    },
    technical: clean.quizScores || [],
    personality: {
      archetype: clean.personality?.archetype || latestPersonality?.archetype || '',
      summary: clean.personality?.summary || '',
      idealComplement: clean.personality?.idealComplement || '',
      dimensions: clean.personality?.dimensions || latestPersonality?.metrics || {},
      takenAt: clean.personality?.takenAt || latestPersonality?.takenAt || null,
    },
    history,
  };

  // 6. Team History
  const allTeams = db.teams || [];
  const teamHistory = [];
  const memberTeamIds = new Set();

  allTeams.forEach((t) => {
    const problem = t.problemId ? problemMap.get(t.problemId) : null;
    const isLeader = t.leader === clean._id;
    const isMember = (t.members || []).some((m) => (typeof m === 'string' ? m : m.user) === clean._id);
    const joinReq = (t.joinRequests || []).find((jr) => jr.user === clean._id);
    const invite = (t.invitations || []).find((inv) => inv.user === clean._id);

    if (isLeader || isMember || joinReq || invite) {
      if (isLeader || isMember) memberTeamIds.add(t._id);
      const leaderObj = userMap.get(t.leader);
      teamHistory.push({
        teamId: t._id,
        name: t.name,
        status: t.status || 'forming',
        problemId: t.problemId || null,
        problemTitle: problem?.title || t.problemTitle || '',
        participationRole: isLeader ? 'Leader' : isMember ? 'Member' : joinReq ? 'Join Request' : 'Invited',
        participationStatus: isLeader || isMember ? 'active' : joinReq?.status || invite?.status || 'pending',
        isCurrent: (isLeader || isMember) && t.status !== 'archived' && t.status !== 'disbanded',
        leaderName: leaderObj?.name || '',
        memberCount: (t.members || []).length,
        maxSize: t.maxSize || 5,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      });
    }
  });
  teamHistory.sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));

  // 7. Projects (Submissions + Reviews)
  const teamMap = new Map(allTeams.map((t) => [t._id, t]));
  const submissions = (db.submissions || [])
    .filter((s) => s.submittedBy === clean._id || memberTeamIds.has(s.teamId))
    .map((s) => {
      const team = teamMap.get(s.teamId);
      const problem = s.problemId ? problemMap.get(s.problemId) : team?.problemId ? problemMap.get(team.problemId) : null;
      return {
        ...s,
        teamName: team?.name || 'Team',
        problemTitle: problem?.title || '',
      };
    })
    .sort((a, b) => new Date(b.updatedAt || b.submittedAt || b.createdAt || 0) - new Date(a.updatedAt || a.submittedAt || a.createdAt || 0));

  const reviewsReceived = (db.reviews || [])
    .filter((r) => r.reviewee === clean._id)
    .map((r) => ({
      ...r,
      reviewerName: userMap.get(r.reviewer)?.name || 'Teammate',
      teamName: teamMap.get(r.team)?.name || '',
    }))
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  const reviewsGiven = (db.reviews || [])
    .filter((r) => r.reviewer === clean._id)
    .map((r) => ({
      ...r,
      revieweeName: userMap.get(r.reviewee)?.name || 'Teammate',
      teamName: teamMap.get(r.team)?.name || '',
    }))
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  const projects = {
    submissions,
    reviewsReceived,
    reviewsGiven,
  };

  // 8. Account Information & Audit Logs
  const statusActor = clean.statusUpdatedBy ? userMap.get(clean.statusUpdatedBy) : null;
  const accountInfo = {
    _id: clean._id,
    role: clean.role,
    accountStatus: clean.accountStatus || 'active',
    statusReason: clean.statusReason || '',
    statusUpdatedAt: clean.statusUpdatedAt || null,
    statusUpdatedBy: clean.statusUpdatedBy || '',
    statusUpdatedByName: statusActor?.name || '',
    isVerified: !!clean.isVerified,
    reliabilityScore: clean.reliabilityScore ?? 70,
    averageRating: clean.averageRating || 0,
    totalReviews: clean.totalReviews || 0,
    createdAt: clean.createdAt || null,
    updatedAt: clean.updatedAt || null,
  };

  const auditLogs = (db.auditLogs || [])
    .filter((a) => a.targetId === clean._id)
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  res.json({
    user: clean,
    personalInfo,
    skillsAndExperience,
    certificates,
    resume,
    assessments,
    teamHistory,
    projects,
    accountInfo,
    auditLogs,
  });
});

/**
 * PUT /api/users/admin/:id/status
 * Admin-only account status update (active | suspended | deactivated).
 */
const adminUpdateAccountStatus = asyncHandler(async (req, res) => {
  const user = db.users.find((u) => u._id === req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  const { accountStatus, reason = '' } = req.body;
  const allowed = ['active', 'suspended', 'deactivated'];
  if (!allowed.includes(accountStatus)) {
    return res.status(400).json({ message: 'Invalid accountStatus. Allowed: active, suspended, deactivated' });
  }
  if (user._id === req.user._id && accountStatus !== 'active') {
    return res.status(400).json({ message: 'You cannot suspend or deactivate your own admin account' });
  }

  const prevStatus = user.accountStatus || 'active';
  const cleanReason = String(reason || '').trim();
  user.accountStatus = accountStatus;
  user.statusReason = accountStatus === 'active' ? cleanReason : cleanReason || `Account marked ${accountStatus} by admin`;
  user.statusUpdatedAt = now();
  user.statusUpdatedBy = req.user._id;
  user.updatedAt = now();

  db.notifications = db.notifications || [];
  db.notifications.unshift({
    _id: uid(),
    recipient: user._id,
    type: 'system',
    title: `Account Status: ${accountStatus.toUpperCase()}`,
    message:
      accountStatus === 'active'
        ? 'Your TeamMatch account has been reactivated by an administrator.'
        : `Your account has been ${accountStatus}${user.statusReason ? `: ${user.statusReason}` : '.'}`,
    link: '/dashboard/profile',
    read: false,
    createdAt: now(),
  });

  save();
  recordAudit({
    actor: req.user,
    action: `account_status_${accountStatus}`,
    targetType: 'user',
    targetId: user._id,
    details: `Changed account status of ${user.name} (${user.email}) from ${prevStatus} to ${accountStatus}${user.statusReason ? ` — Reason: ${user.statusReason}` : ''}`,
    previousValue: { accountStatus: prevStatus },
    newValue: { accountStatus, reason: user.statusReason },
  });

  res.json({
    user: publicUser(user),
    message: `Account status updated to ${accountStatus}`,
  });
});

/**
 * GET /api/users/admin/:id/audit-logs
 * Admin-only audit history for a specific user.
 */
const getAdminAuditLogs = asyncHandler(async (req, res) => {
  const logs = (db.auditLogs || [])
    .filter((a) => a.targetId === req.params.id)
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  res.json(logs);
});

/**
 * GET /api/users/documents/:category/:fileName
 * Authenticated document streaming restricted strictly to Admin or the owning user.
 */
const getSecureDocument = asyncHandler(async (req, res) => {
  const { category } = req.params;
  const rawName = req.params.fileName || '';
  const safeName = path.basename(rawName);

  if (!['certificates', 'resumes'].includes(category)) {
    return res.status(400).json({ message: 'Invalid document category' });
  }
  if (!safeName || safeName !== rawName || safeName.includes('..')) {
    return res.status(400).json({ message: 'Invalid file name' });
  }

  const isAdmin = req.user.role === 'admin';
  let isOwner = false;

  if (!isAdmin) {
    if (category === 'certificates') {
      isOwner = (req.user.certificates || []).some(
        (c) => c.fileName === safeName || (c.fileUrl && c.fileUrl.endsWith(`/${safeName}`)) || (c.url && c.url.endsWith(`/${safeName}`))
      );
    } else if (category === 'resumes') {
      isOwner =
        req.user.resumeFileName === safeName ||
        (req.user.resumeUrl && req.user.resumeUrl.endsWith(`/${safeName}`));
    }
  }

  if (!isAdmin && !isOwner) {
    return res.status(403).json({ message: 'Forbidden: you are not authorized to access this document' });
  }

  const baseDir = category === 'certificates' ? CERTIFICATES_DIR : RESUMES_DIR;
  const resolvedPath = path.resolve(baseDir, safeName);
  if (!resolvedPath.startsWith(path.resolve(baseDir))) {
    return res.status(400).json({ message: 'Invalid file path' });
  }
  if (!fs.existsSync(resolvedPath)) {
    return res.status(404).json({ message: 'Document file not found' });
  }

  res.sendFile(resolvedPath);
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
  adminDirectory,
  adminGetUserDetails,
  adminUpdateAccountStatus,
  getAdminAuditLogs,
  getSecureDocument,
};
