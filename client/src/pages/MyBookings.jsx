import React, { useState, useEffect } from 'react'
import Title from '../components/Title'
import { assets } from '../assets/assets'
import { useAppContext } from '../context/AppContext'
import toast from 'react-hot-toast'

const MyBookings = () => {

    const { axios, getToken, user } = useAppContext()
    const [bookings, setBookings] = useState([])

    const fetchUserBookings = async ()=>{
        try {
            const { data } = await axios.get('/api/bookings/user', {headers: {
            Authorization: `Bearer ${await getToken()}` }})
            
            if (data.success){
                setBookings(data.bookings)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message || "Something went wrong")
        }
    }

    useEffect(()=>{
        if (user) {
            fetchUserBookings()
        }
    }, [user])
    

return (
    <div className='py-28 md:pb-35 md:pt-32 px-4 md:px-16 lg:px-24 xl:px-32'>

        <Title title='My Bookings' subTitle='Easily manage your past, current, and upcoming hotel reservations in one place. Plan your trips seamlessly with just a few clicks' align='left' />

        <div className='max-w-6xl mt-8 w-full text-gray-800'>

        <div className='hidden md:grid md:grid-cols-[3fr_2fr_1fr] w-full border-b border-gray-300 font-medium text-base py-3'>
            <div>Hotels</div>
            <div>Date & Timings</div>
            <div>Payment</div>
        </div>

        {/* Bookings List */}
        <div>
        {bookings.map((booking, index) => (
            <div key={booking._id || index} className='flex flex-col md:flex-row justify-between md:items-center gap-4 py-4 border-b border-gray-200'>
            
              {/* Hotel Details */}
            <div className='flex items-center gap-4 w-full md:w-1/2'>
                <img src={booking.room?.images?.[0]} alt="hotel img" className='w-24 h-24 object-cover rounded' />
                <div className='flex flex-col text-sm text-gray-700'>
                <p className='text-2xl font-medium'>
                    {booking.hotel?.name} <span className='text-sm font-normal text-gray-500'>({booking.room?.roomType})</span>
                </p>
                <div className='flex items-center gap-2 mt-1'>
                    <img src={assets.locationIcon} alt="location icon" className='w-4' />
                    <span className='text-gray-500'>{booking.hotel?.address}</span>
                </div>
                <div className='flex items-center gap-2 mt-1'>
                    <img src={assets.guestsIcon} alt="guests icon" className='w-4' />
                    <span className='text-gray-500'>{booking.guests} Guests</span>
                </div>
                <p className='text-base font-medium mt-1'>
                    ${booking.totalPrice}
                </p>
                </div>
            </div>

              {/* Date and Timings */}
            <div className='flex flex-col w-full md:w-1/4 gap-2 text-sm text-gray-700'>
                <div className='flex items-center gap-2'>
                <p className='font-medium'>Check-in</p>
                <p className='text-gray-500'>{new Date(booking.checkInDate).toDateString()}</p>
                </div>
                <div className='flex items-center gap-2'>
                <p className='font-medium'>Check-out</p>
                <p className='text-gray-500'>{new Date(booking.checkOutDate).toDateString()}</p>
                </div>
            </div>

              {/* Payment Status */}
            <div className='flex flex-col w-full md:w-1/4 items-start gap-2'>
                <div className='flex items-center gap-2'>
                <div className={`w-2 h-2 rounded-full ${booking.isPaid ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <p className={`text-sm ${booking.isPaid ? 'text-green-500' : 'text-red-500'}`}>
                    {booking.isPaid ? 'Paid' : 'Unpaid'}
                </p>
                </div>
                {!booking.isPaid && (
                <button className='px-4 py-2 bg-blue-600 text-white rounded cursor-pointer'>
                    Pay Now
                </button>
                )}
            </div>

            </div>
        ))}
        </div>
    </div>
    </div>
)
}

export default MyBookings