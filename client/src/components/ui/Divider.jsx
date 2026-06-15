import { cn } from '../../utils/cn'

export function Divider({ className }) {
  return <hr className={cn('border-gray-200 my-4', className)} />
}
