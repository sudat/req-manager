-- ================================================================================
-- 実装単位SD（IU）サンプルデータ
-- 対象: SRF-001（請求書発行）
-- ドメイン: AR（債権管理）
-- 仕様: PRD 3.9 実装単位SD
-- ================================================================================

-- IU-AR-001-01: 請求書発行画面（screen）
INSERT INTO public.impl_unit_sds (
  id,
  srf_id,
  project_id,
  type,
  name,
  summary,
  entry_points,
  design_policy,
  details,
  created_at,
  updated_at
) VALUES (
  'IU-AR-001-01',
  'SRF-001',
  '00000000-0000-0000-0000-000000000001'::uuid,
  'screen',
  '請求書発行画面',
  '請求対象の一覧表示・選択・発行指示を行う画面。税率区分の確認、プレビュー、一括発行に対応。',
  '[
    {
      "path": "app/(with-sidebar)/business/[id]/[taskId]/invoice/generate/page.tsx",
      "type": "Next.js Page Component",
      "responsibility": "請求書発行画面のUI描画、ユーザー操作のハンドリング"
    },
    {
      "path": "components/invoices/invoice-generate-form.tsx",
      "type": "React Component",
      "responsibility": "請求対象選択、発行条件指定フォーム"
    },
    {
      "path": "components/invoices/invoice-preview.tsx",
      "type": "React Component",
      "responsibility": "請求書プレビュー表示（税率別内訳含む）"
    }
  ]'::jsonb,
  '【設計方針】
1. ユーザビリティ: 請求対象の選択から発行までの操作フローを3ステップ以内で完結
2. 情報提示: 税率別内訳（10%/8%）を視覚的に分かりやすく表示
3. エラー防止: 発行前に必須項目のバリデーションを行い、プレビューで最終確認
4. パフォーマンス: 一括発行時は非同期処理で進捗をリアルタイム表示',
  '{
    "screen_design": {
      "layout": {
        "sections": [
          {
            "name": "請求対象選択セクション",
            "components": [
              {"type": "DatePicker", "label": "請求対象期間", "required": true},
              {"type": "CustomerSelect", "label": "顧客", "required": true, "multiSelect": true},
              {"type": "InvoiceStatusFilter", "label": "ステータス", "options": ["未請求", "再請求"]}
            ]
          },
          {
            "name": "請求対象一覧",
            "components": [
              {"type": "DataTable", "columns": ["顧客名", "件名", "金額", "税率", "発行状態"], "selectable": true}
            ]
          },
          {
            "name": "発行プレビュー",
            "components": [
              {"type": "InvoicePreview", "showDetails": ["登録番号", "税率別対価", "税額"]}
            ]
          },
          {
            "name": "アクション",
            "components": [
              {"type": "Button", "label": "プレビュー確認", "variant": "outline"},
              {"type": "Button", "label": "一括発行", "variant": "primary", "confirm": true}
            ]
          }
        ]
      },
      "validation": {
        "rules": [
          {"field": "請求対象期間", "rule": "必須、開始日≤終了日"},
          {"field": "顧客", "rule": "少なくとも1件選択"},
          {"field": "発行対象", "rule": "少なくとも1件選択"}
        ],
        "errorMessages": {
          "noTargets": "発行対象が選択されていません",
          "invalidPeriod": "請求対象期間を正しく設定してください"
        }
      },
      "actions": {
        "preview": {
          "trigger": "プレビューボタンクリック",
          "api": "POST /api/invoices/preview",
          "loading": "プレビュー生成中...",
          "success": "プレビューを表示"
        },
        "generate": {
          "trigger": "一括発行ボタンクリック",
          "confirmation": "選択した{n}件の請求書を発行します。よろしいですか？",
          "api": "POST /api/invoices/generate-batch",
          "progress": true,
          "success": "{n}件の請求書を発行しました"
        }
      }
    },
    "api_definition": {
      "endpoints": [
        {
          "method": "POST",
          "path": "/api/invoices/preview",
          "description": "請求書プレビュー生成",
          "request": {
            "body": {
              "targetIds": "string[]",
              "issueDate": "string (date)"
            }
          },
          "response": {
            "previewUrl": "string",
            "details": {
              "subtotal10": "number",
              "tax10": "number",
              "subtotal8": "number",
              "tax8": "number",
              "total": "number"
            }
          },
          "errors": [
            {"code": "INVALID_TARGET", "message": "無効な請求対象が含まれています"},
            {"code": "TAX_RATE_MISSING", "message": "税率区分が設定されていません"}
          ]
        }
      ]
    },
    "core_logic": {
      "tax_calculation": {
        "method": "consume_tax_calculation",
        "description": "消費税計算（インボイス制度対応）",
        "spec": {
          "rounding": "切り捨て（1円単位）",
          "tax_rates": [
            {"rate": 10, "name": "標準税率"},
            {"rate": 8, "name": "軽減税率"}
          ],
          "calculation": "各明細の（税抜価格 × 税率）を合計し、切り捨て"
        }
      },
      "pdf_generation": {
        "library": "jsPDF or PDFKit",
        "template": "請求書テンプレート（JIS標準規格準拠）",
        "requiredFields": [
          "適格請求書発行事業者登録番号（T+13桁）",
          "税率別の対価の額（10%適用、8%適用）",
          "税率別の消費税額等（10%適用、8%適用）",
          "発行日",
          "請求書番号"
        ]
      }
    },
    "exception_handling": {
      "errors": [
        {
          "type": "VALIDATION_ERROR",
          "handling": "画面にエラーメッセージを表示、該当フィールドをハイライト",
          "userAction": "入力内容を確認して再実行"
        },
        {
          "type": "API_ERROR",
          "handling": "トースト通知でエラーを表示、ログを記録",
          "userAction": "しばらく待ってから再実行、または管理者に連絡"
        },
        {
          "type": "PDF_GENERATION_ERROR",
          "handling": "エラー詳細を表示、プレビュー生成をスキップ",
          "userAction": "PDF生成設定を確認、または個別発行を試行"
        }
      ],
      "retry": {
        "maxAttempts": 3,
        "backoff": "exponential",
        "retryableErrors": ["NETWORK_ERROR", "TIMEOUT"]
      }
    }
  }'::jsonb,
  now(),
  now()
);

-- IU-AR-001-02: 請求書発行API（api）
INSERT INTO public.impl_unit_sds (
  id,
  srf_id,
  project_id,
  type,
  name,
  summary,
  entry_points,
  design_policy,
  details,
  created_at,
  updated_at
) VALUES (
  'IU-AR-001-02',
  'SRF-001',
  '00000000-0000-0000-0000-000000000001'::uuid,
  'api',
  '請求書発行API',
  '請求書PDF生成、税率別集計、メール送信キューイングを行うAPIエンドポイント',
  '[
    {
      "path": "app/api/invoices/generate/route.ts",
      "type": "Next.js API Route",
      "responsibility": "請求書発行リクエストの受付、バックグラウンドジョブのキューイング"
    },
    {
      "path": "app/api/invoices/preview/route.ts",
      "type": "Next.js API Route",
      "responsibility": "請求書プレビュー生成"
    },
    {
      "path": "lib/invoices/generator.ts",
      "type": "TypeScript Module",
      "responsibility": "PDF生成、消費税計算、税率別集計"
    },
    {
      "path": "lib/invoices/queue.ts",
      "type": "TypeScript Module",
      "responsibility": "バックグラウンドジョブ管理、進捗追跡"
    }
  ]'::jsonb,
  '【設計方針】
1. 非同期処理: 重い処理（PDF生成、メール送信）はバックグラウンドジョブで実行
2. 再試行設計: メール送信失敗時に指数バックオフで再試行
3. トランザクション: 請求書発行履歴の記録はPDF生成と原子性を担保
4. レート制限: 10req/min で濫用を防止',
  '{
    "api_definition": {
      "endpoints": [
        {
          "method": "POST",
          "path": "/api/invoices/generate",
          "description": "請求書発行リクエスト受付",
          "authentication": "required (Supabase Auth)",
          "rateLimit": "10 req/min",
          "request": {
            "body": {
              "targetIds": "string[] (必須)",
              "issueDate": "string (date, 必須)",
              "dueDate": "string (date, オプション)",
              "sendEmail": "boolean (デフォルト: true)"
            }
          },
          "response": {
            "success": true,
            "jobId": "string",
            "estimatedSeconds": 30,
            "message": "請求書発行を開始しました"
          },
          "errors": [
            {"code": "UNAUTHORIZED", "status": 401, "message": "認証が必要です"},
            {"code": "RATE_LIMIT_EXCEEDED", "status": 429, "message": "リクエスト数が上限を超えています"},
            {"code": "INVALID_TARGET", "status": 400, "message": "無効な請求対象が含まれています"},
            {"code": "TAX_RATE_MISSING", "status": 400, "message": "税率区分が設定されていません"}
          ]
        },
        {
          "method": "GET",
          "path": "/api/invoices/jobs/{jobId}/status",
          "description": "ジョブ進捗確認",
          "response": {
            "jobId": "string",
            "status": "pending | processing | completed | failed",
            "progress": "number (0-100)",
            "result": {
              "invoiceId": "string",
              "pdfUrl": "string",
              "emailSent": "boolean"
            }
          }
        }
      ]
    },
    "core_logic": {
      "tax_calculation": {
        "module": "lib/invoices/tax-calculator.ts",
        "method": "calculateTax",
        "description": "消費税計算（インボイス制度対応）",
        "spec": {
          "rounding": "切り捨て（1円単位）",
          "tax_rates": [
            {"rate": 10, "name": "標準税率", "code": "10"},
            {"rate": 8, "name": "軽減税率", "code": "8"}
          ],
          "calculation": "各明細の（税抜価格 × 税率）を合計し、切り捨て",
          "example": {
            "items": [
              {"name": "商品A", "price": 1000, "taxRate": 10},
              {"name": "商品B", "price": 500, "taxRate": 8}
            ],
            "result": {
              "subtotal10": 1000,
              "tax10": 100,
              "subtotal8": 500,
              "tax8": 40,
              "total": 1640
            }
          }
        }
      },
      "pdf_generation": {
        "module": "lib/invoices/pdf-generator.ts",
        "method": "generateInvoicePDF",
        "spec": {
          "library": "PDFKit",
          "template": "請求書テンプレート（JIS標準規格準拠）",
          "pageSize": "A4",
          "requiredFields": [
            "適格請求書発行事業者登録番号（T+13桁）",
            "税率別の対価の額（10%適用、8%適用）",
            "税率別の消費税額等（10%適用、8%適用）",
            "発行日、請求書番号"
          ],
          "output": {
            "format": "PDF",
            "storage": "Supabase Storage (invoices/)",
            "retention": "7年（電子帳簿保存法対応）"
          }
        }
      },
      "email_queueing": {
        "module": "lib/invoices/email-queue.ts",
        "method": "enqueueEmail",
        "spec": {
          "queue": "PostgreSQL SKIP LOCKED または Redis",
          "priority": "high",
          "retry": {
            "maxAttempts": 5,
            "backoff": "exponential (1min, 2min, 4min, 8min, 16min)",
            "retryableErrors": ["SMTP_ERROR", "TIMEOUT"]
          }
        }
      }
    },
    "db_design": {
      "tables": [
        {
          "name": "invoices",
          "purpose": "請求書ヘッダー情報",
          "keyColumns": [
            {"name": "id", "type": "uuid", "primaryKey": true},
            {"name": "invoice_number", "type": "text", "unique": true},
            {"name": "customer_id", "type": "uuid", "foreignKey": "customers(id)"},
            {"name": "issue_date", "type": "date"},
            {"name": "due_date", "type": "date"},
            {"name": "subtotal_10", "type": "integer"},
            {"name": "tax_10", "type": "integer"},
            {"name": "subtotal_8", "type": "integer"},
            {"name": "tax_8", "type": "integer"},
            {"name": "total_amount", "type": "integer"},
            {"name": "status", "type": "text", "enum": ["draft", "issued", "sent", "paid"]}
          ]
        },
        {
          "name": "invoice_items",
          "purpose": "請求書明細情報",
          "keyColumns": [
            {"name": "id", "type": "uuid", "primaryKey": true},
            {"name": "invoice_id", "type": "uuid", "foreignKey": "invoices(id)"},
            {"name": "description", "type": "text"},
            {"name": "quantity", "type": "integer"},
            {"name": "unit_price", "type": "integer"},
            {"name": "tax_rate", "type": "integer"},
            {"name": "amount", "type": "integer"}
          ]
        },
        {
          "name": "invoice_jobs",
          "purpose": "バックグラウンドジョブ管理",
          "keyColumns": [
            {"name": "id", "type": "uuid", "primaryKey": true},
            {"name": "status", "type": "text", "enum": ["pending", "processing", "completed", "failed"]},
            {"name": "progress", "type": "integer"},
            {"name": "result", "type": "jsonb"},
            {"name": "error_message", "type": "text"}
          ]
        }
      ],
      "transaction_boundary": {
        "description": "請求書発行処理のトランザクション境界",
        "operations": [
          "1. invoices レコード作成",
          "2. invoice_items レコード作成",
          "3. PDF生成とStorage保存",
          "4. invoice_jobs ステータス更新"
        ],
        "isolation_level": "READ COMMITTED",
        "rollback_condition": "PDF生成失敗時は全操作ロールバック"
      },
      "locking": {
        "description": "同時発行時の排他制御",
        "method": "SELECT FOR UPDATE on invoices",
        "scope": "同一 customer_id の未発行請求書"
      },
      "history_management": {
        "description": "請求書発行履歴の管理",
        "table": "invoice_history",
        "trigger": "AFTER INSERT OR UPDATE on invoices",
        "retention": "7年（電子帳簿保存法対応）"
      }
    },
    "exception_handling": {
      "errors": [
        {
          "type": "VALIDATION_ERROR",
          "status": 400,
          "handling": "リクエストボディのバリデーションエラーを返却",
          "userAction": "入力内容を確認して再実行"
        },
        {
          "type": "TAX_RATE_MISSING",
          "status": 400,
          "handling": "税率区分が未設定の明細がある場合にエラー",
          "userAction": "商品マスタの税率区分を設定"
        },
        {
          "type": "PDF_GENERATION_ERROR",
          "status": 500,
          "handling": "ジョブステータスをfailedに更新、エラー詳細を記録",
          "userAction": "テンプレート設定を確認、または個別発行を試行"
        },
        {
          "type": "SMTP_ERROR",
          "status": 500,
          "handling": "再試行キューに追加、最終的に失敗したら通知",
          "userAction": "SMTP設定を確認、または手動送信"
        }
      ],
      "logging": {
        "level": "info",
        "include": ["request_id", "user_id", "invoice_id", "error_details"],
        "destination": "Supabase Logs"
      }
    }
  }'::jsonb,
  now(),
  now()
);

-- IU-AR-001-03: 請求書一括発行バッチ（batch）
INSERT INTO public.impl_unit_sds (
  id,
  srf_id,
  project_id,
  type,
  name,
  summary,
  entry_points,
  design_policy,
  details,
  created_at,
  updated_at
) VALUES (
  'IU-AR-001-03',
  'SRF-001',
  '00000000-0000-0000-0000-000000000001'::uuid,
  'batch',
  '請求書一括発行バッチ',
  '月次バッチ処理で未請求の取引を一括請求書化。キューイング制御で大量処理に対応。',
  '[
    {
      "path": "lib/batch/invoice-batch.ts",
      "type": "TypeScript Module",
      "responsibility": "月次請求書発行バッチのオーケストレーション"
    },
    {
      "path": "lib/batch/batch-queue.ts",
      "type": "TypeScript Module",
      "responsibility": "バッチジョブのキューイング・進捗管理"
    },
    {
      "path": "app/api/cron/invoice-batch/route.ts",
      "type": "Next.js API Route (Cron)",
      "responsibility": "cronトリガー受付"
    }
  ]'::jsonb,
  '【設計方針】
1. スケーラビリティ: 1万件規模の処理に対応するため、チャンキング並列処理を実装
2. 耐障害性: 中断・再開可能なジョブ管理、失敗時の再試行設計
3. 監視: 進捗状況の可視化、異常検知と通知
4. 運用: 任意実行とスケジュール実行の両方に対応',
  '{
    "batch_design": {
      "schedule": {
        "type": "cron",
        "expression": "0 2 1 * *",  "description": "毎月1日 2:00実行（JST）"
      },
      "scope": {
        "target": "前月の未請求取引",
        "query": "SELECT * FROM transactions WHERE invoice_id IS NULL AND transaction_date BETWEEN :start AND :end"
      },
      "processing": {
        "chunkSize": 100,
        "parallelism": 5,
        "estimatedTime": "1000件で約5分"
      }
    },
    "queue_control": {
      "implementation": "PostgreSQL SKIP LOCKED または Redis",
      "table": "batch_jobs",
      "schema": [
        {"name": "id", "type": "uuid", "primaryKey": true},
        {"name": "job_type", "type": "text", "enum": ["invoice_batch"]},
        {"name": "status", "type": "text", "enum": ["pending", "running", "completed", "failed", "cancelled"]},
        {"name": "target_ids", "type": "uuid[]"},
        {"name": "processed_count", "type": "integer"},
        {"name": "failed_count", "type": "integer"},
        {"name": "progress", "type": "integer"},
        {"name": "started_at", "type": "timestamp"},
        {"name": "completed_at", "type": "timestamp"},
        {"name": "error_details", "type": "jsonb"}
      ],
      "concurrency_control": {
        "maxParallelJobs": 3,
        "method": "SELECT ... FOR UPDATE SKIP LOCKED"
      },
      "resume_capability": {
        "description": "中断したジョブを再開可能",
        "checkpoint": "100件ごとに進捗を保存",
        "resume": "未処理のtarget_idsから再開"
      }
    },
    "core_logic": {
      "chunking": {
        "description": "大量処理のためのチャンキング",
        "module": "lib/batch/chunk-processor.ts",
        "method": "processChunk",
        "spec": {
          "chunkSize": 100,
          "parallelism": 5,
          "strategy": "target_idsをチャンク単位で分割し、Workerに配布"
        }
      },
      "error_handling": {
        "description": "チャンク単位のエラーハンドリング",
        "strategy": "失敗したチャンクのみ再試行",
        "maxRetries": 3,
        "deadLetterQueue": "処理できなかったIDを dead_letter_invoices に記録"
      },
      "notification": {
        "description": "バッチ完了通知",
        "on_success": {
          "channel": "email",
          "recipients": ["billing@example.com"],
          "template": "batch_success",
          "include": ["processed_count", "failed_count", "duration"]
        },
        "on_failure": {
          "channel": "email + Slack",
          "recipients": ["billing@example.com", "sysadmin@example.com"],
          "template": "batch_failure",
          "include": ["error_details", "failed_ids"]
        }
      }
    },
    "db_design": {
      "tables": [
        {
          "name": "batch_jobs",
          "purpose": "バッチジョブ管理",
          "indexes": [
            {"columns": ["status", "created_at"], "purpose": "ジョブ取得クエリ最適化"},
            {"columns": ["job_type", "created_at"], "purpose": "履歴照会最適化"}
          ]
        },
        {
          "name": "batch_job_logs",
          "purpose": "バッチ実行ログ",
          "keyColumns": [
            {"name": "id", "type": "uuid", "primaryKey": true},
            {"name": "job_id", "type": "uuid", "foreignKey": "batch_jobs(id)"},
            {"name": "level", "type": "text", "enum": ["info", "warn", "error"]},
            {"name": "message", "type": "text"},
            {"name": "created_at", "type": "timestamp"}
          ],
          "retention": "90日"
        },
        {
          "name": "dead_letter_invoices",
          "purpose": "処理失敗の請求書",
          "keyColumns": [
            {"name": "id", "type": "uuid", "primaryKey": true},
            {"name": "transaction_id", "type": "uuid"},
            {"name": "reason", "type": "text"},
            {"name": "failed_at", "type": "timestamp"},
            {"name": "retry_count", "type": "integer"}
          ]
        }
      ],
      "transaction_boundary": {
        "description": "チャンク処理のトランザクション境界",
        "operations": [
          "1. batch_jobs.statusをrunningに更新",
          "2. チャンク内の取引を請求書化",
          "3. processed_countを更新",
          "4. 失敗時はdead_letter_invoicesに記録"
        ],
        "isolation_level": "READ COMMITTED"
      }
    },
    "exception_handling": {
      "errors": [
        {
          "type": "TIMEOUT",
          "handling": "タイムアウトしたチャンクを再試行キューに追加",
          "userAction": "タイムアウト時間を延長するか、並列度を下げる"
        },
        {
          "type": "OUT_OF_MEMORY",
          "handling": "バッチを中止、adminに通知",
          "userAction": "chunkSizeを小さくする"
        },
        {
          "type": "DB_CONNECTION_ERROR",
          "handling": "再試行、最終的に失敗したら通知",
          "userAction": "DB接続設定を確認"
        }
      ],
      "monitoring": {
        "metrics": ["processed_count", "failed_count", "duration", "memory_usage"],
        "alerts": [
          {"condition": "failed_count > 100", "severity": "warning", "action": "email通知"},
          {"condition": "duration > 60min", "severity": "warning", "action": "Slack通知"},
          {"condition": "progress停滞10分", "severity": "error", "action": "admin通知"}
        ]
      }
    }
  }'::jsonb,
  now(),
  now()
);

-- IU-AR-001-04: メール送信I/F（external_if）
INSERT INTO public.impl_unit_sds (
  id,
  srf_id,
  project_id,
  type,
  name,
  summary,
  entry_points,
  design_policy,
  details,
  created_at,
  updated_at
) VALUES (
  'IU-AR-001-04',
  'SRF-001',
  '00000000-0000-0000-0000-000000000001'::uuid,
  'external_if',
  'メール送信I/F',
  'SendGrid/SES連携で請求書PDFをメール送信。送信結果追跡・再送機能を提供。',
  '[
    {
      "path": "lib/email/sendgrid-client.ts",
      "type": "TypeScript Module",
      "responsibility": "SendGrid API呼び出し"
    },
    {
      "path": "lib/email/ses-client.ts",
      "type": "TypeScript Module",
      "responsibility": "AWS SES API呼び出し（フォールバック）"
    },
    {
      "path": "lib/email/tracking.ts",
      "type": "TypeScript Module",
      "responsibility": "送信結果追跡、開封確認"
    },
    {
      "path": "app/api/invoices/resend/route.ts",
      "type": "Next.js API Route",
      "responsibility": "再送リクエスト受付"
    }
  ]'::jsonb,
  '【設計方針】
1. 高可用性: SendGridメイン、SESフォールバックの二重化
2. 配信品質: 送信結果追跡、失敗時のアラート
3. セキュリティ: 添付ファイルのウイルススキャン、機密情報の暗号化
4. 運用: 任意再送、一括再送機能',
  '{
    "provider_integration": {
      "primary": {
        "provider": "SendGrid",
        "module": "lib/email/sendgrid-client.ts",
        "api": "SendGrid API v3",
        "auth": {
          "method": "API Key",
          "env": "SENDGRID_API_KEY"
        },
        "features": [
          "テンプレート機能",
          "開封トラッキング",
          "クリックトラッキング",
          "バウンス処理"
        ]
      },
      "fallback": {
        "provider": "AWS SES",
        "module": "lib/email/ses-client.ts",
        "api": "AWS SES API v2",
        "auth": {
          "method": "AWS IAM",
          "env": "AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY"
        },
        "trigger": "SendGrid API障害時"
      }
    },
    "email_spec": {
      "template": {
        "name": "請求書送信",
        "subject": "{{customer_name}}様 請求書（{{invoice_number}}）の送付",
        "body": {
          "type": "html",
          "content": "{{customer_name}}様\n\n請求書を添付いたしました。\n\n概要:\n- 請求書番号: {{invoice_number}}\n- 発行日: {{issue_date}}\n- 支払期限: {{due_date}}\n- 金額: ¥{{total_amount}}\n\n詳細は添付ファイルをご確認ください。"
        }
      },
      "attachments": [
        {
          "name": "請求書_{{invoice_number}}.pdf",
          "content_type": "application/pdf",
          "source": "Supabase Storage URL"
        }
      ],
      "recipients": {
        "to": "{{customer_email}}",
        "cc": "{{billing_email}} (オプション)",
        "bcc": "billing-archive@example.com"
      }
    },
    "tracking": {
      "table": "email_tracking",
      "schema": [
        {"name": "id", "type": "uuid", "primaryKey": true},
        {"name": "invoice_id", "type": "uuid", "foreignKey": "invoices(id)"},
        {"name": "message_id", "type": "text", "description": "SendGrid/SES message ID"},
        {"name": "status", "type": "text", "enum": ["queued", "sent", "delivered", "opened", "bounced", "failed"]},
        {"name": "sent_at", "type": "timestamp"},
        {"name": "delivered_at", "type": "timestamp"},
        {"name": "opened_at", "type": "timestamp"},
        {"name": "bounced_reason", "type": "text"},
        {"name": "retry_count", "type": "integer"}
      ],
      "webhook": {
        "endpoints": [
          {"path": "/api/webhooks/sendgrid", "provider": "SendGrid Event Webhook"},
          {"path": "/api/webhooks/ses", "provider": "AWS SES Event Webhook"}
        ],
        "events": ["delivered", "opened", "clicked", "bounced", "dropped", "spamreport"],
        "authentication": {
          "method": "HMAC signature verification",
          "header": "X-Signature"
        }
      }
    },
    "resend_feature": {
      "api": {
        "method": "POST",
        "path": "/api/invoices/resend",
        "request": {
          "body": {
            "invoice_id": "uuid (必須)",
            "recipient_email": "string (オプション、変更の場合)"
          }
        },
        "response": {
          "success": true,
          "message": "再送リクエストを受理しました"
        }
      },
      "batch_resend": {
        "description": "失敗したメールを一括再送",
        "api": {
          "method": "POST",
          "path": "/api/invoices/batch-resend",
          "request": {
            "body": {
              "invoice_ids": "uuid[] (必須)"
            }
          }
        }
      }
    },
    "exception_handling": {
      "errors": [
        {
          "type": "INVALID_EMAIL",
          "handling": "バウンスとして記録、adminに通知",
          "userAction": "顧客メールアドレスを確認"
        },
        {
          "type": "SENDGRID_RATE_LIMIT",
          "handling": "指数バックオフで再試行、SESにフォールバック",
          "userAction": "SendGridプラン確認"
        },
        {
          "type": "ATTACHMENT_TOO_LARGE",
          "handling": "エラー記録、adminに通知",
          "userAction": "PDFサイズを削減"
        },
        {
          "type": "VIRUS_DETECTED",
          "handling": "送信中止、隔離、adminに通知",
          "userAction": "ソースファイルをスキャン"
        }
      ],
      "retry": {
        "maxAttempts": 5,
        "backoff": "exponential",
        "retryableErrors": ["RATE_LIMIT", "TIMEOUT", "SERVICE_UNAVAILABLE"]
      }
    },
    "security": {
      "virus_scan": {
        "enabled": true,
        "service": "ClamAV or AWS S3 Virus Scan"
      },
      "encryption": {
        "at_rest": "Supabase Storage暗号化",
        "in_transit": "TLS 1.3"
      },
      "data_protection": {
        "pii": "顧客メールアドレス、請求書内容",
        "retention": "7年",
        "access_log": "true"
      }
    }
  }'::jsonb,
  now(),
  now()
);
