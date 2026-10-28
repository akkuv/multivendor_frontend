import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { CheckCircle2, EyeOff, Flag, Ban, Trash2, MessageCircleQuestion } from 'lucide-react'
import {
  clearQuestionReport,
  deleteQuestionAsAdmin,
  getAdminQuestions,
  hideQuestion,
  reportQuestion,
  unhideQuestion,
} from '@/services/cx'
import type { ProductQuestion } from '@/types'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { useTranslation } from 'react-i18next'

export function AdminQuestionsPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [status, setStatus] = useState('all')
  const [reportId, setReportId] = useState<number | null>(null)
  const [reportReason, setReportReason] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-questions', status],
    queryFn: () => getAdminQuestions({ status: status === 'all' ? undefined : status, per_page: 20 }),
  })

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin-questions'] })

  const hide = useMutation({ mutationFn: hideQuestion, onSuccess: refresh })
  const unhide = useMutation({ mutationFn: unhideQuestion, onSuccess: refresh })
  const report = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => reportQuestion(id, reason),
    onSuccess: () => {
      setReportId(null)
      setReportReason('')
      refresh()
    },
  })
  const unreport = useMutation({ mutationFn: clearQuestionReport, onSuccess: refresh })
  const remove = useMutation({ mutationFn: deleteQuestionAsAdmin, onSuccess: refresh })

  const handleAction = (action: string, id: number) => {
    if (action === 'hide') hide.mutate(id)
    else if (action === 'unhide') unhide.mutate(id)
    else if (action === 'report') setReportId(id)
    else if (action === 'unreport') unreport.mutate(id)
    else if (action === 'delete') remove.mutate(id)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{t('Product Q&A Moderation')}</h1>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('All')}</SelectItem>
            <SelectItem value="answered">{t('Answered')}</SelectItem>
            <SelectItem value="unanswered">{t('Unanswered')}</SelectItem>
            <SelectItem value="hidden">{t('Hidden')}</SelectItem>
            <SelectItem value="reported">{t('Reported')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">{t('Loading questions…')}</p>
      ) : data && data.data.length > 0 ? (
        <ul className="space-y-3">
          {data.data.map((q: ProductQuestion) => (
            <li key={q.id} className="rounded-lg border p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="max-w-xl">
                  <p className="font-medium">{q.question}</p>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {q.user?.name} • {q.product?.name ?? `Product #${q.product_id}`} •{' '}
                    {new Date(q.created_at).toLocaleDateString()}
                  </div>
                  {q.is_answered && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-emerald-700">
                      <CheckCircle2 className="h-3 w-3" /> {t('Answered')}
                    </p>
                  )}
                  {q.report_reason && (
                    <p className="mt-1 text-xs text-rose-600">
                      <Flag className="mr-1 inline h-3 w-3" /> {t('Reported: {{reason}}', { reason: q.report_reason })}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-1">
                  {q.is_hidden ? (
                    <Button size="sm" variant="outline" onClick={() => handleAction('unhide', q.id)}>
                      <EyeOff className="h-3 w-3" /> {t('Unhide')}
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => handleAction('hide', q.id)}>
                      <EyeOff className="h-3 w-3" /> {t('Hide')}
                    </Button>
                  )}
                  {q.reported_at ? (
                    <Button size="sm" variant="outline" onClick={() => handleAction('unreport', q.id)}>
                      <Ban className="h-3 w-3" /> {t('Clear report')}
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => handleAction('report', q.id)}>
                      <Flag className="h-3 w-3" /> {t('Report')}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => handleAction('delete', q.id)}
                  >
                    <Trash2 className="h-3 w-3" /> {t('Delete')}
                  </Button>
                </div>
              </div>
              {!!q.answers?.length && (
                <div className="mt-3 space-y-1 border-t pt-3 text-sm text-muted-foreground">
                  {q.answers.map((a) => (
                    <p key={a.id}>
                      <span className="font-medium text-emerald-700">{a.vendor?.store_name}:</span>{' '}
                      {a.answer}
                    </p>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-lg border p-6 text-center text-sm text-muted-foreground">
          <MessageCircleQuestion className="mx-auto mb-2 h-6 w-6" /> {t('No questions to show.')}
        </p>
      )}

      <Dialog open={reportId !== null} onOpenChange={(open) => !open && setReportId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('Report question')}</DialogTitle>
          </DialogHeader>
          <Textarea
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            placeholder={t('Reason for reporting')}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportId(null)}>
              {t('Cancel')}
            </Button>
            <Button
              disabled={!reportReason || report.isPending}
              onClick={() => reportId !== null && report.mutate({ id: reportId, reason: reportReason })}
            >
              {t('Report')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}