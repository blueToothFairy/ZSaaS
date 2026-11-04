# Tóm tắt thay đổi — iss-001 (Reposition VibeTune as AI Soundtrack Finder)

**ID:** iss-001  
**Ngày:** 04/11/2026  
**Mục tiêu:** Cập nhật tài liệu sản phẩm để định vị VibeTune thành AI Soundtrack Finder cho content creators.  
**Phạm vi:** Chỉ thay đổi file Markdown (không sửa code, cấu hình, dependencies, API, database).

## 1. File đã thay đổi

| File | Mức độ thay đổi | Nội dung chính |
|------|----------------|----------------|
| `README.md` | Toàn bộ phần định vị | Overview, The Problem, The Solution, Target Users, Features, Usage & Examples |
| `design.md` | Phần 1.1 (Giới thiệu VibeTune) | Căn chỉnh định vị hệ thống nhất quán với README |

Các file tài liệu khác (`docs/project-structure.md`, `saas-platform/README.md`, `AI_CLIP/README.md`) chỉ chứa cấu trúc thư mục / hướng dẫn cài đặt kỹ thuật, không liên quan đến định vị sản phẩm nên giữ nguyên.

## 2. Cập nhật định vị chính (theo iss-001)

- **Thể loại sản phẩm:** từ "AI-Powered Music Discovery Matching Your Mood, Weather & Vibe" → "AI Soundtrack Finder for Content Creators".
- **Đối tượng mục tiêu ban đầu:** independent content creators, đặc biệt là người tạo nội dung travel và lifestyle cho các nền tảng short-form (cứ trước: music enthusiasts, mood-driven listeners, SaaS developers).
- **Vấn đề người dùng:** tìm nhạc vừa với cả nội dung lẫn cảm xúc muốn truyền tải — không chỉ dựa trên mood/time/thời tiết.
- **Dẫn trước bằng lợi ích người dùng:** CLIP, dữ liệu thời tiết, tìm kiếm nhạc (iTunes) được trình bày là công nghệ hỗ trợ, không phải mệnh giá cốt lõi.
- **Luồng cốt lõi mô tả nhất quán:** add content → set musical intent → analyze → recommend (danh sách ngắn kèm lý do) → refine → save.
- **Khuyến nghị:** mô tả là danh sách ngắn các bài phù hợp với lý do rõ ràng, không phải playlist tự động sinh.
- **Mood & weather:** giữ là bối cảnh tùy chọn, không phải mục đích chính của sản phẩm.
- **Tính năng trên lộ trình (chưa triển khai):** phân tích video, phối nhịp, cá nhân hóa nâng cao, kho nhạc bản quyền — được ghi rõ là "Planned (not yet implemented)".

## 3. Claim lỗi thời / không được hỗ trợ đã xử lý

- Đã xoá "Taste Learning" / "Smart Curation" (machine learning-based taste refinement) khỏi core features; chuyển sang mục Planned.
- Đã xoá "Weather-Based Recommendations" làm tính năng chính; chuyển thành optional context.
- Đã xoá claim "nhận playlist 20-30 bài"; thay bằng danh sách ngắn các bài phù hợp.
- Đã xoá các nhóm mục tiêu cũ không phù hợp (SaaS developers, mood-driven listeners).

**Không còn claim lỗi thời/không được hỗ trợ nào không thể giải quyết từ repository.** Các khả năng tương lai đã được ghi rõ là chưa triển khai, đáp ứng nguyên tắc "keep claims honest" trong iss-001.

## 4. Xem xét cuối cùng (Task 4)

- Tất cả tài liệu đã cập nhật truyền tải cùng một định hướng sản phẩm.
- Các liên kết và định dạng Markdown được giữ nguyên (chỉ chỉnh nội dung, không chạm link/hình ảnh).
- Chỉ file `.md` được thay đổi; không sửa mã nguồn, cấu hình, dependencies, API hay database.
