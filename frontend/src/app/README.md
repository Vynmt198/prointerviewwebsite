# Cấu trúc `src/app/`

| Thư mục | Mô tả |
|:--------|:------|
| **`pages/`** | Màn hình theo route (auth, booking, mentor, …) |
| **`components/`** | UI tái sử dụng theo domain + `ui/` (shadcn) |
| **`api/`** | Client gọi `/api/*` — xem [`api/README.md`](./api/README.md) |
| **`utils/`** | Auth, mapper, helper — xem [`utils/README.md`](./utils/README.md) |
| **`hooks/`** | Hook React (`useAuthSession`, `useDIDStream`, …) |
| **`constants/`** | Hằng số UI / copy |
| **`data/`** | Mock / seed tĩnh |
| **`routes.js`** | Browser Router |
| **`App.jsx`** | Root + khôi phục phiên |

**Quy ước import**

- API: `from "../api/mentorApi.js"` hoặc `from "../../api/cvApi.js"`
- Auth: `from "../utils/auth/auth.js"`
- Helper: `from "../utils/booking/bookingMappers.js"`
