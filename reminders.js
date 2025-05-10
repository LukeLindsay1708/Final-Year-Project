document.addEventListener('DOMContentLoaded', function() {
    const remindersList = document.getElementById('reminders-list');
    const showAllBtn = document.getElementById('show-all');
    const showUpcomingBtn = document.getElementById('show-upcoming');
    const showPastBtn = document.getElementById('show-past');

    function getTasks() {
        return JSON.parse(localStorage.getItem('calendarTasks')) || [];
    }

    
    function getDaysRemaining(deadline) {
        const today = new Date();
        const dueDate = new Date(deadline);
        const diffTime = dueDate - today;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

   
    function renderReminders(filter = 'all') {
        const tasks = getTasks();
        remindersList.innerHTML = '';

        
        const sortedTasks = [...tasks].sort((a, b) => 
            new Date(a.deadline) - new Date(b.deadline)
        );

       
        const filteredTasks = sortedTasks.filter(task => {
            const daysRemaining = getDaysRemaining(task.deadline);
            if (filter === 'upcoming') return daysRemaining >= 0;
            if (filter === 'past') return daysRemaining < 0;
            return true; // 'all'
        });

       
        if (filteredTasks.length === 0) {
            remindersList.innerHTML = '<p class="no-tasks">No tasks found</p>';
            return;
        }

        
        filteredTasks.forEach(task => {
            const daysRemaining = getDaysRemaining(task.deadline);
            const isOverdue = daysRemaining < 0;
            const isUrgent = daysRemaining >= 0 && daysRemaining <= 3;

            const taskElement = document.createElement('div');
            taskElement.className = 'reminder-card';
            taskElement.innerHTML = `
                <div class="task-header">
                    <h3>${task.name}</h3>
                    <span class="total-hours">${task.totalHours}h</span>
                </div>
                <div class="task-details">
                    <p class="deadline ${isOverdue ? 'overdue' : isUrgent ? 'urgent' : ''}">
                        ${new Date(task.deadline).toLocaleDateString()}
                        <span class="days-left">
                            ${isOverdue ? 
                                `Overdue by ${Math.abs(daysRemaining)} days` : 
                                `${daysRemaining} days left`}
                        </span>
                    </p>
                    <div class="progress-container">
                        <div class="progress-bar" style="width: ${calculateProgress(task)}%"></div>
                    </div>
                </div>
                <button class="delete-btn" data-id="${task.id}">Delete</button>
            `;
            remindersList.appendChild(taskElement);
        });

      
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const taskId = this.getAttribute('data-id');
                deleteTask(taskId);
                renderReminders(filter);
            });
        });
    }

  
    function calculateProgress(task) {
        const hoursCompleted = task.scheduledDays?.reduce((sum, day) => sum + day.hours, 0) || 0;
        return Math.min(100, Math.round((hoursCompleted / task.totalHours) * 100));
    }

    // Delete taks
    function deleteTask(taskId) {
        const tasks = getTasks().filter(task => task.id !== taskId);
        localStorage.setItem('calendarTasks', JSON.stringify(tasks));
    }


    showAllBtn.addEventListener('click', () => renderReminders('all'));
    showUpcomingBtn.addEventListener('click', () => renderReminders('upcoming'));
    showPastBtn.addEventListener('click', () => renderReminders('past'));

    renderReminders();
});