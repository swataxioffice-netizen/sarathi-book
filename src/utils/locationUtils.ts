
export const isHillStationLocation = (location: string): boolean => {
    const loc = (location || '').toLowerCase();
    const hills = [
        'ooty', 'udhagamandalam', 'kodaikanal', 'kodai', 'yercaud', 'munnar',
        'wayanad', 'coorg', 'madikeri', 'chikmagalur', 'valparai', 'kotagiri',
        'conoor', 'coonjur', 'top slip', 'vagamon', 'thekkady', 'idukki'
    ];
    return hills.some(h => loc.includes(h));
};
