import { Request, Response, NextFunction } from 'express';
import admin from '../config/firebase';
import prisma from '../prisma-app';

export interface AuthRequest extends Request {
    user?: any;
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        // Attach user to request. We might also want to fetch the user from our DB here.
        // For now, let's just attach the firebase user.
        // Ideally, we sync/fetch the user from our Postgres DB.

        const dbUser = await prisma.user.findUnique({
            where: { uuid: decodedToken.uid },
            include: {
                role: {
                    include: {
                        role_permissions: {
                            include: { permission: true }
                        }
                    }
                },
                user_permissions: {
                    include: { permission: true }
                }
            }
        });

        if (!dbUser) {
            // If user is not in DB, they might be signing up.
            // We allow the request to proceed if it's the signup route (handled by router usually)
            // But for this middleware, we might want to just attach the uid.
            req.user = { uid: decodedToken.uid, email: decodedToken.email };
        } else {
            req.user = dbUser;
        }

        next();
        return;
    } catch (error) {
        console.error('Error verifying auth token', error);
        return res.status(401).json({ message: 'Unauthorized: Invalid token' });
    }
};
