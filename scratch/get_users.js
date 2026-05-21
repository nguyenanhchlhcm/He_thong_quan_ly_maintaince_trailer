const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing credentials")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function getUsers() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
  
  if (error) {
    console.error("Error:", error)
  } else {
    console.log("Profiles list:")
    console.log(JSON.stringify(data, null, 2))
  }
}

getUsers()
