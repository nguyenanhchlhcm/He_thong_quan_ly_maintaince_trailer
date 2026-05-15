'use client'

import { Warehouse } from 'lucide-react'
import { Gara } from '@/types/database'
import { GenericMasterTable, Column } from './GenericMasterTable'

interface GarageTableProps {
  data: Gara[]
  onEdit: (gara: Gara) => void
  onDelete: (id: string) => void
  onAdd: () => void
}

export function GarageTable({ data, onEdit, onDelete, onAdd }: GarageTableProps) {
  const columns: Column<Gara>[] = [
    {
      header: 'Tên Gara',
      key: 'name',
      render: (gara) => (
        <div className="flex items-center gap-2">
          <Warehouse className="w-4 h-4 text-slate-500" />
          <span className="font-semibold">{gara.name || gara.ten_gara}</span>
        </div>
      )
    },
    {
      header: 'Loại Gara',
      key: 'loai_gara',
      render: (gara) => (
        <span className={gara.loai_gara === 'Nội bộ' ? 'text-blue-400' : 'text-amber-400'}>
          {gara.loai_gara}
        </span>
      )
    },
    {
      header: 'Địa chỉ',
      key: 'address',
      render: (gara) => (
        <div className="max-w-[300px] truncate">
          {gara.address || gara.dia_chi || '-'}
        </div>
      )
    }
  ]

  return (
    <GenericMasterTable
      data={data}
      columns={columns}
      onEdit={onEdit}
      onDelete={onDelete}
      onAdd={onAdd}
      searchPlaceholder="Tìm tên hoặc địa chỉ gara..."
      searchKeys={['name', 'ten_gara', 'address', 'dia_chi']}
    />
  )
}
