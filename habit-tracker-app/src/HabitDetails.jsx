import { useState, useEffect, useRef } from "react";
import { useContext } from "react";
import { AuthContext } from "./AuthContext";

import { Pencil } from 'lucide-react';
import EmojiSelect from './habitComponents/EmojiSelect';
import './index.css';
import './HabitDetails.css';
import Calendar from "./habitComponents/calendar";
import {handleSaveHabit, deleteHabit} from "./firestore";

function NameDescription({ habit, updateHabitField }) {
    return (
        <div id="habit-desc">
            <div id="habit-header">
                <div id="color-emoji-picker">
                    <div 
                        className="habit-circle"
                        style={{ backgroundColor: habit.color ?? "#b9b7b7" }}
                    >
                        <div id="habit-emoji" onClick={(e) => e.stopPropagation() } >
                            <EmojiSelect
                                value={habit.emoji}
                                onChange={(e) => updateHabitField("emoji", e)}
                            />
                        </div>
                    </div>

                    <div id="color-picker-wrapper">
                        <select 
                            name="color-picker" 
                            id="color-picker" 
                            value={habit.color ?? "#b9b7b7"}
                            onChange={ (e) => {updateHabitField("color", e.target.value)} }
                        >
                                <option value="#b9b7b7">Default</option>
                                <option value="#f8aaaa">Red</option>
                                <option value="#aaffaa">Green</option>
                                <option value="#aaaaff">Blue</option>
                                <option value="#ffffaa">Yellow</option>
                                <option value="#ffb6c1">Pink</option>
                                <option value="#ffa500">Orange</option>
                                <option value="#800080">Purple</option>
                        </select>
                    </div>
                </div>

                <input
                    type="text"
                    id="habit-name"
                    placeholder="Habit Name"
                    value={habit.name ?? ""}
                    onChange={(e) => updateHabitField("name", e.target.value)}
                />
            </div>

            <div className="line" />

            <textarea
                id="description"
                placeholder="Description"
                value={habit.description ?? ""}
                onChange={(e) => updateHabitField("description", e.target.value)}
            />
        </div>
    );
}

/*
function MilestoneSettings() {
    const [rewardEveryStreak, setRewardEveryStreak] = useState(true);
    const [rewardAfterStreakDays, setRewardAfterStreakDays] = useState(0);

    return (
        <div id="mile-settings">
            <div id="reward">
            <span> Reward after every streak? </span> <input id="reward-check" type="checkbox" checked={rewardEveryStreak}
                                                       onClick={() => {setRewardEveryStreak(!rewardEveryStreak)}}/>
            </div>
            <Line />
            
            <span id="reward-after-day-streaks"> 
                Reward coins after every {" "}
                <input id="number-input" type="number"/>
                {" "}day streaks 
            </span>
        </div>
    )
}
*/
function HabitType({ habit, updateHabitField }) {
    const habitType = habit.type ?? "Build";

    return (
        <div id="habit-type">
            <button
                type="button"
                className="habit-type-option"
                id="build-option"
                onClick={() => updateHabitField("type", "Build")}
                style={{
                    backgroundColor: habitType === "Build" ? "#5B5FB4" : "#b9b7b700",
                    color: habitType === "Build" ? "white" : "rgba(0, 0, 0, 0.25)"
                }}
            >
                Build
            </button>

            <button
                type="button"
                className="habit-type-option"
                id="quit-option"
                onClick={() => updateHabitField("type", "Quit")}
                style={{
                    backgroundColor: habitType === "Quit" ? "#5B5FB4" : "#b9b7b700",
                    color: habitType === "Quit" ? "white" : "rgba(0, 0, 0, 0.25)"
                }}
            >
                Quit
            </button>
        </div>
    );
}

function GoalInfo({ habit, updateGoalField }) {
    const daysSelected = habit.goal?.daysSelected ?? [];

    const setDaysSelected = (updater) => {
        const next = typeof updater === "function" ? updater(daysSelected) : updater;
        updateGoalField("daysSelected", next);
    }

    const setNumOfDays = (val) => updateGoalField("numOfDays", val);

    useEffect(() => {
        updateGoalField("daysSelected", []);
        updateGoalField("numOfDays", 0);
    }, [habit.goal?.taskDays]);

    function CheckBoxDay({ name, daysSelected, setDaysSelected }) {
        // Start checked by default
        const checked = daysSelected.includes(name);

        const handleToggle = () => {
            if (!checked) {
                // Logic to ADD to the array (assuming setDaysSelected is an array setter)
                setDaysSelected(prev => [...prev, name]);
            } else {
                // Logic to REMOVE from the array
                setDaysSelected(prev => prev.filter(day => day !== name));
            }
        };

        return (
            <div style={{ fontSize: "14px" }}>
                <input 
                    type="checkbox"
                    id={name}
                    name={name}
                    checked={checked}
                    // FIXED: Wrapped in an arrow function so it only runs on click
                    onChange={() => handleToggle()} 
                />
                <label htmlFor={name}>{name}</label>
            </div>
        );
    }

    function SelectTaskDays({ selectedTaskDay, daysSelected, setDaysSelected, setNumOfDays }) {
        const isError = daysSelected.length === 0;
        const [numOfDaysInput, setNumOfDaysInput] = useState(habit.goal?.numOfDays ?? "");

        return(
            <div>
                {selectedTaskDay === "specific_month_days" && (
                    <div id="task-days-select" 
                        style={{
                            marginTop: "30px",
                            backgroundColor: "transparent",
                            width: "100%",
                            height: "450px"
                         }}
                    >
                        <Calendar daysSelected={daysSelected} setDaysSelected={setDaysSelected}/>
                    </div>
                )}
                {selectedTaskDay === "specific_days" && (
                    <div >
                        <p id="days-error" 
                        style={{color: "red", fontSize: "14px", visibility: isError ? "visible" : "hidden"}}>
                            Error: Please select at least one day.
                        </p>
                        <label htmlFor='specific-days' id="specific-days" style={{fontSize: "16px"}} >
                            Choose Day(s) to accomplish the habit: </label>
                        <div id="select-day">
                            <CheckBoxDay name="Monday" daysSelected={daysSelected} setDaysSelected={setDaysSelected}/>
                            <CheckBoxDay name="Tuesday" daysSelected={daysSelected} setDaysSelected={setDaysSelected}/>
                            <CheckBoxDay name="Wednesday" daysSelected={daysSelected} setDaysSelected={setDaysSelected}/>
                            <CheckBoxDay name="Thursday" daysSelected={daysSelected} setDaysSelected={setDaysSelected}/>
                            <CheckBoxDay name="Friday" daysSelected={daysSelected} setDaysSelected={setDaysSelected}/>
                            <CheckBoxDay name="Saturday" daysSelected={daysSelected} setDaysSelected={setDaysSelected}/>
                            <CheckBoxDay name="Sunday" daysSelected={daysSelected} setDaysSelected={setDaysSelected}/>
                        </div>
                    </div>
                )}
                {selectedTaskDay === "number_days" && (
                    <div className="specific-days">
                        <label htmlFor='number-days' style={{fontSize: "16px"}}>
                            Enter the number of days per week you want to accomplish this habit: {" "}
                        </label>
                        <input 
                            type="number" 
                            id="number-days"
                            value={numOfDaysInput} 
                            onChange={(e) => setNumOfDaysInput(e.target.value)}
                            onBlur={() => { // input min max is not working for some reason
                                const val = Math.min(7, Math.max(1, Number(numOfDaysInput) || 1));
                                setNumOfDaysInput(val);
                                updateGoalField("numOfDays", val);
                            }}
                        />
                    </div>
                )}
                {selectedTaskDay === "specific_month_number" && (
                    <div className="specific-days">
                        <label htmlFor='number-month-days' style={{fontSize: "16px"}}>
                            Enter the number of days per month you want to accomplish this habit: {" "}
                        </label>
                        <input 
                            type="number" 
                            id="number-month-days" 
                            value={numOfDaysInput}
                            onChange={(e) => setNumOfDaysInput(e.target.value)}
                            onBlur={() => {
                                const val = Math.min(31, Math.max(1, Number(numOfDaysInput) || 1));
                                setNumOfDaysInput(val);
                                updateGoalField("numOfDays", val);
                            }} 
                        />
                    </div>
                )}
            </div>
        );
    } 

    return (
        <div 
            id="goal-info"
            style={{
                minHeight: 
                    habit.goal?.taskDays === "everyday" 
                    ? "195px"
                    : habit.goal?.taskDays === "specific_days"
                    ? "425px"
                    : habit.goal?.taskDays === "number_days"
                    ? "250px"
                    : habit.goal?.taskDays === "specific_month_days"
                    ? "680px"
                    : habit.goal?.taskDays === "specific_month_number"
                    ? "250px"
                    : "195px"
            }}
        >
            <div id="goal-period" >
                <label>Goal Period:</label>
                <select
                    name="period"
                    id="period"
                    value={habit.goal?.period ?? "Day"}
                    onChange={(e) => updateGoalField("period", e.target.value)}
                >
                    <option value="Day">Daily</option>
                    <option value="Week">Weekly</option>
                    <option value="Month">Monthly</option>
                </select>
            </div>

            <Line />

            <div id="goal-value">
                <span style={{ fontSize: "16px" }}>Goal Value:</span>

                <input
                    type="number"
                    id="value-input"
                    name="value"
                    min="1"
                    value={habit.goal?.value ?? 1}
                    onChange={(e) => updateGoalField("value", Number(e.target.value))}
                />

                <select
                    name="unit"
                    id="value-unit"
                    value={habit.goal?.unit ?? "steps"}
                    onChange={(e) => updateGoalField("unit", e.target.value)}
                >
                    <option value="steps">steps</option>
                    <option value="gallons">gallons</option>
                    <option value="liters">liters</option>
                    <option value="pages">pages</option>
                    <option value="hours">hours</option>
                    <option value="minutes">minutes</option>
                </select>

                <div id="goal-period-text">/ {habit.goal?.period ?? "Day"}</div>
            </div>

            <Line />

            <div id="task-days">
                <span>Task Days:</span>
                <select
                    name="task-day"
                    id="task-day"
                    style={{ fontSize: "18px", textAlign: "left" }}
                    value={habit.goal?.taskDays ?? "everyday"}
                    onChange={(e) => updateGoalField("taskDays", e.target.value)}
                >
                    <option value="everyday">Everyday</option>
                    <option value="specific_days">Specific days of the week</option>
                    <option value="number_days">Number of days per week</option>
                    <option value="specific_month_days">Specific days of the month</option>
                    <option value="specific_month_number">Number of days per month</option>
                </select>

                <SelectTaskDays 
                    selectedTaskDay={habit.goal?.taskDays}
                    daysSelected={daysSelected}
                    setDaysSelected={setDaysSelected}
                    setNumOfDays={setNumOfDays}
                />
            </div>
        </div>
    );
}

function ReminderSettings({ habit, updateReminderField }) {
    return (
        <div id="reminder-settings"
            style={{ minHeight: habit.reminder?.activated ? "160px" : "45px"}}
        >
            <div id="reminder-option">
                <span>Do you want to be reminded?</span>
                <input
                    type="checkbox"
                    id="reminder-check"
                    checked={habit.reminder?.activated ?? false}
                    onChange={(e) => updateReminderField("activated", e.target.checked)}
                />
            </div>

            <Line isItHidden={!habit.reminder?.activated}/>
            
            <div id="select-time">
                <span hidden={!habit.reminder?.activated}>Select Time:</span>
                <input 
                    type="time" 
                    id="select-time-selector"
                    hidden={!habit.reminder?.activated}
                    value={habit.reminder?.time ?? ""}
                    onChange={(e) => updateReminderField("time", e.target.value)}
                />
            </div>

            <Line isItHidden={!habit.reminder?.activated}/>

            <textarea
                id="rem-message"
                hidden={!habit.reminder?.activated}
                placeholder="Reminder message here"
                value={habit.reminder?.message ?? ""}
                onChange={(e) => updateReminderField("message", e.target.value)}
            />
        </div>
    );
}

function Priority({ habit, updateHabitField }) {
    return (
        <div id="priority">
            <div id="set-priority">
                <span>Set Priority:</span>
                <select
                    name="priority"
                    id="select-priority"
                    value={habit.priority ?? "none"}
                    onChange={(e) => updateHabitField("priority", e.target.value)}
                >
                    <option value="none">No Preference</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                </select>
            </div>

            <Line />
            <br />

            <div id="habit-term">
                <div id="start-date">
                    <p style={{ fontSize: "16px", textAlign: "center" }}>Start Date</p>
                    <input
                        type="date"
                        id="start-date-select"
                        name="start-date-select"
                        value={habit.startDate ?? ""}
                        onChange={(e) => updateHabitField("startDate", e.target.value)}
                        style={{ fontSize: "18px", textAlign: "center" }}
                    />
                </div>

                <div id="end-date">
                    <p style={{ fontSize: "16px", textAlign: "center" }}>End Date</p>
                    <input
                        type="date"
                        id="end-date-select"
                        name="end-date-select"
                        value={habit.endDate ?? ""}
                        onChange={(e) => updateHabitField("endDate", e.target.value)}
                        style={{ fontSize: "18px", textAlign: "center" }}
                    />
                </div>
            </div>
        </div>
    );
}

function Line({ isItHidden }) {
    return (
        <div className="line" hidden={ isItHidden } />
    );
}

function HabitDetails({ habit, uid, onClose, loadHabits }) {
    const user  = useContext(AuthContext);
    const [editedHabit, setEditedHabit] = useState(habit);
    console.log("AuthContext user:", user);

    // console.log("handleSaveHabit uid:", uid);
    // console.log("handleSaveHabit updatedHabit:", editedHabit);
    // console.log("handleSaveHabit updatedHabit.id:", editedHabit?.id);

    useEffect(() => {
        setEditedHabit(habit);
    }, [habit]);

    function updateHabitField(field, value) {
        setEditedHabit(prev => ({
            ...prev,
            [field]: value
        }));
    }

    function updateGoalField(field, value) {
        setEditedHabit(prev => ({
            ...prev,
            goal: {
                ...prev.goal,
                [field]: value
            }
        }));
    }

    function updateReminderField(field, value) {
        setEditedHabit(prev => ({
            ...prev,
            reminder: {
                ...prev.reminder,
                [field]: value
            }
        }));
    }

    async function handleSave() {
        try {
            await handleSaveHabit(user, editedHabit);
            console.log(editedHabit);
            onClose();
            if (loadHabits) {
                await loadHabits(user.uid);
            }
        } catch (error) {
            console.error("Failed to save habit changes:", error);
        }
    }

    async function handleDelete() {
        // Implement delete functionality here, similar to handleSave but calling a delete function from firestore.js
        try {
            await deleteHabit(user.uid, editedHabit.id);
            onClose();
            if (loadHabits) {
                await loadHabits(user.uid);
            }
        } catch (error) {
            console.error("Failed to delete habit:", error);
        }
    }

    return (
        <div id="details-frame">
            <div id="popup-header">
                <button id="popup-close" onClick={onClose}>×</button>
            </div>

            <NameDescription
                habit={editedHabit}
                updateHabitField={updateHabitField}
            />

            <span className="details-name">Habit Type</span>
            <HabitType
                habit={editedHabit}
                updateHabitField={updateHabitField}
            />

            <span className="details-name">Goal Info</span>
            <GoalInfo
                habit={editedHabit}
                updateGoalField={updateGoalField}
            />

            <span className="details-name">Reminder Settings</span>
            <ReminderSettings
                habit={editedHabit}
                updateReminderField={updateReminderField}
            />

            <span className="details-name">Priority</span>
            <Priority
                habit={editedHabit}
                updateHabitField={updateHabitField}
            />

            <button id="save-btn" onClick={handleSave}>
                Save Changes
            </button>
            <br />
            <button id="delete-btn" 
            style={{backgroundColor: "red", color: "white"}}
            onClick={handleDelete}>Delete</button>
        </div>
    );
}

export default HabitDetails;