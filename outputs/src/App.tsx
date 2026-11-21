import React, { useEffect, useMemo, useState } from 'react';
import { Layout } from './components/Layout';
import {
  INITIAL_AUDIT_LOGS,
  INITIAL_COMPANIES,
  INITIAL_FREELANCERS,
  INITIAL_JOBS,
  INITIAL_NOTIFICATIONS,
  INITIAL_REPORTS,
  INITIAL_REQUESTS,
  INITIAL_SERVICES,
  INITIAL_TAXONOMY_DATA,
  INITIAL_TWEETS,
  INITIAL_USERS,
} from './data/circleData';
import { STATUS_LABELS } from './i18n/translations';
import { AdminDashboard } from './pages/AdminDashboard';
import {
  LoginPage,
  NotificationsPage,
  ProfilePage,
  SettingsPage,
} from './pages/AuthAndProfilePages';
import { CompaniesPage } from './pages/CompaniesPage';
import {
  AboutPage,
  CommunityGatePage,
  ContactPage,
  LegalPage,
  SearchResultsPage,
} from './pages/EcosystemPages';
import { FreelancersPage } from './pages/FreelancersPage';
import { HomePage } from './pages/HomePage';
import { MobileAppPreview } from './pages/MobileAppPreview';
import { ServicesPage } from './pages/ServicesPage';
import type {
  FreelancerTweet,
  AuditLogEntry,
  ContactSubmission,
  FreelancerProfile,
  Locale,
  ModerationReport,
  NotificationItem,
  PendingCustomSpecialty,
  RequestAttachment,
  RequestStatus,
  RouteKey,
  ServiceCategory,
  ServiceRequest,
  SpecialtyItem,
  SubscriptionPlanMode,
  TaxonomyDatabase,
  UserAccount,
  UserRole,
  VerificationTier,
} from './types/circle';
import { findSpecialtyById } from './utils/taxonomyHelpers';

const LOCALE_KEY = 'circle_iq_locale_v1';
const SESSION_KEY = 'circle.session';
const FOLLOWED_KEY = 'circle_iq_followed_freelancers_v1';

export default function App() {
  const [locale, setLocale] = useState<Locale>(() => {
    try {
      const saved = localStorage.getItem(LOCALE_KEY);
      if (saved === 'en' || saved === 'ar') return saved;
    } catch {
      // Ignore storage errors
    }
    return 'ar';
  });

  const [route, setRoute] = useState<RouteKey>('mobile-app');
  const [routeParam, setRouteParam] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [users, setUsers] = useState<UserAccount[]>(INITIAL_USERS);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [freelancers, setFreelancers] =
    useState<FreelancerProfile[]>(INITIAL_FREELANCERS);
  const [followedIds, setFollowedIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(FOLLOWED_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Ignore storage errors
    }
    return ['fl-1', 'fl-2'];
  });

  const [tweets, setTweets] = useState<FreelancerTweet[]>(INITIAL_TWEETS);
  const [sessionToken, setSessionToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem(SESSION_KEY);
    } catch {
      return null;
    }
  });
  const [planMode, setPlanMode] = useState<SubscriptionPlanMode>('trial');
  const [appliedJobIds, setAppliedJobIds] = useState<string[]>([]);

  const [services, setServices] = useState<ServiceCategory[]>(INITIAL_SERVICES);
  const [requests, setRequests] = useState<ServiceRequest[]>(INITIAL_REQUESTS);
  const [notifications, setNotifications] = useState<NotificationItem[]>(
    INITIAL_NOTIFICATIONS
  );
  const [reports, setReports] = useState<ModerationReport[]>(INITIAL_REPORTS);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOGS);
  const [taxonomy, setTaxonomy] = useState<TaxonomyDatabase>(INITIAL_TAXONOMY_DATA);

  const authHeaders = (): Record<string, string> => ({
    'Content-Type': 'application/json',
    ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
  });

  const adoptAccount = (account: {
    user: UserAccount;
    freelancer: FreelancerProfile | null;
  }, isAdmin: boolean): UserAccount => {
    const user: UserAccount = {
      ...account.user,
      roles: Array.from(
        new Set([
          ...account.user.roles.filter((r) => r !== 'admin' && r !== 'super_admin'),
          ...(isAdmin ? (['admin'] as UserRole[]) : []),
        ])
      ),
    };
    setUsers((prev) => [user, ...prev.filter((u) => u.id !== user.id)]);
    if (account.freelancer) {
      const fl = account.freelancer;
      setFreelancers((prev) => [fl, ...prev.filter((f) => f.id !== fl.id)]);
    }
    setCurrentUserId(user.id);
    return user;
  };

  // Restore a previous phone-verified session
  useEffect(() => {
    if (!sessionToken) return;
    fetch('/api/circle/auth/me', { headers: authHeaders() })
      .then((res) => {
        if (res.status === 401) {
          try {
            localStorage.removeItem(SESSION_KEY);
          } catch {
            // Ignore storage errors
          }
          setSessionToken(null);
          return null;
        }
        return res.ok ? res.json() : null;
      })
      .then(
        (
          data: {
            isAdmin: boolean;
            account: { user: UserAccount; freelancer: FreelancerProfile | null } | null;
          } | null
        ) => {
          if (data?.account) adoptAccount(data.account, data.isAdmin);
        }
      )
      .catch(() => {
        // Stay signed out if the backend is unreachable
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleVerified = (data: {
    token: string;
    e164: string;
    isAdmin: boolean;
    account: { user: UserAccount; freelancer: FreelancerProfile | null } | null;
  }): UserAccount | null => {
    try {
      localStorage.setItem(SESSION_KEY, data.token);
    } catch {
      // Ignore storage errors
    }
    setSessionToken(data.token);
    if (data.account) return adoptAccount(data.account, data.isAdmin);
    return null;
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch {
      // Ignore storage errors
    }
    setSessionToken(null);
    setCurrentUserId(null);
  };

  useEffect(() => {
    fetch('/api/circle/taxonomy')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: TaxonomyDatabase | null) => {
        if (data && Array.isArray(data.categories) && Array.isArray(data.specialties)) {
          setTaxonomy(data);
        }
      })
      .catch(() => {
        // Keep seeded taxonomy if offline
      });
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
    try {
      localStorage.setItem(LOCALE_KEY, locale);
    } catch {
      // Ignore storage errors
    }
  }, [locale]);

  useEffect(() => {
    try {
      localStorage.setItem(FOLLOWED_KEY, JSON.stringify(followedIds));
    } catch {
      // Ignore storage errors
    }
  }, [followedIds]);

  const currentUser = useMemo(
    () => users.find((u) => u.id === currentUserId) ?? null,
    [users, currentUserId]
  );

  const currentFreelancerProfile = useMemo(
    () =>
      currentUser
        ? freelancers.find((f) => f.userId === currentUser.id) ?? null
        : null,
    [freelancers, currentUser]
  );

  // Keep the signed-in member's account saved on the server (keyed by verified phone)
  useEffect(() => {
    if (!sessionToken || !currentUser) return;
    const timer = setTimeout(() => {
      fetch('/api/circle/account', {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ user: currentUser, freelancer: currentFreelancerProfile }),
      }).catch(() => {
        // Ignore offline backend sync failure
      });
    }, 800);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, currentFreelancerProfile, sessionToken]);

  const unreadNotifications = useMemo(
    () =>
      currentUser
        ? notifications.filter((n) => n.userId === currentUser.id && !n.read).length
        : 0,
    [notifications, currentUser]
  );

  const handleNavigate = (nextRoute: RouteKey, param?: string) => {
    setRoute(nextRoute);
    setRouteParam(param ?? null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleLocale = () => {
    setLocale((prev) => (prev === 'ar' ? 'en' : 'ar'));
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    handleNavigate('search');
  };

  const appendAudit = (action: string, target: string) => {
    const actor = currentUser?.username || 'system';
    setAuditLogs((prev) => [
      {
        id: `aud-${Date.now()}`,
        actor,
        action,
        target,
        timestamp: new Date().toISOString(),
      },
      ...prev,
    ]);
  };

  const persistTaxonomy = (nextDb: TaxonomyDatabase) => {
    setTaxonomy(nextDb);
    fetch('/api/circle/taxonomy', {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(nextDb),
    }).catch(() => {
      // Ignore offline backend sync failure
    });
  };

  const queuePendingCustomSpecialty = (entry: {
    userId: string;
    username: string;
    userDisplayNameEn: string;
    userDisplayNameAr: string;
    customText: string;
    roleType: 'primary' | 'secondary';
  }) => {
    const trimmed = entry.customText.trim();
    if (!trimmed) return;
    const item: PendingCustomSpecialty = {
      id: `pend-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      userId: entry.userId,
      username: entry.username,
      userDisplayNameEn: entry.userDisplayNameEn,
      userDisplayNameAr: entry.userDisplayNameAr,
      customText: trimmed,
      roleType: entry.roleType,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    setTaxonomy((prev) => ({ ...prev, pendingCustom: [item, ...prev.pendingCustom] }));
    fetch('/api/circle/taxonomy/pending', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(item),
    }).catch(() => {
      // Ignore offline backend sync failure
    });
  };

  const handleResolvePendingSpecialty = (payload: {
    pendingId: string;
    action: 'approve_new' | 'merge' | 'dismiss';
    categoryId?: string;
    newNameEn?: string;
    newNameAr?: string;
    mergeSpecialtyId?: string;
  }) => {
    const target = taxonomy.pendingCustom.find((p) => p.id === payload.pendingId);
    if (!target) return;

    let resolvedSpecId: string | undefined = payload.mergeSpecialtyId;
    let nextSpecialties = [...taxonomy.specialties];

    if (payload.action === 'approve_new') {
      const catId = payload.categoryId || 'cat-design';
      const catSpecs = nextSpecialties.filter((s) => s.categoryId === catId);
      const maxOrder = Math.max(0, ...catSpecs.map((s) => s.order));
      const newSpec: SpecialtyItem = {
        id: `sp-${Date.now()}`,
        categoryId: catId,
        nameEn: (payload.newNameEn || target.customText).trim(),
        nameAr: (payload.newNameAr || target.customText).trim(),
        order: maxOrder + 1,
        hidden: false,
      };
      nextSpecialties = [...nextSpecialties, newSpec];
      resolvedSpecId = newSpec.id;
    }

    const nextStatus: PendingCustomSpecialty['status'] =
      payload.action === 'approve_new'
        ? 'approved'
        : payload.action === 'merge'
          ? 'merged'
          : 'rejected';

    const nextDb: TaxonomyDatabase = {
      ...taxonomy,
      specialties: nextSpecialties,
      pendingCustom: taxonomy.pendingCustom.map((p) =>
        p.id === payload.pendingId
          ? { ...p, status: nextStatus, resolvedSpecialtyId: resolvedSpecId }
          : p
      ),
    };
    persistTaxonomy(nextDb);

    // Automatically update user's & freelancer's profile if approved or merged
    if (resolvedSpecId && (payload.action === 'approve_new' || payload.action === 'merge')) {
      const resolvedSpec = nextSpecialties.find((s) => s.id === resolvedSpecId);
      setUsers((prev) =>
        prev.map((u) => {
          if (u.id !== target.userId) return u;
          if (target.roleType === 'primary') {
            return {
              ...u,
              primarySpecialtyId: resolvedSpecId,
              primaryCustomSpecialty: undefined,
            };
          }
          const existingSec = u.secondarySpecialtyIds || [];
          const nextSec = existingSec.includes(resolvedSpecId!)
            ? existingSec
            : [...existingSec, resolvedSpecId!].slice(0, 2);
          return {
            ...u,
            secondarySpecialtyIds: nextSec,
            secondaryCustomSpecialty: undefined,
          };
        })
      );
      setFreelancers((prev) =>
        prev.map((f) => {
          if (f.userId !== target.userId) return f;
          if (target.roleType === 'primary') {
            return {
              ...f,
              primarySpecialtyId: resolvedSpecId,
              primaryCustomSpecialty: undefined,
              specialtyEn: resolvedSpec?.nameEn ?? f.specialtyEn,
              specialtyAr: resolvedSpec?.nameAr ?? f.specialtyAr,
            };
          }
          const existingSec = f.secondarySpecialtyIds || [];
          const nextSec = existingSec.includes(resolvedSpecId!)
            ? existingSec
            : [...existingSec, resolvedSpecId!].slice(0, 2);
          return {
            ...f,
            secondarySpecialtyIds: nextSec,
            secondaryCustomSpecialty: undefined,
          };
        })
      );
    }

    appendAudit('TAXONOMY_PENDING_RESOLVED', `${target.customText} → ${nextStatus}`);
  };

  const handlePostTweet = (freelancerId: string, text: string) => {
    setTweets((prev) => [
      {
        id: `tw-${Date.now()}`,
        freelancerId,
        text,
        createdAt: new Date().toISOString(),
        likedBy: [],
        comments: [],
      },
      ...prev,
    ]);
  };

  const handleDeleteTweet = (tweetId: string) => {
    setTweets((prev) => prev.filter((t) => t.id !== tweetId));
  };

  const handleToggleTweetLike = (tweetId: string) => {
    if (!currentUser) return;
    setTweets((prev) =>
      prev.map((t) =>
        t.id !== tweetId
          ? t
          : {
              ...t,
              likedBy: t.likedBy.includes(currentUser.id)
                ? t.likedBy.filter((id) => id !== currentUser.id)
                : [...t.likedBy, currentUser.id],
            }
      )
    );
  };

  const handleCommentTweet = (tweetId: string, text: string) => {
    if (!currentUser) return;
    setTweets((prev) =>
      prev.map((t) =>
        t.id !== tweetId
          ? t
          : {
              ...t,
              comments: [
                ...t.comments,
                {
                  id: `tc-${Date.now()}`,
                  authorUserId: currentUser.id,
                  authorName: currentUser.displayNameAr || currentUser.displayNameEn,
                  authorUsername: currentUser.username,
                  text,
                  createdAt: new Date().toISOString(),
                },
              ],
            }
      )
    );
  };

  const handleToggleFollowFreelancer = (freelancerId: string) => {
    const alreadyFollowing = followedIds.includes(freelancerId);
    const nextFollowed = alreadyFollowing
      ? followedIds.filter((id) => id !== freelancerId)
      : [...followedIds, freelancerId];
    setFollowedIds(nextFollowed);

    setFreelancers((prev) =>
      prev.map((fl) => {
        if (fl.id === freelancerId) {
          return {
            ...fl,
            followersCount: Math.max(
              0,
              fl.followersCount + (alreadyFollowing ? -1 : 1)
            ),
          };
        }
        if (currentUser && fl.userId === currentUser.id && fl.id !== freelancerId) {
          return {
            ...fl,
            followingCount: Math.max(
              0,
              fl.followingCount + (alreadyFollowing ? -1 : 1)
            ),
          };
        }
        return fl;
      })
    );
  };

  const handleApplyJob = (jobId: string) => {
    setAppliedJobIds((prev) =>
      prev.includes(jobId) ? prev : [...prev, jobId]
    );
    appendAudit('JOB_APPLICATION_SUBMITTED', jobId);
  };

  const handleSetFreelancerVerification = (
    freelancerId: string,
    tier: VerificationTier
  ) => {
    const target = freelancers.find((f) => f.id === freelancerId);
    if (!target) return;

    const isVerified = tier !== 'none';
    setFreelancers((prev) =>
      prev.map((f) =>
        f.id === freelancerId
          ? { ...f, verificationTier: tier, verified: isVerified }
          : f
      )
    );
    setUsers((prev) =>
      prev.map((u) =>
        u.id === target.userId ? { ...u, verified: isVerified } : u
      )
    );

    const tierLabelEn =
      tier === 'notable'
        ? 'Notable Public Figure'
        : tier === 'subscriber'
          ? 'Paid Subscriber'
          : 'Unverified';
    const tierLabelAr =
      tier === 'notable'
        ? 'شخصية معروفة (توثيق رسمي)'
        : tier === 'subscriber'
          ? 'توثيق مشترك'
          : 'غير موثق';

    setNotifications((prev) => [
      {
        id: `not-${Date.now()}`,
        userId: target.userId,
        titleEn: `Verification status updated: ${tierLabelEn}`,
        titleAr: `تم تحديث مستوى التوثيق: ${tierLabelAr}`,
        bodyEn:
          tier === 'none'
            ? 'Verification badge removed by administration.'
            : `Your profile now displays the ${tierLabelEn} badge.`,
        bodyAr:
          tier === 'none'
            ? 'تمت إزالة شارة التوثيق من قبل الإدارة.'
            : `يظهر ملفك الآن بشارة ${tierLabelAr}.`,
        read: false,
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);

    appendAudit('FREELANCER_VERIFICATION_SET', `${target.username} → ${tier}`);
  };

  const handleRegister = (payload: {
    displayName: string;
    phone: string;
    isAdmin?: boolean;
    city: string;
    roles: UserRole[];
    primarySpecialtyId?: string;
    primaryCustomSpecialty?: string;
    secondarySpecialtyIds?: string[];
    secondaryCustomSpecialty?: string;
  }): UserAccount => {
    const usernameSlug =
      payload.displayName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '.')
        .replace(/^\.+|\.+$/g, '') || `member.${Date.now().toString().slice(-4)}`;
    const newId = `usr-${Date.now()}`;
    const primarySpec = findSpecialtyById(taxonomy, payload.primarySpecialtyId);

    const newUser: UserAccount = {
      id: newId,
      phone: payload.phone,
      displayNameEn: payload.displayName,
      displayNameAr: payload.displayName,
      username: usernameSlug,
      city: payload.city || 'Baghdad, Iraq',
      bioEn: 'Member of the CIRCLE.iq digital ecosystem.',
      bioAr: 'عضو في منظومة CIRCLE.iq الرقمية.',
      roles: payload.isAdmin ? [...payload.roles, 'admin'] : payload.roles,
      status: 'active',
      verified: true,
      visibility: 'public',
      languages: ['Arabic', 'English'],
      externalLinks: {},
      primarySpecialtyId: payload.primarySpecialtyId,
      primaryCustomSpecialty: payload.primaryCustomSpecialty,
      secondarySpecialtyIds: payload.secondarySpecialtyIds || [],
      secondaryCustomSpecialty: payload.secondaryCustomSpecialty,
      createdAt: new Date().toISOString(),
    };
    setUsers((prev) => [newUser, ...prev]);

    if (payload.roles.includes('freelancer')) {
      const specEn =
        primarySpec?.nameEn || payload.primaryCustomSpecialty || 'Graphic Designer';
      const specAr =
        primarySpec?.nameAr || payload.primaryCustomSpecialty || 'مصمم جرافيك';
      const newFreelancer: FreelancerProfile = {
        id: `fl-${Date.now()}`,
        userId: newId,
        nameEn: payload.displayName,
        nameAr: payload.displayName,
        username: usernameSlug,
        primarySpecialtyId: payload.primarySpecialtyId,
        primaryCustomSpecialty: payload.primaryCustomSpecialty,
        secondarySpecialtyIds: payload.secondarySpecialtyIds || [],
        secondaryCustomSpecialty: payload.secondaryCustomSpecialty,
        specialtyEn: specEn,
        specialtyAr: specAr,
        headlineEn: specEn,
        headlineAr: specAr,
        cityEn: payload.city || 'Baghdad, Iraq',
        cityAr: payload.city || 'بغداد، العراق',
        bioEn: 'Independent creative talent on CIRCLE.iq.',
        bioAr: 'موهبة مستقلة على منصة CIRCLE.iq.',
        verified: false,
        verificationTier: 'none',
        followersCount: 0,
        followingCount: 0,
        postsCount: 0,
        visibility: 'public',
        skillsEn: [specEn],
        skillsAr: [specAr],
        languagesEn: 'Arabic · English',
        languagesAr: 'العربية · الإنجليزية',
        contactLinks: {
          whatsapp: payload.phone,
        },
        externalLinks: {},
        portfolio: [],
        videos: [],
        servicesOfferedEn: [],
        servicesOfferedAr: [],
        filesAndPlans: [],
        avatarTint: '#FBF3F3',
        avatarColor: '#AC3333',
      };
      setFreelancers((prev) => [newFreelancer, ...prev]);
    }

    if (payload.primaryCustomSpecialty?.trim()) {
      queuePendingCustomSpecialty({
        userId: newId,
        username: usernameSlug,
        userDisplayNameEn: payload.displayName,
        userDisplayNameAr: payload.displayName,
        customText: payload.primaryCustomSpecialty,
        roleType: 'primary',
      });
    }
    if (payload.secondaryCustomSpecialty?.trim()) {
      queuePendingCustomSpecialty({
        userId: newId,
        username: usernameSlug,
        userDisplayNameEn: payload.displayName,
        userDisplayNameAr: payload.displayName,
        customText: payload.secondaryCustomSpecialty,
        roleType: 'secondary',
      });
    }

    setCurrentUserId(newId);
    appendAudit('USER_REGISTERED', payload.phone);
    return newUser;
  };

  const handleSaveSettings = (updates: Partial<UserAccount>) => {
    if (!currentUser) return;
    const primarySpec = findSpecialtyById(taxonomy, updates.primarySpecialtyId);
    setUsers((prev) =>
      prev.map((u) => (u.id === currentUser.id ? { ...u, ...updates } : u))
    );
    setFreelancers((prev) =>
      prev.map((f) =>
        f.userId === currentUser.id
          ? {
              ...f,
              nameEn: updates.displayNameEn ?? f.nameEn,
              nameAr: updates.displayNameAr ?? f.nameAr,
              bioEn: updates.bioEn ?? f.bioEn,
              bioAr: updates.bioAr ?? f.bioAr,
              cityEn: updates.city ?? f.cityEn,
              cityAr: updates.city ?? f.cityAr,
              primarySpecialtyId:
                'primarySpecialtyId' in updates
                  ? updates.primarySpecialtyId
                  : f.primarySpecialtyId,
              primaryCustomSpecialty:
                'primaryCustomSpecialty' in updates
                  ? updates.primaryCustomSpecialty
                  : f.primaryCustomSpecialty,
              secondarySpecialtyIds:
                updates.secondarySpecialtyIds ?? f.secondarySpecialtyIds,
              secondaryCustomSpecialty:
                'secondaryCustomSpecialty' in updates
                  ? updates.secondaryCustomSpecialty
                  : f.secondaryCustomSpecialty,
              specialtyEn:
                primarySpec?.nameEn ||
                updates.primaryCustomSpecialty ||
                f.specialtyEn,
              specialtyAr:
                primarySpec?.nameAr ||
                updates.primaryCustomSpecialty ||
                f.specialtyAr,
              visibility:
                updates.visibility === 'private' ? 'hidden' : 'public',
            }
          : f
      )
    );

    if (
      updates.primaryCustomSpecialty?.trim() &&
      updates.primaryCustomSpecialty !== currentUser.primaryCustomSpecialty
    ) {
      queuePendingCustomSpecialty({
        userId: currentUser.id,
        username: currentUser.username,
        userDisplayNameEn: updates.displayNameEn || currentUser.displayNameEn,
        userDisplayNameAr: updates.displayNameAr || currentUser.displayNameAr,
        customText: updates.primaryCustomSpecialty,
        roleType: 'primary',
      });
    }
    if (
      updates.secondaryCustomSpecialty?.trim() &&
      updates.secondaryCustomSpecialty !== currentUser.secondaryCustomSpecialty
    ) {
      queuePendingCustomSpecialty({
        userId: currentUser.id,
        username: currentUser.username,
        userDisplayNameEn: updates.displayNameEn || currentUser.displayNameEn,
        userDisplayNameAr: updates.displayNameAr || currentUser.displayNameAr,
        customText: updates.secondaryCustomSpecialty,
        roleType: 'secondary',
      });
    }

    appendAudit('PROFILE_UPDATED', currentUser.username);
  };

  const handleSubmitRequest = (payload: {
    serviceId: string;
    projectTitle: string;
    brief: string;
    timelineNote: string;
    attachments: RequestAttachment[];
  }): ServiceRequest => {
    const svc = services.find((s) => s.id === payload.serviceId)!;
    const req: ServiceRequest = {
      id: `req-${Date.now()}`,
      referenceCode: `CRC-2026-${String(requests.length + 102).padStart(4, '0')}`,
      serviceId: svc.id,
      serviceTitleEn: svc.titleEn,
      serviceTitleAr: svc.titleAr,
      requesterId: currentUser?.id || 'guest',
      requesterName: currentUser?.displayNameEn || 'Guest',
      requesterPhone: currentUser?.phone || '',
      projectTitle: payload.projectTitle,
      brief: payload.brief,
      timelineNote: payload.timelineNote,
      attachments: payload.attachments,
      status: 'submitted',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setRequests((prev) => [req, ...prev]);
    if (currentUser) {
      setNotifications((prev) => [
        {
          id: `not-${Date.now()}`,
          userId: currentUser.id,
          titleEn: `Service request ${req.referenceCode} submitted`,
          titleAr: `تم استلام طلب الخدمة ${req.referenceCode}`,
          bodyEn: `${svc.titleEn} · "${req.projectTitle}" is queued for review.`,
          bodyAr: `${svc.titleAr} · "${req.projectTitle}" بانتظار المراجعة.`,
          read: false,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
    }
    appendAudit('SERVICE_REQUEST_CREATED', req.referenceCode);

    fetch('/api/circle/requests', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(req),
    }).catch(() => {
      // Ignore offline backend sync failure
    });

    return req;
  };

  const handleUpdateRequestStatus = (
    requestId: string,
    status: RequestStatus
  ) => {
    const target = requests.find((r) => r.id === requestId);
    setRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? { ...r, status, updatedAt: new Date().toISOString() }
          : r
      )
    );
    if (target) {
      setNotifications((prev) => [
        {
          id: `not-${Date.now()}`,
          userId: target.requesterId,
          titleEn: `Request ${target.referenceCode} → ${STATUS_LABELS[status].en}`,
          titleAr: `تحديث الطلب ${target.referenceCode} ← ${STATUS_LABELS[status].ar}`,
          bodyEn: target.projectTitle,
          bodyAr: target.projectTitle,
          read: false,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      appendAudit('REQUEST_STATUS_UPDATED', `${target.referenceCode} → ${status}`);
    }
  };

  const handleToggleUserStatus = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? { ...u, status: u.status === 'active' ? 'suspended' : 'active' }
          : u
      )
    );
    appendAudit('USER_STATUS_TOGGLED', userId);
  };

  const handleToggleServiceActive = (serviceId: string) => {
    setServices((prev) =>
      prev.map((s) => (s.id === serviceId ? { ...s, isActive: !s.isActive } : s))
    );
    appendAudit('SERVICE_VISIBILITY_TOGGLED', serviceId);
  };

  const handleResolveReport = (
    reportId: string,
    action: 'resolved' | 'dismissed'
  ) => {
    setReports((prev) =>
      prev.map((r) => (r.id === reportId ? { ...r, status: action } : r))
    );
    appendAudit('MODERATION_REPORT_UPDATED', `${reportId} → ${action}`);
  };

  const handleBroadcastNotification = (titleEn: string, titleAr: string) => {
    const newItems: NotificationItem[] = users.map((u) => ({
      id: `not-${Date.now()}-${u.id}`,
      userId: u.id,
      titleEn,
      titleAr,
      bodyEn: 'Platform announcement from CIRCLE.iq administration.',
      bodyAr: 'إعلان رسمي من إدارة منصة CIRCLE.iq.',
      read: false,
      createdAt: new Date().toISOString(),
    }));
    setNotifications((prev) => [...newItems, ...prev]);
    appendAudit('ADMIN_BROADCAST', titleEn);
  };

  const handleSubmitContact = (
    payload: Omit<ContactSubmission, 'id' | 'createdAt'>
  ) => {
    fetch('/api/circle/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => {
      // Ignore offline backend sync failure
    });
  };

  const renderPage = () => {
    switch (route) {
      case 'home':
        return (
          <HomePage
            locale={locale}
            services={services}
            freelancers={freelancers}
            taxonomy={taxonomy}
            onNavigate={handleNavigate}
            onSearch={handleSearch}
          />
        );
      case 'services':
      case 'service-details':
        return (
          <ServicesPage
            locale={locale}
            services={services}
            selectedSlug={route === 'service-details' ? routeParam : null}
            currentUser={currentUser}
            requests={requests}
            onNavigate={handleNavigate}
            onSubmitRequest={handleSubmitRequest}
          />
        );
      case 'freelancers':
      case 'freelancer-profile':
        return (
          <FreelancersPage
            locale={locale}
            freelancers={freelancers}
            taxonomy={taxonomy}
            selectedUsername={
              route === 'freelancer-profile' ? routeParam : null
            }
            followedIds={followedIds}
            onToggleFollow={handleToggleFollowFreelancer}
            tweets={tweets}
            currentUser={currentUser}
            onPostTweet={handlePostTweet}
            onDeleteTweet={handleDeleteTweet}
            onToggleTweetLike={handleToggleTweetLike}
            onCommentTweet={handleCommentTweet}
            onNavigate={handleNavigate}
          />
        );
      case 'community':
        return <CommunityGatePage locale={locale} onNavigate={handleNavigate} />;
      case 'login':
      case 'register':
      case 'forgot-password':
        return (
          <LoginPage
            locale={locale}
            taxonomy={taxonomy}
            onVerified={handleVerified}
            onRegister={handleRegister}
            onNavigate={handleNavigate}
          />
        );
      case 'profile':
        return (
          <ProfilePage
            locale={locale}
            currentUser={currentUser}
            freelancerProfile={currentFreelancerProfile}
            taxonomy={taxonomy}
            requests={requests}
            onNavigate={handleNavigate}
            onLogout={() => {
              handleLogout();
              handleNavigate('home');
            }}
          />
        );
      case 'settings':
        return (
          <SettingsPage
            locale={locale}
            currentUser={currentUser}
            taxonomy={taxonomy}
            onSaveSettings={handleSaveSettings}
            onToggleLocale={handleToggleLocale}
            onNavigate={handleNavigate}
          />
        );
      case 'notifications':
        return (
          <NotificationsPage
            locale={locale}
            notifications={
              currentUser
                ? notifications.filter((n) => n.userId === currentUser.id)
                : []
            }
            onMarkAllRead={() =>
              setNotifications((prev) =>
                prev.map((n) =>
                  currentUser && n.userId === currentUser.id
                    ? { ...n, read: true }
                    : n
                )
              )
            }
          />
        );
      case 'search':
        return (
          <SearchResultsPage
            locale={locale}
            initialQuery={searchQuery}
            services={services}
            freelancers={freelancers}
            onNavigate={handleNavigate}
          />
        );
      case 'about':
        return <AboutPage locale={locale} onNavigate={handleNavigate} />;
      case 'contact':
        return (
          <ContactPage locale={locale} onSubmitContact={handleSubmitContact} />
        );
      case 'privacy':
        return <LegalPage locale={locale} mode="privacy" />;
      case 'terms':
        return <LegalPage locale={locale} mode="terms" />;
      case 'admin':
        return (
          <AdminDashboard
            locale={locale}
            currentUser={currentUser}
            users={users}
            freelancers={freelancers}
            services={services}
            requests={requests}
            reports={reports}
            auditLogs={auditLogs}
            taxonomy={taxonomy}
            onUpdateTaxonomy={persistTaxonomy}
            onResolvePendingSpecialty={handleResolvePendingSpecialty}
            onSwitchToAdminDemo={() => setCurrentUserId('usr-admin')}
            onNavigate={handleNavigate}
            onUpdateRequestStatus={handleUpdateRequestStatus}
            onToggleUserStatus={handleToggleUserStatus}
            onSetFreelancerVerification={handleSetFreelancerVerification}
            onToggleServiceActive={handleToggleServiceActive}
            onResolveReport={handleResolveReport}
            onBroadcastNotification={handleBroadcastNotification}
          />
        );
      case 'companies':
        return (
          <CompaniesPage
            locale={locale}
            companies={INITIAL_COMPANIES}
            jobs={INITIAL_JOBS}
            appliedJobIds={appliedJobIds}
            onApplyJob={handleApplyJob}
          />
        );
      case 'mobile-app':
        return (
          <MobileAppPreview
            locale={locale}
            freelancers={freelancers}
            taxonomy={taxonomy}
            companies={INITIAL_COMPANIES}
            jobs={INITIAL_JOBS}
            followedIds={followedIds}
            appliedJobIds={appliedJobIds}
            planMode={planMode}
            onChangePlanMode={setPlanMode}
            onToggleFollow={handleToggleFollowFreelancer}
            onApplyJob={handleApplyJob}
            onToggleLocale={handleToggleLocale}
            tweets={tweets}
            currentUser={currentUser}
            onPostTweet={handlePostTweet}
            onDeleteTweet={handleDeleteTweet}
            onToggleTweetLike={handleToggleTweetLike}
            onCommentTweet={handleCommentTweet}
            onNavigate={handleNavigate}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Layout
      locale={locale}
      activeRoute={route}
      currentUser={currentUser}
      unreadNotifications={unreadNotifications}
      onNavigate={handleNavigate}
      onToggleLocale={handleToggleLocale}
    >
      {renderPage()}
    </Layout>
  );
}
