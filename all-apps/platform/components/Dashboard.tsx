import React from 'react';
import type { StatCardData, Project } from '../types';
import { BudgetIcon, CalendarIcon, SafetyIcon, TaskIcon, UpArrowIcon, DownArrowIcon, AlertIcon } from './icons/Icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface StatCardProps extends StatCardData {}

const ICONS: { [key: string]: React.ReactNode } = {
    schedule: <CalendarIcon className="h-5 w-5 text-brand-accent"/>,
    budget: <BudgetIcon className="h-5 w-5 text-brand-accent"/>,
    rfis: <TaskIcon className="h-5 w-5 text-brand-accent"/>,
    safety: <SafetyIcon className="h-5 w-5 text-brand-accent"/>,
};

const StatCard: React.FC<StatCardProps> = ({ title, value, change, changeType, key }) => {
    const isIncrease = changeType === 'increase';
    return (
        <div className="bg-brand-secondary p-6 rounded-lg shadow-lg border border-brand-border flex flex-col justify-between">
            <div className="flex justify-between items-start">
                <h3 className="text-sm font-medium text-brand-text-medium uppercase tracking-wider">{title}</h3>
                <div className="p-2 bg-brand-primary rounded-full">
                   {ICONS[key]}
                </div>
            </div>
            <div>
              <p className="text-3xl font-bold text-brand-text-light mt-2">{value}</p>
              <div className="flex items-center text-sm mt-1">
                  <span className={`flex items-center ${isIncrease ? 'text-green-400' : 'text-red-400'}`}>
                      {isIncrease ? <UpArrowIcon className="h-4 w-4 mr-1"/> : <DownArrowIcon className="h-4 w-4 mr-1"/>}
                      {change}
                  </span>
                  <span className="text-brand-text-medium ml-2">vs last month</span>
              </div>
            </div>
        </div>
    );
};

interface DashboardProps {
  projectData: Project['dashboard'];
}

const Dashboard: React.FC<DashboardProps> = ({ projectData }) => {
    return (
        <div className="space-y-8">
            <header>
                <h2 className="text-3xl font-bold text-brand-text-light">Dashboard</h2>
                <p className="text-brand-text-medium mt-1">AI-powered overview of your selected project.</p>
            </header>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {projectData.stats.map(card => <StatCard key={card.key} {...card} />)}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Cost vs Budget Chart */}
                <div className="lg:col-span-2 bg-brand-secondary p-6 rounded-lg shadow-lg border border-brand-border">
                    <h3 className="text-lg font-semibold text-brand-text-light mb-4">Cost vs. Budget Overview</h3>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <BarChart data={projectData.chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.2} stroke="#8892B0" />
                                <XAxis dataKey="name" tick={{fill: '#8892B0', fontSize: 12}} />
                                <YAxis tick={{fill: '#8892B0', fontSize: 12}} tickFormatter={(value) => `$${Number(value)/1000}k`}/>
                                <Tooltip 
                                    cursor={{fill: 'rgba(255, 193, 7, 0.1)'}}
                                    contentStyle={{ 
                                        backgroundColor: 'rgba(10, 25, 47, 0.8)', 
                                        borderColor: '#303C55',
                                        color: '#CCD6F6'
                                    }}
                                />
                                <Legend wrapperStyle={{fontSize: "14px", color: '#CCD6F6'}}/>
                                <Bar dataKey="Cost" fill="#1976D2" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Budget" fill="#FFC107" radius={[4, 4, 0, 0]}/>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* AI Insights */}
                <div className="bg-brand-secondary p-6 rounded-lg shadow-lg border border-brand-border">
                    <h3 className="text-lg font-semibold text-brand-text-light mb-4">AI-Powered Insights</h3>
                    <ul className="space-y-4">
                       {projectData.insights.map((insight, index) => (
                         <li key={index} className="flex items-start">
                            <AlertIcon className={`h-5 w-5 mr-3 mt-0.5 flex-shrink-0 ${insight.level === 'High' ? 'text-red-500' : insight.level === 'Medium' ? 'text-yellow-500' : 'text-blue-500'}`} />
                            <p className="text-sm text-brand-text-medium">{insight.text}</p>
                         </li>
                       ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;