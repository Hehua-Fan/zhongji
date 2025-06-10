"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, BarChart3, BarChart2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const Header = () => {
  const pathname = usePathname();

  const navItems = [
    {
      name: '排程',
      path: '/',
      icon: BarChart3,
      description: '生产排程管理'
    },
    {
      name: '排班',
      path: '/paiban',
      icon: Calendar,
      description: '人员排班管理'
    }
  ];

  return (
    <header className="flex items-center justify-center px-12 py-4 bg-white shadow-sm relative">
      {/* Logo/Brand - 绝对定位到左侧 */}
      <Link href="/" className="absolute left-12 flex items-center space-x-2">
        <div className="flex items-center">
          <h1 className="text-xl font-bold text-gray-900 flex items-center">
            <BarChart2 className="mr-2 h-6 w-6 text-[#706eff]" />
            智能生产排程系统
            <Badge variant="outline" className="ml-3 px-2 py-0 text-xs bg-blue-50 text-blue-700 border-blue-200">
              Beta
            </Badge>
          </h1>
        </div>
      </Link>

      {/* Navigation - 居中显示 */}
      <nav className="flex bg-gray-50 rounded-lg">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center px-4 py-3 text-sm font-bold rounded-lg transition-all duration-300 ease-in-out transform ${
                isActive
                  ? "text-white bg-[#706eff] shadow-md"
                  : "text-gray-700 hover:text-[#706eff] hover:bg-blue-50"
              }`}
            >
              <div className="flex items-center space-x-[0.5px]">
                <Icon className={`inline-block w-4 h-4 mr-2 align-middle ${
                  isActive ? "scale-110" : ""
                }`} />
                <span className="align-middle">{item.name}</span>
              </div>
            </Link>
          );
        })}
      </nav>
    </header>
  );
};

export default Header;
