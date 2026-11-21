import React, { useState } from 'react';
import {
  Activity,
  Bell,
  Briefcase,
  CheckCircle2,
  FileText,
  Flag,
  Layers,
  Lock,
  Settings,
  Shield,
  Users,
} from 'lucide-react';
import type {
  AuditLogEntry,
  FreelancerProfile,
  Locale,
  ModerationReport,
  RequestStatus,
  RouteKey,
  ServiceCategory,
  ServiceRequest,
  TaxonomyDatabase,
  UserAccount,
  VerificationTier,
} from '../types/circle';
import { STATUS_LABELS, tText } from '../i18n/translations';
import {
  CircleButton,
  RequestStatusLabel,
  VerificationBadge,
} from '../components/design-system/Primitives';
import { AdminCategoriesPanel } from '../components/AdminCategoriesPanel';

type AdminSection =
  | 'overview'
  | 'categories'
  | 'users'
  | 'freelancers'
  | 'services'
  | 'requests'
  | 'content'
  | 'reports'
  | 'moderation'
  | 'notifications'
  | 'roles'
  | 'settings'
  | 'logs';

interface AdminDashboardProps {
  locale: Locale;
  currentUser: UserAccount | null;
  users: UserAccount[];
  freelancers: FreelancerProfile[];
  services: ServiceCategory[];
  requests: ServiceRequest[];
  reports: ModerationReport[];
  auditLogs: AuditLogEntry[];
  taxonomy: TaxonomyDatabase;
  onUpdateTaxonomy: (next: TaxonomyDatabase) => void;
  onResolvePendingSpecialty: (payload: {
    pendingId: string;
    action: 'approve_new' | 'merge' | 'dismiss';
    categoryId?: string;
    newNameEn?: string;
    newNameAr?: string;
    mergeSpecialtyId?: string;
  }) => void;
  onSwitchToAdminDemo: () => void;
  onNavigate: (route: RouteKey) => void;
  onUpdateRequestStatus: (
    requestId: string,
    status: RequestStatus,
    adminNote?: string
  ) => void;
  onToggleUserStatus: (userId: string) => void;
  onSetFreelancerVerification: (
    freelancerId: string,
    tier: VerificationTier
  ) => void;
  onToggleServiceActive: (serviceId: string) => void;
  onResolveReport: (reportId: string, action: 'resolved' | 'dismissed') => void;
  onBroadcastNotification: (titleEn: string, titleAr: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  locale,
  currentUser,
  users,
  freelancers,
  services,
  requests,
  reports,
  auditLogs,
  taxonomy,
  onUpdateTaxonomy,
  onResolvePendingSpecialty,
  onSwitchToAdminDemo,
  onNavigate,
  onUpdateRequestStatus,
  onToggleUserStatus,
  onSetFreelancerVerification,
  onToggleServiceActive,
  onResolveReport,
  onBroadcastNotification,
}) => {
  const [section, setSection] = useState<AdminSection>('categories');
  const [broadcastText, setBroadcastText] = useState('');
  const [broadcastSent, setBroadcastSent] = useState(false);

  const pendingCustomCount = taxonomy.pendingCustom.filter(
    (p) => p.status === 'pending'
  ).length;

  const isAuthorized =
    currentUser &&
    (currentUser.roles.includes('admin') ||
      currentUser.roles.includes('super_admin'));

  if (!isAuthorized) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16">
        <div className="rounded-2xl border border-[#ececec] bg-[#FBF3F3] p-8 text-center space-y-4">
          <Lock className="w-8 h-8 text-[#AC3333] mx-auto" />
          <h1 className="font-display text-2xl font-bold text-[#0b0b0d]">
            {tText(
              locale,
              'Administrator Access Required',
              'صلاحيات الإدارة مطلوبة'
            )}
          </h1>
          <p className="text-sm text-[#5A5A60]">
            {tText(
              locale,
              'This route is protected by role-based access control. Sign in with an Administrator account to manage CIRCLE.iq.',
              'هذه اللوحة محمية بالتحكم في الصلاحيات (RBAC). يمكنك التبديل لحساب الإدارة أو تسجيل الدخول لإدارة المنصة.'
            )}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <CircleButton variant="primary" onClick={onSwitchToAdminDemo}>
              {tText(locale, 'Enter as Admin (circle.admin)', 'دخول كمدير النظام')}
            </CircleButton>
            <CircleButton variant="ghost" onClick={() => onNavigate('login')}>
              {tText(locale, 'Sign In', 'تسجيل الدخول')}
            </CircleButton>
          </div>
        </div>
      </div>
    );
  }

  const navLinks: Array<{
    key: AdminSection;
    en: string;
    ar: string;
    icon: React.ReactNode;
    badge?: string;
    badgeCritical?: boolean;
  }> = [
    { key: 'overview', en: 'Overview', ar: 'نظرة عامة', icon: <Activity className="w-4 h-4" /> },
    {
      key: 'categories',
      en: 'Categories',
      ar: 'التصنيفات والتخصصات',
      icon: <Layers className="w-4 h-4" />,
      badge:
        pendingCustomCount > 0
          ? `${pendingCustomCount}`
          : `${taxonomy.categories.length}`,
      badgeCritical: pendingCustomCount > 0,
    },
    { key: 'requests', en: 'Service Requests', ar: 'طلبات الخدمات', icon: <FileText className="w-4 h-4" /> },
    { key: 'users', en: 'User Management', ar: 'إدارة المستخدمين', icon: <Users className="w-4 h-4" /> },
    { key: 'freelancers', en: 'Freelancers', ar: 'المستقلون', icon: <Briefcase className="w-4 h-4" /> },
    { key: 'services', en: 'Services', ar: 'الخدمات', icon: <Layers className="w-4 h-4" /> },
    { key: 'content', en: 'Content & Modules', ar: 'المحتوى والوحدات', icon: <FileText className="w-4 h-4" /> },
    { key: 'reports', en: 'Reports', ar: 'البلاغات', icon: <Flag className="w-4 h-4" /> },
    { key: 'moderation', en: 'Moderation', ar: 'الإشراف', icon: <Shield className="w-4 h-4" /> },
    { key: 'notifications', en: 'Notifications', ar: 'الإشعارات', icon: <Bell className="w-4 h-4" /> },
    { key: 'roles', en: 'Roles & Permissions', ar: 'الأدوار والصلاحيات', icon: <Lock className="w-4 h-4" /> },
    { key: 'settings', en: 'System Settings', ar: 'إعدادات النظام', icon: <Settings className="w-4 h-4" /> },
    { key: 'logs', en: 'Activity Logs', ar: 'سجل النشاط', icon: <Activity className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Admin Sidebar */}
        <aside className="lg:col-span-3 rounded-2xl border border-[#ececec] bg-white p-3 space-y-1 h-fit">
          <div className="px-3 py-2 text-xs font-semibold text-[#AC3333]">
            {tText(locale, 'CIRCLE Admin Console', 'لوحة إدارة سيركل')}
          </div>
          {navLinks.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setSection(item.key)}
              className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 text-xs font-semibold transition-colors cursor-pointer ${
                section === item.key
                  ? 'bg-[#050507] text-white'
                  : 'text-[#5A5A60] hover:bg-[#F6F4F1] hover:text-[#050507]'
              }`}
            >
              <span className="flex items-center gap-2.5 min-w-0">
                {item.icon}
                <span className="truncate">{tText(locale, item.en, item.ar)}</span>
              </span>
              {item.badge && (
                <span
                  className={`font-mono-tabular text-[10px] px-1.5 py-0.5 font-bold shrink-0 ${
                    item.badgeCritical
                      ? 'bg-[#AC3333] text-white'
                      : section === item.key
                        ? 'bg-white/20 text-white'
                        : 'bg-[#F6F4F1] text-[#050507] border border-[#ececec]'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </aside>

        {/* Admin Content */}
        <div className="lg:col-span-9 space-y-6">
          {section === 'overview' && (
            <div className="space-y-6">
              <h1 className="font-display text-2xl font-bold text-[#0b0b0d]">
                {tText(locale, 'Platform Overview', 'نظرة عامة على المنصة')}
              </h1>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  {
                    labelEn: 'Users',
                    labelAr: 'المستخدمون',
                    val: users.length,
                  },
                  {
                    labelEn: 'Freelancers',
                    labelAr: 'المستقلون',
                    val: freelancers.length,
                  },
                  {
                    labelEn: 'Service Requests',
                    labelAr: 'طلبات الخدمات',
                    val: requests.length,
                  },
                  {
                    labelEn: 'Open Reports',
                    labelAr: 'البلاغات المفتوحة',
                    val: reports.filter((r) => r.status === 'open').length,
                  },
                ].map((stat) => (
                  <div
                    key={stat.labelEn}
                    className="rounded-2xl border border-[#ececec] bg-white p-5"
                  >
                    <div className="text-xs text-[#5f6168]">
                      {tText(locale, stat.labelEn, stat.labelAr)}
                    </div>
                    <div className="font-mono-tabular text-3xl font-bold text-[#0b0b0d] mt-1">
                      {stat.val}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {section === 'categories' && (
            <AdminCategoriesPanel
              locale={locale}
              taxonomy={taxonomy}
              freelancers={freelancers}
              onUpdateTaxonomy={onUpdateTaxonomy}
              onResolvePendingSpecialty={onResolvePendingSpecialty}
            />
          )}

          {section === 'requests' && (
            <div className="rounded-2xl border border-[#ececec] bg-white overflow-hidden">
              <div className="px-6 py-4 border-b border-[#ececec]">
                <h1 className="font-display text-lg font-bold text-[#0b0b0d]">
                  {tText(locale, 'Service Requests Workflow', 'إدارة طلبات الخدمات')}
                </h1>
              </div>
              <div className="divide-y divide-[#ececec]">
                {requests.map((req) => (
                  <div
                    key={req.id}
                    className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="text-xs font-mono-tabular text-[#5f6168]">
                        {req.referenceCode} · {req.requesterName} ({(req.requesterPhone || '—')})
                      </div>
                      <div className="text-sm font-bold text-[#0b0b0d]">
                        {req.projectTitle}
                      </div>
                      <div className="text-xs text-[#5f6168]">{req.brief}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <RequestStatusLabel status={req.status} locale={locale} />
                      <select
                        value={req.status}
                        onChange={(e) =>
                          onUpdateRequestStatus(
                            req.id,
                            e.target.value as RequestStatus
                          )
                        }
                        aria-label="Update request status"
                        className="h-9 px-2.5 rounded-lg border border-[#ececec] text-xs font-medium bg-white"
                      >
                        {(Object.keys(STATUS_LABELS) as RequestStatus[]).map(
                          (st) => (
                            <option key={st} value={st}>
                              {tText(
                                locale,
                                STATUS_LABELS[st].en,
                                STATUS_LABELS[st].ar
                              )}
                            </option>
                          )
                        )}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {section === 'users' && (
            <div className="rounded-2xl border border-[#ececec] bg-white divide-y divide-[#ececec]">
              <div className="px-6 py-4">
                <h1 className="font-display text-lg font-bold text-[#0b0b0d]">
                  {tText(locale, 'User Accounts', 'حسابات المستخدمين')}
                </h1>
              </div>
              {users.map((u) => (
                <div
                  key={u.id}
                  className="p-5 flex items-center justify-between gap-4"
                >
                  <div>
                    <div className="text-sm font-bold text-[#0b0b0d]">
                      {tText(locale, u.displayNameEn, u.displayNameAr)}
                    </div>
                    <div className="text-xs text-[#5f6168]">
                      <span dir="ltr" className="font-mono-tabular">
                        {u.phone}
                      </span>{' '}
                      · {u.phone || '—'} · {u.roles.join(', ')} · {u.status}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onToggleUserStatus(u.id)}
                    className="px-3.5 py-2 rounded-lg border border-[#ececec] text-xs font-semibold hover:bg-[#f4f4f5] cursor-pointer"
                  >
                    {u.status === 'active'
                      ? tText(locale, 'Suspend', 'إيقاف')
                      : tText(locale, 'Activate', 'تفعيل')}
                  </button>
                </div>
              ))}
            </div>
          )}

          {section === 'freelancers' && (
            <div className="rounded-2xl border border-[#ececec] bg-white divide-y divide-[#ececec]">
              <div className="px-6 py-4">
                <h1 className="font-display text-lg font-bold text-[#0b0b0d]">
                  {tText(
                    locale,
                    'Freelancer Directory & Verification Tiers',
                    'إدارة المستقلين ومستويات التوثيق'
                  )}
                </h1>
                <p className="text-xs text-[#5f6168] mt-1">
                  {tText(
                    locale,
                    'Assign Subscriber Verification (paid members) or Official Notable Figure seals separately.',
                    'يمكنك التمييز بين توثيق المشتركين وتوثيق الشخصيات المعروفة رسمياً.'
                  )}
                </p>
              </div>
              {freelancers.map((f) => (
                <div
                  key={f.id}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm font-bold text-[#0b0b0d]">
                      <span>
                        {tText(locale, f.nameEn, f.nameAr)} (@{f.username})
                      </span>
                      <VerificationBadge
                        tier={f.verificationTier}
                        locale={locale}
                        showLabel
                      />
                    </div>
                    <div className="text-xs text-[#5f6168]">
                      {tText(locale, f.headlineEn, f.headlineAr)} ·{' '}
                      <span className="font-mono-tabular">
                        {f.followersCount} {tText(locale, 'followers', 'متابع')}
                      </span>
                    </div>
                  </div>
                  <select
                    value={f.verificationTier}
                    onChange={(e) =>
                      onSetFreelancerVerification(
                        f.id,
                        e.target.value as VerificationTier
                      )
                    }
                    aria-label={tText(
                      locale,
                      'Verification tier',
                      'مستوى التوثيق'
                    )}
                    className="h-10 px-3 rounded-lg border border-[#ececec] bg-white text-xs font-semibold text-[#0b0b0d] shrink-0 cursor-pointer"
                  >
                    <option value="none">
                      {tText(locale, 'Unverified', 'غير موثق')}
                    </option>
                    <option value="subscriber">
                      {tText(locale, 'Subscriber Verified', 'توثيق مشترك')}
                    </option>
                    <option value="notable">
                      {tText(
                        locale,
                        'Notable Public Figure',
                        'توثيق رسمي · شخصية معروفة'
                      )}
                    </option>
                  </select>
                </div>
              ))}
            </div>
          )}

          {section === 'services' && (
            <div className="rounded-2xl border border-[#ececec] bg-white divide-y divide-[#ececec]">
              <div className="px-6 py-4">
                <h1 className="font-display text-lg font-bold text-[#0b0b0d]">
                  {tText(locale, 'Service Catalog', 'إدارة فئات الخدمات')}
                </h1>
              </div>
              {services.map((s) => (
                <div
                  key={s.id}
                  className="p-5 flex items-center justify-between gap-4"
                >
                  <div>
                    <div className="text-sm font-bold text-[#0b0b0d]">
                      {tText(locale, s.titleEn, s.titleAr)}
                    </div>
                    <div className="text-xs text-[#5f6168]">
                      /{s.slug} ·{' '}
                      {s.isActive
                        ? tText(locale, 'Active', 'مفعّل')
                        : tText(locale, 'Disabled', 'معطّل')}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onToggleServiceActive(s.id)}
                    className="px-3.5 py-2 rounded-lg border border-[#ececec] text-xs font-semibold hover:bg-[#f4f4f5] cursor-pointer"
                  >
                    {s.isActive
                      ? tText(locale, 'Disable', 'تعطيل')
                      : tText(locale, 'Enable', 'تفعيل')}
                  </button>
                </div>
              ))}
            </div>
          )}

          {(section === 'reports' || section === 'moderation') && (
            <div className="rounded-2xl border border-[#ececec] bg-white divide-y divide-[#ececec]">
              <div className="px-6 py-4">
                <h1 className="font-display text-lg font-bold text-[#0b0b0d]">
                  {tText(locale, 'Reports & Moderation Queue', 'البلاغات والإشراف')}
                </h1>
              </div>
              {reports.map((rep) => (
                <div
                  key={rep.id}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <div className="text-xs text-[#5f6168]">
                      {rep.targetType} · {rep.targetLabel} · {rep.status}
                    </div>
                    <div className="text-sm font-semibold text-[#0b0b0d] mt-1">
                      {rep.reason}
                    </div>
                  </div>
                  {rep.status === 'open' && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => onResolveReport(rep.id, 'resolved')}
                        className="px-3 py-1.5 rounded-lg bg-[#0b0b0d] text-white text-xs font-semibold cursor-pointer"
                      >
                        {tText(locale, 'Resolve', 'معالجة')}
                      </button>
                      <button
                        type="button"
                        onClick={() => onResolveReport(rep.id, 'dismissed')}
                        className="px-3 py-1.5 rounded-lg border border-[#ececec] text-xs font-semibold cursor-pointer"
                      >
                        {tText(locale, 'Dismiss', 'تجاهل')}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {section === 'notifications' && (
            <div className="rounded-2xl border border-[#ececec] bg-white p-6 space-y-4">
              <h1 className="font-display text-lg font-bold text-[#0b0b0d]">
                {tText(locale, 'Broadcast Announcement', 'إرسال إشعار عام')}
              </h1>
              {broadcastSent && (
                <div className="text-xs text-emerald-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {tText(locale, 'Notification published.', 'تم إرسال الإشعار.')}
                  </span>
                </div>
              )}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!broadcastText.trim()) return;
                  onBroadcastNotification(broadcastText.trim(), broadcastText.trim());
                  setBroadcastText('');
                  setBroadcastSent(true);
                }}
                className="space-y-3"
              >
                <input
                  type="text"
                  value={broadcastText}
                  onChange={(e) => setBroadcastText(e.target.value)}
                  placeholder={tText(
                    locale,
                    'Announcement title...',
                    'عنوان الإشعار...'
                  )}
                  className="w-full h-11 px-3.5 rounded-xl border border-[#ececec] text-sm"
                />
                <CircleButton type="submit" variant="primary">
                  {tText(locale, 'Send Notification', 'إرسال')}
                </CircleButton>
              </form>
            </div>
          )}

          {(section === 'content' ||
            section === 'roles' ||
            section === 'settings') && (
            <div className="rounded-2xl border border-[#ececec] bg-white p-6 space-y-4">
              <h1 className="font-display text-lg font-bold text-[#0b0b0d]">
                {tText(
                  locale,
                  'Release Flags & RBAC Governance',
                  'ضوابط الإطلاق وإدارة الصلاحيات'
                )}
              </h1>
              <div className="divide-y divide-[#ececec] text-sm">
                <div className="py-3 flex justify-between">
                  <span>{tText(locale, 'Services & Freelancers', 'الخدمات والمستقلون')}</span>
                  <span className="font-semibold text-[#14663d]">
                    {tText(locale, 'Phase 1 Live', 'مفعّل — المرحلة الأولى')}
                  </span>
                </div>
                <div className="py-3 flex justify-between">
                  <span>{tText(locale, 'Community Module', 'وحدة المجتمع')}</span>
                  <span className="text-[#5f6168]">
                    {tText(locale, 'Locked (Future)', 'مغلق (مستقبلي)')}
                  </span>
                </div>
                <div className="py-3 flex justify-between">
                  <span>{tText(locale, 'Academy & Events', 'الأكاديمية والفعاليات')}</span>
                  <span className="text-[#5f6168]">
                    {tText(locale, 'Locked (Future)', 'مغلق (مستقبلي)')}
                  </span>
                </div>
                <div className="py-3 flex justify-between">
                  <span>{tText(locale, 'ZainCash / MasterCard', 'زين كاش / ماستركارد')}</span>
                  <span className="text-[#5f6168]">
                    {tText(locale, 'Awaiting KYB & API Approval', 'بانتظار الاعتماد التجاري')}
                  </span>
                </div>
              </div>
            </div>
          )}

          {section === 'logs' && (
            <div className="rounded-2xl border border-[#ececec] bg-white divide-y divide-[#ececec]">
              <div className="px-6 py-4">
                <h1 className="font-display text-lg font-bold text-[#0b0b0d]">
                  {tText(locale, 'Security & Activity Audit Logs', 'سجل النشاط والتدقيق')}
                </h1>
              </div>
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="px-6 py-3.5 flex items-center justify-between gap-4 text-xs"
                >
                  <div>
                    <span className="font-mono-tabular font-semibold text-[#0b0b0d]">
                      {log.action}
                    </span>{' '}
                    <span className="text-[#5f6168]">· {log.target}</span>
                  </div>
                  <span className="font-mono-tabular text-[#5f6168]">
                    {log.actor} · {log.timestamp.slice(0, 10)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
