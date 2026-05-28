import { redirect } from 'next/navigation'

interface Props {
  params: Promise<{ id: string }>
}

export default async function LegacySimpleEditorRoute({ params }: Props) {
  const { id } = await params
  redirect(`/dashboard/templates/editor/${id}`)
}
