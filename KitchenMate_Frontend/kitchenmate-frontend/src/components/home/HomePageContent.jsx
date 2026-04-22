import { useState } from 'react';
import NewestSection from './NewestSection';
import PopularSection from './PopularSection';

export default function HomePageContent() {
  const [activeTab, setActiveTab] = useState('newest');

  return (
    <>
      {/* Desktop: Both sections stacked */}
      <div className="hidden md:block">
        <NewestSection />
        <PopularSection />
      </div>

      {/* Mobile: Tab + single infinite list */}
      <div className="md:hidden">
        {/* Sort dropdown */}
        <div className="py-4 px-4">
          <div className="max-w-xl mx-auto">
            <div className="flex items-center justify-center gap-2">
              <span className="text-sm text-gray-600">Sắp xếp:</span>
              <div className="relative">
                <select
                  value={activeTab}
                  onChange={(e) => setActiveTab(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm font-medium text-gray-700 cursor-pointer hover:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                >
                  <option value="newest">Mới nhất</option>
                  <option value="popular">Phổ biến</option>
                </select>
                <i className="bi bi-chevron-down absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Single section based on active tab */}
        <div className="pb-20"> {/* pb-20 for bottom nav clearance */}
          {activeTab === 'newest' ? <NewestSection /> : <PopularSection />}
        </div>
      </div>
    </>
  );
}
