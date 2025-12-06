import { Router } from "express";
import prisma from "../prisma-app";

const router = Router();


/**
 * model User {
    uuid              String            @id
    name              String
    roll_number       String
    email             String            @unique
    role_id           String
    role              Role              @relation(fields: [role_id], references: [id])
    year_of_study     Int
    branch            String
    department        String
    college_id        String
    college           College           @relation(references: [id], fields: [college_id], onDelete: Cascade)
    profile_picture   String
    phone_number      String
    team_id           String
    team              Team              @relation(references: [team_id], fields: [team_id], onDelete: Cascade)
    created_at        DateTime          @default(now())
    updated_at        DateTime          @default(now())
    user_permissions  UserPermissions[]
    event_organizers  EventOrganizer[]
    organizations     Organization[]
    lead_of_team      Team?             @relation("teamLeader")
    payments          Payment[]
    checkin_checkouts CheckinCheckout[]
}
 */
router.post('/signup', async (req, res) => {
    const { uuid, name, roll_number, email, role_id, year_of_study, branch, department, college_id, profile_picture, phone_number } = req.body;
    if (name == '' || roll_number == '' || email == '' || role_id == '' || year_of_study == undefined || year_of_study == 0 || year_of_study > 7 || branch == '' || department == '' || college_id == '' || profile_picture == '' || phone_number == '') {
        return res.status(400).json({ message: 'All fields are required', status: false, error_code: 'request/missing-payload' });
    }
    if (uuid == undefined || uuid == '') {
        return res.status(400).json({ message: 'UUID is required', status: false, error_code: 'request/missing-payload' });
    }
    const user = await prisma.user.create({
        data: {
            uuid: uuid,
            name,
            roll_number,
            email,
            role_id,
            year_of_study,
            branch,
            department,
            college_id,
            profile_picture,
            phone_number,
        }
    });
    return res.status(201).json({ status: true, data: user, message: "User created successfully" });
});


export default router;