const fs = require('node:fs');
const path = require('node:path');
const { parseDocument } = require('yaml');

const inputPath = process.argv[2] || path.join('.tmp', 'business_tasks_jsonb_rows.json');
const outputPath = process.argv[3] || path.join('.tmp', 'backfill_business_tasks.sql');

const raw = fs.readFileSync(inputPath, 'utf8');
const rows = JSON.parse(raw);

const DEFAULT_WHEN = '適宜';
const DEFAULT_WHO = '担当部門';

const whenHints = [
  { re: /確定後/, value: '確定後' },
  { re: /完了/, value: '完了後' },
  { re: /受領/, value: '受領時' },
  { re: /通知/, value: '通知時' },
  { re: /確認/, value: '確認時' },
  { re: /作成/, value: '作成時' },
  { re: /提出/, value: '提出時' },
  { re: /回答/, value: '回答時' },
  { re: /立会い/, value: '立会い時' },
  { re: /交渉/, value: '交渉時' },
  { re: /実施/, value: '実施時' },
];

const roleHints = [
  { re: /外部税理士/, value: '外部税理士' },
  { re: /税務当局/, value: '税務担当' },
  { re: /税務/, value: '税務担当' },
  { re: /経理/, value: '経理担当' },
  { re: /法務/, value: '法務担当' },
  { re: /購買/, value: '購買担当' },
  { re: /営業/, value: '営業担当' },
  { re: /人事/, value: '人事担当' },
  { re: /与信/, value: '与信担当' },
  { re: /回収/, value: '回収担当' },
  { re: /マネージャ/, value: 'マネージャー' },
  { re: /責任者/, value: '責任者' },
  { re: /管理者/, value: '管理者' },
  { re: /システム/, value: 'システム' },
  { re: /社内関係者/, value: '社内関係者' },
  { re: /担当部門/, value: '担当部門' },
];

const normalizeTimePhrase = (text) => {
  const match = text.match(/([^、（）()\s]{2,}?(?:時|後|前|中))/);
  if (match) return match[1];
  for (const hint of whenHints) {
    if (hint.re.test(text)) return hint.value;
  }
  return DEFAULT_WHEN;
};

const normalizeWho = (text) => {
  const roles = [];
  for (const hint of roleHints) {
    if (hint.re.test(text)) roles.push(hint.value);
  }
  const unique = Array.from(new Set(roles));
  if (unique.length > 0) return unique.join('・');
  return DEFAULT_WHO;
};

const parseYaml = (src) => {
  if (!src || !String(src).trim()) return null;
  const doc = parseDocument(src);
  if (doc.errors && doc.errors.length > 0) return null;
  return doc.toJSON();
};

const normalizeProcessSteps = (value) => {
  if (value === null || value === undefined) return value;

  let listValue = value;

  if (typeof value === 'string') {
    const parsed = parseYaml(value);
    if (parsed) {
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && parsed.process_steps) {
        listValue = parsed.process_steps;
      } else {
        listValue = parsed;
      }
    } else {
      listValue = value.split('\n').map((line) => line.trim()).filter(Boolean);
    }
  }

  if (Array.isArray(listValue)) {
    return listValue.map((entry) => {
      if (typeof entry === 'string') {
        const action = entry.trim();
        return {
          when: normalizeTimePhrase(action),
          who: normalizeWho(action),
          action,
        };
      }
      if (entry && typeof entry === 'object') {
        const when = entry.when ? String(entry.when).trim() : '';
        const who = entry.who ? String(entry.who).trim() : '';
        const action = entry.action ? String(entry.action).trim() : '';
        return {
          when: when || normalizeTimePhrase(action),
          who: who || normalizeWho(action),
          action,
        };
      }
      return { when: DEFAULT_WHEN, who: DEFAULT_WHO, action: '' };
    });
  }

  return value;
};

const normalizeKeySourceList = (value) => {
  if (value === null || value === undefined) return value;

  let listValue = value;

  if (typeof value === 'string') {
    const parsed = parseYaml(value);
    if (parsed) {
      listValue = parsed;
    } else {
      listValue = value.split('\n').map((line) => line.trim()).filter(Boolean);
    }
  }

  if (Array.isArray(listValue)) {
    return listValue.map((entry) => {
      if (typeof entry === 'string') {
        return { name: entry.trim(), source: '' };
      }
      if (entry && typeof entry === 'object') {
        const name = entry.name ? String(entry.name).trim() : '';
        const source = entry.source
          ? String(entry.source).trim()
          : entry.destination
          ? String(entry.destination).trim()
          : '';
        return { name, source };
      }
      return { name: '', source: '' };
    });
  }

  return value;
};

const updates = [];
const summary = { process_steps: 0, input: 0, output: 0, rows: 0 };

for (const row of rows) {
  const next = {};
  let changed = false;

  const normalizedProcess = normalizeProcessSteps(row.process_steps);
  if (JSON.stringify(normalizedProcess) !== JSON.stringify(row.process_steps)) {
    next.process_steps = normalizedProcess;
    changed = true;
    summary.process_steps += 1;
  }

  const normalizedInput = normalizeKeySourceList(row.input);
  if (JSON.stringify(normalizedInput) !== JSON.stringify(row.input)) {
    next.input = normalizedInput;
    changed = true;
    summary.input += 1;
  }

  const normalizedOutput = normalizeKeySourceList(row.output);
  if (JSON.stringify(normalizedOutput) !== JSON.stringify(row.output)) {
    next.output = normalizedOutput;
    changed = true;
    summary.output += 1;
  }

  if (changed) {
    summary.rows += 1;
    updates.push({ id: row.id, ...next });
  }
}

const escapeLiteral = (value) => {
  const json = JSON.stringify(value);
  return json.replace(/'/g, "''");
};

const statements = ['begin;'];

for (const update of updates) {
  const sets = [];
  if (update.process_steps !== undefined) {
    sets.push(`process_steps = '${escapeLiteral(update.process_steps)}'::jsonb`);
  }
  if (update.input !== undefined) {
    sets.push(`input = '${escapeLiteral(update.input)}'::jsonb`);
  }
  if (update.output !== undefined) {
    sets.push(`output = '${escapeLiteral(update.output)}'::jsonb`);
  }

  if (sets.length === 0) continue;

  statements.push(
    `update public.business_tasks set ${sets.join(', ')} where id = '${update.id}';`
  );
}

statements.push('commit;');

fs.writeFileSync(outputPath, statements.join('\n'));

console.log(`[backfill] rows: ${summary.rows}`);
console.log(`[backfill] process_steps updated: ${summary.process_steps}`);
console.log(`[backfill] input updated: ${summary.input}`);
console.log(`[backfill] output updated: ${summary.output}`);
console.log(`[backfill] sql: ${outputPath}`);
