import { Router } from "express";
import prisma from "../prisma-app";
import { authenticate } from "../middleware/auth";
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Create Team
router.post('/', authenticate, async (req, res) => {
    const { team_name, problem_statement_id, events_id } = req.body;
    const user = req.user;

    if (user.team_id) {
        return res.status(400).json({ status: false, message: "User already in a team", error_code: "logic/already-in-team" });
    }

    try {
        const teamId = uuidv4();
        // Transaction to create team and update user
        const result = await prisma.$transaction(async (prisma) => {
            const team = await prisma.team.create({
                data: {
                    team_id: teamId,
                    team_name,
                    problem_statement_id, // Optional? Schema says required.
                    events_id,
                    teamLeaderId: user.uuid,
                    room_id: "TBD", // Needs a default or nullable in schema? Schema says String. 
                    // I might need to fix schema if room_id is required but not known at creation.
                    // For now, I'll put a placeholder or check schema again.
                }
            });

            await prisma.user.update({
                where: { uuid: user.uuid },
                data: { team_id: teamId }
            });

            return team;
        });

        return res.status(201).json({ status: true, data: result, message: "Team created successfully" });
    } catch (error) {
        console.error("Error creating team", error);
        return res.status(500).json({ status: false, message: "Internal server error", error_code: "server/internal-error" });
    }
});

// Join Team
router.post('/join', authenticate, async (req, res) => {
    const { team_id } = req.body;
    const user = req.user;

    if (user.team_id) {
        return res.status(400).json({ status: false, message: "User already in a team", error_code: "logic/already-in-team" });
    }

    try {
        const team = await prisma.team.findUnique({
            where: { team_id },
            include: { users: true }
        });

        if (!team) {
            return res.status(404).json({ status: false, message: "Team not found", error_code: "request/not-found" });
        }

        if (team.users.length >= 4) {
            return res.status(400).json({ status: false, message: "Team is full", error_code: "logic/team-full" });
        }

        // Check if same event? 
        // User might not be registered for event yet, or we assume team implies event.

        await prisma.user.update({
            where: { uuid: user.uuid },
            data: { team_id }
        });

        return res.json({ status: true, message: "Joined team successfully" });
    } catch (error) {
        return res.status(500).json({ status: false, message: "Internal server error" });
    }
});

// Get Team Details
router.get('/:id', authenticate, async (req, res) => {
    const { id } = req.params;
    try {
        const team = await prisma.team.findUnique({
            where: { team_id: id },
            include: { users: true, problem_statement: true, events: true }
        });
        if (!team) return res.status(404).json({ status: false, message: "Team not found", error_code: "request/not-found" });
        return res.json({ status: true, data: team });
    } catch (error) {
        return res.status(500).json({ status: false, message: "Internal server error", error_code: "server/internal-error" });
    }
});

// Update Team (Leader Only)
router.put('/:id', authenticate, async (req, res) => {
    const { id } = req.params;
    const { team_name, problem_statement_id, github_link, demo_link } = req.body;
    const user = req.user;

    try {
        const team = await prisma.team.findUnique({ where: { team_id: id } });
        if (!team) return res.status(404).json({ status: false, message: "Team not found", error_code: "request/not-found" });

        if (team.teamLeaderId !== user.uuid) {
            return res.status(403).json({ status: false, message: "Only team leader can update details", error_code: "auth/forbidden" });
        }

        const updatedTeam = await prisma.team.update({
            where: { team_id: id },
            data: {
                team_name,
                problem_statement_id,
                github_link,
                demo_link
            }
        });

        return res.json({ status: true, data: updatedTeam, message: "Team updated successfully" });
    } catch (error) {
        return res.status(500).json({ status: false, message: "Internal server error", error_code: "server/internal-error" });
    }
});

export default router;
