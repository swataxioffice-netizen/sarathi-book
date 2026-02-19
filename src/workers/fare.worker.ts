import { calculateFare } from '../utils/fare';

self.onmessage = (e: MessageEvent) => {
    const { id, args } = e.data;
    try {
        const result = calculateFare(...(args as Parameters<typeof calculateFare>));
        self.postMessage({ id, result });
    } catch (error: unknown) {
        const err = error as { message?: string };
        self.postMessage({ id, error: err.message });
    }
};
