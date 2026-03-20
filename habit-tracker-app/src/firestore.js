import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  addDoc
} from "firebase/firestore";

import { db } from "./firebase";

export const createUserProfile = async (uid, { email, displayName }) => {
  const userRef = doc(db, "users", uid);
  await setDoc(
    userRef,
    {
      email: email || null,
      displayName: displayName || null,
      createdAt: serverTimestamp()
    },
    { merge: true }
  );

  return userRef;
};

export const getUserProfile = async (uid) => {
  const userRef = doc(db, "users", uid);
  const snapshot = await getDoc(userRef);
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
};

// Create Habits
export const createHabit = async (uid, habit) => {
  const habitsRef = collection(db, "users", uid, "habits");
  const habitDoc = {
    name: habit.name,
    description: habit.description || "",
    color: habit.color || "#000000",
    emoji: habit.emoji || "📝",
    type: habit.type || "General",
    goal: habit.goal || { value: 1, unit: "minute", taskDays: "Everyday", period: "Day", daysSelected: [], numOfDays: 0},
    reminder: habit.reminder || { activated: false, time: "", message: "" },
    priority: habit.priority || "none",
    startDate: habit.startDate || null,
    endDate: habit.endDate || null,
    isActive: habit.isActive ?? true,
    streak: 0,
    lastCompletedDate: null,
    completions: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  const docRef = await addDoc(habitsRef, habitDoc);
  return docRef;
};

// Hanndle Saving Habit when editing from the habit card
export const handleSaveHabit = async (user, updatedHabit) => {
  console.log("user:", user);
  console.log("editedHabit:", updatedHabit);
  console.log("editedHabit.id:", updatedHabit?.id);
  try {
    console.log("updatedHabit.id:", updatedHabit.id);
    const habitRef = doc(db, "users", user.uid, "habits", updatedHabit.id);

    await updateDoc(habitRef, {
      name: updatedHabit.name,
      description: updatedHabit.description || "",
      color: updatedHabit.color || "#000000",
      emoji: updatedHabit.emoji || "📝",
      type: updatedHabit.type || "General",
      goal: updatedHabit.goal || { value: 1, unit: "minute", taskDays: "Everyday", period: "Day", daysSelected: [], numOfDays: 0},
      reminder: updatedHabit.reminder || {activated: false, time: "", message: ""},
      priority: updatedHabit.priority || "none",
      startDate: updatedHabit.startDate || null,
      endDate: updatedHabit.endDate || null,
      isActive: updatedHabit.isActive ?? true,
      // Preserve streak data
      streak: updatedHabit.streak ?? 0,
      completions: updatedHabit.completions ?? [],
      lastCompletedDate: updatedHabit.lastCompletedDate ?? null,
    });

    // setHabits((prev) =>
    //   prev.map((habit) =>
    //     habit.id === updatedHabit.id ? updatedHabit : habit
    //   )
    // );

    // setShowEditPopup(false);
    // setEditingHabit(null);
  } catch (error) {
    console.error("Failed to update habit:", error);
  }
}

export const listHabits = async (uid) => {
  const habitsRef = collection(db, "users", uid, "habits");
  const habitsQuery = query(habitsRef, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(habitsQuery);

  return snapshot.docs.map((docItem) => ({
    id: docItem.id,
    ...docItem.data()
  }));
};

export const updateHabit = async (uid, habitId, updates) => {
  const habitRef = doc(db, "users", uid, "habits", habitId);
  await updateDoc(habitRef, {
    ...updates,
    updatedAt: serverTimestamp()
  });
};

export const deleteHabit = async (uid, habitId) => {
  const habitRef = doc(db, "users", uid, "habits", habitId);
  await deleteDoc(habitRef);
};


export const exportHabits = async (uid) => {
  const habitsRef = collection(db, "users", uid, "habits");
  
  try {
    const q = query(habitsRef);
    const querySnapshot = await getDocs(q);
    
    const habitsData = [];
    querySnapshot.forEach((doc) => {
      habitsData.push({ id: doc.id, ...doc.data() });
    });

    if (habitsData.length === 0) {
      console.log("No habits found");
      return;
    }

    const headers = Object.keys(habitsData[0]);
    const csvRows = [];
    csvRows.push(headers.join(',')); // make headers row

    for (const row of habitsData) {
      const values = headers.map(header => {
        let val = row[header];

        // checks if the value is a firestore timestamp object
        if (val && typeof val.toDate === 'function') {
          const date = val.toDate();
      
          //this is for formating the data to match the date format that firestore uses
          val = new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
            timeZoneName: 'shortOffset' // this is for the "UTC-6" part of the date
          }).format(date).replace(',', ' at'); 
        }

        // cleans up any quotes or whitespaces in data
        const stringVal = val === null || val === undefined ? "" : String(val);
        const escaped = stringVal.replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    }
    const csvString = csvRows.join('\n');
    
    //DOWNLOAD TRIGGERED HERE
    downloadCSV(csvString, 'habits.csv');
    console.log("Habits exported successfully!");

  } catch (error) {
    console.error("Error exporting habits:", error);
  }

};

export const downloadCSV = async(csv, filename) => {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Helper function to get today's date in YYYY-MM-DD format
const getTodayDate = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

// Calculate streak based on completion history
export const calculateStreak = (completions) => {
  if (!completions || completions.length === 0) return 0;

  // Sort completions by date (most recent first)
  const sortedDates = [...completions].sort((a, b) => new Date(b) - new Date(a));

  const today = getTodayDate();
  const mostRecent = sortedDates[0];
  const daysSinceLast = Math.floor(
    (new Date(today) - new Date(mostRecent)) / (1000 * 60 * 60 * 24)
  );

  if (daysSinceLast > 1) return 0;

  let streak = 1;
  let prevDate = new Date(mostRecent);
  prevDate.setHours(0, 0, 0, 0);

  for (let i = 1; i < sortedDates.length; i++) {
    const current = new Date(sortedDates[i]);
    current.setHours(0, 0, 0, 0);

    const expectedPrev = new Date(prevDate);
    expectedPrev.setDate(expectedPrev.getDate() - 1);

    if (current.getTime() === expectedPrev.getTime()) {
      streak++;
      prevDate = current;
    } else {
      break; // Gap found, streak ends
    }
  }

  return streak;
};

// Toggle habit completion for today
export const toggleHabitCompletion = async (uid, habitId) => {
  const habitRef = doc(db, "users", uid, "habits", habitId);
  const habitDoc = await getDoc(habitRef);
  
  if (!habitDoc.exists()) {
    throw new Error("Habit not found");
  }
  
  const habitData = habitDoc.data();
  const today = getTodayDate();
  const completions = habitData.completions || [];
  
  let updatedCompletions;
  let isCompleted;
  
  if (completions.includes(today)) {
    updatedCompletions = completions.filter(date => date !== today);
    isCompleted = false;
  } else {
    updatedCompletions = [...completions, today];
    isCompleted = true;
  }
  
  const newStreak = calculateStreak(updatedCompletions);
  
  // Update habit document
  await updateDoc(habitRef, {
    completions: updatedCompletions,
    streak: newStreak,
    lastCompletedDate: isCompleted ? today : (updatedCompletions.length > 0 ? updatedCompletions[updatedCompletions.length - 1] : null),
    updatedAt: serverTimestamp()
  });
  
  return { isCompleted, streak: newStreak };
};

export const isHabitCompletedToday = (habit) => {
  const today = getTodayDate();
  return habit.completions?.includes(today) ?? false;
};