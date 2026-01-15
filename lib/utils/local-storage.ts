/**
 * LocalStorage操作のユーティリティ関数
 */

/**
 * LocalStorageにデータを保存する
 * @param key ストレージキー
 * @param value 保存する値（JSONシリアライズ可能）
 * @returns 保存成功時true、失敗時false
 */
export function saveToStorage<T>(key: string, value: T): boolean {
	try {
		window.localStorage.setItem(key, JSON.stringify(value));
		return true;
	} catch {
		return false;
	}
}

/**
 * LocalStorageからデータを読み込む
 * @param key ストレージキー
 * @returns 読み込んだ値、失敗時null
 */
export function loadFromStorage<T>(key: string): T | null {
	try {
		const item = window.localStorage.getItem(key);
		return item ? JSON.parse(item) : null;
	} catch {
		return null;
	}
}

/**
 * LocalStorageからデータを削除する
 * @param key ストレージキー
 * @returns 削除成功時true、失敗時false
 */
export function removeFromStorage(key: string): boolean {
	try {
		window.localStorage.removeItem(key);
		return true;
	} catch {
		return false;
	}
}
