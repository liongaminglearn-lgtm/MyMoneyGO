/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wmjowbcunxuhdeqgkcjw.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indtam93YmN1bnh1aGRlcWdrY2p3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU3ODk0NTUsImV4cCI6MjEwMTM2NTQ1NX0.IdplwnQcUwkmZrQAt2n1jh3vjGKV2ABmY4fWleMgaUQ',
  },
}

module.exports = nextConfig
