import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { Mail, Phone, MapPin, Clock, Send, MessageCircleQuestion } from 'lucide-react'
import { Breadcrumb } from '@/components/Breadcrumb'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const schema = z.object({
  name: z.string().min(2, 'Enter your name'),
  email: z.string().email('Enter a valid email'),
  subject: z.string().min(3, 'Enter a subject'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
})

type FormValues = z.infer<typeof schema>

export function ContactPage() {
  const { t } = useTranslation()
  const [submitted, setSubmitted] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  function onSubmit(_values: FormValues) {
    setSubmitted(true)
    reset()
  }

  const contactChannels = [
    { icon: Mail, title: t('Email'), lines: ['support@waplia.com', t('We reply within 24 hours')] },
    { icon: Phone, title: t('Phone'), lines: ['+1 (555) 000-0000', t('Mon - Sat, 9am - 6pm')] },
    { icon: MapPin, title: t('Head Office'), lines: ['123 Market Street', 'New York, NY 10001'] },
    { icon: Clock, title: t('Business Hours'), lines: [t('Mon - Sat: 9:00 - 18:00'), t('Sunday: Closed')] },
  ]

  return (
    <div>
      <Breadcrumb items={[{ label: t('Contact') }]} />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-10 text-center">
          <p className="inline-flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.3em] text-[#a07a28]">
            <span className="h-px w-8 bg-[#c9a25a]/60" />
            {t('Get in touch')}
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-[#1c1812] sm:text-4xl">{t('Contact Us')}</h1>
          <p className="mx-auto mt-2 max-w-xl text-[#6b5d47]">
            {t('Have a question or need assistance? Send us a message and our team will get back to you.')}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {contactChannels.map(({ icon: Icon, title, lines }) => (
            <Card key={title}>
              <CardContent className="flex flex-col items-center gap-2 py-6 text-center">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold-soft text-[#8a6a1f] ring-1 ring-[#c9a25a]/30">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="font-semibold">{title}</h2>
                {lines.map((line) => (
                  <p key={line} className="text-sm text-muted-foreground">
                    {line}
                  </p>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_1.2fr]">
          <div className="space-y-4">
            <Card>
              <CardContent className="py-6">
                <h2 className="flex items-center gap-2 text-lg font-semibold">
                  <MessageCircleQuestion className="h-5 w-5 text-[#a07a28]" />
                  {t('Common questions')}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t('Many questions can be answered instantly in our help center.')}
                </p>
                <Button asChild variant="outline" className="mt-4 w-full">
                  <Link to="/help">{t('Visit Help Center')}</Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="py-6">
              {submitted ? (
                <div className="flex flex-col items-center gap-3 py-14 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
                    <Send className="h-6 w-6" />
                  </div>
                  <h2 className="text-xl font-bold">{t('Message sent')}</h2>
                  <p className="max-w-sm text-sm text-muted-foreground">
                    {t('Thank you for reaching out. Our support team will get back to you within 24 hours.')}
                  </p>
                  <Button
                    variant="outline"
                    className="mt-2"
                    onClick={() => setSubmitted(false)}
                  >
                    {t('Send another message')}
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">{t('Your name')}</Label>
                      <Input id="name" placeholder={t('John Doe')} {...register('name')} />
                      {errors.name && (
                        <p className="text-sm text-destructive">{errors.name.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">{t('Email')}</Label>
                      <Input id="email" type="email" placeholder="you@example.com" {...register('email')} />
                      {errors.email && (
                        <p className="text-sm text-destructive">{errors.email.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">{t('Subject')}</Label>
                    <Input id="subject" placeholder={t('How can we help?')} {...register('subject')} />
                    {errors.subject && (
                      <p className="text-sm text-destructive">{errors.subject.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">{t('Message')}</Label>
                    <Textarea
                      id="message"
                      rows={5}
                      placeholder={t('Write your message here...')}
                      {...register('message')}
                    />
                    {errors.message && (
                      <p className="text-sm text-destructive">{errors.message.message}</p>
                    )}
                  </div>

                  <Button type="submit" className="w-full sm:w-auto">
                    <Send className="mr-2 h-4 w-4" /> {t('Send Message')}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}