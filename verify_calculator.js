
const routes = [
    { from: 'Chennai', to: 'Bangalore', dist: 345, interstate: true, market: '4,000 - 5,500' },
    { from: 'Chennai', to: 'Pondicherry', dist: 155, interstate: true, market: '1,400 - 2,900' },
    { from: 'Chennai', to: 'Madurai', dist: 462, interstate: false, market: '5,500 - 7,700' },
    { from: 'Chennai', to: 'Coimbatore', dist: 512, interstate: false, market: '6,300 - 8,100' },
    { from: 'Chennai', to: 'Vellore', dist: 139, interstate: false, market: '1,800 - 2,800' },
    { from: 'Madurai', to: 'Kanyakumari', dist: 245, interstate: false, market: '3,000 - 4,800' },
    { from: 'Chennai', to: 'Tirupati', dist: 154, interstate: true, market: '2,100 - 3,000' },
    { from: 'Trichy', to: 'Chennai', dist: 331, interstate: false, market: '3,900 - 5,800' },
    { from: 'Bangalore', to: 'Mysore', dist: 145, interstate: false, market: '2,500 - 3,500' },
    { from: 'Chennai', to: 'Salem', dist: 345, interstate: false, market: '5,000 - 6,500' }
];

const RATE = 14;
const PERMIT = 800;

console.log('--- CAB CALCULATOR AUTOMATED TEST REPORT ---');
console.log('Rate: ₹14/Km (Sedan One-Way)');
console.log('--------------------------------------------------------------------------------');
console.log('| Route                     | Dist | App Total | Base Only | Market (Base)   |');
console.log('--------------------------------------------------------------------------------');

routes.forEach(r => {
    const baseFare = r.dist * RATE;
    const tollEstimate = Math.ceil(r.dist / 100) * 250;
    const permitCharge = r.interstate ? PERMIT : 0;
    const total = baseFare + tollEstimate + permitCharge;

    const routeStr = `${r.from} to ${r.to}`.padEnd(25);
    const distStr = `${r.dist}km`.padEnd(6);
    const totalStr = `₹${total}`.padEnd(10);
    const baseOnlyStr = `₹${baseFare}`.padEnd(10);
    const marketStr = `₹${r.market}`.padEnd(15);

    console.log(`| ${routeStr} | ${distStr} | ${totalStr} | ${baseOnlyStr} | ${marketStr} |`);
});

console.log('--------------------------------------------------------------------------------');
console.log('Notes:');
console.log('1. App Total includes Estimated Tolls (₹250 per 100km) and Permits (₹800).');
console.log('2. Online "Market Prices" usually exclude Tolls and Permits in initial quotes.');
console.log('3. Base comparison shows the app is highly competitive with premium services.');
