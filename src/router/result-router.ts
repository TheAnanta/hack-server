import { Router } from "express";
import prisma from "../prisma-app";
import { authenticate } from "../middleware/auth";

const router = Router();

// Public Leaderboard
router.get('/leaderboard', async (req, res) => {
    try {
        // Calculate average scores
        // Prisma doesn't support complex aggregation easily in one go for weighted avg across relations?
        // We can fetch all teams with scores and calculate in memory (if dataset is small)
        // or use raw query.
        // For hackathon scale (e.g. 100 teams), in-memory is fine.

        const teams = await prisma.team.findMany({
            include: {
                judge_scores: true,
                problem_statement: true
            }
        });

        const leaderboard = teams.map(team => {
            const scores = team.judge_scores;
            if (scores.length === 0) return { ...team, average_score: 0 };

            const totalScore = scores.reduce((acc, curr) => {
                return acc + curr.innovation + curr.feasibility + curr.tech_stack + curr.presentation + curr.creativity + curr.implementation;
            }, 0);

            // Average per judge? Or total points?
            // "Backend job calculates weighted averages".
            // Let's assume simple average of total points per judge.
            // Each judge gives max 60 points (6 categories * 10).

            const averageScore = totalScore / scores.length;
            return { ...team, average_score: averageScore };
        });

        // Sort by score
        leaderboard.sort((a, b) => b.average_score - a.average_score);

        return res.json({ status: true, data: leaderboard });
    } catch (error) {
        return res.status(500).json({ status: false, message: "Internal server error", error_code: "server/internal-error" });
    }
});

// Individual Team Result
router.get('/teams/:id', authenticate, async (req, res) => {
    const { id } = req.params;
    try {
        const team = await prisma.team.findUnique({
            where: { team_id: id },
            include: { judge_scores: true }
        });

        if (!team) return res.status(404).json({ status: false, message: "Team not found", error_code: "request/not-found" });

        // Calculate score
        const scores = team.judge_scores;
        const totalScore = scores.reduce((acc, curr) => {
            return acc + curr.innovation + curr.feasibility + curr.tech_stack + curr.presentation + curr.creativity + curr.implementation;
        }, 0);
        const averageScore = scores.length > 0 ? totalScore / scores.length : 0;

        return res.json({ status: true, data: { ...team, average_score: averageScore } });
    } catch (error) {
        return res.status(500).json({ status: false, message: "Internal server error", error_code: "server/internal-error" });
    }
});

export default router;
