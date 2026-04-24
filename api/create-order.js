import https from 'https';

function razorpayRequest(path, body, keyId, keySecret) {
    return new Promise((resolve, reject) => {
        const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
        const data = JSON.stringify(body);

        const options = {
            hostname: 'api.razorpay.com',
            port: 443,
            path,
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data),
            },
        };

        const req = https.request(options, (res) => {
            let responseData = '';
            res.on('data', chunk => responseData += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(responseData));
                } catch {
                    reject(new Error('Invalid JSON response from Razorpay'));
                }
            });
        });

        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const keyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
        console.error('Missing Razorpay env vars');
        return res.status(500).json({ error: 'Payment gateway not configured. Contact support.' });
    }

    const { amount, plan, billingCycle, userId } = req.body || {};

    if (!amount || amount < 100) {
        return res.status(400).json({ error: 'Invalid amount' });
    }
    if (!plan || !['pro', 'super'].includes(plan)) {
        return res.status(400).json({ error: 'Invalid plan' });
    }

    const expiryDays = billingCycle === 'yearly' ? 366 : 31;

    try {
        const order = await razorpayRequest('/v1/orders', {
            amount: Math.round(amount),
            currency: 'INR',
            receipt: `sarathi_${plan}_${Date.now()}`,
            notes: {
                plan,
                billing_cycle: billingCycle || 'monthly',
                user_id: userId || 'unknown',
                expiry_days: String(expiryDays),
                app: 'SarathiBook',
            },
        }, keyId, keySecret);

        if (order.error) {
            console.error('Razorpay order error:', order.error);
            return res.status(502).json({ error: order.error.description || 'Failed to create order' });
        }

        return res.status(200).json({
            order_id: order.id,
            amount: order.amount,
            currency: order.currency,
            key_id: keyId,
        });
    } catch (err) {
        console.error('create-order error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
