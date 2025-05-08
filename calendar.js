document.addEventListener('DOMContentLoaded', function() {

    let currentDate = new Date();
    let tasks = JSON.parse(localStorage.getItem('calendarTasks')) || [];
    
    const calendarBody = document.getElementById('calendar_body');
    const calendarHeader = document.getElementById('calendar-header');
    const prevBtn = document.getElementById('prev');
    const nextBtn = document.getElementById('next');
    const hourPopup = document.getElementById('hour-popup');
    const closePopup = document.getElementById('close-popup');
    const popupDate = document.getElementById('popup-date');
    const hourList = document.getElementById('hour-list');
    
    
    renderCalendar(currentDate);
    
    
    prevBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar(currentDate);
    });
    
    nextBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar(currentDate);
    });
    
    closePopup.addEventListener('click', () => {
        hourPopup.style.display = 'none';
    });
    
    //calendar for specific month/year
    function renderCalendar(date) {
        calendarHeader.textContent = `${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`;
        
        const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
        const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        const startingDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Adjust for Monday start
        
        calendarBody.innerHTML = '';
        
        let dateCount = 1;
        let dayCount = 0;
        
        for (let i = 0; i < 6; i++) {
            const row = document.createElement('tr');
            
            for (let j = 0; j < 7; j++) {
                const cell = document.createElement('td');
                
                if (i === 0 && j < startingDay) {
                    // Empty cells before first day of month
                    cell.textContent = '';
                } else if (dateCount > lastDay.getDate()) {
                    // Empty cells after last day of month
                    cell.textContent = '';
                } else {
                    // Cells with dates
                    const currentCellDate = new Date(date.getFullYear(), date.getMonth(), dateCount);
                    cell.textContent = dateCount;
                    cell.dataset.date = currentCellDate.toISOString().split('T')[0];
                    
        
                    const dayTasks = getTasksForDate(currentCellDate);
                    if (dayTasks.length > 0) {
                        const taskIndicator = document.createElement('div');
                        taskIndicator.className = 'task-indicator';
                        taskIndicator.textContent = `${dayTasks.length} task(s)`;
                        taskIndicator.style.fontSize = '12px';
                        taskIndicator.style.marginTop = '5px';
                        cell.appendChild(taskIndicator);
                    }
                    
                    // open pop up on click
                    cell.addEventListener('click', () => openHourPopup(currentCellDate));
                    
                    dateCount++;
                }
                
                row.appendChild(cell);
                dayCount++;
            }
            
            calendarBody.appendChild(row);
            
           
            if (dateCount > lastDay.getDate()) {
                break;
            }
        }
    }
    
    // Open hour breakdown popup
    function openHourPopup(date) {
        popupDate.textContent = date.toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric', 
            year: 'numeric' 
        });
        
        hourList.innerHTML = '';
        

        const taskForm = document.createElement('div');
        taskForm.id = 'task-form';
        taskForm.innerHTML = `
    <h3>Add New Task</h3>
    <input type="text" id="task-name" placeholder="Task name">
    <input type="number" id="task-hours" placeholder="Hours required" min="1">
    <button id="add-task-btn">Add Task</button>
        `;
        hourList.appendChild(taskForm);
        
        document.getElementById('add-task-btn').addEventListener('click', () => {
            const taskName = document.getElementById('task-name').value;
            const totalHours = parseInt(document.getElementById('task-hours').value);
            
            if (taskName && totalHours) {
                const deadline = new Date(date); 
                
                addTask(taskName, totalHours, deadline);
                renderCalendar(currentDate);
                renderHourList(date);
                
                document.getElementById('task-name').value = '';
                document.getElementById('task-hours').value = '';
            }
        });
        
        renderHourList(date);
        hourPopup.style.display = 'block';
    }
    
    function renderHourList(date) {
        const existingTasksContainer = document.createElement('div');
        existingTasksContainer.id = 'existing-tasks';
        hourList.appendChild(existingTasksContainer);
        
        const dateISO = date.toISOString().split('T')[0];
        const dayTasks = tasks.filter(task => {
            return task.scheduledDays.some(day => day.date === dateISO);
        });
        
        if (dayTasks.length === 0) {
            const noTasks = document.createElement('div');
            noTasks.className = 'hour-item';
            noTasks.textContent = 'No tasks scheduled for this day';
            existingTasksContainer.appendChild(noTasks);
        } else {
            dayTasks.forEach(task => {
                const taskItem = document.createElement('div');
                taskItem.className = 'hour-item';
                
                const scheduledHours = task.scheduledDays.find(day => day.date === dateISO).hours;
                const totalDays = task.scheduledDays.length;
                
                taskItem.innerHTML = `
                    <strong>${task.name}</strong><br>
                    ${scheduledHours} hour(s) today<br>
                    <small>${task.totalHours}h total over ${totalDays} days | Due: ${new Date(task.deadline).toLocaleDateString()}</small>
                    <button class="remove-task" data-task-id="${task.id}">×</button>
                `;
                
                existingTasksContainer.appendChild(taskItem);
            });
            
            document.querySelectorAll('.remove-task').forEach(btn => {
                btn.addEventListener('click', function() {
                    const taskId = this.getAttribute('data-task-id');
                    removeTask(taskId);
                    renderHourList(date);
                    renderCalendar(currentDate);
                });
            });
        }
    }
    
    // Task management functions
    function addTask(name, totalHours, deadline) {
        const taskId = Date.now().toString();
        const scheduledDays = distributeHours(totalHours, deadline);
        
        tasks.push({
            id: taskId,
            name,
            totalHours,
            deadline,
            scheduledDays
        });
        
        saveTasks();
    }
    
    function removeTask(taskId) {
        tasks = tasks.filter(task => task.id !== taskId);
        saveTasks();
    }
    
    function getTasksForDate(date) {
        const dateISO = date.toISOString().split('T')[0];
        return tasks.filter(task => {
            return task.scheduledDays.some(day => day.date === dateISO);
        });
    }
    
    function saveTasks() {
        localStorage.setItem('calendarTasks', JSON.stringify(tasks));
    }
    
    // distribution of hours 
    function distributeHours(totalHours, deadline) {
        const workDays = [];
        const currentDay = new Date(); // Today
        currentDay.setHours(0, 0, 0, 0);
        
    
        while (currentDay <= deadline) {
            if (currentDay.getDay() !== 0 && currentDay.getDay() !== 6) { // Skip weekends
                workDays.push(new Date(currentDay));
            }
            currentDay.setDate(currentDay.getDate() + 1);
        }
        
        // Distribute hours evenly across these days
        const scheduledDays = [];
        let remainingHours = totalHours;
        const daysAvailable = workDays.length;
        
        if (daysAvailable === 0) return []; 
        
        const baseHours = Math.floor(totalHours / daysAvailable);
        let extraHours = totalHours % daysAvailable;
        
        workDays.forEach(day => {
            let hoursToday = baseHours;
            if (extraHours > 0) {
                hoursToday++;
                extraHours--;
            }
            
            if (hoursToday > 0) {
                scheduledDays.push({
                    date: day.toISOString().split('T')[0],
                    hours: hoursToday
                });
                remainingHours -= hoursToday;
            }
        });
        
        return scheduledDays;
    }
    
    function getWorkDaysBeforeDeadline(deadline) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const workDays = [];
        const currentDay = new Date(today);
        
        while (currentDay <= deadline) {
            if (currentDay.getDay() !== 0 && currentDay.getDay() !== 6) { // Skip weekends
                workDays.push(new Date(currentDay));
            }
            currentDay.setDate(currentDay.getDate() + 1);
        }
        
        return workDays;
    }
});