export const staticRoutes: AppRoute.RowRoute[] = [
  {
    name: 'dashboard',
    path: '/dashboard',
    title: '仪表盘',
    requiresAuth: true,
    icon: 'icon-park-outline:analysis',
    menuType: 'dir',
    componentPath: null,
    id: 1,
    pid: null,
  },
  {
    name: 'workbench',
    path: '/dashboard/workbench',
    title: '工作台',
    requiresAuth: true,
    icon: 'icon-park-outline:alarm',
    pinTab: true,
    menuType: 'page',
    componentPath: '/dashboard/workbench/index.vue',
    id: 10,
    pid: 1,
  },
  {
    name: 'monitor',
    path: '/dashboard/monitor',
    title: '监控页',
    requiresAuth: true,
    icon: 'icon-park-outline:anchor',
    menuType: 'page',
    componentPath: '/dashboard/monitor/index.vue',
    id: 11,
    pid: 1,
  },
  {
    name: 'store',
    path: '/store',
    title: '门店',
    requiresAuth: true,
    componentPath: null,
    id: 2,
    pid: null,
  },
  {
    name: 'viewStores',
    path: '/store/list',
    title: '查询门店',
    requiresAuth: true,
    componentPath: '/store/manage/index.vue',
    id: 20,
    pid: 2,
  },
  {
    name: 'manageStores',
    path: '/store/manage',
    title: '管理门店',
    requiresAuth: true,
    componentPath: '/store/manage/index.vue',
    id: 21,
    pid: 2,
  },
  {
    name: 'cars',
    path: '/cars/query',
    title: '车辆',
    requiresAuth: true,
    componentPath: '/store/manage/index.vue',
    id: 3,
    pid: null,
  },
  {
    name: 'queryCars',
    path: '/cars/query',
    title: '查询车辆',
    requiresAuth: true,
    componentPath: '/store/manage/index.vue',
    id: 30,
    pid: 3,
  },
  {
    name: 'manageCars',
    path: '/cars/manage',
    title: '管理车辆',
    requiresAuth: true,
    componentPath: '/store/manage/index.vue',
    id: 31,
    pid: 3,
  },
  {
    name: 'tickets',
    path: '/ticket',
    title: '租借单',
    requiresAuth: true,
    componentPath: '/store/manage/index.vue',
    id: 4,
    pid: null,
  },
  {
    name: 'openTickets',
    path: '/ticket/open',
    title: '发起租借单',
    requiresAuth: true,
    componentPath: '/store/manage/index.vue',
    id: 40,
    pid: 4,
  },
  {
    name: 'reviewTickets',
    path: '/ticket/list',
    title: '查看租借单',
    requiresAuth: true,
    componentPath: '/store/manage/index.vue',
    id: 41,
    pid: 4,
  },
  {
    name: 'reviewTickets',
    path: '/ticket/review',
    title: '审核租借单',
    requiresAuth: true,
    componentPath: '/store/manage/index.vue',
    id: 42,
    pid: 4,
  },
  {
    name: 'setting',
    path: '/setting',
    title: '系统设置',
    requiresAuth: true,
    icon: 'icon-park-outline:setting',
    menuType: 'dir',
    componentPath: null,
    id: 35,
    pid: null,
  },
  {
    name: 'accountSetting',
    path: '/setting/account',
    title: '用户设置',
    requiresAuth: true,
    icon: 'icon-park-outline:every-user',
    componentPath: '/setting/account/index.vue',
    id: 36,
    pid: 35,
  },
  {
    name: 'dictionarySetting',
    path: '/setting/dictionary',
    title: '字典设置',
    requiresAuth: true,
    icon: 'icon-park-outline:book-one',
    componentPath: '/setting/dictionary/index.vue',
    id: 37,
    pid: 35,
  },
  {
    name: 'menuSetting',
    path: '/setting/menu',
    title: '菜单设置',
    requiresAuth: true,
    icon: 'icon-park-outline:application-menu',
    componentPath: '/setting/menu/index.vue',
    id: 38,
    pid: 35,
  },
  {
    name: 'userCenter',
    path: '/userCenter',
    title: '个人中心',
    requiresAuth: true,
    icon: 'carbon:user-avatar-filled-alt',
    componentPath: '/demo/userCenter/index.vue',
    id: 39,
    pid: null,
  },
  {
    name: 'about',
    path: '/about',
    title: '关于',
    requiresAuth: true,
    icon: 'icon-park-outline:info',
    componentPath: '/demo/about/index.vue',
    id: 40,
    pid: null,
  },

]

// {
//   name: 'list',
//   path: '/list',
//   title: '列表页',
//   requiresAuth: true,
//   icon: 'icon-park-outline:list-two',
//   menuType: 'dir',
//   componentPath: null,
//   id: 10,
//   pid: null,
// },
// {
//   name: 'commonList',
//   path: '/list/commonList',
//   title: '常用列表',
//   requiresAuth: true,
//   icon: 'icon-park-outline:list-view',
//   componentPath: '/demo/list/commonList/index.vue',
//   id: 11,
//   pid: 10,
// },
// {
//   name: 'cardList',
//   path: '/list/cardList',
//   title: '卡片列表',
//   requiresAuth: true,
//   icon: 'icon-park-outline:view-grid-list',
//   componentPath: '/demo/list/cardList/index.vue',
//   id: 12,
//   pid: 10,
// },
// {
//   name: 'demo',
//   path: '/demo',
//   title: '功能示例',
//   requiresAuth: true,
//   icon: 'icon-park-outline:application-one',
//   menuType: 'dir',
//   componentPath: null,
//   id: 13,
//   pid: null,
// },
// {
//   name: 'fetch',
//   path: '/demo/fetch',
//   title: '请求示例',
//   requiresAuth: true,
//   icon: 'icon-park-outline:international',
//   componentPath: '/demo/fetch/index.vue',
//   id: 5,
//   pid: 13,
// },
// {
//   name: 'map',
//   path: '/demo/map',
//   title: '地图',
//   requiresAuth: true,
//   icon: 'carbon:map',
//   keepAlive: true,
//   componentPath: '/demo/map/index.vue',
//   id: 17,
//   pid: 13,
// },
// {
//   name: 'editor',
//   path: '/demo/editor',
//   title: '编辑器',
//   requiresAuth: true,
//   icon: 'icon-park-outline:editor',
//   menuType: 'dir',
//   componentPath: null,
//   id: 18,
//   pid: 13,
// },
// {
//   name: 'editorMd',
//   path: '/demo/editor/md',
//   title: 'MarkDown',
//   requiresAuth: true,
//   icon: 'ri:markdown-line',
//   componentPath: '/demo/editor/md/index.vue',
//   id: 19,
//   pid: 18,
// },
// {
//   name: 'editorRich',
//   path: '/demo/editor/rich',
//   title: '富文本',
//   requiresAuth: true,
//   icon: 'icon-park-outline:edit-one',
//   componentPath: '/demo/editor/rich/index.vue',
//   id: 20,
//   pid: 18,
// },
// {
//   name: 'clipboard',
//   path: '/demo/clipboard',
//   title: '剪贴板',
//   requiresAuth: true,
//   icon: 'icon-park-outline:clipboard',
//   componentPath: '/demo/clipboard/index.vue',
//   id: 21,
//   pid: 13,
// },
// {
//   name: 'icons',
//   path: '/demo/icons',
//   title: '图标',
//   requiresAuth: true,
//   icon: 'local:cool',
//   componentPath: '/demo/icons/index.vue',
//   id: 22,
//   pid: 13,
// },
// {
//   name: 'QRCode',
//   path: '/demo/QRCode',
//   title: '二维码',
//   requiresAuth: true,
//   icon: 'icon-park-outline:two-dimensional-code',
//   componentPath: '/demo/QRCode/index.vue',
//   id: 23,
//   pid: 13,
// },
// {
//   name: 'permission',
//   path: '/permission',
//   title: '权限',
//   requiresAuth: true,
//   icon: 'icon-park-outline:people-safe',
//   menuType: 'dir',
//   componentPath: null,
//   id: 28,
//   pid: null,
// },
// {
//   name: 'permissionDemo',
//   path: '/permission/permission',
//   title: '权限示例',
//   requiresAuth: true,
//   icon: 'icon-park-outline:right-user',
//   componentPath: '/demo/permission/permission/index.vue',
//   id: 29,
//   pid: 28,
// },
// {
//   name: 'justSuper',
//   path: '/permission/justSuper',
//   title: 'super可见',
//   requiresAuth: true,
//   roles: [
//     'super',
//   ],
//   icon: 'icon-park-outline:wrong-user',
//   componentPath: '/demo/permission/justSuper/index.vue',
//   id: 30,
//   pid: 28,
// },
// {
//   name: 'error',
//   path: '/error',
//   title: '异常页',
//   requiresAuth: true,
//   icon: 'icon-park-outline:error-computer',
//   menuType: 'dir',
//   componentPath: null,
//   id: 31,
//   pid: null,
// },
// {
//   name: 'demo403',
//   path: '/error/403',
//   title: '403',
//   requiresAuth: true,
//   icon: 'carbon:error',
//   order: 3,
//   componentPath: '/error/403/index.vue',
//   id: 32,
//   pid: 31,
// },
// {
//   name: 'demo404',
//   path: '/error/404',
//   title: '404',
//   requiresAuth: true,
//   icon: 'icon-park-outline:error',
//   order: 2,
//   componentPath: '/error/404/index.vue',
//   id: 33,
//   pid: 31,
// },
// {
//   name: 'demo500',
//   path: '/error/500',
//   title: '500',
//   requiresAuth: true,
//   icon: 'carbon:data-error',
//   order: 1,
//   componentPath: '/error/500/index.vue',
//   id: 34,
//   pid: 31,
// },
