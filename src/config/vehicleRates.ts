export interface VehicleType {
    id: string;
    name: string;
    popularModels: string;
    dropRate: number;
    roundRate: number;
    seats: number;
    type: 'Hatchback' | 'Sedan' | 'SUV' | 'Van';
    minKm: number;
    batta: number;
    nightCharge: number;
    minLocalPackage?: number;
}

// CHENNAI MARKET RATES 2025
export const VEHICLES: VehicleType[] = [
    { id: 'hatchback', name: 'Hatchback', popularModels: 'Swift, Ritz', dropRate: 14.5, roundRate: 13, seats: 4, type: 'Hatchback', minKm: 250, batta: 300, nightCharge: 200 },
    { id: 'sedan', name: 'Sedan', popularModels: 'Dzire, Etios, Aura', dropRate: 15.5, roundRate: 14, seats: 4, type: 'Sedan', minKm: 250, batta: 300, nightCharge: 200 },
    { id: 'suv', name: 'SUV (7-Seater)', popularModels: 'Ertiga, Marazzo', dropRate: 20, roundRate: 18, seats: 7, type: 'SUV', minKm: 250, batta: 500, nightCharge: 250 },
    { id: 'premium_suv', name: 'Premium SUV', popularModels: 'Innova Crysta', dropRate: 25, roundRate: 22, seats: 7, type: 'SUV', minKm: 300, batta: 600, nightCharge: 300 },
    { id: 'tempo', name: 'Tempo Traveller', popularModels: '12-Seater TT', dropRate: 24, roundRate: 24, seats: 12, type: 'Van', minKm: 250, batta: 800, nightCharge: 400, minLocalPackage: 5500 },
    { id: 'minibus', name: 'Mini Bus (18-Seater)', popularModels: 'Swaraj Mazda', dropRate: 30, roundRate: 30, seats: 18, type: 'Van', minKm: 250, batta: 1000, nightCharge: 500, minLocalPackage: 7500 },
    { id: 'bus', name: 'Large Bus (24-Seater)', popularModels: 'Ashok Leyland', dropRate: 55, roundRate: 55, seats: 24, type: 'Van', minKm: 300, batta: 1500, nightCharge: 700, minLocalPackage: 9500 }
];
