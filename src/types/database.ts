export type Role = 'ADMIN' | 'MANAGER' | 'MECHANIC' | 'DRIVER' | 'DISPATCHER';

export interface Profile {
  id: string;
  email: string | null;
  role: Role;
  full_name: string | null;
  created_at: string;
}

export interface Gara {
  id: string;
  name: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  created_at: string;
}

export type SKUCategory = 'Vật tư' | 'Dịch vụ';

export interface VatTuSKU {
  id: string;
  name: string;
  unit: string | null;
  price: number | null;
  loai: SKUCategory;
  created_at: string;
}

export interface Xe {
  id: string; // Biển số hoặc ID định danh
  model: string | null;
  odometer: number;
  last_oil_change_km: number;
  next_maintenance_km: number;
  created_at: string;
}

export interface QuanLyVoXe {
  id_vo: string;
  id_xe: string | null;
  vi_tri_lap: string | null;
  tinh_trang_gai: number | null;
  trang_thai_vo: 'Đang chạy' | 'Chờ đắp' | 'Thanh lý' | null;
  serial_photo_url?: string | null;
  tread_condition_photo_url?: string | null;
  created_at: string;
}

export type TrangThaiPhieu = 'Báo giá' | 'Chờ duyệt' | 'Đang sửa' | 'Đã xong';

export type LoaiPhieu = 'Nội bộ' | 'Bên ngoài';

export type LoaiSuaNgoai = 'Vá vỏ' | 'Thay vỏ' | 'Bảo trì lớn' | 'Khác';

export interface PhieuBaoTri {
  id: string;
  ma_phieu: string | null;
  id_xe: string | null;
  id_tho_may: string | null;
  toa_do_app_lat: number | null;
  toa_do_app_lng: number | null;
  canh_bao_gps: boolean;
  trang_thai_phieu: TrangThaiPhieu;
  loai_phieu: LoaiPhieu;
  loai_sua_ngoai: LoaiSuaNgoai | null;
  don_vi_sua_ngoai: string | null;
  ghi_chu_ngoai: string | null;
  tong_vat_tu: number;
  tien_cong: number;
  tong_chi_phi: number;
  odometer_photo_url?: string | null;
  receipt_photo_url?: string | null;
  checkin_photos_url?: string[] | null;
  last_updated: string;
  created_at: string;
  profiles?: {
    full_name: string | null;
    email: string | null;
  };
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
  skus?: {
    name: string | null;
  };
}
