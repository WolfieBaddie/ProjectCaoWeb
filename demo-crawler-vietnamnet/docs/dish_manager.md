### **Xây dựng API sử dụng Spring Boot theo đặc tả sau để Quản Lý Món Ăn Nhà Hàng**

#### **1. Tổng Quan**

API này cung cấp các endpoint để quản lý Món ăn (Dish) và Danh mục món ăn (Category) cho một nhà hàng. API tuân thủ theo các nguyên tắc RESTful, sử dụng JSON làm định dạng dữ liệu.

#### **2. Mô Hình Dữ Liệu**

##### **Category (Danh mục)**

```json
{
  "id": 1,
  "name": "Món nướng"
}
```

##### **Dish (Món ăn)**

```json
{
  "id": "MN001",           // Mã món ăn
  "name": "Sườn nướng BBQ", // Tên món ăn
  "description": "Sườn heo được tẩm ướp...", // Mô tả
  "imageUrl": "https://example.com/images/suon-nuong.jpg", // URL ảnh đại diện
  "price": 150000.0,       // Giá
  "startDate": "2023-10-27T10:00:00Z", // Ngày bắt đầu bán
  "lastModifiedDate": "2023-10-27T10:00:00Z", // Ngày sửa cuối
  "status": "ON_SALE",     // Enum: ON_SALE, STOPPED, DELETED
  "category": {            // Đối tượng Category lồng vào
    "id": 1,
    "name": "Món nướng"
  }
}
```

##### **Trạng thái (Status Enum)**
*   `ON_SALE`: Đang bán
*   `STOPPED`: Dừng bán
*   `DELETED`: Đã xoá (Soft delete)

---

#### **3. Danh sách các API~~~~**

##### **Module: Danh Mục (Category)**

**3.1. Lấy danh sách tất cả danh mục**
Api này dùng để lấy danh sách các danh mục cho chức năng "dropdown box" trên client.

*   **Method:** `GET`
*   **Endpoint:** `/api/v1/categories`
*   **Mô tả:** Trả về một danh sách tất cả các danh mục món ăn hiện có.
*   **Request:** Không có
*   **Response (200 OK):**
    ```json
    [
      { "id": 1, "name": "Món nướng" },
      { "id": 2, "name": "Món luộc" },
      { "id": 3, "name": "Món chay" },
      { "id": 4, "name": "Đồ uống" }
    ]
    ```

---

##### **Module: Món Ăn (Dish)**

**3.2. Lấy danh sách món ăn (có phân trang, lọc và sắp xếp)**

*   **Method:** `GET`
*   **Endpoint:** `/api/v1/dishes`
*   **Mô tả:** Trả về danh sách các món ăn đã được phân trang, có thể lọc và sắp xếp theo nhiều tiêu chí.
*   **Query Parameters:**
    *   **Phân trang:**
        *   `page` (int, optional, default: `1`): Số trang hiện tại.
        *   `limit` (int, optional, default: `5`): Số lượng món ăn trên mỗi trang.
    *   **Sắp xếp:**
        *   `sortBy` (string, optional, default: `startDate`): Tên trường muốn sắp xếp (`name`, `price`, `startDate`).
        *   `sortDir` (string, optional, default: `desc`): Hướng sắp xếp (`asc` hoặc `desc`).
    *   **Lọc:**
        *   `status` (string, optional, default: `ON_SALE`): Lọc theo trạng thái (`ON_SALE`, `STOPPED`). *Lưu ý: Món `DELETED` không bao giờ được trả về ở endpoint này.*
        *   `keyword` (string, optional): Tìm kiếm theo tên hoặc mô tả món ăn.
        *   `categoryId` (int, optional): Lọc theo mã danh mục.
        *   `minPrice` (double, optional): Lọc theo giá bán tối thiểu.
        *   `maxPrice` (double, optional): Lọc theo giá bán tối đa.
*   **Response (200 OK):**
    Cấu trúc trả về bao gồm thông tin phân trang và danh sách các món ăn.
    ```json
    {
      "content": [
        // Mảng các đối tượng Dish
        {
          "id": "MN001",
          "name": "Sườn nướng BBQ",
          // ... các trường khác
        }
      ],
      "page": 1,
      "limit": 5,
      "totalPages": 10,
      "totalElements": 50
    }
    ```
*   **Response (400 Bad Request):** Nếu các tham số query không hợp lệ (ví dụ: `page < 1`).

**3.3. Lấy thông tin chi tiết một món ăn**

*   **Method:** `GET`
*   **Endpoint:** `/api/v1/dishes/{id}`
*   **Mô tả:** Lấy thông tin chi tiết của một món ăn dựa vào `id`.
*   **Path Variable:**
    *   `id` (string, required): Mã của món ăn.
*   **Response (200 OK):**
    ```json
    {
      "id": "MN001",
      "name": "Sườn nướng BBQ",
      // ... các trường khác
    }
    ```
*   **Response (404 Not Found):** Nếu không tìm thấy món ăn với `id` tương ứng.

**3.4. Thêm một món ăn mới**

*   **Method:** `POST`
*   **Endpoint:** `/api/v1/dishes`
*   **Mô tả:** Tạo một món ăn mới.
*   **Request Body (JSON):**
    ```json
    {
      "name": "Bò bít tết sốt tiêu xanh",
      "description": "Bò Mỹ nhập khẩu...",
      "imageUrl": "https://example.com/images/bo-bit-tet.jpg",
      "price": 250000.0,
      "categoryId": 1
    }
    ```
*   **Validation Rules (Server-side):**
    *   `name`: Bắt buộc, độ dài > 7 ký tự.
    *   `price`: Bắt buộc, giá trị > 0.
    *   `categoryId`: Bắt buộc, phải tồn tại trong bảng `Category`.
    *   `startDate`: Server sẽ tự động gán là ngày giờ hiện tại khi tạo.
    *   `status`: Server sẽ tự động gán là `ON_SALE`.
*   **Response (201 Created):**
    Trả về toàn bộ thông tin của món ăn vừa được tạo, bao gồm cả `id` và các trường do server gán.
    ```json
    {
      "id": "MN002",
      "name": "Bò bít tết sốt tiêu xanh",
      // ... các trường khác, bao gồm cả startDate, status được server gán
    }
    ```
*   **Response (400 Bad Request):** Nếu dữ liệu gửi lên không hợp lệ (vi phạm validation).

**3.5. Cập nhật thông tin món ăn**

*   **Method:** `PUT`
*   **Endpoint:** `/api/v1/dishes/{id}`
*   **Mô tả:** Cập nhật thông tin cho một món ăn đã tồn tại.
*   **Logic:**
    1.  Kiểm tra sự tồn tại của món ăn với `id` cung cấp. Nếu không có, trả về `404 Not Found`.
    2.  Kiểm tra trạng thái của món ăn. Nếu là `DELETED`, không cho phép sửa, trả về `400 Bad Request` hoặc `409 Conflict`.
*   **Path Variable:**
    *   `id` (string, required): Mã của món ăn cần cập nhật.
*   **Request Body (JSON):**
    ```json
    {
      "name": "Bò bít tết sốt tiêu đen", // Tên đã được sửa
      "description": "Bò Mỹ nhập khẩu...",
      "imageUrl": "https://example.com/images/bo-bit-tet-v2.jpg",
      "price": 260000.0,
      "categoryId": 1,
      "status": "STOPPED" // Có thể thay đổi trạng thái giữa ON_SALE và STOPPED
    }
    ```
*   **Validation Rules:** Tương tự như khi thêm mới.
*   **Response (200 OK):**
    Trả về toàn bộ thông tin của món ăn sau khi đã cập nhật. `lastModifiedDate` sẽ được server tự động cập nhật.
    ```json
    {
      "id": "MN002",
      "name": "Bò bít tết sốt tiêu đen",
      // ... các trường khác, với lastModifiedDate được cập nhật
    }
    ```
*   **Response (400 Bad Request):** Dữ liệu không hợp lệ hoặc cố gắng sửa món đã bị xoá.
*   **Response (404 Not Found):** Món ăn không tồn tại.

**3.6. Xoá món ăn (Soft Delete)**

*   **Method:** `DELETE`
*   **Endpoint:** `/api/v1/dishes/{id}`
*   **Mô tả:** "Xoá" một món ăn bằng cách chuyển trạng thái của nó sang `DELETED`. Đây là phương pháp soft-delete.
*   **Logic:**
    1.  Kiểm tra sự tồn tại của món ăn với `id`. Nếu không có, trả về `404 Not Found`.
    2.  Kiểm tra trạng thái. Nếu đã là `DELETED`, trả về `409 Conflict` (vì không thể xoá một thứ đã bị xoá).
    3.  Cập nhật trạng thái của món ăn thành `DELETED`.
*   **Path Variable:**
    *   `id` (string, required): Mã của món ăn cần xoá.
*   **Response (204 No Content):**
    Trả về response không có body, báo hiệu thao tác xoá (cập nhật trạng thái) thành công.
*   **Response (404 Not Found):** Món ăn không tồn tại.
*   **Response (409 Conflict):** Món ăn đã ở trạng thái `DELETED` từ trước.
    Chắc chắn rồi! Dưới đây là thang điểm chi tiết (thang 10) được xây dựng lại dựa trên bản đặc tả API, tập trung hoàn toàn vào các yêu cầu backend.

---

### **Thang Điểm (10 điểm)**

**1. Thiết kế Database và Model (1.5 điểm)**
*   **(0.5đ)** Thiết kế và tạo bảng `categories` và `dishes` với đầy đủ các trường, kiểu dữ liệu và ràng buộc (khóa chính, khóa ngoại).
*   **(0.5đ)** Tạo các Java Class (Entity) `Category` và `Dish` mapping chính xác với các bảng trong database, sử dụng các annotation của JPA (ví dụ: `@Entity`, `@Id`, `@ManyToOne`, v.v.).
*   **(0.5đ)** Sử dụng Enum `DishStatus` (`ON_SALE`, `STOPPED`, `DELETED`) trong Entity `Dish` để quản lý trạng thái một cách tường minh và an toàn.

**2. Xây dựng API - Endpoint Lấy Danh Sách Món Ăn (2.0 điểm)**
*   **Endpoint:** `GET /api/v1/dishes`
*   **(0.5đ)** Xây dựng thành công API trả về danh sách các món ăn.
*   **(0.5đ)** Implement đúng chức năng **phân trang**. Xử lý được tham số `page` và `limit`, có giá trị mặc định là `1` và `5` khi không được truyền vào.
*   **(0.5đ)** Implement đúng chức năng **sắp xếp** theo `sortBy` và `sortDir`.
*   **(0.5đ)** Implement đúng chức năng **lọc** theo các tiêu chí đã đề ra (keyword, categoryId, status, minPrice, maxPrice). Mặc định chỉ hiển thị món có status `ON_SALE`.

**3. Xây dựng API - Endpoint Thêm Mới Món Ăn (1.5 điểm)**
*   **Endpoint:** `POST /api/v1/dishes`
*   **(0.5đ)** Xây dựng thành công API cho phép thêm một món ăn mới.
*   **(1.0đ)** Validate dữ liệu đầu vào một cách chặt chẽ trên server (sử dụng Spring Validation):
    *   Tên món ăn: không trống và dài hơn 7 ký tự (trừ 0.25đ nếu thiếu).
    *   Giá bán: phải lớn hơn 0 (trừ 0.25đ nếu thiếu).
    *   `categoryId`: phải tồn tại (trừ 0.25đ nếu thiếu).
    *   Gán giá trị mặc định cho `startDate` (ngày hiện tại) và `status` (`ON_SALE`) một cách tự động (trừ 0.25đ nếu thiếu).

**4. Xây dựng API - Endpoint Sửa Món Ăn (1.5 điểm)**
*   **Endpoint:** `PUT /api/v1/dishes/{id}`
*   **(0.5đ)** Xây dựng thành công API cho phép cập nhật thông tin món ăn.
*   **(0.5đ)** **Kiểm tra sự tồn tại:** Trước khi cập nhật, phải kiểm tra món ăn có tồn tại trong database không. Nếu không, trả về lỗi `404 Not Found` (trừ 0.25đ nếu thiếu).
*   **(0.5đ)** **Kiểm tra trạng thái:** Không cho phép sửa món ăn có trạng thái là `DELETED`. Nếu vi phạm, trả về lỗi `400 Bad Request` hoặc `409 Conflict` (trừ 0.25đ nếu thiếu).

**5. Xây dựng API - Endpoint Xóa Món Ăn (1.0 điểm)**
*   **Endpoint:** `DELETE /api/v1/dishes/{id}`
*   **(0.5đ)** Implement đúng logic **Soft-Delete**: API chỉ chuyển trạng thái (`status`) của món ăn thành `DELETED` thay vì xóa vĩnh viễn khỏi database.
*   **(0.5đ)** Thực hiện kiểm tra sự tồn tại và trạng thái trước khi xóa (tương tự như chức năng sửa). Trả về lỗi `404 Not Found` nếu không tồn tại, hoặc `409 Conflict` nếu đã bị xóa trước đó.

**6. Cấu trúc Code và Quy ước (1.5 điểm)**
*   **(0.5đ)** Cấu trúc project rõ ràng, phân tách các lớp theo chức năng (controller, service, repository, entity, dto).
*   **(0.5đ)** Tuân thủ Coding Convention của Java (đặt tên biến, tên hàm, tên lớp rõ ràng, dễ hiểu).
*   **(0.5đ)** Xử lý lỗi (Exception Handling) tốt, trả về các mã HTTP Status Code và thông điệp lỗi có ý nghĩa, thống nhất cho toàn bộ API (ví dụ: sử dụng `@ControllerAdvice`).

**7. API Endpoint phụ và Documentation (1.0 điểm)**
*   **(0.5đ)** Xây dựng endpoint `GET /api/v1/categories` để client có thể lấy danh sách danh mục và hiển thị trong dropdown.
*   **(0.5đ)** Có tài liệu mô tả API (sử dụng Swagger/OpenAPI hoặc file README.md đơn giản) giải thích cách sử dụng các endpoint.