// Supabase connection. The anon key is safe to publish: row-level security lets visitors ONLY add pending
// reservations. Only the signed-in admin (see admin/index.html) can read, edit or delete them.
window.EP_CONFIG = {
  SUPABASE_URL: "https://jkojnisimriegyldgovi.supabase.co",
  SUPABASE_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imprb2puaXNpbXJpZWd5bGRnb3ZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3NjkxODIsImV4cCI6MjEwNzM0NTE4Mn0.XyjRQRhs2vWo45Q1ElPkVAhXN25Rg0S4CRBKmLQl_XI"
};