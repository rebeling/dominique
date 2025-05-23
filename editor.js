// JavaScript for AI Editor functionality
document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const isEditMode = params.get('edit') === '1';

    if (isEditMode) {
        document.body.classList.add('edit-mode-active');
        initializeEditor();
    } else {
        const editorElements = ['dominique-interface', 'saveButton'];
        editorElements.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });
    }
});

// Define help content string globally or within initializeEditor if preferred and passed around
const COMMAND_HELP_HTML = `
    <h4>Available Commands:</h4>
    <ul>
        <li><code>make text bigger</code></li>
        <li><code>make text smaller</code></li>
        <li><code>center text</code></li>
        <li><code>change text to: [your new text]</code></li>
        <li><code>create list: item1, item2, ...</code></li>
        <li><code>create card: Title | Description | Button Text</code></li>
        <li><code>create two columns</code></li>
        <li><em>Type 'help' to see this list again.</em></li>
    </ul>
`;

function initializeEditor() {
    const canvas = document.querySelector('.canvas');
    const dominiqueInterface = document.getElementById('dominique-interface');
    const commandInput = document.getElementById('dominique-command-input');
    let selectedElement = null;

    const dominiqueChatHistory = document.getElementById('dominique-chat-history');
    const dominiqueInfoButton = document.getElementById('dominique-info-button');
    const dominiqueSubmitButton = document.getElementById('dominique-submit-button');
    const dominiqueHeader = document.getElementById('dominique-header'); 
    const dominiqueCloseButton = document.getElementById('dominique-close-button'); // New close button

    let isDragging = false;
    let initialMouseX, initialMouseY;
    let initialModalLeft, initialModalTop;

    function scrollToBottom(element) {
        if (element) {
            element.scrollTop = element.scrollHeight;
        }
    }

    function appendMessage(text, type, isHtml = false) {
        if (!dominiqueChatHistory) {
            console.error("Chat history element not found!");
            return;
        }
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('chat-message', type);
        if (isHtml) {
            messageDiv.innerHTML = text; 
        } else {
            messageDiv.textContent = text; 
        }
        dominiqueChatHistory.appendChild(messageDiv);
        scrollToBottom(dominiqueChatHistory);
    }

    function activateDominiqueInterface() {
        if (!dominiqueInterface || !commandInput || !selectedElement) {
            console.error("Dominique interface, command input, or selectedElement not found for activation.");
            if (dominiqueInterface) dominiqueInterface.style.display = 'none'; 
            return;
        }
        dominiqueInterface.style.display = 'flex'; 
        const selectedRect = selectedElement.getBoundingClientRect();
        const modalWidth = dominiqueInterface.offsetWidth;
        const modalHeight = dominiqueInterface.offsetHeight;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const scrollX = window.scrollX;
        const scrollY = window.scrollY;
        const offset = 10; 
        let modalTop = selectedRect.top + scrollY;
        let modalLeft = selectedRect.right + scrollX + offset;
        if (modalLeft + modalWidth > viewportWidth + scrollX) {
            modalLeft = selectedRect.left + scrollX - modalWidth - offset; 
        }
        if (modalLeft < scrollX) {
            modalLeft = scrollX + offset; 
        }
        if (modalTop + modalHeight > viewportHeight + scrollY) {
            modalTop = selectedRect.bottom + scrollY - modalHeight; 
            if (modalTop < scrollY) { 
                 modalTop = scrollY + offset; 
            }
        }
        if (modalTop < scrollY) {
            modalTop = scrollY + offset; 
        }
        dominiqueInterface.style.top = `${modalTop}px`;
        dominiqueInterface.style.left = `${modalLeft}px`;
        commandInput.focus();
        if (dominiqueChatHistory && dominiqueChatHistory.children.length === 0) {
            appendMessage("Dominique is ready. Select an element and type a command, or type 'help'.", "system-message");
        }
    }

    if (canvas) {
        canvas.addEventListener('click', (event) => {
            const clickedElement = event.target;

            // If click is on the close button or info button, or inside dominique interface, do not deselect
            if (dominiqueInterface && (dominiqueInterface.contains(clickedElement) || clickedElement === dominiqueInterface)) {
                return;
            }

            if (clickedElement === canvas) {
                if (selectedElement) {
                    selectedElement.classList.remove('selected-highlight');
                    if (selectedElement.contentEditable === 'true') {
                        selectedElement.contentEditable = 'false';
                    }
                    selectedElement = null;
                }
                if (dominiqueInterface) dominiqueInterface.style.display = 'none';
                return;
            }
            if (clickedElement === selectedElement) return;
            if (selectedElement) {
                selectedElement.classList.remove('selected-highlight');
                if (selectedElement.contentEditable === 'true') {
                    selectedElement.contentEditable = 'false';
                }
            }
            selectedElement = clickedElement;
            if (canvas.contains(selectedElement) && selectedElement !== canvas) {
                 selectedElement.classList.add('selected-highlight');
                 if (isEditable(selectedElement)) {
                    selectedElement.contentEditable = 'true';
                 }
                 activateDominiqueInterface();
                 console.log('Selected element:', selectedElement, 'Editable:', selectedElement.contentEditable);
            } else {
                if (selectedElement) {
                    selectedElement.classList.remove('selected-highlight');
                    if (selectedElement.contentEditable === 'true') {
                        selectedElement.contentEditable = 'false';
                    }
                }
                selectedElement = null;
                if (dominiqueInterface) dominiqueInterface.style.display = 'none';
            }
        });
    } else {
        console.error('Canvas element not found in edit mode!');
    }

    if (dominiqueSubmitButton && commandInput) {
        dominiqueSubmitButton.addEventListener('click', (event) => {
            event.preventDefault();
            const commandText = commandInput.value.trim();
            if (!commandText) {
                appendMessage("Command input is empty. Please type a command.", "system-message");
                return;
            }
            if (!selectedElement && commandText.toLowerCase() !== "help") { 
                appendMessage("No element selected. Please click on an element in the canvas first, or type 'help'.", "system-message");
                return;
            }
            appendMessage(commandText, "user-message"); 
            if (commandText.toLowerCase() === "help") {
                appendMessage(COMMAND_HELP_HTML, "system-message", true); 
            } else if (selectedElement) { 
                executeCommand(selectedElement, commandText);
                appendMessage(`Command processed: "${commandText}"`, "system-message"); 
            } else {
                appendMessage("Please select an element to apply this command or type 'help'.", "system-message");
            }
            commandInput.value = ''; 
            commandInput.focus(); 
        });
    } else {
        if (!dominiqueSubmitButton) console.error('Dominique submit button not found in edit mode!');
        if (!commandInput) console.error('Dominique command input not found in edit mode!');
    }

    if (dominiqueInfoButton) { 
        dominiqueInfoButton.addEventListener('click', () => {
            appendMessage(COMMAND_HELP_HTML, "system-message", true); 
        });
    } else {
        if (!dominiqueInfoButton) console.error('Dominique info button not found in edit mode!');
    }

    // Add event listener for the new close button
    if (dominiqueCloseButton && dominiqueInterface) {
        dominiqueCloseButton.addEventListener('click', () => {
            dominiqueInterface.style.display = 'none';
            if (selectedElement) {
                selectedElement.classList.remove('selected-highlight');
                if (selectedElement.contentEditable === 'true') {
                    selectedElement.contentEditable = 'false';
                }
                selectedElement = null;
            }
            appendMessage("Dominique closed.", "system-message"); // Optional feedback
        });
    } else {
        if (!dominiqueCloseButton) console.error('Dominique close button not found in edit mode!');
    }


    if (dominiqueHeader && dominiqueInterface) {
        dominiqueHeader.addEventListener('mousedown', (e) => {
            // Prevent dragging if mousedown is on info or close button
            if (e.target === dominiqueInfoButton || e.target === dominiqueCloseButton) {
                return;
            }
            isDragging = true;
            initialMouseX = e.clientX;
            initialMouseY = e.clientY;
            initialModalLeft = dominiqueInterface.offsetLeft;
            initialModalTop = dominiqueInterface.offsetTop;
            document.body.style.userSelect = 'none'; 
            dominiqueHeader.style.cursor = 'grabbing'; 
            document.addEventListener('mousemove', onDragMouseMove);
            document.addEventListener('mouseup', onDragMouseUp);
            e.preventDefault(); 
        });
        function onDragMouseMove(e) {
            if (!isDragging) return;
            const deltaX = e.clientX - initialMouseX;
            const deltaY = e.clientY - initialMouseY;
            let newLeft = initialModalLeft + deltaX;
            let newTop = initialModalTop + deltaY;
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            const modalWidth = dominiqueInterface.offsetWidth;
            const modalHeight = dominiqueInterface.offsetHeight;
            if (newLeft < 0) newLeft = 0;
            if (newTop < 0) newTop = 0; 
            if (newLeft + modalWidth > viewportWidth) newLeft = viewportWidth - modalWidth;
            if (newTop + modalHeight > viewportHeight) newTop = viewportHeight - modalHeight;
            dominiqueInterface.style.left = newLeft + 'px';
            dominiqueInterface.style.top = newTop + 'px';
        }
        function onDragMouseUp() {
            if (!isDragging) return;
            isDragging = false;
            document.removeEventListener('mousemove', onDragMouseMove);
            document.removeEventListener('mouseup', onDragMouseUp);
            document.body.style.userSelect = ''; 
            dominiqueHeader.style.cursor = 'move'; 
        }
    } else {
        if(!dominiqueHeader) console.error("Dominique header not found for dragging.");
        if(!dominiqueInterface) console.error("Dominique interface not found for dragging.");
    }

    function executeCommand(element, commandString) {
        console.log(`Executing command on element <${element.tagName.toLowerCase()}>: "${commandString}" in edit mode`);
        if (commandString.toLowerCase() === "make text bigger") {
            const currentSize = window.getComputedStyle(element).fontSize;
            if (currentSize) element.style.fontSize = (parseFloat(currentSize) + 2) + 'px';
            else element.style.fontSize = '18px'; 
        } else if (commandString.toLowerCase() === "make text smaller") {
            const currentSize = window.getComputedStyle(element).fontSize;
            if (currentSize && parseFloat(currentSize) > 2) element.style.fontSize = (parseFloat(currentSize) - 2) + 'px';
            else if (currentSize && parseFloat(currentSize) <=2 ) console.warn("Text is already too small to reduce further.");
            else element.style.fontSize = '14px'; 
        } else if (commandString.toLowerCase() === "center text") {
            element.style.textAlign = 'center';
        } else if (commandString.toLowerCase().startsWith("change text to: ")) {
            const newText = commandString.substring("change text to: ".length).trim();
            if (newText) element.innerText = newText;
            else console.warn("No text provided for 'change text to' command.");
        } else if (commandString.toLowerCase().startsWith("create list: ")) {
            const itemsString = commandString.substring("create list: ".length).trim();
            const items = itemsString.split(',').map(item => item.trim()).filter(item => item);
            if (items.length > 0) {
                element.innerHTML = ''; 
                const ul = document.createElement('ul');
                items.forEach(itemText => { const li = document.createElement('li'); li.textContent = itemText; ul.appendChild(li); });
                element.appendChild(ul);
            } else console.warn("No items provided for 'create list' command. Format: create list: item1, item2");
        } else if (commandString.toLowerCase() === "create two columns") {
            createTwoColumns(element);
        } else if (commandString.toLowerCase().startsWith("create card: ")) {
            const paramsString = commandString.substring("create card: ".length).trim();
            const params = paramsString.split('|').map(p => p.trim());
            if (params.length === 3) createCard(element, params[0], params[1], params[2]);
            else console.warn("Invalid format for 'create card'. Expected: create card: Title | Description | Button Text");
        } else console.error("Unknown command: " + commandString);
    }

    function createTwoColumns(element) {
        const children = Array.from(element.childNodes); 
        element.innerHTML = ''; 
        const columnContainer = document.createElement('div');
        columnContainer.style.display = 'flex'; columnContainer.style.width = '100%'; 
        const column1 = document.createElement('div');
        column1.classList.add('column'); column1.style.flexBasis = '50%'; column1.style.boxSizing = 'border-box'; column1.style.padding = '10px';
        const column2 = document.createElement('div');
        column2.classList.add('column'); column2.style.flexBasis = '50%'; column2.style.boxSizing = 'border-box'; column2.style.padding = '10px';
        if (children.length === 0) { column1.textContent = "Column 1"; column2.textContent = "Column 2"; }
        else {
            const midpoint = Math.ceil(children.length / 2);
            children.forEach((child, index) => {
                if (index < midpoint) column1.appendChild(child.cloneNode(true)); 
                else column2.appendChild(child.cloneNode(true));
            });
        }
        element.appendChild(columnContainer); columnContainer.appendChild(column1); columnContainer.appendChild(column2);
        console.log(`Created two columns in element <${element.tagName.toLowerCase()}>`);
    }

    function createCard(element, title, description, buttonText) {
        element.innerHTML = ''; 
        const cardDiv = document.createElement('div'); cardDiv.classList.add('card');
        const titleElem = document.createElement('h3'); titleElem.classList.add('card-title'); titleElem.textContent = title;
        const descElem = document.createElement('p'); descElem.classList.add('card-description'); descElem.textContent = description;
        const buttonElem = document.createElement('button'); buttonElem.classList.add('card-button'); buttonElem.textContent = buttonText;
        cardDiv.appendChild(titleElem); cardDiv.appendChild(descElem); cardDiv.appendChild(buttonElem);
        element.appendChild(cardDiv);
        console.log(`Created card in element <${element.tagName.toLowerCase()}> with title: "${title}"`);
    }

    const saveButton = document.getElementById('saveButton');
    if (saveButton && canvas) { 
        saveButton.addEventListener('click', () => {
            if (selectedElement) {
                selectedElement.classList.remove('selected-highlight');
                if (selectedElement.contentEditable === 'true') selectedElement.contentEditable = 'false';
                dominiqueInterface.style.display = 'none';
                selectedElement = null;
            }
            const canvasContent = canvas.innerHTML;
            const pageTitle = "My Saved Page"; 
            const fullHtml = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${pageTitle}</title></head><body>${canvasContent}</body></html>`;
            const blob = new Blob([fullHtml], { type: 'text/html' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob); link.download = 'saved_page.html';
            document.body.appendChild(link); link.click();
            document.body.removeChild(link); URL.revokeObjectURL(link.href); 
            console.log("Page saved.");
        });
    } else {
        if (!saveButton) console.error('Save button not found in edit mode!');
        if (!canvas) console.error('Canvas element not found for saving in edit mode!');
    }

    window.isEditable = function(element) { 
        if (!element) return false;
        const tagName = element.tagName.toLowerCase();
        const nonEditableClasses = ['card', 'column', 'row']; 
        const editableTags = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'span', 'button'];
        if (editableTags.includes(tagName)) return true;
        if (tagName === 'div') {
            for (const className of nonEditableClasses) if (element.classList.contains(className)) return false;
            const blockChildren = element.querySelectorAll('div, p, ul, h1, h2, h3, h4, h5, h6');
            if (blockChildren.length > 0) {
                if (element.parentElement === canvas && blockChildren.length > 0) return true;
                if (element.classList.contains('card-description')) return true;
                return false; 
            }
            return true;
        }
        return false;
    }
} // End of initializeEditor
