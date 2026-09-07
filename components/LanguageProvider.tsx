'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Lang = 'en' | 'ja';

const STRINGS: Record<string, { en: string; ja: string }> = {
  // nav
  'nav.status': { en: "What's going on?", ja: 'いま何してる？' },
  'nav.chat': { en: 'Chat', ja: 'チャット' },
  'nav.snaps': { en: 'Snaps', ja: 'スナップ' },
  'nav.messages': { en: 'Messages', ja: 'メッセージ' },
  'nav.members': { en: 'Members', ja: 'メンバー' },
  'nav.profile': { en: 'Profile', ja: 'プロフィール' },
  'nav.admin': { en: 'Admin', ja: '管理' },
  'nav.alerts': { en: 'Turn on alerts', ja: '通知をオンにする' },

  // common
  'common.send': { en: 'Send', ja: '送信' },
  'common.post': { en: 'Post', ja: '投稿' },
  'common.posting': { en: 'Posting…', ja: '投稿中…' },
  'common.reply': { en: 'Reply', ja: '返信' },
  'common.replies': { en: 'replies', ja: '件の返信' },
  'common.react': { en: 'React', ja: 'リアクション' },
  'common.loading': { en: 'Loading…', ja: '読み込み中…' },
  'common.save': { en: 'Save changes', ja: '変更を保存' },
  'common.saving': { en: 'Saving…', ja: '保存中…' },
  'common.saved': { en: 'Saved', ja: '保存しました' },
  'common.close': { en: 'Close', ja: '閉じる' },
  'common.delete': { en: 'Delete', ja: '削除' },
  'common.uploading': { en: 'Uploading…', ja: 'アップロード中…' },
  'common.skip': { en: 'Skip', ja: 'スキップ' },
  'common.you': { en: 'You', ja: '自分' },
  'common.friend': { en: 'friend', ja: '友だち' },

  // home
  'home.eyebrow': {
    en: 'for your actual friends, not your whole timeline',
    ja: 'タイムライン全体ではなく、本当の友だちのために',
  },
  'home.welcome': { en: 'Welcome back,', ja: 'おかえり、' },
  'home.never': { en: 'Never fall out of', ja: '離れないで' },
  'home.sub': {
    en: 'Profiles, group chat, and Snaps with reactions — one private space, just for the group.',
    ja: 'プロフィール、グループチャット、リアクション付きスナップ — 仲間だけのプライベートな場所。',
  },
  'home.openChat': { en: 'Open chat', ja: 'チャットを開く' },
  'home.seeSnaps': { en: 'See Snaps', ja: 'スナップを見る' },
  'home.signIn': { en: 'Sign in with Google', ja: 'Googleでログイン' },
  'home.switchAccount': { en: 'Use a different account', ja: '別のアカウントを使う' },
  'home.swipe': { en: 'swipe to explore', ja: 'スワイプして移動' },

  // status
  'status.eyebrow': { en: 'say it out loud', ja: '思ったことを書こう' },
  'status.title': { en: "What's going on?", ja: 'いま何してる？' },
  'status.placeholder': { en: "What's going on?", ja: 'いま何してる？' },
  'status.empty': { en: 'Nothing yet — say something first.', ja: 'まだ投稿がありません。最初のひとことをどうぞ。' },

  // chat
  'chat.title': { en: 'The chat', ja: 'チャット' },
  'chat.placeholder': { en: 'Say something…', ja: 'メッセージを入力…' },
  'chat.empty': { en: 'No messages yet — say hi.', ja: 'まだメッセージがありません。挨拶してみよう。' },

  // snaps
  'snaps.title': { en: 'Snaps', ja: 'スナップ' },
  'snaps.take': { en: 'Take a Snap', ja: 'スナップを撮る' },
  'snaps.clip': { en: 'Clip', ja: '動画' },
  'snaps.empty': { en: 'No Snaps yet — post the first one.', ja: 'まだスナップがありません。最初の1枚を投稿しよう。' },
  'snaps.caption': { en: "What's going on?", ja: 'いま何してる？' },
  'snaps.hint': { en: 'tap to post · clip opens your camera', ja: 'タップで投稿・動画はカメラが開きます' },
  'snaps.reacted': { en: 'reacted', ja: 'がリアクション' },

  // messages
  'messages.eyebrow': { en: 'just between you two', ja: 'ふたりだけの会話' },
  'messages.title': { en: 'Messages', ja: 'メッセージ' },
  'messages.new': { en: 'New', ja: '新規' },
  'messages.search': { en: 'Search people…', ja: '人を検索…' },
  'messages.empty': { en: 'No conversations yet.', ja: 'まだ会話がありません。' },
  'messages.start': { en: 'Start one', ja: '始める' },
  'messages.placeholder': { en: 'Message…', ja: 'メッセージ…' },

  // members
  'members.eyebrow': { en: 'the crew', ja: '仲間たち' },
  'members.title': { en: 'Members', ja: 'メンバー' },
  'members.message': { en: 'Message', ja: 'メッセージ' },
  'members.noProfile': { en: "This one hasn't filled in their profile yet.", ja: 'この人はまだプロフィールを書いていません。' },

  // profile
  'profile.eyebrow': { en: 'your corner of the group', ja: 'あなたのページ' },
  'profile.title': { en: 'Your profile', ja: 'プロフィール' },
  'profile.name': { en: 'Name', ja: '名前' },
  'profile.goal': { en: 'Goal', ja: '目標' },
  'profile.mission': { en: 'Mission', ja: '使命' },
  'profile.qualification': { en: 'Qualification', ja: '資格' },
  'profile.talent': { en: 'Talent', ja: '特技' },
  'profile.bio': { en: 'Bio', ja: '自己紹介' },
  'profile.phone': { en: 'Phone number', ja: '電話番号' },
  'profile.contact': { en: 'Other contact', ja: 'その他の連絡先' },
  'profile.addPhoto': { en: 'Add photo', ja: '写真を追加' },
  'profile.changePhoto': { en: 'Change photo', ja: '写真を変更' },
  'profile.signedIn': { en: 'Signed in', ja: 'ログイン中' },
  'profile.signOut': { en: 'Sign out', ja: 'ログアウト' },

  // approval
  'gate.waiting': { en: 'Waiting for approval', ja: '承認待ちです' },
  'gate.waitingBody': {
    en: "You're signed in, but an admin has to let you into the group first.",
    ja: 'ログインは済んでいますが、管理者の承認が必要です。',
  },
  'gate.signIn': { en: 'You need to sign in', ja: 'ログインが必要です' },

  // admin
  'admin.eyebrow': { en: 'who gets in', ja: '参加できる人' },
  'admin.title': { en: 'Manage members', ja: 'メンバー管理' },
  'admin.pending': { en: 'Waiting for approval', ja: '承認待ち' },
  'admin.approved': { en: 'Approved members', ja: '承認済みメンバー' },
  'admin.approve': { en: 'Approve', ja: '承認' },
  'admin.remove': { en: 'Remove', ja: '削除' },
  'admin.nobody': { en: 'Nobody waiting right now.', ja: '現在、承認待ちの人はいません。' },
};

const LangContext = createContext<{
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
}>({
  lang: 'en',
  setLang: () => {},
  t: (k) => k,
});

export function useLang() {
  return useContext(LangContext);
}

export default function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('genz-lang') as Lang | null;
      if (saved === 'en' || saved === 'ja') {
        setLangState(saved);
        return;
      }
      // first visit: follow the device language
      if (navigator.language?.toLowerCase().startsWith('ja')) setLangState('ja');
    } catch {
      // storage blocked — stay on English
    }
  }, []);

  useEffect(() => {
    try {
      document.documentElement.lang = lang;
    } catch {}
  }, [lang]);

  function setLang(l: Lang) {
    setLangState(l);
    try {
      localStorage.setItem('genz-lang', l);
    } catch {}
  }

  function t(key: string) {
    const entry = STRINGS[key];
    if (!entry) return key;
    return entry[lang] || entry.en;
  }

  return <LangContext.Provider value={{ lang, setLang, t }}>{children}</LangContext.Provider>;
}
