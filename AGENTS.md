# AGENTS.md — Gazer

コーディングエージェントがこのリポジトリで Web アプリ開発を行うための参照ドキュメント。

---

## プロジェクト概要

**Gazer** — React 19 + TypeScript + Vite によるフロントエンド SPA。
現在は初期段階（v0.1.0）。バックエンド・DB は未構成で、純粋なフロントエンドアプリ。

---

## ディレクトリ構成

```
/workspace/
├── app/                    # アプリケーション本体
│   ├── src/
│   │   ├── main.tsx        # エントリポイント
│   │   ├── App.tsx         # ルートコンポーネント
│   │   ├── style.css       # グローバルスタイル（CSS 変数定義含む）
│   │   └── components/
│   │       └── ErrorBoundary.tsx
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json       # tsconfig.app.json / tsconfig.node.json を参照
│   ├── .oxlintrc.json      # OXLint 設定
│   └── .oxfmtrc.json       # OXFmt 設定（import ソート有効）
├── .devcontainer/          # Dev Container 設定
│   ├── Dockerfile          # oven/bun:1 ベース
│   ├── compose.yaml
│   └── devcontainer.json
└── .vscode/
    ├── settings.json       # フォーマッタ設定（OXC、保存時フォーマット）
    └── tasks.json          # "Start dev server" タスク
```

---

## 技術スタック

| 用途 | ツール / バージョン |
|------|-------------------|
| UI フレームワーク | React 19.2 |
| 言語 | TypeScript ~6.0 |
| ビルドツール | Vite 8 |
| パッケージマネージャ | **Bun** |
| Linter | OXLint 1.67（Rust 製） |
| Formatter | OXFmt 0.52（Rust 製） |
| 開発環境 | Docker devcontainer（oven/bun:1） |

---

## 開発サーバーの起動

```bash
# app/ ディレクトリで実行
cd app
bun run dev --host
# または VS Code タスク "Start dev server" を使用
```

Dev サーバーはポート **5173** で起動する（devcontainer で転送済み）。

---

## パッケージ管理

**Bun を使うこと。npm / yarn / pnpm は使わない。**

```bash
# 依存追加
bun add <package>
bun add -d <package>      # devDependency

# インストール（初回・CI）
bun install --cwd app
```

---

## ビルド

```bash
cd app
bun run build   # tsc -b && vite build → dist/ に出力
```

---

## コードスタイル・品質

### TypeScript

- **Strict モード**有効（`noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`）
- 未使用変数・未使用パラメータはコンパイルエラーになる

### React コンポーネントの書き方

Props をインタフェースとして定義し、`FC<Props>` で型を明示する。

```tsx
import type { FC } from "react";

interface MyComponentProps {
  label: string;
}

const MyComponent: FC<MyComponentProps> = ({ label }) => {
  return <p>{label}</p>;
};

export default MyComponent;
```

- Props がない場合も `interface XxxProps {}` を定義して `FC<XxxProps>` と書く
- `export` は `const` の前ではなく末尾に付けてもよい（`default export` の場合は末尾）
- 名前付き export の場合は `export const MyComponent: FC<...>` と宣言部でつける

### Linting（OXLint）

設定ファイル: [app/.oxlintrc.json](app/.oxlintrc.json)

- プラグイン: `react`, `typescript`
- `react/rules-of-hooks`: error
- `react/exhaustive-deps`: warn

```bash
cd app && bunx oxlint .
```

### Formatting（OXFmt）

設定ファイル: [app/.oxfmtrc.json](app/.oxfmtrc.json)

- import ソートが有効 — import の順序を手動で変えない
- VS Code の保存時フォーマットが OXC に設定済み
- CI で実行する場合:

```bash
cd app && bunx oxfmt --check .
```

---

## CSS / スタイリング

グローバルテーマは [app/src/style.css](app/src/style.css) の CSS 変数で定義済み:

| 変数 | 用途 | 値 |
|------|------|----|
| `--color-primary` | メインカラー | `rgb(0, 91, 93)` — ティール |
| `--color-primary-hover` | ホバー状態 | `rgb(0, 150, 153)` |
| `--color-secondary` | サブカラー | `rgb(196, 0, 154)` — マゼンタ |
| `--color-focus` | フォーカスリング | `rgb(64, 150, 255)` |
| `--color-danger` | エラー・削除系 | `#c00` |
| `--color-note` | 補足テキスト | `#999` |

新しいカラーはここに変数として追加する。スタイリングは現状 Plain CSS のみ（CSS Modules / Tailwind 等は未導入）。

---

## アーキテクチャ上の注意

- **ErrorBoundary** がアプリ全体をラップしている（[app/src/main.tsx](app/src/main.tsx)）
- unhandled promise rejection もキャッチする実装になっている
- `<Suspense>` がルートに配置されているため、非同期コンポーネント（`lazy()`）をそのまま追加できる

---

## テスト

**テストフレームワーク未導入。** Vitest などを追加する場合は `bun add -d vitest` で入れる。

---

## CI / CD

GitHub Actions 等の CI 設定は**未構成**。必要に応じて `.github/workflows/` に追加する。

---

## 環境変数

`.env` ファイルは現時点で不要（バックエンド未接続）。追加する場合は Vite の規約に従い `VITE_` プレフィックスを付けること。

```
VITE_API_URL=http://localhost:3000
```

---

## よくある作業パターン

### 新しいコンポーネントを追加する

`app/src/components/<ComponentName>.tsx` に配置する。

### ページ（ルート）を追加する

現状ルーターは未導入。追加する場合は `react-router` または TanStack Router を検討する。

### 外部 API を呼び出す

fetch / TanStack Query 等を使用。バックエンドが別途必要な場合は `app/` と並列で `server/` ディレクトリを設ける想定。
