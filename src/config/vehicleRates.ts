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
    { id: 'hatchback', name: 'Hatchback', popularModels: 'Indica, Swift', dropRate: 15, roundRate: 13, seats: 4, type: 'Hatchback', minKm: 250, batta: 300, nightCharge: 200 },
    { id: 'sedan', name: 'Sedan', popularModels: 'Dzire, Etios, Aura', dropRate: 16, roundRate: 14, seats: 4, type: 'Sedan', minKm: 250, batta: 300, nightCharge: 200 },
    { id: 'suv', name: 'SUV (7-Seater)', popularModels: 'Ertiga, Xylo', dropRate: 21, roundRate: 18, seats: 7, type: 'SUV', minKm: 300, batta: 400, nightCharge: 250 },
    { id: 'premium_suv', name: 'Premium SUV', popularModels: 'Innova Crysta', dropRate: 26, roundRate: 22, seats: 7, type: 'SUV', minKm: 300, batta: 600, nightCharge: 300 },
    { id: 'tempo', name: 'Tempo Traveller', popularModels: 'Force Traveller', dropRate: 35, roundRate: 25, seats: 12, type: 'Van', minKm: 300, batta: 700, nightCharge: 400, minLocalPackage: 3500 },
    { id: 'minibus', name: 'Mini Bus (18-Seater)', popularModels: 'Swaraj Mazda', dropRate: 45, roundRate: 35, seats: 18, type: 'Van', minKm: 300, batta: 900, nightCharge: 500, minLocalPackage: 4500 },
    { id: 'bus', name: 'Large Bus (24-Seater)', popularModels: 'Ashok Leyland', dropRate: 55, roundRate: 50, seats: 24, type: 'Van', minKm: 300, batta: 1200, nightCharge: 700, minLocalPackage: 5500 }
];
