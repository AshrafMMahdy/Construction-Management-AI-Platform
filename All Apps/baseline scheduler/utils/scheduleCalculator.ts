
import { GanttActivity, Activity, ParsedPredecessor, DependencyType } from '../types';

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