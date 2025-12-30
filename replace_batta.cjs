const fs = require('fs');
const path = "d:\\websites\\cab driver\\src\\components\\TripForm.tsx";
let content = fs.readFileSync(path, 'utf8');

const target = `    // Sync Driver Batta when mode/days change (Simple defaults)
    useEffect(() => {
        if (driverBatta === 0) { // Only set if not manually touched
             if (mode === 'outstation') {
                 setDriverBatta(days * 600); // Rough default
             } else if (mode === 'drop') {
                 setDriverBatta(0); // Let calc handle it, or default to 0
             }
        }
    }, [mode, days]);`;

const replacement = `    // Sync Driver Batta when mode/days change (Auto-calc based on Vehicle)
    useEffect(() => {
        if (mode === 'outstation') {
             // Find active vehicle
             const veh = (settings.vehicles || []).find(v => v.id === selectedVehicleId) || currentVehicle;
             const model = (veh?.model || '').toLowerCase();
             
             let batta = 500; 
             if (model.includes('innova') || model.includes('suv') || model.includes('ertiga') || model.includes('xylo') || model.includes('tavera') || model.includes('marazzo') || model.includes('scorpio')) {
                 batta = 600;
             } else if (model.includes('tempo') || model.includes('traveller')) {
                 batta = 800;
             } else if (model.includes('hatchback') || model.includes('indica') || model.includes('wagon') || model.includes('celerio')) {
                 batta = 400; 
             }
             
             setDriverBatta(days * batta);
        } else if (mode === 'drop') {
             setDriverBatta(0); 
        }
    }, [mode, days, selectedVehicleId, currentVehicle, settings.vehicles]);`;

// Normalize line endings to avoid CRLF mismatch
const normalize = (str) => str.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
const normalizedContent = normalize(content);
const normalizedTarget = normalize(target);

if (normalizedContent.includes(normalizedTarget)) {
    // Replace in original content by finding index? 
    // Or just use split/join on normalized? 
    // Best to just replace in content if matches.
    // But strict string replace might fail if endings differ.
    // I'll try simple string replace first.
    if (content.indexOf(target) !== -1) {
        content = content.replace(target, replacement);
        fs.writeFileSync(path, content, 'utf8');
        console.log('Successfully replaced Batta logic (Exact Match).');
    } else {
        // Fallback: split content, replace lines.
        // This is complex. 
        // Let's try to find matches with looser whitespace?
        console.log('Exact match failed. Trying normalized match...');
        // Normalized match replacement is hard because we need to write back with correct endings.
        // I'll assume exact match SHOULD work if I copied correctly.
        console.log('Target snippet check:');
        console.log(content.slice(content.indexOf('// Sync Driver'), content.indexOf('// Sync Driver') + 300));
    }
} else {
    console.log('Target NOT found in normalized content.');
    const idx = normalizedContent.indexOf('// Sync Driver');
    if (idx !== -1) {
        console.log('Found start comment. Snippet:');
        console.log(normalizedContent.substr(idx, 300));
    } else {
        console.log('Could not find start comment.');
    }
}
