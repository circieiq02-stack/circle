export type Locale = 'en' | 'ar';

export type UserRole =
  | 'visitor'
  | 'user'
  | 'freelancer'
  | 'service_provider'
  | 'admin'
  | 'super_admin';

export type AccountStatus = 'active' | 'suspended' | 'pending';

export type RequestStatus =
  | 'submitted'
  | 'under_review'
  | 'in_progress'
  | 'completed'
  | 'rejected';

export type RouteKey =
  | 'home'
  | 'services'
  | 'service-details'
  | 'freelancers'
  | 'freelancer-profile'
  | 'companies'
  | 'community'
  | 'profile'
  | 'login'
  | 'register'
  | 'forgot-password'
  | 'settings'
  | 'notifications'
  | 'search'
  | 'about'
  | 'contact'
  | 'privacy'
  | 'terms'
  | 'admin'
  | 'mobile-app';

export interface UserAccount {
  id: string;
  phone: string;
  displayNameEn: string;
  displayNameAr: string;
  username: string;
  city: string;
  bioEn: string;
  bioAr: string;
  roles: UserRole[];
  status: AccountStatus;
  verified: boolean;
  visibility: 'public' | 'private';
  languages: string[];
  externalLinks: {
    website?: string;
    behance?: string;
    github?: string;
    linkedin?: string;
  };
  storagePlan?: 'free' | 'plus';
  customQuotaMb?: number;
  isDeletedAccount?: boolean;
  primarySpecialtyId?: string;
  primaryCustomSpecialty?: string;
  secondarySpecialtyIds?: string[];
  secondaryCustomSpecialty?: string;
  createdAt: string;
}

export interface CreatorCategory {
  id: string;
  nameEn: string;
  nameAr: string;
  order: number;
  hidden: boolean;
  isOther?: boolean;
}

export interface SpecialtyItem {
  id: string;
  categoryId: string;
  nameEn: string;
  nameAr: string;
  order: number;
  hidden: boolean;
}

export interface PendingCustomSpecialty {
  id: string;
  userId: string;
  username: string;
  userDisplayNameEn: string;
  userDisplayNameAr: string;
  customText: string;
  roleType: 'primary' | 'secondary';
  status: 'pending' | 'approved' | 'merged' | 'rejected';
  resolvedSpecialtyId?: string;
  createdAt: string;
}

export interface TaxonomyDatabase {
  categories: CreatorCategory[];
  specialties: SpecialtyItem[];
  pendingCustom: PendingCustomSpecialty[];
}

export type StorageFileType = 'video' | 'file' | 'image';

export interface StorageFileItem {
  id: string;
  userId: string;
  name: string;
  type: StorageFileType;
  sizeMb: number;
  mimeType: string;
  uploadedAt: string;
  thumbnailUrl?: string;
  accentHex?: string;
}

export interface StorageLimitsConfig {
  totalPlatformGb: number;
  freeQuotaMb: number;
  plusQuotaGb: number;
  maxVideoMb: number;
  maxFileMb: number;
  maxImageMb: number;
}

export interface StorageGrowthPoint {
  monthEn: string;
  monthAr: string;
  usedGb: number;
}

export interface ServiceCategory {
  id: string;
  slug: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  tintHex: string;
  deliverablesEn: string[];
  deliverablesAr: string[];
  requirementsEn: string[];
  requirementsAr: string[];
  isActive: boolean;
}

export interface RequestAttachment {
  name: string;
  sizeBytes: number;
  mimeType: string;
}

export interface ServiceRequest {
  id: string;
  referenceCode: string;
  serviceId: string;
  serviceTitleEn: string;
  serviceTitleAr: string;
  requesterId: string;
  requesterName: string;
  requesterPhone: string;
  projectTitle: string;
  brief: string;
  timelineNote: string;
  attachments: RequestAttachment[];
  status: RequestStatus;
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PortfolioWork {
  id: string;
  titleEn: string;
  titleAr: string;
  categoryEn: string;
  categoryAr: string;
  swatchHex: string;
  externalUrl?: string;
}

export interface FreelancerVideo {
  id: string;
  titleEn: string;
  titleAr: string;
  duration: string;
  views: string;
}

export interface FreelancerFilePlan {
  id: string;
  titleEn: string;
  titleAr: string;
  format: string;
  sizeLabel: string;
}

export type VerificationTier = 'none' | 'subscriber' | 'notable';

export type SubscriptionPlanMode = 'trial' | 'free' | 'plus';

export interface FreelancerProfile {
  id: string;
  userId: string;
  nameEn: string;
  nameAr: string;
  username: string;
  primarySpecialtyId?: string;
  primaryCustomSpecialty?: string;
  secondarySpecialtyIds?: string[];
  secondaryCustomSpecialty?: string;
  specialtyEn: string;
  specialtyAr: string;
  headlineEn: string;
  headlineAr: string;
  cityEn: string;
  cityAr: string;
  bioEn: string;
  bioAr: string;
  verified: boolean;
  verificationTier: VerificationTier;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  visibility: 'public' | 'hidden';
  skillsEn: string[];
  skillsAr: string[];
  languagesEn: string;
  languagesAr: string;
  cvFileName?: string;
  contactLinks: {
    instagram?: string;
    whatsapp?: string;
    website?: string;
    email?: string;
  };
  externalLinks: {
    portfolio?: string;
    behance?: string;
    linkedin?: string;
  };
  portfolio: PortfolioWork[];
  videos: FreelancerVideo[];
  servicesOfferedEn: string[];
  servicesOfferedAr: string[];
  filesAndPlans: FreelancerFilePlan[];
  avatarTint: string;
  avatarColor: string;
}

export interface CompanyProfile {
  id: string;
  nameEn: string;
  nameAr: string;
  initials: string;
  fieldEn: string;
  fieldAr: string;
  locationEn: string;
  locationAr: string;
  descriptionEn: string;
  descriptionAr: string;
  openPositionsCount: number;
  verified: boolean;
}

export type JobType = 'full-time' | 'freelance' | 'remote';

export interface JobPost {
  id: string;
  companyId: string;
  titleEn: string;
  titleAr: string;
  specialtyKey: 'engineering' | 'design' | 'development' | 'media' | 'medical';
  specialtyEn: string;
  specialtyAr: string;
  type: JobType;
  locationEn: string;
  locationAr: string;
  compensationEn: string;
  compensationAr: string;
}

export interface PlusPlanOption {
  id: '1m' | '6m' | '1y';
  durationEn: string;
  durationAr: string;
  priceIqd: string;
  perMonthEn: string;
  perMonthAr: string;
  bestValue?: boolean;
  savingsBadgeEn?: string;
  savingsBadgeAr?: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  titleEn: string;
  titleAr: string;
  bodyEn: string;
  bodyAr: string;
  read: boolean;
  createdAt: string;
}

export interface ModerationReport {
  id: string;
  reporterName: string;
  targetType: 'freelancer' | 'request' | 'account';
  targetLabel: string;
  reason: string;
  status: 'open' | 'resolved' | 'dismissed';
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  actor: string;
  action: string;
  target: string;
  timestamp: string;
}

export interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
}

export interface TweetComment {
  id: string;
  authorUserId: string;
  authorName: string;
  authorUsername: string;
  text: string;
  createdAt: string;
}

export interface FreelancerTweet {
  id: string;
  freelancerId: string;
  text: string;
  createdAt: string;
  likedBy: string[];
  comments: TweetComment[];
}
