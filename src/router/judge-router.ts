import { Router } from "express";
import prisma from "../prisma-app";
import { authenticate } from "../middleware/auth";
import { authorize } from "../middleware/rbac";

const router = Router();

// Get Assignments (Teams to judge)
// Schema doesn't have explicit assignment table?
// "Admin assigns Judges to specific problem statements or batches of teams."
// We might need `JudgeAssignment` table or just query based on logic.
// For now, let's assume judges can judge any team or we filter by some criteria.
// User said: "Sidebar shows Team's assigned Problem Statement".
// Let's return all teams for now, or filter if we had assignment logic.
router.get('/assignments', authenticate, authorize('judge_teams'), async (req, res) => {
    try {
        const teams = await prisma.team.findMany({
            include: { problem_statement: true }
        });
        return res.json({ status: true, data: teams });
    } catch (error) {
        return res.status(500).json({ status: false, message: "Internal server error", error_code: "server/internal-error" });
    }
});

// Submit Score
router.post('/score', authenticate, authorize('judge_teams'), async (req, res) => {
    const { team_id, innovation, feasibility, tech_stack, presentation, creativity, implementation, comments } = req.body;
    const user = req.user;

    try {
        const score = await prisma.judgeScore.create({
            data: {
                team_id,
                judge_id: user.uuid,
                innovation,
                feasibility,
                tech_stack,
                presentation,
                creativity,
                implementation,
                comments
            }
        });
        return res.status(201).json({ status: true, data: score, message: "Score submitted" });
    } catch (error) {
        return res.status(500).json({ status: false, message: "Internal server error", error_code: "server/internal-error" });
    }
});

// Get Scores for a Team (Admin/Judge view)
router.get('/scores/:teamId', authenticate, authorize('view_scores'), async (req, res) => {
    const { teamId } = req.params;
    try {
        const scores = await prisma.judgeScore.findMany({
            where: { team_id: teamId },
            include: { judge: true }
        });
        return res.json({ status: true, data: scores });
    } catch (error) {
        return res.status(500).json({ status: false, message: "Internal server error", error_code: "server/internal-error" });
    }
});

// Update Score
router.put('/scores/:id', authenticate, authorize('judge_teams'), async (req, res) => {
    const { id } = req.params;
    const data = req.body;
    const user = req.user;

    try {
        // Check if judge owns the score
        const score = await prisma.judgeScore.findUnique({ where: { id } });
        if (!score) return res.status(404).json({ status: false, message: "Score not found", error_code: "request/not-found" });

        if (score.judge_id !== user.uuid) {
            return res.status(403).json({ status: false, message: "Cannot edit other judge's score", error_code: "auth/forbidden" });
        }

        const updatedScore = await prisma.judgeScore.update({
            where: { id },
            data
        });
        return res.json({ status: true, data: updatedScore, message: "Score updated" });
    } catch (error) {
        return res.status(500).json({ status: false, message: "Internal server error", error_code: "server/internal-error" });
    }
});

export default router;
