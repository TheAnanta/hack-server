import { Router } from "express";
import prisma from "../prisma-app";
import { authenticate } from "../middleware/auth";
import { authorize } from "../middleware/rbac";

const router = Router();

// Create Organization
router.post('/', authenticate, authorize('create_org'), async (req, res) => {
    const { name, bio, logo } = req.body;
    const user = req.user;

    try {
        const org = await prisma.organization.create({
            data: {
                name,
                bio,
                logo,
                founder_id: user.uuid
            }
        });
        return res.status(201).json({ status: true, data: org });
    } catch (error) {
        return res.status(500).json({ status: false, message: "Internal server error", error_code: "server/internal-error" });
    }
});

// Update Organization
router.put('/:id', authenticate, authorize('update_org'), async (req, res) => {
    const { id } = req.params;
    const data = req.body;
    try {
        const org = await prisma.organization.update({
            where: { id },
            data
        });
        return res.json({ status: true, data: org });
    } catch (error) {
        return res.status(500).json({ status: false, message: "Internal server error", error_code: "server/internal-error" });
    }
});

export default router;
