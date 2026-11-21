import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Bell,
  CheckCircle2,
  LogOut,
  Phone,
  Settings as SettingsIcon,
  Shield,
} from 'lucide-react';
import type {
  FreelancerProfile,
  Locale,
  NotificationItem,
  RouteKey,
  ServiceRequest,
  TaxonomyDatabase,
  UserAccount,
  UserRole,
} from '../types/circle';
import { tText } from '../i18n/translations';
import {
  CircleButton,
  CircleLogoMark,
  RequestStatusLabel,
  VerificationBadge,
} from '../components/design-system/Primitives';
import {
  SpecialtySelector,
  type SpecialtySelectionValue,
} from '../components/SpecialtySelector';
import {
  resolvePrimarySpecialtyLabel,
  resolveSecondarySpecialtyLabels,
} from '../utils/taxonomyHelpers';
import { normalizeDigits, parseIraqiPhone } from '../utils/iraqiPhone';

export const LoginPage: React.FC<{
  locale: Locale;
  taxonomy: TaxonomyDatabase;
  onVerified: (data: {
    token: string;
    e164: string;
    isAdmin: boolean;
    account: { user: UserAccount; freelancer: FreelancerProfile | null } | null;
  }) => UserAccount | null;
  onRegister: (payload: {
    displayName: string;
    phone: string;
    isAdmin?: boolean;
    city: string;
    roles: UserRole[];
    primarySpecialtyId?: string;
    primaryCustomSpecialty?: string;
    secondarySpecialtyIds?: string[];
    secondaryCustomSpecialty?: string;
  }) => UserAccount;
  onNavigate: (route: RouteKey) => void;
}> = ({ locale, taxonomy, onVerified, onRegister, onNavigate }) => {
  const [verifiedToken, setVerifiedToken] = useState('');
  const [verifiedIsAdmin, setVerifiedIsAdmin] = useState(false);
  void verifiedToken;
  // Iraqi Phone OTP state
  const [phoneInput, setPhoneInput] = useState('');
  const [phoneStep, setPhoneStep] = useState<'input' | 'otp' | 'complete'>(
    'input'
  );
  const [verifiedE164, setVerifiedE164] = useState('');
  const [verifiedDisplay, setVerifiedDisplay] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [previewOtp, setPreviewOtp] = useState<string | null>(null);
  const [resendSeconds, setResendSeconds] = useState(0);
  const [isSubmittingOtp, setIsSubmittingOtp] = useState(false);

  // Onboarding state for first-time Iraqi phone users
  const [newName, setNewName] = useState('');
  const [newCity, setNewCity] = useState('Baghdad, Iraq');
  const [newWantsFreelancer, setNewWantsFreelancer] = useState(false);
  const [onboardingSpecs, setOnboardingSpecs] = useState<SpecialtySelectionValue>({
    primarySpecialtyId: 'sp-graphic',
    secondarySpecialtyIds: [],
  });

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = setInterval(() => {
      setResendSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendSeconds]);

  const parsedLivePhone = parseIraqiPhone(phoneInput);

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const parsed = parseIraqiPhone(phoneInput);
    if (!parsed.valid) {
      setError(
        tText(
          locale,
          parsed.errorEn || 'Invalid Iraqi phone number.',
          parsed.errorAr || 'رقم الهاتف العراقي غير صحيح.'
        )
      );
      return;
    }

    setError(null);
    setIsSubmittingOtp(true);
    try {
      const res = await fetch('/api/circle/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: parsed.e164 }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        e164?: string;
        previewCode?: string;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Could not send verification code.');
      }

      setVerifiedE164(parsed.e164);
      setVerifiedDisplay(parsed.formattedDisplay);
      setPreviewOtp(data.previewCode || null);
      setOtpCode('');
      setResendSeconds(60);
      setPhoneStep('otp');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : tText(
              locale,
              'Failed to send verification code.',
              'تعذر إرسال رمز التحقق.'
            )
      );
    } finally {
      setIsSubmittingOtp(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanOtp = normalizeDigits(otpCode).replace(/\D/g, '');
    if (cleanOtp.length !== 6) {
      setError(
        tText(
          locale,
          'Please enter the 6-digit verification code.',
          'يرجى إدخال رمز التحقق المكوّن من 6 أرقام.'
        )
      );
      return;
    }

    setError(null);
    setIsSubmittingOtp(true);
    try {
      const res = await fetch('/api/circle/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: verifiedE164, code: cleanOtp }),
      });
      const data = (await res.json()) as {
        verified?: boolean;
        e164?: string;
        token?: string;
        isAdmin?: boolean;
        account?: { user: UserAccount; freelancer: FreelancerProfile | null } | null;
        error?: string;
      };
      if (!res.ok || !data.verified || !data.token) {
        throw new Error(
          data.error ||
            tText(
              locale,
              'Verification code is invalid or expired.',
              'رمز التحقق غير صحيح أو منتهي الصلاحية.'
            )
        );
      }

      const existing = onVerified({
        token: data.token,
        e164: verifiedE164,
        isAdmin: !!data.isAdmin,
        account: data.account ?? null,
      });
      if (existing) {
        if (existing.status === 'suspended') {
          setError(
            tText(
              locale,
              'This account is currently suspended by administration.',
              'هذا الحساب موقوف حالياً من قبل الإدارة.'
            )
          );
          return;
        }
        onNavigate(
          existing.roles.includes('admin') ||
            existing.roles.includes('super_admin')
            ? 'admin'
            : 'profile'
        );
        return;
      }

      setVerifiedToken(data.token);
      setVerifiedIsAdmin(!!data.isAdmin);
      // First-time Iraqi phone number: complete brief account profile
      setPhoneStep('complete');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : tText(locale, 'OTP verification failed.', 'فشل التحقق من الرمز.')
      );
    } finally {
      setIsSubmittingOtp(false);
    }
  };

  const handleCompletePhoneOnboarding = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim().length < 2) {
      setError(
        tText(
          locale,
          'Please enter your full name.',
          'يرجى إدخال اسمك الكامل.'
        )
      );
      return;
    }
    setError(null);
    const roles: UserRole[] = newWantsFreelancer
      ? ['user', 'freelancer']
      : ['user'];
    const created = onRegister({
      displayName: newName.trim(),
      phone: verifiedE164,
      isAdmin: verifiedIsAdmin,
      city: newCity.trim() || 'Baghdad, Iraq',
      roles,
      ...(newWantsFreelancer ? onboardingSpecs : {}),
    });
    void created;
    onNavigate('profile');
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="rounded-2xl border border-[#ececec] bg-white p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-2.5">
          <CircleLogoMark className="w-8 h-8" />
          <div>
            <h1 className="font-display text-2xl font-bold text-[#0b0b0d]">
              {tText(locale, 'Sign in to CIRCLE.iq', 'تسجيل الدخول إلى CIRCLE.iq')}
            </h1>
            <p className="text-xs text-[#5f6168]">
              {tText(
                locale,
                'Sign in with your Iraqi phone number (+964)',
                'سجّل دخولك برقم الهاتف العراقي (+964)'
              )}
            </p>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-[#f6d3d6] bg-[#fdf1f2] p-3 text-xs text-[#d92735] flex items-start gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {(
          <>
            {phoneStep === 'input' && (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#0b0b0d] mb-1.5">
                    {tText(locale, 'Iraqi Mobile Number', 'رقم الهاتف العراقي')}
                  </label>
                  <div
                    dir="ltr"
                    className="flex items-center rounded-xl border border-[#ececec] bg-[#f4f4f5]/50 focus-within:bg-white focus-within:ring-2 focus-within:ring-[#d92735] overflow-hidden"
                  >
                    <span className="px-3 h-11 inline-flex items-center gap-1.5 border-e border-[#ececec] bg-[#f4f4f5] text-xs font-mono-tabular font-semibold text-[#0b0b0d] shrink-0">
                      <span>IQ</span>
                      <span>+964</span>
                    </span>
                    <input
                      type="tel"
                      inputMode="tel"
                      value={phoneInput}
                      onChange={(e) => {
                        setPhoneInput(e.target.value);
                        if (error) setError(null);
                      }}
                      placeholder="0770 123 4567"
                      className="w-full h-11 px-3.5 bg-transparent text-sm font-mono-tabular focus:outline-none"
                      required
                    />
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-[11px] text-[#5f6168]">
                    <span>
                      {tText(
                        locale,
                        'Supports Asiacell, Zain Iraq, and Korek (077 / 078 / 075)',
                        'يدعم شبكات آسياسيل وزين العراق وكورك (077 / 078 / 075)'
                      )}
                    </span>
                    {parsedLivePhone.valid && (
                      <span className="font-semibold text-[#14663d] shrink-0">
                        {tText(
                          locale,
                          parsedLivePhone.operatorEn,
                          parsedLivePhone.operatorAr
                        )}
                      </span>
                    )}
                  </div>
                </div>

                <CircleButton
                  type="submit"
                  variant="primary"
                  className="w-full"
                  disabled={isSubmittingOtp}
                >
                  {isSubmittingOtp
                    ? tText(locale, 'Sending code...', 'جارٍ إرسال الرمز...')
                    : tText(
                        locale,
                        'Send Verification Code',
                        'إرسال رمز التحقق'
                      )}
                </CircleButton>
              </form>
            )}

            {phoneStep === 'otp' && (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#5f6168]">
                    {tText(locale, 'Code sent to', 'تم إرسال الرمز إلى')}{' '}
                    <strong dir="ltr" className="font-mono-tabular text-[#0b0b0d]">
                      {verifiedDisplay}
                    </strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setPhoneStep('input');
                      setError(null);
                    }}
                    className="font-semibold text-[#d92735] hover:underline cursor-pointer"
                  >
                    {tText(locale, 'Edit', 'تعديل')}
                  </button>
                </div>

                {previewOtp && (
                  <div className="rounded-xl border border-[#ececec] bg-[#f4f4f5] p-3 flex items-center justify-between gap-2 text-xs">
                    <span className="text-[#5f6168]">
                      {tText(
                        locale,
                        'SMS Preview Code:',
                        'رمز التحقق (معاينة SMS):'
                      )}{' '}
                      <strong className="font-mono-tabular text-[#0b0b0d]">
                        {previewOtp}
                      </strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => setOtpCode(previewOtp)}
                      className="font-semibold text-[#d92735] hover:underline cursor-pointer shrink-0"
                    >
                      {tText(locale, 'Fill code', 'تعبئة الرمز')}
                    </button>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-[#0b0b0d] mb-1.5">
                    {tText(locale, '6-Digit Verification Code', 'رمز التحقق (6 أرقام)')}
                  </label>
                  <input
                    dir="ltr"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) =>
                      setOtpCode(normalizeDigits(e.target.value).replace(/\D/g, ''))
                    }
                    placeholder="••••••"
                    className="w-full h-12 px-4 rounded-xl border border-[#ececec] bg-[#f4f4f5]/50 text-center text-lg font-mono-tabular tracking-[0.35em] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#d92735]"
                    required
                  />
                </div>

                <CircleButton
                  type="submit"
                  variant="primary"
                  className="w-full"
                  disabled={isSubmittingOtp}
                >
                  {isSubmittingOtp
                    ? tText(locale, 'Verifying...', 'جارٍ التحقق...')
                    : tText(locale, 'Verify & Sign In', 'تأكيد ودخول')}
                </CircleButton>

                <div className="text-center text-xs text-[#5f6168]">
                  {resendSeconds > 0 ? (
                    <span className="font-mono-tabular">
                      {tText(
                        locale,
                        `Resend code in ${resendSeconds}s`,
                        `إعادة الإرسال خلال ${resendSeconds} ثانية`
                      )}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSendOtp()}
                      className="font-semibold text-[#d92735] hover:underline cursor-pointer"
                    >
                      {tText(locale, 'Resend verification code', 'إعادة إرسال الرمز')}
                    </button>
                  )}
                </div>
              </form>
            )}

            {phoneStep === 'complete' && (
              <form onSubmit={handleCompletePhoneOnboarding} className="space-y-4">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>
                    {tText(
                      locale,
                      `Phone verified (${verifiedDisplay}). Complete your name to finish sign-in.`,
                      `تم توثيق الرقم (${verifiedDisplay}). أكمل اسمك لإتمام إنشاء الحساب.`
                    )}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0b0b0d] mb-1.5">
                    {tText(locale, 'Full Name', 'الاسم الكامل')}
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder={tText(locale, 'e.g. Sara Al-Khatib', 'مثال: سارة الخطيب')}
                    className="w-full h-11 px-3.5 rounded-xl border border-[#ececec] bg-[#f4f4f5]/50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#d92735]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0b0b0d] mb-1.5">
                    {tText(locale, 'Governorate / City', 'المحافظة / المدينة')}
                  </label>
                  <select
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-[#ececec] bg-white text-sm"
                  >
                    <option value="Baghdad, Iraq">{tText(locale, 'Baghdad, Iraq', 'بغداد، العراق')}</option>
                    <option value="Basra, Iraq">{tText(locale, 'Basra, Iraq', 'البصرة، العراق')}</option>
                    <option value="Erbil, Iraq">{tText(locale, 'Erbil, Iraq', 'أربيل، العراق')}</option>
                    <option value="Najaf, Iraq">{tText(locale, 'Najaf, Iraq', 'النجف، العراق')}</option>
                    <option value="Karbala, Iraq">{tText(locale, 'Karbala, Iraq', 'كربلاء، العراق')}</option>
                    <option value="Mosul, Iraq">{tText(locale, 'Mosul, Iraq', 'الموصل، العراق')}</option>
                    <option value="Sulaymaniyah, Iraq">{tText(locale, 'Sulaymaniyah, Iraq', 'السليمانية، العراق')}</option>
                  </select>
                </div>

                <label className="flex items-start gap-2.5 p-3 rounded-xl border border-[#ececec] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newWantsFreelancer}
                    onChange={(e) => setNewWantsFreelancer(e.target.checked)}
                    className="mt-1 accent-[#d92735]"
                  />
                  <span className="text-xs text-[#5f6168]">
                    <strong className="text-[#0b0b0d] block">
                      {tText(
                        locale,
                        'Enable Freelancer Portfolio Profile',
                        'تفعيل ملف المستقل ومعرض الأعمال'
                      )}
                    </strong>
                    {tText(
                      locale,
                      'Appear in the Iraqi freelancer directory.',
                      'الظهور في دليل المستقلين العراقي.'
                    )}
                  </span>
                </label>

                {newWantsFreelancer && (
                  <SpecialtySelector
                    locale={locale}
                    taxonomy={taxonomy}
                    value={onboardingSpecs}
                    onChange={setOnboardingSpecs}
                    compact
                  />
                )}

                <CircleButton type="submit" variant="primary" className="w-full">
                  {tText(locale, 'Enter CIRCLE.iq', 'دخول إلى CIRCLE.iq')}
                </CircleButton>
              </form>
            )}
          </>
        )}

        <p className="text-center text-[11px] text-[#5f6168]">
          {tText(
            locale,
            'New here? Just enter your number — your account is created automatically after verification.',
            'جديد هنا؟ أدخل رقمك فقط وسيتم إنشاء حسابك تلقائياً بعد التحقق.'
          )}
        </p>
      </div>
    </div>
  );
};

export const ProfilePage: React.FC<{
  locale: Locale;
  currentUser: UserAccount | null;
  freelancerProfile: FreelancerProfile | null;
  taxonomy: TaxonomyDatabase;
  requests: ServiceRequest[];
  onNavigate: (route: RouteKey, param?: string) => void;
  onLogout: () => void;
}> = ({
  locale,
  currentUser,
  freelancerProfile,
  taxonomy,
  requests,
  onNavigate,
  onLogout,
}) => {
  const [tab, setTab] = useState<'portfolio' | 'requests' | 'cv'>('portfolio');

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <p className="text-sm text-[#5f6168]">
          {tText(
            locale,
            'Sign in to manage your CIRCLE.iq profile and requests.',
            'يرجى تسجيل الدخول لإدارة ملفك الشخصي وطلباتك.'
          )}
        </p>
        <CircleButton variant="primary" onClick={() => onNavigate('login')}>
          {tText(locale, 'Sign In', 'تسجيل الدخول')}
        </CircleButton>
      </div>
    );
  }

  const userRequests = requests.filter((r) => r.requesterId === currentUser.id);
  const isAdmin =
    currentUser.roles.includes('admin') ||
    currentUser.roles.includes('super_admin');

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Cover + Profile Header preserving mobile prototype structure */}
      <div className="rounded-2xl border border-[#ececec] bg-white overflow-hidden">
        <div className="h-32 bg-[#1b1b1f] relative overflow-hidden">
          <div
            aria-hidden="true"
            className="absolute -top-6 end-[-20px] w-48 h-44 bg-[#d92735] circle-shard"
          />
        </div>
        <div className="px-6 pb-6">
          <div className="flex flex-wrap items-end justify-between gap-4 -mt-9">
            <div className="w-20 h-20 rounded-full border-4 border-white bg-[#fdeaec] text-[#d92735] font-display font-bold text-2xl flex items-center justify-center relative z-10">
              {tText(
                locale,
                currentUser.displayNameEn,
                currentUser.displayNameAr
              ).charAt(0)}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {isAdmin && (
                <CircleButton
                  variant="secondary"
                  onClick={() => onNavigate('admin')}
                >
                  <Shield className="w-4 h-4" />
                  <span>{tText(locale, 'Admin Console', 'لوحة الإدارة')}</span>
                </CircleButton>
              )}
              <CircleButton
                variant="ghost"
                onClick={() => onNavigate('settings')}
              >
                <SettingsIcon className="w-4 h-4" />
                <span>{tText(locale, 'Settings', 'الإعدادات')}</span>
              </CircleButton>
              <CircleButton variant="danger" onClick={onLogout}>
                <LogOut className="w-4 h-4" />
                <span>{tText(locale, 'Logout', 'خروج')}</span>
              </CircleButton>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-display text-2xl font-bold text-[#0b0b0d]">
                {tText(
                  locale,
                  currentUser.displayNameEn,
                  currentUser.displayNameAr
                )}
              </h1>
              {freelancerProfile && (
                <VerificationBadge
                  tier={freelancerProfile.verificationTier}
                  locale={locale}
                  showLabel
                  size="md"
                />
              )}
            </div>

            {(() => {
              const primaryLabel = resolvePrimarySpecialtyLabel(
                {
                  primarySpecialtyId:
                    freelancerProfile?.primarySpecialtyId ??
                    currentUser.primarySpecialtyId,
                  primaryCustomSpecialty:
                    freelancerProfile?.primaryCustomSpecialty ??
                    currentUser.primaryCustomSpecialty,
                  specialtyEn: freelancerProfile?.specialtyEn || '',
                  specialtyAr: freelancerProfile?.specialtyAr || '',
                },
                taxonomy,
                locale
              );
              const secondaryTags = resolveSecondarySpecialtyLabels(
                {
                  secondarySpecialtyIds:
                    freelancerProfile?.secondarySpecialtyIds ??
                    currentUser.secondarySpecialtyIds,
                  secondaryCustomSpecialty:
                    freelancerProfile?.secondaryCustomSpecialty ??
                    currentUser.secondaryCustomSpecialty,
                },
                taxonomy,
                locale
              );
              return (
                <div className="space-y-1.5">
                  {primaryLabel.label && (
                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      <span className="font-medium text-[#AC3333]">
                        {primaryLabel.label}
                      </span>
                      {primaryLabel.isPendingCustom && (
                        <span className="text-[10px] px-2 py-0.5 border border-[#AC3333]/35 text-[#AC3333] bg-[#FBF8F8] rounded">
                          {tText(locale, 'Pending review', 'قيد المراجعة')}
                        </span>
                      )}
                    </div>
                  )}
                  {secondaryTags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {secondaryTags.map((tag) => (
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
                </div>
              );
            })()}

            <div className="text-xs text-[#5f6168]">
              @{currentUser.username} · {currentUser.city} ·{' '}
              {currentUser.roles.join(' / ')}
            </div>
            {freelancerProfile && (
              <div className="flex flex-wrap items-center gap-3 text-xs text-[#5f6168]">
                <span>
                  <strong className="font-mono-tabular text-[#0b0b0d]">
                    {freelancerProfile.postsCount}
                  </strong>{' '}
                  {tText(locale, 'works', 'أعمال')}
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  <strong className="font-mono-tabular text-[#0b0b0d]">
                    {freelancerProfile.followersCount}
                  </strong>{' '}
                  {tText(locale, 'followers', 'متابع')}
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  <strong className="font-mono-tabular text-[#0b0b0d]">
                    {freelancerProfile.followingCount}
                  </strong>{' '}
                  {tText(locale, 'following', 'يتابع')}
                </span>
              </div>
            )}
            <p className="text-sm text-[#0b0b0d] pt-1 max-w-2xl">
              {tText(locale, currentUser.bioEn, currentUser.bioAr)}
            </p>
          </div>

          <div className="mt-5 flex border-b border-[#ececec]">
            {(
              [
                ['portfolio', 'Portfolio', 'معرض الأعمال'],
                ['requests', 'Service Requests', 'طلبات الخدمات'],
                ['cv', 'CV & Information', 'السيرة والمعلومات'],
              ] as const
            ).map(([key, en, ar]) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`px-4 py-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                  tab === key
                    ? 'border-[#d92735] text-[#0b0b0d]'
                    : 'border-transparent text-[#5f6168] hover:text-[#0b0b0d]'
                }`}
              >
                {tText(locale, en, ar)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {tab === 'portfolio' && (
        <div className="rounded-2xl border border-[#ececec] bg-white p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-[#0b0b0d]">
              {tText(locale, 'Selected Work', 'الأعمال المختارة')}
            </h2>
            {freelancerProfile && (
              <button
                type="button"
                onClick={() =>
                  onNavigate('freelancer-profile', freelancerProfile.username)
                }
                className="text-xs font-semibold text-[#d92735] hover:underline cursor-pointer"
              >
                {tText(locale, 'Public view', 'العرض العام')}
              </button>
            )}
          </div>
          {freelancerProfile && freelancerProfile.portfolio.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {freelancerProfile.portfolio.map((w) => (
                <div
                  key={w.id}
                  className="h-28 rounded-xl p-4 flex items-end text-white font-semibold text-sm"
                  style={{ backgroundColor: w.swatchHex }}
                >
                  {tText(locale, w.titleEn, w.titleAr)}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#5f6168]">
              {tText(
                locale,
                'No portfolio items added yet.',
                'لم تتم إضافة أعمال إلى المعرض بعد.'
              )}
            </p>
          )}
        </div>
      )}

      {tab === 'requests' && (
        <div className="rounded-2xl border border-[#ececec] bg-white divide-y divide-[#ececec]">
          {userRequests.length === 0 ? (
            <div className="p-8 text-center space-y-3">
              <p className="text-sm text-[#5f6168]">
                {tText(
                  locale,
                  'You have not submitted any service requests yet.',
                  'لم تقم بإرسال أي طلبات خدمة حتى الآن.'
                )}
              </p>
              <CircleButton
                variant="primary"
                onClick={() => onNavigate('services')}
              >
                {tText(locale, 'Explore Services', 'استكشف الخدمات')}
              </CircleButton>
            </div>
          ) : (
            userRequests.map((req) => (
              <div
                key={req.id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="text-xs text-[#5f6168] font-mono-tabular">
                    {req.referenceCode} ·{' '}
                    {tText(locale, req.serviceTitleEn, req.serviceTitleAr)}
                  </div>
                  <div className="text-sm font-bold text-[#0b0b0d] mt-0.5">
                    {req.projectTitle}
                  </div>
                </div>
                <RequestStatusLabel status={req.status} locale={locale} />
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'cv' && (
        <div className="rounded-2xl border border-[#ececec] bg-white p-6 space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b border-[#ececec]">
            <span className="text-[#5f6168]">
              {tText(locale, 'Iraqi Phone Number', 'رقم الهاتف العراقي')}
            </span>
            <span dir="ltr" className="font-mono-tabular font-medium">
              {parseIraqiPhone(currentUser.phone).valid
                ? parseIraqiPhone(currentUser.phone).formattedDisplay
                : currentUser.phone}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-[#ececec]">
            <span className="text-[#5f6168]">
              {tText(locale, 'Visibility', 'الظهور')}
            </span>
            <span className="font-medium capitalize">
              {currentUser.visibility}
            </span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-[#5f6168]">
              {tText(locale, 'Verification Status', 'حالة التوثيق')}
            </span>
            <span className="font-semibold text-[#14663d]">
              {currentUser.verified
                ? tText(locale, '✓ Verified Identity', '✓ حساب موثق')
                : tText(locale, 'Standard Account', 'حساب قياسي')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export const SettingsPage: React.FC<{
  locale: Locale;
  currentUser: UserAccount | null;
  taxonomy: TaxonomyDatabase;
  onSaveSettings: (updates: Partial<UserAccount>) => void;
  onToggleLocale: () => void;
  onNavigate: (route: RouteKey) => void;
}> = ({
  locale,
  currentUser,
  taxonomy,
  onSaveSettings,
  onToggleLocale,
  onNavigate,
}) => {
  const [nameEn, setNameEn] = useState(currentUser?.displayNameEn || '');
  const [nameAr, setNameAr] = useState(currentUser?.displayNameAr || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [city, setCity] = useState(currentUser?.city || '');
  const [bioEn, setBioEn] = useState(currentUser?.bioEn || '');
  const [bioAr, setBioAr] = useState(currentUser?.bioAr || '');
  const [visibility, setVisibility] = useState<'public' | 'private'>(
    currentUser?.visibility || 'public'
  );
  const [specs, setSpecs] = useState<SpecialtySelectionValue>({
    primarySpecialtyId: currentUser?.primarySpecialtyId ?? 'sp-brand',
    primaryCustomSpecialty: currentUser?.primaryCustomSpecialty,
    secondarySpecialtyIds: currentUser?.secondarySpecialtyIds ?? [],
    secondaryCustomSpecialty: currentUser?.secondaryCustomSpecialty,
  });
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <CircleButton variant="primary" onClick={() => onNavigate('login')}>
          {tText(locale, 'Sign In', 'تسجيل الدخول')}
        </CircleButton>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <div className="rounded-2xl border border-[#ececec] bg-white p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold text-[#0b0b0d]">
            {tText(locale, 'Account & Privacy Settings', 'إعدادات الحساب والخصوصية')}
          </h1>
          <button
            type="button"
            onClick={onToggleLocale}
            className="text-xs font-semibold text-[#d92735] cursor-pointer"
          >
            {locale === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
          </button>
        </div>

        {saved && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {tText(
                locale,
                'Settings saved to your account.',
                'تم حفظ إعدادات الحساب بنجاح.'
              )}
            </span>
          </div>
        )}

        {phoneError && (
          <div className="rounded-xl border border-[#f6d3d6] bg-[#fdf1f2] p-3 text-xs text-[#d92735]">
            {phoneError}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            const parsedPhone = parseIraqiPhone(phone);
            if (!parsedPhone.valid) {
              setPhoneError(
                tText(
                  locale,
                  parsedPhone.errorEn || 'Invalid Iraqi phone number.',
                  parsedPhone.errorAr || 'رقم الهاتف العراقي غير صحيح.'
                )
              );
              return;
            }
            if (
              !specs.primarySpecialtyId &&
              !specs.primaryCustomSpecialty?.trim()
            ) {
              setPhoneError(
                tText(
                  locale,
                  'Please choose 1 Primary Specialty or enter a custom specialty.',
                  'يرجى اختيار تخصص رئيسي واحد أو كتابة تخصص مخصص.'
                )
              );
              return;
            }
            setPhoneError(null);
            onSaveSettings({
              displayNameEn: nameEn,
              displayNameAr: nameAr,
              phone: parsedPhone.e164,
              city,
              bioEn,
              bioAr,
              visibility,
              primarySpecialtyId: specs.primarySpecialtyId,
              primaryCustomSpecialty: specs.primaryCustomSpecialty,
              secondarySpecialtyIds: specs.secondarySpecialtyIds,
              secondaryCustomSpecialty: specs.secondaryCustomSpecialty,
            });
            setSaved(true);
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5">
                {tText(locale, 'Display Name (EN)', 'الاسم بالإنجليزية')}
              </label>
              <input
                type="text"
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-[#ececec] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5">
                {tText(locale, 'Display Name (AR)', 'الاسم بالعربية')}
              </label>
              <input
                type="text"
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-[#ececec] text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5">
                {tText(locale, 'Iraqi Mobile Number', 'رقم الهاتف العراقي')}
              </label>
              <input
                dir="ltr"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-[#ececec] text-sm font-mono-tabular"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5">
                {tText(locale, 'City', 'المدينة')}
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-[#ececec] text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5">
              {tText(locale, 'Biography (EN)', 'النبذة الشخصية بالإنجليزية')}
            </label>
            <textarea
              rows={2}
              value={bioEn}
              onChange={(e) => setBioEn(e.target.value)}
              className="w-full p-3.5 rounded-xl border border-[#ececec] text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5">
              {tText(locale, 'Biography (AR)', 'النبذة الشخصية بالعربية')}
            </label>
            <textarea
              rows={2}
              value={bioAr}
              onChange={(e) => setBioAr(e.target.value)}
              className="w-full p-3.5 rounded-xl border border-[#ececec] text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5">
              {tText(locale, 'Profile Visibility', 'ظهور الملف الشخصي')}
            </label>
            <select
              value={visibility}
              onChange={(e) =>
                setVisibility(e.target.value as 'public' | 'private')
              }
              className="w-full h-11 px-3.5 rounded-xl border border-[#ececec] bg-white text-sm"
            >
              <option value="public">
                {tText(locale, 'Public Directory', 'ظاهر في الدليل العام')}
              </option>
              <option value="private">
                {tText(locale, 'Private Only', 'خاص غير ظاهر للعامة')}
              </option>
            </select>
          </div>

          <SpecialtySelector
            locale={locale}
            taxonomy={taxonomy}
            value={specs}
            onChange={setSpecs}
          />

          <CircleButton type="submit" variant="primary">
            {tText(locale, 'Save Changes', 'حفظ التغييرات')}
          </CircleButton>
        </form>
      </div>
    </div>
  );
};

export const NotificationsPage: React.FC<{
  locale: Locale;
  notifications: NotificationItem[];
  onMarkAllRead: () => void;
}> = ({ locale, notifications, onMarkAllRead }) => (
  <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-6">
    <div className="flex items-center justify-between">
      <h1 className="font-display text-2xl font-bold text-[#0b0b0d]">
        {tText(locale, 'Notifications', 'الإشعارات')}
      </h1>
      <button
        type="button"
        onClick={onMarkAllRead}
        className="text-xs font-semibold text-[#d92735] hover:underline cursor-pointer"
      >
        {tText(locale, 'Mark all as read', 'تعيين الكل كمقروء')}
      </button>
    </div>

    <div className="rounded-2xl border border-[#ececec] bg-white divide-y divide-[#ececec]">
      {notifications.length === 0 ? (
        <div className="p-8 text-center text-sm text-[#5f6168]">
          {tText(locale, 'No notifications yet.', 'لا توجد إشعارات حالياً.')}
        </div>
      ) : (
        notifications.map((n) => (
          <div
            key={n.id}
            className={`p-5 flex items-start gap-3 ${
              n.read ? 'bg-white' : 'bg-[#fdf1f2]/50'
            }`}
          >
            <Bell className="w-4 h-4 text-[#d92735] shrink-0 mt-1" />
            <div className="space-y-1 flex-1">
              <div className="text-sm font-bold text-[#0b0b0d]">
                {tText(locale, n.titleEn, n.titleAr)}
              </div>
              <p className="text-xs text-[#5f6168]">
                {tText(locale, n.bodyEn, n.bodyAr)}
              </p>
            </div>
          </div>
        ))
      )}
    </div>
  </div>
);
