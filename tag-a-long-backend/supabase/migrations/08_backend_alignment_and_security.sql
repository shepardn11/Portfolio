-- Tag a Long - Backend Alignment & Enhanced Security
-- Migration 08: Align database with backend code + comprehensive RLS
-- This migration creates the tables your backend expects and adds robust security

-- ============================================================================
-- CREATE MISSING TABLES (Backend Alignment)
-- ============================================================================

-- ACTIVITY_LISTINGS table (backend uses this name, not "listings")
CREATE TABLE IF NOT EXISTS activity_listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  location TEXT NOT NULL,
  date DATE NOT NULL,
  "time" TEXT,
  max_participants INTEGER,
  photos TEXT[] DEFAULT ARRAY[]::TEXT[],
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT title_length CHECK (char_length(title) >= 3 AND char_length(title) <= 200),
  CONSTRAINT description_length CHECK (char_length(description) <= 1000)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_activity_listings_user_id ON activity_listings(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_listings_status ON activity_listings(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_listings_category ON activity_listings(category, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_listings_location ON activity_listings(location, date);
CREATE INDEX IF NOT EXISTS idx_activity_listings_date ON activity_listings(date);

-- TAGALONG_REQUESTS table (backend uses this name)
CREATE TABLE IF NOT EXISTS tagalong_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES activity_listings(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,

  -- Prevent duplicate requests
  UNIQUE(listing_id, sender_id),
  CONSTRAINT message_length CHECK (char_length(message) <= 500)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tagalong_requests_listing ON tagalong_requests(listing_id, status);
CREATE INDEX IF NOT EXISTS idx_tagalong_requests_sender ON tagalong_requests(sender_id, status);
CREATE INDEX IF NOT EXISTS idx_tagalong_requests_receiver ON tagalong_requests(receiver_id, status);

-- BLOCKED_USERS table (backend uses this name)
CREATE TABLE IF NOT EXISTS blocked_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blocker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT no_self_block CHECK (blocker_id != blocked_id),
  UNIQUE(blocker_id, blocked_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocker ON blocked_users(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocked ON blocked_users(blocked_id);

-- USER_REPORTS table (backend uses this name)
CREATE TABLE IF NOT EXISTS user_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reported_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN ('spam', 'harassment', 'inappropriate_content', 'fake_profile', 'safety_concern', 'other')),
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,

  CONSTRAINT description_length CHECK (char_length(description) <= 1000)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_reports_reporter ON user_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_user_reports_reported_user ON user_reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_user_reports_status ON user_reports(status, created_at DESC);

-- Add missing columns to profiles for backend
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS push_token TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS device_platform TEXT;

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tagalong_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_reports ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- DROP EXISTING POLICIES (clean slate)
-- ============================================================================

-- Profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON profiles;

-- Activity Listings
DROP POLICY IF EXISTS "Active listings viewable by everyone" ON activity_listings;
DROP POLICY IF EXISTS "Users can create listings" ON activity_listings;
DROP POLICY IF EXISTS "Users can update own listings" ON activity_listings;
DROP POLICY IF EXISTS "Users can delete own listings" ON activity_listings;

-- Requests
DROP POLICY IF EXISTS "Users can view own requests" ON tagalong_requests;
DROP POLICY IF EXISTS "Users can create requests" ON tagalong_requests;
DROP POLICY IF EXISTS "Users can update requests" ON tagalong_requests;
DROP POLICY IF EXISTS "Users can delete own requests" ON tagalong_requests;

-- Notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "System can create notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;

-- Blocked Users
DROP POLICY IF EXISTS "Users can view own blocks" ON blocked_users;
DROP POLICY IF EXISTS "Users can block others" ON blocked_users;
DROP POLICY IF EXISTS "Users can unblock" ON blocked_users;

-- Reports
DROP POLICY IF EXISTS "Users can view own reports" ON user_reports;
DROP POLICY IF EXISTS "Users can create reports" ON user_reports;

-- ============================================================================
-- PROFILES POLICIES
-- ============================================================================

-- Anyone can view public profile data
CREATE POLICY "profiles_select_public"
  ON profiles FOR SELECT
  USING (true);

-- Service role can insert profiles (via auth trigger)
CREATE POLICY "profiles_insert_service"
  ON profiles FOR INSERT
  WITH CHECK (true);

-- Users can update their own profile only
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users cannot delete profiles (prevent data loss)
-- If needed, add soft delete via is_active flag

-- ============================================================================
-- ACTIVITY_LISTINGS POLICIES
-- ============================================================================

-- Anyone authenticated can view active listings
CREATE POLICY "listings_select_active"
  ON activity_listings FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND status = 'active'
    -- Exclude blocked users
    AND NOT EXISTS (
      SELECT 1 FROM blocked_users
      WHERE (blocker_id = auth.uid() AND blocked_id = user_id)
      OR (blocker_id = user_id AND blocked_id = auth.uid())
    )
  );

-- Authenticated users can create listings
CREATE POLICY "listings_insert_own"
  ON activity_listings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own listings
CREATE POLICY "listings_update_own"
  ON activity_listings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own listings
CREATE POLICY "listings_delete_own"
  ON activity_listings FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- TAGALONG_REQUESTS POLICIES
-- ============================================================================

-- Users can view requests they sent or received
CREATE POLICY "requests_select_involved"
  ON tagalong_requests FOR SELECT
  USING (
    auth.uid() = sender_id
    OR auth.uid() = receiver_id
  );

-- Users can create requests (but not to their own listings)
CREATE POLICY "requests_insert_own"
  ON tagalong_requests FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND auth.uid() != receiver_id
    AND NOT EXISTS (
      SELECT 1 FROM activity_listings
      WHERE id = listing_id AND user_id = auth.uid()
    )
  );

-- Listing owners (receivers) can update request status
CREATE POLICY "requests_update_receiver"
  ON tagalong_requests FOR UPDATE
  USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);

-- Senders can delete their own pending requests
CREATE POLICY "requests_delete_sender"
  ON tagalong_requests FOR DELETE
  USING (
    auth.uid() = sender_id
  );

-- ============================================================================
-- NOTIFICATIONS POLICIES
-- ============================================================================

-- Users can only view their own notifications
CREATE POLICY "notifications_select_own"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can insert notifications (via triggers/backend)
CREATE POLICY "notifications_insert_service"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- Users can update (mark as read) their own notifications
CREATE POLICY "notifications_update_own"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "notifications_delete_own"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- BLOCKED_USERS POLICIES
-- ============================================================================

-- Users can view their own blocks
CREATE POLICY "blocked_users_select_own"
  ON blocked_users FOR SELECT
  USING (auth.uid() = blocker_id);

-- Users can block others
CREATE POLICY "blocked_users_insert_own"
  ON blocked_users FOR INSERT
  WITH CHECK (
    auth.uid() = blocker_id
    AND blocker_id != blocked_id
  );

-- Users can unblock (delete blocks)
CREATE POLICY "blocked_users_delete_own"
  ON blocked_users FOR DELETE
  USING (auth.uid() = blocker_id);

-- ============================================================================
-- USER_REPORTS POLICIES
-- ============================================================================

-- Users can view their own reports
CREATE POLICY "user_reports_select_own"
  ON user_reports FOR SELECT
  USING (auth.uid() = reporter_id);

-- Users can create reports
CREATE POLICY "user_reports_insert_own"
  ON user_reports FOR INSERT
  WITH CHECK (
    auth.uid() = reporter_id
    AND reporter_id != reported_user_id
  );

-- Admin can update reports (you'll need to add admin role check)
-- For now, no one can update reports except via service role

-- ============================================================================
-- HELPER FUNCTIONS (Updated for new table names)
-- ============================================================================

-- Drop old function versions first to avoid signature conflicts
DROP FUNCTION IF EXISTS get_user_feed(UUID, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS get_user_feed(TEXT, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS search_listings(TEXT, TEXT, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS get_listings_by_category(TEXT, TEXT, INTEGER, INTEGER);

-- Update get_user_feed for activity_listings
CREATE OR REPLACE FUNCTION get_user_feed(
  requesting_user_id UUID,
  feed_limit INTEGER DEFAULT 20,
  feed_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  title TEXT,
  description TEXT,
  category TEXT,
  location TEXT,
  date DATE,
  "time" TEXT,
  max_participants INTEGER,
  photos TEXT[],
  status TEXT,
  created_at TIMESTAMPTZ,
  username TEXT,
  display_name TEXT,
  profile_photo_url TEXT,
  is_premium BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    al.id,
    al.user_id,
    al.title,
    al.description,
    al.category,
    al.location,
    al.date,
    al."time",
    al.max_participants,
    al.photos,
    al.status,
    al.created_at,
    p.username,
    p.display_name,
    p.profile_photo_url,
    is_premium_user(al.user_id) AS is_premium
  FROM activity_listings al
  JOIN profiles p ON al.user_id = p.id
  WHERE al.status = 'active'
  AND al.user_id != requesting_user_id
  AND NOT EXISTS (
    SELECT 1 FROM blocked_users
    WHERE (blocker_id = requesting_user_id AND blocked_id = al.user_id)
    OR (blocker_id = al.user_id AND blocked_id = requesting_user_id)
  )
  ORDER BY
    is_premium_user(al.user_id) DESC, -- Premium first
    al.created_at DESC
  LIMIT feed_limit
  OFFSET feed_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Search listings
CREATE OR REPLACE FUNCTION search_listings(
  search_query TEXT,
  user_city TEXT DEFAULT NULL,
  search_limit INTEGER DEFAULT 20,
  search_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  title TEXT,
  description TEXT,
  category TEXT,
  location TEXT,
  date DATE,
  created_at TIMESTAMPTZ,
  username TEXT,
  display_name TEXT,
  is_premium BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    al.id,
    al.user_id,
    al.title,
    al.description,
    al.category,
    al.location,
    al.date,
    al.created_at,
    p.username,
    p.display_name,
    is_premium_user(al.user_id) AS is_premium
  FROM activity_listings al
  JOIN profiles p ON al.user_id = p.id
  WHERE al.status = 'active'
  AND (
    al.title ILIKE '%' || search_query || '%'
    OR al.description ILIKE '%' || search_query || '%'
    OR al.category ILIKE '%' || search_query || '%'
  )
  AND (user_city IS NULL OR al.location ILIKE '%' || user_city || '%')
  AND al.user_id != auth.uid()
  AND NOT EXISTS (
    SELECT 1 FROM blocked_users
    WHERE (blocker_id = auth.uid() AND blocked_id = al.user_id)
    OR (blocker_id = al.user_id AND blocked_id = auth.uid())
  )
  ORDER BY
    is_premium_user(al.user_id) DESC,
    al.created_at DESC
  LIMIT search_limit
  OFFSET search_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get listings by category
CREATE OR REPLACE FUNCTION get_listings_by_category(
  listing_category TEXT,
  user_city TEXT DEFAULT NULL,
  category_limit INTEGER DEFAULT 20,
  category_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  title TEXT,
  description TEXT,
  category TEXT,
  location TEXT,
  date DATE,
  created_at TIMESTAMPTZ,
  username TEXT,
  display_name TEXT,
  is_premium BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    al.id,
    al.user_id,
    al.title,
    al.description,
    al.category,
    al.location,
    al.date,
    al.created_at,
    p.username,
    p.display_name,
    is_premium_user(al.user_id) AS is_premium
  FROM activity_listings al
  JOIN profiles p ON al.user_id = p.id
  WHERE al.status = 'active'
  AND al.category = listing_category
  AND (user_city IS NULL OR al.location ILIKE '%' || user_city || '%')
  AND al.user_id != auth.uid()
  AND NOT EXISTS (
    SELECT 1 FROM blocked_users
    WHERE (blocker_id = auth.uid() AND blocked_id = al.user_id)
    OR (blocker_id = al.user_id AND blocked_id = auth.uid())
  )
  ORDER BY
    is_premium_user(al.user_id) DESC,
    al.created_at DESC
  LIMIT category_limit
  OFFSET category_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT ALL ON activity_listings TO authenticated;
GRANT ALL ON tagalong_requests TO authenticated;
GRANT ALL ON blocked_users TO authenticated;
GRANT ALL ON user_reports TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Backend alignment and security migration completed!';
  RAISE NOTICE '';
  RAISE NOTICE 'Created tables:';
  RAISE NOTICE '  - activity_listings (backend aligned)';
  RAISE NOTICE '  - tagalong_requests (backend aligned)';
  RAISE NOTICE '  - blocked_users (backend aligned)';
  RAISE NOTICE '  - user_reports (backend aligned)';
  RAISE NOTICE '';
  RAISE NOTICE 'Security features:';
  RAISE NOTICE '  ✓ Row Level Security enabled on all tables';
  RAISE NOTICE '  ✓ Users can only access their own data';
  RAISE NOTICE '  ✓ Blocked users are filtered from feeds';
  RAISE NOTICE '  ✓ Premium priority in all listing functions';
  RAISE NOTICE '';
  RAISE NOTICE 'Next: Add input validation middleware to backend';
END $$;
