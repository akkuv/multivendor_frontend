import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { MessageCircleQuestion, Send } from 'lucide-react'
import { answerQuestion, getVendorQuestions } from '@/services/vendorQuestions'
import type { ProductQuestion } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { useTranslation } from 'react-i18next'

function QuestionItem({ question }: { question: ProductQuestion }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [answer, setAnswer] = useState('')

  const answerMutation = useMutation({
    mutationFn: () => answerQuestion(question.id, { answer }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vendor-questions'] }),
  })

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <p className="font-medium">{question.question}</p>
        <p className="text-xs text-muted-foreground">
          Product: {question.product?.name ?? `#${question.product_id}`} • Asked by{' '}
          {question.user?.name ?? 'Customer'} • {new Date(question.created_at).toLocaleDateString()}
        </p>
        {!question.is_answered ? (
          <>
            <Textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder={t('Write your answer…')}
              rows={3}
            />
            <Button onClick={() => answerMutation.mutate()} disabled={!answer.trim() || answerMutation.isPending}>
              <Send className="mr-1 h-4 w-4" /> {t('Submit answer')}
            </Button>
          </>
        ) : (
          <p className="text-sm text-emerald-700">{t('Answered ✓')}</p>
        )}
      </CardContent>
    </Card>
  )
}

export function VendorQuestionsPage() {
  const { t } = useTranslation()
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['vendor-questions'],
    queryFn: getVendorQuestions,
  })

  if (isError) {
    return (
      <div className="rounded-2xl border bg-background p-8 text-center">
        <p className="font-semibold">{t('Could not load questions.')}</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => refetch()}>
          {t('Try again')}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <MessageCircleQuestion className="h-6 w-6" /> {t('Customer Questions')}
        </h1>
        <p className="text-muted-foreground">{t('Answer questions customers have asked about your products.')}</p>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">{t('Loading questions…')}</p>
      ) : data && data.data.length > 0 ? (
        <div className="space-y-3">
          {data.data.map((q) => (
            <QuestionItem key={q.id} question={q} />
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{t('No questions')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {t('Questions customers ask about your products will appear here.')}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}