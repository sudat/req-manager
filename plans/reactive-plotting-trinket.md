# ハイドレーションエラー修正計画

## 問題分析

### エラー内容
`ParticleBackground`コンポーネントで`Math.random()`を使用してパーティクルを生成しているため、サーバー側とクライアント側で異なる値が生成され、Reactハイドレーション時に不一致が発生。

### エラー原因
- サーバー側SSR: `Math.random()`でパーティクル配列生成
- クライアント側: `Math.random()`で異なるパーティクル配列生成
- 結果: Reactが不一致を検出し、ハイドレーションエラー

---

## 修正方法

### 方法1: useEffectでクライアント側のみ生成（推奨）
`useState`と`useEffect`を使って、クライアント側でのみパーティクル配列を生成する。

```tsx
function ParticleBackground() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // クライアント側でのみパーティクルを生成
  const particles = isMounted ? Array.from({ length: 30 }, (_, i) => ({
    id: i,
    size: Math.random() > 0.6 ? "medium" : Math.random() > 0.3 ? "small" : "large",
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 15}s`,
    duration: `${15 + Math.random() * 10}s`,
  })) : [];

  // 初期レンダリング時は空（サーバー側と一致させるため）
  if (!isMounted) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className={`particle particle--${particle.size}`}
          style={{
            left: particle.left,
            bottom: "-10px",
            animationDelay: particle.delay,
            animationDuration: particle.duration,
          }}
        />
      ))}
    </div>
  );
}
```

---

## 変更ファイル

### `app/page.tsx`
- `ParticleBackground`コンポーネントを修正
- `useState`と`useEffect`を追加してクライアント側マウント検出

---

## 検証方法

1. `bun run dev`で開発サーバー起動
2. `http://localhost:3000/` にアクセス
3. ブラウザのコンソールを確認
4. ハイドレーションエラーが発生しないことを確認
