import { redirect } from 'next/navigation';

export default function NotificationRedirectPage() {
	redirect('/settings');
}
