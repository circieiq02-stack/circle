import type { Locale, RequestStatus } from '../types/circle';

export const STATUS_LABELS: Record<RequestStatus, { en: string; ar: string }> = {
  submitted: { en: 'Submitted', ar: 'تم الإرسال' },
  under_review: { en: 'Under Review', ar: 'قيد المراجعة' },
  in_progress: { en: 'In Progress', ar: 'قيد التنفيذ' },
  completed: { en: 'Completed', ar: 'مكتمل' },
  rejected: { en: 'Rejected', ar: 'مرفوض' },
};

export function tText(locale: Locale, en: string, ar: string): string {
  return locale === 'ar' ? ar : en;
}

export const COPY = {
  brand: {
    name: 'CIRCLE.iq',
    sloganEn: 'Your Work Deserves to Be Seen.',
    sloganAr: 'عملك يستحق أن يُرى.',
    heroHeadlineEn: 'Everything connects.',
    heroHeadlineAr: 'كل شيء يترابط.',
    heroSubEn: 'Services. Talent. Community.',
    heroSubAr: 'الخدمات. المواهب. المجتمع.',
    heroDescEn:
      'Iraq’s creative digital platform connecting businesses with vetted digital services and verified freelance talent.',
    heroDescAr:
      'المنصة الرقمية الإبداعية الأولى في العراق لربط المشاريع بالخدمات الرقمية الاحترافية والمواهب المستقلة الموثوقة.',
  },
  nav: {
    home: { en: 'Home', ar: 'الرئيسية' },
    services: { en: 'Services', ar: 'الخدمات' },
    freelancers: { en: 'Freelancers', ar: 'المستقلون' },
    community: { en: 'Community', ar: 'المجتمع' },
    about: { en: 'About', ar: 'عن سيركل' },
    mobilePreview: { en: 'Mobile App', ar: 'تطبيق الموبايل' },
    admin: { en: 'Admin', ar: 'الإدارة' },
    login: { en: 'Sign In', ar: 'تسجيل الدخول' },
    profile: { en: 'Profile', ar: 'الملف الشخصي' },
    searchPlaceholder: {
      en: 'Search services, freelancers, or skills...',
      ar: 'ابحث عن الخدمات أو المستقلين أو المهارات...',
    },
  },
  cta: {
    exploreServices: { en: 'Explore Services', ar: 'استكشف الخدمات' },
    discoverFreelancers: { en: 'Discover Freelancers', ar: 'اكتشف المستقلين' },
    requestService: { en: 'Request Service', ar: 'اطلب الخدمة' },
    viewProfile: { en: 'View Profile', ar: 'عرض الملف' },
    createAccount: { en: 'Create Account', ar: 'إنشاء حساب' },
  },
  roadmap: {
    futureNoteEn:
      'Academy, Events, and Community are currently in structured preparation and will unlock after core release verification.',
    futureNoteAr:
      'وحدات الأكاديمية والفعاليات والمجتمع قيد التجهيز المنهجي ولن تُفعّل قبل اعتماد الإطلاق الرسمي.',
    noPricingNoteEn:
      'Project pricing and timelines are scoped individually after reviewing your submitted requirements.',
    noPricingNoteAr:
      'يتم تحديد التكلفة والمدة الزمنية لكل مشروع بدقة بعد مراجعة المتطلبات المرسلة.',
  },
};
