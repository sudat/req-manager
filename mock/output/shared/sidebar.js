(function () {
    var root = document.getElementById('sidebar');
    if (!root) {
        return;
    }

    var path = window.location.pathname || '';
    var active = 'dashboard';

    if (path.indexOf('/settings/') !== -1) {
        active = 'settings';
    } else if (path.indexOf('/query/') !== -1) {
        active = 'query';
    } else if (path.indexOf('/business_list/') !== -1) {
        active = 'business_list';
    } else if (path.indexOf('/idea_list/') !== -1) {
        active = 'idea_list';
    } else if (path.indexOf('/baseline/') !== -1) {
        active = 'baseline';
    } else if (path.indexOf('/ticket_list/') !== -1 || path.indexOf('ticket_') !== -1) {
        active = 'ticket_list';
    } else if (path.indexOf('/dashboard/') !== -1 || path.indexOf('dashboard.html') !== -1) {
        active = 'dashboard';
    }

    var items = [
        {
            key: 'dashboard',
            label: 'ダッシュボード',
            href: '../dashboard/dashboard.html',
            icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>'
        },
        {
            key: 'query',
            label: '照会',
            href: '../query/query.html',
            icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.35-4.35"></path></svg>'
        },
        {
            key: 'business_list',
            label: '業務一覧',
            href: '../business_list/business_list.html',
            icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>'
        },
        {
            key: 'idea_list',
            label: '概念辞書',
            href: '../idea_list/idea_list.html',
            icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>'
        },
        {
            key: 'ticket_list',
            label: '変更要求一覧',
            href: '../ticket_list/ticket_list.html',
            icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>'
        },
        {
            key: 'baseline',
            label: 'ベースライン履歴',
            href: '../baseline/baseline_list.html',
            icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>'
        },
        {
            key: 'export',
            label: 'エクスポート',
            href: '#',
            icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>'
        },
        {
            key: 'settings',
            label: '設定',
            href: '../settings/settings.html',
            icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M12 1v6m0 6v6m5.2-13.2 4.2-4.2m-4.2 14.8 4.2 4.2M1 12h6m6 0h6m-13.2 5.2-4.2 4.2m4.2-14.8L1.8 1.8"></path></svg>'
        }
    ];

    var menuHtml = items.map(function (item) {
        var isActive = item.key === active ? ' active' : '';
        return (
            '<li class="sidebar-menu-item">' +
                '<a href="' + item.href + '" class="sidebar-menu-link' + isActive + '">' +
                    '<span class="sidebar-menu-icon">' + item.icon + '</span>' +
                    '<span>' + item.label + '</span>' +
                '</a>' +
            '</li>'
        );
    }).join('');

    root.innerHTML =
        '<div class="sidebar-header">' +
            '<h2>要件管理ツール</h2>' +
        '</div>' +
        '<nav>' +
            '<ul class="sidebar-menu">' +
                menuHtml +
            '</ul>' +
        '</nav>';
})();
