-- ================================================================================
-- 実装単位SD（IU）サンプルデータ
-- 対象: ARドメイン SRF-002〜008
-- ドメイン: AR（債権管理）
-- 仕様: PRD 3.9 実装単位SD
-- ================================================================================

-- SRF-002: 商品マスタ税率区分管理、税率別内訳集計

INSERT INTO public.impl_unit_sds (
  id, srf_id, project_id, type, name, summary, entry_points, design_policy, details, created_at, updated_at
) VALUES (
  'IU-AR-002-01',
  'SRF-002',
  '00000000-0000-0000-0000-000000000001'::uuid,
  'screen',
  '商品マスタ税率区分管理画面',
  '商品ごとの税率区分（10%/8%）の設定・変更を行う画面。適格請求書対応で必須。',
  '[{"path": "app/(with-sidebar)/master/products/tax-rate/page.tsx", "type": "Next.js Page Component", "responsibility": "税率設定画面のUI描画"}, {"path": "components/products/tax-rate-form.tsx", "type": "React Component", "responsibility": "税率区分選択フォーム"}, {"path": "lib/products/tax-rate-validator.ts", "type": "TypeScript Module", "responsibility": "税率区分バリデーション"}]'::jsonb,
  '【設計方針】
1. インボイス対応: 2023年10月以降の取引は税率区分必須
2. 履歴管理: 税率変更履歴を保存、過去請求書の再計算に対応
3. 一括更新: カテゴリ単位での一括税率設定機能',
  '{
    "screen_design": {
      "layout": {
        "sections": [
          {"name": "商品一覧", "components": [{"type": "DataTable", "columns": ["商品コード", "商品名", "現在の税率", "カテゴリ"], "selectable": true}]},
          {"name": "税率設定エリア", "components": [{"type": "RadioGroup", "label": "税率区分", "options": [{"label": "10%標準税率", "value": "10"}, {"label": "8%軽減税率", "value": "8"}, {"label": "不課税/非課税", "value": "0"}]}]}]},
          {"name": "アクション", "components": [{"type": "Button", "label": "一括更新", "variant": "primary"}, {"type": "Button", "label": "変更履歴", "variant": "outline"}]}
        ]
      },
      "validation": {"rules": [{"field": "税率区分", "rule": "必須選択"}], "errorMessages": {"noSelection": "税率区分を選択してください"}}
    },
    "api_definition": {
      "endpoints": [
        {"method": "PUT", "path": "/api/products/tax-rate", "description": "税率区分更新", "request": {"body": {"product_ids": "uuid[]", "tax_rate": "integer (10|8|0)"}}, "response": {"success": true, "updated_count": "number"}}
      ]
    },
    "db_design": {
      "tables": [{"name": "products", "purpose": "商品マスタ", "keyColumns": [{"name": "id", "type": "uuid", "primaryKey": true}, {"name": "tax_rate", "type": "integer", "description": "10 or 8 or 0"}]}, {"name": "product_tax_history", "purpose": "税率変更履歴", "keyColumns": [{"name": "product_id", "type": "uuid"}, {"name": "tax_rate", "type": "integer"}, {"name": "changed_at", "type": "timestamp"}, {"name": "changed_by", "type": "uuid"}]}]
    },
    "exception_handling": {"errors": [{"type": "INVALID_TAX_RATE", "handling": "10/8/0以外はエラー", "userAction": "正しい税率を選択"}]}
  }'::jsonb,
  now(), now()
), (
  'IU-AR-002-02',
  'SRF-002',
  '00000000-0000-0000-0000-000000000001'::uuid,
  'api',
  '税率別内訳集計API',
  '明細行を税率別（10%/8%）に集計し、請求書作成に必要なデータを返すAPI。',
  '[{"path": "app/api/invoices/tax-breakdown/route.ts", "type": "Next.js API Route", "responsibility": "税率別集計処理"}, {"path": "lib/invoices/tax-calculator.ts", "type": "TypeScript Module", "responsibility": "消費税計算ロジック"}]'::jsonb,
  '【設計方針】
1. 計算精度: 1円単位の切り捨て計算
2. パフォーマンス: 大量明細（1000件以上）に対応
3. キャッシュ: 同一明細セットの再計算を回避',
  '{
    "api_definition": {
      "endpoints": [
        {"method": "POST", "path": "/api/invoices/tax-breakdown", "description": "税率別集計", "request": {"body": {"line_items": "[{product_id, quantity, unit_price}]"}}, "response": {"tax_10_rate": 10, "tax_8_rate": 8, "subtotal_10": "number", "tax_10": "number", "subtotal_8": "number", "tax_8": "number", "total": "number"}}
      ]
    },
    "core_logic": {
      "tax_calculation": {"rounding": "floor", "unit": "1円", "calculation": "SUM(各明細の税抜価格 × 税率)を切り捨て"}
    }
  }'::jsonb,
  now(), now()
);

-- SRF-003: 入金データ取込、銀行マスタ管理

INSERT INTO public.impl_unit_sds (
  id, srf_id, project_id, type, name, summary, entry_points, design_policy, details, created_at, updated_at
) VALUES (
  'IU-AR-003-01',
  'SRF-003',
  '00000000-0000-0000-0000-000000000001'::uuid,
  'batch',
  '入金データ取込バッチ',
  '銀行からダウンロードした入金データ（CSV/MT940）をパースし、顧客の未消込入金と紐付けるバッチ処理。',
  '[{"path": "lib/batch/payment-import.ts", "type": "TypeScript Module", "responsibility": "入金データ取込処理"}, {"path": "lib/batch/csv-parser.ts", "type": "TypeScript Module", "responsibility": "CSVパース処理"}, {"path": "app/api/cron/payment-import/route.ts", "type": "Next.js API Route", "responsibility": "cronトリガー"}]'::jsonb,
  '【設計方針】
1. 自動化: 毎朝6時に自動実行、前日の入金データを取込
2. マッチング: 顧客コード・金額で自動照合
3. 例外処理: 照合できない入金は「未処理」として通知',
  '{
    "batch_design": {"schedule": {"type": "cron", "expression": "0 6 * * *", "description": "毎日6:00実行"}, "scope": {"target": "前日の入金データ", "source": "S3バケット or FTP"}},
    "core_logic": {
      "parsing": {"formats": ["CSV", "MT940"], "fields": ["取引日", "入金金額", "顧客コード", "振込人名"]},
      "matching": {"strategy": "顧客コード AND 金額（±許容額）", "tolerance": "±1円"}
    },
    "exception_handling": {"errors": [{"type": "PARSE_ERROR", "handling": "該当行をスキップ、ログ記録"}, {"type": "NO_MATCH", "handling": "未処理テーブルに保存、通知"}]}
  }'::jsonb,
  now(), now()
), (
  'IU-AR-003-02',
  'SRF-003',
  '00000000-0000-0000-0000-000000000001'::uuid,
  'screen',
  '銀行マスタ管理画面',
  '入金データ取込元の銀行口座情報を管理する画面。',
  '[{"path": "app/(with-sidebar)/master/banks/page.tsx", "type": "Next.js Page Component", "responsibility": "銀行マスタ管理画面"}]'::jsonb,
  '【設計方針】
1. 必須項目: 銀行コード、支店コード、口座番号、口座種別
2. セキュリティ: 口座情報の暗号化保存',
  '{"screen_design": {"fields": ["銀行名", "支店名", "口座種別", "口座番号", "取引先区分"]}}'::jsonb,
  now(), now()
);

-- SRF-004: 入金消込

INSERT INTO public.impl_unit_sds (
  id, srf_id, project_id, type, name, summary, entry_points, design_policy, details, created_at, updated_at
) VALUES (
  'IU-AR-004-01',
  'SRF-004',
  '00000000-0000-0000-0000-000000000001'::uuid,
  'api',
  '入金消込API',
  '入金データと請求書を紐付け、残高を更新するAPI。',
  '[{"path": "app/api/payments/allocate/route.ts", "type": "Next.js API Route", "responsibility": "入金消込処理"}]'::jsonb,
  '【設計方針】
1. トランザクション: 消込処理は原子性を担保
2. 部分消込: 一部入金にも対応',
  '{
    "api_definition": {"endpoints": [{"method": "POST", "path": "/api/payments/allocate", "request": {"body": {"payment_id": "uuid", "invoice_ids": "uuid[]", "amounts": "number[]"}}, "response": {"success": true, "allocated": "number", "remaining": "number"}}]},
    "db_design": {"tables": [{"name": "payments", "purpose": "入金データ"}, {"name": "payment_allocations", "purpose": "消込明細", "keyColumns": [{"name": "payment_id", "type": "uuid"}, {"name": "invoice_id", "type": "uuid"}, {"name": "allocated_amount", "type": "integer"}]}]}
  }'::jsonb,
  now(), now()
), (
  'IU-AR-004-02',
  'SRF-004',
  '00000000-0000-0000-0000-000000000001'::uuid,
  'screen',
  '入金消込画面',
  '未消込の入金データを一覧表示し、対象請求書を選択して消込処理を行う画面。',
  '[{"path": "app/(with-sidebar)/business/AR/[id]/allocate/page.tsx", "type": "Next.js Page Component", "responsibility": "入金消込画面"}]'::jsonb,
  '【設計方針】
1. ユーザビリティ: ドラッグ＆ドロップで請求書に紐付け
2. 自動提案: 金額一致の請求書を自動表示',
  '{"screen_design": {"sections": [{"name": "未消込入金一覧"}, {"name": "対象請求書一覧"}, {"name": "消込プレビュー"}]}}'::jsonb,
  now(), now()
);

-- SRF-005: 債権管理一覧、督促状発行、延滞アラート

INSERT INTO public.impl_unit_sds (
  id, srf_id, project_id, type, name, summary, entry_points, design_policy, details, created_at, updated_at
) VALUES (
  'IU-AR-005-01',
  'SRF-005',
  '00000000-0000-0000-0000-000000000001'::uuid,
  'screen',
  '債権管理一覧画面',
  '未入金の請求書を一覧表示し、期日管理・回収状況を可視化する画面。',
  '[{"path": "app/(with-sidebar)/business/AR/receivables/page.tsx", "type": "Next.js Page Component", "responsibility": "債権管理一覧画面"}]'::jsonb,
  '【設計方針】
1. フィルタリング: 期日別、顧客別、金額別で絞込
2. アラート表示: 延滞リスクのある債権をハイライト',
  '{"screen_design": {"columns": ["請求書番号", "顧客名", "発行日", "支払期限", "金額", "入金済", "残高", "回収予定"], "filters": ["未入金", "期日内", "延滞"]}}'::jsonb,
  now(), now()
), (
  'IU-AR-005-02',
  'SRF-005',
  '00000000-0000-0000-0000-000000000001'::uuid,
  'batch',
  '督促状発行バッチ',
  '支払期限を過ぎた請求書に対して、督促状を一括発行するバッチ処理。',
  '[{"path": "lib/batch/dunning.ts", "type": "TypeScript Module", "responsibility": "督促状発行処理"}]'::jsonb,
  '【設計方針】
1. 段階的対応: 期限経過日数に応じて督促レベルを変化
2. 自動化: 毎朝チェック、該当案件を自動発行',
  '{
    "batch_design": {"schedule": {"type": "cron", "expression": "0 7 * * *", "description": "毎朝7:00実行"}},
    "core_logic": {
      "dunning_levels": [
        {"level": 1, "days_after": 7, "template": "督促状_第1段階", "action": "メール送信"},
        {"level": 2, "days_after": 14, "template": "督促状_第2段階", "action": "メール+PDF添付"},
        {"level": 3, "days_after": 30, "template": "督促状_第3段階", "action": "郵送"}
      ]
    }
  }'::jsonb,
  now(), now()
), (
  'IU-AR-005-03',
  'SRF-005',
  '00000000-0000-0000-0000-000000000001'::uuid,
  'api',
  '延滞アラート通知API',
  '支払期限が近い、または過ぎた請求書について、担当者にアラート通知するAPI。',
  '[{"path": "app/api/alerts/overdue/route.ts", "type": "Next.js API Route", "responsibility": "延滞アラート通知"}]'::jsonb,
  '【設計方針】
1. 通知先: 営業担当者、経理担当者
2. 通知チャネル: Email、Slack',
  '{"api_definition": {"endpoints": [{"method": "POST", "path": "/api/alerts/overdue", "request": {"body": {"invoice_ids": "uuid[]"}}, "response": {"success": true, "notified": "number"}}]}}'::jsonb,
  now(), now()
);

-- SRF-006: 与信管理

INSERT INTO public.impl_unit_sds (
  id, srf_id, project_id, type, name, summary, entry_points, design_policy, details, created_at, updated_at
) VALUES (
  'IU-AR-006-01',
  'SRF-006',
  '00000000-0000-0000-0000-000000000001'::uuid,
  'screen',
  '与信管理画面',
  '顧客ごとの与信枠の設定・参照、与信残高の確認を行う画面。',
  '[{"path": "app/(with-sidebar)/business/AR/credit-limit/page.tsx", "type": "Next.js Page Component", "responsibility": "与信管理画面"}]'::jsonb,
  '【設計方針】
1. リアルタイム表示: 現在の売掛残高・与信残高を表示
2. 警告表示: 与信枠超過顧客をハイライト',
  '{"screen_design": {"columns": ["顧客名", "与信枠", "売掛残高", "与信残高", "利用率", "ステータス"], "alerts": ["与信枠超過", "残高少額"]}}'::jsonb,
  now(), now()
), (
  'IU-AR-006-02',
  'SRF-006',
  '00000000-0000-0000-0000-000000000001'::uuid,
  'api',
  '与信枠変更承認API',
  '与信枠の変更依頼を承認フローに従って処理するAPI。',
  '[{"path": "app/api/credit-limit/approve/route.ts", "type": "Next.js API Route", "responsibility": "与信枠変更承認"}]'::jsonb,
  '【設計方針】
1. 承認フロー: 申請→上長承認→経理承認→反映
2. 履歴管理: 変更履歴を保存',
  '{
    "api_definition": {"endpoints": [{"method": "POST", "path": "/api/credit-limit/request", "request": {"body": {"customer_id": "uuid", "new_limit": "number", "reason": "text"}}}, {"method": "POST", "path": "/api/credit-limit/approve", "request": {"body": {"request_id": "uuid", "decision": "approve|reject"}}}]},
    "db_design": {"tables": [{"name": "credit_limit_requests", "keyColumns": [{"name": "id", "type": "uuid"}, {"name": "status", "type": "text", "enum": ["pending", "approved", "rejected"]}, {"name": "requested_by", "type": "uuid"}, {"name": "approved_by", "type": "uuid"}]}]}
  }'::jsonb,
  now(), now()
);

-- SRF-007: 顧客ポータル

INSERT INTO public.impl_unit_sds (
  id, srf_id, project_id, type, name, summary, entry_points, design_policy, details, created_at, updated_at
) VALUES (
  'IU-AR-007-01',
  'SRF-007',
  '00000000-0000-0000-0000-000000000001'::uuid,
  'api',
  '顧客ポータル認証API',
  '顧客ポータルへのログイン認証を行うAPI。',
  '[{"path": "app/api/portal/auth/route.ts", "type": "Next.js API Route", "responsibility": "顧客ポータル認証"}]'::jsonb,
  '【設計方針】
1. 認証方式: マジックリンク（メールワンタイムパスワード）
2. 有効期限: 15分',
  '{"api_definition": {"endpoints": [{"method": "POST", "path": "/api/portal/auth/send-link", "request": {"body": {"email": "string"}}}, {"method": "POST", "path": "/api/portal/auth/verify", "request": {"body": {"token": "string"}}}]}}'::jsonb,
  now(), now()
), (
  'IU-AR-007-02',
  'SRF-007',
  '00000000-0000-0000-0000-000000000001'::uuid,
  'external_if',
  '電子請求書送信I/F',
  '顧客ポータル経由で請求書PDFをダウンロード/送信する機能。',
  '[{"path": "lib/portal/delivery.ts", "type": "TypeScript Module", "responsibility": "電子請求書配信"}]'::jsonb,
  '【設計方針】
1. 配信方式: ダウンロードリンク + S3プライベートURL
2. 有効期間: リンクの有効期限は7日',
  '{"security": {"authentication": "顧客ポータル認証必須", "authorization": "自身の請求書のみアクセス可"}}'::jsonb,
  now(), now()
);

-- SRF-008: 延滞債権アラート

INSERT INTO public.impl_unit_sds (
  id, srf_id, project_id, type, name, summary, entry_points, design_policy, details, created_at, updated_at
) VALUES (
  'IU-AR-008-01',
  'SRF-008',
  '00000000-0000-0000-0000-000000000001'::uuid,
  'api',
  '延滞債権アラートAPI',
  '延滞債権の発生を検知し、担当者へ通知するAPI。',
  '[{"path": "app/api/alerts/overdue-receivables/route.ts", "type": "Next.js API Route", "responsibility": "延滞債権アラート"}]'::jsonb,
  '【設計方針】
1. 検知条件: 支払期限経過 + 未入金
2. 通知先: 営業担当者、経理部長',
  '{"api_definition": {"endpoints": [{"method": "POST", "path": "/api/alerts/overdue-receivables", "response": {"success": true, "count": "number"}}]}}'::jsonb,
  now(), now()
);
