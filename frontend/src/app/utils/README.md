# Helpers client (`src/app/utils/`)

Logic trình duyệt **không** gọi API trực tiếp (API nằm trong `../api/`).

| Thư mục | Nội dung |
|:--------|:---------|
| **`auth/`** | JWT, login/logout, `authGate`, route loaders, `appPath` |
| **`booking/`** | Mapper lịch hẹn, slot, session labels |
| **`cv/`** | Mapper CV, upload helper |
| **`mentor/`** | Payload apply mentor, profile helpers |
| **`admin/`** | UI helper admin (preview, transfer confirm) |
| **`course/`** | Stats, enrollment access |
| **`plans/`** | Đồng bộ plan localStorage ↔ API |
| **`profile/`** | Work / education history editors |
| **`interview/`** | `aiDialogue` demo rules |
| **`shared/`** | `history`, `mediaUrl`, `apiToast`, `documentTitle`, … |

Gọi HTTP: import từ `../api/*` + `authFetch` từ `./auth/auth.js`.
