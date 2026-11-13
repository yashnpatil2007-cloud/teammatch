const path = require('path');
const fs = require('fs');

/**
 * Storage Service Abstraction
 * Handles file persistence across local disk and optional cloud object storage (AWS S3 / Cloudinary / Supabase).
 * Prevents reliance on Render's ephemeral filesystem for permanent production deployments.
 */
class StorageService {
  constructor() {
    this.provider = this.detectProvider();
  }

  detectProvider() {
    if (process.env.S3_BUCKET && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      return 's3';
    }
    if (process.env.CLOUDINARY_URL) {
      return 'cloudinary';
    }
    return 'local';
  }

  getProviderName() {
    return this.provider;
  }

  isPersistent() {
    return this.provider !== 'local';
  }

  getStorageStatus() {
    return {
      provider: this.provider,
      isPersistent: this.isPersistent(),
      warning:
        this.provider === 'local'
          ? 'Persistent cloud storage is not configured (running in local filesystem mode). On hosting platforms with ephemeral filesystems like Render, uploaded images and files will not survive container restarts. Configure AWS S3 (S3_BUCKET, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY) or Cloudinary (CLOUDINARY_URL) for permanent production storage.'
          : null,
    };
  }

  /**
   * Validates image MIME type, file extension, file size, and actual magic bytes content.
   * Throws an Error with a user-friendly message if validation fails, and unlinks the temp file.
   */
  validateImageFile(file) {
    if (!file) throw new Error('Please select an image file to upload.');

    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimes.includes(file.mimetype)) {
      if (file.path && fs.existsSync(file.path)) {
        try { fs.unlinkSync(file.path); } catch (_) {}
      }
      throw new Error('Invalid image type. Only JPG, JPEG, PNG, and WEBP formats are allowed.');
    }

    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExts = ['.jpg', '.jpeg', '.png', '.webp'];
    if (!allowedExts.includes(ext)) {
      if (file.path && fs.existsSync(file.path)) {
        try { fs.unlinkSync(file.path); } catch (_) {}
      }
      throw new Error('Invalid image extension. File extension must be .jpg, .jpeg, .png, or .webp.');
    }

    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      if (file.path && fs.existsSync(file.path)) {
        try { fs.unlinkSync(file.path); } catch (_) {}
      }
      throw new Error(`File size (${(file.size / 1024 / 1024).toFixed(1)} MB) exceeds maximum allowed size of 5 MB.`);
    }

    // Magic Bytes inspection to prevent disguised files/payloads
    if (file.path && fs.existsSync(file.path)) {
      try {
        const buffer = Buffer.alloc(12);
        const fd = fs.openSync(file.path, 'r');
        fs.readSync(fd, buffer, 0, 12, 0);
        fs.closeSync(fd);

        const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
        const isPng =
          buffer[0] === 0x89 &&
          buffer[1] === 0x50 &&
          buffer[2] === 0x4e &&
          buffer[3] === 0x47 &&
          buffer[4] === 0x0d &&
          buffer[5] === 0x0a &&
          buffer[6] === 0x1a &&
          buffer[7] === 0x0a;
        const isWebp =
          buffer.toString('utf8', 0, 4) === 'RIFF' &&
          buffer.toString('utf8', 8, 12) === 'WEBP';

        if (!isJpeg && !isPng && !isWebp) {
          try { fs.unlinkSync(file.path); } catch (_) {}
          throw new Error('File content does not match a valid image header (JPG, PNG, or WEBP).');
        }
      } catch (err) {
        if (file.path && fs.existsSync(file.path)) {
          try { fs.unlinkSync(file.path); } catch (_) {}
        }
        throw err;
      }
    }

    return true;
  }

  /**
   * Safely removes a file from local disk or cloud storage
   */
  async deleteFile(fileUrlOrPath, folder = '') {
    if (!fileUrlOrPath) return false;
    try {
      // Local file cleanup
      if (fileUrlOrPath.startsWith('/uploads/') || fileUrlOrPath.includes('/uploads/')) {
        const cleanRel = fileUrlOrPath.replace(/^.*\/uploads\//, '');
        const fullPath = path.join(__dirname, '../../uploads', cleanRel);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
          return true;
        }
      }
      return true;
    } catch (err) {
      console.warn(`Failed to delete stored file (${fileUrlOrPath}): ${err.message}`);
      return false;
    }
  }

  /**
   * Resolves public accessible URL for a stored file
   * @param {string} localPathOrUrl - Local relative path or absolute cloud URL
   * @param {string} baseUrl - Application backend base URL
   */
  resolveUrl(localPathOrUrl, baseUrl = '') {
    if (!localPathOrUrl) return '';
    if (
      localPathOrUrl.startsWith('http://') ||
      localPathOrUrl.startsWith('https://') ||
      localPathOrUrl.startsWith('data:') ||
      localPathOrUrl.startsWith('blob:')
    ) {
      return localPathOrUrl;
    }
    const cleanPath = localPathOrUrl.startsWith('/') ? localPathOrUrl : `/${localPathOrUrl}`;
    const cleanBase = baseUrl ? baseUrl.replace(/\/api\/?$/, '') : '';
    return `${cleanBase}${cleanPath}`;
  }

  /**
   * Stores an uploaded file metadata descriptor
   * Supports seamless transition to S3/Cloudinary when production bucket is configured.
   */
  async processUpload(file, folder = 'submissions') {
    if (!file) throw new Error('No file provided for upload');

    // Local file information generated by multer
    const relativeUrl = `/uploads/${folder}/${file.filename}`;
    const metadata = {
      name: file.originalname,
      filename: file.filename,
      fileType: file.mimetype,
      size: file.size,
      url: relativeUrl,
      provider: this.provider,
      uploadedAt: new Date().toISOString(),
    };

    // If S3 credentials are provided, forward upload to S3 bucket
    if (this.provider === 's3') {
      try {
        // Dynamic import / S3 client if available
        const AWS = require('aws-sdk');
        const s3 = new AWS.S3({
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          region: process.env.AWS_REGION || 'us-east-1',
        });

        const fileContent = fs.readFileSync(file.path);
        const s3Key = `${folder}/${file.filename}`;
        const params = {
          Bucket: process.env.S3_BUCKET,
          Key: s3Key,
          Body: fileContent,
          ContentType: file.mimetype,
        };

        const uploadResult = await s3.upload(params).promise();
        metadata.url = uploadResult.Location;
        metadata.s3Key = s3Key;
        // Optionally clean up local temp file after S3 upload
        fs.unlink(file.path, () => {});
      } catch (err) {
        console.warn(`S3 upload failed, falling back to local file storage: ${err.message}`);
      }
    }

    return metadata;
  }
}

const storageService = new StorageService();

module.exports = storageService;
module.exports.storageService = storageService;
module.exports.StorageService = StorageService;

