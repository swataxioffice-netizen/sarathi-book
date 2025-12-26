
const actingDriverTests = [
    { type: 'local8', days: 1, food: true, stay: true, market: '800 - 1,200' },
    { type: 'local12', days: 1, food: true, stay: true, market: '1,200 - 1,500' },
    { type: 'outstation', days: 2, food: false, stay: false, market: '3,000 - 4,500' }
];

const relocationTests = [
    { service: 'carrier', vehicle: 'car', dist: 350, market: '6,000 - 9,000' },
    { service: 'carrier', vehicle: 'car', dist: 1000, market: '10,000 - 15,000' },
    { service: 'driver', vehicle: 'car', dist: 350, market: '4,500 - 6,500' }
];

// Current App Logic Constants
const ACTING_RATES = { local8: 800, local12: 1200, outstation: 1000 };
const ACTING_BATA = 400;
const ACTING_STAY = 500;
const ACTING_RETURN = 500;

const RELOCATION_CARRIER = {
    car: [5000, 8000, 12000, 15000],
    van: [7000, 11000, 16000, 20000],
    bus: [12000, 18000, 25000, 32000]
};

const FUEL_RATES = { car: 7, van: 9, bus: 12 };
const DRIVER_BASE = { car: 1000, van: 1500, bus: 2500 };

console.log('--- ACTING DRIVER & RELOCATION TEST REPORT ---');
console.log('--------------------------------------------------------------------------------');
console.log('| Service Type              | Params | App Total | Market (2025) | Status      |');
console.log('--------------------------------------------------------------------------------');

actingDriverTests.forEach(t => {
    let total = ACTING_RATES[t.type] * t.days;
    if (t.type === 'outstation') {
        if (!t.food) total += ACTING_BATA * t.days;
        if (!t.stay) total += ACTING_STAY * t.days;
        total += ACTING_RETURN;
    }
    const label = `Acting Driver (${t.type})`.padEnd(25);
    const param = `${t.days}d`.padEnd(6);
    console.log(`| ${label} | ${param} | ₹${total.toLocaleString().padEnd(8)} | ₹${t.market.padEnd(12)} | ${total >= parseInt(t.market) ? 'OK' : 'LOW'} |`);
});

relocationTests.forEach(t => {
    let total = 0;
    if (t.service === 'carrier') {
        const tiers = RELOCATION_CARRIER[t.vehicle];
        total = t.dist <= 500 ? tiers[0] : t.dist <= 1000 ? tiers[1] : t.dist <= 1500 ? tiers[2] : tiers[3];
    } else {
        total = DRIVER_BASE[t.vehicle] + (t.dist * FUEL_RATES[t.vehicle]) + (Math.ceil(t.dist / 100) * 250) + 500;
    }
    const label = `${t.service} (${t.vehicle})`.padEnd(25);
    const param = `${t.dist}km`.padEnd(6);
    console.log(`| ${label} | ${param} | ₹${total.toLocaleString().padEnd(8)} | ₹${t.market.padEnd(12)} | ${total >= parseInt(t.market) ? 'OK' : 'LOW'} |`);
});
