import { Badge } from '../ui/Badge'
import { ORDER_STATUS } from '../../utils/constants'

export function OrderStatusBadge({ status }) {
  const config = ORDER_STATUS[status]
  if (!config) return <Badge>{status}</Badge>
  return <Badge variant={config.color}>{config.label}</Badge>
}
