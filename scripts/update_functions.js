// Script to apply SQL functions to the database
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Get Supabase credentials from environment variables
// You need to set SUPABASE_URL and SUPABASE_SERVICE_KEY in your environment
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

// Exit if credentials are not provided
if (!supabaseUrl || !supabaseKey) {
  console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function applyFunctions() {
  try {
    console.log('Applying SQL functions to the database...');

    // List of SQL files to apply
    const sqlFiles = [
      'admin_update_user_metadata.sql',
      'update_user_metadata.sql',
    ];

    for (const file of sqlFiles) {
      const filePath = path.join(__dirname, '..', 'src', 'sql', file);
      console.log(`Applying ${filePath}...`);

      try {
        // Read SQL content
        const sqlContent = fs.readFileSync(filePath, 'utf8');

        // Execute SQL
        const { error } = await supabase.rpc('execute_admin_sql', { sql: sqlContent });

        if (error) {
          console.error(`Error applying ${file}:`, error);
        } else {
          console.log(`Successfully applied ${file}`);
        }
      } catch (fileError) {
        console.error(`Error reading ${file}:`, fileError);
      }
    }

    console.log('SQL functions applied successfully');
  } catch (error) {
    console.error('Error applying SQL functions:', error);
  }
}

applyFunctions(); 