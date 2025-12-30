const fs = require('fs');
const path = "d:\\websites\\cab driver\\src\\components\\TripForm.tsx";
let content = fs.readFileSync(path, 'utf8');

// The exact string to find, carefully constructed from view_file output
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
             } else if (model.includes('hatchback') || model.includes('indica') || model.includes('wagon') || model.includes('celerio') || model.includes('swift') || model.includes('etios')) {
                 batta = 400; 
             }
             
             // Update batta whenever vehicle changes
             setDriverBatta(days * batta);
        } else if (mode === 'drop') {
             setDriverBatta(0); 
        }
    }, [mode, days, selectedVehicleId, currentVehicle, settings.vehicles]);`;

if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync(path, content, 'utf8');
    console.log('Successfully replaced Batta logic.');
} else {
    // Try to debug by printing a snippet
    console.log('Target not found. Snippet from file:');
    const lines = content.split('\n');
    console.log(lines.slice(150, 162).join('\n'));
}
