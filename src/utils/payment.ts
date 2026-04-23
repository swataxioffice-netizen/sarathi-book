/**
 * Razorpay Payment Utilities
 * 
 * Flow:
 * 1. Frontend calls createRazorpayOrder() → hits /api/create-order (Vercel)
 * 2. Server creates Order in Razorpay, returns order_id
 * 3. Frontend opens Razorpay Checkout with order_id
 * 4. User pays → Razorpay fires webhook to /api/razorpay-webhook
 * 5. Webhook verifies signature, activates plan in Supabase
 * 6. Frontend polls for plan activation as a UI convenience
 */

interface RazorpayResponse {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
}

interface CreateOrderResponse {
    order_id: string;
    amount: number;
    currency: string;
    key_id: string;
}

declare global {
    interface Window {
        Razorpay: new (options: RazorpayOptions) => { open: () => void };
    }
}

interface RazorpayOptions {
    key: string;
    order_id: string;
    amount: number;
    currency: string;
    name: string;
    description: string;
    image?: string;
    handler: (response: RazorpayResponse) => void;
    prefill: { name: string; email: string; contact: string };
    notes?: Record<string, string>;
    theme: { color: string };
    modal?: {
        ondismiss?: () => void;
        escape?: boolean;
    };
}

export const loadRazorpay = (): Promise<boolean> => {
    return new Promise((resolve) => {
        // Don't load twice
        if (window.Razorpay) return resolve(true);
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

/**
 * Step 1: Create a server-side Razorpay Order.
 * This keeps the secret key on the server.
 */
export const createRazorpayOrder = async (params: {
    amount: number;        // in paise (49 * 100 = 4900)
    plan: 'pro' | 'super';
    billingCycle: 'monthly' | 'yearly';
    userId: string;
}): Promise<CreateOrderResponse> => {
    const response = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(err.error || `Order creation failed (${response.status})`);
    }

    return response.json();
};

/**
 * Full payment initialization flow.
 * Opens Razorpay checkout with a valid server-created order_id.
 */
export const initializePayment = async (options: {
    amount: number;
    plan: 'pro' | 'super';
    billingCycle: 'monthly' | 'yearly';
    userId: string;
    description: string;
    prefill: { name: string; email: string; contact: string };
    onSuccess?: (response: RazorpayResponse) => void;
    onDismiss?: () => void;
}) => {
    // Step 1: Load Razorpay SDK
    const sdkLoaded = await loadRazorpay();
    if (!sdkLoaded) {
        window.dispatchEvent(new CustomEvent('auth-error', {
            detail: { title: 'Payment SDK Error', message: 'Razorpay failed to load. Are you online?', type: 'error' }
        }));
        return;
    }

    // Step 2: Create server-side order
    let orderData: CreateOrderResponse;
    try {
        orderData = await createRazorpayOrder({
            amount: options.amount,
            plan: options.plan,
            billingCycle: options.billingCycle,
            userId: options.userId,
        });
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Order creation failed';
        window.dispatchEvent(new CustomEvent('auth-error', {
            detail: { title: 'Payment Setup Failed', message: msg, type: 'error' }
        }));
        return;
    }

    // Step 3: Open Razorpay Checkout with order_id
    const rzpOptions: RazorpayOptions = {
        key: orderData.key_id,
        order_id: orderData.order_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Sarathi Book',
        description: options.description,
        image: '/logo.webp',
        handler: (response: RazorpayResponse) => {
            console.log('Razorpay payment response:', response.razorpay_payment_id);
            if (options.onSuccess) options.onSuccess(response);
        },
        prefill: options.prefill,
        notes: {
            plan: options.plan,
            billing_cycle: options.billingCycle,
            user_id: options.userId,
        },
        theme: { color: '#0047AB' },
        modal: {
            ondismiss: () => {
                if (options.onDismiss) options.onDismiss();
            },
            escape: false,
        },
    };

    const rzp = new window.Razorpay(rzpOptions);
    rzp.open();
};
