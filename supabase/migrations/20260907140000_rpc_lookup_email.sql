CREATE OR REPLACE FUNCTION get_user_id_by_email(p_email TEXT)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  SELECT id INTO v_id FROM auth.users WHERE email = p_email LIMIT 1;
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
