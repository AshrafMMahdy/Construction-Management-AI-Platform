import React from 'react';

const Loader = ({ message }: { message: string }) => (
  <div className="flex flex-col items-center justify-center p-10 bg-slate-800 rounded-lg shadow-lg border border-slate-700">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    <p className="mt-4 text-slate-300 font-semibold">{message}</p>
  </div>
);

export default Loader;