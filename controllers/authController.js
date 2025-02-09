const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const nodemailer = require('nodemailer');
const otpStorage = {}; 

// Function to send OTP via Email and check delivery status
const sendOtpEmail = async (email, otp) => {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER, 
            pass: process.env.EMAIL_PASS, 
        },
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Your OTP for Registration",
        text: `Your OTP is: ${otp}`,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent: ", info);

        // Checking if the email was delivered successfully
        if (info.rejected.length > 0) {
            return { success: false, msg: "Email delivery failed (Bounced)" };
        }
        return { success: true, msg: "OTP sent successfully" };
    } catch (error) {
        console.error("Error sending email:", error);
        return { success: false, msg: "Error sending OTP" };
    }
};

// Forgot Password - Send OTP
const forgotPassword = async (req, res) => {
    const { email } = req.body;
    console.log(req.body, "req.body");
    
    try {
        let user = await User.findOne({ email });
        if (!user) return res.status(400).json({ msg: "User not found" });

        console.log(user, "user");

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        otpStorage[email] = otp;

        // Call sendOtpEmail and check response
        const emailResponse = await sendOtpEmail(email, otp);
        if (!emailResponse.success) {
            return res.status(400).json({ msg: emailResponse.msg });
        }

        res.status(200).json({ msg: "OTP sent to email" });
    } catch (err) {
        res.status(500).json({ msg: "Error sending OTP" });
    }
};

// Reset Password - Verify OTP and Update Password
const resetPassword = async (req, res) => {
    const { email, otp, newPassword } = req.body;

    try {
        if (otpStorage[email] !== otp) {
            return res.status(400).json({ msg: "Invalid OTP" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await User.findOneAndUpdate({ email }, { password: hashedPassword });

        delete otpStorage[email]; 
        res.status(200).json({ msg: "Password reset successfully" });
    } catch (err) {
        res.status(500).json({ msg: "Server Error" });
    }
};

// Send OTP Route
const sendOtp = async (req, res) => {
    const { email } = req.body;

    try {
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ msg: "User already exists" });

        const otp = Math.floor(100000 + Math.random() * 900000).toString(); 
        otpStorage[email] = otp; 

        await sendOtpEmail(email, otp);
        res.status(200).json({ msg: "OTP sent to email" });
    } catch (err) {
        res.status(500).json({ msg: "Error sending OTP" });
    }
};

// Verify OTP and Register User
const verifyOtp = async (req, res) => {
    const { email, otp, form } = req.body;

    try {
        if (otpStorage[email] !== otp) {
            return res.status(400).json({ msg: "Invalid OTP" });
        }

        const { username, phone, password } = form;
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        const newUser = new User({ username, email, phone, password: hashedPassword });

        await newUser.save();

        delete otpStorage[email]; 
        res.status(201).json({ msg: "User registered successfully" });
    } catch (err) {
        res.status(500).json({ msg: "Server Error" });
    }
};

// Login User
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ msg: "Invalid Credentials" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: "Invalid Credentials" });

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

        res.json({ token, user: { id: user._id, email: user.email } });
    } catch (err) {
        res.status(500).json({ msg: "Server Error" });
    }
};

module.exports = { sendOtp, verifyOtp, loginUser, forgotPassword, resetPassword };
