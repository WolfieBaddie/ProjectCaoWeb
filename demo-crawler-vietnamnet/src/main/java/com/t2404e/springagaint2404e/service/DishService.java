package com.t2404e.springagaint2404e.service;

import com.github.javafaker.Faker;
import com.t2404e.springagaint2404e.entity.Category;
import com.t2404e.springagaint2404e.entity.Dish;
import com.t2404e.springagaint2404e.entity.DishStatus;
import com.t2404e.springagaint2404e.repository.CategoryRepository;
import com.t2404e.springagaint2404e.repository.DishRepository;
import jakarta.persistence.criteria.Predicate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.IntStream;

@Service
public class DishService {

    @Autowired
    private DishRepository dishRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    public Page<Dish> findAll(String keyword, Long categoryId, String status, Double minPrice, Double maxPrice, String sortBy, String sortDir, int page, int limit) {
        Specification<Dish> spec = (root, query, criteriaBuilder) -> {
            // lưu danh sách lọc
            List<Predicate> predicates = new ArrayList<>();
            // xử lý logic để thêm trường cần lọc.
            if (keyword != null && !keyword.isEmpty()) {
                predicates.add(
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("name")),
                                "%" + keyword.toLowerCase() + "%")
                );
            }
            if (categoryId != null) {
                predicates.add(
                        criteriaBuilder.equal(root.get("categoryId"),
                                categoryId));
            }
            if (status != null && !status.isEmpty()) {
                predicates.add(
                        criteriaBuilder.equal(root.get("status"),
                                status));
            }
            if (minPrice != null) {
                predicates.add(
                        criteriaBuilder.greaterThanOrEqualTo(root.get("price"),
                                minPrice));
            }
            if (maxPrice != null) {
                predicates.add(
                        criteriaBuilder.lessThanOrEqualTo(root.get("price"),
                                maxPrice));
            }
            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
        // Xử lý sắp xếp
        Sort sort = Sort.by(sortBy != null ? sortBy : "id");
        sort = "asc".equalsIgnoreCase(sortDir) ? sort.ascending() : sort.descending();
        // Phân trang
        Pageable pageable = PageRequest.of(page, limit, sort);
        return dishRepository.findAll(spec, pageable);
    }

    public Dish save(Dish dish) {
        return dishRepository.save(dish);
    }

    public void generateSeedData(){
        if (dishRepository.count() == 0) {
            List<Category> categories = categoryRepository.findAll();

            if (categories.isEmpty()) {
                System.out.println("⚠️ DishSeeder: Không có Category nào trong DB. Hãy chạy CategorySeeder trước!");
            }

            Faker faker = new Faker(new Locale("vi"));

            List<Dish> dishes = IntStream.range(0, 30) // sinh 30 món ăn
                    .mapToObj(i -> {
                        Category randomCategory = categories.get(
                                ThreadLocalRandom.current().nextInt(categories.size())
                        );

                        double price = ThreadLocalRandom.current().nextDouble(50000, 300000);
                        Date now = new Date();

                        return Dish.builder()
                                .name(faker.food().dish()) // ví dụ: “Sườn nướng BBQ”
                                .description(faker.lorem().sentence(12))
                                .imageUrl("https://source.unsplash.com/featured/?food," + (i + 1))
                                .price(price)
                                .startDate(now)
                                .lastModifiedDate(now)
                                .status(randomDishStatus())
                                .category(randomCategory)
                                .build();
                    })
                    .toList();

            dishRepository.saveAll(dishes);
            System.out.printf("✅ DishSeeder: Đã thêm %d món ăn mẫu vào bảng dishes.%n", dishes.size());
        } else {
            System.out.println("ℹ️ DishSeeder: Dữ liệu Dish đã tồn tại, bỏ qua seeding.");
        }
    }

    // Sinh ngẫu nhiên trạng thái món ăn
    private DishStatus randomDishStatus() {
        DishStatus[] statuses = DishStatus.values();
        return statuses[ThreadLocalRandom.current().nextInt(statuses.length)];
    }
}
