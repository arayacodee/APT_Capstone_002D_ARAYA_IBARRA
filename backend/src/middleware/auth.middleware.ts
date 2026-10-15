import {
  NextFunction,
  Request,
  Response
} from "express";

import { prisma } from "../lib/prisma.js";
import { env } from "../config/env.js";
import { privateUserSelect } from '../lib/user-profile.js';

import {
  SESSION_COOKIE,
  verifySessionToken
} from "../lib/session.js";

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token =
    req.cookies?.[SESSION_COOKIE];

  if (!token) {
    return res.status(401).json({
      error: "Not authenticated"
    });
  }

  try {
    const session =
      await verifySessionToken(token);

    const user =
      await prisma.user.findUnique({
        where: {
          id: session.userId
        },

        select: privateUserSelect
      });

    if (!user) {
      return res.status(401).json({
        error: "Invalid session"
      });
    }

    req.authUser = user;

    next();
  } catch {
    res.clearCookie(
      SESSION_COOKIE,
      {
        httpOnly: true,
        sameSite: "lax",
        secure:
          env.NODE_ENV === "production",
        path: "/"
      }
    );

    return res.status(401).json({
      error: "Invalid session"
    });
  }
};

export const requireRole =
  (
    ...roles: Array<
      'CLIENT' | 'PROFESSIONAL' | 'SUPERADMIN'
    >
  ) =>
  (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    if (!req.authUser) {
      return res.status(401).json({
        error: "Not authenticated"
      });
    }

    if (
      !roles.includes(
        req.authUser.role
      )
    ) {
      return res.status(403).json({
        error: "Forbidden"
      });
    }

    next();
  };
