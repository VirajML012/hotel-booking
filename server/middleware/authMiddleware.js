import { getAuth } from "@clerk/express";
import User from '../models/User.js';

export const protect = async (req, res, next) => {
    try {
        const auth = getAuth(req);
        const userId = auth?.userId;

        if(!userId) {
            return res.json({success: false, message: 'User not authenticated'});
        }

        let user = await User.findById(userId);

        // 🔥 THE BULLETPROOF FAILSAFE 🔥
        if (!user) {
            user = await User.create({
                _id: userId,
                email: `missing-webhook-${userId}@placeholder.com`,
                username: "Local Dev User",
                // FIXED: Added the required 'image' field so MongoDB stops crashing!
                image: "https://www.gravatar.com/avatar/?d=mp",
                role: "user"
            });
            console.log("Failsafe: Created missing user on the fly!");
        }

        req.user = user;
        next();
        
    } catch (error) {
        console.error("Auth Middleware Error:", error.message);
        res.json({ success: false, message: "Authentication error" });
    }
}