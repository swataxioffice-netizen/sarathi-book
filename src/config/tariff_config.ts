export const TARIFFS = {
    vehicles: {
        hatchback: {
            name: 'Hatchback',
            is_heavy_vehicle: false,
            min_km_per_day: 250,
            round_trip_rate: 13,
            one_way_rate: 15,
            driver_bata: 300,
            local_2hr_pkg: 700,
            local_4hr_pkg: 1100,
            local_8hr_pkg: 2000,
            local_12hr_pkg: 2800,
            extra_hr_rate: 200,
            min_drop_km: 130
        },
        sedan: {
            name: 'Sedan',
            is_heavy_vehicle: false,
            min_km_per_day: 250,
            round_trip_rate: 14,
            one_way_rate: 16,
            driver_bata: 300,
            local_2hr_pkg: 850,
            local_4hr_pkg: 1350,
            local_8hr_pkg: 2200,
            local_12hr_pkg: 3050,
            extra_hr_rate: 250,
            min_drop_km: 130
        },
        suv: {
            name: 'SUV (Innova/Ertiga)',
            is_heavy_vehicle: false,
            min_km_per_day: 250,
            round_trip_rate: 18,
            one_way_rate: 20,
            driver_bata: 500,
            local_2hr_pkg: 1200,
            local_4hr_pkg: 1900,
            local_8hr_pkg: 3200,
            local_12hr_pkg: 4200,
            extra_hr_rate: 350,
            min_drop_km: 130
        },
        premium_suv: {
            name: 'Innova Crysta',
            is_heavy_vehicle: false,
            min_km_per_day: 300,
            round_trip_rate: 22,
            one_way_rate: 25,
            driver_bata: 600,
            local_2hr_pkg: 1800,
            local_4hr_pkg: 2800,
            local_8hr_pkg: 4500,
            local_12hr_pkg: 6000,
            extra_hr_rate: 450,
            min_drop_km: 130
        },
        tata_ace: {
            name: 'Tata Ace (Loading)',
            is_heavy_vehicle: false,
            min_km_per_day: 250,
            round_trip_rate: 15,
            one_way_rate: 18,
            driver_bata: 400,
            local_2hr_pkg: 1000,
            local_4hr_pkg: 1500,
            local_8hr_pkg: 2500,
            local_12hr_pkg: 3500,
            extra_hr_rate: 300,
            min_drop_km: 130
        },
        bada_dost: {
            name: 'Bada Dost (Loading)',
            is_heavy_vehicle: false,
            min_km_per_day: 250,
            round_trip_rate: 17,
            one_way_rate: 20,
            driver_bata: 500,
            local_2hr_pkg: 1200,
            local_4hr_pkg: 1800,
            local_8hr_pkg: 3000,
            local_12hr_pkg: 4200,
            extra_hr_rate: 350,
            min_drop_km: 130
        },
        bolero_pickup: {
            name: 'Bolero Pickup (Loading)',
            is_heavy_vehicle: false,
            min_km_per_day: 250,
            round_trip_rate: 19,
            one_way_rate: 22,
            driver_bata: 600,
            local_2hr_pkg: 1400,
            local_4hr_pkg: 2000,
            local_8hr_pkg: 3500,
            local_12hr_pkg: 5000,
            extra_hr_rate: 400,
            min_drop_km: 130
        },
        tempo: {
            name: 'Tempo Traveller (12s)',
            is_heavy_vehicle: true, // Forces Round Trip Pricing
            min_km_per_day: 250,
            round_trip_rate: 24,
            one_way_rate: 24,
            driver_bata: 800,
            local_2hr_pkg: 2500,
            local_4hr_pkg: 3500,
            local_8hr_pkg: 5500,
            local_12hr_pkg: 7000,
            extra_hr_rate: 600,
            min_drop_km: 250
        },
        minibus: {
            name: 'Mini Bus (18s)',
            is_heavy_vehicle: true,
            min_km_per_day: 250,
            round_trip_rate: 30,
            one_way_rate: 30,
            driver_bata: 1000,
            local_2hr_pkg: 3500,
            local_4hr_pkg: 4500,
            local_8hr_pkg: 7500,
            local_12hr_pkg: 9500,
            extra_hr_rate: 800,
            min_drop_km: 250
        },
        bus: {
            name: 'Bus (24s+)',
            is_heavy_vehicle: true,
            min_km_per_day: 300,
            round_trip_rate: 55,
            one_way_rate: 55,
            driver_bata: 1500,
            local_2hr_pkg: 5000,
            local_4hr_pkg: 6500,
            local_8hr_pkg: 9500,
            local_12hr_pkg: 12500,
            extra_hr_rate: 1200,
            min_drop_km: 300
        }
    }
};

export const TRIP_LIMITS = {
    max_km_per_day: 600 // Maximum KM a driver can reasonably drive in a day (Trip Duration Calc)
};
