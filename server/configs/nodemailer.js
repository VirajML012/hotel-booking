import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
    // FIXED: Removed the extra 's' from smtp-relay
    host: "smtp-relay.brevo.com",
    port: 587,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
})

export default transporter