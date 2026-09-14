const jwt = require('jsonwebtoken');
const { prisma } = require('../config/db');

/**
 * Authentication Middleware
 * Security Hardening (Item 5, 9):
 * - Validates JWT from HTTP-only cookie or Authorization header.
 * - Enforces email verification (isVerified === true).
 * - Enforces session validity via tokenVersion (revocation check).
 */
async function authenticate(req, res, next) {
  try {
    let token = null;

    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No active session found.',
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Lean select of user from database (Rule 3)
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        avatar: true,
        isVerified: true,
        tokenVersion: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid session. User not found.',
      });
    }

    // Check verification status (Item 9)
    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        requiresVerification: true,
        message: 'Your account is not activated. Please verify your email to proceed.',
      });
    }

    // Check token revocation / session rotation (Item 9)
    if (decoded.tokenVersion === undefined || decoded.tokenVersion !== user.tokenVersion) {
      return res.status(401).json({
        success: false,
        message: 'Session has been invalidated or password was changed. Please log in again.',
      });
    }

    const { tokenVersion, ...safeUser } = user;
    req.user = safeUser;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired authorization session.',
      });
    }
    next(error);
  }
}

/**
 * Role-Based Authorization Middleware (Rule 24)
 * Verifies that the authenticated user has one of the allowed roles.
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access denied. Required role(s): ${roles.join(', ')}.`,
      });
    }

    next();
  };
}

/**
 * Optional Authentication Middleware
 * Attaches user if token is valid and verified, but allows unauthenticated visitors to proceed as guest.
 */
async function optionalAuth(req, res, next) {
  try {
    let token = null;

    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await prisma.user.findUnique({
          where: { id: decoded.id },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isVerified: true,
            tokenVersion: true,
          },
        });
        if (
          user &&
          user.isVerified &&
          (!decoded.tokenVersion || decoded.tokenVersion === user.tokenVersion)
        ) {
          const { tokenVersion, ...safeUser } = user;
          req.user = safeUser;
        }
      } catch {
        // Invalid or expired token, proceed as guest
      }
    }

    next();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  authenticate,
  authorize,
  optionalAuth,
};
