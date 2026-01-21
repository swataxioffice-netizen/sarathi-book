/**
 * Converts a string to Title Case.
 * Example: "CHENNAI AIRPORT" -> "Chennai Airport"
 * Example: "123 main st, city" -> "123 Main St, City"
 */
export const toTitleCase = (str: string): string => {
    if (!str) return str;

    // Check if it's already mixed case (not all caps and not all lower)
    // If it's mixed case, we might want to preserve it, but usually Title Case is safer for professional docs.
    // However, if the user specifically typed "McDonald's", we don't want "Mcdonald's".
    // But the user specifically asked to convert "all caps to Capitalization".

    // A better approach: If it's ALL CAPS, convert it. If it has any lowercase, maybe it's already intentionally formatted?
    // Let's see. If I have "Chennai Airport", it has lowercase. If I have "CHENNAI AIRPORT", it doesn't.

    const isAllCaps = str === str.toUpperCase() && str !== str.toLowerCase();
    const isAllLower = str === str.toLowerCase() && str !== str.toUpperCase();

    if (isAllCaps || isAllLower) {
        return str
            .toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    return str;
};

/**
 * Specifically for addresses where we might want to capitalize each part after a comma too
 */
export const formatAddress = (addr: string): string => {
    if (!addr) return addr;

    // First apply title case to everything if it's all caps/lower
    const formatted = toTitleCase(addr);

    // Ensure words after commas are also capitalized if they aren't
    return formatted.split(',').map(part => {
        const trimmed = part.trim();
        if (!trimmed) return part;
        return (part.startsWith(' ') ? ' ' : '') + toTitleCase(trimmed);
    }).join(',');
};
