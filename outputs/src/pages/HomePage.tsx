import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Lock,
  Search,
  Smartphone,
} from 'lucide-react';
import type {
  FreelancerProfile,
  Locale,
  RouteKey,
  ServiceCategory,
  TaxonomyDatabase,
} from '../types/circle';
import { COPY, tText } from '../i18n/translations';
import {
  CircleButton,
  CircleLogoMark,
  VerificationBadge,
} from '../components/design-system/Primitives';
import {
  resolvePrimarySpecialtyLabel,
  resolveSecondarySpecialtyLabels,
} from '../utils/taxonomyHelpers';

interface HomePageProps {
  locale: Locale;
  services: ServiceCategory[];
  freelancers: FreelancerProfile[];
  taxonomy: TaxonomyDatabase;
  onNavigate: (route: RouteKey, param?: string) => void;
  onSearch: (query: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  locale,
  services,
  freelancers,
  taxonomy,
  onNavigate,
  onSearch,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const ArrowIcon = locale === 'ar' ? ArrowLeft : ArrowRight;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchTerm);
  };

  const activeServices = services.filter((s) => s.isActive);
  const publicFreelancers = freelancers
    .filter((f) => f.visibility === 'public')
    .slice(0, 3);

  const pillars = [
    {
      num: '01',
      titleEn: 'Digital Services',
      titleAr: 'الخدمات الرقمية',
      descEn:
        'Structured project intake across web, e-commerce, mobile, UI/UX, brand identity, and automation.',
      descAr:
        'استقبال وتنفيذ طلبات المشاريع في تطوير الويب والمتاجر والتطبيقات وتصميم الواجهات والهوية.',
      statusEn: 'Active Now',
      statusAr: 'متاح الآن',
      active: true,
      route: 'services' as RouteKey,
    },
    {
      num: '02',
      titleEn: 'Freelancer Talent',
      titleAr: 'المواهب المستقلة',
      descEn:
        'Curated Iraqi creative and engineering profiles showcasing verified portfolios, skills, and CVs.',
      descAr:
        'دليل للمواهب العراقية في التصميم والبرمجة مع عرض الأعمال والسير الذاتية والروابط الخارجية.',
      statusEn: 'Active Now',
      statusAr: 'متاح الآن',
      active: true,
      route: 'freelancers' as RouteKey,
    },
    {
      num: '03',
      titleEn: 'Creative Community',
      titleAr: 'المجتمع الإبداعي',
      descEn:
        'Text discussions, design polls, and moderated peer knowledge sharing across Iraq.',
      descAr:
        'منشورات نقاشية واستطلاعات رأي وتبادل خبرات خاضع للإشراف بين المبدعين في العراق.',
      statusEn: 'Future Module',
      statusAr: 'وحدة مستقبلية',
      active: false,
      route: 'community' as RouteKey,
    },
    {
      num: '04',
      titleEn: 'Academy & Events',
      titleAr: 'الأكاديمية والفعاليات',
      descEn:
        'Structured workshops, instructor-led courses, and local Baghdad, Basra, and Erbil meetups.',
      descAr:
        'دورات تدريبية متخصصة ولقاءات حضورية وورش عمل في بغداد والبصرة وأربيل.',
      statusEn: 'Future Module',
      statusAr: 'وحدة مستقبلية',
      active: false,
      route: 'community' as RouteKey,
    },
  ];

  return (
    <div className="bg-white">
      {/* Hero Section: Deep Black + Faceted Crimson Shard */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-12">
        <div className="relative overflow-hidden rounded-3xl bg-[#0b0b0d] text-white px-6 py-12 sm:px-12 sm:py-16 lg:px-16 lg:py-20">
          {/* Geometric crimson polygon referencing the uploaded prototype & mark */}
          <div
            aria-hidden="true"
            className="hidden sm:block absolute -top-12 end-[-40px] w-72 h-72 lg:w-96 lg:h-96 bg-[#d92735] circle-shard opacity-95 pointer-events-none"
          />
          <div
            aria-hidden="true"
            className="hidden lg:block absolute -bottom-24 end-32 w-56 h-56 bg-[#1b1b1f] circle-shard pointer-events-none"
          />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-8 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-white p-2 flex items-center justify-center shrink-0">
                  <CircleLogoMark className="w-full h-full" />
                </div>
                <div className="text-xs font-medium text-[#c9c9cd] tracking-wide">
                  {tText(
                    locale,
                    'CIRCLE.iq · Iraq’s Creative Platform',
                    'CIRCLE.iq · المنصة الإبداعية في العراق'
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.08] text-balance">
                  {locale === 'ar' ? (
                    <>
                      كل شيء يترابط<span className="text-[#d92735]">.</span>
                    </>
                  ) : (
                    <>
                      Everything connects<span className="text-[#d92735]">.</span>
                    </>
                  )}
                </h1>
                <p className="text-lg sm:text-xl font-semibold text-[#ff8a93]">
                  {tText(locale, COPY.brand.heroSubEn, COPY.brand.heroSubAr)}
                </p>
                <p className="text-sm sm:text-base text-[#c9c9cd] max-w-2xl leading-relaxed">
                  {tText(
                    locale,
                    COPY.brand.heroDescEn,
                    COPY.brand.heroDescAr
                  )}
                </p>
              </div>

              {/* Search + Primary CTAs */}
              <form
                onSubmit={handleSearchSubmit}
                className="max-w-xl flex flex-col sm:flex-row gap-2.5 pt-1"
              >
                <div className="flex-1 flex items-center gap-2.5 bg-[#1b1b1f] border border-white/15 rounded-xl px-4 h-12 focus-within:border-[#d92735]">
                  <Search className="w-4 h-4 text-[#c9c9cd] shrink-0" />
                  <input
                    type="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={tText(
                      locale,
                      COPY.nav.searchPlaceholder.en,
                      COPY.nav.searchPlaceholder.ar
                    )}
                    className="w-full bg-transparent text-sm text-white placeholder:text-[#8c8e96] focus:outline-none"
                  />
                </div>
                <CircleButton
                  type="submit"
                  variant="primary"
                  className="h-12 px-6"
                >
                  {tText(locale, 'Search', 'بحث')}
                </CircleButton>
              </form>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <CircleButton
                  variant="primary"
                  onClick={() => onNavigate('services')}
                >
                  <span>
                    {tText(
                      locale,
                      COPY.cta.exploreServices.en,
                      COPY.cta.exploreServices.ar
                    )}
                  </span>
                  <ArrowIcon className="w-4 h-4" />
                </CircleButton>
                <button
                  type="button"
                  onClick={() => onNavigate('freelancers')}
                  className="inline-flex items-center gap-2 min-h-[44px] px-5 py-2.5 rounded-xl border border-white/25 text-sm font-semibold text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  {tText(
                    locale,
                    COPY.cta.discoverFreelancers.en,
                    COPY.cta.discoverFreelancers.ar
                  )}
                </button>
              </div>
            </div>

            {/* Brand Slogan Anchor Card */}
            <div className="lg:col-span-4 hidden lg:block">
              <div className="rounded-2xl bg-[#1b1b1f]/90 border border-white/10 p-6 space-y-4">
                <div className="text-xs font-semibold text-[#ff8a93]">
                  {tText(locale, 'Brand Manifesto', 'رسالة المنصة')}
                </div>
                <p className="font-display text-2xl font-bold leading-snug text-white">
                  “{tText(locale, COPY.brand.sloganEn, COPY.brand.sloganAr)}”
                </p>
                <div className="pt-3 border-t border-white/10 text-xs text-[#c9c9cd] space-y-2">
                  <div className="flex items-center justify-between">
                    <span>
                      {tText(locale, 'Active Service Pillars', 'فئات الخدمات النشطة')}
                    </span>
                    <span className="font-mono-tabular text-white font-semibold">
                      {activeServices.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>
                      {tText(locale, 'Public Talent Profiles', 'ملفات المواهب المنشورة')}
                    </span>
                    <span className="font-mono-tabular text-white font-semibold">
                      {freelancers.filter((f) => f.visibility === 'public').length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Introduction: 4-Pillar Ecosystem Strategy */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10 border-t border-[#ececec]">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="text-xs font-semibold text-[#d92735] mb-1.5">
              {tText(
                locale,
                'Progressive Ecosystem Architecture',
                'بنية المنصة التدرجية'
              )}
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#0b0b0d] tracking-tight">
              {tText(
                locale,
                'Built for Iraq’s digital economy, released in clear phases.',
                'مصممة للاقتصاد الرقمي العراقي بإطلاق منهجي متدرج.'
              )}
            </h2>
          </div>
          <p className="text-sm text-[#5f6168] max-w-md">
            {tText(
              locale,
              COPY.roadmap.futureNoteEn,
              COPY.roadmap.futureNoteAr
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {pillars.map((pillar) => (
            <button
              key={pillar.num}
              type="button"
              onClick={() => onNavigate(pillar.route)}
              className="text-start rounded-2xl border border-[#ececec] bg-white p-5 hover:border-[#0b0b0d]/30 transition-colors flex flex-col justify-between gap-5 cursor-pointer"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono-tabular font-semibold text-[#5f6168]">
                    {pillar.num}.
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 font-semibold ${
                      pillar.active ? 'text-[#14663d]' : 'text-[#5f6168]'
                    }`}
                  >
                    {pillar.active ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <Lock className="w-3.5 h-3.5" />
                    )}
                    {tText(locale, pillar.statusEn, pillar.statusAr)}
                  </span>
                </div>
                <h3 className="font-display text-lg font-bold text-[#0b0b0d]">
                  {tText(locale, pillar.titleEn, pillar.titleAr)}
                </h3>
                <p className="text-sm text-[#5f6168] leading-relaxed">
                  {tText(locale, pillar.descEn, pillar.descAr)}
                </p>
              </div>
              <div className="text-xs font-semibold text-[#d92735] inline-flex items-center gap-1">
                <span>
                  {pillar.active
                    ? tText(locale, 'Open module', 'فتح القسم')
                    : tText(locale, 'View roadmap', 'عرض الخطة')}
                </span>
                <ArrowIcon className="w-3.5 h-3.5" />
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Featured Services Grid (6 Core Categories) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 border-t border-[#ececec]">
        <div className="flex items-end justify-between gap-4 mb-8">
          <div>
            <div className="text-xs font-semibold text-[#d92735] mb-1.5">
              {tText(locale, 'CIRCLE Services', 'خدمات سيركل')}
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#0b0b0d] tracking-tight">
              {tText(
                locale,
                'Explore digital service categories',
                'استكشف فئات الخدمات الرقمية'
              )}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('services')}
            className="text-sm font-semibold text-[#d92735] hover:underline underline-offset-4 whitespace-nowrap shrink-0 cursor-pointer"
          >
            {tText(locale, 'All services', 'كل الخدمات')}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {activeServices.map((svc, idx) => (
            <button
              key={svc.id}
              type="button"
              onClick={() => onNavigate('service-details', svc.slug)}
              className="text-start rounded-2xl border border-[#ececec] bg-white p-5 hover:border-[#d92735]/50 transition-colors flex flex-col gap-4 cursor-pointer"
            >
              <div
                className="h-24 rounded-xl flex items-end p-3.5"
                style={{ backgroundColor: svc.tintHex }}
              >
                <span
                  className={`font-mono-tabular text-xs font-semibold ${
                    svc.tintHex === '#0b0b0d' ? 'text-white/80' : 'text-[#0b0b0d]/70'
                  }`}
                >
                  0{idx + 1}
                </span>
              </div>
              <div className="space-y-1.5 flex-1">
                <h3 className="font-display text-lg font-bold text-[#0b0b0d]">
                  {tText(locale, svc.titleEn, svc.titleAr)}
                </h3>
                <p className="text-sm text-[#5f6168] leading-relaxed">
                  {tText(locale, svc.descriptionEn, svc.descriptionAr)}
                </p>
              </div>
              <div className="pt-3 border-t border-[#ececec] flex items-center justify-between text-xs">
                <span className="text-[#5f6168]">
                  {tText(locale, 'Custom project scope', 'تسعير حسب نطاق المشروع')}
                </span>
                <span className="font-semibold text-[#d92735] inline-flex items-center gap-1">
                  {tText(locale, 'Details', 'التفاصيل')}
                  <ArrowIcon className="w-3.5 h-3.5" />
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Featured Freelancers & Portfolios */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 border-t border-[#ececec]">
        <div className="flex items-end justify-between gap-4 mb-8">
          <div>
            <div className="text-xs font-semibold text-[#d92735] mb-1.5">
              {tText(locale, 'The People Behind the Work', 'المبدعون خلف الأعمال')}
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#0b0b0d] tracking-tight">
              {tText(
                locale,
                'Discover verified Iraqi talent',
                'اكتشف المواهب العراقية الموثوقة'
              )}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('freelancers')}
            className="text-sm font-semibold text-[#d92735] hover:underline underline-offset-4 whitespace-nowrap shrink-0 cursor-pointer"
          >
            {tText(locale, 'Browse directory', 'تصفح الدليل')}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {publicFreelancers.map((fl) => {
            const pSpec = resolvePrimarySpecialtyLabel(fl, taxonomy, locale);
            const sSpecs = resolveSecondarySpecialtyLabels(fl, taxonomy, locale);
            return (
              <button
                key={fl.id}
                type="button"
                onClick={() => onNavigate('freelancer-profile', fl.username)}
                className="text-start rounded-2xl border border-[#ececec] bg-white p-5 hover:border-[#0b0b0d]/30 transition-colors flex flex-col gap-4 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-full font-display font-bold text-base flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: fl.avatarTint,
                      color: fl.avatarColor,
                    }}
                  >
                    {tText(locale, fl.nameEn, fl.nameAr).charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 font-semibold text-sm text-[#0b0b0d] truncate">
                      <span className="truncate">
                        {tText(locale, fl.nameEn, fl.nameAr)}
                      </span>
                      <VerificationBadge tier={fl.verificationTier} locale={locale} />
                    </div>
                    <div className="text-xs text-[#AC3333] font-medium truncate">
                      {pSpec.label}{' '}
                      <span className="text-[#5f6168] font-normal">
                        · {tText(locale, fl.cityEn, fl.cityAr)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Minimal Secondary Specialty Tags & follower count */}
                <div className="flex items-center justify-between gap-2 text-xs text-[#5f6168]">
                  <div className="flex flex-wrap gap-1 min-w-0">
                    {sSpecs.map((tag) => (
                      <span
                        key={tag.id}
                        className="px-2 py-0.5 text-[10px] rounded border border-[#050507]/15 text-[#5A5A60] bg-white truncate"
                      >
                        {tag.label}
                      </span>
                    ))}
                  </div>
                  <span className="font-mono-tabular text-[#0b0b0d] font-medium shrink-0">
                    {fl.followersCount} {tText(locale, 'followers', 'متابع')}
                  </span>
                </div>

                {/* 3-tile work showcase preserving prototype motif */}
                <div className="grid grid-cols-3 gap-2">
                  {fl.portfolio.slice(0, 3).map((work) => (
                    <div
                      key={work.id}
                      className="h-16 rounded-lg p-2 flex items-end text-[10px] font-semibold text-white leading-tight"
                      style={{ backgroundColor: work.swatchHex }}
                    >
                      <span className="truncate">
                        {tText(locale, work.titleEn, work.titleAr)}
                      </span>
                    </div>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Connected Ecosystem Callout (Mobile App + Admin Governance) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 border-t border-[#ececec]">
        <div className="rounded-2xl border border-[#f6d3d6] bg-[#fdf1f2] p-6 sm:p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="text-xs font-semibold text-[#d92735]">
              {tText(
                locale,
                'One Identity · Web, Mobile & Admin',
                'هوية موحدة · الويب والموبايل ولوحة الإدارة'
              )}
            </div>
            <h2 className="font-display text-2xl font-bold text-[#0b0b0d]">
              {tText(
                locale,
                'Preview the CIRCLE Mobile Experience & Operations Console',
                'عاين تطبيق الموبايل التفاعلي ولوحة تحكم العمليات'
              )}
            </h2>
            <p className="text-sm text-[#5f6168] leading-relaxed">
              {tText(
                locale,
                'Service requests, user accounts, and portfolio updates stay synchronized across the responsive website, mobile app prototype, and role-protected admin console.',
                'تبقى طلبات الخدمات وحسابات المستخدمين ومعارض الأعمال متزامنة عبر الموقع المتجاوب وتطبيق الموبايل ولوحة الإدارة المحمية بالصلاحيات.'
              )}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <CircleButton
              variant="primary"
              onClick={() => onNavigate('mobile-app')}
            >
              <Smartphone className="w-4 h-4" />
              <span>
                {tText(locale, 'Open Mobile Preview', 'فتح تطبيق الموبايل')}
              </span>
            </CircleButton>
            <CircleButton
              variant="ghost"
              onClick={() => onNavigate('register')}
            >
              {tText(locale, COPY.cta.createAccount.en, COPY.cta.createAccount.ar)}
            </CircleButton>
          </div>
        </div>
      </section>
    </div>
  );
};
