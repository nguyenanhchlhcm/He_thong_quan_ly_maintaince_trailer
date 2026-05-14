# T2M-App Changelog

## [2026-05-13] - Architecture & Master Data Alignment (Phase 2-4)

### Added
- **New Master Data Tables**: `danh_muc_khach_hang`, `danh_muc_nha_cung_cap`, `danh_muc_dich_vu`, and `preventive_logs`.
- **Business Logic Triggers**:
    - `update_ticket_totals`: Server-side cost calculation for integrity.
    - `reset_ticket_status`: Reverts approved tickets to "Báo giá" if modified.
    - `sync_vehicle_odometer`: Syncs ODO from completed tickets to vehicle records.
- **Service Management**: Added specialized `ServiceTable` and `ServiceDialog` to manage the service catalog independently.
- **Premium UI System**:
    - Navy Blue primary theme in `globals.css`.
    - `glass-card` and `premium-gradient` utility classes.
    - `big-button` class for mobile-first touch operations.
- **Visual Assets**: AI-generated premium logistics background for the login portal.

### Updated
- **Feature Restructuring**: Moved maintenance and master data components into domain-driven folders (`src/features/maintenance`, `src/features/master-data`).
- **Database Alignment**: Renamed all tables and fields to Vietnamese naming conventions in `schema.sql` and `database.ts`.
- **Mechanic Ticket Form**:
    - Added **Odometer Poka-yoke**: Validates that mileage is not lower than previous records.
    - Added **GPS Fraud Prevention**: Integrated Haversine distance check with real-time distance calculation and >1km warnings.
    - Applied premium "Big Button" and "Glass Card" styling.
- **Login Page**: Redesigned with a high-end cinematic logistics theme and glassmorphism.

### Technical Improvements
- **Image Handling**: Updated `PhotoUploader` to use `capture="environment"` (camera hint) and enforce <100KB WebP compression.
- **Syncing**: Improved `useMasterData` hooks to support new Vietnamese table names.

---
**Next Session Objectives:**
1. Upgrade `AnalyticsDashboard` with premium glowing charts.
2. Implement Tab management for Customers and Suppliers.
3. Add micro-animations for UI transitions.
