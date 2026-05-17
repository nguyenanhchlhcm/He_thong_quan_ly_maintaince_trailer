'use client'

import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu'
import { Search, Eye, AlertCircle, Clock, CheckCircle2, Hammer, FileText, Wrench, MapPin, User, Filter, ArrowUpDown, Check } from 'lucide-react'
import { PhieuBaoTri } from '@/types/database'

interface AdminTicketTableProps {
  data: PhieuBaoTri[]
  onViewDetails: (ticket: PhieuBaoTri) => void
}

export function AdminTicketTable({ data, onViewDetails }: AdminTicketTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  
  // Checklist Filter States (Excel-style)
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([])
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [selectedMechanics, setSelectedMechanics] = useState<string[]>([])
  const [selectedGps, setSelectedGps] = useState<string[]>([])

  // Sorting States
  const [sortField, setSortField] = useState<'tong_chi_phi' | 'ngay_tiep_nhan' | 'created_at' | null>(null)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Dynamic extract unique lists from the source data
  const uniqueVehicles = Array.from(new Set(data.map(t => t.vehicles?.bien_so || t.id_xe || 'N/A'))).filter(Boolean).sort()
  const uniqueStatuses = Array.from(new Set(data.map(t => t.trang_thai_phieu))).filter(Boolean).sort() as string[]
  const uniqueTypes = Array.from(new Set(data.map(t => t.loai_phieu || ''))).filter(Boolean).sort() as string[]
  const uniqueMechanics = Array.from(new Set(data.map(t => t.profiles?.full_name || t.profiles?.email || 'Chưa gán'))).filter(Boolean).sort() as string[]

  const hasActiveFilters = selectedVehicles.length > 0 || 
                          selectedStatuses.length > 0 || 
                          selectedTypes.length > 0 || 
                          selectedMechanics.length > 0 || 
                          selectedGps.length > 0 ||
                          searchTerm !== ''

  const handleClearAllFilters = () => {
    setSelectedVehicles([])
    setSelectedStatuses([])
    setSelectedTypes([])
    setSelectedMechanics([])
    setSelectedGps([])
    setSearchTerm('')
    setSortField(null)
  }

  // Filter Logic
  const filteredData = data.filter(ticket => {
    // 1. Text Search Match
    const bienSo = ticket.vehicles?.bien_so || ticket.id_xe || ''
    const maPhieu = ticket.ma_phieu || ticket.id.slice(0, 8)
    const term = searchTerm.toLowerCase()
    const matchesSearch = bienSo.toLowerCase().includes(term) || maPhieu.toLowerCase().includes(term)
    if (!matchesSearch) return false

    // 2. Vehicle Column Checklist Match
    if (selectedVehicles.length > 0) {
      const vVal = ticket.vehicles?.bien_so || ticket.id_xe || 'N/A'
      if (!selectedVehicles.includes(vVal)) return false
    }

    // 3. Status Column Checklist Match
    if (selectedStatuses.length > 0) {
      if (!selectedStatuses.includes(ticket.trang_thai_phieu)) return false
    }

    // 4. Type Column Checklist Match
    if (selectedTypes.length > 0) {
      if (!selectedTypes.includes(ticket.loai_phieu || '')) return false
    }

    // 5. Mechanic Column Checklist Match
    if (selectedMechanics.length > 0) {
      const mVal = ticket.profiles?.full_name || ticket.profiles?.email || 'Chưa gán'
      if (!selectedMechanics.includes(mVal)) return false
    }

    // 6. GPS Warning Checklist Match
    if (selectedGps.length > 0) {
      const gVal = ticket.canh_bao_gps ? 'Lệch vị trí' : 'Hợp lệ'
      if (!selectedGps.includes(gVal)) return false
    }

    return true
  })

  // Sorting Logic
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortField) return 0
    let aVal = a[sortField]
    let bVal = b[sortField]

    if (sortField === 'ngay_tiep_nhan') {
      aVal = a.ngay_tiep_nhan || a.created_at
      bVal = b.ngay_tiep_nhan || b.created_at
    }

    if (aVal === bVal) return 0
    if (aVal === null || aVal === undefined) return 1
    if (bVal === null || bVal === undefined) return -1

    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
    }

    return sortOrder === 'asc' 
      ? (aVal as number) - (bVal as number) 
      : (bVal as number) - (aVal as number)
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Báo giá': 
        return <Badge variant="outline" className="bg-slate-500/10 text-slate-400 border-slate-500/20">Báo giá</Badge>
      case 'Chờ duyệt': 
        return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 gap-1"><Clock className="w-3 h-3" /> Chờ duyệt</Badge>
      case 'Đang sửa': 
        return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 gap-1"><Hammer className="w-3 h-3" /> Đang sửa</Badge>
      case 'Đã xong': 
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20 gap-1"><CheckCircle2 className="w-3 h-3" /> Đã xong</Badge>
      default: return <Badge>{status}</Badge>
    }
  }

  const formatDateTime = (isoString: string | null | undefined) => {
    if (!isoString) return 'N/A'
    const date = new Date(isoString)
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDateOnly = (isoString: string | null | undefined) => {
    if (!isoString) return 'N/A'
    const date = new Date(isoString)
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input 
            placeholder="Tìm theo Biển số xe hoặc Mã phiếu..." 
            className="pl-9 bg-slate-800/50 border-slate-700 text-slate-100"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {hasActiveFilters && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleClearAllFilters}
            className="border-red-500/20 text-red-400 hover:bg-red-500/10 font-bold gap-1 bg-red-500/5 transition-colors"
          >
            <Clock className="w-3.5 h-3.5" />
            Xóa bộ lọc Excel ({
              (selectedVehicles.length > 0 ? 1 : 0) +
              (selectedStatuses.length > 0 ? 1 : 0) +
              (selectedTypes.length > 0 ? 1 : 0) +
              (selectedMechanics.length > 0 ? 1 : 0) +
              (selectedGps.length > 0 ? 1 : 0) +
              (searchTerm !== '' ? 1 : 0)
            })
          </Button>
        )}
      </div>

      <div className="border border-slate-800 rounded-lg overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-900/80">
            <TableRow className="border-slate-800 hover:bg-transparent">
              {/* Mã Phiếu */}
              <TableHead className="text-slate-400">
                <div className="flex items-center gap-1.5 justify-start">
                  <span>Mã Phiếu</span>
                </div>
              </TableHead>

              {/* Ngày Tiếp Nhận */}
              <TableHead className="text-slate-400">
                <div className="flex items-center gap-1.5 justify-start">
                  <span>Ngày Tiếp Nhận</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger className={`w-6 h-6 p-0 hover:bg-slate-800 hover:text-primary transition-all rounded flex items-center justify-center border border-transparent bg-transparent cursor-pointer ${sortField === 'ngay_tiep_nhan' ? 'text-primary font-bold bg-primary/10' : 'text-slate-500'}`}>
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="bg-slate-900 border-slate-800 text-slate-100 min-w-[160px] shadow-2xl">
                      <DropdownMenuLabel className="text-slate-400 text-xs py-1.5 px-2">Sắp xếp Ngày tiếp nhận</DropdownMenuLabel>
                      <DropdownMenuItem
                        onClick={() => {
                          setSortField('ngay_tiep_nhan')
                          setSortOrder('asc')
                        }}
                        className="text-xs py-1.5 px-2 cursor-pointer hover:bg-slate-800 flex items-center justify-between gap-2"
                      >
                        <span>Cũ nhất xếp trước</span>
                        {sortField === 'ngay_tiep_nhan' && sortOrder === 'asc' && (
                          <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setSortField('ngay_tiep_nhan')
                          setSortOrder('desc')
                        }}
                        className="text-xs py-1.5 px-2 cursor-pointer hover:bg-slate-800 flex items-center justify-between gap-2"
                      >
                        <span>Mới nhất xếp trước</span>
                        {sortField === 'ngay_tiep_nhan' && sortOrder === 'desc' && (
                          <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                        )}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableHead>

              {/* Ngày tạo */}
              <TableHead className="text-slate-400">
                <div className="flex items-center gap-1.5 justify-start">
                  <span>Ngày tạo</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger className={`w-6 h-6 p-0 hover:bg-slate-800 hover:text-primary transition-all rounded flex items-center justify-center border border-transparent bg-transparent cursor-pointer ${sortField === 'created_at' ? 'text-primary font-bold bg-primary/10' : 'text-slate-500'}`}>
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="bg-slate-900 border-slate-800 text-slate-100 min-w-[160px] shadow-2xl">
                      <DropdownMenuLabel className="text-slate-400 text-xs py-1.5 px-2">Sắp xếp Ngày lập phiếu</DropdownMenuLabel>
                      <DropdownMenuItem
                        onClick={() => {
                          setSortField('created_at')
                          setSortOrder('asc')
                        }}
                        className="text-xs py-1.5 px-2 cursor-pointer hover:bg-slate-800 flex items-center justify-between gap-2"
                      >
                        <span>Cũ nhất xếp trước</span>
                        {sortField === 'created_at' && sortOrder === 'asc' && (
                          <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setSortField('created_at')
                          setSortOrder('desc')
                        }}
                        className="text-xs py-1.5 px-2 cursor-pointer hover:bg-slate-800 flex items-center justify-between gap-2"
                      >
                        <span>Mới nhất xếp trước</span>
                        {sortField === 'created_at' && sortOrder === 'desc' && (
                          <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                        )}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableHead>

              {/* Biển số Xe */}
              <TableHead className="text-slate-400">
                <div className="flex items-center gap-1.5 justify-start">
                  <span>Biển số Xe</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger className={`w-6 h-6 p-0 hover:bg-slate-800 hover:text-primary transition-all rounded flex items-center justify-center bg-transparent cursor-pointer ${selectedVehicles.length > 0 ? 'text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20' : 'text-slate-500 border border-transparent'}`}>
                      <Filter className="w-3 h-3" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="bg-slate-900 border-slate-800 text-slate-100 min-w-[180px] max-h-[300px] overflow-y-auto shadow-2xl">
                      <DropdownMenuLabel className="text-slate-400 text-xs py-1.5 px-2">Lọc theo Biển xe</DropdownMenuLabel>
                      {selectedVehicles.length > 0 && (
                        <>
                          <DropdownMenuItem onClick={() => setSelectedVehicles([])} className="text-red-400 hover:text-red-300 text-xs py-1 px-2 cursor-pointer font-bold flex items-center justify-between">
                            <span>Xóa bộ lọc cột</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-slate-800" />
                        </>
                      )}
                      {uniqueVehicles.map(v => (
                        <DropdownMenuItem
                          key={v}
                          closeOnClick={false}
                          onClick={() => {
                            if (selectedVehicles.includes(v)) {
                              setSelectedVehicles(selectedVehicles.filter(item => item !== v))
                            } else {
                              setSelectedVehicles([...selectedVehicles, v])
                            }
                          }}
                          className="text-xs py-1.5 px-2 cursor-pointer hover:bg-slate-800 flex items-center justify-between gap-2 text-slate-200"
                        >
                          <span>{v}</span>
                          {selectedVehicles.includes(v) && (
                            <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                          )}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableHead>

              {/* Trạng thái */}
              <TableHead className="text-slate-400">
                <div className="flex items-center gap-1.5 justify-start">
                  <span>Trạng thái</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger className={`w-6 h-6 p-0 hover:bg-slate-800 hover:text-primary transition-all rounded flex items-center justify-center bg-transparent cursor-pointer ${selectedStatuses.length > 0 ? 'text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20' : 'text-slate-500 border border-transparent'}`}>
                      <Filter className="w-3 h-3" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="bg-slate-900 border-slate-800 text-slate-100 min-w-[180px] shadow-2xl">
                      <DropdownMenuLabel className="text-slate-400 text-xs py-1.5 px-2">Lọc theo Trạng thái</DropdownMenuLabel>
                      {selectedStatuses.length > 0 && (
                        <>
                          <DropdownMenuItem onClick={() => setSelectedStatuses([])} className="text-red-400 hover:text-red-300 text-xs py-1 px-2 cursor-pointer font-bold flex items-center justify-between">
                            <span>Xóa bộ lọc cột</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-slate-800" />
                        </>
                      )}
                      {uniqueStatuses.map(s => (
                        <DropdownMenuItem
                          key={s}
                          closeOnClick={false}
                          onClick={() => {
                            if (selectedStatuses.includes(s)) {
                              setSelectedStatuses(selectedStatuses.filter(item => item !== s))
                            } else {
                              setSelectedStatuses([...selectedStatuses, s])
                            }
                          }}
                          className="text-xs py-1.5 px-2 cursor-pointer hover:bg-slate-800 flex items-center justify-between gap-2 text-slate-200"
                        >
                          <span>{s}</span>
                          {selectedStatuses.includes(s) && (
                            <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                          )}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableHead>

              {/* Loại phiếu */}
              <TableHead className="text-slate-400">
                <div className="flex items-center gap-1.5 justify-start">
                  <span>Loại</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger className={`w-6 h-6 p-0 hover:bg-slate-800 hover:text-primary transition-all rounded flex items-center justify-center bg-transparent cursor-pointer ${selectedTypes.length > 0 ? 'text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20' : 'text-slate-500 border border-transparent'}`}>
                      <Filter className="w-3 h-3" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="bg-slate-900 border-slate-800 text-slate-100 min-w-[160px] shadow-2xl">
                      <DropdownMenuLabel className="text-slate-400 text-xs py-1.5 px-2">Lọc theo Loại phiếu</DropdownMenuLabel>
                      {selectedTypes.length > 0 && (
                        <>
                          <DropdownMenuItem onClick={() => setSelectedTypes([])} className="text-red-400 hover:text-red-300 text-xs py-1 px-2 cursor-pointer font-bold flex items-center justify-between">
                            <span>Xóa bộ lọc cột</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-slate-800" />
                        </>
                      )}
                      {uniqueTypes.map(t => (
                        <DropdownMenuItem
                          key={t}
                          closeOnClick={false}
                          onClick={() => {
                            if (selectedTypes.includes(t)) {
                              setSelectedTypes(selectedTypes.filter(item => item !== t))
                            } else {
                              setSelectedTypes([...selectedTypes, t])
                            }
                          }}
                          className="text-xs py-1.5 px-2 cursor-pointer hover:bg-slate-800 flex items-center justify-between gap-2 text-slate-200"
                        >
                          <span>{t}</span>
                          {selectedTypes.includes(t) && (
                            <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                          )}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableHead>

              {/* Tổng chi phí */}
              <TableHead className="text-slate-400 text-right">
                <div className="flex items-center gap-1.5 justify-end">
                  <DropdownMenu>
                    <DropdownMenuTrigger className={`w-6 h-6 p-0 hover:bg-slate-800 hover:text-primary transition-all rounded flex items-center justify-center border border-transparent bg-transparent cursor-pointer ${sortField === 'tong_chi_phi' ? 'text-primary font-bold bg-primary/10' : 'text-slate-500'}`}>
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800 text-slate-100 min-w-[160px] shadow-2xl">
                      <DropdownMenuLabel className="text-slate-400 text-xs py-1.5 px-2">Sắp xếp Chi phí</DropdownMenuLabel>
                      <DropdownMenuItem
                        onClick={() => {
                          setSortField('tong_chi_phi')
                          setSortOrder('asc')
                        }}
                        className="text-xs py-1.5 px-2 cursor-pointer hover:bg-slate-800 flex items-center justify-between gap-2"
                      >
                        <span>Thấp đến Cao</span>
                        {sortField === 'tong_chi_phi' && sortOrder === 'asc' && (
                          <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setSortField('tong_chi_phi')
                          setSortOrder('desc')
                        }}
                        className="text-xs py-1.5 px-2 cursor-pointer hover:bg-slate-800 flex items-center justify-between gap-2"
                      >
                        <span>Cao đến Thấp</span>
                        {sortField === 'tong_chi_phi' && sortOrder === 'desc' && (
                          <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                        )}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <span>Tổng chi phí</span>
                </div>
              </TableHead>

              {/* Người phụ trách */}
              <TableHead className="text-slate-400">
                <div className="flex items-center gap-1.5 justify-start">
                  <span>Người phụ trách</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger className={`w-6 h-6 p-0 hover:bg-slate-800 hover:text-primary transition-all rounded flex items-center justify-center bg-transparent cursor-pointer ${selectedMechanics.length > 0 ? 'text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20' : 'text-slate-500 border border-transparent'}`}>
                      <Filter className="w-3 h-3" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="bg-slate-900 border-slate-800 text-slate-100 min-w-[180px] max-h-[300px] overflow-y-auto shadow-2xl">
                      <DropdownMenuLabel className="text-slate-400 text-xs py-1.5 px-2">Lọc theo Người phụ trách</DropdownMenuLabel>
                      {selectedMechanics.length > 0 && (
                        <>
                          <DropdownMenuItem onClick={() => setSelectedMechanics([])} className="text-red-400 hover:text-red-300 text-xs py-1 px-2 cursor-pointer font-bold flex items-center justify-between">
                            <span>Xóa bộ lọc cột</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-slate-800" />
                        </>
                      )}
                      {uniqueMechanics.map(m => (
                        <DropdownMenuItem
                          key={m}
                          closeOnClick={false}
                          onClick={() => {
                            if (selectedMechanics.includes(m)) {
                              setSelectedMechanics(selectedMechanics.filter(item => item !== m))
                            } else {
                              setSelectedMechanics([...selectedMechanics, m])
                            }
                          }}
                          className="text-xs py-1.5 px-2 cursor-pointer hover:bg-slate-800 flex items-center justify-between gap-2 text-slate-200"
                        >
                          <span>{m}</span>
                          {selectedMechanics.includes(m) && (
                            <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                          )}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableHead>

              {/* GPS warning */}
              <TableHead className="text-slate-400">
                <div className="flex items-center gap-1.5 justify-start">
                  <span>GPS</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger className={`w-6 h-6 p-0 hover:bg-slate-800 hover:text-primary transition-all rounded flex items-center justify-center bg-transparent cursor-pointer ${selectedGps.length > 0 ? 'text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20' : 'text-slate-500 border border-transparent'}`}>
                      <Filter className="w-3 h-3" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="bg-slate-900 border-slate-800 text-slate-100 min-w-[160px] shadow-2xl">
                      <DropdownMenuLabel className="text-slate-400 text-xs py-1.5 px-2">Lọc theo Tọa độ GPS</DropdownMenuLabel>
                      {selectedGps.length > 0 && (
                        <>
                          <DropdownMenuItem onClick={() => setSelectedGps([])} className="text-red-400 hover:text-red-300 text-xs py-1 px-2 cursor-pointer font-bold flex items-center justify-between">
                            <span>Xóa bộ lọc cột</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-slate-800" />
                        </>
                      )}
                      {['Hợp lệ', 'Lệch vị trí'].map(g => (
                        <DropdownMenuItem
                          key={g}
                          closeOnClick={false}
                          onClick={() => {
                            if (selectedGps.includes(g)) {
                              setSelectedGps(selectedGps.filter(item => item !== g))
                            } else {
                              setSelectedGps([...selectedGps, g])
                            }
                          }}
                          className="text-xs py-1.5 px-2 cursor-pointer hover:bg-slate-800 flex items-center justify-between gap-2 text-slate-200"
                        >
                          <span>{g}</span>
                          {selectedGps.includes(g) && (
                            <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                          )}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableHead>

              {/* Thao tác */}
              <TableHead className="text-slate-400 text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.length > 0 ? (
              sortedData.map((ticket) => (
                <TableRow key={ticket.id} className="border-slate-800 hover:bg-slate-800/30 transition-colors">
                  <TableCell className="font-mono text-xs font-bold text-slate-400">
                    {ticket.ma_phieu || ticket.id.slice(0, 8)}
                  </TableCell>
                  <TableCell className="text-xs text-emerald-400 font-bold">
                    {formatDateOnly(ticket.ngay_tiep_nhan || ticket.created_at)}
                  </TableCell>
                  <TableCell className="text-xs text-slate-500 font-medium">
                    {formatDateTime(ticket.created_at)}
                  </TableCell>
                  <TableCell className="font-bold text-primary">
                    <div>
                      <p>{ticket.vehicles?.bien_so || ticket.id_xe || 'N/A'}</p>
                      {ticket.vehicles?.loai_xe && (
                        <p className="text-[10px] text-slate-500 font-normal">{ticket.vehicles.loai_xe}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(ticket.trang_thai_phieu)}</TableCell>
                  <TableCell>
                    {ticket.loai_phieu === 'Bên ngoài' ? (
                      <div className="flex flex-col gap-0.5">
                        <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 gap-1 w-fit">
                          <MapPin className="w-3 h-3" /> Bên ngoài
                        </Badge>
                        {ticket.loai_sua_ngoai && (
                          <span className="text-[10px] text-amber-400/60 pl-1">{ticket.loai_sua_ngoai}</span>
                        )}
                      </div>
                    ) : (
                      <Badge variant="outline" className="bg-blue-500/5 text-blue-400/70 border-blue-500/10 gap-1">
                        <Wrench className="w-3 h-3" /> Nội bộ
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold text-slate-200">
                    {ticket.tong_chi_phi.toLocaleString()} đ
                  </TableCell>
                  <TableCell className="text-slate-300">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] text-primary border border-primary/20">
                        <User className="w-3 h-3" />
                      </div>
                      <span className="text-xs">{ticket.profiles?.full_name || ticket.profiles?.email || 'Chưa gán'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {ticket.canh_bao_gps ? (
                      <Badge variant="destructive" className="bg-red-500/10 text-red-500 border-red-500/20 gap-1 animate-pulse">
                        <AlertCircle className="w-3 h-3" /> Lệch vị trí
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-green-500/5 text-green-500/50 border-green-500/10">Hợp lệ</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="gap-2 text-slate-400 hover:text-primary hover:bg-primary/10"
                      onClick={() => onViewDetails(ticket)}
                    >
                      <Eye className="w-4 h-4" />
                      Chi tiết
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={10} className="h-32 text-center text-slate-500 italic">
                  Không tìm thấy phiếu bảo trì nào khớp bộ lọc.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
