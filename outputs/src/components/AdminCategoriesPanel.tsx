import React, { useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Check,
  Clock,
  Edit3,
  Eye,
  EyeOff,
  GitMerge,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import type {
  CreatorCategory,
  FreelancerProfile,
  Locale,
  PendingCustomSpecialty,
  SpecialtyItem,
  TaxonomyDatabase,
} from '../types/circle';
import { tText } from '../i18n/translations';
import {
  countCreatorsInCategory,
  countCreatorsInSpecialty,
} from '../utils/taxonomyHelpers';

interface AdminCategoriesPanelProps {
  locale: Locale;
  taxonomy: TaxonomyDatabase;
  freelancers: FreelancerProfile[];
  onUpdateTaxonomy: (next: TaxonomyDatabase) => void;
  onResolvePendingSpecialty: (payload: {
    pendingId: string;
    action: 'approve_new' | 'merge' | 'dismiss';
    categoryId?: string;
    newNameEn?: string;
    newNameAr?: string;
    mergeSpecialtyId?: string;
  }) => void;
}

export const AdminCategoriesPanel: React.FC<AdminCategoriesPanelProps> = ({
  locale,
  taxonomy,
  freelancers,
  onUpdateTaxonomy,
  onResolvePendingSpecialty,
}) => {
  const [newCatEn, setNewCatEn] = useState('');
  const [newCatAr, setNewCatAr] = useState('');

  const [newSpecByCat, setNewSpecByCat] = useState<
    Record<string, { en: string; ar: string }>
  >({});

  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editCatDraft, setEditCatDraft] = useState({ en: '', ar: '' });

  const [editingSpecId, setEditingSpecId] = useState<string | null>(null);
  const [editSpecDraft, setEditSpecDraft] = useState({ en: '', ar: '' });

  // Pending custom review state
  const [pendingForms, setPendingForms] = useState<
    Record<
      string,
      {
        mode: 'approve_new' | 'merge';
        categoryId: string;
        nameEn: string;
        nameAr: string;
        mergeSpecialtyId: string;
      }
    >
  >({});

  const sortedCategories = [...taxonomy.categories].sort(
    (a, b) => a.order - b.order
  );
  const assignableCategories = sortedCategories.filter((c) => !c.isOther);
  const pendingItems = taxonomy.pendingCustom.filter(
    (p) => p.status === 'pending'
  );

  const getPendingDraft = (item: PendingCustomSpecialty) => {
    return (
      pendingForms[item.id] || {
        mode: 'approve_new' as const,
        categoryId: assignableCategories[0]?.id || 'cat-design',
        nameEn: item.customText,
        nameAr: item.customText,
        mergeSpecialtyId: taxonomy.specialties[0]?.id || 'sp-graphic',
      }
    );
  };

  const setPendingDraft = (
    id: string,
    patch: Partial<{
      mode: 'approve_new' | 'merge';
      categoryId: string;
      nameEn: string;
      nameAr: string;
      mergeSpecialtyId: string;
    }>,
    fallback: PendingCustomSpecialty
  ) => {
    const base = getPendingDraft(fallback);
    setPendingForms((prev) => ({
      ...prev,
      [id]: { ...base, ...patch },
    }));
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatEn.trim() || !newCatAr.trim()) return;
    const maxOrder = Math.max(0, ...taxonomy.categories.map((c) => c.order));
    const created: CreatorCategory = {
      id: `cat-${Date.now()}`,
      nameEn: newCatEn.trim(),
      nameAr: newCatAr.trim(),
      order: maxOrder + 1,
      hidden: false,
    };
    onUpdateTaxonomy({
      ...taxonomy,
      categories: [...taxonomy.categories, created],
    });
    setNewCatEn('');
    setNewCatAr('');
  };

  const handleReorderCategory = (catId: string, dir: -1 | 1) => {
    const idx = sortedCategories.findIndex((c) => c.id === catId);
    const swapIdx = idx + dir;
    if (idx < 0 || swapIdx < 0 || swapIdx >= sortedCategories.length) return;
    const copy = [...sortedCategories];
    const [item] = copy.splice(idx, 1);
    copy.splice(swapIdx, 0, item);
    const reindexed = copy.map((c, i) => ({ ...c, order: i + 1 }));
    onUpdateTaxonomy({ ...taxonomy, categories: reindexed });
  };

  const handleToggleCategoryHidden = (catId: string) => {
    onUpdateTaxonomy({
      ...taxonomy,
      categories: taxonomy.categories.map((c) =>
        c.id === catId ? { ...c, hidden: !c.hidden } : c
      ),
    });
  };

  const handleDeleteCategory = (catId: string) => {
    onUpdateTaxonomy({
      ...taxonomy,
      categories: taxonomy.categories.filter((c) => c.id !== catId),
      specialties: taxonomy.specialties.filter((s) => s.categoryId !== catId),
    });
  };

  const handleSaveCategoryEdit = (catId: string) => {
    if (!editCatDraft.en.trim() || !editCatDraft.ar.trim()) return;
    onUpdateTaxonomy({
      ...taxonomy,
      categories: taxonomy.categories.map((c) =>
        c.id === catId
          ? {
              ...c,
              nameEn: editCatDraft.en.trim(),
              nameAr: editCatDraft.ar.trim(),
            }
          : c
      ),
    });
    setEditingCatId(null);
  };

  const handleAddSpecialty = (catId: string) => {
    const draft = newSpecByCat[catId];
    if (!draft?.en?.trim() || !draft?.ar?.trim()) return;
    const catSpecs = taxonomy.specialties.filter((s) => s.categoryId === catId);
    const maxOrder = Math.max(0, ...catSpecs.map((s) => s.order));
    const created: SpecialtyItem = {
      id: `sp-${Date.now()}`,
      categoryId: catId,
      nameEn: draft.en.trim(),
      nameAr: draft.ar.trim(),
      order: maxOrder + 1,
      hidden: false,
    };
    onUpdateTaxonomy({
      ...taxonomy,
      specialties: [...taxonomy.specialties, created],
    });
    setNewSpecByCat((prev) => ({ ...prev, [catId]: { en: '', ar: '' } }));
  };

  const handleReorderSpecialty = (catId: string, specId: string, dir: -1 | 1) => {
    const catSpecs = taxonomy.specialties
      .filter((s) => s.categoryId === catId)
      .sort((a, b) => a.order - b.order);
    const idx = catSpecs.findIndex((s) => s.id === specId);
    const swapIdx = idx + dir;
    if (idx < 0 || swapIdx < 0 || swapIdx >= catSpecs.length) return;
    const copy = [...catSpecs];
    const [item] = copy.splice(idx, 1);
    copy.splice(swapIdx, 0, item);
    const orderMap = new Map(copy.map((s, i) => [s.id, i + 1]));
    onUpdateTaxonomy({
      ...taxonomy,
      specialties: taxonomy.specialties.map((s) =>
        orderMap.has(s.id) ? { ...s, order: orderMap.get(s.id)! } : s
      ),
    });
  };

  const handleToggleSpecialtyHidden = (specId: string) => {
    onUpdateTaxonomy({
      ...taxonomy,
      specialties: taxonomy.specialties.map((s) =>
        s.id === specId ? { ...s, hidden: !s.hidden } : s
      ),
    });
  };

  const handleDeleteSpecialty = (specId: string) => {
    onUpdateTaxonomy({
      ...taxonomy,
      specialties: taxonomy.specialties.filter((s) => s.id !== specId),
    });
  };

  const handleSaveSpecialtyEdit = (specId: string) => {
    if (!editSpecDraft.en.trim() || !editSpecDraft.ar.trim()) return;
    onUpdateTaxonomy({
      ...taxonomy,
      specialties: taxonomy.specialties.map((s) =>
        s.id === specId
          ? {
              ...s,
              nameEn: editSpecDraft.en.trim(),
              nameAr: editSpecDraft.ar.trim(),
            }
          : s
      ),
    });
    setEditingSpecId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-[#ececec] bg-white p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#AC3333]">
            {tText(locale, 'Database-Driven Classification', 'نظام التصنيف الثنائي — قاعدة البيانات')}
          </div>
          <h1 className="font-display text-2xl font-bold text-[#050507] mt-1">
            {tText(
              locale,
              'Categories & Specialties Management',
              'إدارة الفئات والتخصصات'
            )}
          </h1>
          <p className="text-xs text-[#5A5A60] mt-1">
            {tText(
              locale,
              'Add, rename (EN/AR), reorder, hide, or delete categories and specialties. Changes reflect immediately in registration, profile editing, and the creators gallery.',
              'أضف وأعد تسمية ورتّب وأخفِ أو احذف الفئات والتخصصات باللغتين. التغييرات تنعكس فوراً على التسجيل والملفات ومعرض المبدعين.'
            )}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="border border-[#ececec] rounded-xl px-3.5 py-2 text-center">
            <div className="font-mono-tabular text-lg font-bold text-[#050507]">
              {taxonomy.categories.length}
            </div>
            <div className="text-[10px] text-[#5A5A60]">
              {tText(locale, 'Categories', 'فئات')}
            </div>
          </div>
          <div className="border border-[#ececec] rounded-xl px-3.5 py-2 text-center">
            <div className="font-mono-tabular text-lg font-bold text-[#050507]">
              {taxonomy.specialties.length}
            </div>
            <div className="text-[10px] text-[#5A5A60]">
              {tText(locale, 'Specialties', 'تخصصات')}
            </div>
          </div>
          <div className="border border-[#AC3333]/35 bg-[#FBF8F8] rounded-xl px-3.5 py-2 text-center">
            <div className="font-mono-tabular text-lg font-bold text-[#AC3333]">
              {pendingItems.length}
            </div>
            <div className="text-[10px] text-[#AC3333]">
              {tText(locale, 'Pending Other', 'بانتظار المراجعة')}
            </div>
          </div>
        </div>
      </div>

      {/* Pending Custom Specialties ("Other") Queue */}
      <div className="rounded-2xl border border-[#ececec] bg-white overflow-hidden">
        <div className="px-6 py-4 border-b border-[#ececec] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#AC3333]" />
            <h2 className="font-display text-base font-bold text-[#050507]">
              {tText(
                locale,
                'Pending Custom Specialties ("Other" Submissions)',
                'التخصصات المخصصة قيد الانتظار (خيار "أخرى")'
              )}
            </h2>
          </div>
          <span className="font-mono-tabular text-xs text-[#5A5A60]">
            {pendingItems.length} {tText(locale, 'pending', 'قيد المراجعة')}
          </span>
        </div>

        {pendingItems.length === 0 ? (
          <div className="p-6 text-xs text-[#5A5A60]">
            {tText(
              locale,
              'No pending custom specialty requests right now.',
              'لا توجد تخصصات مخصصة بانتظار المراجعة حالياً.'
            )}
          </div>
        ) : (
          <div className="divide-y divide-[#ececec]">
            {pendingItems.map((item) => {
              const draft = getPendingDraft(item);
              return (
                <div key={item.id} className="p-5 space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[#050507]">
                          “{item.customText}”
                        </span>
                        <span className="text-[10px] px-2 py-0.5 border border-[#AC3333]/35 text-[#AC3333] bg-[#FBF8F8] rounded">
                          {item.roleType === 'primary'
                            ? tText(locale, 'Primary', 'تخصص رئيسي')
                            : tText(locale, 'Secondary', 'تخصص ثانوي')}
                        </span>
                      </div>
                      <div className="text-xs text-[#5A5A60] mt-0.5">
                        {tText(locale, item.userDisplayNameEn, item.userDisplayNameAr)} (@
                        {item.username}) · {item.createdAt.slice(0, 10)}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          setPendingDraft(item.id, { mode: 'approve_new' }, item)
                        }
                        className={`px-2.5 py-1.5 text-xs font-medium border rounded-lg cursor-pointer ${
                          draft.mode === 'approve_new'
                            ? 'border-[#050507] bg-[#050507] text-white'
                            : 'border-[#ececec] bg-white text-[#5A5A60]'
                        }`}
                      >
                        {tText(locale, 'Add as New', 'إضافة كتخصص جديد')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingDraft(item.id, { mode: 'merge' }, item)}
                        className={`px-2.5 py-1.5 text-xs font-medium border rounded-lg cursor-pointer ${
                          draft.mode === 'merge'
                            ? 'border-[#050507] bg-[#050507] text-white'
                            : 'border-[#ececec] bg-white text-[#5A5A60]'
                        }`}
                      >
                        {tText(locale, 'Merge into Existing', 'دمج مع تخصص حالي')}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onResolvePendingSpecialty({
                            pendingId: item.id,
                            action: 'dismiss',
                          })
                        }
                        className="px-2.5 py-1.5 text-xs font-medium border border-[#ececec] text-[#5A5A60] hover:text-[#AC3333] rounded-lg cursor-pointer"
                      >
                        {tText(locale, 'Dismiss', 'رفض')}
                      </button>
                    </div>
                  </div>

                  {draft.mode === 'approve_new' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-2 bg-[#F6F4F1]/60 p-3 rounded-xl border border-[#ececec]">
                      <select
                        value={draft.categoryId}
                        onChange={(e) =>
                          setPendingDraft(
                            item.id,
                            { categoryId: e.target.value },
                            item
                          )
                        }
                        className="h-9 px-2.5 rounded-lg border border-[#ececec] bg-white text-xs"
                      >
                        {assignableCategories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {tText(locale, c.nameEn, c.nameAr)}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={draft.nameEn}
                        onChange={(e) =>
                          setPendingDraft(item.id, { nameEn: e.target.value }, item)
                        }
                        placeholder="English name"
                        className="h-9 px-2.5 rounded-lg border border-[#ececec] bg-white text-xs"
                      />
                      <input
                        type="text"
                        value={draft.nameAr}
                        onChange={(e) =>
                          setPendingDraft(item.id, { nameAr: e.target.value }, item)
                        }
                        placeholder="الاسم بالعربية"
                        className="h-9 px-2.5 rounded-lg border border-[#ececec] bg-white text-xs"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          onResolvePendingSpecialty({
                            pendingId: item.id,
                            action: 'approve_new',
                            categoryId: draft.categoryId,
                            newNameEn: draft.nameEn,
                            newNameAr: draft.nameAr,
                          })
                        }
                        className="h-9 px-3 rounded-lg bg-[#AC3333] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 hover:bg-[#932828] cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{tText(locale, 'Approve & Add', 'اعتماد وإضافة')}</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row gap-2 pt-2 bg-[#F6F4F1]/60 p-3 rounded-xl border border-[#ececec]">
                      <select
                        value={draft.mergeSpecialtyId}
                        onChange={(e) =>
                          setPendingDraft(
                            item.id,
                            { mergeSpecialtyId: e.target.value },
                            item
                          )
                        }
                        className="flex-1 h-9 px-2.5 rounded-lg border border-[#ececec] bg-white text-xs"
                      >
                        {taxonomy.specialties.map((s) => {
                          const parent = taxonomy.categories.find(
                            (c) => c.id === s.categoryId
                          );
                          return (
                            <option key={s.id} value={s.id}>
                              {parent
                                ? `${tText(locale, parent.nameEn, parent.nameAr)} → `
                                : ''}
                              {tText(locale, s.nameEn, s.nameAr)}
                            </option>
                          );
                        })}
                      </select>
                      <button
                        type="button"
                        onClick={() =>
                          onResolvePendingSpecialty({
                            pendingId: item.id,
                            action: 'merge',
                            mergeSpecialtyId: draft.mergeSpecialtyId,
                          })
                        }
                        className="h-9 px-4 rounded-lg bg-[#050507] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 hover:bg-[#1B1B1F] cursor-pointer"
                      >
                        <GitMerge className="w-3.5 h-3.5" />
                        <span>{tText(locale, 'Merge Specialty', 'دمج التخصص')}</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Category Form */}
      <form
        onSubmit={handleAddCategory}
        className="rounded-2xl border border-[#ececec] bg-white p-5 space-y-3"
      >
        <div className="text-xs font-semibold text-[#050507]">
          {tText(locale, 'Add New Category', 'إضافة فئة جديدة')}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <input
            type="text"
            value={newCatEn}
            onChange={(e) => setNewCatEn(e.target.value)}
            placeholder={tText(locale, 'Category name (English)', 'اسم الفئة (بالإنجليزية)')}
            className="h-10 px-3 rounded-xl border border-[#ececec] text-xs focus:outline-none focus:border-[#050507]"
            required
          />
          <input
            type="text"
            value={newCatAr}
            onChange={(e) => setNewCatAr(e.target.value)}
            placeholder={tText(locale, 'Category name (Arabic)', 'اسم الفئة (بالعربية)')}
            className="h-10 px-3 rounded-xl border border-[#ececec] text-xs focus:outline-none focus:border-[#050507]"
            required
          />
          <button
            type="submit"
            className="h-10 px-4 rounded-xl bg-[#050507] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 hover:bg-[#1B1B1F] cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{tText(locale, 'Add Category', 'إضافة الفئة')}</span>
          </button>
        </div>
      </form>

      {/* Categories Tree */}
      <div className="space-y-4">
        {sortedCategories.map((cat, idx) => {
          const catCount = countCreatorsInCategory(freelancers, cat.id, taxonomy);
          const catSpecs = taxonomy.specialties
            .filter((s) => s.categoryId === cat.id)
            .sort((a, b) => a.order - b.order);
          const draftNewSpec = newSpecByCat[cat.id] || { en: '', ar: '' };

          return (
            <div
              key={cat.id}
              className={`rounded-2xl border bg-white overflow-hidden ${
                cat.hidden ? 'border-[#ececec] opacity-65' : 'border-[#ececec]'
              }`}
            >
              {/* Category Header Row */}
              <div className="px-5 py-4 bg-[#F6F4F1]/55 border-b border-[#ececec] flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-mono-tabular text-xs font-semibold text-[#5A5A60]">
                    {String(idx + 1).padStart(2, '0')}
                  </span>

                  {editingCatId === cat.id ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="text"
                        value={editCatDraft.en}
                        onChange={(e) =>
                          setEditCatDraft((p) => ({ ...p, en: e.target.value }))
                        }
                        className="h-8 px-2.5 rounded-lg border border-[#050507] bg-white text-xs"
                      />
                      <input
                        type="text"
                        value={editCatDraft.ar}
                        onChange={(e) =>
                          setEditCatDraft((p) => ({ ...p, ar: e.target.value }))
                        }
                        className="h-8 px-2.5 rounded-lg border border-[#050507] bg-white text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveCategoryEdit(cat.id)}
                        className="h-8 px-2.5 rounded-lg bg-[#AC3333] text-white text-xs font-semibold cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingCatId(null)}
                        className="h-8 px-2.5 rounded-lg border border-[#ececec] bg-white text-xs cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-[#050507]">
                          {cat.nameEn}
                        </span>
                        <span className="text-xs text-[#5A5A60]">· {cat.nameAr}</span>
                        {cat.hidden && (
                          <span className="text-[10px] px-2 py-0.5 border border-[#050507]/20 text-[#5A5A60] rounded">
                            {tText(locale, 'Hidden', 'مخفي')}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="font-mono-tabular text-[11px] px-2.5 py-1 border border-[#050507]/15 bg-white rounded-md text-[#050507]">
                    {catCount} {tText(locale, 'users', 'مستخدم')}
                  </span>

                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => handleReorderCategory(cat.id, -1)}
                    aria-label="Move category up"
                    className="p-1.5 rounded-lg border border-[#ececec] bg-white text-[#5A5A60] hover:text-[#050507] disabled:opacity-35 cursor-pointer"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === sortedCategories.length - 1}
                    onClick={() => handleReorderCategory(cat.id, 1)}
                    aria-label="Move category down"
                    className="p-1.5 rounded-lg border border-[#ececec] bg-white text-[#5A5A60] hover:text-[#050507] disabled:opacity-35 cursor-pointer"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCatId(cat.id);
                      setEditCatDraft({ en: cat.nameEn, ar: cat.nameAr });
                    }}
                    aria-label="Rename category"
                    className="p-1.5 rounded-lg border border-[#ececec] bg-white text-[#5A5A60] hover:text-[#050507] cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleCategoryHidden(cat.id)}
                    aria-label="Toggle category visibility"
                    className="p-1.5 rounded-lg border border-[#ececec] bg-white text-[#5A5A60] hover:text-[#050507] cursor-pointer"
                  >
                    {cat.hidden ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                  {!cat.isOther && (
                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(cat.id)}
                      aria-label="Delete category"
                      className="p-1.5 rounded-lg border border-[#ececec] bg-white text-[#5A5A60] hover:text-[#AC3333] cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Specialties inside Category */}
              {cat.isOther ? (
                <div className="px-5 py-3 text-xs text-[#5A5A60]">
                  {tText(
                    locale,
                    'System free-text option. User submissions appear in Pending Custom Specialties above.',
                    'خيار نص حر للنظام. تظهر إدخالات المستخدمين في قائمة المراجعة أعلاه.'
                  )}
                </div>
              ) : (
                <div className="divide-y divide-[#ececec]">
                  {catSpecs.map((sp, spIdx) => {
                    const specCount = countCreatorsInSpecialty(freelancers, sp.id);
                    return (
                      <div
                        key={sp.id}
                        className={`px-5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs ${
                          sp.hidden ? 'opacity-55 bg-[#F6F4F1]/40' : ''
                        }`}
                      >
                        {editingSpecId === sp.id ? (
                          <div className="flex flex-wrap items-center gap-2">
                            <input
                              type="text"
                              value={editSpecDraft.en}
                              onChange={(e) =>
                                setEditSpecDraft((p) => ({
                                  ...p,
                                  en: e.target.value,
                                }))
                              }
                              className="h-8 px-2.5 rounded-lg border border-[#050507] text-xs"
                            />
                            <input
                              type="text"
                              value={editSpecDraft.ar}
                              onChange={(e) =>
                                setEditSpecDraft((p) => ({
                                  ...p,
                                  ar: e.target.value,
                                }))
                              }
                              className="h-8 px-2.5 rounded-lg border border-[#050507] text-xs"
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveSpecialtyEdit(sp.id)}
                              className="h-8 px-2.5 rounded-lg bg-[#AC3333] text-white cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingSpecId(null)}
                              className="h-8 px-2.5 rounded-lg border border-[#ececec] cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-medium text-[#050507]">
                              {sp.nameEn}
                            </span>
                            <span className="text-[#5A5A60]">· {sp.nameAr}</span>
                            {sp.hidden && (
                              <span className="text-[10px] px-1.5 py-0.5 border border-[#ececec] text-[#5A5A60] rounded">
                                {tText(locale, 'Hidden', 'مخفي')}
                              </span>
                            )}
                          </div>
                        )}

                        <div className="flex items-center gap-1.5">
                          <span className="font-mono-tabular text-[11px] text-[#5A5A60] px-2 py-0.5 border border-[#ececec] rounded">
                            {specCount} {tText(locale, 'users', 'مستخدم')}
                          </span>
                          <button
                            type="button"
                            disabled={spIdx === 0}
                            onClick={() =>
                              handleReorderSpecialty(cat.id, sp.id, -1)
                            }
                            aria-label="Move specialty up"
                            className="p-1 rounded border border-[#ececec] text-[#5A5A60] hover:text-[#050507] disabled:opacity-35 cursor-pointer"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            disabled={spIdx === catSpecs.length - 1}
                            onClick={() =>
                              handleReorderSpecialty(cat.id, sp.id, 1)
                            }
                            aria-label="Move specialty down"
                            className="p-1 rounded border border-[#ececec] text-[#5A5A60] hover:text-[#050507] disabled:opacity-35 cursor-pointer"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingSpecId(sp.id);
                              setEditSpecDraft({ en: sp.nameEn, ar: sp.nameAr });
                            }}
                            aria-label="Rename specialty"
                            className="p-1 rounded border border-[#ececec] text-[#5A5A60] hover:text-[#050507] cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleSpecialtyHidden(sp.id)}
                            aria-label="Toggle specialty visibility"
                            className="p-1 rounded border border-[#ececec] text-[#5A5A60] hover:text-[#050507] cursor-pointer"
                          >
                            {sp.hidden ? (
                              <EyeOff className="w-3 h-3" />
                            ) : (
                              <Eye className="w-3 h-3" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSpecialty(sp.id)}
                            aria-label="Delete specialty"
                            className="p-1 rounded border border-[#ececec] text-[#5A5A60] hover:text-[#AC3333] cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {/* Quick Add Specialty Row */}
                  <div className="px-5 py-3 bg-[#F6F4F1]/30 flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={draftNewSpec.en}
                      onChange={(e) =>
                        setNewSpecByCat((prev) => ({
                          ...prev,
                          [cat.id]: { ...draftNewSpec, en: e.target.value },
                        }))
                      }
                      placeholder={tText(
                        locale,
                        'New specialty (EN)...',
                        'تخصص جديد (إنجليزي)...'
                      )}
                      className="flex-1 h-9 px-3 rounded-lg border border-[#ececec] bg-white text-xs"
                    />
                    <input
                      type="text"
                      value={draftNewSpec.ar}
                      onChange={(e) =>
                        setNewSpecByCat((prev) => ({
                          ...prev,
                          [cat.id]: { ...draftNewSpec, ar: e.target.value },
                        }))
                      }
                      placeholder={tText(
                        locale,
                        'New specialty (AR)...',
                        'تخصص جديد (عربي)...'
                      )}
                      className="flex-1 h-9 px-3 rounded-lg border border-[#ececec] bg-white text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddSpecialty(cat.id)}
                      className="h-9 px-3.5 rounded-lg border border-[#050507]/25 bg-white text-xs font-semibold text-[#050507] hover:border-[#050507] inline-flex items-center justify-center gap-1 cursor-pointer shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{tText(locale, 'Add Specialty', 'إضافة تخصص')}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
