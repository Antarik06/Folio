import { redirect } from 'next/navigation'

interface Props {
  params: Promise<{ id: string }>
}

export default async function LegacyBuilderPage({ params }: Props) {
  const { id } = await params
  redirect(`/dashboard/templates/editor/${id}`)
}
