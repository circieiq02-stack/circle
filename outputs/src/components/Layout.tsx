import React, { useState } from 'react';
import {
  Bell,
  Globe,
  Menu,
  Shield,
  Smartphone,
  User as UserIcon,
  X,
} from 'lucide-react';
import type { Locale, RouteKey, UserAccount } from '../types/circle';
import { COPY, tText } from '../i18n/translations';
import { CircleLogoMark } from './design-system/Primitives';

interface LayoutProps {
  locale: Locale;
  activeRoute: RouteKey;
  currentUser: UserAccount | null;
  unreadNotifications: number;
  onNavigate: (route: RouteKey, param?: string) => void;
  onToggleLocale: () => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({
  locale,
  activeRoute,
  currentUser,
  unreadNotifications,
  onNavigate,
  onToggleLocale,
  children,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAdmin =
    currentUser?.roles.includes('admin') ||
    currentUser?.roles.includes('super_admin');

  const navItems: Array<{ key: RouteKey; labelEn: string; labelAr: string }> = [
    { key: 'mobile-app', labelEn: 'Mobile UI', labelAr: 'شاشات الموبايل' },
    { key: 'freelancers', labelEn: 'Freelancers', labelAr: 'المستقلون' },
    { key: 'companies', labelEn: 'Companies', labelAr: 'الشركات' },
    { key: 'services', labelEn: 'Services', labelAr: 'الخدمات' },
  ];

  const handleNavClick = (key: RouteKey) => {
    onNavigate(key);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#050507]">
      {/* Strict 3-Zone Top Navigation Bar */}
      <header className="sticky top-0 z-40 h-16 bg-white/95 backdrop-blur-md border-b border-[#050507]/15">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-8">
          {/* Zone 1: Official CIRCLE Logo Mark + Single-Line Wordmark */}
          <button
            type="button"
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-2.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <CircleLogoMark className="w-7 h-7" />
            <span className="font-display text-lg font-extrabold tracking-tight text-[#050507]">
              CIRCLE.iq
            </span>
          </button>

          {/* Zone 2: 5 Clean Single-Line Navigation Links */}
          <nav
            aria-label="Primary"
            className="hidden md:flex items-center gap-6 text-sm font-medium"
          >
            {navItems.map((item) => {
              const active =
                activeRoute === item.key ||
                (item.key === 'services' && activeRoute === 'service-details') ||
                (item.key === 'freelancers' &&
                  activeRoute === 'freelancer-profile');

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => handleNavClick(item.key)}
                  className={`py-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'text-[#AC3333] font-semibold'
                      : 'text-[#5A5A60] hover:text-[#050507] hover:underline underline-offset-4'
                  }`}
                >
                  {tText(locale, item.labelEn, item.labelAr)}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Language Switcher + Primary Account CTA */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onToggleLocale}
              aria-label={tText(
                locale,
                'Switch to Arabic',
                'التبديل إلى الإنجليزية'
              )}
              className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded-xl border border-[#ececec] text-xs font-semibold text-[#050507] hover:bg-[#F6F4F1] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-[#5A5A60]" />
              <span>{locale === 'ar' ? 'EN' : 'العربية'}</span>
            </button>

            {currentUser && (
              <button
                type="button"
                onClick={() => handleNavClick('notifications')}
                aria-label={tText(locale, 'Notifications', 'الإشعارات')}
                className="relative hidden sm:inline-flex items-center justify-center w-10 h-10 rounded-xl border border-[#ececec] text-[#050507] hover:bg-[#F6F4F1] transition-colors shrink-0 cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -end-1 w-4 h-4 rounded-full bg-[#AC3333] text-white text-[10px] font-mono-tabular flex items-center justify-center">
                    {unreadNotifications}
                  </span>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={() => handleNavClick(currentUser ? 'profile' : 'login')}
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 min-h-[40px] rounded-xl bg-[#050507] text-white text-xs font-semibold hover:bg-[#1B1B1F] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>
                {currentUser
                  ? tText(
                      locale,
                      currentUser.displayNameEn.split(' ')[0],
                      currentUser.displayNameAr.split(' ')[0]
                    )
                  : tText(locale, COPY.nav.login.en, COPY.nav.login.ar)}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={tText(locale, 'Toggle menu', 'القائمة')}
              className="md:hidden inline-flex items-center justify-center w-11 h-11 rounded-xl border border-[#ececec] text-[#050507] cursor-pointer"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-[#050507]/15 px-4 py-4 space-y-2 shadow-sm">
            {navItems.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => handleNavClick(item.key)}
                className={`w-full text-start px-3 py-2.5 min-h-[44px] rounded-xl text-sm font-medium cursor-pointer ${
                  activeRoute === item.key
                    ? 'bg-[#FBF3F3] text-[#AC3333] font-semibold'
                    : 'text-[#050507] hover:bg-[#F6F4F1]'
                }`}
              >
                {tText(locale, item.labelEn, item.labelAr)}
              </button>
            ))}
            <div className="pt-2 border-t border-[#E2DFDA] grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleNavClick('mobile-app')}
                className="px-3 py-2.5 min-h-[44px] rounded-xl border border-[#ececec] text-xs font-semibold text-[#050507] inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Smartphone className="w-4 h-4" />
                <span>{tText(locale, 'Mobile UI', 'شاشات الموبايل')}</span>
              </button>
              <button
                type="button"
                onClick={() => handleNavClick(currentUser ? 'profile' : 'login')}
                className="px-3 py-2.5 min-h-[44px] rounded-xl bg-[#050507] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <UserIcon className="w-4 h-4" />
                <span>
                  {currentUser
                    ? tText(locale, 'Profile', 'الملف الشخصي')
                    : tText(locale, 'Sign In', 'دخول')}
                </span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Editorial Ecosystem Footer */}
      <footer className="border-t border-[#050507]/15 bg-[#F6F4F1]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-10 border-b border-[#E2DFDA]">
            <div className="md:col-span-5 space-y-3">
              <div className="flex items-center gap-2.5">
                <CircleLogoMark className="w-7 h-7" />
                <span className="font-display text-lg font-extrabold tracking-tight text-[#050507]">
                  CIRCLE.iq
                </span>
              </div>
              <p className="text-sm font-medium text-[#050507]">
                {tText(locale, COPY.brand.sloganEn, COPY.brand.sloganAr)}
              </p>
              <p className="text-sm text-[#5A5A60] max-w-sm leading-relaxed">
                {tText(
                  locale,
                  'Iraq’s connected digital ecosystem for digital services, creative talent, and organizations hiring specialists.',
                  'المنصة الرقمية المتكاملة في العراق للخدمات الرقمية والمواهب المستقلة وربط المؤسسات بالكفاءات.'
                )}
              </p>
            </div>

            <div className="md:col-span-2 space-y-2.5">
              <div className="text-xs font-semibold text-[#050507]">
                {tText(locale, 'Platform', 'المنصة')}
              </div>
              <div className="flex flex-col items-start gap-2 text-sm text-[#5A5A60]">
                <button
                  type="button"
                  onClick={() => onNavigate('services')}
                  className="hover:text-[#050507] cursor-pointer"
                >
                  {tText(locale, 'Services', 'الخدمات')}
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('freelancers')}
                  className="hover:text-[#050507] cursor-pointer"
                >
                  {tText(locale, 'Freelancers', 'المستقلون')}
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('companies')}
                  className="hover:text-[#050507] cursor-pointer"
                >
                  {tText(locale, 'Companies', 'الشركات والمؤسسات')}
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('community')}
                  className="hover:text-[#050507] cursor-pointer"
                >
                  {tText(locale, 'Community (Soon)', 'المجتمع (قريباً)')}
                </button>
              </div>
            </div>

            <div className="md:col-span-2 space-y-2.5">
              <div className="text-xs font-semibold text-[#050507]">
                {tText(locale, 'Company', 'المؤسسة')}
              </div>
              <div className="flex flex-col items-start gap-2 text-sm text-[#5A5A60]">
                <button
                  type="button"
                  onClick={() => onNavigate('about')}
                  className="hover:text-[#050507] cursor-pointer"
                >
                  {tText(locale, 'About CIRCLE', 'عن سيركل')}
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('contact')}
                  className="hover:text-[#050507] cursor-pointer"
                >
                  {tText(locale, 'Contact', 'تواصل معنا')}
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('privacy')}
                  className="hover:text-[#050507] cursor-pointer"
                >
                  {tText(locale, 'Privacy Policy', 'سياسة الخصوصية')}
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('terms')}
                  className="hover:text-[#050507] cursor-pointer"
                >
                  {tText(locale, 'Terms of Service', 'شروط الاستخدام')}
                </button>
              </div>
            </div>

            <div className="md:col-span-3 space-y-2.5">
              <div className="text-xs font-semibold text-[#050507]">
                {tText(locale, 'Connected Ecosystem', 'المنتجات المترابطة')}
              </div>
              <div className="flex flex-col items-start gap-2 text-sm text-[#5A5A60]">
                <button
                  type="button"
                  onClick={() => onNavigate('mobile-app')}
                  className="inline-flex items-center gap-1.5 hover:text-[#AC3333] cursor-pointer"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>
                    {tText(
                      locale,
                      'CIRCLE Mobile Screens (6x)',
                      'شاشات تطبيق الموبايل'
                    )}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate(isAdmin ? 'admin' : 'login')}
                  className="inline-flex items-center gap-1.5 hover:text-[#AC3333] cursor-pointer"
                >
                  <Shield className="w-4 h-4" />
                  <span>
                    {tText(locale, 'Admin Dashboard', 'لوحة تحكم الإدارة')}
                  </span>
                </button>
              </div>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#5A5A60]">
            <span>
              {tText(
                locale,
                '© 2026 CIRCLE.iq · Baghdad, Iraq · Everything connects.',
                '© 2026 CIRCLE.iq · بغداد، العراق · كل شيء يترابط.'
              )}
            </span>
            <span>
              {tText(
                locale,
                'CIRCLE.iq (دائرة) · Swiss Grid System',
                'CIRCLE.iq (دائرة) · نظام التصميم الشبكي'
              )}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};
