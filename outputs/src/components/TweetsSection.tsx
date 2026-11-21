import React, { useState } from 'react';
import { Heart, MessageCircle, Send, Trash2 } from 'lucide-react';
import type {
  FreelancerProfile,
  FreelancerTweet,
  Locale,
  UserAccount,
} from '../types/circle';
import { tText } from '../i18n/translations';

interface TweetsSectionProps {
  locale: Locale;
  profile: FreelancerProfile;
  tweets: FreelancerTweet[];
  currentUser: UserAccount | null;
  compact?: boolean;
  onPost: (freelancerId: string, text: string) => void;
  onDelete: (tweetId: string) => void;
  onToggleLike: (tweetId: string) => void;
  onComment: (tweetId: string, text: string) => void;
  onRequireLogin?: () => void;
}

const MAX_LEN = 280;

function timeLabel(iso: string, locale: Locale): string {
  try {
    return new Date(iso).toLocaleDateString(locale === 'ar' ? 'ar-IQ' : 'en-GB', {
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return '';
  }
}

export const TweetsSection: React.FC<TweetsSectionProps> = ({
  locale,
  profile,
  tweets,
  currentUser,
  compact = false,
  onPost,
  onDelete,
  onToggleLike,
  onComment,
  onRequireLogin,
}) => {
  const [draft, setDraft] = useState('');
  const [openComments, setOpenComments] = useState<string[]>([]);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});

  const isOwner = !!currentUser && currentUser.id === profile.userId;
  const list = tweets
    .filter((t) => t.freelancerId === profile.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const fs = compact ? 'text-[10px]' : 'text-sm';
  const fsSmall = compact ? 'text-[9px]' : 'text-xs';
  const pad = compact ? 'p-2.5' : 'p-4';

  const submitTweet = () => {
    const text = draft.trim();
    if (!text) return;
    onPost(profile.id, text.slice(0, MAX_LEN));
    setDraft('');
  };

  const submitComment = (tweetId: string) => {
    if (!currentUser) {
      onRequireLogin?.();
      return;
    }
    const text = (commentDrafts[tweetId] || '').trim();
    if (!text) return;
    onComment(tweetId, text);
    setCommentDrafts((d) => ({ ...d, [tweetId]: '' }));
  };

  const toggleComments = (id: string) =>
    setOpenComments((o) => (o.includes(id) ? o.filter((x) => x !== id) : [...o, id]));

  return (
    <div className={compact ? 'space-y-2' : 'space-y-4'}>
      {!compact && (
        <h2 className="font-display text-xl font-bold text-[#050507]">
          {tText(locale, 'Tweets', 'التغريدات')}
        </h2>
      )}

      {isOwner && (
        <div className={`rounded-2xl border border-[#ececec] bg-white ${pad} space-y-2`}>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value.slice(0, MAX_LEN))}
            rows={compact ? 2 : 3}
            placeholder={tText(locale, "What's on your mind?", 'شنو يدور براسك؟')}
            className={`w-full resize-none outline-none ${fs} text-[#050507] placeholder:text-[#5A5A60]`}
          />
          <div className="flex items-center justify-between">
            <span className={`${fsSmall} text-[#5A5A60] font-mono-tabular`}>
              {draft.length}/{MAX_LEN}
            </span>
            <button
              type="button"
              onClick={submitTweet}
              disabled={!draft.trim()}
              className={`inline-flex items-center gap-1.5 rounded-xl bg-[#AC3333] text-white font-semibold disabled:opacity-45 cursor-pointer ${
                compact ? 'px-2.5 py-1 text-[10px]' : 'px-4 py-2 text-xs'
              }`}
            >
              <Send className={compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
              <span>{tText(locale, 'Tweet', 'تغريد')}</span>
            </button>
          </div>
        </div>
      )}

      {list.length === 0 && (
        <div className={`rounded-2xl border border-dashed border-[#ececec] ${pad} text-center ${fsSmall} text-[#5A5A60]`}>
          {tText(locale, 'No tweets yet.', 'لا توجد تغريدات بعد.')}
        </div>
      )}

      {list.map((t) => {
        const liked = !!currentUser && t.likedBy.includes(currentUser.id);
        const open = openComments.includes(t.id);
        return (
          <article key={t.id} className={`rounded-2xl border border-[#ececec] bg-white ${pad} space-y-2`}>
            <div className="flex items-start justify-between gap-2">
              <div className={`${fsSmall} text-[#5A5A60]`}>
                <strong className="text-[#050507]">
                  {tText(locale, profile.nameEn, profile.nameAr)}
                </strong>{' '}
                · @{profile.username} · {timeLabel(t.createdAt, locale)}
              </div>
              {isOwner && (
                <button
                  type="button"
                  onClick={() => onDelete(t.id)}
                  aria-label={tText(locale, 'Delete tweet', 'حذف التغريدة')}
                  className="text-[#5A5A60] hover:text-[#AC3333] cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <p className={`${fs} text-[#050507] leading-relaxed whitespace-pre-wrap`}>{t.text}</p>

            <div className={`flex items-center gap-4 ${fsSmall} text-[#5A5A60]`}>
              <button
                type="button"
                onClick={() => (currentUser ? onToggleLike(t.id) : onRequireLogin?.())}
                aria-pressed={liked}
                className={`inline-flex items-center gap-1 cursor-pointer ${liked ? 'text-[#AC3333]' : ''}`}
              >
                <Heart className="w-3.5 h-3.5" fill={liked ? 'currentColor' : 'none'} />
                <span className="font-mono-tabular">{t.likedBy.length}</span>
              </button>
              <button
                type="button"
                onClick={() => toggleComments(t.id)}
                className="inline-flex items-center gap-1 cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span className="font-mono-tabular">{t.comments.length}</span>
              </button>
            </div>

            {open && (
              <div className="pt-2 border-t border-[#ececec] space-y-2">
                {t.comments.map((c) => (
                  <div key={c.id} className={`${fsSmall} text-[#050507]`}>
                    <strong>{c.authorName}</strong>{' '}
                    <span className="text-[#5A5A60]">@{c.authorUsername}</span>
                    <div className="leading-relaxed">{c.text}</div>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <input
                    value={commentDrafts[t.id] || ''}
                    onChange={(e) =>
                      setCommentDrafts((d) => ({ ...d, [t.id]: e.target.value.slice(0, 200) }))
                    }
                    onKeyDown={(e) => e.key === 'Enter' && submitComment(t.id)}
                    placeholder={tText(locale, 'Write a comment...', 'اكتب تعليق...')}
                    className={`flex-1 min-w-0 rounded-lg border border-[#ececec] px-2.5 py-1.5 outline-none ${fsSmall}`}
                  />
                  <button
                    type="button"
                    onClick={() => submitComment(t.id)}
                    className={`rounded-lg bg-[#050507] text-white font-semibold cursor-pointer ${
                      compact ? 'px-2 py-1.5 text-[9px]' : 'px-3 py-1.5 text-xs'
                    }`}
                  >
                    {tText(locale, 'Send', 'إرسال')}
                  </button>
                </div>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
};
