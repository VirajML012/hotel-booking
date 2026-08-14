import Hotel from "../models/Hotel.js";
import User from "../models/User.js";

export const registerHotel = async (req, res) => {
    try {
        const {name, address, contact, city} = req.body;
        
        // This is now 100% safe because our middleware guarantees req.user exists
        const owner = req.user._id;
        
        // Check if User Already Registered
        const hotel = await Hotel.findOne({owner})
        if(hotel){
            return res.json({ success: false, message: "Hotel Already Registered" })
        }

        await Hotel.create({name, address, contact, city, owner});

        // Upgrade the user to a hotelOwner
        await User.findByIdAndUpdate(owner, {role: "hotelOwner"});

        res.json({success: true, message: "Hotel Registered Successfully"})
        
    } catch (error) {
        res.json({success: false, message: error.message})
    }
}