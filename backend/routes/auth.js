const express = require('express');
const database = require('../helpers/database');
const rateLimit = require('express-rate-limit');
const verifyCaptcha = require('../helpers/general').verifyCaptcha;

const loginLimit = rateLimit({
    windowMs: 1000 * 60 * 60,
    max: 20,
    message: 'Too many requests for logging in.'
})

const verifyLimit = rateLimit({
    windowMs: 1000 * 60 * 60,
    max: 5,
    message: 'Max attempts of 5 per hour for email verification.'
})

const registrationLimit = rateLimit({
    windowMs: 1000 * 60 * 60,
    max: 3,
    message: 'Too many requests for registering an account.'
})

const router = express.Router();

router.post("/register", registrationLimit, async (req, res) => {
    try {
        if (!req.body.email || !req.body.email.includes("@")) {
            return res.status(400).json({
                success: false,
                message: "Email is required."
            })
        }

        if (!req.body.password) {
            return res.status(400).json({
                success: false,
                message: "Password is required."
            })
        }

        if (!req.body.captcha) {
            return res.status(400).json({
                success: false,
                message: "Captcha is required."
            })
        }

        if (req.body.password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must be 8 chars minimum."
            })
        }

        const output = await verifyCaptcha(req.body.captcha);

        if (!output) {
            return res.status(400).json({
                success: false,
                message: "Invalid captcha submitted."
            });
        }

        let result = await database.register(req.body.email, req.body.password);

        if (result.success) {
            return res.status(200).json({
                success: true,
                session: result.key
            });
        } else {
            return res.status(400).json(result);
        }
    }
    catch(error) {
        console.log(error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error. Try again later."
        });
    }
});

router.post("/login", loginLimit, async (req, res) => {
    try {
        if (!req.body.email || !req.body.email.includes("@")) {
            return res.status(400).json({
                success: false,
                message: "Email is required."
            })
        }

        if (!req.body.password) {
            return res.status(400).json({
                success: false,
                message: "Password is required."
            })
        }

        if (!req.body.captcha) {
            return res.status(400).json({
                success: false,
                message: "Captcha is required."
            })
        }
        
        const output = await verifyCaptcha(req.body.captcha);

        if (!output) {
            return res.status(400).json({
                success: false,
                message: "Invalid captcha submitted."
            });
        }

        let result = await database.login(req.body.email, req.body.password);

        if (result.success) {
            return res.status(200).json({
                success: true,
                session: result.key
            });
        } else {
            return res.status(400).json(result);
        }
    }
    catch(error) {
        console.log(error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error. Try again later."
        });
    }
});

router.post("/verify", verifyLimit, async (req, res) => {
    try {
        if (!req.body.passoffcode) {
            return res.status(400).json({
                success: false,
                message: "Pass off code is required."
            })
        }
        
        const output = await database.verifyUser(req.body.passoffcode);

        if (!output) {
            return res.status(400).json({
                success: false,
                message: "Failed to verify. Invalid code provided."
            });
        }

        return res.status(200).json({
            success: true
        });
    }
    catch(error) {
        console.log(error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error. Try again later."
        });
    }
});

router.post("/forgot", verifyLimit, async (req, res) => {
    try {
        if (!req.body.email) {
            return res.status(400).json({
                success: false,
                message: "Email is required."
            })
        }

        if (!req.body.captcha) {
            return res.status(400).json({
                success: false,
                message: "Captcha is required."
            })
        }
        
        const output = await verifyCaptcha(req.body.captcha);

        if (!output) {
            return res.status(400).json({
                success: false,
                message: "Invalid captcha submitted."
            });
        }

        const trySend = await database.sendTempPassword(req.body.email);

        if (!trySend) {
            return res.status(400).json({
                success: false,
                message: "Something went wrong while sending your temporary password. Please try again later."
            });
        }

        return res.status(200).json({
            success: true
        });
    }
    catch(error) {
        console.log(error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error. Try again later."
        });
    }
});


module.exports = router;