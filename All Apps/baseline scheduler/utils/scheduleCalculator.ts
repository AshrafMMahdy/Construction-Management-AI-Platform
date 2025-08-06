
import { GanttActivity, Activity, ParsedPredecessor, DependencyType } from '../types';

function addWorkdays(startDate: Date, days: number): Date {
  let currentDate = new Date(startDate.getTime());
  let addedDays = 0;
  let daysToAdd = Math.max(0, days - 1);

  if (days <= 0) return currentDate;

  while (addedDays < daysToAdd) {
    currentDate.setDate(currentDate.getDate() + 1);
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // 0=Sun, 6=Sat
      addedDays++;
    }
  }
  return currentDate;
}

export function countWorkdays(startDate: Date, endDate: Date): number {
    let count = 0;
    const curDate = new Date(startDate.getTime());
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

export function calculateScheduleForwardPass(activities: Activity[], projectStartDateStr: string): GanttActivity[] {
    if (!activities || activities.length === 0) return [];

    const activityMap = new Map<number, GanttActivity>();
    activities.forEach(act => {
        activityMap.set(act.id, {
            ...act,
            startDate: new Date(0),
            endDate: new Date(0),
        });
    });

    const projectStartDate = new Date(projectStartDateStr + 'T00:00:00');
    while (projectStartDate.getDay() === 0 || projectStartDate.getDay() === 6) {
        projectStartDate.setDate(projectStartDate.getDate() + 1);
    }

    let changed = true;
    let iteration = 0;
    const MAX_ITERATIONS = activities.length * activities.length;

    while(changed && iteration < MAX_ITERATIONS) {
        changed = false;
        iteration++;

        for (const activity of activityMap.values()) {
            let earliestStartDate = new Date(projectStartDate.getTime());

            if (activity.predecessors && activity.predecessors.trim() !== '') {
                const predecessors = parsePredecessorsString(activity.predecessors);
                for (const predInfo of predecessors) {
                    const predActivity = activityMap.get(predInfo.id);
                    if (predActivity && predActivity.endDate.getTime() > 0) {
                        
                        let potentialStartDate: Date;
                        
                        const nextWorkDay = (date: Date) => {
                            let newDate = new Date(date.getTime());
                            newDate.setDate(newDate.getDate() + 1);
                             while (newDate.getDay() === 0 || newDate.getDay() === 6) {
                                newDate.setDate(newDate.getDate() + 1);
                            }
                            return newDate;
                        };

                        switch(predInfo.type) {
                            case 'FS':
                                potentialStartDate = nextWorkDay(predActivity.endDate);
                                break;
                            case 'SS':
                                potentialStartDate = new Date(predActivity.startDate.getTime());
                                break;
                            case 'FF':
                                const finishDate = new Date(predActivity.endDate.getTime());
                                let current = new Date(finishDate.getTime());
                                let daysToSubtract = Math.max(0, activity.duration - 1);
                                let subtracted = 0;
                                while(subtracted < daysToSubtract) {
                                    current.setDate(current.getDate() - 1);
                                    if(current.getDay() !== 0 && current.getDay() !== 6) {
                                        subtracted++;
                                    }
                                }
                                potentialStartDate = current;
                                break;
                            case 'SF':
                            default:
                                potentialStartDate = nextWorkDay(predActivity.endDate);
                                break;
                        }

                        if (predInfo.lag !== 0) {
                           let lagDate = new Date(potentialStartDate.getTime());
                           if (predInfo.lag > 0) {
                             lagDate = addWorkdays(lagDate, predInfo.lag + 1);
                           } else {
                                let lagDays = Math.abs(predInfo.lag);
                                let subtracted = 0;
                                while(subtracted < lagDays) {
                                    lagDate.setDate(lagDate.getDate() - 1);
                                    if(lagDate.getDay() !== 0 && lagDate.getDay() !== 6) {
                                        subtracted++;
                                    }
                                }
                           }
                           potentialStartDate = lagDate;
                        }

                        if (potentialStartDate > earliestStartDate) {
                            earliestStartDate = potentialStartDate;
                        }
                    }
                }
            } else {
                 earliestStartDate = new Date(projectStartDate.getTime());
            }

            const newStartDate = earliestStartDate;
            const newEndDate = addWorkdays(newStartDate, activity.duration);

            if (activity.startDate.getTime() !== newStartDate.getTime() || activity.endDate.getTime() !== newEndDate.getTime()) {
                activity.startDate = newStartDate;
                activity.endDate = newEndDate;
                changed = true;
            }
        }
    }
    
    if (iteration >= MAX_ITERATIONS) {
        console.warn("Schedule calculation reached max iterations. Possible cyclic dependency.");
    }

    return Array.from(activityMap.values()).sort((a,b) => a.startDate.getTime() - b.startDate.getTime() || a.id - b.id);
}
