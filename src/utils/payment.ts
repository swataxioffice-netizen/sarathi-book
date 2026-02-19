interface RazorpayResponse {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
}

declare global {
    interface Window {
        Razorpay: {
            new (options: RazorpayOptions): {
                open: () => void;
            };
        };
    }
}

export const loadRazorpay = (): Promise<boolean> => {
    return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

interface RazorpayOptions {
    key: string;
    amount: number;
    currency: string;
    name: string;
    description: string;
    image?: string;
    handler: (response: RazorpayResponse) => void;
    prefill: {
        name: string;
        email: string;
        contact: string;
    };
    notes?: Record<string, string>;
    theme: {
        color: string;
    };
}

export const initializePayment = async (options: Partial<RazorpayOptions>) => {
    const res = await loadRazorpay();

    if (!res) {
        alert('Razorpay SDK failed to load. Are you online?');
        return;
    }

    const razorpayOptions: RazorpayOptions = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_placeholder', // User needs to provide this
        amount: options.amount || 99900, // in paise
        currency: 'INR',
        name: 'Sarathi Book Pro',
        description: options.description || 'Yearly Subscription',
        image: '/logo.png',
        handler: options.handler || ((res: RazorpayResponse) => console.log(res)),
        prefill: {
            name: options.prefill?.name || '',
            email: options.prefill?.email || '',
            contact: options.prefill?.contact || ''
        },
        theme: {
            color: '#0047AB'
        }
    };

    const rzp = new window.Razorpay(razorpayOptions);
    rzp.open();
};
