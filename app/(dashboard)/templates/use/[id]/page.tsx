import { redirect } from 'next/navigation'

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ eventId?: string }>
}

export default async function LegacyTemplateUsePage({ params, searchParams }: Props) {
  const { id } = await params
  const { eventId } = await searchParams

  const suffix = eventId ? `?eventId=${encodeURIComponent(eventId)}` : ''
  redirect(`/dashboard/templates/use/${id}${suffix}`)
}
