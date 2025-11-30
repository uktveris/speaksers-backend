create trigger on_new_user_created
after insert on auth.users
for each row execute
function public.handle_new_user();
