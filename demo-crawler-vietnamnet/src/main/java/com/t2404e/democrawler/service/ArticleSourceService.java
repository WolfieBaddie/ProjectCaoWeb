package com.t2404e.democrawler.service;

import com.t2404e.democrawler.dto.ArticleSourceForm;
import com.t2404e.democrawler.entity.ArticleCategory;
import com.t2404e.democrawler.entity.ArticleSource;
import com.t2404e.democrawler.repository.ArticleCategoryRepository;
import com.t2404e.democrawler.repository.ArticleSourceRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ArticleSourceService {
    private final ArticleSourceRepository articleSourceRepository;
    private final ArticleCategoryRepository articleCategoryRepository;

    @Transactional
    public ArticleSource seedArticleSource(ArticleSourceForm form) {
        Long categoryId = form.getCategoryId();

        // 1) Lấy category (bắt buộc phải tồn tại)
        ArticleCategory category = articleCategoryRepository
                .findById(categoryId)
                .orElseThrow(() ->
                        new IllegalArgumentException("Không tìm thấy ArticleCategory với id = " + categoryId));

        // 2) Tìm ArticleSource theo categoryId (upsert) - dùng Optional
        ArticleSource source = articleSourceRepository
                .findByArticleCategory_Id(categoryId)
                .orElseGet(() -> {
                    ArticleSource s = new ArticleSource();
                    s.setArticleCategory(category);  // gán category lần đầu
                    return s;
                });

        // Nếu muốn chắc chắn khi update cũng gán lại category:
        source.setArticleCategory(category);

        // 3) Map data từ form sang entity
        // thông tin mô tả nguồn
        source.setTitle(form.getTitle());
        source.setDescription(form.getDescription());

        // URL listing (trang danh sách của chuyên mục)
        source.setUrl(form.getUrl());               // vd: https://vietnamnet.vn/chinh-tri

        // selector link ở trang listing để lấy link bài chi tiết
        source.setLinkSelector(form.getListingSelector());

        // selectors chi tiết bài viết
        source.setTitleSelector(form.getTitleSelector());
        source.setDescriptionSelector(form.getDescriptionSelector());
        source.setContentSelector(form.getContentSelector());
        source.setImageSelector(form.getImageSelector());

        // selector để xoá rác (quảng cáo, box relate, script, style...)
        source.setRemoveSelector(form.getRemoveSelector());

        // trạng thái (0/1), lấy đúng từ form
        source.setStatus(form.getStatus());

        // nếu entity ArticleSource có field note thì thêm:
        // source.setNote(form.getNote());

        // 4) Lưu DB
        return articleSourceRepository.save(source);
    }
}
