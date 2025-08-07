import React from 'react';
import ConstructionIcon from './icons/ConstructionIcon';

const Header = () => (
  <header className="bg-slate-800 shadow-lg">
    <div className="container mx-auto px-6 py-4 flex items-center gap-4">
      <ConstructionIcon className="w-12 h-12 text-blue-500" />
      <div>
        <h1 className="text-2xl font-bold text-slate-100">
          Contracts & Claims AI Analyst
        </h1>
        <p className="text-sm text-slate-400">
          As-Built vs. Planned Delay Analysis & Report Generator
        </p>
      </div>
    </div>
  </header>
);

export default Header;