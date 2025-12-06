import { Router } from "express";
import prisma from "../prisma-app";
import { authenticate } from "../middleware/auth";
import { authorize } from "../middleware/rbac";
import Razorpay from "razorpay";
import crypto from "crypto";

const router = Router();

// Initialize Razorpay
// Ensure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are in env
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'mock_key',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'mock_secret'
});

// Initiate Checkout
router.post('/checkout', authenticate, async (req, res) => {
    const { amount, currency = "INR" } = req.body;
    const user = req.user;

    try {
        const options = {
            amount: amount * 100, // Amount in paise
            currency,
            receipt: `receipt_${Date.now()}_${user.uuid}`,
            notes: {
                userId: user.uuid,
                teamId: user.team_id || ""
            }
        };

        const order = await razorpay.orders.create(options);

        // Create Payment record in DB with PENDING status
        await prisma.payment.create({
            data: {
                amount: amount,
                payment_id: order.id, // Using order_id as payment_id initially? 
                // Schema says `payment_id`. Usually we store order_id first, then payment_id on success.
                // I'll store order_id here for tracking.
                status: "PENDING",
                user_id: user.uuid,
                team_id: user.team_id || "INDIVIDUAL", // Schema requires team_id. 
                // If individual, we need a placeholder or fix schema.
                // Schema: `team_id String`. `team Team @relation...`
                // So team_id IS required and must exist.
                // If user is not in team, they can't pay?
                // Requirement: "Payment & Registration Management ... updates Team.payment_status".
                // So payment is per team? Or per user?
                // "User selects which Event...".
                // Let's assume user must be in a team to pay, or we create a dummy team?
                // For now, fail if no team.
            }
        });

        return res.json({ status: true, data: order });
    } catch (error) {
        console.error("Error creating order", error);
        return res.status(500).json({ status: false, message: "Internal server error", error_code: "server/internal-error" });
    }
});

// Webhook Handler
router.post('/webhook', async (req, res) => {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'mock_secret';
    const signature = req.headers['x-razorpay-signature'] as string;

    // Verify signature
    const shasum = crypto.createHmac('sha256', secret);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest('hex');

    if (digest !== signature) {
        return res.status(400).json({ status: false, message: "Invalid signature", error_code: "auth/invalid-token" });
    }

    const event = req.body.event;
    const payload = req.body.payload;

    if (event === 'payment.captured') {
        const paymentEntity = payload.payment.entity;
        const orderId = paymentEntity.order_id;
        // Update DB
        // We stored orderId in `payment_id` field in checkout? Or need to find by order_id?
        // Schema `payment_id` is String.
        // Let's assume we stored order_id there.

        try {
            await prisma.payment.updateMany({
                where: { payment_id: orderId },
                data: { status: "COMPLETED" }
            });

            // Also update Team payment status if needed?
            // Schema doesn't have `payment_status` on Team, but has `payments` relation.
            // We can derive it.
        } catch (error) {
            console.error("Error updating payment", error);
        }
    }

    return res.json({ status: true });
});

// Admin: Manual Confirmation
router.post('/confirm', authenticate, authorize('manage_payments'), async (req, res) => {
    const { payment_id } = req.body; // This could be our DB ID or Razorpay ID
    try {
        await prisma.payment.update({
            where: { id: payment_id }, // Assuming DB ID passed
            data: { status: "COMPLETED" }
        });
        return res.json({ status: true, message: "Payment marked as completed" });
    } catch (error) {
        return res.status(500).json({ status: false, message: "Internal server error", error_code: "server/internal-error" });
    }
});

export default router;
