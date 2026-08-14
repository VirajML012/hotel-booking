import React, { useEffect } from 'react'
import { useAppContext } from '../context/AppContext' // ✅ Fixed typo: conext -> context
import { useParams } from 'react-router-dom'

const Loader = () => {
    const { navigate } = useAppContext()
    const { nextUrl } = useParams()

    useEffect(()=>{
        if(nextUrl){
            setTimeout(()=>{
                navigate(`/${nextUrl}`)
            }, 1000) // ✅ Reduced to 1 second for a much faster redirect experience
        }
    }, [nextUrl])

    return (
        <div className='flex justify-center items-center h-screen'>
            <div className='animate-spin rounded-full h-24 w-24 border-4 border-gray-300 border-t-primary'></div>
        </div>
    )
}

export default Loader; // ✅ Added default export so App.js can import it properly