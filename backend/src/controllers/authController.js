const crypto = require('crypto');
const dns = require('dns');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { prisma } = require('../config/db');
const { sendOtpEmail, sendVerificationEmail } = require('../services/emailService');

// Standard strict RFC 5322 compliant regex pattern
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * Helper to generate a 6-digit numeric OTP
 */
function generateSixDigitOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Helper to check whether an email domain has valid Mail Exchange (MX) records.
 * Uses a 4-second timeout to prevent network hangs.
 */
async function verifyEmailDomainMx(domain) {
  try {
    const resolvePromise = dns.promises.resolveMx(domain);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('DNS_TIMEOUT')), 4000)
    );

    const records = await Promise.race([resolvePromise, timeoutPromise]);
    return Array.isArray(records) && records.length > 0;
  } catch (err) {
    if (err.message === 'DNS_TIMEOUT') {
      // In case of network timeout, allow the flow to proceed gracefully
      return true;
    }
    // ENOTFOUND, ENODATA, NXDOMAIN -> Domain does not accept email
    return false;
  }
}

/**
 * Helper to generate JWT token and cookie options
 */
function generateTokenAndSetCookie(res, user) {
  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };

  res.cookie('token', token, cookieOptions);
  return token;
}

/**
 * POST /api/auth/register
 * Register a new customer account with regex check, DNS MX verification, and 6-digit email OTP.
 */
async function register(req, res, next) {
  try {
    const { name, email, password, phone } = req.body;

    // 1. Server-side validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Valid name is required.' });
    }

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ success: false, message: 'Email address is required.' });
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
        message: `The email domain "@${domain}" does not appear to accept incoming mail (no valid MX mail server found). Please verify your email for typos.`,
      });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    // 4. Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, name: true, isVerified: true },
    });

    if (existingUser) {
      if (existingUser.isVerified) {
        return res.status(409).json({
          success: false,
          message: 'An account with this email already exists. Please log in instead.',
        });
      }

      // If user exists but is not yet verified, refresh their 6-digit OTP
      const otp = generateSixDigitOtp();
      const verificationExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          verificationToken: otp,
          verificationExpires,
        },
      });

      await sendOtpEmail({
        to: normalizedEmail,
        name: existingUser.name,
        otp,
      });

      return res.status(200).json({
        success: true,
        requiresVerification: true,
        email: normalizedEmail,
        message: 'An unverified account with this email already exists. A fresh 6-digit verification code has been sent to your email.',
      });
    }

    // Check if this is the very first user registered in the database; if so, assign ADMIN role
    const totalUsers = await prisma.user.count();
    const role = totalUsers === 0 ? 'ADMIN' : 'CUSTOMER';

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Generate 6-digit verification OTP (valid for 10 minutes)
    const otp = generateSixDigitOtp();
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
        verificationToken: otp,
        verificationExpires,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        avatar: true,
        isVerified: true,
        createdAt: true,
      },
    });

    // Create persistent cart for this user immediately
    await prisma.cart.create({
      data: {
        userId: newUser.id,
      },
    });

    // Send 6-digit OTP email
    await sendOtpEmail({
      to: normalizedEmail,
      name: newUser.name,
      otp,
    });

    return res.status(201).json({
      success: true,
      requiresVerification: true,
      email: newUser.email,
      message: 'Account registered successfully! A 6-digit verification code has been sent to your email.',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/verify-otp
 * Verify 6-digit OTP and activate account
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

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email address.',
      });
    }

    if (user.isVerified) {
      // If already verified, sign them in directly
      const sessionToken = generateTokenAndSetCookie(res, user);
      return res.status(200).json({
        success: true,
        message: 'Your account is already verified! Welcome back.',
        token: sessionToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          avatar: user.avatar,
          isVerified: true,
          createdAt: user.createdAt,
        },
      });
    }

    // Verify OTP match
    if (user.verificationToken !== cleanOtp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code. Please check your email or request a new code.',
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

    // Activate the user
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verificationToken: null,
        verificationExpires: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        avatar: true,
        isVerified: true,
        createdAt: true,
      },
    });

    // Automatically authenticate the session
    const sessionToken = generateTokenAndSetCookie(res, updatedUser);

    return res.status(200).json({
      success: true,
      message: 'Account verified successfully! Welcome to Organic Store.',
      token: sessionToken,
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/resend-otp
 * Resend a new 6-digit OTP to the user's email
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
        message: 'If an account with this email exists, a verification code has been dispatched.',
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Your account is already verified. You can log in directly.',
      });
    }

    const newOtp = generateSixDigitOtp();
    const verificationExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken: newOtp,
        verificationExpires,
      },
    });

    await sendOtpEmail({
      to: user.email,
      name: user.name,
      otp: newOtp,
    });

    return res.status(200).json({
      success: true,
      message: 'A fresh 6-digit verification code has been sent to your email.',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/verify-email
 * Retained for backward compatibility with link-based tokens
 */
async function verifyEmail(req, res, next) {
  try {
    const token = req.body.token || req.query.token;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Verification token or code is required.',
      });
    }

    const cleanToken = token.trim();

    const user = await prisma.user.findFirst({
      where: { verificationToken: cleanToken },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'This verification code is invalid or has already been used.',
      });
    }

    if (user.verificationExpires && user.verificationExpires < new Date()) {
      return res.status(400).json({
        success: false,
        isExpired: true,
        email: user.email,
        message: 'This verification code has expired. Please request a new code.',
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verificationToken: null,
        verificationExpires: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        avatar: true,
        isVerified: true,
        createdAt: true,
      },
    });

    const sessionToken = generateTokenAndSetCookie(res, updatedUser);

    return res.status(200).json({
      success: true,
      message: 'Account activated successfully! Welcome to Organic Store.',
      token: sessionToken,
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
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
 * Log in an existing user with isVerified enforcement
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // Fetch user with passwordHash and isVerified
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

    // Enforcement: user must be verified before signing in
    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        isUnverified: true,
        email: user.email,
        message: 'Your account is not activated yet. Please enter the verification code sent to your email.',
      });
    }

    const { passwordHash, ...safeUser } = user;
    const token = generateTokenAndSetCookie(res, safeUser);

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: safeUser,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/logout
 * Log out current session
 */
function logout(req, res) {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
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

module.exports = {
  register,
  verifyOtp,
  resendOtp,
  verifyEmail,
  resendVerification,
  login,
  logout,
  getMe,
};
