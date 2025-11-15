package com.t2404e.springagaint2404e.Queue;
import com.rabbitmq.client.Channel;
import com.rabbitmq.client.Connection;
import com.rabbitmq.client.ConnectionFactory;
import com.rabbitmq.client.DeliverCallback;

import java.nio.charset.StandardCharsets;
public class Consumer {
    private final static String QUEUE_NAME = "hello-queue";

    public static void main(String[] argv) throws Exception {
        String host  = System.getProperty("host", "localhost");
        String queue = System.getProperty("queue", "hello-queue");
        ConnectionFactory factory = new ConnectionFactory();
        factory.setHost("localhost");

        // Tạo kết nối và channel. Ở đây, chúng ta không dùng try-with-resources
        // vì chúng ta muốn chương trình tiếp tục chạy để lắng nghe tin nhắn.
        Connection connection = factory.newConnection();
        Channel channel = connection.createChannel();

        // Khai báo queue một lần nữa để đảm bảo nó tồn tại.
        // Các tham số phải khớp với khai báo ở Producer.
        channel.queueDeclare(QUEUE_NAME, false, false, false, null);
        System.out.println(" [*] Waiting for messages. To exit press CTRL+C");

        // 1. Tạo một callback để xử lý tin nhắn nhận được
        //    DeliverCallback là một functional interface, vì vậy chúng ta có thể dùng lambda.
        //    - consumerTag: Một định danh cho consumer.
        //    - delivery: Đối tượng chứa toàn bộ thông tin về tin nhắn nhận được,
        //      bao gồm cả nội dung (body) và các metadata khác.
        DeliverCallback deliverCallback = (consumerTag, delivery) -> {
            // Lấy nội dung tin nhắn từ delivery object
            String message = new String(delivery.getBody(), StandardCharsets.UTF_8);
            System.out.println(" [x] Received '" + message + "'");
        };

        // 2. Bắt đầu lắng nghe trên queue
        //    - queue: Tên của queue muốn lắng nghe.
        //    - autoAck: (Automatic Acknowledgment) - tự động gửi xác nhận.
        //      - true: Ngay sau khi RabbitMQ gửi tin nhắn cho consumer, nó sẽ coi như
        //        tin nhắn đã được xử lý và xóa khỏi queue. Nếu consumer chết trước khi
        //        xử lý xong, tin nhắn sẽ bị mất.
        //      - false: (Manual Acknowledgment) Consumer phải gửi một xác nhận (ack)
        //        rõ ràng sau khi xử lý xong tin nhắn. Đây là cách an toàn hơn.
        //        Trong ví dụ này, chúng ta dùng `true` cho đơn giản.
        //    - deliverCallback: Callback sẽ được gọi khi có tin nhắn mới.
        //    - cancelCallback: Callback sẽ được gọi nếu consumer bị hủy (ví dụ: queue bị xóa).
        channel.basicConsume(QUEUE_NAME, true, deliverCallback, consumerTag -> { });
    }
}
