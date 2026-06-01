import { createClient } from '@/lib/supabase/server'
import SolvePage from '@/app/dashboard/solve/page'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Still fetch profile data to maintain auth and any side effects
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single()

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <SolvePage />
    </div>
  )
}