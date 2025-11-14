
-- Function to send multiple notifications in a single call.
-- Accepts a JSONB array of notification objects.
create or replace function send_broadcast_notifications(notifications_data jsonb)
returns void as $$
begin
  -- Use a common table expression (CTE) to unpack the JSONB data
  -- and insert it into the notifications table.
  with notification_list as (
    select
      (value->>'userId')::uuid as "userId",
      value->>'type' as type,
      value->>'title' as title,
      value->>'content' as content,
      (value->>'referenceId') as "referenceId"
    from jsonb_array_elements(notifications_data)
  )
  insert into public.notifications ("userId", type, title, content, "referenceId")
  select "userId", type, title, content, "referenceId" from notification_list;
end;
$$ language plpgsql security definer;

-- Grant execution permission to the 'service_role' so it can be called
-- by admin-level server-side code (like Next.js API routes or directly in the dashboard).
grant execute on function send_broadcast_notifications(jsonb) to service_role;
grant execute on function send_broadcast_notifications(jsonb) to authenticated;
grant execute on function send_broadcast_notifications(jsonb) to anon;
