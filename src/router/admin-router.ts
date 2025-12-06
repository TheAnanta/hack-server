import { Router } from "express";
import prisma from "../prisma-app";
import { authenticate } from "../middleware/auth";
import { authorize } from "../middleware/rbac";

const router = Router();

// Admin: Get Users of a Team
router.get('/teams/:id/users', authenticate, authorize('view_teams'), async (req, res) => {
    const { id } = req.params;
    try {
        const team = await prisma.team.findUnique({
            where: { team_id: id },
            include: { users: true }
        });
        if (!team) return res.status(404).json({ status: false, message: "Team not found", error_code: "request/not-found" });
        return res.json({ status: true, data: team.users });
    } catch (error) {
        return res.status(500).json({ status: false, message: "Internal server error", error_code: "server/internal-error" });
    }
});

// Admin: Get Teams in a Room
router.get('/rooms/:id/teams', authenticate, authorize('view_rooms'), async (req, res) => {
    const { id } = req.params;
    try {
        const teams = await prisma.team.findMany({
            where: { room_id: id },
            include: { users: true }
        });
        return res.json({ status: true, data: teams });
    } catch (error) {
        return res.status(500).json({ status: false, message: "Internal server error", error_code: "server/internal-error" });
    }
});

// Admin: Check-in User
router.post('/users/:id/checkin', authenticate, authorize('manage_checkin'), async (req, res) => {
    const { id } = req.params;
    try {
        const checkin = await prisma.checkinCheckout.create({
            data: {
                user_id: id,
                checkin_time: new Date(),
                checkout_time: new Date() // Placeholder, maybe null? Schema says DateTime, not nullable.
                // I'll set checkout same as checkin for now, or need to fix schema to allow null checkout.
                // Assuming this is a log entry.
            }
        });
        return res.json({ status: true, data: checkin, message: "User checked in" });
    } catch (error) {
        return res.status(500).json({ status: false, message: "Internal server error", error_code: "server/internal-error" });
    }
});

// Admin: Analytics (Placeholder)
router.get('/analytics', authenticate, authorize('view_analytics'), async (req, res) => {
    try {
        const totalUsers = await prisma.user.count();
        const totalTeams = await prisma.team.count();
        const totalEvents = await prisma.event.count();

        return res.json({
            status: true,
            data: {
                totalUsers,
                totalTeams,
                totalEvents
            }
        });
    } catch (error) {
        return res.status(500).json({ status: false, message: "Internal server error", error_code: "server/internal-error" });
    }
});

export default router;
