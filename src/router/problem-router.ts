import { Router } from "express";
import prisma from "../prisma-app";
import { authenticate } from "../middleware/auth";
import { authorize } from "../middleware/rbac";

const router = Router();

// Submit Problem Statement
router.post('/', authenticate, authorize('submit_problem'), async (req, res) => {
    const { title, description, track, organization_id } = req.body;
    try {
        const problem = await prisma.problemStatement.create({
            data: {
                title,
                description,
                track,
                organization_id,
                approved: false
            }
        });
        return res.status(201).json({ status: true, data: problem });
    } catch (error) {
        return res.status(500).json({ status: false, message: "Internal server error", error_code: "server/internal-error" });
    }
});

// Approve Problem (Admin)
router.put('/:id/approve', authenticate, authorize('approve_problem'), async (req, res) => {
    const { id } = req.params;
    try {
        const problem = await prisma.problemStatement.update({
            where: { id },
            data: { approved: true }
        });
        return res.json({ status: true, data: problem, message: "Problem approved" });
    } catch (error) {
        return res.status(500).json({ status: false, message: "Internal server error", error_code: "server/internal-error" });
    }
});

// List Approved Problems (Public/Tracks)
router.get('/', async (req, res) => {
    try {
        const problems = await prisma.problemStatement.findMany({
            where: { approved: true },
            include: { organization: true }
        });
        return res.json({ status: true, data: problems });
    } catch (error) {
        return res.status(500).json({ status: false, message: "Internal server error", error_code: "server/internal-error" });
    }
});

export default router;
