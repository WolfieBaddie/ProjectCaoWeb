package com.t2404e.springagaint2404e.Queue;

import com.rabbitmq.client.Channel;
import com.rabbitmq.client.Connection;
import com.rabbitmq.client.ConnectionFactory;

import java.nio.charset.StandardCharsets;

public class Producer {
    private final static String QUEUE_NAME = "hello-queue";

    public static void main(String[] argv) throws Exception {
        String host  = System.getProperty("host", "localhost");
        String queue = System.getProperty("queue", "hello-queue");
        // 1. Tạo một ConnectionFactory
        //    ConnectionFactory là lớp giúp tạo kết nối đến RabbitMQ server.
        ConnectionFactory factory = new ConnectionFactory();

        // Cấu hình thông tin kết nối. Mặc định là localhost, port 5672, user/pass là guest/guest
        factory.setHost("localhost");
        // factory.setPort(5672);
        // factory.setUsername("guest");
        // factory.setPassword("guest");

        // 2. Tạo kết nối và channel
        //    Sử dụng try-with-resources để đảm bảo kết nối (Connection) và channel
        //    sẽ tự động được đóng lại sau khi sử dụng xong, kể cả khi có lỗi xảy ra.
        try (Connection connection = factory.newConnection();
             Channel channel = connection.createChannel()) {

            // 3. Khai báo một queue
            //    channel.queueDeclare là một thao tác idempotent, nghĩa là:
            //    - Nếu queue chưa tồn tại, nó sẽ được tạo.
            //    - Nếu queue đã tồn tại, lệnh này sẽ không làm gì cả.
            //    Điều này đảm bảo queue luôn tồn tại trước khi chúng ta gửi tin nhắn.
            //    - durable = false: queue sẽ bị mất nếu RabbitMQ server khởi động lại.
            //    - exclusive = false: queue có thể được truy cập bởi nhiều kết nối.
            //    - autoDelete = false: queue sẽ không bị xóa khi consumer cuối cùng ngắt kết nối.
            //    - arguments = null: không có tham số đặc biệt nào.
            channel.queueDeclare(QUEUE_NAME, false, false, false, null);

            // 4. Chuẩn bị tin nhắn để gửi
            String message = "Hello, RabbitMQ! This is a simple message.";

            // 5. Gửi tin nhắn
            //    - exchange: Tên của exchange. Chuỗi rỗng "" đại diện cho default exchange.
            //      Default exchange sẽ gửi tin nhắn trực tiếp đến queue có tên trùng với routingKey.
             //    - routingKey: Trong trường hợp của default exchange, routingKey chính là tên của queue.
            //    - props: Các thuộc tính khác của tin nhắn (ví dụ: headers), ở đây để null.
            //    - body: Nội dung tin nhắn, phải là một mảng byte.
            channel.basicPublish("", QUEUE_NAME, null, message.getBytes(StandardCharsets.UTF_8));

            System.out.println(" [x] Sent '" + message + "'");
        }
    }
}
