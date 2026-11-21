import React, { useState } from 'react';
import { Building2, Check, MapPin } from 'lucide-react';
import type {
  CompanyProfile,
  JobPost,
  Locale,
} from '../types/circle';
import { tText } from '../i18n/translations';
import { VerificationBadge } from '../components/design-system/Primitives';

interface CompaniesPageProps {
  locale: Locale;
  companies: CompanyProfile[];
  jobs: JobPost[];
  appliedJobIds: string[];
  onApplyJob: (jobId: string) => void;
}

export const CompaniesPage: React.FC<CompaniesPageProps> = ({
  locale,
  companies,
  jobs,
  appliedJobIds,
  onApplyJob,
}) => {
  const [specialtyFilter, setSpecialtyFilter] = useState<string>('all');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('all');

  const filteredJobs = jobs.filter((job) => {
    if (specialtyFilter !== 'all' && job.specialtyKey !== specialtyFilter) {
      return false;
    }
    if (selectedCompanyId !== 'all' && job.companyId !== selectedCompanyId) {
      return false;
    }
    return true;
  });

  return (
    <div className="bg-[#F6F4F1] min-h-[calc(100vh-4rem)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-10">
        {/* Hero Banner */}
        <div className="border-2 border-[#050507] bg-white p-6 sm:p-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs font-mono-tabular font-bold text-[#D00205] uppercase tracking-wider">
              <Building2 className="w-4 h-4" />
              <span>
                {tText(
                  locale,
                  'Companies & Institutions Hiring in Iraq',
                  'قسم الشركات والمؤسسات للتوظيف في العراق'
                )}
              </span>
            </div>
            <h1 className="font-display text-3xl sm:text-5xl text-[#050507] tracking-tight leading-none">
              {tText(
                locale,
                'HIRE VERIFIED IRAQI SPECIALISTS.',
                'وظّف الكفاءات والمبدعين الموثقين في العراق.'
              )}
            </h1>
            <p className="text-sm text-[#5A5A60] leading-relaxed">
              {tText(
                locale,
                'Explore vetted Iraqi companies, architecture studios, media houses, and medical institutions hiring full-time, freelance, and remote talent.',
                'استكشف المؤسسات والشركات العراقية الموثقة التي تبحث عن مهندسين ومصممين ومطورين وأطباء ومحرري فيديو بنظام الدوام الكامل أو العمل الحر.'
              )}
            </p>
          </div>
          <div className="flex items-center gap-6 border-t lg:border-t-0 lg:border-s border-[#E2DFDA] pt-4 lg:pt-0 lg:ps-8 shrink-0">
            <div>
              <div className="font-mono-tabular text-3xl font-bold text-[#050507]">
                {companies.length}
              </div>
              <div className="text-xs text-[#5A5A60]">
                {tText(locale, 'Verified Organizations', 'مؤسسات موثقة')}
              </div>
            </div>
            <div>
              <div className="font-mono-tabular text-3xl font-bold text-[#D00205]">
                {jobs.length}
              </div>
              <div className="text-xs text-[#5A5A60]">
                {tText(locale, 'Open Positions', 'فرص عمل متاحة')}
              </div>
            </div>
          </div>
        </div>

        {/* Company Profiles Grid */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl text-[#050507]">
              {tText(locale, 'Hiring Organizations', 'المؤسسات المعلنة')}
            </h2>
            {selectedCompanyId !== 'all' && (
              <button
                type="button"
                onClick={() => setSelectedCompanyId('all')}
                className="text-xs font-bold text-[#D00205] hover:underline cursor-pointer"
              >
                {tText(locale, 'Show all companies', 'عرض كل الشركات')}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {companies.map((c) => {
              const selected = selectedCompanyId === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() =>
                    setSelectedCompanyId(selected ? 'all' : c.id)
                  }
                  className={`text-start border-2 p-5 transition-colors flex flex-col justify-between gap-4 cursor-pointer ${
                    selected
                      ? 'border-[#D00205] bg-white'
                      : 'border-[#050507]/20 bg-white hover:border-[#050507]'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-[#050507] text-white font-display text-lg flex items-center justify-center shrink-0">
                        {c.initials}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 font-bold text-base text-[#050507]">
                          <span className="truncate">
                            {tText(locale, c.nameEn, c.nameAr)}
                          </span>
                          {c.verified && (
                            <VerificationBadge tier="notable" locale={locale} />
                          )}
                        </div>
                        <div className="text-xs text-[#5A5A60]">
                          {tText(locale, c.fieldEn, c.fieldAr)}
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-[#1B1B1F] leading-relaxed">
                      {tText(locale, c.descriptionEn, c.descriptionAr)}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#E2DFDA] flex items-center justify-between text-xs">
                    <span className="inline-flex items-center gap-1 text-[#5A5A60]">
                      <MapPin className="w-3.5 h-3.5 text-[#D00205]" />
                      {tText(locale, c.locationEn, c.locationAr)}
                    </span>
                    <span className="font-mono-tabular font-bold text-[#050507]">
                      {c.openPositionsCount}{' '}
                      {tText(locale, 'open roles', 'وظائف')}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Filter by Specialty + Open Job Posts */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="font-display text-2xl text-[#050507]">
              {tText(locale, 'Open Job Posts', 'فرص العمل المفتوحة')}
            </h2>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {(
                [
                  ['all', 'All Specialties', 'كل التخصصات'],
                  ['engineering', 'Engineer', 'مهندس'],
                  ['design', 'Designer', 'مصمم'],
                  ['development', 'Developer', 'مطور'],
                  ['media', 'Video Editor', 'مونتير'],
                  ['medical', 'Doctor', 'طبيب'],
                ] as const
              ).map(([key, en, ar]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSpecialtyFilter(key)}
                  className={`px-3.5 py-2 text-xs font-bold border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    specialtyFilter === key
                      ? 'bg-[#D00205] text-white border-[#D00205]'
                      : 'bg-white text-[#050507] border-[#050507]/20 hover:border-[#050507]'
                  }`}
                >
                  {tText(locale, en, ar)}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredJobs.map((job) => {
              const org = companies.find((c) => c.id === job.companyId);
              const applied = appliedJobIds.includes(job.id);
              const typeLabel =
                job.type === 'full-time'
                  ? tText(locale, 'Full-time', 'دوام كامل')
                  : job.type === 'freelance'
                    ? tText(locale, 'Freelance', 'عمل حر')
                    : tText(locale, 'Remote', 'عن بُعد');

              return (
                <div
                  key={job.id}
                  className="border border-[#050507]/20 bg-white p-5 flex flex-col justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-[#D00205]">
                      {org ? tText(locale, org.nameEn, org.nameAr) : ''} ·{' '}
                      {tText(locale, job.specialtyEn, job.specialtyAr)}
                    </div>
                    <h3 className="text-lg font-bold text-[#050507]">
                      {tText(locale, job.titleEn, job.titleAr)}
                    </h3>
                    <div className="text-xs text-[#5A5A60]">
                      {typeLabel} · {tText(locale, job.locationEn, job.locationAr)}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#E2DFDA] flex items-center justify-between gap-4">
                    <span className="font-mono-tabular text-sm font-bold text-[#050507]">
                      {tText(locale, job.compensationEn, job.compensationAr)}
                    </span>
                    <button
                      type="button"
                      onClick={() => onApplyJob(job.id)}
                      className={`inline-flex items-center gap-1.5 px-5 py-2.5 min-h-[40px] text-xs font-bold transition-colors cursor-pointer ${
                        applied
                          ? 'bg-[#050507] text-white'
                          : 'bg-[#D00205] text-white hover:bg-[#AD0204]'
                      }`}
                    >
                      {applied && <Check className="w-3.5 h-3.5" />}
                      <span>
                        {applied
                          ? tText(locale, 'Applied', 'تم التقديم')
                          : tText(locale, 'Apply Now', 'تقديم الآن')}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};
