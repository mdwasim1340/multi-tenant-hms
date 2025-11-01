import { Router } from 'express';
import { getUploadUrl, getDownloadUrl } from '../services/s3';

const router = Router();

router.post('/upload-url', async (req, res) => {
  const { filename } = req.body;
  const tenantId = req.headers['x-tenant-id'] as string;

  if (!filename) {
    return res.status(400).json({ message: 'Filename is required' });
  }

  try {
    const uploadUrl = await getUploadUrl(tenantId, filename);
    res.json({ uploadUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to generate upload URL' });
  }
});

router.get('/download-url', async (req, res) => {
  const { filename } = req.query;
  const tenantId = req.headers['x-tenant-id'] as string;

  if (!filename) {
    return res.status(400).json({ message: 'Filename is required' });
  }

  try {
    const downloadUrl = await getDownloadUrl(tenantId, filename as string);
    res.json({ downloadUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to generate download URL' });
  }
});

export default router;
