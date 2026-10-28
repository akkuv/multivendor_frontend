import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { BadgeCheck, HelpCircle, MessageCircleQuestion } from 'lucide-react'
import { askQuestion, getProductQuestions } from '@/services/cx'
import type { ProductQuestion } from '@/types'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthStore } from '@/store/authStore'
import { useTranslation } from 'react-i18next'

function questionInitials(name?: string): string {
  if (!name) return 'Q'
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]!.toUpperCase())
    .join('')
}

/** Questions shown before the visitor taps "See more". */
const VISIBLE_QUESTIONS = 2

function QuestionItem({ question }: { question: ProductQuestion }) {
  const { t } = useTranslation()
  const askerName = question.user?.name ?? t('Customer')
  return (
    <article className="rounded-2xl border border-line-warm bg-white p-5">
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gold-soft text-xs font-bold text-gold-deep">
          {questionInitials(askerName)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink">{question.question}</p>
          <p className="mt-1 text-xs text-ink-soft">
            {t('Asked by')} {askerName} •{' '}
            {new Date(question.created_at).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </p>
        </div>
      </div>

      {!!question.answers?.length && (
        <div className="mt-4 space-y-3 border-l-2 border-gold-mid/40 pl-4">
          {question.answers.map((answer) => (
            <div key={answer.id}>
              <p className="text-sm leading-relaxed text-ink/85">{answer.answer}</p>
              <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                <BadgeCheck className="h-3.5 w-3.5" />
                {answer.vendor?.store_name ?? t('Vendor')} · {t('Seller answer')}
              </p>
            </div>
          ))}
        </div>
      )}
    </article>
  )
}

export function ProductQuestionSection({ productId }: { productId: number }) {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const queryClient = useQueryClient()
  const [question, setQuestion] = useState('')
  const [showAllQuestions, setShowAllQuestions] = useState(false)

  const { data: questions, isLoading } = useQuery({
    queryKey: ['questions', productId],
    queryFn: () => getProductQuestions(productId),
  })

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['questions', productId] })

  const ask = useMutation({
    mutationFn: () => askQuestion(productId, { question }),
    onSuccess: () => {
      setQuestion('')
      refresh()
    },
  })

  const items = questions ?? []
  const visibleItems = showAllQuestions ? items : items.slice(0, VISIBLE_QUESTIONS)

  return (
    <div className="space-y-6">
      {user && (
        <div className="rounded-2xl border border-gold-mid/30 bg-ivory/70 p-5">
          <p className="mb-3 flex items-center gap-2 text-base font-semibold text-ink">
            <MessageCircleQuestion className="h-5 w-5 text-gold-deep" /> {t('Ask a question')}
          </p>
          <Textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={t('Ask a question about this product…')}
            rows={3}
            className="border-line-warm bg-white"
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            {ask.isError && <p className="text-sm text-claret">{ask.error?.message}</p>}
            <Button
              onClick={() => ask.mutate()}
              disabled={!question.trim() || ask.isPending}
              className="ml-auto rounded-md bg-[#172926] px-8 text-white hover:bg-[#243a36]"
            >
              {ask.isPending ? t('Asking…') : t('Ask question')}
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line-warm bg-ivory/50 px-6 py-12 text-center">
          <HelpCircle className="mx-auto h-8 w-8 text-gold-mid" />
          <p className="mt-2 font-medium text-ink">{t('No questions yet.')}</p>
          {!user && (
            <p className="mt-1 text-sm text-ink-soft">{t('Be the first to ask a question about this product.')}</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {visibleItems.map((q) => (
            <QuestionItem key={q.id} question={q} />
          ))}
          {items.length > VISIBLE_QUESTIONS && (
            <div className="flex justify-center pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAllQuestions((value) => !value)}
                className="rounded-md border-gold-mid/40 text-gold-deep hover:bg-gold-soft/50"
              >
                {showAllQuestions ? t('Show less') : `${t('See more questions')} (${items.length - VISIBLE_QUESTIONS})`}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ProductQuestionSection