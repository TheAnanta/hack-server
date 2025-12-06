import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

export const authorize = (requiredPermission: string) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        const user = req.user;

        if (!user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // If user is not fully in DB yet (e.g. during signup), they have no permissions
        if (!user.role && !user.user_permissions) {
            return res.status(403).json({ message: 'Forbidden: User profile not found' });
        }

        // Check Role Permissions
        const rolePermissions = user.role?.role_permissions?.map((rp: any) => rp.permission.slug) || [];

        // Check User Specific Permissions
        const userPermissions = user.user_permissions?.map((up: any) => up.permission.slug) || [];

        const allPermissions = new Set([...rolePermissions, ...userPermissions]);

        if (allPermissions.has(requiredPermission)) {
            next();
            return;
        } else {
            return res.status(403).json({ message: `Forbidden: Requires ${requiredPermission} permission` });
        }
    };
};
