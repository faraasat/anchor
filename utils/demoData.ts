// Rich Demo Data for Anchor App
import { Reminder } from '@/types/reminder';

export const DEMO_REMINDERS: Reminder[] = [
  // Today - Morning
  {
    id: 'demo-1',
    title: 'Morning Meditation',
    description: 'Start the day with 10 minutes of mindfulness',
    dueDate: new Date().toISOString().split('T')[0],
    dueTime: '07:00',
    tag: 'Health',
    status: 'completed',
    priority: "medium",
    recurrence: { type: 'daily' },
    isRecurring: true,
    completedAt: new Date(new Date().setHours(7, 15, 0, 0)).toISOString(),
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'demo-2',
    title: 'Take vitamins',
    dueDate: new Date().toISOString().split('T')[0],
    dueTime: '08:00',
    tag: 'Health',
    status: 'completed',
    priority: "medium",
    recurrence: { type: 'daily' },
    isRecurring: true,
    completedAt: new Date(new Date().setHours(8, 5, 0, 0)).toISOString(),
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // Today - Work Hours
  {
    id: 'demo-3',
    title: 'Team Standup Meeting',
    description: 'Daily sync with the development team',
    dueDate: new Date().toISOString().split('T')[0],
    dueTime: '09:30',
    tag: 'Work',
    status: 'completed',
    priority: "medium",
    recurrence: { type: 'specific_days', daysOfWeek: [1, 2, 3, 4, 5] },
    isRecurring: true,
    completedAt: new Date(new Date().setHours(9, 45, 0, 0)).toISOString(),
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'demo-4',
    title: 'Review Pull Requests',
    description: 'Code review for the authentication feature',
    dueDate: new Date().toISOString().split('T')[0],
    dueTime: '10:30',
    tag: 'Work',
    status: 'pending',
    priority: "medium",
    recurrence: { type: 'none' },
    isRecurring: false,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'demo-5',
    title: 'Client Presentation Prep',
    description: 'Prepare slides for Q1 review meeting',
    dueDate: new Date().toISOString().split('T')[0],
    dueTime: '14:00',
    tag: 'Work',
    status: 'pending',
    priority: "medium",
    recurrence: { type: 'none' },
    isRecurring: false,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'demo-6',
    title: 'Update Project Documentation',
    dueDate: new Date().toISOString().split('T')[0],
    dueTime: '16:00',
    tag: 'Work',
    status: 'pending',
    priority: "medium",
    recurrence: { type: 'weekly', daysOfWeek: [5] },
    isRecurring: true,
    createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // Today - Personal
  {
    id: 'demo-7',
    title: 'Call Mom',
    description: 'Weekly check-in call',
    dueDate: new Date().toISOString().split('T')[0],
    dueTime: '18:00',
    tag: 'Personal',
    status: 'pending',
    priority: "medium",
    recurrence: { type: 'weekly', daysOfWeek: [0] },
    isRecurring: true,
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'demo-8',
    title: 'Gym Workout',
    description: 'Leg day - squats and deadlifts',
    dueDate: new Date().toISOString().split('T')[0],
    dueTime: '18:30',
    tag: 'Health',
    status: 'pending',
    priority: "medium",
    recurrence: { type: 'specific_days', daysOfWeek: [1, 3, 5] },
    isRecurring: true,
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // Tomorrow
  {
    id: 'demo-9',
    title: 'Grocery Shopping',
    description: 'Milk, eggs, bread, vegetables, chicken',
    dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    dueTime: '10:00',
    tag: 'Errands',
    status: 'pending',
    priority: "medium",
    recurrence: { type: 'weekly', daysOfWeek: [6] },
    isRecurring: true,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'demo-10',
    title: 'Dentist Appointment',
    description: 'Regular checkup and cleaning',
    dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    dueTime: '14:30',
    tag: 'Health',
    status: 'pending',
    priority: "medium",
    recurrence: { type: 'none' },
    isRecurring: false,
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // This Week
  {
    id: 'demo-11',
    title: 'Pay Credit Card Bill',
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    dueTime: '23:59',
    tag: 'Finance',
    status: 'pending',
    priority: "medium",
    recurrence: { type: 'monthly', dayOfMonth: 15 },
    isRecurring: true,
    createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'demo-12',
    title: 'Water Plants',
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    dueTime: '09:00',
    tag: 'Home',
    status: 'pending',
    priority: "medium",
    recurrence: { type: 'custom_days', interval: 3 },
    isRecurring: true,
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'demo-13',
    title: 'Book Club Meeting',
    description: 'Discussing "Atomic Habits" by James Clear',
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    dueTime: '19:00',
    tag: 'Social',
    status: 'pending',
    priority: "medium",
    recurrence: { type: 'monthly', dayOfMonth: 10 },
    isRecurring: true,
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'demo-14',
    title: 'Clean Kitchen',
    dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    dueTime: '11:00',
    tag: 'Home',
    status: 'pending',
    priority: "medium",
    recurrence: { type: 'weekly', daysOfWeek: [0, 3] },
    isRecurring: true,
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'demo-15',
    title: 'Submit Expense Report',
    description: 'Q1 business travel expenses',
    dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    dueTime: '17:00',
    tag: 'Work',
    status: 'pending',
    priority: "medium",
    recurrence: { type: 'none' },
    isRecurring: false,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'demo-16',
    title: 'Evening Stretch',
    description: '15 minutes of yoga and stretching',
    dueDate: new Date().toISOString().split('T')[0],
    dueTime: '20:00',
    tag: 'Health',
    status: 'pending',
    priority: "medium",
    recurrence: { type: 'daily' },
    isRecurring: true,
    createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'demo-17',
    title: 'Review Budget',
    description: 'Monthly budget review and adjustments',
    dueDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    dueTime: '19:30',
    tag: 'Finance',
    status: 'pending',
    priority: "medium",
    recurrence: { type: 'monthly', dayOfMonth: 1 },
    isRecurring: true,
    createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'demo-18',
    title: 'Car Service Appointment',
    description: 'Oil change and tire rotation',
    dueDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    dueTime: '10:00',
    tag: 'Errands',
    status: 'pending',
    priority: "medium",
    recurrence: { type: 'none' },
    isRecurring: false,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'demo-19',
    title: 'Team Happy Hour',
    description: 'Friday team gathering at The Local',
    dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    dueTime: '17:30',
    tag: 'Social',
    status: 'pending',
    priority: "medium",
    recurrence: { type: 'none' },
    isRecurring: false,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'demo-20',
    title: 'Laundry Day',
    dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    dueTime: '15:00',
    tag: 'Home',
    status: 'pending',
    priority: "medium",
    recurrence: { type: 'weekly', daysOfWeek: [6] },
    isRecurring: true,
    createdAt: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'demo-21',
    title: 'Board Meeting Prep',
    description: 'Prepare quarterly presentation slides',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    dueTime: '09:00',
    tag: 'Work',
    status: 'pending',
    priority: "medium",
    recurrence: { type: 'none' },
    isRecurring: false,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'demo-22',
    title: 'Pharmacy Pickup',
    description: 'Pick up prescription refills',
    dueDate: new Date().toISOString().split('T')[0],
    dueTime: '13:00',
    tag: 'Errands',
    status: 'pending',
    priority: "medium",
    recurrence: { type: 'none' },
    isRecurring: false,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'demo-23',
    title: 'Meditate',
    description: 'Evening meditation session',
    dueDate: new Date().toISOString().split('T')[0],
    dueTime: '21:30',
    tag: 'Health',
    status: 'pending',
    priority: "medium",
    recurrence: { type: 'daily' },
    isRecurring: true,
    createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'demo-24',
    title: 'Review Investment Portfolio',
    description: 'Check quarterly returns and rebalance',
    dueDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    dueTime: '20:00',
    tag: 'Finance',
    status: 'pending',
    priority: "medium",
    recurrence: { type: 'none' },
    isRecurring: false,
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'demo-25',
    title: 'Coffee with Sarah',
    description: 'Catch up at Blue Bottle Coffee',
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    dueTime: '14:30',
    tag: 'Social',
    status: 'pending',
    priority: "medium",
    recurrence: { type: 'none' },
    isRecurring: false,
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export interface DemoInsightsData {
  completionRate: {
    current: number;
    streak: number;
    weeklyData: { day: string; rate: number }[];
  };
  productivityPulse: {
    currentLevel: 'Peak' | 'High' | 'Moderate' | 'Low';
    peakHours: string[];
    dailyData: { hour: number; count: number }[];
  };
  categoryBreakdown: {
    category: string;
    count: number;
    percentage: number;
  }[];
}

export const DEMO_INSIGHTS: DemoInsightsData = {
  completionRate: {
    current: 87,
    streak: 12,
    weeklyData: [
      { day: 'Mon', rate: 85 },
      { day: 'Tue', rate: 90 },
      { day: 'Wed', rate: 82 },
      { day: 'Thu', rate: 88 },
      { day: 'Fri', rate: 91 },
      { day: 'Sat', rate: 78 },
      { day: 'Sun', rate: 95 },
    ],
  },
  productivityPulse: {
    currentLevel: 'Peak',
    peakHours: ['9-11 AM', '2-4 PM'],
    dailyData: [
      { hour: 7, count: 2 },
      { hour: 8, count: 3 },
      { hour: 9, count: 5 },
      { hour: 10, count: 6 },
      { hour: 11, count: 4 },
      { hour: 12, count: 2 },
      { hour: 13, count: 1 },
      { hour: 14, count: 4 },
      { hour: 15, count: 5 },
      { hour: 16, count: 3 },
      { hour: 17, count: 2 },
      { hour: 18, count: 3 },
    ],
  },
  categoryBreakdown: [
    { category: 'Work', count: 24, percentage: 40 },
    { category: 'Health', count: 18, percentage: 30 },
    { category: 'Personal', count: 9, percentage: 15 },
    { category: 'Home', count: 6, percentage: 10 },
    { category: 'Errands', count: 3, percentage: 5 },
  ],
};

export interface DemoWellnessData {
  pomodoro: {
    sessionsToday: number;
    focusTime: number; // minutes
    currentTimer: number | null;
  };
  water: {
    cupsToday: number;
    dailyGoal: number;
    lastDrink: string; // ISO timestamp
  };
  steps: {
    stepsToday: number;
    dailyGoal: number;
    distance: number; // km
    calories: number;
  };
}

export const DEMO_WELLNESS: DemoWellnessData = {
  pomodoro: {
    sessionsToday: 4,
    focusTime: 100, // 4 x 25 minutes
    currentTimer: null,
  },
  water: {
    cupsToday: 4,
    dailyGoal: 8,
    lastDrink: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  steps: {
    stepsToday: 6500,
    dailyGoal: 10000,
    distance: 4.8,
    calories: 245,
  },
};
