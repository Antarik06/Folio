import { redirect } from 'next/navigation'

interface Props {
  params: Promise<{ id: string }>
}

export default async function LegacyTemplatePreviewPage({ params }: Props) {
  const { id } = await params
  redirect(`/dashboard/templates/preview/${id}`)
}
