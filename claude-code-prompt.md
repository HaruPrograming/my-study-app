# まなびドリル フロントエンド実装プロンプト（Claude Code用）

## 参考プロトタイプ
`app-interactive.html` を必ず開いて実際に操作し、画面遷移・アニメーション・配色・余白感を目で確認してから着手してください。このファイルが仕様書そのものです。迷ったら常にこのHTMLの挙動を正とします。

---

## 1. プロジェクト概要

資格試験（基本情報技術者・応用情報技術者）の過去問を「解く」のではなく「読んで理解する」インプット型の学習アプリです。

- 問題文の下に選択肢を表示するが、選ぶ操作はさせない。**正解の選択肢は最初から緑色でハイライトし、それ以外はグレーアウト**した状態で表示する（クイズ形式ではない）
- その下にイラスト（SVG図解）と一言解説を表示する
- テレビを見ながらでも片手間でできることを最優先し、タップ操作を最小限にする
- アニメーションは使わず、静的なイラスト（SVG）で解説する

---

## 2. 技術スタック

- **フロントエンド**: React 18 + Vite + TypeScript
- **ルーティング**: React Router v6
- **状態管理**: Context API（グローバルなものは最小限。基本はローカルstate）
- **スタイリング**: プレーンCSS（CSS variablesでテーマ管理）。Tailwindは使わない
- **API通信**: fetch（後日Laravel APIに接続する前提で、まずは仮データ/モックで動くようにする）

---

## 3. デザインシステム（`app-interactive.html` の `:root` をそのまま流用）

```css
:root {
  --bg: #fff;
  --surface: #F4FAF5;
  --surface2: #E8F4EA;
  --accent: #2E9E5B;       /* メインカラー（緑） */
  --accent-soft: rgba(46,158,91,0.10);
  --accent-glow: rgba(46,158,91,0.20);
  --orange: #F57C2B;       /* 強調カラー */
  --orange-soft: rgba(245,124,43,0.10);
  --text: #1A2E1E;
  --muted: #6B8070;
  --border: rgba(46,158,91,0.13);
}
```

- 背景は白ベース、メインカラーは緑、強調（新着・重要ポイント）はオレンジ
- フォントは `'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Noto Sans JP', sans-serif`
- スマホ1カラム専用（375px想定、レスポンシブでmax-width設定でOK。PC最適化は不要）
- アイコンは絵文字を使わず、**すべてオリジナルのインラインSVG（線画・currentColorで着色）**を使う。`app-interactive.html` 内の各SVGをそのままコンポーネント化して再利用する

---

## 4. アイコンコンポーネント化（最初にやること）

`app-interactive.html` 内に埋め込まれている全SVGアイコンを `src/components/icons/` 以下に、1アイコン1コンポーネントとして切り出してください。

例：
```tsx
// src/components/icons/BookIcon.tsx
export const BookIcon = ({ size = 20, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg viewBox="0 0 48 48" fill="none" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
    <rect x="8" y="8" width="26" height="32" rx="3" stroke={color} strokeWidth="2.5"/>
    {/* ... app-interactive.html の該当SVGの中身をそのまま移植 ... */}
  </svg>
);
```

抽出対象アイコン一覧（`app-interactive.html` から探して移植）：
`BookIcon`, `PcIcon`, `BrainIcon`, `KeyboardIcon`, `MonitorIcon`, `FloppyIcon`, `DiscIcon`, `FireIcon`, `TargetIcon`, `BoltIcon`, `BulbIcon`, `ConfettiIcon`, `LockIcon`, `ChartIcon`, `HomeIcon`, `CheckIcon`, `PauseIcon`, `WaveIcon`, `SakuraIcon`, `LeafIcon`, `CapIcon`, `FileIcon`, `ClipboardIcon`

全アイコン共通で `size` と `color` をpropsで受け取れるようにし、色は親要素のCSS変数（`--accent` など）に連動させられるようにしてください。

---

## 5. 画面構成とルーティング

```
/                        トップ画面（資格選択・年度選択）
/study/:examId           学習画面（問題＋イラスト解説）
/study/:examId/complete  セクション完了画面
/record                  記録・進捗画面
```

各画面は `app-interactive.html` 内の該当する `<div id="screen-xxx">` ブロックを1:1でReactコンポーネント化してください。

### 5-1. トップ画面（`/`）
`app-interactive.html` の `#screen-top` を参照。

- ヒーローエリア（緑グラデーション背景）：挨拶＋アプリ名＋学習統計3カード（連続日数・完了問題数・全体進捗%）
- 「資格を選ぶ」セクション：資格カードを横並びで表示（基本情報／応用情報／ITパスポート[ロック済み]）。タップすると選択状態になり、下の年度リストが該当資格のものに切り替わる（`app-interactive.html` の `selectShikaku` 関数のロジックをそのまま移植）
- 「年度・期を選ぶ」セクション：年度カードを縦並びで表示。タップすると選択状態（緑枠）になり、**カード内にスタートボタンが展開表示**される。ボタンを押すと学習画面へ遷移する（`selectNengo` 関数を参照）
- リストの最後に「＋ 年度を追加」ボタン（点線ボーダー）→ タップでモーダルを開く
- フッターに固定ナビ（ホーム／記録の2タブ、アイコン＋ラベル）

### 5-2. PDF取り込みモーダル（トップ画面上に表示）
`app-interactive.html` の `#modal` を参照。

- 下からスライドインするボトムシート
- タイトル入力欄（テキスト）
- 「問題PDF」アップロード欄、「解答PDF」アップロード欄（それぞれ点線ボーダーのドロップゾーン。ファイル選択後は緑の枠＋チェック表示に変化）
- 「キャンセル」「保存 → 解説を自動生成」ボタン
- 保存を押すと、モーダルを閉じてローディングオーバーレイ（スピナー＋「AIが解説を生成中…」テキスト）を表示。**実際のAPI実装は不要**、2〜3秒のsetTimeoutでモック的に完了させ、年度リストに新しいカードを追加する（`saveAndGenerate` 関数を参照）

### 5-3. 学習画面（`/study/:examId`）
`app-interactive.html` の `#screen-study` を参照。**この画面が最重要かつ最も複雑**です。

構成（上から下）：
1. ヘッダー：戻るボタン／中央に「資格名・年度」＋「Qxx / 全体数」／記録画面へのアイコンボタン
2. 進捗バー（現在の問題番号に応じたパーセンテージ）
3. タグ行：年度期タグ（オレンジ）＋分野タグ（緑）
4. 問題文（大きめの太字テキスト）
5. **選択肢リスト（クイズではなく表示のみ）**：
   - 正解の選択肢：緑の枠線＋薄緑背景＋チェックアイコン
   - 不正解の選択肢：グレーアウト（opacity 0.55、枠線なし）
   - タップ操作は不要（onClickは付けない）
6. 区切り線（中央に「POINT」ラベル）
7. **イラスト解説ブロック**：
   - 薄緑グラデーション背景の中に、SVGアイコンをフローチャート状に配置（例：入力装置→CPU→出力装置、矢印でつなぐ。CPUは強調表示で少し拡大＆濃い緑背景）
   - サブ図として記憶装置などの補足情報
   - 下部に白背景のキャプション文（1〜2行、太字で重要語を強調）
8. ポイントリスト：アイコン＋短い説明文のカードを2〜3枚
9. フッター固定：「⏸ 中断」ボタン（トップに戻る）と「次へ →」ボタン（完了画面 or 次の問題へ）

**データ構造の想定**（モックでよいのでこの形でダミーデータを用意）：
```ts
type Question = {
  id: string;
  examLabel: string;       // "2023年 秋期"
  category: string;        // "コンピュータ構成"
  number: number;          // 55
  totalCount: number;      // 80
  body: string;            // 問題文
  choices: { label: string; text: string; isCorrect: boolean }[];
  illustration: {
    // イラストブロックの構成データ。最初はこの1パターン（入力→CPU→出力＋記憶装置）を
    // 汎用化しやすい形にしておく程度でよい
    nodes: { icon: string; label: string; highlight?: boolean }[];
    subNodes?: { icon: string; label: string }[];
    caption: string; // HTMLとして太字強調を許容
  };
  points: { icon: string; text: string }[]; // textは太字強調箇所を許容
};
```

### 5-4. セクション完了画面（`/study/:examId/complete`）
`app-interactive.html` の `#screen-complete` を参照。

- 中央に大きな紙吹雪アイコン（ポップインアニメーション：`popIn` keyframesをそのまま移植）
- 「お疲れさま！」見出し＋励ましのサブテキスト
- 統計3カード（連続日数／今日解いた問題数／進捗%）
- 「ホームに戻る」ボタン

### 5-5. 記録画面（`/record`）
`app-interactive.html` の `#screen-record` を参照。

- ヒーローエリア（緑グラデ）：「学習記録」見出し＋統計3カード
- 「資格別 進捗」セクション：資格ごとのカード（アイコン・完了数/総数・進捗バー・%）
- 「今月の学習日」セクション：カレンダーグリッド（7列、学習した日は緑塗り、今日は白縁取りでハイライト）
- フッター固定ナビ（記録タブがアクティブ状態）

---

## 6. 画面遷移・インタラクション実装の注意点

- `app-interactive.html` はSPA的に1ページ内で `.screen` の `transform: translateX()` を切り替えてスライド遷移を実現しています。Reactでは **React Router のページ遷移＋ `framer-motion` か CSS transitionでスライドアニメーションを再現**してください（新規ライブラリ追加が嫌な場合はCSSトランジションのみで可）
- フッター固定ナビは「ホーム」「記録」の2画面間でアクティブ状態（`--accent`色）を切り替える
- 資格カード選択時の年度リスト切り替えは、フェードアウト→データ差し替え→フェードインの流れを再現する（`selectShikaku` のsetTimeout構造を参照）
- 年度カードは「未選択時はボタン非表示」「選択時のみスタートボタンが展開する」という挙動をCSSの `max-height` かReactの条件レンダリングで実装する

---

## 7. やらないこと（スコープ外）

- Laravel API実装（このプロンプトはフロントエンドのみ。データは全てモック/ダミーで良い）
- 実際のPDFアップロード処理・パース処理
- 実際のAI解説生成API呼び出し（setTimeoutでモックする）
- ログイン・認証機能
- 復習リスト機能（将来追加、今回は非表示でよい）
- アニメーション過多な演出（このアプリは「疲れてても見れる」ことを優先するため、控えめなトランジションのみ）

---

## 8. 完了の定義（Done条件）

- [ ] `npm run dev` でトップ画面が表示される
- [ ] 資格カードをタップすると年度リストが切り替わる
- [ ] 年度カードをタップするとスタートボタンが表示され、学習画面へ遷移する
- [ ] 学習画面で「次へ」を押すと完了画面に遷移する
- [ ] 完了画面から「ホームに戻る」でトップに戻る
- [ ] フッターナビでトップ⇄記録画面を行き来できる
- [ ] 「＋年度を追加」→ モーダルが開き、PDF欄タップでアップロード済み表示になり、保存でローディング→年度リストに新規カード追加、という一連の流れが動く
- [ ] 全アイコンが絵文字ではなくSVGコンポーネントとして表示されている
- [ ] スマホサイズ（375px）で崩れなく表示される

---

まずは `app-interactive.html` を実際に開いて全画面・全遷移を触ってから実装を始めてください。不明な挙動があれば、そのHTMLの該当箇所のコードを読んで判断してください。
