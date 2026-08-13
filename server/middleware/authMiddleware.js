import { getAuth } from "@clerk/express";
import User from '../models/User.js';

export const protect = async (req, res, next) => {
    
    // UPDATE: Use getAuth(req) instead of req.auth
    const auth = getAuth(req);
    const userId = auth?.userId;

    if(!userId) {
        // UPDATE: Added 'return' here so the function actually stops
        return res.json({success: false, message: 'User not authenticated'});

    } else {

        const user = await User.findById(userId);
        req.user = user;
        next();
        
    }
}