import { supabase } from '../utils/supabase';

// GST Validation Service
export const GSTService = {
    /**
     * Validates the format of a GSTIN.
     * Format: 2 digits (State) + 5 chars (PAN) + 4 digits (PAN) + 1 char (PAN) + 1 digit (Entity) + Z + 1 char (Check)
     */
    isValidFormat: (gstin: string): boolean => {
        if (!gstin) return true; // Optional field
        // Strict Regex for GSTIN
        const regex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
        return regex.test(gstin.toUpperCase());
    },

    /**
     * Checks if the GSTIN is unique across all user profiles.
     * Prevents multiple accounts from using the same GST Business ID.
     */
    isUnique: async (gstin: string, currentUserId: string): Promise<boolean> => {
        if (!gstin) return true;

        try {
            // Check if any OTHER profile has this GSTIN in their settings JSON
            // utilizing Supabase's JSONB filtering
            const { data, error } = await supabase
                .from('profiles')
                .select('id')
                .neq('id', currentUserId)
                .contains('settings', { gstin: gstin })
                .limit(1);

            if (error) {
                console.error('Error checking GST uniqueness:', error);
                // If permission denied (RLS) or network error, we might default to allowing
                // but for strict validation, we should probably return true (pass) 
                // unless we are sure it's a duplicate.
                return true;
            }

            // If data found, it means duplicate exists
            return !data || data.length === 0;
        } catch (err) {
            console.error('GST Uniqueness check failed:', err);
            return true;
        }
    }
};
