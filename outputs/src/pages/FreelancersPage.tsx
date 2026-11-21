import React, { useMemo, useState } from 'react';
import {
  Clock,
  ExternalLink,
  FileText,
  Search,
  UserCheck,
  UserPlus,
} from 'lucide-react';
import type {
  FreelancerProfile,
  FreelancerTweet,
  UserAccount,
  Locale,
  RouteKey,
  TaxonomyDatabase,
  VerificationTier,
} from '../types/circle';
import { tText } from '../i18n/translations';
import { TweetsSection } from '../components/TweetsSection';
import {
  CircleButton,
  VerificationBadge,
} from '../components/design-system/Primitives';
import {
  getSortedSpecialtiesForCategory,
  getSortedVisibleCategories,
  matchesCreatorFilters,
  resolvePrimarySpecialtyLabel,
  resolveSecondarySpecialtyLabels,
} from '../utils/taxonomyHelpers';

interface FreelancersPageProps {
  locale: Locale;
  freelancers: FreelancerProfile[];
  taxonomy: TaxonomyDatabase;
  selectedUsername: string | null;
  followedIds: string[];
  onToggleFollow: (freelancerId: string) => void;
  tweets: FreelancerTweet[];
  currentUser: UserAccount | null;
  onPostTweet: (freelancerId: string, text: string) => void;
  onDeleteTweet: (tweetId: string) => void;
  onToggleTweetLike: (tweetId: string) => void;
  onCommentTweet: (tweetId: string, text: string) => void;
  onNavigate: (route: RouteKey, param?: string) => void;
}

export const FreelancersPage: React.FC<FreelancersPageProps> = ({
  locale,
  freelancers,
  taxonomy,
  selectedUsername,
  followedIds,
  onToggleFollow,
  tweets,
  currentUser,
  onPostTweet,
  onDeleteTweet,
  onToggleTweetLike,
  onCommentTweet,
  onNavigate,
}) => {
  const [query, setQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState<string>('all');
  const [tierFilter, setTierFilter] = useState<'all' | VerificationTier>('all');

  const publicList = freelancers.filter((f) => f.visibility === 'public');

  const visibleCategories = useMemo(
    () => getSortedVisibleCategories(taxonomy),
    [taxonomy]
  );

  const visibleSpecialties = useMemo(() => {
    if (selectedCategoryId === 'all') {
      const catOrder = new Map(visibleCategories.map((c) => [c.id, c.order]));
      return [...taxonomy.specialties]
        .filter((s) => !s.hidden && catOrder.has(s.categoryId))
        .sort((a, b) => {
          const diff = (catOrder.get(a.categoryId) || 99) - (catOrder.get(b.categoryId) || 99);
          return diff !== 0 ? diff : a.order - b.order;
        });
    }
    return getSortedSpecialtiesForCategory(taxonomy, selectedCategoryId);
  }, [selectedCategoryId, taxonomy, visibleCategories]);

  const selectedProfile = selectedUsername
    ? publicList.find((f) => f.username === selectedUsername) ?? null
    : null;

  if (selectedProfile) {
    const skills =
      locale === 'ar' ? selectedProfile.skillsAr : selectedProfile.skillsEn;
    const isFollowing = followedIds.includes(selectedProfile.id);
    const primarySpec = resolvePrimarySpecialtyLabel(
      selectedProfile,
      taxonomy,
      locale
    );
    const secondarySpecs = resolveSecondarySpecialtyLabels(
      selectedProfile,
      taxonomy,
      locale
    );

    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-8">
        <button
          type="button"
          onClick={() => onNavigate('freelancers')}
          className="text-xs font-semibold text-[#5A5A60] hover:text-[#050507] inline-flex items-center gap-1.5 cursor-pointer"
        >
          <span>←</span>
          <span>
            {tText(
              locale,
              'Back to creators gallery',
              'العودة إلى معرض المبدعين'
            )}
          </span>
        </button>

        {/* Clean Editorial Profile Header */}
        <div className="rounded-2xl border border-[#ececec] bg-white overflow-hidden">
          <div className="h-32 bg-[#050507] relative overflow-hidden">
            <div
              aria-hidden="true"
              className="absolute -top-6 end-[-20px] w-48 h-44 bg-[#AC3333]/80 circle-shard"
            />
          </div>
          <div className="px-6 sm:px-8 pb-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-9">
              <div
                className="w-20 h-20 rounded-full border-4 border-white font-display font-bold text-2xl flex items-center justify-center shrink-0 relative z-10"
                style={{
                  backgroundColor: selectedProfile.avatarTint,
                  color: selectedProfile.avatarColor,
                }}
              >
                {tText(
                  locale,
                  selectedProfile.nameEn,
                  selectedProfile.nameAr
                ).charAt(0)}
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <CircleButton
                  variant={isFollowing ? 'ghost' : 'primary'}
                  onClick={() => onToggleFollow(selectedProfile.id)}
                  aria-pressed={isFollowing}
                >
                  {isFollowing ? (
                    <>
                      <UserCheck className="w-4 h-4 text-[#AC3333]" />
                      <span>{tText(locale, 'Following', 'متابَع')}</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>{tText(locale, 'Follow', 'متابعة')}</span>
                    </>
                  )}
                </CircleButton>

                {selectedProfile.cvFileName && (
                  <span className="inline-flex items-center gap-1.5 px-3.5 min-h-[44px] rounded-xl border border-[#ececec] text-xs font-medium text-[#050507]">
                    <FileText className="w-3.5 h-3.5 text-[#AC3333]" />
                    <span>{selectedProfile.cvFileName}</span>
                  </span>
                )}
              </div>
            </div>

            <div className="mt-5 space-y-2.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#050507]">
                  {tText(
                    locale,
                    selectedProfile.nameEn,
                    selectedProfile.nameAr
                  )}
                </h1>
                <VerificationBadge
                  tier={selectedProfile.verificationTier}
                  locale={locale}
                  showLabel
                  size="md"
                />
              </div>
              <div
                dir="ltr"
                className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-[#F6F4F1] text-xs font-semibold text-[#050507] font-mono-tabular"
              >
                @{selectedProfile.username}
              </div>

              {/* Primary Specialty Label directly under user name */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-[#AC3333]">
                  {primarySpec.label}
                </span>
                {primarySpec.isPendingCustom && (
                  <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded border border-[#AC3333]/35 text-[#AC3333] bg-[#FBF8F8]">
                    <Clock className="w-2.5 h-2.5" />
                    <span>{tText(locale, 'Pending', 'قيد المراجعة')}</span>
                  </span>
                )}
                <span className="text-xs text-[#5A5A60]">
                  · {tText(locale, selectedProfile.cityEn, selectedProfile.cityAr)}
                </span>
              </div>

              {/* Minimal Secondary Specialties Tags */}
              {secondarySpecs.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  {secondarySpecs.map((tag) => (
                    <span
                      key={tag.id}
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-medium rounded-md border ${
                        tag.isPendingCustom
                          ? 'border-[#AC3333]/35 text-[#AC3333] bg-white'
                          : 'border-[#050507]/15 text-[#050507] bg-white'
                      }`}
                    >
                      <span>{tag.label}</span>
                      {tag.isPendingCustom && (
                        <span className="text-[9px] text-[#AC3333]">
                          ({tText(locale, 'Pending', 'مراجعة')})
                        </span>
                      )}
                    </span>
                  ))}
                </div>
              )}

              {/* Followers / Following / Works Counter */}
              <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-[#5A5A60]">
                <span>
                  <strong className="font-mono-tabular text-[#050507]">
                    {selectedProfile.postsCount}
                  </strong>{' '}
                  {tText(locale, 'works', 'أعمال')}
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  <strong className="font-mono-tabular text-[#050507]">
                    {selectedProfile.followersCount}
                  </strong>{' '}
                  {tText(locale, 'followers', 'متابع')}
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  <strong className="font-mono-tabular text-[#050507]">
                    {selectedProfile.followingCount}
                  </strong>{' '}
                  {tText(locale, 'following', 'يتابع')}
                </span>
              </div>

              <p className="text-sm text-[#050507] max-w-2xl leading-relaxed pt-1">
                {tText(locale, selectedProfile.bioEn, selectedProfile.bioAr)}
              </p>
            </div>

            <div className="mt-6 pt-5 border-t border-[#ececec] flex flex-wrap gap-4 text-xs text-[#5A5A60]">
              <span>
                <strong className="text-[#050507]">
                  {tText(locale, 'Skills:', 'المهارات:')}
                </strong>{' '}
                {skills.join(' · ')}
              </span>
              <span>
                <strong className="text-[#050507]">
                  {tText(locale, 'Languages:', 'اللغات:')}
                </strong>{' '}
                {tText(
                  locale,
                  selectedProfile.languagesEn,
                  selectedProfile.languagesAr
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Portfolio Showcase */}
        <div className="space-y-4">
          <h2 className="font-display text-xl font-bold text-[#050507]">
            {tText(locale, 'Selected Work Samples', 'نماذج الأعمال المختارة')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {selectedProfile.portfolio.map((work) => (
              <div
                key={work.id}
                className="rounded-2xl border border-[#ececec] bg-white p-4 space-y-3"
              >
                <div
                  className="h-32 rounded-xl p-4 flex items-end text-white font-display font-bold text-base"
                  style={{ backgroundColor: work.swatchHex }}
                >
                  {tText(locale, work.titleEn, work.titleAr)}
                </div>
                <div className="text-xs text-[#5A5A60]">
                  {tText(locale, work.categoryEn, work.categoryAr)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <TweetsSection
          locale={locale}
          profile={selectedProfile}
          tweets={tweets}
          currentUser={currentUser}
          onPost={onPostTweet}
          onDelete={onDeleteTweet}
          onToggleLike={onToggleTweetLike}
          onComment={onCommentTweet}
          onRequireLogin={() => onNavigate('login')}
        />

        {/* External Links */}
        <div className="rounded-2xl border border-[#ececec] bg-[#F6F4F1]/70 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-[#050507]">
              {tText(locale, 'External Portfolio & Links', 'الروابط الخارجية')}
            </h3>
            <p className="text-xs text-[#5A5A60]">
              {tText(
                locale,
                'Connect directly with creators or review their external works.',
                'تواصل مباشرة مع المبدعين أو استعرض أعمالهم الخارجية.'
              )}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(selectedProfile.externalLinks).map(([key, url]) =>
              url ? (
                <a
                  key={key}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[40px] rounded-xl border border-[#ececec] bg-white text-xs font-semibold text-[#050507] hover:border-[#050507]"
                >
                  <span className="capitalize">{key}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : null
            )}
          </div>
        </div>
      </div>
    );
  }

  const filtered = publicList.filter((fl) =>
    matchesCreatorFilters(fl, taxonomy, {
      categoryId: selectedCategoryId,
      specialtyId: selectedSpecialtyId,
      query,
      tierFilter,
    })
  );

  const handleSelectCategory = (catId: string) => {
    setSelectedCategoryId(catId);
    setSelectedSpecialtyId('all');
  };

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-8">
        {/* Editorial Minimalist Header + Search Box */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#ececec]">
          <div className="space-y-2">
            <div className="text-xs font-semibold tracking-wider uppercase text-[#AC3333]">
              {tText(locale, 'The People Behind the Work', 'المبدعون خلف الأعمال')}
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#050507] tracking-tight">
              {tText(locale, 'Find your people.', 'اعثر على المواهب المناسبة.')}
            </h1>
            <p className="text-sm text-[#5A5A60] max-w-xl">
              {tText(
                locale,
                'Filter Iraqi creators by Category, Specialty, and keyword in real time.',
                'تصفّح المبدعين العراقيين حسب الفئة الرئيسية، التخصص الدقيق، والبحث المباشر.'
              )}
            </p>
          </div>

          <div className="w-full md:w-88 flex items-center gap-2.5 bg-white border border-[#050507]/20 rounded-xl px-4 h-11 focus-within:border-[#AC3333]">
            <Search className="w-4 h-4 text-[#5A5A60] shrink-0" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={tText(
                locale,
                'Search name, specialty, city...',
                'ابحث بالاسم أو التخصص أو المدينة...'
              )}
              className="w-full bg-transparent text-sm text-[#050507] focus:outline-none"
            />
          </div>
        </div>

        {/* Two-Level Filter Bar: Category -> Specialty + Verification Filter */}
        <div className="space-y-4">
          {/* Level 1: Category Filter Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <span className="text-[11px] font-semibold text-[#5A5A60] whitespace-nowrap me-1">
                {tText(locale, 'Category:', 'الفئة:')}
              </span>
              <button
                type="button"
                onClick={() => handleSelectCategory('all')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  selectedCategoryId === 'all'
                    ? 'border-[#050507] bg-[#050507] text-white'
                    : 'border-[#050507]/15 bg-white text-[#5A5A60] hover:text-[#050507] hover:border-[#050507]/40'
                }`}
              >
                {tText(locale, 'All Categories', 'كل الفئات')}
              </button>
              {visibleCategories.map((cat) => {
                const active = selectedCategoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleSelectCategory(cat.id)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      active
                        ? 'border-[#AC3333] bg-white text-[#AC3333]'
                        : 'border-[#050507]/15 bg-white text-[#5A5A60] hover:text-[#050507] hover:border-[#050507]/40'
                    }`}
                  >
                    {tText(locale, cat.nameEn, cat.nameAr)}
                  </button>
                );
              })}
            </div>

            {/* Minimal Verification Tier Filter */}
            <div className="flex items-center gap-1.5 shrink-0">
              {(
                [
                  ['all', 'All', 'الكل'],
                  ['notable', 'Notable', 'شخصيات معروفة'],
                  ['subscriber', 'Plus', 'مشتركون'],
                ] as const
              ).map(([key, en, ar]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTierFilter(key)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors whitespace-nowrap cursor-pointer ${
                    tierFilter === key
                      ? 'border-[#050507] text-[#050507] bg-[#F6F4F1]'
                      : 'border-[#ececec] text-[#5A5A60] bg-white hover:text-[#050507]'
                  }`}
                >
                  {tText(locale, en, ar)}
                </button>
              ))}
            </div>
          </div>

          {/* Level 2: Specialty Filter Row (Minimal thin-bordered chips) */}
          {visibleSpecialties.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 border-t border-[#ececec]/70">
              <span className="text-[11px] font-semibold text-[#5A5A60] whitespace-nowrap me-1">
                {tText(locale, 'Specialty:', 'التخصص:')}
              </span>
              <button
                type="button"
                onClick={() => setSelectedSpecialtyId('all')}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  selectedSpecialtyId === 'all'
                    ? 'border-[#050507] text-[#050507] bg-[#F6F4F1]'
                    : 'border-[#ececec] text-[#5A5A60] bg-white hover:border-[#050507]/35'
                }`}
              >
                {tText(locale, 'All Specialties', 'كل التخصصات')}
              </button>
              {visibleSpecialties.map((sp) => {
                const active = selectedSpecialtyId === sp.id;
                return (
                  <button
                    key={sp.id}
                    type="button"
                    onClick={() => setSelectedSpecialtyId(sp.id)}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      active
                        ? 'border-[#AC3333] text-[#AC3333] bg-[#FBF8F8]'
                        : 'border-[#ececec] text-[#5A5A60] bg-white hover:border-[#050507]/35 hover:text-[#050507]'
                    }`}
                  >
                    {tText(locale, sp.nameEn, sp.nameAr)}
                  </button>
                );
              })}
            </div>
          )}

          {/* Active Results Count & Quick Reset */}
          <div className="flex items-center justify-between text-xs text-[#5A5A60]">
            <span className="font-mono-tabular">
              {filtered.length}{' '}
              {tText(locale, 'creators found', 'مبدع مطابق للبحث')}
            </span>
            {(selectedCategoryId !== 'all' ||
              selectedSpecialtyId !== 'all' ||
              tierFilter !== 'all' ||
              query.trim() !== '') && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setSelectedCategoryId('all');
                  setSelectedSpecialtyId('all');
                  setTierFilter('all');
                }}
                className="text-xs font-medium text-[#AC3333] hover:underline cursor-pointer"
              >
                {tText(locale, 'Clear all filters', 'مسح الفلاتر')}
              </button>
            )}
          </div>
        </div>

        {/* Creators Grid */}
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-[#ececec] p-12 text-center space-y-3">
            <p className="text-sm text-[#5A5A60]">
              {tText(
                locale,
                'No creators matched your combined filters.',
                'لا توجد ملفات مطابقة للبحث والتصفية الحالية.'
              )}
            </p>
            <CircleButton
              variant="ghost"
              onClick={() => {
                setQuery('');
                setSelectedCategoryId('all');
                setSelectedSpecialtyId('all');
                setTierFilter('all');
              }}
            >
              {tText(locale, 'Reset filters', 'إعادة ضبط البحث')}
            </CircleButton>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filtered.map((fl) => {
              const isFollowing = followedIds.includes(fl.id);
              const primarySpec = resolvePrimarySpecialtyLabel(
                fl,
                taxonomy,
                locale
              );
              const secondarySpecs = resolveSecondarySpecialtyLabels(
                fl,
                taxonomy,
                locale
              );

              return (
                <div
                  key={fl.id}
                  className="rounded-2xl border border-[#ececec] bg-white p-6 hover:border-[#050507]/35 transition-colors flex flex-col gap-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => onNavigate('freelancer-profile', fl.username)}
                      className="flex items-start gap-3.5 min-w-0 flex-1 text-start cursor-pointer"
                    >
                      <div
                        className="w-12 h-12 rounded-full border border-[#ececec] font-display font-bold text-lg flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: fl.avatarTint,
                          color: fl.avatarColor,
                        }}
                      >
                        {tText(locale, fl.nameEn, fl.nameAr).charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 font-bold text-base text-[#050507]">
                          <span className="truncate">
                            {tText(locale, fl.nameEn, fl.nameAr)}
                          </span>
                          <VerificationBadge
                            tier={fl.verificationTier}
                            locale={locale}
                          />
                        </div>
                        {/* Primary Specialty small label directly under user's name */}
                        <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-xs">
                          <span className="font-medium text-[#AC3333]">
                            {primarySpec.label}
                          </span>
                          {primarySpec.isPendingCustom && (
                            <span className="text-[10px] text-[#AC3333]/80">
                              ({tText(locale, 'pending', 'قيد المراجعة')})
                            </span>
                          )}
                          <span className="text-[#5A5A60]">·</span>
                          <span className="text-[#5A5A60] truncate">
                            {tText(locale, fl.cityEn, fl.cityAr)}
                          </span>
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => onToggleFollow(fl.id)}
                      aria-pressed={isFollowing}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 min-h-[36px] rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        isFollowing
                          ? 'bg-white text-[#050507] border border-[#050507]/20 hover:bg-[#F6F4F1]'
                          : 'bg-[#050507] text-white hover:bg-[#1B1B1F]'
                      }`}
                    >
                      {isFollowing ? (
                        <>
                          <UserCheck className="w-3.5 h-3.5 text-[#AC3333]" />
                          <span>{tText(locale, 'Following', 'متابَع')}</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>{tText(locale, 'Follow', 'متابعة')}</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Secondary Specialties as minimal thin-bordered tags */}
                  {secondarySpecs.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      {secondarySpecs.map((tag) => (
                        <span
                          key={tag.id}
                          className={`px-2 py-0.5 text-[11px] font-medium rounded-md border ${
                            tag.isPendingCustom
                              ? 'border-[#AC3333]/35 text-[#AC3333] bg-white'
                              : 'border-[#050507]/15 text-[#5A5A60] bg-white'
                          }`}
                        >
                          {tag.label}
                        </span>
                      ))}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => onNavigate('freelancer-profile', fl.username)}
                    className="text-start space-y-3 cursor-pointer"
                  >
                    <p className="text-sm text-[#5A5A60] leading-relaxed">
                      {tText(locale, fl.bioEn, fl.bioAr)}
                    </p>

                    <div className="flex items-center justify-between text-xs text-[#5A5A60]">
                      <span className="font-mono-tabular text-[#050507] font-medium">
                        {fl.followersCount}{' '}
                        {tText(locale, 'followers', 'متابع')} · {fl.postsCount}{' '}
                        {tText(locale, 'works', 'عمل')}
                      </span>
                      <span className="text-[#AC3333] font-medium">
                        {tText(locale, 'View profile →', 'عرض الملف ←')}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {fl.portfolio.slice(0, 3).map((work) => (
                        <div
                          key={work.id}
                          className="h-16 rounded-xl p-2 flex items-end text-[10px] font-semibold text-white leading-tight"
                          style={{ backgroundColor: work.swatchHex }}
                        >
                          <span className="truncate">
                            {tText(locale, work.titleEn, work.titleAr)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
