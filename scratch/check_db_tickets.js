const supabaseUrl = 'https://wpblxecejkkuevnmlpyp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwYmx4ZWNlamtrdWV2bm1scHlwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Nzc4MjExOSwiZXhwIjoyMDkzMzU4MTE5fQ.LXgR_NYNbM7qKAeHLf9s7UuvmHGGIE9TpGh5kgynHHI';

async function checkTickets() {
  console.log(`Checking table phieu_bao_tri...`);
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/phieu_bao_tri?select=*&limit=5&order=created_at.desc`, {
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });

    console.log(`Response Status: ${res.status}`);
    const data = await res.json();
    console.log(`Tickets found:`, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error checking table:', err);
  }
}

checkTickets();
