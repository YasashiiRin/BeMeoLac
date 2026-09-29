# Tủ Truyện Nhỏ — Uyên Thư Các 🌸

Ứng dụng web tủ truyện tranh cá nhân: lưu truyện đang đọc, theo dõi tiến độ, xếp kệ, nhận thông báo chương mới và xem thống kê đọc.

Đây là **frontend**. Backend là một REST API FastAPI riêng, theo đặc tả trong [docs/api-contract.md](docs/api-contract.md).

**Công nghệ:** React 19 · TypeScript · Vite · Tailwind CSS 4 · React Router 7 · Recharts · lucide-react

---

## Yêu cầu

- Node.js **22.12** trở lên
- npm

## Chạy trên máy

```bash
npm install
cp .env.example .env.local   # rồi sửa nếu cần
npm run dev
```

Mở <http://localhost:3000>.

### Dữ liệu giả hay API thật

Mọi lời gọi API đều nằm trong `src/services/`. Có thể bật API thật **cho từng service**. Các service còn lại vẫn dùng dữ liệu giả trong `src/mocks/`.

| Biến                 | Ví dụ                   | Ý nghĩa                                                                                                                    |
| -------------------- | ----------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `VITE_REAL_SERVICES` | `auth,users`            | Các service gọi backend thật, cách nhau bằng dấu phẩy. Để trống thì tất cả dùng dữ liệu giả. Tên service: `auth`, `users`, `comics`, `shelves`, `sources`, `tags`, `stats`, `notifications`, `discover` (tìm truyện trên mạng và “Thêm vào tủ”). |
| `VITE_USE_MOCK`      | `true` / `false`        | Tùy chọn, ghi đè cho tất cả: `true` là mọi service dùng dữ liệu giả, `false` là mọi service gọi API thật. Không đặt thì dùng `VITE_REAL_SERVICES`. |
| `VITE_API_URL`       | để trống                | Địa chỉ gốc của backend, không có `/` ở cuối. Để trống thì ứng dụng gọi `/api/...` trên chính địa chỉ của nó, giống khi chạy thật. |
| `API_PROXY_TARGET`   | `http://localhost:8000` | Chỉ dùng cho máy chủ phát triển: `npm run dev` chuyển mọi request `/api` tới địa chỉ này, nên không bị lỗi CORS.         |

Dữ liệu giả nằm trong bộ nhớ và trở về ban đầu khi tải lại trang. Tài khoản mẫu cho chế độ dữ liệu giả được khai báo trong `src/mocks/user.ts` (`mockAccount`).

Khi có service gọi API thật, hãy luôn thêm `auth`: API thật cần token từ lần đăng nhập thật.

**Chạy cùng backend trên máy** (backend ở thư mục `meoLacService`, cổng 8000):

```bash
# .env.local
VITE_REAL_SERVICES=auth,users
```

Ở chế độ API thật:

- Mỗi request gửi kèm `Authorization: Bearer <access_token>`.
- Khi nhận **401**, ứng dụng gọi `POST /api/auth/refresh` **một lần** rồi gửi lại request. Nếu làm mới token vẫn thất bại, ứng dụng đăng xuất và chuyển về `/login`.
- Mọi lỗi có dạng `{ "detail": string, "code"?: string }`.

> Biến `VITE_*` được gắn vào bản build lúc build. Đổi biến thì phải build lại.

## Các lệnh

| Lệnh              | Tác dụng                                                             |
| ----------------- | -------------------------------------------------------------------- |
| `npm run dev`     | Chạy máy chủ phát triển ở cổng 3000.                                 |
| `npm run build`   | Kiểm tra kiểu (`tsc --noEmit`) rồi build bản production vào `dist/`. |
| `npm run preview` | Xem thử bản build trong `dist/`.                                     |
| `npm run lint`    | Chỉ kiểm tra kiểu TypeScript.                                        |
| `npm run clean`   | Xóa thư mục `dist/`.                                                 |

## Build

```bash
npm run build
npm run preview   # xem thử ở http://localhost:4173
```

Kết quả là một trang tĩnh trong `dist/`. Trang này chạy được trên mọi hosting tĩnh, miễn là hosting chuyển mọi đường dẫn về `index.html` (ứng dụng dùng `BrowserRouter`).

## Triển khai lên Vercel

Dự án đã có sẵn [`vercel.json`](vercel.json): framework Vite, lệnh build `npm run build`, thư mục `dist`, và rewrite mọi đường dẫn về `index.html`. Nhờ rewrite này, khi tải lại một trang như `/comics/123` sẽ không bị lỗi 404.

**Cách 1 — qua giao diện web**

1. Đẩy mã nguồn lên GitHub, GitLab hoặc Bitbucket.
2. Trên [vercel.com](https://vercel.com): **Add New… → Project**, rồi chọn repository.
   Nếu repository chứa nhiều dự án, đặt **Root Directory** là thư mục chứa `package.json` này.
3. Vào **Settings → Environment Variables**, thêm:
   - `VITE_REAL_SERVICES` = các service đã có trên backend, ví dụ `auth,users`. Khi backend làm xong mọi service, đặt `VITE_USE_MOCK` = `false`.
   - `VITE_API_URL` = địa chỉ backend, ví dụ `https://api.uyenthucac.vn`.

     Trên Vercel không có proxy của Vite. Nếu để trống biến này, request `/api/...` sẽ bị rewrite của `vercel.json` trả về `index.html`. Muốn giữ đường dẫn `/api` cùng địa chỉ, hãy thêm vào `vercel.json` một rewrite **trước** rewrite hiện có: `{ "source": "/api/:path*", "destination": "https://<backend>/api/:path*" }`.

   Nếu chỉ muốn bản demo với dữ liệu giả, không cần đặt biến nào.
4. Bấm **Deploy**. Từ đó, mỗi lần push lên nhánh chính, Vercel tự build lại. Các nhánh khác có bản Preview riêng.

**Cách 2 — bằng Vercel CLI**

```bash
npm i -g vercel
vercel                # lần đầu: liên kết dự án, tạo bản Preview
vercel env add VITE_REAL_SERVICES
vercel env add VITE_API_URL
vercel --prod         # triển khai bản Production
```

**Backend:** hãy cho phép tên miền Vercel trong cấu hình CORS của backend (header `Authorization`, `Content-Type`, và expose `Content-Disposition` để tải file sao lưu). Xem mục *Open points* trong [docs/api-contract.md](docs/api-contract.md#open-points-for-the-backend).

## Các trang (routes)

Mọi trang, trừ `/login`, đều cần đăng nhập. Người chưa đăng nhập được chuyển về `/login`, và sau khi đăng nhập sẽ quay lại đúng trang đã mở.

| Đường dẫn                | Trang                                                                                     |
| ------------------------ | ----------------------------------------------------------------------------------------- |
| `/login`                 | Đăng nhập                                                                                 |
| `/`                      | Tủ sách: danh sách truyện, lọc theo kệ, trạng thái, thể loại, nguồn                       |
| `/comics/:id`            | Chi tiết truyện: tiến độ, đánh giá, ghi chú, nguồn, kệ                                    |
| `/add`                   | Thêm truyện, từ liên kết hoặc nhập tay                                                    |
| `/shelves/:id`           | Chi tiết kệ sách, kéo thả để sắp xếp                                                      |
| `/search`                | Tìm kiếm nâng cao. Bộ lọc lưu trên URL, ví dụ `?q=&status=&genre=&source=&shelf=&rating=&pmin=&pmax=&new=1&broken=1&sort=&page=` |
| `/stats`                 | Thống kê đọc (`?period=week\|month\|year\|all`)                                            |
| `/notifications`         | Thông báo chương mới và link hỏng                                                         |
| `/account`               | Tài khoản                                                                                 |
| `/account/profile`       | Hồ sơ: ảnh đại diện, bút danh, giới thiệu                                                 |
| `/account/security`      | Mật khẩu, các thiết bị đang đăng nhập                                                     |
| `/account/appearance`    | Chủ đề, cỡ chữ, hiệu ứng lấp lánh                                                         |
| `/account/notifications` | Cài đặt thông báo, lời nhắc đọc                                                           |
| `/account/data`          | Xuất và nhập dữ liệu, kiểm tra link hỏng                                                  |
| `/account/about`         | Về ứng dụng                                                                               |
| mọi đường dẫn khác       | Trang 404 "Lối nhỏ này chưa trồng hoa", có nút về tủ sách                                 |

Các trang được tách chunk và tải trước (xem `src/routes/lazyPages.ts`).

## Chủ đề (themes)

| Mã      | Tên                               | Mô tả                                        |
| ------- | --------------------------------- | -------------------------------------------- |
| `day`   | Rừng tiên oải hương (mặc định)    | Lá non, oải hương và nắng sớm dịu dàng       |
| `night` | Khu vườn tiên đêm                 | Ánh trăng, đom đóm và sương bạc hà lấp lánh  |

- Đổi chủ đề bằng nút trên thanh đầu trang, hoặc ở `/account/appearance`. Lựa chọn được lưu trong `localStorage` và đồng bộ vào `settings.theme` của tài khoản.
- Màu sắc là các biến CSS `--c-*` trong `src/index.css`, theo từng `[data-theme]`. Tailwind trỏ tới các biến này (`bg-primary`, `text-text-muted`, …). Component **không** dùng mã màu cố định.
- Thông tin chủ đề (tên, biểu tượng, ảnh trang trí) nằm trong `src/theme/themes.ts`. Muốn thêm chủ đề mới: thêm một khối `[data-theme="…"]` trong `index.css` và một mục trong `THEMES`.

## Cấu trúc thư mục

```
src/
  services/     # Mọi lời gọi API (http.ts: fetch, token, refresh, lỗi)
  mocks/        # Dữ liệu giả; mocks/api/ mô phỏng từng endpoint
  types/        # Kiểu dữ liệu dùng chung (khớp với API)
  pages/        # Mỗi route một trang, responsive
  features/     # Thành phần riêng của từng trang (account, search, stats, ...)
  components/   # Component dùng chung (ComicCard, Button, Modal, EmptyState, ErrorState, ...)
  context/      # Auth, Theme, Toast
  theme/        # Định nghĩa chủ đề
docs/
  api-contract.md   # Đặc tả API cho backend
```

## Đặc tả API

Toàn bộ endpoint (method, đường dẫn, request, response, lỗi, trang sử dụng) được mô tả trong **[docs/api-contract.md](docs/api-contract.md)**. Tài liệu này là đặc tả để xây dựng backend FastAPI.
