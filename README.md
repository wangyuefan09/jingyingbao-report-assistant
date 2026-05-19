# 经营宝抓取调试

当前目录已经接好了这条最小链路：

1. 启动本地服务
2. 点击页面按钮
3. Playwright 打开经营宝
4. 手动扫码登录
5. 自动捕获 `/mda/v5/overview` 响应
6. 提取 cookie
7. 落盘抓取结果

## 启动

```bash
npm start
```

启动后打开：

```text
http://127.0.0.1:3000
```

## 使用

1. 点击 `打开经营宝并抓取`
2. 在弹出的 Chrome 浏览器中手动扫码登录
3. 等待页面自动返回结果

## 输出文件

抓取完成后，结果会写到 `data/` 目录：

- `data/latest-capture.json`
  - 最新一次抓取到的接口结果
- `data/latest-cookies.json`
  - 当前会话下提取出来的 cookie 列表
- `data/storage-state.json`
  - Playwright 保存的登录态
- `data/browser-profile/`
  - 持久化浏览器 profile

## 已知说明

- 当前版本是最小打通版，只抓 `overview` 这一条链路。
- 如果账号已经登录过，下次再点按钮时可能会直接复用登录态，不一定每次都要求扫码。
- 在我当前这个受限执行环境里，没法替你真的弹出 GUI 浏览器扫码，所以我已经把服务、页面、Playwright 流程和落盘链路接好；你在本机直接运行 `npm start` 即可做真实登录验证。
