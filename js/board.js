let currentDraggedElement;
let task = [];

// Laden der Aufgaben aus Firebase
// Laden der Aufgaben aus Firebase
async function loadTask(path = "/userTask") {
    try {
        let response = await fetch(BASE_URL + path + ".json");
        let responseToJson = await response.json();

        if (responseToJson) {
            // Leeren des task-Arrays vor dem Hinzufügen neuer Aufgaben
            task = [];
            let tasksArray = Object.entries(responseToJson).map(([firebaseId, taskData]) => ({ firebaseId, ...taskData }));
            task.push(...tasksArray);
        }

        generateTask();
    } catch (error) {
        console.error("Fehler beim Laden der Daten:", error);
    }
}

// Generieren der Aufgabenlisten
// Generieren der Aufgabenlisten
function generateTask() {
    const categories = ['toDo', 'inProgress', 'awaitFeedback', 'done'];
    const numCategories = categories.length;

    for (let i = 0; i < numCategories; i++) {
        const category = categories[i];
        let tasksInCategory = task.filter(t => t.category === category);
        let categoryElement = document.getElementById(category);
        categoryElement.innerHTML = ''; // Vorhandene Aufgaben löschen

        const numTasksInCategory = tasksInCategory.length;
        for (let j = 0; j < numTasksInCategory; j++) {
            let taskItem = tasksInCategory[j];
            categoryElement.innerHTML += generateTaskHTML(taskItem);

            // Fortschrittsbalken nur aktualisieren, wenn die Aufgabe Subtasks hat
            if ((taskItem.subtasks || []).length > 0) {
                updateProgressBar(taskItem);
            }
        }
    }
}

// Generieren des HTML für eine einzelne Aufgabe
// Generieren des HTML für eine einzelne Aufgabe
function generateTaskHTML(taskItem) {
    let initialsHtml = (taskItem.assign || []).map(assignData => 
        `<span class="show-initials" style="background-color: ${assignData.bgNameColor}">${assignData.initials}</span>`
    ).join('');

    let priorityIcon = getPriorityIcon(taskItem.priority);
    let subtasksHtml = generateSubtasksProgressHTML(taskItem);

    return `
        <div draggable="true" ondragstart="startDragging(event, '${taskItem.firebaseId}')" ondragend="stopDragging(event)" class="taskCard" data-firebase-id="${taskItem.firebaseId}">
            <h4 class="task-category-${taskItem.userCategory}">${taskItem.userCategory}</h4>
            <p class="task-title">${taskItem.title}</p>
            <p class="task-description">${taskItem.description}</p>
            ${subtasksHtml}
            <div class="show-initials-taskcard">
                <div class="initials-container">${initialsHtml}</div>
                <img src="${priorityIcon}" alt="Image" class="taskcard-img">
            </div>
        </div>`;
}

// Drag-and-Drop-Funktionen
function startDragging(ev, firebaseId) {
    currentDraggedElement = firebaseId;
    ev.dataTransfer.setData("text/plain", firebaseId);
    ev.target.classList.add('rotated');
}

function keepDragging(ev) {
    ev.preventDefault();
    if (!ev.target.classList.contains('rotated')) {
        ev.target.classList.add('rotated');
    }
}

function stopDragging(ev) {
    ev.target.classList.remove('rotated');
}

function allowDrop(ev) {
    ev.preventDefault();
}

async function moveTo(category) {
    const firebaseId = currentDraggedElement;
    if (!firebaseId) {
        console.error("Keine verschobene Aufgabe gefunden.");
        return;
    }

    const taskIndex = task.findIndex(taskItem => taskItem.firebaseId === firebaseId);
    if (taskIndex === -1) {
        console.error("Aufgabe mit der angegebenen Firebase-ID nicht gefunden:", firebaseId);
        return;
    }

    try {
        task[taskIndex].category = category;
        await updateTaskInFirebase(firebaseId, { category });
        generateTask(); // Anzeige nach dem Verschieben der Aufgabe aktualisieren

        if ((task[taskIndex].subtasks || []).length > 0) {
            updateProgressBar(task[taskIndex]);
        }
    } catch (error) {
        console.error("Fehler beim Verschieben der Aufgabe:", error);
    }
}

// Aktualisieren der Aufgabe in Firebase
// Aktualisieren der Aufgabe in Firebase
async function updateTaskInFirebase(firebaseId, newData) {
    try {
        await fetch(`${BASE_URL}/userTask/${firebaseId}.json`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(newData)
        });
        console.log("Aufgabe in Firebase erfolgreich aktualisiert.");
    } catch (error) {
        console.error("Fehler beim Aktualisieren der Aufgabe in Firebase:", error);
        throw error;
    }
}

// Modal-bezogener Code
document.addEventListener("DOMContentLoaded", function () {
    const modal = document.getElementById("taskModal");
    const span = document.getElementsByClassName("close")[0];

    span.onclick = () => modal.style.display = "none";
    window.onclick = event => { if (event.target === modal) modal.style.display = "none"; };

    document.addEventListener("click", function (event) {
        if (event.target.classList.contains("taskCard")) {
            const firebaseId = event.target.getAttribute("data-firebase-id");
            const taskItem = task.find(t => t.firebaseId === firebaseId);
            if (taskItem) showModal(taskItem);
        }
    });
});

function showModal(taskItem) {
    const modal = document.getElementById("taskModal");
    const modalTitle = document.getElementById("modalTitle");

    modalTitle.innerText = taskItem.userCategory;
    modalTitle.className = `task-category-${taskItem.userCategory.replace(/\s+/g, '-')}`;

    document.getElementById("modalUserTitle").innerText = taskItem.title;
    document.getElementById("modalDescription").innerText = taskItem.description;
    document.getElementById("modalDate").innerText = taskItem.date;
    document.getElementById("modalSubtasks").innerHTML = generateSubtasksHTML(taskItem.firebaseId, taskItem.subtasks);
    document.getElementById("modalInitials").innerHTML = generateInitialsHTML(taskItem.assign || []);
    document.getElementById("modalPriorityIcon").src = getPriorityIcon(taskItem.priority);
    document.getElementById("modalPriorityText").innerText = taskItem.priority;

    modal.style.display = "block";
}

function generateInitialsHTML(assignedInitialsArray) {
    return assignedInitialsArray.map(assignData => `
        <div class="assign-details">
            <span class="show-initials" style="background-color: ${assignData.bgNameColor}">
                ${assignData.initials}
            </span>
            <span class="assign-name">${assignData.name}</span>
        </div>`
    ).join('');
}

function generateSubtasksHTML(firebaseId, subtasks) {
    if (!subtasks || subtasks.length === 0) return '';

    return '<ul>' + subtasks.map((subtask, index) => `
        <li>
            <input type="checkbox" id="subtask-${firebaseId}-${index}" ${subtask.done ? 'checked' : ''} onclick="toggleSubtask('${firebaseId}', ${index})">
            <label for="subtask-${firebaseId}-${index}">${subtask.title}</label>
        </li>`
    ).join('') + '</ul>';
}

async function toggleSubtask(firebaseId, subtaskIndex) {
    const taskIndex = task.findIndex(taskItem => taskItem.firebaseId === firebaseId);
    if (taskIndex === -1) {
        console.error("Aufgabe mit der angegebenen Firebase-ID nicht gefunden:", firebaseId);
        return;
    }

    task[taskIndex].subtasks[subtaskIndex].done = !task[taskIndex].subtasks[subtaskIndex].done;

    try {
        await updateTaskInFirebase(firebaseId, { subtasks: task[taskIndex].subtasks });
        updateProgressBar(task[taskIndex]);
        updateTaskCardSubtasks(task[taskIndex]);
        updatePopupSubtasks(task[taskIndex]);
    } catch (error) {
        console.error("Fehler beim Aktualisieren der Subtask in Firebase:", error);
    }
}

function updateProgressBar(taskItem) {
    const totalSubtasks = (taskItem.subtasks || []).length;
    if (totalSubtasks === 0) return;

    const completedSubtasks = (taskItem.subtasks || []).filter(subtask => subtask.done).length;
    const progressBar = document.getElementById(`progressBar_${taskItem.firebaseId}`);

    if (!progressBar) {
        console.error(`Fortschrittsbalken für taskItem mit ID ${taskItem.firebaseId} nicht gefunden.`);
        return;
    }

    const progressPercentage = (completedSubtasks / totalSubtasks) * 100;
    progressBar.style.width = `${progressPercentage}%`;

    // Update subtask count on task card
    const subtaskProgress = document.getElementById(`subtaskProgress_${taskItem.firebaseId}`);
    if (subtaskProgress) {
        subtaskProgress.textContent = `${completedSubtasks}/${totalSubtasks} Subtasks`;
    }
}

function updatePopupSubtasks(taskItem) {
    document.getElementById("modalSubtasks").innerHTML = generateSubtasksHTML(taskItem.firebaseId, taskItem.subtasks);
}

function updateTaskCardSubtasks(taskItem) {
    const taskCardSubtasks = document.querySelector(`[data-firebase-id="${taskItem.firebaseId}"] .subtask-progress`);
    if (taskCardSubtasks) {
        const completedSubtasks = taskItem.subtasks.filter(subtask => subtask.done).length;
        taskCardSubtasks.textContent = `${completedSubtasks}/${taskItem.subtasks.length} Subtasks`;
    }
}


function openTaskPopup() {
    document.getElementById("addTaskModel").style.display = "block";
// showAddTaskPopUp();
}


function closeTaskPopup() {
    document.getElementById("addTaskModel").style.display = "none";
}

// Fügen Sie den Event Listener hinzu, wenn das Dokument geladen wird
document.addEventListener('DOMContentLoaded', (event) => {
    document.getElementById('closePopupButton').addEventListener('click', closeTaskPopup);
});

// Initiales Laden der Aufgaben
loadTask();
