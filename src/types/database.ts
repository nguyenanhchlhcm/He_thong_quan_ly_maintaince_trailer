export type Role = 'ADMIN' | 'MANAGER' | 'MECHANIC' | 'DRIVER' | 'DISPATCHER';
export type LoaiPhieu = 'Nội bộ' | 'Bên ngoài';
export type LoaiSuaNgoai = 'Vá vỏ' | 'Thay vỏ' | 'Bảo trì lớn' | 'Khác';

export interface Profile {
  id: string;
  email: string | null;
  role: Role;
  full_name: string | null;
  created_at: string;
}

export interface Gara {
  id: string;
  ten_gara: string;
  dia_chi: string | null;
  toa_do_lat: number | null;
  toa_do_lng: number | null;
  loai_gara: 'Nội bộ' | 'Hợp tác đối tác';
  created_at: string;
}

export interface VatTuSKU {
  id: string;
  ten_vat_tu: string;
  nhom_vat_tu: 'Động cơ' | 'Gầm' | 'Điện' | 'Lốp' | 'Máy lạnh' | null;
  don_vi_tinh: 'Cái' | 'Bộ' | 'Can' | 'Lít' | 'Gói' | null;
  gia_tham_khao: number;
  loai: 'Vật tư' | 'Dịch vụ' | null;
  created_at: string;
  // Legacy aliases used by CreateTicketDialog
  name?: string;
  price?: number;
  unit?: string;
}

export interface Xe {
  id: string; // Biển số xe
  bien_so: string; // Alias for id
  model: string | null; // Loại xe
  loai_xe?: string | null; // Alias for model
  odometer: number; // Số KM hiện tại
  so_km_hien_tai?: number; // Alias for odometer
  last_oil_change_km: number;
  next_maintenance_km: number;
  created_at: string;
}

export interface QuanLyVoXe {
  id_vo: string;
  id_xe: string | null; // refers to vehicles.id
  vi_tri_lap: string | null;
  tinh_trang_gai: number | null;
  trang_thai_vo: 'Đang chạy' | 'Chờ đắp' | 'Thanh lý' | null;
  serial_photo_url?: string | null;
  tread_condition_photo_url?: string | null;
  created_at: string;
}

export type TrangThaiPhieu = 'Báo giá' | 'Chờ duyệt' | 'Đang sửa' | 'Đã xong';

export interface PhieuBaoTri {
  id: string;
  ma_phieu: string | null;
  id_xe: string | null;
  id_tho_may: string | null;
  toa_do_app_lat: number | null;
  toa_do_app_lng: number | null;
  canh_bao_gps: boolean;
  trang_thai_phieu: TrangThaiPhieu;
  loai_phieu: LoaiPhieu | null;
  loai_sua_ngoai: LoaiSuaNgoai | null;
  don_vi_sua_ngoai: string | null;
  ghi_chu_ngoai: string | null;
  odometer_photo_url?: string | null;
  receipt_photo_url?: string | null;
  tong_vat_tu: number;
  tien_cong: number;
  tong_chi_phi: number;
  last_updated: string;
  created_at: string;
  // Joined relations
  vehicles?: {
    id: string;
    bien_so?: string;
    model: string | null;
    loai_xe?: string | null;
  } | null;
  profiles?: {
    full_name: string | null;
    email: string | null;
  } | null;
}

export interface ChiTietVatTu {
  id: string;
  id_phieu: string | null;
  id_sku: string | null;
  so_luong: number;
  don_gia: number;
  thanh_tien: number;
  anh_vat_tu_cu_url: string | null;
  anh_vat_tu_moi_url: string | null;
  created_at: string;
  danh_muc_vat_tu_sku?: {
    ten_vat_tu: string | null;
  } | null;
}

export interface KhachHang {
  id: string;
  ten_khach_hang: string;
  sdt: string | null;
  ma_so_thue: string | null;
  hang_khach: string;
  cong_no: number;
  created_at: string;
}

export interface NhaCungCap {
  id: string;
  ten_ncc: string;
  nhom_cung_cap: string | null;
  lien_he: string | null;
  rating: number;
  created_at: string;
}

export interface DichVu {
  id: string;
  ten_dich_vu: string;
  don_gia_chuan: number;
  sla_du_kien: string | null;
  created_at: string;
}

export interface PreventiveLog {
  id: string;
  id_xe: string | null;
  noi_dung_bao_tri: string | null;
  so_km_thuc_hien: number | null;
  ngay_thuc_hien: string;
  created_at: string;
}
