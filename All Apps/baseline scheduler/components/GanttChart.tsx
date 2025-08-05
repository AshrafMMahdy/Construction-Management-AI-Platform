
import React, { useLayoutEffect, useRef, useState, useMemo } from 'react';
import { GanttActivity } from '../types';
import { parsePredecessorsString } from '../utils/scheduleCalculator';

const formatDate = (date: Date) => date.toISOString().split('T')[0];
const getCalendarDaysDifference = (d1: Date, d2: Date) => {
    return Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
};

const GanttChart: React.FC<{ activities: GanttActivity[] }> = ({ activities }) => {
    const ganttContainerRef = useRef<HTMLDivElement>(null);
    const taskBarRefs = useRef<Record<number, HTMLDivElement | null>>({});
    const [connectorLines, setConnectorLines] = useState<React.ReactNode[]>([]);

    const { projectStartDate, projectEndDate, totalDays } = useMemo(() => {
        if (!activities || activities.length === 0) {
            const today = new Date();
            return { projectStartDate: today, projectEndDate: today, totalDays: 1 };
        }
        const startDates = activities.map(a => a.startDate);
        const endDates = activities.map(a => a.endDate);

        const minDate = new Date(Math.min(...startDates.map(d => d.getTime())));
        const maxDate = new Date(Math.max(...endDates.map(d => d.getTime())));
        
        minDate.setDate(minDate.getDate() - 2);
        maxDate.setDate(maxDate.getDate() + 7);

        const totalDays = getCalendarDaysDifference(minDate, maxDate) || 1;
        return { projectStartDate: minDate, projectEndDate: maxDate, totalDays };
    }, [activities]);

    const timelineHeader = useMemo(() => {
        const months = [];
        let currentDate = new Date(projectStartDate.getTime());
        while (currentDate <= projectEndDate) {
            const monthName = currentDate.toLocaleString('default', { month: 'short' });
            const year = currentDate.getFullYear();
            
            const tempNextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
            const endOfMonth = new Date(tempNextMonth.getTime() - 1);
            
            const start = currentDate > projectStartDate ? currentDate : projectStartDate;
            const end = endOfMonth < projectEndDate ? endOfMonth : projectEndDate;

            const width = (getCalendarDaysDifference(start, end) + 1) / totalDays * 100;
            
            months.push(
                <div key={`${monthName}-${year}`} style={{ width: `${width}%` }} className="flex-shrink-0 text-center border-r border-brand-muted/20">
                    <div className="font-semibold text-brand-light text-xs pt-1">{monthName} {year}</div>
                </div>
            );
            currentDate = tempNextMonth;
        }
        return months;
    }, [projectStartDate, projectEndDate, totalDays]);

    useLayoutEffect(() => {
        if (!ganttContainerRef.current || activities.length === 0) return;

        const containerRect = ganttContainerRef.current.getBoundingClientRect();
        const newLines: React.ReactNode[] = [];

        activities.forEach(activity => {
            const predecessors = parsePredecessorsString(activity.predecessors);
            const successorBar = taskBarRefs.current[activity.id];
            if (!successorBar) return;

            predecessors.forEach((pred) => {
                const predecessorBar = taskBarRefs.current[pred.id];
                if (!predecessorBar) return;

                const successorRect = successorBar.getBoundingClientRect();
                const predecessorRect = predecessorBar.getBoundingClientRect();
                
                const startX = predecessorRect.right - containerRect.left;
                const startY = predecessorRect.top - containerRect.top + predecessorRect.height / 2;
                
                const endX = successorRect.left - containerRect.left;
                const endY = successorRect.top - containerRect.top + successorRect.height / 2;
                
                const midX = startX + Math.max(10, (endX - startX) / 4);

                const pathData = (endX > startX + 5) 
                    ? `M ${startX} ${startY} L ${midX} ${startY} L ${midX} ${endY} L ${endX} ${endY}`
                    : `M ${startX} ${startY} L ${startX+10} ${startY} L ${startX+10} ${endY-10} L ${endX-10} ${endY-10} L ${endX-10} ${endY} L ${endX} ${endY}`;


                newLines.push(
                    <g key={`${pred.id}-${activity.id}`}>
                        <path d={pathData} stroke="#FFB703" strokeOpacity="0.7" strokeWidth="1.5" fill="none" />
                        <path d={`M ${endX-5} ${endY-3} L ${endX} ${endY} L ${endX-5} ${endY+3}`} stroke="#FFB703" strokeOpacity="0.7" strokeWidth="1.5" fill="none"/>
                    </g>
                );
            });
        });
        setConnectorLines(newLines);

    }, [activities, totalDays]);
    
    const ganttHeight = activities.length * 40;

    return (
        <div className="bg-brand-secondary rounded-lg shadow-lg text-brand-light w-full overflow-x-auto">
            <div className="relative" style={{ width: '100%', minWidth: '800px', height: `${ganttHeight + 30}px`}}>
                {/* Headers */}
                <div className="sticky top-0 z-10 flex h-[30px] bg-brand-secondary">
                    <div className="w-[250px] flex-shrink-0 font-bold text-brand-accent p-1 border-r border-b border-brand-muted/50">Activity</div>
                    <div className="flex-grow border-b border-brand-muted/50 flex">{timelineHeader}</div>
                </div>

                {/* Grid */}
                <div className="relative w-full" style={{height: `${ganttHeight}px`}}>
                    {/* Background Grid Lines */}
                    <div className="absolute top-0 left-[250px] right-0 bottom-0">
                         {[...Array(Math.floor(totalDays))].map((_, i) => (
                            <div key={i} className="absolute top-0 bottom-0 border-l border-brand-muted/10" style={{ left: `${(i / totalDays) * 100}%` }}></div>
                        ))}
                    </div>

                    {/* Task Rows */}
                    {activities.map((activity, index) => {
                        const top = index * 40;
                        const left = (getCalendarDaysDifference(projectStartDate, activity.startDate) / totalDays) * 100;
                        const durationDays = getCalendarDaysDifference(activity.startDate, activity.endDate) + 1;
                        const width = (durationDays / totalDays) * 100;

                        return(
                            <div key={activity.id} className="absolute w-full flex border-b border-brand-muted/10" style={{ top: `${top}px`, height: '40px' }}>
                                <div className="w-[250px] flex-shrink-0 p-2 border-r border-brand-muted/10 text-sm truncate" title={activity.name}>{activity.name}</div>
                                <div className="flex-grow relative">
                                    <div 
                                        ref={el => { if(el) { taskBarRefs.current[activity.id] = el } }}
                                        className="absolute h-6 top-[7px] bg-brand-accent/70 rounded flex items-center px-2 text-xs text-brand-primary font-semibold truncate hover:bg-brand-accent"
                                        style={{ left: `${left}%`, width: `max(0.5%, ${width}%)` }}
                                        title={`${activity.name}\nStart: ${formatDate(activity.startDate)}\nEnd: ${formatDate(activity.endDate)}\nDuration: ${activity.duration} days`}
                                    >
                                        {/* Name removed from bar for cleaner look */}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                     {/* SVG overlay for connectors */}
                    <div ref={ganttContainerRef} className="absolute top-0 left-0 w-full h-full">
                        <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
                            {connectorLines}
                        </svg>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GanttChart;