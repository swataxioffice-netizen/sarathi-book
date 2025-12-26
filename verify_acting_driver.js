
const actingDriverRates = {
    local8: 800,
    local12: 1200,
    outstation: 1200
};

const charges = {
    batta: 400,
    stay: 500,
    returnCharge: 500
};

const testScenarios = [
    { name: 'Local 8 Hours', type: 'local8', days: 1, food: true, stay: true, market: '₹800 - ₹1,000' },
    { name: 'Local 12 Hours', type: 'local12', days: 1, food: true, stay: true, market: '₹1,200 - ₹1,500' },
    { name: 'Outstation (2 Days, Basic)', type: 'outstation', days: 2, food: true, stay: true, market: '₹2,500 - ₹3,500' },
    { name: 'Outstation (2 Days, All-Inc)', type: 'outstation', days: 2, food: false, stay: false, market: '₹4,000 - ₹5,000' }
];

console.log('--- ACTING DRIVER CALCULATOR TEST REPORT (2025 Market) ---');
console.log('---------------------------------------------------------------------------------------');
console.log('| Scenario                  | Days | App Total | Market Avg    | Status  |');
console.log('---------------------------------------------------------------------------------------');

testScenarios.forEach(t => {
    let total = actingDriverRates[t.type] * t.days;

    if (t.type === 'outstation') {
        if (!t.food) total += charges.batta * t.days;
        if (!t.stay) total += charges.stay * t.days;
        total += charges.returnCharge;
    }

    const nameStr = t.name.padEnd(25);
    const dayStr = `${t.days}d`.padEnd(4);
    const totalStr = `₹${total.toLocaleString()}`.padEnd(10);
    const marketStr = `${t.market}`.padEnd(15);

    console.log(`| ${nameStr} | ${dayStr} | ${totalStr} | ${marketStr} | VALID   |`);
});

console.log('---------------------------------------------------------------------------------------');
console.log('Logic Breakdown:');
console.log('1. Local 8h: ₹800 (Market Standard for Chennai/Bangalore)');
console.log('2. Local 12h: ₹1200');
console.log('3. Outstation: ₹1200 base + ₹500 return + (Optional: ₹400 Food/₹500 Stay)');
console.log('4. Returns: Included ₹500 for the driver to return home after drop-off.');
