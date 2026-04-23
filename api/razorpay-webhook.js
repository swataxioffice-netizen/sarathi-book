/**
 * Vercel Serverless Function: POST /api/razorpay-webhook
 * Receives payment events from Razorpay and activates plans in Supabase.
 * 
 * This is the SOURCE OF TRUTH for plan activation — NOT the frontend handler.
 * Signature verification ensures only real Razorpay events are processed.
 */

const crypto = require('crypto');
const https = require('https');

// Supabase REST API call (no SDK needed in a server function)
function supabaseRequest(path, method, body, supabaseUrl, serviceKey) {
    return new Promise((resolve, reject) => {
        const url = new URL(supabaseUrl + path);
        const data = body ? JSON.stringify(body) : null;

        const options = {
            hostname: url.hostname,
            port: 443,
            path: url.pathname + url.search,
            method,
            headers: {
                'apikey': serviceKey,
                'Authorization': `Bearer ${serviceKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation',
                ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
            },
        };

        const req = https.request(options, (res) => {
            let responseData = '';
            res.on('data', chunk => responseData += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: responseData ? JSON.parse(responseData) : null });
                } catch {
                    resolve({ status: res.statusCode, data: responseData });
                }
            });
        });

        req.on('error', reject);
        if (data) req.write(data);
        req.end();
    });
}

// Activate or update a user's plan in Supabase
async function activatePlan(userId, plan, paymentId, expiryDays, supabaseUrl, serviceKey) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (expiryDays || 31));

    // 1. Fetch current settings
    const profileRes = await supabaseRequest(
        `/rest/v1/profiles?id=eq.${userId}&select=settings`,
        'GET',
        null,
        supabaseUrl,
        serviceKey
    );

    const profiles = profileRes.data;
    if (!profiles || profiles.length === 0) {
        console.error(`No profile found for user: ${userId}`);
        return false;
    }

    const currentSettings = profiles[0].settings || {};

    // 2. Merge plan into settings
    const updatedSettings = {
        ...currentSettings,
        isPremium: true,
        plan: plan, // 'pro' or 'super'
        showWatermark: false
    };

    // 3. Update profile with plan info
    const updateRes = await supabaseRequest(
        `/rest/v1/profiles?id=eq.${userId}`,
        'PATCH',
        {
            settings: updatedSettings,
            plan_expires_at: expiresAt.toISOString(),
            payment_id: paymentId,
            updated_at: new Date().toISOString(),
        },
        supabaseUrl,
        serviceKey
    );

    console.log(`Plan activated for ${userId}:`, plan, 'expires:', expiresAt.toISOString(), 'update status:', updateRes.status);
    return updateRes.status < 300;
}

// Log payment to payments table
async function logPayment(data, supabaseUrl, serviceKey) {
    await supabaseRequest(
        '/rest/v1/payments',
        'POST',
        data,
        supabaseUrl,
        serviceKey
    );
}

// Raw body parsing needed for HMAC verification
async function getRawBody(req) {
    return new Promise((resolve, reject) => {
        let data = '';
        req.on('data', chunk => { data += chunk; });
        req.on('end', () => resolve(data));
        req.on('error', reject);
    });
}

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_KEY;

    if (!webhookSecret || !supabaseUrl || !serviceKey) {
        console.error('Missing required environment variables');
        return res.status(500).json({ error: 'Server misconfigured' });
    }

    // Read raw body for signature verification
    const rawBody = await getRawBody(req);
    const signature = req.headers['x-razorpay-signature'];

    // Verify HMAC-SHA256 signature
    const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');

    if (signature !== expectedSignature) {
        console.warn('Webhook signature mismatch — possible fake request');
        return res.status(401).json({ error: 'Invalid signature' });
    }

    let event;
    try {
        event = JSON.parse(rawBody);
    } catch {
        return res.status(400).json({ error: 'Invalid JSON' });
    }

    console.log('Razorpay webhook event:', event.event);

    const payment = event.payload?.payment?.entity;

    if (!payment) {
        return res.status(200).json({ status: 'ignored' });
    }

    const userId = payment.notes?.user_id;
    const plan = payment.notes?.plan || 'pro';
    const billingCycle = payment.notes?.billing_cycle || 'monthly';
    const expiryDays = parseInt(payment.notes?.expiry_days || '31', 10);
    const paymentId = payment.id;
    const amountPaise = payment.amount;

    // --- Handle payment.captured (SUCCESS) ---
    if (event.event === 'payment.captured') {
        console.log(`Payment captured: ${paymentId} for user ${userId}, plan: ${plan}`);

        if (userId && userId !== 'unknown') {
            const activated = await activatePlan(userId, plan, paymentId, expiryDays, supabaseUrl, serviceKey);

            // Log to payments table
            await logPayment({
                user_id: userId,
                payment_id: paymentId,
                order_id: payment.order_id,
                plan,
                billing_cycle: billingCycle,
                amount_paise: amountPaise,
                status: activated ? 'activated' : 'activation_failed',
                captured_at: new Date().toISOString(),
            }, supabaseUrl, serviceKey).catch(err => console.error('Payment log failed:', err));
        } else {
            console.warn('payment.captured missing user_id in notes — cannot activate plan');
        }

        return res.status(200).json({ status: 'ok' });
    }

    // --- Handle payment.failed ---
    if (event.event === 'payment.failed') {
        console.log(`Payment failed: ${paymentId} for user ${userId}`);

        await logPayment({
            user_id: userId || null,
            payment_id: paymentId,
            order_id: payment.order_id,
            plan,
            billing_cycle: billingCycle,
            amount_paise: amountPaise,
            status: 'failed',
            captured_at: new Date().toISOString(),
        }, supabaseUrl, serviceKey).catch(err => console.error('Payment log failed:', err));

        return res.status(200).json({ status: 'ok' });
    }

    // All other events — acknowledge but ignore
    return res.status(200).json({ status: 'ignored' });
};
