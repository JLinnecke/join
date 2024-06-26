let contacts = [];
let groupedContactsLetters = {};
let currentOpenUser = null;
let currentUser = [];

/**
 * This prevents the window from closing when I press the pop-up button
 * 
 * @param {string} event -  
 */
function doNotClose(event) {
    event.stopPropagation();
}

/**
 * Gets the input from the form and adds it to the json array, contacts
 * 
 * 
 */
async function submitContact() {
    let name = document.getElementById('addcontact_name').value;
    let email = document.getElementById('addcontact_email').value;
    let phone = document.getElementById('addcontact_phone').value;

    let contact = {
        name: name,
        email: email,
        phone: phone,
        bgNameColor: toAssignColorNameLogo(),
        firstLetters: filterFirstLetters(name),
    };
    try {
        await addContact(contact);

    } catch (error) {
        console.error("Fehler beim Posten der Daten:", error);
    }
}

async function addContact(newContact) {
    const response = await postData("/contact", newContact);
    newContact.id = response.name;
    contacts.push(newContact);
    filterNameAlphabet();
    filterContactAlphabet();
    generateContacts();
    selectionTheLastCreatedUser(newContact);
    cloeAddNewContactwindow();
}

/**
 * Selects the most recent contact that was created.
 * 
 * @param {Object} newContact - The most recently created contact.
 * @param {number} newContact.originalIndex - The index of the new contact in the contacts array.
 */
function selectionTheLastCreatedUser(newContact) {
    openUserInfo(newContact.originalIndex);
    document.getElementById('userButton' + newContact.originalIndex).focus();
    slideInPopup('contactInfo');
    openUserInfoWindow();
}

/**
 * adds the array contact from submitContact() on firebase
 * 
 * @param {path} path - this is the path where it should save in firebase 
 * @param {json array} data - under which array it should save on firebase
 * @returns 
 */
async function postData(path, data) {

    let response = await fetch(BASE_URL + path + ".json", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data)
    });
    addNewContactConfirmation();
    let responseToJson = await response.json();
    return responseToJson;
}

/**
 * 
 * Downloads the contacts from firebease again.
 * Key is a variable that represents the current key in the responseToJson object iterated through.
 * The hasOwnProperty() method of Object instances returns a boolean indicating whether this object has the specified property as its own property (as opposed to inheriting it).
 * 
 * @param {path} path - This is the path where the data from contact is inside  
 * @returns 
 */
async function loadContact(path = "/contact") {
    try {
        let response = await fetch(BASE_URL + path + ".json");
        let responseToJson = await response.json();

        for (let key in responseToJson) {
            if (responseToJson.hasOwnProperty(key)) {
                let contact = responseToJson[key];

                contacts.push({
                    'id': key,
                    'name': contact.name,
                    'email': contact.email,
                    'phone': contact.phone,
                    'bgNameColor': contact.bgNameColor,
                    'firstLetters': contact.firstLetters
                });
            }
        }
    } catch (error) {
        console.error("Fehler beim Laden der Daten:", error);
        return null;
    }
}

/**
 * This function inserts the contacts into the HTML page
 * 
 */
async function generateContacts() {
    let contactListContainer = document.getElementById('contact');
    contactListContainer.innerHTML = '';

    let groupedContacts = filterContactAlphabet();

    for (let letter in groupedContacts) {
        let contacts = groupedContacts[letter];

        contactListContainer.innerHTML += `<div onclick="deselectUser()" class="letter"><span>${letter}</span></div>
            <div class="seperator-alphabet-container"><div class="seperator-alphabet"></div></div>`;

        for (let i = 0; i < contacts.length; i++) {
            let contact = contacts[i];

            contactListContainer.innerHTML += contactHTML(contact);
        }
    }
}

function openUserInfo(index) {
    let userInfo = document.getElementById('contactInfo');
    let userButton = document.getElementById('userButton' + index);
    let user = contacts[index];
    
    deselectUser();

    if (userInfo.innerHTML === '' || currentOpenUser !== index) {
        userInfo.innerHTML = userInfoHTML(user, index);
        userButton.focus();
        userButton.classList.add('focus-button');
        userButton.classList.add('no-hover');
        currentOpenUser = index;        
    } else {
        userInfo.innerHTML = '';
        userButton.classList.remove('focus-button');
        userButton.classList.remove('no-hover');
        userButton.blur();
        currentOpenUser = null;       
    }
}

function deselectUser() {
    if (currentOpenUser !== null) {
        let userInfo = document.getElementById('contactInfo');
        let userButton = document.getElementById('userButton' + currentOpenUser);
        userInfo.innerHTML = '';
        userButton.classList.remove('focus-button', 'no-hover');
        currentOpenUser = null;
    }
}

async function submitForm(event, i, contactId, path) {
    event.preventDefault();

    let updatedContact = {
        id: contactId,
        name: document.getElementById('addcontact_edit_name').value,
        email: document.getElementById('addcontact_edit_email').value,
        phone: document.getElementById('addcontact_edit_phone').value,
        firstLetters: filterFirstLetters(document.getElementById('addcontact_edit_name').value),
        bgNameColor: contacts[i].bgNameColor,
    };
    await addContactUbdate(i, contactId, updatedContact, path);
}

async function addContactUbdate(i, contactId, updatedContact, path) {
    await updateContact(contactId, updatedContact, path);
    contacts[i] = updatedContact;
    let newIndex = findContactIndexById(contactId);

    if (newIndex !== -1) {
        updatedContact.originalIndex = newIndex;
        openUserInfo(newIndex);
    }

    cloeAddUbdateContactwindow();
    filterNameAlphabet();
    filterContactAlphabet();
    await generateContacts();
    selectionTheLastCreatedUser(updatedContact);
}

/**
 * Finds the index of a contact by its ID.
 * 
 * @param {string} contactId - The ID of the contact to find.
 * @returns {number} The index of the contact, or -1 if not found.
 */
function findContactIndexById(contactId) {
    for (let i = 0; i < contacts.length; i++) {
        if (contacts[i].id === contactId) {
            return i;
        }
    }
    return -1;
}

async function updateContact(contactId, updatedContact, path = "/contact") {
    console.log('ubdate', contactId);
    let response = await fetch(BASE_URL + path + '/' + contactId + '.json', {
        method: "PUT",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedContact)
    });
    return response;
}

async function editUser(i, path = "/contact") {
    let contactId = contacts[i].id;
    document.getElementById('addUbdateContactPopUp').innerHTML = addUbdateContactPopUp(i, path);
    openAddUbdateContactwindow();
    document.getElementById('addcontact_edit_name').value = contacts[i].name;
    document.getElementById('addcontact_edit_email').value = contacts[i].email;
    document.getElementById('addcontact_edit_phone').value = contacts[i].phone;
}

/**
 * This function deletes the user
 * 
 * @param {*} i is the index from the user
 * @param {*} path is the path where the contacts are stored
 */
async function deleteUser(i, path = "/contact") {
    let contactId = contacts[i].id;
    contacts.splice(i, 1);

    let response = await fetch(BASE_URL + path + '/' + contactId + '.json', {
        method: "DELETE",
    });
    document.getElementById('contactInfo').innerHTML = '';
    currentOpenUser = null;
    generateContacts();
}

/**
 * This function takes the first letters of the first and last name 
 * 
 * @param {string} name - The name is in there
 * 
 */
function filterFirstLetters(name) {
    let words = name.split(' ');
    let firstLetters = words.map(word => word.charAt(0).toUpperCase()).join('');

    return firstLetters;
}

/**
 * The function generates a random color, from the array userNameColor, for the name Logo
 * 
 * @returns - The random color
 */
function toAssignColorNameLogo() {
    let backgroundcolor = userNameColor[Math.floor(Math.random() * userNameColor.length)];

    return backgroundcolor;
}

/**
 * Filter the contacts by the alphabet
 * 
 */
function filterNameAlphabet() {
    contacts.sort((a, b) => a.name.localeCompare(b.name));
}

function filterContactAlphabet() {
    groupedContactsLetters = {};

    for (let i = 0; i < contacts.length; i++) {
        let contact = contacts[i];
        let firstLetter = contact.name.charAt(0).toUpperCase();

        if (!groupedContactsLetters[firstLetter]) {
            groupedContactsLetters[firstLetter] = [];
        }

        contact.originalIndex = i;
        groupedContactsLetters[firstLetter].push(contact);
    }
    return groupedContactsLetters;
}

/**
 * Open the contact window and add contacts
 * 
 */
function openAddNewContactwindow() {
    addNewContactPopUp();

    document.getElementById('bg_add_new_contact').classList.remove('d-none');
    document.getElementById('btn-create-addcontact').classList.remove('d-none');
}

/**
 * closes the contact window again and clears the input fields
 * 
 */
function cloeAddNewContactwindow() {
    document.getElementById('bg_add_new_contact').classList.add('d-none');
}

function openAddUbdateContactwindow() {
    document.getElementById('bg_add_ubdate_contact').classList.remove('d-none');
    document.getElementById('btn-create-addcontact').classList.remove('d-none');
}

/**
 * Open the contact window and add contacts
 * 
 */
function cloeAddUbdateContactwindow() {
    document.getElementById('bg_add_ubdate_contact').classList.add('d-none');
    document.getElementById('addcontact_edit_name').value = '';
    document.getElementById('addcontact_edit_email').value = '';
    document.getElementById('addcontact_edit_phone').value = '';
}

function openUserInfoWindow() {
    document.getElementById('contactInfoContainer').style.display = 'block';
}

function closeUserInfoWindow() {
    document.getElementById('contactInfoContainer').style.display = 'none';
}

function openUserDeleteEditWindow() {
    document.getElementById('userDeleteHandy').style.display = 'block';
    document.getElementById('userDeleteHandy').innerHTML = `
            <div class="bg">
               <div id="containerEditDeleteHandy" class="container-edit-delete-handy" onclick="doNotClose(event)">
                <div class="user-edit-delete-handy" id="buttonEditDeleteHandy">
                    <div onclick="editUser(${currentOpenUser}), slideInPopup('popUpUbdateContact'), closeUserDeleteEditWindow()" class="user-edit-delete-section-handy" >
                        <img src="assets/img/edit-contacts.png" alt="edit">
                        <p>Edit</p>
                    </div>
                    <div onclick="deleteUser(${currentOpenUser}), closeUserDeleteEditWindow(), closeUserInfoWindow()" class="user-edit-delete-section-handy">
                        <img src="assets/img/delete-contacts.png" alt="edit">
                        <p>Delete</p>
                    </div>
                </div>
               </div>            
        </div> `;
}

function closeUserDeleteEditWindow() {
    document.getElementById('userDeleteHandy').innerHTML = '';
}

/**
 * Asynchronously displays a confirmation message after a new contact has been added.
 * The confirmation message is displayed for 3 seconds.
 * 
 * @async
 */
async function addNewContactConfirmation() {
    let contactConfirmation = document.getElementById('contactConfirmation');
    contactConfirmation.classList.add('show-overlay-menu-user-info');
    contactConfirmation.innerHTML = `<img class="show-overlay-menu-user-info" src="assets/img/add-user-confirmation.png" alt="check">`;

    setTimeout(() => {
        contactConfirmation.innerHTML = '';
        contactConfirmation.classList.remove('show-overlay-menu-user-info');
    }, 3000);
}

/**
 * Adds the 'slide-in' class to the popup element with the specified ID to initiate a slide-in animation.
 * 
 * @param {string} popupId - The ID of the popup element to be animated.
 */
function slideInPopup(popupId) {
    let popup = document.getElementById(popupId);

    popup.classList.add('slide-in');
}

async function contactinit() {
    await loadContact();
    filterNameAlphabet();
    filterContactAlphabet();
    await generateContacts();
}