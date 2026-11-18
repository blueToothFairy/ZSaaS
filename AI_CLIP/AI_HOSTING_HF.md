# 🚀 Hướng Dẫn Deploy AI Model (FastAPI + ONNX) Lên Hugging Face Spaces Miễn Phí

Hugging Face Spaces cung cấp gói miễn phí cực mạnh (16GB RAM, 2 vCPU), rất phù hợp để host các model AI nặng như CLIP (ONNX) mà các dịch vụ như Vercel hay Render không thể gánh nổi.

## 📋 Bước 1: Chuẩn Bị Các File Cấu Hình (Trong thư mục `AI_CLIP`)

Đảm bảo trong thư mục `AI_CLIP` của bạn có đầy đủ 3 file cấu hình sau (nằm cùng cấp với file `main.py` hoặc `app.py`):

### 1. `Dockerfile` (Không có đuôi mở rộng)

Hugging Face bắt buộc ứng dụng Docker phải chạy ở cổng **7860**.

```dockerfile
FROM python:3.10-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
# Lưu ý: Thay 'main:app' bằng tên file python của bạn nếu nó khác 'main.py'
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]

```

### 2. `requirements.txt`

Khai báo các thư viện cần thiết. (`python-multipart` là bắt buộc để FastAPI nhận được file ảnh gửi lên).

```text
fastapi
uvicorn
python-multipart
Pillow
numpy
onnxruntime
transformers
```

### 3. `README.md`

Hugging Face dùng file này để nhận diện môi trường (Docker). Bắt buộc phải có đoạn cấu hình kẹp giữa 2 dòng `---`.

```markdown
---
title: VibeTune AI
emoji: 🎵
colorFrom: purple
colorTo: pink
sdk: docker
pinned: false
---

# VibeTune AI Backend
API xử lý model CLIP cho ứng dụng VibeTune.

```

---

## 🔑 Bước 2: Lấy Access Token Của Hugging Face

Vì Hugging Face không cho phép dùng mật khẩu tài khoản để push code, bạn cần tạo Token:

1. Đăng nhập vào [Hugging Face](https://huggingface.co/).
2. Vào **Settings -> Access Tokens** (hoặc truy cập `https://huggingface.co/settings/tokens`).
3. Bấm **Create new token**.
4. Đặt tên (VD: `Deploy`), phần **Role BẮT BUỘC chọn Write**.
5. Bấm Create và **Copy Token** này lại (Nó sẽ dùng làm mật khẩu ở Bước 4).

---

## 🐘 Bước 3: Khởi Tạo Git & Git LFS (Quản lý file nặng)

Các file Model AI (`.onnx`) thường nặng hàng trăm MB, vượt quá giới hạn Git thông thường. Bạn phải dùng Git LFS.

Mở Terminal (trỏ vào đúng thư mục `AI_CLIP`), chạy lần lượt các lệnh sau:

```bash
# Xóa lịch sử git cũ (nếu có bị lỗi từ trước)
rm -rf .git  # Hoặc xóa thư mục .git bằng tay (bật hiện file ẩn)

# Khởi tạo Git mới
git init

# Cài đặt và theo dõi các file Model bằng Git LFS
git lfs install
git lfs track "*.onnx"
git lfs track "*.npy"

# Lưu file cấu hình LFS vừa tạo
git add .gitattributes

```

---

## ☁️ Bước 4: Đẩy Code Lên Hugging Face

Sau khi cấu hình LFS xong, chúng ta đóng gói toàn bộ và đẩy lên Space.

```bash
# Gom tất cả code và model
git add .
git commit -m "Deploy AI Model with LFS"

# Thay thế link dưới đây bằng link Space của bạn
# Cú pháp: https://huggingface.co/spaces/<username>/<tên-space>

```

**Lưu ý khi Terminal hỏi thông tin đăng nhập:**

* **Username:** Điền username của bạn
* **Password:** Dán cái **Access Token** lấy ở Bước 2 vào (KHÔNG dùng mật khẩu đăng nhập web).

Chờ thanh tiến trình Upload LFS chạy đến 100%.

---

## 🎯 Bước 5: Kiểm Tra & Tích Hợp Vào Backend Node.js

1. Lên trang web Hugging Face, vào Space của bạn. Chờ trạng thái chuyển từ **Building** sang **Running** (Màu xanh lá).
2. Nếu giao diện hiện `{"detail": "Not Found"}`, **đừng lo lắng!** Điều này có nghĩa là API đã chạy thành công 100%. Lý do nó báo "Not Found" là vì con AI chỉ có endpoint để nhận ảnh (ví dụ `/analyze`), không có trang chủ (`/`).
3. Copy link Space của bạn.

**Tại Backend (Node.js/Express) của bạn:**
Thêm link vừa copy vào file `.env`:

```env
AI_API_URL=

```

Trong file Controller gọi AI, sử dụng biến môi trường này:

```javascript
// Ví dụ với Axios
const response = await axios.post(`${process.env.AI_API_URL}/analyze`, formData, {
  headers: {
    ...formData.getHeaders()
  }
});

```

🎉 **XONG! Bạn đã có một API xử lý AI hoàn toàn miễn phí, độc lập, không sợ bị sập vì hết RAM.**
