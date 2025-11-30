# ProjectCaoWeb

Hệ thống thu thập, quản lý và tái sử dụng nội dung bài viết.

---

## 1. Giới thiệu

### 1.1. Mục tiêu

- Thu thập bài viết từ các nguồn báo điện tử, blog, website tin tức.
- Chuẩn hoá, phân loại và lưu trữ nội dung theo danh mục, nguồn, chiến dịch.
- Làm kho nội dung nội bộ để:
  - Đăng lại, viết lại và tái sử dụng cho mục đích SEO.
  - Phục vụ các chiến dịch marketing cá nhân, xây dựng hình ảnh cá nhân.

### 1.2. Phạm vi sử dụng

- Sử dụng nội bộ cho mục đích học tập, nghiên cứu và tối ưu quy trình đăng bài.
- Hướng tới khả năng triển khai trên môi trường cloud với khả năng mở rộng tốt.

---

## 2. Kiến trúc & cấu trúc thư mục

### 2.1. Cấu trúc thư mục tổng thể

```text
ProjectCaoWeb/
├── .idea/                      # Cấu hình IntelliJ IDEA
├── config/                     # Cấu hình môi trường, script triển khai
└── demo-crawler-vietnamnet/    # Module demo crawler cho Vietnamnet (TypeScript + Java)
```

- **`.idea/`**  
  Cấu hình project cho IntelliJ IDEA, không ảnh hưởng đến logic nghiệp vụ của hệ thống.

- **`config/`**  
  Chứa các file cấu hình dùng cho:
  - Thông tin kết nối cơ sở dữ liệu.
  - Thông tin Redis, RabbitMQ.
  - Tham số môi trường (dev, test, prod).
  - Script hoặc file phục vụ việc dựng môi trường (ví dụ các file phục vụ Docker Compose, script khởi tạo DB).

- **`demo-crawler-vietnamnet/`**  
  Module demo cho pipeline crawler Vietnamnet, là nơi tập trung phần lớn mã nguồn:
  - Code **Java** cho backend và nghiệp vụ logic crawler/script.
  - Code **TypeScript** cho phần giao diện quản trị và người dùng.

### 2.2. Các thành phần chính

- **Crawler / Backend service (Java)**  
  - Định nghĩa luồng crawl, parse HTML, mapping dữ liệu.
  - Lưu bài viết, nguồn, danh mục, log vào cơ sở dữ liệu.
  - Cung cấp API phục vụ giao diện quản trị và các thành phần khác.

- **Script / UI (TypeScript)**  
  - Xử lý logic crawler, HTTP client, cấu hình nguồn.
  - Hiển thị dữ liệu, giao tiếp với backend thông qua API.

- **Hạ tầng kỹ thuật**  
  - Cơ sở dữ liệu quan hệ (MySQL).
  - Redis (cache, chống trùng, lưu state nhẹ).
  - RabbitMQ (hàng đợi job crawl, tách API và worker).
  
---

## 3. Mô hình dữ liệu & quan hệ thực thể

### 3.1. Thực thể chính

**Article (Bài viết)**  
- Thuộc tính tiêu biểu:
  - `title`, `description`, `content`, `image_url`, `url`
  - `status`, `is_crawled`, `published_at`, `created_at`, `updated_at`
- Vai trò:
  - Lưu thông tin bài viết thu thập từ các nguồn.
  - Là nguồn dữ liệu để đăng lại, rewrite phục vụ SEO và marketing cá nhân.

**Category (Danh mục)**  
- Ví dụ: Kinh tế, Công nghệ, Đời sống, SEO Tips, v.v.
- Thuộc tính:
  - `name`, `deleted`
- Quan hệ:
  - Một danh mục có nhiều bài viết.

**ArticleSource (Nguồn bài viết)**  
- Ví dụ: Vietnamnet, VNExpress, blog cá nhân.
- Thuộc tính:
  - `title`, `description`, `url`, `linkSelector`, `titleSelector`, 
  - `descriptionSelector`, `contentSelector`, `imageSelector`, `timeSelector`
  - `removeSelector`, `status`
  - Thông tin đặc thù cho từng nguồn (pattern URL, selector HTML,…).
- Quan hệ:
  - Một nguồn cung cấp nhiều bài viết.

**CrawlerBot / BotConfig**  
- Cấu hình cho từng bot crawl:
  - Nguồn (source).
  - Danh mục mặc định khi lưu bài.
  - Chu kỳ chạy (cron, interval).
- Quan hệ:
  - Mỗi bot sinh ra nhiều job theo thời gian.

**CrawlJob / Task**  
- Đại diện cho một lần chạy crawl:
  - `source_id`, `category_id`, `status`
  - `started_at`, `finished_at`
  - Thống kê số bài mới, bài trùng, lỗi.
- Quan hệ:
  - Mỗi job gắn với một nguồn và một bot cấu hình cụ thể.

**CrawlLog / SystemLog**  
- Ghi lại chi tiết quá trình crawl:
  - URL đang xử lý.
  - Lỗi phát sinh (nếu có).
  - Thời gian, số bản ghi được xử lý.
- Quan hệ:
  - Mỗi job có nhiều log.

### 3.2. Quan hệ giữa các thực thể

- **Category** 1 – N **Article**
- **ArticleSource** 1 – N **Article**
- **ArticleSource** 1 – N **CrawlJob**
- **CrawlerBot / BotConfig** 1 – N **CrawlJob**
- **CrawlJob** 1 – N **CrawlLog**

---

## 4. Luồng hoạt động chính

### 4.1. Luồng cấu hình & chuẩn bị

1. Khởi tạo danh mục (**Category**), nguồn (**ArticleSource**), cấu hình bot (**BotConfig**).
2. Lưu cấu hình vào cơ sở dữ liệu.
3. Chuẩn bị hạ tầng:
   - Khởi tạo database.
   - Khởi tạo Redis và RabbitMQ phục vụ queue và cache.
   - Cập nhật file cấu hình trong thư mục `config/`, tính năng sẽ phát triển trong tương lai cho phép bot đi cào với nhiều cấu hình ip và user agents.

### 4.2. Luồng crawl dữ liệu

1. Bot được kích hoạt:
   - Bởi scheduler (theo lịch đã cấu hình) hoặc
   - Bởi thao tác thủ công từ phía admin.
2. Hệ thống tạo một **CrawlJob** mới và sinh ra danh sách URL cần xử lý.
3. Crawler:
   - Gửi HTTP request đến từng URL.
   - Parse HTML, trích xuất các nội dung bài viết từ cấu hình nguồn.
   - Chuẩn hoá dữ liệu, loại bỏ phần HTML không cần thiết.
4. Lưu dữ liệu:
   - Kiểm tra trùng lặp dựa trên URL, slug hoặc các tiêu chí được thiết kế.
   - Thêm mới bài viết (**Article**) hoặc cập nhật bản ghi đã tồn tại.
5. Ghi log:
   - Cập nhật **CrawlLog** với số lượng bài mới, bài trùng, lỗi.

### 4.3. Luồng quản lý & tái sử dụng nội dung

1. Admin truy cập giao diện hoặc sử dụng API để:
   - Xem danh sách bài viết theo nhiều tiêu chí lọc (nguồn, danh mục, status, từ khoá, thời gian).
   - Xem danh sách nguồn, danh mục, bot, job, log.
2. Lựa chọn bài viết phù hợp:
   - Chuẩn bị cho việc đăng lại, rewrite hoặc đưa vào chiến dịch SEO cụ thể.
3. Kết nối với các kênh publish khác (blog, landing page, mạng xã hội) thông qua API hoặc thao tác thủ công dựa trên dữ liệu trong hệ thống.

---

## 5. Chức năng hiện có

- **Crawler demo Vietnamnet**
  - Thu thập danh sách bài viết từ một hoặc nhiều chuyên mục.
  - Lưu các thông tin cơ bản của bài viết vào cơ sở dữ liệu.

- **Lưu trữ và quản lý bài viết**
  - Lưu bài viết cùng với thông tin nguồn và danh mục.
  - Hạn chế trùng lặp bằng kiểm tra trước khi ghi mới.

- **Cấu hình nguồn và danh mục**
  - Định nghĩa danh mục nội dung.
  - Định nghĩa nguồn crawl.

- **Ghi log quá trình crawl**
  - Ghi nhận kết quả từng job crawl để phục vụ kiểm tra và debug.

---

## 6. Hướng phát triển

### 6.1. Giao diện quản trị

- Dashboard tổng quan:
  - Tổng số bài viết, bài mới theo ngày/nguồn/danh mục.
  - Trạng thái các bot crawl.
- Màn hình chi tiết:
  - Quản lý danh mục, nguồn, cấu hình bot.
  - Quản lý bài viết với tìm kiếm nâng cao và phân trang.
  - Quản lý job và log.

### 6.2. Hệ thống crawler

- Sử dụng RabbitMQ để:
  - Đưa URL vào hàng đợi.
  - Tách API và worker crawl, tăng khả năng mở rộng.
- Sử dụng Redis để:
  - Cache dữ liệu truy cập nhiều.
  - Lưu trạng thái chống trùng (dedupe key).
- Điều chỉnh scheduler:
  - Cấu hình lịch chạy linh hoạt cho từng bot.

### 6.3. Lớp chức năng dành cho SEO & marketing

- Tính điểm SEO (SEO score) cho từng bài viết.
- Gợi ý từ khoá, tag, internal link.
- Tổ chức bài viết theo chiến dịch:
  - Mỗi chiến dịch có danh sách bài viết và các chỉ số theo dõi riêng.

---

## 7. Yêu cầu hệ thống & công nghệ

### 7.1. Ngôn ngữ & runtime

- **Java**: JDK 17+ (hoặc phiên bản được sử dụng trong backend).
- **Node.js**: 18+ hoặc 20+ cho phần TypeScript/Frontend.

### 7.2. Công cụ build

- Maven hoặc Gradle cho backend Java.
- npm / pnpm / yarn cho phần TypeScript.

### 7.3. Hạ tầng dịch vụ

- Cơ sở dữ liệu quan hệ: MySQL hoặc PostgreSQL.
- Redis cho cache và lưu trữ key nhanh.
- RabbitMQ cho hàng đợi và xử lý bất đồng bộ.

### 7.4. Công cụ bổ trợ

- Git để quản lý mã nguồn và clone repository.
- IDE:
  - IntelliJ IDEA cho Java.
  - VS Code (hoặc IDE tương đương) cho TypeScript.

---

## 8. Hướng dẫn khởi chạy cục bộ

### 8.1. Clone dự án

```bash
git clone https://github.com/WolfieBaddie/ProjectCaoWeb.git
cd ProjectCaoWeb
```

### 8.2. Cấu hình môi trường

1. Vào thư mục `config/`.
2. Tạo hoặc chỉnh sửa các file cấu hình:
   - Thông tin kết nối database (host, port, database, user, password) lưu tại application.properties.
   - Thông tin Redis, RabbitMQ lưu tại application.properties.
   - Thông tin môi trường (port service, profile dev/prod).

### 8.3. Khởi chạy hạ tầng

- Sử dụng Docker Compose để chạy các container cho:
  - Database (MySQL/PostgreSQL).
  - Redis.
  - RabbitMQ.

```bash
docker compose up -d 
```

- Trường hợp không dùng Docker, cài đặt thủ công các dịch vụ trên và cấu hình cho khớp với file cấu hình của ứng dụng.

### 8.4. Build & chạy backend

Trong thư mục `demo-crawler-vietnamnet`:

```bash
cd demo-crawler-vietnamnet

# Maven
mvn clean package
java -jar target/<ten-file-jar>.jar

# Hoặc Gradle
./gradlew bootRun
```

### 8.5. Chạy phần TypeScript / frontend (nếu có)

```bash
cd path/to/ts-or-frontend-module
npm install
npm run dev       # hoặc npm run build && npm run start
```

---

## 9. Triển khai lên cloud (Trong tương lai)

- Đóng gói backend và frontend bằng Docker.
- Gom các dịch vụ:
  - Backend.
  - Frontend.
  - Database.
  - Redis.
  - RabbitMQ.
- Sử dụng Docker Compose hoặc các dịch vụ managed trên cloud để dựng stack.
- Thiết lập:
  - Reverse proxy bằng Nginx hoặc Caddy.
  - HTTPS với chứng chỉ SSL (Let’s Encrypt).
  - Domain riêng cho API và giao diện (ví dụ: `api.mydomain.com`, `admin.mydomain.com`).

---

## 10. Ghi chú

- Dự án tập trung vào việc xây dựng một hệ thống thu thập và quản lý thông tin đăng bài phục vụ SEO và marketing cá nhân.
- Đây là nền tảng để mở rộng thành các hệ thống lớn hơn như:
  - Hệ thống đăng bài đa kênh.
  - Hệ thống phân tích hiệu quả SEO cho từng chiến dịch.
