import Booking from "../models/Booking.js";
import Room from "../models/Room.js";
import Hotel from "../models/Hotel.js";
import transporter from "../configs/nodemailer.js";
import Stripe from "stripe"; // 🔥 FIXED: Capitalized Stripe for the constructor

// Function to Check Availablity of Room
const checkAvailability = async ({ checkInDate, checkOutDate, room })=>{
    try {
        const bookings = await Booking.find({
            room,
            checkInDate: {$lte: checkOutDate},
            checkOutDate: {$gte: checkInDate},
        });
        const isAvailable = bookings.length === 0;
        return isAvailable;
    } catch (error) {
        console.error(error.message);
    }
}

// API to check availability of room
export const checkAvailabilityAPI = async (req, res) =>{
    try {
        const { room, checkInDate, checkOutDate } = req.body;
        const isAvailable = await checkAvailability({ checkInDate, checkOutDate, room });
        res.json({ success: true, isAvailable })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}


export const createBooking = async (req, res) =>{
    try {
        const { room, checkInDate, checkOutDate, guests } = req.body;
        const user = req.user._id;

        // Before Booking Check Availability
        const isAvailable = await checkAvailability({
            checkInDate,
            checkOutDate,
            room
        });

        if(!isAvailable){
            return res.json({success: false, message: "Room is not available"})
        }
        
        // Get totalPrice from Room
        const roomData = await Room.findById(room).populate("hotel");
        let totalPrice = roomData.pricePerNight;

        // Calculate totalPrice based on nights
        const checkIn = new Date(checkInDate)
        const checkOut = new Date(checkOutDate)
        const timeDiff = checkOut.getTime() - checkIn.getTime();
        const nights = Math.ceil(timeDiff / (1000 * 3600 * 24));

        totalPrice *= nights;
        const booking = await Booking.create({
            user,
            room,
            hotel: roomData.hotel._id,
            guests: +guests,
            checkInDate,
            checkOutDate,
            totalPrice,
        })

        // FIXED: Wrap checkInDate in new Date() so .toDateString() never crashes
        const formattedDate = new Date(booking.checkInDate).toDateString();

        // Check if the user is our local failsafe. If so, hardcode your real email for testing!
        const userEmail = req.user.email.includes("missing-webhook")
            ? process.env.SENDER_EMAIL // Sends to yourself for testing if it's the fake user
            : req.user.email;

        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: userEmail,
            subject: 'Hotel Booking Details',
            html: `
                <h2>Your Booking Details</h2>
                <p>Dear ${req.user.username},</p>
                <p>Thank you for your booking! Here are your details:</p>
                <ul>
                    <li><strong>Booking ID:</strong> ${booking._id}</li>
                    <li><strong>Hotel Name:</strong> ${roomData.hotel.name}</li>
                    <li><strong>Location:</strong> ${roomData.hotel.address}</li>
                    <li><strong>Date:</strong> ${formattedDate}</li>
                    <li><strong>Booking Amount:</strong> ${process.env.CURRENCY || '$'} ${booking.totalPrice} /night</li>
                </ul>
                <p>We look forward to welcoming you!</p>
                <p>If you need to make any changes, feel free to contact us.</p>
            `
        }

        // FIXED: Added specific error catching just for the email!
        try {
            await transporter.sendMail(mailOptions);
            console.log("Success: Booking email sent to", userEmail);
        } catch (mailError) {
            console.error("🔴 NODEMAILER ERROR:", mailError.message);
            // We don't return an error here, so the booking still succeeds even if the email fails!
        }

        res.json({ success: true, message: "Booking created successfully"})

    } catch (error) {
        console.error("Booking Error:", error);
        res.json({ success: false, message: "Failed to create booking"})
    }
};

// API to get all bookings for a user
export const getUserBookings = async (req, res) =>{
    try {
        const user = req.user._id;
        const bookings = await Booking.find({user}).populate("room hotel").sort
        ({createdAt: -1})
        res.json({success: true, bookings})
    } catch (error) {
        res.json({ success: false, message: "Failed to fetch bookings" });
    }
}

export const getHotelBookings = async (req, res) =>{
    try {
        // FIXED: Changed req.auth.userId to req.user._id
        const hotel = await Hotel.findOne({owner: req.user._id});
        if(!hotel){
            return res.json({ success: false, message: "No Hotel found" });
        }
        const bookings = await Booking.find({hotel: hotel._id}).populate("room hotel user").sort({ createdAt: -1 });
        
        const totalBookings = bookings.length;
        const totalRevenue = bookings.reduce((acc, booking)=>acc + booking.totalPrice, 0)
        
        res.json({success: true, dashboardData: {totalBookings, totalRevenue, bookings}})
    } catch (error) {
        res.json({success: false, message: "Failed to fetch bookings"})
    }
}

export const stripePayment = async (req, res)=>{
    try {
        const { bookingId } = req.body;

        const booking = await Booking.findById(bookingId);
        const roomData = await Room.findById(booking.room).populate('hotel');
        const totalPrice = booking.totalPrice;
        const { origin } = req.headers;

        // 🔥 FIXED: Changed 'new stripe' to 'new Stripe' to match the updated import
        const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);

        const line_items = [
            {
                price_data:{
                    currency: "usd",
                    product_data:{
                        name: roomData.hotel.name,
                    },
                    unit_amount: totalPrice * 100
                },
                quantity: 1,
            }
        ]
        // Create Checkout Session
        const session = await stripeInstance.checkout.sessions.create({
            line_items,
            mode: "payment",
            success_url: `${origin}/loader/my-bookings`,
            cancel_url: `${origin}/my-bookings`,
            metadata:{
                bookingId,
            }
        })
        res.json({success: true, url: session.url})

    } catch (error) {
        res.json({success: false, message: "Payment Failed"})
    }
}