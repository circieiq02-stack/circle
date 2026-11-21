import React, { useMemo, useState } from 'react';
import {
  ArrowUpRight,
  Briefcase,
  Building2,
  Check,
  ChevronRight,
  Download,
  FileText,
  Globe,
  Heart,
  Home as HomeIcon,
  Layers,
  Lock,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  Play,
  Search,
  Settings as SettingsIcon,
  Shield,
  Sparkles,
  User as UserIcon,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import type {
  CompanyProfile,
  FreelancerProfile,
  FreelancerTweet,
  UserAccount,
  JobPost,
  Locale,
  RouteKey,
  SubscriptionPlanMode,
  TaxonomyDatabase,
} from '../types/circle';
import { TweetsSection } from '../components/TweetsSection';
import { PLUS_PLANS } from '../data/circleData';
import { tText } from '../i18n/translations';
import {
  CircleLogoMark,
  VerificationBadge,
} from '../components/design-system/Primitives';
import {
  getSortedVisibleCategories,
  matchesCreatorFilters,
  resolvePrimarySpecialtyLabel,
  resolveSecondarySpecialtyLabels,
} from '../utils/taxonomyHelpers';

interface MobileAppPreviewProps {
  locale: Locale;
  freelancers: FreelancerProfile[];
  taxonomy: TaxonomyDatabase;
  companies: CompanyProfile[];
  jobs: JobPost[];
  followedIds: string[];
  appliedJobIds: string[];
  planMode: SubscriptionPlanMode;
  onChangePlanMode: (mode: SubscriptionPlanMode) => void;
  onToggleFollow: (freelancerId: string) => void;
  tweets: FreelancerTweet[];
  currentUser: UserAccount | null;
  onPostTweet: (freelancerId: string, text: string) => void;
  onDeleteTweet: (tweetId: string) => void;
  onToggleTweetLike: (tweetId: string) => void;
  onCommentTweet: (tweetId: string, text: string) => void;
  onApplyJob: (jobId: string) => void;
  onToggleLocale: () => void;
  onNavigate: (route: RouteKey, param?: string) => void;
}

type ShowcaseView = 'concept' | 'ecosystem';
type ProfileTab = 'portfolio' | 'cv' | 'posts' | 'videos' | 'services' | 'files';

const IosStatusBar: React.FC = () => (
  <div className="px-6 pt-3 pb-1.5 flex items-center justify-between text-[11px] font-semibold text-[#0b0b0d] select-none shrink-0 relative">
    <span>9:41</span>
    {/* Dynamic Island */}
    <div
      aria-hidden="true"
      className="w-24 h-5 bg-[#0b0b0d] rounded-full mx-auto"
    />
    <div className="flex items-center gap-1" aria-hidden="true">
      <span className="flex items-end gap-[1.5px] h-2.5">
        <span className="w-[2px] h-1 bg-[#0b0b0d] rounded-xs" />
        <span className="w-[2px] h-1.5 bg-[#0b0b0d] rounded-xs" />
        <span className="w-[2px] h-2 bg-[#0b0b0d] rounded-xs" />
        <span className="w-[2px] h-2.5 bg-[#0b0b0d] rounded-xs" />
      </span>
      <span className="w-4 h-2.5 border border-[#0b0b0d] rounded-[3px] p-[1.5px] inline-flex items-center">
        <span className="w-full h-full bg-[#0b0b0d] rounded-[1px]" />
      </span>
    </div>
  </div>
);

const MobileBrandTopBar: React.FC<{
  locale: Locale;
  rightIcon: React.ReactNode;
}> = ({ locale, rightIcon }) => (
  <div className="px-5 py-2.5 flex items-center justify-between shrink-0 bg-white">
    <div className="flex items-center gap-2">
      <CircleLogoMark className="w-7 h-7" />
      <div className="leading-tight">
        <div className="font-display text-xs font-extrabold tracking-tight text-[#0b0b0d]">
          CIRCLE.IQ
        </div>
        <div className="text-[8px] font-medium tracking-wider uppercase text-[#5A5A60]">
          {tText(locale, "IRAQ'S CREATIVE PLATFORM", 'المنصة الإبداعية في العراق')}
        </div>
      </div>
    </div>
    <div className="text-[#5A5A60]">{rightIcon}</div>
  </div>
);

const MobileBottomNav: React.FC<{
  locale: Locale;
  active: 'home' | 'services' | 'freelancers' | 'profile';
}> = ({ locale, active }) => {
  const items = [
    { key: 'home', en: 'Home', ar: 'الرئيسية', Icon: HomeIcon },
    { key: 'services', en: 'Services', ar: 'الخدمات', Icon: Briefcase },
    { key: 'freelancers', en: 'Freelancers', ar: 'المبدعون', Icon: Users },
    { key: 'profile', en: 'Profile', ar: 'حسابي', Icon: UserIcon },
  ] as const;

  return (
    <div className="border-t border-[#ececec] bg-white pt-2 pb-2 px-3 shrink-0">
      <div className="grid grid-cols-4 gap-1">
        {items.map(({ key, en, ar, Icon }) => {
          const isActive = active === key;
          return (
            <div
              key={key}
              className={`flex flex-col items-center gap-0.5 py-0.5 ${
                isActive ? 'text-[#AC3333]' : 'text-[#5A5A60]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[9px] font-semibold">
                {tText(locale, en, ar)}
              </span>
            </div>
          );
        })}
      </div>
      <div className="w-24 h-1 bg-[#0b0b0d]/85 rounded-full mx-auto mt-2" />
    </div>
  );
};

export const MobileAppPreview: React.FC<MobileAppPreviewProps> = ({
  locale,
  freelancers,
  taxonomy,
  companies,
  jobs,
  followedIds,
  appliedJobIds,
  planMode,
  onChangePlanMode,
  onToggleFollow,
  tweets,
  currentUser,
  onPostTweet,
  onDeleteTweet,
  onToggleTweetLike,
  onCommentTweet,
  onApplyJob,
  onToggleLocale,
  onNavigate,
}) => {
  const [showcaseView, setShowcaseView] = useState<ShowcaseView>('concept');
  const [selectedProfileId, setSelectedProfileId] = useState<string>(
    freelancers[0]?.id || 'fl-1'
  );
  const [mobileSearch, setMobileSearch] = useState('');
  const [mobileCategoryId, setMobileCategoryId] = useState<string>('all');
  const [profileTab, setProfileTab] = useState<ProfileTab>('portfolio');
  const [pollChoice, setPollChoice] = useState<'a' | 'b'>('a');
  const [selectedPlanId, setSelectedPlanId] = useState<'1m' | '6m' | '1y'>('1y');
  const [specialtyFilter, setSpecialtyFilter] = useState<string>('all');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(
    companies[0]?.id || 'cmp-nahrain'
  );

  const visibleCategories = useMemo(
    () => getSortedVisibleCategories(taxonomy).filter((c) => !c.isOther),
    [taxonomy]
  );

  const activeProfile =
    freelancers.find((f) => f.id === selectedProfileId) ?? freelancers[0];
  const isProfileFollowing = followedIds.includes(activeProfile.id);
  const isFreeLocked = planMode === 'free';

  const effectiveProfileTier =
    activeProfile.verificationTier === 'notable'
      ? 'notable'
      : planMode === 'free'
        ? 'none'
        : 'subscriber';

  const filteredMobileCreators = freelancers.filter((fl) =>
    matchesCreatorFilters(fl, taxonomy, {
      categoryId: mobileCategoryId,
      specialtyId: 'all',
      query: mobileSearch,
    })
  );

  const primarySpec = resolvePrimarySpecialtyLabel(activeProfile, taxonomy, locale);
  const secondarySpecs = resolveSecondarySpecialtyLabels(
    activeProfile,
    taxonomy,
    locale
  );

  const activeCompany =
    companies.find((c) => c.id === selectedCompanyId) ?? companies[0];
  const filteredJobs = jobs.filter(
    (job) => specialtyFilter === 'all' || job.specialtyKey === specialtyFilter
  );

  const pollPercentA = pollChoice === 'a' ? 68 : 65;
  const pollPercentB = 100 - pollPercentA;

  return (
    <div className="bg-[#F6F4F1] min-h-screen text-[#0b0b0d]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-8 space-y-8">
        {/* Concept Presentation Header — Matches uploaded image.png vibe */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-6 border-b border-[#E5E2DC]">
          <div className="space-y-1">
            <div className="text-[11px] font-semibold tracking-widest uppercase text-[#AC3333]">
              {tText(
                locale,
                'CIRCLE.IQ · MOBILE PRODUCT CONCEPT',
                'CIRCLE.IQ · مفهوم تطبيق الموبايل'
              )}
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#0b0b0d] tracking-tight">
              {tText(locale, 'Everything connects.', 'كل شيء يترابط.')}
            </h1>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <span className="text-xs text-[#5A5A60]">
              {tText(
                locale,
                'Four connected screens · Designed for Iraq',
                'أربع شاشات مترابطة · مصممة للعراق'
              )}
            </span>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onToggleLocale}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#ececec] bg-white text-xs font-semibold text-[#0b0b0d] hover:border-[#0b0b0d]/40 cursor-pointer"
              >
                <Globe className="w-3.5 h-3.5 text-[#AC3333]" />
                <span>{locale === 'ar' ? 'EN' : 'العربية'}</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('freelancers')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#ececec] bg-white text-xs font-semibold text-[#0b0b0d] hover:border-[#0b0b0d]/40 cursor-pointer"
              >
                <Users className="w-3.5 h-3.5 text-[#AC3333]" />
                <span>{tText(locale, 'Gallery', 'معرض المبدعين')}</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('admin')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0b0b0d] text-white text-xs font-semibold hover:bg-[#1B1B1F] cursor-pointer"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>{tText(locale, 'Admin', 'الإدارة')}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Minimal View & Trial Simulator Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-white border border-[#ececec]">
            <button
              type="button"
              onClick={() => setShowcaseView('concept')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                showcaseView === 'concept'
                  ? 'bg-[#0b0b0d] text-white'
                  : 'text-[#5A5A60] hover:text-[#0b0b0d]'
              }`}
            >
              {tText(locale, '01–04 Concept Screens', 'الشاشات ٠١–٠٤')}
            </button>
            <button
              type="button"
              onClick={() => setShowcaseView('ecosystem')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                showcaseView === 'ecosystem'
                  ? 'bg-[#0b0b0d] text-white'
                  : 'text-[#5A5A60] hover:text-[#0b0b0d]'
              }`}
            >
              {tText(locale, 'Plus, Companies & Badges', 'بلس، الشركات والتوثيق')}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-medium text-[#5A5A60] me-1">
              {tText(locale, 'Account Mode:', 'حالة الحساب:')}
            </span>
            {(
              [
                ['trial', '2-Month Free Trial', 'فترة مجانية شهرين'],
                ['free', 'Free (Locked)', 'مجاني (مقفل)'],
                ['plus', 'Plus Verified', 'مشترك بلس'],
              ] as const
            ).map(([mode, en, ar]) => (
              <button
                key={mode}
                type="button"
                onClick={() => onChangePlanMode(mode)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors cursor-pointer ${
                  planMode === mode
                    ? 'border-[#AC3333] text-[#AC3333] bg-white'
                    : 'border-[#ececec] text-[#5A5A60] bg-white hover:border-[#0b0b0d]/30'
                }`}
              >
                {tText(locale, en, ar)}
              </button>
            ))}
          </div>
        </div>

        {/* ============================================================== */}
        {/* DEFAULT: 4 CONNECTED IPHONE CONCEPT SCREENS (MATCHING IMAGE)    */}
        {/* ============================================================== */}
        {showcaseView === 'concept' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-start">
            {/* ---------------------------------------------------------- */}
            {/* 01 / HOME & COMMUNITY                                       */}
            {/* ---------------------------------------------------------- */}
            <div className="w-full max-w-[330px] mx-auto space-y-2.5">
              <div className="flex items-center justify-between text-[10px] font-mono-tabular tracking-wider uppercase px-1">
                <span className="font-semibold text-[#AC3333]">
                  01 /{' '}
                  <span className="text-[#5A5A60]">
                    {tText(locale, 'HOME & COMMUNITY', 'الرئيسية والمجتمع')}
                  </span>
                </span>
                <span className="text-[#5A5A60]">01—04</span>
              </div>

              <div className="h-[670px] bg-white rounded-[42px] border-[6px] border-[#0b0b0d] shadow-xl flex flex-col overflow-hidden">
                <IosStatusBar />
                <MobileBrandTopBar
                  locale={locale}
                  rightIcon={<Search className="w-4 h-4" />}
                />

                <div className="flex-1 overflow-y-auto mobile-scroll px-4 py-2 space-y-3">
                  {/* Welcome Row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-[#FBF3F3] text-[#AC3333] font-display font-bold text-sm flex items-center justify-center">
                        Z
                      </div>
                      <div>
                        <div className="text-[10px] text-[#5A5A60]">
                          {tText(locale, 'Good morning', 'صباح الخير')}
                        </div>
                        <div className="text-sm font-bold text-[#0b0b0d]">
                          {tText(locale, 'Welcome, Zahraa', 'أهلاً، زهراء')}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-medium text-[#AC3333]">
                      · {tText(locale, 'Online', 'متصل')}
                    </span>
                  </div>

                  {/* Search Field */}
                  <div className="flex items-center gap-2 bg-[#F6F4F1]/70 border border-[#ececec] rounded-xl px-3 h-9 text-[11px] text-[#5A5A60]">
                    <Search className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {tText(
                        locale,
                        'Search ideas, talent and services',
                        'ابحث عن أفكار ومواهب وخدمات'
                      )}
                    </span>
                  </div>

                  {/* Community Post & Poll */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#0b0b0d]">
                        {tText(locale, 'Community', 'المجتمع')}
                      </span>
                      <span className="text-[10px] font-semibold text-[#AC3333]">
                        {tText(locale, 'See all', 'الكل')}
                      </span>
                    </div>

                    <div className="rounded-xl border border-[#ececec] bg-[#F6F4F1]/50 px-3 py-2 flex items-center gap-2 text-[10px] text-[#5A5A60]">
                      <span className="w-5 h-5 rounded-full bg-[#FBF3F3] text-[#AC3333] font-bold flex items-center justify-center text-[9px]">
                        Z
                      </span>
                      <span>
                        {tText(
                          locale,
                          'Share something with the community...',
                          'شارك شيئاً مع المجتمع...'
                        )}
                      </span>
                    </div>

                    <div className="rounded-2xl border border-[#ececec] bg-white p-3 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-[#F6F4F1] text-[#0b0b0d] font-bold text-[11px] flex items-center justify-center">
                            M
                          </div>
                          <div>
                            <div className="flex items-center gap-1 text-[11px] font-bold text-[#0b0b0d]">
                              <span>
                                {tText(locale, 'Mustafa Jabbar', 'مصطفى جبار')}
                              </span>
                              <VerificationBadge tier="subscriber" locale={locale} />
                            </div>
                            <div className="text-[9px] text-[#5A5A60]">
                              {tText(
                                locale,
                                'Web Developer · Basra · 2h',
                                'مطور مواقع · البصرة · ٢س'
                              )}
                            </div>
                          </div>
                        </div>
                        <MoreHorizontal className="w-3.5 h-3.5 text-[#5A5A60]" />
                      </div>

                      <p className="text-[11px] text-[#0b0b0d] leading-snug">
                        {tText(
                          locale,
                          'I wrapped up a new short-form edit today. What helps a local brand feel memorable online?',
                          'أنهيت مشروعاً جديداً اليوم. ما الذي يجعل العلامة التجارية المحلية لا تُنسى؟'
                        )}
                      </p>

                      <div className="space-y-1.5">
                        <button
                          type="button"
                          onClick={() => setPollChoice('a')}
                          className={`w-full rounded-xl border px-2.5 py-1.5 flex items-center justify-between text-[10px] cursor-pointer ${
                            pollChoice === 'a'
                              ? 'border-[#AC3333]/40 bg-[#FBF3F3]/60 font-semibold'
                              : 'border-[#ececec] bg-white'
                          }`}
                        >
                          <span>
                            {tText(
                              locale,
                              'A clear visual identity',
                              'هوية بصرية واضحة'
                            )}
                          </span>
                          <span className="font-mono-tabular font-bold text-[#AC3333]">
                            {pollPercentA}%
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPollChoice('b')}
                          className={`w-full rounded-xl border px-2.5 py-1.5 flex items-center justify-between text-[10px] cursor-pointer ${
                            pollChoice === 'b'
                              ? 'border-[#AC3333]/40 bg-[#FBF3F3]/60 font-semibold'
                              : 'border-[#ececec] bg-white'
                          }`}
                        >
                          <span>
                            {tText(
                              locale,
                              'Consistent storytelling',
                              'سرد قصصي متسق'
                            )}
                          </span>
                          <span className="font-mono-tabular font-bold text-[#AC3333]">
                            {pollPercentB}%
                          </span>
                        </button>
                      </div>

                      <div className="flex items-center justify-between pt-1 text-[9px] text-[#5A5A60] border-t border-[#ececec]">
                        <span>{tText(locale, '18 likes', '١٨ إعجاب')}</span>
                        <span>{tText(locale, '6 comments', '٦ تعليقات')}</span>
                        <span>{tText(locale, 'Save', 'حفظ')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Featured Services */}
                  <div className="space-y-2 pb-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#0b0b0d]">
                        {tText(locale, 'Featured services', 'الخدمات المميزة')}
                      </span>
                      <button
                        type="button"
                        onClick={() => onNavigate('services')}
                        className="text-[10px] font-semibold text-[#AC3333] cursor-pointer"
                      >
                        {tText(locale, 'Explore', 'استكشف')}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-xl border border-[#ececec] p-2.5 space-y-1.5">
                        <div className="h-10 rounded-lg bg-[#FBF3F3] flex items-center justify-center text-[#AC3333]">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <div className="text-[10px] font-bold text-[#0b0b0d]">
                          {tText(locale, 'Brand identity', 'الهوية البصرية')}
                        </div>
                        <div className="text-[9px] text-[#5A5A60]">
                          {tText(locale, 'From 150,000 IQD', 'من ١٥٠,٠٠٠ د.ع')}
                        </div>
                      </div>
                      <div className="rounded-xl border border-[#ececec] p-2.5 space-y-1.5">
                        <div className="h-10 rounded-lg bg-[#F1F1F4] flex items-center justify-center text-[#0b0b0d]">
                          <Layers className="w-4 h-4" />
                        </div>
                        <div className="text-[10px] font-bold text-[#0b0b0d]">
                          {tText(locale, 'Web development', 'تطوير المواقع')}
                        </div>
                        <div className="text-[9px] text-[#5A5A60]">
                          {tText(locale, 'From 250,000 IQD', 'من ٢٥٠,٠٠٠ د.ع')}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <MobileBottomNav locale={locale} active="home" />
              </div>
            </div>

            {/* ---------------------------------------------------------- */}
            {/* 02 / SERVICES                                               */}
            {/* ---------------------------------------------------------- */}
            <div className="w-full max-w-[330px] mx-auto space-y-2.5">
              <div className="flex items-center justify-between text-[10px] font-mono-tabular tracking-wider uppercase px-1">
                <span className="font-semibold text-[#AC3333]">
                  02 /{' '}
                  <span className="text-[#5A5A60]">
                    {tText(locale, 'SERVICES', 'الخدمات')}
                  </span>
                </span>
                <span className="text-[#5A5A60]">02—04</span>
              </div>

              <div className="h-[670px] bg-white rounded-[42px] border-[6px] border-[#0b0b0d] shadow-xl flex flex-col overflow-hidden">
                <IosStatusBar />
                <MobileBrandTopBar
                  locale={locale}
                  rightIcon={<Globe className="w-4 h-4" />}
                />

                <div className="flex-1 overflow-y-auto mobile-scroll px-4 py-2 space-y-3">
                  <div>
                    <div className="text-[9px] font-bold tracking-wider uppercase text-[#AC3333]">
                      {tText(locale, 'WHAT DO YOU NEED?', 'ماذا تحتاج اليوم؟')}
                    </div>
                    <h3 className="font-display text-xl font-bold text-[#0b0b0d] leading-tight mt-0.5">
                      {tText(
                        locale,
                        'Find your next creative partner.',
                        'اعثر على شريكك الإبداعي القادم.'
                      )}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 bg-[#F6F4F1]/70 border border-[#ececec] rounded-xl px-3 h-9 text-[11px] text-[#5A5A60]">
                    <Search className="w-3.5 h-3.5 shrink-0" />
                    <span>{tText(locale, 'Search services', 'ابحث في الخدمات')}</span>
                  </div>

                  {/* Dark Featured Card */}
                  <button
                    type="button"
                    onClick={() => onNavigate('services')}
                    className="w-full text-start rounded-2xl bg-[#0b0b0d] text-white p-4 space-y-2 relative overflow-hidden cursor-pointer"
                  >
                    <div className="text-[9px] font-mono-tabular text-white/60 uppercase tracking-wider">
                      {tText(locale, 'CIRCLE SERVICES / 2026', 'خدمات سيركل / ٢٠٢٦')}
                    </div>
                    <div className="font-display text-base font-bold leading-snug max-w-[190px]">
                      {tText(
                        locale,
                        'Good ideas deserve great people.',
                        'الأفكار الجيدة تستحق من ينفذها بإتقان.'
                      )}
                    </div>
                    <div className="text-[10px] text-white/65 flex items-center justify-between pt-1">
                      <span>
                        {tText(
                          locale,
                          'Find trusted Iraqi talent for your next big move.',
                          'اكتشف مواهب عراقية موثوقة لمشروعك القادم.'
                        )}
                      </span>
                      <span className="w-6 h-6 rounded-full border border-white/25 flex items-center justify-center shrink-0">
                        <ArrowUpRight className="w-3 h-3" />
                      </span>
                    </div>
                  </button>

                  {/* 2x2 Explore Categories */}
                  <div className="space-y-2 pb-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold text-[#0b0b0d]">
                        {tText(locale, 'Explore categories', 'استكشف الفئات')}
                      </span>
                      <span className="font-mono-tabular text-[#5A5A60]">
                        06 {tText(locale, 'CATEGORIES', 'فئات')}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {[
                        {
                          en: 'Website Development',
                          ar: 'تطوير المواقع',
                          subEn: 'Sites, stores & platforms',
                          subAr: 'مواقع ومنصات متكاملة',
                          tint: '#FBF3F3',
                        },
                        {
                          en: 'Mobile App Development',
                          ar: 'تطبيقات الموبايل',
                          subEn: 'iOS & Android apps',
                          subAr: 'تطبيقات iOS و Android',
                          tint: '#F1F2F6',
                        },
                        {
                          en: 'UI/UX Design',
                          ar: 'تصميم الواجهات',
                          subEn: 'Research & product design',
                          subAr: 'أبحاث وتصميم المنتجات',
                          tint: '#F0F4F1',
                        },
                        {
                          en: 'Graphic Design',
                          ar: 'التصميم الجرافيكي',
                          subEn: 'Campaigns & identity',
                          subAr: 'هويات وحملات بصرية',
                          tint: '#F7F3EA',
                        },
                      ].map((item) => (
                        <button
                          key={item.en}
                          type="button"
                          onClick={() => onNavigate('services')}
                          className="text-start rounded-2xl border border-[#ececec] bg-white p-3 space-y-2 hover:border-[#0b0b0d]/30 cursor-pointer"
                        >
                          <div
                            className="w-8 h-8 rounded-xl flex items-center justify-center text-[#AC3333]"
                            style={{ backgroundColor: item.tint }}
                          >
                            <Layers className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-[11px] font-bold text-[#0b0b0d] leading-tight">
                              {tText(locale, item.en, item.ar)}
                            </div>
                            <div className="text-[9px] text-[#5A5A60] mt-0.5">
                              {tText(locale, item.subEn, item.subAr)}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <MobileBottomNav locale={locale} active="services" />
              </div>
            </div>

            {/* ---------------------------------------------------------- */}
            {/* 03 / FREELANCERS (WITH TWO-LEVEL CLASSIFICATION + FILTERS)  */}
            {/* ---------------------------------------------------------- */}
            <div className="w-full max-w-[330px] mx-auto space-y-2.5">
              <div className="flex items-center justify-between text-[10px] font-mono-tabular tracking-wider uppercase px-1">
                <span className="font-semibold text-[#AC3333]">
                  03 /{' '}
                  <span className="text-[#5A5A60]">
                    {tText(locale, 'FREELANCERS', 'المبدعون')}
                  </span>
                </span>
                <span className="text-[#5A5A60]">03—04</span>
              </div>

              <div className="h-[670px] bg-white rounded-[42px] border-[6px] border-[#0b0b0d] shadow-xl flex flex-col overflow-hidden">
                <IosStatusBar />
                <MobileBrandTopBar
                  locale={locale}
                  rightIcon={<Heart className="w-4 h-4" />}
                />

                <div className="flex-1 overflow-y-auto mobile-scroll px-4 py-2 space-y-2.5">
                  <div>
                    <div className="text-[9px] font-bold tracking-wider uppercase text-[#AC3333]">
                      {tText(locale, 'THE PEOPLE BEHIND THE WORK', 'المبدعون خلف الأعمال')}
                    </div>
                    <h3 className="font-display text-xl font-bold text-[#0b0b0d] leading-tight mt-0.5">
                      {tText(locale, 'Find your people.', 'اعثر على المواهب.')}
                    </h3>
                  </div>

                  {/* Trial Callout */}
                  <div className="rounded-2xl border border-[#AC3333]/25 bg-[#FBF8F8] p-2.5 flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-lg bg-[#AC3333] text-white flex items-center justify-center shrink-0 mt-0.5">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11px] font-bold text-[#0b0b0d]">
                        {tText(
                          locale,
                          'Your first 2 months are free',
                          'أول شهرين مجاناً'
                        )}
                      </div>
                      <div className="text-[9px] text-[#5A5A60] leading-tight mt-0.5">
                        {tText(
                          locale,
                          'Browse & hire directly or showcase your primary & secondary specialties.',
                          'تصفح المبدعين أو اعرض تخصصك الرئيسي والثانوي مجاناً.'
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Live Search */}
                  <div className="flex items-center gap-2 bg-[#F6F4F1]/70 border border-[#ececec] rounded-xl px-3 h-8">
                    <Search className="w-3.5 h-3.5 text-[#5A5A60] shrink-0" />
                    <input
                      type="search"
                      value={mobileSearch}
                      onChange={(e) => setMobileSearch(e.target.value)}
                      placeholder={tText(
                        locale,
                        'Search Iraqi freelancers',
                        'ابحث عن مبدع عراقي...'
                      )}
                      className="w-full bg-transparent text-[11px] focus:outline-none"
                    />
                  </div>

                  {/* Minimal Thin-Bordered Category Chips */}
                  <div className="flex items-center gap-1 overflow-x-auto pb-1">
                    <button
                      type="button"
                      onClick={() => setMobileCategoryId('all')}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-medium border whitespace-nowrap shrink-0 cursor-pointer ${
                        mobileCategoryId === 'all'
                          ? 'border-[#0b0b0d] bg-[#0b0b0d] text-white'
                          : 'border-[#ececec] bg-white text-[#5A5A60]'
                      }`}
                    >
                      {tText(locale, 'All talent', 'الكل')}
                    </button>
                    {visibleCategories.slice(0, 5).map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setMobileCategoryId(cat.id)}
                        className={`px-2.5 py-1 rounded-md text-[10px] font-medium border whitespace-nowrap shrink-0 cursor-pointer ${
                          mobileCategoryId === cat.id
                            ? 'border-[#AC3333] text-[#AC3333] bg-[#FBF8F8]'
                            : 'border-[#ececec] bg-white text-[#5A5A60]'
                        }`}
                      >
                        {tText(locale, cat.nameEn, cat.nameAr)}
                      </button>
                    ))}
                  </div>

                  {/* Popular This Week Cards */}
                  <div className="space-y-2 pb-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold text-[#0b0b0d]">
                        {tText(locale, 'Popular this week', 'الأكثر طلباً هذا الأسبوع')}
                      </span>
                      <button
                        type="button"
                        onClick={() => onNavigate('freelancers')}
                        className="font-semibold text-[#AC3333] cursor-pointer"
                      >
                        {tText(locale, 'See all', 'الكل')}
                      </button>
                    </div>

                    {filteredMobileCreators.slice(0, 3).map((fl) => {
                      const pSpec = resolvePrimarySpecialtyLabel(
                        fl,
                        taxonomy,
                        locale
                      );
                      const sSpecs = resolveSecondarySpecialtyLabels(
                        fl,
                        taxonomy,
                        locale
                      );
                      return (
                        <div
                          key={fl.id}
                          className="rounded-2xl border border-[#ececec] bg-white p-2.5 flex items-start gap-2.5"
                        >
                          <div
                            className="w-9 h-9 rounded-full font-display font-bold text-xs flex items-center justify-center shrink-0"
                            style={{
                              backgroundColor: fl.avatarTint,
                              color: fl.avatarColor,
                            }}
                          >
                            {tText(locale, fl.nameEn, fl.nameAr).charAt(0)}
                          </div>
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center justify-between gap-1">
                              <div className="flex items-center gap-1 text-[11px] font-bold text-[#0b0b0d] truncate">
                                <span className="truncate">
                                  {tText(locale, fl.nameEn, fl.nameAr)}
                                </span>
                                <VerificationBadge
                                  tier={fl.verificationTier}
                                  locale={locale}
                                />
                              </div>
                              <span className="text-[9px] font-mono-tabular text-[#5A5A60]">
                                ★ 4.9
                              </span>
                            </div>

                            {/* Primary specialty small label under name */}
                            <div className="text-[10px] font-medium text-[#AC3333] truncate">
                              {pSpec.label}{' '}
                              <span className="text-[#5A5A60] font-normal">
                                · {tText(locale, fl.cityEn, fl.cityAr).split(',')[0]}
                              </span>
                            </div>

                            {/* Minimal thin-bordered secondary tags */}
                            {sSpecs.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {sSpecs.map((tag) => (
                                  <span
                                    key={tag.id}
                                    className="px-1.5 py-0.5 text-[9px] rounded border border-[#050507]/15 text-[#5A5A60] bg-white"
                                  >
                                    {tag.label}
                                  </span>
                                ))}
                              </div>
                            )}

                            <button
                              type="button"
                              onClick={() => setSelectedProfileId(fl.id)}
                              className="text-[10px] font-semibold text-[#AC3333] inline-flex items-center gap-0.5 cursor-pointer pt-0.5"
                            >
                              <span>{tText(locale, 'View profile', 'عرض الملف')}</span>
                              <ArrowUpRight className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <MobileBottomNav locale={locale} active="freelancers" />
              </div>
            </div>

            {/* ---------------------------------------------------------- */}
            {/* 04 / PROFILE                                                */}
            {/* ---------------------------------------------------------- */}
            <div className="w-full max-w-[330px] mx-auto space-y-2.5">
              <div className="flex items-center justify-between text-[10px] font-mono-tabular tracking-wider uppercase px-1">
                <span className="font-semibold text-[#AC3333]">
                  04 /{' '}
                  <span className="text-[#5A5A60]">
                    {tText(locale, 'PROFILE', 'الملف الشخصي')}
                  </span>
                </span>
                <span className="text-[#5A5A60]">04—04</span>
              </div>

              <div className="h-[670px] bg-white rounded-[42px] border-[6px] border-[#0b0b0d] shadow-xl flex flex-col overflow-hidden">
                <IosStatusBar />
                <MobileBrandTopBar
                  locale={locale}
                  rightIcon={<MoreHorizontal className="w-4 h-4" />}
                />

                <div className="flex-1 overflow-y-auto mobile-scroll px-4 py-1.5 space-y-3">
                  {/* Dark Banner + Circular Avatar */}
                  <div>
                    <div className="h-20 rounded-2xl bg-[#0b0b0d] relative overflow-hidden">
                      <div
                        aria-hidden="true"
                        className="absolute -bottom-4 end-2 text-[64px] font-display font-extrabold text-white/[0.06] leading-none select-none"
                      >
                        C
                      </div>
                    </div>
                    <div className="px-2 -mt-7 flex items-end justify-between">
                      <div
                        className="w-14 h-14 rounded-full border-4 border-white font-display font-bold text-xl flex items-center justify-center relative z-10 shadow-xs"
                        style={{
                          backgroundColor: activeProfile.avatarTint,
                          color: activeProfile.avatarColor,
                        }}
                      >
                        {tText(
                          locale,
                          activeProfile.nameEn,
                          activeProfile.nameAr
                        ).charAt(0)}
                      </div>

                      <div className="flex items-center gap-1.5 pb-1">
                        <button
                          type="button"
                          onClick={() => onToggleFollow(activeProfile.id)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border cursor-pointer ${
                            isProfileFollowing
                              ? 'border-[#ececec] bg-white text-[#0b0b0d]'
                              : 'border-[#AC3333] bg-[#AC3333] text-white'
                          }`}
                        >
                          {isProfileFollowing
                            ? tText(locale, 'Following', 'متابَع')
                            : tText(locale, 'Follow', 'متابعة')}
                        </button>
                        <button
                          type="button"
                          onClick={() => onNavigate('settings')}
                          className="px-2.5 py-1 rounded-lg border border-[#ececec] bg-white text-[10px] font-semibold text-[#0b0b0d] cursor-pointer"
                        >
                          {tText(locale, 'Edit profile', 'تعديل')}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Name + Primary Specialty Label + Minimal Secondary Tags */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-base font-bold text-[#0b0b0d] truncate">
                        {tText(
                          locale,
                          activeProfile.nameEn,
                          activeProfile.nameAr
                        )}
                      </h3>
                      <VerificationBadge
                        tier={effectiveProfileTier}
                        locale={locale}
                      />
                    </div>
                    <div
                      dir="ltr"
                      className="inline-flex px-2 py-0.5 rounded bg-[#F6F4F1] text-[10px] font-semibold text-[#0b0b0d]"
                    >
                      @{activeProfile.username}
                    </div>
                    <div className="text-[11px] font-medium text-[#AC3333]">
                      {primarySpec.label}
                    </div>

                    {secondarySpecs.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {secondarySpecs.map((tag) => (
                          <span
                            key={tag.id}
                            className="px-2 py-0.5 text-[9px] font-medium rounded border border-[#050507]/15 text-[#5A5A60] bg-white"
                          >
                            {tag.label}
                          </span>
                        ))}
                      </div>
                    )}

                    <p className="text-[10px] text-[#5A5A60] leading-relaxed">
                      {tText(locale, activeProfile.bioEn, activeProfile.bioAr)}
                    </p>

                    <div className="flex items-center gap-3 text-[10px] text-[#5A5A60] pt-0.5">
                      <span>
                        <strong className="font-mono-tabular text-[#0b0b0d]">
                          {activeProfile.postsCount}
                        </strong>{' '}
                        {tText(locale, 'works', 'أعمال')}
                      </span>
                      <span>
                        <strong className="font-mono-tabular text-[#0b0b0d]">
                          {activeProfile.followersCount}
                        </strong>{' '}
                        {tText(locale, 'followers', 'متابع')}
                      </span>
                      <span>
                        <strong className="font-mono-tabular text-[#0b0b0d]">
                          {activeProfile.followingCount}
                        </strong>{' '}
                        {tText(locale, 'following', 'يتابع')}
                      </span>
                    </div>
                  </div>

                  {/* Clean Profile Underline Tabs */}
                  <div className="flex items-center gap-2.5 overflow-x-auto border-b border-[#ececec] text-[10px]">
                    {(
                      [
                        ['portfolio', 'Portfolio', 'الأعمال', false],
                        ['cv', 'CV', 'السيرة', false],
                        ['posts', 'Tweets', 'تغريدات', false],
                        ['videos', 'Videos', 'فيديو', true],
                        ['services', 'Services', 'خدمات', true],
                        ['files', 'Files', 'ملفات', true],
                      ] as const
                    ).map(([k, en, ar, plusOnly]) => {
                      const locked = plusOnly && isFreeLocked;
                      return (
                        <button
                          key={k}
                          type="button"
                          onClick={() => setProfileTab(k)}
                          className={`pb-1.5 border-b-2 font-semibold inline-flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer ${
                            profileTab === k
                              ? 'border-[#AC3333] text-[#0b0b0d]'
                              : 'border-transparent text-[#5A5A60]'
                          }`}
                        >
                          {locked && <Lock className="w-2.5 h-2.5 text-[#AC3333]" />}
                          <span>{tText(locale, en, ar)}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Tab Content */}
                  {profileTab === 'portfolio' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-bold text-[#0b0b0d]">
                        <span>{tText(locale, 'Selected work', 'أعمال مختارة')}</span>
                        <span className="text-[10px] text-[#AC3333]">
                          {tText(locale, 'View all', 'الكل')}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5">
                        {activeProfile.portfolio.slice(0, 3).map((w) => (
                          <div
                            key={w.id}
                            className="h-16 rounded-xl p-2 flex items-end text-[9px] font-bold text-white leading-tight"
                            style={{ backgroundColor: w.swatchHex }}
                          >
                            <span className="line-clamp-2">
                              {tText(locale, w.titleEn, w.titleAr)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {profileTab === 'posts' && (
                    <TweetsSection
                      compact
                      locale={locale}
                      profile={activeProfile}
                      tweets={tweets}
                      currentUser={currentUser}
                      onPost={onPostTweet}
                      onDelete={onDeleteTweet}
                      onToggleLike={onToggleTweetLike}
                      onComment={onCommentTweet}
                      onRequireLogin={() => onNavigate('login')}
                    />
                  )}

                  {profileTab === 'cv' && (
                    <div className="rounded-xl border border-[#ececec] p-2.5 space-y-1.5 text-[10px]">
                      <div className="flex justify-between">
                        <span className="text-[#5A5A60]">
                          {tText(locale, 'Primary', 'التخصص')}
                        </span>
                        <span className="font-semibold text-[#0b0b0d]">
                          {primarySpec.label}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#5A5A60]">
                          {tText(locale, 'Location', 'الموقع')}
                        </span>
                        <span className="font-semibold text-[#0b0b0d]">
                          {tText(locale, activeProfile.cityEn, activeProfile.cityAr)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#5A5A60]">
                          {tText(locale, 'Resume', 'السيرة')}
                        </span>
                        <span className="font-mono-tabular text-[#AC3333]">
                          {activeProfile.cvFileName || 'CV.pdf'}
                        </span>
                      </div>
                    </div>
                  )}

                  {(profileTab === 'videos' ||
                    profileTab === 'services' ||
                    profileTab === 'files') &&
                    isFreeLocked && (
                      <div className="rounded-xl border border-[#AC3333]/30 bg-[#FBF8F8] p-3 text-center space-y-1.5">
                        <Lock className="w-4 h-4 text-[#AC3333] mx-auto" />
                        <div className="text-[11px] font-bold text-[#0b0b0d]">
                          {tText(locale, 'Upgrade to Plus', 'الترقية إلى بلس')}
                        </div>
                        <button
                          type="button"
                          onClick={() => onChangePlanMode('plus')}
                          className="px-3 py-1 rounded-lg bg-[#AC3333] text-white text-[10px] font-semibold cursor-pointer"
                        >
                          {tText(locale, 'Unlock Features', 'تفعيل المزايا')}
                        </button>
                      </div>
                    )}

                  {profileTab === 'videos' && !isFreeLocked && (
                    <div className="space-y-1.5">
                      {activeProfile.videos.map((v) => (
                        <div
                          key={v.id}
                          className="rounded-xl border border-[#ececec] p-2 flex items-center gap-2 text-[10px]"
                        >
                          <span className="w-6 h-6 rounded-lg bg-[#0b0b0d] text-white flex items-center justify-center shrink-0">
                            <Play className="w-3 h-3 fill-current" />
                          </span>
                          <span className="font-semibold truncate">
                            {tText(locale, v.titleEn, v.titleAr)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {profileTab === 'services' && !isFreeLocked && (
                    <div className="space-y-1.5">
                      {(locale === 'ar'
                        ? activeProfile.servicesOfferedAr
                        : activeProfile.servicesOfferedEn
                      ).map((s) => (
                        <div
                          key={s}
                          className="rounded-xl border border-[#ececec] px-2.5 py-2 text-[10px] font-medium"
                        >
                          {s}
                        </div>
                      ))}
                    </div>
                  )}

                  {profileTab === 'files' && !isFreeLocked && (
                    <div className="space-y-1.5">
                      {activeProfile.filesAndPlans.map((fp) => (
                        <div
                          key={fp.id}
                          className="rounded-xl border border-[#ececec] px-2.5 py-2 flex items-center justify-between text-[10px]"
                        >
                          <span className="truncate font-medium">
                            {tText(locale, fp.titleEn, fp.titleAr)}
                          </span>
                          <Download className="w-3 h-3 text-[#AC3333] shrink-0" />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Professional Information + Account Settings Rows */}
                  <div className="space-y-1.5 pt-1">
                    <div className="text-[11px] font-bold text-[#0b0b0d]">
                      {tText(locale, 'Professional information', 'المعلومات المهنية')}
                    </div>
                    <div className="rounded-xl border border-[#ececec] divide-y divide-[#ececec] text-[10px]">
                      <div className="px-3 py-1.5 flex items-center justify-between">
                        <span className="font-semibold text-[#0b0b0d]">
                          {primarySpec.label}
                        </span>
                        <span className="text-[#5A5A60]">
                          {tText(locale, 'Profession', 'التخصص')}
                        </span>
                      </div>
                      <div className="px-3 py-1.5 flex items-center justify-between">
                        <span className="font-semibold text-[#0b0b0d]">
                          {tText(locale, activeProfile.cityEn, activeProfile.cityAr)}
                        </span>
                        <span className="text-[#5A5A60]">
                          {tText(locale, 'Location', 'المدينة')}
                        </span>
                      </div>
                      <div className="px-3 py-1.5 flex items-center justify-between">
                        <span className="font-semibold text-[#0b0b0d]">
                          {tText(
                            locale,
                            activeProfile.languagesEn,
                            activeProfile.languagesAr
                          )}
                        </span>
                        <span className="text-[#5A5A60]">
                          {tText(locale, 'Languages', 'اللغات')}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onNavigate('settings')}
                      className="w-full rounded-xl border border-[#ececec] px-3 py-2 flex items-center justify-between text-[10px] font-medium text-[#0b0b0d] hover:bg-[#F6F4F1]/60 cursor-pointer"
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <SettingsIcon className="w-3 h-3 text-[#5A5A60]" />
                        <span>
                          {tText(locale, 'Account preferences', 'تفضيلات الحساب')}
                        </span>
                      </span>
                      <ChevronRight className="w-3 h-3 text-[#5A5A60]" />
                    </button>
                  </div>
                </div>

                <MobileBottomNav locale={locale} active="profile" />
              </div>
            </div>
          </div>
        ) : (
          /* ============================================================== */
          /* SECONDARY VIEW: PLUS PRICING, COMPANIES & VERIFICATION BADGES  */
          /* ============================================================== */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            {/* Screen A: Free vs Plus + Pricing */}
            <div className="w-full max-w-[330px] mx-auto space-y-2.5">
              <div className="flex items-center justify-between text-[10px] font-mono-tabular tracking-wider uppercase px-1">
                <span className="font-semibold text-[#AC3333]">
                  05 / <span className="text-[#5A5A60]">CIRCLE PLUS PLANS</span>
                </span>
                <span className="text-[#5A5A60]">IQD</span>
              </div>
              <div className="h-[640px] bg-white rounded-[42px] border-[6px] border-[#0b0b0d] shadow-xl flex flex-col overflow-hidden">
                <IosStatusBar />
                <MobileBrandTopBar
                  locale={locale}
                  rightIcon={<Sparkles className="w-4 h-4 text-[#AC3333]" />}
                />
                <div className="flex-1 overflow-y-auto mobile-scroll px-4 py-3 space-y-3">
                  <div className="rounded-2xl bg-[#0b0b0d] text-white p-3.5 space-y-1">
                    <div className="text-[10px] font-mono-tabular text-white/70">
                      {tText(locale, 'FIRST 2 MONTHS FREE', 'أول شهرين مجاناً')}
                    </div>
                    <div className="text-sm font-bold">
                      {tText(locale, 'Upgrade to CIRCLE Plus', 'اشترك في دائرة بلس')}
                    </div>
                  </div>
                  {PLUS_PLANS.map((plan) => {
                    const selected = selectedPlanId === plan.id;
                    return (
                      <button
                        key={plan.id}
                        type="button"
                        onClick={() => setSelectedPlanId(plan.id)}
                        className={`w-full text-start rounded-2xl border p-3.5 transition-colors cursor-pointer ${
                          selected
                            ? 'border-[#AC3333] bg-[#FBF8F8]'
                            : 'border-[#ececec] bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-xs font-bold text-[#0b0b0d]">
                              {tText(locale, plan.durationEn, plan.durationAr)}
                            </div>
                            <div className="text-[10px] text-[#5A5A60]">
                              {tText(locale, plan.perMonthEn, plan.perMonthAr)}
                            </div>
                          </div>
                          <div className="font-display text-base font-bold text-[#0b0b0d]">
                            {plan.priceIqd}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => onChangePlanMode('plus')}
                    className="w-full py-2.5 rounded-xl bg-[#AC3333] text-white text-xs font-bold cursor-pointer"
                  >
                    {tText(locale, 'Subscribe / اشترك', 'اشترك الآن')}
                  </button>
                </div>
                <MobileBottomNav locale={locale} active="profile" />
              </div>
            </div>

            {/* Screen B: Companies & Institutions Hiring */}
            <div className="w-full max-w-[330px] mx-auto space-y-2.5">
              <div className="flex items-center justify-between text-[10px] font-mono-tabular tracking-wider uppercase px-1">
                <span className="font-semibold text-[#AC3333]">
                  06 / <span className="text-[#5A5A60]">COMPANIES & HIRING</span>
                </span>
                <span className="text-[#5A5A60]">IRAQ</span>
              </div>
              <div className="h-[640px] bg-white rounded-[42px] border-[6px] border-[#0b0b0d] shadow-xl flex flex-col overflow-hidden">
                <IosStatusBar />
                <MobileBrandTopBar
                  locale={locale}
                  rightIcon={<Building2 className="w-4 h-4 text-[#AC3333]" />}
                />
                <div className="flex-1 overflow-y-auto mobile-scroll px-4 py-3 space-y-3">
                  <div className="flex gap-1.5 overflow-x-auto pb-1">
                    {companies.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSelectedCompanyId(c.id)}
                        className={`px-2.5 py-1 rounded-lg border text-[10px] font-semibold whitespace-nowrap cursor-pointer ${
                          activeCompany.id === c.id
                            ? 'border-[#0b0b0d] bg-[#0b0b0d] text-white'
                            : 'border-[#ececec] bg-white text-[#5A5A60]'
                        }`}
                      >
                        {tText(locale, c.nameEn, c.nameAr)}
                      </button>
                    ))}
                  </div>
                  <div className="rounded-2xl border border-[#ececec] bg-[#F6F4F1]/60 p-3 space-y-1.5">
                    <div className="text-xs font-bold text-[#0b0b0d]">
                      {tText(locale, activeCompany.nameEn, activeCompany.nameAr)}
                    </div>
                    <div className="text-[10px] text-[#5A5A60] flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[#AC3333]" />
                      {tText(locale, activeCompany.locationEn, activeCompany.locationAr)}
                    </div>
                  </div>
                  <div className="flex gap-1 overflow-x-auto pb-1">
                    {(['all', 'engineering', 'design', 'development', 'media'] as const).map(
                      (k) => (
                        <button
                          key={k}
                          type="button"
                          onClick={() => setSpecialtyFilter(k)}
                          className={`px-2 py-1 rounded-md border text-[10px] capitalize cursor-pointer ${
                            specialtyFilter === k
                              ? 'border-[#AC3333] text-[#AC3333] bg-[#FBF8F8]'
                              : 'border-[#ececec] text-[#5A5A60]'
                          }`}
                        >
                          {k}
                        </button>
                      )
                    )}
                  </div>
                  {filteredJobs.map((job) => {
                    const applied = appliedJobIds.includes(job.id);
                    return (
                      <div
                        key={job.id}
                        className="rounded-2xl border border-[#ececec] p-3 space-y-2"
                      >
                        <div className="text-xs font-bold text-[#0b0b0d]">
                          {tText(locale, job.titleEn, job.titleAr)}
                        </div>
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-[#5A5A60]">
                            {tText(locale, job.specialtyEn, job.specialtyAr)}
                          </span>
                          <button
                            type="button"
                            onClick={() => onApplyJob(job.id)}
                            className={`px-2.5 py-1 rounded-lg font-semibold cursor-pointer ${
                              applied
                                ? 'bg-[#0b0b0d] text-white'
                                : 'bg-[#AC3333] text-white'
                            }`}
                          >
                            {applied
                              ? tText(locale, 'Applied ✓', 'تم التقديم')
                              : tText(locale, 'Apply', 'تقديم')}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <MobileBottomNav locale={locale} active="services" />
              </div>
            </div>

            {/* Screen C: Verification Badges Legend */}
            <div className="w-full max-w-[330px] mx-auto space-y-2.5">
              <div className="flex items-center justify-between text-[10px] font-mono-tabular tracking-wider uppercase px-1">
                <span className="font-semibold text-[#AC3333]">
                  07 / <span className="text-[#5A5A60]">VERIFICATION BADGES</span>
                </span>
                <span className="text-[#5A5A60]">TRUST</span>
              </div>
              <div className="h-[640px] bg-white rounded-[42px] border-[6px] border-[#0b0b0d] shadow-xl flex flex-col overflow-hidden">
                <IosStatusBar />
                <MobileBrandTopBar
                  locale={locale}
                  rightIcon={<Check className="w-4 h-4 text-[#AC3333]" />}
                />
                <div className="flex-1 overflow-y-auto mobile-scroll px-4 py-3 space-y-3">
                  <div className="rounded-2xl border border-[#AC3333]/35 bg-[#FBF8F8] p-4 space-y-2">
                    <VerificationBadge tier="subscriber" locale={locale} size="lg" />
                    <div className="text-sm font-bold text-[#0b0b0d]">
                      {tText(locale, 'Plus Red Tick', 'توثيق اشتراك بلس')}
                    </div>
                    <p className="text-[11px] text-[#5A5A60]">
                      {tText(
                        locale,
                        'Included with active CIRCLE Plus subscription.',
                        'يُمنح لمشتركي باقة دائرة بلس المفعّلة.'
                      )}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[#0b0b0d]/25 bg-[#F6F4F1] p-4 space-y-2">
                    <VerificationBadge tier="notable" locale={locale} size="lg" />
                    <div className="text-sm font-bold text-[#0b0b0d]">
                      {tText(
                        locale,
                        'Official Public Figure Seal',
                        'ختم الشخصيات المعروفة'
                      )}
                    </div>
                    <p className="text-[11px] text-[#5A5A60]">
                      {tText(
                        locale,
                        'Official C-logo seal granted strictly by administration.',
                        'ختم الشعار الرسمي يُمنح حصرياً من الإدارة للشخصيات المعروفة.'
                      )}
                    </p>
                  </div>
                </div>
                <MobileBottomNav locale={locale} active="profile" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
