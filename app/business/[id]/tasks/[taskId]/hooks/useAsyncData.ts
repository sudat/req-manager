"use client";

import { useEffect, useState } from "react";

/**
 * 非同期データフェッチの標準パターンを提供するフック（配列用）
 * @param fetchFn データフェッチ関数
 * @param deps 依存配列（変化時に再フェッチ）
 * @returns データ・ローディング状態・エラー状態
 */
export function useAsyncData<T>(
	fetchFn: () => Promise<{ data: T[] | null; error: string | null }>
): {
	data: T[];
	loading: boolean;
	error: string | null;
} {
	const [data, setData] = useState<T[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let active = true;

		async function fetchData(): Promise<void> {
			setLoading(true);
			const { data: result, error: fetchError } = await fetchFn();
			if (!active) return;
			if (fetchError) {
				setError(fetchError);
				setData([]);
			} else {
				setError(null);
				setData(result ?? []);
			}
			setLoading(false);
		}

		fetchData();

		return () => {
			active = false;
		};
	}, [fetchFn]);

	return { data, loading, error };
}

/**
 * 非同期データフェッチの標準パターンを提供するフック（単一オブジェクト用）
 * @param fetchFn データフェッチ関数
 * @param deps 依存配列（変化時に再フェッチ）
 * @returns データ・ローディング状態・エラー状態
 */
export function useAsyncDataItem<T>(
	fetchFn: () => Promise<{ data: T | null; error: string | null }>
): {
	data: T | null;
	loading: boolean;
	error: string | null;
} {
	const [data, setData] = useState<T | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let active = true;

		async function fetchData(): Promise<void> {
			setLoading(true);
			const { data: result, error: fetchError } = await fetchFn();
			if (!active) return;
			if (fetchError) {
				setError(fetchError);
				setData(null);
			} else {
				setError(null);
				setData(result);
			}
			setLoading(false);
		}

		fetchData();

		return () => {
			active = false;
		};
	}, [fetchFn]);

	return { data, loading, error };
}
