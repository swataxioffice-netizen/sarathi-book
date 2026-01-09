import FareWorker from '../workers/fare.worker?worker';
import { calculateFare } from './fare';

// Singleton worker instance
let worker: Worker;

const getWorker = () => {
    if (!worker) {
        worker = new FareWorker();
    }
    return worker;
};

type FareFunction = typeof calculateFare;
type FareArgs = Parameters<FareFunction>;
type FareResult = ReturnType<FareFunction>;

export const calculateFareAsync = (...args: FareArgs): Promise<FareResult> => {
    const w = getWorker();
    const id = Math.random().toString(36).substring(7);

    return new Promise((resolve, reject) => {
        const handler = (e: MessageEvent) => {
            if (e.data.id === id) {
                w.removeEventListener('message', handler);
                if (e.data.error) {
                    reject(new Error(e.data.error));
                } else {
                    resolve(e.data.result);
                }
            }
        };
        w.addEventListener('message', handler);
        w.postMessage({ id, args });
    });
};
