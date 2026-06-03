import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdventureFlow } from '@/components/templates/adventure-flow'

export default async function AdventureTemplatePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  return <AdventureFlow />
}
