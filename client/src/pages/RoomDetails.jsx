import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { assets, facilityIcons, roomCommonData } from '../assets/assets';
import StarRating from '../components/StarRating';
import { useAppContext } from '../context/AppContext';
import toast from 'react-hot-toast'; // FIXED: No curly braces around toast!

const RoomDetails = () => {
    const { id } = useParams();
    const { rooms, getToken, axios } = useAppContext();
    const navigate = useNavigate(); // Used direct import just to be safe
    
    const [room, setRoom] = useState(null);
    const [mainImage, setMainImage] = useState(null);
    const [checkInDate, setCheckInDate] = useState(null);
    const [checkOutDate, setCheckOutDate] = useState(null);
    const [guests, setGuests] = useState(1);
    const [isAvailable, setIsAvailable] = useState(false);

    // Check if the Room is Available
    const checkAvailability = async () => {
        try {
            if (checkInDate >= checkOutDate) {
                toast.error('Check-In Date should be less than Check-Out Date');
                return;
            }
            const { data } = await axios.post('/api/bookings/check-availability', {
                room: id, checkInDate, checkOutDate
            });
            
            if (data.success) {
                if (data.isAvailable) {
                    setIsAvailable(true);
                    toast.success('Room is available');
                } else {
                    setIsAvailable(false);
                    toast.error('Room is not available');
                }
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message || 'Error checking availability');
        }
    }

    // onSubmitHandler function to check availability & book the room
    const onSubmitHandler = async (e) => {
        try {
            e.preventDefault();
            if (!isAvailable) {
                return checkAvailability();
            } else {
                const { data } = await axios.post('/api/bookings/book', {
                    room: id,
                    checkInDate,
                    checkOutDate,
                    guests,
                    paymentMethod: "Pay At Hotel"
                }, {
                    headers: { Authorization: `Bearer ${await getToken()}` }
                });

                if (data.success) {
                    toast.success(data.message);
                    navigate('/my-bookings');
                    window.scrollTo(0, 0);
                } else {
                    toast.error(data.message);
                }
            }
        } catch (error) {
            toast.error(error.message || 'Error booking room');
        }
    };

    useEffect(() => {
        // FIXED: Added optional chaining (?) so it won't crash if rooms is undefined
        if (rooms && rooms.length > 0) {
            const foundRoom = rooms.find((r) => String(r._id) === String(id));
            if (foundRoom) {
                setRoom(foundRoom);
                setMainImage(foundRoom.images[0]);
            }
        }
    }, [rooms, id]);

    // FIXED: Instead of a blank white page, show a loading state while fetching!
    if (!room) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="text-xl text-gray-500 font-medium animate-pulse">Loading Room Details...</div>
            </div>
        );
    }

    return (
        <div className="py-28 md:py-35 px-4 md:px-16 lg:px-24 xl:px-32">
            
            {/* Room Details */}
            <div className="flex flex-col md:flex-row items-start md:items-center gap-2">
                <h1 className="text-3xl md:text-4xl font-playfair">
                    {room.hotel?.name}{' '}
                    <span className="font-inter text-sm">({room.roomType})</span>
                </h1>
                <p className="text-xs font-inter py-1.5 px-3 text-white bg-orange-500 rounded-full">
                    20% OFF
                </p>
            </div>

            {/* Room Rating */}
            <div className="flex items-center gap-1 mt-2">
                <StarRating />
                <p className="ml-2">200+ reviews</p>
            </div>

            {/* Room Address */}
            <div className="flex items-center gap-1 text-gray-500 mt-2">
                <img src={assets.locationIcon} alt="location-icon" />
                <span>{room.hotel?.address}</span>
            </div>
            
            {/* Room Images */}
            <div className="flex flex-col lg:flex-row mt-6 gap-6">
                <div className="lg:w-1/2 w-full">
                    <img
                        src={mainImage}
                        alt="Room Image"
                        className="w-full rounded-xl shadow-lg object-cover"
                    />
                </div>
                <div className="grid grid-cols-2 gap-4 lg:w-1/2 w-full">
                    {room?.images?.length > 1 &&
                    room.images.map((image, index) => (
                        <img
                            onClick={() => setMainImage(image)}
                            key={index}
                            src={image}
                            alt="Room Image"
                            className={`w-full rounded-xl shadow-md object-cover cursor-pointer ${
                                mainImage === image ? 'outline outline-3 outline-orange-500' : ''
                            }`}
                        />
                    ))}
                </div>
            </div>

            {/* Room Highlights */}
            <div className="mt-8">
                <div className="flex flex-col">
                    <h1 className="text-2xl font-playfair font-medium">Experience luxury like never before</h1>
                </div>
                <div className="flex flex-wrap gap-4 mt-4">
                    {room.amenities?.map((item, index) => (
                        <div key={index} className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-lg">
                            <img src={facilityIcons[item]} alt={item} className="w-6 h-6" />
                            <p className="text-xs">{item}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Room Price */}
            <p className="mt-6 text-2xl font-medium text-gray-700">
                ${room.pricePerNight} <span className="text-base text-gray-500 font-normal">/ night</span>
            </p>

            {/* Check-in Checkout Form */}
            <form onSubmit={onSubmitHandler} className="flex flex-col md:flex-row items-center gap-4 mt-6 bg-white p-4 rounded-xl shadow-md border border-gray-200">
                <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                    <div className="flex flex-col">
                        <label htmlFor="checkInDate" className="font-medium text-sm text-gray-600">Check-in</label>
                        <input
                            onChange={(e)=>{setCheckInDate(e.target.value); setIsAvailable(false)}}
                            min={new Date().toISOString().split('T')[0]}
                            type="date"
                            id='checkInDate'
                            className='w-full rounded border border-gray-300 px-3 py-2 mt-1.5 outline-none'
                            required
                        />
                    </div>
                    
                    <div className="hidden md:block w-px h-10 bg-gray-300 self-center"></div>

                    <div className="flex flex-col">
                        <label htmlFor="checkOutDate" className="font-medium text-sm text-gray-600">Check-out</label>
                        <input
                            onChange={(e)=>{setCheckOutDate(e.target.value); setIsAvailable(false)}}
                            min={checkInDate || new Date().toISOString().split('T')[0]}
                            disabled={!checkInDate}
                            type="date"
                            id="checkOutDate"
                            className="border border-gray-300 rounded-md px-3 py-2 mt-1 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                            required
                        />
                    </div>

                    <div className="hidden md:block w-px h-10 bg-gray-300 self-center"></div>

                    <div className="flex flex-col">
                        <label htmlFor="guests" className="font-medium text-sm text-gray-600">Guests</label>
                        <input
                            onChange={(e)=>setGuests(e.target.value)}
                            value={guests}
                            type="number"
                            id='guests'
                            placeholder='1'
                            min="1"
                            className='max-w-20 rounded border border-gray-300 px-3 py-2 mt-1.5 outline-none'
                            required
                        />
                    </div>
                </div>
                
                <div className="hidden md:block w-px h-10 bg-gray-300"></div>

                <button type="submit" className="w-full md:w-auto bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition">
                    {isAvailable ? "Book Now" : "Check Availability"}
                </button>
            </form>

            {/* Common Specifications */}
            <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {roomCommonData?.map((spc, index) => (
                    <div key={index} className="flex gap-4 items-start">
                        <img src={spc.icon} alt={`${spc.title}-icon`} className="w-6 h-6" />
                        <div>
                            <p className="text-base font-medium">{spc.title}</p>
                            <p className="text-gray-500 text-sm mt-1">{spc.description}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Description */}
            <div className="border-y border-gray-300 py-6 mt-10">
                <p className="text-gray-600 leading-relaxed text-sm md:text-base">
                    {room.description || "Experience the perfect blend of comfort and style in our carefully curated rooms."}
                </p>
            </div>

            {/* Hosted by */}
            <div className="flex flex-col items-start gap-4">
                <div className="flex gap-4">
                    {room.hotel?.owner?.image && (
                        <img
                            src={room.hotel.owner.image}
                            alt="Host"
                            className="h-14 w-14 md:h-18 md:w-18 rounded-full object-cover"
                        />
                    )}
                    <div>
                        <p className="text-lg md:text-xl">Hosted by {room.hotel?.name}</p>
                        <div className="flex items-center mt-1">
                            <StarRating />
                            <p className="ml-2">200+ reviews</p>
                        </div>
                    </div>
                </div>
                <button className="px-6 py-2.5 mt-4 rounded text-white bg-primary hover:bg-primary-dull transition-all cursor-pointer">
                    Contact Now
                </button>
            </div>
        </div>
    );
};

export default RoomDetails;