let editTaskPopup;
let currentTask;


function loadTaskForEdit(firebaseId) {
    console.log('Passed firebaseId:', firebaseId);
    console.log('Task array:', task);
    for (let i = 0; i < task.length; i++) {
        let editTask = task[i];
        console.log('Current task:', editTask);
        if (editTask.firebaseId === firebaseId) {
            console.log(editTask.firebaseId);
            currentTask = editTask;
            break;
        }
    }
}

function showTaskDetails() {
    document.getElementById('editTitle').value = currentTask.title;
    document.getElementById('editDescription').value = currentTask.description;
    document.getElementById('editAssigned').value = currentTask.assign;
    document.getElementById('editDate').value = currentTask.dueDate;
    document.getElementById('editCategory').value = currentTask.userCategory;
    document.getElementById('subtaskListEdit').innerHTML = '';
    

    showInitialsEditTask();
    showSubtasksEditTask();
}


function showInitialsEditTask() {
    let initialsElement = document.getElementById('editAssignedInitials');
    initialsElement.innerHTML = '';
    if (Array.isArray(currentTask.assign)) {
        for (let i = 0; i < currentTask.assign.length; i++) {
            let assignData = currentTask.assign[i];
            let spanElement = `<span class="show-initials-edit" style="background-color: ${assignData.bgNameColor}">${assignData.initials}</span>`;
            initialsElement.innerHTML += spanElement;
        }
    }
}


function markCheckedCheckboxes() {
    let assignContact = document.getElementById('editAssigned');
    if (!assignContact) {
        console.error("Element mit ID 'editAssigned' wurde nicht gefunden.");
        return;
    }

    let checkboxes = assignContact.querySelectorAll('input[type="checkbox"]');
    console.log('currentTask.assign:', currentTask.assign); // Debugging-Informationen

    for (let checkbox of checkboxes) {
        console.log('checkbox value:', checkbox.value); // Debugging-Informationen

        let [name, initials, bgColor] = checkbox.value.split('|');
        let cleanedName = cleanNameForInitials(name);
        let generatedInitials = filterFirstLetters(cleanedName);

        // Stellen Sie sicher, dass der Vergleich mit bereinigten Namen erfolgt
        if (currentTask.assign.some(assign => cleanNameForInitials(assign.name).trim().toLowerCase() === cleanedName.trim().toLowerCase() && assign.initials === generatedInitials && assign.bgNameColor === bgColor)) {
            checkbox.checked = true;
        }
    }
}


function cleanNameForInitials(name) {
    return name.replace(" (YOU)", "");
}

function filterFirstLetters(name) {
    let cleanedName = cleanNameForInitials(name);
    let words = cleanedName.split(' ');
    let firstLetters = words.map(word => word.charAt(0).toUpperCase()).join('');
    return firstLetters;
}


function showSubtasksEditTask() {
    let subtaskList = document.getElementById('subtaskListEdit');
    subtaskList.innerHTML = '';
    if (Array.isArray(currentTask.subtasks)) {
        for (let i = 0; i < currentTask.subtasks.length; i++) {
            let subtask = currentTask.subtasks[i];
            let liElement = `
            <div id="subtask${i}">
                <li class="edit-list-row">${subtask.title}
                <div class="edit-delete-img-edit-task">
                    <img src="assets/img/edit.png" onclick="editSubtask(${i})"> | <img src="assets/img/delete.png" onclick="deleteSubtask(${i})">
                    
                </div>
                </li>
            </div>`;
            subtaskList.innerHTML += liElement;
        }
    }
}

function setCurrentPriority(priority) {
    currentTask.priority = priority;
    const buttons = document.querySelectorAll('.prio-buttons button');
    buttons.forEach(button => {
        button.classList.remove('selected');
        const img = button.querySelector('img');
        img.src = button.getAttribute('data-original-image'); // Set to original image
    });

    let button;
    if (priority === 'Urgent') {
        button = document.querySelector('.urgent-button');
    } else if (priority === 'Medium') {
        button = document.querySelector('.medium-button');
    } else if (priority === 'Low') {
        button = document.querySelector('.low-button');
    } else {
        console.error('Unknown priority:', priority);
        return;
    }

    if (button) {
        button.classList.add('selected');
        selectedPriority = priority;
        const img = button.querySelector('img');
        img.src = button.getAttribute('data-clicked-image'); // Change to clicked image
    }
    console.log(priority);
}

function addSubtask() {
    let subtaskTitle = document.getElementById('editSubtasks').value;
    if (!currentTask.subtasks) {
        currentTask.subtasks = [];
    }
    currentTask.subtasks.push({ title: subtaskTitle });
    showSubtasksEditTask();

    scrollToBottom();
}

function scrollToBottom() {
    const editTaskMainContainer = document.getElementById('editTaskMainContainer');
    if (editTaskMainContainer) {
        // Scrollt zum Ende des Containers
        editTaskMainContainer.scrollTop = editTaskMainContainer.scrollHeight;
    }
}

function deleteSubtask(i) {
    currentTask.subtasks.splice(i, 1);
    showSubtasksEditTask()
}

function editSubtask(i) {
    let subtask = currentTask.subtasks[i];
    console.log(i, subtask);
    document.getElementById(`subtask${i}`).innerHTML = `<input type="text" id="edit-input${i}" value="${subtask.title}"> <div><img src="assets/img/delete.png" onclick="clearEditSubtask(${i})"> | <img src="assets/img/hook.png" onclick="confirmEditSubtask(${i})"></div>`;
}

function clearEditSubtask(i) {
    document.getElementById(`subtask${i}`).innerHTML = `<input type="text" id="edit-input${i}"><div><img src="assets/img/delete.png" onclick="clearEditSubtask(${i})"> | <img src="assets/img/hook.png" onclick="confirmEditSubtask(${i})"></div>`;
}

function confirmEditSubtask(i) {
    // Versuchen Sie, das Element zu holen
    let inputElement = document.getElementById(`edit-input${i}`);

    // Überprüfen Sie, ob das Element existiert
    if (inputElement) {
        // Verarbeiten Sie das Element
        let inputValue = inputElement.value;
        currentTask.subtasks[i].title = inputValue;
    }
    openEditTask(currentTask.firebaseId);
}

function openEditTask(firebaseId) {
    loadTaskForEdit(firebaseId);
    document.getElementById('modalTaskcard').classList.add('modal-task-popup-display-none');
    document.getElementById('editTaskcard').classList.remove('edit-task-display-none');
    generateEditAssign();
    showTaskDetails();
    //document.getElementById('closeEditPopupButton').addEventListener('click', closeEditTaskPopup);
    document.getElementById('postEditBtn').addEventListener('click', updateCurrentTask);  
}

function closeEditTaskPopup() {
    document.getElementById('editTaskcard').classList.add('edit-task-display-none');
    document.getElementById('modalTaskcard').classList.remove('modal-task-popup-display-none');
}

function updateCurrentTask() {
    currentTask.title = document.getElementById('editTitle').value;
    currentTask.description = document.getElementById('editDescription').value;
    currentTask.dueDate = document.getElementById('editDate').value;
    currentTask.userCategory = document.getElementById('editCategory').value;

    let assignContact = document.getElementById('editAssigned');
    if (assignContact) {
        let checkboxes = assignContact.querySelectorAll('input[type="checkbox"]');
        currentTask.assign = []; // Leeren Sie die aktuelle Zuweisungsliste

        // Fügen Sie die ausgewählten Kontakte zur Zuweisungsliste hinzu
        for (let checkbox of checkboxes) {
            if (checkbox.checked) {
                console.log('Checkbox value:', checkbox.value); // Debugging-Informationen
                let [name, initials, bgColor] = checkbox.value.split('|');
                currentTask.assign.push({
                    name: name,
                    initials: initials,
                    bgNameColor: bgColor
                });
            }
        }
    }

    updateTask(currentTask.firebaseId, currentTask);
}


function generateEditAssign() {
    let assignContact = document.getElementById('editAssigned');

    if (!assignContact) {
        console.error("Element mit ID 'editAssigned' wurde nicht gefunden.");
        return;
    }

    assignContact.innerHTML = '';
    currentAssignIndex = 0;

    for (let i = 0; i < assign.length; i++) {
        let assignContacts = assign[i];

        let label = document.createElement('label');
        let checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        // Fügen Sie die Initialen und die Hintergrundfarbe zum Wert hinzu
        let initials = filterFirstLetters(assignContacts.name);
        checkbox.value = assignContacts.name + '|' + initials + '|' + assignContacts.bgNameColor;

        let initialsSpan = document.createElement('span');
        initialsSpan.textContent = initials;
        initialsSpan.classList.add('assign-initials');
        initialsSpan.style.backgroundColor = assignContacts.bgNameColor;

        let nameSpan = document.createElement('span');
        nameSpan.textContent = assignContacts.name;
        nameSpan.classList.add('assign-name');

        label.appendChild(initialsSpan);
        label.appendChild(nameSpan);
        label.appendChild(checkbox);

        assignContact.appendChild(label);
        
    }
    markCheckedCheckboxes();
}

function openDropdown() {
    let dropdown = document.querySelector('.dropdown-edit-content');
    document.getElementById('dropdownArrow').classList.toggle('rotate');
    dropdown.classList.toggle('show');
}


async function updateTask(firebaseId, updatedUserTask) {
    try {
        let response = await fetch(BASE_URL + `/userTask/${firebaseId}.json`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatedUserTask),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        window.location.href = "board.html";
    } catch (error) {
        console.error('Fehler beim Aktualisieren der Aufgabe:', error);
        alert(`Fehler beim Aktualisieren der Aufgabe: ${error.message}`);
    }
   
}



