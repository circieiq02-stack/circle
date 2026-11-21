import React, { useState } from 'react';
import { CheckCircle2, Search } from 'lucide-react';
import type {
  ContactSubmission,
  FreelancerProfile,
  Locale,
  RouteKey,
  ServiceCategory,
} from '../types/circle';
import { COPY, tText } from '../i18n/translations';
import {
  CircleButton,
  FutureModuleGate,
  VerificationBadge,
} from '../components/design-system/Primitives';

export const CommunityGatePage: React.FC<{
  locale: Locale;
  onNavigate: (route: RouteKey) => void;
}> = ({ locale, onNavigate }) => (
  <FutureModuleGate
    locale={locale}
    titleEn="CIRCLE Community, Academy & Events"
    titleAr="مجتمع سيركل والأكاديمية والفعاليات"
    descriptionEn="Community discussions, polls, educational courses, and local Iraqi tech/creative events are architected in our roadmap and intentionally gated until Phase 1 services and moderation workflows are verified."
    descriptionAr="تم تصميم البنية التحتية لوحدة المجتمع والاستطلاعات والأكاديمية والفعاليات ضمن الخطة المستقبلية، وستُفتح رسمياً بعد اعتماد إطلاق المرحلة الأولى من الخدمات والإشراف."
    plannedFeaturesEn={[
      'Text-based creative discussions & polls',
      'Public profile badges & saved posts',
      'Automated content reporting & moderation',
      'Instructor-led Academy courses',
      'Baghdad, Basra & Erbil in-person events',
      'No unmoderated private messaging',
    ]}
    plannedFeaturesAr={[
      'منشورات نقاشية واستطلاعات رأي للمبدعين',
      'حفظ المنشورات والملفات العامة',
      'نظام إبلاغ وإشراف لحماية المحتوى',
      'دورات تدريبية ومسارات في الأكاديمية',
      'فعاليات حضورية في بغداد والبصرة وأربيل',
      'ضوابط أمان بدون رسائل خاصة غير خاضعة للإشراف',
    ]}
    onBackHome={() => onNavigate('home')}
  />
);

export const SearchResultsPage: React.FC<{
  locale: Locale;
  initialQuery: string;
  services: ServiceCategory[];
  freelancers: FreelancerProfile[];
  onNavigate: (route: RouteKey, param?: string) => void;
}> = ({ locale, initialQuery, services, freelancers, onNavigate }) => {
  const [query, setQuery] = useState(initialQuery);
  const q = query.trim().toLowerCase();

  const matchedServices = services.filter(
    (s) =>
      s.isActive &&
      (!q ||
        s.titleEn.toLowerCase().includes(q) ||
        s.titleAr.includes(query) ||
        s.descriptionEn.toLowerCase().includes(q))
  );

  const matchedFreelancers = freelancers.filter(
    (f) =>
      f.visibility === 'public' &&
      (!q ||
        f.nameEn.toLowerCase().includes(q) ||
        f.nameAr.includes(query) ||
        f.headlineEn.toLowerCase().includes(q) ||
        f.skillsEn.some((sk) => sk.toLowerCase().includes(q)))
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div className="space-y-4">
        <h1 className="font-display text-3xl font-bold text-[#0b0b0d]">
          {tText(locale, 'Search CIRCLE.iq', 'البحث في CIRCLE.iq')}
        </h1>
        <div className="flex items-center gap-2.5 bg-[#f4f4f5] rounded-xl px-4 h-12 focus-within:ring-2 focus-within:ring-[#d92735]">
          <Search className="w-4 h-4 text-[#5f6168]" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={tText(
              locale,
              COPY.nav.searchPlaceholder.en,
              COPY.nav.searchPlaceholder.ar
            )}
            className="w-full bg-transparent text-sm focus:outline-none"
          />
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="font-display text-lg font-bold text-[#0b0b0d]">
          {tText(locale, 'Services', 'الخدمات')} ({matchedServices.length})
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {matchedServices.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onNavigate('service-details', s.slug)}
              className="text-start rounded-xl border border-[#ececec] p-4 hover:border-[#d92735] cursor-pointer"
            >
              <div className="font-bold text-sm text-[#0b0b0d]">
                {tText(locale, s.titleEn, s.titleAr)}
              </div>
              <div className="text-xs text-[#5f6168] mt-1">
                {tText(locale, s.descriptionEn, s.descriptionAr)}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="font-display text-lg font-bold text-[#0b0b0d]">
          {tText(locale, 'Freelancers', 'المستقلون')} ({matchedFreelancers.length})
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {matchedFreelancers.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => onNavigate('freelancer-profile', f.username)}
              className="text-start rounded-xl border border-[#ececec] p-4 hover:border-[#0b0b0d] cursor-pointer"
            >
              <div className="flex items-center gap-1.5 font-bold text-sm text-[#0b0b0d]">
                <span>{tText(locale, f.nameEn, f.nameAr)}</span>
                <VerificationBadge tier={f.verificationTier} locale={locale} />
              </div>
              <div className="text-xs text-[#5f6168] mt-1">
                {tText(locale, f.headlineEn, f.headlineAr)} ·{' '}
                {tText(locale, f.cityEn, f.cityAr)} ·{' '}
                <span className="font-mono-tabular">
                  {f.followersCount} {tText(locale, 'followers', 'متابع')}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export const AboutPage: React.FC<{
  locale: Locale;
  onNavigate: (route: RouteKey) => void;
}> = ({ locale, onNavigate }) => (
  <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
    <div className="space-y-3">
      <div className="text-xs font-semibold text-[#d92735]">
        {tText(locale, 'About CIRCLE.iq', 'عن منصة CIRCLE.iq')}
      </div>
      <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#0b0b0d] tracking-tight">
        {tText(
          locale,
          'Building Iraq’s connected digital creative infrastructure.',
          'نبني البنية التحتية الرقمية المتكاملة للمبدعين والخدمات في العراق.'
        )}
      </h1>
      <p className="text-base text-[#5f6168] leading-relaxed">
        {tText(
          locale,
          'CIRCLE.iq unites digital services, creative talent discovery, and upcoming community and education initiatives under one trusted platform designed first for Iraq and ready for international growth.',
          'تجمع CIRCLE.iq بين تقديم الخدمات الرقمية واكتشاف المواهب المستقلة مع خطة واضحة للمجتمع والأكاديمية والفعاليات، ضمن منصة واحدة موثوقة تنطلق من العراق نحو العالمية.'
        )}
      </p>
    </div>

    <div className="flex flex-wrap gap-3">
      <CircleButton variant="primary" onClick={() => onNavigate('services')}>
        {tText(locale, 'Explore Services', 'استكشف الخدمات')}
      </CircleButton>
      <CircleButton variant="ghost" onClick={() => onNavigate('contact')}>
        {tText(locale, 'Contact Team', 'تواصل مع الفريق')}
      </CircleButton>
    </div>
  </div>
);

export const ContactPage: React.FC<{
  locale: Locale;
  onSubmitContact: (payload: Omit<ContactSubmission, 'id' | 'createdAt'>) => void;
}> = ({ locale, onSubmitContact }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <div className="rounded-2xl border border-[#ececec] bg-white p-6 sm:p-8 space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#0b0b0d]">
            {tText(locale, 'Contact CIRCLE.iq', 'تواصل مع CIRCLE.iq')}
          </h1>
          <p className="text-xs text-[#5f6168] mt-1">
            {tText(
              locale,
              'Baghdad, Iraq · Partnerships, enterprise services, and platform inquiries',
              'بغداد، العراق · الشراكات، طلبات المؤسسات، والاستفسارات العامة'
            )}
          </p>
        </div>

        {sent ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {tText(
                locale,
                'Your inquiry has been received by the CIRCLE team.',
                'تم استلام رسالتك بنجاح من قبل فريق سيركل.'
              )}
            </span>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSubmitContact({ name, email, subject, message });
              setSent(true);
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={tText(locale, 'Your Name', 'الاسم')}
                className="h-11 px-3.5 rounded-xl border border-[#ececec] text-sm"
                required
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={tText(locale, 'Email Address', 'البريد الإلكتروني')}
                className="h-11 px-3.5 rounded-xl border border-[#ececec] text-sm"
                required
              />
            </div>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={tText(locale, 'Subject', 'الموضوع')}
              className="w-full h-11 px-3.5 rounded-xl border border-[#ececec] text-sm"
              required
            />
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={tText(locale, 'Message', 'تفاصيل الرسالة')}
              className="w-full p-3.5 rounded-xl border border-[#ececec] text-sm"
              required
            />
            <CircleButton type="submit" variant="primary">
              {tText(locale, 'Send Message', 'إرسال الرسالة')}
            </CircleButton>
          </form>
        )}
      </div>
    </div>
  );
};

export const LegalPage: React.FC<{
  locale: Locale;
  mode: 'privacy' | 'terms';
}> = ({ locale, mode }) => (
  <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-6">
    <h1 className="font-display text-3xl font-bold text-[#0b0b0d]">
      {mode === 'privacy'
        ? tText(locale, 'Privacy Policy', 'سياسة الخصوصية')
        : tText(locale, 'Terms of Service', 'شروط الاستخدام')}
    </h1>
    <div className="rounded-2xl border border-[#ececec] bg-white p-6 space-y-4 text-sm text-[#5f6168] leading-relaxed">
      {mode === 'privacy' ? (
        <>
          <p>
            {tText(
              locale,
              'CIRCLE.iq collects only the account, profile, and service request attachment data required to deliver platform functionality and maintain platform safety.',
              'تجمع منصة CIRCLE.iq فقط بيانات الحساب والملف الشخصي ومرفقات طلبات الخدمة اللازمة لتقديم الخدمات والحفاظ على أمان المنصة.'
            )}
          </p>
          <p>
            {tText(
              locale,
              'Payment card numbers are never stored by CIRCLE.iq. Future local payment integrations (ZainCash, MasterCard) will operate solely through approved external gateways.',
              'لا تقوم المنصة بتخزين بيانات البطاقات المصرفية إطلاقاً، وسيتم تفعيل بوابات الدفع المحلية المعتمدة لاحقاً عبر مزودين مرخصين فقط.'
            )}
          </p>
        </>
      ) : (
        <>
          <p>
            {tText(
              locale,
              'All service requests follow our transparent workflow (Submitted → Under Review → In Progress → Completed or Rejected).',
              'تخضع جميع طلبات الخدمات لمسار واضح (تم الإرسال ← قيد المراجعة ← قيد التنفيذ ← مكتمل أو مرفوض).'
            )}
          </p>
          <p>
            {tText(
              locale,
              'During Phase 1, freelancer directory profiles connect clients with external portfolios; direct engagements outside CIRCLE managed services are coordinated externally.',
              'خلال المرحلة الأولى، يوفر دليل المستقلين عرضاً للمواهب والروابط الخارجية، ويتم التنسيق المالي المباشر مع المستقلين خارج المنصة حتى اعتماد بوابات الدفع.'
            )}
          </p>
        </>
      )}
    </div>
  </div>
);
