-- Grant admin role to studio@ethinx.solutions (one-time bootstrap)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'studio@ethinx.solutions'
ON CONFLICT (user_id, role) DO NOTHING;