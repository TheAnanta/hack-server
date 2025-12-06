import { Router } from "express";
import prisma from "../prisma-app";
import { authenticate } from "../middleware/auth";

const router = Router();

// Get current user profile
router.get('/me', authenticate, async (req, res) => {
    // User is already attached by authenticate middleware
    return res.json({ status: true, data: req.user });
});

// Update current user profile
router.put('/me', authenticate, async (req, res) => {
    const { name, roll_number, year_of_study, branch, department, college_id, profile_picture, phone_number } = req.body;
    const uuid = req.user.uuid;

    try {
        const updatedUser = await prisma.user.update({
            where: { uuid },
            data: {
                name,
                roll_number,
                year_of_study,
                branch,
                department,
                college_id,
                profile_picture,
                phone_number,
            }
        });
        return res.json({ status: true, data: updatedUser, message: "Profile updated successfully" });
    } catch (error) {
        console.error("Error updating profile", error);
        return res.status(500).json({ status: false, message: "Internal server error", error_code: "server/internal-error" });
    }
});

// List all users (Admin or Team Lead view - restricted)
// For now, let's allow authenticated users to see list (maybe for team formation)
// Or restrict to Admin. User said "maybe to show team leaders to choose their team".
router.get('/', authenticate, async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                uuid: true,
                name: true,
                email: true,
                college: true,
                role: true
            }
        });
        return res.json({ status: true, data: users });
    } catch (error) {
        return res.status(500).json({ status: false, message: "Internal server error", error_code: "server/internal-error" });
    }
});

export default router;
