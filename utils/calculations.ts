import { WeightEntry, Stats, User } from '../types';

export const calculateBMI = (weightKg: number, heightCm?: number): number => {
  if (!heightCm || heightCm <= 0) return 0;
  const heightM = heightCm / 100;
  return parseFloat((weightKg / (heightM * heightM)).toFixed(1));
};

export const getBMICategory = (bmi: number): { label: string; color: string } => {
  if (bmi === 0) return { label: 'N/A', color: 'text-gray-400' };
  if (bmi < 18.5) return { label: 'Underweight', color: 'text-blue-500' };
  if (bmi < 25) return { label: 'Healthy Weight', color: 'text-green-500' };
  if (bmi < 30) return { label: 'Overweight', color: 'text-yellow-500' };
  return { label: 'Obese', color: 'text-red-500' };
};

export const generateStats = (entries: WeightEntry[], user: User): Stats => {
  if (entries.length === 0) {
    return {
      current: 0,
      start: 0,
      change: 0,
      bmi: 0,
      weeklyAvg: 0,
      monthlyAvg: 0,
      goalProgress: null,
    };
  }

  // Ensure sorted by date
  const sorted = [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  const currentEntry = sorted[sorted.length - 1];
  const startEntry = sorted[0];
  
  const current = currentEntry.weight_kg;
  const start = startEntry.weight_kg;
  const change = parseFloat((current - start).toFixed(2));
  const bmi = calculateBMI(current, user.height_cm);

  // Time calculations
  const oneWeek = 7 * 24 * 60 * 60 * 1000;
  const oneMonth = 30 * 24 * 60 * 60 * 1000;
  
  const totalTime = new Date(currentEntry.date).getTime() - new Date(startEntry.date).getTime();
  const weeks = Math.max(1, totalTime / oneWeek);
  const months = Math.max(1, totalTime / oneMonth);

  const weeklyAvg = parseFloat((change / weeks).toFixed(2));
  const monthlyAvg = parseFloat((change / months).toFixed(2));

  let goalProgress = null;
  if (user.target_weight) {
    const totalToLose = start - user.target_weight;
    const currentLost = start - current;
    // Prevent division by zero or weird stats if gaining weight was the goal
    if (Math.abs(totalToLose) > 0) {
      goalProgress = Math.min(100, Math.max(0, (currentLost / totalToLose) * 100));
    }
  }

  return {
    current,
    start,
    change,
    bmi,
    weeklyAvg,
    monthlyAvg,
    goalProgress
  };
};

export const generateInsights = (stats: Stats, user: User, entries: WeightEntry[]): string[] => {
  const insights: string[] = [];
  if (entries.length < 3) return ["Keep logging daily to unlock insights!"];

  if (stats.change < 0) {
    insights.push(`Great job! You've lost ${Math.abs(stats.change)}kg so far.`);
    if (stats.weeklyAvg < -0.5) {
      insights.push("You are losing weight at a rapid pace (>0.5kg/week). Ensure you're staying hydrated.");
    } else if (stats.weeklyAvg < 0) {
      insights.push("You have a sustainable weekly loss rate.");
    }
  } else if (stats.change > 0) {
    insights.push(`You have gained ${stats.change}kg since starting.`);
  } else {
    insights.push("Your weight is stable.");
  }

  if (user.target_weight) {
    const diff = stats.current - user.target_weight;
    if (Math.abs(diff) < 1) {
      insights.push("You are very close to your goal!");
    } else if (stats.weeklyAvg < 0 && diff > 0) {
      const weeksLeft = Math.abs(diff / stats.weeklyAvg);
      insights.push(`At this rate, you could reach your goal in ~${Math.ceil(weeksLeft)} weeks.`);
    }
  }

  return insights;
};