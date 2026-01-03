export const TARIFFS = {
    vehicles: {
        hatchback: {
            name: 'Hatchback',
            is_heavy_vehicle: false,
            min_km_per_day: 250,
            round_trip_rate: 13,
            one_way_rate: 14.5,
            driver_bata: 300,
            local_8hr_pkg: 2000,
            extra_hr_rate: 200,
            min_drop_km: 130
        },
        sedan: {
            name: 'Sedan',
            is_heavy_vehicle: false,
            min_km_per_day: 250,
            round_trip_rate: 14,
            one_way_rate: 15.5,
            driver_bata: 300,
            local_8hr_pkg: 2200,
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
            local_8hr_pkg: 3200,
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
            local_8hr_pkg: 4500,
            extra_hr_rate: 450,
            min_drop_km: 130
        },
        tempo: {
            name: 'Tempo Traveller (12s)',
            is_heavy_vehicle: true, // Forces Round Trip Pricing
            min_km_per_day: 250,
            round_trip_rate: 24,
            one_way_rate: 24,
            driver_bata: 800,
            local_8hr_pkg: 5500,
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
            local_8hr_pkg: 7500,
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
            local_8hr_pkg: 9500,
            extra_hr_rate: 1200,
            min_drop_km: 300
        }
    }
};
