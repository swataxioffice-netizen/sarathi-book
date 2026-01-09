import { calculateFare } from '../utils/fare';

self.onmessage = (e: MessageEvent) => {
    const { id, args } = e.data;
    try {
        const result = calculateFare(...(args as Parameters<typeof calculateFare>));
        self.postMessage({ id, result });
    } catch (error: any) {
        self.postMessage({ id, error: error.message });
    }
};
