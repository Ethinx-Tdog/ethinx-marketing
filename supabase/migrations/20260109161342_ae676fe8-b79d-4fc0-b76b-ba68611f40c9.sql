-- Create admin_audit table for tracking admin actions
CREATE TABLE public.admin_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ts timestamptz NOT NULL DEFAULT now(),
  actor_user_id uuid NOT NULL,
  action text NOT NULL,
  target_email text,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.admin_audit ENABLE ROW LEVEL SECURITY;

-- Only admins can read audit logs
CREATE POLICY "Admins can view audit logs"
ON public.admin_audit
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Service role can insert audit entries
CREATE POLICY "Service role can insert audit logs"
ON public.admin_audit
FOR INSERT
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_admin_audit_ts ON public.admin_audit(ts DESC);

-- Update grant_admin to log audit entry
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
  v_caller_id := auth.uid();
  
  IF NOT has_role(v_caller_id, 'admin') THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized: Admin access required');
  END IF;
  
  SELECT id INTO v_target_user_id FROM auth.users WHERE email = p_email;
  
  IF v_target_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User not found with email: ' || p_email);
  END IF;
  
  IF EXISTS (SELECT 1 FROM user_roles WHERE user_id = v_target_user_id AND role = 'admin') THEN
    RETURN json_build_object('success', false, 'error', 'User is already an admin');
  END IF;
  
  INSERT INTO user_roles (user_id, role) VALUES (v_target_user_id, 'admin');
  
  -- Log audit entry
  INSERT INTO admin_audit (actor_user_id, action, target_email)
  VALUES (v_caller_id, 'grant_admin', p_email);
  
  RETURN json_build_object('success', true, 'message', 'Admin access granted to ' || p_email);
END;
$$;

-- Update revoke_admin to log audit entry
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
  v_caller_id := auth.uid();
  
  IF NOT has_role(v_caller_id, 'admin') THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized: Admin access required');
  END IF;
  
  SELECT id INTO v_target_user_id FROM auth.users WHERE email = p_email;
  
  IF v_target_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User not found with email: ' || p_email);
  END IF;
  
  IF v_target_user_id = v_caller_id THEN
    RETURN json_build_object('success', false, 'error', 'Cannot revoke your own admin access');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = v_target_user_id AND role = 'admin') THEN
    RETURN json_build_object('success', false, 'error', 'User is not an admin');
  END IF;
  
  DELETE FROM user_roles WHERE user_id = v_target_user_id AND role = 'admin';
  
  -- Log audit entry
  INSERT INTO admin_audit (actor_user_id, action, target_email)
  VALUES (v_caller_id, 'revoke_admin', p_email);
  
  RETURN json_build_object('success', true, 'message', 'Admin access revoked from ' || p_email);
END;
$$;