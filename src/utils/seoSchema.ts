import { VEHICLES } from '../config/vehicleRates';

interface TripSchemaParams {
    pickup: string;
    drop: string;
    distance: string | number;
    vehicle: string; // id or name
    amount: number;
    tripType: string;
    details?: string[] | string;
}

export const generateTripSchema = ({ pickup, drop, distance, vehicle, amount, tripType, details }: TripSchemaParams) => {
    const pCity = (pickup || 'Location').split(',')[0];
    const dCity = (drop || 'Location').split(',')[0];

    // Resolve Vehicle Name
    const vehicleObj = VEHICLES.find(v => v.id === vehicle || v.name === vehicle);
    const vehicleName = vehicleObj ? vehicleObj.name : (vehicle.charAt(0).toUpperCase() + vehicle.slice(1));
    const ratePerKm = vehicleObj ? vehicleObj.dropRate : null;

    // Construct FAQ Questions
    const faqQuestions = [
        {
            "@type": "Question",
            "name": `What is the ${vehicleName} cab fare from ${pCity} to ${dCity}?`,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": `The estimated fare for a ${vehicleName} cab from ${pCity} to ${dCity} is ₹${amount.toLocaleString()} for a distance of approximately ${distance} km. This typically includes driver bata and fuel charges.`
            }
        },
        {
            "@type": "Question",
            "name": `How many kilometers is it from ${pCity} to ${dCity}?`,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": `The distance from ${pCity} to ${dCity} is approximately ${distance} km by road.`
            }
        },
        {
            "@type": "Question",
            "name": `Is there a one-way drop service available for ${pCity} to ${dCity}?`,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": `Yes, Sarathi Book offers one-way drop taxi services from ${pCity} to ${dCity} starting at ₹${amount.toLocaleString()}. You only pay for the drop distance.`
            }
        }
    ];

    const schemaGraph = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "TaxiService",
                "name": `Cab Service: ${pCity} to ${dCity} (${vehicleName})`,
                "description": `Professional ${vehicleName} cab service from ${pickup} to ${drop}. Distance: ${distance} km. Best rates for one-way and round trips.`,
                "provider": {
                    "@type": "LocalBusiness",
                    "name": "Sarathi Book",
                    "image": "https://sarathibook.com/icon-192.png",
                    "telephone": "+919000000000", // Ideally replace with actual config if available
                    "priceRange": "₹₹"
                },
                "areaServed": {
                    "@type": "Place",
                    "name": pCity
                },
                "serviceType": tripType === 'roundtrip' ? 'Round Trip Taxi' : 'One Way Drop Taxi',
                "offers": {
                    "@type": "Offer",
                    "price": amount,
                    "priceCurrency": "INR",
                    "availability": "https://schema.org/InStock",
                    "priceValidUntil": new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
                    "url": window.location.href,
                    "priceSpecification": {
                        "@type": "UnitPriceSpecification",
                        "price": ratePerKm || 15,
                        "priceCurrency": "INR",
                        "unitCode": "KMT", // Code for Kilometer
                        "referenceQuantity": {
                            "@type": "QuantitativeValue",
                            "value": "1",
                            "unitCode": "KMT"
                        }
                    }
                }
            },
            {
                "@type": "FAQPage",
                "mainEntity": faqQuestions
            },
            {
                "@type": "BreadcrumbList",
                "itemListElement": [
                    {
                        "@type": "ListItem",
                        "position": 1,
                        "name": "Home",
                        "item": "https://sarathibook.com/"
                    },
                    {
                        "@type": "ListItem",
                        "position": 2,
                        "name": "Cab Calculator",
                        "item": "https://sarathibook.com/calculator"
                    },
                    {
                        "@type": "ListItem",
                        "position": 3,
                        "name": `${pCity} to ${dCity} Fare`,
                        "item": window.location.href
                    }
                ]
            }
        ]
    };

    return schemaGraph;
};
