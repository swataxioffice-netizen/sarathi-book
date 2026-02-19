-- Enable Admin Impersonation for specific email(s)

-- Helper function to check if current user is an admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (auth.jwt() ->> 'email') IN ('swa.taxioffice@gmail.com', 'customercare@swataxioffice.com');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant Admins access to the 'trips' table
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'trips') THEN
        DROP POLICY IF EXISTS "Admins can manage all trips" ON trips;
        CREATE POLICY "Admins can manage all trips"
        ON trips
        FOR ALL
        USING (is_admin())
        WITH CHECK (is_admin());
    END IF;
END $$;

-- Grant Admins access to the 'quotations' table
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'quotations') THEN
        DROP POLICY IF EXISTS "Admins can manage all quotations" ON quotations;
        CREATE POLICY "Admins can manage all quotations"
        ON quotations
        FOR ALL
        USING (is_admin())
        WITH CHECK (is_admin());
    END IF;
END $$;

-- Grant Admins access to the 'profiles' table
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
        DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
        CREATE POLICY "Admins can manage all profiles"
        ON profiles
        FOR ALL
        USING (is_admin())
        WITH CHECK (is_admin());
    END IF;
END $$;

-- Grant Admins access to the 'user_documents' table
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_documents') THEN
        DROP POLICY IF EXISTS "Admins can manage all documents" ON user_documents;
        CREATE POLICY "Admins can manage all documents"
        ON user_documents
        FOR ALL
        USING (is_admin())
        WITH CHECK (is_admin());
    END IF;
END $$;

-- Grant Admins access to the 'notifications' table
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'notifications') THEN
        DROP POLICY IF EXISTS "Admins can manage all notifications" ON notifications;
        CREATE POLICY "Admins can manage all notifications"
        ON notifications
        FOR ALL
        USING (is_admin())
        WITH CHECK (is_admin());
    END IF;
END $$;

-- Grant Admins access to the 'expenses' table check existence first
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'expenses') THEN
        DROP POLICY IF EXISTS "Admins can manage all expenses" ON expenses;
        CREATE POLICY "Admins can manage all expenses"
        ON expenses
        FOR ALL
        USING (is_admin())
        WITH CHECK (is_admin());
    END IF;
END $$;

-- Grant Admins access to the 'admin_analytics' table
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'admin_analytics') THEN
        DROP POLICY IF EXISTS "Admins can manage all analytics" ON admin_analytics;
        CREATE POLICY "Admins can manage all analytics"
        ON admin_analytics
        FOR ALL
        USING (is_admin())
        WITH CHECK (is_admin());
    END IF;
END $$;
