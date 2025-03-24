const express = require('express');
const router = express.Router();
const axios = require('axios');
const authMiddleware = require('../middlewares/authMiddleware');

// Get API credentials from environment variables
const SANDBOX_API_KEY = process.env.SANDBOX_API_KEY;
const SANDBOX_SECRET_KEY = process.env.SANDBOX_SECRET_KEY;

let access_token = "";
let token_expiration = 0;

// Modified getAuthToken function
async function getAuthToken() {
    // Reuse token if it's still valid (1 minute buffer)
    if (access_token && Date.now() < token_expiration - 60000) {
        return access_token;
    }

    try {
        const response = await axios({
            method: 'post',
            url: 'https://api.sandbox.co.in/authenticate',
            headers: {
                'Accept': 'application/json',
                'x-api-key': SANDBOX_API_KEY,
                'x-api-secret': SANDBOX_SECRET_KEY,
                'x-api-version': '2.0'
            }
        });
        
        access_token = response.data.access_token;
        // Calculate expiration time (1 hour from now)
        token_expiration = Date.now() + (60 * 60 * 1000);
        return access_token;
    } catch (error) {
        console.error('Authentication Error:', error.response?.data || error.message);
        throw new Error('Failed to authenticate with Sandbox API');
    }
}

// Generate OTP
router.post('/generate-otp', authMiddleware, async (req, res) => {
    try {
        const { aadhaar_number } = req.body;

        if (!aadhaar_number) {
            return res.status(400).json({ error: 'Aadhaar number is required' });
        }

        const generateOtpHeaders = {
            'Accept': 'application/json',
            'Authorization': await getAuthToken(),
            'x-api-key': SANDBOX_API_KEY,
            'x-api-version': '2.0',
            'Content-Type': 'application/json'
        };

        const response = await axios({
            method: 'post',
            url: 'https://api.sandbox.co.in/kyc/aadhaar/okyc/otp',
            headers: generateOtpHeaders,
            data: {
                '@entity': 'in.co.sandbox.kyc.aadhaar.okyc.otp.request',
                aadhaar_number: aadhaar_number,
                consent: 'y',
                reason: 'For KYC'
            }
        });

        // Return the response with reference_id in the correct format
        res.json({
            data: {
                reference_id: response.data.data.reference_id,
                message: response.data.message || 'OTP sent successfully'
            }
        });

    } catch (error) {
        console.error('OTP Generation Error:', error.response?.data || error.message);
        res.status(500).json({
            error: 'Failed to generate OTP',
            details: error.response?.data || error.message
        });
    }
});

// Verify OTP
router.post('/verify-otp', authMiddleware, async (req, res) => {
    try {
        const { reference_id, otp, aadhaar_number } = req.body;

        // Validate all required fields
        if (!reference_id || !otp || !aadhaar_number) {
            return res.status(400).json({ 
                error: 'Missing required fields: reference_id, otp, and aadhaar_number are required' 
            });
        }

        const authToken = await getAuthToken();

        const response = await axios({
            method: 'post',
            url: 'https://api.sandbox.co.in/kyc/aadhaar/okyc/otp/verify',
            headers: {
                'Accept': 'application/json',
                'Authorization': authToken,
                'x-api-key': SANDBOX_API_KEY,
                'x-api-version': '2.0',
                'Content-Type': 'application/json'
            },
            data: {
                '@entity': 'in.co.sandbox.kyc.aadhaar.okyc.request',
                reference_id: String(reference_id),
                otp: String(otp)
            }
        });

        console.log('Verification Response:', response.data.data); // Log the verification response

        // Respond based on verification status
        if (response.data.data && response.data.data.status === 'SUCCESS') {
            return res.json({
                data: {
                    status: response.data.data.status,
                    message: response.data.message || 'Verification successful'
                }
            });
        } else {
            console.error('Verification failed:', response.data); // Log verification failure
            return res.status(400).json({
                error: 'Verification failed',
                details: response.data
            });
        }

    } catch (error) {
        console.error('OTP Verification Error:', error.response?.data || error.message);
        res.status(500).json({
            error: 'Failed to verify OTP',
            details: error.response?.data || error.message
        });
    }
});

// Check Aadhaar verification status
router.get('/status', authMiddleware, async (req, res) => {
    try {
        const user_id = req.userId;

        return res.json({
            isVerified: false, // Since we are not saving Aadhaar data anymore
            data: null
        });
    } catch (error) {
        console.error('Aadhaar Status Check Error:', error);
        res.status(500).json({
            error: 'Failed to check Aadhaar status',
            details: error.message
        });
    }
});

module.exports = router;
