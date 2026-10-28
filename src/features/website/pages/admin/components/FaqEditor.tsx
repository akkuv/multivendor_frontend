import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Trash2, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export type FaqItemDraft = {
  question: string
  answer: string
}

export type FaqEditorProps = {
  items: FaqItemDraft[]
  onChange: (items: FaqItemDraft[]) => void
  className?: string
}

export function FaqEditor({ items, onChange, className }: FaqEditorProps) {
  const { t } = useTranslation()

  const update = (index: number, patch: Partial<FaqItemDraft>) => {
    const next = items.map((item, i) => (i === index ? { ...item, ...patch } : item))
    onChange(next)
  }

  const add = () => {
    onChange([...items, { question: '', answer: '' }])
  }

  const remove = (index: number) => {
    onChange(items.filter((_, i) => i !== index))
  }

  return (
    <div className={className}>
      <div className="space-y-3">
        {items.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            {t('Add one or more frequently asked questions. A row will only appear on the storefront once both the question and answer are filled.')}
          </p>
        ) : (
          items.map((item, index) => (
            <div key={index} className="rounded-lg border border-input bg-muted/20 p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {t('Question')} {index + 1}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => remove(index)}
                  className="h-8 px-2 text-destructive hover:text-destructive"
                >
                  <Trash2 className="mr-1 h-4 w-4" />
                  {t('Remove')}
                </Button>
              </div>
              <div className="mt-2 space-y-2">
                <Input
                  value={item.question}
                  onChange={(e) => update(index, { question: e.target.value })}
                  placeholder={t('Enter the question')}
                />
                <Textarea
                  rows={3}
                  value={item.answer}
                  onChange={(e) => update(index, { answer: e.target.value })}
                  placeholder={t('Enter the answer')}
                />
              </div>
            </div>
          ))
        )}
        <Button type="button" variant="outline" onClick={add}>
          <Plus className="mr-1 h-4 w-4" />
          {t('Add FAQ')}
        </Button>
      </div>
    </div>
  )
}
