const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

const UPLOADS_DIR = path.join(__dirname, '../../uploads');
const CERTIFICATES_DIR = path.join(UPLOADS_DIR, 'certificates');
const RESUMES_DIR = path.join(UPLOADS_DIR, 'resumes');
const SUBMISSIONS_DIR = path.join(UPLOADS_DIR, 'submissions');

[UPLOADS_DIR, CERTIFICATES_DIR, RESUMES_DIR, SUBMISSIONS_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Storage for Certificates (PDF, JPG, PNG, WEBP)
const certificateStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, CERTIFICATES_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);
    const unique = crypto.randomBytes(6).toString('hex');
    cb(null, `cert_${Date.now()}_${unique}_${cleanBase}${ext}`);
  },
});

const certificateFilter = (req, file, cb) => {
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid certificate file type. Only PDF, JPG, PNG and WEBP documents are allowed.'), false);
  }
};

const uploadCertificate = multer({
  storage: certificateStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: certificateFilter,
});

// Storage for Resumes (PDF strictly)
const resumeStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, RESUMES_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);
    const unique = crypto.randomBytes(6).toString('hex');
    cb(null, `resume_${Date.now()}_${unique}_${cleanBase}${ext}`);
  },
});

const resumeFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Invalid resume file type. Resumes must be uploaded in PDF format.'), false);
  }
};

const uploadResume = multer({
  storage: resumeStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: resumeFilter,
});

// Storage for Project Submissions (PDF, PPT, PPTX, DOC, DOCX, ZIP, PNG, JPG, WEBP)
const submissionStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, SUBMISSIONS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);
    const unique = crypto.randomBytes(6).toString('hex');
    cb(null, `sub_${Date.now()}_${unique}_${cleanBase}${ext}`);
  },
});

const submissionFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/zip',
    'application/x-zip-compressed',
    'image/jpeg',
    'image/png',
    'image/webp',
    'text/plain',
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        'Invalid project attachment type. Allowed types: PDF, Word, PowerPoint, ZIP archives, and Images.'
      ),
      false
    );
  }
};

const uploadSubmission = multer({
  storage: submissionStorage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit
  fileFilter: submissionFilter,
});

module.exports = {
  uploadCertificate,
  uploadResume,
  uploadSubmission,
  UPLOADS_DIR,
  CERTIFICATES_DIR,
  RESUMES_DIR,
  SUBMISSIONS_DIR,
};
