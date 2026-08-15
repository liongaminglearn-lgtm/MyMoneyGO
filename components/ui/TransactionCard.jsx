'use client'
import { getCategoryById, formatCurrency, formatDate } from '@/lib/utils'
import { Trash2 } from 'lucide-react'

export default function TransactionCard({ transaction, onDelete }) {
  const category = getCategoryById(transaction.category)
  const isIncome = transaction.type === 'income'

  return (
    <div className="card flex items-center gap-3 mb-3">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
        style={{ background: `${category.color}18` }}>
        {category.icon}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-gray-900 font-semibold text-sm truncate">
          {transaction.note || category.name}
        </p>
        <p className="text-brand-muted text-xs mt-0.5">
          {category.name} · {formatDate(transaction.date)}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <span className="font-bold text-sm"
          style={{ color: isIncome ? '#00C896' : '#EF4444' }}>
          {isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
        </span>
        {onDelete && (
          <button onClick={() => onDelete(transaction.id)}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: '#9CA3AF' }}>
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  )
}
