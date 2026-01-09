-- Drop the insecure view and recreate with proper security
DROP VIEW IF EXISTS public.v_admins;

-- Create v_admins as a secure function instead (SECURITY DEFINER with admin check)
CREATE OR REPLACE FUNCTION public.get_admins()
RETURNS TABLE(user_id uuid, email text, role text, created_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can see the admin list
  IF NOT has_role(auth.uid(), 'admin') THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT 
    ur.user_id,
    au.email::text,
    ur.role::text,
    ur.created_at
  FROM public.user_roles ur
  JOIN auth.users au ON ur.user_id = au.id
  WHERE ur.role = 'admin'
  ORDER BY ur.created_at DESC;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_admins() TO authenticated;