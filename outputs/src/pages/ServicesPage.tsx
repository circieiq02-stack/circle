import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Paperclip,
  Search,
  Upload,
  X,
} from 'lucide-react';
import type {
  Locale,
  RequestAttachment,
  RouteKey,
  ServiceCategory,
  ServiceRequest,
  UserAccount,
} from '../types/circle';
import { COPY, tText } from '../i18n/translations';
import {
  CircleButton,
  RequestStatusLabel,
} from '../components/design-system/Primitives';

interface ServicesPageProps {
  locale: Locale;
  services: ServiceCategory[];
  selectedSlug: string | null;
  currentUser: UserAccount | null;
  requests: ServiceRequest[];
  onNavigate: (route: RouteKey, param?: string) => void;
  onSubmitRequest: (payload: {
    serviceId: string;
    projectTitle: string;
    brief: string;
    timelineNote: string;
    attachments: RequestAttachment[];
  }) => ServiceRequest;
}

export const ServicesPage: React.FC<ServicesPageProps> = ({
  locale,
  services,
  selectedSlug,
  currentUser,
  requests,
  onNavigate,
  onSubmitRequest,
}) => {
  const [query, setQuery] = useState('');
  const [projectTitle, setProjectTitle] = useState('');
  const [brief, setBrief] = useState('');
  const [timelineNote, setTimelineNote] = useState('');
  const [attachments, setAttachments] = useState<RequestAttachment[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [submittedRequest, setSubmittedRequest] =
    useState<ServiceRequest | null>(null);

  const ArrowIcon = locale === 'ar' ? ArrowLeft : ArrowRight;
  const activeServices = services.filter((s) => s.isActive);
  const selectedService = selectedSlug
    ? activeServices.find((s) => s.slug === selectedSlug) ?? null
    : null;

  const filteredServices = activeServices.filter((s) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      s.titleEn.toLowerCase().includes(q) ||
      s.titleAr.includes(query) ||
      s.descriptionEn.toLowerCase().includes(q) ||
      s.descriptionAr.includes(query)
    );
  });

  const handleAttachmentAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const valid = files
      .filter((f) => f.size <= 10 * 1024 * 1024)
      .map((f) => ({
        name: f.name,
        sizeBytes: f.size,
        mimeType: f.type || 'application/octet-stream',
      }));
    if (valid.length < files.length) {
      setFormError(
        tText(
          locale,
          'Files larger than 10 MB were skipped.',
          'تم استبعاد الملفات التي يتجاوز حجمها 10 ميجابايت.'
        )
      );
    } else {
      setFormError(null);
    }
    setAttachments((prev) => [...prev, ...valid]);
    e.target.value = '';
  };

  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService) return;
    if (!currentUser) {
      onNavigate('login');
      return;
    }
    if (projectTitle.trim().length < 4 || brief.trim().length < 15) {
      setFormError(
        tText(
          locale,
          'Please enter a descriptive project title and requirements brief (at least 15 characters).',
          'يرجى إدخال عنوان واضح للمشروع ووصف للمتطلبات لا يقل عن 15 حرفاً.'
        )
      );
      return;
    }

    setFormError(null);
    const created = onSubmitRequest({
      serviceId: selectedService.id,
      projectTitle: projectTitle.trim(),
      brief: brief.trim(),
      timelineNote: timelineNote.trim(),
      attachments,
    });
    setSubmittedRequest(created);
    setProjectTitle('');
    setBrief('');
    setTimelineNote('');
    setAttachments([]);
  };

  // Service Detail + Request Form View
  if (selectedService) {
    const deliverables =
      locale === 'ar'
        ? selectedService.deliverablesAr
        : selectedService.deliverablesEn;
    const requirements =
      locale === 'ar'
        ? selectedService.requirementsAr
        : selectedService.requirementsEn;

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <button
          type="button"
          onClick={() => {
            setSubmittedRequest(null);
            onNavigate('services');
          }}
          className="text-xs font-semibold text-[#5f6168] hover:text-[#0b0b0d] mb-6 inline-flex items-center gap-1.5 cursor-pointer"
        >
          <span>←</span>
          <span>
            {tText(locale, 'Back to all services', 'العودة إلى جميع الخدمات')}
          </span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Scope & Requirements */}
          <div className="lg:col-span-6 space-y-6">
            <div
              className="h-32 rounded-2xl p-6 flex items-end"
              style={{ backgroundColor: selectedService.tintHex }}
            >
              <span
                className={`text-xs font-semibold ${
                  selectedService.tintHex === '#0b0b0d'
                    ? 'text-white/80'
                    : 'text-[#0b0b0d]/70'
                }`}
              >
                {tText(locale, 'CIRCLE Digital Service', 'خدمة سيركل الرقمية')}
              </span>
            </div>

            <div>
              <h1 className="font-display text-3xl font-bold text-[#0b0b0d] tracking-tight mb-3">
                {tText(
                  locale,
                  selectedService.titleEn,
                  selectedService.titleAr
                )}
              </h1>
              <p className="text-base text-[#5f6168] leading-relaxed">
                {tText(
                  locale,
                  selectedService.descriptionEn,
                  selectedService.descriptionAr
                )}
              </p>
            </div>

            <div className="rounded-2xl border border-[#ececec] p-5 space-y-3">
              <h2 className="text-sm font-bold text-[#0b0b0d]">
                {tText(locale, 'Core Deliverables', 'المخرجات الأساسية')}
              </h2>
              <ul className="space-y-2 text-sm text-[#5f6168]">
                {deliverables.map((d) => (
                  <li key={d} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#d92735] shrink-0 mt-0.5" />
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-[#ececec] p-5 space-y-3">
              <h2 className="text-sm font-bold text-[#0b0b0d]">
                {tText(
                  locale,
                  'Information Needed to Scope Your Project',
                  'المعلومات المطلوبة لدراسة المشروع'
                )}
              </h2>
              <ul className="space-y-2 text-sm text-[#5f6168]">
                {requirements.map((r) => (
                  <li key={r} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0b0b0d] mt-2 shrink-0" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
              <p className="pt-2 border-t border-[#ececec] text-xs text-[#5f6168]">
                {tText(
                  locale,
                  COPY.roadmap.noPricingNoteEn,
                  COPY.roadmap.noPricingNoteAr
                )}
              </p>
            </div>
          </div>

          {/* Right Column: Service Request Intake Form */}
          <div className="lg:col-span-6">
            <div className="rounded-2xl border border-[#ececec] bg-white p-6 sm:p-8 space-y-5">
              <div>
                <h2 className="font-display text-xl font-bold text-[#0b0b0d]">
                  {tText(
                    locale,
                    'Submit a Service Request',
                    'تقديم طلب خدمة جديد'
                  )}
                </h2>
                <p className="text-xs text-[#5f6168] mt-1">
                  {tText(
                    locale,
                    'Workflow: Submitted → Under Review → In Progress → Completed',
                    'مسار الطلب: تم الإرسال ← قيد المراجعة ← قيد التنفيذ ← مكتمل'
                  )}
                </p>
              </div>

              {submittedRequest && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-emerald-900">
                      {tText(
                        locale,
                        'Request Submitted Successfully',
                        'تم إرسال الطلب بنجاح'
                      )}
                    </span>
                    <span className="font-mono-tabular text-xs font-semibold text-emerald-800">
                      {submittedRequest.referenceCode}
                    </span>
                  </div>
                  <p className="text-xs text-emerald-800">
                    {tText(
                      locale,
                      'Track status updates anytime from your Profile or Notifications.',
                      'يمكنك متابعة تحديثات حالة الطلب من الملف الشخصي أو الإشعارات.'
                    )}
                  </p>
                </div>
              )}

              {formError && (
                <div
                  role="alert"
                  className="rounded-xl border border-[#f6d3d6] bg-[#fdf1f2] p-3 text-xs text-[#d92735] flex items-start gap-2"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {!currentUser ? (
                <div className="rounded-xl border border-[#ececec] bg-[#f4f4f5] p-6 text-center space-y-3">
                  <p className="text-sm text-[#0b0b0d] font-medium">
                    {tText(
                      locale,
                      'Sign in to submit and track your service request.',
                      'سجّل الدخول لتقديم طلب الخدمة ومتابعة مراحله.'
                    )}
                  </p>
                  <CircleButton
                    variant="primary"
                    onClick={() => onNavigate('login')}
                  >
                    {tText(locale, 'Sign In to Continue', 'تسجيل الدخول للمتابعة')}
                  </CircleButton>
                </div>
              ) : (
                <form onSubmit={handleRequestSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#0b0b0d] mb-1.5">
                      {tText(locale, 'Project Title', 'عنوان المشروع')}
                    </label>
                    <input
                      type="text"
                      value={projectTitle}
                      onChange={(e) => setProjectTitle(e.target.value)}
                      placeholder={tText(
                        locale,
                        'e.g. Company bilingual website & brand launch',
                        'مثال: موقع تعريفي ثنائي اللغة لشركة'
                      )}
                      className="w-full h-11 px-3.5 rounded-xl border border-[#ececec] bg-[#f4f4f5]/50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#d92735]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#0b0b0d] mb-1.5">
                      {tText(
                        locale,
                        'Project Requirements & Scope',
                        'متطلبات المشروع والتفاصيل'
                      )}
                    </label>
                    <textarea
                      rows={4}
                      value={brief}
                      onChange={(e) => setBrief(e.target.value)}
                      placeholder={tText(
                        locale,
                        'Describe your objectives, key features, and target audience...',
                        'اشرح أهداف المشروع، الصفحات أو المزايا المطلوبة، والجمهور المستهدف...'
                      )}
                      className="w-full p-3.5 rounded-xl border border-[#ececec] bg-[#f4f4f5]/50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#d92735]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#0b0b0d] mb-1.5">
                      {tText(
                        locale,
                        'Preferred Timeline (Optional)',
                        'الجدول الزمني المفضل (اختياري)'
                      )}
                    </label>
                    <input
                      type="text"
                      value={timelineNote}
                      onChange={(e) => setTimelineNote(e.target.value)}
                      placeholder={tText(
                        locale,
                        'e.g. 4–6 weeks',
                        'مثال: خلال ٤ إلى ٦ أسابيع'
                      )}
                      className="w-full h-11 px-3.5 rounded-xl border border-[#ececec] bg-[#f4f4f5]/50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#d92735]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#0b0b0d] mb-1.5">
                      {tText(
                        locale,
                        'Project Attachments (PDF, PNG, DOCX · max 10 MB)',
                        'المرفقات الداعمة (PDF أو صور · حد أقصى 10 ميجابايت)'
                      )}
                    </label>
                    <label className="flex items-center justify-center gap-2 h-12 rounded-xl border border-dashed border-[#d9d9dc] bg-[#f4f4f5]/50 hover:bg-[#f4f4f5] text-xs font-medium text-[#5f6168] cursor-pointer">
                      <Upload className="w-4 h-4" />
                      <span>
                        {tText(locale, 'Attach project files', 'إرفاق ملفات المشروع')}
                      </span>
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                        onChange={handleAttachmentAdd}
                        className="hidden"
                      />
                    </label>

                    {attachments.length > 0 && (
                      <div className="mt-2.5 space-y-1.5">
                        {attachments.map((att, idx) => (
                          <div
                            key={`${att.name}-${idx}`}
                            className="flex items-center justify-between px-3 py-2 rounded-lg border border-[#ececec] text-xs"
                          >
                            <span className="inline-flex items-center gap-1.5 truncate">
                              <Paperclip className="w-3.5 h-3.5 text-[#5f6168]" />
                              <span className="truncate">{att.name}</span>
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setAttachments((prev) =>
                                  prev.filter((_, i) => i !== idx)
                                )
                              }
                              className="text-[#5f6168] hover:text-[#d92735] cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <CircleButton type="submit" variant="primary" className="w-full">
                    {tText(locale, 'Submit Service Request', 'إرسال طلب الخدمة')}
                  </CircleButton>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Services Directory View
  const userRequests = currentUser
    ? requests.filter((r) => r.requesterId === currentUser.id)
    : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-[#d92735] mb-1.5">
            {tText(locale, 'What Do You Need?', 'ما الذي يحتاجه مشروعك؟')}
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#0b0b0d] tracking-tight">
            {tText(
              locale,
              'Find your next creative & technical partner.',
              'اختر الخدمة المناسبة لبناء مشروعك الرقمي.'
            )}
          </h1>
        </div>

        <div className="w-full md:w-80 flex items-center gap-2.5 bg-[#f4f4f5] rounded-xl px-4 h-11 focus-within:ring-2 focus-within:ring-[#d92735]">
          <Search className="w-4 h-4 text-[#5f6168] shrink-0" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={tText(locale, 'Search services...', 'ابحث في الخدمات...')}
            className="w-full bg-transparent text-sm focus:outline-none"
          />
        </div>
      </div>

      {filteredServices.length === 0 ? (
        <div className="rounded-2xl border border-[#ececec] p-10 text-center space-y-3">
          <p className="text-sm text-[#5f6168]">
            {tText(
              locale,
              'No services matched your search query.',
              'لم يتم العثور على خدمات مطابقة لبحثك.'
            )}
          </p>
          <CircleButton variant="ghost" onClick={() => setQuery('')}>
            {tText(locale, 'Clear filter', 'مسح البحث')}
          </CircleButton>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredServices.map((svc) => (
            <button
              key={svc.id}
              type="button"
              onClick={() => onNavigate('service-details', svc.slug)}
              className="text-start rounded-2xl border border-[#ececec] bg-white p-5 hover:border-[#d92735]/50 transition-colors flex flex-col gap-4 cursor-pointer"
            >
              <div
                className="h-24 rounded-xl"
                style={{ backgroundColor: svc.tintHex }}
              />
              <div className="space-y-1.5 flex-1">
                <h2 className="font-display text-lg font-bold text-[#0b0b0d]">
                  {tText(locale, svc.titleEn, svc.titleAr)}
                </h2>
                <p className="text-sm text-[#5f6168] leading-relaxed">
                  {tText(locale, svc.descriptionEn, svc.descriptionAr)}
                </p>
              </div>
              <div className="pt-3 border-t border-[#ececec] flex items-center justify-between text-xs font-semibold text-[#d92735]">
                <span>
                  {tText(
                    locale,
                    COPY.cta.requestService.en,
                    COPY.cta.requestService.ar
                  )}
                </span>
                <ArrowIcon className="w-4 h-4" />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Active User Service Requests Tracker */}
      {userRequests.length > 0 && (
        <div className="pt-8 border-t border-[#ececec] space-y-4">
          <h2 className="font-display text-xl font-bold text-[#0b0b0d]">
            {tText(locale, 'Your Submitted Requests', 'طلباتك المرسلة')}
          </h2>
          <div className="divide-y divide-[#ececec] rounded-2xl border border-[#ececec] bg-white">
            {userRequests.map((req) => (
              <div
                key={req.id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-[#5f6168]">
                    <span className="font-mono-tabular font-semibold text-[#0b0b0d]">
                      {req.referenceCode}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {tText(locale, req.serviceTitleEn, req.serviceTitleAr)}
                    </span>
                  </div>
                  <div className="text-sm font-bold text-[#0b0b0d]">
                    {req.projectTitle}
                  </div>
                  {req.adminNote && (
                    <div className="text-xs text-[#5f6168]">{req.adminNote}</div>
                  )}
                </div>
                <RequestStatusLabel status={req.status} locale={locale} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
