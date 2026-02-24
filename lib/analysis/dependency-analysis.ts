import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import type { ProjectInvestigationSettings } from "@/lib/domain";
import type { InvestigationResult } from "@/lib/domain/value-objects";

type BottomUpResult = NonNullable<InvestigationResult["bottomUpResult"]>;

const execFileAsync = promisify(execFile);

const toPosixPath = (value: string): string => value.replaceAll("\\", "/");
const normalizeRelPath = (value: string): string => toPosixPath(value).replace(/^\/+/, "");

const sanitizeRepositoryUrlForStorage = (url: string): string => {
  try {
    const parsed = new URL(url);
    // Strip credentials + query/hash (tokens can appear there)
    parsed.username = "";
    parsed.password = "";
    parsed.search = "";
    parsed.hash = "";
    return parsed.toString();
  } catch {
    return url;
  }
};

const globToRegExp = (glob: string): RegExp => {
  // Very small glob implementation: *, **, ?
  const escaped = glob
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replaceAll("**", "<<<TWOSTAR>>>")
    .replaceAll("*", "[^/]*")
    .replaceAll("<<<TWOSTAR>>>", ".*")
    .replaceAll("?", "[^/]");
  return new RegExp(`^${escaped}$`);
};

const matchesAny = (value: string, patterns: string[]): boolean => {
  if (patterns.length === 0) return false;
  const normalized = normalizeRelPath(value);
  return patterns.some((pattern) => {
    const trimmed = pattern.trim();
    if (!trimmed) return false;
    return globToRegExp(trimmed).test(normalized);
  });
};

const shouldIncludeFile = (
  relPath: string,
  includePatterns: string[],
  excludePatterns: string[]
): boolean => {
  const normalized = normalizeRelPath(relPath);

  // Hard excludes (safety)
  if (
    normalized.startsWith(".git/") ||
    normalized.startsWith("node_modules/") ||
    normalized.startsWith(".next/") ||
    normalized.startsWith("dist/") ||
    normalized.startsWith("build/")
  ) {
    return false;
  }

  if (matchesAny(normalized, excludePatterns)) return false;
  if (includePatterns.length === 0) return true;
  return matchesAny(normalized, includePatterns);
};

const EXTENSIONS = [
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mts",
  ".cts",
  ".mjs",
  ".cjs",
  ".json",
] as const;

const fileExists = async (absPath: string): Promise<"file" | "dir" | null> => {
  try {
    const st = await fs.stat(absPath);
    if (st.isFile()) return "file";
    if (st.isDirectory()) return "dir";
    return null;
  } catch {
    return null;
  }
};

const resolveModuleToRelPath = async (
  repoRootAbs: string,
  importerRelPath: string,
  specifier: string,
  pathAliases: Array<{ fromPrefix: string; toPrefix: string }>
): Promise<string | null> => {
  const importerDir = path.posix.dirname(normalizeRelPath(importerRelPath));

  const resolveCandidate = async (candidateRelNoExt: string): Promise<string | null> => {
    const normalizedCandidate = normalizeRelPath(candidateRelNoExt);
    const absNoExt = path.join(repoRootAbs, ...normalizedCandidate.split("/"));
    const existsNoExt = await fileExists(absNoExt);
    if (existsNoExt === "file") return normalizedCandidate;

    for (const ext of EXTENSIONS) {
      const absWithExt = absNoExt + ext;
      if ((await fileExists(absWithExt)) === "file") return normalizedCandidate + ext;
    }

    if (existsNoExt === "dir") {
      for (const ext of EXTENSIONS) {
        const absIndex = path.join(absNoExt, `index${ext}`);
        if ((await fileExists(absIndex)) === "file") return `${normalizedCandidate}/index${ext}`;
      }
    }

    return null;
  };

  // 1) relative imports
  if (specifier.startsWith(".")) {
    return resolveCandidate(path.posix.normalize(path.posix.join(importerDir, specifier)));
  }

  // 2) tsconfig paths aliases (simple prefix match)
  for (const alias of pathAliases) {
    if (specifier.startsWith(alias.fromPrefix)) {
      const suffix = specifier.slice(alias.fromPrefix.length);
      const rel = path.posix.normalize(path.posix.join(alias.toPrefix, suffix));
      const resolved = await resolveCandidate(rel);
      if (resolved) return resolved;
    }
  }

  return null;
};

const extractImportSpecifiers = (source: string): string[] => {
  const results: string[] = [];

  const patterns = [
    /\bimport\s+(?:type\s+)?[^'"]*?\bfrom\s+['"]([^'"]+)['"]/g,
    /\bexport\s+[^'"]*?\bfrom\s+['"]([^'"]+)['"]/g,
    /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    /\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  ];

  for (const re of patterns) {
    for (const match of source.matchAll(re)) {
      const spec = match[1];
      if (typeof spec === "string" && spec.length > 0) results.push(spec);
    }
  }

  return Array.from(new Set(results));
};

const buildPathAliases = async (
  repoRootAbs: string
): Promise<Array<{ fromPrefix: string; toPrefix: string }>> => {
  try {
    const tsconfigPath = path.join(repoRootAbs, "tsconfig.json");
    const raw = await fs.readFile(tsconfigPath, "utf-8");
    const json = JSON.parse(raw) as any;
    const paths = json?.compilerOptions?.paths as Record<string, unknown> | undefined;
    if (!paths || typeof paths !== "object") return [];

    const aliases: Array<{ fromPrefix: string; toPrefix: string }> = [];
    for (const [fromPattern, toPatternsRaw] of Object.entries(paths)) {
      if (!fromPattern.endsWith("/*")) continue;
      const fromPrefix = fromPattern.slice(0, -1); // keep trailing "/"
      const toPatterns = Array.isArray(toPatternsRaw) ? toPatternsRaw : [];
      for (const toPattern of toPatterns) {
        if (typeof toPattern !== "string") continue;
        if (!toPattern.endsWith("/*")) continue;
        const toPrefix = toPosixPath(toPattern).replace(/^\.\//, "").slice(0, -1);
        aliases.push({ fromPrefix, toPrefix });
      }
    }

    return aliases;
  } catch {
    return [];
  }
};

export async function analyzeRepositoryBottomUpImpact(args: {
  repositoryUrl: string | null;
  entryPoints: string[];
  settings: ProjectInvestigationSettings;
}): Promise<BottomUpResult> {
  const repositoryUrl = args.repositoryUrl;
  const entryPoints = args.entryPoints.map(normalizeRelPath).filter((p) => p.length > 0);

  const includePatterns = args.settings.exploration.default_include_patterns ?? [];
  const excludePatterns = args.settings.exploration.default_exclude_patterns ?? [];
  const maxDepth = args.settings.exploration.default_max_depth ?? 5;

  const sharedModulePatterns = args.settings.shared_module_patterns ?? [];

  const resultBase: BottomUpResult = {
    repositoryUrl: repositoryUrl ? sanitizeRepositoryUrlForStorage(repositoryUrl) : null,
    error: null,
    explorationMetadata: {
      totalFilesScanned: 0,
      totalDependenciesFound: 0,
      maxDepthReached: 0,
      truncated: false,
      truncationReason: null,
    },
    affectedFiles: [],
  };

  if (!repositoryUrl) {
    return {
      ...resultBase,
      error: "projects.github_url が未設定のため、コード依存（ボトムアップ）解析を実行できません",
    };
  }

  if (entryPoints.length === 0) {
    return {
      ...resultBase,
      error: "entry_point が無いため、コード依存（ボトムアップ）解析を実行できません",
    };
  }

  const tmpBaseDir = path.join(os.tmpdir(), "req-manager-impact-analysis");
  const repoDir = path.join(
    tmpBaseDir,
    `repo-${Date.now()}-${Math.random().toString(16).slice(2)}`
  );

  await fs.mkdir(tmpBaseDir, { recursive: true });

  try {
    // Clone repository (public repo only for MVP)
    await execFileAsync("git", ["clone", "--depth", "1", repositoryUrl, repoDir], {
      timeout: 60_000,
      env: { ...process.env, GIT_TERMINAL_PROMPT: "0" },
    });

    const pathAliases = await buildPathAliases(repoDir);

    const maxVisitedFiles = Math.max(
      200,
      (args.settings.allow_paths_rule?.safety_limits?.max_total_files ?? 50) * 20
    );

    const visited = new Map<string, { depth: number; chain: string[] }>();
    const queue: Array<{ filePath: string; depth: number; chain: string[] }> = [];

    // Seed with entry points (only if exists + passes include/exclude)
    for (const entryPoint of entryPoints) {
      if (!shouldIncludeFile(entryPoint, includePatterns, excludePatterns)) continue;

      const abs = path.join(repoDir, ...entryPoint.split("/"));
      if ((await fileExists(abs)) !== "file") continue;

      if (!visited.has(entryPoint)) {
        visited.set(entryPoint, { depth: 0, chain: [entryPoint] });
        queue.push({ filePath: entryPoint, depth: 0, chain: [entryPoint] });
      }
    }

    let scannedCount = 0;
    let edgeCount = 0;
    let maxDepthReached = 0;

    while (queue.length > 0) {
      if (visited.size >= maxVisitedFiles) {
        resultBase.explorationMetadata.truncated = true;
        resultBase.explorationMetadata.truncationReason = `visited files exceeded cap (${maxVisitedFiles})`;
        break;
      }

      const current = queue.shift();
      if (!current) break;
      maxDepthReached = Math.max(maxDepthReached, current.depth);

      const currentAbs = path.join(repoDir, ...current.filePath.split("/"));
      let source: string;
      try {
        source = await fs.readFile(currentAbs, "utf-8");
      } catch {
        continue;
      }

      scannedCount += 1;

      if (current.depth >= maxDepth) continue;

      const specs = extractImportSpecifiers(source);
      for (const spec of specs) {
        const resolved = await resolveModuleToRelPath(
          repoDir,
          current.filePath,
          spec,
          pathAliases
        );
        edgeCount += 1;
        if (!resolved) continue;
        if (!shouldIncludeFile(resolved, includePatterns, excludePatterns)) continue;

        const nextDepth = current.depth + 1;
        if (nextDepth > maxDepth) continue;

        if (!visited.has(resolved)) {
          const nextChain = [...current.chain, resolved];
          visited.set(resolved, { depth: nextDepth, chain: nextChain });
          queue.push({ filePath: resolved, depth: nextDepth, chain: nextChain });
        }
      }
    }

	    const affectedFiles: BottomUpResult["affectedFiles"] = Array.from(visited.entries())
	      .map(([filePath, meta]) => {
	        const confidence = (maxDepth + 1 - meta.depth) / (maxDepth + 1);
	        const impactType: "direct" | "indirect" = meta.depth === 0 ? "direct" : "indirect";
	        const changeLikelihood: "high" | "medium" | "low" =
	          impactType === "direct" ? "high" : confidence >= 0.66 ? "medium" : "low";
	        const dependencyType: "import" | "type" | "runtime" | "config" = "import";

        return {
          filePath,
          impactType,
          depth: meta.depth,
          confidence,
          changeLikelihood,
          reason:
            impactType === "direct"
              ? "Design Document の entry_point として指定されているため"
              : "entry_point から import 依存で到達したため",
	          dependencyChain: meta.chain,
	          dependencyType,
	          sharedModule: matchesAny(filePath, sharedModulePatterns) || undefined,
	        };
	      })
      .sort((a, b) => a.depth - b.depth || b.confidence - a.confidence || a.filePath.localeCompare(b.filePath));

    return {
      ...resultBase,
      explorationMetadata: {
        totalFilesScanned: scannedCount,
        totalDependenciesFound: edgeCount,
        maxDepthReached,
        truncated: resultBase.explorationMetadata.truncated,
        truncationReason: resultBase.explorationMetadata.truncationReason,
      },
      affectedFiles,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error while analyzing repository";
    return { ...resultBase, error: `ボトムアップ解析に失敗しました: ${message}` };
  } finally {
    // Best-effort cleanup
    try {
      await fs.rm(repoDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  }
}
