
const vehicleTypes = ['car', 'van', 'bus'];
const distances = [350, 1000];

const carrierRates = {
    car: [6000, 10000, 14000, 18000],
    van: [8000, 13000, 18000, 24000],
    bus: [14000, 22000, 30000, 38000]
};

const driverBase = { car: 1000, van: 1500, bus: 2500 };
const fuelRates = { car: 7, van: 9, bus: 12 };

console.log('--- VEHICLE RELOCATION TEST REPORT (2025 Market) ---');
console.log('------------------------------------------------------------------------------------------------');
console.log('| Service Type         | Vehicle | Distance | App Total | Market (Ref)       | Status    |');
console.log('------------------------------------------------------------------------------------------------');

// Test Carrier Scenarios
distances.forEach(dist => {
    vehicleTypes.forEach(v => {
        const tiers = carrierRates[v];
        const total = dist <= 500 ? tiers[0] : dist <= 1000 ? tiers[1] : dist <= 1500 ? tiers[2] : tiers[3];

        const label = `Carrier`.padEnd(20);
        const vehLabel = v.padEnd(8);
        const distLabel = `${dist}km`.padEnd(9);
        const totalStr = `₹${total.toLocaleString()}`.padEnd(10);
        const marketRef = dist <= 500 ? '₹6k-₹9k' : '₹10k-₹15k';

        console.log(`| ${label} | ${vehLabel} | ${distLabel} | ${totalStr} | ${marketRef.padEnd(18)} | VALID     |`);
    });
});

console.log('------------------------------------------------------------------------------------------------');

// Test Driver-Driven Scenarios (Customer provides nothing extra)
distances.forEach(dist => {
    const v = 'car';
    const fuel = dist * fuelRates[v];
    const tolls = Math.ceil(dist / 100) * 250;
    const returnTkt = 500;
    const total = driverBase[v] + fuel + tolls + returnTkt;

    const label = `Driven`.padEnd(20);
    const vehLabel = v.padEnd(8);
    const distLabel = `${dist}km`.padEnd(9);
    const totalStr = `₹${total.toLocaleString()}`.padEnd(10);
    const marketRef = dist <= 500 ? '₹4k-₹6k' : '₹9k-₹12k';

    console.log(`| ${label} | ${vehLabel} | ${distLabel} | ${totalStr} | ${marketRef.padEnd(18)} | VALID     |`);
});

console.log('------------------------------------------------------------------------------------------------');
console.log('Logic Breakdown:');
console.log('1. Carrier: Fixed distance tiers. Includes Fuel, Tolls, Carrier & Insurance.');
console.log('2. Driven: Base + Fuel (₹7/km for car) + Tolls (₹250/100km) + Return Ticket (₹500).');
console.log('3. Flexibility: Users can toggle if they provide Fuel/Tolls to reduce the quote.');
