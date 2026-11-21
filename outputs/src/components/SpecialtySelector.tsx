import React, { useMemo, useState } from 'react';
import { Check, Clock, Plus, X } from 'lucide-react';
import type { Locale, TaxonomyDatabase } from '../types/circle';
import { tText } from '../i18n/translations';
import {
  findCategoryById,
  findSpecialtyById,
  getSortedSpecialtiesForCategory,
  getSortedVisibleCategories,
} from '../utils/taxonomyHelpers';

export interface SpecialtySelectionValue {
  primarySpecialtyId?: string;
  primaryCustomSpecialty?: string;
  secondarySpecialtyIds: string[];
  secondaryCustomSpecialty?: string;
}

interface SpecialtySelectorProps {
  locale: Locale;
  taxonomy: TaxonomyDatabase;
  value: SpecialtySelectionValue;
  onChange: (next: SpecialtySelectionValue) => void;
  compact?: boolean;
}

export const SpecialtySelector: React.FC<SpecialtySelectorProps> = ({
  locale,
  taxonomy,
  value,
  onChange,
  compact = false,
}) => {
  const categories = useMemo(
    () => getSortedVisibleCategories(taxonomy),
    [taxonomy]
  );

  const initialPrimaryCategory = useMemo(() => {
    if (value.primaryCustomSpecialty && !value.primarySpecialtyId) {
      const otherCat = categories.find((c) => c.isOther);
      if (otherCat) return otherCat.id;
    }
    if (value.primarySpecialtyId) {
      const sp = findSpecialtyById(taxonomy, value.primarySpecialtyId);
      if (sp) return sp.categoryId;
    }
    return categories[0]?.id || 'cat-design';
  }, [categories, taxonomy, value.primaryCustomSpecialty, value.primarySpecialtyId]);

  const [primaryCatId, setPrimaryCatId] = useState<string>(initialPrimaryCategory);
  const [secondaryCatId, setSecondaryCatId] = useState<string>(
    categories[0]?.id || 'cat-design'
  );
  const [showSecondaryOther, setShowSecondaryOther] = useState<boolean>(
    Boolean(value.secondaryCustomSpecialty)
  );

  const primaryCat = findCategoryById(taxonomy, primaryCatId);
  const primarySpecs = primaryCat && !primaryCat.isOther
    ? getSortedSpecialtiesForCategory(taxonomy, primaryCat.id)
    : [];

  const secondaryCat = findCategoryById(taxonomy, secondaryCatId);
  const secondarySpecs = secondaryCat && !secondaryCat.isOther
    ? getSortedSpecialtiesForCategory(taxonomy, secondaryCat.id)
    : [];

  const selectedSecondaryCount =
    value.secondarySpecialtyIds.length +
    (value.secondaryCustomSpecialty?.trim() ? 1 : 0);

  const handleSelectPrimaryCategory = (catId: string) => {
    setPrimaryCatId(catId);
    const cat = findCategoryById(taxonomy, catId);
    if (cat?.isOther) {
      onChange({
        ...value,
        primarySpecialtyId: undefined,
        primaryCustomSpecialty: value.primaryCustomSpecialty || '',
      });
    } else {
      const firstSpec = getSortedSpecialtiesForCategory(taxonomy, catId)[0];
      onChange({
        ...value,
        primarySpecialtyId: firstSpec?.id,
        primaryCustomSpecialty: undefined,
      });
    }
  };

  const handleToggleSecondarySpecialty = (specId: string) => {
    if (value.primarySpecialtyId === specId) return;
    const exists = value.secondarySpecialtyIds.includes(specId);
    if (exists) {
      onChange({
        ...value,
        secondarySpecialtyIds: value.secondarySpecialtyIds.filter(
          (id) => id !== specId
        ),
      });
      return;
    }
    if (selectedSecondaryCount >= 2) return;
    onChange({
      ...value,
      secondarySpecialtyIds: [...value.secondarySpecialtyIds, specId],
    });
  };

  const primaryResolved = findSpecialtyById(taxonomy, value.primarySpecialtyId);

  return (
    <div className={compact ? 'space-y-4' : 'space-y-6'}>
      {/* LEVEL 1 & 2: PRIMARY SPECIALTY (REQUIRED) */}
      <div className="border border-[#050507]/15 rounded-xl bg-white p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-xs font-semibold text-[#050507]">
              {tText(locale, 'Primary Specialty', 'التخصص الرئيسي')}{' '}
              <span className="text-[#AC3333]">*</span>
            </div>
            <p className="text-[11px] text-[#5A5A60] mt-0.5">
              {tText(
                locale,
                'Step 1: Choose a category · Step 2: Pick your primary specialty',
                'الخطوة ١: اختر الفئة · الخطوة ٢: اختر تخصصك الرئيسي'
              )}
            </p>
          </div>
          {(primaryResolved || value.primaryCustomSpecialty?.trim()) && (
            <span className="text-[11px] font-medium px-2.5 py-0.5 border border-[#AC3333]/40 text-[#AC3333] bg-[#FBF8F8]">
              {primaryResolved
                ? tText(locale, primaryResolved.nameEn, primaryResolved.nameAr)
                : value.primaryCustomSpecialty}
            </span>
          )}
        </div>

        {/* Step 1: Categories */}
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => {
            const active = primaryCatId === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleSelectPrimaryCategory(cat.id)}
                className={`px-2.5 py-1.5 text-[11px] font-medium border rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  active
                    ? 'border-[#050507] bg-[#050507] text-white'
                    : 'border-[#050507]/15 bg-white text-[#5A5A60] hover:border-[#050507]/40 hover:text-[#050507]'
                }`}
              >
                {tText(locale, cat.nameEn, cat.nameAr)}
              </button>
            );
          })}
        </div>

        {/* Step 2: Specialties or Other Free Text */}
        {primaryCat?.isOther ? (
          <div className="pt-2 border-t border-[#ececec] space-y-2">
            <label className="block text-[11px] font-medium text-[#050507]">
              {tText(
                locale,
                'Enter your custom specialty',
                'اكتب تخصصك المخصص'
              )}
            </label>
            <input
              type="text"
              value={value.primaryCustomSpecialty || ''}
              onChange={(e) =>
                onChange({
                  ...value,
                  primarySpecialtyId: undefined,
                  primaryCustomSpecialty: e.target.value,
                })
              }
              placeholder={tText(
                locale,
                'e.g. Architectural Lighting Consultant',
                'مثال: مستشار إضاءة معمارية'
              )}
              className="w-full h-10 px-3 rounded-lg border border-[#050507]/20 text-xs focus:outline-none focus:border-[#AC3333]"
            />
            <div className="flex items-center gap-1.5 text-[11px] text-[#AC3333]">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span>
                {tText(
                  locale,
                  'Saved as pending for Admin review (approve or merge).',
                  'سيُحفظ كطلب قيد المراجعة لدى الإدارة لاعتماده أو دمجه.'
                )}
              </span>
            </div>
          </div>
        ) : (
          <div className="pt-2 border-t border-[#ececec] flex flex-wrap gap-1.5">
            {primarySpecs.map((sp) => {
              const selected = value.primarySpecialtyId === sp.id;
              return (
                <button
                  key={sp.id}
                  type="button"
                  onClick={() =>
                    onChange({
                      ...value,
                      primarySpecialtyId: sp.id,
                      primaryCustomSpecialty: undefined,
                      secondarySpecialtyIds: value.secondarySpecialtyIds.filter(
                        (id) => id !== sp.id
                      ),
                    })
                  }
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium border rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                    selected
                      ? 'border-[#AC3333] text-[#AC3333] bg-[#FBF8F8]'
                      : 'border-[#050507]/15 text-[#050507] bg-white hover:border-[#050507]/40'
                  }`}
                >
                  {selected && <Check className="w-3 h-3 text-[#AC3333]" />}
                  <span>{tText(locale, sp.nameEn, sp.nameAr)}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* SECONDARY SPECIALTIES (OPTIONAL, MAX 2) */}
      <div className="border border-[#050507]/15 rounded-xl bg-white p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-xs font-semibold text-[#050507]">
              {tText(
                locale,
                'Secondary Specialties (Optional · Up to 2)',
                'التخصصات الثانوية (اختياري · بحد أقصى ٢)'
              )}
            </div>
            <p className="text-[11px] text-[#5A5A60] mt-0.5">
              {tText(
                locale,
                'Highlight complementary skills across any category.',
                'أضف مهارات مساندة من أي فئة.'
              )}
            </p>
          </div>
          <span className="font-mono-tabular text-[11px] text-[#5A5A60]">
            {selectedSecondaryCount}/2
          </span>
        </div>

        {/* Selected Secondary Tags */}
        {(value.secondarySpecialtyIds.length > 0 ||
          value.secondaryCustomSpecialty?.trim()) && (
          <div className="flex flex-wrap gap-1.5">
            {value.secondarySpecialtyIds.map((id) => {
              const sp = findSpecialtyById(taxonomy, id);
              if (!sp) return null;
              return (
                <span
                  key={id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium border border-[#050507]/25 bg-white text-[#050507] rounded-md"
                >
                  <span>{tText(locale, sp.nameEn, sp.nameAr)}</span>
                  <button
                    type="button"
                    onClick={() => handleToggleSecondarySpecialty(id)}
                    aria-label="Remove secondary specialty"
                    className="text-[#5A5A60] hover:text-[#AC3333] cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              );
            })}
            {value.secondaryCustomSpecialty?.trim() && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium border border-[#AC3333]/40 bg-[#FBF8F8] text-[#AC3333] rounded-md">
                <span>{value.secondaryCustomSpecialty}</span>
                <button
                  type="button"
                  onClick={() => {
                    setShowSecondaryOther(false);
                    onChange({ ...value, secondaryCustomSpecialty: undefined });
                  }}
                  aria-label="Remove custom secondary specialty"
                  className="hover:text-[#050507] cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        )}

        {/* Secondary Category Tabs */}
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => {
            const active =
              (cat.isOther && showSecondaryOther) ||
              (!showSecondaryOther && secondaryCatId === cat.id);
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  if (cat.isOther) {
                    if (selectedSecondaryCount < 2 || value.secondaryCustomSpecialty) {
                      setShowSecondaryOther(true);
                    }
                  } else {
                    setShowSecondaryOther(false);
                    setSecondaryCatId(cat.id);
                  }
                }}
                className={`px-2 py-1 text-[11px] font-medium border rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  active
                    ? 'border-[#050507] text-[#050507] bg-[#F6F4F1]'
                    : 'border-[#ececec] text-[#5A5A60] hover:border-[#050507]/30'
                }`}
              >
                {tText(locale, cat.nameEn, cat.nameAr)}
              </button>
            );
          })}
        </div>

        {showSecondaryOther ? (
          <div className="pt-2 border-t border-[#ececec] space-y-2">
            <input
              type="text"
              disabled={selectedSecondaryCount >= 2 && !value.secondaryCustomSpecialty}
              value={value.secondaryCustomSpecialty || ''}
              onChange={(e) =>
                onChange({
                  ...value,
                  secondaryCustomSpecialty: e.target.value,
                })
              }
              placeholder={tText(
                locale,
                'Write custom secondary specialty (pending admin review)...',
                'اكتب التخصص الثانوي المخصص (قيد مراجعة الإدارة)...'
              )}
              className="w-full h-9 px-3 rounded-lg border border-[#050507]/20 text-xs focus:outline-none focus:border-[#AC3333]"
            />
          </div>
        ) : (
          <div className="pt-2 border-t border-[#ececec] flex flex-wrap gap-1.5">
            {secondarySpecs.map((sp) => {
              const isPrimary = value.primarySpecialtyId === sp.id;
              const isSelected = value.secondarySpecialtyIds.includes(sp.id);
              const disabled = isPrimary || (!isSelected && selectedSecondaryCount >= 2);
              return (
                <button
                  key={sp.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => handleToggleSecondarySpecialty(sp.id)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] border rounded-md transition-colors ${
                    isPrimary
                      ? 'border-[#ececec] text-[#5A5A60]/40 bg-[#F6F4F1] cursor-not-allowed'
                      : isSelected
                        ? 'border-[#AC3333] text-[#AC3333] bg-[#FBF8F8] cursor-pointer'
                        : disabled
                          ? 'border-[#ececec] text-[#5A5A60]/45 bg-white cursor-not-allowed'
                          : 'border-[#050507]/15 text-[#050507] bg-white hover:border-[#050507]/40 cursor-pointer'
                  }`}
                >
                  {isSelected ? (
                    <Check className="w-3 h-3 text-[#AC3333]" />
                  ) : (
                    <Plus className="w-3 h-3 text-[#5A5A60]" />
                  )}
                  <span>{tText(locale, sp.nameEn, sp.nameAr)}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
