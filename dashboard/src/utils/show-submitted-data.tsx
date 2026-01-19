import { toast } from 'sonner'

export function showSubmittedData(
  _data: unknown,
  title: string = 'Success'
) {
  toast.success(title)
}
