import { notFound } from 'next/navigation'
import LabClient from './LabClient'

const VALID = ['chemistry', 'physics', 'mathematics', 'biology']

export default function LabSubjectPage({ params }: { params: { subject: string } }) {
  if (!VALID.includes(params.subject)) notFound()
  return <LabClient subjectId={params.subject} />
}

export function generateStaticParams() {
  return [
    { subject: 'chemistry' },
    { subject: 'physics' },
    { subject: 'mathematics' },
    { subject: 'biology' },
  ]
}
