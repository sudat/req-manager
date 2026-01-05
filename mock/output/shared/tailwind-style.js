(function () {
    if (window.__tailwindStyleLoaded) {
        return;
    }
    window.__tailwindStyleLoaded = true;

    var head = document.head || document.getElementsByTagName('head')[0];

    var preconnectGoogle = document.createElement('link');
    preconnectGoogle.rel = 'preconnect';
    preconnectGoogle.href = 'https://fonts.googleapis.com';
    head.appendChild(preconnectGoogle);

    var preconnectGStatic = document.createElement('link');
    preconnectGStatic.rel = 'preconnect';
    preconnectGStatic.href = 'https://fonts.gstatic.com';
    preconnectGStatic.crossOrigin = '';
    head.appendChild(preconnectGStatic);

    var fontLink = document.createElement('link');
    fontLink.rel = 'stylesheet';
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700&display=swap';
    head.appendChild(fontLink);

    window.tailwind = window.tailwind || {};
    window.tailwind.config = {
        theme: {
            extend: {
                colors: {
                    brand: {
                        DEFAULT: '#00897b',
                        50: '#e6f4f2',
                        100: '#cfe9e6',
                        200: '#a1d5ce',
                        300: '#74c1b6',
                        400: '#4eaca0',
                        500: '#00897b',
                        600: '#007a6f',
                        700: '#006b62',
                        800: '#005b54',
                        900: '#004a45'
                    }
                },
                boxShadow: {
                    card: '0 1px 3px rgba(15, 23, 42, 0.08)',
                    lift: '0 10px 30px rgba(15, 23, 42, 0.12)'
                },
                fontFamily: {
                    sans: ['"Noto Sans JP"', 'ui-sans-serif', 'system-ui', 'sans-serif']
                }
            }
        }
    };

    var style = document.createElement('style');
    style.type = 'text/tailwindcss';
    style.textContent = `
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
    body {
        @apply m-0 flex min-h-screen bg-slate-50 text-slate-800 font-sans antialiased;
    }
    a {
        @apply text-inherit;
    }
}

@layer components {
    .sidebar {
        @apply fixed left-0 top-0 h-screen w-[280px] border-r border-slate-200 bg-white/95 backdrop-blur;
    }
    .sidebar-header {
        @apply border-b border-slate-200 px-5 py-6;
    }
    .sidebar-header h2 {
        @apply text-base font-semibold text-slate-900;
    }
    .sidebar-menu {
        @apply py-2;
    }
    .sidebar-menu-item {
        @apply m-0;
    }
    .sidebar-menu-link {
        @apply flex items-center gap-3 px-5 py-3 text-sm text-slate-600 transition hover:bg-slate-100 hover:text-slate-900;
    }
    .sidebar-menu-link.active {
        @apply bg-brand-50 text-brand-700 font-semibold;
    }
    .sidebar-menu-icon {
        @apply h-5 w-5;
    }

    .main-wrapper {
        @apply ml-[280px] flex-1 min-h-screen;
    }
    .main-content {
        @apply ml-[280px] flex min-h-screen flex-1 flex-col;
    }
    .main-left {
        @apply flex flex-col gap-6;
    }
    .right-column {
        @apply flex flex-col gap-6;
    }

    .container,
    .dashboard-container,
    .business-container,
    .idea-container,
    .query-container,
    .view-container {
        @apply mx-auto max-w-[1400px] p-8;
    }

    .header {
        @apply mb-6;
    }
    .header h1 {
        @apply text-2xl font-semibold text-slate-900;
    }
    .header p {
        @apply text-sm text-slate-500;
    }
    .header-title-row {
        @apply flex flex-wrap items-center justify-between gap-4;
    }
    .header-top {
        @apply flex flex-wrap items-center justify-between gap-4;
    }
    .page-header {
        @apply px-8 pt-8;
    }
    .page-title {
        @apply text-2xl font-semibold text-slate-900 mb-2;
    }
    .page-description {
        @apply text-sm text-slate-500;
    }
    .settings-header {
        @apply px-8 pt-8;
    }
    .settings-title {
        @apply text-2xl font-semibold text-slate-900 mb-2;
    }
    .settings-description {
        @apply text-sm text-slate-500;
    }
    .settings-content {
        @apply flex-1;
    }
    .title-section {
        @apply mb-6;
    }
    .toolbar-title {
        @apply text-lg font-semibold text-slate-900;
    }

    .baseline-badge {
        @apply inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700;
    }
    .baseline-meta {
        @apply mt-2 text-xs text-slate-500;
    }
    .baseline-container {
        @apply grid gap-4;
    }
    .baseline-version {
        @apply text-sm font-semibold text-slate-900;
    }
    .baseline-cr-count {
        @apply text-xs text-slate-500;
    }

    .toolbar {
        @apply mb-6 flex flex-wrap items-center justify-between gap-4;
    }
    .toolbar-left {
        @apply flex flex-1 gap-3 min-w-[300px];
    }
    .toolbar-actions {
        @apply flex items-center gap-3;
    }
    .search-box {
        @apply relative flex-1 min-w-[240px];
    }
    .search-icon {
        @apply absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400;
    }
    .search-input {
        @apply w-full rounded-md border border-slate-200 bg-white px-4 py-2 pl-10 text-sm text-slate-700 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20;
    }
    .filter-select {
        @apply w-[160px] rounded-md border border-slate-200 bg-white px-3 py-2 pr-8 text-sm text-slate-700 outline-none transition hover:border-brand focus:border-brand focus:ring-2 focus:ring-brand/20;
    }
    .search-card {
        @apply mb-8 rounded-lg bg-white p-8 shadow-card;
    }
    .search-card-title {
        @apply mb-4 text-sm font-semibold text-slate-600;
    }
    .search-input-wrapper {
        @apply flex flex-wrap items-start gap-3;
    }
    .search-input-container {
        @apply relative flex-1;
    }
    .mic-icon {
        @apply absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition hover:text-brand;
    }

    .btn,
    .btn-primary,
    .btn-secondary,
    .btn-add,
    .btn-submit,
    .btn-save,
    .btn-cancel,
    .btn-test,
    .btn-icon,
    .icon-btn,
    .action-btn,
    .operation-btn,
    .select-button {
        @apply inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition;
    }
    .btn-primary,
    .btn-add,
    .btn-submit,
    .btn-save,
    .action-btn,
    .operation-btn {
        @apply bg-brand text-white shadow-sm hover:bg-brand-600;
    }
    .btn-secondary,
    .btn-cancel,
    .btn-test,
    .select-button {
        @apply border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50;
    }
    .btn-icon,
    .icon-btn {
        @apply px-2 py-2;
    }
    .icon-btn {
        @apply rounded-md border border-slate-200 bg-white text-slate-500 hover:bg-slate-50;
    }
    .icon-btn.view {
        @apply text-slate-500 hover:text-slate-700;
    }
    .icon-btn.edit {
        @apply text-brand hover:text-brand-700;
    }
    .icon-btn.delete {
        @apply text-rose-500 hover:text-rose-700;
    }
    .btn-icon svg,
    .btn-add svg,
    .btn-primary svg {
        @apply h-4 w-4;
    }
    .back-link,
    .back-btn {
        @apply inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900;
    }
    .back-icon {
        @apply h-4 w-4;
    }
    .edit-btn {
        @apply inline-flex items-center gap-2 text-sm font-semibold text-brand hover:text-brand-700;
    }
    .primary {
        @apply bg-brand text-white hover:bg-brand-600;
    }
    .secondary,
    .cancel {
        @apply border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50;
    }
    .danger {
        @apply bg-rose-600 text-white hover:bg-rose-700;
    }
    .analyze-btn {
        @apply mt-4 inline-flex items-center gap-2 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-600;
    }

    .card,
    .content-card,
    .detail-card,
    .section-card,
    .form-card,
    .table-card,
    .table-container,
    .info-box,
    .domain-card,
    .diff-card {
        @apply rounded-lg border border-slate-100 bg-white shadow-card;
    }
    .content-card,
    .detail-card,
    .section-card,
    .form-card,
    .info-box,
    .domain-card,
    .diff-card {
        @apply p-6;
    }
    .content-card-header,
    .diff-card-header,
    .section-header {
        @apply mb-4 flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4;
    }
    .content-card-title,
    .diff-card-title,
    .section-title,
    .card-title {
        @apply text-base font-semibold text-slate-900;
    }
    .card-subtitle {
        @apply mt-2 text-xs text-slate-500;
    }
    .diff-card-content {
        @apply mt-4 space-y-4;
    }
    .diff-checkbox {
        @apply mt-1 h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand/20;
    }
    .diff-title-text {
        @apply text-sm font-semibold text-slate-900;
    }
    .diff-section {
        @apply rounded-md border border-slate-100 bg-slate-50/60 p-4;
    }
    .diff-section-title {
        @apply mb-2 text-sm font-semibold text-slate-700;
    }
    .diff-reason {
        @apply text-xs text-slate-500;
    }
    .diff-detail-link {
        @apply text-xs font-semibold text-brand hover:text-brand-700;
    }

    .table-wrapper {
        @apply overflow-x-auto;
    }
    table {
        @apply w-full border-collapse;
    }
    thead {
        @apply bg-slate-50;
    }
    th {
        @apply px-4 py-3 text-left text-xs font-semibold text-slate-500 border-b border-slate-200 whitespace-nowrap;
    }
    td {
        @apply px-4 py-3 text-sm text-slate-700 border-b border-slate-100;
    }
    tbody tr:hover {
        @apply bg-slate-50;
    }
    tbody tr:last-child td {
        @apply border-b-0;
    }

    .badge,
    .tag,
    .synonym-badge,
    .requirement-type-badge,
    .status-badge,
    .meta-pill,
    .more-badge {
        @apply inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold;
    }
    .badge {
        @apply mr-1 mb-1;
    }
    .status-approved,
    .status-badge.approved {
        @apply bg-emerald-50 text-emerald-700;
    }
    .status-review,
    .status-badge.review {
        @apply bg-sky-50 text-sky-700;
    }
    .status-open,
    .status-badge.open {
        @apply bg-amber-50 text-amber-700;
    }
    .status-in-progress {
        @apply bg-brand-50 text-brand-700;
    }
    .req-business {
        @apply bg-brand-50 text-brand-700;
    }
    .req-system {
        @apply bg-slate-100 text-slate-600;
    }
    .business {
        @apply bg-brand-50 text-brand-700;
    }
    .system {
        @apply bg-slate-100 text-slate-600;
    }
    .area-fi {
        @apply bg-sky-50 text-sky-700;
    }
    .area-sd {
        @apply bg-indigo-50 text-indigo-700;
    }
    .area-mm {
        @apply bg-amber-50 text-amber-700;
    }
    .fi {
        @apply bg-sky-50 text-sky-700;
    }
    .sd {
        @apply bg-indigo-50 text-indigo-700;
    }
    .mm {
        @apply bg-amber-50 text-amber-700;
    }
    .hr {
        @apply bg-rose-50 text-rose-700;
    }
    .diff-badge {
        @apply inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600;
    }
    .diff-badge.add {
        @apply border-emerald-200 bg-emerald-50 text-emerald-700;
    }
    .diff-badge.modify {
        @apply border-amber-200 bg-amber-50 text-amber-700;
    }
    .diff-badge.delete {
        @apply border-rose-200 bg-rose-50 text-rose-700;
    }
    .meta-pill {
        @apply border border-transparent bg-slate-100 text-slate-700;
    }
    .meta-pill.release {
        @apply bg-slate-100 text-slate-700;
    }
    .meta-pill.deadline {
        @apply bg-amber-50 text-amber-700 border-amber-100;
    }
    .meta-pill.deadline.soon {
        @apply bg-rose-50 text-rose-700 border-rose-100;
    }
    .meta-pill.severity-high {
        @apply bg-rose-50 text-rose-700 border-rose-100;
    }
    .meta-pill.severity-medium {
        @apply bg-amber-50 text-amber-700 border-amber-100;
    }
    .synonym-badge {
        @apply bg-slate-100 text-slate-600;
    }
    .tag {
        @apply bg-slate-100 text-slate-600;
    }
    .more-badge {
        @apply bg-slate-200 text-slate-600;
    }

    .form-group {
        @apply mb-6;
    }
    .form-label,
    .input-label {
        @apply mb-2 block text-sm font-semibold text-slate-700;
    }
    .form-input,
    .form-textarea,
    .form-select,
    .input-textarea {
        @apply w-full rounded-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20;
    }
    .form-textarea,
    .input-textarea {
        @apply min-h-[120px] resize-y;
    }
    .form-input-password {
        @apply relative flex items-center;
    }
    .password-toggle {
        @apply absolute right-3 rounded-md p-1 text-slate-400 transition hover:text-slate-600;
    }
    .form-actions,
    .button-area,
    .button-group {
        @apply mt-6 flex flex-wrap items-center gap-3;
    }
    .form-hint,
    .help-text,
    .description-text {
        @apply mt-2 text-xs text-slate-500;
    }
    .checkbox-item {
        @apply inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600;
    }
    .checkbox-label {
        @apply text-xs font-semibold text-slate-600;
    }
    .count {
        @apply text-sm font-semibold text-slate-600;
    }
    .input-section {
        @apply rounded-lg border border-slate-100 bg-white p-6 shadow-card;
    }
    .input-wrapper {
        @apply space-y-2;
    }
    .required-mark,
    .required {
        @apply text-rose-500;
    }

    .change-request-list,
    .requirement-list,
    .version-list,
    .domain-list,
    .documents {
        @apply list-none space-y-4;
    }
    .change-request-item {
        @apply flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4;
    }
    .change-request-item:last-child {
        @apply border-b-0 pb-0;
    }
    .change-request-left {
        @apply flex-1;
    }
    .change-request-id {
        @apply mb-1 text-xs text-slate-400;
    }
    .change-request-title {
        @apply text-sm font-semibold text-slate-900;
    }
    .change-request-category {
        @apply text-xs text-slate-500;
    }
    .change-request-right {
        @apply flex min-w-[220px] flex-col items-end gap-3;
    }
    .change-request-meta {
        @apply flex flex-wrap items-center justify-end gap-2;
    }
    .change-request-date {
        @apply text-xs text-slate-400;
    }
    .badges,
    .tags,
    .business-tags,
    .area-badges,
    .domains,
    .synonyms,
    .versions {
        @apply flex flex-wrap gap-2;
    }
    .business-tag {
        @apply inline-flex items-center rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700;
    }
    .version {
        @apply inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-500;
    }
    .version-status {
        @apply text-xs font-semibold text-emerald-600;
    }
    .version-status.applied {
        @apply text-emerald-600;
    }

    .summary-section {
        @apply flex flex-wrap items-stretch gap-4 mb-6;
    }
    .summary-card {
        @apply flex min-w-[240px] flex-1 flex-col gap-3 rounded-lg border border-slate-100 bg-white p-5 shadow-card;
    }
    .summary-card.actions {
        @apply min-w-[260px] p-4;
    }
    .summary-actions {
        @apply flex flex-col gap-2;
    }
    .summary-action {
        @apply inline-flex items-center justify-center gap-2 rounded-md border border-transparent px-4 py-3 text-xs font-semibold transition;
    }
    .summary-action.primary {
        @apply bg-brand text-white hover:bg-brand-600;
    }
    .summary-action.secondary {
        @apply border border-slate-200 bg-white text-slate-700 hover:bg-slate-50;
    }
    .summary-card-icon {
        @apply flex h-12 w-12 items-center justify-center rounded-lg bg-brand-50 text-brand-700;
    }
    .summary-card-icon.blue,
    .summary-card-icon.purple,
    .summary-card-icon.yellow,
    .summary-card-icon.green {
        @apply bg-brand-50 text-brand-700;
    }
    .summary-card-value {
        @apply text-3xl font-semibold text-slate-900;
    }
    .summary-card-label {
        @apply text-xs text-slate-600;
    }
    .summary-card-label strong {
        @apply text-slate-900 font-semibold;
    }
    .summary-subtext {
        @apply text-xs text-slate-400;
    }
    .summary-group {
        @apply flex min-w-[360px] flex-[2] flex-col gap-3 rounded-lg border border-slate-100 bg-white p-4 shadow-card;
    }
    .summary-group-title {
        @apply text-xs font-semibold text-slate-600;
    }
    .summary-group-cards {
        @apply grid grid-cols-2 overflow-hidden rounded-lg border border-slate-100;
    }
    .summary-group-card {
        @apply min-h-[96px] bg-white p-4;
    }
    .summary-group-card + .summary-group-card {
        @apply border-l border-slate-100;
    }
    .summary-group-card.high {
        @apply bg-rose-50;
    }
    .summary-group-card.medium {
        @apply bg-amber-50;
    }
    .summary-group-label {
        @apply mb-2 text-xs font-semibold text-slate-600;
    }
    .summary-group-card.high .summary-group-label,
    .summary-group-card.high .summary-group-value {
        @apply text-rose-700;
    }
    .summary-group-card.medium .summary-group-label,
    .summary-group-card.medium .summary-group-value {
        @apply text-amber-700;
    }
    .summary-group-value {
        @apply text-2xl font-semibold;
    }

    .distribution {
        @apply flex flex-col gap-3;
    }
    .distribution-item {
        @apply grid grid-cols-[140px_1fr_80px] items-center gap-3;
    }
    .distribution-label {
        @apply text-xs font-semibold text-slate-700;
    }
    .distribution-bar {
        @apply h-2.5 overflow-hidden rounded-full bg-slate-100;
    }
    .distribution-bar > span {
        @apply block h-full rounded-full bg-brand;
    }
    .distribution-value {
        @apply text-right text-xs text-slate-500;
    }
    .distribution-note {
        @apply mt-3 text-xs text-slate-400;
    }

    .review-actions {
        @apply flex w-full gap-2;
    }
    .mini-button {
        @apply inline-flex flex-1 items-center justify-center rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50;
    }
    .mini-button.approve {
        @apply border-brand bg-brand text-white hover:bg-brand-600;
    }
    .mini-button.reject {
        @apply border-slate-200 bg-white text-slate-700 hover:bg-slate-50;
    }
    .reject {
        @apply text-slate-700;
    }

    .content-area {
        @apply flex flex-1 gap-8 px-8 pb-8 pt-6;
    }
    .settings-nav {
        @apply h-fit w-[280px] rounded-lg border border-slate-100 bg-white p-5 shadow-card;
    }
    .settings-nav-item {
        @apply mb-2 flex items-center gap-3 rounded-md px-4 py-3 text-sm text-slate-600 transition hover:bg-slate-50;
    }
    .settings-nav-item.active {
        @apply bg-brand-50 text-brand-700 font-semibold;
    }
    .settings-nav-icon {
        @apply h-5 w-5;
    }
    .settings-section {
        @apply mb-6 rounded-lg border border-slate-100 bg-white p-8 shadow-card;
    }
    .form-container {
        @apply rounded-lg border border-slate-100 bg-white p-6 shadow-card;
    }

    .topbar {
        @apply border-b border-slate-200 bg-white px-8 py-4;
    }
    .topbar-left {
        @apply flex items-center gap-4;
    }
    .topbar-right {
        @apply flex items-center gap-3;
    }
    .ai-container {
        @apply mx-auto max-w-[1200px] space-y-6 p-8;
    }
    .operations {
        @apply mt-6 flex flex-wrap gap-3;
    }

    .toggle-container {
        @apply flex items-start justify-between gap-6 border-b border-slate-100 py-5;
    }
    .toggle-container:last-child {
        @apply border-b-0;
    }
    .toggle-info {
        @apply flex-1;
    }
    .toggle-label {
        @apply mb-1 text-sm font-semibold text-slate-800;
    }
    .toggle-description {
        @apply text-xs text-slate-500;
    }
    .toggle-switch {
        @apply relative h-7 w-12 shrink-0;
    }
    .toggle-slider {
        @apply absolute inset-0 cursor-pointer rounded-full bg-slate-300 transition;
    }
    .toggle-slider:before {
        content: "";
        position: absolute;
        left: 3px;
        top: 3px;
        height: 22px;
        width: 22px;
        border-radius: 999px;
        background: white;
        transition: 0.3s;
    }
    .toggle-switch input:checked + .toggle-slider {
        background-color: #00897b;
    }
    .toggle-switch input:checked + .toggle-slider:before {
        transform: translateX(20px);
    }

    .slider-container {
        @apply mt-6 rounded-lg border border-slate-100 bg-slate-50/60 p-4;
    }
    .slider-header {
        @apply mb-3 flex items-center justify-between;
    }
    .slider-label {
        @apply text-sm font-semibold text-slate-700;
    }
    .slider-value {
        @apply text-sm font-semibold text-brand;
    }
    .slider {
        @apply h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200;
    }
    .slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        height: 16px;
        width: 16px;
        border-radius: 999px;
        background: #00897b;
        box-shadow: 0 0 0 4px rgba(0, 137, 123, 0.12);
    }
    .slider::-moz-range-thumb {
        height: 16px;
        width: 16px;
        border-radius: 999px;
        background: #00897b;
        border: none;
        box-shadow: 0 0 0 4px rgba(0, 137, 123, 0.12);
    }
    .slider-labels {
        @apply mt-2 flex justify-between text-xs text-slate-500;
    }

    .info-grid {
        @apply grid gap-4 md:grid-cols-2;
    }
    .info-item {
        @apply rounded-md border border-slate-100 bg-slate-50/60 p-4;
    }
    .info-label {
        @apply text-xs font-semibold text-slate-500;
    }
    .info-value {
        @apply mt-1 text-sm font-semibold text-slate-900;
    }
    .info-content {
        @apply space-y-1;
    }
    .info-icon {
        @apply h-5 w-5 text-brand;
    }
    .info-title {
        @apply text-sm font-semibold text-slate-800;
    }
    .info-text {
        @apply text-xs text-slate-500;
    }

    .detail-row {
        @apply flex flex-wrap items-start gap-4 border-b border-slate-100 py-4;
    }
    .detail-row:last-child {
        @apply border-b-0;
    }
    .detail-label {
        @apply w-[120px] text-xs font-semibold text-slate-500;
    }
    .id-value {
        @apply flex flex-wrap gap-4;
    }
    .id-item {
        @apply rounded-md border border-slate-100 bg-slate-50/60 px-4 py-2;
    }
    .id-item-label {
        @apply text-xs text-slate-500;
    }
    .id-item-value {
        @apply text-sm font-semibold text-slate-900;
    }
    .id-muted {
        @apply text-xs text-slate-400;
    }
    .business-id,
    .idea-id {
        @apply text-xs font-semibold text-slate-500;
    }
    .business-name,
    .idea-name {
        @apply text-sm font-semibold text-slate-900;
    }
    .biz-id {
        @apply inline-flex items-center rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700;
    }
    .task-name {
        @apply text-sm font-semibold text-slate-900;
    }
    .task-summary {
        @apply text-xs text-slate-500;
    }

    .document-link {
        @apply inline-flex items-center gap-2 text-sm font-semibold text-brand hover:text-brand-700;
    }
    .document-icon {
        @apply h-4 w-4;
    }

    .alert {
        @apply rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900;
    }
    .alert-content {
        @apply flex items-start gap-3;
    }
    .alert-icon {
        @apply mt-0.5 h-5 w-5 text-amber-500;
    }
    .alert-title {
        @apply text-sm font-semibold;
    }
    .alert-text {
        @apply text-xs text-amber-700;
    }

    .empty-state {
        @apply flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-slate-200 bg-white p-8 text-center;
    }
    .empty-state-icon {
        @apply h-10 w-10 text-slate-400;
    }
    .empty-state-message {
        @apply text-sm text-slate-500;
    }

    .badge-button {
        @apply inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-brand hover:text-brand;
    }
    .badge-button.fi {
        @apply border-sky-200 bg-sky-50 text-sky-700;
    }
    .badge-button.sd {
        @apply border-indigo-200 bg-indigo-50 text-indigo-700;
    }
    .badge-button.mm {
        @apply border-amber-200 bg-amber-50 text-amber-700;
    }
    .badge-button.hr {
        @apply border-rose-200 bg-rose-50 text-rose-700;
    }
    .domain-badge {
        @apply flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-lg font-semibold text-brand-700;
    }
    .domain-info {
        @apply flex-1;
    }
    .domain-name {
        @apply text-sm font-semibold text-slate-900;
    }
    .domain-description {
        @apply text-xs text-slate-500;
    }
    .domain-actions {
        @apply flex items-center gap-2;
    }
    .domain-checkboxes {
        @apply mt-4 flex flex-wrap gap-2;
    }

    .requirements-list,
    .requirement-list {
        @apply space-y-3;
    }
    .requirement-item {
        @apply flex flex-wrap items-start justify-between gap-3 rounded-md border border-slate-100 bg-white p-4;
    }
    .requirement-left {
        @apply flex-1;
    }
    .requirement-id {
        @apply text-xs text-slate-400;
    }
    .requirement-name {
        @apply text-sm font-semibold text-slate-900;
    }
    .requirement-text {
        @apply text-xs text-slate-500;
    }

    .version-item {
        @apply flex flex-wrap items-center justify-between gap-4 rounded-md border border-slate-100 bg-white p-4;
    }
    .version-left {
        @apply space-y-1;
    }
    .version-name {
        @apply text-sm font-semibold text-slate-900;
    }
    .version-date {
        @apply text-xs text-slate-400;
    }
    .version-status {
        @apply text-xs text-slate-500;
    }

    .tag,
    .synonym-badge {
        @apply mr-1;
    }

    @media (max-width: 1200px) {
        .summary-section {
            flex-direction: column;
        }
        .main-content {
            grid-template-columns: 1fr;
        }
        .content-area {
            flex-direction: column;
        }
    }

    @media (max-width: 768px) {
        .sidebar {
            transform: translateX(-100%);
        }
        .main-wrapper,
        .main-content {
            margin-left: 0;
        }
        .summary-group-cards {
            grid-template-columns: 1fr;
        }
        .summary-group-card + .summary-group-card {
            border-left: none;
            border-top: 1px solid #e2e8f0;
        }
        .summary-actions {
            width: 100%;
        }
        .summary-action {
            width: 100%;
        }
        .change-request-right {
            min-width: 0;
            align-items: flex-start;
        }
        .change-request-meta {
            justify-content: flex-start;
        }
        .review-actions {
            width: 100%;
        }
    }
}
`;
    head.appendChild(style);
})();
