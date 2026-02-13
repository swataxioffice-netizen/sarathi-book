-- Enable Realtime for necessary tables
-- This allows simultaneous synchronization between devices

-- 1. Check if the publication exists, if not create it
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
END $$;

-- 2. Add tables to the publication
-- We use ALTER PUBLICATION ... ADD TABLE ... 
-- If the table is already in the publication, this might error, so we use a safe approach
-- Note: In recent Supabase versions, you can just do:
-- ALTER PUBLICATION supabase_realtime ADD TABLE trips, quotations, profiles, expenses;

-- Safer version that checks if table is already in publication
DO $$
DECLARE
    tbl_name text;
    tables_to_add text[] := ARRAY['trips', 'quotations', 'profiles', 'expenses'];
BEGIN
    FOREACH tbl_name IN ARRAY tables_to_add LOOP
        IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = tbl_name AND schemaname = 'public') THEN
            IF NOT EXISTS (
                SELECT 1 FROM pg_publication_tables 
                WHERE pubname = 'supabase_realtime' 
                AND schemaname = 'public' 
                AND tablename = tbl_name
            ) THEN
                EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', tbl_name);
            END IF;
        END IF;
    END LOOP;
END $$;
