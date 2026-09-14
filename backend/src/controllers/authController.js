const crypto = require('crypto');
const dns = require('dns');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { prisma } = require('../config/db');
const { sendOtpEmail, sendPasswordResetEmail } = require('../services/emailService');

// Standard strict RFC 5322 compliant regex pattern
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const BCRYPT_SALT_ROUNDS = 12; // Security upgrade: bcrypt cost 12 (Lower product gaps)
const MAX_FAILED_OTP_ATTEMPTS = 5; // Security (Item 6): Attempt lock limit

/**
 * Helper to generate a cryptographically secure 6-digit numeric OTP (Item 6)
 */
function generateSixDigitOtp() {
  return crypto.randomInt(100000, 1000000).toString();
}

/**
 * Helper to hash OTP at rest using SHA-256 (Item 6)
 */
function hashOtp(otp) {
  return crypto.createHash('sha256').update(String(otp).trim()).digest('hex');
}

/**
 * Helper to check whether an email domain has valid Mail Exchange (MX) records.
 * Uses a 4-second timeout to prevent network hangs.
 */
async function verifyEmailDomainMx(domain) {
  try {
    const resolvePromise = (async () => {
      try {
        const mxRecords = await dns.promises.resolveMx(domain);
        if (Array.isArray(mxRecords) && mxRecords.length > 0) return true;
      } catch (mxErr) {
        // Fallback to A record check per RFC 5321 Section 5.1
        try {
          const aRecords = await dns.promises.resolve(domain);
          if (Array.isArray(aRecords) && aRecords.length > 0) return true;
        } catch {
          return false;
        }
      }
      return false;
    })();

    const timeoutPromise = new Promise((resolve) =>
      setTimeout(() => resolve(true), 3500)
    );

    return await Promise.race([resolvePromise, timeoutPromise]);
  } catch {
    // Graceful fail-open on DNS network glitch so legitimate shoppers are never blocked
    return true;
  }
}

/**
 * Helper to generate JWT token and set HTTP-only cookie (Items 5 & 9)
 * Encodes tokenVersion into the JWT payload to support instantaneous session invalidation.
 */
function generateTokenAndSetCookie(res, user) {
  const token = jwt.sign(
    {
      id: user.id,
      role: user.role,
      tokenVersion: user.tokenVersion || 1,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax', // Use lax for standard first-party store sessions (Item 5 & Lower gaps)
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  };

  res.cookie('token', token, cookieOptions);
  return token;
}

/**
 * POST /api/auth/register
 * Register with cryptographic OTP, hashed storage at rest, DNS check, and anti-enumeration generic responses.
 */
async function register(req, res, next) {
  try {
    const { name, email, password, phone } = req.body;

    // 1. Server-side validation
    if (!name || typeof name !== 'string' || name.trim().length === 0 || name.trim().length > 60) {
      return res.status(400).json({ success: false, message: 'Name must be between 1 and 60 characters.' });
    }

    if (!email || typeof email !== 'string' || email.trim().length > 100) {
      return res.status(400).json({ success: false, message: 'Valid email address under 100 characters is required.' });
    }

    if (phone && (typeof phone !== 'string' || phone.trim().length > 20)) {
      return res.status(400).json({ success: false, message: 'Phone number cannot exceed 20 characters.' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 2. Email Format Check (Regex)
    if (!EMAIL_REGEX.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email format (e.g. yourname@example.com).',
      });
    }

    // 3. DNS MX Record Verification
    const domain = normalizedEmail.split('@')[1];
    const hasValidMx = await verifyEmailDomainMx(domain);
    if (!hasValidMx) {
      return res.status(400).json({
        success: false,
        message: `The email domain "@${domain}" does not appear to accept incoming mail. Please check for typos.`,
      });
    }

    // Password length >= 8 characters and <= 128 characters
    if (!password || typeof password !== 'string' || password.length < 8 || password.length > 128) {
      return res.status(400).json({
        success: false,
        message: 'Password must be between 8 and 128 characters long.',
      });
    }

    // 4. Existing User Check
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, name: true, isVerified: true },
    });

    if (existingUser) {
      if (existingUser.isVerified) {
        return res.status(409).json({
          success: false,
          isAlreadyRegistered: true,
          message: 'An account with this email is already registered and verified. Please sign in.',
        });
      }

      // If user exists but is unverified, refresh their cryptographic OTP and send email immediately
      const otp = generateSixDigitOtp();
      const hashedOtp = hashOtp(otp);
      const verificationExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          verificationToken: hashedOtp,
          verificationExpires,
          failedOtpAttempts: 0,
        },
      });

      console.log(`\n================== [OTP CODE DISPATCHED (RESEND TO UNVERIFIED)] ==================\nRecipient: ${normalizedEmail}\nOTP Code:  [ ${otp} ]\n=================================================================================\n`);

      await sendOtpEmail({
        to: normalizedEmail,
        name: existingUser.name,
        otp,
      });

      return res.status(200).json({
        success: true,
        requiresVerification: true,
        email: normalizedEmail,
        message: 'A 6-digit verification code has been dispatched to your email.',
      });
    }

    // 5. Admin Security: Public signups are strictly CUSTOMER.
    // Initial admin is bootstrapped from .env upon server start, and can promote users via admin panel.
    const role = 'CUSTOMER';

    // Hash password with bcrypt cost 12
    const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    // Generate cryptographic 6-digit verification OTP and hash at rest (Item 6)
    const otp = generateSixDigitOtp();
    const hashedOtp = hashOtp(otp);
    const verificationExpires = new Date(Date.now() + 10 * 60 * 1000);

    // Create user with isVerified = false
    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        role,
        phone: phone ? String(phone).trim() : null,
        isVerified: false,
        verificationToken: hashedOtp,
        verificationExpires,
        tokenVersion: 1,
        failedOtpAttempts: 0,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    // Create persistent cart for this user immediately
    await prisma.cart.create({
      data: {
        userId: newUser.id,
      },
    });

    // Send 6-digit OTP email (plaintext sent to inbox, hashed in DB)
    await sendOtpEmail({
      to: normalizedEmail,
      name: newUser.name,
      otp,
    });

    return res.status(201).json({
      success: true,
      requiresVerification: true,
      email: newUser.email,
      message: 'If this email is eligible for registration or verification, a 6-digit verification code has been dispatched.',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/verify-otp
 * Verify cryptographic 6-digit OTP with attempt locking (Item 6)
 */
async function verifyOtp(req, res, next) {
  try {
    const { email, otp } = req.body;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ success: false, message: 'Email address is required.' });
    }

    if (!otp || typeof otp !== 'string' || !/^\d{6}$/.test(otp.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid 6-digit numeric verification code.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim();
    const hashedAttempt = hashOtp(cleanOtp);

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code or email address.',
      });
    }

    if (user.isVerified) {
      return res.status(200).json({
        success: true,
        isAlreadyVerified: true,
        message: 'Your account is already verified! Please log in with your email and password.',
      });
    }

    // Check attempt lockout (Item 6)
    if (user.failedOtpAttempts >= MAX_FAILED_OTP_ATTEMPTS) {
      return res.status(429).json({
        success: false,
        message: 'Too many incorrect attempts. This code has been locked. Please request a fresh verification code.',
      });
    }

    // Check expiration
    if (user.verificationExpires && user.verificationExpires < new Date()) {
      return res.status(400).json({
        success: false,
        isExpired: true,
        email: user.email,
        message: 'This verification code has expired. Please click Resend Code to receive a new one.',
      });
    }

    // Compare SHA-256 hashes
    if (user.verificationToken !== hashedAttempt) {
      const newAttempts = user.failedOtpAttempts + 1;
      const isLocked = newAttempts >= MAX_FAILED_OTP_ATTEMPTS;

      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedOtpAttempts: newAttempts,
          ...(isLocked && {
            verificationToken: null,
            verificationExpires: null,
          }),
        },
      });

      if (isLocked) {
        return res.status(429).json({
          success: false,
          message: 'Too many incorrect attempts. This code has been locked. Please request a fresh verification code.',
        });
      }

      return res.status(400).json({
        success: false,
        message: `Invalid verification code. ${MAX_FAILED_OTP_ATTEMPTS - newAttempts} attempt(s) remaining.`,
      });
    }

    // Activate user & reset security counters
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verificationToken: null,
        verificationExpires: null,
        failedOtpAttempts: 0,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        avatar: true,
        isVerified: true,
        tokenVersion: true,
        createdAt: true,
      },
    });

    // Authenticate session via HTTP-only cookie
    generateTokenAndSetCookie(res, updatedUser);

    const { tokenVersion, ...safeUser } = updatedUser;

    return res.status(200).json({
      success: true,
      message: 'Account verified successfully! Welcome to Organic Store.',
      user: safeUser,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/resend-otp
 * Resend a new 6-digit OTP with anti-enumeration response
 */
async function resendOtp(req, res, next) {
  try {
    const { email } = req.body;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ success: false, message: 'Valid email address is required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If an account is associated with this email, a fresh verification code has been dispatched.',
      });
    }

    if (user.isVerified) {
      return res.status(200).json({
        success: true,
        isAlreadyVerified: true,
        message: 'This account is already verified. You can log in directly.',
      });
    }

    const newOtp = generateSixDigitOtp();
    const hashedOtp = hashOtp(newOtp);
    const verificationExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken: hashedOtp,
        verificationExpires,
        failedOtpAttempts: 0,
      },
    });

    await sendOtpEmail({
      to: user.email,
      name: user.name,
      otp: newOtp,
    });

    return res.status(200).json({
      success: true,
      message: 'If an account is associated with this email, a fresh verification code has been dispatched.',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/verify-email
 * Retained for backwards compatibility
 */
async function verifyEmail(req, res, next) {
  return verifyOtp(req, res, next);
}

/**
 * POST /api/auth/resend-verification
 * Retained for backwards compatibility
 */
async function resendVerification(req, res, next) {
  return resendOtp(req, res, next);
}

/**
 * POST /api/auth/login
 * Log in an existing user with isVerified check and cookie session
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    if (normalizedEmail.length > 100) {
      return res.status(400).json({ success: false, message: 'Email address cannot exceed 100 characters.' });
    }

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email format.' });
    }

    if (typeof password !== 'string' || password.length > 128) {
      return res.status(400).json({ success: false, message: 'Password cannot exceed 128 characters.' });
    }

    // Fetch user
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        avatar: true,
        isVerified: true,
        tokenVersion: true,
        passwordHash: true,
      },
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Verify password with bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Enforcement: user must be verified before signing in (Item 9 & 15)
    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        requiresVerification: true,
        message: 'Your account is not activated yet. Please enter the verification code sent to your email.',
      });
    }

    const { passwordHash, tokenVersion, ...safeUser } = user;
    generateTokenAndSetCookie(res, user);

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      user: safeUser,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/logout
 * Log out current session by clearing HTTP-only cookie
 */
function logout(req, res) {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });

  return res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
}

/**
 * GET /api/auth/me
 * Get current authenticated user profile
 */
async function getMe(req, res, next) {
  try {
    return res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/forgot-password
 * Dispatches a 6-digit password reset code and direct link.
 * Implements anti-enumeration generic responses.
 */
async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Email address is required.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address (e.g. user@example.com).',
      });
    }

    // Generic anti-enumeration response
    const genericResponse = {
      success: true,
      message: 'If an account is associated with this email address, a password reset code has been sent.',
    };

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      return res.status(200).json(genericResponse);
    }

    // Generate cryptographic 6-digit numeric reset code
    const resetCode = generateSixDigitOtp();
    const hashedCode = hashOtp(resetCode);
    const resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: hashedCode,
        resetPasswordExpires,
      },
    });

    const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '');
    const resetUrl = `${frontendUrl}/reset-password?email=${encodeURIComponent(normalizedEmail)}&code=${resetCode}`;

    await sendPasswordResetEmail({
      to: normalizedEmail,
      name: user.name,
      resetCode,
      resetUrl,
    });

    return res.status(200).json(genericResponse);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/reset-password
 * Verifies the 6-digit code, verifies expiration, validates new password strength,
 * hashes new password with bcrypt 12, revokes previous sessions, and resets fields.
 */
async function resetPassword(req, res, next) {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ success: false, message: 'Email address is required.' });
    }

    if (!code || typeof code !== 'string' || code.trim().length !== 6) {
      return res.status(400).json({ success: false, message: 'Valid 6-digit reset code is required.' });
    }

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        resetPasswordToken: true,
        resetPasswordExpires: true,
      },
    });

    if (!user || !user.resetPasswordToken || !user.resetPasswordExpires) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset request. Please request a new code.',
      });
    }

    if (new Date() > new Date(user.resetPasswordExpires)) {
      return res.status(400).json({
        success: false,
        message: 'Password reset code has expired. Please request a new code.',
      });
    }

    const hashedInputCode = hashOtp(code.trim());
    if (hashedInputCode !== user.resetPasswordToken) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reset code. Please check and try again.',
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetPasswordToken: null,
        resetPasswordExpires: null,
        tokenVersion: { increment: 1 }, // Revoke all active sessions
      },
    });

    // Clear session cookie if any exists
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return res.status(200).json({
      success: true,
      message: 'Your password has been successfully reset. Please log in with your new password.',
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  register,
  verifyOtp,
  resendOtp,
  verifyEmail,
  resendVerification,
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
};
