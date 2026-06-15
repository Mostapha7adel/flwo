import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'

export function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmLabel = 'تأكيد', loading }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <p className="text-gray-600 text-sm">{message}</p>
      <div className="flex gap-3 mt-6 justify-end">
        <Button variant="secondary" onClick={onClose}>إلغاء</Button>
        <Button variant="danger" onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
      </div>
    </Modal>
  )
}
