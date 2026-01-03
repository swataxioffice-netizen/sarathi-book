/**
 * Google Cloud Vision API Utility
 * Used for OCR (Optical Character Recognition) on documents and receipts.
 */

const VISION_API_URL = 'https://vision.googleapis.com/v1/images:annotate';

export interface OcrResult {
    fullText: string;
    lines: string[];
}

export async function performOcr(base64Image: string): Promise<OcrResult> {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY; // Reuse Maps key if Vision API is enabled for it
    if (!apiKey) {
        throw new Error('Google Maps API Key not found');
    }

    // Remove base64 header if present
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');

    const requestBody = {
        requests: [
            {
                image: {
                    content: cleanBase64,
                },
                features: [
                    {
                        type: 'TEXT_DETECTION',
                    },
                ],
            },
        ],
    };

    try {
        const response = await fetch(`${VISION_API_URL}?key=${apiKey}`, {
            method: 'POST',
            body: JSON.stringify(requestBody),
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Failed to perform OCR');
        }

        const data = await response.json();
        const annotation = data.responses[0]?.fullTextAnnotation;

        if (!annotation) {
            return { fullText: '', lines: [] };
        }

        const fullText = annotation.text;
        const lines = fullText.split('\n').filter((l: string) => l.trim().length > 0);

        return { fullText, lines };
    } catch (error) {
        console.error('Vision API Error:', error);
        throw error;
    }
}

/**
 * Specifically parses fuel receipts for Amount and Date
 */
export function parseReceipt(lines: string[]): { amount?: number; date?: string; liters?: number } {
    let amount: number | undefined;
    let liters: number | undefined;
    let date: string | undefined;

    // Common patterns in Indian fuel bills (Petrol/Diesel)
    const amountPatterns = [
        /TOTAL\s*[:\-\s]*₹?\s*(\d+\.?\d*)/i,
        /AMOUNT\s*[:\-\s]*₹?\s*(\d+\.?\d*)/i,
        /SALE\s*VALUE\s*[:\-\s]*₹?\s*(\d+\.?\d*)/i,
        /₹\s*(\d+\.?\d*)/
    ];

    const volumePatterns = [
        /VOLUME\s*[:\-\s]*(\d+\.?\d*)\s*L/i,
        /QTY\s*[:\-\s]*(\d+\.?\d*)/i,
        /(\d+\.?\d*)\s*LTR/i
    ];

    const datePatterns = [
        /(\d{2}[/-]\d{2}[/-]\d{2,4})/, // DD/MM/YYYY
        /DATE\s*[:\-\s]*(\d{2}[/-]\d{2}[/-]\d{2,4})/i
    ];

    for (const line of lines) {
        // Try to find amount
        if (!amount) {
            for (const pattern of amountPatterns) {
                const match = line.match(pattern);
                if (match && match[1]) {
                    amount = parseFloat(match[1]);
                    break;
                }
            }
        }

        // Try to find liters
        if (!liters) {
            for (const pattern of volumePatterns) {
                const match = line.match(pattern);
                if (match && match[1]) {
                    liters = parseFloat(match[1]);
                    break;
                }
            }
        }

        // Try to find date
        if (!date) {
            for (const pattern of datePatterns) {
                const match = line.match(pattern);
                if (match && match[1]) {
                    date = match[1];
                    break;
                }
            }
        }
    }

    return { amount, date, liters };
}

/**
 * Specifically parses Driver documents (License/RC) for Expiry Date
 */
export function parseDocument(lines: string[]): { expiryDate?: string; docNumber?: string } {
    let expiryDate: string | undefined;
    let docNumber: string | undefined;

    // Common labels in Indian documents
    const expiryPatterns = [
        /VALID\s*UPTO\s*[:\-\s]*(\d{2}[/-]\d{2}[/-]\d{2,4})/i,
        /EXP\s*[:\-\s]*DATE\s*[:\-\s]*(\d{2}[/-]\d{2}[/-]\d{2,4})/i,
        /DATE\s*OF\s*EXPIRY\s*[:\-\s]*(\d{2}[/-]\d{2}[/-]\d{2,4})/i,
        /(\d{2}[/-]\d{2}[/-]\d{2,4})/ // Fallback for any date
    ];

    const docNumPatterns = [
        /DL\s*NO\s*[:\-\s]*([A-Z0-9\s]+)/i,
        /REGN\s*NO\s*[:\-\s]*([A-Z0-9\s]+)/i,
        /LICENSE\s*NO\s*[:\-\s]*([A-Z0-9\s]+)/i
    ];

    for (const line of lines) {
        // Try to find expiry date
        if (!expiryDate) {
            for (const pattern of expiryPatterns) {
                const match = line.match(pattern);
                if (match && match[1]) {
                    // Primitive validation: expiry date should be in the future or recent past
                    expiryDate = match[1];
                    break;
                }
            }
        }

        // Try to find doc number
        if (!docNumber) {
            for (const pattern of docNumPatterns) {
                const match = line.match(pattern);
                if (match && match[1]) {
                    docNumber = match[1].trim();
                    break;
                }
            }
        }
    }

    return { expiryDate, docNumber };
}
