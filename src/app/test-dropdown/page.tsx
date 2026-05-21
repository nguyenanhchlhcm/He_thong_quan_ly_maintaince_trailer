'use client'

import { useState } from 'react'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { ArrowUpDown, Filter } from 'lucide-react'

export default function TestDropdownPage() {
  const [checked, setChecked] = useState(false)
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])

  const uniqueTypes = ['Nội bộ', 'Bên ngoài']

  return (
    <div className="p-20 bg-slate-950 min-h-screen text-slate-100 flex flex-col gap-10 items-center justify-center">
      <h1 className="text-2xl font-bold">Test Dropdown Menu</h1>
      
      <div className="flex gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger className="px-4 py-2 bg-slate-800 rounded text-slate-100 hover:bg-slate-700 cursor-pointer">
            Lọc theo loại
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="bg-slate-900 border-slate-800 text-slate-100 min-w-[160px] shadow-2xl p-2 rounded">
            <DropdownMenuLabel className="text-slate-400 text-xs py-1.5 px-2">Lọc theo Loại phiếu</DropdownMenuLabel>
            {uniqueTypes.map((type) => (
              <DropdownMenuCheckboxItem
                key={type}
                checked={selectedTypes.includes(type)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedTypes([...selectedTypes, type])
                  } else {
                    setSelectedTypes(selectedTypes.filter(t => t !== type))
                  }
                }}
                className="text-xs py-1.5 px-2 cursor-pointer hover:bg-slate-800 flex items-center justify-between"
              >
                {type}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
