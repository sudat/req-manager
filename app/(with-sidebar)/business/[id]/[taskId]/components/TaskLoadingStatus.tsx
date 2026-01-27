type TaskLoadingStatusProps = {
	loading: boolean;
	error: string | null;
	task: unknown | null;
};

export function TaskLoadingStatus({ loading, error, task }: TaskLoadingStatusProps) {
	if (loading) {
		return null;
	}
	if (error) {
		return <p className="text-[13px] text-rose-600 mb-3">{error}</p>;
	}
	if (task === null) {
		return (
			<p className="text-[13px] text-rose-600 mb-3">
				業務タスクが見つかりません。
			</p>
		);
	}
	return null;
}
