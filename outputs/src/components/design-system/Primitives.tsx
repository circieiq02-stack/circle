import React from 'react';
import { Check, Clock, Lock } from 'lucide-react';
import type { Locale, RequestStatus, VerificationTier } from '../../types/circle';
import { STATUS_LABELS, tText } from '../../i18n/translations';

export const CircleLogoMark: React.FC<{ className?: string }> = ({
  className = 'w-8 h-8',
}) => (
  <img
    src="/assets/aistudio/circle-mark_4dbb6b36.png"
    alt="CIRCLE.iq"
    referrerPolicy="no-referrer"
    className={`object-contain shrink-0 ${className}`}
  />
);

/**
 * Distinct dual verification emblems:
 * - subscriber (CIRCLE Plus): Crisp Circle Red (#D00205) verification tick
 * - notable (Verified Public Figure): Small elegant #050507 framed C-Logo Seal
 */
export const VerificationBadge: React.FC<{
  tier: VerificationTier;
  locale: Locale;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}> = ({ tier, locale, showLabel = false, size = 'sm' }) => {
  if (tier === 'none') return null;

  const isNotable = tier === 'notable';
  const title = isNotable
    ? tText(
        locale,
        'Verified Public Figure · Official CIRCLE Logo Seal',
        'شخصية معروفة موثقة · ختم شعار دائرة الرسمي'
      )
    : tText(
        locale,
        'CIRCLE Plus Subscriber · Red Verification Tick',
        'مشترك دائرة بلس · علامة التوثيق الحمراء'
      );

  if (isNotable) {
    const dim =
      size === 'lg' ? 'w-12 h-12 p-2' : size === 'md' ? 'w-6 h-6 p-1' : 'w-[18px] h-[18px] p-[2.5px]';
    return (
      <span
        title={title}
        aria-label={title}
        className="inline-flex items-center gap-1.5 shrink-0"
      >
        <span
          className={`${dim} bg-[#050507] border border-[#050507] inline-flex items-center justify-center shrink-0`}
        >
          <img
            src="/assets/aistudio/circle-mark_4dbb6b36.png"
            alt=""
            aria-hidden="true"
            referrerPolicy="no-referrer"
            className="w-full h-full object-contain"
          />
        </span>
        {showLabel && (
          <span className="text-[11px] font-semibold text-[#050507] whitespace-nowrap">
            {tText(locale, 'Public Figure', 'شخصية معروفة')}
          </span>
        )}
      </span>
    );
  }

  // Plus Subscriber Red Tick (#D00205)
  const tickDim =
    size === 'lg' ? 'w-12 h-12' : size === 'md' ? 'w-5 h-5' : 'w-4 h-4';
  const iconDim =
    size === 'lg' ? 'w-7 h-7' : size === 'md' ? 'w-3.5 h-3.5' : 'w-2.5 h-2.5';

  return (
    <span
      title={title}
      aria-label={title}
      className="inline-flex items-center gap-1.5 shrink-0"
    >
      <span
        className={`${tickDim} rounded-full bg-[#D00205] text-white inline-flex items-center justify-center shrink-0`}
      >
        <Check className={`${iconDim} stroke-[3]`} />
      </span>
      {showLabel && (
        <span className="text-[11px] font-semibold text-[#D00205] whitespace-nowrap">
          {tText(locale, 'Plus Verified', 'توثيق بلس')}
        </span>
      )}
    </span>
  );
};

export const CircleButton: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  }
> = ({ variant = 'primary', className = '', children, ...props }) => {
  const base =
    'inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap shrink-0 disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer';
  const styles: Record<string, string> = {
    primary: 'bg-[#AC3333] text-white hover:bg-[#912828]',
    secondary: 'bg-[#050507] text-white hover:bg-[#1B1B1F]',
    ghost:
      'bg-white text-[#050507] border border-[#050507]/15 hover:bg-[#F6F4F1]',
    danger: 'bg-[#FBF3F3] text-[#AC3333] border border-[#AC3333]/25 hover:bg-[#F5E3E3]',
  };
  return (
    <button className={`${base} ${styles[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export const RequestStatusLabel: React.FC<{
  status: RequestStatus;
  locale: Locale;
}> = ({ status, locale }) => {
  const text = locale === 'ar' ? STATUS_LABELS[status].ar : STATUS_LABELS[status].en;
  const styles: Record<RequestStatus, string> = {
    submitted: 'text-[#5A5A60] bg-[#F6F4F1] border-[#E2DFDA]',
    under_review: 'text-amber-800 bg-amber-50 border-amber-200',
    in_progress: 'text-blue-800 bg-blue-50 border-blue-200',
    completed: 'text-emerald-800 bg-emerald-50 border-emerald-200',
    rejected: 'text-[#AC3333] bg-[#FBF3F3] border-[#AC3333]/25',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium whitespace-nowrap ${styles[status]}`}
    >
      {status === 'completed' ? (
        <Check className="w-3.5 h-3.5" />
      ) : (
        <Clock className="w-3.5 h-3.5" />
      )}
      <span>{text}</span>
    </span>
  );
};

export const FutureModuleGate: React.FC<{
  locale: Locale;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  plannedFeaturesEn: string[];
  plannedFeaturesAr: string[];
  onBackHome: () => void;
}> = ({
  locale,
  titleEn,
  titleAr,
  descriptionEn,
  descriptionAr,
  plannedFeaturesEn,
  plannedFeaturesAr,
  onBackHome,
}) => {
  const features = locale === 'ar' ? plannedFeaturesAr : plannedFeaturesEn;

  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <div className="border border-[#050507]/15 bg-white p-8 md:p-10">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#D00205] mb-3">
          <Lock className="w-4 h-4" />
          <span>
            {tText(
              locale,
              'Scheduled Future Module · Not Yet Released',
              'وحدة مستقبلية مجدولة · غير مفعّلة بعد'
            )}
          </span>
        </div>

        <h1 className="font-display text-3xl font-bold text-[#050507] tracking-tight mb-3">
          {tText(locale, titleEn, titleAr)}
        </h1>
        <p className="text-base text-[#5A5A60] leading-relaxed mb-6">
          {tText(locale, descriptionEn, descriptionAr)}
        </p>

        <div className="border-t border-[#E2DFDA] pt-6 mb-8">
          <h2 className="text-sm font-semibold text-[#050507] mb-3">
            {tText(
              locale,
              'Architectural Scope Reserved for Release',
              'النطاق المعماري المجهّز للإطلاق القادم'
            )}
          </h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {features.map((item) => (
              <li
                key={item}
                className="flex items-center gap-2 text-sm text-[#5A5A60]"
              >
                <span className="w-1.5 h-1.5 bg-[#D00205] shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <CircleButton variant="secondary" onClick={onBackHome}>
            {tText(locale, 'Return to Active Platform', 'العودة إلى المنصة النشطة')}
          </CircleButton>
        </div>
      </div>
    </div>
  );
};
