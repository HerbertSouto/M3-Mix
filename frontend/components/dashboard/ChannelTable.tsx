import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { AnalysisResults } from '@/lib/types'

interface Props {
  results: AnalysisResults
}

export function ChannelTable({ results }: Props) {
  const { roas, contributions, adstock } = results
  const channels = Object.keys(roas)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance por Canal</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Canal</TableHead>
              <TableHead className="text-right">ROAS</TableHead>
              <TableHead className="text-right">Contribuição</TableHead>
              <TableHead className="text-right">Adstock</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {channels.map((ch) => (
              <TableRow key={ch}>
                <TableCell className="font-medium capitalize">
                  {ch.replace('_spend', '')}
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant={roas[ch] >= 1 ? 'default' : 'destructive'}>
                    {roas[ch].toFixed(2)}x
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {((contributions[ch] ?? 0) * 100).toFixed(1)}%
                </TableCell>
                <TableCell className="text-right">
                  {((adstock[ch] ?? 0) * 100).toFixed(0)}%
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
