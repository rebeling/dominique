// JavaScript for AI Editor functionality
document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const isEditMode = params.get('edit') === '1';

    if (isEditMode) {
        document.body.classList.add('edit-mode-active');
        initializeEditor();
    } else {
        const editorElements = ['dominique-interface', 'saveButton', 'dominique-idle-indicator'];
        editorElements.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });
    }
});

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
        <li><code>hide for X seconds</code> (aliases: minimize for X s)</li>
        <li><em>Type 'help' to see this list again.</em></li>
    </ul>
`;

function initializeEditor() {
    const canvas = document.querySelector('.canvas');
    const dominiqueInterface = document.getElementById('dominique-interface');
    const commandInput = document.getElementById('dominique-command-input');
    let selectedElement = null;
    let hoveredElement = null; 

    const dominiqueChatHistory = document.getElementById('dominique-chat-history');
    const dominiqueInfoButton = document.getElementById('dominique-info-button');
    const dominiqueSubmitButton = document.getElementById('dominique-submit-button');
    const dominiqueHeader = document.getElementById('dominique-header'); 
    const dominiqueCloseButton = document.getElementById('dominique-close-button');
    const dominiqueIdleIndicator = document.getElementById('dominique-idle-indicator');
    const saveButton = document.getElementById('saveButton');

    let isDragging = false;
    let initialMouseX, initialMouseY;
    let initialModalLeft, initialModalTop;
    let lastDominiqueModalPosition = { top: '100px', left: 'calc(50% - 200px)' }; 
    let isDominiqueTemporarilyHidden = false; 

    function scrollToBottom(element) {
        if (element) element.scrollTop = element.scrollHeight;
    }

    function appendMessage(text, type, isHtml = false) {
        if (!dominiqueChatHistory) return;
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('chat-message', type);
        if (isHtml) messageDiv.innerHTML = text;
        else messageDiv.textContent = text; 
        dominiqueChatHistory.appendChild(messageDiv);
        scrollToBottom(dominiqueChatHistory);
    }

    function showDominiqueModal() {
        if (!dominiqueInterface) return;
        dominiqueInterface.style.display = 'flex';
        if (dominiqueIdleIndicator) dominiqueIdleIndicator.style.display = 'none';
    }

    function hideDominiqueModal(isClosing = false) {
        if (!dominiqueInterface) return;
        dominiqueInterface.style.display = 'none';
        if (isClosing && selectedElement) { 
            selectedElement.classList.remove('selected-highlight');
            if (selectedElement.contentEditable === 'true') {
                selectedElement.contentEditable = 'false';
            }
            selectedElement = null;
        }
        if (dominiqueIdleIndicator && !isDominiqueTemporarilyHidden) {
             dominiqueIdleIndicator.style.display = 'block'; 
        } else if (dominiqueIdleIndicator && isDominiqueTemporarilyHidden && isClosing) {
             dominiqueIdleIndicator.style.display = 'block';
        }
    }
    
    function activateDominiqueInterface() {
        if (!dominiqueInterface || !commandInput) { 
            console.error("Dominique interface or command input not found for activation.");
            return;
        }
        showDominiqueModal();
        if (selectedElement) {
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
            if (modalLeft < scrollX) modalLeft = scrollX + offset; 
            if (modalTop + modalHeight > viewportHeight + scrollY) {
                modalTop = selectedRect.bottom + scrollY - modalHeight; 
                if (modalTop < scrollY) modalTop = scrollY + offset; 
            }
            if (modalTop < scrollY) modalTop = scrollY + offset; 
            lastDominiqueModalPosition = { top: `${modalTop}px`, left: `${modalLeft}px` };
        }
        dominiqueInterface.style.top = lastDominiqueModalPosition.top;
        dominiqueInterface.style.left = lastDominiqueModalPosition.left;
        commandInput.focus();
        if (dominiqueChatHistory && dominiqueChatHistory.children.length === 0) {
            appendMessage("I'm ready! How can I help you? (Type 'help' for commands)", "system-message");
        }
    }

    if (canvas) {
        canvas.addEventListener('mouseover', (event) => {
            const target = event.target;
            if (target === canvas || (dominiqueInterface && dominiqueInterface.contains(target)) || target === dominiqueInterface) {
                return; 
            }
            if (target !== selectedElement && canvas.contains(target)) {
                if (hoveredElement && hoveredElement !== target) {
                    hoveredElement.classList.remove('selected-highlight');
                }
                hoveredElement = target;
                hoveredElement.classList.add('selected-highlight');
            }
        });
        canvas.addEventListener('mouseout', (event) => {
            const target = event.target;
            if (hoveredElement === target && target !== selectedElement) {
                hoveredElement.classList.remove('selected-highlight');
                hoveredElement = null;
            }
        });
        canvas.addEventListener('click', (event) => {
            const clickedElement = event.target;
            if (dominiqueInterface && (dominiqueInterface.contains(clickedElement) || clickedElement === dominiqueInterface)) {
                return; 
            }
            if (hoveredElement && hoveredElement !== clickedElement) {
                hoveredElement.classList.remove('selected-highlight');
                hoveredElement = null;
            }
            if (clickedElement === canvas) { 
                if (selectedElement) {
                    selectedElement.classList.remove('selected-highlight');
                    if (selectedElement.contentEditable === 'true') selectedElement.contentEditable = 'false';
                    selectedElement = null;
                }
                hideDominiqueModal(); 
                return;
            }
            if (clickedElement === selectedElement) return; 
            if (selectedElement) {
                selectedElement.classList.remove('selected-highlight');
                if (selectedElement.contentEditable === 'true') selectedElement.contentEditable = 'false';
            }
            selectedElement = clickedElement;
            if (canvas.contains(selectedElement) && selectedElement !== canvas) {
                 selectedElement.classList.add('selected-highlight'); 
                 if (isEditable(selectedElement)) selectedElement.contentEditable = 'true';
                 activateDominiqueInterface();
                 console.log('Selected element:', selectedElement, 'Editable:', selectedElement.contentEditable);
            } else { 
                if (selectedElement) { 
                    selectedElement.classList.remove('selected-highlight');
                    if (selectedElement.contentEditable === 'true') selectedElement.contentEditable = 'false';
                }
                selectedElement = null;
                hideDominiqueModal(); 
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
                appendMessage("I'm waiting for your command. Please tell me what you'd like to do.", "system-message");
                return;
            }
            const isHideCommand = /^(hide|minimize)(?: yourself)? for (\d+)\s*(s|seconds)?$/i.test(commandText);
            if (!selectedElement && commandText.toLowerCase() !== "help" && !isHideCommand ) { 
                appendMessage("I need an element selected to work on. Please click on an element in the canvas, or type 'help'.", "system-message");
                return;
            }
            appendMessage(commandText, "user-message"); 
            if (commandText.toLowerCase() === "help") {
                appendMessage("Here are the commands I understand:", "system-message");
                appendMessage(COMMAND_HELP_HTML, "system-message", true); 
            } else {
                executeCommand(selectedElement, commandText); 
            }
            commandInput.value = ''; 
            commandInput.focus(); 
        });

        // Add keydown listener to commandInput for "Enter" key
        commandInput.addEventListener('keydown', (event) => {
            if (event.key === "Enter") {
                event.preventDefault(); // Stop default "Enter" key action
                if (dominiqueSubmitButton) { // Ensure submit button exists
                    dominiqueSubmitButton.click(); // Programmatically click the Send button
                }
            }
        });

    } else {
        if (!dominiqueSubmitButton) console.error('Dominique submit button not found in edit mode!');
        if (!commandInput) console.error('Dominique command input not found in edit mode!');
    }

    if (dominiqueInfoButton) { 
        dominiqueInfoButton.addEventListener('click', () => {
            appendMessage("Here are the commands I understand:", "system-message");
            appendMessage(COMMAND_HELP_HTML, "system-message", true); 
        });
    } else {
        if (!dominiqueInfoButton) console.error('Dominique info button not found in edit mode!');
    }

    if (dominiqueCloseButton && dominiqueInterface) {
        dominiqueCloseButton.addEventListener('click', () => {
            isDominiqueTemporarilyHidden = false; 
            hideDominiqueModal(true); 
            appendMessage("I've closed for now. Click the glowing circle to bring me back!", "system-message");
        });
    } else {
        if (!dominiqueCloseButton) console.error('Dominique close button not found in edit mode!');
    }

    if (dominiqueIdleIndicator && dominiqueInterface) {
        dominiqueIdleIndicator.addEventListener('click', () => {
            if (isDominiqueTemporarilyHidden) return; 
            activateDominiqueInterface(); 
            appendMessage("I'm back! How can I assist?", "system-message");
        });
    } else {
        if (!dominiqueIdleIndicator) console.error('Dominique idle indicator not found!');
    }

    if (dominiqueIdleIndicator && !selectedElement && !isDominiqueTemporarilyHidden) {
        dominiqueIdleIndicator.style.display = 'block';
    }
    if (dominiqueInterface) { 
         dominiqueInterface.style.display = 'none';
    }

    if (dominiqueHeader && dominiqueInterface) {
        dominiqueHeader.addEventListener('mousedown', (e) => {
             // Prevent dragging if mousedown is on any button within the header's icon group
            if (e.target.closest('button')) return;

            isDragging = true;
            initialMouseX = e.clientX; initialMouseY = e.clientY;
            initialModalLeft = dominiqueInterface.offsetLeft; initialModalTop = dominiqueInterface.offsetTop;
            document.body.style.userSelect = 'none'; 
            dominiqueHeader.style.cursor = 'grabbing'; 
            document.addEventListener('mousemove', onDragMouseMove);
            document.addEventListener('mouseup', onDragMouseUp);
            e.preventDefault(); 
        });
        function onDragMouseMove(e) {
            if (!isDragging) return;
            const deltaX = e.clientX - initialMouseX; const deltaY = e.clientY - initialMouseY;
            let newLeft = initialModalLeft + deltaX; let newTop = initialModalTop + deltaY;
            const viewportWidth = window.innerWidth; const viewportHeight = window.innerHeight;
            const modalWidth = dominiqueInterface.offsetWidth; const modalHeight = dominiqueInterface.offsetHeight;
            if (newLeft < 0) newLeft = 0; if (newTop < 0) newTop = 0; 
            if (newLeft + modalWidth > viewportWidth) newLeft = viewportWidth - modalWidth;
            if (newTop + modalHeight > viewportHeight) newTop = viewportHeight - modalHeight;
            dominiqueInterface.style.left = newLeft + 'px'; dominiqueInterface.style.top = newTop + 'px';
            lastDominiqueModalPosition = { top: dominiqueInterface.style.top, left: dominiqueInterface.style.left }; 
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
        const hideCommandRegex = /^(hide|minimize)(?: yourself)? for (\d+)\s*(s|seconds)?$/i;
        const hideMatch = commandString.match(hideCommandRegex);

        if (hideMatch) {
            const seconds = parseInt(hideMatch[2], 10);
            if (seconds > 0) {
                appendMessage(`Okay, I will hide for ${seconds} seconds.`, "system-message");
                isDominiqueTemporarilyHidden = true; 
                hideDominiqueModal(true); 
                if(dominiqueIdleIndicator) dominiqueIdleIndicator.style.display = 'block';
                setTimeout(() => {
                    const stillIdle = dominiqueIdleIndicator && dominiqueIdleIndicator.style.display === 'block';
                    isDominiqueTemporarilyHidden = false; 
                    if (stillIdle) { 
                        if (dominiqueIdleIndicator) dominiqueIdleIndicator.style.display = 'none';
                        activateDominiqueInterface(); 
                        appendMessage("I am back!", "system-message");
                    } else {
                        console.log("Timed hide expired, but Dominique was not in the expected idle state. No automatic action taken.");
                    }
                }, seconds * 1000);
            } else {
                appendMessage("Please tell me for how many seconds I should hide.", "system-message");
            }
        } else if (element) { 
            let commandSuccessfullyProcessed = true; 
            console.log(`Executing command on element <${element.tagName.toLowerCase()}>: "${commandString}" in edit mode`);
            if (commandString.toLowerCase() === "make text bigger") {
                const currentSize = window.getComputedStyle(element).fontSize;
                if (currentSize) element.style.fontSize = (parseFloat(currentSize) + 2) + 'px';
                else element.style.fontSize = '18px'; 
            } else if (commandString.toLowerCase() === "make text smaller") {
                const currentSize = window.getComputedStyle(element).fontSize;
                if (currentSize && parseFloat(currentSize) > 2) element.style.fontSize = (parseFloat(currentSize) - 2) + 'px';
                else if (currentSize && parseFloat(currentSize) <=2 ) {
                    console.warn("Text is already too small to reduce further.");
                    appendMessage("I can't make the text any smaller.", "system-message");
                    commandSuccessfullyProcessed = false;
                }
                else element.style.fontSize = '14px'; 
            } else if (commandString.toLowerCase() === "center text") {
                element.style.textAlign = 'center';
            } else if (commandString.toLowerCase().startsWith("change text to: ")) {
                const newText = commandString.substring("change text to: ".length).trim();
                if (newText) element.innerText = newText;
                else {
                    console.warn("No text provided for 'change text to' command.");
                    appendMessage("It looks like you wanted to change the text, but didn't provide the new text.", "system-message");
                    commandSuccessfullyProcessed = false;
                }
            } else if (commandString.toLowerCase().startsWith("create list: ")) {
                const itemsString = commandString.substring("create list: ".length).trim();
                const items = itemsString.split(',').map(item => item.trim()).filter(item => item);
                if (items.length > 0) {
                    element.innerHTML = ''; 
                    const ul = document.createElement('ul');
                    items.forEach(itemText => { const li = document.createElement('li'); li.textContent = itemText; ul.appendChild(li); });
                    element.appendChild(ul);
                } else {
                    console.warn("No items provided for 'create list' command. Format: create list: item1, item2");
                    appendMessage("I can create a list for you, but I need the items. For example: create list: apples, bananas, cherries.", "system-message");
                    commandSuccessfullyProcessed = false;
                }
            } else if (commandString.toLowerCase() === "create two columns") {
                createTwoColumns(element);
            } else if (commandString.toLowerCase().startsWith("create card: ")) {
                const paramsString = commandString.substring("create card: ".length).trim();
                const params = paramsString.split('|').map(p => p.trim());
                if (params.length === 3) createCard(element, params[0], params[1], params[2]);
                else {
                    console.warn("Invalid format for 'create card'. Expected: create card: Title | Description | Button Text");
                    appendMessage("To create a card, I need the title, description, and button text, separated by '|'. For example: create card: My Title | My description here | Click Me", "system-message");
                    commandSuccessfullyProcessed = false;
                }
            } else {
                console.error("Unknown command: " + commandString);
                appendMessage(`I'm not sure how to process the command: "${commandString}"`, "system-message");
                commandSuccessfullyProcessed = false;
            }
            if (commandSuccessfullyProcessed) {
                appendMessage(`Okay, I've executed: "${commandString}"`, "system-message");
            }
        } else if (!hideMatch) { 
             appendMessage("I need an element selected to work on for that command. Please click on an element in the canvas.", "system-message");
        }
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

    if (saveButton && canvas) { 
        saveButton.addEventListener('click', () => {
            console.log("Attempting to save page content via API...");
            appendMessage("I'm saving the page content now...", "system-message"); 
            setTimeout(() => {
                console.log("Page saved successfully via API!");
                appendMessage("I've saved the page content successfully (mock API).", "system-message");
                const originalButtonText = saveButton.innerHTML; // This is '💾'
                saveButton.innerHTML = "&#10003;"; 
                saveButton.style.backgroundColor = "#28a745"; 
                setTimeout(() => {
                    saveButton.innerHTML = originalButtonText; 
                    saveButton.style.backgroundColor = ""; // Revert to CSS default (gray)
                }, 2500);
            }, 1500);
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
