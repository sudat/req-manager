# アイコン名 typo 修正

## 難易度
```
難易度: ★☆☆
根拠: 1 file, 1 line, インポート名修正のみ
リスク: なし
```

## 概要
デザイン改善統一実装時のtypoにより、lucide-reactのアイコン名が間違っておりエラーが発生している。

**エラー内容:**
- `Layer2` → 正しくは `Layers2`（複数形）
- エラー箇所: `components/system-domains/basic-info-section.tsx`

---

## 変更内容

### 変更ファイル（1ファイル）

| ファイル | 変更内容 |
|---------|---------|
| `components/system-domains/basic-info-section.tsx` | インポート名 `Layer2` → `Layers2` に修正 |

### 詳細変更内容

#### `components/system-domains/basic-info-section.tsx:6`

**Before:**
```typescript
import { Layer2, CircleCheck } from "lucide-react";
```

**After:**
```typescript
import { Layers2, CircleCheck } from "lucide-react";
```

#### 使用箇所も修正（同ファイル内）

**Before:**
```typescript
<Layer2 className="h-4 w-4 text-slate-400" />
```

**After:**
```typescript
<Layers2 className="h-4 w-4 text-slate-400" />
```

---

## 検証方法

1. サーバーが起動している状態で、以下のURLにアクセス
2. http://localhost:3000/system-domains/AR/SRF-001
3. エラーが解消し、ページが正常に表示されることを確認

---

## Critical Files

- `components/system-domains/basic-info-section.tsx`
