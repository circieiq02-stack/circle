import type {
  CreatorCategory,
  FreelancerProfile,
  Locale,
  SpecialtyItem,
  TaxonomyDatabase,
} from '../types/circle';
import { tText } from '../i18n/translations';

export function getSortedVisibleCategories(taxonomy: TaxonomyDatabase): CreatorCategory[] {
  return [...taxonomy.categories]
    .filter((c) => !c.hidden)
    .sort((a, b) => a.order - b.order);
}

export function getSortedSpecialtiesForCategory(
  taxonomy: TaxonomyDatabase,
  categoryId: string,
  includeHidden = false
): SpecialtyItem[] {
  return [...taxonomy.specialties]
    .filter((s) => s.categoryId === categoryId && (includeHidden || !s.hidden))
    .sort((a, b) => a.order - b.order);
}

export function findSpecialtyById(
  taxonomy: TaxonomyDatabase,
  specialtyId?: string
): SpecialtyItem | undefined {
  if (!specialtyId) return undefined;
  return taxonomy.specialties.find((s) => s.id === specialtyId);
}

export function findCategoryById(
  taxonomy: TaxonomyDatabase,
  categoryId?: string
): CreatorCategory | undefined {
  if (!categoryId) return undefined;
  return taxonomy.categories.find((c) => c.id === categoryId);
}

export function resolvePrimarySpecialtyLabel(
  fl: Pick<
    FreelancerProfile,
    'primarySpecialtyId' | 'primaryCustomSpecialty' | 'specialtyEn' | 'specialtyAr'
  >,
  taxonomy: TaxonomyDatabase,
  locale: Locale
): { label: string; isPendingCustom: boolean } {
  if (fl.primarySpecialtyId) {
    const sp = findSpecialtyById(taxonomy, fl.primarySpecialtyId);
    if (sp) {
      return { label: tText(locale, sp.nameEn, sp.nameAr), isPendingCustom: false };
    }
  }
  if (fl.primaryCustomSpecialty?.trim()) {
    return { label: fl.primaryCustomSpecialty.trim(), isPendingCustom: true };
  }
  return {
    label: tText(locale, fl.specialtyEn, fl.specialtyAr),
    isPendingCustom: false,
  };
}

export function resolveSecondarySpecialtyLabels(
  fl: Pick<FreelancerProfile, 'secondarySpecialtyIds' | 'secondaryCustomSpecialty'>,
  taxonomy: TaxonomyDatabase,
  locale: Locale
): Array<{ id: string; label: string; isPendingCustom?: boolean }> {
  const tags: Array<{ id: string; label: string; isPendingCustom?: boolean }> = [];
  for (const id of fl.secondarySpecialtyIds || []) {
    const sp = findSpecialtyById(taxonomy, id);
    if (sp && !sp.hidden) {
      tags.push({ id: sp.id, label: tText(locale, sp.nameEn, sp.nameAr) });
    }
  }
  if (fl.secondaryCustomSpecialty?.trim()) {
    tags.push({
      id: 'custom-secondary',
      label: fl.secondaryCustomSpecialty.trim(),
      isPendingCustom: true,
    });
  }
  return tags.slice(0, 2);
}

export function freelancerHasSpecialty(
  fl: FreelancerProfile,
  specialtyId: string
): boolean {
  if (fl.primarySpecialtyId === specialtyId) return true;
  if (fl.secondarySpecialtyIds?.includes(specialtyId)) return true;
  return false;
}

export function freelancerBelongsToCategory(
  fl: FreelancerProfile,
  categoryId: string,
  taxonomy: TaxonomyDatabase
): boolean {
  const category = findCategoryById(taxonomy, categoryId);
  if (category?.isOther) {
    return Boolean(
      fl.primaryCustomSpecialty?.trim() || fl.secondaryCustomSpecialty?.trim()
    );
  }
  const catSpecIds = new Set(
    taxonomy.specialties.filter((s) => s.categoryId === categoryId).map((s) => s.id)
  );
  if (fl.primarySpecialtyId && catSpecIds.has(fl.primarySpecialtyId)) return true;
  return Boolean(fl.secondarySpecialtyIds?.some((id) => catSpecIds.has(id)));
}

export function matchesCreatorFilters(
  fl: FreelancerProfile,
  taxonomy: TaxonomyDatabase,
  options: {
    categoryId: string;
    specialtyId: string;
    query: string;
    tierFilter?: string;
  }
): boolean {
  const { categoryId, specialtyId, query, tierFilter } = options;

  if (tierFilter && tierFilter !== 'all' && fl.verificationTier !== tierFilter) {
    return false;
  }
  if (categoryId !== 'all' && !freelancerBelongsToCategory(fl, categoryId, taxonomy)) {
    return false;
  }
  if (specialtyId !== 'all' && !freelancerHasSpecialty(fl, specialtyId)) {
    return false;
  }

  const trimmed = query.trim();
  if (!trimmed) return true;
  const q = trimmed.toLowerCase();

  const primary = resolvePrimarySpecialtyLabel(fl, taxonomy, 'en').label.toLowerCase();
  const primaryAr = resolvePrimarySpecialtyLabel(fl, taxonomy, 'ar').label;
  const secEn = resolveSecondarySpecialtyLabels(fl, taxonomy, 'en').map((s) =>
    s.label.toLowerCase()
  );
  const secAr = resolveSecondarySpecialtyLabels(fl, taxonomy, 'ar').map((s) => s.label);

  return (
    fl.nameEn.toLowerCase().includes(q) ||
    fl.nameAr.includes(trimmed) ||
    fl.username.toLowerCase().includes(q) ||
    fl.cityEn.toLowerCase().includes(q) ||
    fl.cityAr.includes(trimmed) ||
    fl.headlineEn.toLowerCase().includes(q) ||
    fl.headlineAr.includes(trimmed) ||
    primary.includes(q) ||
    primaryAr.includes(trimmed) ||
    secEn.some((t) => t.includes(q)) ||
    secAr.some((t) => t.includes(trimmed)) ||
    fl.skillsEn.some((s) => s.toLowerCase().includes(q)) ||
    fl.skillsAr.some((s) => s.includes(trimmed))
  );
}

export function countCreatorsInSpecialty(
  freelancers: FreelancerProfile[],
  specialtyId: string
): number {
  return freelancers.filter((fl) => freelancerHasSpecialty(fl, specialtyId)).length;
}

export function countCreatorsInCategory(
  freelancers: FreelancerProfile[],
  categoryId: string,
  taxonomy: TaxonomyDatabase
): number {
  return freelancers.filter((fl) =>
    freelancerBelongsToCategory(fl, categoryId, taxonomy)
  ).length;
}
