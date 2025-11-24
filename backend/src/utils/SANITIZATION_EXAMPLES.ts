/**
 * SANITIZATION USAGE GUIDE
 *
 * How to use the InputSanitizer in your Advancia Pay backend
 */

import { Router } from 'express';
import { sanitizeAllInputs, sanitizer } from './utils/sanitization';

// ============================================
// 1. AUTOMATIC SANITIZATION (Recommended)
// ============================================

// Apply to all routes in your app
app.use(sanitizeAllInputs); // Sanitizes body, query, and params automatically

// Or apply to specific routers
const userRouter = Router();
userRouter.use(sanitizeAllInputs);

// ============================================
// 2. MANUAL SANITIZATION (Specific Fields)
// ============================================

// User Registration Example
router.post('/register', async (req, res) => {
  try {
    // Sanitize email
    const email = sanitizer.sanitizeEmail(req.body.email);
    if (!email) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    // Sanitize username (alphanumeric only)
    const username = sanitizer.sanitizeAlphanumeric(req.body.username, true);
    if (!username) {
      return res
        .status(400)
        .json({ error: 'Invalid username (alphanumeric and underscore only)' });
    }

    // Validate password (don't sanitize passwords!)
    const passwordCheck = sanitizer.validatePassword(req.body.password);
    if (!passwordCheck.valid) {
      return res.status(400).json({ error: passwordCheck.message });
    }

    // Sanitize optional fields
    const firstName = sanitizer.sanitizeString(req.body.firstName || '');
    const lastName = sanitizer.sanitizeString(req.body.lastName || '');

    // Create user with sanitized data
    const user = await prisma.user.create({
      data: { email, username, firstName, lastName, password: hashedPassword },
    });

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

// ============================================
// 3. SANITIZE USER PROFILE UPDATES
// ============================================

router.put('/profile', authenticateToken, async (req, res) => {
  try {
    // Sanitize all string fields
    const updates: any = {};

    if (req.body.firstName) {
      updates.firstName = sanitizer.sanitizeString(req.body.firstName);
    }

    if (req.body.lastName) {
      updates.lastName = sanitizer.sanitizeString(req.body.lastName);
    }

    if (req.body.phone) {
      const phone = sanitizer.sanitizePhone(req.body.phone);
      if (phone) updates.phone = phone;
    }

    if (req.body.bio) {
      // Allow basic HTML tags in bio
      updates.bio = sanitizer.sanitizeHTML(req.body.bio, ['b', 'i', 'p', 'br']);
    }

    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data: updates,
    });

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ error: 'Update failed' });
  }
});

// ============================================
// 4. SANITIZE SEARCH QUERIES
// ============================================

router.get('/search', async (req, res) => {
  try {
    // Sanitize search query to prevent SQL injection
    const query = sanitizer.removeSQLInjection(
      sanitizer.sanitizeString(req.query.q as string),
    );

    if (!query || query.length < 2) {
      return res.status(400).json({ error: 'Search query too short' });
    }

    // Safe to use in database query
    const results = await prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 10,
    });

    res.json({ results });
  } catch (error) {
    res.status(500).json({ error: 'Search failed' });
  }
});

// ============================================
// 5. SANITIZE FILE UPLOADS
// ============================================

router.post(
  '/upload',
  authenticateToken,
  upload.single('file'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file provided' });
      }

      // Sanitize filename to prevent path traversal
      const safeFilename = sanitizer.sanitizeFilename(req.file.originalname);
      if (!safeFilename) {
        return res.status(400).json({ error: 'Invalid filename' });
      }

      // Process file with sanitized name
      const filePath = await saveFile(req.file, safeFilename);

      res.json({ success: true, filename: safeFilename, path: filePath });
    } catch (error) {
      res.status(500).json({ error: 'Upload failed' });
    }
  },
);

// ============================================
// 6. SANITIZE JSON INPUTS
// ============================================

router.post('/settings', authenticateToken, async (req, res) => {
  try {
    // Sanitize JSON configuration
    const settings = sanitizer.sanitizeJSON(req.body.settings);
    if (!settings) {
      return res.status(400).json({ error: 'Invalid JSON settings' });
    }

    await prisma.userSettings.update({
      where: { userId: req.user.userId },
      data: { settings },
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Update failed' });
  }
});

// ============================================
// 7. SANITIZE NUMERIC INPUTS
// ============================================

router.post('/transfer', authenticateToken, async (req, res) => {
  try {
    // Sanitize amount
    const amount = sanitizer.sanitizeNumber(req.body.amount);
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // Sanitize recipient ID
    const recipientId = sanitizer.sanitizeAlphanumeric(
      req.body.recipientId,
      false,
    );
    if (!recipientId) {
      return res.status(400).json({ error: 'Invalid recipient ID' });
    }

    // Process transfer with sanitized values
    const transaction = await createTransfer(
      req.user.userId,
      recipientId,
      amount,
    );

    res.json({ success: true, transaction });
  } catch (error) {
    res.status(500).json({ error: 'Transfer failed' });
  }
});

// ============================================
// 8. SANITIZE FOR LOGGING (Security Critical!)
// ============================================

router.post('/payment', authenticateToken, async (req, res) => {
  try {
    // NEVER log sensitive data!
    const cardNumber = req.body.cardNumber;

    // Mask card number for logging
    logger.info({
      action: 'payment.initiated',
      userId: req.user.userId,
      card: sanitizer.maskCreditCard(cardNumber), // ****-****-****-1234
      amount: req.body.amount,
      // ❌ NEVER log: cardNumber, cvv, password, tokens, API keys
    });

    // Process payment
    const payment = await processPayment(req.body);

    res.json({ success: true, payment });
  } catch (error) {
    res.status(500).json({ error: 'Payment failed' });
  }
});

// ============================================
// 9. SANITIZE URL PARAMETERS
// ============================================

router.get('/redirect', async (req, res) => {
  try {
    // Sanitize redirect URL to prevent open redirect attacks
    const redirectUrl = sanitizer.sanitizeURL(req.query.url as string);

    if (!redirectUrl) {
      return res.status(400).json({ error: 'Invalid redirect URL' });
    }

    // Only allow redirects to your domain
    if (!redirectUrl.includes('advanciapayledger.com')) {
      return res.status(403).json({ error: 'Redirect not allowed' });
    }

    res.redirect(redirectUrl);
  } catch (error) {
    res.status(500).json({ error: 'Redirect failed' });
  }
});

// ============================================
// 10. SANITIZE ENTIRE OBJECTS
// ============================================

router.post(
  '/bulk-create',
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      // Sanitize entire array of objects
      const sanitizedData = sanitizer.sanitizeObject(req.body.users);

      // Create multiple users with sanitized data
      const users = await prisma.user.createMany({
        data: sanitizedData,
      });

      res.json({ success: true, count: users.count });
    } catch (error) {
      res.status(500).json({ error: 'Bulk creation failed' });
    }
  },
);

// ============================================
// SECURITY BEST PRACTICES SUMMARY
// ============================================

/**
 * ✅ DO:
 * - Sanitize ALL user inputs before processing
 * - Validate data types and formats
 * - Use parameterized queries (Prisma handles this)
 * - Mask sensitive data in logs
 * - Implement rate limiting
 * - Use HTTPS only
 *
 * ❌ DON'T:
 * - Trust any user input
 * - Log passwords, tokens, or API keys
 * - Store plain text passwords
 * - Use string concatenation for SQL
 * - Allow unrestricted file uploads
 * - Skip input validation
 */
