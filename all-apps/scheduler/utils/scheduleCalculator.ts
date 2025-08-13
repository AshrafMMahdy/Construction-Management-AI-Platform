
import { GanttActivity, Activity, ParsedPredecessor, DependencyType, ChartData, ChartDataPoint } from '../types';

function addWorkdays(startDate: Date, days: number): Date {
  const newDate = new Date(startDate.getTime());
  let addedDays = 0;

  // No movement for 0 or negative days
  if (days <= 0) return newDate;

  while(addedDays < days) {
    newDate.setDate(newDate.getDate() + 1);
    if(newDate.getDay() !== 0 && newDate.getDay() !== 6) {
        addedDays++;
    }
  }
  return newDate;
}

function subtractWorkdays(startDate: Date, days: number): Date {
    const newDate = new Date(startDate.getTime());
    let subtractedDays = 0;

    if (days <= 0) return newDate;

    while(subtractedDays < days) {
        newDate.setDate(newDate.getDate() - 1);
        if(newDate.getDay() !== 0 && newDate.getDay() !== 6) {
            subtractedDays++;
        }
    }
    return newDate;
}

export function countWorkdays(startDate: Date, endDate: Date): number {
    let count = 0;
    const curDate = new Date(startDate.getTime());
    if (curDate > endDate) return 0;
    
    while (curDate <= endDate) {
        const dayOfWeek = curDate.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday or Saturday
            count++;
        }
        curDate.setDate(curDate.getDate() + 1);
    }
    return count;
};

export function parsePredecessorsString(predecessorsStr: string): ParsedPredecessor[] {
  if (!predecessorsStr || predecessorsStr.trim() === '—' || predecessorsStr.trim() === '') return [];

  const parts = predecessorsStr.split(',');
  const results: ParsedPredecessor[] = [];

  const regex = /(\d+)\s*(FS|SS|FF|SF)?\s*([+-]\d+)?/;

  for (const part of parts) {
    const match = part.trim().match(regex);
    if (match) {
      const id = parseInt(match[1], 10);
      const type = (match[2] as DependencyType) || 'FS';
      const lag = match[3] ? parseInt(match[3], 10) : 0;
      results.push({ id, type, lag });
    } else {
        const idOnlyMatch = part.trim().match(/^\d+$/);
        if (idOnlyMatch) {
            results.push({ id: parseInt(idOnlyMatch[0], 10), type: 'FS', lag: 0 });
        }
    }
  }
  return results;
}

export function calculateScheduleWithMetrics(activities: Activity[], projectStartDateStr: string): GanttActivity[] {
    if (!activities || activities.length === 0) return [];

    const activityMap = new Map<number, GanttActivity>();
    activities.forEach(act => {
        activityMap.set(act.id, {
            ...act,
            startDate: new Date(0), // Early Start (ES)
            endDate: new Date(0),   // Early Finish (EF)
            totalFloat: Infinity,
            isCritical: false,
        });
    });

    const projectStartDate = new Date(projectStartDateStr + 'T00:00:00');
    while (projectStartDate.getDay() === 0 || projectStartDate.getDay() === 6) {
        projectStartDate.setDate(projectStartDate.getDate() + 1);
    }

    // --- FORWARD PASS ---
    let changed = true;
    let iteration = 0;
    const MAX_ITERATIONS = activities.length * activities.length;

    while(changed && iteration < MAX_ITERATIONS) {
        changed = false;
        iteration++;

        for (const activity of activityMap.values()) {
            let earliestStartDate = new Date(projectStartDate.getTime());

            const predecessors = parsePredecessorsString(activity.predecessors);
            if (predecessors.length > 0) {
                 for (const predInfo of predecessors) {
                    const predActivity = activityMap.get(predInfo.id);
                    if (predActivity && predActivity.endDate.getTime() > 0) {
                        let potentialStartDate = addWorkdays(predActivity.endDate, predInfo.lag + 1);
                         if (potentialStartDate > earliestStartDate) {
                            earliestStartDate = potentialStartDate;
                        }
                    }
                }
            }
            
            const newStartDate = new Date(earliestStartDate.getTime());
            // Duration of 1 means start and end on same day.
            const newEndDate = activity.duration > 0 ? addWorkdays(newStartDate, activity.duration - 1) : newStartDate;

            if (activity.startDate.getTime() !== newStartDate.getTime() || activity.endDate.getTime() !== newEndDate.getTime()) {
                activity.startDate = newStartDate;
                activity.endDate = newEndDate;
                changed = true;
            }
        }
    }
    
    if (iteration >= MAX_ITERATIONS) {
        console.warn("Schedule calculation (Forward Pass) reached max iterations. Possible cyclic dependency.");
    }
    
    // --- BACKWARD PASS ---
    const allActivities = Array.from(activityMap.values());
    const lateFinishMap = new Map<number, Date>();
    
    const overallProjectEndDate = new Date(Math.max(...allActivities.map(a => a.endDate.getTime())));

    allActivities.forEach(a => lateFinishMap.set(a.id, new Date(overallProjectEndDate.getTime())));
    
    const successorsMap = new Map<number, number[]>();
    allActivities.forEach(a => successorsMap.set(a.id, []));
    allActivities.forEach(a => {
        parsePredecessorsString(a.predecessors).forEach(p => {
            if(successorsMap.has(p.id)) successorsMap.get(p.id)!.push(a.id);
        });
    });

    const sortedForBackwardPass = [...allActivities].sort((a,b) => b.startDate.getTime() - a.startDate.getTime());
    
    changed = true;
    iteration = 0;
    while(changed && iteration < MAX_ITERATIONS) {
        changed = false;
        iteration++;
        for(const activity of sortedForBackwardPass) {
            const successors = successorsMap.get(activity.id) || [];
            if (successors.length > 0) {
                const potentialLateFinishes: Date[] = [];
                for(const succId of successors) {
                    const succActivity = activityMap.get(succId)!;
                    const succLateFinish = lateFinishMap.get(succId)!;
                    const succLateStart = subtractWorkdays(succLateFinish, succActivity.duration > 0 ? succActivity.duration - 1 : 0);
                    
                    const predInfoForSucc = parsePredecessorsString(succActivity.predecessors).find(p => p.id === activity.id)!;
                    
                    let potentialLF = subtractWorkdays(succLateStart, predInfoForSucc.lag + 1);
                    potentialLateFinishes.push(potentialLF);
                }
                const newLateFinish = new Date(Math.min(...potentialLateFinishes.map(d => d.getTime())));
                const currentLateFinish = lateFinishMap.get(activity.id)!;
                if (newLateFinish < currentLateFinish) {
                    lateFinishMap.set(activity.id, newLateFinish);
                    changed = true;
                }
            }
        }
    }
    
    // --- CALCULATE FLOAT and set isCritical ---
    for (const activity of activityMap.values()) {
        const earlyFinish = activity.endDate;
        const lateFinish = lateFinishMap.get(activity.id)!;
        
        const totalFloat = countWorkdays(earlyFinish, lateFinish) - (earlyFinish > lateFinish ? 0 : 1);
        
        activity.totalFloat = Math.max(0, totalFloat);
        activity.isCritical = activity.totalFloat <= 0;
    }

    return allActivities.sort((a,b) => a.startDate.getTime() - b.startDate.getTime() || a.id - b.id);
}

// --- CHART DATA CALCULATION ---

const parseCurrency = (value: string | null | undefined): number => {
    if (!value) return 0;
    // Remove currency symbols, thousands separators, and trim whitespace
    const cleaned = String(value).replace(/[€$,\s]/g, '');
    return parseFloat(cleaned) || 0;
};


export function calculateChartData(activities: GanttActivity[]): ChartData {
    const emptyData: ChartData = {
        costSCurve: [],
        resourceSCurve: [],
        resourceDistribution: []
    };
    if (!activities || activities.length === 0) return emptyData;
    
    const validActivities = activities.filter(a => a.startDate.getTime() > 0 && a.endDate.getTime() > 0);
    if(validActivities.length === 0) return emptyData;

    const projectStart = new Date(Math.min(...validActivities.map(a => a.startDate.getTime())));
    const projectEnd = new Date(Math.max(...validActivities.map(a => a.endDate.getTime())));

    // --- 1. Cost S-Curve (Monthly) ---
    const monthlyCosts: { [key: string]: number } = {};
    for (const activity of validActivities) {
        const cost = parseCurrency(activity.packageCost);
        if (cost > 0) {
            // Attribute cost to the month the activity ends
            const endMonth = activity.endDate.toLocaleString('default', { month: 'short', year: 'numeric' });
            monthlyCosts[endMonth] = (monthlyCosts[endMonth] || 0) + cost;
        }
    }
    
    const costSCurve: ChartDataPoint[] = [];
    let cumulativeCost = 0;
    const sortedMonths = Object.keys(monthlyCosts).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    
    for (const month of sortedMonths) {
        cumulativeCost += monthlyCosts[month];
        costSCurve.push({ label: month, value: cumulativeCost });
    }

    // --- 2. & 3. Resource Curves (Weekly) ---
    const weeklyResources: { [key: string]: number } = {};
    let currentWeekStart = new Date(projectStart);
    // Align to start of the week (Monday)
    const dayOfWeek = currentWeekStart.getDay();
    const diff = currentWeekStart.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // adjust when day is sunday
    currentWeekStart.setDate(diff);


    let weekCounter = 1;
    while(currentWeekStart <= projectEnd) {
        const currentWeekEnd = new Date(currentWeekStart);
        currentWeekEnd.setDate(currentWeekEnd.getDate() + 6);
        
        let totalCrewsThisWeek = 0;
        for (const activity of validActivities) {
            // Check for overlap between activity duration and the current week
            const activityStartsBeforeWeekEnds = activity.startDate <= currentWeekEnd;
            const activityEndsAfterWeekStarts = activity.endDate >= currentWeekStart;
            if (activityStartsBeforeWeekEnds && activityEndsAfterWeekStarts) {
                totalCrewsThisWeek += activity.numberOfCrews || 0;
            }
        }
        
        const weekLabel = `W${weekCounter}`;
        weeklyResources[weekLabel] = totalCrewsThisWeek;

        currentWeekStart.setDate(currentWeekStart.getDate() + 7);
        weekCounter++;
    }

    const resourceDistribution: ChartDataPoint[] = Object.entries(weeklyResources).map(([label, value]) => ({ label, value }));
    
    const resourceSCurve: ChartDataPoint[] = [];
    let cumulativeResources = 0;
    for(const point of resourceDistribution) {
        cumulativeResources += point.value;
        resourceSCurve.push({ label: point.label, value: cumulativeResources });
    }

    return {
        costSCurve,
        resourceSCurve,
        resourceDistribution
    };
}
