// src/components/admin/SchedulerCard.tsx
import React from 'react';
import { useCrawlerScheduler } from '../hooks/useCrawlerScheduler.ts';

const SchedulerCard: React.FC = () => {
    const {
        linkEnabled,
        contentEnabled,
        isLinkSaving,
        isContentSaving,
        lastError,
        toggleLink,
        toggleContent,
        schedule,
        updateScheduleField,
        saveSchedule,
        isScheduleSaving,
        lastScheduleSavedAt,

        // seed listing
        sources,
        loadingSources,
        selectedSourceIds,
        setSelectedSourceIds,
        runSeedListingNow,
        isSeedListingRunning,
        lastSeedListingMessage,
    } = useCrawlerScheduler();

    const handleScheduleSubmit: React.FormEventHandler = async (e) => {
        e.preventDefault();
        await saveSchedule();
    };

    const scheduleDisabled = schedule.mode === 'always';

    return (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white/80 shadow-sm p-4 md:p-6">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
                <div>
                    <h2 className="text-lg md:text-xl font-semibold text-slate-900">
                        Bot Scheduler
                    </h2>
                    <p className="mt-1 text-xs md:text-sm text-slate-500 max-w-xl">
                        Quản lý trạng thái bot crawl (link &amp; content) và cấu hình khung
                        thời gian chạy. Backend (@Scheduled) chịu trách nhiệm thực thi theo
                        cấu hình này.
                    </p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    <span className="text-[11px] font-medium text-sky-700">
            Spring Scheduler · Enterprise config
          </span>
                </div>
            </div>

            {/* BOT STATE SECTION */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Link bot */}
                <div className="border rounded-xl px-4 py-3 bg-white flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2">
                        <div>
                            <p className="text-sm font-semibold text-slate-800">
                                Link Crawler Bot
                            </p>
                            <p className="text-[11px] text-slate-500">
                                Quét danh mục, đẩy seed link vào hàng đợi.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={toggleLink}
                            disabled={isLinkSaving}
                            className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-medium transition
                ${
                                linkEnabled
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-slate-200 text-slate-700'
                            }
                ${isLinkSaving ? 'opacity-60 cursor-wait' : 'hover:shadow-sm'}
              `}
                        >
              <span
                  className={`mr-1 h-2 w-2 rounded-full ${
                      linkEnabled ? 'bg-emerald-200' : 'bg-slate-400'
                  }`}
              />
                            {isLinkSaving ? 'Saving...' : linkEnabled ? 'Enabled' : 'Disabled'}
                        </button>
                    </div>
                </div>

                {/* Content bot */}
                <div className="border rounded-xl px-4 py-3 bg-white flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2">
                        <div>
                            <p className="text-sm font-semibold text-slate-800">
                                Content Crawler Bot
                            </p>
                            <p className="text-[11px] text-slate-500">
                                Đọc chi tiết bài viết, lấy nội dung &amp; ảnh.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={toggleContent}
                            disabled={isContentSaving}
                            className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-medium transition
                ${
                                contentEnabled
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-slate-200 text-slate-700'
                            }
                ${
                                isContentSaving ? 'opacity-60 cursor-wait' : 'hover:shadow-sm'
                            }
              `}
                        >
              <span
                  className={`mr-1 h-2 w-2 rounded-full ${
                      contentEnabled ? 'bg-emerald-200' : 'bg-slate-400'
                  }`}
              />
                            {isContentSaving
                                ? 'Saving...'
                                : contentEnabled
                                    ? 'Enabled'
                                    : 'Disabled'}
                        </button>
                    </div>
                </div>
            </div>

            {/* DIVIDER */}
            <div className="border-t border-slate-100 mb-5" />

            {/* SCHEDULE FORM */}
            <form onSubmit={handleScheduleSubmit} className="space-y-4">
                {/* Mode */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                        <p className="text-sm font-semibold text-slate-800">
                            Lịch chạy bot
                        </p>
                        <p className="text-[11px] text-slate-500 max-w-md">
                            Chế độ &quot;Luôn chạy&quot; dùng cron cố định ở backend. Chế độ
                            &quot;Theo khung ngày/giờ&quot; giúp backend đọc cấu hình và tự
                            quyết định có chạy hay tạm dừng bot.
                        </p>
                    </div>
                    <div className="flex items-center gap-3 text-[11px]">
                        <label className="inline-flex items-center gap-1 cursor-pointer">
                            <input
                                type="radio"
                                name="scheduleMode"
                                value="always"
                                checked={schedule.mode === 'always'}
                                onChange={() => updateScheduleField('mode', 'always')}
                                className="h-3 w-3 text-sky-600 border-slate-300"
                            />
                            <span className="text-slate-700">Luôn chạy khi bot bật</span>
                        </label>
                        <label className="inline-flex items-center gap-1 cursor-pointer">
                            <input
                                type="radio"
                                name="scheduleMode"
                                value="window"
                                checked={schedule.mode === 'window'}
                                onChange={() => updateScheduleField('mode', 'window')}
                                className="h-3 w-3 text-sky-600 border-slate-300"
                            />
                            <span className="text-slate-700">Theo khung ngày/giờ</span>
                        </label>
                    </div>
                </div>

                {/* Date range */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[11px] font-medium text-slate-600 mb-1">
                            Ngày bắt đầu
                        </label>
                        <input
                            type="date"
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/60 focus:border-sky-500 disabled:bg-slate-50 disabled:text-slate-400"
                            value={schedule.startDate}
                            onChange={(e) =>
                                updateScheduleField('startDate', e.target.value)
                            }
                            disabled={scheduleDisabled}
                        />
                    </div>
                    <div>
                        <label className="block text-[11px] font-medium text-slate-600 mb-1">
                            Ngày kết thúc (tuỳ chọn)
                        </label>
                        <input
                            type="date"
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/60 focus:border-sky-500 disabled:bg-slate-50 disabled:text-slate-400"
                            value={schedule.endDate}
                            onChange={(e) => updateScheduleField('endDate', e.target.value)}
                            disabled={scheduleDisabled}
                        />
                    </div>
                </div>

                {/* Time range + interval */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-[11px] font-medium text-slate-600 mb-1">
                            Giờ bắt đầu trong ngày
                        </label>
                        <input
                            type="time"
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/60 focus:border-sky-500 disabled:bg-slate-50 disabled:text-slate-400"
                            value={schedule.startTime}
                            onChange={(e) =>
                                updateScheduleField('startTime', e.target.value)
                            }
                            disabled={scheduleDisabled}
                        />
                    </div>
                    <div>
                        <label className="block text-[11px] font-medium text-slate-600 mb-1">
                            Giờ kết thúc trong ngày
                        </label>
                        <input
                            type="time"
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/60 focus:border-sky-500 disabled:bg-slate-50 disabled:text-slate-400"
                            value={schedule.endTime}
                            onChange={(e) => updateScheduleField('endTime', e.target.value)}
                            disabled={scheduleDisabled}
                        />
                    </div>
                    <div>
                        <label className="block text-[11px] font-medium text-slate-600 mb-1">
                            Chu kỳ chạy (phút)
                        </label>
                        <input
                            type="number"
                            min={1}
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/60 focus:border-sky-500 disabled:bg-slate-50 disabled:text-slate-400"
                            value={schedule.intervalMinutes}
                            onChange={(e) =>
                                updateScheduleField(
                                    'intervalMinutes',
                                    Number(e.target.value) || 1,
                                )
                            }
                            disabled={scheduleDisabled}
                        />
                    </div>
                </div>

                {/* FOOTER + SAVE */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pt-2">
                    <div className="text-[11px] text-slate-500">
                        {schedule.mode === 'always' ? (
                            <span>
                Bot sử dụng cron mặc định ở backend, không giới hạn khung thời
                gian.
              </span>
                        ) : (
                            <span>
                Bot sẽ được backend kiểm tra trong khung{' '}
                                <span className="font-medium">
                  {schedule.startTime || '--:--'} - {schedule.endTime || '--:--'}
                </span>{' '}
                                mỗi ngày, từ{' '}
                                <span className="font-medium">
                  {schedule.startDate || '...'}
                </span>{' '}
                                đến{' '}
                                <span className="font-medium">
                  {schedule.endDate || 'không giới hạn'}
                </span>
                , chu kỳ ~{' '}
                                <span className="font-medium">
                  {schedule.intervalMinutes} phút
                </span>
                .
              </span>
                        )}
                        {lastScheduleSavedAt && (
                            <span className="block mt-1">
                Lần lưu gần nhất:{' '}
                                {lastScheduleSavedAt.toLocaleString('vi-VN')}
              </span>
                        )}
                    </div>
                    <div className="flex flex-col md:flex-row md:items-center gap-2 md:justify-end">
                        {lastError && (
                            <span className="text-[11px] text-rose-500">
                Lỗi khi cập nhật bot: {lastError}
              </span>
                        )}
                        <button
                            type="submit"
                            disabled={isScheduleSaving || scheduleDisabled}
                            className={`inline-flex items-center rounded-lg px-4 py-2 text-xs font-semibold shadow-sm transition
                ${
                                isScheduleSaving || scheduleDisabled
                                    ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                            }
              `}
                        >
                            {isScheduleSaving ? 'Đang lưu...' : 'Lưu cấu hình lịch chạy'}
                        </button>
                    </div>
                </div>
            </form>
            {/* MANUAL SEED LISTING SECTION */}
            <div className="mt-6 border-t border-slate-100 pt-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
                    <div>
                        <p className="text-sm font-semibold text-slate-800">
                            Chạy seedListing theo ArticleSource
                        </p>
                        <p className="text-[11px] text-slate-500 max-w-md">
                            Chọn nguồn tin đã cấu hình trong database. Khi bấm chạy, backend sẽ
                            đẩy job CATEGORY cho từng nguồn (ví dụ /chinh-tri), sau đó hệ thống
                            tự quét LISTING &amp; ARTICLE như luồng bình thường.
                        </p>
                    </div>
                    {loadingSources && (
                        <span className="text-[11px] text-slate-400">
                            Đang tải danh sách nguồn...
                        </span>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                    <div className="md:col-span-2">
                        <div className="flex flex-wrap gap-2">
                            {sources.map((s) => {
                                const checked = selectedSourceIds.includes(s.id);
                                return (
                                    <button
                                        key={s.id}
                                        type="button"
                                        onClick={() => {
                                            setSelectedSourceIds(
                                                checked
                                                    ? selectedSourceIds.filter((id) => id !== s.id)
                                                    : [...selectedSourceIds, s.id]
                                            );
                                        }}
                                        className={`px-3 py-1 rounded-full text-[11px] border transition ${
                                            checked
                                                ? 'bg-sky-600 text-white border-sky-600'
                                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                                        }`}
                                    >
                                        #{s.id} · {s.name}
                                        {s.defaultCategorySlug && (
                                            <span className="ml-1 text-[10px] text-slate-200">
                                                · {s.defaultCategorySlug}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                            {!loadingSources && sources.length === 0 && (
                                <span className="text-[11px] text-slate-400">
                                    Chưa có ArticleSource nào trong database.
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex items-start md:items-center justify-start md:justify-end">
                        <button
                            type="button"
                            onClick={() => runSeedListingNow()}
                            disabled={
                                isSeedListingRunning || selectedSourceIds.length === 0
                            }
                            className={`inline-flex items-center rounded-lg px-4 py-2 text-xs font-semibold shadow-sm transition
                                ${
                                isSeedListingRunning || selectedSourceIds.length === 0
                                    ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                            }`}
                        >
                            {isSeedListingRunning
                                ? 'Đang gửi job seedListing...'
                                : 'Chạy seedListing với nguồn đã chọn'}
                        </button>
                    </div>
                </div>

                {lastSeedListingMessage && (
                    <p className="text-[11px] text-emerald-600 mt-1">
                        {lastSeedListingMessage}
                    </p>
                )}
            </div>
        </div>
    );
};

export default SchedulerCard;
