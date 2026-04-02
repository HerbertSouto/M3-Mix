import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Props {
  narrative: string
}

export function NarrativePanel({ narrative }: Props) {
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle className="text-base">Análise do Copilot</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="whitespace-pre-wrap text-sm leading-relaxed">
          {narrative}
        </div>
      </CardContent>
    </Card>
  )
}
