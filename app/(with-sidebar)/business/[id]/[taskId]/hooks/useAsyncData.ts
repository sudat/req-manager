"use client";

import { useEffect, useState } from "react";

// スケルトンローディングが確実に表示される最小時間（ミリ秒）
const MIN_LOADING_TIME = 300;

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
		let timeoutId: NodeJS.Timeout | null = null;

		async function fetchData(): Promise<void> {
			const startTime = Date.now();
			setLoading(true);

			const { data: result, error: fetchError } = await fetchFn();

			if (!active) return;

			// 経過時間を計算
			const elapsedTime = Date.now() - startTime;
			// 最小ローディング時間を確保
			const remainingTime = Math.max(0, MIN_LOADING_TIME - elapsedTime);

			if (fetchError) {
				setError(fetchError);
				setData([]);
			} else {
				setError(null);
				setData(result ?? []);
			}

			// 最小ローディング時間が経過してからローディング状態を解除
			timeoutId = setTimeout(() => {
				if (active) {
					setLoading(false);
				}
			}, remainingTime);
		}

		fetchData();

		return () => {
			active = false;
			if (timeoutId) {
				clearTimeout(timeoutId);
			}
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
		let timeoutId: NodeJS.Timeout | null = null;

		async function fetchData(): Promise<void> {
			const startTime = Date.now();
			setLoading(true);

			const { data: result, error: fetchError } = await fetchFn();

			if (!active) return;

			// 経過時間を計算
			const elapsedTime = Date.now() - startTime;
			// 最小ローディング時間を確保
			const remainingTime = Math.max(0, MIN_LOADING_TIME - elapsedTime);

			if (fetchError) {
				setError(fetchError);
				setData(null);
			} else {
				setError(null);
				setData(result);
			}

			// 最小ローディング時間が経過してからローディング状態を解除
			timeoutId = setTimeout(() => {
				if (active) {
					setLoading(false);
				}
			}, remainingTime);
		}

		fetchData();

		return () => {
			active = false;
			if (timeoutId) {
				clearTimeout(timeoutId);
			}
		};
	}, [fetchFn]);

	return { data, loading, error };
}
