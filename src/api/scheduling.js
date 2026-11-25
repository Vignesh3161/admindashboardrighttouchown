// src/api/scheduling.js — Scheduling & Dispatch Operations API
// Direct implementation of Postman collection "RightTouch - Scheduling (Admin)"
// Covers:
// - Dispatch Queue & Health Ops
// - Booking Inspection & Broadcast Delivery Audit
// - Technician Service Base Locations (Scheduling Origin)
// - Customer No-Show Compensation Lifecycle
// - Zone Supply & Health Dashboard

import apiClient, { handle } from "./client";

/* ================= 1. DISPATCH QUEUE & HEALTH OPS ================= */

export const getDispatchStats = (params = {}) =>
  handle(apiClient.get("/admin/dispatch/stats", { params }));

export const getDispatchHealth = () =>
  handle(apiClient.get("/admin/dispatch/health"));

export const getDispatchFailed = (params = { page: 1, limit: 25 }) =>
  handle(apiClient.get("/admin/dispatch/failed", { params }));

export const getDispatchPending = (params = { status: "pending" }) =>
  handle(apiClient.get("/admin/dispatch/pending", { params }));

export const retryDispatch = (dispatchId, body = {}) =>
  handle(apiClient.post(`/admin/dispatch/${dispatchId}/retry`, body));

export const retryFailedDispatches = (body = {}) =>
  handle(apiClient.post("/admin/dispatch/retry-failed", body));

export const restartDispatchWorker = (body = {}) =>
  handle(apiClient.post("/admin/dispatch/worker/restart", body));

export const stopDispatchWorker = (body = {}) =>
  handle(apiClient.post("/admin/dispatch/worker/stop", body));

/* ================= 2. BOOKING INSPECTION & BROADCAST AUDIT ================= */

export const getAllSchedulingBookings = (params = { limit: 50 }) =>
  handle(apiClient.get("/user/booking/getAllBookings", { params }));

export const getSchedulingBookingById = (bookingId) =>
  handle(apiClient.get(`/user/booking/getBookingById/${bookingId}`));

export const getBroadcastAudit = (bookingId) =>
  handle(apiClient.get(`/admin/zone-geofence/jobs/${bookingId}/broadcast-audit`));

/* ================= 3. TECHNICIAN SERVICE BASE LOCATIONS ================= */

export const getMissingBaseLocations = (params = { page: 1, limit: 50 }) =>
  handle(apiClient.get("/technician/admin/service-base-location/missing", { params }));

export const getTechnicianBaseLocation = (technicianId) =>
  handle(apiClient.get(`/technician/admin/technicians/${technicianId}/service-base-location`));

export const setTechnicianBaseLocation = (technicianId, body) =>
  handle(apiClient.put(`/technician/admin/technicians/${technicianId}/service-base-location`, body));

/* ================= 4. ZONE SUPPLY & HEALTH DASHBOARD ================= */

export const getZoneHealthDashboard = () =>
  handle(apiClient.get("/admin/zone-geofence/zone-health-dashboard"));

/* ================= 5. CUSTOMER NO-SHOW COMPENSATION ================= */

/**
 * Update Customer No-Show Compensation
 * @param {string} bookingId
 * @param {Object} body
 * @param {'approve'|'reject'|'mark_paid'} body.action
 * @param {string} [body.note]
 * @param {string} [body.providerReference] Required when action === 'mark_paid' (e.g. UTR-123456)
 */
export const updateNoShowCompensation = (bookingId, body) =>
  handle(apiClient.put(`/user/booking/${bookingId}/customer-no-show/compensation`, body));

/* ================= 6. SCHEDULE SLOT SETTINGS ================= */

/**
 * Get global schedule slot configuration, defaults, and live preview.
 */
export const getScheduleSlotSettings = () =>
  handle(apiClient.get("/admin/settings/schedule-slots"));

/**
 * Update global schedule slot configuration.
 * @param {Object} body
 * @param {number} body.scheduleDays - Days 1 to 30
 * @param {number} body.windowStartHour - Hour 0 to 22 (24-hr)
 * @param {number} body.windowEndHour - Hour 1 to 23 (end > start)
 * @param {number} body.slotCount - Slots 1 to 12 (window must divide evenly, min 30 mins each)
 */
export const updateScheduleSlotSettings = (body) =>
  handle(apiClient.put("/admin/settings/schedule-slots", body));

/**
 * Reset schedule slot configuration to default:
 * 5 bookable days, 09:00 - 21:00 window, 4 slots.
 */
export const resetScheduleSlotSettings = () =>
  handle(apiClient.post("/admin/settings/schedule-slots/reset"));

/* ================= 7. SCHEDULED JOB POOL OPERATIONS ================= */

/**
 * Fetch bookings from the Scheduled Job Pool filtered by status.
 * @param {Object} params
 * @param {'all'|'unassigned'|'in_review'|'assigned'|'overdue'} [params.status='all']
 * @param {number} [params.page=1]
 * @param {number} [params.limit=20]
 * @param {string} [params.search]
 * @param {string} [params.districtId]
 */
export const getScheduledPoolBookings = (params = { status: "all", page: 1, limit: 20 }) =>
  handle(apiClient.get("/admin/scheduled-pool", { params }));

/**
 * Discover eligible candidate technicians and reasons why others were disqualified.
 * @param {string} bookingId
 */
export const getEligibleTechnicians = (bookingId) =>
  handle(apiClient.get(`/admin/scheduled-pool/${bookingId}/eligible-technicians`));

/**
 * Manually assign an eligible technician to a pooled booking.
 * @param {string} bookingId
 * @param {Object} body
 * @param {string} body.technicianProfileId
 */
export const assignScheduledPoolJob = (bookingId, body) =>
  handle(apiClient.post(`/admin/scheduled-pool/${bookingId}/assign`, body));

/**
 * Emergency swap/reassign an assigned technician with a replacement.
 * @param {string} bookingId
 * @param {Object} body
 * @param {string} body.toTechnicianId
 * @param {string} body.reason
 */
export const reassignScheduledPoolJob = (bookingId, body) =>
  handle(apiClient.post(`/admin/scheduled-pool/${bookingId}/reassign`, body));

/**
 * Reopen an escalated or released booking back to the Scheduled Job Pool.
 * @param {string} bookingId
 */
export const reopenScheduledPoolJob = (bookingId) =>
  handle(apiClient.post(`/admin/scheduled-pool/${bookingId}/reopen`));

/**
 * Update administrative review status and investigation notes on a pooled booking.
 * @param {string} bookingId
 * @param {Object} body
 * @param {'open'|'reviewed'|'investigating'|'dismissed'} [body.adminReviewStatus]
 * @param {string} [body.reviewNote]
 */
export const updateScheduledPoolReview = (bookingId, body) =>
  handle(apiClient.patch(`/admin/scheduled-pool/${bookingId}/review`, body));

/**
 * Get runtime Scheduled Job Pool configuration.
 */
export const getScheduledPoolConfig = () =>
  handle(apiClient.get("/admin/scheduled-pool/config"));

/**
 * Update runtime Scheduled Job Pool configuration.
 * @param {Object} body
 * @param {boolean} [body.enabled]
 * @param {number} [body.escalationLeadMinutes]
 */
export const updateScheduledPoolConfig = (body) =>
  handle(apiClient.put("/admin/scheduled-pool/config", body));

