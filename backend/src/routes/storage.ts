import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  deleteObject,
  initR2Client,
  signedUrl,
  uploadObject,
} from '../services/r2StorageService';

// Initialize R2 client once (safe if env vars present)
try {
  initR2Client();
} catch {
  /* defer failure to first request */
}

const router = Router();

// Upload object (expects JSON: { key, dataBase64, contentType })
router.post('/upload', authenticateToken, async (req, res) => {
  const { key, dataBase64, contentType } = req.body || {};
  if (!key || !dataBase64) {
    return res
      .status(400)
      .json({ success: false, error: 'key and dataBase64 required' });
  }
  try {
    const buffer = Buffer.from(dataBase64, 'base64');
    const result = await uploadObject(key, buffer, contentType);
    return res.json({
      success: true,
      key: result.key,
      publicUrl: result.publicUrl,
    });
  } catch (e: any) {
    return res.status(500).json({ success: false, error: e.message });
  }
});

// Generate signed URL for GET
router.get('/signed-url', authenticateToken, async (req, res) => {
  const { key, expires } = req.query as { key?: string; expires?: string };
  if (!key)
    return res
      .status(400)
      .json({ success: false, error: 'key query param required' });
  try {
    const url = await signedUrl(key, expires ? parseInt(expires, 10) : 3600);
    return res.json({
      success: true,
      key,
      url,
      expiresIn: expires ? parseInt(expires, 10) : 3600,
    });
  } catch (e: any) {
    return res.status(500).json({ success: false, error: e.message });
  }
});

// Delete object
router.delete('/:key', authenticateToken, async (req, res) => {
  const { key } = req.params;
  if (!key)
    return res
      .status(400)
      .json({ success: false, error: 'key param required' });
  try {
    const result = await deleteObject(key);
    return res.json({
      success: true,
      key: result.key,
      deleted: result.deleted,
    });
  } catch (e: any) {
    return res.status(500).json({ success: false, error: e.message });
  }
});

export default router;
