import { Router, Request, Response } from 'express';
import multer from 'multer';
import { 
  getUploadUrl, 
  getDownloadUrl, 
  deleteFile, 
  listFiles, 
  getFileMetadata,
  generateShareUrl 
} from '../services/s3';
import pool from '../database';

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
});

const router = Router();

// Get presigned URL for file upload
router.post('/upload-url', async (req: Request, res: Response) => {
  const { filename, contentType } = req.body;
  const tenantId = req.headers['x-tenant-id'] as string;
  const userId = (req as any).user?.id;

  if (!filename) {
    return res.status(400).json({ 
      error: 'Filename is required',
      code: 'MISSING_FILENAME'
    });
  }

  try {
    const { uploadUrl, key } = await getUploadUrl(tenantId, filename, contentType);
    
    res.json({ 
      uploadUrl, 
      key,
      message: 'Upload URL generated successfully'
    });
  } catch (error) {
    console.error('Error generating upload URL:', error);
    res.status(500).json({ 
      error: 'Failed to generate upload URL',
      code: 'UPLOAD_URL_ERROR'
    });
  }
});

// Confirm file upload and save metadata
router.post('/confirm-upload', async (req: Request, res: Response) => {
  const { key, originalFilename, fileSize, contentType, description, tags } = req.body;
  const tenantId = req.headers['x-tenant-id'] as string;
  const userId = (req as any).user?.id;

  if (!key || !originalFilename || !fileSize) {
    return res.status(400).json({ 
      error: 'Key, original filename, and file size are required',
      code: 'MISSING_REQUIRED_FIELDS'
    });
  }

  try {
    // Extract filename from key
    const filename = key.split('/').pop();
    
    const result = await pool.query(`
      INSERT INTO files (
        tenant_id, s3_key, filename, original_filename, file_size, 
        content_type, uploaded_by, description, tags
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      tenantId, key, filename, originalFilename, fileSize, 
      contentType, userId, description, tags
    ]);

    res.status(201).json({
      message: 'File upload confirmed',
      file: result.rows[0]
    });
  } catch (error) {
    console.error('Error confirming upload:', error);
    res.status(500).json({ 
      error: 'Failed to confirm upload',
      code: 'CONFIRM_UPLOAD_ERROR'
    });
  }
});

// List all files for tenant
router.get('/', async (req: Request, res: Response) => {
  const tenantId = req.headers['x-tenant-id'] as string;
  const { page = 1, limit = 10, search = '', sortBy = 'upload_date', sortOrder = 'DESC' } = req.query;
  
  try {
    const offset = (Number(page) - 1) * Number(limit);
    
    let query = `
      SELECT 
        f.*,
        u.name as uploaded_by_name
      FROM files f
      LEFT JOIN users u ON f.uploaded_by = u.id
      WHERE f.tenant_id = $1
    `;
    const params: any[] = [tenantId];
    
    if (search) {
      query += ` AND (f.original_filename ILIKE $${params.length + 1} OR f.description ILIKE $${params.length + 1})`;
      params.push(`%${search}%`);
    }
    
    // Validate sortBy to prevent SQL injection
    const allowedSortFields = ['upload_date', 'original_filename', 'file_size', 'content_type'];
    const validSortBy = allowedSortFields.includes(sortBy as string) ? sortBy : 'upload_date';
    const validSortOrder = sortOrder === 'ASC' ? 'ASC' : 'DESC';
    
    query += ` ORDER BY f.${validSortBy} ${validSortOrder} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(Number(limit), offset);
    
    const result = await pool.query(query, params);
    
    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM files WHERE tenant_id = $1';
    const countParams = [tenantId];
    
    if (search) {
      countQuery += ' AND (original_filename ILIKE $2 OR description ILIKE $2)';
      countParams.push(`%${search}%`);
    }
    
    const countResult = await pool.query(countQuery, countParams);
    const total = Number(countResult.rows[0].count);
    
    res.json({
      files: result.rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching files:', error);
    res.status(500).json({ 
      error: 'Failed to fetch files',
      code: 'FETCH_FILES_ERROR'
    });
  }
});

// Get download URL for a file
router.get('/:fileId/download', async (req: Request, res: Response) => {
  const { fileId } = req.params;
  const tenantId = req.headers['x-tenant-id'] as string;

  try {
    const result = await pool.query(
      'SELECT * FROM files WHERE id = $1 AND tenant_id = $2',
      [fileId, tenantId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ 
        error: 'File not found',
        code: 'FILE_NOT_FOUND'
      });
    }

    const file = result.rows[0];
    const downloadUrl = await getDownloadUrl(tenantId, file.s3_key, file.original_filename);
    
    // Update last accessed timestamp
    await pool.query(
      'UPDATE files SET last_accessed = CURRENT_TIMESTAMP WHERE id = $1',
      [fileId]
    );

    res.json({ 
      downloadUrl,
      filename: file.original_filename,
      contentType: file.content_type
    });
  } catch (error) {
    console.error('Error generating download URL:', error);
    res.status(500).json({ 
      error: 'Failed to generate download URL',
      code: 'DOWNLOAD_URL_ERROR'
    });
  }
});

// Delete a file
router.delete('/:fileId', async (req: Request, res: Response) => {
  const { fileId } = req.params;
  const tenantId = req.headers['x-tenant-id'] as string;

  try {
    const result = await pool.query(
      'SELECT * FROM files WHERE id = $1 AND tenant_id = $2',
      [fileId, tenantId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ 
        error: 'File not found',
        code: 'FILE_NOT_FOUND'
      });
    }

    const file = result.rows[0];
    
    // Delete from S3
    await deleteFile(tenantId, file.s3_key);
    
    // Delete from database
    await pool.query('DELETE FROM files WHERE id = $1', [fileId]);

    res.json({ 
      message: 'File deleted successfully',
      filename: file.original_filename
    });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ 
      error: 'Failed to delete file',
      code: 'DELETE_FILE_ERROR'
    });
  }
});

// Generate share URL for a file
router.post('/:fileId/share', async (req: Request, res: Response) => {
  const { fileId } = req.params;
  const { expiresIn = 86400 } = req.body; // Default 24 hours
  const tenantId = req.headers['x-tenant-id'] as string;

  try {
    const result = await pool.query(
      'SELECT * FROM files WHERE id = $1 AND tenant_id = $2',
      [fileId, tenantId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ 
        error: 'File not found',
        code: 'FILE_NOT_FOUND'
      });
    }

    const file = result.rows[0];
    const shareUrl = await generateShareUrl(tenantId, file.s3_key, expiresIn);
    
    // Update share status in database
    const expiresAt = new Date(Date.now() + (expiresIn * 1000));
    await pool.query(
      'UPDATE files SET is_shared = true, share_expires_at = $1 WHERE id = $2',
      [expiresAt, fileId]
    );

    res.json({ 
      shareUrl,
      expiresAt,
      filename: file.original_filename
    });
  } catch (error) {
    console.error('Error generating share URL:', error);
    res.status(500).json({ 
      error: 'Failed to generate share URL',
      code: 'SHARE_URL_ERROR'
    });
  }
});

// Get file metadata
router.get('/:fileId', async (req: Request, res: Response) => {
  const { fileId } = req.params;
  const tenantId = req.headers['x-tenant-id'] as string;

  try {
    const result = await pool.query(`
      SELECT 
        f.*,
        u.name as uploaded_by_name
      FROM files f
      LEFT JOIN users u ON f.uploaded_by = u.id
      WHERE f.id = $1 AND f.tenant_id = $2
    `, [fileId, tenantId]);

    if (!result.rows.length) {
      return res.status(404).json({ 
        error: 'File not found',
        code: 'FILE_NOT_FOUND'
      });
    }

    res.json({ file: result.rows[0] });
  } catch (error) {
    console.error('Error fetching file metadata:', error);
    res.status(500).json({ 
      error: 'Failed to fetch file metadata',
      code: 'FETCH_METADATA_ERROR'
    });
  }
});

// Direct file upload through backend (fallback for CORS issues)
router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  const tenantId = req.headers['x-tenant-id'] as string;
  const userId = (req as any).user?.id;
  const file = req.file;
  const { description, tags } = req.body;

  if (!file) {
    return res.status(400).json({ 
      error: 'No file provided',
      code: 'NO_FILE'
    });
  }

  try {
    // Generate S3 key
    const key = `${tenantId}/${Date.now()}-${file.originalname}`;
    
    // Upload to S3 using AWS SDK
    const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
    
    const s3Client = new S3Client({ 
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
      }
    });

    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    await s3Client.send(command);

    // Save file metadata to database
    const filename = key.split('/').pop();
    const parsedTags = tags ? JSON.parse(tags) : null;
    
    const result = await pool.query(`
      INSERT INTO files (
        tenant_id, s3_key, filename, original_filename, file_size, 
        content_type, uploaded_by, description, tags
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      tenantId, key, filename, file.originalname, file.size, 
      file.mimetype, userId, description, parsedTags
    ]);

    res.status(201).json({
      message: 'File uploaded successfully',
      file: result.rows[0]
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ 
      error: 'Failed to upload file',
      code: 'UPLOAD_ERROR'
    });
  }
});

// Get storage statistics for tenant
router.get('/stats/storage', async (req: Request, res: Response) => {
  const tenantId = req.headers['x-tenant-id'] as string;

  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_files,
        SUM(file_size) as total_size,
        AVG(file_size) as avg_file_size,
        COUNT(CASE WHEN content_type LIKE 'image/%' THEN 1 END) as image_count,
        COUNT(CASE WHEN content_type LIKE 'video/%' THEN 1 END) as video_count,
        COUNT(CASE WHEN content_type LIKE 'application/pdf' THEN 1 END) as pdf_count,
        COUNT(CASE WHEN content_type LIKE 'application/%' AND content_type NOT LIKE 'application/pdf' THEN 1 END) as document_count
      FROM files 
      WHERE tenant_id = $1
    `, [tenantId]);

    const stats = result.rows[0];
    
    res.json({
      totalFiles: Number(stats.total_files),
      totalSize: Number(stats.total_size || 0),
      averageFileSize: Number(stats.avg_file_size || 0),
      fileTypes: {
        images: Number(stats.image_count),
        videos: Number(stats.video_count),
        pdfs: Number(stats.pdf_count),
        documents: Number(stats.document_count)
      }
    });
  } catch (error) {
    console.error('Error fetching storage stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch storage statistics',
      code: 'FETCH_STATS_ERROR'
    });
  }
});

export default router;
