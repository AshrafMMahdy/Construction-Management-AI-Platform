
import React from 'react';
import type { StatCardData } from '../types';
import { BudgetIcon, CalendarIcon, SafetyIcon, TaskIcon, UpArrowIcon, DownArrowIcon, AlertIcon } from './icons/Icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';


const StatCard: React.FC<StatCardData> = ({ title, value, change, changeType, icon }) => {
    const isIncrease = changeType === 'increase';
    return (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 flex flex-col justify-between">
            <div className="flex justify-between items-start">
                <h3 className="text-sm font-medium text-gray-500 uppercase">{title}</h3>
                <div className="p-2 bg-brand-secondary/10 rounded-full">
                   {icon}
                </div>
            </div>
            <div>
              <p className="text-3xl font-bold text-brand-dark mt-2">{value}</p>
              <div className="flex items-center text-sm mt-1">
                  <span className={`flex items-center ${isIncrease ? 'text-green-600' : 'text-red-600'}`}>
                      {isIncrease ? <UpArrowIcon className="h-4 w-4 mr-1"/> : <DownArrowIcon className="h-4 w-4 mr-1"/>}
                      {change}
                  </span>
                  <span className="text-gray-500 ml-2">vs last month</span>
              </div>
            </div>
        </div>
    );
};

const chartData = [
  { name: 'Jan', Cost: 4000, Budget: 4200 },
  { name: 'Feb', Cost: 3000, Budget: 3200 },
  { name: 'Mar', Cost: 5000, Budget: 4800 },
  { name: 'Apr', Cost: 4780, Budget: 4600 },
  { name: 'May', Cost: 5890, Budget: 5500 },
  { name: 'Jun', Cost: 4390, Budget: 4500 },
];

const aiInsights = [
    { text: "Potential 2-week delay on structural steel delivery detected.", level: "High" },
    { text: "HVAC subcontractor is 15% behind schedule on submittals.", level: "Medium" },
    { text: "Favorable weather conditions predicted for next 10 days, opportunity to accelerate foundation work.", level: "Low" }
];


const Dashboard: React.FC = () => {
    const statCards: StatCardData[] = [
        { title: 'Schedule Adherence', value: '92%', change: '2%', changeType: 'increase', icon: <CalendarIcon className="h-5 w-5 text-brand-secondary"/> },
        { title: 'Budget Variance', value: '-3.5%', change: '0.5%', changeType: 'decrease', icon: <BudgetIcon className="h-5 w-5 text-brand-secondary"/> },
        { title: 'Open RFI\'s', value: '12', change: '3', changeType: 'decrease', icon: <TaskIcon className="h-5 w-5 text-brand-secondary"/> },
        { title: 'Safety Incidents', value: '0', change: '1', changeType: 'decrease', icon: <SafetyIcon className="h-5 w-5 text-brand-secondary"/> },
    ];

    return (
        <div className="space-y-8">
            <header>
                <h2 className="text-3xl font-bold text-brand-dark">Dashboard</h2>
                <p className="text-gray-500 mt-1">Welcome back, here's an AI-powered overview of your projects.</p>
            </header>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map(card => <StatCard key={card.title} {...card} />)}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Cost vs Budget Chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md border border-gray-200">
                    <h3 className="text-lg font-semibold text-brand-dark mb-4">Cost vs. Budget Overview</h3>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" tick={{fill: '#6B7280', fontSize: 12}} />
                                <YAxis tick={{fill: '#6B7280', fontSize: 12}} tickFormatter={(value) => `$${Number(value)/1000}k`}/>
                                <Tooltip cursor={{fill: 'rgba(21, 118, 210, 0.1)'}}/>
                                <Legend wrapperStyle={{fontSize: "14px"}}/>
                                <Bar dataKey="Cost" fill="#1976D2" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Budget" fill="#FFC107" radius={[4, 4, 0, 0]}/>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* AI Insights */}
                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                    <h3 className="text-lg font-semibold text-brand-dark mb-4">AI-Powered Insights</h3>
                    <ul className="space-y-4">
                       {aiInsights.map((insight, index) => (
                         <li key={index} className="flex items-start">
                            <AlertIcon className={`h-5 w-5 mr-3 mt-0.5 ${insight.level === 'High' ? 'text-red-500' : insight.level === 'Medium' ? 'text-yellow-500' : 'text-blue-500'}`} />
                            <p className="text-sm text-gray-700">{insight.text}</p>
                         </li>
                       ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
