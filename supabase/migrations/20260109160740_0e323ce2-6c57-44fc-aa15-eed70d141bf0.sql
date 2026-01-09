-- Create v_admins view that joins user_roles with auth.users to get email
CREATE OR REPLACE VIEW public.v_admins AS
SELECT 
  ur.user_id,
  au.email,
  ur.role::text as role,
  ur.created_at
FROM public.user_roles ur
JOIN auth.users au ON ur.user_id = au.id
WHERE ur.role = 'admin';

-- Grant select on the view to authenticated users (RLS will handle access)
GRANT SELECT ON public.v_admins TO authenticated;

-- Create grant_admin RPC
CREATE OR REPLACE FUNCTION public.grant_admin(p_email text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_target_user_id uuid;
  v_caller_id uuid;
BEGIN
  -- Get caller's user ID
  v_caller_id := auth.uid();
  
  -- Check if caller is admin
  IF NOT has_role(v_caller_id, 'admin') THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized: Admin access required');
  END IF;
  
  -- Find user by email
  SELECT id INTO v_target_user_id FROM auth.users WHERE email = p_email;
  
  IF v_target_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User not found with email: ' || p_email);
  END IF;
  
  -- Check if already admin
  IF EXISTS (SELECT 1 FROM user_roles WHERE user_id = v_target_user_id AND role = 'admin') THEN
    RETURN json_build_object('success', false, 'error', 'User is already an admin');
  END IF;
  
  -- Grant admin role
  INSERT INTO user_roles (user_id, role) VALUES (v_target_user_id, 'admin');
  
  RETURN json_build_object('success', true, 'message', 'Admin access granted to ' || p_email);
END;
$$;

-- Create revoke_admin RPC
CREATE OR REPLACE FUNCTION public.revoke_admin(p_email text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_target_user_id uuid;
  v_caller_id uuid;
BEGIN
  -- Get caller's user ID
  v_caller_id := auth.uid();
  
  -- Check if caller is admin
  IF NOT has_role(v_caller_id, 'admin') THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized: Admin access required');
  END IF;
  
  -- Prevent self-revoke
  SELECT id INTO v_target_user_id FROM auth.users WHERE email = p_email;
  
  IF v_target_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User not found with email: ' || p_email);
  END IF;
  
  IF v_target_user_id = v_caller_id THEN
    RETURN json_build_object('success', false, 'error', 'Cannot revoke your own admin access');
  END IF;
  
  -- Check if user is admin
  IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = v_target_user_id AND role = 'admin') THEN
    RETURN json_build_object('success', false, 'error', 'User is not an admin');
  END IF;
  
  -- Revoke admin role
  DELETE FROM user_roles WHERE user_id = v_target_user_id AND role = 'admin';
  
  RETURN json_build_object('success', true, 'message', 'Admin access revoked from ' || p_email);
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.grant_admin(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_admin(text) TO authenticated;